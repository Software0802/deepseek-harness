import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { interactionSignals } from "../../interaction.js";
import { attachToolResults, home, listDirs, parseJsonLine, statOrNull } from "./shared.js";

/**
 * DeepSeek Harness: ~/.dsh/sessions/<munged-cwd>/session-<uuid>/session.v4.jsonl.zstd
 *
 * Layout mirrors Claude's: a store root under the DSH data dir, one directory per
 * project cwd (the directory name is a munged path), and one file per session inside
 * a `session-<uuid>` child. The file is zstd-compressed JSONL; every entry is a
 * `{ type, seq, time, data }` envelope. The first `type: "session"` record carries
 * `cwd`, `id`, `createdAt`, `agentPreset`, `delegationDepth`, `isSeeded` - enough to
 * classify without reading the whole stream.
 *
 * Messages come in three flavours relevant to distillation:
 *   - `user/message`        { content, source, role }      -> user turns
 *   - `assistant/message`   { turn, step, message }        -> assistant turns
 *   - `tool/call`           { turn, step, callId, name, arguments }
 *   - `tool/result`         { turn, step, message }        -> tool output, correlated by callId
 *
 * The `message.source.kind` field distinguishes real user traffic from harness
 * scaffolding: "user" is a person, "time-context"/"bot"/"kickoff" etc. are injected.
 * Only kind "user" counts as an interactive signal; the rest are noise for loss
 * purposes but are preserved verbatim so the analysis agent can still see what the
 * agent was told.
 */

const STORE_ROOT_SEGMENTS = [".dsh", "sessions"];
const SESSION_FILE = "session.v4.jsonl.zstd";
const HEADER_BYTES = 512 * 1024;

export const name = "dsh";

export function storeRoots() {
  return [home(...STORE_ROOT_SEGMENTS)];
}

function* walkSessions(rootDir) {
  for (const cwdDir of listDirs(rootDir)) {
    for (const sessionDir of listDirs(cwdDir)) {
      const file = path.join(sessionDir, SESSION_FILE);
      const stat = statOrNull(file);
      if (!stat) continue;
      yield { key: file, path: file, mtimeMs: stat.mtimeMs, bytes: stat.size };
    }
  }
}

export function enumerate() {
  const out = [];
  for (const root of storeRoots()) {
    if (!fs.existsSync(root)) continue;
    out.push(...walkSessions(root));
  }
  return out;
}

function* headJsonl(file, maxBytes = HEADER_BYTES) {
  // Stream-decompress just enough to read the header records. The file is small
  // (<200KB typical) so a single execFileSync on the whole stream is acceptable and
  // avoids a hard zstd dependency for callers that only need the first records.
  const raw = execFileSync("zstd", ["-d", "--stdout", file], {
    maxBuffer: 64 * 1024 * 1024,
  });
  const text = raw.subarray(0, maxBytes).toString("utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const entry = parseJsonLine(trimmed);
    if (entry) yield entry;
  }
}

export function classify(candidate) {
  let id = null;
  let cwd = null;
  let startedAt = null;
  let agentPreset = null;
  let delegationDepth = 0;
  let isSeeded = false;
  let model = null;

  for (const entry of headJsonl(candidate.path)) {
    if (entry.type === "session") {
      id = entry.id || id;
      cwd = entry.cwd || cwd;
      startedAt = entry.createdAt || startedAt;
      agentPreset = entry.agentPreset || agentPreset;
      delegationDepth = entry.delegationDepth ?? 0;
      isSeeded = Boolean(entry.isSeeded);
    } else if (entry.type === "model/selection" && entry.data?.model) {
      model = model || entry.data.model;
    }
    // Header ends once the stream reaches the first turn; the session record is
    // enough to classify, but keep scanning a bounded window for model/selection.
    if (entry.type === "turn/start") break;
  }

  if (!cwd) return null;

  const entrypoint = delegationDepth > 0 || isSeeded ? "dsh-agent" : agentPreset === "standard" ? "dsh" : "dsh";
  return {
    id: id || path.basename(path.dirname(candidate.path)),
    cwd,
    gitBranch: null,
    remotes: [],
    startedAt: startedAt || candidate.mtimeMs,
    model,
    interactionSignals: interactionSignals({ entrypoint }),
  };
}

function contentText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((b) => (b && typeof b === "object" && typeof b.text === "string" ? b.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
}

export function read(ref) {
  const events = [];
  let model = null;
  const pendingTools = new Map(); // callId -> event

  const raw = execFileSync("zstd", ["-d", "--stdout", ref.path], {
    maxBuffer: 64 * 1024 * 1024,
  });
  for (const line of raw.toString("utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const entry = parseJsonLine(trimmed);
    if (!entry) continue;

    if (entry.type === "model/selection" && entry.data?.model) {
      model = model || entry.data.model;
      continue;
    }

    if (entry.type === "user/message") {
      const { content, source } = entry.data || {};
      const text = contentText(content);
      if (!text) continue;
      const kind = source?.kind;
      // Real human turns carry kind "user"; injected scaffolding (time-context,
      // bot relay kickoffs, approval notices) is kept but tagged so the loss model
      // can discount it.
      events.push({
        kind: "message",
        role: "user",
        text,
        injected: kind && kind !== "user" ? kind : undefined,
      });
      continue;
    }

    if (entry.type === "assistant/message") {
      const msg = entry.data?.message;
      if (!msg) continue;
      const content = msg.content;
      if (!Array.isArray(content)) continue;
      const texts = [];
      for (const block of content) {
        if (!block || typeof block !== "object") continue;
        if (block.type === "text" && block.text) texts.push(block.text);
        else if (block.type === "tool-call" && block.id) {
          const args = typeof block.arguments === "string" ? block.arguments : JSON.stringify(block.arguments);
          const ev = {
            kind: "tool",
            name: block.name,
            input: tryParseJson(args),
            pendingId: block.id,
          };
          events.push(ev);
          pendingTools.set(block.id, ev);
        }
      }
      if (texts.length) events.push({ kind: "message", role: "assistant", text: texts.join("\n").trim() });
      continue;
    }

    if (entry.type === "tool/result") {
      const msg = entry.data?.message;
      if (!msg) continue;
      const callId = msg.source?.callId || msg.toolCallId;
      const target = callId && pendingTools.get(callId);
      const text = contentText(msg.content);
      if (target) {
        target.result = text;
        target.status = msg.isError ? "error" : "completed";
        pendingTools.delete(callId);
      } else {
        events.push({ kind: "tool-result", id: callId, result: text, status: msg.isError ? "error" : "completed" });
      }
      continue;
    }
  }

  return { events: attachToolResults(events), model };
}

function tryParseJson(s) {
  if (typeof s !== "string") return s;
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

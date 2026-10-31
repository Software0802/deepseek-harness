#!/usr/bin/env node
/**
 * 新 PC 环境自检 —— 完全由 mods/inventory/plugins.json 的 environment.checks 驱动。
 * 加新工具/依赖只需往 checks 数组 push 一条 spec，不用改这个脚本。
 *
 * 支持的 kind：
 *   command        { command: "<sh>", versionGte?: "x.y" }   命令能跑通（可选版本比较）
 *   commandOrLocal { command: "<sh>", localPath: "<rel>" }    PATH 或仓库相对路径存在
 *   path           { path: "<abs|~|repo-rel>" }               路径存在
 *   aggregate      { anyOf: ["check-id", ...] }               任一 referenced check 过
 *
 * 每条 check 字段：id、name、kind、remedy（失败时的补救命令提示）。
 * 用法：node mods/setup/check-env.mjs [--verbose]
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";

const here = dirname(new URL(import.meta.url).pathname);
const root = join(here, "..", ".."); // deepseek-harness/
const inventory = JSON.parse(readFileSync(join(root, "mods/inventory/plugins.json"), "utf8"));
const specs = inventory.environment?.checks ?? [];

function sh(cmd, args = []) {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch {
    return null;
  }
}
function which(bin) {
  return sh("which", [bin]);
}
function expandPath(p) {
  if (!p) return p;
  if (p.startsWith("~/") || p === "~") return join(homedir(), p.slice(1));
  if (isAbsolute(p)) return p;
  return join(root, p);
}
function parseVer(v) {
  return String(v ?? "").replace(/^v/, "").split(/[^\d.]/)[0];
}
function gte(a, b) {
  const pa = parseVer(a).split(".").map(Number);
  const pb = parseVer(b).split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0,
      y = pb[i] || 0;
    if (x !== y) return x > y;
  }
  return true;
}

function run(spec) {
  switch (spec.kind) {
    case "command": {
      // Prefer a specific binary (e.g. bundled node) when declared.
      const candidates = spec.prefer ? [expandPath(spec.prefer), ...spec.command.split(" ")[0].split(",")] : spec.command.split(" ")[0].split(",");
      let out = null,
        bin = null;
      for (const c of candidates) {
        const cmdBin = c.includes(" ") ? c.split(" ")[0] : c;
        const resolved = existsSync(expandPath(cmdBin)) ? expandPath(cmdBin) : which(cmdBin);
        if (!resolved) continue;
        const args = spec.command.includes(" ") ? spec.command.split(" ").slice(1) : ["--version"];
        out = sh(resolved, args);
        if (out !== null) {
          bin = resolved;
          break;
        }
      }
      if (out === null) return { ok: false, detail: "not found" };
      const firstLine = out.split("\n")[0];
      // `which <name>` results are already absolute paths; don't append "@ which".
      const where = firstLine.startsWith("/") ? "" : ` @ ${bin}`;
      if (spec.versionGte && !gte(firstLine, spec.versionGte)) {
        return { ok: false, detail: `${firstLine} @ ${bin} (needs >= ${spec.versionGte})` };
      }
      return { ok: true, detail: `${firstLine}${where}` };
    }
    case "commandOrLocal": {
      const name = spec.command.split(" ")[0];
      if (which(name)) return { ok: true, detail: which(name) };
      const local = expandPath(spec.localPath);
      if (existsSync(local)) return { ok: true, detail: `${local} (local)` };
      return { ok: false, detail: "not found" };
    }
    case "path": {
      const p = expandPath(spec.path);
      return existsSync(p) ? { ok: true, detail: p } : { ok: false, detail: `missing: ${p}` };
    }
    case "aggregate":
      return { ok: null, detail: "" }; // resolved after all others
    default:
      return { ok: false, detail: `unknown kind "${spec.kind}"` };
  }
}

const results = new Map();
for (const spec of specs) {
  if (spec.kind === "aggregate") continue;
  const r = run(spec);
  results.set(spec.id, { spec, ...r });
}
// Aggregates depend on earlier results.
for (const spec of specs) {
  if (spec.kind !== "aggregate") continue;
  const hit = spec.anyOf.find((id) => results.get(id)?.ok);
  results.set(spec.id, { spec, ok: !!hit, detail: hit ? `via ${hit}` : "none passed" });
}

const w = [...results.values()].reduce((m, r) => Math.max(m, r.spec.name.length), 0);
let fail = 0;
for (const { spec, ok, detail } of results.values()) {
  const mark = ok ? "✓" : "✗";
  if (!ok) fail++;
  console.log(`${mark} ${spec.name.padEnd(w)}  ${detail}`);
  if (!ok && spec.remedy) console.log(`    → ${spec.remedy}`);
}
console.log(`\n${results.size - fail}/${results.size} passed${fail ? ` — ${fail} to fix` : " — setup complete"}`);
process.exit(fail ? 1 : 0);

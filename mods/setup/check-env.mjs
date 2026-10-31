#!/usr/bin/env node
/**
 * 新 PC 环境自检 —— 对照 mods/inventory/plugins.json 的 environment 段逐项检查。
 * 输出 ✓/✗ 清单和每项的补救命令；任何 ✗ 表示 setup 未完成。
 * 用法：node mods/setup/check-env.mjs [--verbose]
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const here = dirname(new URL(import.meta.url).pathname);
const root = join(here, "..", "..");
const inventory = JSON.parse(readFileSync(join(root, "mods/inventory/plugins.json"), "utf8"));
const env = inventory.environment ?? {};
const verbose = process.argv.includes("--verbose");

const results = [];
function check(name, ok, detail, remedy) {
  results.push({ name, ok, detail, remedy });
}
function sh(cmd, args, opts = {}) {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
  } catch {
    return null;
  }
}
function which(bin) {
  return sh("which", [bin]);
}
function version(bin, flag = "--version") {
  const p = which(bin);
  if (!p) return null;
  const out = sh(p, [flag]);
  return out ? { path: p, version: out.split("\n")[0] } : null;
}

const bundledNode = join(homedir(), ".dsh/dsh-runtimes/dsh-primary-runtime/dependencies/node/bin/node");
const node = existsSync(bundledNode) ? { path: bundledNode, version: sh(bundledNode, ["--version"]) } : version("node");
check(
  "node >= 22.5",
  !!node && parseInt(node.version.replace("v", "")) >= 22,
  node ? `${node.version} @ ${node.path}` : "not found",
  `use DSH bundled node: export PATH="${join(homedir(), ".dsh/dsh-runtimes/dsh-primary-runtime/dependencies/node/bin")}:$PATH"`,
);

const zstd = version("zstd");
check("zstd", !!zstd, zstd?.version ?? "not found", "brew install zstd");

const appDir = "/Applications/DeepSeek Harness.app";
check("DeepSeek Harness.app", existsSync(appDir), existsSync(appDir) ? appDir : "missing", "install desktop app to /Applications");

const profileDir = join(homedir(), ".dsh/profiles/desktop");
const profilePkg = join(profileDir, "package.json");
check(
  "desktop profile initialized",
  existsSync(profilePkg),
  existsSync(profilePkg) ? profileDir : "missing — launch app once then quit",
  "open DeepSeek Harness.app once, then Cmd+Q",
);

function findTool(name) {
  // Check global PATH, then the workspace-level .tools install (sibling of deepseek-harness).
  const localBin = join(root, "..", ".tools", "node_modules", ".bin", name);
  return version(name) ?? (existsSync(localBin) ? { version: `local .tools` } : null);
}
const acpx = findTool("acpx");
check("acpx", !!acpx, acpx?.version ?? "not found", "npm i -g acpx  OR  cd ../.tools && npm i acpx");
const lavish = findTool("lavish-axi");
check("lavish-axi (apply UI)", !!lavish, lavish?.version ?? "not found", "npm i -g lavish-axi  OR  cd ../.tools && npm i lavish-axi");

const agentCLIs = env.agentCLIs ?? {};
let anyLoggedIn = false;
for (const [name, expectedPath] of Object.entries(agentCLIs)) {
  const found = which(name);
  const note = expectedPath.includes("logged in") ? " (expected logged in)" : "";
  if (found) anyLoggedIn = anyLoggedIn || expectedPath.includes("logged in");
  check(`cli: ${name}`, !!found, found ?? `not found${note}`, expectedPath.startsWith("/") ? `install ${name}` : `install & login ${name}`);
}
check("≥1 agent harness logged in", anyLoggedIn, anyLoggedIn ? "" : "none logged in", "login one of: claude / codex / opencode / grok / cursor-agent / hermes");

const backpassBin = join(root, "mods/features/backpass/bin/backpass.js");
check("backpass fork", existsSync(backpassBin), backpassBin, "clone deepseek-harness mods/features/backpass");

const backpassDeps = join(root, "mods/features/backpass/node_modules");
check("backpass deps installed", existsSync(backpassDeps), existsSync(backpassDeps) ? "ok" : "run pnpm install in mods/features/backpass", "cd mods/features/backpass && pnpm install");

const skillFile = join(root, "mods/skills/backpass-weekly/SKILL.md");
check("backpass-weekly skill", existsSync(skillFile), skillFile, "present in mods/skills");

const syncScript = join(root, "mods/inventory/sync.mjs");
check("inventory sync.mjs", existsSync(syncScript), syncScript, "present");

const w = results.reduce((m, r) => Math.max(m, r.name.length), 0);
let fail = 0;
for (const r of results) {
  const mark = r.ok ? "✓" : "✗";
  if (!r.ok) fail++;
  console.log(`${mark} ${r.name.padEnd(w)}  ${r.detail}`);
  if (!r.ok && r.remedy) console.log(`    → ${r.remedy}`);
}
console.log(`\n${results.length - fail}/${results.length} passed${fail ? ` — ${fail} to fix` : " — setup complete"}`);
process.exit(fail ? 1 : 0);

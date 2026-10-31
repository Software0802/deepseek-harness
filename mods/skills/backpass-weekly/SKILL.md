---
name: backpass-weekly
description: Use to run the weekly AGENTS.md backward pass for a repository - collect agent transcripts, analyze losses, review the proposal, and apply accepted edits. Wraps the backpass CLI for DeepSeek Harness sessions.
---

# backpass weekly — 每周一次 AGENTS.md 反向传播

把 backpass 的训练循环跑成节奏：读过去一周 agent 会话 → 找证据 → 出提案 → 人工 gate → 写入。这是项目级 `AGENTS.md` 的"训练 epoch"，不是日常维护。

## 前置条件

- backpass fork 在 `deepseek-harness/mods/features/backpass/`（或 npm `backpass` + DSH adapter）
- `acpx` 在 PATH，且至少一个 agent harness 已登录（claude/codex/opencode/grok/pi）
- 已运行 `backpass init`（生成 `.backpassrc.json`，`discovery.harnesses` 含 `"dsh"`）
- 环境有 `zstd`（macOS `brew install zstd`）

## 流程

```sh
cd <repo>
BACKPASS=<deepseek-harness路径>/mods/features/backpass/bin/backpass.js

node $BACKPASS scan              # 1. 确认关联会话：应列出 dsh harness 的行
node $BACKPASS                   # 2. 反向传播：分析 → 综合 → proposal（不写）
node $BACKPASS apply             # 3. 人工 gate：浏览器里审 diff+证据，ACCEPT/REJECT
```

- `scan` 若 0 条匹配，检查 repo 是否在 git worktree 里、`.backpassrc.json` 的 `since` 窗口内有没有真实会话。
- `apply` 起 lavish-axi 浏览器界面；每条 edit 带 diff + session 引用，**人工逐条 gate**——不要 `--decisions` 自动通过。
- 拒绝的 edit 会被记住，同类提案没有新证据不会再来。

## 时机

**每周一次 / 活跃 repo 一次**，在积累够 transcript 后跑。新 repo 或会话稀疏时跑只会得到空 proposal——这是正常信号，不是失败。

## 输出

- `.backpass/proposal.json` — 本次提案（含每条 edit 的 evidence、hunks、measured token delta）
- `.backpass/evidence/` — 每条 transcript 的损失分析缓存
- `AGENTS.md`（或目标 skill 的 `SKILL.md`）— apply 接受后写入

## 不要做的事

- **不要跑 `backpass apply --decisions "e1=accepted"` 自动过**——human gate 是整个机制的核心，撤掉它等于训练信任关闭
- **不要在证据不足时强行加规则**——proposal 出 0 edit 意味着"这次没可证明的改进"，不是"该手动写点什么"
- **不要改 `.backpass/` 状态文件**——那是训练的账本，手工编辑会污染下一次梯度
EOF

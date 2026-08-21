# Agent Note: Grok Build capabilities as an opt-in DeepSeek Harness plugin library

Status: implemented

[English](2026-08-21-grok-build-plugin-library.md) | 中文

## Problem

Grok Build 的第一方工具集在文件系统、shell、web、plan、jobs、workflow、goal、skill、hooks、MCP、ACP 和 headless 上与 DeepSeek Harness 重叠，并增加了本仓库未交付的 Imagine 媒体生成和 stdout `monitor`。把官方 dsh 包复制进 grok 树、改 `dsh-agent-loop`、或把这些工具叠到默认 `web` / `headless` 模板上，都会分叉产品核心。工作还必须留在 `master` 之外：本 fork 的 `master` 是官方 DeepSeek Harness 镜像。

## Decision

从官方 `master` 创建的 `grok` git 分支保存可选插件库。

`@deepseek-ai/dsh-grok` 中的 `GROK_PLUGIN_CATALOG` 把每个第一方 Grok Build 名称映射到工作区 `@deepseek-ai/dsh-*` 包，并记录 `dsh-official` 与 `grok-library` 来源。官方来源行按引用组合现有包；`packages/grok/` 不含它们的副本。

`@deepseek-ai/dsh-tool-imagine` 在可 mock 的 xAI Imagine HTTP 客户端上注册 `image_gen`、`image_edit`、`image_to_video` 和 `reference_to_video`。没有 `$XAI_API_KEY` 时工具仍然注册；执行抛出 `Imagine credentials missing: set XAI_API_KEY or plugin config apiKey`。成功调用在 `outputDir` 下写入非空字节并返回 `{ path }`。

`@deepseek-ai/dsh-tool-monitor` 通过 `ctx.subprocess` spawn argv，在 `ctx.jobs` 上发布 `monitor-*` 任务，并把 stdout 的每一行 `followup()` 为渲染器所有的插件来源 `user/message`。进程退出结算该任务。循环本身不变。

`@deepseek-ai/dsh-grok` 是可安装 bundle，其 patch 只插入这两个插件。`PROFILE_TEMPLATES.web` 和 `PROFILE_TEMPLATES.headless` 不列出它。`master` 保持仅官方；本分支不合并进 `master`。

## Alternatives considered

- **移植 Grok Build 的 Rust TUI 和市场** — 超出插件库变更的范围；dsh 已有 `dsh web` / headless，市场／SHA 固定 UX 是另一产品。
- **对 bash/fs/web/plan/goal 做线兼容克隆** — Grok 名称不同（`read_file` 对 `read`）；复制那些包会分叉官方源码。目录组合现有包。
- **缺少密钥时注销 Imagine 工具** — grok 层 Loader 启动会在无密钥 CI 中隐藏 schema。注册加上结构化执行错误会响亮失败，同时不阻止启动。
- **通过改 `dsh-agent-loop` 唤醒 `monitor`** — 特权循环分支会扩大快照／SDK 面。`Agent.followup()` 已经会唤醒并记录插件来源的用户消息。
- **从 OMP／Desktop 检出创建 `grok` 分支** — 那棵树不是官方 `master`，并带有无关脏文件。分支点是 `origin/master`。

## Consequences

运营方用 `dsh plugin --profile <name> add @deepseek-ai/dsh-grok` 添加 Imagine 和 `monitor`，不必改默认 profile 或 `dsh-agent-loop`。无密钥测试 mock Imagine HTTP 并驱动已交付工具；在线 xAI e2e 在没有 `$XAI_API_KEY` 时自行跳过。headless Loader fixture 加快照钉住模型可见的 grok 工具名，以及相对 `todo_write` 的唯一性。

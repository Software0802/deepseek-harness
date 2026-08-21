# `@deepseek-ai/dsh-grok`

[English](README.md) | 中文

覆盖 [`dsh-base`](../base/README.md) 的可选 Grok Build 插件库 bundle。[`cordis.patch.yml`](cordis.patch.yml) 插入 `@deepseek-ai/dsh-tool-imagine` 和 `@deepseek-ai/dsh-tool-monitor`。它不重新挂载文件系统、shell、web、plan、goal、jobs、workflow 或 skill 包：那些包已在 `dsh-base` 中交付，本库通过 `GROK_PLUGIN_CATALOG` 按引用组合它们。

用 `dsh plugin --profile <name> add @deepseek-ai/dsh-grok` 安装到 profile。Imagine 工具在没有 `$XAI_API_KEY` 时仍然注册，并在执行时失败，直到部署提供该密钥。

目录将 Grok Build 名称（`read_file`、`bash`、`image_gen`、`monitor` 等）映射到 `@deepseek-ai/dsh-*` 包，并记录每一行是官方包还是本库所有。

## Model Experience

间接地，通过插入的 `grok-tool-imagine` 和 `grok-tool-monitor` 行：本 bundle 不贡献自己的模型可见文本。

#### KV Cache effect

没有直接效果；每条插入行的包拥有其效果。

## Known Limitations and Deferred Work

- **可选层** — 默认 `web` 和 `headless` profile 不叠加本 bundle。
- **不复制官方源码** — origin 为 `dsh-official` 的目录行不会复制进 `packages/grok/`。
- **在线 Imagine 需要密钥** — 安装 bundle 不会消耗 xAI 配额，直到带凭据的媒体工具运行。

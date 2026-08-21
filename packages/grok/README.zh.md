# grok/：以 DeepSeek Harness 插件实现的 Grok Build 扩展

[English](README.md) | 中文

将 [Grok Build](https://github.com/xai-org/grok-build) 的第一方工具实现为 Cordis 插件。官方 DeepSeek Harness 包已经覆盖文件系统、shell、web、plan、goal、jobs、workflow、skill、hooks、MCP、ACP 和 headless；本组不复制那些包。没有官方等价物的 Imagine 媒体生成和 `monitor` 放在这里。使用 `@deepseek-ai/dsh-grok` 安装该组合（[bundle README](../bundle/grok/README.md)）。

| 包 | 职责 | ctx 键 |
|---|---|---|
| [`tool-imagine/`](tool-imagine/README.md) | xAI Imagine 工具：`image_gen`、`image_edit`、`image_to_video`、`reference_to_video` | — |
| [`tool-monitor/`](tool-monitor/README.md) | 后台命令，其 stdout 每一行成为插件来源的 follow-up | — |

从 Grok Build 名称到 dsh 包的映射（含按引用组合的官方包）是 [`@deepseek-ai/dsh-grok`](../bundle/grok/README.md) 中的 `GROK_PLUGIN_CATALOG`。

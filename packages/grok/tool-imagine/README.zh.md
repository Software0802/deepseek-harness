# `@deepseek-ai/dsh-tool-imagine`

[English](README.md) | 中文

面向模型的 xAI Imagine 工具，建立在可 mock 的 HTTP 客户端上。插件在 `ctx.tools` 上注册 `image_gen`、`image_edit`、`image_to_video` 和 `reference_to_video`。每次成功调用把非空媒体字节写入 `outputDir`（省略时为进程 cwd），并返回 `{ path }`。

缺少 `$XAI_API_KEY` / `config.apiKey` 不是加载失败：工具仍然注册，以便 grok 层组合可以无密钥启动，执行时抛出 `Imagine credentials missing: set XAI_API_KEY or plugin config apiKey`。HTTP 和空载荷失败是结构化的 `ImagineError`。

`baseURL` 默认为 `https://api.x.ai/v1`。测试把它指向本地 mock。`image_gen` POST `/images/generations`；`image_edit` POST `/images/edits`，载荷为 `{ image: { url } }`。视频调用 POST `/videos/generations`，预设音色使用 `reference_audios: [{ voice_id }]`，当响应体只有 `request_id` 时轮询 `GET /videos/{id}`，直到出现媒体或 `pollTimeoutMs` 到期。

## Configuration

| 字段 | 默认值 | 职责 |
|---|---|---|
| `apiKey` | 省略时为 `$XAI_API_KEY` | Bearer token；空值在执行时失败 |
| `baseURL` | `https://api.x.ai/v1` | 含 `/v1` 的 Imagine 源 |
| `imageModel` | `grok-imagine-image` | 图像模型 id |
| `videoModel` | `grok-imagine-video` | 视频模型 id |
| `outputDir` | `process.cwd()` | 顺序 `1.png` / `1.mp4` 文件的目录 |
| `pollIntervalMs` | `2000` | 视频轮询 GET 的间隔 |
| `pollTimeoutMs` | `600000` | 视频轮询的含端点截止时间 |

`pollIntervalMs` 和 `pollTimeoutMs` 必须是正整数；无效 `baseURL` 在加载时失败。

## Export shape

函数／命名空间插件：导出 `name` / `inject` / `apply` / `Config`，没有 default。

## Model Experience

### Tool schema

#### What the model sees

模型看到生成的 [`image_gen`](../../../docs/tool-catalog.md#deepseek-aidsh-tool-imagine)、`image_edit`、`image_to_video` 和 `reference_to_video` schema。

#### Token effect

在工具可见的每次请求上有固定 schema 成本。

#### KV Cache effect

在定义和可见性不变时前缀稳定。插件生命周期或作用域限制可能使这些 schema 的复用失效。

### Tool-call history and result

#### What the model sees

成功调用以 Native 文本返回写入路径（文件在 `process.cwd()` 下时为相对路径）。稳定失败包括 `Error: Imagine credentials missing: set XAI_API_KEY or plugin config apiKey` 和 `Error: Imagine HTTP <status>: …`。

#### Token effect

结果是短路径字符串。调用参数保留 prompt 和任何图像引用，直到压缩。

#### KV Cache effect

只追加；新可见内容跟在可复用请求前缀之后，不会使已有 KV-cache 条目失效。

## Known Limitations and Deferred Work

- **单一 Imagine 供应商** — HTTP 客户端对接 xAI Imagine；更换供应商需要新的提供方，而不是配置开关。
- **异步视频靠轮询** — Imagine 视频完成是 request-id 轮询，不是 webhook。
- **没有超出 generic 的 UI 卡片** — 展示是 generic 工具卡片加上返回的路径。

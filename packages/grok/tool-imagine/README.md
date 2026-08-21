# `@deepseek-ai/dsh-tool-imagine`

English | [中文](README.zh.md)

Model-facing xAI Imagine tools over a mockable HTTP client. The plugin registers `image_gen`, `image_edit`, `image_to_video`, and `reference_to_video` on `ctx.tools`. Each successful call writes non-empty media bytes to `outputDir` (the process cwd when omitted) and returns `{ path }`.

Missing `$XAI_API_KEY` / `config.apiKey` is not a load failure: the tools stay registered so a grok-layer composition can boot keylessly, and execute throws `Imagine credentials missing: set XAI_API_KEY or plugin config apiKey`. HTTP and empty-payload failures are structured `ImagineError`s.

`baseURL` defaults to `https://api.x.ai/v1`. Tests point it at a local mock. `image_gen` POSTs `/images/generations`; `image_edit` POSTs `/images/edits` with `{ image: { url } }`. Video calls POST `/videos/generations` with `reference_audios: [{ voice_id }]` for preset voices, and when the body carries only a `request_id`, poll `GET /videos/{id}` until media is present or `pollTimeoutMs` elapses.

## Configuration

| Field | Default | Role |
|---|---|---|
| `apiKey` | `$XAI_API_KEY` when omitted | Bearer token; empty fails at execute |
| `baseURL` | `https://api.x.ai/v1` | Imagine origin including `/v1` |
| `imageModel` | `grok-imagine-image` | Image model id |
| `videoModel` | `grok-imagine-video` | Video model id |
| `outputDir` | `process.cwd()` | Destination for sequential `1.png` / `1.mp4` files |
| `pollIntervalMs` | `2000` | Delay between video poll GETs |
| `pollTimeoutMs` | `600000` | Inclusive video poll deadline |

`pollIntervalMs` and `pollTimeoutMs` must be positive integers; an invalid `baseURL` fails at load.

## Export shape

A function/namespace plugin: it exports `name` / `inject` / `apply` / `Config` and no default.

## Model Experience

### Tool schema

#### What the model sees

The model sees the generated [`image_gen`](../../../docs/tool-catalog.md#deepseek-aidsh-tool-imagine), `image_edit`, `image_to_video`, and `reference_to_video` schemas.

#### Token effect

Fixed schema cost on every request where the tools are visible.

#### KV Cache effect

Prefix-stable while the definitions and visibility are unchanged. Plugin lifecycle or scoped restrictions may invalidate reuse from these schemas.

### Tool-call history and result

#### What the model sees

A successful call returns the written path as Native text (a cwd-relative path when the file is under `process.cwd()`). Stable failures include `Error: Imagine credentials missing: set XAI_API_KEY or plugin config apiKey` and `Error: Imagine HTTP <status>: …`.

#### Token effect

The result is a short path string. Call arguments retain the prompt and any image references until compaction.

#### KV Cache effect

Append-only; newly visible content follows the reusable request prefix and does not invalidate existing KV-cache entries.

## Known Limitations and Deferred Work

- **One Imagine vendor** — the HTTP client talks to xAI Imagine; swapping vendors means a new provider, not a config flag.
- **Async video is polled** — Imagine video completion is request-id polling, not a webhook.
- **No UI card beyond generic** — presentation is a generic tool card plus the returned path.

# `@deepseek-ai/dsh-grok`

English | [中文](README.zh.md)

Opt-in Grok Build plugin-library bundle over [`dsh-base`](../base/README.md). [`cordis.patch.yml`](cordis.patch.yml) inserts `@deepseek-ai/dsh-tool-imagine` and `@deepseek-ai/dsh-tool-monitor`. It does not remount filesystem, shell, web, plan, goal, jobs, workflow, or skill packages: those already ship in `dsh-base`, and this library composes them by reference through `GROK_PLUGIN_CATALOG`.

Install into a profile with `dsh plugin --profile <name> add @deepseek-ai/dsh-grok`. Imagine tools stay registered without `$XAI_API_KEY` and fail at execute until a deployment supplies the key.

The catalog maps Grok Build names (`read_file`, `bash`, `image_gen`, `monitor`, …) to `@deepseek-ai/dsh-*` packages and records whether each row is official or owned by this library.

## Model Experience

Indirectly, through the inserted `grok-tool-imagine` and `grok-tool-monitor` rows: this bundle contributes no model-visible text of its own.

#### KV Cache effect

None directly; each inserted row's package owns its effect.

## Known Limitations and Deferred Work

- **Opt-in layer** — default `web` and `headless` profiles do not stack this bundle.
- **No forked official source** — catalog rows whose origin is `dsh-official` are not copied into `packages/grok/`.
- **Live Imagine needs a key** — installing the bundle does not spend xAI quota until a media tool runs with credentials.

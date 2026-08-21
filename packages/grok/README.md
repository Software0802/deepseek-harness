# grok/ — Grok Build extensions as DeepSeek Harness plugins

English | [中文](README.zh.md)

Catalog and implementation of first-party [Grok Build](https://github.com/xai-org/grok-build) tools as Cordis plugins. Official DeepSeek Harness packages already cover filesystem, shell, web, plan, goal, jobs, workflow, skill, hooks, MCP, ACP, and headless; this group does not copy those packages. Imagine media generation and `monitor`, which have no official equivalent, live here. Install the composition with `@deepseek-ai/dsh-grok` ([bundle README](../bundle/grok/README.md)).

| Package | Role | ctx key |
|---|---|---|
| [`tool-imagine/`](tool-imagine/README.md) | xAI Imagine tools: `image_gen`, `image_edit`, `image_to_video`, `reference_to_video` | — |
| [`tool-monitor/`](tool-monitor/README.md) | Background command whose stdout lines become plugin-sourced follow-ups | — |

The mapping from Grok Build names to dsh packages, including official packages composed by reference, is `GROK_PLUGIN_CATALOG` in [`@deepseek-ai/dsh-grok`](../bundle/grok/README.md).

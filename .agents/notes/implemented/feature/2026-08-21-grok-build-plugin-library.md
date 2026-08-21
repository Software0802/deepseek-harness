# Agent Note: Grok Build capabilities as an opt-in DeepSeek Harness plugin library

Status: implemented

English | [中文](2026-08-21-grok-build-plugin-library.zh.md)

## Problem

Grok Build's first-party toolset overlaps DeepSeek Harness for filesystem, shell, web, plan, jobs, workflow, goal, skill, hooks, MCP, ACP, and headless, and adds Imagine media generation plus a stdout `monitor` that this repository did not ship. Copying official dsh packages into a grok tree, changing `dsh-agent-loop`, or stacking those tools on the default `web` / `headless` templates would fork the product core. The work also has to stay off `master`: this fork's `master` is the official DeepSeek Harness mirror.

## Decision

A `grok` git branch, created from official `master`, holds an opt-in plugin library.

`GROK_PLUGIN_CATALOG` in `@deepseek-ai/dsh-grok` maps every first-party Grok Build name to a workspace `@deepseek-ai/dsh-*` package and records `dsh-official` versus `grok-library` origin. Official-origin rows compose existing packages by reference; `packages/grok/` does not contain copies of them.

`@deepseek-ai/dsh-tool-imagine` registers `image_gen`, `image_edit`, `image_to_video`, and `reference_to_video` over a mockable xAI Imagine HTTP client. Tools stay registered without `$XAI_API_KEY`; execute throws `Imagine credentials missing: set XAI_API_KEY or plugin config apiKey`. A successful call writes non-empty bytes under `outputDir` and returns `{ path }`.

`@deepseek-ai/dsh-tool-monitor` spawns argv through `ctx.subprocess`, publishes a `monitor-*` job on `ctx.jobs`, and `followup()`s each stdout line as a renderer-owned plugin-sourced `user/message`. Process exit settles the job. The loop is unchanged.

`@deepseek-ai/dsh-grok` is an installable bundle whose patch inserts only those two plugins. `PROFILE_TEMPLATES.web` and `PROFILE_TEMPLATES.headless` do not list it. `master` stays official-only; this branch is not merged into `master`.

## Alternatives considered

- **Port the Grok Build Rust TUI and marketplace** — out of scope for a plugin-library change; dsh already has `dsh web` / headless, and marketplace/SHA-pin UX is a separate product.
- **Wire-identical clones of bash/fs/web/plan/goal** — Grok names differ (`read_file` versus `read`); duplicating those packages would fork official source. The catalog composes the existing packages.
- **Unregister Imagine tools when the key is missing** — a grok-layer Loader boot would hide the schemas in keyless CI. Registration plus a structured execute error fails loud without blocking boot.
- **Wake `monitor` by changing `dsh-agent-loop`** — a privileged loop branch expands the snapshot/SDK surface. `Agent.followup()` already wakes and logs plugin-sourced user messages.
- **Branch `grok` from the OMP/Desktop checkout** — that tree is not official `master` and carries unrelated dirty files. The branch point is `origin/master`.

## Consequences

Operators add Imagine and `monitor` with `dsh plugin --profile <name> add @deepseek-ai/dsh-grok` without changing default profiles or `dsh-agent-loop`. Keyless tests mock Imagine HTTP and drive the shipped tools; live xAI e2e self-skips without `$XAI_API_KEY`. A headless Loader fixture plus snapshot pins the model-visible grok tool names and uniqueness against `todo_write`.

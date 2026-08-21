# `@deepseek-ai/dsh-tool-monitor`

English | [中文](README.zh.md)

Model-facing `monitor` tool over `ctx.subprocess` and `ctx.jobs`. One call spawns `command` plus optional `args` (argv, not a shell string), returns `{ kind: 'background', jobId }` immediately, and delivers each stdout line as a plugin-sourced `user/message` follow-up (`source.plugin` is `tool-monitor`). Process exit ends the watch. `job_kill` cancels the tree.

The follow-up body is renderer-owned `monitor: <line>` text so the package invariant can round-trip it. Empty `command` / `description`, a missing owning agent, and a pre-aborted invocation fail at execute.

## Configuration

| Field | Default | Role |
|---|---|---|
| `graceMs` | `5000` | SIGTERM→SIGKILL grace for the managed process tree |
| `timeoutMs` | `36000000` | Default watch deadline when `timeout_ms` is omitted and `persistent` is false |

Both fields must be positive integers. `persistent: true` on a call ignores the default deadline; `job_kill`, owner disposal, or process exit still end the watch.

## Export shape

A function/namespace plugin: it exports `name` / `inject` / `apply` / `Config` and no default.

## Model Experience

### Tool schema

#### What the model sees

The model sees the generated [`monitor` schema](../../../docs/tool-catalog.md#deepseek-aidsh-tool-monitor).

#### Token effect

Fixed schema cost on every request where the tool is visible.

#### KV Cache effect

Prefix-stable while the definition and visibility are unchanged. Plugin lifecycle or scoped restrictions may invalidate reuse from this schema.

### Tool-call history and result

#### What the model sees

The call result is `Started monitor job <jobId>`. Each stdout line later appears as a plugin-sourced user message `monitor: <line>` that wakes an idle agent. Stable failures include `Error: monitor requires an owning agent session` and `Error: monitor: command must be a non-empty string`.

#### Token effect

The handle is small. Each delivered line appends a user message whose size tracks that line.

#### KV Cache effect

Append-only; newly visible lines follow the reusable request prefix and do not invalidate existing KV-cache entries.

## Known Limitations and Deferred Work

- **argv, not a shell string** — `command` is resolved with `ctx.subprocess.resolveExecutable`; callers pass arguments separately.
- **stdout only** — stderr is collected for backpressure, not followed up.
- **Follow-up volume is unbounded** — every complete stdout line wakes the owner; callers must keep the child quiet.

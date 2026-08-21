# `@deepseek-ai/dsh-tool-monitor`

[English](README.md) | 中文

面向模型的 `monitor` 工具，建立在 `ctx.subprocess` 和 `ctx.jobs` 上。一次调用 spawn `command` 加可选 `args`（argv，不是 shell 字符串），立即返回 `{ kind: 'background', jobId }`，并把 stdout 的每一行作为插件来源的 `user/message` follow-up 投递（`source.plugin` 为 `tool-monitor`）。进程退出结束监视。`job_kill` 取消进程树。

follow-up 正文是渲染器所有的 `monitor: <line>` 文本，以便包不变量可以往返它。空的 `command` / `description`、缺少所属 agent，以及预先中止的调用在执行时失败。

## Configuration

| 字段 | 默认值 | 职责 |
|---|---|---|
| `graceMs` | `5000` | 受管进程树的 SIGTERM→SIGKILL 宽限 |
| `timeoutMs` | `36000000` | 省略 `timeout_ms` 且 `persistent` 为 false 时的默认监视截止时间 |

两个字段都必须是正整数。调用上的 `persistent: true` 忽略默认截止时间；`job_kill`、所有者释放或进程退出仍会结束监视。

## Export shape

函数／命名空间插件：导出 `name` / `inject` / `apply` / `Config`，没有 default。

## Model Experience

### Tool schema

#### What the model sees

模型看到生成的 [`monitor` schema](../../../docs/tool-catalog.md#deepseek-aidsh-tool-monitor)。

#### Token effect

在工具可见的每次请求上有固定 schema 成本。

#### KV Cache effect

在定义和可见性不变时前缀稳定。插件生命周期或作用域限制可能使该 schema 的复用失效。

### Tool-call history and result

#### What the model sees

调用结果是 `Started monitor job <jobId>`。之后 stdout 的每一行作为插件来源的用户消息 `monitor: <line>` 出现，并唤醒空闲 agent。稳定失败包括 `Error: monitor requires an owning agent session` 和 `Error: monitor: command must be a non-empty string`。

#### Token effect

句柄很小。每条投递的行追加一条用户消息，其大小跟随该行。

#### KV Cache effect

只追加；新可见行跟在可复用请求前缀之后，不会使已有 KV-cache 条目失效。

## Known Limitations and Deferred Work

- **argv，不是 shell 字符串** — `command` 通过 `ctx.subprocess.resolveExecutable` 解析；调用方分开传递参数。
- **只有 stdout** — stderr 被收集以避免反压，不会 follow-up。
- **follow-up 量无上界** — 每一行完整 stdout 都会唤醒所有者；调用方必须让子进程保持安静。

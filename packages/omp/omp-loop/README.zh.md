# @deepseek-ai/dsh-omp-loop

[English](README.md) | 中文

人类 `/loop` 命令：按正整数次数或 `ms|s|m|h` 时长重新提交同一提示。该命令没有完成语义：它不读取 goal 状态，也不会因为模型声称任务已完成而停止。官方的同会话目标仍由 `ctx.goals` 负责（[`dsh-goal`](../../goal/goal/README.md)、[`dsh-goal-round-driver`](../../goal/goal-round-driver/README.md)）。

启用状态是进程本地的。重新加载、fork 或卸载插件都不会恢复 loop。每次续行都是插件来源的 `user/message`，正文恰好是包内渲染器的输出，因此 `./invariant` 配套模块可以在伪造续行进入会话日志之前拒绝它。

## 配置

```yaml
- id: omp-loop
  name: '@deepseek-ai/dsh-omp-loop'
  config:
    maxIterations: 20
```

`maxIterations` 必须是 `>= 1` 的整数。`/loop` 的次数超过上限会在分派时失败，而不是被截断。

## 命令

无后缀的 `/loop` 打印状态。`/loop stop` 停止正在运行的 loop。`/loop <n> [prompt]` 按次数启动。`/loop <n><ms|s|m|h> [prompt]` 按时长启动，其次数上限仍是 `maxIterations`。除非会话里已有人类撰写的 `user/message`，否则必须提供 prompt。

loop 正在运行时再次启动会报错。竞争的 `next-turn` 人类消息会停止 loop。中止的轮次会立即停止仍在排队的尝试，并把已领取或已准入的尝试标为取消，以便随后的 idle 边沿停止它。

## 扩展点

插件在 `ctx.commands` 上注册，并从 `agent/*` 与 `session/event` 监听器驱动 `Agent.followup()`。它不导入 `dsh-agent-loop`。

## 模型体验

### Loop 续行提示

#### 模型看到的内容

每次自动迭代都是一条 `user/message`，文本恰好为：

##### Loop 续行

```markdown
Loop iteration 2/5.
Original task:
keep going
```

数字和任务文本分别是当前迭代、包含上限，以及原始 prompt。持久正文不包含挂钟截止时间，因此 invariant 配套模块可以重建渲染器输入。

#### Token 影响

每次续行都会作为该 agent（智能体）的保留历史。迭代包装只有少量 token，外加原始任务文本。

#### KV Cache 影响

只追加；新的可见内容接在可复用的请求前缀之后，不会使已有 KV-cache 条目失效。

## 已知限制与延后工作

- **进程本地启用** — 与 `ctx.goals` 不同，重新加载后不会从会话日志重建 loop。
- **没有完成谓词** — loop 在次数、时长、`/loop stop`、竞争的人类输入、中止或卸载时停止；它不会询问任务是否已完成。
- **每个 agent 一个 loop** — 当前运行停止之前，拒绝并行 loop。

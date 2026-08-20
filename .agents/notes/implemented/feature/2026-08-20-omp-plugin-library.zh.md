# Agent Note: 将 OMP 插件库做成目录加上 loop 与 advisor 插件

Status: implemented

[English](2026-08-20-omp-plugin-library.md) | 中文

## 问题

[Oh My Pi](https://github.com/can1357/oh-my-pi) 是一个内容丰富的开源 agent harness（智能体框架）社区。它的若干扩展——goal、loop、advisor、Ralph、plan、skill、schedule、hooks——正是运营方希望 DeepSeek Harness 增长的能力。DeepSeek Harness 已经声明一切皆插件，并且已经为其中大多数名称交付了官方包。把 OMP 源码复制进平行目录，或把官方包 fork 进 `packages/omp/`，会重复所有权、拆分 invariant，并掩盖 `dsh-base` 已经挂载的包。

有两个 OMP 概念没有官方对等实现。`/loop` 按次数或挂钟窗口重复同一提示，没有完成语义。advisor 是第二个模型，审阅每个已完成轮次并注入通知。这些行为需要插件、组合包，以及一份点名官方包而不是克隆它们的目录。

## 决策

`packages/omp/` 只存放尚不存在的插件：`@deepseek-ai/dsh-omp-loop` 和 `@deepseek-ai/dsh-omp-advisor`。`packages/bundle/omp/` 中的 `@deepseek-ai/dsh-omp` 是按需启用的 profile 组合包，其 patch 在 `dsh-base` 之上插入这两行。`OMP_PLUGIN_CATALOG` 把 OMP 名称映射到 `@deepseek-ai/dsh-*` 包，并记录 `origin: 'dsh-official' | 'omp-library'` 以及 `mountedBy: 'dsh-base' | 'dsh-omp' | 'opt-in'`。官方行按引用组合；本库不复制它们的源码。

用 `dsh plugin --profile <name> add @deepseek-ai/dsh-omp` 安装。默认的 `web` 和 `headless` profile 不会叠放该组合包。advisor 的 `enabled` 默认为 false，在启用却没有 `provider` 和 `model` 时会响亮失败。

同会话目标仍由 `ctx.goals` 和 [Goal Round 驱动器](2026-07-19-same-session-goal-round-driver.md)负责。`/loop` 不写入 goal 事件，不持久化启用状态，并在次数、时长、`/loop stop`、竞争的 `next-turn` 人类输入、中止或卸载时停止。每次续行都是由 `renderLoopPrompt` 拥有的插件来源 `user/message`；`./invariant` 配套模块拒绝解析器／渲染器往返无法重建的正文。持久提示省略挂钟截止时间，以便重建保持精确。

advisor 审阅是旁路的 `ctx.llm.stream` 调用。它不是会话事件。只有注入的 `Advisor <severity>: <note>` 通知会在所属会话中对模型可见。`delivery: inject` 从不唤醒 agent（智能体）；`delivery: interrupt` 在本轮尚未携带 advisor 通知时，按 `maxInterrupts` 对 blocker 做 followup。除非 `includeSubagents` 为 true，否则跳过 subagent 会话。这不是 [`dsh-repeat-tool-reminder`](../../../packages/guard/repeat-tool-reminder/README.md)；后者在没有第二个模型的情况下注入相同工具调用提醒。

## 测试

包测试套件使用真实的命令注册表、会话日志、invariant 服务，以及带脚本化 mock 适配器的 agent loop（智能体循环）。它们覆盖 `/loop` 语法、渲染器往返、invariant 配套模块、经由 AgentLoop 的次数续行、竞争的人类输入、中止、时长到期、Loader 组合，以及响亮失败的配置。advisor 套件覆盖解析／transcript 界限、关闭与启用、跳过 subagent、inject 与 interrupt、中断上限、审阅错误／中止／抛出、卸载中止，以及 Loader 组合。组合包套件通过 include schema 解析 `cordis.patch.yml`，并检查目录中每个 `dshPackage` 名称都存在于工作区。`examples/headless-agent/tests/fixtures/omp-loop/` 下的无密钥 headless Loader smoke 在第一个已完成轮次之后启动 `/loop 2`，并断言持久 JSONL 中有两条由渲染器拥有的续行。

## 考虑过的替代方案

- **在 `packages/omp/` 下 vendoring OMP 源码** — 否决，因为 OMP 的运行时、会话日志和命令协议不是 Cordis 插件；源码副本无法加载，而且会 fork 一个仍在移动的社区目录。
- **把官方 goal/Ralph/plan/skill 包复制进本组** — 否决，因为 `dsh-base` 已经挂载它们；第二份副本会拆分 invariant，并掩盖运营方应当组合的包。目录改为点名那些包。
- **把 `/loop` 放进 `dsh-agent-loop` 或 `ctx.goals`** — 否决，因为按次数／时长重复不是带完成语义的目标，也不得给循环增加特权分支。公开的 `Agent.followup()` 和命令注册表已经足够，与 [Goal Round 驱动器](2026-07-19-same-session-goal-round-driver.md) 的 seam 规则一致。
- **像 goal 一样持久化 loop 启用状态** — 否决，因为崩溃无法证明排队中的续行已经准入；只有持久的 `user/message` 可重建，而且 OMP loop 没有可恢复的完成谓词。
- **在 `dsh-base` 中默认启用 advisor** — 否决，因为第二个模型的调用会在每一轮花费 token，并且需要显式的 provider/model。组合包保持按需启用，在完成路由前保持关闭。
- **把审阅请求记为会话事件** — 否决，因为旁路调用不属于主 agent 的历史；记入日志会在同一 transcript 中混入两个模型。注入的通知是唯一对模型可见、可重建的输入。

## 后果

- 想要 OMP 名称扩展的运营方安装一个组合包、阅读一份目录，而不必在各组之间寻找。
- 官方包保持单一所有者；loop 与 advisor 是仅有的新运行时插件。
- `/loop` 可作为人类命令使用，无需改动 `dsh-agent-loop` 或 `SESSION_FORMAT_VERSION`。
- advisor 通知可以从会话日志重建；审阅调用不能。
- 默认 profile 不会增加第二个模型的成本或按时长 loop。

## 相关

- [持久化的同会话 goal 领域](2026-07-19-persisted-same-session-goal-domain.md)
- [同会话 Goal Round 驱动器](2026-07-19-same-session-goal-round-driver.md)
- [人类 `/goal` 命令](2026-07-19-human-goal-command.md)
- [Profile 插件组合包](../architecture/2026-08-05-profile-plugin-bundles.md)
- [Harness 级循环](2026-07-16-harness-level-loop.md)

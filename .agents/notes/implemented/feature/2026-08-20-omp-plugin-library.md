# Agent Note: OMP plugin library as catalog plus loop and advisor plugins

Status: implemented

English | [中文](2026-08-20-omp-plugin-library.zh.md)

## Problem

[Oh My Pi](https://github.com/can1357/oh-my-pi) is a rich open-source agent harness community. Several of its extensions — goal, loop, advisor, Ralph, plan, skill, schedule, hooks — are things operators ask DeepSeek Harness to grow. DeepSeek Harness already states that everything is a plugin, and it already ships official packages for most of those names. Copying OMP source into a parallel tree, or forking official packages into `packages/omp/`, would duplicate ownership, split invariants, and hide the packages that `dsh-base` already mounts.

Two OMP concepts have no official equivalent. `/loop` repeats one prompt for a count or a wall-clock window without completion semantics. An advisor is a second model that reviews each completed turn and injects a notice. Those behaviors need plugins, a composition bundle, and a catalog that names the official packages instead of cloning them.

## Decision

`packages/omp/` holds only the plugins that do not already exist: `@deepseek-ai/dsh-omp-loop` and `@deepseek-ai/dsh-omp-advisor`. `@deepseek-ai/dsh-omp` in `packages/bundle/omp/` is an opt-in profile bundle whose patch inserts those two rows over `dsh-base`. `OMP_PLUGIN_CATALOG` maps OMP names to `@deepseek-ai/dsh-*` packages and records `origin: 'dsh-official' | 'omp-library'` plus `mountedBy: 'dsh-base' | 'dsh-omp' | 'opt-in'`. Official rows are composed by reference; this library does not copy their source.

Install with `dsh plugin --profile <name> add @deepseek-ai/dsh-omp`. Default `web` and `headless` profiles do not stack the bundle. Advisor `enabled` defaults false and fails loud when enabled without `provider` and `model`.

Same-session objectives remain on `ctx.goals` and the [goal-round driver](2026-07-19-same-session-goal-round-driver.md). `/loop` does not write goal events, does not persist activation, and stops on count, duration, `/loop stop`, competing `next-turn` human input, abort, or unload. Each continuation is a plugin-sourced `user/message` owned by `renderLoopPrompt`; the `./invariant` companion rejects a body that parser/renderer round-trip does not reconstruct. The durable prompt omits the wall-clock deadline so that reconstruction stays exact.

Advisor review is a side-channel `ctx.llm.stream` call. It is not a session event. Only the injected `Advisor <severity>: <note>` notice is model-visible in the owning session. `delivery: inject` never wakes the agent; `delivery: interrupt` followups a blocker under `maxInterrupts` when that turn has not already carried an advisor notice. Subagent sessions are skipped unless `includeSubagents` is true. This is not [`dsh-repeat-tool-reminder`](../../../packages/guard/repeat-tool-reminder/README.md), which injects identical-tool-call reminders without a second model.

## Testing

Package suites use the real command registry, session log, invariant service, and agent loop with a scripted mock adapter. They cover `/loop` grammar, renderer round-trip, the invariant companion, count continuation through AgentLoop, competing human input, abort, duration expiry, Loader composition, and fail-loud config. Advisor suites cover parse/transcript bounds, disabled vs enabled, subagent skip, inject vs interrupt, interrupt cap, reviewer error/abort/throw, unload abort, and Loader composition. The bundle suite parses `cordis.patch.yml` through the include schema and checks every catalog `dshPackage` name exists in the workspace. A keyless headless Loader smoke under `examples/headless-agent/tests/fixtures/omp-loop/` starts `/loop 2` after the first completed turn and asserts two renderer-owned continuations in the persisted JSONL.

## Alternatives considered

- **Vendor OMP source under `packages/omp/`** — rejected because OMP's runtime, session log, and command protocol are not Cordis plugins; a source copy would not load, and it would fork a moving community tree.
- **Copy official goal/Ralph/plan/skill packages into this group** — rejected because `dsh-base` already mounts them; a second copy would split invariants and hide the packages operators should compose. The catalog names those packages instead.
- **Put `/loop` inside `dsh-agent-loop` or `ctx.goals`** — rejected because a count/duration repeat is not a completion-bearing objective and must not add a privileged branch to the loop. The public `Agent.followup()` and command registry are enough, matching the [goal-round driver](2026-07-19-same-session-goal-round-driver.md) seam rule.
- **Persist loop activation like goals** — rejected because a crash cannot prove that a queued continuation reached admission; only the durable `user/message` is reconstructable, and OMP loop has no completion predicate to resume.
- **Enable advisor by default in `dsh-base`** — rejected because a second-model call spends tokens on every turn and needs an explicit provider/model. The bundle stays opt-in and dark until routed.
- **Log the reviewer request as session events** — rejected because the side-channel call is not part of the main agent's history; logging it would mix two models in one transcript. The injected notice is the only model-visible, reconstructable input.

## Consequences

- Operators who want OMP-named extensions install one bundle and read one catalog instead of hunting across groups.
- Official packages keep a single owner; loop and advisor are the only new runtime plugins.
- `/loop` is available as a human command without changing `dsh-agent-loop` or `SESSION_FORMAT_VERSION`.
- Advisor notices are reconstructable from the session log; reviewer calls are not.
- Default profiles do not grow a second-model cost or a duration loop.

## Related

- [Persisted same-session goal domain](2026-07-19-persisted-same-session-goal-domain.md)
- [Same-session goal-round driver](2026-07-19-same-session-goal-round-driver.md)
- [Human `/goal` command](2026-07-19-human-goal-command.md)
- [Profile plugin bundles](../architecture/2026-08-05-profile-plugin-bundles.md)
- [Harness-level loop](2026-07-16-harness-level-loop.md)
- [Official-only master and web-only plugin branch](../process/2026-08-20-fork-official-master-and-plugin-branch.md)

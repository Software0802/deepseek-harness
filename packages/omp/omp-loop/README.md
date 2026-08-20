# @deepseek-ai/dsh-omp-loop

English | [中文](README.zh.md)

Human `/loop` command that re-submits one prompt for a positive iteration count or a `ms|s|m|h` duration. The command has no completion semantics: it does not read goal state and does not stop because a model claims the task is done. Official same-session objectives stay on `ctx.goals` ([`dsh-goal`](../../goal/goal/README.md), [`dsh-goal-round-driver`](../../goal/goal-round-driver/README.md)).

Activation is process-local. A reload, fork, or plugin unload does not resume a loop. Each continuation is a plugin-sourced `user/message` whose body is exactly the package renderer, so the `./invariant` companion can reject a counterfeit continuation before it enters the session log.

## Config

```yaml
- id: omp-loop
  name: '@deepseek-ai/dsh-omp-loop'
  config:
    maxIterations: 20
```

`maxIterations` must be an integer `>= 1`. A `/loop` count above the cap fails at dispatch rather than clamping.

## Command

`/loop` with no suffix prints status. `/loop stop` stops a running loop. `/loop <n> [prompt]` starts a count. `/loop <n><ms|s|m|h> [prompt]` starts a duration whose iteration cap is still `maxIterations`. The prompt is required unless the session already has a human-authored `user/message`.

A second start while a loop is running is an error. A competing `next-turn` human message stops the loop. An aborted turn stops a queued attempt immediately and marks a claimed or admitted attempt cancelled so the following idle edge stops it.

## Extension points

The plugin registers on `ctx.commands` and drives `Agent.followup()` from `agent/*` and `session/event` listeners. It does not import `dsh-agent-loop`.

## Model Experience

### Loop continuation prompt

#### What the model sees

Each automatic iteration is one `user/message` whose text is exactly:

##### Loop continuation

```markdown
Loop iteration 2/5.
Original task:
keep going
```

The numbers and task text are the current iteration, the inclusive cap, and the original prompt. The durable body does not include the wall-clock deadline, so the invariant companion can reconstruct the renderer inputs.

#### Token effect

Each continuation is retained history for that agent. The iteration wrapper is a few tokens plus the original task text.

#### KV Cache effect

Append-only; newly visible content follows the reusable request prefix and does not invalidate existing KV-cache entries.

## Known Limitations and Deferred Work

- **Process-local activation** — unlike `ctx.goals`, a loop is not reconstructed from the session log after reload.
- **No completion predicate** — the loop stops on count, duration, `/loop stop`, competing human input, abort, or unload; it does not ask whether the task is finished.
- **One loop per agent** — parallel loops are rejected until the current run stops.

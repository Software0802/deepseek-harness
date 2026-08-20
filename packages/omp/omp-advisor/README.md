# @deepseek-ai/dsh-omp-advisor

English | [中文](README.zh.md)

Second-model reviewer that reads each completed main-agent turn and injects a notice. The review request is a side-channel `ctx.llm.stream` call: it is not a session event. Only the injected notice is model-visible in the owning session. Pair a cheaper model through Config. Disabled by default so installing the bundle does not spend tokens until a deployment supplies `provider` and `model`.

This is not [`dsh-repeat-tool-reminder`](../../guard/repeat-tool-reminder/README.md), which injects identical-tool-call reminders without a second model.

## Config

```yaml
- id: omp-advisor
  name: '@deepseek-ai/dsh-omp-advisor'
  config:
    enabled: false
    provider: ''
    model: ''
    timeoutMs: 30000
    maxOutputTokens: 256
    maxTranscriptBytes: 8192
    includeSubagents: false
    delivery: inject
    maxInterrupts: 3
```

`enabled: true` requires non-empty `provider` and `model`. Integers must be `>= 1` except `maxInterrupts`, which may be `0`. `timeoutMs` must also be `<= 2147483647`. `delivery: inject` never wakes the agent; `delivery: interrupt` calls `followup()` only for a blocker note that this turn has not already noticed and only while the per-agent interrupt cap remains.

Sessions whose header origin is `subagent` are skipped unless `includeSubagents` is true. Aborted turns are not reviewed. Empty transcripts are skipped. Reviewer failures are logged and do not fail the main turn.

## Extension points

The plugin listens to `session/event` `turn/end` with `reason.kind === 'completed'`, then delivers through `Agent.inject()` or `Agent.followup()`. It does not import `dsh-agent-loop`.

## Model Experience

### Injected advisor notice

#### What the model sees

The main agent receives one plugin notice whose text is `Advisor <severity>: <note>`, with severity `aside`, `concern`, or `blocker`.

##### Advisor notice

```markdown
Advisor aside: check the tests
```

#### Token effect

Zero tokens until a completed turn produces a non-empty note. The notice is retained history for that agent. `maxOutputTokens` bounds the reviewer reply; `maxTranscriptBytes` bounds the reviewer request.

#### KV Cache effect

Append-only for `inject`. `interrupt` followup on a blocker starts another turn after the reusable prefix.

### Reviewer side-channel request

#### What the model sees

The reviewer model is not the session's main agent. It receives this system prompt and a user message that is the bounded turn transcript (`User:` / `Assistant:` lines). That request is not written to the session log.

##### Advisor system prompt

```markdown
You are a silent reviewer watching one coding-agent turn.
Read the turn transcript and reply with exactly two parts:
SEVERITY: aside | concern | blocker
NOTE: <one short note the main agent should see>
Use aside for a quiet observation, concern for a risk that still lets work continue, and blocker for a hard mistake that should stop the current approach.
Do not call tools. Do not greet. Do not repeat the transcript.
```

#### Token effect

Each completed turn with a non-empty transcript spends one reviewer call of at most `maxOutputTokens`, plus the bounded transcript.

#### KV Cache effect

None in the main session. The reviewer call is a separate request.

## Known Limitations and Deferred Work

- **Side-channel review is not durable** — a reload cannot reconstruct the reviewer call; only an admitted notice remains in the log.
- **Disabled until routed** — `enabled` defaults false; a missing provider/model fails loud only when enabled.
- **Notes are model-authored** — the invariant companion is empty because the notice text is not a package-owned renderer output.

# `@deepseek-ai/dsh-omp`

English | [中文](README.zh.md)

Opt-in Oh My Pi plugin-library bundle over [`dsh-base`](../base/README.md). [`cordis.patch.yml`](cordis.patch.yml) inserts `@deepseek-ai/dsh-omp-loop` and `@deepseek-ai/dsh-omp-advisor`. It does not remount goal, Ralph, plan, skill, or repeat-tool reminders: those packages already ship in `dsh-base`, and this library composes them by reference through `OMP_PLUGIN_CATALOG`.

Install into a profile with `dsh plugin --profile <name> add @deepseek-ai/dsh-omp`. Advisor stays `enabled: false` until a deployment supplies `provider` and `model`.

The catalog maps OMP names (`goal`, `loop`, `advisor`, `ralph`, `plan`, `skill`, `schedule`, `hooks`, `advisory-repeat`) to `@deepseek-ai/dsh-*` packages and records whether each row is official or owned by this library.

## Model Experience

Indirectly, through the inserted `omp-loop` and `omp-advisor` rows: this bundle contributes no model-visible text of its own.

#### KV Cache effect

None directly; each inserted row's package owns its effect.

## Known Limitations and Deferred Work

- **Opt-in layer** — default `web` and `headless` profiles do not stack this bundle.
- **No forked official source** — catalog rows whose origin is `dsh-official` are not copied into `packages/omp/`.
- **Advisor is dark until routed** — installing the bundle does not spend reviewer tokens.

---
description: "Bundled skill provider for the vflow first-mate workflow skills."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-vflow-skills

English | [中文](README.zh.md)

## Summary

Add the vflow skill pack to give every agent the first-mate working rules and the V-model workflow skills that ship with this package. The pack mounts its own filesystem skill provider over the package's `skills/` directory, so project and user skills keep their discovery and override same-named vflow skills. It is the first package of the vflow family, which brings a single first-mate agent, delegated workers, and a gated V-model workflow to Harness.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Turn on **Japanese-style development workflow** in the GUI plugin manager, or mount the plugin after the skill registry in an explicit composition. A model-facing skill tool such as `dsh-tool-skill` must also be mounted for agents to load the skills.

```yaml
- name: '@deepseek-ai/dsh-skill'
- name: '@deepseek-ai/dsh-experimental-vflow-skills'
```

| Field | Default | Meaning |
|---|---|---|
| `providerName` | `vflow` | Unique provider name registered on `ctx.skills` |
| `teamSettings.source` | empty | `http(s)://` address or absolute path of the published team settings file; editable live on the settings page |
| `teamSettings.stateFile` | `~/.dsh/vflow/team-settings.json` in the bundle | Absolute path of the adopted copy |
| `teamSettings.fetchTimeoutMs` | `10000` | Time limit for one fetch of the source |
| `accounts.probeTimeoutMs` | `10000` | Time limit for one connection test |

### Settings page and setup guide

The plugin's page under **Plugins** shows the team settings and the connector accounts. Enter the published address and press **Save and check**; the page shows the team name, version, connector and project counts, and the default reviewer. When a newer version is published, a banner names it and **Accept update** adopts it. Each connector row saves a login name and password or API token, runs **Test connection**, and removes the account. **Setup guide** walks through team settings, accounts, and an environment check that requires adopted settings, an account for every connector, and a passing test for every testable connector.

### Team settings

Company values such as project names, ticket prefixes, document rules, bench resources, and executors live in one JSON team settings file, not in this package. Publish the file on a LAN host, such as the team's bastion host, and point `teamSettings.source` at it. `ctx.vflowTeamSettings` reads the adopted copy at startup and fetches the source: the first valid version is adopted directly, and a later version with different bytes stays `pending` until `accept(sha256)` names the version the user reviewed. While the source is unreachable, the adopted copy stays in use and the state carries `sourceError`.

The file never holds secrets: a document with a password-, token-, or secret-like key anywhere is refused with that key's JSON path. Connector ids are lowercase identifiers such as `tracker`.

### Connector accounts

Each user saves their own login for every connector the adopted team settings name. `ctx.vflowAccounts` stores it in the local credential store as the grant record `vflow/<connector id>`, so the team settings file and the bastion host never see it. `list()` returns each connector with whether an account is saved and the login name, never the secret. `test(connectorId)` sends one read-only request with HTTP Basic authentication and reports `ok`, `unauthorized` (401 or 403), `unexpected-status`, `unreachable`, `not-configured`, or `unsupported`:

| Connector kind | Test request |
|---|---|
| `redmine` | `GET <url>/users/current.json` |
| `jira` | `GET <url>/rest/api/2/myself` |
| `gerrit` | `GET <url>/a/accounts/self` |
| `jenkins` | `GET <url>/me/api/json` |
| `svn` | `GET <url>` |

`feishu`, `wiki`, and any non-HTTP address such as `ssh://` report `unsupported`. Redirects are not followed, so a login page redirect reports `unexpected-status`.

The pack currently ships `vflow-first-mate`: the first agent only splits work, delegates changes to workers, verifies evidence, and asks the user before merges, pushes, and ticket or repository writes.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

[`src/index.ts`](src/index.ts) resolves `VFLOW_SKILL_DIR` from the module location and mounts [`dsh-skill-filesystem`](../../skill/skill-filesystem/README.md) as a child plugin with `includeDefaultRoots: false`, that directory as `bundledSkillDir`, and watching disabled because shipped files change only with the package. Disposal of this plugin disposes the child provider and removes its catalog. The skill file format and frontmatter rules are those of the filesystem provider.

[`src/team-settings.ts`](src/team-settings.ts) parses a document, refuses secret-like keys, validates the schema and the `defaultReviewer` executor reference, and hashes the exact text. [`src/team-settings-service.ts`](src/team-settings-service.ts) writes the adopted text byte for byte with `writeFileAtomic` (mode `0600`), so the adopted copy and the published file share one SHA-256. An unreadable or invalid adopted copy, or a failed first fetch, leaves the service `failed` instead of falling back to defaults.

[`src/controller.ts`](src/controller.ts) serves the `vflow` Remote namespace: team settings state with error causes, `refreshTeamSettings`, `acceptTeamSettings`, and the account operations, whose refusals become the Remote failures `vflow/unknown-connector`, `vflow/invalid-account`, and `vflow/no-pending-version`. A saved source address reaches `teamSettings.source` through the Host config form, and the plugin's `loader/volatile-update` listener checks the new source at once. The browser half in [`src/client`](src/client) registers the page in `plugins.bundle.config` for this package and keeps one page store; an operation's failure stays on the page until the next successful operation.

[`src/accounts.ts`](src/accounts.ts) reads the connector list from the adopted team settings on every call, so an accepted settings update takes effect without a restart. Stored records are validated on read; a record of another kind or with an empty field reads as unconfigured. A connection test combines the caller's signal with `probeTimeoutMs`: a caller abort is rethrown, while network errors and the time limit report `unreachable`.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Filesystem skill provider](../../skill/skill-filesystem/README.md) — skill format, ranks, and frontmatter keys.
- [Skill family](../../skill/README.md) — registry, providers, and the model-facing skill tool.

-----

<a id="model-experience"></a>
## Model Experience

### Skill catalog

#### What the model sees

Each shipped skill appears in the skill catalog with its name and description, for example `vflow-first-mate`; the body enters history only when the agent loads it with the skill tool.

#### Token effect

Each shipped skill adds one catalog entry to requests that carry the catalog. Loading a skill appends its full body to ordinary tool history.

#### KV Cache effect

The catalog changes only when the package changes, so it keeps an existing cached prefix. Loaded bodies append after prior history.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Workflow skills pending** — the V-model workflow skills are added after a redaction review of their customer and company references.
- **Basic authentication only** — Jira Cloud tokens, Gerrit SSH, Feishu, and wiki connectors have no connection test yet.
- **No periodic update check** — the source is checked at startup, when its address changes, and on **Check for updates**.
- **Rules are guidance** — the first-mate rules are model instructions; gate enforcement for repository and ticket writes arrives with the vflow workflow engine.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>

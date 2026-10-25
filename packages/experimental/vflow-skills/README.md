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

The pack currently ships `vflow-first-mate`: the first agent only splits work, delegates changes to workers, verifies evidence, and asks the user before merges, pushes, and ticket or repository writes.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

[`src/index.ts`](src/index.ts) resolves `VFLOW_SKILL_DIR` from the module location and mounts [`dsh-skill-filesystem`](../../skill/skill-filesystem/README.md) as a child plugin with `includeDefaultRoots: false`, that directory as `bundledSkillDir`, and watching disabled because shipped files change only with the package. Disposal of this plugin disposes the child provider and removes its catalog. The skill file format and frontmatter rules are those of the filesystem provider.

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
- **Rules are guidance** — the first-mate rules are model instructions; gate enforcement for repository and ticket writes arrives with the vflow workflow engine.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>

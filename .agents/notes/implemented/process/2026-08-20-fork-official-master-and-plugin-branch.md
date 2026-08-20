# Agent Note: Official-only master and plugin-branch fork product

Status: implemented

English | [中文](2026-08-20-fork-official-master-and-plugin-branch.zh.md)

## Problem

This fork's `master` mixed three products: an official [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) history, a vendored Electron Desktop that official dsh does not ship, and fork Cordis plugins such as OMP loop and advisor. A trunk that both fast-forwards official releases and carries Desktop plus plugins cannot stay a clean upstream mirror, and merging the plugin branch into `master` would restore that mix.

The Electron Desktop looks like "another plugin" because this repo's rule is that everything is a plugin, but the window process is not a Cordis plugin: it spawns `dsh web` and hosts the browser. Treating that shell as a `packages/` plugin would hide an application host inside the plugin tree.

## Decision

`master` contains only official DeepSeek Harness commits. Sync it by fetching `https://github.com/deepseek-ai/deepseek-harness.git` `master` and publishing that history onto this fork's `master` with a lease-protected non-fast-forward when the previous tip still carried fork commits. `master` has no `desktop-studio/`, no `desktop-build/`, no `packages/omp/`, no `@deepseek-ai/dsh-omp` bundle, and no Cursor Cloud `AGENTS.md` appendix.

`cursor/omp-plugin-library-4812` is the fork product and plugin R&D branch. It carries every fork Cordis plugin, every fork patch to an official package, the Desktop application host, and Cloud VM notes. Refresh it by merging this fork's `master` into the plugin branch. Never merge the plugin branch into `master`.

A draft PR whose base is `master` and whose head is the plugin branch is a diff view of fork product versus official, not a landing path.

Desktop splits into two roles and both stay on the plugin branch:

- **Application host (not a Cordis plugin):** `desktop-studio/main-process/` is the vendored Electron shell. It launches `dsh web` and owns the window. `desktop-build/` is installer metadata for that host. Official dsh's hosts remain `dsh web` and `dsh` CLI under `apps/`.
- **Cordis / browser plugins:** `desktop-studio/plugins/` (`dsh-client-ui-desktop-customization`, `dsh-client-ui-plugin-center`, `dsh-plugin-center-contracts`) mount only when the Desktop host exports `DSH_DESKTOP=1`. OMP loop, OMP advisor, and `@deepseek-ai/dsh-omp` are the same class of work: fork plugins that default `web` / `headless` profiles do not stack.

Fork edits that currently live in official package directories (`dsh-llm-pi-ai` Grok login, Host vision / Grok 4.6 effort maps, and the Desktop patch script that copies those into an install) stay on the plugin branch. They are not upstreamed through `master`.

## Alternatives considered

**Keep Desktop on `master` and put only OMP on the plugin branch.** Rejected because `master` would still mix official harness with a third-party Electron product, which is the mix this split removes.

**Add a third `desktop` branch.** Rejected under a two-branch policy. The shell is the host that loads the fork's Desktop UI plugins; splitting host and plugins across branches would force every Desktop change to land twice.

**Mount the Electron shell as a Cordis plugin under `packages/`.** Rejected because the shell is a process that starts `dsh web`, the same role as `apps/` hosts, not a row in `cordis.patch.yml`.

**Merge the plugin branch into `master` after review.** Rejected because that writes Desktop, OMP, and Host patches onto the official-mirror trunk.

## Consequences

Clone default `master` reads as official dsh (`npx @deepseek-ai/dsh web`, no Desktop tree). Daily fork work checks out `cursor/omp-plugin-library-4812`.

An upstream sync is two steps: move `master` to official `master`, then merge `master` into the plugin branch. The plugin branch may lag official until that merge; this record does not require the merge in the same change that restores the official-only `master`.

A tracking PR against `master` grows to the full fork delta (Desktop vendor, Host patches, OMP). Merging it is forbidden by this decision.

## Related

- [OMP plugin library as catalog plus loop and advisor plugins](../feature/2026-08-20-omp-plugin-library.md)
- [Desktop vision on Grok 4.6 and per-model reasoning levels](../feature/2026-08-17-desktop-vision-and-per-model-reasoning.md)
- [Profile plugin bundles](../architecture/2026-08-05-profile-plugin-bundles.md)

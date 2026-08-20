# Agent Note: Official-only master and web-only plugin branch

Status: implemented

English | [中文](2026-08-20-fork-official-master-and-plugin-branch.zh.md)

## Problem

This fork mixed official DeepSeek Harness, a vendored Electron Desktop that official dsh does not ship, and fork Cordis plugins on one `master`. That trunk could not stay an upstream mirror. After splitting `master` from the plugin branch, carrying Desktop on the plugin branch still blocked merging official `dsh web` (0.1.0-rc.8) and split attention from the browser product.

The Electron window process is not a Cordis plugin: it spawns `dsh web`. Studio UI packages under `desktop-studio/plugins/` are plugins, but they only mount when that host exports `DSH_DESKTOP=1`. Keeping the host in order to keep those plugins made every official sync a Desktop merge.

## Decision

`master` contains only official DeepSeek Harness commits. Sync it by fetching `https://github.com/deepseek-ai/deepseek-harness.git` `master` and publishing that history onto this fork's `master` with a lease-protected non-fast-forward when the previous tip still carried fork commits.

`cursor/omp-plugin-library-4812` is the fork plugin R&D branch on top of that official `master`. It carries `@deepseek-ai/dsh-omp`, `@deepseek-ai/dsh-omp-loop`, `@deepseek-ai/dsh-omp-advisor`, and Cursor Cloud `AGENTS.md` notes. Operators install the bundle onto a `web` or `headless` profile with `dsh plugin --profile <name> add @deepseek-ai/dsh-omp`. Default `web` and `headless` profiles do not stack it. Refresh the branch by merging this fork's `master` into it. Never merge the plugin branch into `master`.

This fork does not ship Desktop. There is no `desktop-studio/`, `desktop-build/`, Studio UI plugin, Host `vision` domain, or fork Grok-login patch to `dsh-llm-pi-ai` on the plugin branch. The product host is official `dsh web` (browser) and `dsh` CLI. The abandoned Electron tree remains on `cursor/desktop-client-archive-4812` for recovery; it is not a landing path onto `master` or the plugin branch.

A draft PR whose base is `master` and whose head is the plugin branch is a diff view of OMP versus official, not a landing path.

## Alternatives considered

**Keep Desktop on the plugin branch and only drop it from `master`.** Rejected because the plugin branch then lags official web releases whenever Desktop or Grok Host patches conflict, which is the mix that made `master` unreadable.

**Keep Grok OAuth and Host vision on `dsh web` after deleting the Electron shell.** Rejected for this change because those patches were written for the Desktop Settings row and effort picker, conflict with official 0.1.0-rc.8 `dsh-llm-pi-ai`, and are not required to run OMP on the official browser UI. A later web-facing Grok or vision feature would be its own plugin or official-package change.

**Mount the Electron shell as a Cordis plugin under `packages/`.** Rejected because the shell is a process that starts `dsh web`, the same role as `apps/` hosts.

**Merge the plugin branch into `master` after review.** Rejected because that writes OMP onto the official-mirror trunk.

## Consequences

Clone default `master` is official dsh. Daily fork work checks out `cursor/omp-plugin-library-4812` and runs `pnpm dsh web` or `dsh plugin --profile web add @deepseek-ai/dsh-omp`.

An upstream sync is two steps: move `master` to official `master`, then merge `master` into the plugin branch.

Reintroducing Desktop requires a dedicated branch and an explicit product decision; it must not return by merging the archive branch into `master`.

## Related

- [OMP plugin library as catalog plus loop and advisor plugins](../feature/2026-08-20-omp-plugin-library.md)
- [Profile plugin bundles](../architecture/2026-08-05-profile-plugin-bundles.md)

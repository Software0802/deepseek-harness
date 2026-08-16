# Agent Note: Desktop vision on Grok 4.6 and per-model reasoning levels

Status: implemented

English | [中文](2026-08-17-desktop-vision-and-per-model-reasoning.zh.md)

## Problem

The third-party Desktop shell advertised visual enhancement against 阿里云百炼 `qwen3.8-max`, and its client called `api.vision.status` on a Host whose ApiProxy had no `vision` domain, so the Settings row crashed on `undefined.status`. The composer effort picker showed Grok 4.6 as Off / Low / Medium / High / Max, but Grok 4.6's wire vocabulary tops out at `xhigh`. Replacing `max` with `xhigh` in the global level list would hide Max on models that still declare it (DeepSeek and any hand-declared `max` map). The shell also rendered a third-party 「赋范空间出品」 badge that this product does not want.

## Decision

Visual enhancement is a Host capability on `@deepseek-ai/dsh-host-apiproxy`: `installVisionEnhancement` registers the `vision-enhancement` settings section, the `vision_analyze` tool, a skill, and the text-model image bridge. `ApiProxy.vision` exposes `status`, `test`, and `enable`. The default provider is xAI `grok-4.6` authenticated by the same `XAI_API_KEY` credential as the chat route; OpenRouter remains the second provider with an editable model id. A cached observation is a log-only `vision/observation` session event so a later step can reuse the description. `KNOWN_SESSION_EVENT_TYPES` includes that type.

The Desktop customization client reads `api.vision` and fails with a Host-not-wired message when the method is absent. It no longer mounts the attribution badge.

Selectable reasoning efforts stay per model. A model's `reasoningEfforts` dict becomes that model's `thinkingLevelMap`; undeclared keys are pinned `null`. The adapter labels every canonical pi-ai id (`off` … `xhigh` … `max`) but offers only `getSupportedThinkingLevels(model)`. The composer `ModelSelect` renders the Host list. Grok 4.6 therefore declares `off` / `low` / `medium` / `high` / `xhigh` and does not declare `max`; a sibling that declares `max` still offers Max.

`desktop-studio/build-desktop.ps1` patches `dsh-session`, `dsh-llm-pi-ai`, `dsh-host-apiproxy`, and `dsh-client-connection` into an existing Desktop install so the Host and browser share the vision methods and the Grok 4.6 effort map.

## Alternatives considered

**Hardcode the composer effort list to Off / Low / Medium / High / xHigh.** That would drop Max for DeepSeek and every other model whose map still includes `max`.

**Map `max` to `xhigh` globally in the adapter.** The two ids are independent pi-ai keys with different defaulting (an absent `max`/`xhigh` is unsupported; an absent base level is supported). A global alias would send the wrong wire value on a model that actually has `max`.

**Leave visual enhancement in the Desktop client plugin only.** The crash was `api.vision === undefined` after the fork overwrote ApiProxy. Status, test, enable, the tool, and the image bridge have to live on the Host that owns credentials, settings, and session append.

**Keep the third-party attribution overlay and only change copy.** The product requirement is to remove that badge, not to rebrand it.

## Consequences

Opening Settings no longer throws on vision status. Enabling visual enhancement uses xAI Grok 4.6 with `XAI_API_KEY`. Grok 4.6's effort row is Off / Low / Medium / High / xHigh; a model that declares `max` still shows Max. Sessions that log `vision/observation` remain loadable on this build because the type is in the generated known-event set. The Desktop install must be restarted after `build-desktop.ps1` so the patched Host and client bundles load.

## Testing

`packages/llm/llm-pi-ai/tests/adapter.spec.ts` pins two models on one route offering `max` and `xhigh` independently. `catalog.spec.ts` pins Grok 4.6's map (`xhigh` set, `max` null) beside a sibling that still offers `max`. ApiProxy client-handler and fetch-carrier stubs include the `vision` domain so the Host typecheck stays closed.

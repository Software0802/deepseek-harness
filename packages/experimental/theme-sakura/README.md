---
description: "Sakura anime theme bundle: four character palettes with conversation art, a sidebar sticker, falling petals, and a Settings row for the light and dark Web GUI schemes."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-theme-sakura

English | [中文](README.zh.md)

## Summary

This optional bundle turns the Desktop and Web GUI into an anime theme. Four character presets (Zero Two, Emilia, Mai Sakurajima, and Asuna) re-tint every surface, text, and accent color in light and dark mode, place faded art behind the conversation, add a sidebar sticker, and drift petals across the window. The headline gets an accent gradient and the composer becomes frosted glass. **Settings → General → Anime theme** picks the character and turns the art, sticker, and petals on or off; turning the bundle off restores the built-in look immediately.

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

Build the package, pack it, and install the tarball from the Desktop **Plugins** page:

```sh
pnpm install
pnpm run build:artifacts
cd packages/experimental/theme-sakura && pnpm pack
```

In the Desktop app, open **Plugins**, choose the arrow beside **Add plugin**, choose **Install third-party plugin**, and enter the absolute path of the `.tgz` file. Choose **Enable now** when the install finishes. The bundle appears under **Installed plugins** as **Sakura theme**; its switch turns the whole theme on and off. Choose the character and decorations in **Settings → General → Anime theme**; the choice is stored per browser profile. From a source checkout, `dsh plugin --profile web add <path to the .tgz>` installs it into the Web profile.

The palette does not change fonts. For a rounder look, install a rounded font such as Zen Maru Gothic or M PLUS Rounded 1c and enter its name in **Settings → General → More font settings**.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Maintainer details — click to expand</summary>

The package is both a bundle and a browser plugin: `cordis.patch.yml` inserts one row naming the package, and `dsh.client` mounts [`src/client/index.ts`](src/client/index.ts) on that row. Every effect is registered through `ctx.effect()`, so the theme lives exactly as long as the row.

- [`presets.ts`](src/client/presets.ts) regenerates the two static ramps that the [ui-theme](../../client/ui-theme/README.md) alias tokens resolve through (`--dsw-static-neutral-bluish-*` and `--dsw-static-deepseek-*`) on the stock lightness curve with each character's hue and chroma, using the OKLCH conversion in [`color.ts`](src/client/color.ts). It also overrides the aliases that the base stylesheets set to literal colors, the radius scale, and the `--sakura-*` variables that carry the art and sticker URLs and the decoration colors per scheme. The layer goes through `ctx.theme.overrideTokens()`; switching characters re-applies the same source, which replaces the previous layer.
- [`decor.css`](src/client/decor.css) draws the glows and art as pseudo-elements of `[data-conversation-region=chat]`, the wash, blossom branch, and sticker on the sidebar column, the headline gradient, and the frosted composer. It keys on `body[data-sakura]` plus one attribute per enabled decoration and matches host elements by data attributes and by the readable suffix of their CSS-module classes.
- [`petals.ts`](src/client/petals.ts) runs a fixed, click-through canvas with 14 petals; it pauses while the document is hidden and does not start under `prefers-reduced-motion: reduce`.
- [`SakuraRow.tsx`](src/client/SakuraRow.tsx) is the Settings row (order 12, after the font rows). [`preferences.ts`](src/client/preferences.ts) keeps the choice in `localStorage` under `dsh-theme-sakura:v1` and falls back to the defaults (Zero Two, everything on) for missing or invalid fields.

Tests keep each preset's neutral ramps ordered from lightest to darkest, keep body text above 7:1 and links above 4.5:1 contrast on the base background, and cover the preference, overlay, and Settings-row lifecycles.

Character palettes follow the [Doki Theme](https://github.com/doki-theme/doki-master-theme) definitions, and the art and stickers under `src/client/assets/` come from [doki-theme-assets](https://github.com/doki-theme/doki-theme-assets), cropped and converted to WebP; the blossom branch is original. The characters belong to their rights holders. Doki Theme is distributed under the MIT License:

```text
The MIT License (MIT)

Copyright (c) 2022 Alex Simons

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [ui-theme](../../client/ui-theme/README.md) — the token stylesheets and the override-layer API this bundle uses.
- [Packaging and installing plugins](../../../docs/user/develop/basic/publish.md) — bundle manifests and profile installs.

-----

<a id="model-experience"></a>
## Model Experience

None, as the theme changes only browser styles and never reaches a model request.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The presets override the static ramps that ui-theme declares today; a ramp step added to the base stylesheets later keeps its built-in color until the presets add it.
- `decor.css` matches the sidebar column, sidebar panel, and hero headline by CSS-module class suffixes (`_sidebarCol`, `_root`, `_titleGroup`) and the send button by `_primary`; renaming those classes drops that decoration without breaking the palette.
- The petal overlay sits above the page and is click-through; turn it off in Settings if it distracts.
- Preferences are per browser profile and do not sync between devices.
- Product icons and fonts are unchanged.

-----

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Maintainer details — click to expand</summary>

None.

</details>

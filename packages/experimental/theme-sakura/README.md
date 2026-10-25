---
description: "Sakura theme bundle: a cherry-blossom pink and lavender palette with rounder corners, applied over the light and dark Web GUI schemes."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-theme-sakura

English | [中文](README.zh.md)

## Summary

This optional bundle re-tints the Desktop and Web GUI with a soft cherry-blossom palette: blossom-white surfaces with plum text in light mode, a lavender night palette in dark mode, a pink accent for focus rings, links, and highlights, and slightly rounder corners. It follows the user's light, dark, or system appearance setting; turning the bundle off restores the built-in palette immediately.

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

In the Desktop app, open **Plugins**, choose the arrow beside **Add plugin**, choose **Install third-party plugin**, and enter the absolute path of the `.tgz` file. Choose **Enable now** when the install finishes. The bundle appears under **Installed plugins** as **Sakura theme**; its switch turns the palette on and off. From a source checkout, `dsh plugin --profile web add <path to the .tgz>` installs it into the Web profile.

The palette does not change fonts. For a rounder look, install a rounded font such as Zen Maru Gothic or M PLUS Rounded 1c and enter its name in **Settings → General → More font settings**.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Maintainer details — click to expand</summary>

The package is both a bundle and a browser plugin: `cordis.patch.yml` inserts one row naming the package, and `dsh.client` mounts [`src/client/index.ts`](src/client/index.ts) on that row. The client entry calls `ctx.theme.overrideTokens()` once inside `ctx.effect()`, so the override layer lives exactly as long as the row. [`palette.ts`](src/client/palette.ts) replaces the two static ramps that the [ui-theme](../../client/ui-theme/README.md) alias tokens resolve through (`--dsw-static-neutral-bluish-*` and `--dsw-static-deepseek-*`), step for step with separate light and dark values, and adds the aliases that the base stylesheets set to literal colors (borders, hover fills, menu surfaces, bubbles) plus link colors that need more contrast than the ramp gives. The radius scale is overridden with the same values in both schemes. Tests keep each neutral ramp ordered from lightest to darkest and keep body text above 7:1 and links above 4.5:1 contrast on the base background.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [ui-theme](../../client/ui-theme/README.md) — the token stylesheets and the override-layer API this bundle uses.
- [Packaging and installing plugins](../../../docs/user/develop/basic/publish.md) — bundle manifests and profile installs.

-----

<a id="model-experience"></a>
## Model Experience

None, as the palette changes only browser styles and never reaches a model request.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The palette overrides the static ramps that ui-theme declares today; a ramp step added to the base stylesheets later keeps its built-in color until this palette adds it.
- Product icons and fonts are unchanged.

-----

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Maintainer details — click to expand</summary>

None.

</details>

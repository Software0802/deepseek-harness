# Desktop shell vendor resources: DeepSeek Harness Studio (fufankeji)

This directory vendors the **desktop shell** of the
[DeepSeek Harness Studio](https://github.com/fufankeji/deepseek-harness-studio)
distribution (0.1.0-rc.6, published 2026-08-16). The official
[deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)
repository ships no desktop package — the official distribution is the npm
`dsh` package served by `dsh web`. The Studio distribution wraps that host in
an Electron shell and adds three non-official UI plugins.

This fork keeps the shell as a **vendored build input** so the desktop bundle
can be reassembled from this repository alone: our provider work rides on the
official host, the shell provides the window, and `build-desktop.ps1` glues
them together.

## Sources and provenance

| Item | Origin | Version | Verification |
|---|---|---|---|
| Installer | `DeepSeek-Harness-Desktop-Windows-x64-0.1.0-rc.6-Setup.exe` | 0.1.0-rc.6 | SHA256 `50df632c629ff4fdbfff0a752870795cd577e69d1e909b277059ca7118d0e6b0` (matches publisher's `SHA256SUMS-windows-x64-preview.txt`) |
| Main process | `resources/app.asar` inside the installer | rc.6 | publisher verification record: silent install/host start/uninstall PASS |
| Plugins | `resources/host/node_modules/@deepseek-ai/dsh-client-ui-desktop-customization`, `dsh-client-ui-plugin-center`, `dsh-plugin-center-contracts` | 0.1.0-rc.5 | bundled with the installer |

The main process (`main-process/`) is the extracted, sourcemapped-build
`dsh-desktop-runtime`: it spawns `dsh web` (`node …/@deepseek-ai/dsh/lib/bin.js
web --host 127.0.0.1 --port 0`) and hosts the window. The plugins (`plugins/`)
are the Studio-only UI additions — the cartoon skin, background customization,
and update center. This fork does not ship the third-party brand badge.
Neither plugin has upstream source in the official repository; both are
vendored as build inputs.

## What the shell does NOT change

- The host bundle is the official rc.6 npm tree (plus this fork's patches).
- The window chrome is unchanged from the official desktop build: `frame:
  true` on Windows, hidden title bar with the 44px window-controls overlay,
  and CSS `-webkit-app-region` dragging — which is why the official rc.5
  shell and the rc.6 main process are interchangeable at the window layer.

## Updating the shell

When Studio publishes a newer desktop build:

1. Download the installer and verify its SHA256 against the publisher's
   checksum file.
2. Extract: `npx asar extract <installer resources/app.asar> main-process-new`
   and copy the three plugin packages from the installer's host tree.
3. Replace `main-process/` and `plugins/` here (strip `*.map` /
   `*.tsbuildinfo`), update the provenance table and commit.

## Local desktop install layout

The official Studio installer places the app at
`%LOCALAPPDATA%\Programs\@deepseek-aidsh-desktop`. Reinstall and apply this
fork's host patches with:

```
powershell -ExecutionPolicy Bypass -File desktop-studio/reinstall-desktop.ps1
```

That script downloads the verified rc.6 Setup.exe (SHA-256 in the table
above), extracts it with `7z`, and runs `build-desktop.ps1`. The Studio
shell ships Electron 43 / Node 24; a self-built Electron 34 asar cannot
boot this host (`createZstdDecompress` is a Node 22 API).

`build-desktop.ps1` also locates an existing install via the registry, or
takes `-InstallDir`.

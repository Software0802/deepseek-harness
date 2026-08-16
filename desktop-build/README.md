# Desktop installer build

English | [中文](README.zh.md)

Produces Windows and Ubuntu packages from the vendored Studio shell, a staged host tree, and this fork's prebuilt packages.

## Prerequisites

- `pnpm run build:lib:host` and `pnpm run build:lib:client` in the repository root
- A staged host at `resources/host` (copied from an installed Desktop, or left over from a previous assemble)
- Node 22+ and network access for `electron` / optional Linux native packages

## Windows

```
powershell -ExecutionPolicy Bypass -File desktop-build/assemble.ps1 -Target win
```

Output: `dist/DeepSeek-Harness-0.1.0-rc.6-windows-x64-Setup.exe`

## Ubuntu (x64 AppImage + .deb)

The Windows host tree does not include Linux optional addons. `install-linux-natives.ps1` downloads them (sharp, koffi, node-pty prebuilds, require-builtin) so `electron-builder --linux` can pack a tree that loads on Ubuntu.

```
powershell -ExecutionPolicy Bypass -File desktop-build/assemble.ps1 -Target linux
```

On Ubuntu, the same packing step is:

```
bash desktop-build/assemble.sh linux
```

Outputs:

- `dist/DeepSeek-Harness-0.1.0-rc.6-linux-x64.AppImage`
- `dist/DeepSeek-Harness-0.1.0-rc.6-linux-x64.deb`

## Both

```
powershell -ExecutionPolicy Bypass -File desktop-build/assemble.ps1 -Target all
```

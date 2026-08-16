# 桌面安装包构建

[English](README.md) | 中文

用第三方 Studio 壳、一份已暂存的 host 树，以及本 fork 预构建的包，打出 Windows 与 Ubuntu 安装包。

## 前置条件

- 仓库根目录先跑 `pnpm run build:lib:host` 和 `pnpm run build:lib:client`
- `resources/host` 里已有一份 host 树（从已安装的 Desktop 拷来，或上次 assemble 留下）
- Node 22+，以及下载 `electron` / Linux 可选原生包所需的网络

## Windows

```
powershell -ExecutionPolicy Bypass -File desktop-build/assemble.ps1 -Target win
```

产物：`dist/DeepSeek-Harness-0.1.0-rc.6-windows-x64-Setup.exe`

## Ubuntu（x64 AppImage + .deb）

Windows 的 host 树不含 Linux 可选 addon。`install-linux-natives.ps1` 会下载 sharp、koffi、node-pty prebuild 和 require-builtin，这样 `electron-builder --linux` 打出的包才能在 Ubuntu 上加载。

```
powershell -ExecutionPolicy Bypass -File desktop-build/assemble.ps1 -Target linux
```

在 Ubuntu 上等价于：

```
bash desktop-build/assemble.sh linux
```

产物：

- `dist/DeepSeek-Harness-0.1.0-rc.6-linux-x64.AppImage`
- `dist/DeepSeek-Harness-0.1.0-rc.6-linux-x64.deb`

## 同时打两种

```
powershell -ExecutionPolicy Bypass -File desktop-build/assemble.ps1 -Target all
```

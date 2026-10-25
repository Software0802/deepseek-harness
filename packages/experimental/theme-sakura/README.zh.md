---
description: "樱花主题组合包：在 Web GUI 的浅色与深色配色之上，应用樱花粉与薰衣草紫配色和更圆润的圆角。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-theme-sakura

[English](README.md) | 中文

## 概述

这个可选组合包为桌面端与 Web GUI 换上柔和的樱花配色：浅色模式为樱花白底面与梅紫文字，深色模式为薰衣草夜色，焦点环、链接与高亮使用樱花粉强调色，圆角也略微加大。它跟随用户的浅色、深色或跟随系统外观设置；关闭组合包后立即恢复内置配色。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

构建并打包本包，然后在桌面端的**插件**页安装压缩包：

```sh
pnpm install
pnpm run build:artifacts
cd packages/experimental/theme-sakura && pnpm pack
```

在桌面端打开**插件**，点击**添加插件**旁的箭头，选择**安装第三方插件**，输入 `.tgz` 文件的绝对路径。安装完成后选择**立即启用**。组合包以**樱花主题**出现在**已安装插件**下，开关即可启用或关闭配色。在源码 checkout 中，`dsh plugin --profile web add <.tgz 路径>` 会把它安装进 Web profile。

配色不改变字体。想要更圆润的观感，可以安装 Zen Maru Gothic 或 M PLUS Rounded 1c 等圆体，并在**设置 → 通用 → 更多字体设置**中填入字体名。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>维护者细节 — 点击展开</summary>

本包同时是组合包和浏览器插件：`cordis.patch.yml` 插入一条以包名命名的行，`dsh.client` 在这一行上挂载 [`src/client/index.ts`](src/client/index.ts)。客户端入口在 `ctx.effect()` 中调用一次 `ctx.theme.overrideTokens()`，因此覆盖层与该行同生共死。[`palette.ts`](src/client/palette.ts) 逐级替换 [ui-theme](../../client/ui-theme/README.zh.md) 别名 token 所引用的两条静态色阶（`--dsw-static-neutral-bluish-*` 与 `--dsw-static-deepseek-*`），浅色与深色分别取值；并补上基础样式表写成字面颜色的别名（边框、悬停填充、菜单表面、气泡），以及比色阶需要更高对比度的链接颜色。圆角尺度在两种配色下使用相同的覆盖值。测试保证每条中性色阶从浅到深有序，正文与基础背景的对比度高于 7:1，链接高于 4.5:1。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [ui-theme](../../client/ui-theme/README.zh.md) — 本组合包使用的 token 样式表与覆盖层 API。
- [打包与安装插件](../../../docs/user/develop/basic/publish.zh.md) — 组合包 manifest 与 profile 安装。

-----

<a id="model-experience"></a>
## 模型体验

None, as 配色只改变浏览器样式，从不进入模型请求。

#### KV 缓存影响

无。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 配色覆盖的是 ui-theme 当前声明的静态色阶；基础样式表日后新增的色阶级别在本配色补上之前保持内置颜色。
- 产品图标与字体不变。

-----

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者细节 — 点击展开</summary>

无。

</details>

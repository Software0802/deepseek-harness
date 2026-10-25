---
description: "樱花二次元主题组合包：为 Web GUI 的浅色与深色模式提供四套角色配色、对话区立绘、侧栏贴纸、花瓣飘落和设置项。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-theme-sakura

[English](README.md) | 中文

## 概述

这个可选组合包把桌面端与 Web GUI 变成二次元主题。四套角色预设（02、爱蜜莉雅、樱岛麻衣、亚丝娜）分别为浅色与深色模式重新调配全部底面、文字与强调色，在对话区后方放置渐隐的立绘，在侧栏加一张看板娘贴纸，并让花瓣飘过窗口。标题使用强调色渐变，输入框变为毛玻璃。在**设置 → 通用 → 二次元主题**中选择角色，并开关立绘、贴纸和花瓣；关闭组合包后立即恢复内置外观。

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

在桌面端打开**插件**，点击**添加插件**旁的箭头，选择**安装第三方插件**，输入 `.tgz` 文件的绝对路径。安装完成后选择**立即启用**。组合包以**樱花主题**出现在**已安装插件**下，开关即可启用或关闭整个主题。在**设置 → 通用 → 二次元主题**中选择角色与装饰；选择按浏览器 profile 保存。在源码 checkout 中，`dsh plugin --profile web add <.tgz 路径>` 会把它安装进 Web profile。

配色不改变字体。想要更圆润的观感，可以安装 Zen Maru Gothic 或 M PLUS Rounded 1c 等圆体，并在**设置 → 通用 → 更多字体设置**中填入字体名。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>维护者细节 — 点击展开</summary>

本包同时是组合包和浏览器插件：`cordis.patch.yml` 插入一条以包名命名的行，`dsh.client` 在这一行上挂载 [`src/client/index.ts`](src/client/index.ts)。所有效果都通过 `ctx.effect()` 注册，因此主题与该行同生共死。

- [`presets.ts`](src/client/presets.ts) 按内置明度曲线、以各角色的色相与彩度重新生成 [ui-theme](../../client/ui-theme/README.zh.md) 别名 token 所引用的两条静态色阶（`--dsw-static-neutral-bluish-*` 与 `--dsw-static-deepseek-*`），OKLCH 换算在 [`color.ts`](src/client/color.ts) 中。它还覆盖基础样式表写成字面颜色的别名、圆角尺度，以及按配色携带立绘与贴纸 URL 和装饰颜色的 `--sakura-*` 变量。覆盖层通过 `ctx.theme.overrideTokens()` 应用；切换角色时以同一 source 重新应用，替换上一层。
- [`decor.css`](src/client/decor.css) 把光晕与立绘画成 `[data-conversation-region=chat]` 的伪元素，在侧栏列上绘制渐变、樱花枝与贴纸，并处理首页标题渐变和毛玻璃输入框。它以 `body[data-sakura]` 加每项已启用装饰的属性为条件，通过 data 属性和 CSS module 类名的可读后缀匹配宿主元素。
- [`petals.ts`](src/client/petals.ts) 运行一个固定定位、可点穿的 canvas，上面有 14 片花瓣；文档隐藏时暂停，`prefers-reduced-motion: reduce` 下不启动。
- [`SakuraRow.tsx`](src/client/SakuraRow.tsx) 是设置项（order 12，在字体设置之后）。[`preferences.ts`](src/client/preferences.ts) 把选择保存在 `localStorage` 的 `dsh-theme-sakura:v1` 下，缺失或无效的字段回落到默认值（02，全部开启）。

测试保证每套预设的中性色阶从浅到深有序，正文与基础背景的对比度高于 7:1、链接高于 4.5:1，并覆盖偏好、花瓣层与设置项的生命周期。

角色配色参考 [Doki Theme](https://github.com/doki-theme/doki-master-theme) 的定义，`src/client/assets/` 下的立绘与贴纸取自 [doki-theme-assets](https://github.com/doki-theme/doki-theme-assets)，经裁剪并转为 WebP；樱花枝为原创。角色版权归原权利人所有。Doki Theme 以 MIT 许可证发布：

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
## 进一步探索

- [ui-theme](../../client/ui-theme/README.zh.md) — 本组合包使用的 token 样式表与覆盖层 API。
- [打包与安装插件](../../../docs/user/develop/basic/publish.zh.md) — 组合包 manifest 与 profile 安装。

-----

<a id="model-experience"></a>
## 模型体验

None, as 主题只改变浏览器样式，从不进入模型请求。

#### KV 缓存影响

无。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 预设覆盖的是 ui-theme 当前声明的静态色阶；基础样式表日后新增的色阶级别在预设补上之前保持内置颜色。
- `decor.css` 通过 CSS module 类名后缀（`_sidebarCol`、`_root`、`_titleGroup`）匹配侧栏列、侧栏面板与首页标题，通过 `_primary` 匹配发送按钮；这些类名改名后对应装饰失效，但配色不受影响。
- 花瓣层位于页面上方且可点穿；觉得干扰时可在设置中关闭。
- 偏好按浏览器 profile 保存，不在设备间同步。
- 产品图标与字体不变。

-----

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者细节 — 点击展开</summary>

无。

</details>

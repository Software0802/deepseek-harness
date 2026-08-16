# Agent Note: Desktop vision on Grok 4.6 and per-model reasoning levels

Status: implemented

[English](2026-08-17-desktop-vision-and-per-model-reasoning.md) | 中文

## Problem

第三方 Desktop 壳把视觉增强接到阿里云百炼 `qwen3.8-max`，客户端调用 `api.vision.status` 时 Host 的 ApiProxy 没有 `vision` 域，设置行在 `undefined.status` 上崩溃。作曲器推理挡位把 Grok 4.6 画成 Off / Low / Medium / High / Max，但 Grok 4.6 的线上词汇以 `xhigh` 为顶档。如果在全局挡位表里用 `xhigh` 替换 `max`，仍声明 `max` 的模型（DeepSeek 以及任何手写 `max` 映射）会丢掉 Max。壳子还渲染了本产品不需要的第三方「赋范空间出品」徽标。

## Decision

视觉增强是 `@deepseek-ai/dsh-host-apiproxy` 上的 Host 能力：`installVisionEnhancement` 注册 `vision-enhancement` 设置段、`vision_analyze` 工具、一份 skill，以及面向纯文本模型的图片桥。`ApiProxy.vision` 暴露 `status`、`test` 和 `enable`。默认提供方是 xAI `grok-4.6`，凭证与对话路由相同的 `XAI_API_KEY`；OpenRouter 仍是第二个提供方，模型 id 可改。缓存的观察结果是仅日志的 `vision/observation` 会话事件，后续步骤可以复用描述。`KNOWN_SESSION_EVENT_TYPES` 包含该类型。

Desktop 个性化客户端读取 `api.vision`；方法缺失时给出 Host 未接入的错误，而不再解引用 `undefined`。它不再挂载出品徽标。

可选推理挡位按模型保留。模型的 `reasoningEfforts` 字典成为该模型的 `thinkingLevelMap`；未声明的键钉成 `null`。适配器为每个规范 pi-ai id（`off` … `xhigh` … `max`）提供标签，但只提供 `getSupportedThinkingLevels(model)`。作曲器 `ModelSelect` 渲染 Host 列表。因此 Grok 4.6 声明 `off` / `low` / `medium` / `high` / `xhigh` 且不声明 `max`；声明 `max` 的兄弟模型仍然提供 Max。

`desktop-studio/build-desktop.ps1` 把 `dsh-session`、`dsh-llm-pi-ai`、`dsh-host-apiproxy` 和 `dsh-client-connection` 打进已安装的 Desktop，使 Host 与浏览器共享 vision 方法和 Grok 4.6 挡位表。

## Alternatives considered

**把作曲器挡位写死为 Off / Low / Medium / High / xHigh。** 这会让 DeepSeek 以及所有映射仍含 `max` 的模型丢掉 Max。

**在适配器里全局把 `max` 映射成 `xhigh`。** 这两个 id 是独立的 pi-ai 键，默认规则也不同（缺省的 `max`/`xhigh` 表示不支持；缺省的基础档表示支持）。全局别名会在真正拥有 `max` 的模型上发出错误的线上值。

**把视觉增强只留在 Desktop 客户端插件里。** 崩溃原因是 fork 覆盖 ApiProxy 后 `api.vision === undefined`。status、test、enable、工具和图片桥必须落在拥有凭证、设置和会话追加的 Host 上。

**保留第三方出品浮层，只改文案。** 产品要求是去掉该徽标，而不是换皮。

## Consequences

打开设置不再在 vision status 上抛错。开启视觉增强使用 xAI Grok 4.6 与 `XAI_API_KEY`。Grok 4.6 的挡位行是 Off / Low / Medium / High / xHigh；声明 `max` 的模型仍显示 Max。本构建会记录 `vision/observation` 的会话仍可加载，因为该类型在生成的已知事件集合中。运行 `build-desktop.ps1` 后必须重启 Desktop，打过补丁的 Host 与客户端包才会加载。

## Testing

`packages/llm/llm-pi-ai/tests/adapter.spec.ts` 固定同一路由上两个模型分别提供 `max` 与 `xhigh`。`catalog.spec.ts` 固定 Grok 4.6 的映射（设置 `xhigh`、`max` 为 null）以及仍提供 `max` 的兄弟模型。ApiProxy 的 client-handler 与 fetch-carrier 桩包含 `vision` 域，以保持 Host 类型检查闭合。

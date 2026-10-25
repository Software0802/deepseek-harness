---
description: "vflow 副手工作流 skill 的随包 skill 提供方。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-vflow-skills

[English](README.md) | 中文

## 概述

添加 vflow skill 包后，每个 agent 都能使用本包随附的副手工作守则和 V 字工作流 skill。本包在自己的 `skills/` 目录上挂载独立的文件系统 skill 提供方，因此项目和用户 skill 的发现方式不变，同名时项目和用户 skill 优先。它是 vflow 家族的第一个包；vflow 为 Harness 带来单一副手 agent、委派工人和带闸门的 V 字工作流。

## 目录

- [使用本包](#use-this-package)
- [了解实现](#understand-the-implementation)
- [深入探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与待办工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在 GUI 插件管理器中开启 **vflow 技能包**，或在显式组合中把插件挂载到 skill 注册表之后。agent 要加载 skill，还需要挂载 `dsh-tool-skill` 这类面向模型的 skill 工具。

```yaml
- name: '@deepseek-ai/dsh-skill'
- name: '@deepseek-ai/dsh-experimental-vflow-skills'
```

| 字段 | 默认值 | 含义 |
|---|---|---|
| `providerName` | `vflow` | 注册到 `ctx.skills` 的唯一提供方名称 |

当前随附 `vflow-first-mate`：第一个 agent 只拆分工作、把改动委派给工人、核对证据，并在合并、推送以及写入工单或仓库前询问用户。

-----

<a id="understand-the-implementation"></a>
## 了解实现

<details>
<summary>实现细节——点击展开</summary>

[`src/index.ts`](src/index.ts) 根据模块位置解析 `VFLOW_SKILL_DIR`，并以子插件方式挂载 [`dsh-skill-filesystem`](../../skill/skill-filesystem/README.zh.md)：`includeDefaultRoots: false`，`bundledSkillDir` 为该目录，并关闭监视，因为随附文件只随包版本变化。释放本插件会释放子提供方并移除其目录。skill 文件格式和 frontmatter 规则沿用文件系统提供方。

</details>

-----

<a id="further-exploration"></a>
## 深入探索

- [文件系统 skill 提供方](../../skill/skill-filesystem/README.zh.md)——skill 格式、优先级与 frontmatter 字段。
- [skill 家族](../../skill/README.zh.md)——注册表、提供方与面向模型的 skill 工具。

-----

<a id="model-experience"></a>
## 模型体验

### skill 目录

#### 模型看到的内容

每个随附 skill 以名称和描述出现在 skill 目录中，例如 `vflow-first-mate`；只有 agent 用 skill 工具加载时，正文才进入历史。

#### Token 影响

每个随附 skill 在携带目录的请求中增加一条目录条目。加载 skill 会把完整正文追加到普通工具历史。

#### KV Cache 影响

目录只随包版本变化，因此保留已有的缓存前缀。加载的正文追加在已有历史之后。

## 已知限制与待办工作

<a id="known-limitations-and-deferred-work"></a>

- **工作流 skill 待加入**——V 字工作流 skill 需先完成客户与公司信息的脱敏审查再加入。
- **守则只是指引**——副手守则是模型指令；仓库与工单写入的闸门强制由 vflow 工作流引擎提供。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

无。

</details>

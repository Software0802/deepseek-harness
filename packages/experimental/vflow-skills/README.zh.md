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

在 GUI 插件管理器中开启 **日系开发工作流**，或在显式组合中把插件挂载到 skill 注册表之后。agent 要加载 skill，还需要挂载 `dsh-tool-skill` 这类面向模型的 skill 工具。

```yaml
- name: '@deepseek-ai/dsh-skill'
- name: '@deepseek-ai/dsh-experimental-vflow-skills'
```

| 字段 | 默认值 | 含义 |
|---|---|---|
| `providerName` | `vflow` | 注册到 `ctx.skills` 的唯一提供方名称 |
| `teamSettings.source` | 空 | 已发布团队设置文件的 `http(s)://` 地址或绝对路径 |
| `teamSettings.stateFile` | 组合包中为 `~/.dsh/vflow/team-settings.json` | 已采用副本的绝对路径 |
| `teamSettings.fetchTimeoutMs` | `10000` | 单次获取来源的时间上限 |
| `accounts.probeTimeoutMs` | `10000` | 单次连接测试的时间上限 |

### 团队设置

项目名、票号前缀、文档规范、台架资源和执行者等公司取值放在一个 JSON 团队设置文件里，不放进本包。把文件发布在局域网主机上（例如团队的堡垒机），再把 `teamSettings.source` 指向它。`ctx.vflowTeamSettings` 启动时读取已采用副本并获取来源：第一个有效版本直接采用；之后字节不同的版本保持 `pending`，直到 `accept(sha256)` 指明用户审阅过的版本。来源不可达时继续使用已采用副本，状态中带 `sourceError`。

该文件从不保存机密：文档中任何位置出现类似密码、token 或 secret 的键都会被拒绝，并给出该键的 JSON 路径。连接器 id 是小写标识符，例如 `tracker`。

### 连接器账号

每位用户为已采用团队设置中的每个连接器保存自己的登录信息。`ctx.vflowAccounts` 把它作为 grant 记录 `vflow/<连接器 id>` 存进本机凭据库，团队设置文件和堡垒机都接触不到。`list()` 返回每个连接器是否已保存账号以及登录名，从不返回机密。`test(connectorId)` 用 HTTP Basic 认证发送一次只读请求，结果为 `ok`、`unauthorized`（401 或 403）、`unexpected-status`、`unreachable`、`not-configured` 或 `unsupported`：

| 连接器类型 | 测试请求 |
|---|---|
| `redmine` | `GET <url>/users/current.json` |
| `jira` | `GET <url>/rest/api/2/myself` |
| `gerrit` | `GET <url>/a/accounts/self` |
| `jenkins` | `GET <url>/me/api/json` |
| `svn` | `GET <url>` |

`feishu`、`wiki` 以及 `ssh://` 等非 HTTP 地址报告 `unsupported`。请求不跟随重定向，因此跳转到登录页会报告 `unexpected-status`。

当前随附 `vflow-first-mate`：第一个 agent 只拆分工作、把改动委派给工人、核对证据，并在合并、推送以及写入工单或仓库前询问用户。

-----

<a id="understand-the-implementation"></a>
## 了解实现

<details>
<summary>实现细节——点击展开</summary>

[`src/index.ts`](src/index.ts) 根据模块位置解析 `VFLOW_SKILL_DIR`，并以子插件方式挂载 [`dsh-skill-filesystem`](../../skill/skill-filesystem/README.zh.md)：`includeDefaultRoots: false`，`bundledSkillDir` 为该目录，并关闭监视，因为随附文件只随包版本变化。释放本插件会释放子提供方并移除其目录。skill 文件格式和 frontmatter 规则沿用文件系统提供方。

[`src/team-settings.ts`](src/team-settings.ts) 解析文档、拒绝类似机密的键、校验 schema 和 `defaultReviewer` 执行者引用，并对原文计算哈希。[`src/team-settings-service.ts`](src/team-settings-service.ts) 用 `writeFileAtomic`（权限 `0600`）逐字节写入采用的原文，因此已采用副本与已发布文件的 SHA-256 相同。已采用副本不可读或无效、或首次获取失败时，服务进入 `failed`，不会退回默认值。

[`src/accounts.ts`](src/accounts.ts) 每次调用都从已采用的团队设置读取连接器列表，因此接受设置更新后无需重启即可生效。读取已存记录时会校验；其他类型或字段为空的记录视为未配置。连接测试把调用方的 signal 与 `probeTimeoutMs` 合并：调用方中止会重新抛出，网络错误和超时报告 `unreachable`。

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
- **只支持 Basic 认证**——Jira Cloud token、Gerrit SSH、飞书和 wiki 连接器还没有连接测试。
- **没有定时检查更新**——只在启动时和调用 `refresh()` 时检查来源；调用它的设置页随安装向导一起提供。
- **守则只是指引**——副手守则是模型指令；仓库与工单写入的闸门强制由 vflow 工作流引擎提供。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

无。

</details>

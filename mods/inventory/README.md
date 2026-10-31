# inventory — 插件清单与多 PC 同步

这里记录当前桌面客户端（`desktop` profile）的插件与配置快照，用于以后在新 PC 上一键还原。

## 文件

| 文件 | 用途 |
|---|---|
| `plugins.json` | 机器可读清单：插件 id、安装 spec、版本、来源、启用状态、分类、用途、license、`require.asset` 检查结果、当前完整的 bundle 列表 |
| `profile.patch.yml` | 当前 profile 的 `cordis.patch.yml` 快照（各插件配置、主题口味、权限预设等） |
| `sync.mjs` | 同步脚本：默认 dry-run，`--apply` 才写；安装缺失插件、写 bundle 列表、覆盖 patch（都会先备份） |

清单是**快照**：以后增删插件后重新生成（说一声即可，或按同样字段手工维护）。

## 当前插件（8 个，全部启用）

- **features**
  - `@xmanrui/dsh-im` 5.6.0 — IM 机器人接入（飞书/微信/企微/钉钉/QQ/Slack/Telegram/Discord/WhatsApp/Matrix）
  - `dsh-zen-remote` 2.2.8 — 手机/另一台电脑远程使用 DSH（网关 + PWA + Web Push + 远程会话）
  - `dsh-plugins-store` 0.1.4 — DSH 插件商店
  - `@local/agent-hub` 0.3.0 — 多 CLI 子代理供应商（本地 link 包）
  - `@deepseek-ai/dsh-subagent-claude-code` 0.2.1-rc.3 — Claude Code 子代理
- **ui**
  - `@nonamelego/dsh-catppuccin` 0.6.4 — Catppuccin 主题（当前 Frappé + 玻璃质感）
  - `@smalltailqwq/dsh-client-ui-skin-maid-atelier` 0.1.9 — 鲸鱼娘皮肤（当前被托管禁用）
  - `@smalltailqwq/dsh-client-ui-skin-orca-link` 0.1.9 — 鲸鱼娘皮肤（当前被托管禁用）

另有 14 个客户端自带 bundle 处于启用状态，记录在 `plugins.json` 的 `builtinBundles` 与 `bundles` 里。

## 新 PC 同步步骤

1. 新 PC 安装**相同版本**的 DeepSeek Harness（当前 0.2.1-rc.3），先启动一次让 `desktop` profile 初始化，然后完全退出（Cmd+Q）。
2. 把本仓库（或至少 `mods/inventory/`）拷到新 PC。
3. 预览：`node mods/inventory/sync.mjs`。
4. 执行：`node mods/inventory/sync.mjs --apply`。
5. 启动桌面客户端，设置 → 插件 里核对；需要登录的插件（IM、远程配对、子代理账号）各自再走一次登录。

### 注意

- `@local/agent-hub` 是 `link:` 依赖，指向本机工作区路径；新 PC 需要自己准备 `agent-hub` 目录并手动 `dsh plugin --profile desktop add "link:<路径>"`，脚本会跳过并提示。
- `profile.patch.yml` 会**覆盖**目标机的 profile patch（脚本先备份），因此目标机上已有的个性设置会被替换成这份快照。
- 皮肤两个包仍在，但皮肤管理器和其托管配置由 `dsh-skin` 管理；如果之后决定不再用皮肤，删掉这两个包并在 `plugins.json`/patch 快照里去掉对应项。
- 清单里的 `require.asset` 字段记录客户端模块加载器兼容性检查结果（0 表示兼容 0.2.1-rc.3）。

## 本地工具（localTools）

`plugins.json` 的 `localTools` 段记录**非 DSH 插件**的本地工具——它们是独立 CLI / 库，不装入桌面客户端 profile，但属于本仓库维护的工具链。

- `backpass` — `mods/features/backpass/`，kunchenguid/backpass 的 fork（含 DSH adapter）。安装/使用见 `mods/features/backpass/README.dsh.md`。

## 环境依赖（environment）

`plugins.json` 的 `environment` 段是新 PC 的可执行清单。它分两块：

- **`notes`** — 自由文本的机器事实（比如"homebrew node 坏了，用 DSH bundled node"）
- **`checks`** — 声明式检查项数组，`mods/setup/check-env.mjs` 逐条执行

### 加一个新的环境依赖

往 `environment.checks` push 一条 spec 即可，不用改 `check-env.mjs`：

```jsonc
{
  "id": "my-tool",                    // 唯一 id，aggregate 的 anyOf 引用它
  "name": "my-tool",                  // 显示名
  "kind": "command",                  // command | commandOrLocal | path | aggregate
  "command": "my-tool --version",     // 要跑的命令
  "versionGte": "1.2",                // 可选：最低版本
  "remedy": "brew install my-tool"    // 失败时打印的补救命令
}
```

kind 一览：
- `command` — 命令能跑通；`prefer` 可指定优先二进制路径
- `commandOrLocal` — PATH 有，或仓库相对路径（`localPath`）存在
- `path` — 文件/目录存在（支持 `~`、绝对、仓库相对）
- `aggregate` — `{ "anyOf": ["other-check-id", ...] }` 任一过即过（用于"至少一个 CLI 登录"这类）

`check-env.mjs` 按数组顺序执行，`aggregate` 永远最后算。

# mods — 自定义插件与 skill 库

这里放**我们自己的** DeepSeek Harness 内容（面向桌面客户端，见外层项目规则）。

## 新 PC 环境搭建（给 AI）

**`SETUP.md`** — 完整的 step-by-step 指南，把仓库丢给任意 AI agent 后让它照做即可：装 App → 系统依赖 → `sync.mjs` 同步 profile → backpass 依赖 → `check-env.mjs` 验证全绿。
**`setup/check-env.mjs`** — 零依赖自检脚本，输出 ✓/✗ 清单 + 每项的补救命令。

## 目录结构

| 目录 | 放什么 |
|---|---|
| `features/` | **功能插件**：Host 侧能力扩展（新工具、Service、provider、外部项目集成）。规划中的 herdr-project/firstmate 集成放这里。 |
| `work/` | **工作插件**：面向具体工作流 / 办公场景的插件（任务、文档、通知、第三方协作等），可以同时含 Host 与 Client。 |
| `ui/` | **UI 插件**：主要贡献桌面客户端界面（页面、面板、装饰、设置行），业务能力很薄或没有独立 Host 逻辑。 |
| `skills/` | **skill 库**：可复用的 skill 定义（`skills/<name>/SKILL.md` 及附属资源），不放运行时代码插件。 |
| `inventory/` | **插件清单与多 PC 同步**：已安装插件、启用状态、安装 spec、profile 配置快照、环境依赖清单、同步脚本。见 [inventory/README.md](inventory/README.md)。 |
| `setup/` | **新 PC 自检脚本**：`check-env.mjs` 输出环境就绪清单，对照 `inventory/plugins.json` 的 `environment` 段。 |

- 每个插件一个目录：`<分类>/<kebab-case-name>/`。
- 包名建议 `@local/<name>`（或 `@mods/<name>`），不要占用 `@deepseek-ai/*`。
- 分类只影响组织方式，不影响安装；安装时指向具体插件目录或它的 tarball 即可。

## 插件清单与多 PC 同步

`inventory/` 记录当前桌面客户端的插件与配置，用于以后在新 PC 上一键还原：

- `inventory/plugins.json` — 插件 id / 安装 spec / 版本 / 启用状态 / 分类 / 用途，以及完整 bundle 列表
- `inventory/profile.patch.yml` — profile 配置快照（各插件配置与用户设置）
- `inventory/sync.mjs` — `node mods/inventory/sync.mjs` 预览；加 `--apply` 才写入（先备份）

细节见 [inventory/README.md](inventory/README.md)。

## 边界

- `apps/`、`packages/`、`docs/`、`website/` 等上游目录**保持原样**，不要修改，这样随时能干净地同步上游。
- 所有自定义内容只放在 `mods/` 下；`mods/` 已写入 `.git/info/exclude`，不污染 `git status`。

## 同步上游

```sh
git fetch upstream
git merge --ff-only upstream/master      # 等价于 git pull --ff-only upstream master
```

- `origin` = 你的 fork（Software0802/deepseek-harness），`upstream` = 官方 deepseek-ai/deepseek-harness。
- 因为上游目录没有本地改动，正常情况都能 fast-forward。

## 如果要把 mods 纳入 fork 的版本管理

默认 `mods/` 被本地排除。想提交到自己的 fork 时：

```sh
# 删除 .git/info/exclude 里最后一行 "mods/"
git add -f mods
git commit -m "feat(mods): add custom plugins"
git push origin master
```

之后同步上游改用 `git pull --rebase upstream master`（或 merge），因为 master 上会有你自己的提交。

## 插件约定

- 每个插件包含 `package.json`、`cordis.patch.yml`、Host 入口（`lib/index.js` 或 `index.js`）与可选 Client 入口（`dsh.client`）。
- 不改 `package.json` / `pnpm-workspace.yaml` 等上游文件；独立插件按本地包或 tarball 安装到桌面客户端 profile（`~/.dsh/profiles/desktop`）。
- 只使用当前桌面客户端所带 dsh 运行时已有的 Host/Client API；安装后必须在桌面客户端重启验证。

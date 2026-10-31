# SETUP — 新 PC 环境搭建（给 AI 执行）

你是 AI agent。读完本文，按顺序执行每一步，最后跑 `check-env.mjs` 验证全绿即完成。**不要跳步，不要假设已有状态**——每一步都先检查，缺什么装什么。

## 约束

- 平台：macOS（Apple Silicon）。其他平台步骤不同，遇到就停下来报告。
- 所有路径相对本仓库根目录 `deepseek-harness/`。
- 需要 sudo 或网络下载的步骤标了 [interactive]，你应询问用户而不是猜测密码。

## Step 0 — 装 DeepSeek Harness 桌面客户端

```sh
# 下载并安装 DeepSeek Harness.app 到 /Applications
# （官网或内部渠道获取；当前版本 0.2.1-rc.3）
```

验证：`ls /Applications/DeepSeek Harness.app` 存在。启动一次让 `~/.dsh/profiles/desktop` 初始化，然后 **Cmd+Q 完全退出**。

## Step 1 — 系统依赖

```sh
brew install zstd          # backpass 需要
brew install git node pnpm # 基础工具链（若缺）
```

- **不要依赖 homebrew node** —— 它可能缺动态库（本机已知 simdjson 问题）。统一用 DSH 自带 node：
  `export PATH="$HOME/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/node/bin:$PATH"`
  验证 `node --version` ≥ 22.5。

## Step 2 — 同步 DSH profile

```sh
cd <本仓库>
node mods/inventory/sync.mjs          # 预览
node mods/inventory/sync.mjs --apply  # 写入（装缺失插件 + 覆盖 cordis.patch.yml）
```

- `sync.mjs` 会跳过 `link:` 依赖的 `@local/agent-hub`——那是本机路径，需要用户自己准备目录后手动 `dsh plugin --profile desktop add "link:<路径>"`。
- 写入前会自动备份原 package.json 和 cordis.patch.yml。

## Step 3 — 装 backpass 及依赖

```sh
cd mods/features/backpass
pnpm install                          # 装 eslint/prettier/typescript 开发依赖
# backpass 本体零运行时依赖，装完即可用
```

```sh
# acpx: backpass 调模型的桥（必需）
# 全局装：npm i -g acpx   或   仓库本地：cd ../../../.tools && npm i acpx
acpx --version                        # 验证 ≥ 0.21

# lavish-axi: apply 的浏览器 review UI（可选但推荐）
# 全局：npm i -g lavish-axi   或   .tools 本地
lavish-axi --version
```

- `acpx` 需要至少一个已登录的 agent harness 才能跑分析。检查 `claude`/`codex`/`opencode`/`grok`/`cursor-agent`/`hermes` 哪个装了且登录过——优先 `claude`（本机已验证）。
- 如果都没有：让用户先装一个（`claude` 最成熟）并完成一次交互登录。

## Step 4 — 验证（CI 级）

```sh
cd <本仓库>
node mods/setup/check-env.mjs         # 环境清单检查，应全绿
cd mods/features/backpass && pnpm run check   # backpass 自身测试（1031 应全过）
```

`check-env.mjs` 输出每一项 ✓/✗；任何 ✗ 都是 setup 未完成。

### 扩展这个清单

这个 checklist 是**声明式驱动**的——`mods/inventory/plugins.json` 的 `environment.checks` 数组。以后加新工具/依赖：

1. 往 `checks` 数组 push 一条 spec（kind: `command`/`commandOrLocal`/`path`/`aggregate`），写好 `remedy`。
2. `check-env.mjs` 自动执行，无需改脚本。

schema 见 `mods/inventory/README.md` 的"环境依赖"节。

## Step 5 — 让 backpass 开始干活

在某个要用 AGENTS.md 的 repo 里：

```sh
cd <目标repo>
BACKPASS=<本仓库>/mods/features/backpass/bin/backpass.js
node $BACKPASS init    # 写 .backpassrc.json，确认 discovery.harnesses 含 "dsh"
node $BACKPASS scan    # 应列出 dsh harness 关联的会话（0 条也是正常，说明没积累）
```

## 完成后报告

向用户报告：
1. `check-env.mjs` 输出（应全绿）
2. `pnpm run check` 测试数（应 1031 pass）
3. `backpass scan` 关联到的 transcript 数
4. 哪一步需要人工介入（登录、link: 依赖、App 安装）

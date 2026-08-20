# Agent Note: 仅保留官方提交的 master 与承载 fork 产品的插件分支

Status: implemented

[English](2026-08-20-fork-official-master-and-plugin-branch.md) | 中文

## 问题

本 fork 的 `master` 把三件产品叠在一起：官方 [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 历史、官方 dsh 并不交付的 vendored Electron Desktop，以及 OMP loop、advisor 这类 fork 的 Cordis 插件。一条既要快进官方发行、又要携带 Desktop 与插件的主干，无法保持干净的上游镜像；把插件分支合并进 `master` 会把这种混叠写回去。

Electron Desktop 看起来像「又一个插件」，因为本仓库的规则是一切皆插件，但窗口进程并不是 Cordis 插件：它 spawn `dsh web` 并承载浏览器。把该 shell 当成 `packages/` 下的插件，会把应用宿主藏进插件树。

## 决策

`master` 只包含官方 DeepSeek Harness 提交。同步方式是 fetch `https://github.com/deepseek-ai/deepseek-harness.git` 的 `master`，并在先前 tip 仍带有 fork 提交时，用带 lease 保护的非快进把该历史发布到本 fork 的 `master`。`master` 没有 `desktop-studio/`、没有 `desktop-build/`、没有 `packages/omp/`、没有 `@deepseek-ai/dsh-omp` bundle，也没有 Cursor Cloud 的 `AGENTS.md` 附录。

`cursor/omp-plugin-library-4812` 是 fork 产品与插件研发分支。它承载全部 fork Cordis 插件、对官方包的全部 fork 补丁、Desktop 应用宿主，以及 Cloud VM 说明。刷新方式是把本 fork 的 `master` 合并进插件分支。永远不要把插件分支合并进 `master`。

以 `master` 为 base、以插件分支为 head 的 draft PR（Pull Request）只是 fork 产品相对官方的 diff 视图，不是落地路径。

Desktop 分成两种角色，二者都留在插件分支：

- **应用宿主（不是 Cordis 插件）：** `desktop-studio/main-process/` 是 vendored 的 Electron shell。它启动 `dsh web` 并拥有窗口。`desktop-build/` 是该宿主的安装包元数据。官方 dsh 的宿主仍是 `apps/` 下的 `dsh web` 与 `dsh` CLI（命令行界面）。
- **Cordis / 浏览器插件：** `desktop-studio/plugins/`（`dsh-client-ui-desktop-customization`、`dsh-client-ui-plugin-center`、`dsh-plugin-center-contracts`）仅在 Desktop 宿主导出 `DSH_DESKTOP=1` 时挂载。OMP loop、OMP advisor 和 `@deepseek-ai/dsh-omp` 同属这类工作：默认 `web` / `headless` profile 不叠加的 fork 插件。

当前写在官方包目录里的 fork 编辑（`dsh-llm-pi-ai` 的 Grok 登录、Host vision / Grok 4.6 挡位表，以及把它们拷进安装目录的 Desktop 补丁脚本）留在插件分支。它们不经 `master` 上游化。

## 考虑过的替代方案

**Desktop 留在 `master`，插件分支只放 OMP。** 否决，因为 `master` 仍会把官方 harness 与第三方 Electron 产品混在一起，而这正是本次拆分要去掉的混叠。

**再开第三条 `desktop` 分支。** 在两分支策略下否决。该 shell 是加载 fork Desktop UI 插件的宿主；把宿主和插件拆到不同分支，会迫使每次 Desktop 变更落地两次。

**把 Electron shell 挂成 `packages/` 下的 Cordis 插件。** 否决，因为该 shell 是启动 `dsh web` 的进程，角色与 `apps/` 宿主相同，不是 `cordis.patch.yml` 里的一行。

**评审后再把插件分支合并进 `master`。** 否决，因为那会把 Desktop、OMP 和 Host 补丁写进官方镜像主干。

## 后果

默认 clone 的 `master` 读起来就是官方 dsh（`npx @deepseek-ai/dsh web`，没有 Desktop 树）。日常 fork 工作检出 `cursor/omp-plugin-library-4812`。

一次上游同步分两步：把 `master` 接到官方 `master`，再把 `master` 合并进插件分支。在那次合并之前，插件分支可以落后于官方；本记录不要求在恢复仅含官方提交的 `master` 的同一次变更里完成该合并。

以 `master` 为 base 的 tracking PR 会扩大成完整 fork 增量（Desktop vendor、Host 补丁、OMP）。本决策禁止合并它。

## 相关

- [将 OMP 插件库做成目录加上 loop 与 advisor 插件](../feature/2026-08-20-omp-plugin-library.md)
- [Desktop 上的 Grok 4.6 视觉与按模型推理档位](../feature/2026-08-17-desktop-vision-and-per-model-reasoning.md)
- [Profile 插件组合包](../architecture/2026-08-05-profile-plugin-bundles.md)

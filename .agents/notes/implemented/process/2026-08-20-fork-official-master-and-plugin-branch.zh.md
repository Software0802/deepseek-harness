# Agent Note: 仅保留官方提交的 master 与只做 Web 的插件分支

Status: implemented

[English](2026-08-20-fork-official-master-and-plugin-branch.md) | 中文

## 问题

本 fork 曾把官方 DeepSeek Harness、官方 dsh 并不交付的 vendored Electron Desktop，以及 fork 的 Cordis 插件叠在同一条 `master` 上。那样的主干无法保持上游镜像。把 `master` 和插件分支拆开之后，若仍在插件分支上承载 Desktop，就会挡住合并官方 `dsh web`（0.1.0-rc.8），并把注意力从浏览器产品上拆走。

Electron 窗口进程不是 Cordis 插件：它 spawn `dsh web`。`desktop-studio/plugins/` 下的 Studio UI 包是插件，但只在该宿主导出 `DSH_DESKTOP=1` 时挂载。为了保留这些插件而保留宿主，会让每一次官方同步都变成 Desktop 合并。

## 决策

`master` 只包含官方 DeepSeek Harness 提交。同步方式是 fetch `https://github.com/deepseek-ai/deepseek-harness.git` 的 `master`，并在先前 tip 仍带有 fork 提交时，用带 lease 保护的非快进把该历史发布到本 fork 的 `master`。

`cursor/omp-plugin-library-4812` 是叠在该官方 `master` 上的 fork 插件研发分支。它承载 `@deepseek-ai/dsh-omp`、`@deepseek-ai/dsh-omp-loop`、`@deepseek-ai/dsh-omp-advisor`，以及 Cursor Cloud 的 `AGENTS.md` 说明。运营方用 `dsh plugin --profile <name> add @deepseek-ai/dsh-omp` 把该 bundle 装到 `web` 或 `headless` profile。默认 `web` 和 `headless` profile 不叠加它。刷新方式是把本 fork 的 `master` 合并进该分支。永远不要把插件分支合并进 `master`。

本 fork 不交付 Desktop。插件分支上没有 `desktop-studio/`、`desktop-build/`、Studio UI 插件、Host `vision` 域，也没有对 `dsh-llm-pi-ai` 的 fork Grok 登录补丁。产品宿主是官方 `dsh web`（浏览器）和 `dsh` CLI（命令行界面）。被放弃的 Electron 树留在 `cursor/desktop-client-archive-4812` 供找回；它不是进入 `master` 或插件分支的落地路径。

以 `master` 为 base、以插件分支为 head 的 draft PR（Pull Request）只是 OMP 相对官方的 diff 视图，不是落地路径。

## 考虑过的替代方案

**Desktop 留在插件分支，只从 `master` 拿掉。** 否决，因为只要 Desktop 或 Grok Host 补丁冲突，插件分支就会落后于官方 web 发行，而这正是让 `master` 读不下去的那种混叠。

**删掉 Electron shell 之后，仍把 Grok OAuth 和 Host vision 留在 `dsh web`。** 本次变更否决，因为那些补丁是为 Desktop 设置行和挡位选择器写的，与官方 0.1.0-rc.8 的 `dsh-llm-pi-ai` 冲突，也不是在官方浏览器 UI 上运行 OMP 所必需。以后若要做面向 web 的 Grok 或 vision，应是独立插件或对官方包的变更。

**把 Electron shell 挂成 `packages/` 下的 Cordis 插件。** 否决，因为该 shell 是启动 `dsh web` 的进程，角色与 `apps/` 宿主相同。

**评审后再把插件分支合并进 `master`。** 否决，因为那会把 OMP 写进官方镜像主干。

## 后果

默认 clone 的 `master` 就是官方 dsh。日常 fork 工作检出 `cursor/omp-plugin-library-4812`，运行 `pnpm dsh web` 或 `dsh plugin --profile web add @deepseek-ai/dsh-omp`。

一次上游同步分两步：把 `master` 接到官方 `master`，再把 `master` 合并进插件分支。

若要重新引入 Desktop，需要单独的分支和明确的产品决策；不得通过把 archive 分支合并进 `master` 把它带回来。

## 相关

- [将 OMP 插件库做成目录加上 loop 与 advisor 插件](../feature/2026-08-20-omp-plugin-library.md)
- [Profile 插件组合包](../architecture/2026-08-05-profile-plugin-bundles.md)

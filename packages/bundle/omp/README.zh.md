# `@deepseek-ai/dsh-omp`

[English](README.md) | 中文

覆盖 [`dsh-base`](../base/README.md) 的按需启用 Oh My Pi 插件库组合包。[`cordis.patch.yml`](cordis.patch.yml) 插入 `@deepseek-ai/dsh-omp-loop` 和 `@deepseek-ai/dsh-omp-advisor`。它不会重新挂载 goal、Ralph、plan、skill 或重复工具提醒：那些包已经在 `dsh-base` 中交付，本库通过 `OMP_PLUGIN_CATALOG` 按引用组合它们。

用 `dsh plugin --profile <name> add @deepseek-ai/dsh-omp` 安装进 profile。在部署提供 `provider` 和 `model` 之前，advisor 保持 `enabled: false`。

该目录把 OMP 名称（`goal`、`loop`、`advisor`、`ralph`、`plan`、`skill`、`schedule`、`hooks`、`advisory-repeat`）映射到 `@deepseek-ai/dsh-*` 包，并记录每一行是官方包还是由本库拥有。

## 模型体验

间接地，通过插入的 `omp-loop` 和 `omp-advisor` 行：本组合包自身不贡献模型可见文本。

#### KV Cache 影响

没有直接作用；每条插入行所属的包拥有其影响。

## 已知限制与延后工作

- **按需启用的层** — 默认的 `web` 和 `headless` profile 不会叠放本组合包。
- **不 fork 官方源码** — origin 为 `dsh-official` 的目录行不会被复制进 `packages/omp/`。
- **完成路由前 advisor 保持关闭** — 安装组合包不会消耗审阅 token。

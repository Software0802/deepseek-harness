# omp/ — 将 Oh My Pi 扩展做成 DeepSeek Harness 插件

[English](README.md) | 中文

把 [Oh My Pi](https://github.com/can1357/oh-my-pi) harness 扩展实现为 Cordis 插件的编目与实现。官方 DeepSeek Harness 包已经覆盖 goal、Ralph、plan、skill、schedule 和钩子桥接；本组不复制那些包。loop 与 advisor 没有官方对等实现，因此放在这里。用 `@deepseek-ai/dsh-omp` 安装该组合（[组合包 README](../bundle/omp/README.md)）。

| 包 | 职责 | ctx 键 |
|---|---|---|
| [`omp-loop/`](omp-loop/README.md) | 人类 `/loop` 命令：按次数或时长重复同一提示 | 无 |
| [`omp-advisor/`](omp-advisor/README.md) | 第二个模型的审阅器，在每个已完成轮次后注入通知 | 无 |

从 OMP 名称到 dsh 包的映射（包括按引用组合的官方包）是 [`@deepseek-ai/dsh-omp`](../bundle/omp/README.md) 中的 `OMP_PLUGIN_CATALOG`。

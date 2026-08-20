# omp/ — Oh My Pi extensions as DeepSeek Harness plugins

English | [中文](README.zh.md)

Catalog and implementation of [Oh My Pi](https://github.com/can1357/oh-my-pi) harness extensions as Cordis plugins. Official DeepSeek Harness packages already cover goal, Ralph, plan, skill, schedule, and hook bridges; this group does not copy those packages. Loop and advisor, which have no official equivalent, live here. Install the composition with `@deepseek-ai/dsh-omp` ([bundle README](../bundle/omp/README.md)).

| Package | Role | ctx key |
|---|---|---|
| [`omp-loop/`](omp-loop/README.md) | Human `/loop` command: repeat one prompt for a count or duration | — |
| [`omp-advisor/`](omp-advisor/README.md) | Second-model reviewer that injects a notice after each completed turn | — |

The mapping from OMP names to dsh packages, including official packages composed by reference, is `OMP_PLUGIN_CATALOG` in [`@deepseek-ai/dsh-omp`](../bundle/omp/README.md).

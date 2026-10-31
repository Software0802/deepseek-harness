# backpass (fork with DSH adapter)

[kunchenguid/backpass](https://github.com/kunchenguid/backpass) 的 fork，额外支持 **DeepSeek Harness** 的会话存储。

## 差异

- `src/discovery/adapters/dsh.js` — 新 adapter：读 `~/.dsh/sessions/<munged-cwd>/session-*/session.v4.jsonl.zstd`（zstd JSONL，含 `session` 头 / `user/message` / `assistant/message` / `tool/call` / `tool/result`），按 `cwd` 归属 tier-1，区分 `source.kind == "user"` 的交互式会话
- `src/discovery/index.js` — 注册 `dsh` adapter
- `src/config.js` — `ALL_HARNESSES` 加入 `"dsh"`
- `test/config.test.js` — harness 列表同步

## 使用

```sh
cd <repo>
node <此目录>/bin/backpass.js init    # 首次：写 .backpassrc.json
node <此目录>/bin/backpass.js scan    # 看关联到本 repo 的会话（应列出 dsh harness 的行）
node <此目录>/bin/backpass.js         # 反向传播：分析 → 出 proposal（不写）
node <此目录>/bin/backpass.js apply   # 人工 gate：审 diff + 证据 → 写入 AGENTS.md
```

`.backpassrc.json` 的 `discovery.harnesses` 需包含 `"dsh"`（默认已含全部 harness）。

## 依赖

- Node ≥ 22.5（zstd 用系统 `zstd` 二进制，macOS `brew install zstd`）
- `acpx` + 至少一个已登录的 agent harness（分析/综合模型调用经它走）

## 上游同步

```sh
cd mods/features/backpass
git fetch https://github.com/kunchenguid/backpass.git main
git merge --ff-only FETCH_HEAD   # 若 dsh adapter 未上游合并，此处会冲突，手动保留
```

目标是让 adapter 上游化；在那之前这是一个可维护的下游 patch。

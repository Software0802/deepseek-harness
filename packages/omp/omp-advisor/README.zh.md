# @deepseek-ai/dsh-omp-advisor

[English](README.md) | 中文

第二个模型的审阅器：读取主 agent（智能体）每个已完成轮次并注入通知。审阅请求是旁路的 `ctx.llm.stream` 调用：它不是会话事件。只有注入的通知会在所属会话中对模型可见。通过 Config 搭配更便宜的模型。默认关闭，因此安装组合包不会消耗 token，直到部署提供 `provider` 和 `model`。

这不是 [`dsh-repeat-tool-reminder`](../../guard/repeat-tool-reminder/README.md)；后者在没有第二个模型的情况下注入相同工具调用提醒。

## 配置

```yaml
- id: omp-advisor
  name: '@deepseek-ai/dsh-omp-advisor'
  config:
    enabled: false
    provider: ''
    model: ''
    timeoutMs: 30000
    maxOutputTokens: 256
    maxTranscriptBytes: 8192
    includeSubagents: false
    delivery: inject
    maxInterrupts: 3
```

`enabled: true` 要求非空的 `provider` 和 `model`。整数必须 `>= 1`，但 `maxInterrupts` 可以为 `0`。`timeoutMs` 还必须 `<= 2147483647`。`delivery: inject` 从不唤醒 agent；`delivery: interrupt` 只在本轮尚未出现过通知、且该 agent 的中断上限仍有剩余时，才对 blocker 备注调用 `followup()`。

除非 `includeSubagents` 为 true，否则跳过 header origin 为 `subagent` 的会话。不审阅已中止的轮次。跳过空 transcript（文本记录）。审阅失败会记入日志，不会让主轮次失败。

## 扩展点

插件监听 `reason.kind === 'completed'` 的 `session/event` `turn/end`，然后通过 `Agent.inject()` 或 `Agent.followup()` 投递。它不导入 `dsh-agent-loop`。

## 模型体验

### 注入的 advisor 通知

#### 模型看到的内容

主 agent 收到一条插件通知，文本为 `Advisor <severity>: <note>`，其中 severity 为 `aside`、`concern` 或 `blocker`。

##### Advisor 通知

```markdown
Advisor aside: check the tests
```

#### Token 影响

在已完成轮次产生非空备注之前为零 token。该通知会作为该 agent 的保留历史。`maxOutputTokens` 限制审阅回复；`maxTranscriptBytes` 限制审阅请求。

#### KV Cache 影响

`inject` 只追加。blocker 上的 `interrupt` followup 会在可复用前缀之后再开一轮。

### 审阅旁路请求

#### 模型看到的内容

审阅模型不是会话的主 agent。它收到下面的系统提示，以及一条用户消息，内容是有界的轮次 transcript（`User:` / `Assistant:` 行）。该请求不会写入会话日志。

##### Advisor 系统提示

```markdown
You are a silent reviewer watching one coding-agent turn.
Read the turn transcript and reply with exactly two parts:
SEVERITY: aside | concern | blocker
NOTE: <one short note the main agent should see>
Use aside for a quiet observation, concern for a risk that still lets work continue, and blocker for a hard mistake that should stop the current approach.
Do not call tools. Do not greet. Do not repeat the transcript.
```

#### Token 影响

每个带有非空 transcript 的已完成轮次都会花费一次最多 `maxOutputTokens` 的审阅调用，外加有界 transcript。

#### KV Cache 影响

主会话中没有。审阅调用是单独的请求。

## 已知限制与延后工作

- **旁路审阅不持久** — 重新加载无法重建审阅调用；只有已准入的通知留在日志里。
- **路由前保持关闭** — `enabled` 默认为 false；缺少 provider/model 只在启用时才会响亮失败。
- **备注由模型撰写** — invariant 配套模块为空，因为通知文本不是包自有渲染器的输出。

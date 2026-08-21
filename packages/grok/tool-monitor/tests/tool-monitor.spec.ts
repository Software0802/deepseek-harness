import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import AgentRegistry from '@deepseek-ai/dsh-agent'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { CallId } from '@deepseek-ai/dsh-llm'
import type { UserMessage } from '@deepseek-ai/dsh-llm'
import { JobId } from '@deepseek-ai/dsh-jobs'
import LocalJobRegistry from '@deepseek-ai/dsh-jobs-local'
import { Session, SessionId } from '@deepseek-ai/dsh-session'
import LocalSubprocessRuntime from '@deepseek-ai/dsh-subprocess-local'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import * as ToolJobs from '@deepseek-ai/dsh-tool-jobs'
import * as ToolMonitor from '@deepseek-ai/dsh-tool-monitor'
import { MONITOR_PLUGIN, parseMonitorLine, renderMonitorLine } from '@deepseek-ai/dsh-tool-monitor'

const testToolSignal = new AbortController().signal
const LINE = 'GROK_MONITOR_DISTINCT_LINE'

async function waitUntil(label: string, check: () => boolean, timeoutMs = 8_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (check()) return
    await new Promise(resolve => setTimeout(resolve, 25))
  }
  throw new Error(`timed out waiting for ${label}`)
}

async function setup(): Promise<{
  ctx: Context
  agent: Agent
  followups: UserMessage[]
}> {
  const ctx = new Context()
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(LocalJobRegistry)
  await ctx.plugin(ToolJobs)
  await ctx.plugin(LocalSubprocessRuntime)
  await ctx.plugin(ToolMonitor)
  const followups: UserMessage[] = []
  const scopeFiber = ctx.plugin(() => {})
  const session = Session.create(SessionId(`monitor-${String(Math.random())}`))
  const agent = {
    id: session.id,
    options: {},
    session,
    ctx: scopeFiber.ctx,
    status: 'idle',
    inject: () => {},
    followup(message: UserMessage) {
      followups.push(message)
      session.append('user/message', message, { surfaceOp: 'append' })
    },
    steer: () => {},
    send: () => {},
    cancel() {},
    runMaintenance: (task: (signal: AbortSignal) => Promise<void>) => task(new AbortController().signal),
    whenIdle: () => Promise.resolve(),
  } as unknown as Agent
  ctx.agents.register(agent)
  return { ctx, agent, followups }
}

let callCounter = 0
function call(ctx: Context, args: unknown, agent: Agent, signal: AbortSignal = testToolSignal) {
  return ctx.tools.execute({
    signal,
    callId: CallId(`call-${++callCounter}`),
    name: 'monitor',
    arguments: args,
    agent,
  })
}

function textOf(message: UserMessage): string {
  return message.content
    .filter((block): block is Extract<typeof block, { type: 'text' }> => block.type === 'text')
    .map(block => block.text)
    .join('\n')
}

describe('monitor prompt renderer', () => {
  it('round-trips through parseMonitorLine', () => {
    const content = renderMonitorLine('hello')
    expect(parseMonitorLine(content)).toBe('hello')
    expect(parseMonitorLine([])).toBeUndefined()
    expect(parseMonitorLine([{ type: 'text', text: 'not monitor' }])).toBeUndefined()
  })
})

describe('dsh-tool-monitor', () => {
  it('delivers each stdout line as a plugin-sourced session follow-up and ends on exit', async () => {
    const { ctx, agent, followups } = await setup()
    expect('default' in ToolMonitor).toBe(false)
    expect(ToolMonitor.name).toBe(MONITOR_PLUGIN)
    const result = await call(ctx, {
      command: process.execPath,
      args: ['-e', `console.log(${JSON.stringify(LINE)})`],
      description: 'print one distinct line',
    }, agent)
    expect(result.isError).toBe(false)
    if (result.isError) throw new Error('expected monitor success')
    const jobId = (result.value as { jobId: string }).jobId
    expect(jobId.startsWith('monitor-')).toBe(true)

    await waitUntil('stdout follow-up', () => followups.some(message => textOf(message).includes(LINE)))
    const message = followups.find(item => textOf(item).includes(LINE))
    if (message === undefined) throw new Error('missing monitor follow-up')
    expect(message.source).toMatchObject({ kind: 'plugin', plugin: MONITOR_PLUGIN, form: 'notice' })
    const logged = agent.session.events.filter(event => event.type === 'user/message')
    expect(logged.some(event => event.data.source.kind === 'plugin'
      && event.data.source.plugin === MONITOR_PLUGIN
      && parseMonitorLine(event.data.content) === LINE)).toBe(true)

    await waitUntil('job completed', () => ctx.jobs.get(JobId(jobId), agent).status === 'completed')
    const after = followups.length
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(followups.length).toBe(after)
    await ctx.fiber.dispose()
  })

  it('rejects a missing owner and an empty command', async () => {
    const { ctx, agent } = await setup()
    const noAgent = await ctx.tools.execute({
      signal: testToolSignal,
      callId: CallId(`call-${++callCounter}`),
      name: 'monitor',
      arguments: { command: process.execPath, args: ['-e', '1'], description: 'no owner' },
    })
    expect(noAgent.isError).toBe(true)
    const empty = await call(ctx, { command: '  ', description: 'empty' }, agent)
    expect(empty.isError).toBe(true)
    await ctx.fiber.dispose()
  })

  it('rejects a pre-aborted invocation', async () => {
    const { ctx, agent } = await setup()
    const aborted = new AbortController()
    aborted.abort()
    const result = await call(ctx, {
      command: process.execPath,
      args: ['-e', '1'],
      description: 'aborted',
    }, agent, aborted.signal)
    expect(result.isError).toBe(true)
    await ctx.fiber.dispose()
  })

  it('rejects invalid config, empty description, and invalid timeout_ms', async () => {
    const ctx = new Context()
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(AgentRegistry)
    await ctx.plugin(LocalJobRegistry)
    await ctx.plugin(ToolJobs)
    await ctx.plugin(LocalSubprocessRuntime)
    await expect(ctx.plugin(ToolMonitor, { graceMs: 0 })).rejects.toThrow(/graceMs/)
    await ctx.fiber.dispose()
    const test = await setup()
    const emptyDesc = await call(test.ctx, { command: process.execPath, description: '  ' }, test.agent)
    expect(emptyDesc.isError).toBe(true)
    const badTimeout = await call(test.ctx, {
      command: process.execPath,
      description: 'bad timeout',
      timeout_ms: 0,
    }, test.agent)
    expect(badTimeout.isError).toBe(true)
    const missingExe = await call(test.ctx, {
      command: 'dsh-monitor-missing-executable',
      description: 'missing exe',
    }, test.agent)
    expect(missingExe.isError).toBe(true)
    await test.ctx.fiber.dispose()
  })

  it('kills a persistent watch, follows empty lines, and contains follow-up errors', async () => {
    const followups: UserMessage[] = []
    const ctx = new Context()
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(AgentRegistry)
    await ctx.plugin(LocalJobRegistry)
    await ctx.plugin(ToolJobs)
    await ctx.plugin(LocalSubprocessRuntime)
    await ctx.plugin(ToolMonitor)
    const scopeFiber = ctx.plugin(() => {})
    const session = Session.create(SessionId('monitor-kill'))
    let followupThrows = 0
    const agent = {
      id: session.id,
      options: { cwd: process.cwd() },
      session,
      ctx: scopeFiber.ctx,
      status: 'idle',
      inject: () => {},
      followup(message: UserMessage) {
        followups.push(message)
        followupThrows += 1
        if (followupThrows === 1) throw new Error('followup-failed')
        if (followupThrows === 2) throw 'followup-failed'
        session.append('user/message', message, { surfaceOp: 'append' })
      },
      steer: () => {},
      send: () => {},
      cancel() {},
      runMaintenance: (task: (signal: AbortSignal) => Promise<void>) => task(new AbortController().signal),
      whenIdle: () => Promise.resolve(),
    } as unknown as Agent
    ctx.agents.register(agent)
    expect(ctx.tools.get('monitor')?.presentCall?.({
      command: process.execPath,
      description: 'present',
    })).toMatchObject({ card: 'generic' })
    const started = await call(ctx, {
      command: process.execPath,
      args: ['-e', "console.log(''); console.log('KEEP'); setInterval(() => {}, 1000)"],
      description: 'persistent watch',
      persistent: true,
    }, agent)
    expect(started.isError).toBe(false)
    if (started.isError) throw new Error('expected start')
    const jobId = (started.value as { jobId: string }).jobId
    await waitUntil('empty or keep line', () => followups.length > 0)
    const killed = await ctx.tools.execute({
      signal: testToolSignal,
      callId: CallId(`call-${++callCounter}`),
      name: 'job_kill',
      arguments: { job_id: jobId },
      agent,
    })
    expect(killed.isError).toBe(false)
    await waitUntil('job not running', () => {
      const status = ctx.jobs.get(JobId(jobId), agent).status
      return status !== 'running'
    })
    const timed = await call(ctx, {
      command: process.execPath,
      description: 'short timeout',
      timeout_ms: 50,
    }, agent)
    expect(timed.isError).toBe(false)
    if (timed.isError) throw new Error('expected timeout start')
    const timedId = (timed.value as { jobId: string }).jobId
    await waitUntil('timeout settled', () => {
      const status = ctx.jobs.get(JobId(timedId), agent).status
      return status !== 'running'
    })
    await ctx.fiber.dispose()
  })
})

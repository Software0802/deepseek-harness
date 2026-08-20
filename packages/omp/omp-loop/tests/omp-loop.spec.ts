import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import Include from '@deepseek-ai/cordis-plugin-include'
import AgentRegistry, { Inbox, emitAgentEvent } from '@deepseek-ai/dsh-agent'
import type { Agent, AgentStatus } from '@deepseek-ai/dsh-agent'
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import { mountAgentLoopTestDependencies } from '@deepseek-ai/dsh-agent-loop-testkit'
import CommandRuntime from '@deepseek-ai/dsh-commands'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import SessionStore, { Session, SessionId } from '@deepseek-ai/dsh-session'
import * as OmpLoop from '@deepseek-ai/dsh-omp-loop'
import {
  LOOP_PLUGIN,
  parseLoopCommand,
  parseLoopPrompt,
  renderLoopPrompt,
} from '@deepseek-ai/dsh-omp-loop'
import { MockAdapter, textResponse } from '../../../core/agent-loop/tests/mock-adapter.ts'

interface Stub {
  readonly ctx: Context
  readonly agent: Agent
  readonly session: Session
}

function stubAgent(ctx: Context, id: string, followup: Agent['followup'] = () => {}): Agent {
  const session = ctx.sessions.create(SessionId(id))
  const inbox = new Inbox(session, { inserted: () => {}, discarded: () => {}, claimed: () => {} })
  let status: AgentStatus = 'idle'
  const agent: Agent = {
    id: session.id,
    options: {},
    session,
    inbox,
    ctx: new Context(),
    get status() { return status },
    send: () => {},
    followup,
    steer: () => {},
    inject(input) { inbox.append('next-step', input) },
    cancel() { status = 'idle' },
    runMaintenance: task => task(new AbortController().signal),
    whenIdle() { return Promise.resolve() },
  }
  ctx.agents.register(agent)
  return agent
}

async function commandHarness(followup?: Agent['followup']): Promise<Stub> {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(CommandRuntime)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(OmpLoop)
  const agent = stubAgent(ctx, `omp-loop-${Math.random()}`, followup)
  return { ctx, agent, session: agent.session }
}

async function run(test: Stub, suffix = ''): Promise<NonNullable<Awaited<ReturnType<CommandRuntime['execute']>>>['result']> {
  const execution = await test.ctx.commands.execute(
    test.agent,
    `/loop${suffix}`,
    [],
    new AbortController().signal,
  )
  if (execution === undefined) throw new Error('loop command was not registered')
  return execution.result
}

function waitForIdle(ctx: Context, agent: Agent): Promise<void> {
  return new Promise((resolve) => {
    const d = ctx.on('agent/status', ({ agent: current, status }) => {
      if (current === agent && status === 'idle') {
        d()
        resolve()
      }
    })
  })
}

describe('parseLoopCommand', () => {
  it('parses status, stop, counts, and durations', () => {
    expect(parseLoopCommand('')).toEqual({ kind: 'status' })
    expect(parseLoopCommand('  stop  ')).toEqual({ kind: 'stop' })
    expect(parseLoopCommand('3')).toEqual({
      kind: 'start', iterations: 3, durationMs: undefined, prompt: undefined,
    })
    expect(parseLoopCommand('2 refactor tests')).toEqual({
      kind: 'start', iterations: 2, durationMs: undefined, prompt: 'refactor tests',
    })
    expect(parseLoopCommand('10ms')).toMatchObject({ kind: 'start', durationMs: 10 })
    expect(parseLoopCommand('2s go')).toMatchObject({ kind: 'start', durationMs: 2000, prompt: 'go' })
    expect(parseLoopCommand('1m')).toMatchObject({ kind: 'start', durationMs: 60_000 })
    expect(parseLoopCommand('1h')).toMatchObject({ kind: 'start', durationMs: 3_600_000 })
    expect(parseLoopCommand('0').kind).toBe('invalid')
    expect(parseLoopCommand('0ms').kind).toBe('invalid')
    expect(parseLoopCommand('01').kind).toBe('invalid')
    expect(parseLoopCommand('01s').kind).toBe('invalid')
    expect(parseLoopCommand('9007199254740993').kind).toBe('invalid')
    expect(parseLoopCommand('9007199254740993ms').kind).toBe('invalid')
    expect(parseLoopCommand('1MS')).toMatchObject({ kind: 'start', durationMs: 1 })
    expect(parseLoopCommand('stop now').kind).toBe('invalid')
    expect(parseLoopCommand('do work').kind).toBe('invalid')
  })
})

describe('loop prompt renderer', () => {
  it('round-trips through parseLoopPrompt', () => {
    const parts = { iteration: 2, maxIterations: 5, prompt: 'keep going' }
    const content = renderLoopPrompt(parts)
    expect(parseLoopPrompt(content)).toEqual(parts)
    expect(parseLoopPrompt([])).toBeUndefined()
    expect(parseLoopPrompt([{ type: 'reasoning', text: 'not a loop prompt' }])).toBeUndefined()
    expect(parseLoopPrompt([{ type: 'text', text: 'not a loop prompt' }])).toBeUndefined()
    expect(parseLoopPrompt([{ type: 'text', text: 'Loop iteration 1/2.\nOriginal task:\n' }])).toBeUndefined()
  })
})

describe('/loop command', () => {
  it('registers, shows empty status, starts, refuses a second start, and stops', async () => {
    const test = await commandHarness()
    expect(OmpLoop.name).toBe(LOOP_PLUGIN)
    expect(OmpLoop.inject).toEqual(['agents', 'commands'])
    expect('default' in OmpLoop).toBe(false)

    expect(await run(test)).toMatchObject({ kind: 'success' })
    expect((await run(test))?.text).toContain('No loop is currently set')

    const started = await run(test, ' 2 prove the loop')
    expect(started.kind).toBe('success')
    expect(started.text).toContain('Status: running')
    expect(started.text).toContain('prove the loop')

    const duplicate = await run(test, ' 1 other')
    expect(duplicate).toMatchObject({ kind: 'error' })
    expect(duplicate.text).toContain('already running')

    const stopped = await run(test, ' stop')
    expect(stopped.kind).toBe('success')
    expect(stopped.text).toContain('Status: stopped')

    const idleStop = await run(test, ' stop')
    expect(idleStop.text).toContain('No running loop to stop')

    const invalid = await run(test, ' nope')
    expect(invalid).toMatchObject({ kind: 'error' })
    expect(invalid.text).toContain('a count or duration is required')
  })

  it('rejects a count above maxIterations and a missing prompt', async () => {
    const ctx = new Context()
    await ctx.plugin(SessionStore)
    await ctx.plugin(CommandRuntime)
    await ctx.plugin(AgentRegistry)
    await ctx.plugin(OmpLoop, { maxIterations: 2 })
    const agent = stubAgent(ctx, 'cap')
    const over = await ctx.commands.execute(agent, '/loop 3 too many', [], new AbortController().signal)
    expect(over?.result).toMatchObject({ kind: 'error' })
    expect(over?.result.text).toContain('maxIterations')

    const missing = await ctx.commands.execute(agent, '/loop 1', [], new AbortController().signal)
    expect(missing?.result).toMatchObject({ kind: 'error' })
    expect(missing?.result.text).toContain('a prompt is required')
  })

  it('uses the last human user message when the suffix has no prompt', async () => {
    const test = await commandHarness()
    test.session.append('user/message', createUserMessage({
      content: [{ type: 'text', text: 'from history' }],
      source: { kind: 'user' },
    }), { surfaceOp: 'append' })
    test.session.append('user/message', createUserMessage({
      content: [{ type: 'text', text: 'plugin noise' }],
      source: { kind: 'plugin', plugin: 'other-plugin' },
    }), { surfaceOp: 'append' })
    const started = await run(test, ' 1')
    expect(started.text).toContain('from history')
  })

  it('ignores empty human text and plugin-only history when a prompt is required', async () => {
    const test = await commandHarness()
    test.session.append('user/message', createUserMessage({
      content: [{ type: 'text', text: '   ' }],
      source: { kind: 'user' },
    }), { surfaceOp: 'append' })
    test.session.append('user/message', createUserMessage({
      content: [{ type: 'text', text: 'plugin only' }],
      source: { kind: 'plugin', plugin: 'other-plugin' },
    }), { surfaceOp: 'append' })
    const missing = await run(test, ' 1')
    expect(missing).toMatchObject({ kind: 'error' })
    expect(missing.text).toContain('a prompt is required')
  })

  it('registers state for an agent that already exists when the plugin loads', async () => {
    const ctx = new Context()
    await ctx.plugin(SessionStore)
    await ctx.plugin(CommandRuntime)
    await ctx.plugin(AgentRegistry)
    const agent = stubAgent(ctx, 'already-there')
    await ctx.plugin(OmpLoop)
    const execution = await ctx.commands.execute(agent, '/loop 1 prove preexisting', [], new AbortController().signal)
    expect(execution?.result.kind).toBe('success')
    await ctx.fiber.dispose()
  })

  it('fails loud on a non-integer maxIterations', async () => {
    const ctx = new Context()
    await ctx.plugin(SessionStore)
    await ctx.plugin(CommandRuntime)
    await ctx.plugin(AgentRegistry)
    await expect(ctx.plugin(OmpLoop, { maxIterations: 1.5 })).rejects.toThrow('maxIterations')
    await expect(ctx.plugin(OmpLoop, { maxIterations: 0 })).rejects.toThrow('maxIterations')
  })

  it('stops when followup throws', async () => {
    const test = await commandHarness(() => { throw 'queue failed' })
    const started = await run(test, ' 1 boom')
    expect(started.kind).toBe('success')
    await Promise.resolve()
    const status = await run(test)
    expect(status.text).toContain('Status: stopped')
  })
})

describe('omp-loop continuation through the agent loop', () => {
  it('re-submits the prompt for the requested iteration count', async () => {
    const ctx = new Context()
    await mountAgentLoopTestDependencies(ctx)
    await ctx.plugin(CommandRuntime)
    await ctx.plugin(AgentLoop, { agents: [] })
    await ctx.plugin(OmpLoop)
    ctx.llm.registerAdapter(['mock'], new MockAdapter([
      textResponse('one'),
      textResponse('two'),
    ]))
    const agent = ctx.agentLoop.create(SessionId('loop-count'), { provider: 'mock', model: 'mock' })
    const execution = await ctx.commands.execute(
      agent,
      '/loop 2 finish the catalog',
      [],
      new AbortController().signal,
    )
    expect(execution?.result.kind).toBe('success')
    await vi.waitFor(() => {
      const loops = [...agent.session.events].filter((event): event is typeof event & { type: 'user/message' } =>
        event.type === 'user/message'
        && event.data.source.kind === 'plugin'
        && event.data.source.plugin === LOOP_PLUGIN)
      expect(loops).toHaveLength(2)
    })
    await agent.whenIdle()
    const loops = [...agent.session.events].filter((event): event is typeof event & { type: 'user/message' } =>
      event.type === 'user/message'
      && event.data.source.kind === 'plugin'
      && event.data.source.plugin === LOOP_PLUGIN)
    expect(parseLoopPrompt(loops[0]!.data.content)).toMatchObject({ iteration: 1, maxIterations: 2 })
    expect(parseLoopPrompt(loops[1]!.data.content)).toMatchObject({ iteration: 2, maxIterations: 2 })
    await ctx.fiber.dispose()
  })
})

describe('omp-loop Loader composition', () => {
  let root: string | undefined
  let context: Context | undefined

  afterEach(async () => {
    await context?.fiber.dispose()
    context = undefined
    if (root !== undefined) await rm(root, { recursive: true, force: true })
    root = undefined
  })

  it('registers /loop from a cordis.yml config row', async () => {
    root = await mkdtemp(join(tmpdir(), 'dsh-omp-loop-loader-'))
    const configPath = join(root, 'cordis.yml')
    await writeFile(configPath, [
      "- name: '@deepseek-ai/dsh-session'",
      "- name: '@deepseek-ai/dsh-agent'",
      "- name: '@deepseek-ai/dsh-commands'",
      "- name: '@deepseek-ai/dsh-omp-loop'",
      '  config:',
      '    maxIterations: 4',
      '',
    ].join('\n'))
    const ctx = new Context()
    context = ctx
    ctx.baseUrl = pathToFileURL(root).href + '/'
    await ctx.plugin(Loader)
    ctx.loader.builtins.include = Include
    const modules = new Map<string, unknown>([
      ['@deepseek-ai/dsh-session', SessionStore],
      ['@deepseek-ai/dsh-agent', AgentRegistry],
      ['@deepseek-ai/dsh-commands', CommandRuntime],
      ['@deepseek-ai/dsh-omp-loop', OmpLoop],
    ])
    ctx.loader.internal = {
      version: 'v2',
      async import(specifier: string) {
        if (!modules.has(specifier)) throw new Error(`unexpected Loader import: ${specifier}`)
        return modules.get(specifier)
      },
    } as unknown as NonNullable<typeof ctx.loader.internal>
    await ctx.loader.create({ name: 'cordis:include', config: { path: pathToFileURL(configPath).href } })
    await ctx.loader.await()
    const agent = stubAgent(ctx, 'loader-loop')
    expect(ctx.commands.list(agent)).toContainEqual({
      name: 'loop',
      description: 'repeat one prompt for a count or duration without completion semantics',
      input: { hint: '[<count>|<duration>|stop] [prompt]' },
    })
  }, 30_000)
})

describe('omp-loop driver races', () => {
  it('stops on a competing next-turn message, session-start, discard, and abort', async () => {
    let queued: ReturnType<typeof createUserMessage> | undefined
    const test = await commandHarness((message) => { queued = message })
    expect((await run(test, ' 3 keep going')).kind).toBe('success')
    await Promise.resolve()
    expect(queued).toBeDefined()

    const competing = createUserMessage({
      content: [{ type: 'text', text: 'human override' }],
      source: { kind: 'user' },
    })
    test.agent.inbox.append('next-turn', competing)
    emitAgentEvent(test.ctx, test.agent, 'agent/inbox/inserted', { message: competing })
    expect((await run(test)).text).toContain('Status: stopped')
    emitAgentEvent(test.ctx, test.agent, 'agent/status', { status: 'idle' })
    expect((await run(test)).text).toContain('Status: stopped')

    expect((await run(test, ' 2 keep going')).kind).toBe('success')
    emitAgentEvent(test.ctx, test.agent, 'agent/session-start', { source: 'clear' })
    expect((await run(test)).text).toContain('No loop is currently set')

    queued = undefined
    expect((await run(test, ' 2 keep going')).kind).toBe('success')
    await Promise.resolve()
    emitAgentEvent(test.ctx, test.agent, 'agent/inbox/claimed', { message: queued!, turn: 1 })
    test.session.append('turn/end', { turn: 1, reason: { kind: 'aborted', reason: { kind: 'user' } } })
    emitAgentEvent(test.ctx, test.agent, 'agent/status', { status: 'idle' })
    expect((await run(test)).text).toContain('Status: stopped')

    queued = undefined
    expect((await run(test, ' 2 keep going')).kind).toBe('success')
    await Promise.resolve()
    emitAgentEvent(test.ctx, test.agent, 'agent/inbox/discarded', { message: queued! })
    emitAgentEvent(test.ctx, test.agent, 'agent/status', { status: 'idle' })
    expect((await run(test)).text).toContain('Status: stopped')

    queued = undefined
    expect((await run(test, ' 2 keep going')).kind).toBe('success')
    await Promise.resolve()
    test.session.append('turn/end', { turn: 1, reason: { kind: 'aborted', reason: { kind: 'user' } } })
    expect((await run(test)).text).toContain('Status: stopped')

    queued = undefined
    expect((await run(test, ' 3 keep going')).kind).toBe('success')
    await Promise.resolve()
    const own = queued!
    test.agent.inbox.append('next-turn', own)
    emitAgentEvent(test.ctx, test.agent, 'agent/inbox/inserted', { message: own })
    expect((await run(test)).text).toContain('Status: running')

    const notice = createUserMessage({
      content: [{ type: 'text', text: 'next-step notice' }],
      source: { kind: 'plugin', plugin: 'other' },
    })
    test.agent.inbox.append('next-step', notice)
    emitAgentEvent(test.ctx, test.agent, 'agent/inbox/inserted', { message: notice })
    expect((await run(test)).text).toContain('Status: running')

    const orphan = test.ctx.sessions.create(SessionId('orphan-loop'))
    orphan.append('turn/end', { turn: 1, reason: { kind: 'aborted', reason: { kind: 'user' } } })
    expect((await run(test)).text).toContain('Status: running')

    test.session.append('user/message', createUserMessage({
      content: [{ type: 'text', text: 'unrelated user' }],
      source: { kind: 'user' },
    }), { surfaceOp: 'append' })

    const other = createUserMessage({
      content: [{ type: 'text', text: 'other inbox message' }],
      source: { kind: 'user' },
    })
    emitAgentEvent(test.ctx, test.agent, 'agent/inbox/claimed', { message: other, turn: 1 })
    emitAgentEvent(test.ctx, test.agent, 'agent/inbox/discarded', { message: other })
    expect((await run(test)).text).toContain('Status: running')
    emitAgentEvent(test.ctx, test.agent, 'agent/inbox/claimed', { message: own, turn: 1 })
    test.agent.inbox.append('next-turn', other)
    emitAgentEvent(test.ctx, test.agent, 'agent/inbox/inserted', { message: other })
    expect((await run(test)).text).toContain('Status: stopped')
    emitAgentEvent(test.ctx, test.agent, 'agent/inbox/inserted', { message: competing })
    expect((await run(test)).text).toContain('Status: stopped')

    emitAgentEvent(test.ctx, test.agent, 'agent/status', { status: 'running' })
    emitAgentEvent(test.ctx, test.agent, 'agent/disposed', {})
    await test.ctx.fiber.dispose()
  })

  it('completes when the duration elapses and stops when the driver cannot start', async () => {
    let queued: ReturnType<typeof createUserMessage> | undefined
    const test = await commandHarness((message) => { queued = message })
    const started = await run(test, ' 50ms keep going')
    expect(started.kind).toBe('success')
    expect(started.text).toContain('Deadline:')
    await vi.waitFor(() => expect(queued).toBeDefined())
    test.session.append('user/message', queued!, { surfaceOp: 'append' })
    await new Promise(resolve => setTimeout(resolve, 60))
    emitAgentEvent(test.ctx, test.agent, 'agent/status', { status: 'idle' })
    await vi.waitFor(async () => {
      expect((await run(test)).text).toContain('Status: complete')
    })
    await test.ctx.fiber.dispose()

    const blocked = await commandHarness()
    vi.spyOn(blocked.ctx.agents, 'withoutInitiator').mockImplementation(() => {
      throw new Error('agent initiator scope is disposed')
    })
    expect((await run(blocked, ' 1 keep going')).kind).toBe('success')
    await Promise.resolve()
    expect((await run(blocked)).text).toContain('Status: stopped')
    await blocked.ctx.fiber.dispose()

    const rejected = await commandHarness()
    vi.spyOn(rejected.ctx.agents, 'withoutInitiator').mockImplementation(
      () => Promise.reject(new Error('driver task failed')),
    )
    expect((await run(rejected, ' 1 keep going')).kind).toBe('success')
    await vi.waitFor(async () => {
      expect((await run(rejected)).text).toContain('Status: stopped')
    })
    await rejected.ctx.fiber.dispose()

    let reentered = 0
    let nested: ReturnType<typeof createUserMessage> | undefined
    const busy = await commandHarness((message) => {
      reentered += 1
      nested = message
      if (reentered === 1) {
        busy.session.append('user/message', message, { surfaceOp: 'append' })
        emitAgentEvent(busy.ctx, busy.agent, 'agent/status', { status: 'idle' })
      }
    })
    expect((await run(busy, ' 2 keep going')).kind).toBe('success')
    await vi.waitFor(() => expect(nested).toBeDefined())
    expect((await run(busy)).text).toMatch(/Status: (running|stopped|complete)/)
    await busy.ctx.fiber.dispose()

    const clockQueued: { current?: ReturnType<typeof createUserMessage> } = {}
    const clock = await commandHarness((message) => { clockQueued.current = message })
    expect((await run(clock, ' 1s keep going')).kind).toBe('success')
    await vi.waitFor(() => expect(clockQueued.current).toBeDefined())
    clock.session.append('user/message', clockQueued.current!, { surfaceOp: 'append' })
    const warn = vi.fn()
    clock.ctx.logger.warn = warn as never
    const now = vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('clock failed')
    })
    emitAgentEvent(clock.ctx, clock.agent, 'agent/status', { status: 'idle' })
    await vi.waitFor(() => {
      expect(warn.mock.calls.some(call => String(call[0]).includes('driver failed'))).toBe(true)
    })
    now.mockRestore()
    await clock.ctx.fiber.dispose()
  })

  it('stops an in-flight hang when the agent is cancelled', async () => {
    const ctx = new Context()
    await mountAgentLoopTestDependencies(ctx)
    await ctx.plugin(CommandRuntime)
    await ctx.plugin(AgentLoop, { agents: [] })
    await ctx.plugin(OmpLoop)
    ctx.llm.registerAdapter(['mock'], new MockAdapter(['hang']))
    const agent = ctx.agentLoop.create(SessionId('loop-cancel'), { provider: 'mock', model: 'mock' })
    const idle = waitForIdle(ctx, agent)
    const execution = await ctx.commands.execute(
      agent,
      '/loop 2 hang then stop',
      [],
      new AbortController().signal,
    )
    expect(execution?.result.kind).toBe('success')
    await new Promise(resolve => setTimeout(resolve, 20))
    agent.cancel({ kind: 'user' })
    await idle
    const status = await ctx.commands.execute(agent, '/loop', [], new AbortController().signal)
    expect(status?.result.text).toMatch(/Status: (stopped|complete)|No loop is currently set/)
    await ctx.fiber.dispose()
  })

  it('stops a running loop when the plugin unloads with a driver task in flight', async () => {
    const test = await commandHarness()
    expect((await run(test, ' 5 keep going')).kind).toBe('success')
    expect((await run(test)).text).toContain('Status: running')
    await test.ctx.fiber.dispose()

    const held = await commandHarness()
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    vi.spyOn(held.ctx.agents, 'withoutInitiator').mockImplementation(() => gate)
    expect((await run(held, ' 1 keep going')).kind).toBe('success')
    const disposing = held.ctx.fiber.dispose()
    await new Promise(resolve => setTimeout(resolve, 20))
    release()
    await disposing
  })
})

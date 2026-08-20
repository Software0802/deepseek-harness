import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import Include from '@deepseek-ai/cordis-plugin-include'
import AgentRegistry, { Inbox } from '@deepseek-ai/dsh-agent'
import type { Agent, AgentStatus } from '@deepseek-ai/dsh-agent'
import { MAX_TIMER_DELAY_MS } from '@deepseek-ai/dsh-timeout'
import InvariantRegistry from '@deepseek-ai/dsh-invariants'
import LlmRuntime, { createMessage, createUserMessage, LlmAdapter } from '@deepseek-ai/dsh-llm'
import type { LlmResolvedModelInfo, StreamChunk } from '@deepseek-ai/dsh-llm'
import SessionStore, { Session, SessionId } from '@deepseek-ai/dsh-session'
import * as OmpAdvisor from '@deepseek-ai/dsh-omp-advisor'
import * as OmpAdvisorInvariant from '@deepseek-ai/dsh-omp-advisor/invariant'
import {
  ADVISOR_PLUGIN,
  ADVISOR_SYSTEM_PROMPT,
  boundTranscript,
  parseAdvisorOutput,
  transcriptForTurn,
} from '@deepseek-ai/dsh-omp-advisor'
import { MockAdapter, textResponse } from '../../../core/agent-loop/tests/mock-adapter.ts'

function errorFinish(message: string): StreamChunk[] {
  return [{ type: 'finish', reason: { kind: 'error', failure: { message, code: 'PROVIDER_ERROR' } } }]
}

function abortedFinish(message: string): StreamChunk[] {
  return [{ type: 'finish', reason: { kind: 'aborted', failure: { message, code: 'ABORTED' } } }]
}

class ThrowingAdapter extends LlmAdapter {
  override resolveModel(provider: string, model: string): Promise<LlmResolvedModelInfo> {
    return Promise.resolve({ provider, id: model, name: model })
  }

  async * stream(): AsyncIterable<StreamChunk> {
    throw 'reviewer boom'
  }
}

function stubAgent(
  ctx: Context,
  id: string,
  hooks: { followup?: Agent['followup']; inject?: Agent['inject'] } = {},
  origin?: 'subagent',
): { agent: Agent; session: Session; unregister: () => void } {
  const session = origin === 'subagent'
    ? ctx.sessions.create(SessionId(id), {
      meta: { parentSession: SessionId('parent'), origin: 'subagent', delegationDepth: 1 },
    })
    : ctx.sessions.create(SessionId(id))
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
    followup: hooks.followup ?? (() => {}),
    steer: () => {},
    inject: hooks.inject ?? (() => {}),
    cancel() { status = 'idle' },
    runMaintenance: task => task(new AbortController().signal),
    whenIdle() { return Promise.resolve() },
  }
  return { agent, session, unregister: ctx.agents.register(agent) }
}

async function startAdvisor(
  config: Record<string, unknown> = {},
  adapter: LlmAdapter = new MockAdapter([textResponse('SEVERITY: aside\nNOTE: check the tests\n')]),
): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(LlmRuntime)
  await ctx.plugin(AgentRegistry)
  ctx.llm.registerAdapter(['fake-advisor'], adapter)
  await ctx.plugin(OmpAdvisor, {
    enabled: true,
    provider: 'fake-advisor',
    model: 'advisor-model',
    timeoutMs: 5_000,
    ...config,
  })
  return ctx
}

function completeTurn(session: Session, turn: number, extra?: { advisorNotice?: boolean }): void {
  session.append('turn/start', { turn })
  session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: 'hello' }],
    source: { kind: 'user' },
  }), { surfaceOp: 'append' })
  if (extra?.advisorNotice === true) {
    session.append('user/message', createUserMessage({
      content: [{ type: 'text', text: 'Advisor aside: already here' }],
      source: { kind: 'plugin', plugin: ADVISOR_PLUGIN, form: 'notice', summary: 'advisor aside' },
    }), { surfaceOp: 'append' })
  }
  session.append('assistant/message', {
    turn,
    step: 1,
    message: createMessage({
      role: 'assistant',
      content: [{ type: 'text', text: 'done' }],
      source: { kind: 'model', provider: 'mock', model: 'mock' },
    }),
  }, { surfaceOp: 'append' })
  session.append('turn/end', { turn, reason: { kind: 'completed' } })
}

describe('parseAdvisorOutput', () => {
  it('parses a severity line and optional NOTE prefix', () => {
    expect(parseAdvisorOutput('SEVERITY: concern\nNOTE: clock')).toEqual({
      severity: 'concern',
      note: 'clock',
    })
    expect(parseAdvisorOutput('SEVERITY: Blocker\nstop now')).toEqual({
      severity: 'blocker',
      note: 'stop now',
    })
  })

  it('treats output without a leading severity line as an aside', () => {
    expect(parseAdvisorOutput('just a thought')).toEqual({
      severity: 'aside',
      note: 'just a thought',
    })
  })

  it('returns undefined for blank output or an empty note', () => {
    expect(parseAdvisorOutput('   \n')).toBeUndefined()
    expect(parseAdvisorOutput('SEVERITY: aside\nNOTE:   ')).toBeUndefined()
  })
})

describe('transcript helpers', () => {
  it('formats user and assistant text from one completed turn', async () => {
    const ctx = new Context()
    await ctx.plugin(SessionStore)
    const session = ctx.sessions.create(SessionId('transcript'))
    completeTurn(session, 1)
    expect(transcriptForTurn(session, 1)).toBe('User: hello\n\nAssistant: done')
    expect(transcriptForTurn(session, 2)).toBe('')
    session.append('turn/start', { turn: 3 })
    session.append('user/message', createUserMessage({
      content: [{ type: 'text', text: '   ' }],
      source: { kind: 'user' },
    }), { surfaceOp: 'append' })
    session.append('assistant/message', {
      turn: 3,
      step: 1,
      message: createMessage({
        role: 'assistant',
        content: [{ type: 'text', text: '' }],
        source: { kind: 'model', provider: 'mock', model: 'mock' },
      }),
    }, { surfaceOp: 'append' })
    session.append('user/message', createUserMessage({
      content: [{ type: 'text', text: 'hello' }],
      source: { kind: 'user' },
    }), { surfaceOp: 'append' })
    session.append('assistant/message', {
      turn: 3,
      step: 2,
      message: createMessage({
        role: 'assistant',
        content: [{ type: 'text', text: 'done' }],
        source: { kind: 'model', provider: 'mock', model: 'mock' },
      }),
    }, { surfaceOp: 'append' })
    session.append('turn/end', { turn: 3, reason: { kind: 'completed' } })
    expect(transcriptForTurn(session, 3)).toBe('User: hello\n\nAssistant: done')
  })

  it('keeps a transcript that already fits and truncates from the end', () => {
    expect(boundTranscript('abcd', 4)).toBe('abcd')
    expect(boundTranscript('abcdefghij', 4)).toBe('abcd… (+6 more bytes)')
    expect(boundTranscript('ééé', 3)).toBe('é… (+4 more bytes)')
  })
})

describe('omp-advisor plugin', () => {
  it('exports a function plugin with no default export', () => {
    expect(OmpAdvisor.name).toBe('omp-advisor')
    expect(OmpAdvisor.inject).toEqual(['agents', 'llm'])
    expect('default' in OmpAdvisor).toBe(false)
    expect(ADVISOR_SYSTEM_PROMPT).toContain('SEVERITY: aside | concern | blocker')
  })

  it('fails loud when enabled without provider or model, or when integers are invalid', async () => {
    const ctx = new Context()
    await ctx.plugin(SessionStore)
    await ctx.plugin(LlmRuntime)
    await ctx.plugin(AgentRegistry)
    await expect(ctx.plugin(OmpAdvisor, { enabled: true })).rejects.toThrow(/non-empty provider and model/)
    await expect(ctx.plugin(OmpAdvisor, {
      enabled: true, provider: 'x', model: 'y', timeoutMs: 0,
    })).rejects.toThrow(/timeoutMs/)
    await expect(ctx.plugin(OmpAdvisor, {
      enabled: true, provider: 'x', model: 'y', timeoutMs: MAX_TIMER_DELAY_MS + 1,
    })).rejects.toThrow(/timeoutMs/)
    await expect(ctx.plugin(OmpAdvisor, {
      enabled: true, provider: 'x', model: 'y', maxOutputTokens: 1.5,
    })).rejects.toThrow(/maxOutputTokens/)
    await expect(ctx.plugin(OmpAdvisor, {
      enabled: true, provider: 'x', model: 'y', maxTranscriptBytes: 0,
    })).rejects.toThrow(/maxTranscriptBytes/)
    await expect(ctx.plugin(OmpAdvisor, {
      enabled: true, provider: 'x', model: 'y', maxInterrupts: -1,
    })).rejects.toThrow(/maxInterrupts/)
  })

  it('injects an aside after a completed turn', async () => {
    const inject = vi.fn()
    const followup = vi.fn()
    const ctx = await startAdvisor()
    const { session } = stubAgent(ctx, 'aside', { inject, followup })
    completeTurn(session, 1)
    await vi.waitFor(() => {
      expect(inject).toHaveBeenCalledWith(expect.objectContaining({
        content: [expect.objectContaining({ text: 'Advisor aside: check the tests' })],
      }))
    })
    expect(followup).not.toHaveBeenCalled()
    await ctx.fiber.dispose()
  })

  it('injects a concern even when delivery is interrupt', async () => {
    const inject = vi.fn()
    const followup = vi.fn()
    const ctx = await startAdvisor(
      { delivery: 'interrupt' },
      new MockAdapter([textResponse('SEVERITY: concern\nNOTE: watch the clock\n')]),
    )
    const { session } = stubAgent(ctx, 'concern', { inject, followup })
    completeTurn(session, 1)
    await vi.waitFor(() => {
      expect(inject).toHaveBeenCalledWith(expect.objectContaining({
        content: [expect.objectContaining({ text: 'Advisor concern: watch the clock' })],
      }))
    })
    expect(followup).not.toHaveBeenCalled()
    await ctx.fiber.dispose()
  })

  it('caps interrupt followups per agent and injects later blockers', async () => {
    const inject = vi.fn()
    const followup = vi.fn()
    const ctx = await startAdvisor(
      { delivery: 'interrupt', maxInterrupts: 1 },
      new MockAdapter([
        textResponse('SEVERITY: blocker\nNOTE: first\n'),
        textResponse('SEVERITY: blocker\nNOTE: second\n'),
      ]),
    )
    const { session } = stubAgent(ctx, 'cap-later', { inject, followup })
    completeTurn(session, 1)
    await vi.waitFor(() => expect(followup).toHaveBeenCalledTimes(1))
    completeTurn(session, 2)
    await vi.waitFor(() => expect(inject).toHaveBeenCalled())
    expect(followup).toHaveBeenCalledTimes(1)
    await ctx.fiber.dispose()
  })

  it('times out a slow reviewer stream', async () => {
    class SlowAdapter extends LlmAdapter {
      override resolveModel(provider: string, model: string): Promise<LlmResolvedModelInfo> {
        return Promise.resolve({ provider, id: model, name: model })
      }

      async * stream(): AsyncIterable<StreamChunk> {
        yield { type: 'block-start', index: 0, blockType: 'text' }
        yield { type: 'text-delta', index: 0, text: 'x' }
        await new Promise(resolve => setTimeout(resolve, 40))
        yield { type: 'text-delta', index: 0, text: 'y' }
      }
    }
    const warn = vi.fn()
    const inject = vi.fn()
    const ctx = await startAdvisor({ timeoutMs: 1 }, new SlowAdapter())
    ctx.logger.warn = warn as never
    const { session } = stubAgent(ctx, 'timeout', { inject })
    completeTurn(session, 1)
    await vi.waitFor(() => expect(warn).toHaveBeenCalled())
    expect(inject).not.toHaveBeenCalled()
    await ctx.fiber.dispose()
  })

  it('followups a blocker when delivery is interrupt', async () => {
    const inject = vi.fn()
    const followup = vi.fn()
    const ctx = await startAdvisor(
      { delivery: 'interrupt' },
      new MockAdapter([textResponse('SEVERITY: blocker\nNOTE: stop and ask\n')]),
    )
    const { session } = stubAgent(ctx, 'blocker', { inject, followup })
    completeTurn(session, 1)
    await vi.waitFor(() => {
      expect(followup).toHaveBeenCalledWith(expect.objectContaining({
        content: [expect.objectContaining({ text: 'Advisor blocker: stop and ask' })],
      }))
    })
    expect(inject).not.toHaveBeenCalled()
    await ctx.fiber.dispose()
  })

  it('injects a blocker when interrupt delivery already noticed the turn or the cap is zero', async () => {
    const inject = vi.fn()
    const followup = vi.fn()
    const ctx = await startAdvisor(
      { delivery: 'interrupt', maxInterrupts: 0 },
      new MockAdapter([textResponse('SEVERITY: blocker\nNOTE: stop\n')]),
    )
    const { session } = stubAgent(ctx, 'cap', { inject, followup })
    completeTurn(session, 1)
    await vi.waitFor(() => expect(inject).toHaveBeenCalled())
    expect(followup).not.toHaveBeenCalled()
    await ctx.fiber.dispose()

    const inject2 = vi.fn()
    const followup2 = vi.fn()
    const ctx2 = await startAdvisor(
      { delivery: 'interrupt' },
      new MockAdapter([textResponse('SEVERITY: blocker\nNOTE: stop\n')]),
    )
    const { session: session2 } = stubAgent(ctx2, 'noticed', { inject: inject2, followup: followup2 })
    completeTurn(session2, 1, { advisorNotice: true })
    await vi.waitFor(() => expect(inject2).toHaveBeenCalled())
    expect(followup2).not.toHaveBeenCalled()
    await ctx2.fiber.dispose()
  })

  it('skips subagent sessions unless includeSubagents is set', async () => {
    const inject = vi.fn()
    const ctx = await startAdvisor()
    const { session } = stubAgent(ctx, 'child', { inject }, 'subagent')
    completeTurn(session, 1)
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(inject).not.toHaveBeenCalled()
    await ctx.fiber.dispose()

    const inject2 = vi.fn()
    const ctx2 = await startAdvisor({ includeSubagents: true })
    const { session: session2 } = stubAgent(ctx2, 'child-on', { inject: inject2 }, 'subagent')
    completeTurn(session2, 1)
    await vi.waitFor(() => expect(inject2).toHaveBeenCalled())
    await ctx2.fiber.dispose()
  })

  it('does nothing when disabled, when the transcript is empty, or when the turn did not complete', async () => {
    const inject = vi.fn()
    const ctx = new Context()
    await ctx.plugin(SessionStore)
    await ctx.plugin(LlmRuntime)
    await ctx.plugin(AgentRegistry)
    ctx.llm.registerAdapter(['fake-advisor'], new MockAdapter([
      textResponse('SEVERITY: aside\nNOTE: no\n'),
    ]))
    await ctx.plugin(OmpAdvisor, { enabled: false })
    const { session } = stubAgent(ctx, 'disabled', { inject })
    completeTurn(session, 1)
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(inject).not.toHaveBeenCalled()
    await ctx.fiber.dispose()

    const inject2 = vi.fn()
    const ctx2 = await startAdvisor()
    const { session: session2 } = stubAgent(ctx2, 'empty', { inject: inject2 })
    session2.append('turn/start', { turn: 1 })
    session2.append('turn/end', { turn: 1, reason: { kind: 'completed' } })
    session2.append('turn/start', { turn: 2 })
    session2.append('turn/end', { turn: 2, reason: { kind: 'aborted', reason: { kind: 'user' } } })
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(inject2).not.toHaveBeenCalled()
    await ctx2.fiber.dispose()
  })

  it('swallows reviewer errors, aborts, empty notes, and missing agents', async () => {
    const warn = vi.fn()
    const inject = vi.fn()
    const ctx = await startAdvisor({}, new MockAdapter([errorFinish('provider down')]))
    ctx.logger.warn = warn as never
    const { session } = stubAgent(ctx, 'err', { inject })
    completeTurn(session, 1)
    await vi.waitFor(() => expect(warn).toHaveBeenCalled())
    expect(inject).not.toHaveBeenCalled()
    await ctx.fiber.dispose()

    const warn2 = vi.fn()
    const ctx2 = await startAdvisor({}, new MockAdapter([abortedFinish('stopped')]))
    ctx2.logger.warn = warn2 as never
    const { session: session2 } = stubAgent(ctx2, 'abort-finish', { inject })
    completeTurn(session2, 1)
    await vi.waitFor(() => expect(warn2).toHaveBeenCalled())
    await ctx2.fiber.dispose()

    const inject3 = vi.fn()
    const ctx3 = await startAdvisor({}, new MockAdapter([textResponse('SEVERITY: aside\nNOTE:   \n')]))
    const { session: session3 } = stubAgent(ctx3, 'empty-note', { inject: inject3 })
    completeTurn(session3, 1)
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(inject3).not.toHaveBeenCalled()
    await ctx3.fiber.dispose()

    const ctx4 = await startAdvisor()
    const { session: session4, unregister } = stubAgent(ctx4, 'gone', { inject })
    unregister()
    completeTurn(session4, 1)
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(inject).not.toHaveBeenCalled()
    await ctx4.fiber.dispose()
  })

  it('logs a reviewer throw and a missing initiator scope', async () => {
    const warn = vi.fn()
    const ctx = await startAdvisor({}, new ThrowingAdapter())
    ctx.logger.warn = warn as never
    const { session } = stubAgent(ctx, 'throw')
    completeTurn(session, 1)
    await vi.waitFor(() => expect(warn).toHaveBeenCalled())
    await ctx.fiber.dispose()

    const warn2 = vi.fn()
    const ctx2 = await startAdvisor()
    ctx2.logger.warn = warn2 as never
    vi.spyOn(ctx2.agents, 'withoutInitiator').mockImplementation(() => {
      throw 'agent initiator scope is disposed'
    })
    const { session: session2 } = stubAgent(ctx2, 'scope')
    completeTurn(session2, 1)
    await vi.waitFor(() => expect(warn2.mock.calls.some(call => String(call[0]).includes('could not start review'))).toBe(true))
    await ctx2.fiber.dispose()
  })

  it('aborts an in-flight review when the plugin unloads', async () => {
    const inject = vi.fn()
    const ctx = await startAdvisor({}, new MockAdapter(['hang']))
    const { session } = stubAgent(ctx, 'hang', { inject })
    completeTurn(session, 1)
    await new Promise(resolve => setTimeout(resolve, 20))
    await ctx.fiber.dispose()
    expect(inject).not.toHaveBeenCalled()
  })

  it('skips delivery when the agent is unregistered mid-review', async () => {
    const inject = vi.fn()
    let release!: () => void
    const held = new Promise<void>((resolve) => { release = resolve })
    class GateAdapter extends LlmAdapter {
      override resolveModel(provider: string, model: string): Promise<LlmResolvedModelInfo> {
        return Promise.resolve({ provider, id: model, name: model })
      }

      async * stream(): AsyncIterable<StreamChunk> {
        await held
        yield* textResponse('SEVERITY: aside\nNOTE: late\n')
      }
    }
    const ctx = await startAdvisor({}, new GateAdapter())
    const { session, unregister } = stubAgent(ctx, 'late', { inject })
    completeTurn(session, 1)
    await new Promise(resolve => setTimeout(resolve, 10))
    unregister()
    release()
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(inject).not.toHaveBeenCalled()
    await ctx.fiber.dispose()
  })
})

describe('omp-advisor Loader composition', () => {
  let root: string | undefined
  let context: Context | undefined

  afterEach(async () => {
    await context?.fiber.dispose()
    context = undefined
    if (root !== undefined) await rm(root, { recursive: true, force: true })
    root = undefined
  })

  it('registers from a cordis.yml config row', async () => {
    root = await mkdtemp(join(tmpdir(), 'dsh-omp-advisor-loader-'))
    const configPath = join(root, 'cordis.yml')
    await writeFile(configPath, [
      "- name: '@deepseek-ai/dsh-session'",
      "- name: '@deepseek-ai/dsh-llm'",
      "- name: '@deepseek-ai/dsh-agent'",
      "- name: '@deepseek-ai/dsh-omp-advisor'",
      '  config:',
      '    enabled: false',
      '',
    ].join('\n'))
    const ctx = new Context()
    context = ctx
    ctx.baseUrl = `${pathToFileURL(root).href}/`
    await ctx.plugin(Loader)
    ctx.loader.builtins.include = Include
    const modules = new Map<string, unknown>([
      ['@deepseek-ai/dsh-session', SessionStore],
      ['@deepseek-ai/dsh-llm', LlmRuntime],
      ['@deepseek-ai/dsh-agent', AgentRegistry],
      ['@deepseek-ai/dsh-omp-advisor', OmpAdvisor],
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
    expect(ctx.registry.get(OmpAdvisor)?.name).toBe('omp-advisor')
  }, 30_000)
})

describe('omp-advisor invariant', () => {
  it('registers an empty companion', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await ctx.plugin(OmpAdvisorInvariant)
    expect(ctx.invariants).toBeDefined()
    await ctx.fiber.dispose()
  })
})

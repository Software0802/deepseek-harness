import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import InvariantRegistry, { InvariantError } from '@deepseek-ai/dsh-invariants'
import SessionStore, { SessionId } from '@deepseek-ai/dsh-session'
import * as OmpLoopInvariant from '@deepseek-ai/dsh-omp-loop/invariant'
import { LOOP_PLUGIN, renderLoopPrompt } from '@deepseek-ai/dsh-omp-loop'

const parts = { iteration: 2, maxIterations: 3, prompt: 'keep going' }

async function mount(sessionFirst = false) {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  const session = ctx.sessions.create(SessionId('omp-loop-invariant'))
  if (!sessionFirst) {
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await ctx.plugin(OmpLoopInvariant)
  }
  return { ctx, session }
}

describe('omp-loop continuation invariants', () => {
  it('accepts a continuation the renderer still owns', async () => {
    const { session } = await mount()
    expect(() => {
      session.append('user/message', createUserMessage({
        content: renderLoopPrompt(parts),
        source: { kind: 'plugin', plugin: LOOP_PLUGIN, form: 'notice', summary: 'loop 2/3' },
      }), { surfaceOp: 'append' })
    }).not.toThrow()
  })

  it('rejects plugin-sourced content that is not a renderer-owned loop prompt', async () => {
    const { session } = await mount()
    expect(() => {
      session.append('user/message', createUserMessage({
        content: [{ type: 'text', text: 'not a loop prompt' }],
        source: { kind: 'plugin', plugin: LOOP_PLUGIN },
      }), { surfaceOp: 'append' })
    }).toThrow(expect.objectContaining<Partial<InvariantError>>({
      code: 'INVARIANT',
      packageName: '@deepseek-ai/dsh-omp-loop',
    }))
  })

  it('rejects a continuation whose content differs from the package renderer', async () => {
    const { session } = await mount()
    const [block] = renderLoopPrompt(parts)
    expect(() => {
      session.append('user/message', createUserMessage({
        content: [{ ...block!, extra: true }] as never,
        source: { kind: 'plugin', plugin: LOOP_PLUGIN },
      }), { surfaceOp: 'append' })
    }).toThrow(expect.objectContaining<Partial<InvariantError>>({
      packageName: '@deepseek-ai/dsh-omp-loop',
    }))
  })

  it('ignores user/message events from other plugins and non-message events', async () => {
    const { session } = await mount()
    session.append('turn/start', { turn: 1 })
    expect(() => {
      session.append('user/message', createUserMessage({
        content: [{ type: 'text', text: 'not a loop prompt' }],
        source: { kind: 'plugin', plugin: 'other-plugin' },
      }), { surfaceOp: 'append' })
    }).not.toThrow()
  })

  it('attributes an invalid durable prefix during late loading', async () => {
    const { ctx, session } = await mount(true)
    session.append('user/message', createUserMessage({
      content: [{ type: 'text', text: 'counterfeit continuation' }],
      source: { kind: 'plugin', plugin: LOOP_PLUGIN },
    }), { surfaceOp: 'append' })
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await expect(ctx.plugin(OmpLoopInvariant)).rejects.toMatchObject({
      code: 'INVARIANT',
      packageName: '@deepseek-ai/dsh-omp-loop',
    })
  })
})

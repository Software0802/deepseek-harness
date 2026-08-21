import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import InvariantRegistry from '@deepseek-ai/dsh-invariants'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import SessionStore from '@deepseek-ai/dsh-session'
import * as MonitorInvariant from '@deepseek-ai/dsh-tool-monitor/invariant'
import { MONITOR_PLUGIN, renderMonitorLine } from '@deepseek-ai/dsh-tool-monitor'

describe('dsh-tool-monitor invariant', () => {
  it('validates already-logged follow-ups at install', async () => {
    const ctx = new Context()
    await ctx.plugin(SessionStore)
    const session = ctx.sessions.create()
    session.append('user/message', createUserMessage({
      content: renderMonitorLine('logged'),
      source: { kind: 'plugin', plugin: MONITOR_PLUGIN, form: 'notice', summary: 'logged' },
    }), { surfaceOp: 'append' })
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await expect(ctx.plugin(MonitorInvariant).then(() => undefined)).resolves.toBeUndefined()
    await ctx.fiber.dispose()
  })

  it('accepts renderer-owned follow-ups and rejects forged content', async () => {
    const ctx = new Context()
    await ctx.plugin(SessionStore)
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await ctx.plugin(MonitorInvariant)
    const session = ctx.sessions.create()
    expect(() => {
      session.append('user/message', createUserMessage({
        content: renderMonitorLine('ok'),
        source: { kind: 'plugin', plugin: MONITOR_PLUGIN, form: 'notice', summary: 'ok' },
      }), { surfaceOp: 'append' })
    }).not.toThrow()
    expect(() => {
      session.append('user/message', createUserMessage({
        content: [{ type: 'text', text: 'forged' }],
        source: { kind: 'plugin', plugin: MONITOR_PLUGIN },
      }), { surfaceOp: 'append' })
    }).toThrow(/renderer-owned monitor line/)
    expect(() => {
      session.append('user/message', createUserMessage({
        content: [{ type: 'text', text: 'human' }],
        source: { kind: 'user' },
      }), { surfaceOp: 'append' })
    }).not.toThrow()
    expect(() => {
      session.append('turn/start', { turn: 1 })
    }).not.toThrow()
    await ctx.fiber.dispose()
  })
})

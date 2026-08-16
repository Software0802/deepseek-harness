/**
 * Subscription (OAuth) login RPC behavior: dispatch through the llm registry,
 * success/failure mapping, and the configurable-provider directory carrying
 * authMethods for the Models page.
 */

import { describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import AgentRegistry from '@deepseek-ai/dsh-agent'
import LlmRuntime, { LlmAdapter } from '@deepseek-ai/dsh-llm'
import type { GenerateOptions, LlmOAuthFlows, StreamChunk } from '@deepseek-ai/dsh-llm'
import SessionStore from '@deepseek-ai/dsh-session'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import UserQuestionService from '@deepseek-ai/dsh-user-questions'
import type { RpcRequest } from '@deepseek-ai/dsh-host-apiproxy/api/rpc'
import { RpcId } from '@deepseek-ai/dsh-host-apiproxy/api/rpc'
import { createApiProxy } from '../src/api-proxy.ts'

let nextRpc = 1
function request<P>(payload: P): RpcRequest<P> {
  return { rpcId: RpcId(`oauth-${String(nextRpc++)}`), payload }
}

/** Minimal adapter: only registration identity is read by these tests. */
class NoopAdapter extends LlmAdapter {
  async *stream(_options: GenerateOptions): AsyncIterable<StreamChunk> {
    // never exercised
  }
}

/** A scripted flow set the proxy dispatches into. */
function scriptedFlows(): LlmOAuthFlows & {
  begin: ReturnType<typeof vi.fn>
  poll: ReturnType<typeof vi.fn>
  cancel: ReturnType<typeof vi.fn>
} {
  const flows = {
    begin: vi.fn(async () => ({
      id: 'flow-1',
      userCode: 'ABCD-EFGH',
      verificationUri: 'https://auth.example/device',
      expiresInSeconds: 600,
    })),
    poll: vi.fn(async (): Promise<{ status: 'pending' } | { status: 'success' } | { status: 'failed'; error: string }> =>
      ({ status: 'pending' })),
    cancel: vi.fn(() => undefined),
  } as LlmOAuthFlows & {
    begin: ReturnType<typeof vi.fn>
    poll: ReturnType<typeof vi.fn>
    cancel: ReturnType<typeof vi.fn>
  }
  return flows
}

async function harness(): Promise<{ ctx: Context; api: ReturnType<typeof createApiProxy> }> {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  await ctx.plugin(SystemPrompt, { persona: '' })
  await ctx.plugin(LlmRuntime)
  await ctx.plugin(UserQuestionService)
  await ctx.plugin(AgentRegistry)
  return { ctx, api: createApiProxy(ctx, {
    defaultModelSelection: () => ({ provider: 'deepseek-official', model: 'deepseek-v4-flash' }),
    cwd: '/tmp',
  }) }
}

describe('llm.oauth* RPC', () => {
  it('begins, polls, and cancels through the registered flows', async () => {
    const { ctx, api } = await harness()
    const flows = scriptedFlows()
    ctx.llm.registerOAuthFlows('llm-pi-ai', flows)

    const begun = await api.llm.oauthBegin(request({ settingsNs: 'llm-pi-ai', provider: 'xai' }))
    expect(begun.result).toEqual({ ok: true, value: {
      id: 'flow-1',
      userCode: 'ABCD-EFGH',
      verificationUri: 'https://auth.example/device',
      expiresInSeconds: 600,
    } })
    expect(flows.begin).toHaveBeenCalledWith('xai', undefined)

    const polled = await api.llm.oauthPoll(request({ settingsNs: 'llm-pi-ai', id: 'flow-1' }))
    expect(polled.result).toEqual({ ok: true, value: { status: 'pending' } })
    expect(flows.poll).toHaveBeenCalledWith('flow-1')

    const cancelled = await api.llm.oauthCancel(request({ settingsNs: 'llm-pi-ai', id: 'flow-1' }))
    expect(cancelled.result).toEqual({ ok: true, value: {} })
    expect(flows.cancel).toHaveBeenCalledWith('flow-1')
  })

  it('maps a refused begin to a business failure naming the route', async () => {
    const { ctx, api } = await harness()
    const flows = scriptedFlows()
    ctx.llm.registerOAuthFlows('llm-pi-ai', flows)
    flows.begin.mockRejectedValueOnce(new Error('provider refused the device request'))

    const response = await api.llm.oauthBegin(request({ settingsNs: 'llm-pi-ai', provider: 'xai' }))
    expect(response.result).toMatchObject({
      ok: false,
      error: {
        code: 'oauth-begin-failed',
        message: 'provider refused the device request',
        details: { settingsNs: 'llm-pi-ai', provider: 'xai' },
      },
    })
  })

  it('fails when no adapter family serves the namespace', async () => {
    const { api } = await harness()
    const response = await api.llm.oauthBegin(request({ settingsNs: 'llm-absent', provider: 'xai' }))
    expect(response.result.ok).toBe(false)
    if (response.result.ok) throw new Error('unreachable')
    expect(response.result.error.code).toBe('oauth-begin-failed')
    expect(response.result.error.message).toMatch(/no OAuth flows/)
  })

  it('surfaces a failed login through poll', async () => {
    const { ctx, api } = await harness()
    const flows = scriptedFlows()
    ctx.llm.registerOAuthFlows('llm-pi-ai', flows)
    flows.poll.mockResolvedValueOnce({ status: 'failed', error: 'authorization_denied' })

    const polled = await api.llm.oauthPoll(request({ settingsNs: 'llm-pi-ai', id: 'flow-1' }))
    expect(polled.result).toEqual({ ok: true, value: { status: 'failed', error: 'authorization_denied' } })
  })

  it('carries authMethods and the login label on directory entries', async () => {
    const { ctx, api } = await harness()
    ctx.llm.registerConfigurableProviders([
      {
        provider: 'xai',
        displayName: 'xai',
        settingsNs: 'llm-pi-ai',
        settingsPath: ['providers', 'xai'],
        authMethods: ['api-key', 'oauth'],
        oauthLoginLabel: 'Sign in with SuperGrok or X Premium',
      },
      { provider: 'openai', displayName: 'openai', settingsNs: 'llm-pi-ai', settingsPath: ['providers', 'openai'] },
    ])
    ctx.llm.registerAdapter(['openai'], new NoopAdapter())

    const listed = await api.llm.providers(request({}))
    if (!listed.result.ok) throw new Error('expected successful response')
    const xai = listed.result.value.providers.find(entry => entry.provider === 'xai')
    expect(xai).toMatchObject({
      provider: 'xai',
      authMethods: ['api-key', 'oauth'],
      oauthLoginLabel: 'Sign in with SuperGrok or X Premium',
      active: false,
    })
    const openai = listed.result.value.providers.find(entry => entry.provider === 'openai')
    expect(openai).toMatchObject({ provider: 'openai', active: true })
    expect(openai?.authMethods).toBeUndefined()
  })
})

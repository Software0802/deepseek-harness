/**
 * Subscription (OAuth) login coverage for the pi-ai adapter family: profile
 * validation, the device-code flow lifecycle, credential serialization, and
 * the request-path refresh/exchange of a stored subscription credential.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import type { AuthInteraction, OAuthAuth, OAuthCredential } from '@earendil-works/pi-ai'
import { LlmError } from '@deepseek-ai/dsh-llm'
import { createOAuthFlows, oauthRequestAuth, parseOAuthCredential, serializeOAuthCredential } from '../src/oauth.ts'
import { resolveProfiles } from '../src/config.ts'

afterEach(() => {
  vi.unstubAllEnvs()
})

/** The mock shapes the scripted flow exposes, so call sites keep precise types. */
type LoginFn = (interaction: AuthInteraction) => Promise<OAuthCredential>
type RefreshFn = (credential: OAuthCredential) => Promise<OAuthCredential>
type ToAuthFn = (credential: OAuthCredential) => Promise<{ apiKey?: string }>

/** A scripted OAuth flow: login emits a device code, then settles on command. */
function scriptedOAuth(overrides: Partial<OAuthAuth> = {}): OAuthAuth & {
  login: Mock<LoginFn>
  refresh: Mock<RefreshFn>
  toAuth: Mock<ToAuthFn>
} {
  const flow = {
    name: 'Scripted Subscription',
    loginLabel: 'Sign in with the scripted subscription',
    login: vi.fn<LoginFn>(
      () => new Promise<OAuthCredential>(() => { /* settles on command */ }),
    ),
    refresh: vi.fn<RefreshFn>(async (credential: OAuthCredential) => ({
      ...credential,
      access: 'refreshed-access',
      expires: Date.now() + 3600_000,
    })),
    toAuth: vi.fn<ToAuthFn>(async (credential: OAuthCredential) => ({ apiKey: credential.access })),
    ...overrides,
  } as OAuthAuth & {
    login: Mock<LoginFn>
    refresh: Mock<RefreshFn>
    toAuth: Mock<ToAuthFn>
  }
  return flow
}

/**
 * The device step of a scripted login: the mock emits the device code itself
 * (as the real provider does before returning its pending promise), so begin
 * resolves with the code, and exposes settle/fail to drive the login outcome.
 * The step object is shared with the mock's promise executor, so the controls
 * light up the moment the mock runs.
 */
function deviceStep(
  login: Mock<LoginFn>,
  device: { userCode: string; verificationUri: string; expiresInSeconds?: number } = {
    userCode: 'ABCD-EFGH',
    verificationUri: 'https://auth.example/device',
    expiresInSeconds: 600,
  },
): {
  settle: (credential: OAuthCredential) => void
  fail: (error: Error) => void
} {
  const step: {
    settle: (credential: OAuthCredential) => void
    fail: (error: Error) => void
  } = {
    settle: () => { throw new Error('login never started') },
    fail: () => { throw new Error('login never started') },
  }
  login.mockImplementation((interaction: AuthInteraction): Promise<OAuthCredential> => {
    interaction.notify({ type: 'device_code', ...device })
    return new Promise<OAuthCredential>((resolve, reject) => {
      step.settle = resolve
      step.fail = reject
    })
  })
  return step
}

/** An in-memory credential seam stand-in recording writes. */
function memoryStore(): {
  values: Map<string, string>
  set: (ref: string, value: string) => Promise<void>
} {
  const values = new Map<string, string>()
  return {
    values,
    set: async (ref, value) => { values.set(ref, value) },
  }
}

describe('profile auth resolution', () => {
  it('defaults a catalog route with both methods to api-key', () => {
    const resolved = resolveProfiles({ xai: { apiKeyEnv: 'XAI_TEST' } })
    expect(resolved.get('xai')?.auth).toBe('api-key')
  })

  it('defaults an oauth-only catalog route to oauth', () => {
    // openai-codex is the installed catalog provider whose only native method
    // is OAuth; the adapter cannot authenticate it with a key, so a profile
    // naming a reference is a subscription route by default.
    const resolved = resolveProfiles({ 'openai-codex': { apiKeyEnv: 'OPENAI_CODEX_API_KEY' } })
    expect(resolved.get('openai-codex')?.auth).toBe('oauth')
  })

  it('accepts an explicit oauth profile naming a reference', () => {
    const resolved = resolveProfiles({ xai: { apiKeyEnv: 'XAI_TEST', auth: 'oauth' } })
    expect(resolved.get('xai')).toMatchObject({ auth: 'oauth', apiKeyEnv: 'XAI_TEST' })
  })

  it('refuses oauth on a route whose catalog offers no subscription login', () => {
    expect(() => resolveProfiles({ openai: { apiKeyEnv: 'OPENAI_TEST', auth: 'oauth' } }))
      .toThrow(/openai.*subscription login/)
  })

  it('refuses oauth without a reference to store under', () => {
    expect(() => resolveProfiles({ xai: { auth: 'oauth' } }))
      .toThrow(/xai.*apiKeyEnv/)
  })
})

describe('subscription credential serialization', () => {
  const credential: OAuthCredential = {
    type: 'oauth',
    access: 'access-token',
    refresh: 'refresh-token',
    expires: 1_700_000_000_000,
  }

  it('round-trips a credential through its stored document', () => {
    const stored = serializeOAuthCredential(credential)
    expect(parseOAuthCredential(stored)).toEqual(credential)
  })

  it('recognizes only tagged documents', () => {
    expect(parseOAuthCredential('sk-plain-key')).toBeUndefined()
    expect(parseOAuthCredential('not json')).toBeUndefined()
    expect(parseOAuthCredential('{"type":"other","access":"a","refresh":"b","expires":1}')).toBeUndefined()
    expect(parseOAuthCredential('{"type":"oauth","access":"","refresh":"b","expires":1}')).toBeUndefined()
    expect(parseOAuthCredential('{"type":"oauth","access":"a","refresh":"","expires":1}')).toBeUndefined()
    expect(parseOAuthCredential('{"type":"oauth","access":"a","refresh":"b","expires":"later"}')).toBeUndefined()
  })
})

describe('createOAuthFlows', () => {
  function flowsOver(profile: Record<string, unknown>) {
    const store = memoryStore()
    const oauth = scriptedOAuth()
    const flows = createOAuthFlows({
      profiles: () => resolveProfiles({ xai: profile }),
      oauthOf: () => oauth,
      resolveStore: () => store as never,
    })
    return { flows, oauth, store }
  }

  it('begins with the device code the provider emits, then reports success once stored', async () => {
    const { flows, oauth, store } = flowsOver({ apiKeyEnv: 'XAI_TEST', auth: 'oauth' })
    // The device step must be in place before begin runs the login.
    const step = deviceStep(oauth.login)
    const begun = await flows.begin('xai')
    expect(begun.id).toMatch(/^oauth-/)
    expect(begun.userCode).toBe('ABCD-EFGH')
    expect(begun.verificationUri).toBe('https://auth.example/device')
    expect(begun.expiresInSeconds).toBe(600)

    expect(await flows.poll(begun.id)).toEqual({ status: 'pending' })

    const credential: OAuthCredential = {
      type: 'oauth', access: 'access-token', refresh: 'refresh-token', expires: Date.now() + 3600_000,
    }
    step.settle(credential)
    await vi.waitFor(async () => {
      expect(await flows.poll(begun.id)).toEqual({ status: 'success' })
    })
    // The credential landed in the seam under the profile's reference, tagged
    // so the request path recognizes it.
    const stored = store.values.get('XAI_TEST')
    expect(stored).toBeDefined()
    expect(parseOAuthCredential(stored!)).toEqual(credential)
  })

  it('reports a failed login with the provider message', async () => {
    const { flows, oauth } = flowsOver({ apiKeyEnv: 'XAI_TEST', auth: 'oauth' })
    const step = deviceStep(oauth.login)
    const begun = await flows.begin('xai')
    step.fail(new Error('authorization_denied'))
    await vi.waitFor(async () => {
      expect(await flows.poll(begun.id)).toEqual({ status: 'failed', error: 'authorization_denied' })
    })
  })

  it('cancels a pending flow and settles it failed', async () => {
    const { flows, oauth } = flowsOver({ apiKeyEnv: 'XAI_TEST', auth: 'oauth' })
    // The device step must be installed for begin to resolve with a code.
    deviceStep(oauth.login)
    const begun = await flows.begin('xai')
    expect(await flows.poll(begun.id)).toEqual({ status: 'pending' })
    flows.cancel(begun.id)
    expect(await flows.poll(begun.id)).toEqual({ status: 'failed', error: 'Login cancelled' })
  })

  it('refuses begin without a profile, a reference, or a flow', async () => {
    const { flows } = flowsOver({ apiKeyEnv: 'XAI_TEST', auth: 'oauth' })
    await expect(flows.begin('missing')).rejects.toThrow(/no profile/)
    await expect(createOAuthFlows({
      profiles: () => resolveProfiles({ xai: {} }),
      oauthOf: () => undefined,
    }).begin('xai')).rejects.toThrow(/no apiKeyEnv/)
    const keyless = createOAuthFlows({
      profiles: () => resolveProfiles({ xai: { apiKeyEnv: 'XAI_TEST' } }),
      oauthOf: () => undefined,
    })
    await expect(keyless.begin('xai')).rejects.toThrow(/no subscription login/)
  })

  it('poll and cancel refuse unknown flow ids', async () => {
    const { flows } = flowsOver({ apiKeyEnv: 'XAI_TEST', auth: 'oauth' })
    await expect(flows.poll('nope')).rejects.toBeInstanceOf(LlmError)
    expect(() => { flows.cancel('nope') }).toThrow(/unknown subscription login/)
  })

  it('dispose settles still-pending flows failed', async () => {
    const { flows, oauth } = flowsOver({ apiKeyEnv: 'XAI_TEST', auth: 'oauth' })
    // The device step must be installed for begin to resolve with a code.
    deviceStep(oauth.login)
    const begun = await flows.begin('xai')
    flows.dispose()
    expect(await flows.poll(begun.id)).toEqual({ status: 'failed', error: 'the plugin stopped while the login was pending' })
  })
})

describe('oauthRequestAuth', () => {
  it('passes a fresh credential through without refresh', async () => {
    const oauth = scriptedOAuth()
    const credential: OAuthCredential = {
      type: 'oauth', access: 'fresh-access', refresh: 'r', expires: Date.now() + 3600_000,
    }
    const auth = await oauthRequestAuth(oauth, credential)
    expect(auth).toEqual({ apiKey: 'fresh-access' })
    expect(oauth.refresh).not.toHaveBeenCalled()
  })

  it('refreshes an expired credential, persists it, and uses the new token', async () => {
    const oauth = scriptedOAuth()
    const credential: OAuthCredential = {
      type: 'oauth', access: 'stale-access', refresh: 'r', expires: Date.now() - 1000,
    }
    const persisted: OAuthCredential[] = []
    const auth = await oauthRequestAuth(oauth, credential, async (refreshed) => { persisted.push(refreshed) })
    expect(oauth.refresh).toHaveBeenCalledWith(credential)
    expect(persisted).toHaveLength(1)
    // The refreshed credential keeps identity and refresh token, swaps the
    // access token, and carries a fresh expiry (asserted as a number below —
    // the exact timestamp is the mock's, not the flow's).
    expect(persisted[0]).toMatchObject({ type: 'oauth', access: 'refreshed-access', refresh: 'r' })
    expect(typeof persisted[0]?.expires).toBe('number')
    expect(auth).toEqual({ apiKey: 'refreshed-access' })
  })

  it('keeps serving the refreshed token when persistence fails', async () => {
    const oauth = scriptedOAuth()
    const credential: OAuthCredential = {
      type: 'oauth', access: 'stale-access', refresh: 'r', expires: Date.now() - 1000,
    }
    const auth = await oauthRequestAuth(oauth, credential, async () => { throw new Error('disk full') })
    expect(auth).toEqual({ apiKey: 'refreshed-access' })
  })

  it('returns no api key when the flow derives none', async () => {
    const oauth = scriptedOAuth({ toAuth: vi.fn(async () => ({})) })
    const credential: OAuthCredential = {
      type: 'oauth', access: 'a', refresh: 'r', expires: Date.now() + 3600_000,
    }
    expect(await oauthRequestAuth(oauth, credential)).toEqual({})
  })
})

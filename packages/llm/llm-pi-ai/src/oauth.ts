/**
 * Subscription (OAuth) login flows for one pi-ai provider route family.
 *
 * A catalog route whose provider offers an OAuth method (xAI's SuperGrok / X
 * Premium sign-in is the shipped one) can authenticate with a subscription
 * instead of an API key. This module runs the provider's own device-code
 * flow, and stores the resulting credential through the harness credential
 * seam under the profile's `apiKeyEnv` reference — as a JSON document, so the
 * seam stays a string store while the value carries access token, refresh
 * token, and expiry together. The request path recognizes that document and
 * refreshes it when expired; nothing here depends on the profile's `auth`
 * field, so a login run while the profile still said `api-key` keeps working.
 *
 * @module dsh-llm-pi-ai/oauth
 */

import { randomUUID } from 'node:crypto'
import type { AuthInteraction, OAuthAuth, OAuthCredential } from '@earendil-works/pi-ai'
import { LlmError } from '@deepseek-ai/dsh-llm'
import type { LlmOAuthBeginResult, LlmOAuthDeviceCode, LlmOAuthFlows, LlmOAuthStatus } from '@deepseek-ai/dsh-llm'
import type { CredentialProvider } from '@deepseek-ai/dsh-credentials'
import { catalogProviderOAuth } from './catalog.ts'
import type { ResolvedPiAiProviderProfile } from './config.ts'

/** The JSON marker the stored credential carries so the request path can tell it from an API key. */
const OAUTH_TYPE = 'oauth'

/**
 * The stored wire form of one OAuth credential: the whole credential under a
 * `type` tag, so the seam stores one opaque string and the request path
 * recognizes it without the profile having to say which auth it is.
 * @param credential - the credential a login flow produced.
 * @returns the JSON document to store under the profile's reference.
 */
export function serializeOAuthCredential(credential: OAuthCredential): string {
  return JSON.stringify({ ...credential, type: OAUTH_TYPE })
}

/**
 * Recognize and detach a stored subscription credential.
 * @param value - the value stored under a profile's reference.
 * @returns the credential, or undefined when the value is not one (an API
 *   key, or a malformed document — which the caller may still hand to the
 *   api-key path, whose own validation will refuse it).
 */
export function parseOAuthCredential(value: string): OAuthCredential | undefined {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return undefined
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return undefined
  const candidate = parsed as Partial<OAuthCredential>
  if (candidate.type !== OAUTH_TYPE) return undefined
  const access = candidate.access
  const refresh = candidate.refresh
  const expires = candidate.expires
  if (typeof access !== 'string' || access.length === 0) return undefined
  if (typeof refresh !== 'string' || refresh.length === 0) return undefined
  if (typeof expires !== 'number' || !Number.isFinite(expires)) return undefined
  return { ...candidate, type: OAUTH_TYPE, access, refresh, expires }
}

/** The live state of one begun login flow. */
interface OAuthFlowEntry {
  /** The id `poll` and `cancel` address this flow by. */
  id: string
  /** Owns the flow's own cancellation, independent of the transport that began it. */
  controller: AbortController
  status: 'pending' | 'success' | 'failed'
  /** Failure message, once failed. */
  error?: string
}

/**
 * Turn one stored subscription credential into request auth, refreshing it
 * when expired. Refresh happens on the request path — the login flow set the
 * expiry with its own skew, so a token this side of that boundary is still
 * valid — and a rotated credential is handed to `persist` for the caller to
 * store back; persistence is the caller's durability choice.
 * @param oauth - the catalog's OAuth flow for the route.
 * @param credential - the stored credential, possibly expired.
 * @param persist - called with the refreshed credential after a refresh;
 *   rejects must not fail the request (the next request refreshes again).
 * @returns the bearer auth pi-ai's apiKey override should carry.
 */
export async function oauthRequestAuth(
  oauth: OAuthAuth,
  credential: OAuthCredential,
  persist?: (refreshed: OAuthCredential) => Promise<void>,
): Promise<{ apiKey?: string }> {
  let current = credential
  if (current.expires <= Date.now()) {
    current = await oauth.refresh(current)
    if (persist !== undefined) {
      try {
        await persist(current)
      } catch {
        // Best-effort: the next request would refresh again if the write
        // failed, and a failed write must not fail a request that already
        // holds a valid token.
      }
    }
  }
  const auth = await oauth.toAuth(current)
  return auth.apiKey === undefined ? {} : { apiKey: auth.apiKey }
}

/** Constructor options for {@link createOAuthFlows}. */
export interface OAuthFlowsOptions {
  /** Current validated profiles by provider route; read per begin. */
  profiles: () => ReadonlyMap<string, ResolvedPiAiProviderProfile>
  /**
   * The catalog's OAuth auth for one route. Defaults to the installed
   * catalog; injectable so tests can script a flow without pi-ai.
   */
  oauthOf?: (provider: string) => OAuthAuth | undefined
  /** The credential seam, resolved per operation; undefined outside a mounted seam. */
  resolveStore?: () => CredentialProvider | undefined
}

/**
 * Build the subscription login flows for this adapter family.
 * @param options - resolution hooks owned by the plugin.
 * @returns the flows, plus a disposer that aborts every still-pending flow.
 */
export function createOAuthFlows(options: OAuthFlowsOptions): LlmOAuthFlows & { dispose(): void } {
  const oauthOf = options.oauthOf ?? catalogProviderOAuth
  const flows = new Map<string, OAuthFlowEntry>()

  return {
    async begin(provider: string, externalSignal?: AbortSignal): Promise<LlmOAuthBeginResult> {
      const profile = options.profiles().get(provider)
      if (profile === undefined) {
        throw new LlmError(`llm-pi-ai: no profile for provider "${provider}"`, 'NO_ADAPTER')
      }
      const ref = profile.apiKeyEnv
      if (ref === undefined) {
        throw new LlmError(
          `llm-pi-ai: provider "${provider}" has no apiKeyEnv to store a subscription credential under`,
          'MISSING_CREDENTIAL',
        )
      }
      const oauth = oauthOf(provider)
      if (oauth === undefined) {
        throw new LlmError(`llm-pi-ai: provider "${provider}" offers no subscription login`, 'UNSUPPORTED_OPTION')
      }
      const controller = new AbortController()
      const signal = externalSignal === undefined
        ? controller.signal
        : AbortSignal.any([externalSignal, controller.signal])
      const id = `oauth-${randomUUID()}`
      const entry: OAuthFlowEntry = { id, controller, status: 'pending' }
      flows.set(id, entry)

      let settleDevice!: (device: LlmOAuthDeviceCode) => void
      let failDevice!: (error: Error) => void
      const device = new Promise<LlmOAuthDeviceCode>((resolve, reject) => {
        settleDevice = resolve
        failDevice = reject
      })
      signal.addEventListener('abort', () => {
        failDevice(new Error('Login cancelled'))
      }, { once: true })

      // The harness never prompts: every flow this family runs today is a
      // device-code flow whose only interaction is the notify below. Refusing
      // beats silently waiting for input nobody can give.
      const interaction: AuthInteraction = {
        signal,
        prompt: () => Promise.reject(new Error('llm-pi-ai: interactive prompts are not supported by subscription login')),
        notify: (event) => {
          if (event.type === 'device_code') {
            settleDevice({
              userCode: event.userCode,
              verificationUri: event.verificationUri,
              ...event.expiresInSeconds === undefined ? {} : { expiresInSeconds: event.expiresInSeconds },
            })
          }
        },
      }
      void oauth.login(interaction).then(
        (credential) => {
          const store = options.resolveStore?.()
          if (store === undefined) {
            if (entry.status === 'pending') {
              entry.status = 'failed'
              entry.error = 'no credential store is mounted; the subscription login cannot persist'
            }
            return
          }
          return store.set(ref, serializeOAuthCredential(credential)).then(
            () => {
              if (entry.status === 'pending') entry.status = 'success'
            },
            (error: unknown) => {
              if (entry.status === 'pending') {
                entry.status = 'failed'
                entry.error = error instanceof Error ? error.message : String(error)
              }
            },
          )
        },
        (error: unknown) => {
          if (entry.status === 'pending') {
            entry.status = 'failed'
            entry.error = error instanceof Error ? error.message : String(error)
          }
        },
      )

      try {
        const { userCode, verificationUri, expiresInSeconds } = await device
        return {
          id,
          userCode,
          verificationUri,
          ...expiresInSeconds === undefined ? {} : { expiresInSeconds },
        }
      } catch (error) {
        // The device step failed (usually cancelled): the login promise above
        // settles the entry on its own, so this begin just surfaces the same
        // outcome to the caller that began it.
        flows.delete(id)
        throw error instanceof Error ? error : new Error(String(error))
      }
    },

    poll(id: string): Promise<LlmOAuthStatus> {
      const entry = flows.get(id)
      if (entry === undefined) {
        return Promise.reject(new LlmError(`llm-pi-ai: unknown subscription login "${id}"`, 'UNKNOWN_OAUTH_FLOW'))
      }
      if (entry.status === 'pending') return Promise.resolve({ status: 'pending' })
      if (entry.status === 'success') return Promise.resolve({ status: 'success' })
      return Promise.resolve({ status: 'failed', error: entry.error ?? 'the login failed' })
    },

    cancel(id: string): void {
      const entry = flows.get(id)
      if (entry === undefined) {
        throw new LlmError(`llm-pi-ai: unknown subscription login "${id}"`, 'UNKNOWN_OAUTH_FLOW')
      }
      if (entry.status === 'pending') {
        entry.status = 'failed'
        entry.error = 'Login cancelled'
      }
      entry.controller.abort('login cancelled')
    },

    dispose(): void {
      // Settle rather than clear: a poll racing the disposal still names the
      // flow, and a terminal answer beats "unknown" for whatever UI held it.
      for (const entry of flows.values()) {
        if (entry.status === 'pending') {
          entry.status = 'failed'
          entry.error = 'the plugin stopped while the login was pending'
        }
        entry.controller.abort('plugin disposed')
      }
    },
  }
}

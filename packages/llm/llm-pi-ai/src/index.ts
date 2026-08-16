/**
 * Generic pi-ai-backed LLM adapter plugin. One plugin instance owns a dict of
 * provider routes; a route naming an installed pi-ai provider inherits that
 * provider's endpoint, protocol, and model catalog as defaults, and a route
 * pi-ai does not ship is declared outright. Profile facts resolve per request
 * over the optional `llm-pi-ai` user-settings section and the optional
 * credential seam, so a changed key, endpoint, model, or knob reaches the next
 * request without a restart; a changed *route set* (or a route's
 * registration-captured retry policy) re-registers the same adapter instance
 * in place.
 *
 * ```yaml
 * - id: llm
 *   name: '@deepseek-ai/dsh-llm-pi-ai'
 *   config:
 *     providers:
 *       # Catalog route: everything but the credential comes from pi-ai.
 *       openai:
 *         apiKeyEnv: OPENAI_API_KEY
 *         retryPolicy:
 *           mode: normal
 *           maxRetries: 2
 *       # Catalog route authenticated by a subscription login (xAI's
 *       # SuperGrok / X Premium sign-in is the shipped one). The login
 *       # stores its credential under apiKeyEnv, which oauth requires.
 *       xai:
 *         apiKeyEnv: XAI_API_KEY
 *         auth: oauth
 *       # Catalog route with the catalog narrowed and one capacity corrected.
 *       anthropic:
 *         apiKeyEnv: ANTHROPIC_API_KEY
 *         models:
 *           - id: claude-sonnet-4-5
 *             contextWindow: 200000
 *       # Hand-declared route: pi-ai ships nothing under this key.
 *       acme-gateway:
 *         displayName: Acme Gateway
 *         apiKeyEnv: ACME_GATEWAY_API_KEY
 *         api: openai-completions
 *         baseURL: https://gateway.acme.example/v1
 *         # Reasoning dialect for a URL pi-ai cannot recognize.
 *         compat:
 *           thinkingFormat: deepseek
 *         models:
 *           - id: acme-large
 *             name: Acme Large
 *             contextWindow: 65536
 *             maxTokens: 4096
 *           - id: acme-think
 *             name: Acme Think
 *             contextWindow: 262144
 *             maxTokens: 32768
 *             # key = selectable level, value = wire spelling; only off may
 *             # leave the value empty (supported, send nothing).
 *             reasoningEfforts:
 *               off:
 *               high: high
 *               max: ultra
 * ```
 *
 * @module @deepseek-ai/dsh-llm-pi-ai
 */

import type { Context } from '@deepseek-ai/cordis'
import type { CredentialRef } from '@deepseek-ai/dsh-credentials'
import { launchEnvironmentOf } from '@deepseek-ai/dsh-launch-environment'
import { assertUsableApiKey, INVALID_CREDENTIAL_CODE, LlmError } from '@deepseek-ai/dsh-llm'
import type { AdapterRegistrationHandle, DirectoryRegistrationHandle, LlmConfigurableProvider } from '@deepseek-ai/dsh-llm'
import { deepEqualJson, installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import { PiAiAdapter } from './adapter.ts'
import type { ResolvedPiAiAuth } from './adapter.ts'
import { catalogProviderAuthMethods, catalogProviderIds, catalogProviderOAuth } from './catalog.ts'
import { assertServiceable, Config, resolveProfiles } from './config.ts'
import type { ResolvedPiAiProviderProfile } from './config.ts'
import { discoverModels } from './discovery.ts'
import { createOAuthFlows, oauthRequestAuth, parseOAuthCredential, serializeOAuthCredential } from './oauth.ts'

export * from './oauth.ts'

export { PiAiAdapter } from './adapter.ts'
export type { PiAiAdapterOptions } from './adapter.ts'
export { Config } from './config.ts'
export type {
  PiAiCompatProfile,
  PiAiModality,
  PiAiModelOverride,
  PiAiModelProfile,
  PiAiProviderProfile,
  PiAiReasoningEfforts,
  PiAiThinkingFormat,
  ResolvedPiAiProviderProfile,
} from './config.ts'
export { supportedProtocols } from './provider.ts'

export const name = 'llm-pi-ai'
export const inject = ['llm']

const NS = settingsNamespace('llm-pi-ai')

/**
 * The registry captures these per route; a change here must re-register.
 * Sorted by provider so a settings document that merely reorders its keys is
 * not mistaken for a route change.
 */
function registrationFacts(profiles: ReadonlyMap<string, ResolvedPiAiProviderProfile>): unknown {
  return [...profiles.entries()]
    // `displayName` rides along because the registry hands it to every selector
    // through `providerInfo()`: a rename that did not re-register would leave
    // the old label showing until some unrelated fact happened to change.
    .map(([provider, profile]) => ({
      provider,
      displayName: profile.displayName,
      retryPolicy: profile.retryPolicy,
    }))
    .sort((left, right) => left.provider.localeCompare(right.provider))
}

/**
 * The configurable-provider directory: every installed catalog route this
 * adapter can authenticate — with a stored API key or a subscription login —
 * plus every route the current profiles declare. A hand-declared route has no
 * catalog entry, so without this union it would have no settings address and
 * configuration surfaces could neither show nor edit it.
 *
 * The profile half is unconditional, which is what keeps a route already
 * stored against a withheld provider editable and deletable rather than
 * stranded in the settings document with nothing on the page to remove it.
 * @param profiles - the currently resolved provider profiles.
 * @returns the directory entries in catalog order, declared routes last.
 */
function directoryEntries(
  profiles: ReadonlyMap<string, ResolvedPiAiProviderProfile>,
): LlmConfigurableProvider[] {
  const catalog = new Set(catalogProviderIds())
  const entries = new Map<string, LlmConfigurableProvider>()
  const declare = (provider: string, displayName: string): void => {
    const methods = catalogProviderAuthMethods(provider)
    const oauth = methods.includes('oauth') ? catalogProviderOAuth(provider) : undefined
    entries.set(provider, {
      provider,
      displayName,
      settingsNs: NS,
      settingsPath: ['providers', provider],
      // Membership of the installed catalog, not of the settings document:
      // narrowing a shipped provider's models stores a profile too, and that
      // route is still one pi-ai knows.
      declared: !catalog.has(provider),
      ...methods.length > 0 ? { authMethods: methods } : {},
      ...oauth !== undefined && oauth.loginLabel !== undefined ? { oauthLoginLabel: oauth.loginLabel } : {},
    })
  }
  // A provider whose only native method is OAuth is still offerable: the
  // harness runs the catalog's own subscription login and stores the
  // credential itself, so a card can offer that route with a working posture.
  // Only a catalog provider with no harness-authenticatable method at all is
  // withheld from the page, since nothing there could ever authenticate it.
  for (const provider of catalog) {
    if (catalogProviderAuthMethods(provider).length > 0) declare(provider, provider)
  }
  for (const [provider, profile] of profiles) declare(provider, profile.displayName)
  return [...entries.values()]
}

/** Register one generic pi-ai adapter for all configured provider routes. */
export function apply(ctx: Context, config: Config): void {
  let current: () => Config = () => config
  let lastRaw: Config | undefined
  let memoized: ReadonlyMap<string, ResolvedPiAiProviderProfile> | undefined
  /**
   * The resolved profiles for the current configuration, memoized by the raw
   * snapshot's identity — which is also what makes the adapter's own snapshot
   * stable across operations that observe no change.
   *
   * No fallback for an unserviceable snapshot lives here: the section schema
   * resolves the whole profile set, so a write that could not be served is
   * refused where it is written, and the settings seam keeps a namespace's
   * last good value for a stored section that fails. Anything reaching this
   * point has already resolved once.
   */
  const profiles = (): ReadonlyMap<string, ResolvedPiAiProviderProfile> => {
    const raw = current()
    if (raw === lastRaw && memoized !== undefined) return memoized
    const next = resolveProfiles(raw.providers)
    lastRaw = raw
    memoized = next
    return next
  }
  profiles()

  const resolveCredentialValue = async (ref: CredentialRef): Promise<string | undefined> => {
    const credentials = ctx.get('credentials')
    if (credentials !== undefined) {
      const hit = await credentials.resolve(ref)
      if (hit !== undefined) return hit.value
    } else {
      // Without the seam there is no managed store to rank against, so the
      // environment is the whole credential plane.
      const ambient = launchEnvironmentOf(ctx).get(ref)
      if (ambient !== undefined && ambient.value.length > 0) return ambient.value
    }
    return undefined
  }

  /**
   * Resolve one profile's credential into request auth. An API key passes
   * through; a stored subscription credential — the JSON document a login
   * wrote — is refreshed when expired, persisted again, and exchanged for a
   * bearer key through the catalog's own OAuth flow, so the request path
   * never sees a token document or an expiry. `undefined` means the profile
   * names no credential and the route authenticates through its provider's
   * own path; a named reference that misses fails loud either way.
   */
  const resolveAuth = async (
    provider: string,
    profile: ResolvedPiAiProviderProfile,
  ): Promise<ResolvedPiAiAuth | undefined> => {
    const ref = profile.apiKeyEnv
    // Only a profile that names no credential at all defers to pi-ai's
    // provider-native discovery. Once one is named, a miss must fail loud:
    // handing pi-ai `undefined` would let it pick up an unrelated ambient key
    // (OPENAI_API_KEY and friends), billing another tenant for a request the
    // deployment meant to authenticate differently.
    if (ref === undefined) return undefined
    const value = await resolveCredentialValue(ref)
    if (value === undefined) {
      throw new LlmError(
        profile.auth === 'oauth'
          ? `llm-pi-ai: no subscription credential for provider route "${provider}"; sign in on the web Models`
            + ` page, or export ${ref} in the launching environment`
          : `llm-pi-ai: no credential for provider route "${provider}"; its profile resolves ${ref}, which is not`
            + ` set — store ${ref} through the credentials service (the web Models page writes it) or export it,`
            + ' and remove apiKeyEnv only if this provider should authenticate from pi-ai\'s own environment discovery',
        'MISSING_CREDENTIAL',
      )
    }
    const oauthCredential = parseOAuthCredential(value)
    if (oauthCredential === undefined) {
      // A plain API key, or a malformed document — either way the api-key
      // validator is the one that refuses a value that cannot authenticate.
      return { apiKey: assertUsableApiKey(value, 'llm-pi-ai', ref) }
    }
    // A stored subscription credential, from this or an earlier login. The
    // profile's `auth` field is deliberately not consulted: a login run while
    // the profile still said `api-key` must keep working.
    const oauth = catalogProviderOAuth(provider)
    if (oauth === undefined) {
      // A hand-declared route (one the catalog does not ship) has no login
      // flow to refresh with, but its credential is still a bearer token:
      // serve the stored access token until it expires, then fail loud with
      // the one thing that can fix it — signing in again under a catalog
      // route that shares this reference.
      if (oauthCredential.expires > Date.now()) {
        return { apiKey: oauthCredential.access }
      }
      throw new LlmError(
        `llm-pi-ai: the subscription credential for provider route "${provider}" has expired, and its catalog`
        + ' entry offers no login to refresh it with; sign in again on the Models page (the same provider family\'s'
        + ' catalog route — for Grok that is "xai" — stores a fresh credential under the same reference)',
        INVALID_CREDENTIAL_CODE,
      )
    }
    // Refresh when expired (the login flow set the expiry with its own skew,
    // so a token this side of that boundary is still valid) and persist the
    // rotated credential best-effort: the seam owns durability, and the next
    // request would refresh again if this write failed.
    const auth = await oauthRequestAuth(oauth, oauthCredential, async (refreshed) => {
      const store = ctx.get('credentials')
      if (store === undefined) return
      try {
        await store.set(ref, serializeOAuthCredential(refreshed))
      } catch (error) {
        ctx.logger.warn('llm-pi-ai: could not persist the refreshed subscription credential for "%s"', provider)
        ctx.logger.warn(error)
      }
    })
    return auth.apiKey === undefined ? undefined : { apiKey: auth.apiKey }
  }

  const adapter = new PiAiAdapter({
    profiles,
    resolveAuth,
    resolveAttachments: () => ctx.get('attachments'),
  })
  // The full installed catalog is configurable from the moment the plugin
  // mounts — dormant or not — so configuration surfaces can offer every
  // pi-ai provider before any route exists. Hand-declared routes join it as
  // profiles appear, and leave with them.
  let directory: DirectoryRegistrationHandle | undefined
  let directoryFacts: unknown
  const ensureDirectory = (): void => {
    const entries = directoryEntries(profiles())
    if (deepEqualJson(entries, directoryFacts)) return
    // Atomic replace, never dispose-then-register: a route another adapter
    // family already declares (a profile keyed `deepseek-official`) would
    // otherwise leave this plugin's whole directory withdrawn and the Models
    // page empty. The candidate set is validated first, so a collision keeps
    // the previous entries serving and only costs a diagnostic.
    if (directory === undefined) {
      directory = ctx.llm.registerConfigurableProviders(entries)
    } else {
      directory.replace(entries)
    }
    directoryFacts = entries
  }
  ensureDirectory()
  /**
   * The credential a named route already resolves, for an interrogation whose
   * draft carries none. A route being declared for the first time names no
   * profile yet, and a profile that names no credential defers to pi-ai's own
   * discovery, so both answer `undefined` and the endpoint is asked
   * unauthenticated — the same posture a request to that route would take.
   */
  const storedApiKey = async (provider: string | undefined): Promise<string | undefined> => {
    if (provider === undefined) return undefined
    const profile = profiles().get(provider)
    if (profile === undefined) return undefined
    return (await resolveAuth(provider, profile))?.apiKey
  }
  // Interrogating an endpoint is a configuration-time action over a draft, so
  // it is offered for the whole namespace rather than per route: the provider
  // a surface is adding does not exist yet. The draft is the whole request
  // except the credential: a configuration surface edits a redacted descriptor
  // and never holds a stored secret, so an already-configured route supplies
  // its own here rather than being interrogated unauthenticated.
  ctx.llm.registerModelDiscovery(NS, request => discoverModels(request, () => storedApiKey(request.provider)))
  // Subscription logins for every catalog route that offers one. The flows
  // are namespace-level like discovery: `begin` resolves the exact route's
  // own flow. A still-pending login is aborted when this fiber stops.
  const flows = createOAuthFlows({
    profiles,
    resolveStore: () => ctx.get('credentials'),
  })
  ctx.llm.registerOAuthFlows(NS, flows)
  ctx.effect(() => () => { flows.dispose() }, 'llm-pi-ai: abort pending subscription logins')
  // Route effects bind to this apply fiber via the stable `ctx` reference,
  // even when a swap runs inside the scoped settings callback below. A bare
  // mount (zero routes) is the dormant posture: nothing registers until a
  // settings section supplies profiles, and routes drop when it empties.
  let registration: AdapterRegistrationHandle | undefined
  let registeredFacts: unknown
  const ensureRegistrationFacts = (): void => {
    const facts = registrationFacts(profiles())
    if (deepEqualJson(facts, registeredFacts)) return
    // The registry captures the route set and each route's retry policy at
    // registration, so a change to either must re-register. The swap is
    // atomic (same adapter instance, validated before anything moves): a
    // conflicting route leaves the previous routes serving requests, and
    // `registeredFacts` only advances once the registry actually holds the
    // new set — so returning to a working configuration always re-applies.
    const routes = [...profiles().keys()]
    if (registration === undefined) {
      // Dormant bare mount: nothing is registered until a section supplies
      // profiles, and an empty section keeps it that way.
      if (routes.length === 0) {
        registeredFacts = facts
        return
      }
      registration = ctx.llm.registerAdapter(routes, adapter)
    } else {
      registration.replace(routes)
    }
    registeredFacts = facts
  }
  ensureRegistrationFacts()

  installSettingsSection(ctx, NS, Config, config, {
    // Refuse an unserviceable section where it is written: without this a
    // schema-valid profile the adapter cannot serve would be stored and then
    // silently disable every route in this namespace.
    validate: assertServiceable,
    setSource: (source) => {
      current = source
    },
    onChange: () => {
      // Named here rather than left to the settings watcher: `assertServiceable`
      // cannot see the llm registry, so a profile claiming a route another
      // adapter family owns is stored successfully and only fails at this swap.
      // Without its own diagnostic that refusal reaches the operator as a
      // generic "settings: watcher failed", naming neither the route nor why it
      // is not serving. The previous routes keep serving either way.
      try {
        ensureRegistrationFacts()
      } catch (error) {
        ctx.logger.error('llm-pi-ai: keeping the previously registered routes after a refused update')
        ctx.logger.error(error)
      }
      // The directory follows the profiles the registry accepted, so a route
      // that failed to register is not advertised as configurable. A refused
      // directory swap is contained here for the same reason the registry's
      // is: the previous entries keep serving, and `directoryFacts` stays put
      // so returning to a working configuration re-applies.
      try {
        ensureDirectory()
      } catch (error) {
        ctx.logger.error('llm-pi-ai: keeping the previous configurable-provider directory after a refused update')
        ctx.logger.error(error)
      }
    },
  })
}

/**
 * llm domain contract: host-scoped provider topology for configuration
 * surfaces. `llm.providers` merges the configurable-provider directory
 * (which providers CAN be configured, and where their settings live) with the
 * live route registry; `llm.models` is the session-independent model catalog
 * (the same groups as `session.models`, without a per-session selection).
 * Clients invalidate from the forwarded `llm/adapters-updated` and
 * `settings/document-updated` owner events.
 */

import type { RpcRequest, RpcResponse } from './rpc.ts'
import type { ModelCatalogFailure, ModelProviderGroup } from './sessions.ts'

/** Wire view of one configurable provider. */
export interface ConfigurableProviderView {
  /** Provider route key (`deepseek-official`, `openai`, …). */
  provider: string
  /** Human-readable name for configuration surfaces. */
  displayName: string
  /** Settings namespace whose section configures this provider. */
  settingsNs: string
  /** Path from that section's root to the provider's profile object (empty = whole section). */
  settingsPath: string[]
  /** Whether the route is currently registered (its models are requestable). */
  active: boolean
  /**
   * Whether the owning adapter knows this route only because configuration
   * declared it. Absent when the adapter draws no such distinction, so a
   * surface must treat absence as "unknown", not as "shipped".
   */
  declared?: boolean
  /**
   * The authentication methods this route can be set up with, when the
   * owning adapter can say: `api-key` for a stored key, `oauth` for a
   * subscription login it runs. Absent means only the API-key entry is
   * offered.
   */
  authMethods?: ('api-key' | 'oauth')[]
  /** The selector label of this route's subscription login, when it offers one. */
  oauthLoginLabel?: string
}

/** Live state of one begun subscription login, as the wire reports it. */
export type OAuthFlowStatusView =
  | { status: 'pending' }
  | { status: 'success' }
  | { status: 'failed'; error: string }

/** Llm-domain unary methods (the map keys llm.* of RpcMethodMap). */
export interface LlmApi {
  /**
   * List every configurable provider with its live/dormant state, in
   * directory declaration order. Routes registered outside the directory
   * (an adapter that never declared configurability) are appended with their
   * registration identity and no settings address.
   */
  providers(request: RpcRequest<{}>): Promise<RpcResponse<{ providers: ConfigurableProviderView[] }>>

  /**
   * Host-scoped model catalog over every registered provider route: the
   * settings surface's models view, needing no session. Per-provider listing
   * failures ride `failures` without failing the sound groups.
   */
  models(request: RpcRequest<{}>): Promise<RpcResponse<{ groups: ModelProviderGroup[]; failures: ModelCatalogFailure[] }>>

  /**
   * Interrogate a provider endpoint the configuration surface is still
   * drafting, and return the models it advertises for the user to adopt.
   *
   * The payload is the draft, not a stored route: `settingsNs` selects the
   * adapter family that answers, and the rest comes from the form. `provider`
   * names the route being edited when there is one — an adapter that already
   * describes that route answers from its own registry, with better metadata
   * and no network call, and needs no endpoint. A route it does not describe is
   * asked over the wire, which is what `baseURL`, `api`, and `apiKey` are for.
   *
   * Nothing is written — the reply is candidates, and only a later
   * `settings.mutate` decides what a route serves. `apiKey` is accepted here
   * but never stored or returned; a provider whose key is already stored omits
   * it and the endpoint answers unauthenticated or refuses.
   */
  discoverModels(
    request: RpcRequest<{
      settingsNs: string
      provider?: string
      baseURL?: string
      api?: string
      apiKey?: string
    }>,
    signal?: AbortSignal,
  ): Promise<RpcResponse<{ models: DiscoveredModelView[] }>>

  /**
   * Begin one subscription (OAuth) login for a provider route served by the
   * adapter family owning a settings namespace. Nothing is written yet: the
   * reply is the flow id and the device code the user must enter on the
   * provider's authorization page. The flow runs on the host until
   * {@link LlmApi.oauthPoll} reports success or failure, or
   * {@link LlmApi.oauthCancel} aborts it; a successful login stores the
   * credential itself before it ever reports success.
   */
  oauthBegin(
    request: RpcRequest<{ settingsNs: string; provider: string }>,
    signal?: AbortSignal,
  ): Promise<RpcResponse<{
    id: string
    userCode: string
    verificationUri: string
    expiresInSeconds?: number
  }>>

  /**
   * Read the live state of one begun subscription login.
   */
  oauthPoll(
    request: RpcRequest<{ settingsNs: string; id: string }>,
  ): Promise<RpcResponse<OAuthFlowStatusView>>

  /**
   * Abort one begun subscription login.
   */
  oauthCancel(
    request: RpcRequest<{ settingsNs: string; id: string }>,
  ): Promise<RpcResponse<{}>>
}

/** Wire view of one model an interrogated endpoint advertises. */
export interface DiscoveredModelView {
  /** Model id the endpoint accepts. */
  id: string
  /** Human-readable name when the endpoint supplies one. */
  name?: string
  /** Maximum combined request and response context, when disclosed. */
  contextWindow?: number
  /** Maximum output tokens, when disclosed. */
  maxTokens?: number
}

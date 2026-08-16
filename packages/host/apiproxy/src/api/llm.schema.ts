/**
 * llm domain zod schemas (names derived from map keys: llmProvidersRequestSchema /
 * llmProvidersValueSchema / llmModelsRequestSchema / llmModelsValueSchema).
 */

import { z } from 'zod'
import type { RequestPayload, ResponseValue } from './rpc-map.ts'
import type { Wire } from './rpc.schema.ts'
import type { ConfigurableProviderView, DiscoveredModelView } from './llm.ts'
import { modelCatalogFailureSchema, modelProviderGroupSchema } from './sessions.schema.ts'

/** ConfigurableProviderView row of llm.providers. */
export const configurableProviderViewSchema = z.object({
  provider: z.string().min(1),
  displayName: z.string().min(1),
  settingsNs: z.string(),
  settingsPath: z.array(z.string()),
  active: z.boolean(),
  declared: z.boolean().optional(),
  authMethods: z.array(z.union([z.literal('api-key'), z.literal('oauth')])).optional(),
  oauthLoginLabel: z.string().min(1).optional(),
}) satisfies z.ZodType<Wire<ConfigurableProviderView>>

/** llm.providers request payload. */
export const llmProvidersRequestSchema = z.object({}) satisfies z.ZodType<Wire<RequestPayload<'llm.providers'>>>

/** llm.providers response value. */
export const llmProvidersValueSchema = z.object({
  providers: z.array(configurableProviderViewSchema),
}) satisfies z.ZodType<Wire<ResponseValue<'llm.providers'>>>

/** llm.models request payload. */
export const llmModelsRequestSchema = z.object({}) satisfies z.ZodType<Wire<RequestPayload<'llm.models'>>>

/** llm.models response value. */
export const llmModelsValueSchema = z.object({
  groups: z.array(modelProviderGroupSchema),
  failures: z.array(modelCatalogFailureSchema),
}) satisfies z.ZodType<Wire<ResponseValue<'llm.models'>>>

/** DiscoveredModelView row of llm.discoverModels. */
export const discoveredModelViewSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  contextWindow: z.number().int().positive().optional(),
  maxTokens: z.number().int().positive().optional(),
}) satisfies z.ZodType<Wire<DiscoveredModelView>>

/** llm.discoverModels request payload. */
export const llmDiscoverModelsRequestSchema = z.object({
  settingsNs: z.string().min(1),
  provider: z.string().min(1).optional(),
  baseURL: z.string().min(1).optional(),
  api: z.string().min(1).optional(),
  // Write-only at the host: used for this one interrogation, never stored and
  // never returned. It does ride the client's outgoing envelope like every
  // other secret-bearing payload (`credentials.set`, `settings.update`), which
  // `subscribeEnvelopes()` observers can see — redacting that tap is a
  // configuration-plane-wide change, not this method's to make alone.
  apiKey: z.string().min(1).optional(),
}) satisfies z.ZodType<Wire<RequestPayload<'llm.discoverModels'>>>

/** llm.discoverModels response value. */
export const llmDiscoverModelsValueSchema = z.object({
  models: z.array(discoveredModelViewSchema),
}) satisfies z.ZodType<Wire<ResponseValue<'llm.discoverModels'>>>

/** llm.oauthBegin request payload. */
export const llmOauthBeginRequestSchema = z.object({
  settingsNs: z.string().min(1),
  provider: z.string().min(1),
}) satisfies z.ZodType<Wire<RequestPayload<'llm.oauthBegin'>>>

/** llm.oauthBegin response value. */
export const llmOauthBeginValueSchema = z.object({
  id: z.string().min(1),
  userCode: z.string().min(1),
  verificationUri: z.string().min(1),
  expiresInSeconds: z.number().int().positive().optional(),
}) satisfies z.ZodType<Wire<ResponseValue<'llm.oauthBegin'>>>

/** llm.oauthPoll request payload. */
export const llmOauthPollRequestSchema = z.object({
  settingsNs: z.string().min(1),
  id: z.string().min(1),
}) satisfies z.ZodType<Wire<RequestPayload<'llm.oauthPoll'>>>

/** llm.oauthPoll response value. */
export const llmOauthPollValueSchema = z.union([
  z.object({ status: z.literal('pending') }),
  z.object({ status: z.literal('success') }),
  z.object({ status: z.literal('failed'), error: z.string() }),
]) satisfies z.ZodType<Wire<ResponseValue<'llm.oauthPoll'>>>

/** llm.oauthCancel request payload. */
export const llmOauthCancelRequestSchema = z.object({
  settingsNs: z.string().min(1),
  id: z.string().min(1),
}) satisfies z.ZodType<Wire<RequestPayload<'llm.oauthCancel'>>>

/** llm.oauthCancel response value. */
export const llmOauthCancelValueSchema = z.object({}) satisfies z.ZodType<Wire<ResponseValue<'llm.oauthCancel'>>>

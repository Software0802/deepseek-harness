/**
 * Zod schemas for the provider-selectable vision-enhancement API.
 */

import { z } from 'zod'
import type { RequestPayload, ResponseValue } from './rpc-map.ts'
import type { Wire } from './rpc.schema.ts'
import type { VisionProviderView } from './vision.ts'

const visionProviderSchema = z.union([z.literal('xai'), z.literal('openrouter')])
const imageMediaTypeSchema = z.union([
  z.literal('image/png'),
  z.literal('image/jpeg'),
  z.literal('image/webp'),
  z.literal('image/gif'),
])

const visionProviderViewSchema = z.object({
  id: visionProviderSchema,
  name: z.string().min(1),
  configured: z.boolean(),
  defaultModel: z.string().min(1),
  apiKeyUrl: z.string().min(1),
  modelEditable: z.boolean(),
}) satisfies z.ZodType<Wire<VisionProviderView>>

/** vision.status request payload. */
export const visionStatusRequestSchema = z.object({}) satisfies z.ZodType<Wire<RequestPayload<'vision.status'>>>

/** vision.status response value. */
export const visionStatusValueSchema = z.object({
  enabled: z.boolean(),
  configured: z.boolean(),
  provider: visionProviderSchema,
  model: z.string().min(1),
  apiKeyUrl: z.string().min(1),
  providers: z.array(visionProviderViewSchema).length(2),
}) satisfies z.ZodType<Wire<ResponseValue<'vision.status'>>>

/** vision.test request payload. */
export const visionTestRequestSchema = z.object({
  mediaType: imageMediaTypeSchema,
  data: z.string().min(1),
  question: z.string().optional(),
  name: z.string().optional(),
}) satisfies z.ZodType<Wire<RequestPayload<'vision.test'>>>

/** vision.enable request payload. */
export const visionEnableRequestSchema = visionTestRequestSchema.extend({
  apiKey: z.string().optional(),
  provider: visionProviderSchema.optional(),
  model: z.string().optional(),
}) satisfies z.ZodType<Wire<RequestPayload<'vision.enable'>>>

/** vision.test / vision.enable response value. */
export const visionTestValueSchema = z.object({
  provider: visionProviderSchema,
  model: z.string().min(1),
  description: z.string().min(1),
}) satisfies z.ZodType<Wire<ResponseValue<'vision.test'>>>

/** vision.enable response value. */
export const visionEnableValueSchema = visionTestValueSchema satisfies z.ZodType<Wire<ResponseValue<'vision.enable'>>>

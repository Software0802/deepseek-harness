/**
 * Vision-enhancement wire contract: status, test, and enable over a
 * provider-selectable desktop visual capability.
 */

import type { ImageMediaType } from '@deepseek-ai/dsh-attachment'
import type { RpcRequest, RpcResponse } from './rpc.ts'

/** Selectable vision providers. */
export type VisionProvider = 'xai' | 'openrouter'

/** One provider row returned by vision.status. */
export interface VisionProviderView {
  id: VisionProvider
  name: string
  configured: boolean
  defaultModel: string
  apiKeyUrl: string
  modelEditable: boolean
}

/** Current visual-enhancement capability. */
export interface VisionStatusView {
  enabled: boolean
  configured: boolean
  provider: VisionProvider
  model: string
  apiKeyUrl: string
  providers: readonly VisionProviderView[]
}

/** Result of a verification or enable call. */
export interface VisionTestView {
  provider: VisionProvider
  model: string
  description: string
}

/** Vision-domain unary methods (the map keys vision.* of RpcMethodMap). */
export interface VisionApi {
  /**
   * Read the current visual-enhancement status and available providers.
   * @param request - empty payload
   * @returns enabled/configured flags, the active provider and model, and provider rows
   */
  status(request: RpcRequest<{}>): Promise<RpcResponse<VisionStatusView>>
  /**
   * Run one image through the active provider without enabling the capability.
   * @param request - image bytes and optional question
   * @param signal - optional cancellation
   * @returns the provider description of the image
   */
  test(request: RpcRequest<{
    mediaType: ImageMediaType
    data: string
    question?: string
    name?: string
  }>, signal?: AbortSignal): Promise<RpcResponse<VisionTestView>>
  /**
   * Verify one image and persist the enabled visual capability.
   * @param request - optional key/provider/model plus the verification image
   * @param signal - optional cancellation
   * @returns the verified description
   */
  enable(request: RpcRequest<{
    apiKey?: string
    provider?: VisionProvider
    model?: string
    mediaType: ImageMediaType
    data: string
    question?: string
    name?: string
  }>, signal?: AbortSignal): Promise<RpcResponse<VisionTestView>>
}

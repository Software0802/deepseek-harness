/**
 * Mockable xAI Imagine HTTP client. Tests substitute `baseURL` with a local
 * server; production uses `https://api.x.ai/v1` and `$XAI_API_KEY`.
 * @module @deepseek-ai/dsh-tool-imagine/client
 */

import { persistBytes } from './persist.ts'

/** Default Imagine API origin, including the `/v1` prefix. */
export const IMAGINE_DEFAULT_BASE_URL = 'https://api.x.ai/v1'

/** Default text-to-image model id. */
export const IMAGINE_DEFAULT_IMAGE_MODEL = 'grok-imagine-image'

/** Default video model id. */
export const IMAGINE_DEFAULT_VIDEO_MODEL = 'grok-imagine-video'

/** Structured Imagine execute failure. */
export class ImagineError extends Error {
  /** Stable machine-readable failure code. */
  readonly code: string

  /**
   * @param code - stable failure code such as `IMAGINE_MISSING_CREDENTIALS`.
   * @param message - human-readable diagnostic.
   */
  constructor(code: string, message: string) {
    super(message)
    this.name = 'ImagineError'
    this.code = code
  }
}

/** One image or video generation request. */
export interface ImagineGenerateRequest {
  /** User prompt. */
  readonly prompt: string
  /** Optional aspect ratio such as `16:9`. */
  readonly aspectRatio?: string
  /** Optional source image as a public URL or data URI (edit / image-to-video). */
  readonly image?: string
  /** Optional reference images as URLs or data URIs (reference-to-video). */
  readonly referenceImages?: readonly string[]
  /** Optional preset voice ids (reference-to-video). */
  readonly voices?: readonly string[]
  /** Optional video duration in seconds. */
  readonly duration?: number
  /** Optional video resolution such as `480p`. */
  readonly resolution?: string
}

/** Resolved client options. */
export interface ImagineClientOptions {
  /** Bearer token; empty means credentials are missing. */
  readonly apiKey: string
  /** API origin including `/v1`. */
  readonly baseURL: string
  /** Image model id. */
  readonly imageModel: string
  /** Video model id. */
  readonly videoModel: string
  /** Directory that receives generated files. */
  readonly outputDir: string
  /** Delay between video poll GETs. */
  readonly pollIntervalMs: number
  /** Inclusive deadline for one video poll loop. */
  readonly pollTimeoutMs: number
}

interface JsonObject {
  readonly [key: string]: unknown
}

/**
 * Fail when the configured API key is empty.
 * @param apiKey - resolved key.
 */
export function assertImagineCredentials(apiKey: string): void {
  if (apiKey.length === 0) {
    throw new ImagineError('IMAGINE_MISSING_CREDENTIALS', 'Imagine credentials missing: set XAI_API_KEY or plugin config apiKey')
  }
}

function asRecord(value: unknown): JsonObject | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonObject
    : undefined
}

function firstDataItem(body: JsonObject): JsonObject | undefined {
  const data = body.data
  if (!Array.isArray(data) || data.length === 0) return undefined
  return asRecord(data[0])
}

/**
 * Pick a media URL, base64 payload, or async request id from an Imagine JSON body.
 * @param body - parsed Imagine response.
 */
export function extractImaginePayload(body: JsonObject): {
  readonly b64?: string
  readonly url?: string
  readonly requestId?: string
} {
  const item = firstDataItem(body)
  const video = asRecord(body.video)
  const b64Candidate = item?.b64_json ?? body.b64_json
  const urlCandidate = item?.url ?? video?.url ?? body.url ?? body.video_url
  const requestCandidate = body.request_id ?? body.id ?? item?.request_id
  return {
    ...typeof b64Candidate === 'string' && b64Candidate.length > 0 ? { b64: b64Candidate } : {},
    ...typeof urlCandidate === 'string' && urlCandidate.length > 0 ? { url: urlCandidate } : {},
    ...typeof requestCandidate === 'string' && requestCandidate.length > 0 ? { requestId: requestCandidate } : {},
  }
}

function imageRef(value: string): { url: string } {
  return { url: value }
}

/** xAI Imagine HTTP client used by the four media tools. */
export class ImagineClient {
  constructor(private readonly options: ImagineClientOptions) {}

  /**
   * Generate an image from a text prompt and persist it.
   * @param request - prompt and optional aspect ratio.
   * @param signal - cooperative cancellation.
   * @returns the written path.
   */
  generateImage(request: ImagineGenerateRequest, signal?: AbortSignal): Promise<string> {
    return this.runImage('generations', {
      model: this.options.imageModel,
      prompt: request.prompt,
      ...request.aspectRatio !== undefined ? { aspect_ratio: request.aspectRatio } : {},
    }, signal)
  }

  /**
   * Edit an image from a prompt plus a source image and persist the result.
   * @param request - prompt and source image URL or data URI.
   * @param signal - cooperative cancellation.
   * @returns the written path.
   */
  editImage(request: ImagineGenerateRequest, signal?: AbortSignal): Promise<string> {
    if (request.image === undefined || request.image.length === 0) {
      throw new ImagineError('IMAGINE_INVALID_ARGS', 'image_edit requires a non-empty image')
    }
    return this.runImage('edits', {
      model: this.options.imageModel,
      prompt: request.prompt,
      image: imageRef(request.image),
      ...request.aspectRatio !== undefined ? { aspect_ratio: request.aspectRatio } : {},
    }, signal)
  }

  /**
   * Animate a still image and persist the video.
   * @param request - source image and optional prompt / duration / resolution.
   * @param signal - cooperative cancellation.
   * @returns the written path.
   */
  imageToVideo(request: ImagineGenerateRequest, signal?: AbortSignal): Promise<string> {
    if (request.image === undefined || request.image.length === 0) {
      throw new ImagineError('IMAGINE_INVALID_ARGS', 'image_to_video requires a non-empty image')
    }
    return this.runVideo({
      model: this.options.videoModel,
      prompt: request.prompt,
      image: imageRef(request.image),
      ...request.duration !== undefined ? { duration: request.duration } : {},
      ...request.resolution !== undefined ? { resolution: request.resolution } : {},
    }, signal)
  }

  /**
   * Generate a video from reference images and/or voices and persist it.
   * @param request - prompt plus at least one reference image or voice.
   * @param signal - cooperative cancellation.
   * @returns the written path.
   */
  referenceToVideo(request: ImagineGenerateRequest, signal?: AbortSignal): Promise<string> {
    const images = request.referenceImages ?? []
    const voices = request.voices ?? []
    if (images.length === 0 && voices.length === 0) {
      throw new ImagineError('IMAGINE_INVALID_ARGS', 'reference_to_video requires at least one reference image or voice')
    }
    return this.runVideo({
      model: this.options.videoModel,
      prompt: request.prompt,
      ...images.length > 0 ? { reference_images: images.map(imageRef) } : {},
      ...voices.length > 0 ? { reference_audios: voices.map(voice_id => ({ voice_id })) } : {},
      ...request.duration !== undefined ? { duration: request.duration } : {},
      ...request.aspectRatio !== undefined ? { aspect_ratio: request.aspectRatio } : {},
      ...request.resolution !== undefined ? { resolution: request.resolution } : {},
    }, signal)
  }

  private async runImage(operation: 'generations' | 'edits', body: JsonObject, signal?: AbortSignal): Promise<string> {
    const payload = extractImaginePayload(await this.post(`/images/${operation}`, body, signal))
    return this.persistPayload(payload, '.png', signal)
  }

  private async runVideo(body: JsonObject, signal?: AbortSignal): Promise<string> {
    const first = extractImaginePayload(await this.post('/videos/generations', body, signal))
    const completed = first.requestId !== undefined && first.b64 === undefined && first.url === undefined
      ? extractImaginePayload(await this.pollVideo(first.requestId, signal))
      : first
    return this.persistPayload(completed, '.mp4', signal)
  }

  private async persistPayload(
    payload: ReturnType<typeof extractImaginePayload>,
    fallback: '.png' | '.mp4',
    signal?: AbortSignal,
  ): Promise<string> {
    if (payload.b64 !== undefined) {
      return persistBytes(this.options.outputDir, Buffer.from(payload.b64, 'base64'), fallback)
    }
    if (payload.url !== undefined) {
      const bytes = await this.getBytes(payload.url, signal)
      return persistBytes(this.options.outputDir, bytes, fallback)
    }
    throw new ImagineError('IMAGINE_EMPTY_RESULT', 'Imagine response contained no media bytes, URL, or request id')
  }

  private async pollVideo(requestId: string, signal?: AbortSignal): Promise<JsonObject> {
    const deadline = Date.now() + this.options.pollTimeoutMs
    while (Date.now() <= deadline) {
      await delay(this.options.pollIntervalMs, signal)
      const body = await this.getJson(`/videos/${encodeURIComponent(requestId)}`, signal)
      const status = body.status
      if (status === 'failed' || status === 'error') {
        const detail = typeof body.error === 'string' ? body.error : 'video generation failed'
        throw new ImagineError('IMAGINE_VIDEO_FAILED', detail)
      }
      const payload = extractImaginePayload(body)
      if (payload.b64 !== undefined || payload.url !== undefined || status === 'done' || status === 'completed') {
        if (payload.b64 === undefined && payload.url === undefined) {
          throw new ImagineError('IMAGINE_EMPTY_RESULT', 'Imagine video poll completed without media')
        }
        return body
      }
    }
    throw new ImagineError('IMAGINE_POLL_TIMEOUT', `Imagine video poll timed out after ${String(this.options.pollTimeoutMs)}ms`)
  }

  private async post(path: string, body: JsonObject, signal?: AbortSignal): Promise<JsonObject> {
    return this.parseJson(await this.send(path, requestInit('POST', this.headers({ 'content-type': 'application/json' }), JSON.stringify(body), signal)))
  }

  private async getJson(path: string, signal?: AbortSignal): Promise<JsonObject> {
    return this.parseJson(await this.send(path, requestInit('GET', this.headers(), undefined, signal)))
  }

  private async getBytes(url: string, signal?: AbortSignal): Promise<Uint8Array> {
    const response = await this.sendUrl(url, requestInit('GET', this.headers(), undefined, signal))
    return new Uint8Array(await response.arrayBuffer())
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      authorization: `Bearer ${this.options.apiKey}`,
      'user-agent': 'deepseek-harness/0.1.0-rc.8',
      ...extra,
    }
  }

  private send(path: string, init: RequestInit): Promise<Response> {
    return this.sendUrl(`${trimSlash(this.options.baseURL)}${path}`, init)
  }

  private async sendUrl(url: string, init: RequestInit): Promise<Response> {
    assertImagineCredentials(this.options.apiKey)
    let response: Response
    try {
      response = await fetch(url, init)
    } catch (error: unknown) {
      if (init.signal?.aborted) throw abortError()
      throw new ImagineError(
        'IMAGINE_NETWORK',
        /* v8 ignore next -- fetch rejects with Error */
        error instanceof Error ? error.message : String(error),
      )
    }
    if (!response.ok) {
      /* v8 ignore next -- Response.text() failure is reported as an empty body */
      const text = await response.text().catch(() => '')
      throw new ImagineError(
        'IMAGINE_HTTP',
        `Imagine HTTP ${String(response.status)}: ${text.slice(0, 200)}`,
      )
    }
    return response
  }

  private async parseJson(response: Response): Promise<JsonObject> {
    const parsed: unknown = await response.json()
    const record = asRecord(parsed)
    if (record === undefined) throw new ImagineError('IMAGINE_HTTP', 'Imagine response was not a JSON object')
    return record
  }
}

function requestInit(
  method: string,
  headers: Record<string, string>,
  body: string | undefined,
  signal?: AbortSignal,
): RequestInit {
  return {
    method,
    headers,
    ...body !== undefined ? { body } : {},
    ...signal !== undefined ? { signal } : {},
  }
}

function trimSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

function abortError(): Error {
  const error = new Error('Imagine request aborted')
  error.name = 'AbortError'
  return error
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  /* v8 ignore next -- in-flight abort is handled by the delay timer listener */
  if (signal?.aborted) return Promise.reject(abortError())
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = (): void => {
      clearTimeout(timer)
      reject(abortError())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

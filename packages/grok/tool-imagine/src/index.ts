/**
 * Model-facing xAI Imagine tools: `image_gen`, `image_edit`, `image_to_video`,
 * and `reference_to_video`. Missing credentials fail at execute, not load, so a
 * composition can boot without `$XAI_API_KEY` and still expose the schemas.
 * @module @deepseek-ai/dsh-tool-imagine
 */

import { readFile } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import {
  IMAGINE_DEFAULT_BASE_URL,
  IMAGINE_DEFAULT_IMAGE_MODEL,
  IMAGINE_DEFAULT_VIDEO_MODEL,
  ImagineClient,
  ImagineError,
} from './client.ts'

export {
  IMAGINE_DEFAULT_BASE_URL,
  IMAGINE_DEFAULT_IMAGE_MODEL,
  IMAGINE_DEFAULT_VIDEO_MODEL,
  ImagineClient,
  ImagineError,
  assertImagineCredentials,
  extractImaginePayload,
} from './client.ts'
export type { ImagineClientOptions, ImagineGenerateRequest } from './client.ts'
export { persistBytes, extensionForBytes } from './persist.ts'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'tool-imagine'
/** Services required by the Imagine tools. */
export const inject = ['tools']

/** Default video poll interval (ms). */
export const DEFAULT_POLL_INTERVAL_MS = 2_000
/** Default video poll deadline (ms). */
export const DEFAULT_POLL_TIMEOUT_MS = 600_000

/** Plugin config: Imagine HTTP routing, models, output directory, and poll bounds. */
export interface Config {
  /** Literal API key; when omitted, `$XAI_API_KEY` is read at execute time. */
  apiKey?: string
  /** Imagine API origin including `/v1`. */
  baseURL?: string
  /** Image model id. */
  imageModel?: string
  /** Video model id. */
  videoModel?: string
  /** Directory that receives generated files; defaults to the process cwd. */
  outputDir?: string
  /** Delay between video poll GETs. */
  pollIntervalMs?: number
  /** Inclusive deadline for one video poll loop. */
  pollTimeoutMs?: number
}

/** Loader schema; `apply` re-checks positive integer poll bounds. */
export const Config: z<Config> = z.object({
  apiKey: z.string(),
  baseURL: z.string().default(IMAGINE_DEFAULT_BASE_URL),
  imageModel: z.string().default(IMAGINE_DEFAULT_IMAGE_MODEL),
  videoModel: z.string().default(IMAGINE_DEFAULT_VIDEO_MODEL),
  outputDir: z.string(),
  pollIntervalMs: z.number().default(DEFAULT_POLL_INTERVAL_MS),
  pollTimeoutMs: z.number().default(DEFAULT_POLL_TIMEOUT_MS),
})

const PATH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    path: { type: 'string', required: true },
  },
} as const

function assertPositiveInteger(field: string, value: number): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`tool-imagine: ${field} must be a positive integer`)
  }
}

function resolvedApiKey(configured: string | undefined): string {
  if (configured !== undefined) return configured
  return process.env.XAI_API_KEY ?? ''
}

function isRemoteRef(value: string): boolean {
  return /^https?:\/\//i.test(value) || value.startsWith('data:')
}

/**
 * Turn a model-supplied image path, URL, or data URI into an Imagine `url` field.
 * @param image - path, http(s) URL, or `data:` URI.
 * @param cwd - base for relative paths.
 * @returns a public URL or data URI.
 */
export async function resolveImageRef(image: string, cwd: string): Promise<string> {
  const trimmed = image.trim()
  if (trimmed.length === 0) throw new ImagineError('IMAGINE_INVALID_ARGS', 'image must be a non-empty string')
  if (isRemoteRef(trimmed)) return trimmed
  const absolute = isAbsolute(trimmed) ? trimmed : join(cwd, trimmed)
  const bytes = await readFile(absolute)
  const mime = trimmed.toLowerCase().endsWith('.jpg') || trimmed.toLowerCase().endsWith('.jpeg')
    ? 'image/jpeg'
    : trimmed.toLowerCase().endsWith('.webp')
      ? 'image/webp'
      : 'image/png'
  return `data:${mime};base64,${bytes.toString('base64')}`
}

function clientFor(config: Config): ImagineClient {
  const pollIntervalMs = config.pollIntervalMs as number
  const pollTimeoutMs = config.pollTimeoutMs as number
  assertPositiveInteger('pollIntervalMs', pollIntervalMs)
  assertPositiveInteger('pollTimeoutMs', pollTimeoutMs)
  const baseURL = (config.baseURL as string).trim()
  if (baseURL.length === 0 || !URL.canParse(baseURL)) {
    throw new Error(`tool-imagine: invalid baseURL ${JSON.stringify(baseURL)}`)
  }
  return new ImagineClient({
    apiKey: resolvedApiKey(config.apiKey),
    baseURL,
    imageModel: config.imageModel as string,
    videoModel: config.videoModel as string,
    outputDir: config.outputDir !== undefined && config.outputDir.trim().length > 0
      ? config.outputDir
      : process.cwd(),
    pollIntervalMs,
    pollTimeoutMs,
  })
}

function renderPath(_args: unknown, value: { path: string }): [{ type: 'text'; text: string }] {
  const relative = value.path.startsWith(process.cwd())
    ? value.path.slice(process.cwd().length).replace(/^[\\/]/, '')
    : value.path
  return [{ type: 'text', text: relative.replaceAll('\\', '/') }]
}

/**
 * Register the four Imagine tools.
 * @param ctx - plugin context; registrations dispose with the fiber.
 * @param config - validated {@link Config}.
 */
export function apply(ctx: Context, config: Config): void {
  const client = clientFor(config)

  ctx.tools.register(defineTool({
    name: 'image_gen',
    description: 'Generate an image from a text prompt via xAI Imagine and save it to disk. Returns a usable file path. Requires XAI_API_KEY.',
    parameters: {
      prompt: { type: 'string', required: true, description: 'Text description of the image to generate.' },
      aspect_ratio: { type: 'string', description: 'Optional aspect ratio such as 1:1 or 16:9.' },
    },
    output: { schema: PATH_SCHEMA, render: renderPath },
    async execute(args, exec) {
      if (args.prompt.trim().length === 0) throw new ImagineError('IMAGINE_INVALID_ARGS', 'image_gen prompt must be non-empty')
      const path = await client.generateImage({
        prompt: args.prompt,
        ...args.aspect_ratio !== undefined ? { aspectRatio: args.aspect_ratio } : {},
      }, exec.signal)
      return { path }
    },
    presentCall: args => ({ card: 'generic', title: 'Generate image', kind: 'other', rawInput: args.prompt }),
  }))

  ctx.tools.register(defineTool({
    name: 'image_edit',
    description: 'Edit or transform an existing image via xAI Imagine and save the result. `image` is a path, http(s) URL, or data URI. Requires XAI_API_KEY.',
    parameters: {
      prompt: { type: 'string', required: true, description: 'Description of the desired edit.' },
      image: { type: 'string', required: true, description: 'Source image path, URL, or data URI.' },
      aspect_ratio: { type: 'string', description: 'Optional output aspect ratio.' },
    },
    output: { schema: PATH_SCHEMA, render: renderPath },
    async execute(args, exec) {
      if (args.prompt.trim().length === 0) throw new ImagineError('IMAGINE_INVALID_ARGS', 'image_edit prompt must be non-empty')
      const path = await client.editImage({
        prompt: args.prompt,
        image: await resolveImageRef(args.image, process.cwd()),
        ...args.aspect_ratio !== undefined ? { aspectRatio: args.aspect_ratio } : {},
      }, exec.signal)
      return { path }
    },
    presentCall: args => ({ card: 'generic', title: 'Edit image', kind: 'other', rawInput: args.prompt }),
  }))

  ctx.tools.register(defineTool({
    name: 'image_to_video',
    description: 'Animate a still image into a video via xAI Imagine and save it. `image` is a path, http(s) URL, or data URI. Requires XAI_API_KEY.',
    parameters: {
      image: { type: 'string', required: true, description: 'Source image path, URL, or data URI.' },
      prompt: { type: 'string', description: 'Optional animation guidance.' },
      duration: { type: 'integer', description: 'Duration in seconds.' },
      resolution_name: { type: 'string', description: 'Resolution name such as 480p or 720p.' },
    },
    output: { schema: PATH_SCHEMA, render: renderPath },
    async execute(args, exec) {
      const path = await client.imageToVideo({
        prompt: args.prompt ?? '',
        image: await resolveImageRef(args.image, process.cwd()),
        ...args.duration !== undefined ? { duration: args.duration } : {},
        ...args.resolution_name !== undefined ? { resolution: args.resolution_name } : {},
      }, exec.signal)
      return { path }
    },
    presentCall: args => ({ card: 'generic', title: 'Image to video', kind: 'other', rawInput: args.image }),
  }))

  ctx.tools.register(defineTool({
    name: 'reference_to_video',
    description: 'Generate a video from reference images and/or preset voices via xAI Imagine and save it. Requires XAI_API_KEY.',
    parameters: {
      prompt: { type: 'string', required: true, description: 'Prompt describing the desired video.' },
      images: {
        type: 'array',
        items: { type: 'string' },
        description: 'Reference image paths, URLs, or data URIs (up to 7).',
      },
      voices: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional preset voice identifiers (up to 3).',
      },
      aspect_ratio: { type: 'string', description: 'Aspect ratio such as 16:9.' },
      duration: { type: 'integer', description: 'Duration in seconds.' },
      resolution_name: { type: 'string', description: 'Resolution name such as 480p or 720p.' },
    },
    output: { schema: PATH_SCHEMA, render: renderPath },
    async execute(args, exec) {
      if (args.prompt.trim().length === 0) throw new ImagineError('IMAGINE_INVALID_ARGS', 'reference_to_video prompt must be non-empty')
      const cwd = process.cwd()
      const images = await Promise.all((args.images ?? []).map(image => resolveImageRef(image, cwd)))
      const path = await client.referenceToVideo({
        prompt: args.prompt,
        referenceImages: images,
        voices: args.voices ?? [],
        ...args.aspect_ratio !== undefined ? { aspectRatio: args.aspect_ratio } : {},
        ...args.duration !== undefined ? { duration: args.duration } : {},
        ...args.resolution_name !== undefined ? { resolution: args.resolution_name } : {},
      }, exec.signal)
      return { path }
    },
    presentCall: args => ({ card: 'generic', title: 'Reference to video', kind: 'other', rawInput: args.prompt }),
  }))
}

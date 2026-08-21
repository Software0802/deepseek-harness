import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { CallId } from '@deepseek-ai/dsh-llm'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import * as ToolImagine from '@deepseek-ai/dsh-tool-imagine'
import { extractImaginePayload } from '@deepseek-ai/dsh-tool-imagine'

const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
const PNG_BYTES = Buffer.from(PNG_B64, 'base64')
const MP4_BYTES = (() => {
  const bytes = Buffer.alloc(16, 0)
  bytes[4] = 0x66
  bytes[5] = 0x74
  bytes[6] = 0x79
  bytes[7] = 0x70
  return bytes
})()

const testToolSignal = new AbortController().signal

interface MockServer {
  readonly url: string
  readonly requests: { method: string; url: string; body: string }[]
  close(): Promise<void>
}

async function listen(
  handler: (request: IncomingMessage, body: string, response: ServerResponse) => void,
): Promise<MockServer> {
  const requests: MockServer['requests'] = []
  const server = createServer((request, response) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk: string) => { body += chunk })
    request.on('end', () => {
      requests.push({ method: request.method ?? '', url: request.url ?? '', body })
      handler(request, body, response)
    })
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('Imagine mock has no port')
  return {
    url: `http://127.0.0.1:${address.port}`,
    requests,
    close: () => new Promise(resolve => server.close(() => { resolve() })),
  }
}

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}

function bytes(response: ServerResponse, payload: Buffer, type: string): void {
  response.writeHead(200, { 'content-type': type })
  response.end(payload)
}

let outputDir: string | undefined
let server: MockServer | undefined
let ctx: Context | undefined

afterEach(async () => {
  await ctx?.fiber.dispose()
  ctx = undefined
  await server?.close()
  server = undefined
  if (outputDir !== undefined) await rm(outputDir, { recursive: true, force: true })
  outputDir = undefined
})

async function setup(config: ToolImagine.Config): Promise<Context> {
  const next = new Context()
  ctx = next
  await next.plugin(SystemPrompt)
  await next.plugin(ToolRuntime)
  await next.plugin(ToolImagine, config)
  return next
}

let callCounter = 0
function call(context: Context, name: string, args: unknown, signal: AbortSignal = testToolSignal) {
  return context.tools.execute({
    signal,
    callId: CallId(`call-${++callCounter}`),
    name,
    arguments: args,
  })
}

function text(result: { content: { type: string; text?: string }[] }): string {
  return result.content.filter(block => block.type === 'text').map(block => block.text).join('')
}

describe('dsh-tool-imagine', () => {
  it('registers the four Imagine tools', async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'dsh-imagine-'))
    const context = await setup({ apiKey: 'test', outputDir })
    expect('default' in ToolImagine).toBe(false)
    expect(context.tools.schemas().map(schema => schema.name)).toEqual([
      'image_gen', 'image_edit', 'image_to_video', 'reference_to_video',
    ])
  })

  it('writes non-empty image_gen bytes to the returned path', async () => {
    outputDir = join(process.cwd(), `dsh-imagine-rel-${String(Date.now())}`)
    server = await listen((_request, _body, response) => {
      json(response, 200, { data: [{ b64_json: PNG_B64 }] })
    })
    const context = await setup({ apiKey: 'test', baseURL: server.url, outputDir })
    const result = await call(context, 'image_gen', { prompt: 'a red square', aspect_ratio: '1:1' })
    expect(result.isError).toBe(false)
    if (result.isError) throw new Error('expected image_gen success')
    const path = (result.value as { path: string }).path
    expect(path.endsWith('.png')).toBe(true)
    const written = await readFile(path)
    expect(written.equals(PNG_BYTES)).toBe(true)
    expect(written.byteLength).toBeGreaterThan(0)
    expect(text(result).replaceAll('\\', '/')).toContain('1.png')
    expect(server.requests[0]?.body).toContain('"prompt":"a red square"')
  })

  it('edits an image from a data URI and persists the result', async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'dsh-imagine-'))
    server = await listen((_request, _body, response) => {
      json(response, 200, { data: [{ b64_json: PNG_B64 }] })
    })
    const context = await setup({ apiKey: 'test', baseURL: server.url, outputDir })
    const result = await call(context, 'image_edit', {
      prompt: 'make it blue',
      image: `data:image/png;base64,${PNG_B64}`,
      aspect_ratio: '1:1',
    })
    expect(result.isError).toBe(false)
    if (result.isError) throw new Error('expected image_edit success')
    expect((await readFile((result.value as { path: string }).path)).byteLength).toBeGreaterThan(0)
    expect(server.requests[0]?.url).toBe('/images/edits')
    expect(JSON.parse(server.requests[0]!.body) as { image?: unknown }).toMatchObject({
      image: { url: `data:image/png;base64,${PNG_B64}` },
    })
  })

  it('downloads image_to_video bytes from a returned URL', async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'dsh-imagine-'))
    server = await listen((request, _body, response) => {
      if (request.url === '/clip.mp4') {
        bytes(response, MP4_BYTES, 'video/mp4')
        return
      }
      json(response, 200, { data: [{ url: `http://127.0.0.1:${new URL(server!.url).port}/clip.mp4` }] })
    })
    const context = await setup({
      apiKey: 'test',
      baseURL: server.url,
      outputDir,
      pollIntervalMs: 1,
    })
    const result = await call(context, 'image_to_video', {
      image: `data:image/png;base64,${PNG_B64}`,
      prompt: 'pan left',
      duration: 6,
      resolution_name: '480p',
    })
    expect(result.isError).toBe(false)
    if (result.isError) throw new Error('expected image_to_video success')
    const written = await readFile((result.value as { path: string }).path)
    expect(written.equals(MP4_BYTES)).toBe(true)
  })

  it('polls reference_to_video until the request completes', async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'dsh-imagine-'))
    let polls = 0
    server = await listen((request, _body, response) => {
      const origin = server!.url
      if (request.url === '/clip.mp4') {
        bytes(response, MP4_BYTES, 'video/mp4')
        return
      }
      if (request.method === 'POST') {
        json(response, 200, { request_id: 'vid-1' })
        return
      }
      polls += 1
      if (polls === 1) {
        json(response, 200, { status: 'processing' })
        return
      }
      json(response, 200, { status: 'done', url: `${origin}/clip.mp4` })
    })
    const context = await setup({
      apiKey: 'test',
      baseURL: server.url,
      outputDir,
      pollIntervalMs: 1,
      pollTimeoutMs: 5_000,
    })
    const result = await call(context, 'reference_to_video', {
      prompt: 'a walk',
      images: [`data:image/png;base64,${PNG_B64}`],
      voices: ['eve'],
      aspect_ratio: '16:9',
      duration: 10,
      resolution_name: '720p',
    })
    expect(result.isError).toBe(false)
    if (result.isError) throw new Error('expected reference_to_video success')
    expect((await readFile((result.value as { path: string }).path)).byteLength).toBeGreaterThan(0)
    expect(polls).toBeGreaterThanOrEqual(2)
    const post = server.requests.find(entry => entry.method === 'POST')
    expect(post?.url).toBe('/videos/generations')
    expect(JSON.parse(post?.body ?? '{}') as { reference_audios?: unknown; voices?: unknown }).toMatchObject({
      reference_audios: [{ voice_id: 'eve' }],
    })
    expect(post?.body).not.toContain('"voices"')
  })

  it('fails loud when credentials are missing', async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'dsh-imagine-'))
    const previous = process.env.XAI_API_KEY
    delete process.env.XAI_API_KEY
    try {
      const context = await setup({ apiKey: '', outputDir })
      const result = await call(context, 'image_gen', { prompt: 'no key' })
      expect(result.isError).toBe(true)
      expect(text(result)).toContain('Imagine credentials missing')
    } finally {
      if (previous === undefined) delete process.env.XAI_API_KEY
      else process.env.XAI_API_KEY = previous
    }
  })

  it('fails loud on HTTP errors and empty prompts', async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'dsh-imagine-'))
    server = await listen((_request, _body, response) => {
      json(response, 401, { error: 'unauthorized' })
    })
    const context = await setup({ apiKey: 'test', baseURL: server.url, outputDir })
    const http = await call(context, 'image_gen', { prompt: 'x' })
    expect(http.isError).toBe(true)
    expect(text(http)).toContain('Imagine HTTP 401')
    const empty = await call(context, 'image_gen', { prompt: '   ' })
    expect(empty.isError).toBe(true)
    expect(text(empty)).toContain('prompt must be non-empty')
  })

  it('reads a local image file for image_edit', async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'dsh-imagine-'))
    const source = join(outputDir, 'source.png')
    await writeFile(source, PNG_BYTES)
    server = await listen((_request, _body, response) => {
      json(response, 200, { data: [{ b64_json: PNG_B64 }] })
    })
    const context = await setup({ apiKey: 'test', baseURL: server.url, outputDir })
    const result = await call(context, 'image_edit', { prompt: 'crop', image: source })
    expect(result.isError).toBe(false)
  })

  it('extracts b64, url, and request ids from Imagine JSON', () => {
    expect(extractImaginePayload({ data: [{ b64_json: 'abc' }] }).b64).toBe('abc')
    expect(extractImaginePayload({ request_id: 'r1' }).requestId).toBe('r1')
    expect(extractImaginePayload({ video: { url: 'https://x.test/v.mp4' } }).url).toBe('https://x.test/v.mp4')
  })

  it('rejects invalid poll bounds, missing references, and failed video polls', async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'dsh-imagine-'))
    await expect(setup({ apiKey: 'test', outputDir, pollIntervalMs: 0 }))
      .rejects.toThrow(/pollIntervalMs/)
    const context = await setup({ apiKey: 'test', outputDir, baseURL: 'https://api.x.ai/v1' })
    const missing = await call(context, 'reference_to_video', { prompt: 'no refs' })
    expect(missing.isError).toBe(true)
    expect(text(missing)).toContain('at least one reference image or voice')
    await context.fiber.dispose()
    ctx = undefined
    server = await listen((_request, _body, response) => {
      json(response, 200, { request_id: 'vid-fail' })
    })
    const polling = await setup({
      apiKey: 'test',
      baseURL: server.url,
      outputDir,
      pollIntervalMs: 1,
      pollTimeoutMs: 1,
    })
    const timedOut = await call(polling, 'image_to_video', {
      image: `data:image/png;base64,${PNG_B64}`,
    })
    expect(timedOut.isError).toBe(true)
  })

  it('honors an aborted execute signal', async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'dsh-imagine-'))
    server = await listen((_request, _body, response) => {
      json(response, 200, { data: [{ b64_json: PNG_B64 }] })
    })
    const context = await setup({ apiKey: 'test', baseURL: server.url, outputDir })
    const aborted = new AbortController()
    aborted.abort()
    const result = await call(context, 'image_gen', { prompt: 'x' }, aborted.signal)
    expect(result.isError).toBe(true)
  })
})

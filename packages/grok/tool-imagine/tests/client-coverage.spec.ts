import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { CallId } from '@deepseek-ai/dsh-llm'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import {
  ImagineClient,
  ImagineError,
  persistBytes,
  extensionForBytes,
  resolveImageRef,
} from '@deepseek-ai/dsh-tool-imagine'
import * as ToolImagine from '@deepseek-ai/dsh-tool-imagine'

let outputDir: string | undefined

afterEach(async () => {
  if (outputDir !== undefined) await rm(outputDir, { recursive: true, force: true })
  outputDir = undefined
})

function jpegBytes(): Uint8Array {
  return Uint8Array.of(0xff, 0xd8, 0xff, 0x00)
}

function gifBytes(): Uint8Array {
  return Uint8Array.from(Buffer.from('GIF89a'))
}

function webpBytes(): Uint8Array {
  const bytes = Buffer.alloc(12)
  bytes.write('RIFF', 0)
  bytes.write('WEBP', 8)
  return bytes
}

function mp4Bytes(): Uint8Array {
  const bytes = Buffer.alloc(8)
  bytes.write('ftyp', 4)
  return bytes
}

describe('Imagine helpers', () => {
  it('classifies magic bytes and rejects an empty persist', async () => {
    expect(extensionForBytes(jpegBytes(), '.png')).toBe('.jpg')
    expect(extensionForBytes(gifBytes(), '.png')).toBe('.gif')
    expect(extensionForBytes(webpBytes(), '.png')).toBe('.webp')
    expect(extensionForBytes(mp4Bytes(), '.png')).toBe('.mp4')
    expect(extensionForBytes(Uint8Array.of(0x00), '.png')).toBe('.png')
    expect(extensionForBytes(Uint8Array.of(0x00), '.mp4')).toBe('.mp4')
    outputDir = await mkdtemp(join(tmpdir(), 'dsh-imagine-cov-'))
    await expect(persistBytes(outputDir, new Uint8Array(), '.png')).rejects.toThrow(/empty media payload/)
    const first = await persistBytes(outputDir, jpegBytes(), '.png')
    expect(first.endsWith('.jpg')).toBe(true)
    const second = await persistBytes(outputDir, jpegBytes(), '.png')
    expect(second).not.toBe(first)
  })

  it('resolves jpg, webp, relative, http, and empty image refs', async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'dsh-imagine-cov-'))
    const jpg = join(outputDir, 'a.jpg')
    const webp = join(outputDir, 'a.webp')
    const rel = 'rel.png'
    await writeFile(jpg, jpegBytes())
    await writeFile(webp, webpBytes())
    await writeFile(join(outputDir, rel), jpegBytes())
    expect(await resolveImageRef(jpg, outputDir)).toContain('image/jpeg')
    expect(await resolveImageRef(webp, outputDir)).toContain('image/webp')
    expect(await resolveImageRef(rel, outputDir)).toContain('data:')
    expect(await resolveImageRef('https://example.test/x.png', outputDir)).toBe('https://example.test/x.png')
    await expect(resolveImageRef('   ', outputDir)).rejects.toThrow(/non-empty string/)
  })

  it('covers ImagineClient argument, poll, network, and abort failures', async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'dsh-imagine-cov-'))
    const client = new ImagineClient({
      apiKey: 'k',
      baseURL: 'http://127.0.0.1:1/',
      imageModel: 'img',
      videoModel: 'vid',
      outputDir,
      pollIntervalMs: 1,
      pollTimeoutMs: 20,
    })
    expect(() => client.editImage({ prompt: 'x' })).toThrow(ImagineError)
    expect(() => client.imageToVideo({ prompt: 'x' })).toThrow(ImagineError)
    await expect(client.editImage({
      prompt: 'x',
      image: 'data:image/png;base64,aa',
      aspectRatio: '1:1',
    })).rejects.toThrow(ImagineError)
    await expect(client.generateImage({ prompt: 'x', aspectRatio: '1:1' })).rejects.toThrow(ImagineError)
    const aborted = new AbortController()
    aborted.abort()
    await expect(client.generateImage({ prompt: 'x' }, aborted.signal)).rejects.toThrow(/aborted/)
  })

  it('polls a failed video and a completed-empty video', async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'dsh-imagine-cov-'))
    const requests: string[] = []
    const server = createServer((request: IncomingMessage, response: ServerResponse) => {
      let body = ''
      request.setEncoding('utf8')
      request.on('data', (chunk: string) => { body += chunk })
      request.on('end', () => {
        requests.push(`${request.method} ${request.url}`)
        response.writeHead(200, { 'content-type': 'application/json' })
        if (request.method === 'POST') {
          response.end(JSON.stringify({ request_id: 'v1' }))
          return
        }
        const gets = requests.filter(item => item.startsWith('GET')).length
        if (gets === 1) {
          response.end(JSON.stringify({ status: 'failed', error: 'nope' }))
          return
        }
        if (gets === 2) {
          response.end(JSON.stringify({ status: 'done' }))
          return
        }
        response.end(JSON.stringify({ status: 'error' }))
      })
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (address === null || typeof address === 'string') throw new Error('no port')
    const url = `http://127.0.0.1:${address.port}`
    const client = new ImagineClient({
      apiKey: 'k',
      baseURL: url,
      imageModel: 'img',
      videoModel: 'vid',
      outputDir,
      pollIntervalMs: 1,
      pollTimeoutMs: 2_000,
    })
    await expect(client.imageToVideo({
      prompt: 'x',
      image: 'data:image/png;base64,aa',
      duration: 6,
      resolution: '480p',
    })).rejects.toThrow(/nope/)
    await expect(client.referenceToVideo({
      prompt: 'x',
      referenceImages: ['data:image/png;base64,aa'],
    })).rejects.toThrow(/without media/)
    await expect(client.referenceToVideo({
      prompt: 'x',
      voices: ['eve'],
      duration: 6,
      aspectRatio: '16:9',
      resolution: '720p',
    })).rejects.toThrow(/video generation failed/)
    const hang = createServer((request: IncomingMessage, response: ServerResponse) => {
      request.resume()
      request.on('end', () => {
        if (request.method === 'POST') {
          response.writeHead(200, { 'content-type': 'application/json' })
          response.end(JSON.stringify({ request_id: 'slow' }))
          return
        }
      })
    })
    await new Promise<void>(resolve => hang.listen(0, '127.0.0.1', resolve))
    const hangAddress = hang.address()
    if (hangAddress === null || typeof hangAddress === 'string') throw new Error('no port')
    const slow = new ImagineClient({
      apiKey: 'k',
      baseURL: `http://127.0.0.1:${hangAddress.port}`,
      imageModel: 'img',
      videoModel: 'vid',
      outputDir,
      pollIntervalMs: 80,
      pollTimeoutMs: 2_000,
    })
    const abortCtl = new AbortController()
    setTimeout(() => { abortCtl.abort() }, 20)
    await expect(slow.imageToVideo({
      prompt: 'x',
      image: 'data:image/png;base64,aa',
    }, abortCtl.signal)).rejects.toThrow(/aborted/)
    await new Promise<void>(resolve => hang.close(() => { resolve() }))
    await new Promise<void>(resolve => server.close(() => { resolve() }))
  })

  it('returns empty-result and non-object JSON as ImagineError', async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'dsh-imagine-cov-'))
    const server = createServer((request: IncomingMessage, response: ServerResponse) => {
      request.resume()
      request.on('end', () => {
        if (request.url === '/array') {
          response.writeHead(200, { 'content-type': 'application/json' })
          response.end('[]')
          return
        }
        response.writeHead(200, { 'content-type': 'application/json' })
        response.end(JSON.stringify({ hello: 'there' }))
      })
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (address === null || typeof address === 'string') throw new Error('no port')
    const url = `http://127.0.0.1:${address.port}`
    const client = new ImagineClient({
      apiKey: 'k',
      baseURL: url,
      imageModel: 'img',
      videoModel: 'vid',
      outputDir,
      pollIntervalMs: 1,
      pollTimeoutMs: 100,
    })
    await expect(client.generateImage({ prompt: 'x' })).rejects.toThrow(/no media/)
    await new Promise<void>(resolve => server.close(() => { resolve() }))

    const arrayServer = createServer((request: IncomingMessage, response: ServerResponse) => {
      request.resume()
      request.on('end', () => {
        response.writeHead(200, { 'content-type': 'application/json' })
        response.end('[]')
      })
    })
    await new Promise<void>(resolve => arrayServer.listen(0, '127.0.0.1', resolve))
    const arrayAddress = arrayServer.address()
    if (arrayAddress === null || typeof arrayAddress === 'string') throw new Error('no port')
    const arrayClient = new ImagineClient({
      apiKey: 'k',
      baseURL: `http://127.0.0.1:${arrayAddress.port}`,
      imageModel: 'img',
      videoModel: 'vid',
      outputDir,
      pollIntervalMs: 1,
      pollTimeoutMs: 100,
    })
    await expect(arrayClient.generateImage({ prompt: 'x' })).rejects.toThrow(/not a JSON object/)
    await new Promise<void>(resolve => arrayServer.close(() => { resolve() }))
  })
})

describe('Imagine plugin extras', () => {
  it('rejects invalid baseURL, reads env key, and invokes presenters', async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'dsh-imagine-cov-'))
    const ctx = new Context()
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(ToolRuntime)
    await expect(ctx.plugin(ToolImagine, { apiKey: 'k', outputDir, baseURL: ' ' }))
      .rejects.toThrow(/invalid baseURL/)
    await expect(ctx.plugin(ToolImagine, { apiKey: 'k', outputDir, pollTimeoutMs: 0 }))
      .rejects.toThrow(/pollTimeoutMs/)
    await ctx.plugin(ToolImagine, { apiKey: 'k', outputDir: '   ' })
    const previous = process.env.XAI_API_KEY
    delete process.env.XAI_API_KEY
    const ctxEnvMissing = new Context()
    await ctxEnvMissing.plugin(SystemPrompt)
    await ctxEnvMissing.plugin(ToolRuntime)
    await ctxEnvMissing.plugin(ToolImagine, { outputDir })
    await ctxEnvMissing.fiber.dispose()
    process.env.XAI_API_KEY = 'from-env'
    const ctx2 = new Context()
    await ctx2.plugin(SystemPrompt)
    await ctx2.plugin(ToolRuntime)
    await ctx2.plugin(ToolImagine, { outputDir })
    const gen = ctx2.tools.get('image_gen')
    expect(gen?.presentCall?.({ prompt: 'p' })).toMatchObject({ card: 'generic' })
    expect(ctx2.tools.get('image_edit')?.presentCall?.({ prompt: 'p', image: 'x' })).toMatchObject({ card: 'generic' })
    expect(ctx2.tools.get('image_to_video')?.presentCall?.({ image: 'x' })).toMatchObject({ card: 'generic' })
    expect(ctx2.tools.get('reference_to_video')?.presentCall?.({ prompt: 'p' })).toMatchObject({ card: 'generic' })
    const emptyEdit = await ctx2.tools.execute({
      signal: new AbortController().signal,
      callId: CallId('e1'),
      name: 'image_edit',
      arguments: { prompt: '   ', image: 'https://example.test/a.png' },
    })
    expect(emptyEdit.isError).toBe(true)
    const emptyR2v = await ctx2.tools.execute({
      signal: new AbortController().signal,
      callId: CallId('e2'),
      name: 'reference_to_video',
      arguments: { prompt: '   ', voices: ['eve'] },
    })
    expect(emptyR2v.isError).toBe(true)
    await ctx2.fiber.dispose()
    if (previous === undefined) delete process.env.XAI_API_KEY
    else process.env.XAI_API_KEY = previous
    await ctx.fiber.dispose()
  })
})

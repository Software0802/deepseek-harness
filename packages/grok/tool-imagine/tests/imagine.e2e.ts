import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { CallId } from '@deepseek-ai/dsh-llm'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import * as ToolImagine from '@deepseek-ai/dsh-tool-imagine'

/**
 * Real-API smoke for Imagine `image_gen`. Self-skips without `$XAI_API_KEY`
 * so keyless CI stays green.
 */
const apiKey = process.env.XAI_API_KEY
const maybe = apiKey !== undefined && apiKey.length > 0 ? describe : describe.skip

let outputDir: string | undefined

afterEach(async () => {
  if (outputDir !== undefined) await rm(outputDir, { recursive: true, force: true })
  outputDir = undefined
})

maybe('Imagine real API', () => {
  it('writes a generated image when XAI_API_KEY is set', async () => {
    outputDir = await mkdtemp(join(tmpdir(), 'dsh-imagine-e2e-'))
    const ctx = new Context()
    await ctx.plugin(SystemPrompt)
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(ToolImagine, { apiKey: apiKey!, outputDir })
    const result = await ctx.tools.execute({
      signal: new AbortController().signal,
      callId: CallId('imagine-e2e'),
      name: 'image_gen',
      arguments: { prompt: 'a tiny red square on white' },
    })
    expect(result.isError).toBe(false)
    if (result.isError) throw new Error('expected live image_gen success')
    const path = (result.value as { path: string }).path
    expect((await readFile(path)).byteLength).toBeGreaterThan(0)
    await ctx.fiber.dispose()
  }, 60_000)
})

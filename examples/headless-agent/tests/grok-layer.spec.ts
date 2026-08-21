import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { LOADER_SMOKE_TEST_TIMEOUT_MS, runLoaderSmoke } from '@deepseek-ai/dsh-loader-smoke'

const binScript = fileURLToPath(new URL('./fixtures/headless-driver.ts', import.meta.url))
const configPath = fileURLToPath(new URL('./fixtures/grok-layer/cordis.yml', import.meta.url))
const tsconfigPath = fileURLToPath(new URL('../../../tsconfig.json', import.meta.url))

const GROK_UNIQUE = [
  'image_gen',
  'image_edit',
  'image_to_video',
  'reference_to_video',
  'monitor',
] as const

describe('grok-layer Loader smoke', () => {
  it('boots the grok layer and exposes unique Imagine and monitor tools', async () => {
    let names: string[] = []
    const result = await runLoaderSmoke({
      label: 'grok-layer',
      tempDirPrefix: 'headless-grok-layer-smoke-',
      binScript,
      libBinScript: binScript,
      configPath,
      binArgs: [configPath, 'List the grok layer tools and stop.'],
      tsconfigPath,
      inspect: async (cwd) => {
        names = JSON.parse(await readFile(join(cwd, 'model-tools.json'), 'utf8')) as string[]
      },
    })
    expect(result.stderr).toBe('')
    expect(result.stdout).toContain('GROK_LAYER_READY')
    for (const name of GROK_UNIQUE) expect(names).toContain(name)
    expect(names).toContain('todo_write')
    expect(new Set(names).size).toBe(names.length)
  }, LOADER_SMOKE_TEST_TIMEOUT_MS)
})

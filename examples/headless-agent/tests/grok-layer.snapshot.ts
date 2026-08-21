import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { LOADER_SMOKE_TEST_TIMEOUT_MS, runLoaderSmoke } from '@deepseek-ai/dsh-loader-smoke'

const binScript = fileURLToPath(new URL('./fixtures/headless-driver.ts', import.meta.url))
const configPath = fileURLToPath(new URL('./fixtures/grok-layer/cordis.yml', import.meta.url))
const tsconfigPath = fileURLToPath(new URL('../../../tsconfig.json', import.meta.url))
const expectedPath = fileURLToPath(new URL('./snapshots/grok-layer/tool-schemas.expected.json', import.meta.url))

const GROK_UNIQUE = [
  'image_gen',
  'image_edit',
  'image_to_video',
  'reference_to_video',
  'monitor',
] as const

async function bootGrokLayer(): Promise<{ names: string[]; stdout: string; stderr: string }> {
  let names: string[] = []
  const result = await runLoaderSmoke({
    label: 'grok-layer',
    tempDirPrefix: 'headless-grok-layer-',
    binScript,
    libBinScript: binScript,
    configPath,
    binArgs: [configPath, 'List the grok layer tools and stop.'],
    tsconfigPath,
    inspect: async (cwd) => {
      names = JSON.parse(await readFile(join(cwd, 'model-tools.json'), 'utf8')) as string[]
    },
  })
  return { names, stdout: result.stdout, stderr: result.stderr }
}

describe('grok-layer keyless snapshot', () => {
  it('boots a composition including the grok tools without duplicating official names', async () => {
    const first = await bootGrokLayer()
    expect(first.stderr).toBe('')
    expect(first.stdout).toContain('GROK_LAYER_READY')
    for (const name of GROK_UNIQUE) expect(first.names).toContain(name)
    expect(first.names).toContain('todo_write')
    expect(first.names).toContain('job_output')
    expect(new Set(first.names).size).toBe(first.names.length)
    const sorted = [...first.names].sort()
    if (process.env.DSH_SNAPSHOT === 'refresh') {
      await mkdir(dirname(expectedPath), { recursive: true })
      await writeFile(expectedPath, `${JSON.stringify(sorted, null, 2)}\n`)
    }
    const expected = JSON.parse(await readFile(expectedPath, 'utf8')) as string[]
    expect(sorted).toEqual(expected)
  }, LOADER_SMOKE_TEST_TIMEOUT_MS)
})

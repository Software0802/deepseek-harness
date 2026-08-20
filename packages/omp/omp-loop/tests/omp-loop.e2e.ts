import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import { LOOP_PLUGIN, parseLoopPrompt } from '@deepseek-ai/dsh-omp-loop'
import { LOADER_SMOKE_TEST_TIMEOUT_MS, runLoaderSmoke } from '@deepseek-ai/dsh-loader-smoke'

const binScript = fileURLToPath(new URL('../../../../examples/headless-agent/tests/fixtures/headless-driver.ts', import.meta.url))
const configPath = fileURLToPath(new URL(
  '../../../../examples/headless-agent/tests/fixtures/omp-loop/cordis.yml',
  import.meta.url,
))
const repoTsconfig = fileURLToPath(new URL('../../../../tsconfig.json', import.meta.url))

async function jsonlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const paths = await Promise.all(entries.map(async (entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return jsonlFiles(path)
    return entry.isFile() && entry.name.endsWith('.jsonl') ? [path] : []
  }))
  return paths.flat()
}

describe('omp-loop through a real cordis.yml and headless process', () => {
  it('admits two renderer-owned loop continuations after the first human turn', async () => {
    let events: SessionEvent[] = []
    const { stdout, stderr } = await runLoaderSmoke({
      label: 'omp-loop',
      tempDirPrefix: 'omp-loop-e2e-',
      binScript,
      libBinScript: binScript,
      configPath,
      binArgs: [configPath, 'prove the OMP loop plugin'],
      tsconfigPath: repoTsconfig,
      inspect: async (cwd) => {
        const logs = await jsonlFiles(join(cwd, '.sessions'))
        expect(logs).toHaveLength(1)
        const lines = (await readFile(logs[0] as string, 'utf8')).trimEnd().split('\n')
        events = lines.slice(1).map(line => JSON.parse(line) as SessionEvent)
      },
    })
    expect(stderr).toBe('')
    const result = JSON.parse(stdout.trimEnd().split('\n').at(-1) ?? '') as Record<string, unknown>
    expect(result).toMatchObject({ type: 'result' })
    expect(result['output']).toBeTypeOf('string')

    const loops = events.filter((event): event is SessionEvent<'user/message'> =>
      event.type === 'user/message'
      && event.data.source.kind === 'plugin'
      && event.data.source.plugin === LOOP_PLUGIN)
    expect(loops).toHaveLength(2)
    expect(parseLoopPrompt(loops[0]!.data.content)).toMatchObject({ iteration: 1, maxIterations: 2 })
    expect(parseLoopPrompt(loops[1]!.data.content)).toMatchObject({ iteration: 2, maxIterations: 2 })
  }, LOADER_SMOKE_TEST_TIMEOUT_MS)
})

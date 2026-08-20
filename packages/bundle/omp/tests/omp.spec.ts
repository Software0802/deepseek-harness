import { existsSync, readFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as yaml from 'js-yaml'
import { entryListSchema } from '@deepseek-ai/cordis-plugin-include'
import { Context } from '@deepseek-ai/cordis'
import InvariantRegistry from '@deepseek-ai/dsh-invariants'
import * as OmpBundle from '@deepseek-ai/dsh-omp'
import * as OmpBundleInvariant from '@deepseek-ai/dsh-omp/invariant'
import { OMP_PLUGIN_CATALOG } from '@deepseek-ai/dsh-omp'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '../../../..')

describe('dsh-omp catalog', () => {
  it('maps every cataloged OMP name to a workspace package', () => {
    expect('default' in OmpBundle).toBe(false)
    const names = new Set(
      globSync('packages/*/*/package.json', { cwd: repoRoot }).map((rel) => {
        const manifest = JSON.parse(readFileSync(join(repoRoot, rel), 'utf8')) as { name: string }
        return manifest.name
      }),
    )
    expect(OMP_PLUGIN_CATALOG.map(row => row.ompName)).toEqual(expect.arrayContaining([
      'goal', 'loop', 'advisor', 'ralph', 'plan', 'skill', 'schedule', 'hooks', 'advisory-repeat',
    ]))
    for (const row of OMP_PLUGIN_CATALOG) {
      expect(names.has(row.dshPackage), row.dshPackage).toBe(true)
      expect(existsSync(join(repoRoot, 'packages'))).toBe(true)
    }
  })

  it('does not remount official dsh-base plugins in the patch layer', () => {
    const text = readFileSync(join(here, '../cordis.patch.yml'), 'utf8')
    expect(text).not.toContain('dsh-goal')
    expect(text).not.toContain('dsh-plan-mode')
    expect(text).not.toContain('dsh-tool-ralph')
  })
})

describe('dsh-omp patch', () => {
  it('declares a parseable insert list through the dsh.bundle.patch manifest field', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      dsh?: { bundle?: { patch?: string } }
    }
    expect(manifest.dsh?.bundle?.patch).toBe('./cordis.patch.yml')
    const parsed = yaml.load(
      readFileSync(join(root, manifest.dsh!.bundle!.patch!), 'utf8'),
      { schema: entryListSchema },
    )
    expect(Array.isArray(parsed)).toBe(true)
    const rows = (parsed as { insert?: { id?: string; name?: string }[] }[]).flatMap(patch => patch.insert ?? [])
    expect(rows.map(row => row.id)).toEqual(['omp-loop', 'omp-advisor'])
    expect(rows.map(row => row.name)).toEqual([
      '@deepseek-ai/dsh-omp-loop',
      '@deepseek-ai/dsh-omp-advisor',
    ])
  })
})

describe('dsh-omp invariant', () => {
  it('registers an empty companion', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await ctx.plugin(OmpBundleInvariant)
    expect(ctx.invariants).toBeDefined()
    await ctx.fiber.dispose()
  })
})

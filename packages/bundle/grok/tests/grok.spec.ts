import { existsSync, readFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as yaml from 'js-yaml'
import { entryListSchema } from '@deepseek-ai/cordis-plugin-include'
import { Context } from '@deepseek-ai/cordis'
import InvariantRegistry from '@deepseek-ai/dsh-invariants'
import * as GrokBundle from '@deepseek-ai/dsh-grok'
import * as GrokBundleInvariant from '@deepseek-ai/dsh-grok/invariant'
import { GROK_PLUGIN_CATALOG } from '@deepseek-ai/dsh-grok'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '../../../..')

const REQUIRED_GROK_NAMES = [
  'read_file', 'write', 'search_replace', 'list_dir', 'grep', 'bash',
  'web_search', 'web_fetch', 'lsp', 'todo_write', 'ask_user_question',
  'enter_plan_mode', 'exit_plan_mode', 'task', 'task_output', 'kill_task',
  'scheduler', 'workflow', 'update_goal', 'skill', 'mcp', 'hooks',
  'image_gen', 'image_edit', 'image_to_video', 'reference_to_video', 'monitor',
] as const

describe('dsh-grok catalog', () => {
  it('maps every cataloged Grok Build name to a workspace package', () => {
    expect('default' in GrokBundle).toBe(false)
    const names = new Set(
      globSync('packages/*/*/package.json', { cwd: repoRoot }).map((rel) => {
        const manifest = JSON.parse(readFileSync(join(repoRoot, rel), 'utf8')) as { name: string }
        return manifest.name
      }),
    )
    expect(GROK_PLUGIN_CATALOG.map(row => row.grokName)).toEqual(expect.arrayContaining([...REQUIRED_GROK_NAMES]))
    for (const row of GROK_PLUGIN_CATALOG) {
      expect(names.has(row.dshPackage), row.dshPackage).toBe(true)
      expect(existsSync(join(repoRoot, 'packages'))).toBe(true)
      if (row.origin === 'dsh-official') {
        expect(row.dshPackage).not.toBe('@deepseek-ai/dsh-tool-imagine')
        expect(row.dshPackage).not.toBe('@deepseek-ai/dsh-tool-monitor')
        const packageDir = globSync('packages/*/*/package.json', { cwd: repoRoot }).find((rel) => {
          const manifest = JSON.parse(readFileSync(join(repoRoot, rel), 'utf8')) as { name: string }
          return manifest.name === row.dshPackage
        })
        expect(packageDir, row.dshPackage).toBeDefined()
        expect(packageDir?.startsWith('packages/grok/')).toBe(false)
      }
    }
  })

  it('does not remount official dsh-base plugins in the patch layer', () => {
    const text = readFileSync(join(here, '../cordis.patch.yml'), 'utf8')
    expect(text).not.toContain('dsh-tool-fs')
    expect(text).not.toContain('dsh-tool-bash')
    expect(text).not.toContain('dsh-tool-web')
    expect(text).not.toContain('dsh-plan-mode')
    expect(text).not.toContain('dsh-tool-todo')
  })

  it('does not stack the grok bundle on default web or headless templates', () => {
    const profileSrc = readFileSync(join(repoRoot, 'packages/boot/app-boot/src/profile.ts'), 'utf8')
    expect(profileSrc).toContain("web: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']")
    expect(profileSrc).toContain("headless: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-headless']")
    expect(profileSrc).not.toContain('@deepseek-ai/dsh-grok')
    const webPatch = readFileSync(join(repoRoot, 'packages/bundle/web-app/package.json'), 'utf8')
    const headlessPatch = readFileSync(join(repoRoot, 'packages/bundle/headless/package.json'), 'utf8')
    expect(webPatch).not.toContain('@deepseek-ai/dsh-grok')
    expect(headlessPatch).not.toContain('@deepseek-ai/dsh-grok')
  })
})

describe('dsh-grok patch', () => {
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
    expect(rows.map(row => row.id)).toEqual(['grok-tool-imagine', 'grok-tool-monitor'])
    expect(rows.map(row => row.name)).toEqual([
      '@deepseek-ai/dsh-tool-imagine',
      '@deepseek-ai/dsh-tool-monitor',
    ])
  })
})

describe('dsh-grok invariant', () => {
  it('registers an empty companion', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await ctx.plugin(GrokBundleInvariant)
    expect(ctx.invariants).toBeDefined()
    await ctx.fiber.dispose()
  })
})

import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import SkillRegistry from '@deepseek-ai/dsh-skill'
import * as VflowSkills from '../src/index.ts'

let context: Context | undefined
let home: string | undefined

afterEach(async () => {
  await context?.fiber.dispose()
  context = undefined
  if (home !== undefined) await rm(home, { recursive: true, force: true })
  home = undefined
})

async function setup(providerName = 'vflow'): Promise<Context> {
  home = await mkdtemp(join(tmpdir(), 'vflow-skills-'))
  context = new Context()
  await context.plugin(SkillRegistry)
  await context.plugin(VflowSkills, { providerName, teamSettings: { source: '', fetchTimeoutMs: 10_000, stateFile: join(home, 'team-settings.json') } })
  return context
}

describe('vflow skill pack', () => {
  it('lists every shipped skill as a complete bundled catalog', async () => {
    const ctx = await setup()
    const shipped = (await readdir(VflowSkills.VFLOW_SKILL_DIR, { withFileTypes: true }))
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()

    const snapshot = await ctx.skills.snapshot()
    expect(snapshot.complete).toBe(true)
    expect(snapshot.skills.map(skill => skill.name).sort()).toEqual(shipped)
    expect(snapshot.skills.every(skill => skill.source === 'bundled')).toBe(true)
  })

  it('loads the first-mate rules', async () => {
    const ctx = await setup()
    const skill = await ctx.skills.get('vflow-first-mate')
    expect(skill?.description).toContain('副手')
    expect(skill?.content).toContain('必须先得到用户明确同意的动作')
  })

  it('removes the catalog when the plugin is disposed', async () => {
    const ctx = await setup('vflow-test')
    expect(await ctx.skills.get('vflow-first-mate')).toBeDefined()
    await ctx.fiber.dispose()
    context = new Context()
    await context.plugin(SkillRegistry)
    expect(await context.skills.get('vflow-first-mate')).toBeUndefined()
  })
})

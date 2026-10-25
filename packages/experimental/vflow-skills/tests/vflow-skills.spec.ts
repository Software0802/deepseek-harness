import { readdir } from 'node:fs/promises'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import SkillRegistry from '@deepseek-ai/dsh-skill'
import * as VflowSkills from '../src/index.ts'

let context: Context | undefined

afterEach(async () => {
  await context?.fiber.dispose()
  context = undefined
})

async function setup(config?: VflowSkills.Config): Promise<Context> {
  context = new Context()
  await context.plugin(SkillRegistry)
  await context.plugin(VflowSkills, config)
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
    const ctx = await setup({ providerName: 'vflow-test' })
    expect(await ctx.skills.get('vflow-first-mate')).toBeDefined()
    await ctx.fiber.dispose()
    context = new Context()
    await context.plugin(SkillRegistry)
    expect(await context.skills.get('vflow-first-mate')).toBeUndefined()
  })
})

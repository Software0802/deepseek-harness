import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import InvariantRegistry from '@deepseek-ai/dsh-invariants'
import * as ImagineInvariant from '@deepseek-ai/dsh-tool-imagine/invariant'

describe('dsh-tool-imagine invariant', () => {
  it('registers an empty companion', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await ctx.plugin(ImagineInvariant)
    expect(ctx.invariants).toBeDefined()
    await ctx.fiber.dispose()
  })
})

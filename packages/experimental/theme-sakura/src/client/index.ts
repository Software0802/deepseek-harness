/** Sakura theme: stacks the palette as one ui-theme override layer while the row is enabled. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import { SAKURA_TOKENS } from './palette.ts'

export { SAKURA_TOKENS } from './palette.ts'

/** Override-layer source; one layer per package. */
export const LAYER_SOURCE = '@deepseek-ai/dsh-experimental-theme-sakura'

/** Required service: the ui-theme runtime. */
export const inject = ['theme']

/**
 * Apply the palette over whichever light or dark scheme the user selects; disposing the row restores the base palette.
 * @param ctx - Client plugin context owning the override layer.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.theme.overrideTokens(LAYER_SOURCE, SAKURA_TOKENS), 'theme-sakura: palette layer')
}

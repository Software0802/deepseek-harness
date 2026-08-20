/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-omp-advisor`.
 * @module @deepseek-ai/dsh-omp-advisor/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-omp-advisor'

/** Cordis companion plugin name. */
export const name = 'omp-advisor-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: reviewer notes are model-authored plugin notices whose
 * text is not a package-owned renderer output, and the side-channel LLM call
 * is not a session event.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */

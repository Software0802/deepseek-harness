/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-omp-loop`.
 * @module @deepseek-ai/dsh-omp-loop/invariant
 */

import { isDeepStrictEqual } from 'node:util'
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantFailure, InvariantInstaller } from '@deepseek-ai/dsh-invariants'
import type { Session, SessionEvent } from '@deepseek-ai/dsh-session'
import { LOOP_PLUGIN, parseLoopPrompt, renderLoopPrompt } from './prompt.ts'

const PACKAGE_NAME = '@deepseek-ai/dsh-omp-loop'

/** Cordis companion plugin name. */
export const name = 'omp-loop-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/** Validate one package-owned continuation message against the renderer. */
function validateEvent(event: SessionEvent, fail: InvariantFailure): void {
  if (event.type !== 'user/message') return
  const source = event.data.source
  if (source.kind !== 'plugin' || source.plugin !== LOOP_PLUGIN) return
  const parts = parseLoopPrompt(event.data.content)
  if (parts === undefined) {
    fail('omp-loop continuation content is not a renderer-owned loop prompt')
    return
  }
  if (!isDeepStrictEqual(event.data.content, renderLoopPrompt(parts))) {
    fail(`loop iteration ${parts.iteration} content does not match the package-owned continuation prompt`)
  }
}

/** Check existing sessions and every candidate event before Session publishes it. */
const install: InvariantInstaller = Object.assign((ctx: Context, fail: InvariantFailure) => {
  for (const session of ctx.sessions.list()) {
    for (const event of session.events) validateEvent(event, fail)
  }
  /* jscpd:ignore-start -- package companions share dispatch and registration plumbing */
  ctx.on('internal/dispatch', (_mode, eventName, args) => {
    if (eventName !== 'session/event') return
    const [, event] = args as [Session, SessionEvent]
    validateEvent(event, fail)
  }, { global: true })
}, { inject: ['sessions'] })

/**
 * Register the omp-loop invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */

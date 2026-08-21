/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-tool-monitor`.
 * @module @deepseek-ai/dsh-tool-monitor/invariant
 */

import { isDeepStrictEqual } from 'node:util'
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantFailure, InvariantInstaller } from '@deepseek-ai/dsh-invariants'
import type { Session, SessionEvent } from '@deepseek-ai/dsh-session'
import { MONITOR_PLUGIN, parseMonitorLine, renderMonitorLine } from './prompt.ts'

const PACKAGE_NAME = '@deepseek-ai/dsh-tool-monitor'

/** Cordis companion plugin name. */
export const name = 'tool-monitor-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/** Validate one package-owned monitor follow-up against the renderer. */
function validateEvent(event: SessionEvent, fail: InvariantFailure): void {
  if (event.type !== 'user/message') return
  const source = event.data.source
  if (source.kind !== 'plugin' || source.plugin !== MONITOR_PLUGIN) return
  const line = parseMonitorLine(event.data.content)
  if (line === undefined) {
    fail('tool-monitor follow-up content is not a renderer-owned monitor line')
    return
  }
  /* v8 ignore next 3 -- parseMonitorLine already requires renderer-owned single-block text */
  if (!isDeepStrictEqual(event.data.content, renderMonitorLine(line))) {
    fail('tool-monitor follow-up content does not match the package-owned renderer')
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
 * Register the monitor invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */

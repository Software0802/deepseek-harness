/** Test-only Loader plugin that starts `/loop 2` after the first completed turn. */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-commands'
import type { Session, SessionEvent } from '@deepseek-ai/dsh-session'

export const name = 'seed-loop'
export const inject = ['commands', 'agents']

/** Install a one-shot `/loop 2` after the first completed turn. */
export function apply(ctx: Context): void {
  let seeded = false
  ctx.on('session/event', (session: Session, event: SessionEvent) => {
    if (seeded || event.type !== 'turn/end' || event.data.reason.kind !== 'completed') return
    const agent = ctx.agents.get(session.id)
    if (agent === undefined) return
    seeded = true
    void ctx.commands.execute(agent, '/loop 2 continue the catalog', [], new AbortController().signal)
  })
}

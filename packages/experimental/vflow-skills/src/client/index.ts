/** Browser entry: mounts the plugin's Remote and registers its settings page on the Plugins page. */

import type { Context } from '@deepseek-ai/cordis'
import vflowRemote from '@deepseek-ai/dsh-experimental-vflow-skills/remote'
import { mountVflow } from './mount.ts'

export { inject } from './mount.ts'
export type { TestState, VflowPageState } from './mount.ts'
export type { VflowInjected, VflowSettingsProps } from './VflowSettings.tsx'
export type { VflowKey } from './locales.ts'

/**
 * Register the settings page on the Client Context.
 * @param ctx - Client Context with the declared `inject` services available.
 * @returns the disposer that withdraws the page.
 */
export async function apply(ctx: Context): Promise<() => Promise<void>> {
  return await mountVflow(ctx, vflowRemote)
}

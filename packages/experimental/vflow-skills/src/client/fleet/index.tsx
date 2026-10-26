/**
 * Browser registration of the fleet panel: a right-Sidebar tab type that claims no address,
 * its body and chip title, and the commands its cards call.
 */
import type { ReactNode } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type { IconProps } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { NS } from '../locales.ts'
import { FleetPanel, type FleetHostState, type FleetInjected } from './FleetPanel.tsx'
import { FleetEmblem } from './icons.tsx'
import css from './FleetPanel.module.css'

export type { FleetHostState, FleetInjected, FleetPanelProps } from './FleetPanel.tsx'

/** The tab kind this package owns. */
export const FLEET_KIND = 'vflow-fleet'
/** This implementation's identity in the tab system, and the key its body registers under. */
export const FLEET_ID = '@deepseek-ai/dsh-experimental-vflow-skills/fleet'

/** Services the fleet registration reads. */
export const fleetInject = ['remote.vflowFleet', 'slots', 'locale', 'sidebarRight', 'sidebarRightTabs']

/**
 * Guide artwork: the fleet emblem on the panel's gradient tile.
 * @param props - canvas size and layout class supplied by the guide.
 * @returns an ornamental SVG hidden from assistive technology.
 */
export function FleetGuideArtwork({ size = 36, className }: IconProps): ReactNode {
  return (
    <svg width={size} height={size} className={className} aria-hidden="true" viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="vflow-fleet-guide" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5B8CFF" />
          <stop offset=".55" stopColor="#3B5BF6" />
          <stop offset="1" stopColor="#6D4DF2" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="28" height="28" rx="9" fill="url(#vflow-fleet-guide)" />
      <g stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 21.5h17l-2.4 4H11.9z" />
        <path d="M18 9.5v12" />
        <path d="M18 10.8 24 18.8H18" />
        <path d="M18 13.6 13.4 18.8H18" />
      </g>
    </svg>
  )
}

/**
 * The chip title: the emblem before the tab's title.
 * @param props - the tab information hook.
 * @returns the title content.
 */
function FleetTitle({ useTabInfo }: PropsRuntime<'sidebar.right.pane.tab.title'>): ReactNode {
  const { tab } = useTabInfo()
  return (
    <>
      <span className={css.titleIcon}><FleetEmblem /></span>
      {tab.title}
    </>
  )
}

/**
 * The Sidebar chat resource of a fleet child, in the address format `@deepseek-ai/dsh-client-ui-subagent` registers.
 * @param parentSessionId - the lead Session.
 * @param childSessionId - the task's child Session.
 * @returns the resource address.
 */
export function childChatAddress(parentSessionId: SessionId, childSessionId: SessionId): string {
  const query = new URLSearchParams({ parent: parentSessionId, mode: 'continuable' })
  return `dsh-resource://subagentchat/session/${encodeURIComponent(childSessionId)}?${query}`
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Register the fleet tab type, its body, and its title.
 * @param ctx - Client Context carrying {@link fleetInject}.
 * @param t - the plugin's namespace-bound translate.
 */
export function registerFleet(ctx: Context, t: TranslateNS<typeof NS>): void {
  const host = createSnapshotStore<FleetHostState>({ capacity: undefined })
  void ctx.remote.vflowFleet.capacity().then((result) => {
    if (result.ok) host.update((draft) => { draft.capacity = result.value })
  }, (error: unknown) => { ctx.logger.warn('vflow fleet: capacity unavailable: %s', messageOf(error)) })
  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: FLEET_ID,
    kind: FLEET_KIND,
    priority: 'builtin',
    title: () => t('fleetTitle'),
    guide: [{ id: 'fleet', order: 40, title: () => t('fleetTitle'), description: () => t('fleetGuideDescription'), icon: FleetGuideArtwork }],
  }), 'vflow: fleet tab type')
  const inject = (sessionId: SessionId): FleetInjected => ({
    hooks: { fleet: host },
    answer: async (taskId, decisionId, choice) => {
      try {
        const result = await ctx.remote.vflowFleet.answer(sessionId, taskId, decisionId, choice)
        return result.ok ? undefined : result.error.message
      } catch (error) {
        return messageOf(error)
      }
    },
    openChild: (childId) => {
      ctx.sidebarRight.openResource(childChatAddress(sessionId, childId), {
        kind: 'subagentchat',
        preferNewPane: true,
      })
    },
  })
  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab', key: FLEET_ID, locale: 'vflow', inject,
  }, FleetPanel)), 'vflow: fleet tab body')
  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab.title', key: FLEET_ID,
  }, FleetTitle)), 'vflow: fleet tab title')
}

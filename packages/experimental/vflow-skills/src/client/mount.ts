/** Browser registration of the settings page: the `vflow` Remote behind one page store, and the Plugins page entry. */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-experimental-vflow-skills/remote'
import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { AccountInput, AccountTestResult, AccountView, TeamSettingsView } from '../types.ts'
import { VflowSettings, type VflowInjected } from './VflowSettings.tsx'
import { en, ja, es, fr, de, ru, pt, NS, zh, type VflowKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The 日系开发工作流 settings page and setup guide. */
    vflow: VflowKey
  }
}

/** Package whose Plugins page carries the settings page. */
export const PACKAGE_NAME = '@deepseek-ai/dsh-experimental-vflow-skills'
/** Loader entry id whose Config holds the team settings source. */
export const ENTRY_ID = 'vflow-skills'

/** Required browser services: the Remote namespace, slots, localized copy, and the Host config forms. */
export const inject = ['remote', 'slots', 'locale', 'configForms']

/** One connector's latest connection test. */
export type TestState =
  | { readonly status: 'running' }
  | { readonly status: 'done'; readonly result: AccountTestResult }

/** Everything the settings page draws. */
export interface VflowPageState {
  /** Undefined until the first Host answer. */
  teamSettings: TeamSettingsView | undefined
  accounts: readonly AccountView[]
  tests: Readonly<Record<string, TestState>>
  /** Whether a team settings check is running. */
  checking: boolean
  /** Whether the profile accepts a new source address. */
  writable: boolean
  /** Message of the last failed operation; cleared by the next success. */
  error: string | undefined
}

/** Partial Config section read from the Host form. */
interface EntryConfig {
  teamSettings?: { source?: unknown }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Page store plus the Remote calls that feed it. */
class VflowPage {
  readonly store: SnapshotStore<VflowPageState> = createSnapshotStore<VflowPageState>({
    teamSettings: undefined, accounts: [], tests: {}, checking: false, writable: false, error: undefined,
  })

  private readonly lifetime = new AbortController()

  constructor(private readonly ctx: Context) {
    const scope = ctx.configForms.get<EntryConfig>(ENTRY_ID)
    const sync = (): void => { this.store.update((draft) => { draft.writable = scope.getSnapshot().writable }) }
    sync()
    ctx.effect(() => scope.subscribe(sync), 'vflow: config form')
    ctx.effect(() => () => { this.lifetime.abort() }, 'vflow: page requests')
    ctx.effect(() => ctx.remote.$on('credentials/record-updated', () => { void this.reloadAccounts() }), 'vflow: credential updates')
    ctx.on('connection/reset', () => { void this.load() })
  }

  /** Read state without checking the source. */
  async load(): Promise<void> {
    const loaded = await this.apply(this.ctx.remote.vflow.teamSettings(), this.setTeamSettings)
    if (loaded) await this.reloadAccounts()
  }

  /** Re-read the adopted copy, check the source once, and re-list accounts. */
  readonly refresh = async (): Promise<void> => {
    this.store.update((draft) => { draft.checking = true })
    try {
      const checked = await this.apply(this.ctx.remote.vflow.refreshTeamSettings(), this.setTeamSettings)
      if (checked) await this.reloadAccounts()
    } finally {
      this.store.update((draft) => { draft.checking = false })
    }
  }

  /**
   * Persist a new source address through the Host form, then check it.
   * @param source - address entered by the user.
   * @returns whether the Host accepted the address.
   */
  readonly saveSource = async (source: string): Promise<boolean> => {
    const scope = this.ctx.configForms.get<EntryConfig>(ENTRY_ID)
    const accepted = await scope.mutate([{ op: 'set', path: ['teamSettings', 'source'], value: source.trim() }])
    if (accepted) await this.refresh()
    return accepted
  }

  /** Adopt the pending team settings version the user reviewed. */
  readonly accept = async (sha256: string): Promise<void> => {
    const accepted = await this.apply(this.ctx.remote.vflow.acceptTeamSettings(sha256), this.setTeamSettings)
    if (accepted) await this.reloadAccounts()
  }

  /** Save one connector account; the secret leaves the page with this call only. */
  readonly saveAccount = async (connectorId: string, input: AccountInput): Promise<boolean> => {
    const saved = await this.apply(this.ctx.remote.vflow.saveAccount(connectorId, input), () => {
      this.store.update((draft) => { draft.tests = withoutKey(draft.tests, connectorId) })
    })
    if (saved) await this.reloadAccounts()
    return saved
  }

  /** Remove one connector account. */
  readonly removeAccount = async (connectorId: string): Promise<void> => {
    const removed = await this.apply(this.ctx.remote.vflow.removeAccount(connectorId), () => {
      this.store.update((draft) => { draft.tests = withoutKey(draft.tests, connectorId) })
    })
    if (removed) await this.reloadAccounts()
  }

  /** Probe one connector with its saved account. */
  readonly testAccount = async (connectorId: string): Promise<void> => {
    this.store.update((draft) => { draft.tests = { ...draft.tests, [connectorId]: { status: 'running' } } })
    const applied = await this.apply(this.ctx.remote.vflow.testAccount(connectorId, this.lifetime.signal), (result) => {
      this.store.update((draft) => { draft.tests = { ...draft.tests, [connectorId]: { status: 'done', result } } })
    })
    if (!applied) this.store.update((draft) => { draft.tests = withoutKey(draft.tests, connectorId) })
  }

  /** Probe every testable connector that has an account. */
  readonly testAll = async (): Promise<void> => {
    const targets = this.store.getSnapshot().accounts.filter(account => account.testable && account.configured)
    await Promise.all(targets.map(account => this.testAccount(account.connectorId)))
  }

  private readonly setTeamSettings = (view: TeamSettingsView): void => {
    this.store.update((draft) => { draft.teamSettings = view })
  }

  private async reloadAccounts(): Promise<void> {
    await this.apply(this.ctx.remote.vflow.listAccounts(), (accounts) => { this.store.update((draft) => { draft.accounts = accounts }) })
  }

  /** Settle one Remote call into the store; failures become the page's error line. */
  private async apply<T>(call: Promise<RemoteResult<T>>, onValue: (value: T) => void): Promise<boolean> {
    let result: RemoteResult<T>
    try {
      result = await call
    } catch (error) {
      if (this.lifetime.signal.aborted) return false
      this.store.update((draft) => { draft.error = messageOf(error) })
      return false
    }
    if (this.lifetime.signal.aborted) return false
    if (!result.ok) {
      this.store.update((draft) => { draft.error = result.error.message })
      return false
    }
    onValue(result.value)
    this.store.update((draft) => { draft.error = undefined })
    return true
  }
}

function withoutKey<T>(record: Readonly<Record<string, T>>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([entry]) => entry !== key))
}

function registerUi(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'vflow: dictionaries')
  const page = new VflowPage(ctx)
  void page.load()
  const injected: VflowInjected = {
    hooks: { vflow: page.store },
    refresh: page.refresh,
    saveSource: page.saveSource,
    accept: page.accept,
    saveAccount: page.saveAccount,
    removeAccount: page.removeAccount,
    testAccount: page.testAccount,
    testAll: page.testAll,
  }
  ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
    name: 'plugins.bundle.config', key: PACKAGE_NAME, locale: NS, inject: () => injected,
  }, VflowSettings))
}

/**
 * Mount the plugin's Remote contribution and register the settings page.
 * @param ctx - browser Context with `remote`, `slots`, `locale`, and `configForms`.
 * @param contribution - the generated `vflow` Remote contribution.
 * @returns the disposer that withdraws the page and the Remote mount.
 */
export async function mountVflow(ctx: Context, contribution: TypertRemoteContribution): Promise<() => Promise<void>> {
  const disposeRemote = await ctx.remote.$mount(contribution)
  const ui = ctx.inject(['remote.vflow', ...inject.slice(1)], registerUi)
  try {
    await ui
  } catch (error) {
    await ui.dispose()
    await disposeRemote()
    throw error
  }
  return async () => {
    await ui.dispose()
    await disposeRemote()
  }
}

/**
 * `vflow` Remote namespace: the team settings state and the connector account
 * operations the browser settings page calls. Secrets travel only inward, in
 * {@link VflowController.saveAccount}; no method returns one.
 *
 * @module
 */

import type { Context } from '@deepseek-ai/cordis'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { AccountError } from './accounts.ts'
import type { ParsedTeamSettings } from './team-settings.ts'
import type { TeamSettingsState } from './team-settings-service.ts'
import type { AccountInput, AccountTestResult, AccountView, TeamSettingsSummary, TeamSettingsView } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    vflowController: VflowController
  }
}

/** Host controller behind the plugin's settings page. */
export class VflowController extends TypertRemoteService {
  static inject = ['typert', 'vflowTeamSettings', 'vflowAccounts']

  /** @param ctx - plugin context carrying the team settings and account services. */
  constructor(ctx: Context) {
    super(ctx, 'vflowController', { namespace: 'vflow' })
  }

  /**
   * Read the team settings state without checking the source.
   * @returns the current state.
   */
  @Remote
  teamSettings(): TeamSettingsView {
    return this.view(this.ctx.vflowTeamSettings.snapshot())
  }

  /**
   * Re-read the adopted copy and check the source once.
   * @returns the state after the check.
   */
  @Remote
  async refreshTeamSettings(): Promise<TeamSettingsView> {
    return this.view(await this.ctx.vflowTeamSettings.refresh())
  }

  /**
   * Adopt the pending version the user reviewed.
   * @param sha256 - hash of the version shown to the user.
   * @returns the state after adoption.
   * @throws RemoteError `vflow/no-pending-version` when that version is no longer pending.
   */
  @Remote
  async acceptTeamSettings(sha256: string): Promise<TeamSettingsView> {
    const state = this.ctx.vflowTeamSettings.snapshot()
    if (state.status !== 'ready' || state.pending?.sha256 !== sha256) {
      throw new RemoteError('vflow/no-pending-version', `Team settings version ${sha256} is no longer pending`, { sha256 })
    }
    return this.view(await this.ctx.vflowTeamSettings.accept(sha256))
  }

  /**
   * List one account entry per connector of the adopted team settings.
   * @returns account facts without secrets.
   */
  @Remote
  listAccounts(): Promise<AccountView[]> {
    return this.ctx.vflowAccounts.list()
  }

  /**
   * Save or replace the user's account for one connector in the local credential store.
   * @param connectorId - connector id from the adopted team settings.
   * @param input - login name and secret.
   * @returns after the account is stored.
   * @throws RemoteError `vflow/unknown-connector` or `vflow/invalid-account`.
   */
  @Remote
  async saveAccount(connectorId: string, input: AccountInput): Promise<void> {
    await remoteAccount(() => this.ctx.vflowAccounts.save(connectorId, input))
  }

  /**
   * Remove the user's account for one connector.
   * @param connectorId - connector id from the adopted team settings.
   * @returns after the account is removed.
   * @throws RemoteError `vflow/unknown-connector`.
   */
  @Remote
  async removeAccount(connectorId: string): Promise<void> {
    await remoteAccount(() => this.ctx.vflowAccounts.remove(connectorId))
  }

  /**
   * Probe one connector with the saved account.
   * @param connectorId - connector id from the adopted team settings.
   * @param signal - Client cancellation or Remote contribution withdrawal.
   * @returns the probe outcome.
   * @throws RemoteError `vflow/unknown-connector`.
   */
  @Remote
  testAccount(connectorId: string, signal: AbortSignal): Promise<AccountTestResult> {
    return remoteAccount(() => this.ctx.vflowAccounts.test(connectorId, signal))
  }

  private view(state: TeamSettingsState): TeamSettingsView {
    const source = this.ctx.vflowTeamSettings.source()
    switch (state.status) {
      case 'unconfigured': return { status: 'unconfigured', source }
      case 'failed': return { status: 'failed', source, error: describe(state.error) }
      case 'ready': return {
        status: 'ready',
        source,
        current: summarize(state.current),
        ...state.pending === undefined ? {} : { pending: summarize(state.pending) },
        ...state.sourceError === undefined ? {} : { sourceError: describe(state.sourceError) },
      }
    }
  }
}

/** Run one account operation, translating its refusals into Remote failures. */
async function remoteAccount<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (!(error instanceof AccountError)) throw error
    switch (error.code) {
      case 'unknown-connector': throw new RemoteError('vflow/unknown-connector', error.message, { connectorId: error.connectorId })
      case 'invalid-account': throw new RemoteError('vflow/invalid-account', error.message, { connectorId: error.connectorId })
    }
  }
}

function summarize(version: ParsedTeamSettings): TeamSettingsSummary {
  const { settings } = version
  return {
    name: settings.name,
    sha256: version.sha256,
    connectorCount: Object.keys(settings.connectors).length,
    projects: settings.projects.map(project => project.displayName),
    defaultReviewer: settings.defaultReviewer,
  }
}

/** Error message followed by its cause chain. */
function describe(error: Error): string {
  const parts = [error.message]
  let cause: unknown = error.cause
  while (cause instanceof Error) {
    parts.push(cause.message)
    cause = cause.cause
  }
  return parts.join(': ')
}

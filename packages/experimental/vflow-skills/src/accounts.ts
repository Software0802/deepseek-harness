/**
 * `ctx.vflowAccounts`: each user's account for every connector the team
 * settings name, kept in the local credential store, plus a read-only
 * connection test per connector.
 *
 * @module
 */

import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type Schema from '@deepseek-ai/schemastery'
import { credentialKey } from '@deepseek-ai/dsh-credentials'
import type { CredentialKey } from '@deepseek-ai/dsh-credentials'
import type { ConnectorKind, ConnectorSettings } from './team-settings.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    vflowAccounts: AccountsService
  }
}

/** Credential record scope that owns every vflow account. */
export const ACCOUNT_SCOPE = 'vflow'

/** Account store configuration. */
export interface AccountsConfig {
  /** Time limit for one connection test. */
  probeTimeoutMs: number
}

/** Schemastery schema for {@link AccountsConfig}. */
export const AccountsConfig: Schema<AccountsConfig> = z.object({
  probeTimeoutMs: z.natural().min(1).default(10_000).description('Time limit for one connection test, in milliseconds.'),
})

/** Account values a user enters for one connector. */
export interface AccountInput {
  /** Login name on the connector. */
  username: string
  /** Password, API key, or HTTP access token for that login. */
  secret: string
}

/** Account facts safe for a settings page: never the secret. */
export interface AccountView {
  connectorId: string
  kind: ConnectorKind
  url: string
  configured: boolean
  /** Saved login name; absent while unconfigured. */
  username?: string
  /** Whether {@link AccountsService.test} can probe this connector. */
  testable: boolean
}

/**
 * Connection test result. `unsupported`: no read-only probe exists for this
 * connector kind or address scheme. `not-configured`: no account is saved.
 * `unauthorized`: the connector refused the account. `unreachable`: the request
 * failed or timed out. `unexpected-status`: any other HTTP status.
 */
export type AccountTestResult =
  | { readonly ok: true; readonly status: number }
  | { readonly ok: false; readonly reason: 'unsupported' | 'not-configured' | 'unreachable' }
  | { readonly ok: false; readonly reason: 'unauthorized' | 'unexpected-status'; readonly status: number }

/** Read-only path, relative to the connector URL, that answers 2xx only for a valid login. */
const PROBE_PATH: Readonly<Partial<Record<ConnectorKind, string>>> = {
  redmine: 'users/current.json',
  jira: 'rest/api/2/myself',
  gerrit: 'a/accounts/self',
  jenkins: 'me/api/json',
  svn: '',
}

/** Stored grant payload. */
interface AccountPayload {
  username: string
  secret: string
}

/** Validate a grant payload read back from the credential store. */
function readPayload(payload: unknown): AccountPayload | undefined {
  if (payload === null || typeof payload !== 'object') return undefined
  const { username, secret } = payload as Record<string, unknown>
  return typeof username === 'string' && username !== '' && typeof secret === 'string' && secret !== ''
    ? { username, secret }
    : undefined
}

/** Owner of the vflow account records. */
export class AccountsService extends Service {
  static inject = ['credentials', 'vflowTeamSettings']
  static Config: Schema<AccountsConfig> = AccountsConfig

  /**
   * @param ctx - plugin context carrying the credential store and team settings.
   * @param config - validated account store configuration.
   */
  constructor(ctx: Context, private readonly config: AccountsConfig) {
    super(ctx, 'vflowAccounts')
  }

  /**
   * One entry per connector in the adopted team settings, in document order.
   * @returns account facts without secrets; empty while no team settings are adopted.
   */
  async list(): Promise<AccountView[]> {
    const views: AccountView[] = []
    for (const [connectorId, connector] of Object.entries(this.connectors())) {
      const account = await this.read(connectorId)
      views.push({
        connectorId,
        kind: connector.kind,
        url: connector.url,
        configured: account !== undefined,
        ...account === undefined ? {} : { username: account.username },
        testable: probeUrl(connector) !== undefined,
      })
    }
    return views
  }

  /**
   * Save or replace the user's account for one connector.
   * @param connectorId - connector id from the adopted team settings.
   * @param input - login name and secret; both must be non-empty.
   * @throws Error when the connector is unknown or a value is empty.
   */
  async save(connectorId: string, input: AccountInput): Promise<void> {
    this.connector(connectorId)
    if (input.username === '' || input.secret === '') {
      throw new Error('vflow accounts: username and secret must both be non-empty')
    }
    const payload: AccountPayload = { username: input.username, secret: input.secret }
    await this.ctx.credentials.modifyRecord(this.key(connectorId), () => Promise.resolve({ kind: 'grant', payload }))
  }

  /**
   * Remove the user's account for one connector; no-op when none is saved.
   * @param connectorId - connector id from the adopted team settings.
   * @throws Error when the connector is unknown.
   */
  async remove(connectorId: string): Promise<void> {
    this.connector(connectorId)
    await this.ctx.credentials.deleteRecord(this.key(connectorId))
  }

  /**
   * Probe one connector with a read-only request that succeeds only for a valid login.
   * @param connectorId - connector id from the adopted team settings.
   * @param signal - optional caller cancellation, combined with the configured time limit.
   * @returns the probe outcome; transport failures are reported as `unreachable`, not thrown.
   * @throws Error when the connector is unknown.
   */
  async test(connectorId: string, signal?: AbortSignal): Promise<AccountTestResult> {
    const url = probeUrl(this.connector(connectorId))
    if (url === undefined) return { ok: false, reason: 'unsupported' }
    const account = await this.read(connectorId)
    if (account === undefined) return { ok: false, reason: 'not-configured' }
    const timeout = AbortSignal.timeout(this.config.probeTimeoutMs)
    let response: Response
    try {
      response = await fetch(url, {
        headers: { authorization: `Basic ${Buffer.from(`${account.username}:${account.secret}`).toString('base64')}` },
        redirect: 'manual',
        signal: signal === undefined ? timeout : AbortSignal.any([signal, timeout]),
      })
    } catch (error) {
      // A caller abort propagates; network errors and the time limit are the outcome under test.
      if (signal?.aborted) throw error
      return { ok: false, reason: 'unreachable' }
    }
    await response.body?.cancel()
    if (response.status >= 200 && response.status < 300) return { ok: true, status: response.status }
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'unauthorized', status: response.status }
    return { ok: false, reason: 'unexpected-status', status: response.status }
  }

  /** Connectors of the adopted team settings; empty while none is adopted. */
  private connectors(): Record<string, ConnectorSettings> {
    const state = this.ctx.vflowTeamSettings.snapshot()
    return state.status === 'ready' ? state.current.settings.connectors : {}
  }

  /** Look up one connector or fail with its id. */
  private connector(connectorId: string): ConnectorSettings {
    const connector = new Map(Object.entries(this.connectors())).get(connectorId)
    if (connector === undefined) {
      throw new Error(`vflow accounts: connector "${connectorId}" is not in the adopted team settings`)
    }
    return connector
  }

  private key(connectorId: string): CredentialKey {
    return credentialKey(ACCOUNT_SCOPE, connectorId)
  }

  /** Read and validate one stored account; a malformed record reads as unconfigured. */
  private async read(connectorId: string): Promise<AccountPayload | undefined> {
    const record = await this.ctx.credentials.readRecord(this.key(connectorId))
    return record?.kind === 'grant' ? readPayload(record.payload) : undefined
  }
}

/** Probe address for one connector; `undefined` when its kind or scheme has no probe. */
function probeUrl(connector: ConnectorSettings): string | undefined {
  const path = PROBE_PATH[connector.kind]
  if (path === undefined || !/^https?:\/\//i.test(connector.url)) return undefined
  return new URL(path, connector.url.endsWith('/') ? connector.url : `${connector.url}/`).href
}

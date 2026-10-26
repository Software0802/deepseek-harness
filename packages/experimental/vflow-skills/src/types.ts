/**
 * JSON-safe values of the `vflow` Remote namespace, shared by the Host
 * controller and the browser settings page.
 *
 * @module
 */

import type {} from '@deepseek-ai/dsh-typert-protocol'

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface RemoteErrorDetailsMap {
    /** The connector id is not in the adopted team settings. */
    'vflow/unknown-connector': { readonly connectorId: string }
    /** A login name or secret was empty. */
    'vflow/invalid-account': { readonly connectorId: string }
    /** The reviewed team settings version is no longer the pending one. */
    'vflow/no-pending-version': { readonly sha256: string }
  }
}

/** External system kinds a connector can address. */
export type ConnectorKind = 'redmine' | 'jira' | 'gerrit' | 'svn' | 'jenkins' | 'feishu' | 'wiki'

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
  /** Whether a connection test can probe this connector. */
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

/** Facts about one team settings version shown before and after adoption. */
export interface TeamSettingsSummary {
  readonly name: string
  /** Lowercase hex SHA-256 of the exact document text. */
  readonly sha256: string
  readonly connectorCount: number
  /** Project display names in document order. */
  readonly projects: readonly string[]
  /** Executor id of the default reviewer. */
  readonly defaultReviewer: string
}

/**
 * Team settings state for the settings page. `source` is the configured
 * address, empty while unset. Error texts include their causes.
 */
export type TeamSettingsView =
  | { readonly status: 'unconfigured'; readonly source: string }
  | { readonly status: 'failed'; readonly source: string; readonly error: string }
  | {
    readonly status: 'ready'
    readonly source: string
    readonly current: TeamSettingsSummary
    /** Newer published version waiting for acceptance. */
    readonly pending?: TeamSettingsSummary
    /** Why the last source check failed while the adopted version stays in use. */
    readonly sourceError?: string
  }

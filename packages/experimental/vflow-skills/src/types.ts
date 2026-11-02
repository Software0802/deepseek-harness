/**
 * JSON-safe values of the `vflow` Remote namespace, shared by the Host
 * controller and the browser settings page.
 *
 * @module
 */

import type {} from '@deepseek-ai/dsh-typert-protocol'
import type { Branded } from '@deepseek-ai/dsh-brand'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { SessionProjectionSummaryExcluded } from '@deepseek-ai/dsh-session-projection/types'

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface RemoteErrorDetailsMap {
    /** The connector id is not in the adopted team settings. */
    'vflow/unknown-connector': { readonly connectorId: string }
    /** A login name or secret was empty. */
    'vflow/invalid-account': { readonly connectorId: string }
    /** The reviewed team settings version is no longer the pending one. */
    'vflow/no-pending-version': { readonly sha256: string }
    /** The lead Session is not loaded in this Host. */
    'vflow/lead-unavailable': { readonly leadSessionId: string }
    /** The fleet task does not exist or no longer waits for this decision. */
    'vflow/no-pending-decision': { readonly taskId: string; readonly decisionId: string }
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

/** Identity of one fleet task within its lead Session. */
export type VflowTaskId = Branded<'VflowTaskId'>

/** Identity of one decision a fleet task asked for. */
export type VflowDecisionId = Branded<'VflowDecisionId'>

/** `ship` changes code in its own Git worktree; `scout` only reads and reports. */
export type FleetTaskKind = 'ship' | 'scout'

/** V-model stages in order: the left arm descends to coding, the right arm climbs through testing. */
export const V_MODEL_NODES = [
  'requirements', 'basic-design', 'detailed-design', 'coding', 'unit-test', 'integration-test', 'system-test',
] as const

/** One V-model stage. */
export type VModelNode = typeof V_MODEL_NODES[number]

/**
 * Lifecycle of a fleet task. `queued` waits for a free slot, `waiting` holds an
 * unanswered decision, and the three terminal states follow the child's last run.
 */
export type FleetTaskStatus = 'queued' | 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled'

/** A question a fleet task put to the user. */
export interface FleetDecision {
  readonly id: VflowDecisionId
  readonly question: string
  /** Two to four answers in the order the task offered them. */
  readonly options: readonly string[]
  /** Epoch milliseconds when the task asked. */
  readonly askedAt: number
}

/** One fleet task as the lead Session's log records it. */
export interface FleetTaskView {
  readonly taskId: VflowTaskId
  readonly ticket: string
  readonly title: string
  readonly kind: FleetTaskKind
  readonly status: FleetTaskStatus
  /** Child Session doing the work; absent while queued or when it could not start. */
  readonly childId?: SessionId | undefined
  /** Branch of the task's worktree; ship tasks only. */
  readonly branch?: string | undefined
  /** Current V-model stage. */
  readonly node: VModelNode
  /** Latest activity line the task reported. */
  readonly activity?: string | undefined
  /** Epoch milliseconds of the latest report, start, or answer. */
  readonly updatedAt: number
  readonly queuedAt: number
  readonly startedAt?: number | undefined
  readonly finishedAt?: number | undefined
  /** Present while `status` is `waiting`. */
  readonly decision?: FleetDecision | undefined
  /** Final summary or failure reason, at most 500 characters. */
  readonly summary?: string | undefined
}

declare module '@deepseek-ai/dsh-session-projection/types' {
  interface SessionProjectionMap {
    /** Fleet tasks of a lead Session in dispatch order. */
    vflowFleet: SessionProjectionSummaryExcluded<FleetTaskView[]>
  }
}

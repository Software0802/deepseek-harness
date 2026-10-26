/**
 * Team settings document: the company-specific values the vflow workflow reads,
 * kept out of the plugin package and distributed as one JSON file.
 *
 * The document never carries secrets. Each user's account for a connector lives in
 * the local credential store under `vflow/<connector id>`, and
 * {@link parseTeamSettings} rejects any object key that looks like a secret field.
 *
 * @module
 */

import { createHash } from 'node:crypto'
import z from '@deepseek-ai/schemastery'
import type Schema from '@deepseek-ai/schemastery'

/** `format` value that identifies a team settings document. */
export const TEAM_SETTINGS_FORMAT = 'vflow-team-settings'
/** Document version this module reads. */
export const TEAM_SETTINGS_VERSION = 1

/** Object keys refused anywhere in a team settings document. */
const SECRET_KEY = /pass(word|wd)?|secret|token|api[-_]?key|private[-_]?key/i

/** External system kinds a connector can address. */
export type ConnectorKind = 'redmine' | 'jira' | 'gerrit' | 'svn' | 'jenkins' | 'feishu' | 'wiki'

/**
 * How the workflow may write to a connector: `paste-only` produces text for a
 * human to paste, `approve-each` writes after one approval per outbox item, and
 * `read-only` never writes.
 */
export type ConnectorWritePolicy = 'paste-only' | 'approve-each' | 'read-only'

/** One external system the workflow reads or writes. */
export interface ConnectorSettings {
  kind: ConnectorKind
  /** Service address on the company network. */
  url: string
  writePolicy: ConnectorWritePolicy
}

/** One customer project the workflow can open tasks for. */
export interface ProjectSettings {
  id: string
  displayName: string
  /** Prefix of the customer's ticket numbers. */
  ticketPrefix: string
  /** Prefix that document file names carry for this project. */
  filePrefix: string
}

/** Executor that runs a flow step or a dispatched task. */
export interface ExecutorSettings {
  by: 'claude' | 'droid' | 'toder' | 'pi' | 'human' | 'script'
  model: string
  effort: 'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'
}

/** Exclusive resource such as a bench car. */
export interface ResourceSettings {
  /** Lock file path on the machine that runs the step. */
  lock: string
}

/** Complete team settings document. */
export interface TeamSettings {
  format: typeof TEAM_SETTINGS_FORMAT
  version: typeof TEAM_SETTINGS_VERSION
  /** Display name of this settings document. */
  name: string
  /** Connectors keyed by a lowercase id (`^[a-z][a-z0-9-]*$`), which also names the user's credential record. */
  connectors: Record<string, ConnectorSettings>
  projects: ProjectSettings[]
  /** Template for person names in documents; `{englishName}` is replaced per person. */
  nameFormat: string
  /** Parameters read by the document lint rules, keyed by parameter name. */
  docRules: Record<string, string | number | boolean>
  resources: Record<string, ResourceSettings>
  executors: Record<string, ExecutorSettings>
  /** Executor key used when a flow node names no reviewer. */
  defaultReviewer: string
}

const identifier = z.string().pattern(/^[a-z][a-z0-9-]*$/)

/** Schemastery schema for {@link TeamSettings}. */
export const TeamSettings: Schema<TeamSettings> = z.object({
  format: z.const(TEAM_SETTINGS_FORMAT).required(),
  version: z.const(TEAM_SETTINGS_VERSION).required(),
  name: z.string().min(1).required(),
  connectors: z.dict(z.object({
    kind: z.union(['redmine', 'jira', 'gerrit', 'svn', 'jenkins', 'feishu', 'wiki'] as const).required(),
    url: z.string().min(1).required(),
    writePolicy: z.union(['paste-only', 'approve-each', 'read-only'] as const).required(),
  }), identifier).required(),
  projects: z.array(z.object({
    id: identifier.required(),
    displayName: z.string().min(1).required(),
    ticketPrefix: z.string().required(),
    filePrefix: z.string().required(),
  })).required(),
  nameFormat: z.string().pattern(/\{englishName\}/).required(),
  docRules: z.dict(z.union([z.string(), z.number(), z.boolean()])).required(),
  resources: z.dict(z.object({ lock: z.string().min(1).required() })).required(),
  executors: z.dict(z.object({
    by: z.union(['claude', 'droid', 'toder', 'pi', 'human', 'script'] as const).required(),
    model: z.string().required(),
    effort: z.union(['none', 'low', 'medium', 'high', 'xhigh', 'max'] as const).required(),
  })).required(),
  defaultReviewer: z.string().min(1).required(),
})

/** Why a team settings document was refused. */
export type TeamSettingsErrorCode = 'invalid-json' | 'secret-field' | 'invalid-settings' | 'unknown-reference'

/** A refused team settings document, with the JSON path of the first problem. */
export class TeamSettingsError extends Error {
  override readonly name = 'TeamSettingsError'

  /**
   * @param code - refusal category.
   * @param path - JSON path of the offending value, `$` for the document root.
   * @param message - localized-neutral description for the settings UI.
   */
  constructor(readonly code: TeamSettingsErrorCode, readonly path: string, message: string) {
    super(`${path}: ${message}`)
  }
}

/** A validated team settings document and the hash of its exact bytes. */
export interface ParsedTeamSettings {
  readonly settings: TeamSettings
  /** Exact document text, kept so the adopted copy hashes the same as the published one. */
  readonly text: string
  /** Lowercase hex SHA-256 of {@link text}; identifies one published version. */
  readonly sha256: string
}

/** Find the first object key that looks like a secret field, depth first. */
function findSecretKey(value: unknown, path: string): string | undefined {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const hit = findSecretKey(item, `${path}[${index}]`)
      if (hit !== undefined) return hit
    }
    return undefined
  }
  if (value === null || typeof value !== 'object') return undefined
  for (const [key, item] of Object.entries(value)) {
    const child = `${path}.${key}`
    if (SECRET_KEY.test(key)) return child
    const hit = findSecretKey(item, child)
    if (hit !== undefined) return hit
  }
  return undefined
}

/**
 * Parse and validate a team settings document.
 * @param text - complete JSON document text.
 * @returns the validated settings, the text, and its SHA-256.
 * @throws TeamSettingsError when the text is not JSON, carries a secret-like key,
 *   fails the schema, or names an executor that the document does not define.
 */
export function parseTeamSettings(text: string): ParsedTeamSettings {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (error) {
    throw new TeamSettingsError('invalid-json', '$', (error as Error).message)
  }
  const secret = findSecretKey(raw, '$')
  if (secret !== undefined) {
    throw new TeamSettingsError('secret-field', secret, 'secrets belong in the credential store, not in team settings')
  }
  let settings: TeamSettings
  try {
    settings = TeamSettings(raw as TeamSettings)
  } catch (error) {
    throw new TeamSettingsError('invalid-settings', '$', (error as Error).message)
  }
  if (!Object.hasOwn(settings.executors, settings.defaultReviewer)) {
    throw new TeamSettingsError('unknown-reference', '$.defaultReviewer', `executor "${settings.defaultReviewer}" is not defined`)
  }
  return { settings, text, sha256: createHash('sha256').update(text).digest('hex') }
}

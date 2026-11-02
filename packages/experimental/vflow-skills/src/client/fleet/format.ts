/** Pure display helpers of the fleet panel: grouping, stage order, durations, and token counts. */

import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { V_MODEL_NODES, type FleetTaskView, type VModelNode } from '../../types.ts'
import type { NS, VflowKey } from '../locales.ts'

type T = TranslateNS<typeof NS>

/** Tasks of one panel section, in dispatch order. */
export interface FleetGroups {
  readonly waiting: readonly FleetTaskView[]
  readonly running: readonly FleetTaskView[]
  readonly queued: readonly FleetTaskView[]
  /** Completed, failed, and cancelled tasks, most recent first. */
  readonly finished: readonly FleetTaskView[]
}

/**
 * Split tasks into the panel's sections.
 * @param tasks - the lead Session's fleet view in dispatch order.
 * @returns tasks per section.
 */
export function groupTasks(tasks: readonly FleetTaskView[]): FleetGroups {
  const finished = tasks.filter(task => task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled')
  return {
    waiting: tasks.filter(task => task.status === 'waiting'),
    running: tasks.filter(task => task.status === 'running'),
    queued: tasks.filter(task => task.status === 'queued'),
    finished: finished.sort((left, right) => (right.finishedAt ?? right.updatedAt) - (left.finishedAt ?? left.updatedAt)),
  }
}

const NODE_KEY: Readonly<Record<VModelNode, VflowKey>> = {
  'requirements': 'fleetNodeRequirements',
  'basic-design': 'fleetNodeBasicDesign',
  'detailed-design': 'fleetNodeDetailedDesign',
  'coding': 'fleetNodeCoding',
  'unit-test': 'fleetNodeUnitTest',
  'integration-test': 'fleetNodeIntegrationTest',
  'system-test': 'fleetNodeSystemTest',
}

/**
 * Name one V-model stage.
 * @param node - the stage.
 * @param t - namespace-bound translate.
 * @returns the stage name in the current language.
 */
export function nodeLabel(node: VModelNode, t: T): string {
  return t(NODE_KEY[node])
}

/**
 * Position of a stage along the V.
 * @param node - the stage.
 * @returns its zero-based index.
 */
export function nodeIndex(node: VModelNode): number {
  return V_MODEL_NODES.indexOf(node)
}

/**
 * Elapsed time as a clock, `m:ss` below an hour and `h:mm:ss` above.
 * @param ms - elapsed milliseconds; negative values count as zero.
 * @returns the clock text.
 */
export function clock(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1_000)
  const seconds = String(total % 60).padStart(2, '0')
  const minutes = Math.floor(total / 60) % 60
  const hours = Math.floor(total / 3_600)
  return hours === 0 ? `${minutes}:${seconds}` : `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
}

/**
 * A coarse duration for waiting times and activity ages.
 * @param ms - elapsed milliseconds.
 * @param t - namespace-bound translate.
 * @returns minutes below two hours, hours above; undefined under a minute.
 */
export function coarse(ms: number, t: T): string | undefined {
  const minutes = Math.floor(Math.max(0, ms) / 60_000)
  if (minutes === 0) return undefined
  return minutes < 120 ? t('fleetMinutes', { value: minutes }) : t('fleetHours', { value: Math.floor(minutes / 60) })
}

/**
 * How long ago something happened.
 * @param ms - elapsed milliseconds.
 * @param t - namespace-bound translate.
 * @returns "just now" under a minute, otherwise a coarse age.
 */
export function ago(ms: number, t: T): string {
  const duration = coarse(ms, t)
  return duration === undefined ? t('fleetJustNow') : t('fleetAgo', { duration })
}

/**
 * A compact token count.
 * @param value - tokens.
 * @param t - namespace-bound translate.
 * @returns the count with a thousand or million suffix.
 */
export function compactTokens(value: number, t: T): string {
  const scaled = (next: number): string => next >= 100 ? String(Math.round(next)) : String(Math.round(next * 10) / 10)
  if (value < 1_000) return String(value)
  if (value < 1_000_000) return t('fleetThousand', { value: scaled(value / 1_000) })
  return t('fleetMillion', { value: scaled(value / 1_000_000) })
}

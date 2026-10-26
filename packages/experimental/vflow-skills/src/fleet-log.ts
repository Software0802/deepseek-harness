/**
 * Lead-Session events that record fleet tasks, and the `vflowFleet` projection that folds them.
 *
 * Every fleet fact lives in the lead Session's log as an ignorable plugin
 * record: dispatch, start, progress reports, decisions and their answers, and
 * the end of each child run. The records are display facts for the fleet panel;
 * none of them reaches a model request, and a Host without this package skips them.
 *
 * @module
 */

import { z } from 'zod'
import { pluginRecordOf, type SessionEvent, type SessionId } from '@deepseek-ai/dsh-session'
import { brandString } from '@deepseek-ai/dsh-brand'
import type { ProjectionDefinition } from '@deepseek-ai/dsh-session-projection'
import {
  V_MODEL_NODES,
  type FleetTaskKind,
  type FleetTaskView,
  type VflowDecisionId,
  type VflowTaskId,
  type VModelNode,
} from './types.ts'

/** Payload version written by this package. */
export const FLEET_EVENT_VERSION = 0

/** Longest accepted ticket, title, activity, question, or option text. */
export const FLEET_TEXT_LIMITS = {
  ticket: 64, title: 200, brief: 20_000, activity: 200, question: 1_000, option: 80, summary: 500,
} as const

/** A task the lead dispatched; it waits in the queue until it starts. */
export interface FleetTaskEvent {
  readonly version: 0
  readonly taskId: VflowTaskId
  readonly ticket: string
  readonly title: string
  readonly kind: FleetTaskKind
  /** The lead's instructions, delivered to the child when the task starts. */
  readonly brief: string
}

/** The task's child Session started or resumed. */
export interface FleetStartedEvent {
  readonly version: 0
  readonly taskId: VflowTaskId
  readonly childId: SessionId
  readonly branch?: string
}

/** The task reported its V-model stage and current activity. */
export interface FleetProgressEvent {
  readonly version: 0
  readonly taskId: VflowTaskId
  readonly node: VModelNode
  readonly activity: string
}

/** The task asked the user to decide. */
export interface FleetDecisionEvent {
  readonly version: 0
  readonly taskId: VflowTaskId
  readonly decisionId: VflowDecisionId
  readonly question: string
  readonly options: readonly string[]
}

/** The user answered a decision with the option at `choice`. */
export interface FleetAnsweredEvent {
  readonly version: 0
  readonly taskId: VflowTaskId
  readonly decisionId: VflowDecisionId
  readonly choice: number
}

/** A child run ended; `outcome` follows its stop reason, or `failed` when the task could not start. */
export interface FleetFinishedEvent {
  readonly version: 0
  readonly taskId: VflowTaskId
  readonly outcome: 'completed' | 'failed' | 'cancelled'
  readonly summary?: string
}

declare module '@deepseek-ai/dsh-session/types' {
  interface PluginRecordMap {
    /** A fleet task was dispatched. */
    'plugin:vflow-skills/fleet-task': FleetTaskEvent
    /** A fleet task's child Session started or resumed. */
    'plugin:vflow-skills/fleet-started': FleetStartedEvent
    /** A fleet task reported progress. */
    'plugin:vflow-skills/fleet-progress': FleetProgressEvent
    /** A fleet task asked the user to decide. */
    'plugin:vflow-skills/fleet-decision': FleetDecisionEvent
    /** The user answered a fleet decision. */
    'plugin:vflow-skills/fleet-answered': FleetAnsweredEvent
    /** A fleet task's child run ended. */
    'plugin:vflow-skills/fleet-finished': FleetFinishedEvent
  }
}

/** Fold state: the tasks in dispatch order and the briefs of tasks that have not started. */
export interface FleetState {
  readonly tasks: FleetTaskView[]
  /** Host-only: brief by task id until the task's first start. */
  readonly briefs: Record<string, string>
}

const text = (limit: number) => z.string().min(1).max(limit)
const taskIdSchema = z.string().min(1).transform(value => brandString<VflowTaskId>(value))
const decisionIdSchema = z.string().min(1).transform(value => brandString<VflowDecisionId>(value))
const sessionIdSchema = z.string().min(1).transform(id => brandString<SessionId>(id))
const nodeSchema = z.enum(V_MODEL_NODES)
const kindSchema = z.enum(['ship', 'scout'])
const optionsSchema = z.array(text(FLEET_TEXT_LIMITS.option)).min(2).max(4)

const taskEvent = z.object({
  version: z.literal(0), taskId: taskIdSchema, ticket: text(FLEET_TEXT_LIMITS.ticket),
  title: text(FLEET_TEXT_LIMITS.title), kind: kindSchema, brief: text(FLEET_TEXT_LIMITS.brief),
}).strict()
const startedEvent = z.object({
  version: z.literal(0), taskId: taskIdSchema, childId: sessionIdSchema, branch: z.string().min(1).optional(),
}).strict()
const progressEvent = z.object({
  version: z.literal(0), taskId: taskIdSchema, node: nodeSchema, activity: text(FLEET_TEXT_LIMITS.activity),
}).strict()
const decisionEvent = z.object({
  version: z.literal(0), taskId: taskIdSchema, decisionId: decisionIdSchema,
  question: text(FLEET_TEXT_LIMITS.question), options: optionsSchema,
}).strict()
const answeredEvent = z.object({
  version: z.literal(0), taskId: taskIdSchema, decisionId: decisionIdSchema, choice: z.number().int().min(0).max(3),
}).strict()
const finishedEvent = z.object({
  version: z.literal(0), taskId: taskIdSchema, outcome: z.enum(['completed', 'failed', 'cancelled']),
  summary: z.string().max(FLEET_TEXT_LIMITS.summary).optional(),
}).strict()

const taskViewSchema = z.object({
  taskId: taskIdSchema,
  ticket: z.string(),
  title: z.string(),
  kind: kindSchema,
  status: z.enum(['queued', 'running', 'waiting', 'completed', 'failed', 'cancelled']),
  childId: sessionIdSchema.optional(),
  branch: z.string().optional(),
  node: nodeSchema,
  activity: z.string().optional(),
  updatedAt: z.number(),
  queuedAt: z.number(),
  startedAt: z.number().optional(),
  finishedAt: z.number().optional(),
  decision: z.object({
    id: decisionIdSchema, question: z.string(), options: z.array(z.string()), askedAt: z.number(),
  }).strict().optional(),
  summary: z.string().optional(),
}).strict() satisfies z.ZodType<FleetTaskView>
const viewSchema = z.array(taskViewSchema)
const stateSchema: z.ZodType<FleetState> = z.object({ tasks: z.array(taskViewSchema), briefs: z.record(z.string(), z.string()) }).strict()


function update(state: FleetState, taskId: VflowTaskId, change: (task: FleetTaskView) => FleetTaskView): FleetState {
  const index = state.tasks.findIndex(task => task.taskId === taskId)
  const task = state.tasks[index]
  if (task === undefined) return state
  const next = change(task)
  if (next === task) return state
  const tasks = state.tasks.slice()
  tasks[index] = next
  return { ...state, tasks }
}

function without<T extends object, K extends keyof T>(value: T, key: K): Omit<T, K> {
  const { [key]: _omitted, ...rest } = value
  return rest
}

/**
 * Fold one fleet event. Events for unknown tasks, and malformed payloads, leave the state unchanged:
 * the panel shows only facts this package wrote.
 * @param state - tasks covering all prior events.
 * @param event - next committed lead-Session event.
 * @returns the next state; the same reference when the event is not a valid fleet fact.
 */
export function applyFleetEvent(state: FleetState, event: SessionEvent): FleetState {
  const record = pluginRecordOf(event)
  if (record === undefined) return state
  const at = record.time
  switch (record.type) {
    case 'plugin:vflow-skills/fleet-task': {
      const parsed = taskEvent.safeParse(record.data)
      if (!parsed.success || state.tasks.some(task => task.taskId === parsed.data.taskId)) return state
      const { taskId, ticket, title, kind, brief } = parsed.data
      return {
        tasks: [...state.tasks, { taskId, ticket, title, kind, status: 'queued', node: 'requirements', updatedAt: at, queuedAt: at }],
        briefs: { ...state.briefs, [taskId]: brief },
      }
    }
    case 'plugin:vflow-skills/fleet-started': {
      const parsed = startedEvent.safeParse(record.data)
      if (!parsed.success) return state
      const { childId, branch, taskId } = parsed.data
      const started = update(state, taskId, task => ({
        ...without(without(task, 'finishedAt'), 'summary'),
        status: task.decision === undefined ? 'running' : 'waiting',
        childId, ...branch === undefined ? {} : { branch },
        startedAt: task.startedAt ?? at, updatedAt: at,
      }))
      return started === state || !Object.hasOwn(started.briefs, taskId) ? started : { ...started, briefs: without(started.briefs, taskId) }
    }
    case 'plugin:vflow-skills/fleet-progress': {
      const parsed = progressEvent.safeParse(record.data)
      if (!parsed.success) return state
      return update(state, parsed.data.taskId, task => ({ ...task, node: parsed.data.node, activity: parsed.data.activity, updatedAt: at }))
    }
    case 'plugin:vflow-skills/fleet-decision': {
      const parsed = decisionEvent.safeParse(record.data)
      if (!parsed.success) return state
      const { decisionId, question, options } = parsed.data
      return update(state, parsed.data.taskId, task => ({
        ...task, status: 'waiting', decision: { id: decisionId, question, options, askedAt: at }, updatedAt: at,
      }))
    }
    case 'plugin:vflow-skills/fleet-answered': {
      const parsed = answeredEvent.safeParse(record.data)
      if (!parsed.success) return state
      return update(state, parsed.data.taskId, task => task.decision?.id !== parsed.data.decisionId
        ? task
        : { ...without(task, 'decision'), status: 'running', updatedAt: at })
    }
    case 'plugin:vflow-skills/fleet-finished': {
      const parsed = finishedEvent.safeParse(record.data)
      if (!parsed.success) return state
      const { outcome, summary } = parsed.data
      return update(state, parsed.data.taskId, task => task.status === 'waiting'
        ? task
        : { ...task, status: outcome, finishedAt: at, updatedAt: at, ...summary === undefined ? {} : { summary } })
    }
    default:
      return state
  }
}

/** Lead-Session fleet projection; the view is excluded from Session summaries. */
export const fleetProjectionDefinition = {
  key: 'vflowFleet',
  stateSchema,
  stateVersion: 0,
  init: (): FleetState => ({ tasks: [], briefs: {} }),
  apply: applyFleetEvent,
  wire: {
    viewSchema,
    view: state => state.tasks,
    summary: false,
  },
} satisfies ProjectionDefinition<'vflowFleet', FleetState>

/** Validators for model and Remote input, shared with the service. */
export const fleetSchemas = { taskEvent, progressEvent, decisionEvent, nodeSchema, kindSchema, optionsSchema }

import { expect, it } from 'vitest'
import { appendPluginRecord, Session, SessionId, SessionSeq, type SessionEvent } from '@deepseek-ai/dsh-session'
import { brandString } from '@deepseek-ai/dsh-brand'
import { applyFleetEvent, fleetProjectionDefinition, type FleetState } from '../src/fleet-log.ts'
import type { VflowDecisionId, VflowTaskId } from '../src/types.ts'

const taskId = brandString<VflowTaskId>('task-1')
const otherId = brandString<VflowTaskId>('task-2')
const decisionId = brandString<VflowDecisionId>('decision-1')
const childId = SessionId('child-1')
const task = { version: 0, taskId, ticket: 'ALPHA-1201', title: 'Export orders', kind: 'ship', brief: 'Add the CSV export.' } as const

type Writer = (session: Session) => void

function events(...writers: Writer[]): readonly SessionEvent[] {
  const session = Session.create(SessionId('lead'))
  for (const write of writers) write(session)
  return session.snapshotEvents()
}

function init(): FleetState {
  return fleetProjectionDefinition.init()
}

const fold = (list: readonly SessionEvent[], state = init()) => list.reduce(applyFleetEvent, state)
const dispatched: Writer = (session) => { appendPluginRecord(session, 'plugin:vflow-skills/fleet-task', task) }
const started: Writer = (session) => { appendPluginRecord(session, 'plugin:vflow-skills/fleet-started', { version: 0, taskId, childId, branch: 'vflow/ALPHA-1201' }) }
const asked: Writer = (session) => {
  appendPluginRecord(session, 'plugin:vflow-skills/fleet-decision', { version: 0, taskId, decisionId, question: 'Keep the old column order?', options: ['Keep', 'Reorder'] })
}

it('queues a dispatched task and keeps its brief until the task starts', () => {
  const list = events(dispatched)
  const state = fold(list)
  expect(state.tasks).toEqual([{
    taskId, ticket: 'ALPHA-1201', title: 'Export orders', kind: 'ship', status: 'queued', node: 'requirements',
    updatedAt: list[0]!.time, queuedAt: list[0]!.time,
  }])
  expect(state.briefs).toEqual({ [taskId]: 'Add the CSV export.' })

  const running = fold(events(dispatched, started))
  expect(running.tasks[0]).toMatchObject({ status: 'running', childId, branch: 'vflow/ALPHA-1201' })
  expect(running.tasks[0]!.startedAt).toBeTypeOf('number')
  expect(running.briefs).toEqual({})
})

it('records progress, a pending decision, and its answer', () => {
  const progressed = fold(events(dispatched, started, (session) => {
    appendPluginRecord(session, 'plugin:vflow-skills/fleet-progress', { version: 0, taskId, node: 'coding', activity: 'Writing the exporter' })
  }))
  expect(progressed.tasks[0]).toMatchObject({ node: 'coding', activity: 'Writing the exporter' })

  const waiting = fold(events(dispatched, started, asked))
  expect(waiting.tasks[0]).toMatchObject({ status: 'waiting', decision: { id: decisionId, question: 'Keep the old column order?', options: ['Keep', 'Reorder'] } })

  const stale = fold(events((session) => {
    appendPluginRecord(session, 'plugin:vflow-skills/fleet-answered', { version: 0, taskId, decisionId: brandString<VflowDecisionId>('other'), choice: 0 })
  }), waiting)
  expect(stale).toBe(waiting)

  const answered = fold(events((session) => {
    appendPluginRecord(session, 'plugin:vflow-skills/fleet-answered', { version: 0, taskId, decisionId, choice: 1 })
  }), waiting)
  expect(answered.tasks[0]?.status).toBe('running')
  expect(answered.tasks[0]).not.toHaveProperty('decision')
})

it('keeps a waiting task through a resumed start and the end of the asking turn', () => {
  const waiting = fold(events(dispatched, started, asked))
  const resumed = fold(events(started), waiting)
  expect(resumed.tasks[0]?.status).toBe('waiting')
  expect(resumed.briefs).toBe(waiting.briefs)
  const ended = fold(events((session) => { appendPluginRecord(session, 'plugin:vflow-skills/fleet-finished', { version: 0, taskId, outcome: 'completed' }) }), resumed)
  expect(ended).toBe(resumed)
})

it('finishes a task with its outcome and clears a previous summary when it resumes', () => {
  const done = fold(events(dispatched, started, (session) => {
    appendPluginRecord(session, 'plugin:vflow-skills/fleet-finished', { version: 0, taskId, outcome: 'completed', summary: 'Export added.' })
  }))
  expect(done.tasks[0]).toMatchObject({ status: 'completed', summary: 'Export added.' })
  expect(done.tasks[0]!.finishedAt).toBeTypeOf('number')

  const failed = fold(events(dispatched, (session) => { appendPluginRecord(session, 'plugin:vflow-skills/fleet-finished', { version: 0, taskId, outcome: 'failed' }) }))
  expect(failed.tasks[0]).toMatchObject({ status: 'failed' })
  expect(failed.tasks[0]).not.toHaveProperty('summary')

  const again = fold(events((session) => { appendPluginRecord(session, 'plugin:vflow-skills/fleet-started', { version: 0, taskId, childId }) }), done)
  expect(again.tasks[0]).toMatchObject({ status: 'running', branch: 'vflow/ALPHA-1201', startedAt: done.tasks[0]!.startedAt })
  expect(again.tasks[0]).not.toHaveProperty('summary')
  expect(again.tasks[0]).not.toHaveProperty('finishedAt')
})

it('ignores malformed records, records of unknown tasks, duplicates, and other events', () => {
  const base = fold(events(dispatched))
  const ignored = events(
    dispatched,
    (session) => { appendPluginRecord(session, 'plugin:vflow-skills/fleet-task', { ...task, taskId: otherId, ticket: '' }) },
    (session) => { appendPluginRecord(session, 'plugin:vflow-skills/fleet-started', { version: 0, taskId, childId: SessionId('') }) },
    (session) => { appendPluginRecord(session, 'plugin:vflow-skills/fleet-started', { version: 0, taskId: otherId, childId }) },
    (session) => { appendPluginRecord(session, 'plugin:vflow-skills/fleet-progress', { version: 0, taskId, node: 'coding', activity: '' }) },
    (session) => { appendPluginRecord(session, 'plugin:vflow-skills/fleet-decision', { version: 0, taskId, decisionId, question: 'Which?', options: ['Only one'] }) },
    (session) => { appendPluginRecord(session, 'plugin:vflow-skills/fleet-answered', { version: 0, taskId, decisionId, choice: 7 }) },
    (session) => { appendPluginRecord(session, 'plugin:vflow-skills/fleet-finished', { version: 0, taskId, outcome: 'completed', summary: 'x'.repeat(501) }) },
  ).slice(1)
  const turn: SessionEvent<'turn/start'> = { type: 'turn/start', seq: SessionSeq(99), time: 0, data: { turn: 1 } }
  expect(fold([...ignored, turn], base)).toBe(base)
  const duplicate = events((session) => { appendPluginRecord(session, 'plugin:vflow-skills/fleet-task', task) })
  expect(fold(duplicate, base)).toBe(base)
  const foreign = Session.create(SessionId('foreign'))
  const foreignType: string = 'plugin:other/record'
  // A record another package wrote under its own name; this package's types do not declare it.
  appendPluginRecord(foreign, foreignType as 'plugin:vflow-skills/fleet-task', task)
  expect(fold(foreign.snapshotEvents(), base)).toBe(base)
})

it('projects the task list as the wire view', () => {
  const state = fold(events(dispatched))
  expect(fleetProjectionDefinition.wire.view(state)).toBe(state.tasks)
  expect(fleetProjectionDefinition.wire.viewSchema.parse(state.tasks)).toEqual(state.tasks)
  expect(fleetProjectionDefinition.stateSchema.parse(state)).toEqual(state)
})

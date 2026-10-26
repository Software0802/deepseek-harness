// @vitest-environment jsdom
/** The fleet panel groups the lead's tasks, follows their child Sessions, and routes answers and opens. */
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import { bindSnapshotSelector, makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { brandString } from '@deepseek-ai/dsh-brand'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { FleetTaskView, VflowDecisionId, VflowTaskId } from '../src/types.ts'
import { FleetPanel, type FleetHostState, type FleetPanelProps } from '../src/client/fleet/FleetPanel.tsx'
import { clock, coarse, compactTokens, groupTasks } from '../src/client/fleet/format.ts'
import { en } from '../src/client/locales.ts'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const t = makeTranslate(en)
const NOW = 1_800_000_000_000
const child = (name: string): SessionId => brandString<SessionId>(name)

function task(overrides: Partial<FleetTaskView> & Pick<FleetTaskView, 'ticket' | 'status'>): FleetTaskView {
  return {
    taskId: brandString<VflowTaskId>(overrides.ticket),
    title: `${overrides.ticket} title`,
    kind: 'ship',
    node: 'requirements',
    updatedAt: NOW,
    queuedAt: NOW,
    ...overrides,
  }
}

const waiting = task({
  ticket: 'ALPHA-1', status: 'waiting', childId: child('c1'), branch: 'vflow/ALPHA-1-aaaa', node: 'unit-test', startedAt: NOW - 5_000,
  decision: { id: brandString<VflowDecisionId>('d1'), question: 'Allow the header change?', options: ['Allow', 'Redo'], askedAt: NOW },
})
const longWait = task({
  ticket: 'ALPHA-2', status: 'waiting', childId: child('c2'), node: 'coding',
  decision: { id: brandString<VflowDecisionId>('d2'), question: 'Which build?', options: ['Debug', 'Release'], askedAt: NOW - 3 * 60_000 },
})
const running = task({ ticket: 'ALPHA-3', status: 'running', childId: child('c3'), node: 'detailed-design', activity: 'Reading the design', updatedAt: NOW - 2 * 60_000 })
const scout = task({ ticket: 'ALPHA-4', status: 'running', kind: 'scout', childId: child('c4'), startedAt: NOW - 61_000, updatedAt: NOW - 3 * 3_600_000 })
const starting = task({ ticket: 'ALPHA-5', status: 'running', kind: 'scout' })
const queued = task({ ticket: 'ALPHA-6', status: 'queued' })
const completed = task({ ticket: 'ALPHA-7', status: 'completed', childId: child('c7'), finishedAt: NOW - 1_000, summary: 'All tests pass' })
const failed = task({ ticket: 'ALPHA-8', status: 'failed', childId: child('c8'), updatedAt: NOW - 500, summary: 'Model unavailable' })
const failedQuietly = task({ ticket: 'ALPHA-9', status: 'failed', updatedAt: NOW - 9_000 })
const cancelled = task({ ticket: 'ALPHA-10', status: 'cancelled', updatedAt: NOW - 8_000 })

const usage = (tokens: number) => ({ uncachedInputTokens: tokens, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 })

function panel(tasks: readonly FleetTaskView[] | undefined, options: { capacity?: number; visible?: boolean } = {}) {
  const host = createSnapshotStore<FleetHostState>({ capacity: options.capacity })
  const sessions = {
    byId: {
      c1: { projectionValues: { tokenUsage: usage(83_400), subagentTiming: { settledMs: 4_000, active: { since: NOW - 1_000 } } } },
      c3: { projectionValues: { tokenUsage: usage(1_250_000), subagentTiming: { settledMs: 20_000 } } },
      c4: { projectionValues: { tokenUsage: usage(512) } },
      c7: { projectionValues: {} },
    },
  }
  const tab = { visible: options.visible ?? true, title: en.fleetTitle }
  const answer = vi.fn(async (_taskId: string, _decisionId: string, _choice: number): Promise<string | undefined> => undefined)
  const openChild = vi.fn((_childId: SessionId) => {})
  const props: FleetPanelProps = {
    useProjection: (key: string) => { expect(key).toBe('vflowFleet'); return tasks },
    useSessions: (select: (state: typeof sessions) => unknown) => select(sessions),
    useTabInfo: () => ({ tab }),
    useFleet: bindSnapshotSelector(host),
    answer,
    openChild,
    t,
  } as never
  return { host, answer, openChild, view: render(<FleetPanel {...props} />) }
}

it('groups tasks and orders finished ones newest first', () => {
  const groups = groupTasks([queued, completed, running, failed, waiting, cancelled])
  expect(groups.waiting).toEqual([waiting])
  expect(groups.running).toEqual([running])
  expect(groups.queued).toEqual([queued])
  expect(groups.finished).toEqual([failed, completed, cancelled])
})

it('formats clocks, coarse durations, and token counts', () => {
  expect(clock(-5)).toBe('0:00')
  expect(clock(65_000)).toBe('1:05')
  expect(clock(3_725_000)).toBe('1:02:05')
  expect(coarse(30_000, t)).toBeUndefined()
  expect(coarse(5 * 60_000, t)).toBe('5 min')
  expect(coarse(3 * 3_600_000, t)).toBe('3 h')
  expect(compactTokens(999, t)).toBe('999')
  expect(compactTokens(18_840, t)).toBe('18.8k')
  expect(compactTokens(279_400, t)).toBe('279k')
  expect(compactTokens(1_250_000, t)).toBe('1.3M')
  expect(compactTokens(125_000_000, t)).toBe('125M')
})

it('shows the empty state before anything is dispatched', () => {
  const { view } = panel(undefined)
  expect(screen.getByText(en.fleetEmptyTitle)).toBeTruthy()
  expect(screen.getByText('0 tasks in this conversation')).toBeTruthy()
  expect(view.container.querySelectorAll('[data-on]')).toHaveLength(0)
  expect(screen.queryByText(/tokens in total/)).toBeNull()
})

it('draws every section, the stats, and the slot footer', () => {
  vi.useFakeTimers({ now: NOW, toFake: ['Date'] })
  const all = [waiting, longWait, running, scout, starting, queued, completed, failed, failedQuietly, cancelled]
  const { view } = panel(all, { capacity: 3 })
  expect(screen.getByText('10 tasks in this conversation')).toBeTruthy()
  for (const title of [en.fleetSectionWaiting, en.fleetSectionFinished]) expect(screen.getByText(title)).toBeTruthy()
  for (const title of [en.fleetSectionRunning, en.fleetSectionQueued]) expect(screen.getAllByText(title)).toHaveLength(2)

  expect(screen.getByText(en.fleetWaitingNow)).toBeTruthy()
  expect(screen.getByText('Waiting 3 min')).toBeTruthy()
  expect(screen.getByText('vflow/ALPHA-1-aaaa')).toBeTruthy()
  expect(screen.getByText('0:05 · 83.4k tokens')).toBeTruthy()
  expect(screen.getByText('Allow the header change?')).toBeTruthy()

  expect(screen.getByText('Running 0:20')).toBeTruthy()
  expect(screen.getByText('Reading the design')).toBeTruthy()
  expect(screen.getByText('2 min ago')).toBeTruthy()
  expect(screen.getByText('Running 1:01')).toBeTruthy()
  expect(screen.getByText('1:01 · 512 tokens')).toBeTruthy()
  expect(screen.getByText('3 h ago')).toBeTruthy()
  expect(screen.getAllByText(en.fleetStarting)).toHaveLength(2)

  expect(screen.getByText(en.fleetQueuedHint)).toBeTruthy()
  expect(screen.getByText('Model unavailable')).toBeTruthy()
  expect(screen.queryByText('All tests pass')).toBeNull()
  expect(screen.getAllByText(en.fleetOutcomeFailed)).toHaveLength(2)
  expect(screen.getByText(en.fleetOutcomeCancelled)).toBeTruthy()
  expect(screen.getByText(en.fleetOutcomeCompleted)).toBeTruthy()

  expect(view.container.querySelectorAll('[data-on="true"]')).toHaveLength(3)
  expect(screen.getByText('3/3')).toBeTruthy()
  expect(screen.getByText('1.3M tokens in total')).toBeTruthy()
})

it('answers decisions and reports undelivered answers', async () => {
  const { answer } = panel([waiting])
  answer.mockResolvedValueOnce('task already finished')
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Redo' })) })
  expect(answer).toHaveBeenCalledWith('ALPHA-1', 'd1', 1)
  expect(screen.getByRole('alert').textContent).toBe('The answer was not delivered. task already finished')
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Allow' })) })
  expect(answer).toHaveBeenLastCalledWith('ALPHA-1', 'd1', 0)
  expect(screen.queryByRole('alert')).toBeNull()
})

it('opens child chats from cards and finished rows', () => {
  const { openChild } = panel([running, starting, completed, cancelled])
  const [runningCard, startingCard] = screen.getAllByTitle(en.fleetWatch)
  fireEvent.click(runningCard!)
  fireEvent.keyDown(runningCard!, { key: 'Enter' })
  fireEvent.keyDown(runningCard!, { key: ' ' })
  fireEvent.keyDown(runningCard!, { key: 'Tab' })
  fireEvent.click(startingCard!)
  fireEvent.click(screen.getByTitle('All tests pass'))
  fireEvent.click(screen.getByTitle(en.fleetOutcomeCancelled))
  expect(openChild.mock.calls).toEqual([[child('c3')], [child('c3')], [child('c3')], [child('c7')]])
})

it('keeps decision clicks inside the card', () => {
  const { openChild } = panel([waiting])
  const actions = screen.getByRole('button', { name: 'Allow' }).parentElement!
  fireEvent.click(actions)
  fireEvent.keyDown(actions, { key: 'Enter' })
  expect(openChild).not.toHaveBeenCalled()
})

it('ticks the clock only while the tab is visible', () => {
  vi.useFakeTimers({ now: NOW })
  panel([running])
  expect(screen.getByText('Running 0:20')).toBeTruthy()
  act(() => { vi.advanceTimersByTime(60_000) })
  expect(screen.getByText('3 min ago')).toBeTruthy()
  cleanup()

  panel([running], { visible: false })
  act(() => { vi.advanceTimersByTime(60_000) })
  expect(screen.getByText('3 min ago')).toBeTruthy()
})

it('draws a waiting card without answers when its decision is missing', () => {
  const { view } = panel([task({ ticket: 'ALPHA-11', status: 'waiting' })])
  expect(screen.getByText('ALPHA-11 title')).toBeTruthy()
  expect(view.container.querySelector('button')).toBeNull()
})

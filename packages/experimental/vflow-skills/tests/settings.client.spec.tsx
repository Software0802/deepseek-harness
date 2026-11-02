// @vitest-environment jsdom
/** The settings page draws the page store and routes every control to its command. */
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import { bindSnapshotSelector, makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import type { AccountView, TeamSettingsView } from '../src/types.ts'
import type { VflowPageState } from '../src/client/mount.ts'
import { VflowSettings, type VflowSettingsProps } from '../src/client/VflowSettings.tsx'
import { de, en, es, fr, ja, pt, ru, zh } from '../src/client/locales.ts'

afterEach(cleanup)

const current = { name: 'Example team', sha256: 'a'.repeat(64), connectorCount: 2, projects: ['Alpha', 'Beta'], defaultReviewer: 'review' }
const tracker: AccountView = { connectorId: 'tracker', kind: 'redmine', url: 'https://tracker.example.test', configured: true, username: 'alice', testable: true }
const wiki: AccountView = { connectorId: 'notes', kind: 'wiki', url: 'https://wiki.example.test', configured: false, testable: false }

function page(initial: Partial<VflowPageState>, view: 'page' | 'summary' = 'page') {
  const store = createSnapshotStore<VflowPageState>({
    teamSettings: undefined, accounts: [], tests: {}, checking: false, writable: true, error: undefined, ...initial,
  })
  const actions = {
    refresh: vi.fn(async () => {}),
    saveSource: vi.fn(async (_source: string) => true),
    accept: vi.fn(async (_sha256: string) => {}),
    saveAccount: vi.fn(async () => true),
    removeAccount: vi.fn(async () => {}),
    testAccount: vi.fn(async () => {}),
    testAll: vi.fn(async () => {}),
  }
  const props = { view, ...actions, useVflow: bindSnapshotSelector(store), t: makeTranslate(en) } as VflowSettingsProps
  return { store, actions, view: render(<VflowSettings {...props} />) }
}

function text(template: string, params: Record<string, string | number>): string {
  return makeTranslate({ template })('template', params)
}

it('keeps every dictionary complete', () => {
  for (const dictionary of [zh, ja, de, es, fr, pt, ru]) expect(Object.keys(dictionary)).toEqual(Object.keys(en))
})

it('renders only the summary line in summary view', () => {
  const { view } = page({}, 'summary')
  expect(view.container.textContent).toBe(en.summary)
})

it('shows loading, unconfigured, failed, and read-only team settings', () => {
  const { store, view } = page({ writable: false })
  expect(view.getByText(en.statusLoading)).toBeTruthy()
  expect(view.getByText(en.readOnly)).toBeTruthy()
  expect(view.getByRole('button', { name: en.checkNow })).toHaveProperty('disabled', true)

  act(() => { store.set({ ...store.getSnapshot(), teamSettings: { status: 'unconfigured', source: '' }, writable: true }) })
  expect(view.getByText(en.statusUnconfigured)).toBeTruthy()
  expect(view.getByText(en.unconfiguredBody)).toBeTruthy()
  expect(view.getByText(en.accountsEmpty)).toBeTruthy()

  act(() => { store.set({ ...store.getSnapshot(), teamSettings: { status: 'failed', source: '/srv/team.json', error: 'boom' }, error: 'bad call' }) })
  expect(view.getByText(en.statusFailed)).toBeTruthy()
  expect(view.getByText(text(en.failed, { error: 'boom' }))).toBeTruthy()
  expect(view.getByText(text(en.operationFailed, { error: 'bad call' }))).toBeTruthy()
})

it('summarizes the adopted version and accepts a pending update', () => {
  const pending: TeamSettingsView = {
    status: 'ready', source: 'https://settings.example.test/team.json', current,
    pending: { ...current, name: 'Example team v2', sha256: 'b'.repeat(64) }, sourceError: 'timeout',
  }
  const { actions, store, view } = page({ teamSettings: pending, checking: true })
  expect(view.getByText('Example team')).toBeTruthy()
  expect(view.getByText(text(en.version, { sha: 'aaaaaaaa' }))).toBeTruthy()
  expect(view.getByText(text(en.projects, { count: 2 }))).toBeTruthy()
  expect(view.getByText(en.statusPending)).toBeTruthy()
  expect(view.getByRole('button', { name: en.checking })).toHaveProperty('disabled', true)
  expect(view.getByText(text(en.sourceError, { error: 'timeout' }))).toBeTruthy()
  fireEvent.click(view.getByRole('button', { name: en.accept }))
  expect(actions.accept).toHaveBeenCalledWith('b'.repeat(64))

  act(() => { store.set({ ...store.getSnapshot(), teamSettings: { status: 'ready', source: pending.source, current }, checking: false }) })
  expect(view.getByText(en.statusReady)).toBeTruthy()
  fireEvent.click(view.getByRole('button', { name: en.checkNow }))
  expect(actions.refresh).toHaveBeenCalledOnce()
})

it('saves an edited source address and keeps a refused one', async () => {
  const { actions, view } = page({ teamSettings: { status: 'unconfigured', source: '' } })
  const input = view.getByLabelText(en.source)
  expect(view.getByRole('button', { name: en.saveSource })).toHaveProperty('disabled', true)
  fireEvent.change(input, { target: { value: 'https://settings.example.test/team.json' } })
  fireEvent.click(view.getByRole('button', { name: en.saveSource }))
  await vi.waitFor(() => { expect(view.getByRole('button', { name: en.saveSource })).toHaveProperty('disabled', true) })
  expect(actions.saveSource).toHaveBeenCalledWith('https://settings.example.test/team.json')

  actions.saveSource.mockResolvedValueOnce(false)
  fireEvent.change(input, { target: { value: 'relative.json' } })
  fireEvent.click(view.getByRole('button', { name: en.saveSource }))
  await vi.waitFor(() => { expect(actions.saveSource).toHaveBeenCalledWith('relative.json') })
  await vi.waitFor(() => { expect(view.getByRole('button', { name: en.saveSource })).toHaveProperty('disabled', false) })
  expect(input).toHaveProperty('value', 'relative.json')
})

it('edits, tests, and removes connector accounts', async () => {
  const { actions, store, view } = page({ teamSettings: { status: 'ready', source: '/srv/team.json', current }, accounts: [tracker, wiki] })
  const row = within(view.container.querySelector('[data-vflow-account="tracker"]') as HTMLElement)
  const other = within(view.container.querySelector('[data-vflow-account="notes"]') as HTMLElement)
  expect(row.getByText(text(en.configured, { username: 'alice' }))).toBeTruthy()
  expect(other.getByText(en.notConfigured)).toBeTruthy()
  expect(other.queryByRole('button', { name: en.test })).toBeNull()

  fireEvent.click(row.getByRole('button', { name: en.test }))
  expect(actions.testAccount).toHaveBeenCalledWith('tracker')
  fireEvent.click(row.getByRole('button', { name: en.remove }))
  expect(actions.removeAccount).toHaveBeenCalledWith('tracker')

  const results = [
    [{ ok: true, status: 200 }, text(en.testOk, { status: 200 })],
    [{ ok: false, reason: 'unauthorized', status: 401 }, text(en.testUnauthorized, { status: 401 })],
    [{ ok: false, reason: 'unexpected-status', status: 302 }, text(en.testUnexpected, { status: 302 })],
    [{ ok: false, reason: 'unreachable' }, en.testUnreachable],
    [{ ok: false, reason: 'unsupported' }, en.testUnsupported],
    [{ ok: false, reason: 'not-configured' }, en.testNotConfigured],
  ] as const
  for (const [result, label] of results) {
    act(() => { store.set({ ...store.getSnapshot(), tests: { tracker: { status: 'done', result } } }) })
    expect(row.getByText(label)).toBeTruthy()
  }
  act(() => { store.set({ ...store.getSnapshot(), tests: { tracker: { status: 'running' } } }) })
  expect(row.getAllByText(en.testing)).toHaveLength(2)

  fireEvent.click(other.getByRole('button', { name: en.register }))
  fireEvent.change(other.getByLabelText(en.username), { target: { value: ' bob ' } })
  expect(other.getByRole('button', { name: en.save })).toHaveProperty('disabled', true)
  fireEvent.change(other.getByLabelText(en.secret), { target: { value: 'token' } })
  fireEvent.click(other.getByRole('button', { name: en.save }))
  await vi.waitFor(() => { expect(other.queryByLabelText(en.secret)).toBeNull() })
  expect(actions.saveAccount).toHaveBeenCalledWith('notes', { username: 'bob', secret: 'token' })

  actions.saveAccount.mockResolvedValueOnce(false)
  fireEvent.click(row.getByRole('button', { name: en.edit }))
  expect(row.getByLabelText(en.username)).toHaveProperty('value', 'alice')
  fireEvent.change(row.getByLabelText(en.secret), { target: { value: 'wrong' } })
  fireEvent.click(row.getByRole('button', { name: en.save }))
  await vi.waitFor(() => { expect(row.getByRole('button', { name: en.save })).toHaveProperty('disabled', false) })
  expect(row.getByLabelText(en.secret)).toHaveProperty('value', 'wrong')
  fireEvent.click(row.getByRole('button', { name: en.cancel }))
  expect(row.queryByLabelText(en.secret)).toBeNull()
})

it('walks the setup guide from team settings to done', async () => {
  const { actions, store, view } = page({ teamSettings: { status: 'unconfigured', source: '' }, accounts: [tracker] })
  fireEvent.click(view.getByRole('button', { name: en.wizard }))
  const dialog = within(screen.getByRole('dialog'))
  expect(dialog.getByText(text(en.stepLabel, { index: 1, total: 4 }))).toBeTruthy()
  expect(dialog.getByRole('button', { name: en.next })).toHaveProperty('disabled', true)

  act(() => { store.set({ ...store.getSnapshot(), teamSettings: { status: 'ready', source: '/srv/team.json', current } }) })
  fireEvent.click(dialog.getByRole('button', { name: en.next }))
  expect(dialog.getByText(en.accountsTitle)).toBeTruthy()
  fireEvent.click(dialog.getByRole('button', { name: en.back }))
  expect(dialog.getByRole('heading', { name: en.teamTitle })).toBeTruthy()
  fireEvent.click(dialog.getByRole('button', { name: en.next }))
  fireEvent.click(dialog.getByRole('button', { name: en.next }))

  expect(dialog.getAllByText(en.checkPassed)).toHaveLength(2)
  expect(dialog.getByText(en.checkMissing)).toBeTruthy()
  fireEvent.click(dialog.getByRole('button', { name: en.runChecks }))
  await vi.waitFor(() => { expect(actions.testAll).toHaveBeenCalledOnce() })
  expect(actions.refresh).toHaveBeenCalledOnce()
  act(() => { store.set({ ...store.getSnapshot(), tests: { tracker: { status: 'done', result: { ok: true, status: 200 } } } }) })
  expect(dialog.getAllByText(en.checkPassed)).toHaveLength(3)

  fireEvent.click(dialog.getByRole('button', { name: en.next }))
  expect(dialog.getByText(en.doneTitle)).toBeTruthy()
  fireEvent.click(dialog.getByRole('button', { name: en.finish }))
  expect(screen.queryByRole('dialog')).toBeNull()
})

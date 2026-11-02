/** The settings page store follows the `vflow` Remote and leaves with the plugin. */
import assert from 'node:assert/strict'
import { Context, Service } from '@deepseek-ai/cordis'
import { afterEach, expect, it, vi } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { stubConfigForm } from '@deepseek-ai/dsh-client-test-runtime'
import { RemoteError, type RemoteResult, type TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import vflowRemote from '@deepseek-ai/dsh-experimental-vflow-skills/remote'
import type { AccountTestResult, AccountView, TeamSettingsView } from '../src/types.ts'
import { apply } from '../src/client/index.ts'
import { ENTRY_ID, PACKAGE_NAME, inject, mountVflow, type VflowPageState } from '../src/client/mount.ts'
import type { VflowInjected } from '../src/client/VflowSettings.tsx'

const contribution: TypertRemoteContribution = { package: PACKAGE_NAME, descriptors: [] }
const ready: TeamSettingsView = {
  status: 'ready',
  source: 'https://settings.example.test/team.json',
  current: { name: 'Example team', sha256: 'a'.repeat(64), connectorCount: 1, projects: ['Alpha'], defaultReviewer: 'review' },
}
const tracker: AccountView = { connectorId: 'tracker', kind: 'redmine', url: 'https://tracker.example.test', configured: true, username: 'alice', testable: true }

const roots: Context[] = []
afterEach(async () => { await Promise.all(roots.splice(0).map(root => root.fiber.dispose())) })

function ok<T>(value: T): Promise<RemoteResult<T>> {
  return Promise.resolve({ ok: true, value })
}

function failed<T>(message: string): Promise<RemoteResult<T>> {
  return Promise.resolve({ ok: false, error: new RemoteError('vflow/unknown-connector', message, { connectorId: 'x' }) })
}

async function fixture(expected: TypertRemoteContribution = contribution) {
  const ctx = new Context(); roots.push(ctx)
  const unmount = vi.fn(async () => {})
  const listeners = new Map<string, () => void>()
  class TestRemote extends Service {
    constructor() { super(ctx, 'remote') }
    $on(event: string, listener: () => void) {
      listeners.set(event, listener)
      return () => { listeners.delete(event) }
    }
    async $mount(value: TypertRemoteContribution) { expect(value).toBe(expected); return unmount }
  }
  new TestRemote()
  const remote = {
    teamSettings: vi.fn(() => ok(ready)),
    refreshTeamSettings: vi.fn(() => ok(ready)),
    acceptTeamSettings: vi.fn((_sha256: string) => ok(ready)),
    listAccounts: vi.fn(() => ok<AccountView[]>([tracker])),
    saveAccount: vi.fn(() => ok<undefined>(undefined)),
    removeAccount: vi.fn(() => ok<undefined>(undefined)),
    testAccount: vi.fn((_id: string, _signal: AbortSignal) => ok<AccountTestResult>({ ok: true, status: 200 })),
  }
  ctx.provide('remote.vflow', remote as never)
  ctx.provide('locale', new LocaleRuntime(ctx))
  const scope = stubConfigForm<Record<string, unknown>>()
  ctx.provide('configForms', { get: (name: string) => { expect(name).toBe(ENTRY_ID); return scope.scope } } as never)
  await ctx.plugin(SlotRegistry)
  ctx.slots.register({ name: 'root', children: { 'plugins.bundle.config': { kind: 'keyed', scope: 'root' } } } as never, () => null)
  return { ctx, remote, scope, unmount, listeners }
}

function isFace(value: Record<string, unknown>): asserts value is Record<string, unknown> & VflowInjected {
  assert(typeof value.refresh === 'function' && typeof value.hooks === 'object')
}

function face(ctx: Context): VflowInjected {
  const entry = ctx.slots.entries('plugins.bundle.config')[0]
  assert(entry !== undefined && typeof entry.inject === 'function')
  expect(entry.options).toMatchObject({ key: PACKAGE_NAME })
  const value = entry.inject()
  isFace(value)
  return value
}

function state(injected: VflowInjected): VflowPageState {
  return injected.hooks.vflow.getSnapshot()
}

it('declares its browser services', () => {
  expect(inject).toEqual(['remote', 'slots', 'locale', 'configForms'])
})

it('loads team settings and accounts, then refreshes, saves the source, and accepts an update', async () => {
  const b = await fixture()
  const dispose = await mountVflow(b.ctx, contribution)
  const page = face(b.ctx)
  await vi.waitFor(() => { expect(state(page).accounts).toEqual([tracker]) })
  expect(state(page)).toMatchObject({ teamSettings: ready, checking: false, writable: false, error: undefined })

  b.scope.publish({ status: 'ready', value: {}, writable: true, revision: 3 })
  expect(state(page).writable).toBe(true)

  await page.refresh()
  expect(b.remote.refreshTeamSettings).toHaveBeenCalledOnce()

  expect(await page.saveSource('  https://other.example.test/team.json ')).toBe(true)
  expect(b.scope.mutate).toHaveBeenCalledWith([{ op: 'set', path: ['teamSettings', 'source'], value: 'https://other.example.test/team.json' }])
  expect(b.remote.refreshTeamSettings).toHaveBeenCalledTimes(2)
  b.scope.mutate.mockResolvedValueOnce(false)
  expect(await page.saveSource('x')).toBe(false)
  expect(b.remote.refreshTeamSettings).toHaveBeenCalledTimes(2)

  await page.accept('b'.repeat(64))
  expect(b.remote.acceptTeamSettings).toHaveBeenCalledWith('b'.repeat(64))

  b.listeners.get('credentials/record-updated')?.()
  b.ctx.emit('connection/reset')
  await vi.waitFor(() => { expect(b.remote.teamSettings).toHaveBeenCalledTimes(2) })

  await dispose()
  expect(b.unmount).toHaveBeenCalledOnce()
  expect(b.ctx.slots.entries('plugins.bundle.config')).toEqual([])
})

it('tracks connection tests and account changes per connector', async () => {
  const b = await fixture()
  await mountVflow(b.ctx, contribution)
  const page = face(b.ctx)
  await vi.waitFor(() => { expect(state(page).accounts).toEqual([tracker]) })

  await page.testAll()
  expect(state(page).tests).toEqual({ tracker: { status: 'done', result: { ok: true, status: 200 } } })
  expect(await page.saveAccount('tracker', { username: 'alice', secret: 'next' })).toBe(true)
  expect(state(page).tests).toEqual({})

  await page.testAccount('tracker')
  await page.removeAccount('tracker')
  expect(b.remote.removeAccount).toHaveBeenCalledWith('tracker')
  expect(state(page).tests).toEqual({})

  b.remote.testAccount.mockReturnValueOnce(failed('gone'))
  await page.testAccount('tracker')
  expect(state(page)).toMatchObject({ tests: {}, error: 'gone' })

  b.remote.saveAccount.mockReturnValueOnce(failed('refused'))
  expect(await page.saveAccount('tracker', { username: 'u', secret: 's' })).toBe(false)
  b.remote.removeAccount.mockReturnValueOnce(failed('refused'))
  await page.removeAccount('tracker')
  b.remote.acceptTeamSettings.mockReturnValueOnce(Promise.reject(new Error('transport closed')))
  await page.accept('c'.repeat(64))
  expect(state(page).error).toBe('transport closed')
  // oxlint-disable-next-line typescript/prefer-promise-reject-errors -- an untyped transport failure is the scenario.
  b.remote.refreshTeamSettings.mockReturnValueOnce(Promise.reject('offline'))
  await page.refresh()
  expect(state(page)).toMatchObject({ error: 'offline', checking: false })
  await page.refresh()
  expect(state(page).error).toBeUndefined()
})

it('ignores answers that arrive after the page is withdrawn', async () => {
  const b = await fixture()
  const dispose = await mountVflow(b.ctx, contribution)
  const page = face(b.ctx)
  await vi.waitFor(() => { expect(b.remote.listAccounts).toHaveBeenCalledOnce() })
  const answered = Promise.withResolvers<RemoteResult<TeamSettingsView>>()
  const thrown = Promise.withResolvers<RemoteResult<TeamSettingsView>>()
  b.remote.refreshTeamSettings.mockReturnValueOnce(answered.promise).mockReturnValueOnce(thrown.promise)
  const refreshing = [page.refresh(), page.refresh()]
  await dispose()
  answered.resolve({ ok: true, value: { status: 'unconfigured', source: '' } })
  thrown.reject(new Error('closed'))
  await Promise.all(refreshing)
  expect(state(page)).toMatchObject({ teamSettings: ready, error: undefined })
  expect(b.remote.listAccounts).toHaveBeenCalledOnce()
})

it('skips the account list when the first read fails', async () => {
  const b = await fixture()
  b.remote.teamSettings.mockReturnValueOnce(failed('not ready'))
  await mountVflow(b.ctx, contribution)
  const page = face(b.ctx)
  await vi.waitFor(() => { expect(state(page).error).toBe('not ready') })
  expect(b.remote.listAccounts).not.toHaveBeenCalled()
})

it('withdraws the Remote mount when the page cannot register', async () => {
  const b = await fixture()
  vi.spyOn(b.ctx.locale, 'register').mockImplementation(() => { throw new Error('no dictionaries') })
  await expect(mountVflow(b.ctx, contribution)).rejects.toThrow('no dictionaries')
  expect(b.unmount).toHaveBeenCalledOnce()
})

it('mounts the generated contribution from the browser entry', async () => {
  const b = await fixture(vflowRemote)
  const dispose = await apply(b.ctx)
  expect(b.ctx.slots.entries('plugins.bundle.config')).toHaveLength(1)
  await dispose()
})

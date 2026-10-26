// @vitest-environment jsdom
/** The fleet tab type, body, and title register once the right Sidebar exists and route commands to the Host. */
import assert from 'node:assert/strict'
import type { ComponentType } from 'react'
import { Context, Service } from '@deepseek-ai/cordis'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { stubConfigForm } from '@deepseek-ai/dsh-client-test-runtime'
import { brandString } from '@deepseek-ai/dsh-brand'
import { RemoteError, type RemoteResult, type TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { IconProps } from '@deepseek-ai/dsh-client-ui-primitives'
import { PACKAGE_NAME, mountVflow } from '../src/client/mount.ts'
import { FLEET_ID, FLEET_KIND, childChatAddress, fleetInject, type FleetInjected } from '../src/client/fleet/index.tsx'
import { en } from '../src/client/locales.ts'

const contribution: TypertRemoteContribution = { package: PACKAGE_NAME, descriptors: [] }
const roots: Context[] = []
afterEach(async () => {
  cleanup()
  await Promise.all(roots.splice(0).map(root => root.fiber.dispose()))
})

const lead = brandString<SessionId>('lead/1')
const childId = brandString<SessionId>('child 1')

function ok<T>(value: T): Promise<RemoteResult<T>> {
  return Promise.resolve({ ok: true, value })
}

async function fixture(capacity: Promise<RemoteResult<number>>) {
  const ctx = new Context(); roots.push(ctx)
  class TestRemote extends Service {
    constructor() { super(ctx, 'remote') }
    $on() { return () => {} }
    async $mount() { return async () => {} }
  }
  new TestRemote()
  ctx.provide('remote.vflow', {
    teamSettings: () => ok({ status: 'unconfigured', source: '' }),
    listAccounts: () => ok([]),
  } as never)
  const fleet = {
    capacity: vi.fn(() => capacity),
    answer: vi.fn((_session: SessionId, _task: string, _decision: string, _choice: number) => ok<undefined>(undefined)),
  }
  ctx.provide('remote.vflowFleet', fleet as never)
  ctx.provide('locale', new LocaleRuntime(ctx))
  ctx.provide('configForms', { get: () => stubConfigForm<Record<string, unknown>>().scope } as never)
  const removeType = vi.fn()
  const registerType = vi.fn((_type: Record<string, unknown>) => removeType)
  const openResource = vi.fn()
  ctx.provide('sidebarRightTabs', { register: registerType } as never)
  ctx.provide('sidebarRight', { openResource } as never)
  await ctx.plugin(SlotRegistry)
  ctx.slots.register({
    name: 'root',
    children: {
      'plugins.bundle.config': { kind: 'keyed', scope: 'root' },
      'sidebar.right.pane.tab': { kind: 'keyed', scope: 'session' },
      'sidebar.right.pane.tab.title': { kind: 'keyed', scope: 'session' },
    },
  } as never, () => null)
  const dispose = await mountVflow(ctx, contribution)
  await vi.waitFor(() => { expect(registerType).toHaveBeenCalledOnce() })
  return { ctx, fleet, registerType, removeType, openResource, dispose }
}

function body(ctx: Context): FleetInjected {
  const entry = ctx.slots.entries('sidebar.right.pane.tab')[0]
  assert(entry !== undefined && typeof entry.inject === 'function')
  expect(entry.options).toMatchObject({ key: FLEET_ID })
  const value = entry.inject(lead as never)
  isFleet(value)
  return value
}

function isFleet(value: Record<string, unknown>): asserts value is Record<string, unknown> & FleetInjected {
  assert(typeof value.answer === 'function' && typeof value.openChild === 'function' && typeof value.hooks === 'object')
}

function failure<T>(code: 'vflow/lead-unavailable' | 'vflow/no-pending-decision', message: string): Promise<RemoteResult<T>> {
  const error = code === 'vflow/lead-unavailable'
    ? new RemoteError(code, message, { leadSessionId: lead })
    : new RemoteError(code, message, { taskId: 't1', decisionId: 'd1' })
  return Promise.resolve({ ok: false, error })
}

it('declares the services the panel waits for', () => {
  expect(fleetInject).toEqual(['remote.vflowFleet', 'slots', 'locale', 'sidebarRight', 'sidebarRightTabs'])
  expect(childChatAddress(lead, childId)).toBe('dsh-resource://subagentchat/session/child%201?parent=lead%2F1&mode=continuable')
})

it('registers the tab type with its guide entry, title, and artwork', async () => {
  const b = await fixture(ok(4))
  const type = b.registerType.mock.calls[0]![0] as {
    id: string
    kind: string
    title: () => string
    guide: { title: () => string; description: () => string; icon: ComponentType<IconProps> }[]
  }
  expect(type).toMatchObject({ id: FLEET_ID, kind: FLEET_KIND, priority: 'builtin' })
  expect(type.title()).toBe(en.fleetTitle)
  const [guide] = type.guide
  expect([guide!.title(), guide!.description()]).toEqual([en.fleetTitle, en.fleetGuideDescription])
  const Icon = guide!.icon
  expect(render(<Icon />).container.querySelector('svg')?.getAttribute('width')).toBe('36')

  const title = b.ctx.slots.entries('sidebar.right.pane.tab.title')[0]
  assert(title !== undefined)
  const Title = title.component as ComponentType<{ useTabInfo: () => { tab: { title: string } } }>
  expect(render(<Title useTabInfo={() => ({ tab: { title: 'Fleet tab' } })} />).container.textContent).toBe('Fleet tab')

  await vi.waitFor(() => { expect(body(b.ctx).hooks.fleet.getSnapshot().capacity).toBe(4) })
  await b.dispose()
  expect(b.removeType).toHaveBeenCalledOnce()
  expect(b.ctx.slots.entries('sidebar.right.pane.tab')).toEqual([])
})

it('answers decisions for the tab Session and reports each failure as text', async () => {
  const b = await fixture(failure<number>('vflow/lead-unavailable', 'not ready'))
  const injected = body(b.ctx)
  expect(await injected.answer('t1', 'd1', 1)).toBeUndefined()
  expect(b.fleet.answer).toHaveBeenCalledWith(lead, 't1', 'd1', 1)
  b.fleet.answer.mockReturnValueOnce(failure<undefined>('vflow/no-pending-decision', 'already answered'))
  expect(await injected.answer('t1', 'd1', 0)).toBe('already answered')
  b.fleet.answer.mockRejectedValueOnce(new Error('transport closed'))
  expect(await injected.answer('t1', 'd1', 0)).toBe('transport closed')
  // oxlint-disable-next-line typescript/prefer-promise-reject-errors -- an untyped transport failure is the scenario.
  b.fleet.answer.mockReturnValueOnce(Promise.reject('offline'))
  expect(await injected.answer('t1', 'd1', 0)).toBe('offline')
  expect(injected.hooks.fleet.getSnapshot().capacity).toBeUndefined()
})

it('opens a child chat in a new pane and survives an unreachable capacity', async () => {
  const b = await fixture(Promise.reject(new Error('Host restarting')))
  body(b.ctx).openChild(childId)
  expect(b.openResource).toHaveBeenCalledWith(childChatAddress(lead, childId), { kind: 'subagentchat', preferNewPane: true })
  expect(body(b.ctx).hooks.fleet.getSnapshot().capacity).toBeUndefined()
})

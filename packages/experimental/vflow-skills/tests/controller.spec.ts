import { createServer } from 'node:http'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import LocalCredentials from '@deepseek-ai/dsh-credentials-local'
import { RemoteError } from '@deepseek-ai/dsh-typert-protocol'
import { AccountsService, TeamSettingsService, VflowController } from '../src/index.ts'
import { createVolatile } from '../../../../vendor/cosmokit/src/volatile.ts'

let dir: string
let context: Context | undefined
let server: Server | undefined

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'vflow-controller-'))
})

afterEach(async () => {
  await context?.fiber.dispose()
  context = undefined
  await new Promise<void>((resolve) => {
    if (server === undefined) resolve()
    else server.close(() => { resolve() })
  })
  server = undefined
  await rm(dir, { recursive: true, force: true })
})

function document(name: string, connectors: Record<string, unknown> = {}): string {
  return JSON.stringify({
    format: 'vflow-team-settings',
    version: 1,
    name,
    connectors,
    projects: [{ id: 'alpha', displayName: 'Alpha', ticketPrefix: 'A', filePrefix: 'A' }],
    nameFormat: 'TS {englishName}',
    docRules: {},
    resources: {},
    executors: { review: { by: 'droid', model: 'example-model', effort: 'max' } },
    defaultReviewer: 'review',
  })
}

async function start(source: string): Promise<VflowController> {
  context = new Context()
  await context.plugin(LocalCredentials, { path: join(dir, 'credentials.yaml'), dshHome: dir, watch: false, debounceMs: 0 })
  await context.plugin(TeamSettingsService, { source: createVolatile(source), stateFile: join(dir, 'state', 'team-settings.json'), fetchTimeoutMs: 1_000 })
  await context.plugin(AccountsService, { probeTimeoutMs: 1_000 })
  return new VflowController(context)
}

async function rejection(promise: Promise<unknown>): Promise<RemoteError> {
  const error: unknown = await promise.then(() => undefined, (reason: unknown) => reason)
  if (!(error instanceof RemoteError)) throw new Error('expected a RemoteError')
  return error
}

describe('VflowController', () => {
  it('reports an unconfigured source', async () => {
    const controller = await start('')
    expect(controller.teamSettings()).toEqual({ status: 'unconfigured', source: '' })
  })

  it('summarizes the adopted version, a pending update, and its acceptance', async () => {
    const source = join(dir, 'published.json')
    await writeFile(source, document('Example team'))
    const controller = await start(source)
    const ready = controller.teamSettings()
    expect(ready).toMatchObject({ status: 'ready', source, current: { name: 'Example team', connectorCount: 0, projects: ['Alpha'], defaultReviewer: 'review' } })

    await writeFile(source, document('Example team v2'))
    const pending = await controller.refreshTeamSettings()
    if (pending.status !== 'ready' || pending.pending === undefined) throw new Error('expected a pending version')
    expect(pending.pending.name).toBe('Example team v2')

    const stale = await rejection(controller.acceptTeamSettings('0'.repeat(64)))
    expect(stale.code).toBe('vflow/no-pending-version')
    expect(await controller.acceptTeamSettings(pending.pending.sha256)).toMatchObject({ status: 'ready', current: { name: 'Example team v2' } })
  })

  it('reports source failures and invalid adopted copies with their causes', async () => {
    const source = join(dir, 'published.json')
    await writeFile(source, document('Example team'))
    const controller = await start(source)
    await rm(source)
    const view = await controller.refreshTeamSettings()
    expect(view.status === 'ready' && view.sourceError).toMatch(/ENOENT/)
    await context?.fiber.dispose()

    await mkdir(join(dir, 'state'), { recursive: true })
    await writeFile(join(dir, 'state', 'team-settings.json'), '{')
    const failed = (await start('')).teamSettings()
    expect(failed.status === 'failed' && failed.error).toMatch(/adopted copy .* is invalid: \$: /)
    const refused = await rejection((await start('')).acceptTeamSettings('0'.repeat(64)))
    expect(refused.code).toBe('vflow/no-pending-version')
  })

  it('saves, lists, tests, and removes accounts with typed refusals', async () => {
    server = createServer((_, response) => { response.writeHead(200); response.end('{}') })
    await new Promise<void>(resolve => server?.listen(0, '127.0.0.1', resolve))
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const source = join(dir, 'published.json')
    await writeFile(source, document('Example team', {
      tracker: { kind: 'redmine', url: base, writePolicy: 'paste-only' },
      wiki: { kind: 'wiki', url: 'https://wiki.example.test', writePolicy: 'read-only' },
    }))
    const controller = await start(source)

    expect((await rejection(controller.saveAccount('missing', { username: 'u', secret: 's' }))).details).toEqual({ connectorId: 'missing' })
    expect((await rejection(controller.saveAccount('tracker', { username: '', secret: 's' }))).code).toBe('vflow/invalid-account')
    expect((await rejection(controller.removeAccount('missing'))).code).toBe('vflow/unknown-connector')

    await controller.saveAccount('tracker', { username: 'alice', secret: 'hunter2' })
    const accounts = await controller.listAccounts()
    expect(accounts.map(account => [account.connectorId, account.configured])).toEqual([['tracker', true], ['wiki', false]])
    expect(JSON.stringify(accounts)).not.toContain('hunter2')
    expect(await controller.testAccount('tracker', new AbortController().signal)).toEqual({ ok: true, status: 200 })
    expect(await controller.testAccount('wiki', new AbortController().signal)).toEqual({ ok: false, reason: 'unsupported' })
    await expect(controller.testAccount('tracker', AbortSignal.abort())).rejects.not.toBeInstanceOf(RemoteError)

    await controller.removeAccount('tracker')
    expect((await controller.listAccounts())[0]?.configured).toBe(false)
  })
})

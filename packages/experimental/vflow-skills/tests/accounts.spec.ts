import { createServer } from 'node:http'
import type { IncomingHttpHeaders, Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { credentialKey } from '@deepseek-ai/dsh-credentials'
import LocalCredentials from '@deepseek-ai/dsh-credentials-local'
import { AccountsService, TeamSettingsService } from '../src/index.ts'
import { createVolatile } from '../../../../vendor/cosmokit/src/volatile.ts'

interface Seen {
  url: string | undefined
  headers: IncomingHttpHeaders
}

let dir: string
let context: Context | undefined
let server: Server | undefined
let seen: Seen[]
let status: number

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'vflow-accounts-'))
  seen = []
  status = 200
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

async function serve(): Promise<string> {
  server = createServer((request, response) => {
    seen.push({ url: request.url, headers: request.headers })
    response.writeHead(status)
    response.end('{}')
  })
  await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve))
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`
}

async function start(connectors?: Record<string, unknown>): Promise<AccountsService> {
  const stateFile = join(dir, 'team-settings.json')
  if (connectors !== undefined) {
    await writeFile(stateFile, JSON.stringify({
      format: 'vflow-team-settings',
      version: 1,
      name: 'Example team',
      connectors,
      projects: [],
      nameFormat: 'TS {englishName}',
      docRules: {},
      resources: {},
      executors: { review: { by: 'droid', model: 'example-model', effort: 'max' } },
      defaultReviewer: 'review',
    }))
  }
  context = new Context()
  await context.plugin(LocalCredentials, { path: join(dir, 'credentials.yaml'), dshHome: dir, watch: false, debounceMs: 0 })
  await context.plugin(TeamSettingsService, { source: createVolatile(''), stateFile, fetchTimeoutMs: 1_000 })
  await context.plugin(AccountsService, { probeTimeoutMs: 2_000 })
  return context.vflowAccounts
}

describe('AccountsService', () => {
  it('lists nothing while no team settings are adopted', async () => {
    const accounts = await start()
    expect(await accounts.list()).toEqual([])
    await expect(accounts.save('tracker', { username: 'u', secret: 's' })).rejects.toThrow(/not in the adopted team settings/)
  })

  it('lists each connector with whether it can be tested, never the secret', async () => {
    const accounts = await start({
      tracker: { kind: 'redmine', url: 'https://tracker.example.test', writePolicy: 'paste-only' },
      review: { kind: 'gerrit', url: 'ssh://review.example.test:29418', writePolicy: 'approve-each' },
      chat: { kind: 'feishu', url: 'https://chat.example.test', writePolicy: 'read-only' },
    })
    await accounts.save('tracker', { username: 'alice', secret: 'hunter2' })
    const views = await accounts.list()
    expect(views).toEqual([
      { connectorId: 'tracker', kind: 'redmine', url: 'https://tracker.example.test', configured: true, username: 'alice', testable: true },
      { connectorId: 'review', kind: 'gerrit', url: 'ssh://review.example.test:29418', configured: false, testable: false },
      { connectorId: 'chat', kind: 'feishu', url: 'https://chat.example.test', configured: false, testable: false },
    ])
    expect(JSON.stringify(views)).not.toContain('hunter2')
  })

  it('refuses empty values and removes saved accounts', async () => {
    const accounts = await start({ tracker: { kind: 'jira', url: 'https://jira.example.test/', writePolicy: 'read-only' } })
    await expect(accounts.save('tracker', { username: '', secret: 's' })).rejects.toThrow(/non-empty/)
    await expect(accounts.save('tracker', { username: 'u', secret: '' })).rejects.toThrow(/non-empty/)
    await accounts.save('tracker', { username: 'u', secret: 's' })
    await accounts.remove('tracker')
    expect((await accounts.list())[0]?.configured).toBe(false)
  })

  it('treats a malformed stored record as unconfigured', async () => {
    const accounts = await start({
      a: { kind: 'jira', url: 'https://jira.example.test', writePolicy: 'read-only' },
      b: { kind: 'jira', url: 'https://jira.example.test', writePolicy: 'read-only' },
      c: { kind: 'jira', url: 'https://jira.example.test', writePolicy: 'read-only' },
    })
    await context!.credentials.modifyRecord(credentialKey('vflow', 'a'), async () => ({ kind: 'api-key', key: 'k' }))
    await context!.credentials.modifyRecord(credentialKey('vflow', 'b'), async () => ({ kind: 'grant', payload: null }))
    await context!.credentials.modifyRecord(credentialKey('vflow', 'c'), async () => ({ kind: 'grant', payload: { username: 'u', secret: 1 } }))
    expect((await accounts.list()).map(view => view.configured)).toEqual([false, false, false])
  })

  it('tests a connector with a read-only request carrying the saved login', async () => {
    const base = await serve()
    const accounts = await start({
      tracker: { kind: 'redmine', url: `${base}/redmine`, writePolicy: 'paste-only' },
      repo: { kind: 'svn', url: `${base}/svn/trunk/`, writePolicy: 'approve-each' },
    })
    expect(await accounts.test('tracker')).toEqual({ ok: false, reason: 'not-configured' })
    await accounts.save('tracker', { username: 'alice', secret: 'hunter2' })
    await accounts.save('repo', { username: 'alice', secret: 'hunter2' })

    expect(await accounts.test('tracker')).toEqual({ ok: true, status: 200 })
    expect(await accounts.test('repo')).toEqual({ ok: true, status: 200 })
    expect(seen.map(request => request.url)).toEqual(['/redmine/users/current.json', '/svn/trunk/'])
    expect(seen[0]?.headers.authorization).toBe(`Basic ${Buffer.from('alice:hunter2').toString('base64')}`)

    status = 401
    expect(await accounts.test('tracker')).toEqual({ ok: false, reason: 'unauthorized', status: 401 })
    status = 403
    expect(await accounts.test('tracker')).toEqual({ ok: false, reason: 'unauthorized', status: 403 })
    status = 302
    expect(await accounts.test('tracker')).toEqual({ ok: false, reason: 'unexpected-status', status: 302 })
  })

  it('reports unsupported and unreachable connectors without throwing', async () => {
    const base = await serve()
    await new Promise(resolve => server!.close(resolve))
    server = undefined
    const accounts = await start({
      down: { kind: 'jenkins', url: base, writePolicy: 'read-only' },
      wiki: { kind: 'wiki', url: 'https://wiki.example.test', writePolicy: 'read-only' },
    })
    await accounts.save('down', { username: 'u', secret: 's' })
    expect(await accounts.test('down')).toEqual({ ok: false, reason: 'unreachable' })
    expect(await accounts.test('wiki')).toEqual({ ok: false, reason: 'unsupported' })
  })

  it('propagates a caller abort', async () => {
    const base = await serve()
    const accounts = await start({ tracker: { kind: 'jira', url: base, writePolicy: 'read-only' } })
    await accounts.save('tracker', { username: 'u', secret: 's' })
    await expect(accounts.test('tracker', AbortSignal.abort())).rejects.toThrow()
    expect(await accounts.test('tracker', new AbortController().signal)).toEqual({ ok: true, status: 200 })
  })
})

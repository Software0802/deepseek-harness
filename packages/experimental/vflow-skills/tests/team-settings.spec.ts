import { createServer } from 'node:http'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { parseTeamSettings, TeamSettingsError, TeamSettingsService } from '../src/index.ts'
import type { TeamSettingsConfig } from '../src/index.ts'

function document(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    format: 'vflow-team-settings',
    version: 1,
    name: 'Example team',
    connectors: {
      tracker: { kind: 'redmine', url: 'https://tracker.example.test', credential: 'vflow/redmine', writePolicy: 'paste-only' },
    },
    projects: [{ id: 'proj-a', displayName: 'Project A', ticketPrefix: 'ABC', filePrefix: 'PA_' }],
    nameFormat: 'TS {englishName}',
    docRules: { font: 'Example Sans', zoomPercent: 100, redTabs: true },
    resources: { 'bench-1': { lock: '/tmp/vflow-bench-1.lock' } },
    executors: { 'droid-review': { by: 'droid', model: 'example-model', effort: 'max' } },
    defaultReviewer: 'droid-review',
    ...overrides,
  }, null, 2)
}

function refusal(text: string): TeamSettingsError {
  try {
    parseTeamSettings(text)
  } catch (error) {
    if (error instanceof TeamSettingsError) return error
    throw error
  }
  throw new Error('document was accepted')
}

describe('parseTeamSettings', () => {
  it('accepts a complete document and hashes its exact text', () => {
    const text = document()
    const parsed = parseTeamSettings(text)
    expect(parsed.settings.projects[0]?.ticketPrefix).toBe('ABC')
    expect(parsed.text).toBe(text)
    expect(parsed.sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(parseTeamSettings(`${text}\n`).sha256).not.toBe(parsed.sha256)
  })

  it('refuses text that is not JSON', () => {
    expect(refusal('{').code).toBe('invalid-json')
  })

  it('refuses secret-like keys and names where they are', () => {
    const nested = refusal(document({ connectors: { tracker: { kind: 'jira', url: 'u', credential: 'a/b', writePolicy: 'read-only', password: 'x' } } }))
    expect(nested.code).toBe('secret-field')
    expect(nested.path).toBe('$.connectors.tracker.password')
    const inArray = refusal(document({ projects: [{ id: 'p', apiToken: 'x' }] }))
    expect(inArray.path).toBe('$.projects[0].apiToken')
  })

  it('refuses documents that fail the schema', () => {
    expect(refusal(document({ nameFormat: 'TS' })).code).toBe('invalid-settings')
    expect(refusal(document({ version: 2 })).code).toBe('invalid-settings')
  })

  it('refuses a default reviewer that names no executor', () => {
    const error = refusal(document({ defaultReviewer: 'missing' }))
    expect(error.code).toBe('unknown-reference')
    expect(error.path).toBe('$.defaultReviewer')
  })
})

describe('TeamSettingsService', () => {
  let dir: string
  let context: Context | undefined
  let server: Server | undefined

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'vflow-team-settings-'))
  })

  afterEach(async () => {
    await context?.fiber.dispose()
    context = undefined
    await new Promise(resolve => server === undefined ? resolve(undefined) : server.close(resolve))
    server = undefined
    await rm(dir, { recursive: true, force: true })
  })

  async function start(config: Partial<TeamSettingsConfig>): Promise<TeamSettingsService> {
    context = new Context()
    await context.plugin(TeamSettingsService, { source: '', fetchTimeoutMs: 10_000, stateFile: join(dir, 'state', 'team-settings.json'), ...config })
    return context.vflowTeamSettings
  }

  async function serve(status: number, body: string): Promise<string> {
    server = createServer((_, response) => {
      response.writeHead(status, { 'content-type': 'application/json' })
      response.end(body)
    })
    await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve))
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}/team-settings.json`
  }

  it('stays unconfigured without a source or an adopted copy', async () => {
    const service = await start({})
    expect(service.snapshot()).toEqual({ status: 'unconfigured' })
  })

  it('adopts the first published version from a LAN address', async () => {
    const text = document()
    const service = await start({ source: await serve(200, text) })
    const state = service.snapshot()
    expect(state.status).toBe('ready')
    expect(await readFile(join(dir, 'state', 'team-settings.json'), 'utf8')).toBe(text)
  })

  it('holds a newer published version until the user accepts its hash', async () => {
    const source = join(dir, 'published.json')
    await writeFile(source, document())
    const service = await start({ source })
    const unchanged = await service.refresh()
    expect(unchanged.status === 'ready' && unchanged.pending).toBeUndefined()

    const next = document({ name: 'Example team v2' })
    await writeFile(source, next)
    const state = await service.refresh()
    if (state.status !== 'ready' || state.pending === undefined) throw new Error('expected a pending version')
    expect(state.current.settings.name).toBe('Example team')

    await expect(service.accept('0'.repeat(64))).rejects.toThrow(/no pending version/)
    const accepted = await service.accept(state.pending.sha256)
    expect(accepted).toMatchObject({ status: 'ready', current: { settings: { name: 'Example team v2' } } })
    expect(await readFile(join(dir, 'state', 'team-settings.json'), 'utf8')).toBe(next)
  })

  it('keeps the adopted copy when the source cannot be read', async () => {
    const source = join(dir, 'published.json')
    await writeFile(source, document())
    const service = await start({ source })
    await rm(source)
    const state = await service.refresh()
    expect(state).toMatchObject({ status: 'ready', current: { settings: { name: 'Example team' } } })
    expect(state.status === 'ready' && state.sourceError).toBeInstanceOf(Error)
  })

  it('uses the adopted copy alone once the source is cleared', async () => {
    const stateFile = join(dir, 'state', 'team-settings.json')
    await mkdir(join(dir, 'state'))
    await writeFile(stateFile, document())
    const service = await start({ stateFile })
    expect(service.snapshot()).toMatchObject({ status: 'ready', current: { settings: { name: 'Example team' } } })
  })

  it('fails when the source answers an HTTP error and nothing is adopted', async () => {
    const service = await start({ source: await serve(503, 'down') })
    const state = service.snapshot()
    expect(state.status === 'failed' && state.error.message).toMatch(/HTTP 503/)
  })

  it('fails when the adopted copy is invalid or unreadable', async () => {
    await mkdir(join(dir, 'state'))
    await writeFile(join(dir, 'state', 'team-settings.json'), '{')
    const invalid = await start({})
    const state = invalid.snapshot()
    expect(state.status === 'failed' && state.error.message).toMatch(/adopted copy .* is invalid/)
    await context!.fiber.dispose()

    const unreadable = await start({ stateFile: dir })
    expect(unreadable.snapshot().status).toBe('failed')
  })

  it('refuses relative paths at load', async () => {
    context = new Context()
    await expect(context.plugin(TeamSettingsService, { source: '', fetchTimeoutMs: 1, stateFile: 'relative.json' })).rejects.toThrow(/stateFile must be an absolute path/)
    await expect(context.plugin(TeamSettingsService, { fetchTimeoutMs: 1, stateFile: join(dir, 's.json'), source: 'relative.json' })).rejects.toThrow(/source must be/)
  })
})

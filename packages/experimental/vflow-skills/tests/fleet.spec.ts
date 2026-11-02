import { expect, it, onTestFinished, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { MessageId, ToolCallId } from '@deepseek-ai/dsh-llm'
import { appendPluginRecord, SessionId } from '@deepseek-ai/dsh-session'
import { mountAgentLoopTestDependencies, mountAgentLoopTestHarness } from '@deepseek-ai/dsh-agent-loop-testkit'
import { executeModelToolFixture, executeToolFixture } from '@deepseek-ai/dsh-tool-testkit'
import { scopeTarget } from '@deepseek-ai/dsh-scope'
import { RemoteError } from '@deepseek-ai/dsh-typert-protocol'
import { SubagentRunId, type SubagentActivationSpec, type SubagentPromptRequest, type SubagentRunEndInfo, type SubagentRuntime } from '@deepseek-ai/dsh-subagent'
import type { WorktreeService } from '@deepseek-ai/dsh-experimental-worktree'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { FleetService, type FleetConfig } from '../src/fleet.ts'
import type { FleetTaskView } from '../src/types.ts'

const signal = new AbortController().signal
const modelSelection = { provider: 'mock', model: 'mock' }
const scout = { ticket: 'ALPHA-1201', title: 'Survey the export code', kind: 'scout', instructions: 'Find where orders are exported.' } as const
const ship = { ticket: 'ALPHA-1202', title: 'Add CSV export', kind: 'ship', instructions: 'Add a CSV export to the orders page.' } as const

interface Options {
  readonly config?: Partial<FleetConfig>
  readonly worktrees?: boolean
  readonly start?: (spec: SubagentActivationSpec, index: number) => Promise<void>
}

/** Real agents, tools, and projections; the subagent and worktree services are spies. */
async function fixture(options: Options = {}) {
  const ctx = new Context()
  onTestFinished(async () => { await ctx.fiber.dispose() })
  await mountAgentLoopTestDependencies(ctx)
  await mountAgentLoopTestHarness(ctx)
  let started = 0
  const ids: SessionId[] = []
  const idOf = (index: number): SessionId => ids[index] ?? SessionId(`child-${index}`)
  const results: { reject: (error: Error) => void }[] = []
  const startActivation = vi.fn(async (spec: SubagentActivationSpec) => {
    const index = started++
    if (spec.childId !== undefined) ids[index] = spec.childId
    await options.start?.(spec, index)
    const result = new Promise<never>((_resolve, reject) => { results.push({ reject }) })
    return { childId: idOf(index), messageId: MessageId(`message-${index}`), result, dispose: () => Promise.resolve() }
  })
  const prompt = vi.fn((_request: SubagentPromptRequest, _signal: AbortSignal) => Promise.resolve({ messageId: MessageId('answer') }))
  const subagents: Pick<SubagentRuntime, 'startActivation' | 'prompt'> = { startActivation, prompt }
  ctx.provide('subagents', subagents as SubagentRuntime)
  const prepare = vi.fn((_agent: Agent, request: { name?: string }) => Promise.resolve({
    path: `/repo/.worktrees/${request.name}`, branch: request.name ?? 'generated', baseCommit: 'abc', repositoryRoot: '/repo',
  }))
  if (options.worktrees === true) ctx.provide('worktrees', { prepare } as Pick<WorktreeService, 'prepare'> as WorktreeService)
  await ctx.plugin(FleetService, { maxParallel: 3, provider: 'spawn', branchPrefix: 'vflow/', ...options.config })
  const fleet = ctx.vflowFleet
  const lead = (await ctx.agents.create({ sessionId: SessionId('lead') })).agent
  const carrier = scopeTarget(subagents as SubagentRuntime, undefined)
  const end = (index: number, stopReason: SubagentRunEndInfo['stopReason'], text?: string) => {
    ctx.emit(carrier, 'subagent/end', {
      runId: SubagentRunId(`run-${index}`), provider: 'spawn', id: idOf(index), local: true, stopReason,
      ...text === undefined ? {} : { lastAssistantMessage: [{ type: 'tool-addition', toolName: 'vflow_report' }, { type: 'text', text }] },
    })
  }
  const begin = (index: number) => {
    ctx.emit(carrier, 'subagent/start', { runId: SubagentRunId(`run-${index}b`), provider: 'spawn', id: idOf(index), local: true })
  }
  const child = async (index: number, parent: Agent = lead) => (await ctx.agents.create({
    sessionId: idOf(index), parentAgent: parent, meta: { parentSession: parent.id, origin: 'subagent' },
  })).agent
  const tasks = (): readonly FleetTaskView[] => fleet.tasks(lead)
  return { ctx, fleet, lead, idOf, startActivation, prompt, prepare, results, end, begin, child, tasks }
}

type Fixture = Awaited<ReturnType<typeof fixture>>

async function call(f: Fixture, agent: Agent, name: string, args: object) {
  const toolSet = await f.ctx.tools.resolve({ agent, modelSelection, signal })
  try {
    return await executeModelToolFixture(f.ctx, { callId: ToolCallId(`call-${name}`), name, arguments: args, agent, signal, toolSet })
  } finally { toolSet.dispose() }
}

async function declared(f: Fixture, agent: Agent): Promise<string[]> {
  const toolSet = await f.ctx.tools.resolve({ agent, modelSelection, signal })
  const names = ['vflow_dispatch', 'vflow_report', 'vflow_request_decision'].filter(name => toolSet.view(agent).has(name))
  toolSet.dispose()
  return names
}

function text(result: { content: readonly { type: string; text?: string }[] }): string {
  return result.content.map(block => block.text ?? '').join('')
}

async function rejection(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(() => { throw new Error('expected a rejection') }, (reason: unknown) => reason)
}

it('starts a scout task as a read-only child of the lead', async () => {
  const f = await fixture()
  expect(await f.fleet.capacity()).toBe(3)
  const result = await f.fleet.dispatch(f.lead, scout)
  expect(result.status).toBe('running')
  expect(Object.keys(result)).toEqual(['taskId', 'status'])
  const spec = f.startActivation.mock.calls[0]![0]
  expect(spec).toMatchObject({ provider: 'spawn', label: 'ALPHA-1201 Survey the export code', delivery: 'parent' })
  expect(spec.request.parent).toBe(f.lead)
  expect(spec.request).not.toHaveProperty('cwd')
  const prompt = spec.request.prompt[0]
  expect(prompt?.type === 'text' && prompt.text).toContain('This is a read-only investigation.')
  expect(prompt?.type === 'text' && prompt.text).toContain('Find where orders are exported.')
  expect(f.tasks()[0]).toMatchObject({ status: 'running', childId: f.idOf(0), kind: 'scout' })
  expect(f.prepare).not.toHaveBeenCalled()
})

it('lets a child report before its start returns', async () => {
  let report = (): Promise<void> => Promise.resolve()
  const f = await fixture({ start: () => report() })
  report = async () => { f.fleet.report(await f.child(0), 'coding', 'Reading the exporter') }
  await f.fleet.dispatch(f.lead, scout)
  expect(f.tasks()[0]).toMatchObject({ status: 'running', node: 'coding', activity: 'Reading the exporter' })
})

it('starts a ship task in a new worktree without moving the lead', async () => {
  const f = await fixture({ worktrees: true })
  const result = await f.fleet.dispatch(f.lead, { ...ship, title: 'x'.repeat(120) })
  const name = `vflow/ALPHA-1202-${result.taskId.slice(0, 8)}`
  expect(result).toMatchObject({ status: 'running', branch: name })
  expect(f.prepare.mock.calls[0]![0]).toBe(f.lead)
  expect(f.prepare.mock.calls[0]![1]).toEqual({ name })
  const spec = f.startActivation.mock.calls[0]![0]
  expect(spec.request.cwd).toBe(`/repo/.worktrees/${name}`)
  expect(spec.label).toHaveLength(80)
  const prompt = spec.request.prompt[0]
  expect(prompt?.type === 'text' && prompt.text).toContain(`on branch ${name}`)
  expect(f.tasks()[0]?.branch).toBe(name)
})

it('fails a ship task when the worktree plugin is off, and reports the cause chain of a failed start', async () => {
  const f = await fixture({
    start: (_spec, index) => {
      if (index === 0) return Promise.reject(new Error('provider refused', { cause: new Error('depth limit') }))
      return Promise.reject(new Error('plain reason', { cause: index === 1 ? 'socket closed' : { code: 'ECONNRESET' } }))
    },
  })
  expect(await f.fleet.dispatch(f.lead, ship)).toMatchObject({
    status: 'failed', reason: 'ship tasks need the Git worktrees plugin; turn it on in Plugins',
  })
  expect(await f.fleet.dispatch(f.lead, scout)).toMatchObject({ status: 'failed', reason: 'provider refused: depth limit' })
  expect(await f.fleet.dispatch(f.lead, scout)).toMatchObject({ status: 'failed', reason: 'plain reason: socket closed' })
  expect(await f.fleet.dispatch(f.lead, scout)).toMatchObject({ status: 'failed', reason: 'plain reason: {"code":"ECONNRESET"}' })
})

it('rejects empty, oversized, and malformed dispatch input', async () => {
  const f = await fixture()
  await expect(f.fleet.dispatch(f.lead, { ...scout, ticket: '  ' })).rejects.toThrow('ticket must not be empty')
  await expect(f.fleet.dispatch(f.lead, { ...scout, ticket: 'ALPHA 1' })).rejects.toThrow('ticket may contain only')
  await expect(f.fleet.dispatch(f.lead, { ...scout, title: 'x'.repeat(201) })).rejects.toThrow('title is longer than 200 characters')
  expect(f.tasks()).toEqual([])
})

it('queues tasks beyond the parallel limit and starts the next when a child ends', async () => {
  const f = await fixture({ config: { maxParallel: 1 } })
  await f.fleet.dispatch(f.lead, scout)
  expect(await f.fleet.dispatch(f.lead, { ...scout, ticket: 'ALPHA-1203' })).toMatchObject({ status: 'queued' })
  f.end(0, 'completed', '  The exporter lives in orders/export.ts.  ')
  await vi.waitFor(() => { expect(f.tasks()[1]?.status).toBe('running') })
  expect(f.tasks()[0]).toMatchObject({ status: 'completed', summary: 'The exporter lives in orders/export.ts.' })
  expect(f.startActivation).toHaveBeenCalledTimes(2)
})

it('maps stop reasons to outcomes and ignores children that are not fleet tasks', async () => {
  const f = await fixture()
  await f.fleet.dispatch(f.lead, scout)
  await f.fleet.dispatch(f.lead, scout)
  f.end(0, 'aborted')
  f.end(1, 'max-tokens', 'partial')
  f.end(9, 'completed')
  expect(f.tasks().map(task => [task.status, task.summary])).toEqual([['cancelled', undefined], ['failed', 'partial']])
})

it('handles a rejected child result without changing the task', async () => {
  const f = await fixture()
  await f.fleet.dispatch(f.lead, scout)
  f.results[0]!.reject(new Error('child crashed'))
  await new Promise(resolve => setImmediate(resolve))
  expect(f.tasks()[0]?.status).toBe('running')
})

it('declares dispatch to root agents and the task tools to fleet children only', async () => {
  const f = await fixture()
  await f.fleet.dispatch(f.lead, scout)
  const child = await f.child(0)
  const stranger = await f.child(5)
  expect(await declared(f, f.lead)).toEqual(['vflow_dispatch'])
  expect(await declared(f, child)).toEqual(['vflow_report', 'vflow_request_decision'])
  expect(await declared(f, stranger)).toEqual([])
})

it('dispatches through the lead tool', async () => {
  const f = await fixture()
  const result = await call(f, f.lead, 'vflow_dispatch', scout)
  expect(result.isError).toBe(false)
  expect(JSON.parse(text(result))).toMatchObject({ status: 'running' })
})

it('records progress reports and decisions from a fleet child, and answers the decision', async () => {
  const f = await fixture()
  await f.fleet.dispatch(f.lead, scout)
  const child = await f.child(0)
  const reported = await call(f, child, 'vflow_report', { node: 'basic-design', activity: 'Reading the order module' })
  expect(text(reported)).toBe('Recorded.')
  expect(f.tasks()[0]).toMatchObject({ node: 'basic-design', activity: 'Reading the order module' })

  const asked = await call(f, child, 'vflow_request_decision', { question: 'Include cancelled orders?', options: ['Yes', 'No'] })
  expect(text(asked)).toContain('End your turn now')
  const decision = f.tasks()[0]?.decision
  expect(decision).toMatchObject({ question: 'Include cancelled orders?', options: ['Yes', 'No'] })
  const again = await call(f, child, 'vflow_request_decision', { question: 'Again?', options: ['Yes', 'No'] })
  expect(again.isError).toBe(true)

  f.end(0, 'completed', 'Waiting for the user.')
  expect(f.tasks()[0]?.status).toBe('waiting')

  const taskId = f.tasks()[0]!.taskId
  const stale = await rejection(f.fleet.answer(f.lead, taskId, 'other', 0))
  expect(stale).toBeInstanceOf(RemoteError)
  expect(stale).toMatchObject({ code: 'vflow/no-pending-decision' })
  await expect(f.fleet.answer(f.lead, taskId, decision!.id, 2)).rejects.toBeInstanceOf(RemoteError)

  await f.fleet.answer(f.lead, taskId, decision!.id, 1)
  expect(f.prompt).toHaveBeenCalledWith(expect.objectContaining({
    parentSessionId: 'lead', childSessionId: f.idOf(0), mode: 'continuable', delivery: 'queue',
    content: [{ type: 'text', text: 'The user decided "Include cancelled orders?": No' }],
  }), expect.any(AbortSignal))
  expect(f.tasks()[0]).toMatchObject({ status: 'running' })
  expect(f.tasks()[0]).not.toHaveProperty('decision')
})

it('rejects decisions with the wrong number of options and task tools from other agents', async () => {
  const f = await fixture()
  await f.fleet.dispatch(f.lead, scout)
  const child = await f.child(0)
  expect(() => f.fleet.requestDecision(child, 'Which?', ['Only'])).toThrow('offer two to four options')
  const stranger = await f.child(5)
  expect(() => { f.fleet.report(stranger, 'coding', 'x') }).toThrow('vflow_report is only available to fleet tasks')
  expect(() => f.fleet.requestDecision(stranger, 'Which?', ['A', 'B'])).toThrow('vflow_request_decision is only available to fleet tasks')
  const orphan = (await f.ctx.agents.create({ sessionId: SessionId('orphan') })).agent
  expect(() => { f.fleet.report(orphan, 'coding', 'x') }).toThrow('only available to fleet tasks')
  const detached = await executeToolFixture(f.ctx, { callId: ToolCallId('call-r'), name: 'vflow_report', arguments: { node: 'coding', activity: 'x' }, signal })
  expect(detached.content).toEqual([{ type: 'text', text: 'Error: unknown tool "vflow_report"' }])
})

it('records a resumed run and finds children of tasks started by an earlier process', async () => {
  const f = await fixture()
  await f.fleet.dispatch(f.lead, scout)
  f.begin(0)
  expect(f.tasks()[0]?.status).toBe('running')
  f.end(0, 'completed', 'Done.')
  f.begin(0)
  expect(f.tasks()[0]).toMatchObject({ status: 'running' })
  expect(f.tasks()[0]).not.toHaveProperty('summary')
  f.begin(9)

  const taskId = f.tasks()[0]!.taskId
  appendPluginRecord(f.lead.session, 'plugin:vflow-skills/fleet-started', { version: 0, taskId, childId: SessionId('child-7'), branch: 'vflow/restored' })
  const restored = await f.child(7)
  f.fleet.report(restored, 'unit-test', 'Running the tests')
  expect(f.tasks()[0]).toMatchObject({ childId: 'child-7', node: 'unit-test' })
  f.end(7, 'completed')
  f.begin(7)
  expect(f.tasks()[0]).toMatchObject({ status: 'running', branch: 'vflow/restored' })
})

it('aborts outstanding child work when the fleet is disposed', async () => {
  let seen: AbortSignal | undefined
  const f = await fixture({ start: (spec) => { seen = spec.signal; return Promise.resolve() } })
  await f.fleet.dispatch(f.lead, scout)
  expect(seen?.aborted).toBe(false)
  await f.ctx.fiber.dispose()
  expect(seen?.aborted).toBe(true)
})

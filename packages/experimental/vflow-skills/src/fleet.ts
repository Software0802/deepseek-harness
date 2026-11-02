/**
 * The vflow fleet: the lead dispatches tickets to child Sessions, each ship task
 * in its own Git worktree; children report V-model progress and ask the user to
 * decide; the fleet panel answers through the `vflowFleet` Remote.
 *
 * @module
 */

import { randomUUID } from 'node:crypto'
import { Service, type Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { appendPluginRecord, type SessionId } from '@deepseek-ai/dsh-session'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { ProjectionHandle } from '@deepseek-ai/dsh-session-projection'
import type { SubagentPromptRequestId, SubagentRunEndInfo, SubagentRunInfo } from '@deepseek-ai/dsh-subagent'
import type {} from '@deepseek-ai/dsh-experimental-worktree'
import { brandString } from '@deepseek-ai/dsh-brand'
import { fleetProjectionDefinition, FLEET_TEXT_LIMITS, type FleetState } from './fleet-log.ts'
import {
  V_MODEL_NODES,
  type FleetTaskKind,
  type FleetTaskView,
  type VflowDecisionId,
  type VflowTaskId,
  type VModelNode,
} from './types.ts'

/** Fleet capacity, child provider, and worktree branch naming. */
export interface FleetConfig {
  /** Tasks of one lead Session that run at the same time; later tasks queue. */
  maxParallel: number
  /** Subagent provider that starts continuable children. */
  provider: string
  /** Prefix of ship-task branch names, followed by the ticket and a short task id. */
  branchPrefix: string
}

/** Validates {@link FleetConfig} and applies its defaults. */
export const FleetConfig: z<FleetConfig> = z.object({
  maxParallel: z.number().step(1).min(1).max(16).default(3).description('Tasks of one lead Session that run at the same time; later tasks queue.'),
  provider: z.string().min(1).default('spawn').description('Subagent provider that starts continuable children.'),
  branchPrefix: z.string().pattern(/^[A-Za-z0-9._/-]*$/).default('vflow/').description('Prefix of ship-task branch names, followed by the ticket and a short task id.'),
})

declare module '@deepseek-ai/cordis' {
  interface Context {
    vflowFleet: FleetService
  }
}

/** Ticket keys such as `ALPHA-1287`: letters, digits, `.`, `_`, and `-`. */
const TICKET = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

/** Parameters of `vflow_dispatch` after JSON validation. */
export interface DispatchInput {
  readonly ticket: string
  readonly title: string
  readonly kind: FleetTaskKind
  readonly instructions: string
}

/** What `vflow_dispatch` returns to the lead. */
export interface DispatchResult {
  readonly taskId: VflowTaskId
  readonly status: FleetTaskView['status']
  readonly branch?: string
  /** Why the task could not start, when `status` is `failed`. */
  readonly reason?: string
}

interface Located {
  readonly lead: Agent
  readonly task: FleetTaskView
}

/** A fleet tool called by an agent it does not serve. */
class FleetToolError extends Error {
  override readonly name = 'FleetToolError'
}

function clip(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`
}

function describe(error: unknown): string {
  const parts: string[] = []
  for (let current = error; current !== undefined && parts.length < 4; current = current instanceof Error ? current.cause : undefined) {
    parts.push(current instanceof Error ? current.message : typeof current === 'string' ? current : JSON.stringify(current))
  }
  return parts.join(': ')
}

function callerOf(exec: { readonly agent?: Agent | undefined }, tool: string): Agent {
  /* v8 ignore next -- `when` declares fleet tools only to agents, so every admitted call has one */
  if (exec.agent === undefined) throw new FleetToolError(`${tool} requires a calling agent`)
  return exec.agent
}

function requireText(name: string, value: string, limit: number): string {
  const trimmed = value.trim()
  if (trimmed.length === 0) throw new FleetToolError(`${name} must not be empty`)
  if (trimmed.length > limit) throw new FleetToolError(`${name} is longer than ${limit} characters`)
  return trimmed
}

/**
 * The instructions a child receives first. Recorded in the child Session as its first user message.
 * @param task - the task being started.
 * @param brief - the lead's instructions.
 * @param branch - the worktree branch of a ship task.
 * @returns the complete prompt text.
 */
export function childPrompt(task: FleetTaskView, brief: string, branch: string | undefined): string {
  const scope = branch === undefined
    ? 'This is a read-only investigation. Do not modify files; report what you find.'
    : `You work in your own Git worktree on branch ${branch}. Commit your changes there. Do not push, merge, or write to ticket systems.`
  return [
    `You are a vflow fleet task. Ticket ${task.ticket}: ${task.title}.`,
    scope,
    `Call vflow_report whenever you enter a V-model stage (${V_MODEL_NODES.join(', ')}) or make visible progress.`,
    'When a choice needs the user, call vflow_request_decision and end your turn; the answer arrives as your next message.',
    'Finish with a short summary of the result.',
    '',
    'Instructions from the lead:',
    brief,
  ].join('\n')
}

/** Dispatches, supervises, and answers fleet tasks recorded in lead Sessions. */
export class FleetService extends TypertRemoteService {
  static inject = ['tools', 'agents', 'subagents', 'sessionProjections']

  private projection!: ProjectionHandle<FleetState>
  /** Fleet children started or resumed in this process, by child Session. */
  private readonly children = new Map<SessionId, { readonly lead: SessionId; readonly taskId: VflowTaskId }>()
  /** Tasks between their slot reservation and their start record. */
  private readonly starting = new Map<SessionId, Set<VflowTaskId>>()
  private readonly lifetime = new AbortController()

  /**
   * @param ctx - owning plugin context.
   * @param config - validated fleet capacity, provider, and branch prefix.
   */
  constructor(ctx: Context, private readonly config: FleetConfig) {
    super(ctx, 'vflowFleet', { namespace: 'vflowFleet' })
  }

  protected async [Service.init](): Promise<void> {
    this.projection = await this.ctx.sessionProjections.register(fleetProjectionDefinition)
    this.registerTools()
    this.ctx.on('subagent/start', (info: SubagentRunInfo) => { this.onStart(info) })
    this.ctx.on('subagent/end', (info: SubagentRunEndInfo) => { this.onEnd(info) })
    this.ctx.effect(() => () => { this.lifetime.abort(new Error('vflow fleet disposed')) }, 'vflow fleet: lifetime')
  }

  /**
   * Fleet tasks recorded in a lead Session.
   * @param lead - the lead agent.
   * @returns tasks in dispatch order.
   */
  tasks(lead: Agent): readonly FleetTaskView[] {
    return this.projection.stateOf(lead.session).tasks
  }

  /**
   * Record a task and start it when the lead has a free slot.
   * @param lead - the dispatching agent; its directory selects the repository for ship worktrees.
   * @param input - ticket, title, kind, and the child's instructions.
   * @returns the task id and its status after the start attempt.
   */
  async dispatch(lead: Agent, input: DispatchInput): Promise<DispatchResult> {
    const ticket = requireText('ticket', input.ticket, FLEET_TEXT_LIMITS.ticket)
    if (!TICKET.test(ticket)) throw new FleetToolError('ticket may contain only letters, digits, ".", "_", and "-"')
    const title = requireText('title', input.title, FLEET_TEXT_LIMITS.title)
    const brief = requireText('instructions', input.instructions, FLEET_TEXT_LIMITS.brief)
    const taskId = brandString<VflowTaskId>(randomUUID())
    appendPluginRecord(lead.session, 'plugin:vflow-skills/fleet-task', { version: 0, taskId, ticket, title, kind: input.kind, brief })
    await this.pump(lead)
    const task = this.tasks(lead).find(candidate => candidate.taskId === taskId)
    /* v8 ignore next -- the record above was just folded */
    if (task === undefined) throw new Error(`vflow fleet: task ${taskId} is missing after dispatch`)
    return {
      taskId, status: task.status,
      ...task.branch === undefined ? {} : { branch: task.branch },
      ...task.status === 'failed' && task.summary !== undefined ? { reason: task.summary } : {},
    }
  }

  /**
   * Record a progress report from a fleet child.
   * @param child - the reporting child agent.
   * @param node - its current V-model stage.
   * @param activity - one line on what it is doing.
   */
  report(child: Agent, node: VModelNode, activity: string): void {
    const { lead, task } = this.locateOrThrow(child, 'vflow_report')
    appendPluginRecord(lead.session, 'plugin:vflow-skills/fleet-progress', {
      version: 0, taskId: task.taskId, node, activity: requireText('activity', activity, FLEET_TEXT_LIMITS.activity),
    })
  }

  /**
   * Put a question from a fleet child in front of the user.
   * @param child - the asking child agent.
   * @param question - what the user must decide.
   * @param options - two to four answers.
   * @returns the decision id.
   */
  requestDecision(child: Agent, question: string, options: readonly string[]): VflowDecisionId {
    const { lead, task } = this.locateOrThrow(child, 'vflow_request_decision')
    if (task.decision !== undefined) throw new FleetToolError('this task already waits for a decision')
    if (options.length < 2 || options.length > 4) throw new FleetToolError('offer two to four options')
    const decisionId = brandString<VflowDecisionId>(randomUUID())
    appendPluginRecord(lead.session, 'plugin:vflow-skills/fleet-decision', {
      version: 0, taskId: task.taskId, decisionId,
      question: requireText('question', question, FLEET_TEXT_LIMITS.question),
      options: options.map(option => requireText('option', option, FLEET_TEXT_LIMITS.option)),
    })
    return decisionId
  }

  /**
   * How many tasks of one lead Session run at the same time.
   * @returns the configured parallel limit.
   */
  @Remote
  capacity(): Promise<number> {
    return Promise.resolve(this.config.maxParallel)
  }

  /**
   * Answer a fleet task's pending decision and send the answer to its child as the user's next message.
   * @param agent - the lead Session the panel shows.
   * @param taskId - the asking task.
   * @param decisionId - the decision the user saw.
   * @param choice - index of the chosen option.
   */
  @Remote
  async answer(agent: Agent, taskId: string, decisionId: string, choice: number): Promise<void> {
    const task = this.tasks(agent).find(candidate => candidate.taskId === taskId)
    const decision = task?.decision
    const option = decision?.options[choice]
    if (task?.childId === undefined || decision?.id !== decisionId || option === undefined) {
      throw new RemoteError('vflow/no-pending-decision', 'This decision is no longer pending.', { taskId, decisionId })
    }
    await this.ctx.subagents.prompt({
      requestId: brandString<SubagentPromptRequestId>(randomUUID()),
      parentSessionId: agent.id,
      childSessionId: task.childId,
      mode: 'continuable',
      delivery: 'queue',
      content: [{ type: 'text', text: `The user decided "${decision.question}": ${option}` }],
    }, this.lifetime.signal)
    appendPluginRecord(agent.session, 'plugin:vflow-skills/fleet-answered', { version: 0, taskId: task.taskId, decisionId: decision.id, choice })
  }

  private registerTools(): void {
    const isLead = ({ agent }: { agent: Agent }) => this.ctx.agents.roots().includes(agent)
    const isChild = ({ agent }: { agent: Agent }) => this.locate(agent.id) !== undefined
    this.ctx.tools.register(defineTool({
      name: 'vflow_dispatch',
      description: 'Dispatch one ticket to a fleet task that runs in its own child session. ship changes code in a new Git worktree; scout only reads and reports. Tasks beyond the parallel limit queue. You are notified when a task finishes; the user follows progress in the fleet panel.',
      parameters: {
        ticket: { type: 'string', required: true, description: 'Ticket key such as ALPHA-1287.' },
        title: { type: 'string', required: true, description: 'Short task title in the user\'s language.' },
        kind: { type: 'string', enum: ['ship', 'scout'], required: true, description: 'ship changes code in its own worktree; scout is read-only.' },
        instructions: { type: 'string', required: true, description: 'Complete instructions for the child; it does not see this conversation.' },
      },
      output: {
        schema: {
          type: 'object', additionalProperties: false,
          properties: {
            taskId: { type: 'string', required: true },
            status: { type: 'string', required: true },
            branch: { type: 'string' },
            reason: { type: 'string' },
          },
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
      },
      execute: async (args, exec) => ({ ...await this.dispatch(callerOf(exec, 'vflow_dispatch'), args) }),
    }), { when: isLead })
    this.ctx.tools.register(defineTool({
      name: 'vflow_report',
      description: 'Report your V-model stage and current activity to the fleet panel. Only for fleet tasks.',
      parameters: {
        node: { type: 'string', enum: [...V_MODEL_NODES], required: true, description: 'Current V-model stage.' },
        activity: { type: 'string', required: true, description: 'One short line on what you are doing, in the user\'s language.' },
      },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { recorded: { type: 'boolean', required: true } } },
        render: () => [{ type: 'text', text: 'Recorded.' }],
      },
      execute: (args, exec) => {
        this.report(callerOf(exec, 'vflow_report'), args.node, args.activity)
        return Promise.resolve({ recorded: true })
      },
    }), { when: isChild })
    this.ctx.tools.register(defineTool({
      name: 'vflow_request_decision',
      description: 'Ask the user to decide between two to four options. The question appears in the fleet panel. End your turn after calling; the answer arrives as your next message. Only for fleet tasks.',
      parameters: {
        question: { type: 'string', required: true, description: 'The decision, with the context the user needs, in the user\'s language.' },
        options: { type: 'array', items: { type: 'string' }, required: true, description: 'Two to four short answers; put the recommended one first.' },
      },
      output: {
        schema: { type: 'object', additionalProperties: false, properties: { decisionId: { type: 'string', required: true } } },
        render: () => [{ type: 'text', text: 'Question shown to the user. End your turn now; the answer arrives as your next message.' }],
      },
      execute: (args, exec) => Promise.resolve({ decisionId: this.requestDecision(callerOf(exec, 'vflow_request_decision'), args.question, args.options) }),
    }), { when: isChild })
  }

  /** Start queued tasks of one lead while it has free slots. */
  private async pump(lead: Agent): Promise<void> {
    const starting = this.starting.get(lead.id) ?? new Set<VflowTaskId>()
    this.starting.set(lead.id, starting)
    const tasks = this.tasks(lead)
    let active = tasks.filter(task => task.status === 'running' || task.status === 'waiting').length + starting.size
    const starts: Promise<void>[] = []
    for (const task of tasks) {
      if (active >= this.config.maxParallel) break
      if (task.status !== 'queued' || starting.has(task.taskId)) continue
      active++
      starting.add(task.taskId)
      starts.push(this.start(lead, task).finally(() => { starting.delete(task.taskId) }))
    }
    await Promise.all(starts)
  }

  private async start(lead: Agent, task: FleetTaskView): Promise<void> {
    const brief = this.projection.stateOf(lead.session).briefs[task.taskId]
    try {
      /* v8 ignore next -- the fold keeps a brief until the start record */
      if (brief === undefined) throw new Error('the task brief is missing')
      let worktree: { readonly path: string; readonly branch: string } | undefined
      if (task.kind === 'ship') {
        const worktrees = this.ctx.get('worktrees')
        if (worktrees === undefined) throw new Error('ship tasks need the Git worktrees plugin; turn it on in Plugins')
        worktree = await worktrees.prepare(lead, { name: `${this.config.branchPrefix}${task.ticket}-${task.taskId.slice(0, 8)}` }, this.lifetime.signal)
      }
      // A reserved id lets the child's first tool calls find their task before `startActivation` returns.
      const childId = brandString<SessionId>(randomUUID())
      this.children.set(childId, { lead: lead.id, taskId: task.taskId })
      const activation = await this.ctx.subagents.startActivation({
        childId,
        provider: this.config.provider,
        label: clip(`${task.ticket} ${task.title}`, 80),
        request: {
          prompt: [{ type: 'text', text: childPrompt(task, brief, worktree?.branch) }],
          parent: lead,
          ...worktree === undefined ? {} : { cwd: worktree.path },
        },
        signal: this.lifetime.signal,
        delivery: 'parent',
      })
      appendPluginRecord(lead.session, 'plugin:vflow-skills/fleet-started', {
        version: 0, taskId: task.taskId, childId, ...worktree === undefined ? {} : { branch: worktree.branch },
      })
      // The end record comes from `subagent/end`, which also covers later resumed runs.
      activation.result.catch((error: unknown) => { this.ctx.logger.debug('vflow fleet: child result rejected: %s', describe(error)) })
    } catch (error) {
      appendPluginRecord(lead.session, 'plugin:vflow-skills/fleet-finished', {
        version: 0, taskId: task.taskId, outcome: 'failed', summary: clip(describe(error), FLEET_TEXT_LIMITS.summary),
      })
    }
  }

  private locate(childId: SessionId): Located | undefined {
    const known = this.children.get(childId)
    const leadId = known?.lead ?? this.ctx.agents.get(childId)?.session.header.parentSession
    const lead = leadId === undefined ? undefined : this.ctx.agents.get(leadId)
    if (lead === undefined) return undefined
    const task = this.tasks(lead).find(candidate => known === undefined ? candidate.childId === childId : candidate.taskId === known.taskId)
    return task === undefined ? undefined : { lead, task }
  }

  private locateOrThrow(child: Agent, tool: string): Located {
    const located = this.locate(child.id)
    if (located === undefined) throw new FleetToolError(`${tool} is only available to fleet tasks`)
    return located
  }

  private onStart(info: SubagentRunInfo): void {
    const located = this.locate(info.id)
    if (located === undefined) return
    this.children.set(info.id, { lead: located.lead.id, taskId: located.task.taskId })
    // The first start is recorded by `start`; this records resumed runs.
    if (located.task.status === 'running') return
    const { taskId, branch } = located.task
    appendPluginRecord(located.lead.session, 'plugin:vflow-skills/fleet-started', {
      version: 0, taskId, childId: info.id, ...branch === undefined ? {} : { branch },
    })
  }

  private onEnd(info: SubagentRunEndInfo): void {
    const located = this.locate(info.id)
    if (located === undefined || located.task.status === 'waiting') return
    const text = (info.lastAssistantMessage ?? []).flatMap(block => block.type === 'text' ? [block.text] : []).join('\n').trim()
    appendPluginRecord(located.lead.session, 'plugin:vflow-skills/fleet-finished', {
      version: 0, taskId: located.task.taskId,
      outcome: info.stopReason === 'completed' ? 'completed' : info.stopReason === 'aborted' ? 'cancelled' : 'failed',
      ...text.length === 0 ? {} : { summary: clip(text, FLEET_TEXT_LIMITS.summary) },
    })
    /* v8 ignore next -- `start` records its own failures; this reports only a failure to write that record */
    this.pump(located.lead).catch((error: unknown) => { this.ctx.logger.warn('vflow fleet: queue start failed: %s', describe(error)) })
  }
}

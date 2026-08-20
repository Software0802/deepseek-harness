/**
 * Human `/loop` command plus same-session count/duration continuation.
 * Continuation prompts are plugin-sourced `user/message` events; process-local
 * activation is not persisted. Official same-session objectives stay on `ctx.goals`.
 * @module @deepseek-ai/dsh-omp-loop
 */

import { FiberState } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { CommandInvocation, CommandResult } from '@deepseek-ai/dsh-commands'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import type { MessageId } from '@deepseek-ai/dsh-llm'
import type { Session, SessionEvent, UserMessage } from '@deepseek-ai/dsh-session'
import { LOOP_USAGE, parseLoopCommand } from './parse.ts'
import { LOOP_PLUGIN, loopMessageSource, renderLoopPrompt } from './prompt.ts'

export { LOOP_USAGE, parseLoopCommand } from './parse.ts'
export type { LoopCommand } from './parse.ts'
export { LOOP_PLUGIN, loopMessageSource, parseLoopPrompt, renderLoopPrompt } from './prompt.ts'
export type { LoopPromptParts } from './prompt.ts'

export const name = LOOP_PLUGIN
export const inject = ['agents', 'commands']

/**
 * Plugin config. `maxIterations` is the inclusive cap for one run; a command
 * count above it fails at dispatch rather than clamping.
 */
export interface Config {
  /** Inclusive iteration cap for one `/loop` run (default `20`). */
  maxIterations?: number
}

/** Loader schema; `apply` re-checks the cap so a non-integer cannot start work. */
export const Config: z<Config> = z.object({
  maxIterations: z.number().default(20),
})

/** One reserved continuation until it is admitted, cancelled, or dropped. */
interface LoopAttempt {
  readonly messageId: MessageId
  readonly iteration: number
  readonly content: ReturnType<typeof renderLoopPrompt>
  phase: 'queued' | 'claimed' | 'admitted'
  cancelled: boolean
  stale: boolean
}

/** Process-local loop record for one exact Agent lifecycle. */
interface LoopState {
  readonly agent: Agent
  prompt: string | undefined
  iteration: number
  maxIterations: number
  deadlineMs: number | undefined
  status: 'idle' | 'running' | 'complete' | 'stopped'
  attempt: LoopAttempt | undefined
  competing: boolean
  requested: boolean
  run: Promise<void> | undefined
  stopping: boolean
}

/** Human-readable unexpected values for logs. */
function renderThrown(value: unknown): string {
  return value instanceof Error ? value.message : String(value)
}

/** Flatten text blocks from one user message. */
function textOf(message: UserMessage): string {
  return message.content
    .filter((block): block is Extract<typeof block, { type: 'text' }> => block.type === 'text')
    .map(block => block.text)
    .join('\n')
    .trim()
}

/**
 * Latest human-authored user prompt in the session log.
 * @param session - owning session whose events are scanned backward.
 * @returns trimmed text, or `undefined` when no human user message exists.
 */
function lastHumanPrompt(session: Session): string | undefined {
  for (let index = session.events.length - 1; index >= 0; index -= 1) {
    const event = session.events[index]
    if (event?.type !== 'user/message' || event.data.source.kind !== 'user') continue
    const text = textOf(event.data)
    if (text.length > 0) return text
  }
  return undefined
}

/**
 * Install `/loop` and its race-fenced continuation driver.
 * @param ctx - plugin context; listeners dispose with the fiber.
 * @param config - validated {@link Config}.
 */
export function apply(ctx: Context, config: Config): void {
  const maxIterationsCap = config.maxIterations as number
  if (!Number.isInteger(maxIterationsCap) || maxIterationsCap < 1) {
    throw new Error(`omp-loop: invalid maxIterations ${maxIterationsCap} — must be an integer >= 1`)
  }

  const states = new Map<Agent, LoopState>()

  function stateFor(agent: Agent): LoopState {
    const existing = states.get(agent)
    if (existing !== undefined) return existing
    const state: LoopState = {
      agent,
      prompt: undefined,
      iteration: 0,
      maxIterations: maxIterationsCap,
      deadlineMs: undefined,
      status: 'idle',
      attempt: undefined,
      competing: false,
      requested: false,
      run: undefined,
      stopping: false,
    }
    states.set(agent, state)
    return state
  }

  function readyToDrive(state: LoopState): boolean {
    return ctx.fiber.state === FiberState.ACTIVE
      && !state.stopping
      && ctx.agents.get(state.agent.id) === state.agent
      && state.agent.status === 'idle'
      && !state.competing
      && state.status === 'running'
  }

  function stop(state: LoopState, status: 'idle' | 'complete' | 'stopped'): void {
    state.status = status
    state.attempt = undefined
    state.requested = false
  }

  function pastDeadline(state: LoopState): boolean {
    return state.deadlineMs !== undefined && Date.now() >= state.deadlineMs
  }

  async function drive(state: LoopState): Promise<void> {
    const { agent } = state
    if (!readyToDrive(state)) return

    const attempt = state.attempt
    if (attempt !== undefined) {
      /* v8 ignore next 4 -- queued/claimed reservations are stopped on the idle edge before drive resumes */
      if (attempt.cancelled || attempt.stale) {
        stop(state, 'stopped')
        return
      }
      if (attempt.phase === 'admitted') {
        state.iteration = attempt.iteration
        state.attempt = undefined
      }
      /* v8 ignore start -- in-flight queued/claimed reservation waits for admit or idle */
      else return
      /* v8 ignore stop */
    }

    if (state.iteration >= state.maxIterations || pastDeadline(state)) {
      stop(state, 'complete')
      return
    }

    const prompt = state.prompt
    /* v8 ignore next 4 -- start always sets prompt; session-start clears it only after stop() */
    if (prompt === undefined) {
      stop(state, 'stopped')
      return
    }

    const iteration = state.iteration + 1
    const parts = { iteration, maxIterations: state.maxIterations, prompt }
    const content = renderLoopPrompt(parts)
    const message = createUserMessage({
      content,
      source: loopMessageSource(parts),
    })
    const reservation: LoopAttempt = {
      messageId: message.id,
      iteration,
      content,
      phase: 'queued',
      cancelled: false,
      stale: false,
    }
    state.attempt = reservation
    try {
      agent.followup(message)
    }
    catch (error: unknown) {
      state.attempt = undefined
      ctx.logger.warn(`omp-loop: could not queue iteration ${iteration} for agent "${agent.id}": ${renderThrown(error)}`)
      stop(state, 'stopped')
    }
  }

  function requestDrive(state: LoopState): void {
    /* v8 ignore next -- teardown may race a final trigger after the fiber has closed */
    if (state.stopping) return
    state.requested = true
    if (state.run !== undefined) return
    let settle!: () => void
    const run = new Promise<void>((resolve) => { settle = resolve })
    state.run = run
    let task: Promise<void>
    try {
      task = Promise.resolve(ctx.agents.withoutInitiator(async () => {
        while (state.requested && !state.stopping) {
          state.requested = false
          try {
            await drive(state)
          }
          catch (error: unknown) {
            ctx.logger.warn(`omp-loop: driver failed for agent "${state.agent.id}": ${renderThrown(error)}`)
            stop(state, 'stopped')
          }
        }
      }))
    }
    catch (error: unknown) {
      ctx.logger.warn(`omp-loop: could not start driver for agent "${state.agent.id}": ${renderThrown(error)}`)
      stop(state, 'stopped')
      state.run = undefined
      settle()
      return
    }
    const retire = (): void => {
      state.run = undefined
      settle()
      /* v8 ignore next -- a nested request can land after the while-loop exits */
      if (state.requested && !state.stopping) requestDrive(state)
    }
    void task.then(retire, (error: unknown) => {
      ctx.logger.warn(`omp-loop: driver task rejected for agent "${state.agent.id}": ${renderThrown(error)}`)
      stop(state, 'stopped')
      retire()
    })
  }

  function sameAttempt(message: UserMessage, attempt: LoopAttempt): boolean {
    return message.id === attempt.messageId
  }

  function renderStatus(state: LoopState): string {
    if (state.status === 'idle' || state.prompt === undefined) {
      return `No loop is currently set.\n${LOOP_USAGE}`
    }
    const deadline = state.deadlineMs === undefined
      ? 'none'
      : `${Math.max(0, state.deadlineMs - Date.now())}ms remaining`
    return [
      `Status: ${state.status}`,
      `Iterations: ${state.iteration}/${state.maxIterations}`,
      `Deadline: ${deadline}`,
      `Task: ${state.prompt}`,
      '',
      'Commands: /loop <count>|<duration> [prompt], /loop stop',
    ].join('\n')
  }

  function executeLoopCommand(invocation: CommandInvocation): CommandResult {
    const command = parseLoopCommand(invocation.rawInput)
    const state = stateFor(invocation.agent)
    switch (command.kind) {
      case 'status':
        return { kind: 'success', text: renderStatus(state) }
      case 'invalid':
        return { kind: 'error', text: command.message }
      case 'stop':
        if (state.status !== 'running') {
          return { kind: 'success', text: 'No running loop to stop.' }
        }
        stop(state, 'stopped')
        return { kind: 'success', text: renderStatus(state) }
      case 'start': {
        if (state.status === 'running') {
          return {
            kind: 'error',
            text: 'A loop is already running. Use /loop stop before starting another.',
          }
        }
        const iterations = command.iterations ?? maxIterationsCap
        if (iterations > maxIterationsCap) {
          return {
            kind: 'error',
            text: `iteration count ${iterations} exceeds configured maxIterations (${maxIterationsCap}).`,
          }
        }
        const prompt = command.prompt ?? lastHumanPrompt(invocation.agent.session)
        if (prompt === undefined) {
          return {
            kind: 'error',
            text: `a prompt is required when the session has no human user message.\n${LOOP_USAGE}`,
          }
        }
        state.prompt = prompt
        state.iteration = 0
        state.maxIterations = iterations
        state.deadlineMs = command.durationMs === undefined ? undefined : Date.now() + command.durationMs
        state.status = 'running'
        state.attempt = undefined
        state.competing = false
        requestDrive(state)
        return { kind: 'success', text: renderStatus(state) }
      }
      /* v8 ignore next 2 -- LoopCommand is closed and every member is handled above */
      default: return assertNeverCommand(command)
    }
  }

  ctx.effect(function* () {
    ctx.commands.register({
      name: 'loop',
      description: 'repeat one prompt for a count or duration without completion semantics',
      input: { hint: '[<count>|<duration>|stop] [prompt]' },
      handler: invocation => executeLoopCommand(invocation),
    })

    ctx.on('agent/created', ({ agent }) => { stateFor(agent) })
    ctx.on('agent/disposed', ({ agent }) => { states.delete(agent) })
    ctx.on('agent/session-start', ({ agent }) => {
      const state = stateFor(agent)
      stop(state, 'idle')
      state.prompt = undefined
      state.competing = false
    })
    ctx.on('agent/status', ({ agent, status }) => {
      const state = stateFor(agent)
      if (status !== 'idle') return
      state.competing = false
      const attempt = state.attempt
      if (attempt !== undefined && (attempt.phase === 'queued' || attempt.phase === 'claimed' || attempt.cancelled)) {
        attempt.stale = true
        stop(state, 'stopped')
        return
      }
      requestDrive(state)
    })
    ctx.on('agent/inbox/inserted', ({ agent, message }) => {
      if (!agent.inbox.nextTurn.some(candidate => candidate.id === message.id)) return
      const state = stateFor(agent)
      const attempt = state.attempt
      if (attempt !== undefined && sameAttempt(message, attempt)) return
      state.competing = true
      if (attempt?.phase === 'queued') attempt.stale = true
      if (state.status === 'running') stop(state, 'stopped')
    })
    ctx.on('agent/inbox/claimed', ({ agent, message }) => {
      const attempt = stateFor(agent).attempt
      if (attempt !== undefined && sameAttempt(message, attempt)) attempt.phase = 'claimed'
    })
    ctx.on('agent/inbox/discarded', ({ agent, message }) => {
      const attempt = stateFor(agent).attempt
      if (attempt !== undefined && sameAttempt(message, attempt)) attempt.cancelled = true
    })
    ctx.on('session/event', (session: Session, event: SessionEvent) => {
      const agent = ctx.agents.get(session.id)
      if (agent === undefined || agent.session !== session) return
      const state = stateFor(agent)
      switch (event.type) {
        case 'user/message':
          if (state.attempt !== undefined && event.data.id === state.attempt.messageId) {
            state.attempt.phase = 'admitted'
          }
          return
        case 'turn/end':
          if (event.data.reason.kind === 'aborted' && state.status === 'running') {
            if (state.attempt?.phase === 'claimed' || state.attempt?.phase === 'admitted') {
              state.attempt.cancelled = true
            }
            else stop(state, 'stopped')
          }
          return
        default:
          return
      }
    })

    for (const agent of ctx.agents.list()) stateFor(agent)

    yield async () => {
      const waits: Promise<void>[] = []
      for (const state of states.values()) {
        state.stopping = true
        /* v8 ignore start -- agent/disposed usually clears running work before this sweep */
        if (state.status === 'running') stop(state, 'stopped')
        if (state.run !== undefined) waits.push(state.run)
        /* v8 ignore stop */
      }
      await Promise.allSettled(waits)
      states.clear()
    }
  }, 'omp-loop lifecycle')
}

/** Fail loudly if a locally closed command union gains an unhandled member. */
/* v8 ignore start -- closed-union backstop is unreachable without violating the TypeScript contract */
function assertNeverCommand(value: never): never {
  throw new TypeError(`unknown loop command: ${String(value)}`)
}
/* v8 ignore stop */

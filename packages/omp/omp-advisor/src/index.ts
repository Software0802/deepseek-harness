/**
 * Second-model reviewer that reads each completed main-agent turn and injects
 * a notice. The review request is not part of the owning session history; only
 * the injected note is model-visible. Pair a cheaper model through Config.
 * @module @deepseek-ai/dsh-omp-advisor
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { Agent } from '@deepseek-ai/dsh-agent'
import {
  BlockAssembler,
  boundContextSummary,
  createUserMessage,
  type GenerateOptions,
} from '@deepseek-ai/dsh-llm'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import type { Session, SessionEvent } from '@deepseek-ai/dsh-session'
import { deadline, MAX_TIMER_DELAY_MS } from '@deepseek-ai/dsh-timeout'

export const name = 'omp-advisor'
export const inject = ['agents', 'llm']

/** Plugin id stamped on every injected advisor notice. */
export const ADVISOR_PLUGIN = 'omp-advisor'

/** Closed severity set parsed from the reviewer model. */
export type AdvisorSeverity = 'aside' | 'concern' | 'blocker'

/**
 * Plugin config. `enabled` defaults false so installing the bundle does not
 * spend tokens until a deployment supplies `provider` and `model`.
 */
export interface Config {
  /** When false, the plugin loads and reviews nothing (default). */
  enabled?: boolean
  /** Provider route for the reviewer model; required when `enabled` is true. */
  provider?: string
  /** Model id for the reviewer; required when `enabled` is true. */
  model?: string
  /** Reviewer call timeout in milliseconds (default `30000`). */
  timeoutMs?: number
  /** Reviewer `maxTokens` (default `256`). */
  maxOutputTokens?: number
  /** Byte cap on the turn transcript sent to the reviewer (default `8192`). */
  maxTranscriptBytes?: number
  /** When true, also review sessions whose header origin is `subagent`. */
  includeSubagents?: boolean
  /** `inject` never wakes the agent; `interrupt` followups on blocker notes. */
  delivery?: 'inject' | 'interrupt'
  /** Maximum blocker followups per agent lifecycle (default `3`). */
  maxInterrupts?: number
}

/** Loader schema; `apply` re-checks integers and enabled-route presence. */
export const Config: z<Config> = z.object({
  enabled: z.boolean().default(false),
  provider: z.string().default(''),
  model: z.string().default(''),
  timeoutMs: z.number().default(30_000),
  maxOutputTokens: z.number().default(256),
  maxTranscriptBytes: z.number().default(8192),
  includeSubagents: z.boolean().default(false),
  delivery: z.union(['inject', 'interrupt']).default('inject'),
  maxInterrupts: z.number().default(3),
})

/**
 * Reviewer system prompt. Quoted in the package README Model Experience block.
 */
export const ADVISOR_SYSTEM_PROMPT = [
  'You are a silent reviewer watching one coding-agent turn.',
  'Read the turn transcript and reply with exactly two parts:',
  'SEVERITY: aside | concern | blocker',
  'NOTE: <one short note the main agent should see>',
  'Use aside for a quiet observation, concern for a risk that still lets work continue, and blocker for a hard mistake that should stop the current approach.',
  'Do not call tools. Do not greet. Do not repeat the transcript.',
].join('\n')

const SEVERITY_LINE = /^SEVERITY:\s*(aside|concern|blocker)\s*(?:\r?\n|$)/iu

/** Parsed reviewer body after the required severity line. */
export interface AdvisorNote {
  readonly severity: AdvisorSeverity
  readonly note: string
}

/** Human-readable unexpected values for logs. */
function renderThrown(value: unknown): string {
  return value instanceof Error ? value.message : String(value)
}

/** Flatten text blocks from one content array. */
function textOf(content: readonly ContentBlock[]): string {
  return content
    .filter((block): block is Extract<ContentBlock, { type: 'text' }> => block.type === 'text')
    .map(block => block.text)
    .join('\n')
    .trim()
}

/**
 * Parse reviewer output into a severity and note.
 * @param text - complete reviewer text, possibly empty.
 * @returns the note when it is non-empty after trim; otherwise `undefined`.
 */
export function parseAdvisorOutput(text: string): AdvisorNote | undefined {
  const trimmed = text.trim()
  if (trimmed.length === 0) return undefined
  const match = SEVERITY_LINE.exec(trimmed)
  if (match === null || match.index !== 0) {
    return { severity: 'aside', note: trimmed }
  }
  const severity = match[1]?.toLowerCase() as AdvisorSeverity
  const note = trimmed.slice(match[0].length).replace(/^NOTE:\s*/iu, '').trim()
  if (note.length === 0) return undefined
  return { severity, note }
}

/**
 * Collect user and assistant text from one completed turn.
 * @param session - owning session log.
 * @param turn - turn number from `turn/end`.
 * @returns concatenated role-prefixed text, possibly empty.
 */
export function transcriptForTurn(session: Session, turn: number): string {
  let current: number | undefined
  const parts: string[] = []
  for (const event of session.events) {
    if (event.type === 'turn/start') current = event.data.turn
    else if (event.type === 'turn/end') current = undefined
    if (current !== turn) continue
    if (event.type === 'user/message') {
      const text = textOf(event.data.content)
      if (text.length > 0) parts.push(`User: ${text}`)
    }
    else if (event.type === 'assistant/message') {
      const text = textOf(event.data.message.content)
      if (text.length > 0) parts.push(`Assistant: ${text}`)
    }
  }
  return parts.join('\n\n')
}

/** Whether this turn already carried an advisor notice (do not interrupt again). */
function turnHasAdvisorNotice(session: Session, turn: number): boolean {
  let current: number | undefined
  for (const event of session.events) {
    if (event.type === 'turn/start') current = event.data.turn
    else if (event.type === 'turn/end') current = undefined
    if (current !== turn) continue
    if (event.type !== 'user/message') continue
    const source = event.data.source
    if (source.kind === 'plugin' && source.plugin === ADVISOR_PLUGIN) return true
  }
  return false
}

/**
 * Bound a transcript to a complete-result byte cap.
 * @param transcript - full turn text.
 * @param maxBytes - inclusive UTF-8 byte budget.
 * @returns the original text or a head plus an omitted-byte marker.
 */
export function boundTranscript(transcript: string, maxBytes: number): string {
  const bytes = Buffer.byteLength(transcript, 'utf8')
  if (bytes <= maxBytes) return transcript
  let end = transcript.length
  while (end > 0 && Buffer.byteLength(transcript.slice(0, end), 'utf8') > maxBytes) end -= 1
  const omitted = bytes - Buffer.byteLength(transcript.slice(0, end), 'utf8')
  return `${transcript.slice(0, end)}… (+${omitted} more bytes)`
}

/** Positive integer config field, failing loud at load. */
function requireInteger(name: string, value: number, min: number): number {
  if (!Number.isInteger(value) || value < min) {
    throw new Error(`omp-advisor: invalid ${name} ${value} — must be an integer >= ${min}`)
  }
  return value
}

/**
 * Install the per-turn reviewer. Disabled configs register nothing.
 * @param ctx - plugin context; listeners dispose with the fiber.
 * @param config - validated {@link Config}.
 */
export function apply(ctx: Context, config: Config): void {
  const enabled = config.enabled as boolean
  const provider = config.provider as string
  const model = config.model as string
  const timeoutMs = requireInteger('timeoutMs', config.timeoutMs as number, 1)
  if (timeoutMs > MAX_TIMER_DELAY_MS) {
    throw new Error(`omp-advisor: invalid timeoutMs ${timeoutMs} — must be <= ${MAX_TIMER_DELAY_MS}`)
  }
  const maxOutputTokens = requireInteger('maxOutputTokens', config.maxOutputTokens as number, 1)
  const maxTranscriptBytes = requireInteger('maxTranscriptBytes', config.maxTranscriptBytes as number, 1)
  const includeSubagents = config.includeSubagents as boolean
  const delivery = config.delivery as 'inject' | 'interrupt'
  const maxInterrupts = requireInteger('maxInterrupts', config.maxInterrupts as number, 0)
  if (!enabled) return
  if (provider.trim().length === 0 || model.trim().length === 0) {
    throw new Error('omp-advisor: enabled reviews require non-empty provider and model')
  }

  const interrupts = new WeakMap<Agent, number>()
  const inflight = new Set<Promise<void>>()

  function deliver(agent: Agent, parsed: AdvisorNote, alreadyNoticed: boolean): void {
    const message = createUserMessage({
      content: [{
        type: 'text',
        text: `Advisor ${parsed.severity}: ${parsed.note}`,
      }],
      source: {
        kind: 'plugin',
        plugin: ADVISOR_PLUGIN,
        form: 'notice',
        summary: boundContextSummary(`advisor ${parsed.severity}`),
      },
    })
    const interrupt = delivery === 'interrupt'
      && parsed.severity === 'blocker'
      && !alreadyNoticed
      && (interrupts.get(agent) ?? 0) < maxInterrupts
    if (interrupt) {
      interrupts.set(agent, (interrupts.get(agent) ?? 0) + 1)
      agent.followup(message)
      return
    }
    agent.inject(message)
  }

  async function review(agent: Agent, turn: number, signal: AbortSignal): Promise<void> {
    if (agent.session.header.origin === 'subagent' && !includeSubagents) return
    const transcript = boundTranscript(transcriptForTurn(agent.session, turn), maxTranscriptBytes)
    if (transcript.length === 0) return
    using callDeadline = deadline(signal, timeoutMs, 'OMP_ADVISOR_TIMEOUT')
    const options: GenerateOptions = {
      provider,
      model,
      system: ADVISOR_SYSTEM_PROMPT,
      messages: [createUserMessage({
        content: [{ type: 'text', text: transcript }],
        source: { kind: 'plugin', plugin: ADVISOR_PLUGIN },
      })],
      maxTokens: maxOutputTokens,
      sessionId: agent.session.id,
      signal: callDeadline.signal,
    }
    const assembler = new BlockAssembler()
    for await (const chunk of ctx.llm.stream(options)) {
      callDeadline.signal.throwIfAborted()
      assembler.push(chunk)
    }
    const finish = assembler.finish
    if (finish.kind === 'error' || finish.kind === 'aborted') {
      ctx.logger.warn(`omp-advisor: reviewer failed for agent "${agent.id}": ${finish.failure.message}`)
      return
    }
    const text = assembler.blocks()
      .filter((block): block is Extract<ContentBlock, { type: 'text' }> => block.type === 'text')
      .map(block => block.text)
      .join('')
    const parsed = parseAdvisorOutput(text)
    if (parsed === undefined) return
    if (ctx.agents.get(agent.id) !== agent) return
    deliver(agent, parsed, turnHasAdvisorNotice(agent.session, turn))
  }

  ctx.effect(function* () {
    const abort = new AbortController()
    ctx.on('session/event', (session: Session, event: SessionEvent) => {
      if (event.type !== 'turn/end' || event.data.reason.kind !== 'completed') return
      const agent = ctx.agents.get(session.id)
      if (agent === undefined || agent.session !== session) return
      const turn = event.data.turn
      const task = ((): Promise<void> => {
        try {
          return ctx.agents.withoutInitiator(async () => {
            try {
              await review(agent, turn, abort.signal)
            }
            catch (error: unknown) {
              if (abort.signal.aborted) return
              ctx.logger.warn(`omp-advisor: review failed for agent "${agent.id}": ${renderThrown(error)}`)
            }
          })
        }
        catch (error: unknown) {
          ctx.logger.warn(`omp-advisor: could not start review for agent "${agent.id}": ${renderThrown(error)}`)
          return Promise.resolve()
        }
      })()
      inflight.add(task)
      void task.finally(() => { inflight.delete(task) })
    })

    yield async () => {
      abort.abort()
      await Promise.allSettled([...inflight])
    }
  }, 'omp-advisor lifecycle')
}

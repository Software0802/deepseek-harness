/**
 * Model-facing `monitor` tool: spawn a background command, deliver each stdout
 * line as a plugin-sourced `user/message` follow-up (no poll call), and end the
 * watch when the process exits.
 * @module @deepseek-ai/dsh-tool-monitor
 */

import { createInterface } from 'node:readline'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-jobs'
import type { SubprocessOutcome } from '@deepseek-ai/dsh-subprocess'
import { boundContextSummary, createUserMessage } from '@deepseek-ai/dsh-llm'
import type { UserMessage } from '@deepseek-ai/dsh-llm'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { renderMonitorLine, MONITOR_PLUGIN } from './prompt.ts'

export { MONITOR_PLUGIN, parseMonitorLine, renderMonitorLine } from './prompt.ts'

declare module '@deepseek-ai/dsh-jobs' {
  interface JobKindMap {
    monitor: 'monitor'
  }
}

/** Cordis plugin name used by loader diagnostics and message `source.plugin`. */
export const name = MONITOR_PLUGIN
/** Services required by the monitor tool. */
export const inject = ['tools', 'subprocess', 'jobs']

/** Default terminate-escalation grace (ms). */
export const DEFAULT_GRACE_MS = 5_000
/** Default watch deadline (ms) when the call omits `timeout_ms` and is not persistent. */
export const DEFAULT_TIMEOUT_MS = 36_000_000

/** Plugin config: spawn grace and the default watch deadline. */
export interface Config {
  /** SIGTERM→SIGKILL grace for the managed process tree. */
  graceMs?: number
  /** Default watch deadline when `timeout_ms` is omitted and `persistent` is false. */
  timeoutMs?: number
}

/** Loader schema; `apply` re-checks positive integer bounds. */
export const Config: z<Config> = z.object({
  graceMs: z.number().default(DEFAULT_GRACE_MS),
  timeoutMs: z.number().default(DEFAULT_TIMEOUT_MS),
})

function assertPositiveInteger(field: string, value: number): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`tool-monitor: ${field} must be a positive integer`)
  }
}

function renderThrown(value: unknown): string {
  return value instanceof Error ? value.message : String(value)
}

/**
 * Build the plugin-sourced follow-up for one stdout line.
 * @param line - complete stdout line without the trailing newline.
 * @returns an identified user message.
 */
export function monitorFollowup(line: string): UserMessage {
  const content = renderMonitorLine(line)
  return createUserMessage({
    content,
    source: {
      kind: 'plugin',
      plugin: MONITOR_PLUGIN,
      form: 'notice',
      summary: boundContextSummary(line.length > 0 ? line : '(empty line)'),
    },
  })
}

function cwdOf(agent: Agent | undefined): string {
  const cwd = (agent?.options as { cwd?: string } | undefined)?.cwd
  return typeof cwd === 'string' && cwd.length > 0 ? cwd : process.cwd()
}

/**
 * Register `monitor`.
 * @param ctx - plugin context; registrations dispose with the fiber.
 * @param config - validated {@link Config}.
 */
export function apply(ctx: Context, config: Config): void {
  const graceMs = config.graceMs as number
  const defaultTimeoutMs = config.timeoutMs as number
  assertPositiveInteger('graceMs', graceMs)
  assertPositiveInteger('timeoutMs', defaultTimeoutMs)

  ctx.tools.register(defineTool({
    name: 'monitor',
    description: 'Start a background command and deliver each stdout line as a model-visible session input without polling. Process exit ends the watch. Stop a running watch with job_kill.',
    parameters: {
      command: { type: 'string', required: true, description: 'Executable to spawn (argv[0]); not a shell string.' },
      args: {
        type: 'array',
        items: { type: 'string' },
        description: 'Arguments after the executable.',
      },
      description: { type: 'string', required: true, description: 'Short human-readable description of what is being monitored.' },
      timeout_ms: { type: 'integer', description: 'Kill the watch after this deadline (ms).' },
      persistent: { type: 'boolean', description: 'Run until job_kill, owner disposal, or process exit, ignoring the default timeout.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          kind: { type: 'string', const: 'background', required: true },
          jobId: { type: 'string', required: true },
        },
      },
      render: (_args, value) => [{ type: 'text', text: `Started monitor job ${value.jobId}` }],
    },
    async execute(args, exec) {
      if (args.command.trim().length === 0) throw new Error('monitor: command must be a non-empty string')
      if (args.description.trim().length === 0) throw new Error('monitor: description must be a non-empty string')
      if (args.timeout_ms !== undefined) assertPositiveInteger('timeout_ms', args.timeout_ms)
      const agent = exec.agent
      if (agent === undefined) throw new Error('monitor requires an owning agent session')
      /* v8 ignore next 5 -- the registry rejects a pre-aborted invocation before execute */
      if (exec.signal.aborted) {
        const error = new Error('tool call aborted')
        error.name = 'AbortError'
        throw error
      }
      const exe = await ctx.subprocess.resolveExecutable(args.command, undefined, exec.signal)
      const timeoutMs = args.persistent === true
        ? undefined
        : args.timeout_ms ?? defaultTimeoutMs
      const controller = new AbortController()
      let timeout: ReturnType<typeof setTimeout> | undefined
      if (timeoutMs !== undefined) {
        timeout = setTimeout(() => { controller.abort() }, timeoutMs)
      }
      const jobId = ctx.jobs.start({
        kind: 'monitor',
        label: args.description,
        owner: agent,
        run: () => {
          const handle = ctx.subprocess.spawn({
            argv: [exe, ...args.args ?? []],
            cwd: cwdOf(agent),
            stdio: {
              stdin: 'ignore',
              stdout: 'pipe',
              stderr: { maxBytes: 64 * 1024 },
            },
            graceMs,
            signal: controller.signal,
          })
          const stdout = handle.stdout
          /* v8 ignore next 4 -- stdout: 'pipe' always exposes the readable */
          if (stdout === undefined) {
            handle.terminate()
            throw new Error('monitor: spawned process has no piped stdout')
          }
          const reader = createInterface({ input: stdout })
          reader.on('line', (line: string) => {
            try {
              agent.followup(monitorFollowup(line))
            } catch (error: unknown) {
              ctx.logger.warn(`tool-monitor: could not follow up stdout for job: ${renderThrown(error)}`)
            }
          })
          const settle = (): void => {
            reader.close()
            if (timeout !== undefined) clearTimeout(timeout)
          }
          return {
            cancel: () => {
              controller.abort()
              handle.terminate()
            },
            done: handle.done.then((outcome: SubprocessOutcome) => {
              settle()
              return {
                status: controller.signal.aborted ? 'killed' as const : 'completed' as const,
                detail: `exit code: ${String(outcome.exitCode)}`,
              }
            }),
          }
        },
      })
      return { kind: 'background' as const, jobId }
    },
    presentCall: args => ({ card: 'generic', title: 'Monitor', kind: 'other', rawInput: args.description }),
  }))
}

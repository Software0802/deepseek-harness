/**
 * Unstructured `/loop` grammar: status, stop, a count, or a duration.
 * @module @deepseek-ai/dsh-omp-loop
 */

/** Usage line shared by discovery hints and direct command errors. */
export const LOOP_USAGE = 'Usage: /loop [<count>|<duration>|stop] [prompt]'

/** Closed parse of one `/loop` suffix. */
export type LoopCommand =
  | { readonly kind: 'status' }
  | { readonly kind: 'stop' }
  | { readonly kind: 'invalid'; readonly message: string }
  | {
    readonly kind: 'start'
    readonly iterations: number | undefined
    readonly durationMs: number | undefined
    readonly prompt: string | undefined
  }

const DURATION = /^(\d+)(ms|s|m|h)$/iu
const COUNT = /^\d+$/u

/** Fail loudly if a locally closed union gains an unhandled member. */
/* v8 ignore start -- closed-union backstop is unreachable without violating the TypeScript contract */
function assertNever(value: never, label: string): never {
  throw new TypeError(`unknown ${label}: ${String(value)}`)
}
/* v8 ignore stop */

/**
 * Convert a `{count}{ms|s|m|h}` token into milliseconds.
 * @param count - non-negative integer already validated by the caller.
 * @param unit - duration unit from the command token.
 * @returns the equivalent millisecond duration.
 */
function durationMs(count: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case 'ms': return count
    case 's': return count * 1000
    case 'm': return count * 60_000
    case 'h': return count * 3_600_000
    /* v8 ignore next 2 -- DURATION's capture group is the closed unit set */
    default: return assertNever(unit as never, 'duration unit')
  }
}

/**
 * Parse only the grammar owned by `/loop`.
 * @param rawInput - exact text after the registered command name.
 * @returns a closed command; invalid input is a direct error, not a start.
 */
export function parseLoopCommand(rawInput: string): LoopCommand {
  const input = rawInput.trim()
  if (input.length === 0) return { kind: 'status' }
  const control = input.toLowerCase()
  if (control === 'stop') return { kind: 'stop' }
  const first = input.split(/\s+/u)[0]
  /* v8 ignore next -- trim() plus a non-empty input always yields a first token */
  if (first === undefined) return { kind: 'status' }
  const prompt = input.slice(first.length).trim()
  const promptText = prompt.length === 0 ? undefined : prompt
  if (first.toLowerCase() === 'stop') {
    return { kind: 'invalid', message: `stop must be the complete input.\n${LOOP_USAGE}` }
  }
  if (COUNT.test(first)) {
    const iterations = Number(first)
    if (!Number.isSafeInteger(iterations) || iterations < 1 || String(iterations) !== first) {
      return { kind: 'invalid', message: `iteration count must be a positive integer.\n${LOOP_USAGE}` }
    }
    return { kind: 'start', iterations, durationMs: undefined, prompt: promptText }
  }
  const duration = DURATION.exec(first)
  if (duration !== null) {
    const digits = duration[1]
    const unit = duration[2]
    /* v8 ignore start -- DURATION always captures both groups when it matches */
    if (digits === undefined || unit === undefined) {
      return { kind: 'invalid', message: `duration must be a positive integer with unit ms, s, m, or h.\n${LOOP_USAGE}` }
    }
    /* v8 ignore stop */
    const count = Number(digits)
    if (!Number.isSafeInteger(count) || count < 1 || String(count) !== digits) {
      return { kind: 'invalid', message: `duration must be a positive integer with unit ms, s, m, or h.\n${LOOP_USAGE}` }
    }
    return { kind: 'start', iterations: undefined, durationMs: durationMs(count, unit), prompt: promptText }
  }
  return { kind: 'invalid', message: `a count or duration is required.\n${LOOP_USAGE}` }
}

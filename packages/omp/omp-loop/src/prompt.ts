/**
 * Model-visible continuation prompt for one OMP-style count/duration loop.
 * @module @deepseek-ai/dsh-omp-loop
 */

import { boundContextSummary, type ContentBlock, type MessageSource } from '@deepseek-ai/dsh-llm'

/** Loader and `user/message` source plugin id for this continuation producer. */
export const LOOP_PLUGIN = 'omp-loop'

/** Header line that the invariant companion reconstructs from durable content. */
const HEADER = /^Loop iteration (\d+)\/(\d+)\.\nOriginal task:\n/u

/** Fields encoded in one loop continuation prompt. */
export interface LoopPromptParts {
  /** 1-based iteration about to run. */
  readonly iteration: number
  /** Inclusive iteration cap for this run. */
  readonly maxIterations: number
  /** Exact original task text, without the iteration wrapper. */
  readonly prompt: string
}

/**
 * Stamp one continuation as a plugin notice whose summary names the iteration.
 * @param parts - iteration identity shown in the collapsed transcript row.
 * @returns the merge-extensible plugin source for `createUserMessage`.
 */
export function loopMessageSource(parts: LoopPromptParts): MessageSource {
  return {
    kind: 'plugin',
    plugin: LOOP_PLUGIN,
    form: 'notice',
    summary: boundContextSummary(`loop ${parts.iteration}/${parts.maxIterations}`),
  }
}

/**
 * Render the complete loop-iteration instruction retained in session history.
 * @param parts - iteration identity plus the original task text.
 * @returns a fresh one-block prompt for `Agent.followup()`.
 */
export function renderLoopPrompt(parts: LoopPromptParts): ContentBlock[] {
  return [{
    type: 'text',
    text: `Loop iteration ${parts.iteration}/${parts.maxIterations}.\nOriginal task:\n${parts.prompt}`,
  }]
}

/**
 * Recover the renderer inputs from one admitted continuation body.
 * @param content - durable `user/message` content to decode.
 * @returns the parts when the body is exactly one renderer-owned text block.
 */
export function parseLoopPrompt(content: ContentBlock[]): LoopPromptParts | undefined {
  if (content.length !== 1) return undefined
  const block = content[0]
  if (block === undefined || block.type !== 'text') return undefined
  const match = HEADER.exec(block.text)
  if (match === null || match.index !== 0) return undefined
  const iteration = Number(match[1])
  const maxIterations = Number(match[2])
  const prompt = block.text.slice(match[0].length)
  if (!Number.isInteger(iteration) || !Number.isInteger(maxIterations) || prompt.length === 0) {
    return undefined
  }
  return { iteration, maxIterations, prompt }
}

/**
 * Renderer-owned monitor follow-up text. The invariant round-trips this format.
 * @module @deepseek-ai/dsh-tool-monitor/prompt
 */

import type { ContentBlock } from '@deepseek-ai/dsh-llm'

/** Cordis plugin name and `source.plugin` id for monitor follow-ups. */
export const MONITOR_PLUGIN = 'tool-monitor'

const PREFIX = 'monitor: '

/**
 * Render one stdout line as the model-visible follow-up body.
 * @param line - complete stdout line without the trailing newline.
 * @returns a single text block.
 */
export function renderMonitorLine(line: string): [Extract<ContentBlock, { type: 'text' }>] {
  return [{ type: 'text', text: `${PREFIX}${line}` }]
}

/**
 * Parse renderer-owned monitor follow-up content.
 * @param content - user-message blocks.
 * @returns the original stdout line, or `undefined` when the content is not owned by this renderer.
 */
export function parseMonitorLine(content: readonly ContentBlock[]): string | undefined {
  if (content.length !== 1) return undefined
  const block = content[0]
  if (block === undefined || block.type !== 'text' || !block.text.startsWith(PREFIX)) return undefined
  return block.text.slice(PREFIX.length)
}

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import {
  LlmAdapter,
  ReasoningEffortId,
  type GenerateOptions,
  type LlmResolvedModelInfo,
  type StreamChunk,
} from '@deepseek-ai/dsh-llm'

const OFF = ReasoningEffortId('off')

/** Keyless grok-layer adapter: records model-visible tool names, then replies with text. */
class GrokMockAdapter extends LlmAdapter {
  override async resolveModel(provider: string, model: string): Promise<LlmResolvedModelInfo> {
    return {
      provider,
      id: model,
      name: model,
      reasoning: {
        efforts: [{ id: OFF, name: 'Off' }],
        defaultEffort: OFF,
      },
    }
  }

  async * stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    const names = (options.tools ?? []).map(tool => tool.name)
    writeFileSync(join(process.cwd(), 'model-tools.json'), `${JSON.stringify(names, null, 2)}\n`)
    const reply = 'GROK_LAYER_READY'
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: reply }
    yield { type: 'block-end', index: 0, block: { type: 'text', text: reply } }
    yield { type: 'usage', usage: { inputTokens: 8, outputTokens: 3 } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

export const name = 'grok-mock-llm'
export const inject = ['llm']

/** Register the keyless `grok-mock` adapter. */
export function apply(ctx: Context): void {
  ctx.llm.registerAdapter(['grok-mock'], new GrokMockAdapter())
}

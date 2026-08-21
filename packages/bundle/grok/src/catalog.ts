/**
 * Frozen mapping from first-party Grok Build names to DeepSeek Harness packages.
 * Official packages are composed by reference; this library does not copy them.
 * @module @deepseek-ai/dsh-grok
 */

/** Which layer currently mounts the mapped package. */
export type GrokCatalogMount = 'dsh-base' | 'dsh-grok' | 'opt-in'

/** Whether the mapped package already ships in DeepSeek Harness. */
export type GrokCatalogOrigin = 'dsh-official' | 'grok-library'

/** One Grok Build name and the dsh package that implements it. */
export interface GrokCatalogEntry {
  /** Grok Build tool, command, or product surface name. */
  readonly grokName: string
  /** Workspace package that owns the behavior. */
  readonly dshPackage: `@deepseek-ai/${string}`
  /** Whether this repository already shipped the package. */
  readonly origin: GrokCatalogOrigin
  /** One-line role of the mapped package. */
  readonly role: string
  /** Profile layer that currently mounts the package, or opt-in composition. */
  readonly mountedBy: GrokCatalogMount
}

/**
 * Catalog of Grok Build capabilities expressed as dsh plugins.
 * `dsh-official` rows are composed from the existing packages; they are not forked copies.
 */
export const GROK_PLUGIN_CATALOG: readonly GrokCatalogEntry[] = [
  {
    grokName: 'read_file',
    dshPackage: '@deepseek-ai/dsh-tool-fs',
    origin: 'dsh-official',
    role: 'model-facing file read (dsh tool name: read)',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'write',
    dshPackage: '@deepseek-ai/dsh-tool-fs',
    origin: 'dsh-official',
    role: 'model-facing file write',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'search_replace',
    dshPackage: '@deepseek-ai/dsh-tool-fs',
    origin: 'dsh-official',
    role: 'model-facing file edit (dsh tool name: edit)',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'search_replace',
    dshPackage: '@deepseek-ai/dsh-tool-str-replace-editor',
    origin: 'dsh-official',
    role: 'literal replace and line insert over ctx.fs',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'list_dir',
    dshPackage: '@deepseek-ai/dsh-tool-fs-search',
    origin: 'dsh-official',
    role: 'path discovery (dsh tool name: glob)',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'grep',
    dshPackage: '@deepseek-ai/dsh-tool-fs-search',
    origin: 'dsh-official',
    role: 'model-facing content search',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'bash',
    dshPackage: '@deepseek-ai/dsh-tool-bash',
    origin: 'dsh-official',
    role: 'model-facing shell execution',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'web_search',
    dshPackage: '@deepseek-ai/dsh-tool-web',
    origin: 'dsh-official',
    role: 'model-facing web search',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'web_fetch',
    dshPackage: '@deepseek-ai/dsh-tool-web',
    origin: 'dsh-official',
    role: 'model-facing web fetch',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'lsp',
    dshPackage: '@deepseek-ai/dsh-tool-lsp',
    origin: 'dsh-official',
    role: 'model-facing language-server queries',
    mountedBy: 'opt-in',
  },
  {
    grokName: 'todo_write',
    dshPackage: '@deepseek-ai/dsh-tool-todo',
    origin: 'dsh-official',
    role: 'model-facing whole-list todos',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'ask_user_question',
    dshPackage: '@deepseek-ai/dsh-tool-ask-user',
    origin: 'dsh-official',
    role: 'model-facing user questions',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'enter_plan_mode',
    dshPackage: '@deepseek-ai/dsh-plan-mode',
    origin: 'dsh-official',
    role: 'plan-mode entry via /plan',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'exit_plan_mode',
    dshPackage: '@deepseek-ai/dsh-plan-mode',
    origin: 'dsh-official',
    role: 'user-reviewed plan-mode exit tool',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'task',
    dshPackage: '@deepseek-ai/dsh-tool-subagent',
    origin: 'dsh-official',
    role: 'model-facing subagent delegation',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'task_output',
    dshPackage: '@deepseek-ai/dsh-tool-jobs',
    origin: 'dsh-official',
    role: 'background job output (dsh tool name: job_output)',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'kill_task',
    dshPackage: '@deepseek-ai/dsh-tool-jobs',
    origin: 'dsh-official',
    role: 'background job kill (dsh tool name: job_kill)',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'kill_task',
    dshPackage: '@deepseek-ai/dsh-tool-subagent-control',
    origin: 'dsh-official',
    role: 'continuable subagent interrupt',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'scheduler',
    dshPackage: '@deepseek-ai/dsh-schedule',
    origin: 'dsh-official',
    role: 'session-local scheduled follow-ups',
    mountedBy: 'opt-in',
  },
  {
    grokName: 'workflow',
    dshPackage: '@deepseek-ai/dsh-tool-workflow',
    origin: 'dsh-official',
    role: 'model-facing workflow tool',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'update_goal',
    dshPackage: '@deepseek-ai/dsh-tool-goal',
    origin: 'dsh-official',
    role: 'model-facing same-session goals',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'skill',
    dshPackage: '@deepseek-ai/dsh-skill',
    origin: 'dsh-official',
    role: 'skill provider registry',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'skill',
    dshPackage: '@deepseek-ai/dsh-tool-skill',
    origin: 'dsh-official',
    role: 'model-facing skill catalog and loader',
    mountedBy: 'dsh-base',
  },
  {
    grokName: 'mcp',
    dshPackage: '@deepseek-ai/dsh-mcp-client',
    origin: 'dsh-official',
    role: 'MCP server tools on ctx.tools',
    mountedBy: 'opt-in',
  },
  {
    grokName: 'hooks',
    dshPackage: '@deepseek-ai/dsh-hooks-claude-code',
    origin: 'dsh-official',
    role: 'Claude Code hook bridge',
    mountedBy: 'opt-in',
  },
  {
    grokName: 'hooks',
    dshPackage: '@deepseek-ai/dsh-hooks-codex',
    origin: 'dsh-official',
    role: 'Codex hook bridge',
    mountedBy: 'opt-in',
  },
  {
    grokName: 'acp',
    dshPackage: '@deepseek-ai/dsh-acp',
    origin: 'dsh-official',
    role: 'automation-only Agent Client Protocol server',
    mountedBy: 'opt-in',
  },
  {
    grokName: 'headless',
    dshPackage: '@deepseek-ai/dsh-headless',
    origin: 'dsh-official',
    role: 'one-shot headless profile bundle',
    mountedBy: 'opt-in',
  },
  {
    grokName: 'image_gen',
    dshPackage: '@deepseek-ai/dsh-tool-imagine',
    origin: 'grok-library',
    role: 'xAI Imagine text-to-image',
    mountedBy: 'dsh-grok',
  },
  {
    grokName: 'image_edit',
    dshPackage: '@deepseek-ai/dsh-tool-imagine',
    origin: 'grok-library',
    role: 'xAI Imagine image edit',
    mountedBy: 'dsh-grok',
  },
  {
    grokName: 'image_to_video',
    dshPackage: '@deepseek-ai/dsh-tool-imagine',
    origin: 'grok-library',
    role: 'xAI Imagine image-to-video',
    mountedBy: 'dsh-grok',
  },
  {
    grokName: 'reference_to_video',
    dshPackage: '@deepseek-ai/dsh-tool-imagine',
    origin: 'grok-library',
    role: 'xAI Imagine reference-to-video',
    mountedBy: 'dsh-grok',
  },
  {
    grokName: 'monitor',
    dshPackage: '@deepseek-ai/dsh-tool-monitor',
    origin: 'grok-library',
    role: 'background command with per-line session follow-up',
    mountedBy: 'dsh-grok',
  },
]

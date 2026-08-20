/**
 * Frozen mapping from Oh My Pi extension names to DeepSeek Harness packages.
 * Official packages are composed by reference; this library does not copy them.
 * @module @deepseek-ai/dsh-omp
 */

/** Which layer currently mounts the mapped package. */
export type OmpCatalogMount = 'dsh-base' | 'dsh-omp' | 'opt-in'

/** Whether the mapped package already ships in DeepSeek Harness. */
export type OmpCatalogOrigin = 'dsh-official' | 'omp-library'

/** One OMP-named extension and the dsh package that implements it. */
export interface OmpCatalogEntry {
  /** OMP feature or plugin name. */
  readonly ompName: string
  /** Workspace package that owns the behavior. */
  readonly dshPackage: `@deepseek-ai/${string}`
  /** Whether this repository already shipped the package. */
  readonly origin: OmpCatalogOrigin
  /** One-line role of the mapped package. */
  readonly role: string
  /** Profile layer that currently mounts the package, or opt-in composition. */
  readonly mountedBy: OmpCatalogMount
}

/**
 * Catalog of OMP extensions expressed as dsh plugins.
 * `dsh-official` rows are composed from the existing packages; they are not forked copies.
 */
export const OMP_PLUGIN_CATALOG: readonly OmpCatalogEntry[] = [
  {
    ompName: 'goal',
    dshPackage: '@deepseek-ai/dsh-goal',
    origin: 'dsh-official',
    role: 'same-session objective state',
    mountedBy: 'dsh-base',
  },
  {
    ompName: 'goal',
    dshPackage: '@deepseek-ai/dsh-goal-round-driver',
    origin: 'dsh-official',
    role: 'same-session goal continuation',
    mountedBy: 'dsh-base',
  },
  {
    ompName: 'goal',
    dshPackage: '@deepseek-ai/dsh-tool-goal',
    origin: 'dsh-official',
    role: 'model-facing goal tools',
    mountedBy: 'dsh-base',
  },
  {
    ompName: 'goal',
    dshPackage: '@deepseek-ai/dsh-command-goal',
    origin: 'dsh-official',
    role: 'human /goal command',
    mountedBy: 'dsh-base',
  },
  {
    ompName: 'loop',
    dshPackage: '@deepseek-ai/dsh-omp-loop',
    origin: 'omp-library',
    role: 'count or duration prompt repeat',
    mountedBy: 'dsh-omp',
  },
  {
    ompName: 'advisor',
    dshPackage: '@deepseek-ai/dsh-omp-advisor',
    origin: 'omp-library',
    role: 'second-model turn reviewer',
    mountedBy: 'dsh-omp',
  },
  {
    ompName: 'advisory-repeat',
    dshPackage: '@deepseek-ai/dsh-repeat-tool-reminder',
    origin: 'dsh-official',
    role: 'advisory identical-tool-call reminders',
    mountedBy: 'dsh-base',
  },
  {
    ompName: 'ralph',
    dshPackage: '@deepseek-ai/dsh-tool-ralph',
    origin: 'dsh-official',
    role: 'fixed fresh-agent Ralph workflow',
    mountedBy: 'dsh-base',
  },
  {
    ompName: 'plan',
    dshPackage: '@deepseek-ai/dsh-plan-mode',
    origin: 'dsh-official',
    role: 'plan collaboration state',
    mountedBy: 'dsh-base',
  },
  {
    ompName: 'schedule',
    dshPackage: '@deepseek-ai/dsh-schedule',
    origin: 'dsh-official',
    role: 'session-local scheduled follow-ups',
    mountedBy: 'opt-in',
  },
  {
    ompName: 'skill',
    dshPackage: '@deepseek-ai/dsh-skill',
    origin: 'dsh-official',
    role: 'skill provider registry',
    mountedBy: 'dsh-base',
  },
  {
    ompName: 'skill',
    dshPackage: '@deepseek-ai/dsh-tool-skill',
    origin: 'dsh-official',
    role: 'model-facing skill catalog and loader',
    mountedBy: 'dsh-base',
  },
  {
    ompName: 'hooks',
    dshPackage: '@deepseek-ai/dsh-hooks-claude-code',
    origin: 'dsh-official',
    role: 'Claude Code hook bridge',
    mountedBy: 'opt-in',
  },
  {
    ompName: 'hooks',
    dshPackage: '@deepseek-ai/dsh-hooks-codex',
    origin: 'dsh-official',
    role: 'Codex hook bridge',
    mountedBy: 'opt-in',
  },
]

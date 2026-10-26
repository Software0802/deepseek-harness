/**
 * `ctx.vflowTeamSettings`: loads the team settings document from its published
 * source, keeps the adopted version on disk, and holds newer published versions
 * until the user accepts them.
 *
 * @module
 */

import { readFile } from 'node:fs/promises'
import { isAbsolute } from 'node:path'
import { Service } from '@deepseek-ai/cordis'
import type { Context, Volatile } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { writeFileAtomic } from '@deepseek-ai/dsh-atomic-write'
import { parseTeamSettings } from './team-settings.ts'
import type { ParsedTeamSettings } from './team-settings.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    vflowTeamSettings: TeamSettingsService
  }
}

/** Team settings loader configuration. */
export interface TeamSettingsConfig {
  /** `http(s)://` address or absolute file path of the published document; empty when not configured yet. Editable live. */
  source: Volatile<string>
  /** Absolute path of the adopted copy. */
  stateFile: string
  /** Time limit for one fetch of `source`. */
  fetchTimeoutMs: number
}

/** Schemastery schema for {@link TeamSettingsConfig}. */
export const TeamSettingsConfig = z.object({
  source: z.string().default('').description('`http(s)://` address or absolute path of the published team settings file.').volatile(),
  stateFile: z.string().required().description('Absolute path of the adopted team settings copy.'),
  fetchTimeoutMs: z.natural().min(1).default(10_000).description('Time limit for one fetch of the source, in milliseconds.'),
})

/**
 * Loader state. `unconfigured`: no source and no adopted copy. `ready`: an
 * adopted version is in use; `pending` holds a newer published version that
 * waits for {@link TeamSettingsService.accept}. `failed`: no usable version.
 */
export type TeamSettingsState =
  | { readonly status: 'unconfigured' }
  | {
    readonly status: 'ready'
    readonly current: ParsedTeamSettings
    readonly pending?: ParsedTeamSettings
    /** Why the last source check failed, while the adopted copy stays in use. */
    readonly sourceError?: Error
  }
  | { readonly status: 'failed'; readonly error: Error }

/**
 * Owner of the adopted team settings version. Its configuration arrives
 * parsed by the owning plugin's Config, which creates the `source` reference.
 */
export class TeamSettingsService extends Service {
  private state: TeamSettingsState = { status: 'unconfigured' }

  /**
   * @param ctx - plugin context.
   * @param config - validated loader configuration.
   */
  constructor(ctx: Context, private readonly config: TeamSettingsConfig) {
    super(ctx, 'vflowTeamSettings')
    if (!isAbsolute(config.stateFile)) {
      throw new Error(`vflow team settings: stateFile must be an absolute path, got "${config.stateFile}"`)
    }
  }

  /** Read the adopted copy, then check the source once. */
  protected async [Service.init](): Promise<void> {
    await this.refresh()
  }

  /**
   * Current loader state.
   * @returns the latest state snapshot.
   */
  snapshot(): TeamSettingsState {
    return this.state
  }

  /**
   * Configured source address, read at the time of the call.
   * @returns the address, empty while unset.
   */
  source(): string {
    return this.config.source.get()
  }

  /**
   * Re-read the adopted copy and fetch the source. A first published version is
   * adopted directly; a later different version becomes `pending`. A source that
   * is neither an http(s) address nor an absolute path counts as a failed check.
   * @returns the state after the check.
   */
  async refresh(): Promise<TeamSettingsState> {
    let current: ParsedTeamSettings | undefined
    try {
      current = await this.readAdopted()
    } catch (error) {
      this.state = { status: 'failed', error: error as Error }
      return this.state
    }
    const source = this.source()
    if (source === '') {
      this.state = current === undefined ? { status: 'unconfigured' } : { status: 'ready', current }
      return this.state
    }
    let published: ParsedTeamSettings
    try {
      published = parseTeamSettings(await this.fetchSource(source))
    } catch (error) {
      this.state = current === undefined
        ? { status: 'failed', error: error as Error }
        : { status: 'ready', current, sourceError: error as Error }
      return this.state
    }
    if (current === undefined) {
      await this.adopt(published)
      this.state = { status: 'ready', current: published }
    } else if (current.sha256 === published.sha256) {
      this.state = { status: 'ready', current }
    } else {
      this.state = { status: 'ready', current, pending: published }
    }
    return this.state
  }

  /**
   * Adopt the pending version the user reviewed.
   * @param sha256 - hash of the version shown to the user; guards against a newer version arriving in between.
   * @returns the state after adoption.
   * @throws Error when no pending version has this hash.
   */
  async accept(sha256: string): Promise<TeamSettingsState> {
    const state = this.state
    if (state.status !== 'ready' || state.pending?.sha256 !== sha256) {
      throw new Error(`vflow team settings: no pending version ${sha256}`)
    }
    await this.adopt(state.pending)
    this.state = { status: 'ready', current: state.pending }
    return this.state
  }

  /** Read and validate the adopted copy; `undefined` when none exists yet. */
  private async readAdopted(): Promise<ParsedTeamSettings | undefined> {
    let text: string
    try {
      text = await readFile(this.config.stateFile, 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
      throw error
    }
    try {
      return parseTeamSettings(text)
    } catch (error) {
      throw new Error(`vflow team settings: adopted copy ${this.config.stateFile} is invalid`, { cause: error })
    }
  }

  /** Fetch the published document text. */
  private async fetchSource(source: string): Promise<string> {
    if (!isRemote(source)) {
      if (!isAbsolute(source)) {
        throw new Error(`vflow team settings: source must be an http(s) address or an absolute path, got "${source}"`)
      }
      return readFile(source, 'utf8')
    }
    const response = await fetch(source, { signal: AbortSignal.timeout(this.config.fetchTimeoutMs) })
    if (!response.ok) {
      throw new Error(`vflow team settings: ${source} answered HTTP ${response.status}`)
    }
    return response.text()
  }

  /** Persist one version as the adopted copy, byte for byte. */
  private async adopt(version: ParsedTeamSettings): Promise<void> {
    await writeFileAtomic(this.config.stateFile, version.text, { mode: 0o600, dirMode: 0o700 })
  }
}

/** Whether a source names an HTTP(S) address. */
function isRemote(source: string): boolean {
  return /^https?:\/\//i.test(source)
}

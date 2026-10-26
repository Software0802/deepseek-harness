/**
 * vflow skill pack: a filesystem skill provider over the skills shipped in this package.
 *
 * The provider scans only the package's own `skills/` directory, so it adds the
 * vflow catalog without changing project or user skill discovery. Project and
 * user skills with the same name take precedence through the shared registry.
 *
 * @module @deepseek-ai/dsh-experimental-vflow-skills
 */

import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type Schema from '@deepseek-ai/schemastery'
import * as SkillFileSystem from '@deepseek-ai/dsh-skill-filesystem'
import { TeamSettingsConfig, TeamSettingsService } from './team-settings-service.ts'
import { AccountsConfig, AccountsService } from './accounts.ts'

export * from './team-settings.ts'
export * from './team-settings-service.ts'
export * from './accounts.ts'

/** Cordis plugin name. */
export const name = 'vflow-skills'
/** The skill registry that receives the vflow provider. */
export const inject = ['skills']

/** Absolute path of the skill directory shipped with this package. */
export const VFLOW_SKILL_DIR: string = fileURLToPath(new URL('../skills', import.meta.url))

/** vflow skill pack configuration. */
export interface Config {
  /** Unique provider name registered on `ctx.skills`. */
  providerName: string
  /** Where the team settings document is published and adopted. */
  teamSettings: TeamSettingsConfig
  /** Connection test limits for the user's connector accounts. */
  accounts: AccountsConfig
}

export const Config: Schema<Config> = z.object({
  providerName: z.string().min(1).default('vflow').description('Unique provider name registered on `ctx.skills`.'),
  teamSettings: TeamSettingsConfig,
  accounts: AccountsConfig,
})

/**
 * Mount a filesystem skill provider that scans only {@link VFLOW_SKILL_DIR},
 * the team settings loader, and the connector account store.
 * @param ctx - context carrying the skill registry.
 * @param config - validated provider name, team settings location, and account test limits.
 */
export function apply(ctx: Context, config: Config): void {
  ctx.plugin(SkillFileSystem, {
    providerName: config.providerName,
    includeDefaultRoots: false,
    bundledSkillDir: VFLOW_SKILL_DIR,
    watch: false,
  })
  ctx.plugin(TeamSettingsService, config.teamSettings)
  ctx.plugin(AccountsService, config.accounts)
}

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
import { apply as applySkillFileSystem, inject as skillFileSystemInject, name as skillFileSystemName } from '@deepseek-ai/dsh-skill-filesystem'
import { TeamSettingsConfig, TeamSettingsService } from './team-settings-service.ts'
import { AccountsConfig, AccountsService } from './accounts.ts'
import { VflowController } from './controller.ts'
import { FleetConfig, FleetService } from './fleet.ts'
import type {} from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/cordis-plugin-loader'

export * from './team-settings.ts'
export * from './team-settings-service.ts'
export * from './accounts.ts'
export * from './controller.ts'
export * from './fleet.ts'
export { fleetProjectionDefinition, applyFleetEvent, FLEET_TEXT_LIMITS } from './fleet-log.ts'
export type * from './fleet-log.ts'
export { V_MODEL_NODES } from './types.ts'
export type * from './types.ts'

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
  /** Fleet capacity, child provider, and worktree branch naming. */
  fleet: FleetConfig
}

export const Config = z.object({
  providerName: z.string().min(1).default('vflow').description('Unique provider name registered on `ctx.skills`.'),
  teamSettings: TeamSettingsConfig,
  accounts: AccountsConfig,
  fleet: FleetConfig,
})

/**
 * Mount a filesystem skill provider that scans only {@link VFLOW_SKILL_DIR},
 * the team settings loader, the connector account store, the settings
 * page controller, and the fleet. Saving a new team settings source on the settings page
 * checks it at once.
 * @param ctx - context carrying the skill registry.
 * @param config - validated provider name, team settings location, and account test limits.
 */
export function apply(ctx: Context, config: Config): void {
  ctx.plugin({ name: skillFileSystemName, inject: skillFileSystemInject, apply: applySkillFileSystem }, {
    providerName: config.providerName,
    includeDefaultRoots: false,
    bundledSkillDir: VFLOW_SKILL_DIR,
    watch: false,
  })
  ctx.plugin(TeamSettingsService, config.teamSettings)
  ctx.plugin(AccountsService, config.accounts)
  ctx.plugin(VflowController)
  ctx.plugin(FleetService, config.fleet)
  // The Loader notifies only this plugin's own Context, so the listener lives here and reaches the service through `active`.
  let active: TeamSettingsService | undefined
  ctx.inject(['vflowTeamSettings'], (child) => {
    active = child.vflowTeamSettings
    child.effect(() => () => { active = undefined })
  })
  ctx.on('loader/volatile-update', (paths) => {
    if (!paths.some(path => path[0] === 'teamSettings' && path[1] === 'source')) return
    active?.refresh().catch((error: unknown) => { ctx.logger.warn(error) })
  })
  // The plugin page ships its own settings page instead of a generated form.
  ctx.inject(['settings'], (child) => { child.effect(() => child.settings.configure({ auto: false }, ctx.fiber)) })
}

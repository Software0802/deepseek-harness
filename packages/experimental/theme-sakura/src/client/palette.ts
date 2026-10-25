/**
 * Sakura palette as ui-theme override tokens. The base stylesheets resolve
 * every alias token through two static ramps declared on `body`: the
 * `neutral-bluish` surface/text ramp and the `deepseek` accent ramp. Inline
 * values for those ramps re-tint every alias that references them, so the
 * palette replaces the ramps step for step (light end first) and adds only the
 * aliases that hold literal colors or need more contrast than the ramp gives.
 */
import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client'

/** One static ramp step, lightest first: step suffix, light value, dark value. */
type RampStep = readonly [step: string, light: string, dark: string]

/** Warm blossom-white surfaces with plum ink (light) and a lavender night ramp (dark): step, light, dark. */
const NEUTRAL: readonly RampStep[] = [
  ['00', 'rgb(255, 252, 253)', 'rgb(255, 255, 255)'],
  ['50', 'rgb(255, 245, 248)', 'rgb(244, 230, 238)'],
  ['55', 'rgb(254, 242, 246)', 'rgb(238, 221, 231)'],
  ['60', 'rgb(253, 240, 244)', 'rgb(234, 216, 227)'],
  ['75', 'rgb(251, 234, 240)', 'rgb(226, 206, 219)'],
  ['90', 'rgb(248, 228, 236)', 'rgb(220, 199, 213)'],
  ['100', 'rgb(245, 222, 231)', 'rgb(214, 192, 207)'],
  ['150', 'rgb(242, 216, 226)', 'rgb(205, 182, 198)'],
  ['200', 'rgb(235, 207, 219)', 'rgb(194, 170, 188)'],
  ['300', 'rgb(220, 195, 206)', 'rgb(180, 163, 184)'],
  ['310', 'rgb(215, 192, 203)', 'rgb(174, 157, 178)'],
  ['400', 'rgb(185, 165, 176)', 'rgb(156, 139, 163)'],
  ['500', 'rgb(160, 140, 152)', 'rgb(133, 117, 140)'],
  ['600', 'rgb(133, 114, 126)', 'rgb(110, 96, 118)'],
  ['700', 'rgb(106, 88, 101)', 'rgb(78, 68, 89)'],
  ['750', 'rgb(88, 70, 82)', 'rgb(67, 58, 77)'],
  ['800', 'rgb(74, 57, 68)', 'rgb(58, 50, 68)'],
  ['850', 'rgb(64, 48, 58)', 'rgb(48, 42, 58)'],
  ['875', 'rgb(57, 42, 52)', 'rgb(42, 36, 51)'],
  ['900', 'rgb(52, 37, 47)', 'rgb(34, 29, 43)'],
  ['950', 'rgb(46, 32, 42)', 'rgb(28, 24, 36)'],
  ['1000', 'rgb(40, 26, 36)', 'rgb(21, 18, 27)'],
]

/** Cherry-blossom accent ramp; the dark column lifts the steps dark mode uses for accents. */
const ACCENT: readonly RampStep[] = [
  ['50', 'rgb(255, 240, 245)', 'rgb(255, 240, 245)'],
  ['100', 'rgb(255, 225, 236)', 'rgb(255, 225, 236)'],
  ['200', 'rgb(255, 204, 221)', 'rgb(255, 204, 221)'],
  ['300', 'rgb(255, 175, 201)', 'rgb(250, 190, 214)'],
  ['400', 'rgb(246, 138, 176)', 'rgb(245, 163, 199)'],
  ['450', 'rgb(238, 111, 158)', 'rgb(242, 141, 185)'],
  ['500', 'rgb(224, 85, 138)', 'rgb(232, 121, 168)'],
  ['600', 'rgb(194, 64, 111)', 'rgb(194, 64, 111)'],
  ['700-delete', 'rgb(158, 49, 89)', 'rgb(158, 49, 89)'],
  ['800', 'rgb(107, 46, 69)', 'rgb(90, 51, 73)'],
  ['900', 'rgb(74, 34, 51)', 'rgb(64, 38, 54)'],
]

/** Aliases with literal colors in the base sheets, plus link and bluish text that need the ramp's darker steps for contrast. */
const ALIASES: ThemeTokenOverrides = {
  '--dsw-alias-link': { light: 'rgb(194, 64, 111)', dark: 'rgb(245, 163, 199)' },
  '--dsw-alias-label-primary-bluish': { light: 'rgb(74, 34, 56)', dark: 'rgb(244, 230, 238)' },
  '--dsw-alias-bg-document-selection': { light: 'rgba(224, 85, 138, 0.28)', dark: 'rgba(245, 163, 199, 0.32)' },
  '--dsw-alias-brand-primary-new-colorprimary-new-color': { light: 'rgb(224, 85, 138)', dark: 'rgb(242, 141, 185)' },
  '--dsw-alias-interactive-bg-hover': { light: 'rgba(122, 46, 86, 0.06)', dark: 'rgba(255, 228, 240, 0.08)' },
  '--dsw-alias-interactive-bg-active': { light: 'rgba(122, 46, 86, 0.1)', dark: 'rgba(255, 228, 240, 0.14)' },
  '--dsw-alias-interactive-bg-hover-accent': { light: 'rgba(122, 46, 86, 0.14)', dark: 'rgba(255, 228, 240, 0.24)' },
  '--dsw-alias-border-l1': { light: 'rgba(122, 46, 86, 0.06)', dark: 'rgba(255, 228, 240, 0.06)' },
  '--dsw-alias-border-l2': { light: 'rgba(122, 46, 86, 0.12)', dark: 'rgba(255, 228, 240, 0.12)' },
  '--dsw-alias-border-l3': { light: 'rgba(122, 46, 86, 0.14)', dark: 'rgba(255, 228, 240, 0.16)' },
  '--dsw-alias-border-l4': { light: 'rgba(122, 46, 86, 0.18)', dark: 'rgba(255, 228, 240, 0.2)' },
  '--dsw-menu-surface-fill': { light: 'rgba(255, 245, 248, 0.6)', dark: 'rgba(67, 58, 77, 0.48)' },
  '--dsw-specific-menu': { light: 'rgba(255, 245, 248, 0.94)', dark: 'rgba(48, 42, 58, 0.94)' },
  '--dsw-alias-menu-group-header-fill': { light: 'rgba(255, 245, 248, 0.94)', dark: 'rgba(48, 42, 58, 0.94)' },
  '--dsw-specific-bubble': { light: 'rgb(255, 236, 243)', dark: 'rgb(58, 44, 64)' },
  '--dsw-specific-bubble-highlight': { light: 'rgb(255, 214, 229)', dark: 'rgb(78, 58, 86)' },
  '--dsw-specific-sidebar-nav-item-active-accent': { light: 'rgb(255, 225, 236)', dark: 'rgb(78, 58, 86)' },
}

/** Rounder corners than the base scale (4/8/12/16/20/28 px); both schemes share them. */
const RADII: ThemeTokenOverrides = Object.fromEntries(
  ([['xs', '6px'], ['sm', '10px'], ['md', '14px'], ['lg', '18px'], ['xl', '22px'], ['panel', '30px']] as const)
    .map(([step, px]) => [`--dsw-radius-${step}`, { light: px, dark: px }]),
)

/**
 * Map one static ramp to override tokens.
 * @param prefix - CSS custom property prefix ending in `-`.
 * @param steps - ramp steps, lightest first.
 * @returns override tokens for every step.
 */
function ramp(prefix: string, steps: readonly RampStep[]): ThemeTokenOverrides {
  return Object.fromEntries(steps.map(([step, light, dark]) => [`${prefix}${step}`, { light, dark }]))
}

/** Every override the Sakura theme applies, keyed by CSS custom property. */
export const SAKURA_TOKENS: ThemeTokenOverrides = Object.freeze({
  ...ramp('--dsw-static-neutral-bluish-', NEUTRAL),
  ...ramp('--dsw-static-deepseek-', ACCENT),
  ...ALIASES,
  ...RADII,
})

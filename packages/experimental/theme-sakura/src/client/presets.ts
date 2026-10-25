/**
 * Character presets as ui-theme override tokens. The base stylesheets resolve
 * every alias token through two static ramps declared on `body`: the
 * `neutral-bluish` surface/text ramp and the `deepseek` accent ramp. Each
 * preset regenerates both ramps on the stock lightness curve with its own hue
 * and chroma, overrides the aliases that hold literal colors, and adds the
 * `--sakura-*` decoration variables `decor.css` reads. Character colors follow
 * the Doki Theme definitions (MIT, Copyright (c) 2022 Alex Simons); the
 * character art belongs to its rights holders.
 */
import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client'
import { css, type Oklch } from './color.ts'
import artAsuna from './assets/art-asuna.webp'
import artEmiliaDark from './assets/art-emilia-dark.webp'
import artEmiliaLight from './assets/art-emilia-light.webp'
import artMai from './assets/art-mai.webp'
import artZeroTwo from './assets/art-zero-two.webp'
import stickerAsunaDark from './assets/sticker-asuna-dark.webp'
import stickerAsunaLight from './assets/sticker-asuna-light.webp'
import stickerEmiliaDark from './assets/sticker-emilia-dark.webp'
import stickerEmiliaLight from './assets/sticker-emilia-light.webp'
import stickerMai from './assets/sticker-mai.webp'
import stickerZeroTwoDark from './assets/sticker-zero-two-dark.webp'
import stickerZeroTwoLight from './assets/sticker-zero-two-light.webp'

/** Selectable character preset ids, in settings-card order. */
export const PRESET_IDS = ['zero-two', 'emilia', 'mai', 'asuna'] as const

/** One character preset id. */
export type PresetId = (typeof PRESET_IDS)[number]

/** Hue (degrees) and chroma scale applied to a stock ramp in one color scheme. */
interface Tint {
  /** Hue angle in degrees. */
  h: number
  /** Multiplier on the stock ramp's chroma curve. */
  k: number
}

/** A value per color scheme. */
interface Modes<T> {
  /** Light-scheme value. */
  light: T
  /** Dark-scheme value. */
  dark: T
}

/** One character preset: ramp tints and decoration images. */
export interface CharacterPreset {
  /** Preset id. */
  id: PresetId
  /** Surface and text ramp tint. */
  neutral: Modes<Tint>
  /** Accent ramp tint. */
  accent: Modes<Tint>
  /** Hue of the secondary glow in the conversation background. */
  glowHue: Modes<number>
  /** Large character art behind the conversation. */
  art: Modes<string>
  /** Sticker shown at the foot of the sidebar. */
  sticker: Modes<string>
  /** Whether the sticker is a cut-off portrait whose lower edge fades out (chibi stickers keep their outline). */
  stickerFade: boolean
}

/** Every preset, keyed by id. */
export const PRESETS: Readonly<Record<PresetId, CharacterPreset>> = Object.freeze({
  'zero-two': {
    id: 'zero-two',
    neutral: { light: { h: 355, k: 1.1 }, dark: { h: 8, k: 1.6 } },
    accent: { light: { h: 4, k: 1.05 }, dark: { h: 358, k: 1 } },
    glowHue: { light: 330, dark: 20 },
    art: { light: artZeroTwo, dark: artZeroTwo },
    sticker: { light: stickerZeroTwoLight, dark: stickerZeroTwoDark },
    stickerFade: true,
  },
  'emilia': {
    id: 'emilia',
    neutral: { light: { h: 312, k: 1 }, dark: { h: 304, k: 1.7 } },
    accent: { light: { h: 318, k: 0.85 }, dark: { h: 314, k: 0.95 } },
    glowHue: { light: 270, dark: 330 },
    art: { light: artEmiliaLight, dark: artEmiliaDark },
    sticker: { light: stickerEmiliaLight, dark: stickerEmiliaDark },
    stickerFade: false,
  },
  'mai': {
    id: 'mai',
    neutral: { light: { h: 25, k: 0.55 }, dark: { h: 282, k: 2.2 } },
    accent: { light: { h: 282, k: 0.75 }, dark: { h: 285, k: 0.8 } },
    glowHue: { light: 40, dark: 50 },
    art: { light: artMai, dark: artMai },
    sticker: { light: stickerMai, dark: stickerMai },
    stickerFade: true,
  },
  'asuna': {
    id: 'asuna',
    neutral: { light: { h: 30, k: 0.3 }, dark: { h: 20, k: 0.4 } },
    accent: { light: { h: 28, k: 1.1 }, dark: { h: 24, k: 1 } },
    glowHue: { light: 60, dark: 40 },
    art: { light: artAsuna, dark: artAsuna },
    sticker: { light: stickerAsunaLight, dark: stickerAsunaDark },
    stickerFade: false,
  },
})

/** Stock ramp curve, lightest first: step suffix, then lightness and chroma per scheme. */
type CurveStep = readonly [step: string, light: readonly [l: number, c: number], dark: readonly [l: number, c: number]]

/** Stock `neutral-bluish` lightness/chroma curve (surface steps first, ink last). */
const NEUTRAL_CURVE: readonly CurveStep[] = [
  ['00', [0.994, 0.003], [1, 0]],
  ['50', [0.979, 0.011], [0.938, 0.018]],
  ['55', [0.972, 0.014], [0.914, 0.023]],
  ['60', [0.966, 0.015], [0.9, 0.025]],
  ['75', [0.952, 0.02], [0.872, 0.028]],
  ['90', [0.937, 0.024], [0.851, 0.03]],
  ['100', [0.922, 0.028], [0.831, 0.032]],
  ['150', [0.906, 0.032], [0.801, 0.034]],
  ['200', [0.881, 0.035], [0.764, 0.037]],
  ['300', [0.841, 0.032], [0.737, 0.035]],
  ['310', [0.83, 0.03], [0.717, 0.036]],
  ['400', [0.743, 0.028], [0.66, 0.04]],
  ['500', [0.662, 0.029], [0.585, 0.039]],
  ['600', [0.574, 0.029], [0.51, 0.038]],
  ['700', [0.483, 0.031], [0.405, 0.037]],
  ['750', [0.417, 0.031], [0.365, 0.034]],
  ['800', [0.367, 0.03], [0.333, 0.033]],
  ['850', [0.331, 0.028], [0.298, 0.03]],
  ['875', [0.306, 0.028], [0.274, 0.028]],
  ['900', [0.286, 0.028], [0.243, 0.027]],
  ['950', [0.265, 0.028], [0.219, 0.024]],
  ['1000', [0.24, 0.028], [0.19, 0.019]],
]

/** Stock `deepseek` accent curve; dark mode lifts the 300–500 steps it uses for accents. */
const ACCENT_CURVE: readonly CurveStep[] = [
  ['50', [0.968, 0.017], [0.968, 0.017]],
  ['100', [0.937, 0.036], [0.937, 0.036]],
  ['200', [0.894, 0.061], [0.894, 0.061]],
  ['300', [0.838, 0.098], [0.862, 0.075]],
  ['400', [0.76, 0.137], [0.806, 0.106]],
  ['450', [0.705, 0.163], [0.763, 0.132]],
  ['500', [0.646, 0.179], [0.715, 0.146]],
  ['600', [0.568, 0.17], [0.568, 0.17]],
  ['700-delete', [0.486, 0.148], [0.486, 0.148]],
  ['800', [0.392, 0.091], [0.377, 0.064]],
  ['900', [0.313, 0.065], [0.308, 0.047]],
]

/** Rounder corners than the base scale (4/8/12/16/20/28 px); both schemes share them. */
const RADII: ThemeTokenOverrides = Object.fromEntries(
  ([['xs', '6px'], ['sm', '10px'], ['md', '14px'], ['lg', '18px'], ['xl', '22px'], ['panel', '30px']] as const)
    .map(([step, px]) => [`--dsw-radius-${step}`, { light: px, dark: px }]),
)

/**
 * Tint one stock curve.
 * @param prefix - CSS custom property prefix ending in `-`.
 * @param curve - stock curve, lightest first.
 * @param tint - hue and chroma scale per scheme.
 * @returns override tokens for every step.
 */
function ramp(prefix: string, curve: readonly CurveStep[], tint: Modes<Tint>): ThemeTokenOverrides {
  return Object.fromEntries(curve.map(([step, [ll, lc], [dl, dc]]) => [`${prefix}${step}`, {
    light: css({ l: ll, c: lc * tint.light.k, h: tint.light.h }),
    dark: css({ l: dl, c: dc * tint.dark.k, h: tint.dark.h }),
  }]))
}

/**
 * Build a scheme pair from one OKLCH color per scheme.
 * @param light - light-scheme color.
 * @param dark - dark-scheme color.
 * @param alpha - opacity per scheme.
 * @returns a `{ light, dark }` token value.
 */
function pair(light: Oklch, dark: Oklch, alpha: Modes<number> = { light: 1, dark: 1 }): { light: string; dark: string } {
  return { light: css(light, alpha.light), dark: css(dark, alpha.dark) }
}

/**
 * Wrap an image URL per scheme as CSS `url()` values.
 * @param urls - image URL per scheme.
 * @returns a `{ light, dark }` token value.
 */
function image(urls: Modes<string>): { light: string; dark: string } {
  return { light: `url("${urls.light}")`, dark: `url("${urls.dark}")` }
}

/**
 * Every override one preset applies, keyed by CSS custom property.
 * @param preset - character preset.
 * @returns ramp, alias, radius, and `--sakura-*` decoration tokens.
 */
export function presetTokens(preset: CharacterPreset): ThemeTokenOverrides {
  const { neutral, accent, glowHue } = preset
  const na = { l: 0.36, c: 0.07, h: neutral.light.h }
  const nd = { l: 0.96, c: 0.03, h: neutral.dark.h }
  const al = (l: number, c: number): Oklch => ({ l, c: c * accent.light.k, h: accent.light.h })
  const ad = (l: number, c: number): Oklch => ({ l, c: c * accent.dark.k, h: accent.dark.h })
  const surfaceDark = (l: number): Oklch => ({ l, c: 0.03 * neutral.dark.k, h: neutral.dark.h })
  return Object.freeze({
    ...ramp('--dsw-static-neutral-bluish-', NEUTRAL_CURVE, neutral),
    ...ramp('--dsw-static-deepseek-', ACCENT_CURVE, accent),
    '--dsw-alias-link': pair(al(0.52, 0.16), ad(0.8, 0.11)),
    '--dsw-alias-label-primary-bluish': pair({ l: 0.33, c: 0.06, h: accent.light.h }, { l: 0.93, c: 0.03, h: accent.dark.h }),
    '--dsw-alias-bg-document-selection': pair(al(0.65, 0.18), ad(0.75, 0.13), { light: 0.26, dark: 0.32 }),
    '--dsw-alias-brand-primary-new-colorprimary-new-color': pair(al(0.646, 0.179), ad(0.763, 0.132)),
    '--dsw-alias-interactive-bg-hover': pair(na, nd, { light: 0.06, dark: 0.08 }),
    '--dsw-alias-interactive-bg-active': pair(na, nd, { light: 0.1, dark: 0.14 }),
    '--dsw-alias-interactive-bg-hover-accent': pair(na, nd, { light: 0.14, dark: 0.22 }),
    '--dsw-alias-border-l1': pair(na, nd, { light: 0.06, dark: 0.06 }),
    '--dsw-alias-border-l2': pair(na, nd, { light: 0.12, dark: 0.12 }),
    '--dsw-alias-border-l3': pair(na, nd, { light: 0.15, dark: 0.16 }),
    '--dsw-alias-border-l4': pair(na, nd, { light: 0.2, dark: 0.2 }),
    '--dsw-menu-surface-fill': pair({ l: 0.985, c: 0.01, h: neutral.light.h }, surfaceDark(0.36), { light: 0.6, dark: 0.5 }),
    '--dsw-specific-menu': pair({ l: 0.985, c: 0.01, h: neutral.light.h }, surfaceDark(0.29), { light: 0.86, dark: 0.88 }),
    '--dsw-alias-menu-group-header-fill': pair({ l: 0.985, c: 0.01, h: neutral.light.h }, surfaceDark(0.29), { light: 0.94, dark: 0.94 }),
    '--dsw-specific-bubble': pair(al(0.95, 0.03), { l: 0.33, c: 0.045, h: accent.dark.h }),
    '--dsw-specific-bubble-highlight': pair(al(0.91, 0.055), { l: 0.38, c: 0.06, h: accent.dark.h }),
    '--dsw-specific-sidebar-nav-item-active-accent': pair(al(0.93, 0.04), { l: 0.36, c: 0.05, h: accent.dark.h }),
    ...RADII,
    '--sakura-art': image(preset.art),
    '--sakura-sticker': image(preset.sticker),
    '--sakura-sticker-mask': preset.stickerFade
      ? { light: 'linear-gradient(to top, transparent 0, #000 34%)', dark: 'linear-gradient(to top, transparent 0, #000 34%)' }
      : { light: 'none', dark: 'none' },
    '--sakura-glow-a': pair(al(0.84, 0.1), ad(0.6, 0.15), { light: 0.42, dark: 0.22 }),
    '--sakura-glow-b': pair({ l: 0.88, c: 0.08, h: glowHue.light }, { l: 0.55, c: 0.12, h: glowHue.dark }, { light: 0.32, dark: 0.16 }),
    '--sakura-sidebar-top': pair(al(0.93, 0.045), surfaceDark(0.3), { light: 1, dark: 1 }),
    '--sakura-title-from': pair(al(0.5, 0.16), ad(0.88, 0.07)),
    '--sakura-title-to': pair({ l: 0.58, c: 0.15, h: glowHue.light }, { l: 0.8, c: 0.12, h: glowHue.dark }),
    '--sakura-glass': pair({ l: 1, c: 0, h: 0 }, surfaceDark(0.27), { light: 0.72, dark: 0.7 }),
    '--sakura-glow-ring': pair(al(0.72, 0.15), ad(0.7, 0.14), { light: 0.22, dark: 0.26 }),
    '--sakura-petal': pair(al(0.87, 0.08), ad(0.84, 0.08)),
    '--sakura-petal-edge': pair(al(0.72, 0.15), ad(0.68, 0.14)),
  })
}

/**
 * Preview colors for a preset's settings card: surface, soft accent, strong accent.
 * @param preset - character preset.
 * @returns three CSS colors for the light scheme.
 */
export function presetSwatches(preset: CharacterPreset): readonly [surface: string, soft: string, strong: string] {
  const { neutral, accent } = preset
  return [
    css({ l: 0.972, c: 0.014 * neutral.light.k, h: neutral.light.h }),
    css({ l: 0.894, c: 0.061 * accent.light.k, h: accent.light.h }),
    css({ l: 0.646, c: 0.179 * accent.light.k, h: accent.light.h }),
  ]
}

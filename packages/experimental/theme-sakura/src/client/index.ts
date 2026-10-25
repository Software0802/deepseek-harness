/**
 * Sakura theme, browser half. Applies the selected character preset as a
 * ui-theme override layer, mounts the decoration stylesheet and the
 * falling-petal overlay, and registers the anime theme row in Settings →
 * General. Viewer choices live in {@link PreferenceStore}; `body` carries
 * `data-sakura` while the plugin is active plus one attribute per enabled
 * decoration, which `decor.css` keys on.
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import decor from './decor.css?inline'
import { de, en, es, fr, ja, pt, ru, zh, type SakuraKey } from './locales.ts'
import { startPetals } from './petals.ts'
import { PreferenceStore, type SakuraPreferences } from './preferences.ts'
import { PRESETS, presetTokens } from './presets.ts'
import { SakuraRow, type SakuraRowInjected } from './SakuraRow.tsx'

export { PRESET_IDS, PRESETS, presetTokens, type CharacterPreset, type PresetId } from './presets.ts'
export { DEFAULT_PREFERENCES, PREFERENCES_KEY, PreferenceStore, parsePreferences, type SakuraPreferences } from './preferences.ts'
export type { SakuraKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Anime theme settings row copy. */
    'theme-sakura': SakuraKey
  }
}

/** Override-layer source and stylesheet tag owner. */
export const LAYER_SOURCE = '@deepseek-ai/dsh-experimental-theme-sakura'

/** Dictionary namespace of the settings row. */
const NS = 'theme-sakura'

/** Required services: theme overrides, settings slots, and dictionaries. */
export const inject = ['theme', 'slots', 'locale']

/** `body` attributes per decoration toggle. */
const DECORATION_ATTRIBUTES = { art: 'data-sakura-art', sticker: 'data-sakura-sticker' } as const

/**
 * Apply the stored preset and decorations, and follow later preference changes.
 * @param ctx - client root context.
 */
export function apply(ctx: Context): void {
  const store = new PreferenceStore(readStorage())
  let applied: SakuraPreferences | undefined
  let removeLayer: (() => void) | undefined
  let stopPetals: (() => void) | undefined
  const body = document.body
  const sync = (): void => {
    const next = store.getSnapshot()
    if (applied?.preset !== next.preset) {
      // A newer layer from the same source replaces the previous one in place.
      removeLayer = ctx.theme.overrideTokens(LAYER_SOURCE, presetTokens(PRESETS[next.preset]))
    }
    body.toggleAttribute(DECORATION_ATTRIBUTES.art, next.art)
    body.toggleAttribute(DECORATION_ATTRIBUTES.sticker, next.sticker)
    if (next.petals && stopPetals === undefined) stopPetals = startPetals(document)
    if (!next.petals && stopPetals !== undefined) {
      stopPetals()
      stopPetals = undefined
    }
    applied = next
  }
  ctx.effect(() => {
    sync()
    const unsubscribe = store.subscribe(sync)
    return () => {
      unsubscribe()
      removeLayer?.()
      stopPetals?.()
      stopPetals = undefined
      applied = undefined
      for (const attribute of Object.values(DECORATION_ATTRIBUTES)) body.removeAttribute(attribute)
    }
  }, 'theme-sakura: preset layer and decorations')

  ctx.effect(() => {
    const tag = document.createElement('style')
    tag.dataset.plugin = LAYER_SOURCE
    tag.dataset.pluginCss = `${LAYER_SOURCE}/decor.css`
    tag.textContent = decor
    document.head.appendChild(tag)
    body.setAttribute('data-sakura', '')
    return () => {
      body.removeAttribute('data-sakura')
      tag.remove()
    }
  }, 'theme-sakura: decoration stylesheet')

  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), 'theme-sakura: settings row dictionaries')
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'theme-sakura',
    order: 12,
    locale: NS,
    inject: (): SakuraRowInjected => ({
      hooks: { preferences: store },
      update: (patch) => { store.update(patch) },
    }),
  }, SakuraRow))
}

/**
 * Resolve `localStorage`, which throws where site data is blocked.
 * @returns the storage, or undefined when unavailable.
 */
function readStorage(): Storage | undefined {
  try {
    return localStorage
  } catch {
    // SecurityError from blocked site data: preferences stay in memory.
    return undefined
  }
}

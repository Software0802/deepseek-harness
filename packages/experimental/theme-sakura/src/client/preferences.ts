/**
 * Per-browser theme preferences: the selected character and the three
 * decoration toggles. They persist in `localStorage` because they describe one
 * viewer's taste, not a deployment; unreadable or invalid stored values fall
 * back to the defaults, and a failed write keeps the in-memory value.
 */
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import { PRESET_IDS, type PresetId } from './presets.ts'

/** Storage key; the suffix versions the stored JSON fields. */
export const PREFERENCES_KEY = 'dsh-theme-sakura:v1'

/** Viewer preferences. */
export interface SakuraPreferences {
  /** Selected character preset. */
  preset: PresetId
  /** Show the large character art behind the conversation. */
  art: boolean
  /** Show the sticker at the foot of the sidebar. */
  sticker: boolean
  /** Animate falling petals over the window. */
  petals: boolean
}

/** Preferences used when nothing valid is stored. */
export const DEFAULT_PREFERENCES: SakuraPreferences = Object.freeze({ preset: 'zero-two', art: true, sticker: true, petals: true })

/**
 * Parse stored JSON, keeping each valid field and defaulting the rest.
 * @param text - stored JSON text, or null when absent.
 * @returns complete preferences.
 */
export function parsePreferences(text: string | null): SakuraPreferences {
  if (text === null) return DEFAULT_PREFERENCES
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    // Corrupt JSON from an older build or a manual edit: start from the defaults.
    return DEFAULT_PREFERENCES
  }
  if (typeof value !== 'object' || value === null) return DEFAULT_PREFERENCES
  const record = value as Record<string, unknown>
  const flag = (name: 'art' | 'sticker' | 'petals'): boolean =>
    typeof record[name] === 'boolean' ? record[name] : DEFAULT_PREFERENCES[name]
  const preset = PRESET_IDS.find(id => id === record['preset']) ?? DEFAULT_PREFERENCES.preset
  return Object.freeze({ preset, art: flag('art'), sticker: flag('sticker'), petals: flag('petals') })
}

/** Observable preferences backed by `localStorage`. */
export class PreferenceStore implements ObservableSnapshot<SakuraPreferences> {
  private value: SakuraPreferences
  private readonly listeners = new Set<() => void>()

  /**
   * @param storage - browser storage, or undefined where it is unavailable.
   */
  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | undefined) {
    let text: string | null = null
    try {
      text = storage?.getItem(PREFERENCES_KEY) ?? null
    } catch {
      // Storage access throws when site data is blocked; use the defaults.
    }
    this.value = parsePreferences(text)
  }

  /** @returns the current preferences. */
  getSnapshot(): SakuraPreferences {
    return this.value
  }

  /**
   * @param fn - called after every change.
   * @returns unsubscribe function.
   */
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => { this.listeners.delete(fn) }
  }

  /**
   * Merge a change, persist it, and notify subscribers.
   * @param patch - fields to change.
   */
  update(patch: Partial<SakuraPreferences>): void {
    this.value = Object.freeze({ ...this.value, ...patch })
    try {
      this.storage?.setItem(PREFERENCES_KEY, JSON.stringify(this.value))
    } catch {
      // Quota or blocked storage: the change still applies for this page load.
    }
    for (const fn of this.listeners) fn()
  }
}

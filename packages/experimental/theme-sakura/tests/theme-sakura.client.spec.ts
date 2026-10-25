// @vitest-environment jsdom
/** Sakura theme: preset palettes, stored preferences, and the plugin's layer, decoration, and settings-row lifecycle. */
import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apply as hostApply } from '../src/index.ts'
import {
  apply, DEFAULT_PREFERENCES, inject, LAYER_SOURCE, parsePreferences, PREFERENCES_KEY, PreferenceStore, PRESET_IDS, PRESETS, presetTokens,
} from '../src/client/index.ts'
import { oklchToRgb } from '../src/client/color.ts'

/** Relative luminance of an `rgb(r, g, b)` value. */
function luminance(value: string): number {
  const match = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(value)
  if (match === null) throw new Error(`not an rgb() value: ${value}`)
  const linear = (channel: string | undefined): number => {
    const c = Number(channel) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * linear(match[1]) + 0.7152 * linear(match[2]) + 0.0722 * linear(match[3])
}

/** WCAG contrast ratio between two `rgb()` values. */
function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

const NEUTRAL_STEPS = ['00', '50', '55', '60', '75', '90', '100', '150', '200', '300', '310', '400', '500', '600', '700', '750', '800', '850', '875', '900', '950', '1000']

describe.each(PRESET_IDS)('preset %s', (id) => {
  const tokens = presetTokens(PRESETS[id])
  const token = (name: string, scheme: 'light' | 'dark'): string => {
    const modes = tokens[name]
    if (modes === undefined) throw new Error(`missing token ${name}`)
    return modes[scheme]
  }

  it('keeps each neutral ramp ordered from lightest to darkest in both schemes', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const values = NEUTRAL_STEPS.map(step => luminance(token(`--dsw-static-neutral-bluish-${step}`, scheme)))
      expect(values).toEqual([...values].sort((x, y) => y - x))
      expect(new Set(values).size).toBe(values.length)
    }
  })

  it('keeps body text and links readable on the base background', () => {
    // Light: text = 1000 and links on bg-base = 00. Dark: text = 50 and links on bg-base = 950.
    expect(contrast(token('--dsw-static-neutral-bluish-1000', 'light'), token('--dsw-static-neutral-bluish-00', 'light'))).toBeGreaterThan(7)
    expect(contrast(token('--dsw-static-neutral-bluish-50', 'dark'), token('--dsw-static-neutral-bluish-950', 'dark'))).toBeGreaterThan(7)
    expect(contrast(token('--dsw-alias-link', 'light'), token('--dsw-static-neutral-bluish-00', 'light'))).toBeGreaterThan(4.5)
    expect(contrast(token('--dsw-alias-link', 'dark'), token('--dsw-static-neutral-bluish-950', 'dark'))).toBeGreaterThan(4.5)
  })

  it('points the decoration variables at the preset images', () => {
    expect(token('--sakura-art', 'light')).toBe(`url("${PRESETS[id].art.light}")`)
    expect(token('--sakura-sticker', 'dark')).toBe(`url("${PRESETS[id].sticker.dark}")`)
  })
})

it('reduces chroma instead of clipping channels for out-of-gamut colors', () => {
  expect(oklchToRgb({ l: 0.7, c: 0.4, h: 140 }).every(v => v >= 0 && v <= 255)).toBe(true)
  expect(oklchToRgb({ l: 1, c: 0, h: 0 })).toEqual([255, 255, 255])
})

describe('preferences', () => {
  it('keeps valid stored fields and defaults the rest', () => {
    expect(parsePreferences(null)).toBe(DEFAULT_PREFERENCES)
    expect(parsePreferences('{')).toBe(DEFAULT_PREFERENCES)
    expect(parsePreferences('7')).toBe(DEFAULT_PREFERENCES)
    expect(parsePreferences('{"preset":"mai","art":false,"sticker":"yes"}')).toEqual({ ...DEFAULT_PREFERENCES, preset: 'mai', art: false })
    expect(parsePreferences('{"preset":"nobody"}').preset).toBe(DEFAULT_PREFERENCES.preset)
  })

  it('persists updates and notifies subscribers', () => {
    const data = new Map<string, string>()
    const store = new PreferenceStore({ getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value) } })
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    store.update({ preset: 'asuna' })
    expect(store.getSnapshot().preset).toBe('asuna')
    expect(JSON.parse(data.get(PREFERENCES_KEY) ?? '')).toMatchObject({ preset: 'asuna' })
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    store.update({ petals: false })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('keeps working when storage throws', () => {
    const fail = (): never => { throw new Error('blocked') }
    const store = new PreferenceStore({ getItem: fail, setItem: fail })
    expect(store.getSnapshot()).toBe(DEFAULT_PREFERENCES)
    store.update({ art: false })
    expect(store.getSnapshot().art).toBe(false)
  })
})

describe('plugin', () => {
  afterEach(() => { localStorage.clear() })

  /**
   * Start the plugin against fake theme, slot, and locale services.
   * @returns the fakes and the plugin fiber.
   */
  async function start() {
    const ctx = new Context()
    const remove = vi.fn()
    const overrideTokens = vi.fn(() => remove)
    const unregisterLocale = vi.fn()
    const register = vi.fn((_options: object, _component: object) => () => {})
    ctx.provide('theme', { overrideTokens } as never)
    ctx.provide('locale', { register: vi.fn(() => unregisterLocale) } as never)
    ctx.provide('slots', { inject: (_name: string, fn: () => unknown) => fn(), register } as never)
    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber
    return { fiber, overrideTokens, remove, register, unregisterLocale }
  }

  it('exposes the host marker and the browser inject list', () => {
    hostApply()
    expect(inject).toEqual(['theme', 'slots', 'locale'])
  })

  it('applies the stored preset with its decorations and removes everything on dispose', async () => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ preset: 'emilia', sticker: false, petals: false }))
    const { fiber, overrideTokens, remove, register, unregisterLocale } = await start()
    expect(overrideTokens).toHaveBeenCalledWith(LAYER_SOURCE, presetTokens(PRESETS.emilia))
    expect(document.body.hasAttribute('data-sakura')).toBe(true)
    expect(document.body.hasAttribute('data-sakura-art')).toBe(true)
    expect(document.body.hasAttribute('data-sakura-sticker')).toBe(false)
    expect(document.head.querySelector(`style[data-plugin-css="${LAYER_SOURCE}/decor.css"]`)).not.toBeNull()
    expect(register).toHaveBeenCalledWith(expect.objectContaining({ name: 'settings.general.item', id: 'theme-sakura', order: 12 }), expect.any(Function))
    await fiber.dispose()
    expect(remove).toHaveBeenCalledTimes(1)
    expect(unregisterLocale).toHaveBeenCalledTimes(1)
    expect(document.body.hasAttribute('data-sakura')).toBe(false)
    expect(document.body.hasAttribute('data-sakura-art')).toBe(false)
    expect(document.head.querySelector(`style[data-plugin-css="${LAYER_SOURCE}/decor.css"]`)).toBeNull()
  })

  it('follows preference changes from the settings row', async () => {
    // Reduced motion makes the petal overlay a no-op that still goes through start and stop.
    window.matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList)
    const { fiber, overrideTokens, register } = await start()
    const options = register.mock.calls[0]?.[0] as { inject: () => { update: (patch: object) => void } } | undefined
    if (options === undefined) throw new Error('settings row was not registered')
    const face = options.inject()
    face.update({ preset: 'mai' })
    expect(overrideTokens).toHaveBeenLastCalledWith(LAYER_SOURCE, presetTokens(PRESETS.mai))
    face.update({ art: false })
    expect(overrideTokens).toHaveBeenCalledTimes(2)
    expect(document.body.hasAttribute('data-sakura-art')).toBe(false)
    face.update({ petals: false })
    face.update({ petals: true })
    await fiber.dispose()
  })
})

it('keeps preferences in memory when localStorage access throws', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new DOMException('blocked', 'SecurityError') } })
  // Reduced motion keeps the default petal overlay from needing a canvas.
  window.matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList)
  try {
    const ctx = new Context()
    ctx.provide('theme', { overrideTokens: vi.fn(() => () => {}) } as never)
    ctx.provide('locale', { register: vi.fn(() => () => {}) } as never)
    ctx.provide('slots', { inject: vi.fn(), register: vi.fn() } as never)
    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber
    expect(document.body.hasAttribute('data-sakura-art')).toBe(DEFAULT_PREFERENCES.art)
    await fiber.dispose()
  } finally {
    if (descriptor !== undefined) Object.defineProperty(globalThis, 'localStorage', descriptor)
  }
})

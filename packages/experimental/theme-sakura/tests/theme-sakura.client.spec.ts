/** The Sakura palette layer: its registration lifecycle and the ramp ordering the base stylesheets rely on. */
import { Context } from '@deepseek-ai/cordis'
import { expect, it, vi } from 'vitest'
import { apply as hostApply } from '../src/index.ts'
import { apply, inject, LAYER_SOURCE, SAKURA_TOKENS } from '../src/client/index.ts'

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

/** Read one token's value for a scheme. */
function token(name: string, scheme: 'light' | 'dark'): string {
  const modes = SAKURA_TOKENS[name]
  if (modes === undefined) throw new Error(`missing token ${name}`)
  return modes[scheme]
}

it('exposes the host marker and the browser inject list', () => {
  hostApply()
  expect(inject).toEqual(['theme'])
})

it('stacks one override layer while the plugin is active and removes it on dispose', async () => {
  const ctx = new Context()
  const remove = vi.fn()
  const overrideTokens = vi.fn(() => remove)
  ctx.provide('theme', { overrideTokens } as never)
  const fiber = ctx.plugin({ inject: [...inject], apply })
  await fiber
  expect(overrideTokens).toHaveBeenCalledWith(LAYER_SOURCE, SAKURA_TOKENS)
  expect(remove).not.toHaveBeenCalled()
  await fiber.dispose()
  expect(remove).toHaveBeenCalledTimes(1)
})

it('keeps each neutral ramp ordered from lightest to darkest in both schemes', () => {
  const steps = ['00', '50', '55', '60', '75', '90', '100', '150', '200', '300', '310', '400', '500', '600', '700', '750', '800', '850', '875', '900', '950', '1000']
  for (const scheme of ['light', 'dark'] as const) {
    const values = steps.map(step => luminance(token(`--dsw-static-neutral-bluish-${step}`, scheme)))
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

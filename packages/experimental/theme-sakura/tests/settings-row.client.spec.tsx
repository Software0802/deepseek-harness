// @vitest-environment jsdom
/** Anime theme settings row: preset selection and decoration toggles. */
import { fireEvent, render, screen } from '@testing-library/react'
import { useSyncExternalStore } from 'react'
import { expect, it, vi } from 'vitest'
import { SakuraRow } from '../src/client/SakuraRow.tsx'
import { PreferenceStore, type SakuraPreferences } from '../src/client/preferences.ts'
import { zh } from '../src/client/locales.ts'

it('marks the stored preset and writes card and switch changes', () => {
  const store = new PreferenceStore(undefined)
  const update = vi.fn((patch: Partial<SakuraPreferences>) => { store.update(patch) })
  const usePreferences = <T,>(select: (value: SakuraPreferences) => T): T =>
    select(useSyncExternalStore(fn => store.subscribe(fn), () => store.getSnapshot()))
  const t = (key: keyof typeof zh): string => zh[key]
  const props = { usePreferences, update, t } as Parameters<typeof SakuraRow>[0]
  render(<SakuraRow {...props} />)
  expect(screen.getByRole('radio', { name: /02 · 樱花/ }).getAttribute('aria-checked')).toBe('true')
  fireEvent.click(screen.getByRole('radio', { name: /亚丝娜/ }))
  expect(update).toHaveBeenLastCalledWith({ preset: 'asuna' })
  expect(screen.getByRole('radio', { name: /亚丝娜/ }).getAttribute('aria-checked')).toBe('true')
  fireEvent.click(screen.getByRole('switch', { name: zh.petals }))
  expect(update).toHaveBeenLastCalledWith({ petals: false })
  expect(screen.getByRole('switch', { name: zh.petals }).getAttribute('aria-checked')).toBe('false')
  expect(screen.getByText(zh.credit)).toBeTruthy()
})

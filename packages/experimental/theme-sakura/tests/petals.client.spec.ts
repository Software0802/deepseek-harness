// @vitest-environment jsdom
/** Falling-petal overlay: canvas lifecycle, motion preference, and visibility pausing. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { startPetals } from '../src/client/petals.ts'

/** Minimal 2D context recording the fill colors it was given. */
function fakeContext() {
  const stops: string[] = []
  const g = {
    setTransform: vi.fn(), clearRect: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(),
    beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), bezierCurveTo: vi.fn(), fill: vi.fn(), fillStyle: '' as string | CanvasGradient,
    createLinearGradient: vi.fn(() => ({ addColorStop: (_offset: number, color: string) => { stops.push(color) } })),
  }
  return { g, stops }
}

let frames: FrameRequestCallback[] = []
let reduced = false

beforeEach(() => {
  frames = []
  reduced = false
  window.matchMedia = vi.fn(() => ({ matches: reduced }) as MediaQueryList)
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((fn) => { frames.push(fn); return frames.length })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.removeAttribute('style')
})

/** Run the most recently requested frame at `now`. */
function step(now: number): void {
  const fn = frames.at(-1)
  if (fn === undefined) throw new Error('no frame requested')
  fn(now)
}

it('draws petals on a click-through canvas and removes it on dispose', () => {
  const { g, stops } = fakeContext()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(g as never)
  document.body.style.setProperty('--sakura-petal', 'rgb(1, 2, 3)')
  document.body.style.setProperty('--sakura-petal-edge', 'rgb(4, 5, 6)')
  const stop = startPetals(document)
  const canvas = document.querySelector('canvas[data-sakura-petals]')
  expect(canvas).not.toBeNull()
  expect((canvas as HTMLCanvasElement).style.pointerEvents).toBe('none')
  step(performance.now() + 16)
  expect(g.fill).toHaveBeenCalledTimes(14)
  expect(stops.slice(0, 2)).toEqual(['rgb(1, 2, 3)', 'rgb(4, 5, 6)'])
  // Long enough frames carry every petal past the bottom edge, which respawns it at the top.
  for (let i = 2; i < 400; i += 1) step(performance.now() + i * 1000)
  window.dispatchEvent(new Event('resize'))
  stop()
  expect(document.querySelector('canvas[data-sakura-petals]')).toBeNull()
})

it('falls back to built-in colors when the preset variables are missing', () => {
  const { g, stops } = fakeContext()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(g as never)
  const stop = startPetals(document)
  step(performance.now())
  expect(stops.slice(0, 2)).toEqual(['rgb(255, 214, 229)', 'rgb(240, 140, 180)'])
  stop()
})

it('pauses while the document is hidden', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeContext().g as never)
  const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
  const stop = startPetals(document)
  expect(frames).toHaveLength(0)
  visibility.mockReturnValue('visible')
  document.dispatchEvent(new Event('visibilitychange'))
  expect(frames).toHaveLength(1)
  stop()
})

it('does nothing under reduced motion, without a 2D context, or without a window', () => {
  reduced = true
  startPetals(document)()
  reduced = false
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  startPetals(document)()
  startPetals(document.implementation.createHTMLDocument())()
  expect(document.querySelector('canvas[data-sakura-petals]')).toBeNull()
  expect(frames).toHaveLength(0)
})

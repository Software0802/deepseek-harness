/**
 * Falling-petal overlay: a fixed, click-through canvas that drifts a few
 * petals across the window. Colors follow the active preset's
 * `--sakura-petal` and `--sakura-petal-edge` variables; the animation pauses
 * while the document is hidden and does not start under
 * `prefers-reduced-motion: reduce`.
 */

/** Petals on screen at once. */
const PETAL_COUNT = 14

/** One petal's position and motion, in CSS pixels and radians. */
interface Petal {
  x: number
  y: number
  size: number
  speed: number
  sway: number
  phase: number
  spin: number
  angle: number
  flip: number
}

/**
 * Start the overlay in `doc`.
 * @param doc - document to draw over.
 * @returns a disposer that stops the animation and removes the canvas.
 */
export function startPetals(doc: Document): () => void {
  const view = doc.defaultView
  if (view === null || view.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  const canvas = doc.createElement('canvas')
  canvas.dataset.sakuraPetals = ''
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '2', opacity: '0.75' })
  const g = canvas.getContext('2d')
  if (g === null) return () => {}
  doc.body.appendChild(canvas)

  let width = 0
  let height = 0
  const resize = (): void => {
    const dpr = view.devicePixelRatio
    width = view.innerWidth
    height = view.innerHeight
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()
  view.addEventListener('resize', resize)

  const spawn = (fresh: boolean): Petal => ({
    x: Math.random() * width,
    y: fresh ? Math.random() * height : -20,
    size: 7 + Math.random() * 6,
    speed: 18 + Math.random() * 22,
    sway: 14 + Math.random() * 22,
    phase: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 1.6,
    angle: Math.random() * Math.PI * 2,
    flip: Math.random() * Math.PI * 2,
  })
  const petals = Array.from({ length: PETAL_COUNT }, () => spawn(true))

  const draw = (p: Petal, fill: string, edge: string): void => {
    g.save()
    g.translate(p.x + Math.sin(p.phase) * p.sway, p.y)
    g.rotate(p.angle)
    g.scale(1, 0.55 + 0.45 * Math.abs(Math.cos(p.flip)))
    const s = p.size
    g.beginPath()
    g.moveTo(0, s)
    g.bezierCurveTo(-s * 0.9, s * 0.3, -s * 0.7, -s * 0.8, -s * 0.12, -s * 0.9)
    g.lineTo(0, -s * 0.62)
    g.lineTo(s * 0.12, -s * 0.9)
    g.bezierCurveTo(s * 0.7, -s * 0.8, s * 0.9, s * 0.3, 0, s)
    const gradient = g.createLinearGradient(0, -s, 0, s)
    gradient.addColorStop(0, fill)
    gradient.addColorStop(1, edge)
    g.fillStyle = gradient
    g.fill()
    g.restore()
  }

  let frame = 0
  let last = view.performance.now()
  // Preset colors are re-read about once a second, not every frame.
  let colorAge = Infinity
  let fill = ''
  let edge = ''
  const tick = (now: number): void => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    colorAge += dt
    if (colorAge > 1) {
      colorAge = 0
      const style = view.getComputedStyle(doc.body)
      fill = style.getPropertyValue('--sakura-petal').trim() || 'rgb(255, 214, 229)'
      edge = style.getPropertyValue('--sakura-petal-edge').trim() || 'rgb(240, 140, 180)'
    }
    g.clearRect(0, 0, width, height)
    petals.forEach((p, i) => {
      p.y += p.speed * dt
      p.phase += dt * 0.9
      p.angle += p.spin * dt
      p.flip += dt * 1.7
      if (p.y > height + 24) petals[i] = spawn(false)
      draw(p, fill, edge)
    })
    frame = view.requestAnimationFrame(tick)
  }
  const visibility = (): void => {
    view.cancelAnimationFrame(frame)
    if (doc.visibilityState === 'visible') {
      last = view.performance.now()
      frame = view.requestAnimationFrame(tick)
    }
  }
  doc.addEventListener('visibilitychange', visibility)
  visibility()

  return () => {
    view.cancelAnimationFrame(frame)
    doc.removeEventListener('visibilitychange', visibility)
    view.removeEventListener('resize', resize)
    canvas.remove()
  }
}

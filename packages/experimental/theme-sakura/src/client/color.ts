/**
 * OKLCH to sRGB conversion for palette generation. Ramps are specified as
 * perceptual lightness, chroma, and hue so one lightness curve fits every
 * character hue; out-of-gamut colors keep their lightness and hue and lose
 * chroma until they fit sRGB.
 */

/** One OKLCH color: lightness 0..1, chroma (0..~0.37), hue in degrees. */
export interface Oklch {
  /** Perceptual lightness, 0 (black) to 1 (white). */
  l: number
  /** Chroma; 0 is gray. */
  c: number
  /** Hue angle in degrees. */
  h: number
}

/** sRGB channels, each 0..255. */
export type Rgb = readonly [r: number, g: number, b: number]

/**
 * Convert linear-light OKLCH to unclamped sRGB channels (0..1, may leave the gamut).
 * @param color - OKLCH color.
 * @returns gamma-encoded sRGB channels before clamping.
 */
function toSrgb({ l, c, h }: Oklch): [number, number, number] {
  const rad = (h * Math.PI) / 180
  const a = c * Math.cos(rad)
  const b = c * Math.sin(rad)
  const l3 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m3 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s3 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const linear = [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ] as const
  const encode = (v: number): number => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)
  return [encode(linear[0]), encode(linear[1]), encode(linear[2])]
}

/**
 * Map an OKLCH color into sRGB, reducing chroma until every channel fits.
 * @param color - OKLCH color.
 * @returns 0..255 integer channels.
 */
export function oklchToRgb(color: Oklch): Rgb {
  const inGamut = (rgb: readonly number[]): boolean => rgb.every(v => v >= -0.0005 && v <= 1.0005)
  let rgb = toSrgb(color)
  if (!inGamut(rgb)) {
    let low = 0
    let high = color.c
    for (let i = 0; i < 24; i += 1) {
      const mid = (low + high) / 2
      if (inGamut(toSrgb({ ...color, c: mid }))) low = mid
      else high = mid
    }
    rgb = toSrgb({ ...color, c: low })
  }
  const byte = (v: number): number => Math.round(Math.min(1, Math.max(0, v)) * 255)
  return [byte(rgb[0]), byte(rgb[1]), byte(rgb[2])]
}

/**
 * Format an OKLCH color as a CSS `rgb()` or `rgba()` value.
 * @param color - OKLCH color.
 * @param alpha - opacity; 1 emits `rgb()`.
 * @returns CSS color text.
 */
export function css(color: Oklch, alpha = 1): string {
  const [r, g, b] = oklchToRgb(color)
  return alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`
}

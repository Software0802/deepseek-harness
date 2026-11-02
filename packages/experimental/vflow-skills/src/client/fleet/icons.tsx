/** Line glyphs of the fleet panel, drawn in `currentColor`. */
import type { ReactNode } from 'react'

const line = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/** @returns a sailing ship, the fleet's emblem. */
export function FleetEmblem(): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="1.8" aria-hidden="true" {...line}>
      <path d="M3 15.5h18l-2.6 4.5H5.6z" />
      <path d="M12 3v12.5" />
      <path d="M12 4.5 18.5 13H12" />
      <path d="M12 7.5 7 13h5" />
    </svg>
  )
}

/** @returns the ship-task glyph. */
export function IconShip(): ReactNode {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" strokeWidth="1.8" aria-hidden="true" {...line}>
      <path d="M2 10.5h12l-1.8 3H3.8z" />
      <path d="M8 2v8.5M8 3l4.2 5.5H8" />
    </svg>
  )
}

/** @returns the scout-task glyph. */
export function IconScout(): ReactNode {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" strokeWidth="1.8" aria-hidden="true" {...line}>
      <circle cx="7" cy="7" r="4.2" />
      <path d="M10.2 10.2 14 14" />
    </svg>
  )
}

/** @returns a check mark for completed tasks. */
export function IconCheck(): ReactNode {
  return <svg width="10" height="10" viewBox="0 0 16 16" strokeWidth="2.6" aria-hidden="true" {...line}><path d="m3.5 8.5 3 3 6-7" /></svg>
}

/** @returns a cross for failed tasks. */
export function IconCross(): ReactNode {
  return <svg width="10" height="10" viewBox="0 0 16 16" strokeWidth="2.4" aria-hidden="true" {...line}><path d="m4.5 4.5 7 7M11.5 4.5l-7 7" /></svg>
}

/** @returns a bar for cancelled tasks. */
export function IconStop(): ReactNode {
  return <svg width="10" height="10" viewBox="0 0 16 16" strokeWidth="2.4" aria-hidden="true" {...line}><path d="M4 8h8" /></svg>
}

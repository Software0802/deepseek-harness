/** The V-model stage chart drawn on each running fleet card. */
import type { ReactNode } from 'react'
import { V_MODEL_NODES } from '../../types.ts'
import css from './FleetPanel.module.css'

const STEP = 14
const POINTS = V_MODEL_NODES.map((_node, index) => [5 + index * STEP, index <= 3 ? 4 + index * 8 : 28 - (index - 3) * 8] as const)

function polyline(count: number): string {
  return POINTS.slice(0, count).map(point => point.join(',')).join(' ')
}

/**
 * Seven stages laid out as a V: finished stages filled, the current one ringed, later ones hollow.
 * @param props - the current stage index and its label.
 * @returns an SVG with the stage label below it.
 */
export function Vee({ current, label }: { readonly current: number; readonly label: string }): ReactNode {
  return (
    <div className={css.vee}>
      <svg width="94" height="32" viewBox="0 0 94 32" aria-hidden="true">
        <polyline points={polyline(POINTS.length)} className={css.veeTrack} />
        <polyline points={polyline(current + 1)} className={css.veeDone} />
        {POINTS.map(([x, y], index) => index < current
          ? <circle key={index} cx={x} cy={y} r="3" className={css.veePast} />
          : index === current
            ? (
              <g key={index}>
                <circle cx={x} cy={y} r="7" className={css.veeHalo} />
                <circle cx={x} cy={y} r="4" className={css.veeNow} />
              </g>
            )
            : <circle key={index} cx={x} cy={y} r="2.6" className={css.veeNext} />)}
      </svg>
      <span className={css.veeLabel}>{label}</span>
    </div>
  )
}

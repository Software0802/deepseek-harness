/**
 * Anime theme row in Settings → General: one card per character preset and
 * switches for the art, sticker, and petal decorations. Selection reads the
 * stored preferences, so it holds across color-scheme changes.
 */
import type { CSSProperties } from 'react'
import { Switch } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { PRESET_IDS, PRESETS, presetSwatches } from './presets.ts'
import type { SakuraPreferences } from './preferences.ts'
import css from './SakuraRow.module.css'

/** Injected face: the stored preferences and their writer. */
export interface SakuraRowInjected {
  hooks: { preferences: ObservableSnapshot<SakuraPreferences> }
  /** Merge a preference change. */
  update(patch: Partial<SakuraPreferences>): void
}

/** Decoration toggles in display order. */
const TOGGLES = ['art', 'sticker', 'petals'] as const

/**
 * Render the anime theme row.
 * @param props - stored preferences, writer, and localized copy.
 * @returns the General Settings row.
 */
export function SakuraRow({ usePreferences, update, t }:
  PropsRuntime<'settings.general.item'> & PropsLocale<'theme-sakura'> & InjectFace<SakuraRowInjected>) {
  const preferences = usePreferences(value => value)
  return <div className={css.group}>
    <div>
      <div className={css.title}>{t('title')}</div>
      <div className={css.description}>{t('description')}</div>
    </div>
    <div className={css.cards} role="radiogroup" aria-label={t('title')}>
      {PRESET_IDS.map((id) => {
        const preset = PRESETS[id]
        const [surface, soft, strong] = presetSwatches(preset)
        const selected = preferences.preset === id
        return <button
          key={id}
          type="button"
          role="radio"
          aria-checked={selected}
          className={css.card}
          data-selected={selected || undefined}
          style={{ '--card-surface': surface, '--card-soft': soft, '--card-strong': strong } as CSSProperties}
          onClick={() => { update({ preset: id }) }}
        >
          <span className={css.preview}>
            <img className={css.sticker} src={preset.sticker.light} alt="" draggable={false} />
          </span>
          <span className={css.name}>{t(`preset.${id}`)}</span>
          <span className={css.swatches} aria-hidden="true">
            <i style={{ background: surface }} />
            <i style={{ background: soft }} />
            <i style={{ background: strong }} />
          </span>
        </button>
      })}
    </div>
    <div className={css.toggles}>
      {TOGGLES.map(name => <label key={name} className={css.toggle}>
        <span>{t(name)}</span>
        <Switch checked={preferences[name]} label={t(name)} onChange={(next) => { update({ [name]: next }) }} />
      </label>)}
    </div>
    <div className={css.credit}>{t('credit')}</div>
  </div>
}

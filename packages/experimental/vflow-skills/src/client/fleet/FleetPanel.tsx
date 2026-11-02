/** The fleet panel: the lead Session's fleet tasks, their V-model stages, and the decisions waiting for the user. */
import { useEffect, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { SessionSummary } from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-token-meter/client'
import type {} from '@deepseek-ai/dsh-subagent/client'
import type { FleetTaskView } from '../../types.ts'
import type { NS } from '../locales.ts'
import { ago, clock, coarse, compactTokens, groupTasks, nodeIndex, nodeLabel } from './format.ts'
import { FleetEmblem, IconCheck, IconCross, IconScout, IconShip, IconStop } from './icons.tsx'
import { Vee } from './Vee.tsx'
import css from './FleetPanel.module.css'

/** Host facts of the fleet that the panel reads once. */
export interface FleetHostState {
  /** Parallel task limit; undefined until the Host answers. */
  capacity: number | undefined
}

/** Commands and Host facts supplied by the registration for one lead Session. */
export interface FleetInjected {
  hooks: { fleet: HostObservable<FleetHostState> }
  /**
   * Answer a pending decision.
   * @returns undefined once delivered, otherwise the failure message.
   */
  answer: (taskId: string, decisionId: string, choice: number) => Promise<string | undefined>
  /** Open a task's child Session beside the conversation. */
  openChild: (childId: SessionId) => void
}

/** Props of the fleet panel. */
export type FleetPanelProps = PropsRuntime<'sidebar.right.pane.tab'> & PropsLocale<typeof NS> & InjectFace<FleetInjected>

type T = TranslateNS<typeof NS>
type Summaries = Readonly<Record<SessionId, SessionSummary>>

const TICK_MS = 1_000

/** Current time, refreshed every second while the tab is visible. */
function useNow(visible: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!visible) return undefined
    setNow(Date.now())
    const timer = setInterval(() => { setNow(Date.now()) }, TICK_MS)
    return () => { clearInterval(timer) }
  }, [visible])
  return now
}

function tokensOf(summary: SessionSummary | undefined): number | undefined {
  const usage = summary?.projectionValues?.tokenUsage
  return usage === undefined ? undefined : usage.uncachedInputTokens + usage.outputTokens + usage.cacheReadTokens + usage.cacheWriteTokens
}

function elapsedOf(task: FleetTaskView, summary: SessionSummary | undefined, now: number): number | undefined {
  const timing = summary?.projectionValues?.subagentTiming
  if (timing !== undefined) return timing.settledMs + (timing.active === undefined ? 0 : Math.max(0, now - timing.active.since))
  return task.startedAt === undefined ? undefined : (task.finishedAt ?? now) - task.startedAt
}

function KindBadge({ task, t }: { readonly task: FleetTaskView; readonly t: T }): ReactNode {
  return (
    <span className={css.kind} data-kind={task.kind}>
      {task.kind === 'ship' ? <IconShip /> : <IconScout />}
      {task.kind === 'ship' ? t('fleetKindShip') : t('fleetKindScout')}
    </span>
  )
}

function SectionHead({ title, count }: { readonly title: string; readonly count: number }): ReactNode {
  return (
    <div className={css.sectionHead}>
      {title}
      <span className={css.count}>{count}</span>
      <span className={css.rule} />
    </div>
  )
}

interface CardProps {
  readonly task: FleetTaskView
  readonly summary: SessionSummary | undefined
  readonly now: number
  readonly t: T
  readonly open: (task: FleetTaskView) => void
  readonly answer: FleetInjected['answer']
}

function onActivate(task: FleetTaskView, open: (task: FleetTaskView) => void) {
  return {
    role: 'button',
    tabIndex: 0,
    onClick: () => { open(task) },
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      open(task)
    },
  } as const
}

/** The decision box and its answer buttons. */
function Decision({ task, t, answer }: Pick<CardProps, 'task' | 't' | 'answer'>): ReactNode {
  const [pending, setPending] = useState<number | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const decision = task.decision
  if (decision === undefined) return null
  const choose = async (choice: number): Promise<void> => {
    setPending(choice)
    setError(undefined)
    const failure = await answer(task.taskId, decision.id, choice)
    setPending(undefined)
    if (failure !== undefined) setError(t('fleetAnswerFailed', { error: failure }))
  }
  return (
    <>
      <div className={css.question}>{decision.question}</div>
      <div className={css.actions} onClick={(event) => { event.stopPropagation() }} onKeyDown={(event) => { event.stopPropagation() }}>
        {decision.options.map((option, index) => (
          <button
            key={option}
            type="button"
            className={css.answer}
            data-variant={index === 0 ? 'primary' : 'outline'}
            disabled={pending !== undefined}
            aria-busy={pending === index}
            onClick={() => { void choose(index) }}
          >
            {option}
          </button>
        ))}
      </div>
      {error === undefined ? null : <div className={css.error} role="alert">{error}</div>}
    </>
  )
}

/** A waiting or running task. */
function TaskCard({ task, summary, now, t, open, answer }: CardProps): ReactNode {
  const waiting = task.status === 'waiting'
  const current = nodeIndex(task.node)
  const elapsed = elapsedOf(task, summary, now)
  const tokens = tokensOf(summary)
  const waitedFor = task.decision === undefined ? undefined : coarse(now - task.decision.askedAt, t)
  const age = waiting
    ? waitedFor === undefined ? t('fleetWaitingNow') : t('fleetWaitingFor', { duration: waitedFor })
    : elapsed === undefined ? undefined : t('fleetRunningFor', { duration: clock(elapsed) })
  const time = [elapsed === undefined ? undefined : clock(elapsed), tokens === undefined ? undefined : t('fleetTokens', { value: compactTokens(tokens, t) })]
    .filter(part => part !== undefined).join(' · ')
  const tone = waiting ? 'wait' : task.kind
  return (
    <article className={css.card} data-state={task.status} data-tone={tone} title={t('fleetWatch')} {...onActivate(task, open)}>
      <div className={css.top}>
        <span className={css.ticket}>{task.ticket}</span>
        <KindBadge task={task} t={t} />
        <span className={css.spacer} />
        {age === undefined ? null : <span className={css.age}>{age}</span>}
      </div>
      <div className={css.body}>
        <div className={css.main}>
          <div className={css.name}>{task.title}</div>
          <dl className={css.meta}>
            {task.branch === undefined ? null : <><dt>{t('fleetMetaBranch')}</dt><dd className={css.mono}>{task.branch}</dd></>}
            {time === '' ? null : <><dt>{t('fleetMetaTime')}</dt><dd>{time}</dd></>}
          </dl>
        </div>
        <Vee current={current} label={nodeLabel(task.node, t)} />
      </div>
      {waiting ? <Decision task={task} t={t} answer={answer} /> : (
        <>
          <div className={css.progress} style={{ '--progress': `${Math.round(((current + 1) / 7) * 100)}%` } as CSSProperties}><i /></div>
          <div className={css.activity}>
            <span className={css.pulse} />
            <span className={css.activityText}>{task.activity ?? t('fleetStarting')}</span>
            <time>{ago(now - task.updatedAt, t)}</time>
          </div>
        </>
      )}
    </article>
  )
}

function FinishedRow({ task, t, open }: Pick<CardProps, 'task' | 't' | 'open'>): ReactNode {
  const mark = task.status === 'completed' ? <IconCheck /> : task.status === 'failed' ? <IconCross /> : <IconStop />
  const outcome = task.status === 'completed' ? t('fleetOutcomeCompleted') : task.status === 'failed' ? t('fleetOutcomeFailed') : t('fleetOutcomeCancelled')
  const clickable = task.childId !== undefined
  return (
    <div className={css.row} data-clickable={clickable} title={task.summary ?? outcome} {...clickable ? onActivate(task, open) : {}}>
      <span className={css.mark} data-outcome={task.status}>{mark}</span>
      <span className={css.ticket}>{task.ticket}</span>
      <span className={css.rowText}>
        <span className={css.rowName}>{task.title}</span>
        {task.status === 'failed' && task.summary !== undefined ? <span className={css.rowReason}>{task.summary}</span> : null}
      </span>
      <span className={css.rowMeta}>{outcome}</span>
    </div>
  )
}

/**
 * The fleet tab body.
 * @param props - the lead Session's projection, the commands, and copy.
 * @returns the panel.
 */
export function FleetPanel({ useProjection, useSessions, useTabInfo, useFleet, answer, openChild, t }: FleetPanelProps): ReactNode {
  const tasks = useProjection('vflowFleet') ?? []
  const summaries: Summaries = useSessions(state => state.byId)
  const capacity = useFleet(state => state.capacity)
  const { tab } = useTabInfo()
  const now = useNow(tab.visible)
  const groups = groupTasks(tasks)
  const open = (task: FleetTaskView): void => { if (task.childId !== undefined) openChild(task.childId) }
  const active = groups.running.length + groups.waiting.length
  const totalTokens = tasks.reduce((sum, task) => sum + (task.childId === undefined ? 0 : tokensOf(summaries[task.childId]) ?? 0), 0)
  const card = (task: FleetTaskView) => (
    <TaskCard
      key={task.taskId} task={task} summary={task.childId === undefined ? undefined : summaries[task.childId]}
      now={now} t={t} open={open} answer={answer}
    />
  )
  return (
    <div className={css.panel}>
      <header className={css.head}>
        <div className={css.titlebar}>
          <span className={css.emblem}><FleetEmblem /></span>
          <div className={css.titles}>
            <span className={css.title}>{t('fleetTitle')}</span>
            <span className={css.subtitle}>{t('fleetSubtitle', { count: tasks.length })}</span>
          </div>
        </div>
        <div className={css.stats}>
          <div className={css.stat} data-kind="running"><b>{groups.running.length}</b><span>{t('fleetStatRunning')}</span></div>
          <div className={css.stat} data-kind="waiting"><b>{groups.waiting.length}</b><span>{t('fleetStatWaiting')}</span></div>
          <div className={css.stat} data-kind="queued"><b>{groups.queued.length}</b><span>{t('fleetStatQueued')}</span></div>
          <div className={css.stat} data-kind="done"><b>{groups.finished.filter(task => task.status === 'completed').length}</b><span>{t('fleetStatDone')}</span></div>
        </div>
      </header>
      <div className={css.scroll}>
        {tasks.length === 0 ? (
          <div className={css.empty}>
            <span className={css.emptyEmblem}><FleetEmblem /></span>
            <div className={css.emptyTitle}>{t('fleetEmptyTitle')}</div>
            <div className={css.emptyBody}>{t('fleetEmptyBody')}</div>
          </div>
        ) : null}
        {groups.waiting.length === 0 ? null : (
          <section className={css.section}>
            <SectionHead title={t('fleetSectionWaiting')} count={groups.waiting.length} />
            {groups.waiting.map(card)}
          </section>
        )}
        {groups.running.length === 0 ? null : (
          <section className={css.section}>
            <SectionHead title={t('fleetSectionRunning')} count={groups.running.length} />
            {groups.running.map(card)}
          </section>
        )}
        {groups.queued.length === 0 ? null : (
          <section className={css.section}>
            <SectionHead title={t('fleetSectionQueued')} count={groups.queued.length} />
            {groups.queued.map((task, index) => (
              <div key={task.taskId} className={css.row}>
                <span className={css.queueMark}>{index + 1}</span>
                <span className={css.ticket}>{task.ticket}</span>
                <span className={css.rowText}><span className={css.rowName}>{task.title}</span></span>
                <span className={css.rowMeta}>{t('fleetQueuedHint')}</span>
              </div>
            ))}
          </section>
        )}
        {groups.finished.length === 0 ? null : (
          <section className={css.section}>
            <SectionHead title={t('fleetSectionFinished')} count={groups.finished.length} />
            {groups.finished.map(task => <FinishedRow key={task.taskId} task={task} t={t} open={open} />)}
          </section>
        )}
      </div>
      <footer className={css.foot}>
        <span>{t('fleetSlots')}</span>
        {capacity === undefined ? null : (
          <>
            <span className={css.slots}>
              {Array.from({ length: capacity }, (_slot, index) => <i key={index} data-on={index < active} />)}
            </span>
            <span>{`${Math.min(active, capacity)}/${capacity}`}</span>
          </>
        )}
        <span className={css.spacer} />
        {totalTokens === 0 ? null : <span>{t('fleetTotalTokens', { value: compactTokens(totalTokens, t) })}</span>}
      </footer>
    </div>
  )
}

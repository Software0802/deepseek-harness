/** The 日系开发工作流 settings page on the Plugins page: team settings, connector accounts, and the setup guide. */
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { Button, Input, Modal, StateDot, Tag, type StateDotState, type TagTone } from '@deepseek-ai/dsh-client-ui-primitives'
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { AccountInput, AccountTestResult, AccountView, ConnectorKind, TeamSettingsView } from '../types.ts'
import type { TestState, VflowPageState } from './mount.ts'
import type { NS, VflowKey } from './locales.ts'
import css from './VflowSettings.module.css'

/** Page store and commands supplied by the registration. */
export interface VflowInjected {
  hooks: { vflow: HostObservable<VflowPageState> }
  refresh: () => Promise<void>
  saveSource: (source: string) => Promise<boolean>
  accept: (sha256: string) => Promise<void>
  saveAccount: (connectorId: string, input: AccountInput) => Promise<boolean>
  removeAccount: (connectorId: string) => Promise<void>
  testAccount: (connectorId: string) => Promise<void>
  testAll: () => Promise<void>
}

/** Props of the settings page. */
export type VflowSettingsProps = PropsRuntime<'plugins.bundle.config'> & PropsLocale<typeof NS> & InjectFace<VflowInjected>

type T = VflowSettingsProps['t']
type Actions = Omit<VflowSettingsProps, 'useVflow' | 't' | 'view' | 'form'>

const KIND_KEY: Readonly<Record<ConnectorKind, VflowKey>> = {
  redmine: 'kindRedmine', jira: 'kindJira', gerrit: 'kindGerrit', svn: 'kindSvn', jenkins: 'kindJenkins', feishu: 'kindFeishu', wiki: 'kindWiki',
}

function shortSha(sha256: string): string {
  return sha256.slice(0, 8)
}

function teamStatus(view: TeamSettingsView | undefined): { key: VflowKey; tone: TagTone; dot: StateDotState } {
  if (view === undefined) return { key: 'statusLoading', tone: 'neutral', dot: 'ongoing' }
  switch (view.status) {
    case 'unconfigured': return { key: 'statusUnconfigured', tone: 'neutral', dot: 'idle' }
    case 'failed': return { key: 'statusFailed', tone: 'danger', dot: 'error' }
    case 'ready': return view.pending === undefined
      ? { key: 'statusReady', tone: 'success', dot: 'done' }
      : { key: 'statusPending', tone: 'warning', dot: 'warning' }
  }
}

function testText(result: AccountTestResult, t: T): string {
  if (result.ok) return t('testOk', { status: result.status })
  switch (result.reason) {
    case 'unauthorized': return t('testUnauthorized', { status: result.status })
    case 'unexpected-status': return t('testUnexpected', { status: result.status })
    case 'unreachable': return t('testUnreachable')
    case 'unsupported': return t('testUnsupported')
    case 'not-configured': return t('testNotConfigured')
  }
}

function TestBadge({ test, t }: { readonly test: TestState | undefined; readonly t: T }): ReactNode {
  if (test === undefined) return null
  if (test.status === 'running') return <Tag tone="info">{t('testing')}</Tag>
  return <Tag tone={test.result.ok ? 'success' : 'danger'}>{testText(test.result, t)}</Tag>
}

/** Team settings status, facts, source address, and pending update. */
function TeamSettingsCard({ state, actions, t }: { readonly state: VflowPageState; readonly actions: Actions; readonly t: T }): ReactNode {
  const sourceId = useId()
  const view = state.teamSettings
  const [draft, setDraft] = useState<string | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const source = draft ?? view?.source ?? ''
  const status = teamStatus(view)
  const save = async (): Promise<void> => {
    setSaving(true)
    try {
      if (await actions.saveSource(source)) setDraft(undefined)
    } finally {
      setSaving(false)
    }
  }
  const current = view?.status === 'ready' ? view.current : undefined
  const pending = view?.status === 'ready' ? view.pending : undefined
  return <section className={css.card} data-vflow-card="team">
    <header className={css.cardHead}>
      <span className={css.glyph} aria-hidden="true"><TeamGlyph /></span>
      <div className={css.headText}>
        <div className={css.titleRow}>
          <h4 className={css.cardTitle}>{t('teamTitle')}</h4>
          <span className={css.status}><StateDot state={status.dot} size={8} /><Tag tone={status.tone}>{t(status.key)}</Tag></span>
        </div>
        <p className={css.hint}>{t('teamHint')}</p>
      </div>
    </header>
    {current !== undefined && <div className={css.summary}>
      <div className={css.teamName}>{current.name}</div>
      <div className={css.facts}>
        <span className={css.fact}><code>{t('version', { sha: shortSha(current.sha256) })}</code></span>
        <span className={css.fact}>{t('connectors', { count: current.connectorCount })}</span>
        <span className={css.fact}>{t('projects', { count: current.projects.length })}</span>
        <span className={css.fact}>{t('reviewer', { name: current.defaultReviewer })}</span>
      </div>
    </div>}
    {view?.status === 'unconfigured' && <p className={css.empty}>{t('unconfiguredBody')}</p>}
    <div className={css.field}>
      <label htmlFor={sourceId} className={css.label}>{t('source')}</label>
      <div className={css.sourceRow}>
        <div className={css.grow}><Input id={sourceId} value={source} placeholder={t('sourcePlaceholder')} spellCheck={false}
          disabled={!state.writable || saving} onChange={(event) => { setDraft(event.target.value) }} /></div>
        <Button variant="primary" size="sm" disabled={!state.writable || saving || draft === undefined}
          onClick={() => { void save() }}>{t(saving ? 'saving' : 'saveSource')}</Button>
        <Button variant="outline" size="sm" disabled={state.checking || view === undefined || view.source === ''}
          onClick={() => { void actions.refresh() }}>{t(state.checking ? 'checking' : 'checkNow')}</Button>
      </div>
      <p className={css.hint}>{state.writable ? t('sourceHint') : t('readOnly')}</p>
    </div>
    {current !== undefined && pending !== undefined && <div className={css.banner} data-tone="warning" role="status">
      <div className={css.bannerText}>
        <strong>{t('pendingTitle', { name: pending.name })}</strong>
        <span>{t('pendingBody', { sha: shortSha(pending.sha256), current: shortSha(current.sha256) })}</span>
      </div>
      <Button variant="primary" size="sm" onClick={() => { void actions.accept(pending.sha256) }}>{t('accept')}</Button>
    </div>}
    {view?.status === 'ready' && view.sourceError !== undefined
      && <p className={css.banner} data-tone="warning" role="status">{t('sourceError', { error: view.sourceError })}</p>}
    {view?.status === 'failed' && <p className={css.banner} data-tone="danger" role="alert">{t('failed', { error: view.error })}</p>}
  </section>
}

/** One connector row with its inline account editor. */
function AccountRow({ account, test, actions, t }: {
  readonly account: AccountView
  readonly test: TestState | undefined
  readonly actions: Actions
  readonly t: T
}): ReactNode {
  const usernameId = useId(), secretId = useId()
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(account.username ?? '')
  const [secret, setSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const kind = t(KIND_KEY[account.kind])
  const save = async (): Promise<void> => {
    setSaving(true)
    try {
      if (await actions.saveAccount(account.connectorId, { username: username.trim(), secret })) {
        setSecret('')
        setEditing(false)
      }
    } finally {
      setSaving(false)
    }
  }
  return <li className={css.account} data-vflow-account={account.connectorId}>
    <div className={css.accountLine}>
      <span className={css.monogram} data-kind={account.kind} aria-hidden="true">{kind.slice(0, 1)}</span>
      <div className={css.accountMain}>
        <div className={css.accountTitle}><span>{account.connectorId}</span><Tag tone="outline">{kind}</Tag></div>
        <code className={css.url}>{account.url}</code>
      </div>
      <div className={css.accountState}>
        <span className={css.status}>
          <StateDot state={account.configured ? 'done' : 'idle'} size={8} />
          <span className={css.stateText}>{account.username === undefined ? t('notConfigured') : t('configured', { username: account.username })}</span>
        </span>
        <TestBadge test={test} t={t} />
      </div>
      <div className={css.accountActions}>
        {account.testable && <Button size="sm" variant="outline" disabled={!account.configured || test?.status === 'running'}
          onClick={() => { void actions.testAccount(account.connectorId) }}>{t(test?.status === 'running' ? 'testing' : 'test')}</Button>}
        <Button size="sm" variant={account.configured ? 'ghost' : 'primary'} onClick={() => { setEditing(!editing) }}>
          {t(account.configured ? 'edit' : 'register')}
        </Button>
        {account.configured && <Button size="sm" variant="ghost" className={css.danger}
          onClick={() => { void actions.removeAccount(account.connectorId) }}>{t('remove')}</Button>}
      </div>
    </div>
    {editing && <form className={css.editor} onSubmit={(event) => { event.preventDefault(); void save() }}>
      <div className={css.editorField}>
        <label htmlFor={usernameId} className={css.label}>{t('username')}</label>
        <Input id={usernameId} value={username} autoComplete="username" spellCheck={false} disabled={saving}
          onChange={(event) => { setUsername(event.target.value) }} />
      </div>
      <div className={css.editorField}>
        <label htmlFor={secretId} className={css.label}>{t('secret')}</label>
        <Input id={secretId} type="password" value={secret} autoComplete="current-password" disabled={saving}
          onChange={(event) => { setSecret(event.target.value) }} />
      </div>
      <div className={css.editorActions}>
        <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => { setEditing(false); setSecret('') }}>{t('cancel')}</Button>
        <Button type="submit" size="sm" variant="primary" disabled={saving || username.trim() === '' || secret === ''}>{t(saving ? 'saving' : 'save')}</Button>
      </div>
    </form>}
  </li>
}

/** Every connector of the adopted team settings with the user's account. */
function AccountsCard({ state, actions, t }: { readonly state: VflowPageState; readonly actions: Actions; readonly t: T }): ReactNode {
  return <section className={css.card} data-vflow-card="accounts">
    <header className={css.cardHead}>
      <span className={css.glyph} aria-hidden="true"><KeyGlyph /></span>
      <div className={css.headText}>
        <h4 className={css.cardTitle}>{t('accountsTitle')}</h4>
        <p className={css.hint}>{t('accountsHint')}</p>
      </div>
    </header>
    {state.accounts.length === 0
      ? <p className={css.empty}>{t('accountsEmpty')}</p>
      : <ul className={css.accounts}>
        {state.accounts.map(account => <AccountRow key={account.connectorId} account={account}
          test={state.tests[account.connectorId]} actions={actions} t={t} />)}
      </ul>}
  </section>
}

interface Check { readonly key: VflowKey; readonly passed: boolean }

function checksOf(state: VflowPageState): readonly Check[] {
  const testable = state.accounts.filter(account => account.testable)
  return [
    { key: 'checkTeam', passed: state.teamSettings?.status === 'ready' },
    { key: 'checkAccounts', passed: state.accounts.length > 0 && state.accounts.every(account => account.configured) },
    { key: 'checkTests', passed: testable.every((account) => {
      const test = state.tests[account.connectorId]
      return test?.status === 'done' && test.result.ok
    }) },
  ]
}

const STEPS: readonly VflowKey[] = ['stepTeam', 'stepAccounts', 'stepCheck', 'stepDone']

/** Four-step setup guide over the same cards. */
function SetupGuide({ open, onClose, state, actions, t }: {
  readonly open: boolean
  readonly onClose: () => void
  readonly state: VflowPageState
  readonly actions: Actions
  readonly t: T
}): ReactNode {
  const [step, setStep] = useState(0)
  useEffect(() => { if (open) setStep(0) }, [open])
  const checks = checksOf(state)
  const last = step === STEPS.length - 1
  const canAdvance = step !== 0 || state.teamSettings?.status === 'ready'
  return <Modal open={open} onClose={onClose} title={t('wizardTitle')} description={t('wizardDescription')} closeLabel={t('close')}
    className={css.guide as string} contentClassName={css.guideContent as string}
    footer={<div className={css.guideFooter}>
      <span className={css.hint}>{t('stepLabel', { index: step + 1, total: STEPS.length })}</span>
      <div className={css.guideButtons}>
        {step > 0 && !last && <Button size="sm" variant="ghost" onClick={() => { setStep(step - 1) }}>{t('back')}</Button>}
        {last
          ? <Button size="sm" variant="primary" onClick={onClose}>{t('finish')}</Button>
          : <Button size="sm" variant="primary" disabled={!canAdvance} onClick={() => { setStep(step + 1) }}>{t('next')}</Button>}
      </div>
    </div>}>
    <div className={css.guideBody}>
      <ol className={css.stepper}>
        {STEPS.map((key, index) => <li key={key} className={css.step} data-state={index < step ? 'done' : index === step ? 'current' : 'todo'}>
          <span className={css.stepDot}>{index < step ? <CheckGlyph /> : index + 1}</span>
          <span className={css.stepName}>{t(key)}</span>
        </li>)}
      </ol>
      {step === 0 && <TeamSettingsCard state={state} actions={actions} t={t} />}
      {step === 1 && <AccountsCard state={state} actions={actions} t={t} />}
      {step === 2 && <section className={css.card}>
        <ul className={css.checks}>
          {checks.map(check => <li key={check.key} className={css.check} data-passed={check.passed}>
            <StateDot state={check.passed ? 'done' : 'warning'} size={10} />
            <span className={css.grow}>{t(check.key)}</span>
            <Tag tone={check.passed ? 'success' : 'warning'}>{t(check.passed ? 'checkPassed' : 'checkMissing')}</Tag>
          </li>)}
        </ul>
        <div className={css.checkActions}>
          <Button size="sm" variant="outline" onClick={() => { void actions.refresh().then(actions.testAll) }}>{t('runChecks')}</Button>
        </div>
      </section>}
      {last && <section className={css.done}>
        <span className={css.doneGlyph} aria-hidden="true"><CheckGlyph /></span>
        <h4 className={css.cardTitle}>{t('doneTitle')}</h4>
        <p className={css.hint}>{t('doneBody')}</p>
      </section>}
    </div>
  </Modal>
}

/**
 * Render the plugin's settings page, or its one-line summary.
 * @param props - page store, commands, and the Plugins page view mode.
 * @returns the page or summary.
 */
export function VflowSettings(props: VflowSettingsProps): ReactNode {
  const { t } = props
  const state = props.useVflow(value => value)
  const [guide, setGuide] = useState(false)
  if (props.view === 'summary') return t('summary')
  return <div className={css.page} data-vflow-settings>
    <div className={css.toolbar}>
      <Button size="sm" variant="primary" icon={<SparkGlyph />} onClick={() => { setGuide(true) }}>{t('wizard')}</Button>
    </div>
    {state.error !== undefined && <p className={css.banner} data-tone="danger" role="alert">{t('operationFailed', { error: state.error })}</p>}
    <TeamSettingsCard state={state} actions={props} t={t} />
    <AccountsCard state={state} actions={props} t={t} />
    <SetupGuide open={guide} onClose={() => { setGuide(false) }} state={state} actions={props} t={t} />
  </div>
}

function TeamGlyph(): ReactNode {
  return <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5.5h12M4 10h12M4 14.5h7" /><circle cx="15" cy="14.5" r="1.75" />
  </svg>
}

function KeyGlyph(): ReactNode {
  return <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7" cy="10" r="3.25" /><path d="M10.25 10H17M14.5 10v2.5M16.75 10v1.75" />
  </svg>
}

function CheckGlyph(): ReactNode {
  return <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 8.25 6.5 11l6-6.5" />
  </svg>
}

function SparkGlyph(): ReactNode {
  return <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M8 1.5c.3 2.9 1.6 4.2 4.5 4.5-2.9.3-4.2 1.6-4.5 4.5-.3-2.9-1.6-4.2-4.5-4.5 2.9-.3 4.2-1.6 4.5-4.5Zm4.5 8c.15 1.45.8 2.1 2.25 2.25-1.45.15-2.1.8-2.25 2.25-.15-1.45-.8-2.1-2.25-2.25 1.45-.15 2.1-.8 2.25-2.25Z" />
  </svg>
}

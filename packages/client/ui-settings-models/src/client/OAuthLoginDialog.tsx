/**
 * Subscription (OAuth) login dialog: begin one device-code login on the host,
 * show the code and the authorization page, poll until the user authorizes,
 * and report success or failure. The host stores the credential itself before
 * reporting success, so closing this dialog with `changed` is enough to make
 * the provider usable — the page reload shows the configured dot.
 */

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { messageOf } from './store.ts'
import type { en } from './locales.ts'
import styles from './ModelsSection.module.css'

/** Poll interval while the user has not authorized yet. */
const POLL_INTERVAL_MS = 2000

/** Injected dependencies of {@link OAuthLoginDialog}. */
export interface OAuthLoginDialogProps {
  /** The settings namespace whose flows serve the route. */
  settingsNs: string
  /** Provider route to authenticate. */
  provider: string
  /** Provider name for titles. */
  displayName: string
  /** The login's own selector label, when the adapter shipped one. */
  oauthLoginLabel?: string
  /** Wire faces the dialog polls and cancels through. */
  api: Pick<IApiClient, 'llm'>
  /** Section copy. */
  t: (key: keyof typeof en) => string
  /** Close the dialog; `changed` reports whether a login committed. */
  onClose: (changed: boolean) => void
}

/** The wire view of a begun login. */
interface BegunLogin {
  id: string
  userCode: string
  verificationUri: string
  expiresInSeconds?: number
}

/** Replace the one provider placeholder in localized copy. */
function loginCopy(template: string, displayName: string): string {
  return template.replace('{provider}', () => displayName)
}

/**
 * Render the subscription login dialog for one provider route.
 * @param props - the route, wire face, copy, and close callback.
 * @returns the modal, closed (null) once the flow settled or was dismissed.
 */
export function OAuthLoginDialog(props: OAuthLoginDialogProps): ReactNode {
  const { settingsNs, provider, displayName, api, t, onClose } = props
  const [login, setLogin] = useState<BegunLogin | undefined>(undefined)
  const [state, setState] = useState<'starting' | 'waiting' | 'success' | 'failed'>('starting')
  const [failure, setFailure] = useState<string | undefined>(undefined)

  useEffect(() => {
    let stale = false
    let poll: ReturnType<typeof setInterval> | undefined
    const stop = (): void => {
      if (poll !== undefined) clearInterval(poll)
    }
    void api.llm.oauthBegin({ settingsNs, provider }).then(
      (response) => {
        if (stale) return
        // Capture the result before any closure: property narrowing does not
        // survive into the poll interval below.
        const result = response.result
        if (!result.ok) {
          setState('failed')
          setFailure(result.error.message)
          return
        }
        setLogin(result.value)
        setState('waiting')
        // Poll immediately, then on an interval until the host reports a
        // terminal state; a transport failure stops the loop and shows the
        // error rather than retrying forever.
        const pollOnce = (): void => {
          void api.llm.oauthPoll({ settingsNs, id: result.value.id }).then(
            (polled) => {
              if (stale) return
              const polledResult = polled.result
              if (!polledResult.ok) {
                stop()
                setState('failed')
                setFailure(polledResult.error.message)
                return
              }
              if (polledResult.value.status === 'pending') return
              stop()
              if (polledResult.value.status === 'success') {
                setState('success')
              } else {
                setState('failed')
                setFailure(polledResult.value.error)
              }
            },
            (error: unknown) => {
              if (stale) return
              stop()
              setState('failed')
              setFailure(messageOf(error))
            },
          )
        }
        pollOnce()
        poll = setInterval(pollOnce, POLL_INTERVAL_MS)
      },
      (error: unknown) => {
        if (stale) return
        setState('failed')
        setFailure(messageOf(error))
      },
    )
    return () => {
      stale = true
      stop()
    }
  }, [api.llm, settingsNs, provider])

  const cancel = (): void => {
    if (login !== undefined) {
      // Best-effort: the host's own flow also expires the code eventually.
      void api.llm.oauthCancel({ settingsNs, id: login.id })
    }
    onClose(false)
  }

  const close = (changed: boolean): void => { onClose(changed) }

  return (
    <Modal
      open
      onClose={cancel}
      title={loginCopy(t('oauthDialogTitle'), displayName)}
      closeLabel={t('close')}
      className={styles['oauthDialog'] as string}
      footer={(
        <>
          {state === 'waiting' || state === 'starting'
            ? <Button variant="outline" onClick={cancel}>{t('oauthCancelLogin')}</Button>
            : <Button variant="outline" onClick={() => { close(state === 'success') }}>
              {state === 'success' ? t('apply') : t('close')}
            </Button>}
        </>
      )}
    >
      {state === 'starting'
        ? <p className={styles['oauthWaiting']}>{t('oauthWaiting')}</p>
        : null}
      {state === 'waiting' && login !== undefined
        ? (
          <>
            <p className={styles['oauthIntro']}>{t('oauthDialogIntro')}</p>
            <p className={styles['oauthCode']} aria-label={t('oauthUserCode')}>
              {login.userCode}
            </p>
            <a
              className={styles['oauthLink']}
              href={login.verificationUri}
              target="_blank"
              rel="noreferrer"
            >
              {t('oauthOpenPage')}
            </a>
            <p className={styles['oauthWaiting']}>{t('oauthWaiting')}</p>
          </>
        )
        : null}
      {state === 'success'
        ? <p className={styles['oauthSuccess']} role="status" aria-live="polite">{t('oauthSuccess')}</p>
        : null}
      {state === 'failed' && failure !== undefined
        ? <p className={styles['error']}>{`${t('oauthFailed')}: ${failure}`}</p>
        : null}
    </Modal>
  )
}

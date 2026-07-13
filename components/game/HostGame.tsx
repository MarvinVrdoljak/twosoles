'use client'

import {useEffect, useRef, useState} from 'react'
import {useTranslations} from 'next-intl'
import {
  ArrowUpRight,
  Check,
  Info,
  Monitor,
  Moon,
  RotateCcw,
  Settings,
  Smartphone,
  Sun,
  SquarePen,
  X,
} from 'lucide-react'
import {Link} from '@/i18n/navigation'
import {CommonBadge} from '@/components/common/CommonBadge'
import {CommonButton} from '@/components/common/CommonButton'
import {CommonModal} from '@/components/common/CommonModal'
import {useToast} from '@/components/common/CommonToast'
import {saveGameStateAction} from '@/utility/game/actions'
import {useGameChannel} from '@/utility/game/useGameChannel'
import type {GameState, GameTheme} from '@/utility/game/types'
import styles from './HostGame.module.css'

type HostGameProps = {
  eventId: string
  person1: {name: string; color: string}
  person2: {name: string; color: string}
  questions: string[]
  initialTheme?: GameTheme
  // Max guests for the event's package — drives the "full" warning.
  capacity: number
  // Persisted snapshot to resume from after a reload (null = fresh lobby).
  initialState?: GameState | null
}

export function HostGame({
  eventId,
  person1,
  person2,
  questions,
  initialTheme = 'light',
  capacity,
  initialState = null,
}: HostGameProps) {
  const t = useTranslations('game')
  const {toast} = useToast()
  const {state, setState, guestCount, atCapacity, connected} = useGameChannel(
    eventId,
    'host',
    initialState?.theme ?? initialTheme,
    capacity,
    initialState,
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)

  const resetPoll = () => {
    setState((s) => ({...s, phase: 'lobby', questionIndex: 0, votes: [0, 0], results: {}}))
    // The reset only reaches the display + guests when the channel is live; if
    // it isn't connected, warn that they may not have reset with the host.
    if (connected) {
      toast(t('host.resetSuccess'), 'success')
    } else {
      toast(t('host.resetError'), 'error')
    }
  }

  const persons = [person1, person2]
  const total = state.votes[0] + state.votes[1]
  // Never show more players than the package allows; the surplus see the "full" screen.
  const shownGuests = Math.min(guestCount, capacity)
  // How many guests are currently locked out (present but past the cap).
  const waiting = Math.max(0, guestCount - capacity)
  const isLast = state.questionIndex >= questions.length - 1

  const advance = () => {
    setState((s) => {
      switch (s.phase) {
        case 'lobby':
          return {...s, phase: 'question', questionIndex: 0, votes: [0, 0]}
        case 'question':
          return {...s, phase: 'closed'}
        case 'closed':
          // Kick off the dramatic 3-2-1 build-up on the display; the timer
          // below auto-advances to the reveal (host can also skip it manually).
          return {...s, phase: 'countdown'}
        case 'countdown':
          // Reveal and persist this question's final tally for the overview.
          return {...s, phase: 'reveal', results: {...s.results, [s.questionIndex]: s.votes}}
        case 'reveal':
          return isLast
            ? {...s, phase: 'finished'}
            : {...s, phase: 'question', questionIndex: s.questionIndex + 1, votes: [0, 0]}
        default:
          return s
      }
    })
  }

  // The countdown is a fixed build-up; once it's shown, auto-advance to the
  // reveal (persisting the tally). Guarded so a manual "reveal" tap that already
  // moved us on doesn't get double-advanced, and cleaned up if the host steps
  // back. Only the host runs this component, so it stays the single authority.
  useEffect(() => {
    if (state.phase !== 'countdown') return
    const id = setTimeout(() => {
      setState((s) =>
        s.phase === 'countdown'
          ? {...s, phase: 'reveal', results: {...s.results, [s.questionIndex]: s.votes}}
          : s,
      )
    }, 3200)
    return () => clearTimeout(id)
  }, [state.phase, setState])

  // Persist the authoritative state so a host reload/disconnect resumes the game
  // instead of resetting everyone. Debounced because votes change state rapidly.
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(() => {
      void saveGameStateAction(eventId, state)
    }, 700)
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current)
    }
  }, [eventId, state])

  const primaryLabel: Record<string, string> = {
    lobby: t('host.start'),
    question: t('host.closeVoting'),
    closed: t('host.reveal'),
    countdown: t('host.reveal'),
    reveal: isLast ? t('host.finish') : t('host.next'),
    finished: '',
  }

  // Reverse of advance(): step one phase back so the host can undo a misclick.
  const goBack = () => {
    setState((s) => {
      switch (s.phase) {
        case 'question':
          if (s.questionIndex === 0) return {...s, phase: 'lobby', votes: [0, 0]}
          // Back to the previous question, showing its saved result again.
          return {
            ...s,
            phase: 'reveal',
            questionIndex: s.questionIndex - 1,
            votes: s.results[s.questionIndex - 1] ?? [0, 0],
          }
        case 'closed':
          return {...s, phase: 'question'}
        case 'reveal': {
          // Undo the reveal: drop the saved tally and re-close voting.
          const results = {...s.results}
          delete results[s.questionIndex]
          return {...s, phase: 'closed', results}
        }
        case 'finished':
          return {...s, phase: 'reveal'}
        default:
          return s
      }
    })
  }

  const backLabel: Record<string, string> = {
    lobby: '',
    question: state.questionIndex === 0 ? t('host.backToLobby') : t('host.backToPrevious'),
    closed: t('host.reopenVoting'),
    // Countdown is a transient 3-2-1 build-up that auto-advances — no back button.
    countdown: '',
    reveal: t('host.undoReveal'),
    finished: t('host.backToResult'),
  }

  // Current-phase label so the host always sees which screen the guests are on.
  const statusLabel: Record<string, string> = {
    question: t('host.statusLive'),
    closed: t('host.votingClosed'),
    countdown: t('host.statusRevealing'),
    reveal: t('host.statusRevealed'),
  }

  const inRound = state.phase !== 'lobby' && state.phase !== 'finished'

  return (
    <div className={styles.root} data-theme={state.theme}>
      <header className={styles.topbar}>
        <span className={styles.logo}>{t('host.panel')}</span>
        <button
          type="button"
          className={styles.gear}
          onClick={() => setSettingsOpen((open) => !open)}
          aria-label={t('host.settingsTitle')}
        >
          {settingsOpen ? (
            <X size={20} aria-hidden="true" />
          ) : (
            <Settings size={20} aria-hidden="true" />
          )}
        </button>
      </header>

      {settingsOpen ? (
        <div className={`${styles.content} ${styles.settingsView}`}>
          <h1 className={styles.settingsTitle}>{t('host.settingsTitle')}</h1>

          {/* Appearance */}
          <div className={styles.group}>
            <p className={styles.sectionLabel}>{t('host.appearance')}</p>
            <section className={`${styles.groupCard} ${styles.groupCardTip}`}>
              <div className={styles.row}>
                <span className={styles.rowIcon}>
                  {state.theme === 'dark' ? (
                    <Moon size={20} aria-hidden="true" />
                  ) : (
                    <Sun size={20} aria-hidden="true" />
                  )}
                </span>
                <span className={styles.rowLabel}>
                  {t('host.themeLabel')}
                  <span className={styles.infoWrap}>
                    <button type="button" className={styles.info} aria-label={t('host.themeHint')}>
                      <Info size={15} aria-hidden="true" />
                    </button>
                    <span className={styles.tooltip} role="tooltip">
                      {t('host.themeHint')}
                    </span>
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={state.theme === 'dark'}
                  aria-label={t('host.themeLabel')}
                  className={`${styles.themeToggle} ${state.theme === 'dark' ? styles.themeToggleOn : ''}`}
                  onClick={() =>
                    setState((s) => ({...s, theme: s.theme === 'dark' ? 'light' : 'dark'}))
                  }
                >
                  <span className={styles.themeThumb}>
                    {state.theme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
                  </span>
                </button>
              </div>
            </section>
          </div>

          {/* Actions */}
          <div className={styles.group}>
            <p className={styles.sectionLabel}>{t('host.actionsTitle')}</p>
            <section className={styles.groupCard}>
              <Link
                href={`/display/${eventId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.row}
              >
                <span className={styles.rowIcon}>
                  <Monitor size={20} aria-hidden="true" />
                </span>
                <span className={styles.rowLabel}>{t('host.openDisplay')}</span>
                <ArrowUpRight size={18} className={styles.rowTrail} aria-hidden="true" />
              </Link>
              <Link
                href={`/guest/${eventId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.row}
              >
                <span className={styles.rowIcon}>
                  <Smartphone size={20} aria-hidden="true" />
                </span>
                <span className={styles.rowLabel}>{t('host.openGuest')}</span>
                <ArrowUpRight size={18} className={styles.rowTrail} aria-hidden="true" />
              </Link>
              <Link href={`/dashboard/events/${eventId}`} target="_blank" className={styles.row}>
                <span className={styles.rowIcon}>
                  <SquarePen size={20} aria-hidden="true" />
                </span>
                <span className={styles.rowLabel}>{t('host.editEvent')}</span>
                <ArrowUpRight size={18} className={styles.rowTrail} aria-hidden="true" />
              </Link>
            </section>
          </div>

          {/* Reset */}
          <div className={styles.group}>
            <CommonButton variant="danger" size="md" onClick={() => setConfirmResetOpen(true)}>
              <RotateCcw size={18} aria-hidden="true" />
              {t('host.resetPoll')}
            </CommonButton>
          </div>
        </div>
      ) : (
        <div className={styles.content}>
          {atCapacity ? (
            <div className={styles.capacityWarning} role="status">
              <span>{t('host.capacityReached', {capacity})}</span>
              {waiting > 0 ? (
                <span className={styles.capacityWaiting}>{t('host.capacityWaiting', {count: waiting})}</span>
              ) : null}
            </div>
          ) : null}
          {!inRound ? (
            <section className={styles.card}>
              <h1 className={styles.h1}>
                {state.phase === 'finished' ? t('host.finishedTitle') : t('host.lobbyTitle')}
              </h1>
              <p className={styles.muted}>
                {state.phase === 'finished' ? t('host.finishedText') : t('host.lobbyText')}
              </p>
            </section>
          ) : (
            <section className={styles.card}>
              <div className={styles.qHead}>
                <span className={styles.qNum}>
                  {t('host.questionOf', {
                    current: state.questionIndex + 1,
                    total: questions.length,
                  })}
                </span>
                <CommonBadge variant="success" pulse>
                  {t('host.guests', {count: shownGuests})}
                </CommonBadge>
              </div>
              <p className={styles.question}>{questions[state.questionIndex]}</p>
              <div className={styles.voteCards}>
                {persons.map((person, index) => (
                  <div key={index} className={styles.voteCard}>
                    <span className={styles.voteName}>{person.name}</span>
                    <span className={styles.voteNum}>{state.votes[index]}</span>
                    <span className={styles.voteLabel}>{t('host.votesLabel')}</span>
                  </div>
                ))}
              </div>
              <p className={styles.total}>{t('host.votesTotal', {count: total})}</p>
              {statusLabel[state.phase] ? (
                <div className={styles.statusRow}>
                  <CommonBadge
                    variant={state.phase === 'question' ? 'success' : 'neutral'}
                    pulse={state.phase === 'question'}
                  >
                    {statusLabel[state.phase]}
                  </CommonBadge>
                </div>
              ) : null}
            </section>
          )}

          {primaryLabel[state.phase] ? (
            <button type="button" className={styles.primary} onClick={advance}>
              {primaryLabel[state.phase]}
            </button>
          ) : null}

          {backLabel[state.phase] ? (
            <button type="button" className={styles.secondary} onClick={goBack}>
              <RotateCcw size={16} aria-hidden="true" />
              {backLabel[state.phase]}
            </button>
          ) : null}

          <section className={styles.listSection}>
            <h2 className={styles.listTitle}>{t('host.questionsTitle')}</h2>
            <ul className={styles.qList}>
              {questions.map((q, index) => {
                const result = state.results[index]
                const answered = result !== undefined
                const current = index === state.questionIndex && inRound
                return (
                  <li key={index}>
                    <div className={`${styles.qItem} ${current ? styles.qItemCurrent : ''}`}>
                      <span
                        className={`${styles.qBadge} ${answered ? styles.qBadgeDone : ''} ${
                          current ? styles.qBadgeCurrent : ''
                        }`}
                      >
                        {answered ? <Check size={14} aria-hidden="true" /> : index + 1}
                      </span>
                      <span className={styles.qItemText}>{q}</span>
                      {answered ? (
                        <span className={styles.qResult}>
                          <span className={styles.qResultNum} style={{color: person1.color}}>
                            {result[0]}
                          </span>
                          <span className={styles.qResultSep} aria-hidden="true">
                            :
                          </span>
                          <span className={styles.qResultNum} style={{color: person2.color}}>
                            {result[1]}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      )}

      <CommonModal
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        title={t('host.resetConfirmTitle')}
        closeLabel={t('host.close')}
        footer={
          <>
            <CommonButton variant="secondary" size="md" onClick={() => setConfirmResetOpen(false)}>
              {t('host.resetCancel')}
            </CommonButton>
            <CommonButton
              variant="danger"
              size="md"
              onClick={() => {
                resetPoll()
                setConfirmResetOpen(false)
              }}
            >
              {t('host.resetConfirm')}
            </CommonButton>
          </>
        }
      >
        <p className={styles.confirmText}>{t('host.resetConfirmText')}</p>
      </CommonModal>
    </div>
  )
}

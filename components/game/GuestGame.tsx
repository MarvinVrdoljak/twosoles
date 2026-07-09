'use client'

import {useEffect, useState} from 'react'
import {useTranslations} from 'next-intl'
import {AnimatePresence, motion} from 'motion/react'
import {Heart} from 'lucide-react'
import {useGameChannel} from '@/utility/game/useGameChannel'
import type {GameTheme} from '@/utility/game/types'
import styles from './GuestGame.module.css'

type Person = {name: string; color: string}

type GuestGameProps = {
  eventId: string
  coupleName: string
  person1: Person
  person2: Person
  questions: string[]
  initialTheme?: GameTheme
  // Max guests for the event's package; guests past it see the "full" screen.
  capacity: number
}

const fade = {
  initial: {opacity: 0, y: 12},
  animate: {opacity: 1, y: 0},
  exit: {opacity: 0, y: -12},
  transition: {duration: 0.35, ease: 'easeOut'},
} as const

const ACTIVE_PHASES = ['question', 'closed', 'countdown', 'reveal']

export function GuestGame({
  eventId,
  coupleName,
  person1,
  person2,
  questions,
  initialTheme = 'light',
  capacity,
}: GuestGameProps) {
  const t = useTranslations('game')
  const {state, sendVote, overCapacity} = useGameChannel(eventId, 'guest', initialTheme, capacity)
  const [voted, setVoted] = useState<0 | 1 | null>(null)

  useEffect(() => {
    setVoted(null)
  }, [state.questionIndex])

  const persons = [person1, person2]
  const question = questions[state.questionIndex] ?? ''

  const vote = (index: 0 | 1) => {
    if (voted !== null) return
    setVoted(index)
    sendVote(index)
  }

  const active = ACTIVE_PHASES.includes(state.phase)

  // Bottom action: either the two vote buttons, or a status pill + hint line.
  const renderAction = () => {
    if (state.phase === 'question' && voted === null) {
      return (
        <div key="buttons" className={styles.options}>
          {persons.map((person, index) => (
            <button
              key={index}
              type="button"
              className={styles.option}
              style={{background: person.color}}
              onClick={() => vote(index as 0 | 1)}
            >
              {person.name}
            </button>
          ))}
        </div>
      )
    }

    let pill = ''
    let hint = ''
    if (state.phase === 'question') {
      pill = t('guest.votedFor', {name: voted !== null ? persons[voted].name : ''})
      hint = t('guest.waitingResult')
    } else if (state.phase === 'closed') {
      pill = t('guest.votingEnded')
      hint = t('guest.resultSoon')
    } else {
      pill = t('guest.lookAtScreen')
      hint = t('guest.nextComing')
    }

    return (
      <div key="status" className={styles.status}>
        <span className={styles.statusPill}>{pill}</span>
        <p className={styles.statusHint}>{hint}</p>
      </div>
    )
  }

  // Joined past the package's guest limit — no seat, so show a full-room notice
  // instead of the game (a seat may free up if an earlier guest leaves).
  if (overCapacity) {
    return (
      <div className={styles.root} data-theme={state.theme}>
        <div className={styles.stage}>
          <div className={styles.center}>
            <p className={styles.eyebrow}>{coupleName}</p>
            <h1 className={styles.big}>{t('guest.fullTitle')}</h1>
            <p className={styles.note}>{t('guest.fullText', {capacity})}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root} data-theme={state.theme}>
      {active ? (
        <>
          <header className={styles.header}>
            <p className={styles.eyebrow}>{t('display.eyebrowQuestion')}</p>
            <p className={styles.couple}>{coupleName}</p>
            <p className={styles.progress}>
              {t('guest.questionOf', {current: state.questionIndex + 1, total: questions.length})}
            </p>
            <span className={styles.divider} aria-hidden="true">
              <span className={styles.dividerLine} />
              <Heart size={16} className={styles.dividerHeart} />
              <span className={styles.dividerLine} />
            </span>
          </header>

          <div className={styles.questionZone}>
            <AnimatePresence mode="wait">
              <motion.h1 key={`${state.questionIndex}-q`} className={styles.question} {...fade}>
                {question}
              </motion.h1>
            </AnimatePresence>
          </div>

          <div className={styles.actionZone}>
            <AnimatePresence mode="wait">
              <motion.div
                key={
                  state.phase === 'question'
                    ? voted === null
                      ? 'vote'
                      : 'voted'
                    : state.phase
                }
                className={styles.actionInner}
                {...fade}
              >
                {renderAction()}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      ) : (
        <div className={styles.stage}>
          <AnimatePresence mode="wait">
            {state.phase === 'finished' ? (
              <motion.div key="finished" className={styles.center} {...fade}>
                <p className={styles.eyebrow}>{coupleName}</p>
                <h1 className={styles.big}>{t('guest.finishedTitle')}</h1>
                <p className={styles.note}>{t('guest.finishedText')}</p>
              </motion.div>
            ) : (
              <motion.div key="lobby" className={styles.center} {...fade}>
                <p className={styles.eyebrow}>{coupleName}</p>
                <h1 className={styles.big}>{t('guest.lobbyTitle')}</h1>
                <p className={styles.note}>{t('guest.lobbyText')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

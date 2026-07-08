'use client'

import {useEffect, useState} from 'react'
import {useTranslations} from 'next-intl'
import {AnimatePresence, motion} from 'motion/react'
import {GameQr} from './GameQr'
import {useGameChannel} from '@/utility/game/useGameChannel'
import type {GameTheme} from '@/utility/game/types'
import styles from './DisplayGame.module.css'

type Person = {name: string; color: string; photo: string | null}

type DisplayGameProps = {
  eventId: string
  coupleName: string
  person1: Person
  person2: Person
  questions: string[]
  guestUrl: string
  initialTheme?: GameTheme
}

// Soft transition preset reused across phases.
const fade = {
  initial: {opacity: 0, y: 24},
  animate: {opacity: 1, y: 0},
  exit: {opacity: 0, y: -24},
  transition: {duration: 0.5, ease: 'easeOut'},
} as const

export function DisplayGame({
  eventId,
  coupleName,
  person1,
  person2,
  questions,
  guestUrl,
  initialTheme = 'light',
}: DisplayGameProps) {
  const t = useTranslations('game')
  const {state, guestCount} = useGameChannel(eventId, 'display', initialTheme)
  const shownGuests = guestCount

  const qrValue = /^https?:\/\//.test(guestUrl) ? guestUrl : `https://${guestUrl}`

  const question = questions[state.questionIndex] ?? ''
  const totalVotes = state.votes[0] + state.votes[1]
  const pct = (index: 0 | 1) =>
    totalVotes === 0 ? 50 : Math.round((state.votes[index] / totalVotes) * 100)

  // Countdown ticker for the countdown phase.
  const [count, setCount] = useState(3)
  useEffect(() => {
    if (state.phase !== 'countdown') return
    setCount(3)
    const id = setInterval(() => setCount((c) => (c > 1 ? c - 1 : c)), 1000)
    return () => clearInterval(id)
  }, [state.phase])

  return (
    <div className={styles.root} data-theme={state.theme}>
      <span className={styles.leafTop} aria-hidden="true" />
      <span className={styles.leafBottom} aria-hidden="true" />

      <p className={styles.couple}>{coupleName}</p>

      <div className={styles.stage}>
        <AnimatePresence mode="wait">
          {state.phase === 'lobby' ? (
            <motion.div key="lobby" className={styles.center} {...fade}>
              <p className={styles.eyebrow}>{t('display.eyebrowQuestion')}</p>
              <h1 className={styles.coupleBig}>{coupleName}</h1>
              <div className={styles.qr}>
                <GameQr value={qrValue} size={220} />
              </div>
              <p className={styles.lobbyCta}>{t('display.lobbyCta')}</p>
              <span className={styles.guestPill}>
                <span className={styles.guestDot} aria-hidden="true" />
                {t('display.guestsConnected', {count: shownGuests})}
              </span>
            </motion.div>
          ) : null}

          {state.phase === 'question' || state.phase === 'closed' ? (
            <motion.div key="question" className={styles.center} {...fade}>
              <p className={styles.eyebrow}>{t('display.eyebrowQuestion')}</p>
              <h1 className={styles.question}>{question}</h1>
              {state.phase === 'closed' ? (
                <p className={styles.closedNote}>{t('display.closed')}</p>
              ) : (
                <span className={styles.livePill}>
                  <span className={styles.liveNum}>{totalVotes}</span>
                  <span className={styles.liveMeta}>
                    <span className={styles.liveWord}>{t('display.votesWord')}</span>
                    <span className={styles.liveTag}>
                      <span className={styles.guestDot} aria-hidden="true" />
                      {t('display.live')}
                    </span>
                  </span>
                </span>
              )}
            </motion.div>
          ) : null}

          {state.phase === 'countdown' ? (
            <motion.div key="countdown" className={styles.center} {...fade}>
              <p className={styles.countdownIntro}>{t('display.countdownIntro')}</p>
              <motion.span
                key={count}
                className={styles.countdown}
                initial={{scale: 0.4, opacity: 0}}
                animate={{scale: 1, opacity: 1}}
                exit={{scale: 1.6, opacity: 0}}
                transition={{duration: 0.5, ease: 'easeOut'}}
              >
                {count}
              </motion.span>
            </motion.div>
          ) : null}

          {state.phase === 'reveal' ? (
            <motion.div key="reveal" className={styles.center} {...fade}>
              <p className={styles.eyebrow}>{t('display.resultEyebrow')}</p>
              <h2 className={styles.question}>{question}</h2>
              <div className={styles.bars}>
                {[person1, person2].map((person, index) => (
                  <div key={index} className={styles.barCol}>
                    <motion.span
                      className={styles.pct}
                      initial={{opacity: 0}}
                      animate={{opacity: 1}}
                      transition={{delay: 0.6}}
                    >
                      {pct(index as 0 | 1)}%
                    </motion.span>
                    <div className={styles.barTrack}>
                      <motion.div
                        className={styles.bar}
                        style={{background: person.color}}
                        initial={{height: 0}}
                        animate={{height: `${Math.max(8, pct(index as 0 | 1))}%`}}
                        transition={{duration: 0.9, ease: 'easeOut', delay: 0.1}}
                      />
                    </div>
                    {person.photo ? (
                      <span
                        className={styles.avatar}
                        style={{backgroundImage: `url(${person.photo})`}}
                      />
                    ) : null}
                    <span className={styles.personName}>{person.name}</span>
                    <span className={styles.personVotes}>
                      {t('display.votes', {count: state.votes[index]})}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}

          {state.phase === 'finished' ? (
            <motion.div key="finished" className={styles.center} {...fade}>
              <p className={styles.eyebrow}>{t('display.resultEyebrow')}</p>
              <h1 className={styles.coupleBig}>{t('display.finishedTitle')}</h1>
              <p className={styles.lobbyCta}>{t('display.finishedText')}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

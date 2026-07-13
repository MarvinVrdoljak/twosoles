'use client'

import {useEffect, useRef, useState} from 'react'
import {useTranslations} from 'next-intl'
import {AnimatePresence, motion} from 'motion/react'
import {GameQr} from './GameQr'
import {useGameChannel} from '@/utility/game/useGameChannel'
import {COUNTDOWN_DIGIT_HOLD_MS, type GameTheme} from '@/utility/game/types'
import styles from './DisplayGame.module.css'
import Leaf03 from '@/public/images/leaf_03.svg'
import Leaf01 from '@/public/images/leaf_01.svg'

type Person = {name: string; color: string; photo: string | null}

type DisplayGameProps = {
  eventId: string
  coupleName: string
  person1: Person
  person2: Person
  questions: string[]
  guestUrl: string
  initialTheme?: GameTheme
  // Max guests for the event's package — cap the shown count to match the host.
  capacity?: number
}

// Soft transition preset reused across phases.
const fade = {
  initial: {opacity: 0, y: 24},
  animate: {opacity: 1, y: 0},
  exit: {opacity: 0, y: -24},
  transition: {duration: 0.5, ease: 'easeOut'},
} as const

// Countdown digit pop. Named variants so `onAnimationComplete` can tell an
// entering digit ("shown") from the previous one exiting ("gone").
const countdownDigit = {
  hidden: {scale: 0.5, opacity: 0},
  shown: {scale: 1, opacity: 1},
  gone: {scale: 1.5, opacity: 0},
} as const

export function DisplayGame({
  eventId,
  coupleName,
  person1,
  person2,
  questions,
  guestUrl,
  initialTheme = 'light',
  capacity = Infinity,
}: DisplayGameProps) {
  const t = useTranslations('game')
  const {state, guestCount} = useGameChannel(eventId, 'display', initialTheme)
  // Never show more than the package allows; the surplus are on the waiting
  // list (and see the "full" screen), so they shouldn't inflate the beamer count.
  const shownGuests = Math.min(guestCount, capacity)

  const qrValue = /^https?:\/\//.test(guestUrl) ? guestUrl : `https://${guestUrl}`

  const question = questions[state.questionIndex] ?? ''
  const totalVotes = state.votes[0] + state.votes[1]
  const pct = (index: 0 | 1) =>
    totalVotes === 0 ? 50 : Math.round((state.votes[index] / totalVotes) * 100)

  // Countdown sequence. `count` is null until the container's appear animation
  // finishes; then 3 animates in. Each digit reports when it has finished
  // animating in (see `onAnimationComplete` below), we hold for a fixed beat, and
  // only then step down — so 3, 2 and 1 each get exactly the same on-screen time.
  // The host advances to the reveal on its own timer (COUNTDOWN_REVEAL_MS).
  const [count, setCount] = useState<number | null>(null)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Re-arm on every phase change; drop any pending hold.
  useEffect(() => {
    setCount(null)
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current)
    }
  }, [state.phase])

  // A digit has finished animating in: hold, then reveal the next one.
  const holdThenNext = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current)
    holdTimer.current = setTimeout(() => {
      setCount((c) => (c && c > 1 ? c - 1 : c))
    }, COUNTDOWN_DIGIT_HOLD_MS)
  }

  return (
    <div className={styles.root} data-theme={state.theme}>
      <Leaf01 className={styles.leafTop} aria-hidden="true" />
      <Leaf03 className={styles.leafBottom} aria-hidden="true" />

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
            <motion.div
              key="countdown"
              className={styles.center}
              {...fade}
              // Appear animation done → kick off the sequence with "3".
              onAnimationComplete={() => setCount((c) => (c === null ? 3 : c))}
            >
              <p className={styles.countdownIntro}>{t('display.countdownIntro')}</p>
              <div className={styles.countdownStage}>
                <AnimatePresence mode="popLayout">
                  {count !== null ? (
                    <motion.span
                      key={count}
                      className={styles.countdown}
                      variants={countdownDigit}
                      initial="hidden"
                      animate="shown"
                      exit="gone"
                      transition={{duration: 0.3, ease: 'easeOut'}}
                      // Fire only when the digit finished entering (not on the
                      // previous digit's exit), then hold before stepping down.
                      onAnimationComplete={(def) => {
                        if (def === 'shown' && count > 1) holdThenNext()
                      }}
                    >
                      {count}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>
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
                    <span className={styles.person}>
                      <span className={styles.personName}>{person.name}</span>
                      <span className={styles.personVotes}>
                        {t('display.votes', {count: state.votes[index]})}
                      </span>
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

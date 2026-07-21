'use client'

import {useEffect, useRef, useState} from 'react'
import {useTranslations} from 'next-intl'
import {AnimatePresence, motion} from 'motion/react'
import {GameQr} from './GameQr'
import {useGameChannel} from '@/utility/game/useGameChannel'
import {
  audienceMajority,
  COUNTDOWN_DIGIT_HOLD_MS,
  coupleAnswered,
  coupleMatches,
  type GameTheme,
} from '@/utility/game/types'
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

  const persons = [person1, person2]

  // Couple's answer for the question being revealed (if both partners answered):
  // did they agree, and — when they did — did the room read them right?
  const revealPair = state.coupleAnswers[state.questionIndex]
  const showCouple = coupleAnswered(revealPair)
  const coupleMatch = showCouple && coupleMatches(revealPair)
  const crowdRight = coupleMatch && audienceMajority(state.votes) === revealPair[0]

  // Finale aggregates, over every question the couple fully answered. Harmony =
  // how often the two agreed. Crowd accuracy = of those agreed questions, how
  // often the room's majority matched the couple's answer.
  const answeredIdx = Object.keys(state.coupleAnswers)
    .map(Number)
    .filter((i) => coupleAnswered(state.coupleAnswers[i]))
  const totalAnswered = answeredIdx.length
  const agreedIdx = answeredIdx.filter((i) => coupleMatches(state.coupleAnswers[i]))
  const harmonyCount = agreedIdx.length
  const crowdConsidered = agreedIdx.filter((i) => state.results[i] !== undefined)
  const crowdRightCount = crowdConsidered.filter(
    (i) => audienceMajority(state.results[i]) === state.coupleAnswers[i][0],
  ).length
  const crowdPct = crowdConsidered.length
    ? Math.round((crowdRightCount / crowdConsidered.length) * 100)
    : 0
  const hasStats = totalAnswered > 0

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

          {/* Couple + audience share ONE screen: the couple's picks appear first
              (coupleReveal) and stay put; on the host's click the compact
              audience rows slide in below — same element, so nothing swaps. */}
          {state.phase === 'coupleReveal' || state.phase === 'reveal' ? (
            <motion.div key="reveal" className={styles.center} {...fade}>
              <p className={styles.eyebrow}>{t('display.resultEyebrow')}</p>
              <h2 className={`${styles.question} ${styles.questionSm}`}>{question}</h2>

              {showCouple ? (
                <>
                  <div className={styles.duo}>
                    {persons.map((partner, slot) => {
                      const picked = persons[revealPair[slot]]
                      return (
                        <motion.div
                          key={slot}
                          className={styles.duoCol}
                          initial={{opacity: 0, y: 24}}
                          animate={{opacity: 1, y: 0}}
                          transition={{delay: 0.2 + slot * 0.25, duration: 0.55, ease: 'easeOut'}}
                        >
                          <span className={styles.duoSays}>
                            {t('display.partnerSays', {name: partner.name})}
                          </span>
                          <span className={styles.duoPick} style={{color: picked.color}}>
                            {picked.name}
                          </span>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* One verdict line whose text upgrades with the phase:
                      couple only ("Einig!") → couple vs. room. */}
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={state.phase === 'reveal' ? 'crowd' : 'match'}
                      className={`${styles.matchLine} ${
                        state.phase === 'reveal' ? styles.matchLineCrowd : ''
                      } ${
                        (state.phase === 'reveal' ? coupleMatch && crowdRight : coupleMatch)
                          ? styles.matchYes
                          : styles.matchNo
                      }`}
                      initial={{opacity: 0, y: 10}}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: {
                          delay: state.phase === 'reveal' ? 0.5 : 0.9,
                          duration: 0.45,
                          ease: 'easeOut',
                        },
                      }}
                      exit={{opacity: 0, y: -10}}
                      transition={{duration: 0.3, ease: 'easeOut'}}
                    >
                      {state.phase === 'reveal'
                        ? coupleMatch
                          ? crowdRight
                            ? t('display.crowdRight')
                            : t('display.crowdWrong')
                          : t('display.revealSplit')
                        : coupleMatch
                          ? t('display.matchYes')
                          : t('display.matchNo')}
                    </motion.p>
                  </AnimatePresence>
                </>
              ) : null}

              {state.phase === 'reveal' ? (
                showCouple ? (
                  /* Audience result as compact horizontal rows under the couple. */
                  <motion.div
                    className={styles.rows}
                    initial={{opacity: 0, y: 24}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.5, ease: 'easeOut'}}
                  >
                    {persons.map((person, index) => (
                      <div key={index} className={styles.row}>
                        <span
                          className={styles.rowAvatar}
                          style={{
                            backgroundImage: person.photo ? `url(${person.photo})` : undefined,
                          }}
                        >
                          {person.photo ? '' : person.name.charAt(0)}
                        </span>
                        <span className={styles.rowName}>{person.name}</span>
                        <span className={styles.rowTrack}>
                          <motion.span
                            className={styles.rowBar}
                            style={{background: person.color}}
                            initial={{width: 0}}
                            animate={{width: `${Math.max(6, pct(index as 0 | 1))}%`}}
                            transition={{duration: 0.8, ease: 'easeOut', delay: 0.15}}
                          />
                        </span>
                        <span className={styles.rowValue}>
                          <span className={styles.rowPct}>{pct(index as 0 | 1)}%</span>
                          <span className={styles.rowVotes}>
                            {t('display.votes', {count: state.votes[index]})}
                          </span>
                        </span>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  /* No couple answer for this question — classic full-size bars. */
                  <div className={styles.bars}>
                    {persons.map((person, index) => (
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
                )
              ) : null}
            </motion.div>
          ) : null}

          {state.phase === 'finished' ? (
            <motion.div key="finished" className={styles.center} {...fade}>
              <p className={styles.eyebrow}>{t('display.resultEyebrow')}</p>
              <h1 className={styles.coupleBig}>{t('display.finishedTitle')}</h1>
              {hasStats ? (
                <motion.div
                  className={styles.finale}
                  initial={{opacity: 0, y: 16}}
                  animate={{opacity: 1, y: 0}}
                  transition={{delay: 0.3, duration: 0.6, ease: 'easeOut'}}
                >
                  <div className={styles.finaleStat}>
                    <span className={styles.finaleNum}>
                      {t('display.harmonyValue', {count: harmonyCount, total: totalAnswered})}
                    </span>
                    <span className={styles.finaleLabel}>{t('display.harmonyLabel')}</span>
                  </div>
                  <span className={styles.finaleDivider} aria-hidden="true" />
                  <div className={styles.finaleStat}>
                    <span className={styles.finaleNum}>{crowdPct}%</span>
                    <span className={styles.finaleLabel}>{t('display.crowdLabel')}</span>
                  </div>
                </motion.div>
              ) : (
                <p className={styles.lobbyCta}>{t('display.finishedText')}</p>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

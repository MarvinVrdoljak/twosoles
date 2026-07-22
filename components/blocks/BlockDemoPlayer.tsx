'use client'

import {useEffect, useLayoutEffect, useRef, useState} from 'react'
import {useLocale, useTranslations} from 'next-intl'
import {AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform} from 'motion/react'
import {Footprints, Heart, Settings, Smartphone} from 'lucide-react'
import {GameQr} from '@/components/game/GameQr'
import {getPathname} from '@/i18n/navigation'
import type {Locale} from '@/i18n/routing'
import styles from './BlockDemoPlayer.module.css'
import Leaf01 from '@/public/images/leaf_01.svg'
import Leaf03 from '@/public/images/leaf_03.svg'

// useLayoutEffect on the client (measure + scale before paint), useEffect on the
// server (avoids the SSR warning). The diorama is scaled to fit in JS, see below.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

// The two answer modes, mirrored 1:1 from the real event setting (answer_mode).
type Mode = 'shoe' | 'phone'

// The phases every screen shares. Faithful to the live flow (lobby → question →
// closed → reveal), just auto-driven: the host "presses" the next action, and
// the display + phones react to the same state.
type Phase = 'lobby' | 'vote' | 'closed' | 'reveal'
const NEXT: Record<Phase, Phase> = {lobby: 'vote', vote: 'closed', closed: 'reveal', reveal: 'vote'}
// How long each phase stays on screen before the host advances (ms).
const HOLD: Record<Phase, number> = {lobby: 2200, vote: 3600, closed: 2600, reveal: 4300}

// One scripted round. `votes` are the absolute guest tally for [Mia, Ben];
// `couple` is each partner's own pick; `guests` are the picks of the two guest
// phones in the scene (0 = Mia, 1 = Ben). Together they script all three verdicts.
type Round = {votes: [number, number]; couple: [0 | 1, 0 | 1]; guests: [0 | 1, 0 | 1]}
const ROUNDS: Round[] = [
  {votes: [21, 9], couple: [0, 0], guests: [0, 1]}, // in sync, room right  -> crowdRight
  {votes: [18, 12], couple: [1, 1], guests: [0, 1]}, // in sync, room wrong -> crowdWrong
  {votes: [16, 14], couple: [0, 1], guests: [0, 1]}, // couple split        -> revealSplit
]

// Mia = brand rosé, Ben = anthracite (ink) — the same two-tone as the hero preview.
const COLORS = ['var(--color-primary)', 'var(--color-text)'] as const
const GUEST_COUNT = 24

// Counts a number up to `value`, so tallies climb together across the screens
// instead of snapping. Remounted per round (via key), so each round starts at 0.
function CountUp({value, reduce, duration = 1.6}: {value: number; reduce: boolean; duration?: number}) {
  const mv = useMotionValue(reduce ? value : 0)
  const text = useTransform(mv, (v) => `${Math.round(v)}`)
  useEffect(() => {
    if (reduce) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, {duration, ease: 'easeOut'})
    return () => controls.stop()
  }, [mv, value, duration, reduce])
  return <motion.span>{text}</motion.span>
}

const fadeUp = (reduce: boolean) =>
  reduce
    ? {}
    : ({
        initial: {opacity: 0, y: 8},
        animate: {opacity: 1, y: 0},
        exit: {opacity: 0, y: -8},
        transition: {duration: 0.35, ease: 'easeOut'},
      } as const)

// ---------------------------------------------------------------------------
// The Leinwand / projector screen — mirrors DisplayGame: couple name on top,
// eyebrow + big serif question, live pill, and the real reveal layouts.
function DemoDisplay({
  phase,
  mode,
  round,
  question,
  names,
  pct,
  votes,
  couple,
  verdict,
  inSync,
  reduce,
}: {
  phase: Phase
  mode: Mode
  round: number
  question: string
  names: string[]
  pct: (i: 0 | 1) => number
  votes: [number, number]
  couple: [0 | 1, 0 | 1]
  verdict: 'crowdRight' | 'crowdWrong' | 'revealSplit'
  inSync: boolean
  reduce: boolean
}) {
  const g = useTranslations('game')
  const locale = useLocale() as Locale
  const enter = fadeUp(reduce)
  const coupleName = `${names[0]} & ${names[1]}`

  // The lobby QR points to the login page. Absolute URL is only known on the
  // client, so build it from the live origin after mount (like the real display).
  const [origin, setOrigin] = useState('')
  useEffect(() => setOrigin(window.location.origin), [])
  const loginUrl = origin ? `${origin}${getPathname({href: '/login', locale})}` : ''

  return (
    <div className={styles.displayScreen}>
      <Leaf01 className={styles.leafTop} aria-hidden="true" />
      <Leaf03 className={styles.leafBottom} aria-hidden="true" />
      <p className={styles.dCoupleTop}>{coupleName}</p>

      <div className={styles.dStage}>
        <AnimatePresence mode="wait">
          {phase === 'lobby' ? (
            <motion.div key="lobby" className={styles.dCenter} {...enter}>
              <p className={styles.dEyebrow}>{g('display.eyebrowQuestion')}</p>
              <p className={styles.dCoupleBig}>{coupleName}</p>
              {loginUrl ? (
                <span className={styles.dQr}>
                  <GameQr value={loginUrl} size={90} />
                </span>
              ) : null}
              <p className={styles.dLobbyCta}>{g('display.lobbyCta')}</p>
              <span className={styles.dGuestPill}>
                <span className={styles.liveDot} aria-hidden="true" />
                {g('display.guestsConnected', {count: GUEST_COUNT})}
              </span>
            </motion.div>
          ) : null}

          {phase === 'vote' || phase === 'closed' ? (
            <motion.div key="question" className={styles.dCenter} {...enter}>
              <p className={styles.dEyebrow}>{g('display.eyebrowQuestion')}</p>
              <p className={styles.dQuestion}>{question}</p>
              {phase === 'closed' ? (
                <p className={styles.dClosedNote}>{g('display.closed')}</p>
              ) : (
                <span className={styles.dLivePill}>
                  <span className={styles.dLiveNum}>
                    <CountUp key={round} value={votes[0] + votes[1]} reduce={reduce} />
                  </span>
                  <span className={styles.dLiveMeta}>
                    <span className={styles.dLiveWord}>{g('display.votesWord')}</span>
                    <span className={styles.dLiveTag}>
                      <span className={styles.liveDot} aria-hidden="true" />
                      {g('display.live')}
                    </span>
                  </span>
                </span>
              )}
            </motion.div>
          ) : null}

          {phase === 'reveal' ? (
            <motion.div key="reveal" className={styles.dCenter} {...enter}>
              <p className={styles.dEyebrow}>{g('display.resultEyebrow')}</p>
              <p className={styles.dQuestionSm}>{question}</p>

              {/* Phone mode reveals the couple's own picks + verdict on the big
                  screen; classic (shoe) mode showed the shoes in the room, so
                  the beamer jumps straight to how the audience voted. */}
              {mode === 'phone' ? (
                <>
                  <div className={styles.dDuo}>
                    {names.map((name, slot) => (
                      <motion.div
                        key={slot}
                        className={styles.dDuoCol}
                        initial={reduce ? false : {opacity: 0, y: 12}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.15 + slot * 0.2, duration: 0.45, ease: 'easeOut'}}
                      >
                        <span className={styles.dDuoSays}>{g('display.partnerSays', {name})}</span>
                        <span className={styles.dDuoPick} style={{color: COLORS[couple[slot]]}}>
                          {names[couple[slot]]}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  <p className={`${styles.dVerdict} ${inSync ? styles.verdictYes : styles.verdictNo}`}>
                    {g(`display.${verdict}`)}
                  </p>
                  <div className={styles.dRows}>
                    {names.map((name, i) => (
                      <div key={i} className={styles.dRow}>
                        <span className={styles.dRowAvatar} style={{background: COLORS[i]}}>
                          {name.charAt(0)}
                        </span>
                        <span className={styles.dRowName}>{name}</span>
                        <span className={styles.dRowTrack}>
                          <motion.span
                            className={styles.dRowBar}
                            style={{background: COLORS[i]}}
                            initial={reduce ? false : {width: 0}}
                            animate={{width: `${Math.max(6, pct(i as 0 | 1))}%`}}
                            transition={{duration: 0.8, ease: 'easeOut', delay: 0.35}}
                          />
                        </span>
                        <span className={styles.dRowPct}>
                          <CountUp value={pct(i as 0 | 1)} reduce={reduce} duration={0.9} />%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className={styles.dBars}>
                  {names.map((name, i) => (
                    <div key={i} className={styles.dBarCol}>
                      <span className={styles.dBarPct}>
                        <CountUp value={pct(i as 0 | 1)} reduce={reduce} duration={0.9} />%
                      </span>
                      <span className={styles.dBarTrack}>
                        <motion.span
                          className={styles.dBar}
                          style={{background: COLORS[i]}}
                          initial={reduce ? false : {height: 0}}
                          animate={{height: `${Math.max(8, pct(i as 0 | 1))}%`}}
                          transition={{duration: 0.85, ease: 'easeOut', delay: 0.2}}
                        />
                      </span>
                      <span className={styles.dBarName}>{name}</span>
                      <span className={styles.dBarVotes}>{g('display.votes', {count: votes[i]})}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// The host controller (a phone) — mirrors HostGame: serif-italic "Host Panel"
// topbar, the question card with the two vote cards, and the pill button that
// drives the round (pulsing to show what the host presses next).
function DemoHost({
  phase,
  round,
  question,
  names,
  votes,
  reduce,
}: {
  phase: Phase
  round: number
  question: string
  names: string[]
  votes: [number, number]
  reduce: boolean
}) {
  const g = useTranslations('game')
  const enter = fadeUp(reduce)
  const inRound = phase !== 'lobby'
  const total = votes[0] + votes[1]

  const primaryLabel: Record<Phase, string> = {
    lobby: g('host.start'),
    vote: g('host.closeVoting'),
    closed: g('host.reveal'),
    reveal: g('host.next'),
  }

  return (
    <div className={styles.phone}>
      <span className={styles.phoneNotch} aria-hidden="true" />
      <div className={styles.phoneScreen}>
        <div className={styles.hostTopbar}>
          <span className={styles.hostLogo}>{g('host.panel')}</span>
          <span className={styles.hostGear}>
            <Settings size={11} aria-hidden="true" />
          </span>
        </div>

        <div className={styles.hostContent}>
          <AnimatePresence mode="wait">
            {!inRound ? (
              <motion.div key="lobby" className={styles.hostCard} {...enter}>
                <p className={styles.hostH1}>{g('host.lobbyTitle')}</p>
                <p className={styles.hostMuted}>{g('host.lobbyText')}</p>
              </motion.div>
            ) : (
              <motion.div key="round" className={styles.hostCard} {...enter}>
                <div className={styles.hostQHead}>
                  <span className={styles.hostQNum}>
                    {g('host.questionOf', {current: round + 1, total: ROUNDS.length})}
                  </span>
                </div>
                <p className={styles.hostQuestion}>{question}</p>
                <div className={styles.hostVoteCards}>
                  {names.map((name, i) => (
                    <div key={i} className={styles.hostVoteCard}>
                      <span className={styles.hostVoteName}>{name}</span>
                      <span className={styles.hostVoteNum}>
                        <CountUp key={round} value={votes[i]} reduce={reduce} />
                      </span>
                      <span className={styles.hostVoteLabel}>{g('host.votesLabel')}</span>
                    </div>
                  ))}
                </div>
                <p className={styles.hostTotal}>{g('host.votesTotal', {count: total})}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* The host "presses" this to advance: a quick scale-down/up runs on
            every phase change (keyed on phase), so it reads as a real tap. */}
        <motion.span
          key={phase}
          className={styles.hostPrimary}
          initial={false}
          animate={reduce ? undefined : {scale: [1, 0.92, 1]}}
          transition={{duration: 0.32, ease: 'easeOut', times: [0, 0.35, 1]}}
        >
          {primaryLabel[phase]}
        </motion.span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// A guest phone (or, with `youAre`, one of the couple's phones in digital
// mode). Mirrors GuestGame: header (eyebrow, couple name, progress, heart
// divider), the serif question in the middle, and the action zone at the
// bottom — two full-width colored vote buttons that give way to the status
// pill ("Du hast für … gestimmt" → "Schau auf die Leinwand!").
function DemoGuest({
  phase,
  round,
  question,
  names,
  pick,
  voteAt,
  youAre,
  reduce,
}: {
  phase: Phase
  round: number
  question: string
  names: string[]
  pick: 0 | 1
  // When this phone taps its vote, in ms after the question opens.
  voteAt: number
  // Couple phone (digital mode): the partner using this device.
  youAre?: string
  reduce: boolean
}) {
  const g = useTranslations('game')
  const enter = fadeUp(reduce)

  // The tap moment: buttons first, then the "voted" status swaps in.
  const [voted, setVoted] = useState(reduce)
  useEffect(() => {
    if (reduce) return
    setVoted(false)
    if (phase !== 'vote') return
    const id = setTimeout(() => setVoted(true), voteAt)
    return () => clearTimeout(id)
  }, [phase, round, voteAt, reduce])

  // Which bottom action is showing (keys the swap animation).
  const actionKey = phase === 'vote' ? (voted ? 'voted' : 'buttons') : phase

  const renderAction = () => {
    if (phase === 'vote' && !voted) {
      return (
        <div className={styles.gOptions}>
          {names.map((name, i) => (
            <span key={i} className={styles.gOption} style={{background: COLORS[i]}}>
              {name}
            </span>
          ))}
        </div>
      )
    }
    const pill =
      phase === 'vote'
        ? g('guest.votedFor', {name: names[pick]})
        : phase === 'closed'
          ? g('guest.votingEnded')
          : g('guest.lookAtScreen')
    return (
      <div className={styles.gStatus}>
        <span className={styles.gStatusPill}>{pill}</span>
      </div>
    )
  }

  return (
    <div className={styles.phone}>
      <span className={styles.phoneNotch} aria-hidden="true" />
      <div className={styles.phoneScreen}>
        <AnimatePresence mode="wait">
          {phase === 'lobby' ? (
            <motion.div key="lobby" className={styles.gLobby} {...enter}>
              <p className={styles.gEyebrow}>
                {names[0]} &amp; {names[1]}
              </p>
              <p className={styles.gBig}>{g('guest.lobbyTitle')}</p>
              <p className={styles.gNote}>{g('guest.lobbyText')}</p>
            </motion.div>
          ) : (
            <motion.div key="active" className={styles.gActive} {...enter}>
              <div className={styles.gHeader}>
                <p className={styles.gEyebrow}>
                  {youAre ? g('couple.youAre', {name: youAre}) : g('display.eyebrowQuestion')}
                </p>
                <p className={styles.gCouple}>
                  {names[0]} &amp; {names[1]}
                </p>
                <p className={styles.gProgress}>
                  {g('guest.questionOf', {current: round + 1, total: ROUNDS.length})}
                </p>
                <span className={styles.gDivider} aria-hidden="true">
                  <span className={styles.gDividerLine} />
                  <Heart size={9} className={styles.gDividerHeart} />
                  <span className={styles.gDividerLine} />
                </span>
              </div>

              <div className={styles.gQuestionZone}>
                <AnimatePresence mode="wait">
                  <motion.p key={round} className={styles.gQuestion} {...enter}>
                    {question}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className={styles.gActionZone}>
                <AnimatePresence mode="wait">
                  <motion.div key={actionKey} className={styles.gActionInner} {...enter}>
                    {renderAction()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
export function BlockDemoPlayer() {
  const t = useTranslations('demo')
  const reduceMotion = useReducedMotion() ?? false

  const [mode, setMode] = useState<Mode>('shoe')
  const [round, setRound] = useState(0)
  const [phase, setPhase] = useState<Phase>('lobby')

  // Scale the fixed-size diorama down to fit narrow viewports. We do this in JS
  // (measured transform) instead of CSS `zoom`: on iOS Safari `zoom` only scales
  // the paint, not the layout box, so the 440px scene kept overflowing the screen
  // edge on real phones (desktop `zoom` reduces layout, which is why it looked
  // fine there). transform: scale() shrinks the footprint identically everywhere.
  const sceneFitRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  useIsoLayoutEffect(() => {
    const fitEl = sceneFitRef.current
    const scene = sceneRef.current
    if (!fitEl || !scene) return

    const apply = () => {
      // Reset, then measure the scene at its natural (unscaled) size.
      scene.style.transform = ''
      scene.style.marginBottom = ''
      const avail = fitEl.clientWidth
      const natW = scene.offsetWidth
      const natH = scene.offsetHeight
      if (!avail || natW <= avail) return
      // Leave a little room for the tilted phones and the Leinwand shadow.
      const scale = (avail - 20) / natW
      const offsetX = (avail - natW * scale) / 2
      scene.style.transformOrigin = 'top left'
      scene.style.transform = `translateX(${offsetX}px) scale(${scale})`
      // transform does not shrink the layout box (it stays 440px x natH), so pull
      // the freed vertical space back with a negative margin-bottom. In block flow
      // this reliably shrinks the parent's auto height to the scaled height.
      scene.style.marginBottom = `${-Math.round(natH * (1 - scale))}px`
    }

    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(fitEl)
    ro.observe(scene)
    return () => ro.disconnect()
  }, [mode])

  const questions = t.raw('questions') as string[]
  const names = [t('person1'), t('person2')]

  // Auto-play the shared timeline; after a reveal, roll on to the next round and
  // loop. Reduced-motion users get a still reveal, no cycling.
  useEffect(() => {
    if (reduceMotion) {
      setPhase('reveal')
      return
    }
    const timer = setTimeout(() => {
      if (phase === 'reveal') setRound((r) => (r + 1) % ROUNDS.length)
      setPhase(NEXT[phase])
    }, HOLD[phase])
    return () => clearTimeout(timer)
  }, [phase, reduceMotion])

  const pickMode = (next: Mode) => {
    if (next === mode) return
    setMode(next)
    setRound(0)
    setPhase(reduceMotion ? 'reveal' : 'lobby')
  }

  const current = ROUNDS[round]
  const votes = current.votes
  const total = votes[0] + votes[1]
  const pct = (i: 0 | 1) => Math.round((votes[i] / total) * 100)
  const question = questions[round] ?? ''
  const majority: 0 | 1 = votes[0] >= votes[1] ? 0 : 1
  const inSync = current.couple[0] === current.couple[1]
  const verdict: 'crowdRight' | 'crowdWrong' | 'revealSplit' = !inSync
    ? 'revealSplit'
    : majority === current.couple[0]
      ? 'crowdRight'
      : 'crowdWrong'

  const guestPhone = (side: 0 | 1) => (
    <DemoGuest
      phase={phase}
      round={round}
      question={question}
      names={names}
      pick={current.guests[side]}
      voteAt={side === 0 ? 1100 : 1900}
      reduce={reduceMotion}
    />
  )

  return (
    <div className={styles.root}>
      {/* Answer-mode tabs — the only interactive control. */}
      <div className={styles.tabs} role="tablist" aria-label={t('eyebrow')}>
        {(['shoe', 'phone'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={`${styles.tab} ${mode === m ? styles.tabActive : ''}`}
            onClick={() => pickMode(m)}
          >
            {m === 'shoe' ? (
              <Footprints size={16} aria-hidden="true" />
            ) : (
              <Smartphone size={16} aria-hidden="true" />
            )}
            {t(`tabs.${m}`)}
          </button>
        ))}
      </div>

      {/* Diorama: the big screen behind, the phones tilted in front. Digital
          mode adds the couple's two phones next to the host. The fit wrapper
          clips the horizontal overflow of the scaled scene (see the scaler
          effect above) so it can never push the page past the screen edge. */}
      <div className={styles.sceneFit} ref={sceneFitRef}>
        <div className={styles.scene} ref={sceneRef}>
          <div className={styles.displayWrap}>
          <span className={styles.roleTag}>{t('roles.display')}</span>
          <DemoDisplay
            phase={phase}
            mode={mode}
            round={round}
            question={question}
            names={names}
            pct={pct}
            votes={votes}
            couple={current.couple}
            verdict={verdict}
            inSync={inSync}
            reduce={reduceMotion}
          />
        </div>

        <div className={`${styles.devices} ${mode === 'phone' ? styles.devicesWide : ''}`}>
          <div className={`${styles.deviceSlot} ${styles.slotOuterLeft}`}>
            <span className={styles.roleTag}>{t('roles.guest')}</span>
            {guestPhone(0)}
          </div>

          {mode === 'phone' ? (
            <div className={`${styles.deviceSlot} ${styles.slotInnerLeft}`}>
              <span className={styles.roleTag}>{names[0]}</span>
              <DemoGuest
                phase={phase}
                round={round}
                question={question}
                names={names}
                pick={current.couple[0]}
                voteAt={1500}
                youAre={names[0]}
                reduce={reduceMotion}
              />
            </div>
          ) : null}

          <div className={`${styles.deviceSlot} ${styles.slotHost}`}>
            <span className={styles.roleTag}>{t('roles.host')}</span>
            <DemoHost
              phase={phase}
              round={round}
              question={question}
              names={names}
              votes={votes}
              reduce={reduceMotion}
            />
          </div>

          {mode === 'phone' ? (
            <div className={`${styles.deviceSlot} ${styles.slotInnerRight}`}>
              <span className={styles.roleTag}>{names[1]}</span>
              <DemoGuest
                phase={phase}
                round={round}
                question={question}
                names={names}
                pick={current.couple[1]}
                voteAt={2100}
                youAre={names[1]}
                reduce={reduceMotion}
              />
            </div>
          ) : null}

          <div className={`${styles.deviceSlot} ${styles.slotOuterRight}`}>
            <span className={styles.roleTag}>{t('roles.guest')}</span>
            {guestPhone(1)}
          </div>

          {/* Forces the two guest phones onto a second row on mobile (digital);
              inert on desktop, where all five sit in one fanned row. */}
          <span className={styles.deviceBreak} aria-hidden="true" />
        </div>
        </div>
      </div>

      <p className={styles.hint}>{t(`tabHint.${mode}`)}</p>
    </div>
  )
}

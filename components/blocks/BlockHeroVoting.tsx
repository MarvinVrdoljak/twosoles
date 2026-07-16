'use client'

import {useEffect, useState} from 'react'
import {useTranslations} from 'next-intl'
import {animate, motion, useMotionValue, useReducedMotion, useTransform} from 'motion/react'
import styles from './BlockHeroVoting.module.css'

// Demo results the bars cycle through — should feel like real (uneven) crowd votes.
const RESULTS: [number, number][] = [
  [72, 28],
  [36, 64],
  [45, 55],
]

const CYCLE_MS = 3600

// Matches the bar height transition so number and bar move as one.
const COUNT_TRANSITION = {duration: 0.9, ease: 'easeOut'} as const

// Counts from the previous value to the new one instead of swapping the text.
function AnimatedPct({value, reduceMotion}: {value: number; reduceMotion: boolean}) {
  const raw = useMotionValue(value)
  const label = useTransform(raw, (v) => `${Math.round(v)}%`)

  useEffect(() => {
    if (reduceMotion) {
      raw.set(value)
      return
    }
    const controls = animate(raw, value, COUNT_TRANSITION)
    return () => controls.stop()
  }, [value, reduceMotion, raw])

  return <motion.span className={styles.pct}>{label}</motion.span>
}

export function BlockHeroVoting() {
  const t = useTranslations('hero.voting')
  const reduceMotion = useReducedMotion() ?? false
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reduceMotion) return
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % RESULTS.length)
    }, CYCLE_MS)
    return () => clearInterval(timer)
  }, [reduceMotion])

  const result = RESULTS[index]
  const names = [t('person1'), t('person2')]

  // Purely decorative preview of the live voting — hidden from screen readers.
  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.bars}>
        {result.map((pct, personIndex) => (
          <div key={personIndex} className={styles.barCol}>
            <AnimatedPct value={pct} reduceMotion={reduceMotion} />
            <div className={styles.barTrack}>
              <motion.div
                className={`${styles.bar} ${personIndex === 0 ? styles.barPrimary : styles.barInk}`}
                initial={reduceMotion ? false : {height: '8%'}}
                animate={{height: `${Math.max(8, pct)}%`}}
                transition={{duration: 0.9, ease: 'easeOut'}}
              />
            </div>
            <span className={styles.name}>{names[personIndex]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

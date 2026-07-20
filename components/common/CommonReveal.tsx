'use client'

import type {ReactNode} from 'react'
import {motion, useReducedMotion} from 'motion/react'

// Same entrance curve as the hero animations (see BlockHero.module.css).
const EASE = [0.22, 0.8, 0.3, 1] as const

type CommonRevealProps = {
  children: ReactNode
  className?: string
  /** Extra delay in seconds, e.g. to stagger a grid after its section header. */
  delay?: number
  /** Rendered element — keeps semantics when revealing lists, quotes or text. */
  tag?: 'div' | 'ul' | 'ol' | 'blockquote' | 'p'
  /** Upward travel in px; 0 turns the reveal into a pure fade. */
  y?: number
}

// Fades content up once it scrolls into view (once per page load). Replaces
// the wrapper element it is given the className of, so layouts stay intact.
// Reduced-motion users get the plain element with no hidden state.
export function CommonReveal({children, className, delay = 0, tag = 'div', y = 30}: CommonRevealProps) {
  const reduceMotion = useReducedMotion() ?? false
  const Tag = motion[tag]

  return (
    <Tag
      className={className}
      initial={reduceMotion ? false : {opacity: 0, y}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, amount: 0.12, margin: '0px 0px -8% 0px'}}
      transition={{duration: 1.2, ease: EASE, delay}}
    >
      {children}
    </Tag>
  )
}

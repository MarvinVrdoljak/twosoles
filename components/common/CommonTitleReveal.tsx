'use client'

import {Fragment} from 'react'
import {motion, useReducedMotion, type Variants} from 'motion/react'
import styles from './CommonTitleReveal.module.css'

// Same entrance curve as the hero headline (see BlockHero.module.css).
const EASE = [0.22, 0.8, 0.3, 1] as const

type Tag = 'h1' | 'h2' | 'p' | 'blockquote'

type CommonTitleRevealProps = {
  /** Raw ICU string, may contain <accent>…</accent> markup. */
  text: string
  tag?: Tag
  className?: string
  accentClassName?: string
  id?: string
  /** Portion of the element that must be visible before revealing. */
  amount?: number
}

type Word = {word: string; accent: boolean}

// Split the raw title (incl. <accent> markup) into words, flagging which sit
// inside the accent. Mirrors the hero's server-side split, but here the words
// are revealed with a scroll-triggered mask animation.
function parseWords(text: string): Word[] {
  const words: Word[] = []
  for (const part of text.split(/(<accent>.*?<\/accent>)/)) {
    const match = part.match(/^<accent>(.*?)<\/accent>$/)
    const accent = match != null
    const content = accent ? match[1] : part
    for (const word of content.split(' ').filter(Boolean)) {
      words.push({word, accent})
    }
  }
  return words
}

const container: Variants = {
  hidden: {},
  visible: {transition: {staggerChildren: 0.06, delayChildren: 0.05}},
}

const wordInner: Variants = {
  hidden: {y: '135%'},
  visible: {y: 0, transition: {duration: 0.95, ease: EASE}},
}

// Word-by-word reveal for headings/quotes: each word slides up out of an
// overflow-hidden mask as the title scrolls into view. Reduced-motion users get
// the plain title with no masks or animation.
export function CommonTitleReveal({
  text,
  tag = 'h2',
  className,
  accentClassName,
  id,
  amount = 0.5,
}: CommonTitleRevealProps) {
  const reduceMotion = useReducedMotion() ?? false
  const words = parseWords(text)

  const renderWord = (word: Word) =>
    word.accent ? <em className={accentClassName}>{word.word}</em> : word.word

  if (reduceMotion) {
    const Tag = tag
    return (
      <Tag className={className} id={id}>
        {words.map((word, index) => (
          <Fragment key={index}>
            {renderWord(word)}
            {index < words.length - 1 ? ' ' : ''}
          </Fragment>
        ))}
      </Tag>
    )
  }

  const MotionTag = motion[tag]
  return (
    <MotionTag
      className={className}
      id={id}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{once: true, amount}}
    >
      {words.map((word, index) => (
        <Fragment key={index}>
          <span className={styles.word}>
            <motion.span className={styles.wordInner} variants={wordInner}>
              {renderWord(word)}
            </motion.span>
          </span>
          {index < words.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </MotionTag>
  )
}

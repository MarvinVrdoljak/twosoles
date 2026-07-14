'use client'

import {type ReactNode, useId, useState} from 'react'
import {Plus} from 'lucide-react'
import styles from './ItemFaq.module.css'

type ItemFaqProps = {
  question: string
  answer: string
}

// Matches an http(s) URL or a bare email address inside the answer text.
// (Email last part excludes dots so a sentence-ending period stays outside.)
const LINK_PATTERN = /(https?:\/\/[^\s]+|[^\s@]+@[^\s@]+\.[^\s@.]+)/g

// Turn plain-text answers into React nodes, wrapping any email or URL in a
// clickable link so contact addresses in the FAQ are directly actionable.
function linkify(answer: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  LINK_PATTERN.lastIndex = 0
  while ((match = LINK_PATTERN.exec(answer)) !== null) {
    const token = match[0]
    if (match.index > lastIndex) {
      nodes.push(answer.slice(lastIndex, match.index))
    }

    const isUrl = token.startsWith('http')
    const href = isUrl ? token : `mailto:${token}`
    nodes.push(
      <a
        key={match.index}
        className={styles.link}
        href={href}
        {...(isUrl ? {target: '_blank', rel: 'noopener noreferrer'} : {})}
      >
        {token}
      </a>,
    )
    lastIndex = match.index + token.length
  }

  if (lastIndex < answer.length) {
    nodes.push(answer.slice(lastIndex))
  }

  return nodes
}

// Accessible FAQ disclosure with an animated open/close (height + fade).
// JS-controlled (not native <details>) so the answer stays in the DOM and can
// transition smoothly via the grid-rows 0fr→1fr technique.
export function ItemFaq({question, answer}: ItemFaqProps) {
  const [open, setOpen] = useState(false)
  const answerId = useId()

  return (
    <div className={`${styles.root} ${open ? styles.open : ''}`}>
      <button
        type="button"
        className={styles.summary}
        aria-expanded={open}
        aria-controls={answerId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.question}>{question}</span>
        <Plus className={styles.icon} size={24} aria-hidden="true" />
      </button>

      <div id={answerId} className={styles.answerWrap} role="region">
        <div className={styles.answerInner}>
          <p className={styles.answer}>{linkify(answer)}</p>
        </div>
      </div>
    </div>
  )
}

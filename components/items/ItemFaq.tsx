'use client'

import {useId, useState} from 'react'
import {Plus} from 'lucide-react'
import styles from './ItemFaq.module.css'

type ItemFaqProps = {
  question: string
  answer: string
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
          <p className={styles.answer}>{answer}</p>
        </div>
      </div>
    </div>
  )
}

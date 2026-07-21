'use client'

import {useState} from 'react'
import {useTranslations} from 'next-intl'
import {GuestGame} from './GuestGame'
import {useGameChannel} from '@/utility/game/useGameChannel'
import type {GameTheme} from '@/utility/game/types'
import styles from './GuestGame.module.css'

type Person = {name: string; color: string}

type CoupleGateProps = {
  eventId: string
  coupleName: string
  person1: Person
  person2: Person
  questions: string[]
  initialTheme?: GameTheme
  capacity: number
  // Slot suggested by the link (?p=1|2), highlighted on the picker. null when the
  // generic couple link was opened — then neither is pre-highlighted.
  suggestedSlot: 0 | 1 | null
}

// The "who are you?" picker. It joins the channel with no slot so it can read,
// via Presence, which partner the other device already took — and disables that
// option. Kept as its own component so it fully unmounts once a partner is
// chosen, leaving a single channel per device (GuestGame's).
function CouplePicker({
  eventId,
  coupleName,
  person1,
  person2,
  initialTheme,
  suggestedSlot,
  onPick,
}: {
  eventId: string
  coupleName: string
  person1: Person
  person2: Person
  initialTheme: GameTheme
  suggestedSlot: 0 | 1 | null
  onPick: (slot: 0 | 1) => void
}) {
  const t = useTranslations('game')
  const {claimedCoupleSlots} = useGameChannel(eventId, 'couple', initialTheme, Infinity, null, null)
  const persons = [person1, person2]

  return (
    <div className={styles.root} data-theme={initialTheme}>
      <div className={styles.stage}>
        <div className={styles.center}>
          <p className={styles.eyebrow}>{coupleName}</p>
          <h1 className={styles.big}>{t('couple.whoTitle')}</h1>
          <p className={styles.note}>{t('couple.whoText')}</p>
          <div className={styles.options}>
            {persons.map((person, index) => {
              const taken = claimedCoupleSlots.includes(index as 0 | 1)
              return (
                <button
                  key={index}
                  type="button"
                  className={styles.option}
                  disabled={taken}
                  style={{
                    background: person.color,
                    opacity: taken ? 0.4 : 1,
                    cursor: taken ? 'not-allowed' : 'pointer',
                    outline:
                      !taken && index === suggestedSlot ? '3px solid var(--color-white)' : undefined,
                    outlineOffset: !taken && index === suggestedSlot ? '2px' : undefined,
                  }}
                  onClick={() => onPick(index as 0 | 1)}
                >
                  {person.name}
                  {taken ? ` · ${t('couple.taken')}` : ''}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// Phone mode: before the couple can answer, each partner must actively say which
// of the two they are. Assignment is never silent — the picker is shown until a
// partner is chosen, and the choice is kept only in memory (not persisted), so a
// reload asks again. A partner the other device already took can't be picked; a
// wrong choice can be undone via "switch" on the game screen, which returns here.
export function CoupleGate({
  eventId,
  coupleName,
  person1,
  person2,
  questions,
  initialTheme = 'light',
  capacity,
  suggestedSlot,
}: CoupleGateProps) {
  const [slot, setSlot] = useState<0 | 1 | null>(null)

  const choose = (value: 0 | 1) => setSlot(value)
  const reset = () => setSlot(null)

  if (slot === null) {
    return (
      <CouplePicker
        eventId={eventId}
        coupleName={coupleName}
        person1={person1}
        person2={person2}
        initialTheme={initialTheme}
        suggestedSlot={suggestedSlot}
        onPick={choose}
      />
    )
  }

  return (
    <GuestGame
      eventId={eventId}
      coupleName={coupleName}
      person1={person1}
      person2={person2}
      questions={questions}
      initialTheme={initialTheme}
      capacity={capacity}
      couple={{slot, partnerName: slot === 0 ? person1.name : person2.name, onChange: reset}}
    />
  )
}

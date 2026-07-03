import {Link} from '@/i18n/navigation'
import styles from './LayoutGameStub.module.css'

type GameView = 'host' | 'display' | 'guest'

type LayoutGameStubProps = {
  view: GameView
  id: string
}

// Placeholder shell for the three in-game views (host control / beamer canvas /
// guest phone). Copy, i18n and the real game logic follow later — for now this
// only proves the routing: every view knows the event id and links to the two
// sibling views plus back to the event's dashboard detail page.
const VIEWS: Record<GameView, {label: string; hint: string}> = {
  host: {label: 'Host-Steuerung', hint: 'Dein Gerät — gibt Tempo und Reveals vor.'},
  display: {label: 'Leinwand', hint: 'Am Beamer für alle — Frage, Countdown, Reveal.'},
  guest: {label: 'Gäste-Ansicht', hint: 'Gäste-Handy — eine Frage, zwei Buttons.'},
}

export function LayoutGameStub({view, id}: LayoutGameStubProps) {
  const current = VIEWS[view]
  const others = (Object.keys(VIEWS) as GameView[]).filter((key) => key !== view)

  return (
    <main className={styles.root}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Ansicht (Platzhalter)</p>
        <h1 className={styles.title}>{current.label}</h1>
        <p className={styles.hint}>{current.hint}</p>
        <p className={styles.meta}>
          Event-ID: <code>{id}</code>
        </p>

        <nav className={styles.nav} aria-label="Ansichten">
          {others.map((key) => (
            <Link key={key} href={`/${key}/${id}`} className={styles.link}>
              → {VIEWS[key].label}
            </Link>
          ))}
          <Link href={`/dashboard/events/${id}`} className={styles.linkMuted}>
            ← Zurück zum Event
          </Link>
        </nav>
      </div>
    </main>
  )
}

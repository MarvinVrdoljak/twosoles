'use client'

import {useEffect, useState} from 'react'
import {createTranslator, useLocale, useTranslations} from 'next-intl'
import {
  Calendar,
  Check,
  Copy,
  ExternalLink,
  FileDown,
  ListChecks,
  Loader2,
  PartyPopper,
  Play,
  Users,
} from 'lucide-react'
import {CommonBadge} from '@/components/common/CommonBadge'
import {CommonButton} from '@/components/common/CommonButton'
import {GameQr} from '@/components/game/GameQr'
import {Link, getPathname} from '@/i18n/navigation'
import {routing} from '@/i18n/routing'
import type {Locale} from '@/i18n/routing'
import type {EventStatus} from '@/utility/events/status'
import {STATUS_BADGE_VARIANT} from '@/utility/events/status'
import {downloadEventPdf} from '@/utility/pdf/eventPdf'
import styles from './ItemEventOverview.module.css'

// Lazy per-locale message loaders so a PDF can be rendered in the event's game
// language, independent of the dashboard UI locale.
const MESSAGES: Record<Locale, () => Promise<{default: Record<string, unknown>}>> = {
  de: () => import('@/i18n/messages/de.json'),
  en: () => import('@/i18n/messages/en.json'),
}

// The app augments next-intl's message types, so a translator built from
// runtime-loaded messages needs a loose signature.
type LooseTranslator = ((key: string, values?: Record<string, string>) => string) & {
  raw: (key: string) => unknown
}

type ItemEventOverviewProps = {
  name1: string
  name2: string
  occasion: string
  gameLanguage: string
  date: string
  guests: string
  status: EventStatus
  eventId: string
  goingLive: boolean
  onGoLive: () => void
  onPlay: () => void
  questions: string
}

export function ItemEventOverview({
  name1,
  name2,
  occasion,
  gameLanguage,
  date,
  guests,
  questions,
  status,
  eventId,
  goingLive,
  onGoLive,
  onPlay,
}: ItemEventOverviewProps) {
  const t = useTranslations('eventDetail')
  const tDash = useTranslations('dashboard')
  const locale = useLocale() as Locale

  // Absolute URLs are only known on the client — the QR codes must be
  // scannable, so build them from the live origin after mount.
  const [origin, setOrigin] = useState('')
  const [pdfBusy, setPdfBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])
  const absolute = (href: string) => (origin ? `${origin}${getPathname({href, locale})}` : '')

  const couple = `${name1 || '?'} & ${name2 || '?'}`

  const cards = [
    {key: 'guest', label: t('guestLink'), href: `/guest/${eventId}`},
    {key: 'display', label: t('displayLink'), href: `/display/${eventId}`},
    {key: 'host', label: t('hostLink'), href: `/host/${eventId}`},
  ]

  const handleCopy = async (card: (typeof cards)[number]) => {
    const url = absolute(card.href)
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(card.key)
      window.setTimeout(() => setCopied((current) => (current === card.key ? null : current)), 2000)
    } catch {
      // Clipboard unavailable (e.g. insecure context) — silently ignore.
    }
  }

  const handleDownload = async (card: (typeof cards)[number]) => {
    const url = absolute(card.href)
    if (!url) return
    setPdfBusy(card.key)
    try {
      // Render the PDF in the event's game language, not the dashboard locale.
      const lang = (routing.locales as readonly string[]).includes(gameLanguage)
        ? (gameLanguage as Locale)
        : locale
      const messages = (await MESSAGES[lang]()).default
      const pdf = createTranslator({
        locale: lang,
        messages,
        namespace: 'eventDetail.pdf',
      }) as unknown as LooseTranslator
      const detail = createTranslator({
        locale: lang,
        messages,
        namespace: 'eventDetail',
      }) as unknown as LooseTranslator
      const game = createTranslator({
        locale: lang,
        messages,
        namespace: 'game.display',
      }) as unknown as LooseTranslator

      let content: {eyebrow: string; heading: string; intro: string; instruction: string}
      if (card.key === 'guest') {
        // The game's tagline as pretitle, e.g. "Wer würde eher?".
        content = {
          eyebrow: game('eyebrowQuestion'),
          heading: couple,
          intro: pdf('guestIntro'),
          instruction: pdf('scanHint'),
        }
      } else if (card.key === 'display') {
        content = {
          eyebrow: pdf('displayEyebrow'),
          heading: detail('displayLink'),
          intro: pdf('displayIntro'),
          instruction: pdf('openHint'),
        }
      } else {
        content = {
          eyebrow: pdf('hostEyebrow'),
          heading: detail('hostLink'),
          intro: pdf('hostIntro'),
          instruction: pdf('openHint'),
        }
      }

      await downloadEventPdf({
        ...content,
        url,
        fileName: `TwoSoles – ${couple} – ${card.label}.pdf`,
      })
    } finally {
      setPdfBusy(null)
    }
  }

  const statusLabel = {
    draft: tDash('statusDraft'),
    live: tDash('statusLive'),
    ended: tDash('statusEnded'),
    expired: tDash('statusExpired'),
  }[status]

  return (
    <aside className={styles.root}>
      <div className={styles.top}>
        <div className={styles.avatars} aria-hidden="true">
          <span className={styles.avatar}>{name1.charAt(0) || '?'}</span>
          <span className={styles.avatar}>{name2.charAt(0) || '?'}</span>
        </div>
        <CommonBadge variant={STATUS_BADGE_VARIANT[status]} pulse={status === 'live'}>
          {statusLabel}
        </CommonBadge>
      </div>

      <div className={styles.headline}>
        <h1 className={styles.couple}>{`${name1 || '?'} & ${name2 || '?'}`}</h1>
        <p className={styles.occasion}>{occasion}</p>
      </div>

      <ul className={styles.meta}>
        <li className={styles.metaItem}>
          <Calendar size={20} aria-hidden="true" />
          <span>{date}</span>
        </li>
        <li className={styles.metaItem}>
          <Users size={20} aria-hidden="true" />
          <span>{guests}</span>
        </li>
        <li className={styles.metaItem}>
          <ListChecks size={20} aria-hidden="true" />
          <span>{questions}</span>
        </li>
      </ul>

      <div className={styles.links}>
        {cards.map((card) => (
          <div key={card.key} className={styles.guest}>
            <span className={styles.qr}>
              <GameQr value={absolute(card.href)} />
            </span>
            <div className={styles.guestText}>
              <span className={styles.guestLabel}>{card.label}</span>
              <div className={styles.cardActions}>
                <Link
                  href={card.href}
                  className={styles.cardAction}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t('openView')}
                  aria-label={t('openView')}
                >
                  <ExternalLink size={16} aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  className={`${styles.cardAction} ${copied === card.key ? styles.cardActionDone : ''}`}
                  onClick={() => handleCopy(card)}
                  title={copied === card.key ? t('copied') : t('copyLink')}
                  aria-label={copied === card.key ? t('copied') : t('copyLink')}
                >
                  {copied === card.key ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    <Copy size={16} aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  className={styles.cardAction}
                  onClick={() => handleDownload(card)}
                  disabled={pdfBusy !== null}
                  title={pdfBusy === card.key ? t('pdf.generating') : t('pdf.download')}
                  aria-label={pdfBusy === card.key ? t('pdf.generating') : t('pdf.download')}
                >
                  {pdfBusy === card.key ? (
                    <Loader2 size={16} className={styles.spin} aria-hidden="true" />
                  ) : (
                    <FileDown size={16} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        {status === 'draft' ? (
          <CommonButton
            variant="secondary"
            size="md"
            fullWidth
            onClick={onGoLive}
            disabled={goingLive}
          >
            <PartyPopper size={18} aria-hidden="true" />
            {goingLive ? t('saving') : t('settings.goLive')}
          </CommonButton>
        ) : null}

        {status === 'draft' || status === 'live' ? (
          <CommonButton variant="primary" size="md" fullWidth onClick={onPlay}>
            <Play size={18} aria-hidden="true" />
            {status === 'live' ? t('startGame') : t('testGame')}
          </CommonButton>
        ) : null}
      </div>
    </aside>
  )
}

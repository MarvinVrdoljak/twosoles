'use client'

import {useEffect, useState, type ReactNode} from 'react'
import {createTranslator, useLocale, useTranslations} from 'next-intl'
import {Download, ExternalLink} from 'lucide-react'
import {CommonButton} from '@/components/common/CommonButton'
import {GameQr} from '@/components/game/GameQr'
import {Link, getPathname} from '@/i18n/navigation'
import {routing} from '@/i18n/routing'
import type {Locale} from '@/i18n/routing'
import {downloadEventPdf} from '@/utility/pdf/eventPdf'
import {downloadGuidePdf} from '@/utility/pdf/guidePdf'
import styles from './../form/FormEventDetail.module.css'

type Step = {title: string; text: string}

// Lazy per-locale message loaders so the PDF can be rendered in the event's
// game language, independent of the dashboard UI locale.
const MESSAGES: Record<Locale, () => Promise<{default: Record<string, unknown>}>> = {
  de: () => import('@/i18n/messages/de.json'),
  en: () => import('@/i18n/messages/en.json'),
}

// The app augments next-intl's message types, so a translator built from
// runtime-loaded messages needs a loose signature.
type LooseTranslator = ((key: string) => string) & {
  raw: (key: string) => unknown
}

// The three game views, in the SAME order as the `guide.views` translation
// array (Leinwand-Ansicht → Host-Steuerung → Gäste-Ansicht). The key doubles as
// the route segment: /display, /host, /guest.
const VIEW_KEYS = ['display', 'host', 'guest'] as const
type ViewKey = (typeof VIEW_KEYS)[number]

// Strip the inline link tags (<display>, <host>, <download>, …) so the printed
// booklet shows clean plain text.
const stripTags = (text: string) => text.replace(/<[^>]+>/g, '')

type ItemEventGuideProps = {
  eventId: string
  couple: string
  gameLanguage: string
  // 'phone' shows the couple-link section (the bride/groom answer on their own
  // devices); 'shoe' hides it (the host enters the couple's answer instead).
  answerMode: string
  // Jumps to this event's Settings tab (where the game reset lives). Same-page
  // tab switch, so it's a callback rather than a link.
  onOpenSettings: () => void
}

// Static "how to play" tab. Screen names link to the live views in a new tab;
// the download button renders the whole guide as a PDF.
export function ItemEventGuide({
  eventId,
  couple,
  gameLanguage,
  answerMode,
  onOpenSettings,
}: ItemEventGuideProps) {
  const t = useTranslations('eventDetail')
  const locale = useLocale() as Locale
  const needs = t.raw('guide.needs') as string[]
  const views = t.raw('guide.views') as Step[]
  const setup = t.raw('guide.setup') as string[]
  const round = t.raw('guide.round') as Step[]
  const tips = t.raw('guide.tips') as string[]

  // Absolute URLs are only known on the client — the QR codes must be
  // scannable, so build them from the live origin after mount.
  const [origin, setOrigin] = useState('')
  const [pdfBusy, setPdfBusy] = useState(false)
  const [guestPdfBusy, setGuestPdfBusy] = useState(false)
  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])
  const absolute = (href: string) => (origin ? `${origin}${getPathname({href, locale})}` : '')

  const viewPath = (key: ViewKey) => `/${key}/${eventId}`

  // next-intl can't infer rich-text tags on an array-index message path, so
  // build a loosely-typed rich translator for the inline links.
  const tRich = t.rich as unknown as (
    key: string,
    values: Record<string, (chunks: ReactNode) => ReactNode>,
  ) => ReactNode

  // The table-QR download mirrors the guest-link PDF in ItemEventOverview: the
  // scannable poster that sends guests straight to the voting page.
  const handleGuestPdf = async () => {
    const url = absolute(viewPath('guest'))
    if (!url) return
    setGuestPdfBusy(true)
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

      await downloadEventPdf({
        eyebrow: game('eyebrowQuestion'),
        heading: couple,
        intro: pdf('guestIntro'),
        instruction: pdf('scanHint'),
        url,
        fileName: `TwoSoles – ${couple} – ${detail('guestLink')}.pdf`,
      })
    } finally {
      setGuestPdfBusy(false)
    }
  }

  const handleDownload = async () => {
    setPdfBusy(true)
    try {
      // Render the guide in the event's game language, not the dashboard locale.
      const lang = (routing.locales as readonly string[]).includes(gameLanguage)
        ? (gameLanguage as Locale)
        : locale
      const messages = (await MESSAGES[lang]()).default
      const g = createTranslator({
        locale: lang,
        messages,
        namespace: 'eventDetail.guide',
      }) as unknown as LooseTranslator

      const guideViews = (g.raw('views') as Step[]).map((view, index) => ({
        ...view,
        url: absolute(viewPath(VIEW_KEYS[index])),
      }))

      await downloadGuidePdf({
        fileName: `${g('title')} – ${couple}.pdf`,
        eyebrow: couple,
        title: g('title'),
        intro: g('intro'),
        ideaTitle: g('ideaTitle'),
        idea: g('idea'),
        needsTitle: g('needsTitle'),
        needs: g.raw('needs') as string[],
        viewsTitle: g('viewsTitle'),
        viewsIntro: g('viewsIntro'),
        views: guideViews,
        setupTitle: g('setupTitle'),
        setup: (g.raw('setup') as string[]).map(stripTags),
        roundTitle: g('roundTitle'),
        round: (g.raw('round') as Step[]).map((step) => ({...step, text: stripTags(step.text)})),
        tipsTitle: g('tipsTitle'),
        tips: g.raw('tips') as string[],
      })
    } finally {
      setPdfBusy(false)
    }
  }

  // Inline link tags shared by every rich guide string: the three screens open
  // in a new tab, and "hier" triggers the table-QR PDF download.
  const viewLink = (key: ViewKey) => (chunks: ReactNode) => (
    <Link
      href={viewPath(key)}
      className={styles.inlineLink}
      target="_blank"
      rel="noopener noreferrer"
    >
      {chunks}
    </Link>
  )
  const richTags: Record<string, (chunks: ReactNode) => ReactNode> = {
    display: viewLink('display'),
    host: viewLink('host'),
    guest: viewLink('guest'),
    // Jumps to this event's Settings tab, where the game can be reset.
    settings: (chunks) => (
      <button type="button" className={styles.inlineLink} onClick={onOpenSettings}>
        {chunks}
      </button>
    ),
    download: (chunks) => (
      <button
        type="button"
        className={styles.inlineLink}
        onClick={handleGuestPdf}
        disabled={guestPdfBusy}
      >
        {chunks}
      </button>
    ),
  }

  return (
    <div className={styles.guide}>
      <section className={styles.guideSection}>
        <h2 className={styles.guideTitle}>{t('guide.title')}</h2>
        <p className={styles.guideIntro}>{t('guide.intro')}</p>
      </section>

      <hr className={styles.divider} />

      <section className={styles.guideSection}>
        <h3 className={styles.guideHeading}>{t('guide.ideaTitle')}</h3>
        <p className={styles.guideText}>{t('guide.idea')}</p>
      </section>

      <section className={styles.guideSection}>
        <h3 className={styles.guideHeading}>{t('guide.needsTitle')}</h3>
        <ul className={styles.bullets}>
          {needs.map((need) => (
            <li key={need}>{need}</li>
          ))}
        </ul>
      </section>

      <section className={styles.guideSection}>
        <h3 className={styles.guideHeading}>{t('guide.viewsTitle')}</h3>
        <p className={styles.guideText}>{t('guide.viewsIntro')}</p>
        <div className={styles.views}>
          {views.map((view, index) => (
            <div key={view.title} className={styles.view}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <span className={styles.viewBody}>
                <span className={styles.viewTextGroup}>
                  <span className={styles.viewTitle}>{view.title}</span>
                  <span className={styles.viewText}>{view.text}</span>
                </span>
                <CommonButton
                  href={viewPath(VIEW_KEYS[index])}
                  variant="secondary"
                  size="sm"
                  target="_blank"
                >
                  <ExternalLink size={16} aria-hidden="true" />
                  {t('openView')}
                </CommonButton>
              </span>
              <span className={styles.viewQr}>
                <GameQr value={absolute(viewPath(VIEW_KEYS[index]))} />
              </span>
            </div>
          ))}
        </div>
      </section>

      {answerMode === 'phone' ? (
        <section className={styles.guideSection}>
          <h3 className={styles.guideHeading}>{t('guide.coupleTitle')}</h3>
          <p className={styles.guideText}>{t('guide.coupleText')}</p>
          <div className={styles.views}>
            <div className={styles.view}>
              <span className={styles.viewBody}>
                <span className={styles.viewTextGroup}>
                  <span className={styles.viewTitle}>{t('coupleLink')}</span>
                  <span className={styles.viewText}>{t('guide.coupleLinkText')}</span>
                </span>
                <CommonButton
                  href={`/couple/${eventId}`}
                  variant="secondary"
                  size="sm"
                  target="_blank"
                >
                  <ExternalLink size={16} aria-hidden="true" />
                  {t('openView')}
                </CommonButton>
              </span>
              <span className={styles.viewQr}>
                <GameQr value={absolute(`/couple/${eventId}`)} />
              </span>
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.guideSection}>
        <h3 className={styles.guideHeading}>{t('guide.setupTitle')}</h3>
        {setup.map((_, index) => (
          <p key={index} className={styles.guideText}>
            {tRich(`guide.setup.${index}`, richTags)}
          </p>
        ))}
      </section>

      <section className={styles.guideSection}>
        <h3 className={styles.guideHeading}>{t('guide.roundTitle')}</h3>
        <ol className={styles.steps}>
          {round.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <span className={styles.stepBody}>
                <span className={styles.stepTitle}>{step.title}</span>
                <span className={styles.stepText}>
                  {tRich(`guide.round.${index}.text`, richTags)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.guideSection}>
        <h3 className={styles.guideHeading}>{t('guide.tipsTitle')}</h3>
        <ul className={styles.bullets}>
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <hr className={styles.divider} />

      <div className={styles.guideDownload}>
        <p className={styles.guideDownloadHint}>{t('guide.downloadHint')}</p>
        <CommonButton variant="primary" size="md" onClick={handleDownload} disabled={pdfBusy}>
          <Download size={18} aria-hidden="true" />
          {pdfBusy ? t('pdf.generating') : t('guide.download')}
        </CommonButton>
      </div>
    </div>
  )
}

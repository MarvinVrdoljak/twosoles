import 'server-only'
import {Resend} from 'resend'
import de from '@/i18n/messages/de.json'
import en from '@/i18n/messages/en.json'
import {formatPrice} from '@/utility/stripe/format'
import {PACKAGE_ORDER} from '@/utility/stripe/packages'

// § 312f BGB: after a distance contract is concluded, the trader has to confirm
// it on a durable medium within a reasonable time, including the terms and the
// withdrawal instructions. Stripe's payment receipt does NOT cover this: it
// documents the payment, not the contract. So we send our own confirmation, and
// it is also what makes the § 356 Abs. 5 early expiry of the withdrawal right
// effective at all.
//
// Messages are imported directly rather than resolved through next-intl: this
// runs from the Stripe webhook, which has no request locale to derive from.

const FROM_EMAIL = process.env.ORDER_FROM_EMAIL ?? process.env.CONTACT_FROM_EMAIL ?? 'Two Soles <hello@twosoles.live>'
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://twosoles.live'

type EmailLocale = 'de' | 'en'

type LegalSection = {id?: string; heading: string; body: string}

export type OrderConfirmation = {
  to: string
  locale: EmailLocale
  eventTitle: string
  packageKey: string
  // As reported by Stripe, in minor units. Null only if Stripe omitted it.
  amountTotal: number | null
  currency: string | null
  orderedAt: Date
}

function messages(locale: EmailLocale) {
  return locale === 'en' ? en : de
}

// The withdrawal instructions and the model form are quoted verbatim from the
// published terms, looked up by their stable id so renumbering the paragraphs
// never silently empties this email.
function legalSection(locale: EmailLocale, id: string): LegalSection | undefined {
  const sections = messages(locale).legal.terms.sections as LegalSection[]
  return sections.find((section) => section.id === id)
}

function tierFor(locale: EmailLocale, packageKey: string) {
  const index = PACKAGE_ORDER.indexOf(packageKey as (typeof PACKAGE_ORDER)[number])
  const tiers = messages(locale).pricing.tiers as Array<{name: string; capacity: string}>
  return index >= 0 ? tiers[index] : undefined
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function paragraphs(body: string): string {
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        `<p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#4b5563">${escapeHtml(line)}</p>`,
    )
    .join('')
}

// Never throws: a failed confirmation must not roll back a paid, fulfilled
// order. Failures are logged so they can be resent by hand.
export async function sendOrderConfirmation(order: OrderConfirmation): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[order-mail] RESEND_API_KEY is not set, confirmation not sent', {to: order.to})
    return false
  }

  const m = messages(order.locale)
  const t = m.orderEmail
  const tier = tierFor(order.locale, order.packageKey)
  const withdrawal = legalSection(order.locale, 'withdrawal')
  const withdrawalForm = legalSection(order.locale, 'withdrawalForm')

  const dateFormat = new Intl.DateTimeFormat(order.locale, {dateStyle: 'long', timeStyle: 'short'})
  const amount =
    order.amountTotal != null && order.currency
      ? formatPrice(order.amountTotal, order.currency, order.locale)
      : '—'

  const rows: Array<[string, string]> = [
    [t.event, order.eventTitle || '—'],
    [t.package, tier?.name ?? order.packageKey],
    [t.capacity, tier?.capacity ?? '—'],
    [t.amount, amount],
    [t.date, dateFormat.format(order.orderedAt)],
  ]

  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;font-size:14px;color:#6b7280">${escapeHtml(label)}</td>` +
        `<td style="padding:6px 0;font-size:14px;color:#1f2937"><strong>${escapeHtml(value)}</strong></td></tr>`,
    )
    .join('')

  const html = [
    `<div style="margin:0;padding:24px;background:#faf7f2;font-family:Georgia,'Times New Roman',serif">`,
    `<div style="max-width:600px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e7dfd2;border-radius:16px">`,
    `<h1 style="margin:0 0 16px;font-size:24px;color:#1f2937">${escapeHtml(t.heading)}</h1>`,
    `<p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4b5563">${escapeHtml(t.intro)}</p>`,
    `<h2 style="margin:0 0 8px;font-size:16px;color:#1f2937">${escapeHtml(t.orderTitle)}</h2>`,
    `<table role="presentation" cellpadding="0" cellspacing="0">${rowsHtml}</table>`,
    `<p style="margin:12px 0 0;font-size:13px;color:#9ca3af">${escapeHtml(t.vatNote)}</p>`,
    `<p style="margin:8px 0 0;font-size:13px;color:#9ca3af">${escapeHtml(t.merchantNote)}</p>`,
    withdrawal
      ? `<h2 style="margin:32px 0 8px;font-size:16px;color:#1f2937">${escapeHtml(withdrawal.heading)}</h2>${paragraphs(withdrawal.body)}`
      : '',
    withdrawalForm
      ? `<h2 style="margin:32px 0 8px;font-size:16px;color:#1f2937">${escapeHtml(withdrawalForm.heading)}</h2>${paragraphs(withdrawalForm.body)}`
      : '',
    `<h2 style="margin:32px 0 8px;font-size:16px;color:#1f2937">${escapeHtml(t.termsTitle)}</h2>`,
    `<p style="margin:0 0 6px;font-size:14px;line-height:1.6;color:#4b5563">${escapeHtml(
      t.termsText.replace('{url}', `${SITE_URL}/${order.locale === 'en' ? 'en/' : ''}terms`),
    )}</p>`,
    `<p style="margin:0;font-size:14px;line-height:1.6;color:#4b5563">${escapeHtml(
      t.privacyText.replace('{url}', `${SITE_URL}/${order.locale === 'en' ? 'en/' : ''}privacy`),
    )}</p>`,
    `<p style="margin:32px 0 0;font-size:13px;color:#9ca3af">${escapeHtml(t.footer)}</p>`,
    `</div></div>`,
  ].join('')

  // Plain-text twin, so the confirmation is readable (and archivable) even where
  // HTML is stripped — it is the durable copy of the contract, after all.
  const text = [
    t.heading,
    '',
    t.intro,
    '',
    t.orderTitle,
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    t.vatNote,
    t.merchantNote,
    withdrawal ? `\n${withdrawal.heading}\n${withdrawal.body}` : '',
    withdrawalForm ? `\n${withdrawalForm.heading}\n${withdrawalForm.body}` : '',
    `\n${t.termsTitle}`,
    t.termsText.replace('{url}', `${SITE_URL}/${order.locale === 'en' ? 'en/' : ''}terms`),
    t.privacyText.replace('{url}', `${SITE_URL}/${order.locale === 'en' ? 'en/' : ''}privacy`),
    '',
    t.footer,
  ].join('\n')

  try {
    const resend = new Resend(apiKey)
    const {error} = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.to,
      subject: t.subject,
      text,
      html,
    })
    if (error) {
      console.error('[order-mail] Resend rejected the send', {to: order.to, error})
      return false
    }
    return true
  } catch (err) {
    console.error('[order-mail] Resend threw while sending', {to: order.to, err})
    return false
  }
}

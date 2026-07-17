'use server'

import 'server-only'
import {getTranslations} from 'next-intl/server'
import {Resend} from 'resend'
import {isContactSubject, type ContactSubject} from './subjects'

// Where contact requests land, and who they come from. Both are overridable per
// environment; the recipient falls back to the address shown on the page, and
// the sender to the verified twosoles.live domain.
const TO_EMAIL = process.env.CONTACT_TO_EMAIL ?? 'hello@twosoles.live'
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL ?? 'Two Soles <hello@twosoles.live>'

export type ContactPayload = {
  subject: ContactSubject
  firstName: string
  lastName: string
  email: string
  weddingDate: string
  guestCount: string
  message: string
  // Honeypot — must be empty for a real submission.
  botcheck: string
}

export type ContactResult = {ok: true} | {ok: false; error: 'invalid' | 'failed'}

// Loose email sanity check — real validation is the delivery attempt itself.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function sendContactMessage(payload: ContactPayload): Promise<ContactResult> {
  const firstName = payload.firstName?.trim() ?? ''
  const lastName = payload.lastName?.trim() ?? ''
  const email = payload.email?.trim() ?? ''
  const message = payload.message?.trim() ?? ''

  // Bots that fill the hidden field get a silent success — no email, no signal
  // that the trap was spotted.
  if (payload.botcheck) return {ok: true}

  // Re-validate everything server-side; never trust the client's own checks.
  if (!isContactSubject(payload.subject)) return {ok: false, error: 'invalid'}
  if (!firstName || !lastName || !message) return {ok: false, error: 'invalid'}
  if (!EMAIL_RE.test(email)) return {ok: false, error: 'invalid'}

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY is not set')
    return {ok: false, error: 'failed'}
  }

  const t = await getTranslations('contact.form')
  const subjectLabel = t(`subjects.${payload.subject}`)
  const fullName = `${firstName} ${lastName}`.trim()
  const weddingDate = payload.weddingDate?.trim() || '—'
  const guestCount = payload.guestCount?.trim() || '—'

  const rows: Array<[string, string]> = [
    ['Anliegen', subjectLabel],
    ['Vorname', firstName],
    ['Nachname', lastName],
    ['E-Mail', email],
    ['Hochzeitsdatum', weddingDate],
    ['Anzahl Gäste', guestCount],
    ['Nachricht', message],
  ]

  const text = rows.map(([label, value]) => `${label}: ${value}`).join('\n')
  const html = rows
    .map(
      ([label, value]) =>
        `<p style="margin:0 0 12px"><strong>${label}:</strong><br>${escapeHtml(value).replace(/\n/g, '<br>')}</p>`,
    )
    .join('')

  try {
    const resend = new Resend(apiKey)
    const {error} = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email,
      subject: `Neue Kontaktanfrage: ${subjectLabel} — ${fullName}`,
      text,
      html,
    })
    if (error) {
      console.error('[contact] Resend rejected the send:', error)
      return {ok: false, error: 'failed'}
    }
    return {ok: true}
  } catch (err) {
    console.error('[contact] Resend threw while sending:', err)
    return {ok: false, error: 'failed'}
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Client-side PDF generation for the three shareable event views (guest,
// display, host). Deliberately simple: white page, a centered block with
// eyebrow, Fraunces heading, short intro, plain QR code, instruction + URL,
// and a small rose heart underneath. jsPDF + qrcode are imported lazily so
// they never touch the SSR bundle, and the app's own fonts (Fraunces for
// headings, Nunito for body) are embedded so the sheet matches the product.

// Brand palette (mirrors styles/base/tokens.css light theme).
export const INK: [number, number, number] = [31, 41, 55] // --color-ink #1f2937
export const PRIMARY: [number, number, number] = [166, 112, 112] // --color-primary #a67070
export const MUTED: [number, number, number] = [107, 114, 128] // --color-text-muted #6b7280
export const BORDER: [number, number, number] = [231, 223, 210] // --color-border #e7dfd2

export const HEADING = 'Fraunces'
export const BODY = 'Nunito'

// Fetched once, then reused across downloads within the session.
let fontCache: Promise<{heading: string; body: string} | null> | null = null

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export function loadFonts() {
  if (!fontCache) {
    fontCache = Promise.all([
      fetch('/fonts/Fraunces.ttf').then((r) => r.arrayBuffer()),
      fetch('/fonts/Nunito.ttf').then((r) => r.arrayBuffer()),
    ])
      .then(([heading, body]) => ({heading: toBase64(heading), body: toBase64(body)}))
      // Fall back to the built-in fonts if the files can't be fetched.
      .catch(() => null)
  }
  return fontCache
}

export type EventPdfContent = {
  fileName: string
  url: string
  eyebrow: string
  heading: string
  intro: string
  instruction: string
}

export async function downloadEventPdf(content: EventPdfContent) {
  const [{jsPDF}, QRCode, fonts] = await Promise.all([
    import('jspdf'),
    import('qrcode').then((m) => m.default),
    loadFonts(),
  ])

  const qrDataUrl = await QRCode.toDataURL(content.url, {
    margin: 0,
    width: 720,
    errorCorrectionLevel: 'M',
    color: {dark: '#1f2937', light: '#ffffff'},
  })

  const doc = new jsPDF({unit: 'mm', format: 'a4'})

  // Register the app fonts; fall back to the built-ins if they didn't load.
  let heading = 'times'
  let body = 'helvetica'
  if (fonts) {
    doc.addFileToVFS('Fraunces.ttf', fonts.heading)
    doc.addFont('Fraunces.ttf', HEADING, 'normal')
    doc.addFileToVFS('Nunito.ttf', fonts.body)
    doc.addFont('Nunito.ttf', BODY, 'normal')
    heading = HEADING
    body = BODY
  }

  const pageW = 210
  const pageH = 297
  const cx = pageW / 2
  const qr = 58
  const qrPad = 8
  const card = qr + qrPad * 2

  // Measure the wrapped text first so the whole block can be centered
  // vertically on the page (splitTextToSize uses the active font/size).
  doc.setFont(heading, 'normal')
  doc.setFontSize(34)
  const headingLines = doc.splitTextToSize(content.heading, pageW - 50) as string[]

  doc.setFont(body, 'normal')
  doc.setFontSize(11.5)
  const introLines = doc.splitTextToSize(content.intro, 118) as string[]

  doc.setFontSize(12.5)
  const instrLines = doc.splitTextToSize(content.instruction, 130) as string[]

  const blockH =
    3.5 + 6 + // eyebrow
    9 + (headingLines.length - 1) * 13.5 + 11 + // heading
    10 + // heart flourish
    4.5 + (introLines.length - 1) * 6.3 + 14 + // intro
    card + 14 + // QR card
    4.5 + (instrLines.length - 1) * 6.5 + 7 + // instruction
    3.5 + 4 // URL
  let y = (pageH - blockH) / 2

  // Eyebrow — uppercase, letter-spaced, in the brand's rose highlight. jsPDF's
  // align:'center' ignores charSpace when measuring, so center it by hand.
  doc.setFont(body, 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...PRIMARY)
  const charSpace = 1.8
  const eyebrow = content.eyebrow.toUpperCase()
  const eyebrowW = doc.getTextWidth(eyebrow) + charSpace * (eyebrow.length - 1)
  doc.setCharSpace(charSpace)
  doc.text(eyebrow, cx - eyebrowW / 2, y + 3.5)
  doc.setCharSpace(0)
  y += 3.5 + 6

  // Heading — couple names / view title in Fraunces.
  doc.setFont(heading, 'normal')
  doc.setFontSize(34)
  doc.setTextColor(...INK)
  headingLines.forEach((line, i) => doc.text(line, cx, y + 9 + i * 13.5, {align: 'center'}))
  y += 9 + (headingLines.length - 1) * 13.5 + 11

  // Closing flourish under the names — a small heart flanked by two rules,
  // all in the brand's rose highlight (same as the pretitle).
  const hy = y
  const heartCenterY = hy + 1
  const gap = 9
  const ruleLen = 26
  doc.setDrawColor(...PRIMARY)
  doc.setLineWidth(0.4)
  doc.line(cx - gap - ruleLen, heartCenterY, cx - gap, heartCenterY)
  doc.line(cx + gap, heartCenterY, cx + gap + ruleLen, heartCenterY)
  doc.setFillColor(...PRIMARY)
  doc.circle(cx - 1.2, hy, 1.3, 'F')
  doc.circle(cx + 1.2, hy, 1.3, 'F')
  doc.triangle(cx - 2.4, hy + 0.45, cx + 2.4, hy + 0.45, cx, hy + 3.4, 'F')
  y += 10

  // Short intro, in near-black for legibility.
  doc.setFont(body, 'normal')
  doc.setFontSize(11.5)
  doc.setTextColor(...INK)
  introLines.forEach((line, i) => doc.text(line, cx, y + 4.5 + i * 6.3, {align: 'center'}))
  y += 4.5 + (introLines.length - 1) * 6.3 + 14

  // QR code on a rounded card with a light border.
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.5)
  doc.roundedRect(cx - card / 2, y, card, card, 5, 5, 'FD')
  doc.addImage(qrDataUrl, 'PNG', cx - qr / 2, y + qrPad, qr, qr)
  y += card + 14

  // Instruction line.
  doc.setFont(body, 'normal')
  doc.setFontSize(12.5)
  doc.setTextColor(...INK)
  instrLines.forEach((line, i) => doc.text(line, cx, y + 4.5 + i * 6.5, {align: 'center'}))
  y += 4.5 + (instrLines.length - 1) * 6.5 + 7

  // URL, small and muted.
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text(content.url, cx, y + 3.5, {align: 'center'})

  doc.save(content.fileName)
}

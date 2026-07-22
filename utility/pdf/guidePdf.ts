// Client-side PDF generation for the full "how to play" guide — a printable
// booklet the host can take to the day itself. Flowing multi-page A4 layout:
// a centred header (couple eyebrow, Fraunces title, heart flourish, intro),
// then the idea, the "needs", the views, the setup, the numbered round
// and the tips. jsPDF is imported lazily and the app's fonts are embedded,
// mirroring eventPdf.ts.

import {BODY, BORDER, HEADING, INK, MUTED, PRIMARY, loadFonts} from './eventPdf'

export type GuidePdfContent = {
  fileName: string
  eyebrow: string
  title: string
  intro: string
  ideaTitle: string
  idea: string
  needsTitle: string
  needs: string[]
  viewsTitle: string
  viewsIntro: string
  views: {title: string; text: string; url: string}[]
  setupTitle: string
  setup: string[]
  roundTitle: string
  round: {title: string; text: string}[]
  tipsTitle: string
  tips: string[]
}

export async function downloadGuidePdf(content: GuidePdfContent) {
  const [{jsPDF}, QRCode, fonts] = await Promise.all([
    import('jspdf'),
    import('qrcode').then((m) => m.default),
    loadFonts(),
  ])

  const viewQrs = await Promise.all(
    content.views.map((view) =>
      QRCode.toDataURL(view.url, {
        margin: 0,
        width: 480,
        errorCorrectionLevel: 'M',
        color: {dark: '#1f2937', light: '#ffffff'},
      }),
    ),
  )

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
  const marginX = 20
  const marginTop = 24
  const marginBottom = 20
  const contentW = pageW - marginX * 2
  const cx = pageW / 2

  // `y` tracks the baseline of the next line to be drawn.
  let y = marginTop

  // Start a new page when the upcoming block (measured downward from the
  // current baseline) would spill past the bottom margin.
  const ensure = (needed: number) => {
    if (y + needed > pageH - marginBottom) {
      doc.addPage()
      y = marginTop
    }
  }

  const wrap = (text: string, size: number, width: number) => {
    doc.setFont(body, 'normal')
    doc.setFontSize(size)
    return doc.splitTextToSize(text, width) as string[]
  }

  // Section title in Fraunces.
  const sectionHeading = (text: string) => {
    ensure(20)
    y += 12
    doc.setFont(heading, 'normal')
    doc.setFontSize(15)
    doc.setTextColor(...INK)
    doc.text(text, marginX, y)
    y += 8
  }

  // A plain body paragraph spanning the full content width.
  const paragraph = (text: string) => {
    const lines = wrap(text, 10.5, contentW)
    ensure(lines.length * 5.3 + 2)
    doc.setFont(body, 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor(...INK)
    lines.forEach((line, i) => doc.text(line, marginX, y + i * 5.3))
    y += lines.length * 5.3 + 3
  }

  // A rose-dot bullet list (used for "needs" and "tips").
  const bulletList = (items: string[]) => {
    items.forEach((item) => {
      const lines = wrap(item, 10.5, contentW - 7)
      ensure(lines.length * 5.3 + 2)
      doc.setFillColor(...PRIMARY)
      doc.circle(marginX + 1.1, y - 1.3, 0.9, 'F')
      doc.setFont(body, 'normal')
      doc.setFontSize(10.5)
      doc.setTextColor(...INK)
      lines.forEach((line, i) => doc.text(line, marginX + 6, y + i * 5.3))
      y += lines.length * 5.3 + 2.4
    })
  }

  // ---- Header block (page 1) --------------------------------------------

  // Eyebrow — couple names, uppercase and letter-spaced in the rose highlight.
  doc.setFont(body, 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...PRIMARY)
  const charSpace = 1.8
  const eyebrow = content.eyebrow.toUpperCase()
  const eyebrowW = doc.getTextWidth(eyebrow) + charSpace * (eyebrow.length - 1)
  doc.setCharSpace(charSpace)
  doc.text(eyebrow, cx - eyebrowW / 2, y)
  doc.setCharSpace(0)
  y += 16

  // Title in Fraunces.
  doc.setFont(heading, 'normal')
  doc.setFontSize(28)
  doc.setTextColor(...INK)
  const titleLines = doc.splitTextToSize(content.title, contentW) as string[]
  titleLines.forEach((line, i) => doc.text(line, cx, y + i * 11, {align: 'center'}))
  y += (titleLines.length - 1) * 11 + 9

  // Heart flourish — a small heart flanked by two rose rules.
  const heartCenterY = y
  const gap = 8
  const ruleLen = 22
  doc.setDrawColor(...PRIMARY)
  doc.setLineWidth(0.4)
  doc.line(cx - gap - ruleLen, heartCenterY, cx - gap, heartCenterY)
  doc.line(cx + gap, heartCenterY, cx + gap + ruleLen, heartCenterY)
  doc.setFillColor(...PRIMARY)
  doc.circle(cx - 1.2, heartCenterY - 1, 1.3, 'F')
  doc.circle(cx + 1.2, heartCenterY - 1, 1.3, 'F')
  doc.triangle(cx - 2.4, heartCenterY - 0.55, cx + 2.4, heartCenterY - 0.55, cx, heartCenterY + 2.4, 'F')
  y += 9

  // Intro paragraph, centred.
  const introLines = wrap(content.intro, 10.5, 150)
  doc.setTextColor(...INK)
  introLines.forEach((line, i) => doc.text(line, cx, y + i * 5.6, {align: 'center'}))
  y += (introLines.length - 1) * 5.6 + 10

  // ---- The idea ----------------------------------------------------------

  sectionHeading(content.ideaTitle)
  paragraph(content.idea)

  // ---- What you need -----------------------------------------------------

  sectionHeading(content.needsTitle)
  bulletList(content.needs)

  // ---- The views ---------------------------------------------------------

  sectionHeading(content.viewsTitle)
  paragraph(content.viewsIntro)
  const qrSize = 19
  content.views.forEach((view, index) => {
    const textX = marginX + 11
    const textW = contentW - 11 - qrSize - 6
    const lines = wrap(view.text, 10.5, textW)
    const urlLines = wrap(view.url, 8, textW)
    const textBlockH = 5 + lines.length * 5.2 + urlLines.length * 4 + 1
    const blockH = Math.max(textBlockH, qrSize)
    ensure(blockH + 5)

    const top = y - 3 // approximate top of the title cap for QR alignment

    // Number badge.
    const r = 3.4
    doc.setFillColor(...PRIMARY)
    doc.circle(marginX + r, y - 1.3, r, 'F')
    doc.setFont(heading, 'normal')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text(String(index + 1), marginX + r, y + 0.1, {align: 'center'})

    // Title + text.
    doc.setFont(heading, 'normal')
    doc.setFontSize(11.5)
    doc.setTextColor(...INK)
    doc.text(view.title, textX, y)
    doc.setFont(body, 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor(...INK)
    lines.forEach((line, i) => doc.text(line, textX, y + 5 + i * 5.2))

    // URL, small and muted.
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    urlLines.forEach((line, i) => doc.text(line, textX, y + 5 + lines.length * 5.2 + i * 4))

    // QR code on a light-bordered card, aligned to the right edge.
    const qx = pageW - marginX - qrSize
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.4)
    doc.roundedRect(qx - 2, top - 2, qrSize + 4, qrSize + 4, 2, 2, 'S')
    doc.addImage(viewQrs[index], 'PNG', qx, top, qrSize, qrSize)

    y += blockH + 11
  })

  // ---- Setup -------------------------------------------------------------

  sectionHeading(content.setupTitle)
  content.setup.forEach((p) => paragraph(p))

  // ---- How a round works (numbered steps) --------------------------------

  sectionHeading(content.roundTitle)
  content.round.forEach((step, index) => {
    const textX = marginX + 11
    const lines = wrap(step.text, 10.5, contentW - 11)
    const blockH = 5 + lines.length * 5.2
    ensure(blockH + 4)

    // Number badge.
    const r = 3.4
    doc.setFillColor(...PRIMARY)
    doc.circle(marginX + r, y - 1.3, r, 'F')
    doc.setFont(heading, 'normal')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text(String(index + 1), marginX + r, y + 0.1, {align: 'center'})

    // Title + text.
    doc.setFont(heading, 'normal')
    doc.setFontSize(11.5)
    doc.setTextColor(...INK)
    doc.text(step.title, textX, y)
    doc.setFont(body, 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor(...INK)
    lines.forEach((line, i) => doc.text(line, textX, y + 5 + i * 5.2))
    y += blockH + 4
  })

  // ---- Tips --------------------------------------------------------------

  sectionHeading(content.tipsTitle)
  bulletList(content.tips)

  doc.save(content.fileName)
}

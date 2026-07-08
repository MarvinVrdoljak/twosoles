'use client'

import {useEffect, useState} from 'react'
import QRCode from 'qrcode'

type GameQrProps = {
  /** Full URL the QR should encode (e.g. https://twosoles.app/guest/<id>). */
  value: string
  size?: number
}

// Renders a real, scannable QR code for the guest join URL. Generated on the
// client as an inline SVG so it stays crisp on the projector at any size.
export function GameQr({value, size = 220}: GameQrProps) {
  const [markup, setMarkup] = useState<string>('')

  useEffect(() => {
    let active = true
    QRCode.toString(value, {
      type: 'svg',
      margin: 0,
      errorCorrectionLevel: 'M',
      color: {dark: '#1f2937', light: '#00000000'},
    })
      .then((svg) => {
        if (active) setMarkup(svg)
      })
      .catch(() => {
        if (active) setMarkup('')
      })
    return () => {
      active = false
    }
  }, [value])

  return (
    <span
      style={{display: 'block', width: size, height: size}}
      aria-label={value}
      role="img"
      // The generated markup is a static SVG string we produced ourselves.
      dangerouslySetInnerHTML={{__html: markup}}
    />
  )
}

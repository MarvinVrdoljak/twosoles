'use client'

import {useEffect, useRef} from 'react'
import {useToast} from '@/components/common/CommonToast'

// Bridges a server-rendered auth notice (e.g. an expired magic link or an OAuth
// failure carried in ?error=…) into the app-wide toast stack. Renders nothing;
// it just raises the toast once on mount.
export function AuthNoticeToast({message}: {message: string}) {
  const {toast} = useToast()
  const shown = useRef(false)

  useEffect(() => {
    if (shown.current) return
    shown.current = true
    toast(message, 'error')
  }, [message, toast])

  return null
}

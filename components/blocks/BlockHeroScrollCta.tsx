'use client'

import type {MouseEvent, ReactNode} from 'react'
import {CommonButton} from '@/components/common/CommonButton'

// Secondary hero CTA that smooth-scrolls to the #how-it-works section instead of
// the browser's instant jump, mirroring the header nav (see GlobalHeader). The
// hero only ever renders on the home page, so the target is always present;
// modifier-clicks fall through to the default behaviour.
export function BlockHeroScrollCta({children}: {children: ReactNode}) {
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const target = document.getElementById('how-it-works')
    if (!target) return
    event.preventDefault()
    target.scrollIntoView({behavior: 'smooth'})
    window.history.replaceState(null, '', '#how-it-works')
  }

  return (
    <CommonButton href="#how-it-works" variant="secondary" size="lg" onClick={handleClick}>
      {children}
    </CommonButton>
  )
}

import React from 'react'
import {GlobalAppHeader} from '@/components/globals/GlobalAppHeader'
import {GlobalFooter} from '@/components/globals/GlobalFooter'
import styles from './LayoutDashboard.module.css'

type LayoutDashboardProps = {
  active?: 'events' | 'account'
  children: React.ReactNode
}

// Shell for the signed-in app: app header, content area and the shared footer,
// with subtle botanical decoration.
export function LayoutDashboard({active, children}: LayoutDashboardProps) {
  return (
    <div className={styles.root}>
      <GlobalAppHeader active={active} />
      <main className={styles.main}>{children}</main>
      <GlobalFooter />
    </div>
  )
}

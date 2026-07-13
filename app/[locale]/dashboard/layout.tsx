import type {Metadata} from 'next'
import type {ReactNode} from 'react'

// The dashboard is private, per-user and behind auth — keep every route under
// it out of the index. Applies to /dashboard and all nested pages.
export const metadata: Metadata = {
  robots: {index: false, follow: false},
}

export default function DashboardLayout({children}: {children: ReactNode}) {
  return children
}

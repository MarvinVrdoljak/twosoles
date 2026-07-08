import {notFound} from 'next/navigation'

// Catch-all for every path under a locale that no real route matches. It simply
// triggers `notFound()`, which renders the localized 404 at [locale]/not-found.
// More specific sibling routes (dashboard, host/[id], …) always win over this.
export default function CatchAllPage() {
  notFound()
}

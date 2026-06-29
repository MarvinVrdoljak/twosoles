import createMiddleware from 'next-intl/middleware'
import {routing} from '@/i18n/routing'

// Handles locale negotiation and redirects (e.g. `/` → `/en` when needed).
export default createMiddleware(routing)

export const config = {
  // Match all paths except API routes, Next internals, and static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}

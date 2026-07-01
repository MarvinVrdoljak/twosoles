import createMiddleware from 'next-intl/middleware'
import type {NextRequest} from 'next/server'
import {routing} from '@/i18n/routing'
import {updateSession} from '@/utility/supabase/middleware'

// Handles locale negotiation and redirects (e.g. `/` → `/de` when needed).
const handleI18nRouting = createMiddleware(routing)

export async function proxy(request: NextRequest) {
  // 1. next-intl owns the response (it may be a redirect to add the locale).
  const response = handleI18nRouting(request)
  // 2. Refresh the Supabase session and attach auth cookies to that response.
  return updateSession(request, response)
}

export const config = {
  // Match all paths except API/auth routes, Next internals, and static files.
  // `/auth/*` (magic-link callback) handles its own session and must skip i18n.
  matcher: ['/((?!api|auth|_next|_vercel|.*\\..*).*)'],
}

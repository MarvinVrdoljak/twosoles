import createMiddleware from 'next-intl/middleware'
import {NextResponse, type NextRequest} from 'next/server'
import {routing} from '@/i18n/routing'
import {updateSession} from '@/utility/supabase/middleware'

// Handles locale negotiation and redirects (e.g. `/` → `/de` when needed).
const handleI18nRouting = createMiddleware(routing)

// Optional site-wide HTTP Basic Auth gate for non-public environments (staging,
// and production until launch). It is enabled purely by the PRESENCE of the
// `SITE_BASIC_AUTH` env var (format `user:password`): set it to lock the site,
// unset it to make the site public again. Removing the gate from production at
// launch is therefore just an env-var change + redeploy — no code change.
//
// Only the page routes the matcher below covers are gated; `/api/*` (Stripe
// webhook) and `/auth/*` (magic-link callback) stay open by design so machine
// callers and email links keep working. App data is protected by Supabase RLS
// regardless, so gating the pages is enough to keep a pre-launch site private.
function basicAuthGate(request: NextRequest): NextResponse | null {
  const expected = process.env.SITE_BASIC_AUTH
  if (!expected) return null // no gate configured → site is public

  const header = request.headers.get('authorization')
  if (header?.startsWith('Basic ')) {
    // `Basic ` + base64("user:password"). atob is available in the runtime.
    const decoded = atob(header.slice(6))
    if (decoded === expected) return null // credentials match → let it through
  }

  return new NextResponse('Authentication required.', {
    status: 401,
    headers: {'WWW-Authenticate': 'Basic realm="TwoSoles", charset="UTF-8"'},
  })
}

export async function proxy(request: NextRequest) {
  // 0. Gate the whole site behind Basic Auth when SITE_BASIC_AUTH is set.
  const gate = basicAuthGate(request)
  if (gate) return gate

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

import {type NextRequest} from 'next/server'
import {redirect} from 'next/navigation'
import {createClient} from '@/utility/supabase/server'

// Only ever follow a local redirect target — never an attacker-supplied absolute
// URL (`//evil.com` / `https://evil.com`), which would turn this into an open
// redirect after a successful sign-in.
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
}

// OAuth / PKCE callback: the provider (e.g. Google) returns here with a `code`,
// which we exchange for a session (this sets the auth cookies). Lives outside
// the [locale] segment and is excluded from the i18n middleware.
export async function GET(request: NextRequest) {
  const {searchParams} = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const {error} = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      redirect(next)
    }
  }

  // Missing code or exchange failed.
  redirect('/login?error=oauth')
}

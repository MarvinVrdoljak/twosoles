import {type EmailOtpType} from '@supabase/supabase-js'
import {type NextRequest} from 'next/server'
import {redirect} from 'next/navigation'
import {createClient} from '@/utility/supabase/server'

// Only ever follow a local redirect target — never an attacker-supplied absolute
// URL (`//evil.com` / `https://evil.com`), which would turn this into an open
// redirect after a successful confirmation.
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
}

// Magic-link / confirmation landing route. The email links here with a
// `token_hash` and `type`; we verify it, which sets the session cookies, then
// redirect on. Lives outside the [locale] segment and is excluded from the
// i18n middleware (see middleware.ts matcher).
export async function GET(request: NextRequest) {
  const {searchParams} = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = safeNext(searchParams.get('next'))

  if (tokenHash && type) {
    const supabase = await createClient()
    const {error} = await supabase.auth.verifyOtp({type, token_hash: tokenHash})
    if (!error) {
      redirect(next)
    }
  }

  // Invalid or expired link.
  redirect('/login?error=link')
}

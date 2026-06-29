import {createServerClient} from '@supabase/ssr'
import type {NextRequest, NextResponse} from 'next/server'
import {SUPABASE_ANON_KEY, SUPABASE_URL} from './config'

// Refreshes the Supabase auth session and writes any rotated auth cookies onto
// the response produced upstream (here: the next-intl routing response).
export async function updateSession(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({name, value}) => request.cookies.set(name, value))
        cookiesToSet.forEach(({name, value, options}) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  // Triggers a token refresh when the access token is expired and re-sets the
  // auth cookies. Do not run code between client creation and this call.
  await supabase.auth.getUser()

  return response
}

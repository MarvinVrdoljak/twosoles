import {createServerClient} from '@supabase/ssr'
import {cookies} from 'next/headers'
import {SUPABASE_ANON_KEY, SUPABASE_URL} from './config'

// Supabase client for Server Components, Route Handlers and Server Actions.
// Must be created per request because it binds to the request's cookie store.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({name, value, options}) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // `set` throws when called from a Server Component (cookies are
          // read-only there). The middleware refreshes the session, so this can
          // be safely ignored.
        }
      },
    },
  })
}

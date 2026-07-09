import 'server-only'
import {createClient} from '@supabase/supabase-js'
import {SUPABASE_URL} from './config'

// Full-access Supabase client for trusted server contexts that run WITHOUT a
// user session — currently just the Stripe webhook. Uses Supabase's new *secret*
// key (`sb_secret_…`, the replacement for the legacy `service_role` JWT), which
// bypasses RLS. Never import this into anything reachable by the browser.
// Locally the value is the `SECRET_KEY` printed by `supabase status`.
export function createServiceClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Missing environment variable: SUPABASE_SECRET_KEY')
  }
  return createClient(SUPABASE_URL, secretKey, {
    auth: {persistSession: false, autoRefreshToken: false},
  })
}

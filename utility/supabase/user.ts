import {createClient} from '@/utility/supabase/server'

// Convenience accessor for the authenticated user in Server Components and
// Server Actions. Returns null when no valid session is present.
export async function getUser() {
  const supabase = await createClient()
  const {
    data: {user},
  } = await supabase.auth.getUser()
  return user
}

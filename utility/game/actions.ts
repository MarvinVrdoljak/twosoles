'use server'

import {createClient} from '@/utility/supabase/server'
import {markHostVerified} from './hostSession'

// Verifies a submitted host PIN against the event's stored host_pin. The check
// runs in a security-definer function (verify_host_pin) so the PIN never leaves
// the database and anon can call it. On success we set the host cookie; the
// client then refreshes to reveal the control panel.
export async function verifyHostPinAction(
  eventId: string,
  pin: string,
): Promise<{ok: boolean}> {
  const supabase = await createClient()
  const {data, error} = await supabase.rpc('verify_host_pin', {
    event_id: eventId,
    pin,
  })

  if (error || data !== true) {
    return {ok: false}
  }

  await markHostVerified(eventId)
  return {ok: true}
}

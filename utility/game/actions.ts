'use server'

import {createClient} from '@/utility/supabase/server'
import {createServiceClient} from '@/utility/supabase/service'
import {isHostVerified, markHostVerified} from './hostSession'
import type {GameState} from './types'

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

// Persist the authoritative game state so a host reload/disconnect resumes the
// game instead of broadcasting a fresh lobby to everyone. Gated by the same
// host cookie as the control panel (soft protection, consistent with the PIN
// gate) and written with the service client, since the host is anon and the
// events table is owner-only. Best-effort: a failure just means the reload
// falls back to the lobby, so it must never throw into the caller.
export async function saveGameStateAction(eventId: string, state: GameState): Promise<void> {
  try {
    if (!(await isHostVerified(eventId))) return
    const supabase = createServiceClient()
    const {error} = await supabase.from('events').update({game_state: state}).eq('id', eventId)
    if (error) console.error('[game/persist] update failed', {eventId, error})
  } catch (error) {
    console.error('[game/persist] unexpected failure', {eventId, error})
  }
}

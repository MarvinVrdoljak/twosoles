-- Public (login-free) access to the live game.
--
-- Guests and the beamer join via an unguessable event UUID (a capability URL) —
-- no account. The events table stays owner-only (see create_events.sql); we
-- expose ONLY the game-relevant columns through a view, so host_pin, user_id,
-- email etc. can never leak. The host controls are gated by the 4-digit host_pin
-- instead of a login (verified via the security-definer function below).

-- Whitelist of columns any client may read for a given event. security_invoker
-- is off on purpose: the view runs with its owner's rights and bypasses the
-- table's RLS, which is exactly how we grant anon read access to just these
-- columns without opening the underlying table. host_pin is deliberately absent.
create view public.public_events
with (security_invoker = false) as
  select
    id,
    person1_name,
    person2_name,
    person1_color,
    person2_color,
    person1_photo,
    person2_photo,
    questions
  from public.events;

grant select on public.public_events to anon, authenticated;

-- The beamer (display) shows the couple photos. Objects stay in the private
-- bucket (no public URLs); the display signs them server-side. Allow anon to
-- read objects in this bucket so signing works without a host session. Paths are
-- "<user-id>/<event-id>/..." (UUIDs), so they are not enumerable.
create policy "Public can read event photos"
  on storage.objects for select
  to anon
  using (bucket_id = 'event-photos');

-- Host gate: verify a submitted PIN against the event's host_pin WITHOUT exposing
-- host_pin to the client. Runs as definer so anon can call it; returns only a
-- boolean. search_path is pinned to avoid hijacking.
create or replace function public.verify_host_pin(event_id uuid, pin text)
  returns boolean
  language sql
  security definer
  set search_path = ''
as $$
  select exists (
    select 1
    from public.events e
    where e.id = event_id
      and e.host_pin = pin
  );
$$;

grant execute on function public.verify_host_pin(uuid, text) to anon, authenticated;

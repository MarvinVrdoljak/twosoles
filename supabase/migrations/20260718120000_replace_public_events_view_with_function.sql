-- Harden login-free game access against bulk enumeration.
--
-- The public_events view (security_invoker = false) exposed the whitelisted
-- game columns to anon, which is intended. But a view has no row filter, so
-- anyone holding the public anon key could hit PostgREST directly
--   GET /rest/v1/public_events?select=*
-- and dump EVERY event's names/questions/colors/package/photo-paths at once.
-- The unguessable UUID only protects a row when the caller is forced to supply
-- it; a bare view never forces that.
--
-- Fix: replace the view with a security-definer function that takes the event
-- id as an argument and returns exactly that one row. No id, no data. Same
-- owner-rights / RLS-bypass trick as before (host_pin, user_id, email still
-- never leave the table), but enumeration is now structurally impossible.

create or replace function public.get_public_event(event_id uuid)
  returns table (
    id uuid,
    person1_name text,
    person2_name text,
    person1_color text,
    person2_color text,
    person1_photo text,
    person2_photo text,
    questions jsonb,
    package public.event_package,
    game_theme text
  )
  language sql
  security definer
  set search_path = ''
  stable
as $$
  select
    e.id,
    e.person1_name,
    e.person2_name,
    e.person1_color,
    e.person2_color,
    e.person1_photo,
    e.person2_photo,
    e.questions,
    e.package,
    e.game_theme
  from public.events e
  where e.id = event_id;
$$;

-- Lock the default PUBLIC execute grant down to the two roles that need it.
revoke all on function public.get_public_event(uuid) from public;
grant execute on function public.get_public_event(uuid) to anon, authenticated;

-- The view is no longer needed and is the object the Security Advisor flags.
drop view if exists public.public_events;

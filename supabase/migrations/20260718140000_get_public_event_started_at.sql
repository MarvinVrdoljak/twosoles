-- Expose started_at through get_public_event so the login-free game pages can
-- tell a draft event from a live one.
--
-- Product rule: a draft event is capped at the free-tier guest limit no matter
-- which package was booked. The paid capacity only unlocks once the host sets
-- the event live (started_at committed). This stops a whole party from streaming
-- in during setup/testing and makes "go live" the deliberate switch that turns
-- the booked capacity on.
--
-- started_at is a plain go-live timestamp, not personal data, so adding it to
-- the whitelisted columns is safe. Changing a function's OUT columns needs a
-- drop + recreate (CREATE OR REPLACE can't alter the return type); the grants
-- are reapplied exactly as before.

drop function if exists public.get_public_event(uuid);

create function public.get_public_event(event_id uuid)
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
    game_theme text,
    started_at timestamptz
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
    e.game_theme,
    e.started_at
  from public.events e
  where e.id = event_id;
$$;

revoke all on function public.get_public_event(uuid) from public;
grant execute on function public.get_public_event(uuid) to anon, authenticated;

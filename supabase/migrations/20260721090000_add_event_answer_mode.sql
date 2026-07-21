-- How the couple's own answer is captured during the game. Chosen per event at
-- creation or later under "Key facts", fixed for the whole game (unlike the live
-- theme, which the host flips mid-session).
--
--   'shoe'  = classic shoe game: the couple raises shoes physically, the host
--             taps in what each partner showed. Default, preserves today's flow.
--   'phone' = the couple answers secretly on their own phones; the display
--             reveals both picks simultaneously.
--
-- The couple's actual per-question answers are not stored here — they live in the
-- host-authoritative game_state (never exposed to anon). This column only decides
-- which INPUT path the game screens use, so it is safe to whitelist.
alter table public.events
  add column if not exists answer_mode text not null default 'shoe'
  check (answer_mode in ('shoe', 'phone'));

comment on column public.events.answer_mode is
  'How the couple answers: shoe (host enters) or phone (couple votes secretly).';

-- Expose it through the legacy public view (kept in sync with the RPC below).
-- CREATE OR REPLACE appends the new column at the end, which Postgres permits.
create or replace view public.public_events
with (security_invoker = false) as
  select
    id,
    person1_name,
    person2_name,
    person1_color,
    person2_color,
    person1_photo,
    person2_photo,
    questions,
    package,
    game_theme,
    answer_mode
  from public.events;

-- The login-free game screens read via get_public_event. Changing the function's
-- OUT columns needs a drop + recreate (CREATE OR REPLACE can't alter the return
-- type); the grants are reapplied exactly as before.
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
    started_at timestamptz,
    answer_mode text
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
    e.started_at,
    e.answer_mode
  from public.events e
  where e.id = event_id;
$$;

revoke all on function public.get_public_event(uuid) from public;
grant execute on function public.get_public_event(uuid) to anon, authenticated;

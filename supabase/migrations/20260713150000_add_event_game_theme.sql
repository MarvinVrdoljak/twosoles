-- Per-event default colour scheme for the game screens (light or dark). Chosen
-- by the couple at event creation or later under "Key facts", and used to seed
-- the initial theme on the host/display/guest screens before the host toggles
-- it live. The live game state (game_state.theme, host-authoritative over
-- Realtime) still wins once a session is running; this is only the default.
alter table public.events
  add column if not exists game_theme text not null default 'light'
  check (game_theme in ('light', 'dark'));

comment on column public.events.game_theme is
  'Default game colour scheme (light/dark) shown until the host changes it live.';

-- Expose it through the public game view so the login-free host/display/guest
-- screens can read the default without touching the owner-only events table.
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
    game_theme
  from public.events;

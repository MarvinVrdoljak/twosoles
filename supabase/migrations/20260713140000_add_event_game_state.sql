-- Persist the live game state so a host reload or disconnect doesn't reset the
-- game for everyone. Host-authoritative snapshot (phase / questionIndex / theme
-- / votes / results). Written ONLY by the PIN-verified host through a
-- cookie-gated server action that uses the service client; guests and the
-- display never touch this column (they receive state over Realtime broadcast).
--
-- No extra grant needed: service_role already holds update/select on events
-- (see 20260709101438_grant_service_role.sql) and that covers new columns. The
-- column is deliberately NOT added to the public_events view — anon never reads
-- it — so no view change here.
alter table public.events
  add column if not exists game_state jsonb;

comment on column public.events.game_state is
  'Host-authoritative live game snapshot (phase/questionIndex/theme/votes/results); restored on host reload. Written only by the verified host via service role.';

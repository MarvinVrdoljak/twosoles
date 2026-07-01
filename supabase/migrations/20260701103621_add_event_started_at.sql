-- Timestamp the event was actively started by the host. NULL = not started.
-- Status is derived (not stored): not started + future date = draft; not
-- started + past date = expired; started within 48h = live; started + older
-- than 48h = ended.
alter table public.events add column started_at timestamptz;

-- The free-text event title is no longer used: events are identified by the
-- couple's names + occasion everywhere (dashboard cards, overview, billing).
-- Drop the column so nothing depends on it anymore.
alter table public.events drop column if exists title;

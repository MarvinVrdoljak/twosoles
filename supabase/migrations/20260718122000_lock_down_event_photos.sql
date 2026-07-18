-- Close public read access to the couple photos.
--
-- Originally anon held SELECT on storage.objects in the event-photos bucket so
-- the login-free beamer could sign photo URLs without a host session. But a
-- SELECT grant to anon also lets anyone holding the public anon key LIST the
-- bucket and sign any object — i.e. enumerate and view every couple's photos,
-- not just the guests at one wedding.
--
-- The display route is a server component, so it now signs photos with the
-- service role instead (see app/[locale]/display/[id]/page.tsx). With that in
-- place, anon needs no storage access at all: drop the public policy so the
-- photos are reachable only through our server, and only for a known event id.
-- Owners keep full access to their own photos via the per-owner policies from
-- 20260701094659_create_events.sql.

drop policy if exists "Public can read event photos" on storage.objects;

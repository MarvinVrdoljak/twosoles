-- Expose the event's package through the public game view so the login-free
-- guest/host screens can derive and enforce the per-package guest capacity.
-- (Clients can't read the events table directly.) The package name is not
-- sensitive. CREATE OR REPLACE appends the new column at the end, which Postgres
-- permits for views.
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
    package
  from public.events;

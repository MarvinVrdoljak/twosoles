-- The Stripe webhook and the success-page confirm run as the `service_role`
-- (they have no user session). They must read + update events (to unlock the
-- paid package) and insert into event_payments. The earlier migrations granted
-- these privileges only to `authenticated`, so service_role hit
-- "permission denied for table events" (SQLSTATE 42501). Grant them here.
--
-- service_role already bypasses RLS, so no policies are needed — only the
-- table-level privileges were missing.
grant select, insert, update, delete on public.events to service_role;
grant select, insert, update, delete on public.event_payments to service_role;

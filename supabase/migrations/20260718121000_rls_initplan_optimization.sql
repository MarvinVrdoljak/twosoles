-- RLS performance: wrap auth.uid() in a scalar subselect so Postgres evaluates
-- it ONCE per query (an InitPlan) instead of re-running the auth function for
-- every candidate row. Same result, no behaviour change — purely an optimizer
-- win that matters as the tables grow. Covers every owner-scoped policy, not
-- just the one the advisor happened to flag.

-- events
alter policy "Owner can read own events" on public.events
  using ((select auth.uid()) = user_id);

alter policy "Owner can insert own events" on public.events
  with check ((select auth.uid()) = user_id);

alter policy "Owner can update own events" on public.events
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "Owner can delete own events" on public.events
  using ((select auth.uid()) = user_id);

-- event_payments
alter policy "Owner can read own payments" on public.event_payments
  using ((select auth.uid()) = user_id);

-- storage.objects (couple photos, path = "<user-id>/<event-id>/...")
alter policy "Owner can read own event photos" on storage.objects
  using (bucket_id = 'event-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter policy "Owner can upload own event photos" on storage.objects
  with check (bucket_id = 'event-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter policy "Owner can update own event photos" on storage.objects
  using (bucket_id = 'event-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'event-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter policy "Owner can delete own event photos" on storage.objects
  using (bucket_id = 'event-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

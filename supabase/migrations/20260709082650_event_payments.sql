-- Stripe (Managed Payments) purchase log. One row per SUCCESSFUL Checkout
-- session. Written ONLY by the webhook (service role, bypasses RLS); owners may
-- read their own rows for the billing history. The event's `package` column
-- stays the source of truth for capacity — this table is the money trail +
-- webhook idempotency guard.
create table public.event_payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Stripe Checkout session id — unique so a replayed webhook is a no-op.
  stripe_session_id text not null unique,
  stripe_payment_intent text,
  -- Package the payment unlocks, and the one it replaced (for upgrades).
  target_package public.event_package not null,
  previous_package public.event_package,
  -- Charged amount in the smallest currency unit (cents) as reported by Stripe.
  amount_total integer,
  currency text,
  created_at timestamptz not null default now()
);

create index event_payments_user_id_idx on public.event_payments (user_id);
create index event_payments_event_id_idx on public.event_payments (event_id);

alter table public.event_payments enable row level security;

-- Owners may read their own payment history. Nobody gets insert/update/delete
-- through the anon/authenticated roles — the webhook uses the service role,
-- which bypasses RLS, so payment rows can never be forged from the client.
grant select on public.event_payments to authenticated;

create policy "Owner can read own payments"
  on public.event_payments for select
  to authenticated
  using (auth.uid() = user_id);

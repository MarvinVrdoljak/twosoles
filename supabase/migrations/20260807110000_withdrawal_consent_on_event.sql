-- Move the § 356 Abs. 4/5 BGB declaration from the order to the go-live moment.
--
-- Asking at checkout was wrong: paying unlocks nothing the buyer can use (a
-- draft event stays on the free capacity, see utility/game/capacity.ts), and
-- most people book months ahead, so their withdrawal period expires long before
-- anything is consumed. Making all of them declare "I want to use this within
-- 14 days" asked them to state something untrue.
--
-- The service is consumed by setting the event live. So the declaration belongs
-- there, and only when the event goes live while the 14 days are still running.
-- That makes it a per-EVENT fact, not a per-payment one.
alter table public.events
  add column withdrawal_consent_at timestamptz,
  add column withdrawal_consent_version text;

comment on column public.events.withdrawal_consent_at is
  'When the owner declared, at go-live, that they lose the right of withdrawal (§ 356 Abs. 4/5 BGB). Null when the withdrawal period had already expired, so no declaration was needed.';
comment on column public.events.withdrawal_consent_version is
  'Identifier of the declaration wording shown at the time, e.g. "r4-de".';

alter table public.event_payments
  drop column withdrawal_consent_at,
  drop column withdrawal_consent_version;

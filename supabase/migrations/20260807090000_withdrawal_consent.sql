-- § 356 Abs. 4/5 BGB: a consumer only loses the 14-day right of withdrawal if
-- they EXPRESSLY asked us to start performing before the period is over and
-- confirmed they know they lose the right by doing so. We have to be able to
-- prove that later, so the declaration is recorded with every paid order.
--
-- `withdrawal_consent_at` is the moment the buyer ticked the box (client clock,
-- carried through Stripe metadata); `withdrawal_consent_version` identifies the
-- exact wording they saw, so the text can evolve without losing what was agreed
-- back then (format: "<yyyy-mm>-<locale>", e.g. "2026-08-de").
alter table public.event_payments
  add column withdrawal_consent_at timestamptz,
  add column withdrawal_consent_version text;

comment on column public.event_payments.withdrawal_consent_at is
  'When the buyer declared the § 356 Abs. 4/5 BGB consent to immediate performance.';
comment on column public.event_payments.withdrawal_consent_version is
  'Identifier of the consent wording shown at the time, e.g. "2026-08-de".';

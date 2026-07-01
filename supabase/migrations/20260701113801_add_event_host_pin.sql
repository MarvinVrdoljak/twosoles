-- 4-digit host PIN that protects the projector/host controls (guests do not
-- need it). Random per event; regenerable from the settings tab.
alter table public.events
  add column host_pin text not null default lpad((floor(random() * 10000))::int::text, 4, '0');

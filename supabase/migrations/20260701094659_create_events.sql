-- Event-creation: events table + private photo storage, locked to the owner.

-- Package tiers. Backend names are neutral (free/small/medium/large); the
-- frontend maps them to the display names (Kleine Runde / Intim / Klassisch /
-- Große Feier).
create type public.event_package as enum ('free', 'small', 'medium', 'large');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  person1_name text not null,
  person2_name text not null,
  person1_color text,
  person2_color text,
  person1_photo text,
  person2_photo text,
  occasion text,
  title text not null,
  event_date date,
  game_language text not null default 'de',
  questions jsonb not null default '[]'::jsonb,
  package public.event_package not null default 'free',
  created_at timestamptz not null default now()
);

create index events_user_id_idx on public.events (user_id);

-- Only the owner may read or change their own events.
alter table public.events enable row level security;

-- Table-level privileges for logged-in users (RLS below still restricts every
-- row to its owner; anon gets nothing).
grant select, insert, update, delete on public.events to authenticated;

create policy "Owner can read own events"
  on public.events for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Owner can insert own events"
  on public.events for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Owner can update own events"
  on public.events for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owner can delete own events"
  on public.events for delete
  to authenticated
  using (auth.uid() = user_id);

-- Private bucket for the couple photos uploaded on step 1.
insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', false)
on conflict (id) do nothing;

-- Files live under "<user-id>/<event-id>/...", so the first path segment is the
-- owner. Only that owner may touch the object.
create policy "Owner can read own event photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'event-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Owner can upload own event photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'event-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Owner can update own event photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'event-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'event-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Owner can delete own event photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'event-photos' and (storage.foldername(name))[1] = auth.uid()::text);

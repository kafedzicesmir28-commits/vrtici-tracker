create extension if not exists "uuid-ossp";

create table if not exists public.kindergartens (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone not null default now(),
  email text not null,
  name text not null,
  city text default '',
  email_sent boolean not null default false,
  replied boolean not null default false,
  positive_response boolean not null default false
);

alter table public.kindergartens enable row level security;

drop policy if exists "Allow all operations for anon access" on public.kindergartens;

create policy "Allow all operations for anon access"
on public.kindergartens
for all
to anon
using (true)
with check (true);

-- Run in Supabase SQL Editor: class + advisor dropdowns

-- Classes list (school-defined)
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.classes enable row level security;

drop policy if exists "Anyone authenticated can read classes" on public.classes;
create policy "Anyone authenticated can read classes"
  on public.classes for select
  to authenticated
  using (true);

drop policy if exists "Admins manage classes" on public.classes;
create policy "Admins manage classes"
  on public.classes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Link students to class + advisor (admin profile)
alter table public.profiles
  add column if not exists class_id uuid references public.classes(id) on delete set null;

alter table public.profiles
  add column if not exists advisor_id uuid references public.profiles(id) on delete set null;

-- Seed default classes (safe to re-run)
insert into public.classes (name) values
  ('Period 1'),
  ('Period 2'),
  ('Period 3'),
  ('Period 4'),
  ('Period 5'),
  ('Period 6'),
  ('Period 7'),
  ('Period 8')
on conflict (name) do nothing;

-- Students can list advisor names without seeing all admin profile fields
create or replace function public.list_advisors()
returns table (id uuid, full_name text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, coalesce(nullif(trim(p.full_name), ''), p.email) as full_name
  from public.profiles p
  where p.role = 'admin'
  order by full_name;
$$;

grant execute on function public.list_advisors() to authenticated;

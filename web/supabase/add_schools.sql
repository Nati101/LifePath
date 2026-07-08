-- Add schools table and school-based filtering
-- Run this in the Supabase SQL Editor

-- Create schools table
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.schools enable row level security;

-- Allow authenticated users to read schools
drop policy if exists "Anyone authenticated can read schools" on public.schools;
create policy "Anyone authenticated can read schools"
  on public.schools for select
  to authenticated
  using (true);

-- Allow admins to manage schools
drop policy if exists "Admins manage schools" on public.schools;
create policy "Admins manage schools"
  on public.schools for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Add school_id to classes table
alter table public.classes
  add column if not exists school_id uuid references public.schools(id) on delete set null;

-- Add school_id to profiles table (for advisors/admins)
alter table public.profiles
  add column if not exists school_id uuid references public.schools(id) on delete set null;

-- Drop and recreate list_advisors function to include school_id
-- We must drop first because we're changing the return type
drop function if exists public.list_advisors();

create function public.list_advisors()
returns table (id uuid, full_name text, school_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, coalesce(nullif(trim(p.full_name), ''), p.email) as full_name, p.school_id
  from public.profiles p
  where p.role = 'admin'
  order by full_name;
$$;

grant execute on function public.list_advisors() to authenticated;

-- Create function to get classes filtered by school
create or replace function public.list_classes_by_school(filter_school_id uuid)
returns table (id uuid, name text)
language sql
security definer
set search_path = public
stable
as $$
  select c.id, c.name
  from public.classes c
  where c.school_id = filter_school_id or filter_school_id is null
  order by c.name;
$$;

grant execute on function public.list_classes_by_school(uuid) to authenticated;

-- Seed default school (optional, for testing)
insert into public.schools (name) values
  ('Default School')
on conflict (name) do nothing;

-- Note: Existing classes without a school_id will need to be assigned to a school
-- You can run updates like: UPDATE public.classes SET school_id = (SELECT id FROM public.schools WHERE name = 'Default School') WHERE school_id IS NULL;

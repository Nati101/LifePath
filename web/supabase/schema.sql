-- LifePath Assessment Schema
-- Run this in the Supabase SQL Editor

-- Profiles (extends auth.users)
create type user_role as enum ('student', 'admin');

-- School classes (periods / homerooms)
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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'student',
  class_name text,
  advisor text,
  class_id uuid references public.classes(id) on delete set null,
  advisor_id uuid references public.profiles(id) on delete set null,
  avatar_emoji text default '😊',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Security-definer helper so admin policies don't recurse on profiles RLS
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists "Admins manage classes" on public.classes;
create policy "Admins manage classes"
  on public.classes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Assessment sessions
create table if not exists public.assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  current_section text not null default 'clinical_care' check (
    current_section in (
      'clinical_care',
      'protection',
      'learning_support',
      'build_fix',
      'stem_systems',
      'business_leadership',
      'creative',
      'experience_service',
      'outdoor_systems'
    )
  ),
  current_index int not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.assessment_sessions enable row level security;

drop policy if exists "Users manage own sessions" on public.assessment_sessions;
drop policy if exists "Users read own sessions" on public.assessment_sessions;
drop policy if exists "Users insert own sessions" on public.assessment_sessions;
drop policy if exists "Users update own sessions" on public.assessment_sessions;
drop policy if exists "Users delete own sessions" on public.assessment_sessions;

create policy "Users read own sessions"
  on public.assessment_sessions for select
  using (auth.uid() = user_id);

create policy "Users insert own sessions"
  on public.assessment_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users update own sessions"
  on public.assessment_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own sessions"
  on public.assessment_sessions for delete
  using (auth.uid() = user_id);

drop policy if exists "Admins read all sessions" on public.assessment_sessions;
create policy "Admins read all sessions"
  on public.assessment_sessions for select
  using (public.is_admin());

-- Individual responses
create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.assessment_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id text not null,
  section text not null check (
    section in (
      'clinical_care',
      'protection',
      'learning_support',
      'build_fix',
      'stem_systems',
      'business_leadership',
      'creative',
      'experience_service',
      'outdoor_systems'
    )
  ),
  rating int not null check (rating between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, item_id)
);

alter table public.responses enable row level security;

drop policy if exists "Users manage own responses" on public.responses;
drop policy if exists "Users read own responses" on public.responses;
drop policy if exists "Users insert own responses" on public.responses;
drop policy if exists "Users update own responses" on public.responses;
drop policy if exists "Users delete own responses" on public.responses;

create policy "Users read own responses"
  on public.responses for select
  using (auth.uid() = user_id);

create policy "Users insert own responses"
  on public.responses for insert
  with check (auth.uid() = user_id);

create policy "Users update own responses"
  on public.responses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own responses"
  on public.responses for delete
  using (auth.uid() = user_id);

drop policy if exists "Admins read all responses" on public.responses;
create policy "Admins read all responses"
  on public.responses for select
  using (public.is_admin());

-- Computed results (stored after completion)
create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.assessment_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  path_scores jsonb not null,
  top_paths jsonb not null,
  construct_scores jsonb,
  section_scores jsonb not null,
  computed_at timestamptz not null default now(),
  unique (session_id)
);

alter table public.results enable row level security;

drop policy if exists "Users read own results" on public.results;
create policy "Users read own results"
  on public.results for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own results" on public.results;
create policy "Users insert own results"
  on public.results for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own results" on public.results;
create policy "Users update own results"
  on public.results for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins read all results" on public.results;
create policy "Admins read all results"
  on public.results for select
  using (public.is_admin());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists sessions_updated_at on public.assessment_sessions;
create trigger sessions_updated_at before update on public.assessment_sessions
  for each row execute procedure public.set_updated_at();

drop trigger if exists responses_updated_at on public.responses;
create trigger responses_updated_at before update on public.responses
  for each row execute procedure public.set_updated_at();

-- Advisor list for student account dropdown
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

-- Default classes
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

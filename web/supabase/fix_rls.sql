-- Run this in the Supabase SQL Editor to fix profile recursion + save policies

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

-- Profile avatar (emoji picker)
alter table public.profiles
  add column if not exists avatar_emoji text default '😊';

-- Profiles
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
drop policy if exists "Users manage own sessions" on public.assessment_sessions;
drop policy if exists "Users read own sessions" on public.assessment_sessions;
drop policy if exists "Users insert own sessions" on public.assessment_sessions;
drop policy if exists "Users update own sessions" on public.assessment_sessions;
drop policy if exists "Users delete own sessions" on public.assessment_sessions;
drop policy if exists "Admins read all sessions" on public.assessment_sessions;

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

create policy "Admins read all sessions"
  on public.assessment_sessions for select
  using (public.is_admin());

-- Responses
drop policy if exists "Users manage own responses" on public.responses;
drop policy if exists "Users read own responses" on public.responses;
drop policy if exists "Users insert own responses" on public.responses;
drop policy if exists "Users update own responses" on public.responses;
drop policy if exists "Users delete own responses" on public.responses;
drop policy if exists "Admins read all responses" on public.responses;

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

create policy "Admins read all responses"
  on public.responses for select
  using (public.is_admin());

-- Results
drop policy if exists "Users read own results" on public.results;
drop policy if exists "Users insert own results" on public.results;
drop policy if exists "Users update own results" on public.results;
drop policy if exists "Admins read all results" on public.results;

create policy "Users read own results"
  on public.results for select
  using (auth.uid() = user_id);

create policy "Users insert own results"
  on public.results for insert
  with check (auth.uid() = user_id);

create policy "Users update own results"
  on public.results for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins read all results"
  on public.results for select
  using (public.is_admin());

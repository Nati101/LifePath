-- Restrict advisors to only their assigned students
-- Super admins still see everyone
-- Run this in Supabase SQL Editor

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_super_admin = true
  );
$$;

grant execute on function public.is_super_admin() to authenticated;

-- True when the target user is a student assigned to the current advisor
create or replace function public.is_assigned_student(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = target_user_id
      and role = 'student'
      and advisor_id = auth.uid()
  );
$$;

grant execute on function public.is_assigned_student(uuid) to authenticated;

-- Profiles: keep own-profile access; limit admin reads
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    public.is_super_admin()
    or (
      public.is_admin()
      and (
        id = auth.uid()
        or role = 'admin'
        or advisor_id = auth.uid()
      )
    )
  );

-- Assessment sessions
drop policy if exists "Admins read all sessions" on public.assessment_sessions;
create policy "Admins read all sessions"
  on public.assessment_sessions for select
  using (
    public.is_super_admin()
    or public.is_assigned_student(user_id)
  );

-- Responses
drop policy if exists "Admins read all responses" on public.responses;
create policy "Admins read all responses"
  on public.responses for select
  using (
    public.is_super_admin()
    or public.is_assigned_student(user_id)
  );

-- Results
drop policy if exists "Admins read all results" on public.results;
create policy "Admins read all results"
  on public.results for select
  using (
    public.is_super_admin()
    or public.is_assigned_student(user_id)
  );

-- Result history
drop policy if exists "Admins read all assessment history" on public.assessment_result_history;
create policy "Admins read all assessment history"
  on public.assessment_result_history for select
  using (
    public.is_super_admin()
    or public.is_assigned_student(user_id)
  );

-- Part 2 sessions / responses / results / history
drop policy if exists "Admins read all part2 sessions" on public.part2_sessions;
create policy "Admins read all part2 sessions"
  on public.part2_sessions for select
  using (
    public.is_super_admin()
    or public.is_assigned_student(user_id)
  );

drop policy if exists "Admins read all part2 responses" on public.part2_responses;
create policy "Admins read all part2 responses"
  on public.part2_responses for select
  using (
    public.is_super_admin()
    or public.is_assigned_student(user_id)
  );

drop policy if exists "Admins read all part2 results" on public.part2_results;
create policy "Admins read all part2 results"
  on public.part2_results for select
  using (
    public.is_super_admin()
    or public.is_assigned_student(user_id)
  );

drop policy if exists "Admins read all part2 history" on public.part2_result_history;
create policy "Admins read all part2 history"
  on public.part2_result_history for select
  using (
    public.is_super_admin()
    or public.is_assigned_student(user_id)
  );

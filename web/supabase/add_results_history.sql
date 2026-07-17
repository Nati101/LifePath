-- Results history: keep past assessment attempts when students retake
-- Run this in Supabase SQL Editor

-- Part 1 history
create table if not exists public.assessment_result_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  path_scores jsonb not null,
  top_paths jsonb not null,
  construct_scores jsonb,
  section_scores jsonb not null,
  completed_at timestamptz not null default now(),
  archived_at timestamptz not null default now()
);

create index if not exists assessment_result_history_user_completed_idx
  on public.assessment_result_history (user_id, completed_at desc);

alter table public.assessment_result_history enable row level security;

drop policy if exists "Users read own assessment history" on public.assessment_result_history;
create policy "Users read own assessment history"
  on public.assessment_result_history for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own assessment history" on public.assessment_result_history;
create policy "Users insert own assessment history"
  on public.assessment_result_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins read all assessment history" on public.assessment_result_history;
create policy "Admins read all assessment history"
  on public.assessment_result_history for select
  using (public.is_admin());

-- Part 2 history
create table if not exists public.part2_result_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  route_scores jsonb not null,
  top_routes jsonb not null,
  factor_scores jsonb not null,
  action_readiness int,
  action_readiness_level text,
  completed_at timestamptz not null default now(),
  archived_at timestamptz not null default now()
);

create index if not exists part2_result_history_user_completed_idx
  on public.part2_result_history (user_id, completed_at desc);

alter table public.part2_result_history enable row level security;

drop policy if exists "Users read own part2 history" on public.part2_result_history;
create policy "Users read own part2 history"
  on public.part2_result_history for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own part2 history" on public.part2_result_history;
create policy "Users insert own part2 history"
  on public.part2_result_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins read all part2 history" on public.part2_result_history;
create policy "Admins read all part2 history"
  on public.part2_result_history for select
  using (public.is_admin());

-- Allow students to delete current results after archiving (used by section reset)
drop policy if exists "Users delete own results" on public.results;
create policy "Users delete own results"
  on public.results for delete
  using (auth.uid() = user_id);

drop policy if exists "Users delete own part2 results" on public.part2_results;
create policy "Users delete own part2 results"
  on public.part2_results for delete
  using (auth.uid() = user_id);

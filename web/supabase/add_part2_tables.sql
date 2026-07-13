-- Part 2: My Path After High School
-- Add tables and functions for post-secondary pathway assessment

-- Create section type for Part 2
do $$ begin
  create type part2_section_key as enum ('school_setup', 'training_style', 'life_factors', 'exploration');
exception when duplicate_object then null;
end $$;

-- Part 2 assessment sessions
create table if not exists public.part2_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  current_section part2_section_key not null default 'school_setup',
  current_index int not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.part2_sessions enable row level security;

-- Part 2 responses
create table if not exists public.part2_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.part2_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id text not null,
  section part2_section_key not null,
  rating int not null check (rating between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, item_id)
);

alter table public.part2_responses enable row level security;

-- Part 2 results
create table if not exists public.part2_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.part2_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  route_scores jsonb not null,
  top_routes jsonb not null,
  factor_scores jsonb not null,
  action_readiness int,
  action_readiness_level text,
  computed_at timestamptz not null default now(),
  unique (session_id)
);

alter table public.part2_results enable row level security;

-- RLS Policies for Part 2 Sessions
drop policy if exists "Users read own part2 sessions" on public.part2_sessions;
create policy "Users read own part2 sessions"
  on public.part2_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own part2 sessions" on public.part2_sessions;
create policy "Users insert own part2 sessions"
  on public.part2_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own part2 sessions" on public.part2_sessions;
create policy "Users update own part2 sessions"
  on public.part2_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own part2 sessions" on public.part2_sessions;
create policy "Users delete own part2 sessions"
  on public.part2_sessions for delete
  using (auth.uid() = user_id);

drop policy if exists "Admins read all part2 sessions" on public.part2_sessions;
create policy "Admins read all part2 sessions"
  on public.part2_sessions for select
  using (public.is_admin());

-- RLS Policies for Part 2 Responses
drop policy if exists "Users read own part2 responses" on public.part2_responses;
create policy "Users read own part2 responses"
  on public.part2_responses for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own part2 responses" on public.part2_responses;
create policy "Users insert own part2 responses"
  on public.part2_responses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own part2 responses" on public.part2_responses;
create policy "Users update own part2 responses"
  on public.part2_responses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own part2 responses" on public.part2_responses;
create policy "Users delete own part2 responses"
  on public.part2_responses for delete
  using (auth.uid() = user_id);

drop policy if exists "Admins read all part2 responses" on public.part2_responses;
create policy "Admins read all part2 responses"
  on public.part2_responses for select
  using (public.is_admin());

-- RLS Policies for Part 2 Results
drop policy if exists "Users read own part2 results" on public.part2_results;
create policy "Users read own part2 results"
  on public.part2_results for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own part2 results" on public.part2_results;
create policy "Users insert own part2 results"
  on public.part2_results for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own part2 results" on public.part2_results;
create policy "Users update own part2 results"
  on public.part2_results for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins read all part2 results" on public.part2_results;
create policy "Admins read all part2 results"
  on public.part2_results for select
  using (public.is_admin());

-- Triggers for updated_at
drop trigger if exists part2_sessions_updated_at on public.part2_sessions;
create trigger part2_sessions_updated_at before update on public.part2_sessions
  for each row execute procedure public.set_updated_at();

drop trigger if exists part2_responses_updated_at on public.part2_responses;
create trigger part2_responses_updated_at before update on public.part2_responses
  for each row execute procedure public.set_updated_at();

-- Allow students to delete their own results when retaking assessments
-- Run this in Supabase SQL Editor if retake fails to clear old results

drop policy if exists "Users delete own results" on public.results;
create policy "Users delete own results"
  on public.results for delete
  using (auth.uid() = user_id);

drop policy if exists "Users delete own part2 results" on public.part2_results;
create policy "Users delete own part2 results"
  on public.part2_results for delete
  using (auth.uid() = user_id);

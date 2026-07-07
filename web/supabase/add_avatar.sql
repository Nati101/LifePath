-- Run this in Supabase → SQL Editor if profile emoji / account saves fail
-- Safe to run more than once

-- 1. Add profile picture column
alter table public.profiles
  add column if not exists avatar_emoji text default '😊';

-- 2. Backfill existing users who have no emoji yet
update public.profiles
set avatar_emoji = '😊'
where avatar_emoji is null;

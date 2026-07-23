-- Verify super-admin privilege lock is applied.
-- Run in Supabase SQL Editor after lock_profile_privileges.sql.

-- 1) Helper functions exist and treat super admins as admins
select
  p.proname as function_name,
  pg_get_functiondef(p.oid) like '%is_super_admin%' as mentions_super_admin
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_admin', 'is_super_admin', 'protect_profile_privileges');

-- 2) Privilege trigger on profiles
select tgname, tgenabled
from pg_trigger
where tgrelid = 'public.profiles'::regclass
  and not tgisinternal
  and tgname = 'protect_profile_privileges';

-- 3) Schools policies (expect Super admins can manage schools; not Admins manage schools)
select polname, polcmd
from pg_policy
where polrelid = 'public.schools'::regclass
order by polname;

-- 4) Current super admins
select email, full_name, role, is_super_admin
from public.profiles
where is_super_admin = true
order by email;

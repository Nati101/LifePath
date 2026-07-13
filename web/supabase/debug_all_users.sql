-- Comprehensive Debug Query
-- Run this in Supabase SQL Editor to see ALL users and their roles

-- 1. Show all profiles
SELECT 
  id,
  email,
  full_name,
  role,
  is_super_admin,
  school_name,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

-- 2. Show all auth users (to cross-reference)
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 3. Try to update by email again (in case it didn't work)
UPDATE public.profiles
SET 
  role = 'admin',
  is_super_admin = true
WHERE email = 'bekele.natnael11@gmail.com';

-- 4. Check again after update
SELECT 
  id,
  email,
  full_name,
  role,
  is_super_admin
FROM public.profiles
WHERE email = 'bekele.natnael11@gmail.com';

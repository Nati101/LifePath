-- Corrected query to check all users
-- Run this in Supabase SQL Editor

-- Show all profiles with their roles
SELECT 
  id,
  email,
  full_name,
  role,
  is_super_admin,
  advisor_id,
  school_id,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

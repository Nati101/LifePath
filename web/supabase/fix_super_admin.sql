-- Fix Super Admin Role
-- Run this in your Supabase SQL Editor

-- Step 1: Check current user (to verify we're updating the right one)
SELECT id, email, role, is_super_admin, full_name
FROM public.profiles
WHERE email = 'bekele.natnael11@gmail.com';

-- Step 2: Update the user to be a super admin
UPDATE public.profiles
SET 
  role = 'admin',
  is_super_admin = true
WHERE email = 'bekele.natnael11@gmail.com';

-- Step 3: Verify the update worked
SELECT id, email, role, is_super_admin, full_name
FROM public.profiles
WHERE email = 'bekele.natnael11@gmail.com';

-- Expected result after Step 3:
-- role should be 'admin'
-- is_super_admin should be true

-- Add school_name column to profiles table
-- This migration updates the profile structure to store school information directly

-- Add school_name column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS school_name TEXT;

-- Update any existing profiles that have a school_id but no school_name
UPDATE public.profiles p
SET school_name = s.name
FROM public.schools s
WHERE p.school_id = s.id 
  AND p.school_name IS NULL;

-- Note: class_id and class_name columns are kept for backwards compatibility
-- but are no longer actively used in the application

-- Add super_admin flag to profiles table
-- This allows designated users to manage other admins and schools

-- Add is_super_admin column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false;

-- Create helper function for super admin check
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_super_admin = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- Add RLS policies for super admin management
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
CREATE POLICY "Super admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can manage schools" ON public.schools;
CREATE POLICY "Super admins can manage schools"
  ON public.schools FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- NOTE: To create your first super admin, run:
-- UPDATE public.profiles SET is_super_admin = true WHERE email = 'your-email@example.com';

COMMENT ON COLUMN public.profiles.is_super_admin IS 'Super admins can manage advisors, schools, and other users';

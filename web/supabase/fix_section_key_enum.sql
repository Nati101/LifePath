-- Fix: allow new Career Paths section keys
-- The app now uses clinical_care, protection, etc. instead of interests/strengths/drivers/conditions
-- Run this in Supabase SQL Editor

-- Convert enum columns to text so new section keys work
ALTER TABLE public.assessment_sessions
  ALTER COLUMN current_section DROP DEFAULT;

ALTER TABLE public.assessment_sessions
  ALTER COLUMN current_section TYPE text
  USING current_section::text;

ALTER TABLE public.responses
  ALTER COLUMN section TYPE text
  USING section::text;

-- Set new default for fresh sessions
ALTER TABLE public.assessment_sessions
  ALTER COLUMN current_section SET DEFAULT 'clinical_care';

-- Optional: map any leftover old section names on active sessions to the first new section
UPDATE public.assessment_sessions
SET current_section = 'clinical_care'
WHERE current_section IN ('interests', 'strengths', 'drivers', 'conditions');

-- Keep a check constraint so only known section keys are stored going forward
ALTER TABLE public.assessment_sessions
  DROP CONSTRAINT IF EXISTS assessment_sessions_current_section_check;

ALTER TABLE public.assessment_sessions
  ADD CONSTRAINT assessment_sessions_current_section_check
  CHECK (
    current_section IN (
      'clinical_care',
      'protection',
      'learning_support',
      'build_fix',
      'stem_systems',
      'business_leadership',
      'creative',
      'experience_service',
      'outdoor_systems',
      -- keep old values readable if any legacy rows remain
      'interests',
      'strengths',
      'drivers',
      'conditions'
    )
  );

ALTER TABLE public.responses
  DROP CONSTRAINT IF EXISTS responses_section_check;

ALTER TABLE public.responses
  ADD CONSTRAINT responses_section_check
  CHECK (
    section IN (
      'clinical_care',
      'protection',
      'learning_support',
      'build_fix',
      'stem_systems',
      'business_leadership',
      'creative',
      'experience_service',
      'outdoor_systems',
      'interests',
      'strengths',
      'drivers',
      'conditions'
    )
  );

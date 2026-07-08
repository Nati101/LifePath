# School Filtering Migration Guide

## Overview

This migration adds school-based filtering to the LifePath Assessment application. The key changes are:

1. **Schools Table**: A new `schools` table to manage different schools
2. **School Associations**: Both `classes` and `profiles` (advisors) are now associated with schools
3. **Filtered Class Selection**: Students only see classes from their advisor's school
4. **Automatic Updates**: When a student changes their advisor, the available classes automatically update

## Database Migration

### Step 1: Run the SQL Migration

Execute the `add_schools.sql` file in your Supabase SQL Editor:

```bash
# The file is located at: web/supabase/add_schools.sql
```

This will:
- Create the `schools` table
- Add `school_id` column to `classes` table
- Add `school_id` column to `profiles` table
- Update the `list_advisors()` function to include school information
- Create a new `list_classes_by_school()` function
- Seed a default school for testing

### Step 2: Assign Schools to Advisors

After running the migration, you need to assign schools to your advisors:

```sql
-- Example: Assign advisors to schools
UPDATE public.profiles 
SET school_id = (SELECT id FROM public.schools WHERE name = 'Default School')
WHERE role = 'admin' AND school_id IS NULL;
```

### Step 3: Assign Schools to Classes

Assign existing classes to appropriate schools:

```sql
-- Example: Assign all classes to the default school
UPDATE public.classes 
SET school_id = (SELECT id FROM public.schools WHERE name = 'Default School')
WHERE school_id IS NULL;
```

### Step 4: Create Additional Schools (Optional)

If you have multiple schools, create them:

```sql
INSERT INTO public.schools (name) VALUES
  ('Lincoln High School'),
  ('Washington Middle School'),
  ('Jefferson Elementary')
ON CONFLICT (name) DO NOTHING;
```

## Application Changes

### Frontend Changes

1. **Updated Types** (`lib/account/options.ts`):
   - Added `AdvisorOption` interface with `schoolId` field
   - Extended `AccountOptions` to use the new advisor type

2. **Updated Account Options** (`lib/account/getAccountOptions.ts`):
   - Now accepts a `userId` parameter
   - Filters classes based on the user's advisor's school
   - Returns advisors with their school information

3. **Enhanced Account Form** (`components/AccountForm.tsx`):
   - Dynamically updates available classes when advisor selection changes
   - Shows helpful messages when no classes are available for a school
   - Clears class selection if it becomes invalid after advisor change

4. **Updated Profile Type** (`lib/types.ts`):
   - Added `school_id` field to the `Profile` interface

## User Experience

### For Students

1. **Select an Advisor First**: Students should select their advisor before choosing a class
2. **Filtered Classes**: Only classes from the advisor's school will be shown
3. **Dynamic Updates**: Changing advisors will update the available classes immediately
4. **Clear Feedback**: Helpful messages explain when classes aren't available

### For Advisors/Admins

1. **School Assignment**: Admins should be assigned to a school via database or future admin UI
2. **Class Management**: Classes should be assigned to schools to appear for students
3. **Consistency**: All students with the same advisor will see the same class options

## Testing

### Test Scenarios

1. **Student with no advisor**: Should see all classes or a message about setting up classes
2. **Student with advisor (no school)**: Should see all classes
3. **Student with advisor (has school)**: Should only see classes from that school
4. **Changing advisor**: Classes should update automatically, invalid selections should clear
5. **Multiple schools**: Students from different schools should see different classes

### Test Queries

```sql
-- Check advisor schools
SELECT id, email, full_name, role, school_id 
FROM public.profiles 
WHERE role = 'admin';

-- Check class schools
SELECT id, name, school_id 
FROM public.classes;

-- Check student assignments
SELECT p.email, p.full_name, 
       a.full_name as advisor_name,
       a.school_id as advisor_school,
       c.name as class_name,
       c.school_id as class_school
FROM public.profiles p
LEFT JOIN public.profiles a ON p.advisor_id = a.id
LEFT JOIN public.classes c ON p.class_id = c.id
WHERE p.role = 'student';
```

## Rollback

If you need to rollback these changes:

```sql
-- Remove school columns (this will lose school assignment data)
ALTER TABLE public.classes DROP COLUMN IF EXISTS school_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS school_id;

-- Drop schools table
DROP TABLE IF EXISTS public.schools CASCADE;

-- Restore original list_advisors function
CREATE OR REPLACE FUNCTION public.list_advisors()
RETURNS TABLE (id uuid, full_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT p.id, coalesce(nullif(trim(p.full_name), ''), p.email) as full_name
  FROM public.profiles p
  WHERE p.role = 'admin'
  ORDER BY full_name;
$$;
```

## Future Enhancements

Potential future improvements:

1. **Admin UI for School Management**: Add a UI for admins to create and manage schools
2. **Bulk Assignment Tools**: Create admin tools to bulk-assign advisors and classes to schools
3. **School Selection for Admins**: Add a school selector in the admin account settings
4. **School-based Reporting**: Filter admin dashboards by school
5. **Multi-school Support**: Allow advisors to be associated with multiple schools

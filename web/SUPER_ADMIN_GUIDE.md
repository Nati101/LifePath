# Super Admin Setup Guide

This guide explains how to set up and use the Super Admin Management interface in LifePath.

## Overview

The Super Admin Management interface allows designated administrators to:
- ✅ Create new advisor accounts
- ✅ Promote/demote users between student and advisor roles
- ✅ Assign advisors and students to schools
- ✅ Create and manage schools
- ✅ View all users in the system

## Initial Setup

### Step 1: Create Your First Super Admin

After deploying the database migrations, you need to designate at least one user as a super admin.

**Option A: Promote an existing user**

1. Go to your Supabase Dashboard → SQL Editor
2. Run this query (replace with the actual email):

```sql
UPDATE public.profiles 
SET is_super_admin = true 
WHERE email = 'your-admin-email@school.edu';
```

**Option B: Create a new super admin from scratch**

1. Have the person register normally at `/register`
2. Then run the SQL above to promote them

### Step 2: Run the Super Admin Migration

In your Supabase SQL Editor, run the migration file:

```bash
web/supabase/add_super_admin.sql
```

This adds:
- `is_super_admin` column to profiles
- `is_super_admin()` function for RLS
- RLS policies for super admin access

### Step 3: Verify Access

1. Log in with the super admin account
2. Navigate to `/admin`
3. You should see a **"⚙️ Super Admin Management"** button
4. Click it to access `/admin/manage`

## Using the Super Admin Interface

### Managing Users & Advisors

**Tab: Users & Advisors**

**Create New Advisor:**
1. Click **"+ Create New Advisor"**
2. Fill in:
   - Full Name
   - Email
   - Password (minimum 6 characters)
   - Assign to School (optional)
3. Click **"Create Advisor"**
4. The advisor can now log in with the credentials you provided

**Change User Roles:**
- Use the dropdown in the "Role" column
- Switch between "Student" and "Advisor"
- Super admins cannot have their role changed

**Assign Users to Schools:**
- Use the dropdown in the "School" column
- Select a school or "No school"
- This determines which school appears for advisor filtering

**Filter Users:**
- Search by name or email
- Filter by "All Users", "Advisors Only", or "Students Only"

### Managing Schools

**Tab: Schools**

**Create New School:**
1. Click **"+ Create New School"**
2. Enter the school name (e.g., "Lincoln High School")
3. Click **"Create School"**

**Edit School:**
1. Click **"Edit"** next to the school
2. Update the name
3. Click **"Save"**

**Delete School:**
1. Click **"Delete"** next to the school
2. Confirm the deletion
3. ⚠️ This will unassign all advisors and students from that school

## Workflow: Onboarding a New School

Here's a recommended workflow for onboarding a new school:

### 1. Create the School
```
/admin/manage → Schools tab → + Create New School
```
Example: "Washington Middle School"

### 2. Create Advisors for that School
```
/admin/manage → Users & Advisors tab → + Create New Advisor
```
- Name: Ms. Johnson
- Email: johnson@washington.edu
- Password: (generate a secure password)
- Assign to School: Washington Middle School

### 3. Share Credentials
Send the advisor their login credentials:
- Email: johnson@washington.edu
- Password: (the password you set)
- Login URL: https://yourdomain.com/login

### 4. Advisor Sets Up Their Profile
The advisor can now:
- Log in and update their profile
- View their assigned school
- Access the admin dashboard to see their students

### 5. Students Register and Select Advisor
Students can:
- Register at `/register`
- Go to `/account` settings
- Select "Ms. Johnson" as their advisor
- The school will automatically filter to "Washington Middle School"

## Security Features

### Role-Based Access Control

- **Super Admins**: Full access to user management and system administration
- **Regular Admins (Advisors)**: Can view student progress but cannot manage users
- **Students**: Can only view their own data

### RLS Policies

The system uses Supabase Row Level Security to enforce:
- Super admins can read/write all profiles and schools
- Regular admins can only read profiles (for student dashboard)
- Students can only read/write their own profile

### Password Requirements

- Minimum 6 characters (enforced by Supabase Auth)
- Passwords are hashed and never stored in plain text
- Advisors should change their password after first login

## Troubleshooting

### "Access Denied" when accessing /admin/manage

**Solution:** Verify the user is a super admin:
```sql
SELECT email, is_super_admin 
FROM public.profiles 
WHERE email = 'your-email@school.edu';
```

If `is_super_admin` is `false`, run:
```sql
UPDATE public.profiles 
SET is_super_admin = true 
WHERE email = 'your-email@school.edu';
```

### Created advisor can't log in

**Possible causes:**
1. Email not confirmed - check Supabase Auth → Users
2. Password too short (< 6 characters)
3. Email already exists in system

### School assignment not working

**Check:**
1. School exists in `public.schools` table
2. Advisor has `school_id` set in their profile
3. RLS policies are properly configured

## Best Practices

1. **Limit Super Admins**: Only designate trusted administrators as super admins
2. **Use Strong Passwords**: Generate secure passwords for new advisors
3. **Document Assignments**: Keep a record of which advisors are at which schools
4. **Regular Audits**: Periodically review user roles and school assignments
5. **Communication**: Inform advisors when you create their accounts

## SQL Queries for Common Tasks

### List all super admins
```sql
SELECT email, full_name, is_super_admin 
FROM public.profiles 
WHERE is_super_admin = true;
```

### List all advisors with their schools
```sql
SELECT 
  p.full_name,
  p.email,
  s.name as school_name
FROM public.profiles p
LEFT JOIN public.schools s ON p.school_id = s.id
WHERE p.role = 'admin'
ORDER BY p.full_name;
```

### Count users by role
```sql
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles
GROUP BY role;
```

### Find users without a school
```sql
SELECT email, full_name, role
FROM public.profiles
WHERE school_id IS NULL AND role = 'admin';
```

## Support

For additional help:
1. Check the Supabase dashboard for user data
2. Review RLS policies in Table Editor → policies
3. Check server logs for error messages
4. Verify all migrations have been run successfully

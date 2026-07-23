# Super Admin Setup Guide

This guide explains how to set up and use the **Manage** page in LifePath (`/admin/manage`).

## Overview

The Manage page lets designated super admins:

- Promote existing users to advisor (they must register first)
- Demote advisors back to students
- Grant or revoke super admin access
- Assign users to schools
- Create, rename, and delete schools
- Search and filter all accounts

It does **not** create login credentials. Advisors sign up normally, then you promote them by email.

## Initial Setup

### 1. Run migrations (Supabase SQL Editor)

Run in this order for a complete install:

1. `web/supabase/schema.sql` (if starting fresh)
2. `web/supabase/add_schools.sql` (schools table + `school_id` on profiles)
3. `web/supabase/add_super_admin.sql` (`is_super_admin` column, helpers, RLS)
4. **`web/supabase/lock_profile_privileges.sql`** (required — locks roles / super-admin flag, restricts school CRUD to super admins)
5. Recommended: `web/supabase/restrict_advisor_student_access.sql` (advisors only see assigned students)

Then verify:

```text
web/supabase/verify_super_admin.sql
```

**Do not re-run `fix_rls.sql` after the super-admin migrations** unless you immediately re-run `add_super_admin.sql` and `lock_profile_privileges.sql`. `fix_rls.sql` can reset `is_admin()` to ignore `is_super_admin`.

### 2. Create your first super admin

Have the person register at `/register`, then run:

```sql
UPDATE public.profiles
SET is_super_admin = true, role = 'admin'
WHERE email = 'your-admin-email@school.edu';
```

After the first super admin exists, others can be granted from **Manage → People → Edit → Super admin**.

### 3. Verify access

1. Sign in as that user
2. Open `/admin` — you should see **Manage →**
3. Header nav should show **Manage**
4. Open `/admin/manage`

## Security model

| Layer | What it does |
|-------|----------------|
| Client guard | `useAuthGuard({ superAdmin: true })` redirects non–super-admins away from `/admin/manage` |
| Nav | Manage links only render for `is_super_admin` |
| RLS + privilege trigger | Real enforcement for role / `is_super_admin` / school mutations |

This app is often deployed as a **static export** (GitHub Pages). Next.js middleware is **not** the gate there. Correct Supabase SQL (especially `lock_profile_privileges.sql`) is required for production security.

## Using the interface

### People tab

**Promote advisor**

1. Ask the person to register on LifePath
2. Click **Promote advisor**
3. Enter email, optional display name, and school
4. Click **Make advisor**

**Edit a person**

1. Click **Edit** — a full-width panel opens under their row
2. Update display name, role, school, and/or **Super admin**
3. Confirm destructive changes in the modal (demote / grant / revoke)
4. Demoting an advisor clears students who had that person as `advisor_id`
5. You can’t remove your own super admin access or demote yourself to student

**Filters**

- Search by name or email
- Filter by role and school
- Lists load 50 at a time — use **Show more**

### Schools tab

1. **Add school** in the toolbar
2. Search by name
3. **Edit** opens a full-width rename panel
4. **Delete** uses a confirm modal (Escape to cancel). Profiles at that school are unassigned (`school_id` set null)

## Recommended onboarding workflow

1. **Schools** → add the school  
2. Advisor **registers** at `/register`  
3. **People** → Promote advisor + assign school  
4. They sign in at `/login` with the password they chose  
5. Students register and pick that advisor on Account / Welcome  

## Troubleshooting

### Access denied on `/admin/manage`

```sql
SELECT email, role, is_super_admin
FROM public.profiles
WHERE email = 'your-email@school.edu';
```

If `is_super_admin` is false, run the UPDATE in step 2. Confirm `lock_profile_privileges.sql` and `verify_super_admin.sql`.

### Promote says “No account with that email”

They must register first. Check Auth → Users and `public.profiles`.

### Advisors can still create/edit schools

Old “Admins manage schools” policy may still exist. Re-run `lock_profile_privileges.sql`, then `verify_super_admin.sql`.

### Super admin checkbox fails

Re-run `lock_profile_privileges.sql` so `is_super_admin` can be changed by existing super admins (not only the SQL editor).

## Useful SQL

```sql
-- List super admins
SELECT email, full_name, role, is_super_admin
FROM public.profiles
WHERE is_super_admin = true;

-- Advisors with schools
SELECT p.full_name, p.email, s.name AS school_name
FROM public.profiles p
LEFT JOIN public.schools s ON p.school_id = s.id
WHERE p.role = 'admin'
ORDER BY p.full_name;

-- Advisors missing a school
SELECT email, full_name
FROM public.profiles
WHERE role = 'admin' AND school_id IS NULL;
```

## Best practices

1. Keep the super-admin set small  
2. Prefer promote-after-register  
3. Assign schools when promoting  
4. Periodically review advisors and school assignments  
5. Re-run `lock_profile_privileges.sql` after restoring an old database dump  

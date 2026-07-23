# Super Admin Setup Guide

This guide explains how to set up and use the **Manage** page in LifePath (`/admin/manage`).

## Overview

The Manage page lets designated super admins:

- Promote existing users to advisor (they must register first)
- Demote advisors back to students
- Assign users to schools
- Create, rename, and delete schools
- Search and filter all accounts

It does **not** create login credentials. Advisors sign up normally, then you promote them by email.

## Initial Setup

### 1. Run migrations (Supabase SQL Editor)

Run in order:

1. `web/supabase/schema.sql` (if starting fresh)
2. `web/supabase/add_super_admin.sql`
3. **`web/supabase/lock_profile_privileges.sql`** (required — locks roles, blocks self-promotion, restricts school CRUD to super admins)

### 2. Create your first super admin

Have the person register at `/register`, then run:

```sql
UPDATE public.profiles
SET is_super_admin = true, role = 'admin'
WHERE email = 'your-admin-email@school.edu';
```

`is_super_admin` can be set in SQL (bootstrap) or by an existing super admin via **Manage → People → Edit**.

### 3. Verify access

1. Sign in as that user
2. Open `/admin` — you should see **Manage →**
3. Header nav should show **Manage**
4. Open `/admin/manage`

## Using the interface

### People tab

**Promote advisor**

1. Ask the person to register on LifePath (student signup is fine)
2. Click **Promote advisor** in the toolbar
3. Enter their email, optional display name, and school
4. Click **Make advisor**

**Edit a person**

1. Click **Edit** on their row
2. Change role and/or school, then **Save**
3. Check **Super admin** to grant full Manage access (requires re-running `lock_profile_privileges.sql` if that migration is older)
4. Demoting an advisor asks for confirmation and clears students who had that person as advisor
5. You can’t remove your own super admin access from the app

**Filters**

- Search by name or email
- Filter by role (All / Advisors / Students)
- Filter by school (including “No school”)
- Large lists load 50 at a time — use **Show more**

### Schools tab

1. **Add school** in the toolbar to create
2. Search schools by name
3. **Edit** to rename
4. **Delete** confirms first — profiles at that school are unassigned (`school_id` set null)

## Recommended onboarding workflow

1. **Schools** → add the school  
2. Have the advisor **register** at `/register`  
3. **People** → Promote advisor with their email and school  
4. Tell them to sign in at `/login` (they use the password they chose at registration)  
5. Students register, then pick that advisor on Account / Welcome

## Security

| Role | Access |
|------|--------|
| Super admin | Dashboard + Manage (users & schools) |
| Advisor (`role = admin`) | Dashboard for assigned students only |
| Student | Own assessment data only |

Enforcement:

- Client guard on `/admin/manage` (`is_super_admin`)
- RLS: super admins can manage profiles/schools
- Trigger: only super admins change `role` and `is_super_admin` (bootstrap still via SQL)
- Static GitHub Pages hosting does not run Next.js middleware — **RLS + privilege lock are the real gate**

## Troubleshooting

### Access denied on `/admin/manage`

```sql
SELECT email, role, is_super_admin
FROM public.profiles
WHERE email = 'your-email@school.edu';
```

If `is_super_admin` is false, run the UPDATE in step 2 above. Confirm `lock_profile_privileges.sql` has been applied.

### Promote says “No account with that email”

They must register first. Check Auth → Users and `public.profiles`.

### Advisors can still create/edit schools

The old “Admins manage schools” policy is still active. Re-run `lock_profile_privileges.sql`.

### Role change fails with “Only super admins…”

Expected if a non–super-admin client tries to change roles. Confirm your account has `is_super_admin = true`.

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
2. Prefer promote-after-register over sharing temporary passwords  
3. Assign schools when promoting  
4. Periodically review advisors and school assignments  
5. Re-run `lock_profile_privileges.sql` after restoring an old database dump

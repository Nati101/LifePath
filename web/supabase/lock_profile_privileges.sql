-- Lock profile privilege columns so clients cannot self-promote.
-- Run in Supabase SQL Editor after add_super_admin.sql.
-- Required for production: without this, privilege hardening and school policies may be incomplete.

-- Treat super admins as admins for shared admin policies
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (role = 'admin' or is_super_admin = true)
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- Signup always creates a student (ignore metadata role)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, is_super_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'student',
    false
  )
  on conflict (id) do nothing;
  return new;
exception
  when undefined_column then
    -- is_super_admin column may not exist on very old DBs
    insert into public.profiles (id, email, full_name, role)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', ''),
      'student'
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.role := 'student';
    begin
      new.is_super_admin := false;
    exception
      when undefined_column then
        null;
    end;
    return new;
  end if;

  -- UPDATE: role changes only by super admins
  if new.role is distinct from old.role then
    if auth.uid() is null then
      -- SQL editor / service role
      null;
    elsif not public.is_super_admin() then
      raise exception 'Only super admins can change user roles';
    end if;
  end if;

  -- is_super_admin: SQL editor OR an existing super admin
  begin
    if new.is_super_admin is distinct from old.is_super_admin then
      if auth.uid() is null then
        null; -- SQL editor / service role
      elsif not public.is_super_admin() then
        raise exception 'Only super admins can change is_super_admin';
      end if;
    end if;
  exception
    when undefined_column then
      null;
  end;

  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before insert or update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- Schools: ensure only super admins can mutate (overrides older is_admin policies)
drop policy if exists "Admins manage schools" on public.schools;
drop policy if exists "Super admins can manage schools" on public.schools;
create policy "Super admins can manage schools"
  on public.schools for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

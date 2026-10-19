-- Apply in the Supabase SQL editor as the database owner before using role management.
-- This extends the existing Attendly schema; it is not a fresh database bootstrap.
begin;

-- Keep RLS helpers out of the Data API's exposed public schema. Each helper uses
-- the caller's auth.uid(), even though its role-table lookup bypasses recursive RLS.
create schema if not exists attendly_private;
revoke all on schema attendly_private from public, anon;
grant usage on schema attendly_private to authenticated;

create or replace function attendly_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.app_admins a where a.user_id = auth.uid()
  );
$$;

create or replace function attendly_private.can_access_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    attendly_private.is_admin()
    or exists (
      select 1 from public.class_officers o
      where o.class_id = p_class_id
        and o.user_id = auth.uid()
        and o.role in ('president', 'secretary')
    )
  );
$$;

create or replace function attendly_private.can_access_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    attendly_private.is_admin()
    or exists (
      select 1 from public.class_enrollments e
      where e.student_id = p_student_id
        and attendly_private.can_access_class(e.class_id)
    )
  );
$$;

create or replace function attendly_private.can_access_attendance_record(p_class_id uuid, p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.attendance_sessions s
    where s.id = p_session_id
      and s.class_id = p_class_id
      and attendly_private.can_access_class(s.class_id)
  );
$$;

create or replace function attendly_private.can_write_attendance_record(
  p_class_id uuid, p_session_id uuid, p_student_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select attendly_private.can_access_attendance_record(p_class_id, p_session_id)
    and exists (
      select 1 from public.class_enrollments e
      where e.class_id = p_class_id and e.student_id = p_student_id
    );
$$;

revoke all on function attendly_private.is_admin() from public, anon;
revoke all on function attendly_private.can_access_class(uuid) from public, anon;
revoke all on function attendly_private.can_access_student(uuid) from public, anon;
revoke all on function attendly_private.can_access_attendance_record(uuid, uuid) from public, anon;
revoke all on function attendly_private.can_write_attendance_record(uuid, uuid, uuid) from public, anon;
grant execute on function attendly_private.is_admin() to authenticated;
grant execute on function attendly_private.can_access_class(uuid) to authenticated;
grant execute on function attendly_private.can_access_student(uuid) to authenticated;
grant execute on function attendly_private.can_access_attendance_record(uuid, uuid) to authenticated;
grant execute on function attendly_private.can_write_attendance_record(uuid, uuid, uuid) to authenticated;

-- Assignments are changed in one transaction using the signed-in administrator's
-- session, never a browser-supplied actor ID or an elevated application client.
create or replace function public.set_class_user_role(
  p_user_id uuid,
  p_class_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;

  -- Serialize role changes before checking membership. Two administrators cannot
  -- concurrently demote each other and leave the application without an admin.
  perform pg_catalog.pg_advisory_xact_lock(20261019, 1);

  if not exists (
    select 1 from public.app_admins a where a.user_id = v_actor_id
  ) then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;

  if p_user_id = v_actor_id then
    raise exception 'You cannot change your own role.' using errcode = '42501';
  end if;

  if p_role is null or p_role not in ('admin', 'president', 'secretary', 'student') then
    raise exception 'Invalid account role.' using errcode = '22023';
  end if;

  if not exists (select 1 from public.classes c where c.id = p_class_id) then
    raise exception 'Class not found.' using errcode = 'P0002';
  end if;

  if not exists (select 1 from auth.users u where u.id = p_user_id) then
    raise exception 'Account not found.' using errcode = 'P0002';
  end if;

  -- Some older Auth accounts may predate the profile-creation trigger.
  insert into public.profiles (id) values (p_user_id) on conflict (id) do nothing;

  delete from public.class_officers
  where user_id = p_user_id and class_id = p_class_id;

  if p_role = 'admin' then
    insert into public.app_admins (user_id) values (p_user_id)
    on conflict (user_id) do nothing;
  else
    delete from public.app_admins where user_id = p_user_id;

    if p_role in ('president', 'secretary') then
      insert into public.class_officers (class_id, user_id, role)
      values (p_class_id, p_user_id, p_role);
    end if;
  end if;
end;
$$;

revoke all on function public.set_class_user_role(uuid, uuid, text) from public, anon;
grant execute on function public.set_class_user_role(uuid, uuid, text) to authenticated;

-- RLS alone cannot ensure atomic role changes or protect against an accidentally
-- permissive role-table mutation policy. Signed-in clients must use the RPC.
revoke insert, update, delete, truncate, references, trigger
  on public.app_admins, public.class_officers from public, anon, authenticated;
grant select on public.app_admins, public.class_officers to authenticated;

-- These privileges bypass row policies or allow schema changes; application
-- users only need the existing SELECT/INSERT/UPDATE/DELETE grants with RLS.
revoke truncate, references, trigger
  on public.classes, public.students, public.class_enrollments, public.subjects,
     public.attendance_sessions, public.attendance_records
  from public, anon, authenticated;

-- Existing permissive policies remain in place. Restrictive policies only narrow
-- their scope, so this migration cannot grant broader attendance write access.
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.class_enrollments enable row level security;
alter table public.subjects enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;

do $$
declare
  v_table text;
  v_read_predicate text;
  v_write_predicate text;
begin
  foreach v_table in array array[
    'classes', 'students', 'class_enrollments', 'subjects',
    'attendance_sessions', 'attendance_records'
  ] loop
    if v_table = 'classes' then
      v_read_predicate := 'attendly_private.can_access_class(id)';
    elsif v_table = 'students' then
      v_read_predicate := 'attendly_private.can_access_student(id)';
    elsif v_table = 'attendance_records' then
      v_read_predicate := 'attendly_private.can_access_attendance_record(class_id, session_id)';
    else
      v_read_predicate := 'attendly_private.can_access_class(class_id)';
    end if;

    if v_table = 'attendance_records' then
      v_write_predicate := 'attendly_private.can_write_attendance_record(class_id, session_id, student_id)';
    elsif v_table = 'attendance_sessions' then
      v_write_predicate := 'attendly_private.can_access_class(class_id)';
    else
      v_write_predicate := '(select attendly_private.is_admin())';
    end if;

    execute pg_catalog.format(
      'drop policy if exists attendly_block_anon on public.%I', v_table
    );
    execute pg_catalog.format(
      'create policy attendly_block_anon on public.%I as restrictive for all to anon using (false) with check (false)',
      v_table
    );

    execute pg_catalog.format(
      'drop policy if exists attendly_role_select on public.%I', v_table
    );
    execute pg_catalog.format(
      'create policy attendly_role_select on public.%I as restrictive for select to authenticated using (%s)',
      v_table, v_read_predicate
    );

    execute pg_catalog.format(
      'drop policy if exists attendly_role_insert on public.%I', v_table
    );
    execute pg_catalog.format(
      'create policy attendly_role_insert on public.%I as restrictive for insert to authenticated with check (%s)',
      v_table, v_write_predicate
    );

    execute pg_catalog.format(
      'drop policy if exists attendly_role_update on public.%I', v_table
    );
    execute pg_catalog.format(
      'create policy attendly_role_update on public.%I as restrictive for update to authenticated using (%s) with check (%s)',
      v_table, v_write_predicate, v_write_predicate
    );

    execute pg_catalog.format(
      'drop policy if exists attendly_role_delete on public.%I', v_table
    );
    execute pg_catalog.format(
      'create policy attendly_role_delete on public.%I as restrictive for delete to authenticated using ((select attendly_private.is_admin()))',
      v_table
    );
  end loop;
end;
$$;

commit;

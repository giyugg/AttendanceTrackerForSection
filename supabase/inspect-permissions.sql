-- Read-only inspection for the existing Attendly Supabase project.
-- Run in Supabase > SQL Editor and share the single JSON result.
-- Contains schema/policy/function definitions only; no account rows or API keys.
select pg_catalog.jsonb_pretty(pg_catalog.jsonb_build_object(
  'tables', (
    select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'schema', n.nspname,
      'table', c.relname,
      'rls_enabled', c.relrowsecurity,
      'rls_forced', c.relforcerowsecurity
    ) order by c.relname), '[]'::jsonb)
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relname in (
        'profiles', 'app_admins', 'class_officers', 'classes', 'students',
        'class_enrollments', 'subjects', 'attendance_sessions', 'attendance_records'
      )
  ),
  'policies', (
    select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(p) order by p.tablename, p.policyname), '[]'::jsonb)
    from pg_catalog.pg_policies p
    where p.schemaname = 'public'
  ),
  'table_grants', (
    select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(g) order by g.table_name, g.grantee, g.privilege_type), '[]'::jsonb)
    from information_schema.role_table_grants g
    where g.table_schema = 'public'
      and g.grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')
  ),
  'functions', (
    select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'name', p.proname,
      'signature', p.oid::regprocedure::text,
      'security_definer', p.prosecdef,
      'settings', p.proconfig,
      'grants', p.proacl,
      'definition', pg_catalog.pg_get_functiondef(p.oid)
    ) order by p.proname, p.oid), '[]'::jsonb)
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and (
        p.proname in (
          'add_g2_student_parts', 'delete_g2_student', 'delete_g2_subject',
          'delete_g2_attendance_session', 'set_class_user_role'
        )
        or p.proname like '%admin%'
        or p.proname like '%officer%'
        or p.proname like 'add_g2_student%'
        or exists (
          select 1
          from pg_catalog.pg_depend d
          join pg_catalog.pg_policy pol on pol.oid = d.objid
          join pg_catalog.pg_class rel on rel.oid = pol.polrelid
          join pg_catalog.pg_namespace rel_ns on rel_ns.oid = rel.relnamespace
          where d.classid = 'pg_catalog.pg_policy'::regclass
            and d.refclassid = 'pg_catalog.pg_proc'::regclass
            and d.refobjid = p.oid
            and rel_ns.nspname = 'public'
        )
      )
  )
)) as attendly_permission_inspection;

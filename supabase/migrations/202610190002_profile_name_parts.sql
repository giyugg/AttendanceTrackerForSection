-- Apply after the role-permissions migration. Existing display names are retained;
-- administrators enter the separate parts through Edit name in the account list.
begin;

alter table public.profiles
  add column if not exists first_name text not null default '',
  add column if not exists middle_initial text not null default '',
  add column if not exists last_name text not null default '';

insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_name_parts_valid'
  ) then
    alter table public.profiles add constraint profiles_name_parts_valid check (
      char_length(first_name) <= 80
      and char_length(last_name) <= 80
      and first_name !~ '[[:cntrl:]]'
      and last_name !~ '[[:cntrl:]]'
      and (middle_initial = '' or middle_initial ~ '^[A-Z]$')
      and char_length(concat_ws(' ',
        nullif(btrim(first_name), ''),
        case when middle_initial <> '' then middle_initial || '.' else null end,
        nullif(btrim(last_name), '')
      )) <= 120
    );
  end if;
end;
$$;

-- Existing profiles.full_name remains a derived compatibility value for older
-- Auth triggers. New forms store the name parts and assemble the displayed name.
notify pgrst, 'reload schema';

commit;

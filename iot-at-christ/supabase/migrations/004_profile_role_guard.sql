-- Prevent privilege escalation via the profiles_update_own RLS policy.
--
-- "profiles_update_own" (migration 001) allows a user to update any column
-- on their own row, including `role`. Without this guard, an authenticated
-- student could call `supabase.from('profiles').update({ role: 'teacher' })`
-- from the browser and grant themselves teacher access.
--
-- Only the admin account (ravesh.ashok.naik@gmail.com) may change a
-- profile's role — this also backs the "Preview as Student" toggle, which
-- lets the admin flip their own row between 'teacher' and 'student'.

create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    if (select email from auth.users where id = auth.uid()) is distinct from 'ravesh.ashok.naik@gmail.com' then
      raise exception 'Only an administrator can change a profile role';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_role_change_guard on public.profiles;

create trigger profiles_role_change_guard
  before update on public.profiles
  for each row
  execute function public.guard_profile_role_change();

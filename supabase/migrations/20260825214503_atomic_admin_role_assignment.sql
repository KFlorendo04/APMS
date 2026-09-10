-- Server-only role assignment used by the protected admin-users Edge Function.
-- Keeping the related user_roles and faculty_profiles changes in one database
-- transaction prevents partially reassigned accounts.
create or replace function public.admin_assign_user_role(
  p_user_id uuid,
  p_role_key text,
  p_department_id uuid default null,
  p_employee_id text default null,
  p_granted_by uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_role_id uuid;
  existing_employee_id text;
begin
  if p_role_key not in ('system_admin', 'academic_admin', 'faculty') then
    raise exception 'Invalid core role';
  end if;
  if p_role_key <> 'system_admin' and p_department_id is null then
    raise exception 'Department scope is required';
  end if;

  select id into strict target_role_id from public.roles where key = p_role_key;
  perform 1 from public.profiles where id = p_user_id for update;
  if not found then raise exception 'Profile not found'; end if;

  if p_role_key = 'faculty' then
    select employee_id into existing_employee_id
    from public.faculty_profiles where profile_id = p_user_id;
    if existing_employee_id is null and nullif(btrim(p_employee_id), '') is null then
      raise exception 'Faculty employee ID is required';
    end if;
    insert into public.faculty_profiles (
      profile_id, department_id, employee_id, position, status
    ) values (
      p_user_id, p_department_id,
      coalesce(nullif(btrim(p_employee_id), ''), existing_employee_id),
      'Instructor', 'active'
    )
    on conflict (profile_id) do update set
      department_id = excluded.department_id,
      employee_id = coalesce(nullif(btrim(p_employee_id), ''), faculty_profiles.employee_id),
      status = 'active',
      updated_at = now();
  else
    update public.faculty_profiles set status = 'inactive', updated_at = now()
    where profile_id = p_user_id and status <> 'inactive';
  end if;

  delete from public.user_roles where user_id = p_user_id;
  insert into public.user_roles (
    user_id, role_id, scope_type, scope_id, granted_by
  ) values (
    p_user_id, target_role_id,
    case when p_role_key = 'system_admin' then 'global' else 'department' end,
    case when p_role_key = 'system_admin' then null else p_department_id end,
    p_granted_by
  );
end;
$$;

revoke all on function public.admin_assign_user_role(uuid, text, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_assign_user_role(uuid, text, uuid, text, uuid) to service_role;

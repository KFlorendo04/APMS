-- Academic Admin may read Faculty identity fields only inside the department
-- encoded in the administrator's active role scope.
create policy profiles_academic_faculty_read
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.faculty_profiles target_faculty
    join public.user_roles admin_scope
      on admin_scope.user_id = (select auth.uid())
     and admin_scope.scope_type = 'department'
     and admin_scope.scope_id = target_faculty.department_id
     and admin_scope.valid_from <= now()
     and (admin_scope.valid_until is null or admin_scope.valid_until > now())
    join public.roles admin_role
      on admin_role.id = admin_scope.role_id
     and admin_role.key = 'academic_admin'
    where target_faculty.profile_id = profiles.id
      and target_faculty.status = 'active'
  )
);

-- Close department-scope and audit gaps identified by the thesis traceability audit.

create or replace function private.can_manage_department(target_department_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and p.key in ('students.manage.department', 'class_records.manage.department', 'events.manage.department')
      and ur.valid_from <= now()
      and (ur.valid_until is null or ur.valid_until > now())
      and (
        ur.scope_type = 'global'
        or (ur.scope_type = 'department' and ur.scope_id = target_department_id)
        or (
          ur.scope_type = 'program'
          and exists (select 1 from public.programs pr where pr.id = ur.scope_id and pr.department_id = target_department_id)
        )
      )
  );
$$;

create or replace function private.can_manage_academic_department(target_department_id uuid, requested_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and p.key = requested_permission
      and ur.valid_from <= now()
      and (ur.valid_until is null or ur.valid_until > now())
      and (
        ur.scope_type = 'global'
        or (ur.scope_type = 'department' and ur.scope_id = target_department_id)
        or (
          ur.scope_type = 'program'
          and exists (select 1 from public.programs pr where pr.id = ur.scope_id and pr.department_id = target_department_id)
        )
        or (
          requested_permission like '%.assigned'
          and exists (
            select 1 from public.faculty_profiles fp
            where fp.profile_id = auth.uid() and fp.department_id = target_department_id and fp.status = 'active'
          )
        )
      )
  );
$$;

drop policy if exists students_department_manage on public.students;
create policy students_department_manage on public.students for all to authenticated
using (
  exists (select 1 from public.programs pr where pr.id = students.program_id and private.can_manage_department(pr.department_id))
)
with check (
  exists (select 1 from public.programs pr where pr.id = students.program_id and private.can_manage_department(pr.department_id))
);

drop policy if exists faculty_scoped_read on public.faculty_profiles;
create policy faculty_scoped_read on public.faculty_profiles for select to authenticated
using (
  profile_id = auth.uid()
  or private.has_permission('users.manage')
  or private.can_manage_academic_department(department_id, 'faculty.read.department')
);

drop policy if exists class_records_scoped_manage on public.class_records;
create policy class_records_scoped_manage on public.class_records for all to authenticated
using (
  private.can_access_class(id)
  and (
    private.can_manage_academic_department(department_id, 'class_records.manage.department')
    or private.can_manage_academic_department(department_id, 'class_records.manage.assigned')
  )
)
with check (
  created_by = auth.uid()
  and (
    private.can_manage_academic_department(department_id, 'class_records.manage.department')
    or private.can_manage_academic_department(department_id, 'class_records.manage.assigned')
  )
);

drop policy if exists guidelines_scoped_manage on public.academic_guidelines;
create policy guidelines_scoped_manage on public.academic_guidelines for all to authenticated
using (
  private.can_manage_academic_department(department_id, 'guidelines.manage.department')
  or private.can_manage_academic_department(department_id, 'guidelines.manage.assigned')
)
with check (
  created_by = auth.uid() and (
    private.can_manage_academic_department(department_id, 'guidelines.manage.department')
    or private.can_manage_academic_department(department_id, 'guidelines.manage.assigned')
  )
);

drop policy if exists templates_scoped_manage on public.class_record_templates;
create policy templates_scoped_manage on public.class_record_templates for all to authenticated
using (
  private.can_manage_academic_department(department_id, 'templates.manage.department')
  or private.can_manage_academic_department(department_id, 'templates.manage.assigned')
)
with check (
  created_by = auth.uid() and (
    private.can_manage_academic_department(department_id, 'templates.manage.department')
    or private.can_manage_academic_department(department_id, 'templates.manage.assigned')
  )
);

drop policy if exists events_department_manage on public.events;
create policy events_department_manage on public.events for all to authenticated
using (private.can_manage_academic_department(department_id, 'events.manage.department'))
with check (created_by = auth.uid() and private.can_manage_academic_department(department_id, 'events.manage.department'));

-- RLS protects rows, while column privileges prevent self-service changes to protected profile fields.
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, phone, avatar_path) on public.profiles to authenticated;

create or replace function private.audit_academic_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare entity_uuid uuid;
begin
  entity_uuid := case when tg_op = 'DELETE' then old.id else new.id end;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, before_data, after_data)
  values (
    auth.uid(),
    lower(tg_table_name) || '.' || lower(tg_op),
    tg_table_name,
    entity_uuid,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'students', 'academic_guidelines', 'class_record_templates', 'class_records',
    'enrollments', 'criteria_sets', 'criteria_nodes', 'assessments', 'assessment_results',
    'grader_submissions', 'performance_evaluations', 'prediction_runs',
    'performance_predictions', 'feedback_records', 'events', 'backups', 'backup_restores'
  ] loop
    execute format('drop trigger if exists audit_academic_mutation on public.%I', table_name);
    execute format(
      'create trigger audit_academic_mutation after insert or update or delete on public.%I for each row execute function private.audit_academic_mutation()',
      table_name
    );
  end loop;
end $$;

revoke all on function private.can_manage_department(uuid) from public;
revoke all on function private.can_manage_academic_department(uuid, text) from public;
revoke all on function private.audit_academic_mutation() from public;

-- Policies execute in the caller's query, so authenticated users need access to
-- the narrowly-scoped policy helpers (private is not an exposed Data API schema).
grant usage on schema private to authenticated;
grant execute on function private.has_permission(text) to authenticated;
grant execute on function private.can_access_class(uuid) to authenticated;
grant execute on function private.can_manage_department(uuid) to authenticated;
grant execute on function private.can_manage_academic_department(uuid, text) to authenticated;

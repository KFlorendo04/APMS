-- Align the live APMS schema with the revised thesis while preserving data.
-- Legacy Grader tables remain as read-only history for a later, separately
-- approved drop migration. No application role can write to them after this.

do $$
declare
  system_admin_role_id uuid;
  super_admin_role_id uuid;
  grader_role_id uuid;
begin
  select id into system_admin_role_id from public.roles where key = 'system_operator';
  select id into super_admin_role_id from public.roles where key = 'super_admin';
  select id into grader_role_id from public.roles where key = 'grader';

  if system_admin_role_id is null then
    insert into public.roles(key, name, description, system_role)
    values ('system_admin', 'System Admin', 'Technical system administration, security, users, audit, settings, and backup oversight.', true)
    returning id into system_admin_role_id;
  else
    update public.roles
    set key = 'system_admin',
        name = 'System Admin',
        description = 'Technical system administration, security, users, audit, settings, and backup oversight.'
    where id = system_admin_role_id;
  end if;

  if super_admin_role_id is not null then
    insert into public.role_permissions(role_id, permission_id)
    select system_admin_role_id, permission_id
    from public.role_permissions
    where role_id = super_admin_role_id
    on conflict do nothing;

    delete from public.user_roles legacy
    where legacy.role_id = super_admin_role_id
      and exists (
        select 1 from public.user_roles existing_role
        where existing_role.user_id = legacy.user_id
          and existing_role.role_id = system_admin_role_id
          and existing_role.scope_type = legacy.scope_type
          and existing_role.scope_id is not distinct from legacy.scope_id
      );
    update public.user_roles set role_id = system_admin_role_id where role_id = super_admin_role_id;
    delete from public.roles where id = super_admin_role_id;
  end if;

  if grader_role_id is not null then
    update public.grader_assignments
    set status = 'revoked'
    where grader_id in (select user_id from public.user_roles where role_id = grader_role_id)
      and status <> 'revoked';

    insert into public.audit_logs(actor_id, action, entity_type, entity_id, after_data)
    select null, 'legacy_role.deactivated', 'profiles', ur.user_id,
      jsonb_build_object('former_role', 'grader', 'reason', 'revised thesis role alignment')
    from public.user_roles ur
    where ur.role_id = grader_role_id;

    update public.profiles
    set status = 'inactive', updated_at = now()
    where id in (select user_id from public.user_roles where role_id = grader_role_id);
    delete from public.user_roles where role_id = grader_role_id;
    delete from public.roles where id = grader_role_id;
  end if;

  -- Students are monitored records, not a primary authenticated portal role.
  delete from public.user_roles
  where role_id in (select id from public.roles where key = 'student');
  delete from public.roles where key = 'student';
end $$;

insert into public.permissions(key, description) values
  ('students.manage.assigned', 'Create and maintain minimum monitoring records for assigned classes'),
  ('students.read.department', 'Read student monitoring records in an authorized academic scope'),
  ('class_records.read.department', 'Read class records in an authorized academic scope'),
  ('attendance.manage.assigned', 'Create sessions and record attendance for assigned classes'),
  ('attendance.read.department', 'View attendance in an authorized academic scope'),
  ('imports.manage.assigned', 'Import roster, score, and attendance files for assigned classes'),
  ('reports.export.assigned', 'Export reports for assigned classes'),
  ('reports.export.department', 'Export reports in an authorized academic scope')
on conflict (key) do update set description = excluded.description;

-- Normalize academic role permissions instead of retaining the broader legacy
-- Academic Admin and Grader-review grants.
delete from public.role_permissions rp
using public.roles r
where rp.role_id = r.id and r.key in ('faculty', 'academic_admin');

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'dashboard.read', 'students.read.assigned', 'students.manage.assigned',
  'class_records.manage.assigned', 'criteria.manage.assigned',
  'assessment_results.manage.assigned', 'evaluations.run.assigned',
  'predictions.run.assigned', 'feedback.send.assigned',
  'attendance.manage.assigned', 'imports.manage.assigned',
  'analytics.read.assigned', 'reports.export.assigned'
)
where r.key = 'faculty'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'dashboard.read', 'students.read.department', 'faculty.read.department',
  'class_records.read.department', 'criteria.manage.department',
  'attendance.read.department', 'analytics.read.department',
  'reports.export.department'
)
where r.key = 'academic_admin'
on conflict do nothing;

alter table public.assessments
  add column if not exists source text not null default 'manual',
  add column if not exists external_reference text,
  add column if not exists assessment_date date,
  add column if not exists grading_period text not null default 'Unspecified',
  add column if not exists description text;

update public.assessments
set assessment_date = coalesce(assessment_date, due_at::date, created_at::date)
where assessment_date is null;

alter table public.assessments alter column assessment_date set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'assessments_source_check'
      and conrelid = 'public.assessments'::regclass
  ) then
    alter table public.assessments add constraint assessments_source_check
      check (source in ('manual', 'csv', 'google_classroom'));
  end if;
end $$;

alter table public.criteria_sets
  add column if not exists passing_threshold numeric(7,2) not null default 75;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'criteria_sets_passing_threshold_check'
      and conrelid = 'public.criteria_sets'::regclass
  ) then
    alter table public.criteria_sets add constraint criteria_sets_passing_threshold_check
      check (passing_threshold between 0 and 100);
  end if;
end $$;

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  class_record_id uuid not null references public.class_records(id) on delete cascade,
  session_date date not null,
  label text not null default 'Class session',
  notes text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_record_id, session_date, label)
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  attendance_session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  status text not null check (status in ('present', 'absent', 'late', 'excused')),
  remarks text,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attendance_session_id, enrollment_id)
);

alter table public.import_jobs
  add column if not exists file_name text,
  add column if not exists import_kind text,
  add column if not exists column_mapping jsonb not null default '{}'::jsonb,
  add column if not exists summary jsonb not null default '{}'::jsonb;

create table if not exists public.import_job_rows (
  id bigint generated always as identity primary key,
  import_job_id uuid not null references public.import_jobs(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  raw_data jsonb not null,
  normalized_data jsonb,
  status text not null check (status in ('valid', 'invalid', 'imported', 'skipped')),
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (import_job_id, row_number)
);

create index if not exists attendance_sessions_class_date_idx
  on public.attendance_sessions(class_record_id, session_date desc);
create index if not exists attendance_records_enrollment_idx
  on public.attendance_records(enrollment_id);
create index if not exists import_job_rows_job_status_idx
  on public.import_job_rows(import_job_id, status);
create index if not exists assessments_class_date_idx
  on public.assessments(class_record_id, assessment_date desc);

alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.import_job_rows enable row level security;

create policy attendance_sessions_scoped_read on public.attendance_sessions
for select to authenticated
using ((select private.can_access_class(class_record_id)));

create policy attendance_sessions_faculty_manage on public.attendance_sessions
for all to authenticated
using (
  (select private.can_access_class(class_record_id))
  and (select private.has_permission('attendance.manage.assigned'))
)
with check (
  created_by = (select auth.uid())
  and (select private.can_access_class(class_record_id))
  and (select private.has_permission('attendance.manage.assigned'))
);

create policy attendance_records_scoped_read on public.attendance_records
for select to authenticated
using (
  exists (
    select 1 from public.attendance_sessions s
    where s.id = attendance_session_id
      and (select private.can_access_class(s.class_record_id))
  )
);

create policy attendance_records_faculty_manage on public.attendance_records
for all to authenticated
using (
  exists (
    select 1 from public.attendance_sessions s
    where s.id = attendance_session_id
      and (select private.can_access_class(s.class_record_id))
  )
  and (select private.has_permission('attendance.manage.assigned'))
)
with check (
  recorded_by = (select auth.uid())
  and exists (
    select 1
    from public.attendance_sessions s
    join public.enrollments e on e.id = enrollment_id and e.class_record_id = s.class_record_id
    where s.id = attendance_session_id
      and (select private.can_access_class(s.class_record_id))
  )
  and (select private.has_permission('attendance.manage.assigned'))
);

create policy import_job_rows_scoped on public.import_job_rows
for all to authenticated
using (
  exists (
    select 1 from public.import_jobs j
    where j.id = import_job_id
      and j.initiated_by = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.import_jobs j
    where j.id = import_job_id
      and j.initiated_by = (select auth.uid())
  )
);

drop policy if exists imports_operator on public.import_jobs;
create policy imports_scoped on public.import_jobs
for all to authenticated
using (
  initiated_by = (select auth.uid())
  or (select private.has_permission('integrations.manage'))
)
with check (
  initiated_by = (select auth.uid())
  and (
    (select private.has_permission('imports.manage.assigned'))
    or (select private.has_permission('integrations.manage'))
  )
  and scope_type = 'class_record'
  and scope_id is not null
  and (select private.can_access_class(scope_id))
);

drop policy if exists students_department_manage on public.students;
create policy students_assigned_insert on public.students
for insert to authenticated
with check (
  (select private.has_permission('students.manage.assigned'))
  and exists (
    select 1 from public.programs pr
    join public.faculty_profiles fp on fp.department_id = pr.department_id
    where pr.id = students.program_id
      and fp.profile_id = (select auth.uid())
      and fp.status = 'active'
  )
);

create policy students_assigned_update on public.students
for update to authenticated
using (
  (select private.has_permission('students.manage.assigned'))
  and exists (
    select 1 from public.enrollments e
    where e.student_id = students.id
      and (select private.can_access_class(e.class_record_id))
  )
)
with check (
  (select private.has_permission('students.manage.assigned'))
  and exists (
    select 1 from public.programs pr
    join public.faculty_profiles fp on fp.department_id = pr.department_id
    where pr.id = students.program_id
      and fp.profile_id = (select auth.uid())
      and fp.status = 'active'
  )
);

-- Preserve legacy tables for technical traceability only.
drop policy if exists grader_assignments_self on public.grader_assignments;
drop policy if exists grader_assignments_scoped_manage on public.grader_assignments;
drop policy if exists grader_submissions_self_read on public.grader_submissions;
drop policy if exists grader_submissions_grader_write on public.grader_submissions;
drop policy if exists grader_reviews_scoped_read on public.grader_reviews;
revoke all on public.grader_assignments, public.grader_submissions, public.grader_reviews from authenticated;

grant select, insert, update, delete on public.attendance_sessions, public.attendance_records, public.import_job_rows to authenticated;
grant usage, select on sequence public.import_job_rows_id_seq to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['attendance_sessions', 'attendance_records'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function private.set_updated_at()',
      table_name
    );
    execute format('drop trigger if exists audit_academic_mutation on public.%I', table_name);
    execute format(
      'create trigger audit_academic_mutation after insert or update or delete on public.%I for each row execute function private.audit_academic_mutation()',
      table_name
    );
  end loop;
end $$;

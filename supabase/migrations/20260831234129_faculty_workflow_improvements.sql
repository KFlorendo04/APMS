-- ============================================================================
-- Migration: Faculty Workflow Improvements
-- Description:
--   1. Adds 'subjects.manage.department' permission to 'academic_admin'.
--   2. Creates 'subject_requests' table with full department-scoped RLS.
--   3. Replaces broad 'reference_subjects_read' with database-enforced role policies:
--      - Faculty: read active subjects in assigned department.
--      - Academic Admin: read/manage subjects in authorized department.
--      - System Admin: full subject access.
--   4. Updates 'faculty_create_class' RPC with actionable duplicate errors,
--      explicit audit logging, and atomic SWUNEXT criteria set auto-provisioning.
--   5. Creates 'faculty_submit_subject_request' RPC (department derived from caller).
--   6. Creates 'academic_admin_manage_subject' RPC (verified against department scope).
--   7. Creates 'academic_admin_review_subject_request' RPC (explicit approval/rejection).
-- ============================================================================

-- 1. Permissions & Role Permissions
insert into public.permissions (key, description)
values ('subjects.manage.department', 'Create and manage subjects within an authorized department')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.key = 'academic_admin' and p.key = 'subjects.manage.department'
on conflict do nothing;

-- 2. Create subject_requests table
create table if not exists public.subject_requests (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete restrict,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  code text not null check (length(trim(code)) between 2 and 30),
  title text not null check (length(trim(title)) >= 3),
  units numeric(4,1) not null default 3 check (units > 0),
  rationale text not null check (length(trim(rationale)) >= 10),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subject_requests_dept_status
  on public.subject_requests(department_id, status);
create index if not exists idx_subject_requests_requested_by
  on public.subject_requests(requested_by, created_at desc);

alter table public.subject_requests enable row level security;

-- updated_at trigger
drop trigger if exists set_updated_at on public.subject_requests;
create trigger set_updated_at
  before update on public.subject_requests
  for each row execute function private.set_updated_at();

-- audit trigger
drop trigger if exists audit_academic_mutation on public.subject_requests;
create trigger audit_academic_mutation
  after insert or update or delete on public.subject_requests
  for each row execute function private.audit_academic_mutation();

-- 3. RLS Policies on subject_requests
drop policy if exists subject_requests_faculty_read on public.subject_requests;
create policy subject_requests_faculty_read on public.subject_requests
  for select to authenticated
  using (
    requested_by = auth.uid()
    or private.can_manage_academic_department(department_id, 'subjects.manage.department')
    or private.has_permission('system.configure')
  );

drop policy if exists subject_requests_faculty_insert on public.subject_requests;
create policy subject_requests_faculty_insert on public.subject_requests
  for insert to authenticated
  with check (
    requested_by = auth.uid()
    and exists (
      select 1 from public.faculty_profiles fp
      where fp.profile_id = auth.uid()
        and fp.department_id = subject_requests.department_id
        and fp.status = 'active'
    )
  );

drop policy if exists subject_requests_academic_admin_manage on public.subject_requests;
create policy subject_requests_academic_admin_manage on public.subject_requests
  for all to authenticated
  using (
    private.can_manage_academic_department(department_id, 'subjects.manage.department')
    or private.has_permission('system.configure')
  )
  with check (
    private.can_manage_academic_department(department_id, 'subjects.manage.department')
    or private.has_permission('system.configure')
  );

-- 4. Replace subjects RLS Policies (Database-enforced scope)
drop policy if exists reference_subjects_read on public.subjects;
drop policy if exists references_operator_manage_subjects on public.subjects;
drop policy if exists subjects_read on public.subjects;
drop policy if exists subjects_manage on public.subjects;

create policy subjects_read on public.subjects
  for select to authenticated
  using (
    -- System Admin has global visibility
    private.has_permission('system.configure')
    -- Academic Admin can read all subjects (active & inactive) in their authorized department
    or private.can_manage_academic_department(department_id, 'subjects.manage.department')
    -- Faculty can only read ACTIVE subjects in their assigned department
    or (
      status = 'active'
      and exists (
        select 1 from public.faculty_profiles fp
        where fp.profile_id = auth.uid()
          and fp.department_id = subjects.department_id
          and fp.status = 'active'
      )
    )
  );

create policy subjects_manage on public.subjects
  for all to authenticated
  using (
    private.can_manage_academic_department(department_id, 'subjects.manage.department')
    or private.has_permission('system.configure')
  )
  with check (
    private.can_manage_academic_department(department_id, 'subjects.manage.department')
    or private.has_permission('system.configure')
  );

-- 5. Helper function: private.get_faculty_department_id()
create or replace function private.get_faculty_department_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select fp.department_id
  from public.faculty_profiles fp
  where fp.profile_id = auth.uid()
    and fp.status = 'active'
  limit 1;
$$;

revoke all on function private.get_faculty_department_id() from public, anon;
grant execute on function private.get_faculty_department_id() to authenticated;

-- 6. RPC: faculty_submit_subject_request
create or replace function public.faculty_submit_subject_request(
  p_code text,
  p_title text,
  p_units numeric,
  p_rationale text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid;
  caller_dept_id uuid;
  new_request_id uuid;
  clean_code text;
  clean_title text;
  clean_rationale text;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  caller_dept_id := private.get_faculty_department_id();
  if caller_dept_id is null then
    raise exception 'Caller is not an active faculty member with an assigned department' using errcode = '42501';
  end if;

  clean_code := upper(trim(p_code));
  clean_title := trim(p_title);
  clean_rationale := trim(p_rationale);

  if length(clean_code) < 2 or length(clean_code) > 30 then
    raise exception 'Subject code must be between 2 and 30 characters' using errcode = '22023';
  end if;
  if length(clean_title) < 3 then
    raise exception 'Subject title must be at least 3 characters' using errcode = '22023';
  end if;
  if p_units is null or p_units <= 0 then
    raise exception 'Subject units must be greater than 0' using errcode = '22023';
  end if;
  if length(clean_rationale) < 10 then
    raise exception 'Please provide a clear rationale of at least 10 characters for this subject request' using errcode = '22023';
  end if;

  -- Prevent duplicate pending requests for the same code in the same department
  if exists (
    select 1 from public.subject_requests
    where department_id = caller_dept_id
      and upper(code) = clean_code
      and status = 'pending'
  ) then
    raise exception 'A pending subject request for code "%" already exists in your department', clean_code using errcode = '23505';
  end if;

  -- Check if active subject with this code already exists
  if exists (
    select 1 from public.subjects
    where department_id = caller_dept_id
      and upper(code) = clean_code
      and status = 'active'
  ) then
    raise exception 'An active subject with code "%" already exists in your department', clean_code using errcode = '23505';
  end if;

  insert into public.subject_requests (
    department_id, requested_by, code, title, units, rationale, status
  )
  values (
    caller_dept_id, caller_id, clean_code, clean_title, p_units, clean_rationale, 'pending'
  )
  returning id into new_request_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, after_data)
  values (
    caller_id,
    'subject_request.submitted',
    'subject_requests',
    new_request_id,
    jsonb_build_object(
      'department_id', caller_dept_id,
      'code', clean_code,
      'title', clean_title,
      'units', p_units
    )
  );

  return new_request_id;
end;
$$;

revoke all on function public.faculty_submit_subject_request(text, text, numeric, text) from public, anon;
grant execute on function public.faculty_submit_subject_request(text, text, numeric, text) to authenticated;

-- 7. RPC: academic_admin_manage_subject
create or replace function public.academic_admin_manage_subject(
  p_subject_id uuid,
  p_department_id uuid,
  p_code text,
  p_title text,
  p_units numeric,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid;
  result_id uuid;
  clean_code text;
  clean_title text;
  clean_status text;
  before_row record;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not (
    private.can_manage_academic_department(p_department_id, 'subjects.manage.department')
    or private.has_permission('system.configure')
  ) then
    raise exception 'Not authorized to manage subjects for department %', p_department_id using errcode = '42501';
  end if;

  clean_code := upper(trim(p_code));
  clean_title := trim(p_title);
  clean_status := lower(trim(p_status));

  if length(clean_code) < 2 or length(clean_code) > 30 then
    raise exception 'Subject code must be between 2 and 30 characters' using errcode = '22023';
  end if;
  if length(clean_title) < 3 then
    raise exception 'Subject title must be at least 3 characters' using errcode = '22023';
  end if;
  if p_units is null or p_units <= 0 then
    raise exception 'Subject units must be greater than 0' using errcode = '22023';
  end if;
  if clean_status not in ('active', 'inactive') then
    raise exception 'Status must be active or inactive' using errcode = '22023';
  end if;

  if p_subject_id is null then
    -- Create new subject
    insert into public.subjects (department_id, code, title, units, status)
    values (p_department_id, clean_code, clean_title, p_units, clean_status)
    returning id into result_id;

    insert into public.audit_logs (actor_id, action, entity_type, entity_id, after_data)
    values (
      caller_id,
      'subject.created',
      'subjects',
      result_id,
      jsonb_build_object(
        'department_id', p_department_id,
        'code', clean_code,
        'title', clean_title,
        'units', p_units,
        'status', clean_status
      )
    );
  else
    -- Update existing subject
    select * into before_row from public.subjects where id = p_subject_id;
    if before_row.id is null then
      raise exception 'Subject not found' using errcode = 'P0002';
    end if;
    if before_row.department_id <> p_department_id then
      raise exception 'Subject is outside the authorized department' using errcode = '42501';
    end if;

    update public.subjects
    set
      code = clean_code,
      title = clean_title,
      units = p_units,
      status = clean_status,
      updated_at = now()
    where id = p_subject_id
      and department_id = p_department_id
    returning id into result_id;

    insert into public.audit_logs (actor_id, action, entity_type, entity_id, before_data, after_data)
    values (
      caller_id,
      'subject.updated',
      'subjects',
      result_id,
      to_jsonb(before_row),
      jsonb_build_object(
        'id', result_id,
        'department_id', p_department_id,
        'code', clean_code,
        'title', clean_title,
        'units', p_units,
        'status', clean_status
      )
    );
  end if;

  return result_id;
end;
$$;

revoke all on function public.academic_admin_manage_subject(uuid, uuid, text, text, numeric, text) from public, anon;
grant execute on function public.academic_admin_manage_subject(uuid, uuid, text, text, numeric, text) to authenticated;

-- 8. RPC: academic_admin_review_subject_request
create or replace function public.academic_admin_review_subject_request(
  p_request_id uuid,
  p_decision text,
  p_review_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid;
  req record;
  clean_decision text;
  clean_note text;
  existing_subject_id uuid;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  clean_decision := lower(trim(p_decision));
  clean_note := trim(coalesce(p_review_note, ''));

  if clean_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected' using errcode = '22023';
  end if;

  if clean_decision = 'rejected' and length(clean_note) < 3 then
    raise exception 'A review note is required when rejecting a subject request' using errcode = '22023';
  end if;

  select * into req from public.subject_requests where id = p_request_id for update;
  if req.id is null then
    raise exception 'Subject request not found' using errcode = 'P0002';
  end if;

  if req.status <> 'pending' then
    raise exception 'Subject request has already been reviewed (status: %)', req.status using errcode = '23514';
  end if;

  if not (
    private.can_manage_academic_department(req.department_id, 'subjects.manage.department')
    or private.has_permission('system.configure')
  ) then
    raise exception 'Not authorized to review subject requests for department %', req.department_id using errcode = '42501';
  end if;

  if clean_decision = 'approved' then
    -- Check if a subject with this code already exists in the department
    select id into existing_subject_id
    from public.subjects
    where department_id = req.department_id
      and upper(code) = upper(req.code);

    if existing_subject_id is not null then
      -- Reactivate and update
      update public.subjects
      set
        title = req.title,
        units = req.units,
        status = 'active',
        updated_at = now()
      where id = existing_subject_id;
    else
      -- Insert new active subject
      insert into public.subjects (department_id, code, title, units, status)
      values (req.department_id, upper(req.code), req.title, req.units, 'active');
    end if;
  end if;

  -- Update request status
  update public.subject_requests
  set
    status = clean_decision,
    reviewed_by = caller_id,
    reviewed_at = now(),
    review_note = nullif(clean_note, ''),
    updated_at = now()
  where id = p_request_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, before_data, after_data)
  values (
    caller_id,
    'subject_request.' || clean_decision,
    'subject_requests',
    p_request_id,
    to_jsonb(req),
    jsonb_build_object(
      'id', p_request_id,
      'status', clean_decision,
      'reviewed_by', caller_id,
      'reviewed_at', now(),
      'review_note', clean_note
    )
  );
end;
$$;

revoke all on function public.academic_admin_review_subject_request(uuid, text, text) from public, anon;
grant execute on function public.academic_admin_review_subject_request(uuid, text, text) to authenticated;

-- 9. Replace faculty_create_class RPC (with duplicate error handling and auto SWUNEXT criteria)
create or replace function public.faculty_create_class(
  p_subject_id uuid,
  p_academic_term_id uuid,
  p_section text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid;
  target_faculty_id uuid;
  target_dept_id uuid;
  subject_dept_id uuid;
  subject_status text;
  term_status text;
  new_class_id uuid;
  clean_section text;
  new_criteria_id uuid;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  clean_section := trim(p_section);
  if length(clean_section) = 0 then
    raise exception 'Section cannot be empty' using errcode = '22023';
  end if;

  -- Verify active faculty profile
  select fp.id, fp.department_id
  into target_faculty_id, target_dept_id
  from public.faculty_profiles fp
  where fp.profile_id = caller_id and fp.status = 'active'
  limit 1;

  if target_faculty_id is null then
    raise exception 'Caller does not have an active Faculty profile' using errcode = '42501';
  end if;

  -- Verify subject belongs to faculty's department and is active
  select s.department_id, s.status
  into subject_dept_id, subject_status
  from public.subjects s
  where s.id = p_subject_id;

  if subject_dept_id is null then
    raise exception 'Selected subject not found' using errcode = 'P0002';
  end if;

  if subject_dept_id <> target_dept_id or subject_status <> 'active' then
    raise exception 'Subject is outside your authorized department or is inactive. Request subject addition if needed.' using errcode = '42501';
  end if;

  -- Verify academic term is active or planned
  select at.status into term_status
  from public.academic_terms at
  where at.id = p_academic_term_id;

  if term_status is null then
    raise exception 'Academic term not found' using errcode = 'P0002';
  end if;

  if term_status not in ('active', 'planned') then
    raise exception 'Cannot create a class in a closed or archived academic term' using errcode = '23514';
  end if;

  -- Check for existing class with same subject, term, and section
  if exists (
    select 1 from public.class_records
    where subject_id = p_subject_id
      and academic_term_id = p_academic_term_id
      and upper(section) = upper(clean_section)
  ) then
    raise exception 'A class for this subject and section already exists in this term. Use a different section identifier.' using errcode = '23505';
  end if;

  -- Create class record
  insert into public.class_records (
    subject_id, academic_term_id, department_id, section, status, version, created_by
  )
  values (
    p_subject_id, p_academic_term_id, target_dept_id, clean_section, 'active', 1, caller_id
  )
  returning id into new_class_id;

  -- Assign faculty as primary instructor
  insert into public.faculty_assignments (
    faculty_id, class_record_id, assignment_role, status
  )
  values (
    target_faculty_id, new_class_id, 'instructor', 'active'
  );

  -- Auto-provision SWUNEXT grading criteria set (5%, 35%, 15%, 15%, 30% = 100%)
  if not exists (
    select 1 from public.criteria_sets
    where class_record_id = new_class_id and status = 'active'
  ) then
    insert into public.criteria_sets (
      class_record_id, name, version, status, total_weight, passing_threshold, created_by
    )
    values (
      new_class_id, 'SWUNEXT Global Modules grading criteria', 1, 'active', 100, 80, caller_id
    )
    returning id into new_criteria_id;

    insert into public.criteria_nodes (criteria_set_id, type, label, weight, sort_order)
    values
      (new_criteria_id, 'assessment_category', 'Start of Class', 5, 0),
      (new_criteria_id, 'assessment_category', 'Let''s Practice', 35, 1),
      (new_criteria_id, 'assessment_category', 'Reflection', 15, 2),
      (new_criteria_id, 'assessment_category', 'Wrap-Up Quiz', 15, 3),
      (new_criteria_id, 'assessment_category', 'Final Project / Output', 30, 4);
  end if;

  -- Audit log entry
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, after_data)
  values (
    caller_id,
    'class_record.created',
    'class_records',
    new_class_id,
    jsonb_build_object(
      'subject_id', p_subject_id,
      'academic_term_id', p_academic_term_id,
      'department_id', target_dept_id,
      'section', clean_section,
      'criteria_set_id', new_criteria_id
    )
  );

  return new_class_id;
end;
$$;

revoke all on function public.faculty_create_class(uuid, uuid, text) from public, anon;
grant execute on function public.faculty_create_class(uuid, uuid, text) to authenticated;

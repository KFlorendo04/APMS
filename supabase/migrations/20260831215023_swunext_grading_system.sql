-- Store the SWUNEXT grading component metadata directly on assessments so
-- calculations do not depend on fragile label parsing.
alter table public.assessments
  add column if not exists component_key text not null default 'other',
  add column if not exists module_number smallint;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'assessments_component_key_check'
      and conrelid = 'public.assessments'::regclass
  ) then
    alter table public.assessments add constraint assessments_component_key_check
      check (component_key in (
        'start_of_class',
        'lets_practice',
        'reflection',
        'wrap_up_quiz',
        'project_checkin',
        'final_project',
        'other'
      ));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'assessments_module_number_check'
      and conrelid = 'public.assessments'::regclass
  ) then
    alter table public.assessments add constraint assessments_module_number_check
      check (module_number is null or module_number between 1 and 14);
  end if;
end $$;

update public.assessments
set component_key = case
    when lower(type) in ('start_of_class', 'soc') or lower(title) like '%start of class%' then 'start_of_class'
    when lower(type) in ('lets_practice', 'practice', 'activity') or lower(title) like '%practice%' then 'lets_practice'
    when lower(type) = 'reflection' or lower(title) like '%reflection%' then 'reflection'
    when lower(type) in ('wrap_up_quiz', 'quiz') or lower(title) like '%quiz%' then 'wrap_up_quiz'
    when lower(type) in ('project_checkin', 'check_in') or lower(title) like '%check-in%' or lower(title) like '%check in%' then 'project_checkin'
    when lower(type) in ('final_project', 'project', 'performance') or lower(title) like '%project%' then 'final_project'
    else 'other'
  end,
  module_number = coalesce(
    module_number,
    nullif(substring(lower(title) from 'module[[:space:]]+([0-9]{1,2})'), '')::smallint
  )
where component_key = 'other' or module_number is null;

create index if not exists assessments_class_component_module_idx
  on public.assessments(class_record_id, component_key, module_number);

-- Remove the obsolete invented source option from the production constraint.
update public.assessments
set source = 'csv'
where source = 'google_classroom';

alter table public.assessments drop constraint if exists assessments_source_check;
alter table public.assessments add constraint assessments_source_check
  check (source in ('manual', 'csv'));

do $$
declare
  class_row record;
  next_version integer;
  new_set_id uuid;
begin
  for class_row in
    select id, created_by
    from public.class_records
    where status in ('active', 'draft')
  loop
    select coalesce(max(version), 0) + 1 into next_version
    from public.criteria_sets
    where class_record_id = class_row.id;

    insert into public.criteria_sets(
      class_record_id,
      name,
      version,
      status,
      total_weight,
      passing_threshold,
      created_by
    )
    values (
      class_row.id,
      'SWUNEXT Global Modules grading criteria',
      next_version,
      'active',
      100,
      80,
      class_row.created_by
    )
    returning id into new_set_id;

    insert into public.criteria_nodes(criteria_set_id, type, label, description, weight, sort_order, formula)
    values
      (new_set_id, 'assessment_category', 'Start of Class', 'Binary effortful learning attendance/participation check: present = 100, absent = 0.', 5, 1, '{"component":"start_of_class","group":"effortful_learning","transmutation":"binary_present_absent"}'),
      (new_set_id, 'assessment_category', 'Let''s Practice', '0-3 effort rubric transmuted to 0, 60, 80, and 100 percent.', 35, 2, '{"component":"lets_practice","group":"effortful_learning","transmutation":"rubric_0_3"}'),
      (new_set_id, 'assessment_category', 'Reflection', '0-3 reflection rubric transmuted to 0, 60, 80, and 100 percent.', 15, 3, '{"component":"reflection","group":"effortful_learning","transmutation":"rubric_0_3"}'),
      (new_set_id, 'assessment_category', 'Wrap-Up Quiz', 'Mastery quiz or performance score recorded as a direct percentage.', 15, 4, '{"component":"wrap_up_quiz","group":"mastery","transmutation":"percentage"}'),
      (new_set_id, 'assessment_category', 'Final Project / Output', 'Project check-ins contribute 65 percent and final output contributes 35 percent; one check-in uses 50/50.', 30, 5, '{"components":["project_checkin","final_project"],"group":"mastery","checkin_weight":65,"final_output_weight":35,"single_checkin_weight":50}');

    update public.criteria_sets
    set status = 'archived'
    where class_record_id = class_row.id
      and id <> new_set_id
      and status = 'active';
  end loop;
end $$;

insert into public.system_settings(key, value, updated_by)
select 'grading.swunext_global_modules', jsonb_build_object(
    'effortful_learning_weight', 55,
    'mastery_weight', 45,
    'periods', jsonb_build_object('P1', 'modules 1-5', 'P2', 'modules 1-10', 'P3', 'modules 1-14'),
    'final_formula', 'P3 * 0.55 + FE * 0.45',
    'minimum_final_grade', 80,
    'minimum_mastery', 80,
    'official_grades_source', 'SWU SIS'
  ), p.id
from public.profiles p
where p.email = 'system.admin@apms.local'
limit 1
on conflict (key) do update
set value = excluded.value,
    updated_by = excluded.updated_by,
    updated_at = now();

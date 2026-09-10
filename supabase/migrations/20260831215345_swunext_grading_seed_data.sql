-- Add SWUNEXT-shaped sample monitoring data to the existing fictional class so
-- the live portal demonstrates the real grading workflow instead of generic
-- quiz/project averages.
do $$
declare
  class_id constant uuid := 'a3000000-0000-0000-0000-000000000001'::uuid;
  faculty_user_id uuid;
  start_node_id uuid;
  practice_node_id uuid;
  reflection_node_id uuid;
  wrap_node_id uuid;
  project_node_id uuid;
begin
  select created_by into faculty_user_id
  from public.class_records
  where id = class_id;

  if faculty_user_id is null then
    return;
  end if;

  select cn.id into start_node_id
  from public.criteria_sets cs
  join public.criteria_nodes cn on cn.criteria_set_id = cs.id
  where cs.class_record_id = class_id and cs.status = 'active' and cn.label = 'Start of Class'
  limit 1;

  select cn.id into practice_node_id
  from public.criteria_sets cs
  join public.criteria_nodes cn on cn.criteria_set_id = cs.id
  where cs.class_record_id = class_id and cs.status = 'active' and cn.label = 'Let''s Practice'
  limit 1;

  select cn.id into reflection_node_id
  from public.criteria_sets cs
  join public.criteria_nodes cn on cn.criteria_set_id = cs.id
  where cs.class_record_id = class_id and cs.status = 'active' and cn.label = 'Reflection'
  limit 1;

  select cn.id into wrap_node_id
  from public.criteria_sets cs
  join public.criteria_nodes cn on cn.criteria_set_id = cs.id
  where cs.class_record_id = class_id and cs.status = 'active' and cn.label = 'Wrap-Up Quiz'
  limit 1;

  select cn.id into project_node_id
  from public.criteria_sets cs
  join public.criteria_nodes cn on cn.criteria_set_id = cs.id
  where cs.class_record_id = class_id and cs.status = 'active' and cn.label = 'Final Project / Output'
  limit 1;

  update public.assessments
  set component_key = 'wrap_up_quiz',
      module_number = coalesce(module_number, 1),
      criteria_node_id = coalesce(criteria_node_id, wrap_node_id),
      grading_period = 'P1'
  where id = 'a6000000-0000-0000-0000-000000000001'::uuid;

  update public.assessments
  set component_key = 'final_project',
      criteria_node_id = coalesce(criteria_node_id, project_node_id),
      grading_period = 'P3'
  where id = 'a6000000-0000-0000-0000-000000000002'::uuid;

  insert into public.assessments(id, class_record_id, criteria_node_id, title, type, component_key, module_number, maximum_score, due_at, status, created_by, source, assessment_date, grading_period, description)
  values
    ('b6000000-0000-0000-0000-000000000001', class_id, start_node_id, 'Module 1 Start of Class SOC 1', 'start_of_class', 'start_of_class', 1, 1, '2026-08-10 08:00+08', 'published', faculty_user_id, 'manual', '2026-08-10', 'P1', 'Binary Start of Class check: present = 1, absent = 0.'),
    ('b6000000-0000-0000-0000-000000000002', class_id, start_node_id, 'Module 1 Start of Class SOC 2', 'start_of_class', 'start_of_class', 1, 1, '2026-08-12 08:00+08', 'published', faculty_user_id, 'manual', '2026-08-12', 'P1', 'Second weekly Start of Class check.'),
    ('b6000000-0000-0000-0000-000000000003', class_id, practice_node_id, 'Module 1 Let''s Practice A', 'lets_practice', 'lets_practice', 1, 3, '2026-08-14 17:00+08', 'published', faculty_user_id, 'manual', '2026-08-14', 'P1', '0-3 effort rubric.'),
    ('b6000000-0000-0000-0000-000000000004', class_id, reflection_node_id, 'Module 1 Reflection', 'reflection', 'reflection', 1, 3, '2026-08-14 17:00+08', 'published', faculty_user_id, 'manual', '2026-08-14', 'P1', '0-3 reflection rubric.'),
    ('b6000000-0000-0000-0000-000000000005', class_id, wrap_node_id, 'Module 1 Wrap-Up Quiz', 'wrap_up_quiz', 'wrap_up_quiz', 1, 100, '2026-08-15 17:00+08', 'published', faculty_user_id, 'manual', '2026-08-15', 'P1', 'Mastery score recorded as percentage.'),
    ('b6000000-0000-0000-0000-000000000006', class_id, project_node_id, 'Project Check-In 1', 'project_checkin', 'project_checkin', null, 100, '2026-09-15 17:00+08', 'published', faculty_user_id, 'manual', '2026-09-15', 'P3', 'Project progress check-in for mastery project component.')
  on conflict (id) do update set
    criteria_node_id = excluded.criteria_node_id,
    component_key = excluded.component_key,
    module_number = excluded.module_number,
    maximum_score = excluded.maximum_score,
    grading_period = excluded.grading_period,
    updated_at = now();

  insert into public.assessment_results(assessment_id, enrollment_id, score, source, approval_status, recorded_by)
  select assessment_id, enrollment_id, score, 'manual', 'approved', faculty_user_id
  from (values
    ('b6000000-0000-0000-0000-000000000001'::uuid, 'a4000000-0000-0000-0000-000000000001'::uuid, 1), ('b6000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000002', 1), ('b6000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000003', 1), ('b6000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 1), ('b6000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000005', 0), ('b6000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000006', 0),
    ('b6000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000001', 1), ('b6000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000002', 1), ('b6000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000003', 0), ('b6000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000004', 1), ('b6000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000005', 1), ('b6000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000006', 0),
    ('b6000000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000001', 3), ('b6000000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000002', 2), ('b6000000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000003', 1), ('b6000000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000004', 3), ('b6000000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000005', 2), ('b6000000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000006', 1),
    ('b6000000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000001', 3), ('b6000000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000002', 2), ('b6000000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000003', 1), ('b6000000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000004', 3), ('b6000000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000005', 1), ('b6000000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000006', 1),
    ('b6000000-0000-0000-0000-000000000005', 'a4000000-0000-0000-0000-000000000001', 92), ('b6000000-0000-0000-0000-000000000005', 'a4000000-0000-0000-0000-000000000002', 84), ('b6000000-0000-0000-0000-000000000005', 'a4000000-0000-0000-0000-000000000003', 70), ('b6000000-0000-0000-0000-000000000005', 'a4000000-0000-0000-0000-000000000004', 96), ('b6000000-0000-0000-0000-000000000005', 'a4000000-0000-0000-0000-000000000005', 74), ('b6000000-0000-0000-0000-000000000005', 'a4000000-0000-0000-0000-000000000006', 62),
    ('b6000000-0000-0000-0000-000000000006', 'a4000000-0000-0000-0000-000000000001', 90), ('b6000000-0000-0000-0000-000000000006', 'a4000000-0000-0000-0000-000000000002', 82), ('b6000000-0000-0000-0000-000000000006', 'a4000000-0000-0000-0000-000000000003', 74), ('b6000000-0000-0000-0000-000000000006', 'a4000000-0000-0000-0000-000000000004', 98), ('b6000000-0000-0000-0000-000000000006', 'a4000000-0000-0000-0000-000000000005', 70), ('b6000000-0000-0000-0000-000000000006', 'a4000000-0000-0000-0000-000000000006', 55)
  ) as seeded(assessment_id, enrollment_id, score)
  on conflict (assessment_id, enrollment_id) do update
  set score = excluded.score,
      approval_status = 'approved',
      updated_at = now();
end $$;

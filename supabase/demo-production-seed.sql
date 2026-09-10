-- Production-like APMS thesis demo seed.
-- Fictional academic data only. Re-runnable and data-only: no schema changes.

begin;

with constants as (
  select
    '10000000-0000-0000-0000-000000000003'::uuid as cit_department_id,
    '20000000-0000-0000-0000-000000000003'::uuid as bsit_program_id,
    '30000000-0000-0000-0000-000000000001'::uuid as active_term_id,
    '40000000-0000-0000-0000-000000000001'::uuid as dsa_subject_id,
    '40000000-0000-0000-0000-000000000002'::uuid as database_subject_id,
    '0e3bc946-ac14-4244-aa5d-cf4b12527a47'::uuid as demo_student_profile_id,
    '38eca08d-a9e7-45dd-badf-4af04b9143bb'::uuid as faculty_profile_id,
    '337afd0e-df2d-492d-8d35-7edc4cfca82d'::uuid as grader_profile_id,
    '127a10b9-25f5-4d11-880f-5775ee66ce5e'::uuid as dean_profile_id,
    '9dd7f9f3-000e-4f39-9ee3-822a6c69804d'::uuid as operator_profile_id,
    'c5b3d235-9a25-467d-9460-b71f56e2cce3'::uuid as super_admin_profile_id
),
role_lookup as (
  select r.id as academic_admin_role_id
  from public.roles r
  where r.key = 'academic_admin'
),
faculty_lookup as (
  select fp.id as faculty_id
  from public.faculty_profiles fp
  join constants c on c.faculty_profile_id = fp.profile_id
),
student_seed(id, profile_id, institutional_id, email, first_name, last_name, year_level, section, remarks) as (
  values
    ('50000000-0000-0000-0000-000000000001'::uuid, '0e3bc946-ac14-4244-aa5d-cf4b12527a47'::uuid, 'SWU-2026-0001', 'student@demo.apms.local', 'Mika', 'Santos', 3::smallint, 'BSIT-3A', 'Strong engagement and consistent submissions.'),
    ('50000000-0000-0000-0000-000000000002'::uuid, null::uuid, 'SWU-2026-0002', 'ara.reyes@demo.apms.local', 'Ara', 'Reyes', 3::smallint, 'BSIT-3A', 'Excellent performance; candidate for peer mentoring.'),
    ('50000000-0000-0000-0000-000000000003'::uuid, null::uuid, 'SWU-2026-0003', 'niko.cruz@demo.apms.local', 'Niko', 'Cruz', 3::smallint, 'BSIT-3A', 'Needs support in lab pacing and submission completeness.'),
    ('50000000-0000-0000-0000-000000000004'::uuid, null::uuid, 'SWU-2026-0004', 'lia.garcia@demo.apms.local', 'Lia', 'Garcia', 3::smallint, 'BSIT-3A', 'Attendance improving after advising intervention.'),
    ('50000000-0000-0000-0000-000000000005'::uuid, null::uuid, 'SWU-2026-0005', 'paul.dizon@demo.apms.local', 'Paul', 'Dizon', 3::smallint, 'BSIT-3A', 'Borderline written assessments; lab work is stable.'),
    ('50000000-0000-0000-0000-000000000006'::uuid, null::uuid, 'SWU-2026-0006', 'sofia.tan@demo.apms.local', 'Sofia', 'Tan', 3::smallint, 'BSIT-3A', 'High-risk monitoring due to missed activities.')
),
upsert_students as (
  insert into public.students(id, profile_id, program_id, institutional_id, email, first_name, last_name, year_level, section, remarks, status)
  select s.id, s.profile_id, c.bsit_program_id, s.institutional_id, s.email, s.first_name, s.last_name, s.year_level, s.section, s.remarks, 'active'
  from student_seed s
  cross join constants c
  on conflict (institutional_id) do update set
    id = excluded.id,
    profile_id = excluded.profile_id,
    program_id = excluded.program_id,
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    year_level = excluded.year_level,
    section = excluded.section,
    remarks = excluded.remarks,
    status = excluded.status
  returning id, institutional_id
),
upsert_dean_scope as (
  insert into public.user_roles(user_id, role_id, scope_type, scope_id, granted_by)
  select c.dean_profile_id, r.academic_admin_role_id, 'department', c.cit_department_id, c.super_admin_profile_id
  from constants c
  cross join role_lookup r
  on conflict (user_id, role_id, scope_type, scope_id) do update set
    granted_by = excluded.granted_by,
    valid_until = null
  returning id
),
upsert_model as (
  update public.model_versions
  set
    name = 'APMS rule-based advisory engine',
    version = 'rule-2026.08',
    artifact_reference = 'supabase/demo-production-seed.sql',
    feature_schema = jsonb_build_object(
      'inputs', jsonb_build_array('approved_assessment_percentages', 'attendance_percentage', 'submission_completion'),
      'rules', jsonb_build_array('>=85 low risk', '75-84 medium risk', '<75 high risk'),
      'deterministic', true
    ),
    metrics = jsonb_build_object('type', 'rule_based', 'validation_dataset', 'fictional_seeded_demo', 'external_ai_api', false),
    status = 'active'
  where name = 'APMS prediction adapter'
  returning id
),
model_pick as (
  select id from upsert_model
  union all
  select id from public.model_versions where name = 'APMS rule-based advisory engine' and version = 'rule-2026.08'
  limit 1
),
class_seed(id, subject_id, section) as (
  values
    ('60000000-0000-0000-0000-000000000001'::uuid, '40000000-0000-0000-0000-000000000002'::uuid, 'BSIT-3A'),
    ('60000000-0000-0000-0000-000000000002'::uuid, '40000000-0000-0000-0000-000000000001'::uuid, 'BSIT-3A')
),
upsert_classes as (
  insert into public.class_records(id, subject_id, academic_term_id, department_id, section, status, created_by)
  select cs.id, cs.subject_id, c.active_term_id, c.cit_department_id, cs.section, 'active', c.faculty_profile_id
  from class_seed cs
  cross join constants c
  on conflict (subject_id, academic_term_id, section) do update set
    status = excluded.status,
    created_by = excluded.created_by
  returning id
),
upsert_assignments as (
  insert into public.faculty_assignments(faculty_id, class_record_id, assignment_role, status)
  select fl.faculty_id, cs.id, 'instructor', 'active'
  from class_seed cs
  cross join faculty_lookup fl
  on conflict (faculty_id, class_record_id, assignment_role) do update set status = 'active'
  returning id
),
enrollment_seed(id, student_id, class_record_id) as (
  values
    ('70000000-0000-0000-0000-000000000001'::uuid, '50000000-0000-0000-0000-000000000001'::uuid, '60000000-0000-0000-0000-000000000001'::uuid),
    ('70000000-0000-0000-0000-000000000002'::uuid, '50000000-0000-0000-0000-000000000002'::uuid, '60000000-0000-0000-0000-000000000001'::uuid),
    ('70000000-0000-0000-0000-000000000003'::uuid, '50000000-0000-0000-0000-000000000003'::uuid, '60000000-0000-0000-0000-000000000001'::uuid),
    ('70000000-0000-0000-0000-000000000004'::uuid, '50000000-0000-0000-0000-000000000004'::uuid, '60000000-0000-0000-0000-000000000001'::uuid),
    ('70000000-0000-0000-0000-000000000005'::uuid, '50000000-0000-0000-0000-000000000005'::uuid, '60000000-0000-0000-0000-000000000001'::uuid),
    ('70000000-0000-0000-0000-000000000006'::uuid, '50000000-0000-0000-0000-000000000006'::uuid, '60000000-0000-0000-0000-000000000001'::uuid),
    ('71000000-0000-0000-0000-000000000001'::uuid, '50000000-0000-0000-0000-000000000001'::uuid, '60000000-0000-0000-0000-000000000002'::uuid),
    ('71000000-0000-0000-0000-000000000002'::uuid, '50000000-0000-0000-0000-000000000002'::uuid, '60000000-0000-0000-0000-000000000002'::uuid),
    ('71000000-0000-0000-0000-000000000003'::uuid, '50000000-0000-0000-0000-000000000003'::uuid, '60000000-0000-0000-0000-000000000002'::uuid),
    ('71000000-0000-0000-0000-000000000004'::uuid, '50000000-0000-0000-0000-000000000004'::uuid, '60000000-0000-0000-0000-000000000002'::uuid),
    ('71000000-0000-0000-0000-000000000005'::uuid, '50000000-0000-0000-0000-000000000005'::uuid, '60000000-0000-0000-0000-000000000002'::uuid),
    ('71000000-0000-0000-0000-000000000006'::uuid, '50000000-0000-0000-0000-000000000006'::uuid, '60000000-0000-0000-0000-000000000002'::uuid)
),
upsert_enrollments as (
  insert into public.enrollments(id, student_id, class_record_id, status)
  select id, student_id, class_record_id, 'active'
  from enrollment_seed
  on conflict (student_id, class_record_id) do update set status = 'active'
  returning id, student_id, class_record_id
),
criteria_seed(id, class_record_id, name) as (
  values
    ('80000000-0000-0000-0000-000000000001'::uuid, '60000000-0000-0000-0000-000000000001'::uuid, 'Database Systems Rule-Based Evaluation'),
    ('80000000-0000-0000-0000-000000000002'::uuid, '60000000-0000-0000-0000-000000000002'::uuid, 'Algorithms Rule-Based Evaluation')
),
upsert_criteria as (
  insert into public.criteria_sets(id, class_record_id, name, version, status, total_weight, created_by)
  select cs.id, cs.class_record_id, cs.name, 1, 'active', 100, c.faculty_profile_id
  from criteria_seed cs
  cross join constants c
  on conflict (class_record_id, version) do update set
    name = excluded.name,
    status = excluded.status,
    total_weight = excluded.total_weight,
    created_by = excluded.created_by
  returning id, class_record_id
),
node_seed(id, criteria_set_id, label, weight, sort_order) as (
  values
    ('81000000-0000-0000-0000-000000000001'::uuid, '80000000-0000-0000-0000-000000000001'::uuid, 'Attendance and participation', 20::numeric, 1),
    ('81000000-0000-0000-0000-000000000002'::uuid, '80000000-0000-0000-0000-000000000001'::uuid, 'Laboratory activities', 30::numeric, 2),
    ('81000000-0000-0000-0000-000000000003'::uuid, '80000000-0000-0000-0000-000000000001'::uuid, 'Midterm project', 50::numeric, 3),
    ('81000000-0000-0000-0000-000000000004'::uuid, '80000000-0000-0000-0000-000000000002'::uuid, 'Problem sets', 40::numeric, 1),
    ('81000000-0000-0000-0000-000000000005'::uuid, '80000000-0000-0000-0000-000000000002'::uuid, 'Algorithm analysis quiz', 60::numeric, 2)
),
upsert_nodes as (
  insert into public.criteria_nodes(id, criteria_set_id, type, label, weight, sort_order, formula)
  select id, criteria_set_id, 'assessment_category', label, weight, sort_order, jsonb_build_object('aggregation', 'weighted_percentage')
  from node_seed
  on conflict (id) do update set
    label = excluded.label,
    weight = excluded.weight,
    sort_order = excluded.sort_order,
    formula = excluded.formula
  returning id
),
assessment_seed(id, class_record_id, criteria_node_id, title, type, maximum_score, due_at) as (
  values
    ('90000000-0000-0000-0000-000000000001'::uuid, '60000000-0000-0000-0000-000000000001'::uuid, '81000000-0000-0000-0000-000000000001'::uuid, 'Attendance and Participation Check', 'attendance', 100::numeric, '2026-09-04 17:00+08'::timestamptz),
    ('90000000-0000-0000-0000-000000000002'::uuid, '60000000-0000-0000-0000-000000000001'::uuid, '81000000-0000-0000-0000-000000000002'::uuid, 'SQL Laboratory Activity', 'laboratory', 100::numeric, '2026-09-18 17:00+08'::timestamptz),
    ('90000000-0000-0000-0000-000000000003'::uuid, '60000000-0000-0000-0000-000000000001'::uuid, '81000000-0000-0000-0000-000000000003'::uuid, 'Midterm Database Project', 'project', 100::numeric, '2026-10-02 17:00+08'::timestamptz),
    ('90000000-0000-0000-0000-000000000004'::uuid, '60000000-0000-0000-0000-000000000002'::uuid, '81000000-0000-0000-0000-000000000004'::uuid, 'Algorithm Problem Set', 'assignment', 100::numeric, '2026-09-11 17:00+08'::timestamptz),
    ('90000000-0000-0000-0000-000000000005'::uuid, '60000000-0000-0000-0000-000000000002'::uuid, '81000000-0000-0000-0000-000000000005'::uuid, 'Complexity Analysis Quiz', 'quiz', 100::numeric, '2026-09-25 17:00+08'::timestamptz)
),
upsert_assessments as (
  insert into public.assessments(id, class_record_id, criteria_node_id, title, type, maximum_score, due_at, status, created_by)
  select a.id, a.class_record_id, a.criteria_node_id, a.title, a.type, a.maximum_score, a.due_at, 'published', c.faculty_profile_id
  from assessment_seed a
  cross join constants c
  on conflict (id) do update set
    title = excluded.title,
    type = excluded.type,
    maximum_score = excluded.maximum_score,
    due_at = excluded.due_at,
    status = excluded.status
  returning id
),
grader_assignment_seed(id, assessment_id) as (
  values
    ('92000000-0000-0000-0000-000000000001'::uuid, '90000000-0000-0000-0000-000000000001'::uuid),
    ('92000000-0000-0000-0000-000000000002'::uuid, '90000000-0000-0000-0000-000000000002'::uuid),
    ('92000000-0000-0000-0000-000000000003'::uuid, '90000000-0000-0000-0000-000000000003'::uuid)
),
upsert_grader_assignments as (
  insert into public.grader_assignments(id, grader_id, assessment_id, assigned_by, status, due_at)
  select gas.id, c.grader_profile_id, gas.assessment_id, c.faculty_profile_id, 'active', '2026-10-05 17:00+08'::timestamptz
  from grader_assignment_seed gas
  cross join constants c
  on conflict (grader_id, assessment_id) do update set
    assigned_by = excluded.assigned_by,
    status = excluded.status,
    due_at = excluded.due_at
  returning id
),
result_seed(assessment_id, enrollment_id, score) as (
  values
    ('90000000-0000-0000-0000-000000000001'::uuid, '70000000-0000-0000-0000-000000000001'::uuid, 96::numeric),
    ('90000000-0000-0000-0000-000000000002'::uuid, '70000000-0000-0000-0000-000000000001'::uuid, 91::numeric),
    ('90000000-0000-0000-0000-000000000003'::uuid, '70000000-0000-0000-0000-000000000001'::uuid, 88::numeric),
    ('90000000-0000-0000-0000-000000000001'::uuid, '70000000-0000-0000-0000-000000000002'::uuid, 98::numeric),
    ('90000000-0000-0000-0000-000000000002'::uuid, '70000000-0000-0000-0000-000000000002'::uuid, 94::numeric),
    ('90000000-0000-0000-0000-000000000003'::uuid, '70000000-0000-0000-0000-000000000002'::uuid, 92::numeric),
    ('90000000-0000-0000-0000-000000000001'::uuid, '70000000-0000-0000-0000-000000000003'::uuid, 72::numeric),
    ('90000000-0000-0000-0000-000000000002'::uuid, '70000000-0000-0000-0000-000000000003'::uuid, 68::numeric),
    ('90000000-0000-0000-0000-000000000003'::uuid, '70000000-0000-0000-0000-000000000003'::uuid, 70::numeric),
    ('90000000-0000-0000-0000-000000000001'::uuid, '70000000-0000-0000-0000-000000000004'::uuid, 84::numeric),
    ('90000000-0000-0000-0000-000000000002'::uuid, '70000000-0000-0000-0000-000000000004'::uuid, 81::numeric),
    ('90000000-0000-0000-0000-000000000003'::uuid, '70000000-0000-0000-0000-000000000004'::uuid, 78::numeric),
    ('90000000-0000-0000-0000-000000000001'::uuid, '70000000-0000-0000-0000-000000000005'::uuid, 79::numeric),
    ('90000000-0000-0000-0000-000000000002'::uuid, '70000000-0000-0000-0000-000000000005'::uuid, 76::numeric),
    ('90000000-0000-0000-0000-000000000003'::uuid, '70000000-0000-0000-0000-000000000005'::uuid, 74::numeric),
    ('90000000-0000-0000-0000-000000000001'::uuid, '70000000-0000-0000-0000-000000000006'::uuid, 63::numeric),
    ('90000000-0000-0000-0000-000000000002'::uuid, '70000000-0000-0000-0000-000000000006'::uuid, 66::numeric),
    ('90000000-0000-0000-0000-000000000003'::uuid, '70000000-0000-0000-0000-000000000006'::uuid, 60::numeric),
    ('90000000-0000-0000-0000-000000000004'::uuid, '71000000-0000-0000-0000-000000000001'::uuid, 89::numeric),
    ('90000000-0000-0000-0000-000000000005'::uuid, '71000000-0000-0000-0000-000000000001'::uuid, 86::numeric),
    ('90000000-0000-0000-0000-000000000004'::uuid, '71000000-0000-0000-0000-000000000002'::uuid, 95::numeric),
    ('90000000-0000-0000-0000-000000000005'::uuid, '71000000-0000-0000-0000-000000000002'::uuid, 90::numeric),
    ('90000000-0000-0000-0000-000000000004'::uuid, '71000000-0000-0000-0000-000000000003'::uuid, 71::numeric),
    ('90000000-0000-0000-0000-000000000005'::uuid, '71000000-0000-0000-0000-000000000003'::uuid, 69::numeric),
    ('90000000-0000-0000-0000-000000000004'::uuid, '71000000-0000-0000-0000-000000000004'::uuid, 82::numeric),
    ('90000000-0000-0000-0000-000000000005'::uuid, '71000000-0000-0000-0000-000000000004'::uuid, 80::numeric),
    ('90000000-0000-0000-0000-000000000004'::uuid, '71000000-0000-0000-0000-000000000005'::uuid, 78::numeric),
    ('90000000-0000-0000-0000-000000000005'::uuid, '71000000-0000-0000-0000-000000000005'::uuid, 75::numeric),
    ('90000000-0000-0000-0000-000000000004'::uuid, '71000000-0000-0000-0000-000000000006'::uuid, 67::numeric),
    ('90000000-0000-0000-0000-000000000005'::uuid, '71000000-0000-0000-0000-000000000006'::uuid, 62::numeric)
),
upsert_results as (
  insert into public.assessment_results(assessment_id, enrollment_id, score, source, approval_status, recorded_by)
  select assessment_id, enrollment_id, score, 'manual', 'approved', (select faculty_profile_id from constants)
  from result_seed
  on conflict (assessment_id, enrollment_id) do update set
    score = excluded.score,
    source = excluded.source,
    approval_status = excluded.approval_status,
    recorded_by = excluded.recorded_by
  returning id, assessment_id, enrollment_id, score
),
score_rollup as (
  select
    e.id as enrollment_id,
    e.class_record_id,
    avg((ar.score / a.maximum_score) * 100)::numeric(7,2) as score,
    min(case when a.type = 'attendance' then (ar.score / a.maximum_score) * 100 end)::numeric(7,2) as attendance_score
  from public.enrollments e
  join public.assessment_results ar on ar.enrollment_id = e.id
  join public.assessments a on a.id = ar.assessment_id
  where e.class_record_id in ('60000000-0000-0000-0000-000000000001'::uuid, '60000000-0000-0000-0000-000000000002'::uuid)
    and ar.approval_status = 'approved'
  group by e.id, e.class_record_id
),
upsert_evaluations as (
  insert into public.performance_evaluations(enrollment_id, criteria_set_id, score, classification, risk_level, explanation, calculated_by)
  select
    sr.enrollment_id,
    cs.id,
    sr.score,
    case when sr.score >= 85 then 'excellent' when sr.score >= 75 then 'passing' else 'at_risk' end,
    case when sr.score >= 85 then 'low' when sr.score >= 75 then 'medium' else 'high' end,
    jsonb_build_object(
      'engine', 'rule_based',
      'average_score', sr.score,
      'attendance_score', sr.attendance_score,
      'rule', case when sr.score >= 85 then 'score >= 85' when sr.score >= 75 then '75 <= score < 85' else 'score < 75' end
    ),
    (select faculty_profile_id from constants)
  from score_rollup sr
  join public.criteria_sets cs on cs.class_record_id = sr.class_record_id and cs.version = 1
  on conflict (enrollment_id, criteria_set_id) do update set
    score = excluded.score,
    classification = excluded.classification,
    risk_level = excluded.risk_level,
    explanation = excluded.explanation,
    calculated_by = excluded.calculated_by
  returning id, enrollment_id, score, risk_level
),
upsert_prediction_criteria as (
  insert into public.prediction_criteria(id, class_record_id, name, scenario, parameters, version, status, created_by)
  values
    ('93000000-0000-0000-0000-000000000001'::uuid, '60000000-0000-0000-0000-000000000001'::uuid, 'Stable completion forecast', 'stable', '{"attendancePenalty":3,"highRiskPenalty":4,"excellentBoost":2}'::jsonb, 1, 'active', (select faculty_profile_id from constants)),
    ('93000000-0000-0000-0000-000000000002'::uuid, '60000000-0000-0000-0000-000000000002'::uuid, 'Stable completion forecast', 'stable', '{"attendancePenalty":3,"highRiskPenalty":4,"excellentBoost":2}'::jsonb, 1, 'active', (select faculty_profile_id from constants))
  on conflict (id) do update set
    parameters = excluded.parameters,
    status = excluded.status,
    created_by = excluded.created_by
  returning id
),
upsert_prediction_run as (
  insert into public.prediction_runs(id, class_record_id, model_version_id, prediction_criteria_id, input_snapshot, status, initiated_by, started_at, completed_at)
  values (
    '94000000-0000-0000-0000-000000000001'::uuid,
    '60000000-0000-0000-0000-000000000001'::uuid,
    (select id from model_pick),
    '93000000-0000-0000-0000-000000000001'::uuid,
    jsonb_build_object('source', 'approved assessment results', 'engine', 'deterministic rule-based AI', 'student_count', 6),
    'completed',
    (select faculty_profile_id from constants),
    now() - interval '5 minutes',
    now() - interval '4 minutes'
  )
  on conflict (id) do update set
    model_version_id = excluded.model_version_id,
    input_snapshot = excluded.input_snapshot,
    status = excluded.status,
    initiated_by = excluded.initiated_by,
    completed_at = excluded.completed_at
  returning id
),
prediction_values as (
  select
    sr.enrollment_id,
    greatest(0, least(100,
      sr.score
      + case when sr.score >= 85 then 2 when sr.score < 75 then -4 else 0 end
      + case when coalesce(sr.attendance_score, 100) < 75 then -3 else 0 end
    ))::numeric(7,2) as predicted_score,
    case when sr.score >= 85 then 'improving' when sr.score < 75 then 'declining' else 'stable' end as trend,
    case when sr.score >= 85 then 'low' when sr.score >= 75 then 'medium' else 'high' end as risk_level,
    case when sr.score >= 85 then 0.89000 when sr.score >= 75 then 0.81000 else 0.76000 end::numeric(6,5) as confidence,
    sr.score,
    sr.attendance_score
  from score_rollup sr
  where sr.class_record_id = '60000000-0000-0000-0000-000000000001'::uuid
),
upsert_predictions as (
  insert into public.performance_predictions(prediction_run_id, enrollment_id, predicted_score, trend, risk_level, confidence, explanation)
  select
    (select id from upsert_prediction_run),
    pv.enrollment_id,
    pv.predicted_score,
    pv.trend,
    pv.risk_level,
    pv.confidence,
    jsonb_build_object(
      'engine', 'rule_based',
      'current_score', pv.score,
      'attendance_score', pv.attendance_score,
      'rules_applied', jsonb_build_array('score threshold', 'attendance penalty', 'excellent boost')
    )
  from prediction_values pv
  on conflict (prediction_run_id, enrollment_id) do update set
    predicted_score = excluded.predicted_score,
    trend = excluded.trend,
    risk_level = excluded.risk_level,
    confidence = excluded.confidence,
    explanation = excluded.explanation
  returning id, enrollment_id, risk_level
),
upsert_templates as (
  insert into public.feedback_templates(id, department_id, title, category, body, status, created_by)
  values
    ('95000000-0000-0000-0000-000000000001'::uuid, (select cit_department_id from constants), 'Excellent Performance Recognition', 'excellent', 'Your approved assessment results show excellent performance. Continue the study habits that are producing consistent mastery.', 'active', (select faculty_profile_id from constants)),
    ('95000000-0000-0000-0000-000000000002'::uuid, (select cit_department_id from constants), 'Improvement Advisory', 'improvement', 'Your current standing is passing but close monitoring is recommended. Review missed concepts and attend the next consultation window.', 'active', (select faculty_profile_id from constants)),
    ('95000000-0000-0000-0000-000000000003'::uuid, (select cit_department_id from constants), 'High Risk Intervention', 'at_risk', 'The rule-based evaluation marks this record as high risk. Immediate advising and activity recovery are recommended.', 'active', (select faculty_profile_id from constants))
  on conflict (id) do update set
    body = excluded.body,
    status = excluded.status,
    created_by = excluded.created_by
  returning id
),
feedback_seed(id, student_id, enrollment_id, category, body, template_id) as (
  values
    ('96000000-0000-0000-0000-000000000001'::uuid, '50000000-0000-0000-0000-000000000001'::uuid, '70000000-0000-0000-0000-000000000001'::uuid, 'excellent', 'Mika, your Database Systems record is excellent. Keep using structured lab notes and continue submitting ahead of deadlines.', '95000000-0000-0000-0000-000000000001'::uuid),
    ('96000000-0000-0000-0000-000000000002'::uuid, '50000000-0000-0000-0000-000000000003'::uuid, '70000000-0000-0000-0000-000000000003'::uuid, 'at_risk', 'Niko, APMS flagged your record as high risk because the approved average is below 75. Please attend the consultation session and prioritize the next lab recovery task.', '95000000-0000-0000-0000-000000000003'::uuid),
    ('96000000-0000-0000-0000-000000000005'::uuid, '50000000-0000-0000-0000-000000000005'::uuid, '70000000-0000-0000-0000-000000000005'::uuid, 'improvement', 'Paul, your standing is near the intervention threshold. Focus on the project rubric and request feedback before the next submission.', '95000000-0000-0000-0000-000000000002'::uuid),
    ('96000000-0000-0000-0000-000000000006'::uuid, '50000000-0000-0000-0000-000000000006'::uuid, '70000000-0000-0000-0000-000000000006'::uuid, 'at_risk', 'Sofia, APMS shows high risk driven by missed activities and low scores. A recovery plan should be created with the faculty adviser this week.', '95000000-0000-0000-0000-000000000003'::uuid)
),
upsert_feedback as (
  insert into public.feedback_records(id, student_id, enrollment_id, evaluation_id, prediction_id, template_id, author_id, body, category, status, sent_at)
  select
    fs.id,
    fs.student_id,
    fs.enrollment_id,
    pe.id,
    pp.id,
    fs.template_id,
    (select faculty_profile_id from constants),
    fs.body,
    fs.category,
    'sent',
    now() - interval '1 hour'
  from feedback_seed fs
  left join public.performance_evaluations pe on pe.enrollment_id = fs.enrollment_id
  left join public.performance_predictions pp on pp.enrollment_id = fs.enrollment_id
  on conflict (id) do update set
    evaluation_id = excluded.evaluation_id,
    prediction_id = excluded.prediction_id,
    body = excluded.body,
    category = excluded.category,
    status = excluded.status,
    sent_at = excluded.sent_at
  returning id, student_id, enrollment_id
),
upsert_delivery as (
  insert into public.delivery_attempts(id, feedback_id, channel, provider_reference, status, completed_at)
  select
    ('97000000-0000-0000-0000-' || lpad(row_number() over (order by id)::text, 12, '0'))::uuid,
    id,
    'in_app',
    'supabase-notifications',
    'sent',
    now() - interval '1 hour'
  from upsert_feedback
  on conflict (id) do update set
    feedback_id = excluded.feedback_id,
    channel = excluded.channel,
    provider_reference = excluded.provider_reference,
    status = excluded.status,
    completed_at = excluded.completed_at
  returning id
),
notification_seed(id, recipient_id, type, title, body, entity_type, entity_id) as (
  values
    ('98000000-0000-0000-0000-000000000001'::uuid, '0e3bc946-ac14-4244-aa5d-cf4b12527a47'::uuid, 'feedback', 'Feedback Available', 'Your Database Systems performance feedback is available.', 'feedback_record', '96000000-0000-0000-0000-000000000001'::uuid),
    ('98000000-0000-0000-0000-000000000002'::uuid, '38eca08d-a9e7-45dd-badf-4af04b9143bb'::uuid, 'risk_alert', 'High Risk Review', 'Two BSIT-3A students require advising based on rule-based APMS evaluation.', 'event', '99000000-0000-0000-0000-000000000001'::uuid),
    ('98000000-0000-0000-0000-000000000003'::uuid, '127a10b9-25f5-4d11-880f-5775ee66ce5e'::uuid, 'evaluation', 'Department Evaluation Ready', 'Database Systems has completed deterministic rule-based evaluation for six fictional students.', 'event', '99000000-0000-0000-0000-000000000001'::uuid),
    ('98000000-0000-0000-0000-000000000004'::uuid, '9dd7f9f3-000e-4f39-9ee3-822a6c69804d'::uuid, 'system', 'Demo Seed Applied', 'Production-like APMS demo data is live in Supabase.', 'backup', '9a000000-0000-0000-0000-000000000001'::uuid),
    ('98000000-0000-0000-0000-000000000005'::uuid, 'c5b3d235-9a25-467d-9460-b71f56e2cce3'::uuid, 'system', 'Rule-Based AI Active', 'The deterministic advisory engine is active for thesis demo records.', 'event', '99000000-0000-0000-0000-000000000001'::uuid)
),
upsert_notifications as (
  insert into public.notifications(id, recipient_id, type, title, body, entity_type, entity_id)
  select id, recipient_id, type, title, body, entity_type, entity_id
  from notification_seed
  on conflict (id) do update set
    title = excluded.title,
    body = excluded.body,
    entity_type = excluded.entity_type,
    entity_id = excluded.entity_id
  returning id
),
upsert_events as (
  insert into public.events(id, department_id, title, description, category, priority, starts_at, ends_at, audience, status, created_by)
  values
    ('99000000-0000-0000-0000-000000000001'::uuid, (select cit_department_id from constants), 'BSIT-3A Advising Review', 'Faculty and academic admin review high-risk APMS records and recovery actions.', 'meeting', 'high', '2026-09-28 09:00+08'::timestamptz, '2026-09-28 10:00+08'::timestamptz, '{"label":"Faculty and academic admins"}'::jsonb, 'scheduled', (select faculty_profile_id from constants)),
    ('99000000-0000-0000-0000-000000000002'::uuid, (select cit_department_id from constants), 'Database Systems Midterm Deadline', 'Deadline for the approved midterm database project.', 'assessment', 'urgent', '2026-10-02 08:00+08'::timestamptz, '2026-10-02 17:00+08'::timestamptz, '{"label":"BSIT-3A students"}'::jsonb, 'scheduled', (select faculty_profile_id from constants))
  on conflict (id) do update set
    description = excluded.description,
    priority = excluded.priority,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    audience = excluded.audience,
    status = excluded.status
  returning id
),
upsert_backup as (
  insert into public.backups(id, scope, provider_reference, checksum, size_bytes, status, created_by, completed_at)
  values
    ('9a000000-0000-0000-0000-000000000001'::uuid, 'database', 'supabase-managed-demo-snapshot', 'sha256:fictional-demo-seed-checksum', 15728640, 'completed', (select super_admin_profile_id from constants), now() - interval '20 minutes')
  on conflict (id) do update set
    provider_reference = excluded.provider_reference,
    checksum = excluded.checksum,
    size_bytes = excluded.size_bytes,
    status = excluded.status,
    completed_at = excluded.completed_at
  returning id
),
upsert_integrations as (
  insert into public.integrations(id, department_id, provider, status, configuration, created_by)
  values
    ('9b000000-0000-0000-0000-000000000001'::uuid, null, 'Supabase Auth', 'connected', '{"purpose":"email/password authentication","googleSignIn":"deferred"}'::jsonb, (select operator_profile_id from constants)),
    ('9b000000-0000-0000-0000-000000000002'::uuid, null, 'Custom outbound email provider', 'disabled', '{"purpose":"custom feedback email","decision":"configure real provider later"}'::jsonb, (select operator_profile_id from constants))
  on conflict (id) do update set
    status = excluded.status,
    configuration = excluded.configuration,
    created_by = excluded.created_by
  returning id
),
upsert_settings as (
  insert into public.system_settings(key, value, updated_by)
  values
    ('ai_engine', '{"mode":"rule_based","deterministic":true,"externalProvider":"none_for_demo"}'::jsonb, (select operator_profile_id from constants)),
    ('deployment_target', '{"platform":"vercel","status":"deferred"}'::jsonb, (select operator_profile_id from constants)),
    ('outbound_email_provider', '{"status":"deferred","authEmails":"supabase"}'::jsonb, (select operator_profile_id from constants))
  on conflict (key) do update set
    value = excluded.value,
    updated_by = excluded.updated_by,
    updated_at = now()
  returning key
),
insert_audit as (
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, after_data, request_id)
  select
    (select operator_profile_id from constants),
    'demo.production_seed.applied',
    'system_setting',
    null,
    jsonb_build_object('students', 6, 'classes', 2, 'ai_engine', 'rule_based'),
    'demo-production-seed-2026-08-08'
  where not exists (
    select 1 from public.audit_logs where request_id = 'demo-production-seed-2026-08-08'
  )
  returning id
)
select jsonb_build_object(
  'students', (select count(*) from public.students where institutional_id like 'SWU-2026-%'),
  'classes', (select count(*) from public.class_records where id in ('60000000-0000-0000-0000-000000000001'::uuid, '60000000-0000-0000-0000-000000000002'::uuid)),
  'assessment_results', (select count(*) from public.assessment_results ar join public.enrollments e on e.id = ar.enrollment_id where e.class_record_id in ('60000000-0000-0000-0000-000000000001'::uuid, '60000000-0000-0000-0000-000000000002'::uuid)),
  'evaluations', (select count(*) from upsert_evaluations),
  'predictions', (select count(*) from upsert_predictions),
  'feedback', (select count(*) from upsert_feedback),
  'notifications', (select count(*) from upsert_notifications),
  'rule_based_ai', true
) as seeded;

commit;

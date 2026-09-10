-- Fictional, thesis-aligned demonstration data. Auth users are created through
-- the Admin API; this migration resolves their IDs by email instead of
-- hardcoding generated Auth identifiers.

do $$
declare
  system_admin_id uuid;
  academic_admin_id uuid;
  faculty_user_id uuid;
  system_admin_role_id uuid;
  academic_admin_role_id uuid;
  faculty_role_id uuid;
  model_id uuid;
  cit_id constant uuid := '10000000-0000-0000-0000-000000000003'::uuid;
  bsit_id constant uuid := '20000000-0000-0000-0000-000000000003'::uuid;
  term_id constant uuid := '30000000-0000-0000-0000-000000000001'::uuid;
  subject_id constant uuid := '40000000-0000-0000-0000-000000000002'::uuid;
  faculty_profile_id constant uuid := 'a1000000-0000-0000-0000-000000000001'::uuid;
  class_id constant uuid := 'a3000000-0000-0000-0000-000000000001'::uuid;
  criteria_id constant uuid := 'a5000000-0000-0000-0000-000000000001'::uuid;
  coursework_node_id constant uuid := 'a5100000-0000-0000-0000-000000000001'::uuid;
  exams_node_id constant uuid := 'a5100000-0000-0000-0000-000000000002'::uuid;
  quiz_id constant uuid := 'a6000000-0000-0000-0000-000000000001'::uuid;
  project_id constant uuid := 'a6000000-0000-0000-0000-000000000002'::uuid;
  prediction_criteria_id constant uuid := 'a9000000-0000-0000-0000-000000000001'::uuid;
  prediction_run_id constant uuid := 'a9100000-0000-0000-0000-000000000001'::uuid;
begin
  select id into system_admin_id from auth.users where email = 'system.admin@apms.local' and deleted_at is null;
  select id into academic_admin_id from auth.users where email = 'academic.admin@apms.local' and deleted_at is null;
  select id into faculty_user_id from auth.users where email = 'faculty@apms.local' and deleted_at is null;

  if system_admin_id is null or academic_admin_id is null or faculty_user_id is null then
    raise notice 'Skipping hosted demonstration data because its Auth seed accounts are not present';
    return;
  end if;

  select id into system_admin_role_id from public.roles where key = 'system_admin';
  select id into academic_admin_role_id from public.roles where key = 'academic_admin';
  select id into faculty_role_id from public.roles where key = 'faculty';

  insert into public.profiles(id, email, first_name, last_name, status) values
    (system_admin_id, 'system.admin@apms.local', 'Sofia', 'Reyes', 'active'),
    (academic_admin_id, 'academic.admin@apms.local', 'Adrian', 'Cruz', 'active'),
    (faculty_user_id, 'faculty@apms.local', 'Maria', 'Santos', 'active');

  insert into public.user_roles(user_id, role_id, scope_type, scope_id, granted_by) values
    (system_admin_id, system_admin_role_id, 'global', null, system_admin_id),
    (academic_admin_id, academic_admin_role_id, 'department', cit_id, system_admin_id),
    (faculty_user_id, faculty_role_id, 'department', cit_id, system_admin_id);

  insert into public.faculty_profiles(id, profile_id, department_id, employee_id, position)
  values (faculty_profile_id, faculty_user_id, cit_id, 'FAC-2026-001', 'Instructor');

  insert into public.students(id, program_id, institutional_id, email, first_name, last_name, year_level, section, remarks) values
    ('a2000000-0000-0000-0000-000000000001', bsit_id, 'SWU-2026-1001', 'alex.rivera@student.example', 'Alex', 'Rivera', 3, 'BSIT-3A', 'Consistent performance.'),
    ('a2000000-0000-0000-0000-000000000002', bsit_id, 'SWU-2026-1002', 'bea.mendoza@student.example', 'Bea', 'Mendoza', 3, 'BSIT-3A', 'Improving after consultation.'),
    ('a2000000-0000-0000-0000-000000000003', bsit_id, 'SWU-2026-1003', 'carlo.garcia@student.example', 'Carlo', 'Garcia', 3, 'BSIT-3A', 'Monitor attendance.'),
    ('a2000000-0000-0000-0000-000000000004', bsit_id, 'SWU-2026-1004', 'dana.lim@student.example', 'Dana', 'Lim', 3, 'BSIT-3A', 'Strong assessment results.'),
    ('a2000000-0000-0000-0000-000000000005', bsit_id, 'SWU-2026-1005', 'eli.tan@student.example', 'Eli', 'Tan', 3, 'BSIT-3A', 'Missing one assessment.'),
    ('a2000000-0000-0000-0000-000000000006', bsit_id, 'SWU-2026-1006', 'faith.santos@student.example', 'Faith', 'Santos', 3, 'BSIT-3A', 'Needs early intervention.');

  insert into public.class_records(id, subject_id, academic_term_id, department_id, section, status, created_by)
  values (class_id, subject_id, term_id, cit_id, 'BSIT-3A', 'active', faculty_user_id);

  insert into public.faculty_assignments(id, faculty_id, class_record_id, assignment_role, status)
  values ('a3100000-0000-0000-0000-000000000001', faculty_profile_id, class_id, 'instructor', 'active');

  insert into public.enrollments(id, student_id, class_record_id, status) values
    ('a4000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', class_id, 'active'),
    ('a4000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', class_id, 'active'),
    ('a4000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000003', class_id, 'active'),
    ('a4000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000004', class_id, 'active'),
    ('a4000000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000005', class_id, 'active'),
    ('a4000000-0000-0000-0000-000000000006', 'a2000000-0000-0000-0000-000000000006', class_id, 'active');

  insert into public.criteria_sets(id, class_record_id, name, version, status, total_weight, passing_threshold, created_by)
  values (criteria_id, class_id, 'Standard BSIT Criteria', 1, 'active', 100, 75, faculty_user_id);

  insert into public.criteria_nodes(id, criteria_set_id, type, label, weight, sort_order) values
    (coursework_node_id, criteria_id, 'assessment_category', 'Coursework', 60, 1),
    (exams_node_id, criteria_id, 'assessment_category', 'Major Assessment', 40, 2);

  insert into public.assessments(id, class_record_id, criteria_node_id, title, type, maximum_score, due_at, status, created_by, source, assessment_date, grading_period, description) values
    (quiz_id, class_id, coursework_node_id, 'Database Fundamentals Quiz', 'quiz', 30, '2026-08-21 17:00+08', 'published', faculty_user_id, 'manual', '2026-08-21', 'Prelim', 'Manual score-entry demonstration.'),
    (project_id, class_id, exams_node_id, 'Schema Design Project', 'project', 100, '2026-09-04 17:00+08', 'published', faculty_user_id, 'csv', '2026-09-04', 'Prelim', 'CSV-import demonstration assessment.');

  insert into public.assessment_results(assessment_id, enrollment_id, score, source, approval_status, recorded_by) values
    (quiz_id, 'a4000000-0000-0000-0000-000000000001', 28, 'manual', 'approved', faculty_user_id),
    (quiz_id, 'a4000000-0000-0000-0000-000000000002', 24, 'manual', 'approved', faculty_user_id),
    (quiz_id, 'a4000000-0000-0000-0000-000000000003', 20, 'manual', 'approved', faculty_user_id),
    (quiz_id, 'a4000000-0000-0000-0000-000000000004', 29, 'manual', 'approved', faculty_user_id),
    (quiz_id, 'a4000000-0000-0000-0000-000000000005', 18, 'manual', 'approved', faculty_user_id),
    (quiz_id, 'a4000000-0000-0000-0000-000000000006', 15, 'manual', 'approved', faculty_user_id),
    (project_id, 'a4000000-0000-0000-0000-000000000001', 91, 'import', 'approved', faculty_user_id),
    (project_id, 'a4000000-0000-0000-0000-000000000002', 84, 'import', 'approved', faculty_user_id),
    (project_id, 'a4000000-0000-0000-0000-000000000003', 72, 'import', 'approved', faculty_user_id),
    (project_id, 'a4000000-0000-0000-0000-000000000004', 96, 'import', 'approved', faculty_user_id),
    (project_id, 'a4000000-0000-0000-0000-000000000006', 58, 'import', 'approved', faculty_user_id);

  insert into public.attendance_sessions(id, class_record_id, session_date, label, created_by) values
    ('a7000000-0000-0000-0000-000000000001', class_id, '2026-08-10', 'Lecture 1', faculty_user_id),
    ('a7000000-0000-0000-0000-000000000002', class_id, '2026-08-17', 'Lecture 2', faculty_user_id),
    ('a7000000-0000-0000-0000-000000000003', class_id, '2026-08-24', 'Laboratory 1', faculty_user_id);

  insert into public.attendance_records(attendance_session_id, enrollment_id, status, recorded_by)
  select session_id, enrollment_id, attendance_status, faculty_user_id
  from (values
    ('a7000000-0000-0000-0000-000000000001'::uuid, 'a4000000-0000-0000-0000-000000000001'::uuid, 'present'),
    ('a7000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000002', 'present'),
    ('a7000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000003', 'late'),
    ('a7000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'present'),
    ('a7000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000005', 'absent'),
    ('a7000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000006', 'absent'),
    ('a7000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000001', 'present'),
    ('a7000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000002', 'late'),
    ('a7000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000003', 'absent'),
    ('a7000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000004', 'present'),
    ('a7000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000005', 'present'),
    ('a7000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000006', 'absent'),
    ('a7000000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000001', 'present'),
    ('a7000000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000002', 'present'),
    ('a7000000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000003', 'present'),
    ('a7000000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000004', 'present'),
    ('a7000000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000005', 'excused'),
    ('a7000000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000006', 'late')
  ) as attendance(session_id, enrollment_id, attendance_status);

  insert into public.performance_evaluations(enrollment_id, criteria_set_id, score, classification, risk_level, explanation, calculated_by) values
    ('a4000000-0000-0000-0000-000000000001', criteria_id, 94, 'excellent', 'low', '{"basis":"current approved scores and attendance"}', faculty_user_id),
    ('a4000000-0000-0000-0000-000000000002', criteria_id, 84, 'passing', 'low', '{"basis":"current approved scores and attendance"}', faculty_user_id),
    ('a4000000-0000-0000-0000-000000000003', criteria_id, 70, 'at_risk', 'medium', '{"factors":["attendance","current standing"]}', faculty_user_id),
    ('a4000000-0000-0000-0000-000000000004', criteria_id, 97, 'excellent', 'low', '{"basis":"current approved scores and attendance"}', faculty_user_id),
    ('a4000000-0000-0000-0000-000000000005', criteria_id, 60, 'at_risk', 'medium', '{"factors":["missing assessment","attendance"]}', faculty_user_id),
    ('a4000000-0000-0000-0000-000000000006', criteria_id, 54, 'at_risk', 'high', '{"factors":["low scores","attendance"]}', faculty_user_id);

  select id into model_id from public.model_versions
  where name = 'APMS synthetic logistic prototype' and version = 'synthetic-logistic-demo-v1';
  if model_id is null then
    insert into public.model_versions(name, version, status, feature_schema, metrics)
    values ('APMS synthetic logistic prototype', 'synthetic-logistic-demo-v1', 'testing',
      '{"features":["current_standing","recent_trend","attendance_rate","missing_assessments"]}',
      '{"institutionally_validated":false,"dataset":"controlled synthetic demonstration"}')
    returning id into model_id;
  end if;

  insert into public.prediction_criteria(id, class_record_id, name, scenario, parameters, status, created_by)
  values (prediction_criteria_id, class_id, 'Current standing advisory', 'stable',
    '{"passingThreshold":75,"advisoryOnly":true}', 'active', faculty_user_id);
  insert into public.prediction_runs(id, class_record_id, model_version_id, prediction_criteria_id, input_snapshot, status, initiated_by, started_at, completed_at)
  values (prediction_run_id, class_id, model_id, prediction_criteria_id,
    '{"source":"fictional seeded monitoring data","institutionallyValidated":false}', 'completed', faculty_user_id, now(), now());
  insert into public.performance_predictions(prediction_run_id, enrollment_id, predicted_score, trend, risk_level, confidence, explanation) values
    (prediction_run_id, 'a4000000-0000-0000-0000-000000000001', 93, 'stable', 'low', 0.89, '{"advisory":true,"factors":["strong current standing"]}'),
    (prediction_run_id, 'a4000000-0000-0000-0000-000000000002', 83, 'stable', 'low', 0.78, '{"advisory":true,"factors":["passing current standing"]}'),
    (prediction_run_id, 'a4000000-0000-0000-0000-000000000003', 69, 'declining', 'medium', 0.74, '{"advisory":true,"factors":["attendance pattern","current standing"]}'),
    (prediction_run_id, 'a4000000-0000-0000-0000-000000000004', 96, 'stable', 'low', 0.91, '{"advisory":true,"factors":["strong current standing"]}'),
    (prediction_run_id, 'a4000000-0000-0000-0000-000000000005', 62, 'declining', 'medium', 0.81, '{"advisory":true,"factors":["missing assessment","attendance"]}'),
    (prediction_run_id, 'a4000000-0000-0000-0000-000000000006', 55, 'declining', 'high', 0.86, '{"advisory":true,"factors":["low scores","attendance"]}');

  insert into public.import_jobs(id, type, scope_type, scope_id, status, total_count, success_count, failure_count, initiated_by, completed_at, file_name, import_kind, column_mapping, summary)
  values ('aa000000-0000-0000-0000-000000000001', 'csv', 'class_record', class_id, 'completed', 6, 5, 1, faculty_user_id, now(), 'schema-project-scores.csv', 'scores',
    '{"student_id":"institutional_id","score":"score"}', '{"note":"fictional CSV import demonstration"}');

  insert into public.import_job_rows(import_job_id, row_number, raw_data, normalized_data, status, errors) values
    ('aa000000-0000-0000-0000-000000000001', 1, '{"student_id":"SWU-2026-1001","score":"91"}', '{"institutional_id":"SWU-2026-1001","score":91}', 'imported', '[]'),
    ('aa000000-0000-0000-0000-000000000001', 2, '{"student_id":"SWU-2026-1005","score":""}', null, 'invalid', '["score is required"]');

  insert into public.events(id, department_id, title, description, category, priority, starts_at, ends_at, audience, status, created_by)
  values ('ab000000-0000-0000-0000-000000000001', cit_id, 'BSIT-3A At-Risk Review', 'Faculty and Academic Admin review current monitoring indicators.', 'meeting', 'high', '2026-09-08 09:00+08', '2026-09-08 10:00+08', '{"roles":["faculty","academic_admin"]}', 'scheduled', faculty_user_id);

  insert into public.system_settings(key, value, updated_by) values
    ('security.session_minutes', '60', system_admin_id),
    ('security.mfa_required_roles', '["system_admin"]', system_admin_id),
    ('backup.retention_days', '30', system_admin_id),
    ('ai.enabled', 'true', system_admin_id)
  on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now();

  insert into public.audit_logs(actor_id, action, entity_type, after_data)
  values (system_admin_id, 'seed.revised_dataset_created', 'system',
    '{"fictional":true,"roles":["system_admin","academic_admin","faculty"],"students":6,"classes":1}');
end
$$;

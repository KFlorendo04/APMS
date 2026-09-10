# Database Schema

The existing connected Supabase project is retained. All exposed public tables use RLS; grants make the Data API surface reachable to authenticated users and policies restrict rows.

## Identity and scope

- `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles`, `invitations`
- `departments`, `programs`, `faculty_profiles`
- Roles after alignment: `system_admin`, `academic_admin`, `faculty`

## Academic records

- `academic_terms`, `subjects`, `class_records`, `class_record_versions`, `faculty_assignments`
- `students`: minimum monitoring identity; `profile_id` remains optional
- `enrollments`: student-to-class membership
- `criteria_sets`, `criteria_nodes`: versioned weights and passing threshold; active sets total 100%; SWUNEXT Global Modules criteria use the 55% effortful learning and 45% mastery structure
- `assessments`: category/type, SWUNEXT `component_key`, optional module number, maximum, date, period, source (`manual`, `csv`), and optional external reference
- `assessment_results`: one score per assessment/enrollment; absence is missing while numeric zero is an actual score

## Attendance and imports

- `attendance_sessions`: unique class/date/label session owned by Faculty
- `attendance_records`: one enrollment status per session (`present`, `absent`, `late`, `excused`)
- `import_jobs`: file kind, mapping, counts, and summary
- `import_job_rows`: preview/validation rows, normalized values, errors, and final status

## Performance, AI, feedback, and operations

- `performance_evaluations`: deterministic current/provisional standing
- `model_versions`, `prediction_criteria`, `prediction_runs`, `performance_predictions`: traceable advisory inference
- `feedback_templates`, `feedback_records`, `delivery_attempts`: Faculty-reviewed workflow
- `notifications`, `events`, `integrations`, audit/access/system logs, backups/restores, and settings

## Important RLS rules

- Faculty class access requires an active assignment and assigned permissions.
- Academic Admin reads classes/students/attendance only inside its department/program scope.
- System Admin technical permissions do not imply academic editing.
- Attendance writes require assigned-class access and matching enrollment/class relationships.
- Import rows belong to the initiating user; malformed rows are validated rather than silently imported.
- Audit/log editing is not granted to ordinary users.

Legacy `grader_assignments`, `grader_submissions`, and `grader_reviews` remain temporarily for historical retention, but authenticated client writes are revoked and no active role uses them. Dropping them requires explicit data-retention approval.

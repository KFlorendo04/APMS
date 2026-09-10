# Data Model

No ERD or database schema was present in the repository or manuscript. This relational model is derived from explicit domain inputs/outputs, context/use-case/DFD stores, and Figma fields. Items marked **A** are normalized implementation assumptions.

## Identity and authorization

- `profiles`: identity-provider user ID, email, display name, status, contact/profile fields, last login, timestamps.
- `roles`: stable key and display label for the six thesis roles.
- `permissions`: namespaced operation keys.
- `role_permissions`: many-to-many role mapping.
- `user_roles`: user, role, scope type/ID, grantor, validity dates.
- `invitations`: email, intended role/scope, inviter, token digest, status, expiry.
- `sessions`/identity-provider sessions: session metadata and revocation; passwords remain in the identity provider.

## Academic organization

- `departments`: four initial fictional-development SWUNEXT units; configurable.
- `programs`: department-owned degree programs.
- `academic_terms`: academic year, semester/period, start/end, status.
- `subjects`: code, title, department/program ownership, units/status.
- `academic_guidelines`: scope, title, content/reference, version, status, effective dates.
- `class_record_templates`: scope, name, version, status, structure JSON for configurable columns **A**.
- `class_records`: subject, section, term, template version, owning department, status, assigned faculty, timestamps/version.
- `class_record_versions`: immutable snapshots, actor, reason, created timestamp **A**.
- `faculty_assignments`: faculty, class record, role, active dates.

## People and enrollment

- `students`: profile linkage (optional until invited), institutional student ID, program, year level, status.
- `faculty_profiles`: profile, department, position, employment/status metadata.
- `enrollments`: student, class record, section/status, enrollment dates; unique active student/class pair.

## Criteria, assessment, and grader workflow

- `criteria_sets`: owner scope, term/class/template link, version, status, total weight.
- `criteria_nodes`: criteria set, parent node, type (`period`, `component`, `assessment_category`), label, weight, ordering, formula metadata.
- `assessments`: class record, criteria node, title/type, maximum score, due/conducted dates, status.
- `assessment_results`: assessment, enrollment, score, attendance/engagement metadata, source, approval state, optimistic-lock version.
- `grader_assignments`: grader, assessment/class, assigning faculty, status, due date.
- `grader_submissions`: assignment, submitted payload/version, status, submitted timestamp.
- `grader_reviews`: submission, reviewer, decision, reason, reviewed timestamp.

## Evaluation, prediction, and feedback

- `performance_evaluations`: enrollment, criteria-set version, current grade/score, classification, risk level, explanation, calculated timestamp.
- `prediction_criteria`: scope, scenario (`minimum`, `maximum`, `minimum_pass`, `stable`, custom), parameters, version/status.
- `model_versions`: model name/version, artifact/config reference, approval/status, metrics metadata **A**.
- `prediction_runs`: initiator, scope, model version, input snapshot/version, status, timing/error metadata.
- `performance_predictions`: run, enrollment, predicted score/grade, trend, risk level, confidence, explanation/features.
- `feedback_templates`: scope, category, title, body template, status.
- `feedback_records`: student/enrollment, author, evaluation/prediction references, draft/final body, classification, status, sent timestamp.
- `delivery_attempts`: feedback/notification, channel, provider ID, status, error-safe message, timestamps **A**.

## Operations

- `notifications`: recipient, type, title/body, entity reference, read timestamp, created timestamp.
- `notification_preferences`: user, event type, in-app/email flags.
- `events`: department/program owner, category, priority, title, description, start/end, audience/status.
- `integrations`: provider, scope, encrypted credential reference, status/config; no raw secret in the database export.
- `import_jobs`: source/integration, type, scope, status, counts, sanitized error summary, actor/timestamps.
- `audit_logs`: actor, action, entity type/ID, before/after safe metadata, request/correlation ID, timestamp.
- `access_logs`: actor/session, route/action, outcome, IP/user-agent policy fields, timestamp.
- `system_logs`: severity, subsystem, event code, safe message/metadata, timestamp.
- `backups`: scope/type, provider reference, checksum/size, status, creator, timestamps.
- `backup_restores`: backup, actor, status, reason, timestamps, safe error summary.
- `system_settings`: namespaced non-secret configuration with type and version.

## Key constraints and indexes

1. Foreign keys use restrictive deletion for academic evidence; archival/status changes are preferred over destructive cascades.
2. Unique: normalized email, institutional student ID, role key, permission key, active enrollment pair, assessment result `(assessment_id, enrollment_id)`.
3. Check: scores and maximums non-negative; weights 0-100; active criteria-set total equals 100 before activation; confidence 0-1; start dates do not exceed end dates.
4. Index all foreign keys plus common query combinations: owner/scope/status, class/term, enrollment/student, result/assessment, risk/timestamp, notification recipient/read, and audit actor/entity/timestamp.
5. Multi-step approval, criteria activation, restore, import, and result updates run in transactions.
6. Mutable domain rows carry `created_at`, `updated_at`, and an optimistic `version` where concurrent editing is material.


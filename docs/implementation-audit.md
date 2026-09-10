# Revised Thesis Implementation Audit

Audit date: 2026-08-26. Sources reviewed: `SWU-001 - Manuscript - Revised.docx`, the connected Supabase schema, repository migrations, Expo application, shared domain package, tests, and FastAPI AI service.

## Existing implementation

- Expo SDK 57 / React Native / Expo Router frontend with Supabase Auth session persistence, password reset, and optional Google OAuth entry points.
- Shared TypeScript domain package for grading, validation, permissions, and reports.
- Existing Supabase project with RLS-enabled academic, prediction, feedback, import, audit, and operations tables.
- FastAPI AI boundary that previously refused all inference without an unspecified artifact.
- Faculty demo screens, generic admin screens, and Playwright/Vitest tests.

## Working modules retained

- Existing Supabase connection, Auth provider, and environment variables.
- Scoped RLS helpers, audit triggers, profiles, academic units, terms, subjects, classes, assignments, enrollments, criteria, assessments/results, predictions, feedback, logs, and settings.
- Reusable shell, cards, tables, charts, fields, dialogs, notifications, and responsive navigation.
- Existing class, student, feedback, analytics, settings, and report scaffolding.

## Broken, incomplete, or obsolete findings

- Six authenticated roles contradicted the revised manuscript. Student and Grader portals existed; System Operator and Super Admin split one revised role.
- No attendance tables or roll-call workflow existed.
- Assessments lacked normalized source, assessment date, grading period, description, and external reference fields.
- CSV jobs lacked per-row preview/validation/error persistence and domain CSV validation.
- Academic Admin held day-to-day score/class management privileges beyond the revised oversight role.
- Grader code, data, tests, permissions, and assignments remained active.
- The AI service had only an unavailable adapter and could never meet the mandatory prototype requirement.
- Documentation incorrectly stated that no Supabase project was connected and described six roles.

## Database findings

- The live database matched the checked-in historical migrations, with RLS on every public table.
- Live legacy role counts were one user each for Student, Grader, Faculty, Academic Admin, System Operator, and Super Admin.
- Three Grader assignments existed; no Grader submissions, reviews, or Grader-sourced results existed. This permits a low-risk access migration while retaining history.
- No attendance tables existed. Existing `assessment_results` represents missing work by absence of a row, preserving the distinction between missing and zero.
- Security helpers are in a non-exposed `private` schema. New policies continue this pattern and explicitly grant needed Data API access.

## AI findings

- No real SWU training dataset, longitudinal cohort, approved target definition, trained artifact, metrics, imbalance analysis, or SHAP artifact was present.
- The manuscript permits a controlled synthetic prototype but prohibits institutional accuracy claims.
- The implementation therefore uses an isolated, deterministic logistic classifier trained on controlled synthetic examples, exposes its data basis and limitation, and keeps normal records/calculations independent of inference availability.

## Implemented alignment

- Core authenticated roles reduced to System Admin, Academic Admin, and Faculty.
- Safe migration merges technical-admin permissions/assignments, deactivates legacy Grader access, revokes assignments, removes Student portal-role assignments, and preserves legacy Grader tables read-only.
- Attendance, assessment metadata, passing thresholds, CSV validation storage, indexes, RLS, grants, and audit triggers added.
- Faculty navigation now centers classes, gradebook, attendance, students, at-risk monitoring, criteria, feedback, reports, and AI prediction.
- Provisional-standing, missing-score, attendance-rate, trend, CSV, and prediction contracts added with tests.
- The production Faculty portal now provides durable class, manual/CSV roster, assessment, batch-score, attendance, criteria, feedback, report, and AI-prediction workflows.
- The production Academic Admin portal now loads live department-scoped classes and programs, aggregate student/current-standing/attendance/risk views, versioned criteria configuration, and CSV reporting.
- The production System Admin portal now loads live users, roles, settings, backup requests, and audit logs. A protected Edge Function implements account creation and role/scope/status/password management without exposing service-role credentials to Expo.
- SWUNEXT Global Modules grading is implemented in the shared domain package and live portals: Start of Class is binary, Let's Practice/Reflection use the 0-3 transmutation, wrap-ups/project scores use direct percentages, P1/P2 are running cumulative views, final grade uses P3 effort at 55% plus FE mastery at 45%, and passing requires both final grade and mastery to reach 80%.

## Institutional dependencies and gaps

- No SWU SIS integration is implemented or assumed; SIS remains external and authoritative.
- No Google Classroom synchronization is implemented because no authorized credentials/scopes or working adapter exist.
- Production AI validation/retraining requires approved, de-identified real data, methodology, and privacy review.
- Custom email, production backup operations, and institution-wide deployment require institutional providers, credentials, and IT authorization.

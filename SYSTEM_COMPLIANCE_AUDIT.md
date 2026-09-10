# System Compliance Audit

Audit date: 2026-08-08

Primary source of truth: `docs/SWU-001 - Manuscript.docx`.

Supporting derived sources: `docs/analysis/SYSTEM_REQUIREMENTS.md`, `docs/analysis/ROLE_PERMISSION_MATRIX.md`, `docs/analysis/DATA_MODEL.md`, and the current codebase. The DOCX was extracted to `tmp/thesis_text.txt` for paragraph-level traceability; references below cite the manuscript paragraph numbers produced by that extraction.

Verification performed during this audit:

- `npm run typecheck`: passed.
- `npm test`: passed, 12 domain tests.
- `npm run test:schema`: passed, 44 tables and 9 application contracts.
- `.venv\Scripts\python.exe -m pytest services\ai\tests -q`: passed, 2 AI service tests; warnings only.
- `npm run test:e2e`: passed, 13 Playwright tests. Important limitation: `playwright.config.ts` runs the app with `EXPO_PUBLIC_DEMO_MODE=true`, so these tests verify demo routing/local validation, not production Supabase Auth/RLS/persistence.
- `npm run build`: passed, static Expo web export.
- `npm run lint`: passed.

## 1. Executive Summary

Overall compliance level: **Partially compliant prototype / schema foundation, not thesis-complete**.

The implemented system has meaningful foundations: an Expo/React Native web/mobile frontend, six-role routing, Supabase Auth integration, a broad 44-table Supabase schema, RLS policies, static schema verification, domain tests for permissions/calculations/workflows, a fail-closed AI service boundary, and demo-mode UI flows that no longer fabricate model output.

The system still does **not** fully match the thesis. The thesis describes an operational end-to-end APMS that creates accounts and roles, imports/creates academic data, manages class records and criteria, records assessments, calculates grades, runs AI prediction, generates/sends feedback by email, shows real dashboards/reports, logs privileged actions, and supports backups. Current implementation is mostly demo/localStorage UI plus read-only Supabase table views and schema scaffolding. Most thesis-critical workflows are missing their production forms, server transactions, workers, imports/exports, live database tests, and provider integrations.

Major missing functionality:

- Email MFA/OTP challenge, invitation acceptance, account lifecycle, and production user/role administration.
- Durable student/faculty/class record/template/guideline/assessment/result CRUD workflows.
- Grader assignment -> draft -> submit -> faculty approve/reject -> official calculation UI/service flow.
- Criteria editor, criteria version activation, formula persistence, and automatic recalculation orchestration.
- Approved ML model adapter, feature schema, prediction worker, model-run provenance, and scenario predictions.
- Grounded AI-assisted feedback generation, preview, email/account delivery, retry, and audit.
- LMS adapter/import mapping/job execution, CSV/JSON/PDF exports, backup provider/restore/delete lifecycle, and comprehensive logging.

Major thesis/system contradictions:

- Thesis expects an operational AI/ML prediction and feedback chain; current AI service intentionally returns unavailable/501 without a supplied model adapter.
- Thesis expects real-time dashboards from stored records; current demo dashboards/charts use mock constants and production dashboards expose only limited counts.
- Thesis expects server-enforced, least-privilege workflows; current Playwright acceptance path uses demo accounts and localStorage, not live Auth/RLS/database persistence.
- Thesis mockups require searchable/sortable/filterable/paginated/drill-down records; current generic tables are mostly client-filtered string rows without stable record IDs or detail routes.

Critical integration gaps:

- Frontend demo workflows are disconnected from production Supabase writes for most academic operations.
- Schema tables exist without worker/process consumers for prediction runs, feedback delivery, import jobs, notifications, and backups.
- Auth settings store `mfa_required`, but authentication does not enforce a six-digit email OTP/MFA challenge.
- Dashboard/report/analytics UI is not connected to the full calculated evaluation/prediction data sources.
- Access logs/system logs are modeled but not comprehensively written by application/Auth events.

Highest-risk incomplete areas:

- Core academic transaction chain.
- Authentication/account lifecycle and authorization verification.
- AI/prediction/feedback delivery.
- Production database execution/RLS test coverage.
- Backup/restore and auditability.

## 2. Compliance Matrix

| ID | Thesis Requirement | Thesis Reference | System Evidence | Status | Gap / Mismatch | Severity | Required Action |
|---|---|---|---|---|---|---|---|
| FR-AUTH-001 | Authenticate with email/password. | Manuscript 1093; `SYSTEM_REQUIREMENTS.md` FR-AUTH-001 | `apps/mobile/src/auth/AuthProvider.tsx:66-82`; login UI `apps/mobile/src/app/index.tsx`; E2E auth tests pass in demo mode. | Partially compliant | Supabase password flow exists when configured, but acceptance tests use demo credentials/localStorage, not live Supabase Auth. | High | Add production Auth integration tests with Supabase seed users and disabled/inactive accounts. |
| FR-AUTH-002 | Six-digit email OTP/MFA challenge where configured. | Manuscript 1093; FR-AUTH-002 | `apps/mobile/src/services/actions.ts:35,64` stores `mfaRequired`; no OTP/MFA challenge code found. | Missing | MFA is a setting value only; no challenge screen, provider enforcement, AAL check, or recovery flow. | Critical | Implement Supabase MFA/email OTP enrollment, challenge, enforcement, and tests. |
| FR-AUTH-003 | Google sign-in where provider is available. | Manuscript 1093; FR-AUTH-003 | `AuthProvider.tsx:96-110`; login UI button in `index.tsx`; no E2E/provider verification. | Partially compliant | OAuth start exists, but provider/callback/role-profile resolution is unverified. | Medium | Add configured-provider test plan and callback/session/profile validation. |
| FR-AUTH-004 | Password recovery. | Manuscript 1093; FR-AUTH-004 | `AuthProvider.tsx:86-95`. | Partially compliant | Supabase reset wrapper exists; no E2E/manual evidence in configured mode. | Medium | Add reset request E2E/mock provider test and recovery callback handling. |
| FR-AUTH-005 | Remember login locally without plaintext password. | Manuscript 1093; FR-AUTH-005 | Remembered email key in `apps/mobile/src/app/index.tsx`; demo session key `AuthProvider.tsx:22-23,48-52`. | Partially compliant | Demo session persists user ID; production uses Supabase persisted session. Need policy for session expiration/revocation. | Medium | Document storage policy and add session expiry/revocation tests. |
| FR-AUTH-006 | Accept account invitations from authorized provisioners. | Manuscript 1076, 1085; FR-AUTH-006 | `invitations` table in `202608060001_initial_apms.sql:89-100`; policy `:710`. | Missing | No invitation creation UI, token acceptance route, protected Auth/admin worker, or lifecycle emails. | Critical | Build invitation issue/accept/revoke workflows with service-role worker and audit. |
| FR-AUTH-007 | Route authenticated users to correct role dashboard. | Manuscript 1093; FR-AUTH-007 | `navigation.ts:15-18`; `RouteGuard.tsx`; `portal/[role]/[view].tsx`; Playwright role tests pass. | Fully compliant for routing shell | Routing/redirect behavior works in demo and code supports profile role lookup. Production role-resolution still needs live Auth test. | Medium | Add live Auth/RLS route tests. |
| FR-AUTH-008 | Enforce RBAC, least privilege, separation of duties server-side. | Manuscript 1082-1085; FR-AUTH-008; `ROLE_PERMISSION_MATRIX.md` | Domain permission map `permissions.ts:45-74`; RLS policies `initial_apms.sql:695-831`; hardening migration `20260806125202...:3-128`. | Partially compliant | Policies and helpers exist, but no live PostgreSQL/RLS adversarial test. Some global read policies remain broad: reference tables/model versions read true, events read true, feedback templates read true. | Critical | Run DB migrations locally/CI, add adversarial RLS tests for every role/scope and adjust broad policies as needed. |
| FR-AUTH-009 | Block inactive/disabled accounts and record auth events. | Manuscript 1085; FR-AUTH-009 | Inactive profile blocked in `AuthProvider.tsx:27-35,77-80`; `access_logs` table `initial_apms.sql:493-503`. | Partially compliant | Block exists after login/profile read; access/auth events are not comprehensively written. | High | Add Auth event logging function/edge hook, inactive account tests, and access-log UI filters. |
| FR-AUTH-010 | Logout and session revocation/expiration. | FR-AUTH-010 | `AuthProvider.tsx:85`; settings stores `session_timeout_minutes` in `actions.ts:51-69`. | Partially compliant | Logout works; no session list, remote revocation, expiration enforcement, or sensitive-action reauth policy beyond password change. | Medium | Implement session management and expiration enforcement. |
| FR-ACAD-001 | Manage academic guidelines/grading policies. | Manuscript 1076, 1082; FR-ACAD-001 | Table `academic_guidelines` `initial_apms.sql:142-155`; policies `hardening:99-110`; generic table screen only. | Missing | No dedicated UI/service CRUD/version/approval/export. | High | Build guideline module with versioning, scope checks, publish/archive, audit. |
| FR-ACAD-002 | Create/import/view/edit/export/delete/version class-record templates. | Manuscript 1076, 1082, 1107; FR-ACAD-002 | Table `class_record_templates` `initial_apms.sql:157-168`; policies `hardening:112-123`. | Missing | No template UI/service, import/export, version restore, or generation workflow. | High | Implement template CRUD/import/export/versioning with acceptance tests. |
| FR-ACAD-003 | Create/import class records with subject, section, term, faculty, students, structure. | Manuscript 1076, 1099, 1107; FR-ACAD-003 | Tables `class_records` `initial_apms.sql:170-180`, `faculty_assignments`, `enrollments`; generic records read `records.ts:27-29`; faculty demo local state. | Partially compliant | Schema and read views exist; production create/import/edit/delete/detail/version are missing. | Critical | Build transactional class-record create/import/edit/assign/enroll workflow. |
| FR-ACAD-004 | Search/sort/filter/paginate/view/edit/export/delete class records. | Manuscript 1099, 1107; FR-ACAD-004 | Client filter in `AppPortalScreen.tsx:611-631`; no sort/pagination/export code. | Partially compliant | Search filters loaded rows only; no server sort/page/count, stable detail route, edit/export/delete. | High | Add server query parameters, row IDs, detail/edit/export/delete controls. |
| FR-ACAD-005 | Assign faculty to class records and graders to assessments. | Manuscript 1082; FR-ACAD-005 | Tables `faculty_assignments`, `grader_assignments` `initial_apms.sql:196-206,260-269`; no UI/service. | Missing | No assignment workflow, validation, notification, or audit. | Critical | Implement assignment forms/RPCs and role notifications. |
| FR-ACAD-006 | Retain class-record version history and restore. | Manuscript 1099; FR-ACAD-006 | `class_record_versions` table `initial_apms.sql:185-192`; read/manage policies `:762-765`. | Missing | No automatic snapshot trigger, restore action, detail/history UI, or tests. | High | Add version snapshot trigger/service and restore workflow. |
| FR-ACAD-007 | Controlled LMS integration/imports. | Manuscript 216, 244, 1076; FR-ACAD-007 | `integrations`/`import_jobs` tables `initial_apms.sql:452-479`; system settings UI connection text `AppPortalScreen.tsx:804-808`. | Missing | No adapter, credential vault, provider test, mapping preview, job worker, partial-failure handling. | High | Build controlled LMS/import adapter framework with unavailable state until configured. |
| FR-PEOPLE-001 | Maintain student directory fields/status. | Manuscript 1097, 1109; FR-PEOPLE-001 | `students` table includes institutional ID, names, year/status/program `initial_apms.sql:114-129`; production read `records.ts:22-25`. | Partially compliant | Schema/read exist; no durable create/edit/profile/status/remarks workflow for production. | High | Implement student CRUD/profile/status/enrollment workflows. |
| FR-PEOPLE-002 | Add students manually or import CSV/class list. | Manuscript 1109; FR-PEOPLE-002 | Faculty demo add uses `usePersistentDemoState` `FacultyPortalContent.tsx:179-247`; generic production action throws `actions.ts:18`. | Partially compliant | Demo/localStorage only; no production insert/import/duplicate checks. | High | Add validated production form and CSV/text import preview/commit. |
| FR-PEOPLE-003 | Maintain faculty directory and assignments. | Manuscript 1082, 1107; FR-PEOPLE-003 | `faculty_profiles` table `initial_apms.sql:103-112`; read `records.ts:43-45`; navigation `navigation.ts:35-40`. | Partially compliant | Directory read only; no invite/edit/assign/status workflow. | High | Implement faculty invitation, profile management, and class assignment. |
| FR-PEOPLE-004 | Open profiles and linked academic records. | Manuscript 1097, 1109; FR-PEOPLE-004 | Generic details concatenate selected row strings `AppPortalScreen.tsx:680-697`. | Partially compliant | No stable record ID, routed profile/detail page, linked enrollments/records/history. | Medium | Add record IDs, detail routes, linked academic tabs. |
| FR-PEOPLE-005 | Unenroll student with confirmation/audit. | FR-PEOPLE-005 | `enrollments` table; audit trigger covers `enrollments` `hardening:159-164`; no UI/service. | Missing | No unenroll control, reason, confirmation, notification, or tests. | High | Implement unenroll transaction with audit and optional notification. |
| FR-GRADE-001 | Define customizable nested criteria: periods/components/categories. | Manuscript 230, 1111; FR-GRADE-001 | `criteria_sets` and `criteria_nodes` tables `initial_apms.sql:218-244`. | Partially compliant | Schema exists; UI lists criteria sets only; no nested editor/reorder/version activation. | Critical | Build nested criteria editor and criteria-node CRUD. |
| FR-GRADE-002 | Validate weights total 100%. | Manuscript 1111; FR-GRADE-002 | Domain validation `calculations.ts:3-13`; DB check active total 100 `initial_apms.sql:223-229`. | Partially compliant | Backend/domain primitive exists; UI lacks complete editor feedback and activation transaction. | High | Connect UI criteria editor to DB transaction and tests. |
| FR-GRADE-003 | Record exams/quizzes/assignments/projects/attendance/participation/other results. | Manuscript 214, 228, 787-821, 920; FR-GRADE-003 | `assessments` and `assessment_results` tables `initial_apms.sql:246-305`; grader demo grading `GraderPortalContent.tsx:249-369,494-620`. | Partially compliant | Demo-only entry; no production write/import grid; attendance/participation are only free-form assessment types. | Critical | Implement production result entry/import grid with category validation. |
| FR-GRADE-004 | Import/view/edit/export/delete assessment results. | Manuscript 1076, 1105; FR-GRADE-004 | Production `records.ts:35-37` reads grades; no import/export/edit/delete. | Partially compliant | Read path only. | High | Add assessment/result CRUD/import/export with RLS and tests. |
| FR-GRADE-005 | Automatically calculate grades from approved formulas/results. | Manuscript 1076; FR-GRADE-005 | Pure function `calculateWeightedPercentage` `calculations.ts:9-22`; tests pass. | Partially compliant | Function is not wired to assessment result mutations, criteria versions, evaluations, dashboards, or persisted outputs. | Critical | Implement calculation service/RPC/job invoked after approved result/criteria changes. |
| FR-GRADE-006 | Grader submits results; faculty approves/rejects; status visible. | Manuscript 1082; FR-GRADE-006 | Status transition helper `workflows.ts:3-16`; DB tables; review RPC `initial_apms.sql:639-680`; grader demo only saves local grade `GraderPortalContent.tsx:332-347`. | Partially compliant | Backend review RPC exists, but no production UI/service for assignment, submit, review, rejection reason, resubmission, status history. | Critical | Build full grader/faculty review workflow and E2E tests. |
| FR-GRADE-007 | Submission states draft/submitted/approved/rejected. | Derived requirement; FR-GRADE-007 | `grader_submissions.status` check `initial_apms.sql:271-280`; domain transition tests pass. | Partially compliant | State model exists; not connected end-to-end. | High | Wire states to UI/service/RPC and role dashboards. |
| FR-GRADE-008 | Prevent duplicate active assessment results. | FR-GRADE-008 | Unique `(assessment_id, enrollment_id)` `initial_apms.sql:292-305`. | Partially compliant | Constraint exists; no UX for duplicate handling/concurrency. | Medium | Add conflict handling and tests against live DB. |
| FR-AI-001 | Evaluate/classify current performance from configured criteria/indicators. | Manuscript 229, 1076, 1112; FR-AI-001 | `performance_evaluations` table `initial_apms.sql:319-330`; `summarizePerformance` `calculations.ts:24-32`. | Partially compliant | No evaluation job/RPC, no persisted calculation flow, no filters/export. | Critical | Implement evaluation pipeline from approved results and criteria version. |
| FR-AI-002 | Predict future assessment/overall performance. | Manuscript 229, 1076, 1112; FR-AI-002 | AI service returns 503/501 without model `services/ai/src/apms_ai/main.py:26-44`; prediction tables exist. | Missing, fail-closed correctly | No approved model artifact, feature schema, adapter, worker, or run execution. | Critical | Supply approved model contract and implement prediction worker/service. |
| FR-AI-003 | Prediction scenarios min/max/min-pass/stable/current trend. | Manuscript 1113; FR-AI-003 | `prediction_criteria.scenario` check `initial_apms.sql:332-340`. | Partially compliant | Schema permits scenarios; no UI/service or scenario execution. | High | Implement criteria UI and scenario execution tests. |
| FR-AI-004 | Show current grade, predicted grade, trend, risk, confidence where available. | Manuscript 1113; FR-AI-004 | Student metrics read predicted score if table has rows `dashboard.ts:127-177`; assistant/unavailable states `AppPortalScreen.tsx:1206-1227`. | Partially compliant | Correctly unavailable without model; no real predictions/confidence/trend display from runs. | High | Add model-run-backed display with provenance and unavailable fallback. |
| FR-AI-005 | Provide explanations/feature contributions. | Manuscript 610-611, 1076; FR-AI-005 | `performance_predictions.explanation` `initial_apms.sql:360-369`; AI output schema has explanation `main.py:17-23`. | Partially compliant | No SHAP/model explanation implementation or UI. | High | Implement explanation contract and UI rendering. |
| FR-AI-006 | Generate editable personalized feedback using templates/AI. | Manuscript 233, 613, 1076, 1103; FR-AI-006 | Feedback templates/records tables; faculty demo templates/save local feedback `FacultyPortalContent.tsx:647-736`. | Partially compliant | Demo template composer only; no grounded AI generation, persistence, preview, or production send. | Critical | Implement feedback draft generation, edit/preview, save, send. |
| FR-AI-007 | Faculty review/send feedback by email/account notification; audited. | Manuscript 1076, 1082, 1103; FR-AI-007 | `feedback_records`, `delivery_attempts`, `notifications`; demo message explicitly says no notification sent `FacultyPortalContent.tsx:735`. | Missing | No email provider/worker/delivery attempts/status or notification trigger. | Critical | Add feedback send transaction, delivery queue/worker, audit, notification. |
| FR-AI-008 | AI is advisory; does not determine final grades/decisions. | Manuscript 215-216, 235-236, 246; FR-AI-008 | AI service sets `advisory_only=True` `main.py:17-23`; UI marks unavailable/advisory. | Partially compliant | Current fail-closed behavior is aligned; future prediction pipeline must preserve advisory labeling and prevent official auto-decision. | High | Add policy/tests forbidding AI output as official result source. |
| FR-AI-009 | Unavailable inference shows transparent error, never fabricated output. | Derived from thesis limitations; FR-AI-009 | AI service 503/501 `main.py:36-44`; UI unavailable `AppPortalScreen.tsx:1206-1227`, `FacultyPortalContent.tsx:1327-1354`, `GraderPortalContent.tsx:52-57`. | Fully compliant for missing-model behavior | Real AI remains missing, but current unavailable behavior is honest. | Medium | Preserve fail-closed behavior when adding adapter. |
| FR-REPORT-001 | Dashboards use stored/calculated data, not hard-coded metrics. | Manuscript 231, 1095, 1107; FR-REPORT-001 | Demo metrics constants `dashboard.ts:18-37`; production counts `dashboard.ts:59-95,97-177`. | Partially compliant | Production only limited counts/student averages; demo hard-coded; no full calculated dashboards. | High | Replace charts/KPIs with scoped aggregate queries and provenance labels. |
| FR-REPORT-002 | Faculty dashboard specific class/at-risk/average/pass/prediction metrics. | Manuscript 1095; FR-REPORT-002 | Faculty demo `FacultyPortalContent.tsx:65-175`. | Partially compliant | Demo constants; production faculty uses generic staff metrics; no assigned-class detailed aggregates. | High | Implement faculty dashboard query service. |
| FR-REPORT-003 | Dean dashboard totals/pass rate/at-risk/subject charts. | Manuscript 1107; FR-REPORT-003 | Generic dashboard and mock chart data in `mockDashboard.ts`; limited production counts. | Partially compliant | No subject pass/fail/averages from DB. | High | Implement department aggregate dashboard. |
| FR-REPORT-004 | Student dashboard exposes own grades/trends/feedback only. | Manuscript 1082; FR-REPORT-004 | Student role nav `navigation.ts:21-24`; production student metrics query by profile/enrollment `dashboard.ts:97-177`; RLS `feedback_scoped_read`. | Partially compliant | Own data read foundation exists; no real trend/feed detail generated unless data exists. | Medium | Add student detail pages and self-only RLS tests. |
| FR-REPORT-005 | Grader dashboard exposes assigned work/status only. | Manuscript 1082; FR-REPORT-005 | Grader demo constants; generic production staff metrics would be used when demo off. | Non-compliant | Production generic staff loader counts all scoped staff tables rather than grader-specific assignments/status. | High | Build grader-specific assigned-work dashboard query. |
| FR-REPORT-006 | Analytics filters subject/section/student/date/term/score/risk. | Manuscript 1105, 1113; FR-REPORT-006 | Faculty demo filters section/subject/semester `FacultyPortalContent.tsx:780-829`; generic analytics demo only. | Partially compliant | Demo only; no server filters, date/risk/student filters, URL state, or export. | High | Implement analytics query/filter API and UI. |
| FR-REPORT-007 | Export CSV/JSON raw data and PDF reports. | Manuscript 1095, 1099, 1105, 1113; FR-REPORT-007 | Generic action for export labels throws `actions.ts:18`; no file generation. | Missing | No CSV/JSON/PDF export implementation. | High | Add authorized export jobs/downloads with same filters as screen. |
| FR-REPORT-008 | Endpoints support authorization, sort/filter/page/calculated totals. | Manuscript 1097-1113; FR-REPORT-008 | Direct Supabase reads `records.ts:20-67`; client filtering `AppPortalScreen.tsx:615-631`. | Partially compliant | RLS auth exists, but no server pagination/sort/filter/totals. | High | Add RPC/view-backed list APIs with tests. |
| FR-NOTIFY-001 | In-app notifications for assessment/approval/risk/feedback/security/system events. | Manuscript 1095, 1101; FR-NOTIFY-001 | Notifications table and read/update hook `notifications.ts:14-115`; demo notifications `:118-157`. | Partially compliant | Notification center works for existing rows; no event triggers for most thesis events. | High | Add notification triggers/worker from grading, feedback, events, backups, security. |
| FR-NOTIFY-002 | View summaries and all notifications. | FR-NOTIFY-002 | Bell/list hook limits 20 notifications `notifications.ts:37-42`; mark read/all read `:63-105`. | Partially compliant | Summary/read works; no all-notifications page, filters, pagination, preferences fully wired. | Medium | Add notifications page with paginated history and preferences. |
| FR-NOTIFY-003 | Dean manages events/calendar entries with category/priority/dates/audience. | Manuscript 1082; FR-NOTIFY-003 | Event table `initial_apms.sql:435-446`; create service `events.ts:34-50`; dialog from `AppPortalScreen.tsx:340-350`. | Partially compliant | Create exists; no edit/delete, notification audience delivery, calendar views, or production E2E. | Medium | Add full event CRUD, audience notifications, production tests. |
| FR-NOTIFY-004 | APMS assistant answers authorized stored-data queries without bypassing permissions. | Manuscript 1082, 1215-1217 UI code; FR-NOTIFY-004 | Assistant disabled/unavailable `AppPortalScreen.tsx:1206-1227`; no query provider. | Missing, fail-closed correctly | No assistant service exists. | Medium | Implement authorized query provider after RBAC/RLS tests and approved AI policy. |
| FR-ADMIN-001 | System Operator manages users, roles, permissions, auth settings, limits, integrations, logs. | Manuscript 1082-1085; FR-ADMIN-001 | Role/settings/log screens exist; `actions.ts` settings upsert; roles generic read `records.ts:55-57`. | Partially compliant | User/role CRUD and integration testing absent; logs read only; settings partial. | Critical | Build technical admin workflows with protected server functions. |
| FR-ADMIN-002 | Super Admin manages operator/admin accounts, backups, logs. | Manuscript 1082-1085; FR-ADMIN-002 | Super admin nav `navigation.ts:47-51`; admin read `records.ts:59-61`; backup queue action `actions.ts:12-16`. | Partially compliant | Admin account lifecycle absent; backup queue only; logs basic read. | Critical | Build super-admin account/backup/log modules. |
| FR-ADMIN-003 | Backups create/inspect/restore/delete with confirmation/audit. | Manuscript 1082; FR-ADMIN-003 | `backups` and `backup_restores` tables `initial_apms.sql:515-535`; create queue row `actions.ts:12-16`; audit trigger `hardening:159-164`. | Partially compliant | No worker/provider/artifact/checksum execution, inspect detail, restore/delete controls. | Critical | Implement backup worker/provider and lifecycle UI/RPCs. |
| FR-ADMIN-004 | Expose system, notification, security, configurable system settings. | Manuscript 1101; FR-ADMIN-004 | Settings UI `AppPortalScreen.tsx:755-880`; `saveSettings` upserts selected settings `actions.ts:38-69`; security metrics hard-coded `AppPortalScreen.tsx:1180-1191`. | Partially compliant | Many controls are local/hard-coded; MFA setting not enforced; no live telemetry. | High | Wire every displayed setting to enforcement/source data or remove until implemented. |
| FR-ADMIN-005 | Third-party integrations connected/configured by System Operator. | Manuscript 1076, 244; FR-ADMIN-005 | Integration tables and settings UI status; no adapter. | Missing | No real connection/configuration/test. | High | Implement integration adapter framework. |
| NFR-SEC-001 | Authentication, encryption, RBAC, least privilege, separation of duties. | Manuscript 224, 232, 1085; NFR-SEC-001 | Auth/RLS/permissions exist; no application-level encryption beyond provider/TLS documented; broad grants rely on RLS `initial_apms.sql:833-835`. | Partially compliant | Encryption/secret handling not proven; live RLS/advisory tests missing. | Critical | Add security design, secrets policy, live RLS tests, Supabase advisors. |
| NFR-SEC-002 | No plaintext passwords; adaptive KDF via identity provider. | NFR-SEC-002 | Supabase Auth used; demo passwords stored in `apps/mobile/src/data/demo.ts:5-10` for demo only. | Partially compliant | Production likely compliant through Supabase; demo contains plaintext fictional passwords and must never deploy. | High | Enforce demo-mode build gate and document Auth provider guarantees. |
| NFR-SEC-003 | Server input validation, safe access, upload allowlists, CSRF where applicable. | NFR-SEC-003 | Some validation in events `events.ts:34-41`, passwords `actions.ts:72-80`, domain functions. | Partially compliant | Many future writes missing; no upload/import allowlist; direct Supabase errors can surface. | High | Centralize validation schemas/RPCs and import file checks. |
| NFR-SEC-004 | Rate limits for auth and mutations. | NFR-SEC-004 | No app-specific rate-limit code found. | Unverifiable / Missing | Supabase Auth may rate-limit, but no evidence for mutation/API rate limits. | Medium | Add provider config evidence and server-side rate limiting for privileged actions. |
| NFR-PERF-001 | Normal reads complete within 2 seconds at controlled scale. | NFR-PERF-001 | Build/tests pass; indexes exist `initial_apms.sql:548-567`; no performance tests. | Unverifiable | No seeded scale/performance benchmark. | Medium | Add benchmark fixtures and query timing tests. |
| NFR-PERF-002 | Paginated/indexed list endpoints. | NFR-PERF-002 | Indexes exist; `records.ts` no pagination except logs/notifications limit. | Partially compliant | Most list reads are unpaginated and client-filtered. | High | Add server pagination and query indexes for all list views. |
| NFR-ACCESS-001 | WCAG 2.1 AA keyboard/focus/label/contrast semantics. | NFR-ACCESS-001 | Accessibility improvements in shared UI; no formal audit. | Partially compliant / Unverifiable | No automated a11y suite or formal keyboard/contrast matrix. | Medium | Add axe/manual WCAG test matrix. |
| NFR-RESP-001 | Web and mobile-sized clients. | Manuscript 1075; NFR-RESP-001 | Expo web/mobile app; prior conformance says 375px checked; no current full matrix. | Partially compliant | Only limited responsive verification; role/modal matrix pending. | Medium | Test 320/375/768/1024/desktop for all roles/dialogs. |
| NFR-AVAIL-001 | Depends on network/internet; no advanced cloud guarantee. | Manuscript 242-245; NFR-AVAIL-001 | Architecture aligns; no extra distributed guarantees claimed. | Fully compliant | None beyond documentation. | Low | Keep scope clear in docs. |
| NFR-BACKUP-001 | Backups have scope/status/checksum/metadata/restore audit/schedule/retention. | Manuscript 1082; NFR-BACKUP-001 | Backup schema has scope/status/checksum/size; restore table; system setting `data_retention`. | Partially compliant | No schedule, retention worker, artifact checksum execution, restore history UI. | High | Implement backup lifecycle and retention settings. |
| NFR-OBS-001 | Keep/export access/system/audit logs. | Manuscript 1082-1085; NFR-OBS-001 | Audit/access/system tables `initial_apms.sql:481-513`; audit trigger for selected tables `hardening:134-171`; log reads `records.ts:31-33`. | Partially compliant | Access/system logs not populated comprehensively; export missing; no immutable policy verification. | High | Add log writers, filters/detail/export, immutability tests. |
| NFR-PRIV-001 | Do not disclose student data outside authorized academic relationships. | Manuscript 232, 1085; NFR-PRIV-001 | RLS and domain permissions; hardening scope helpers. | Partially compliant | Requires live RLS tests; events read globally; logs may expose actor IDs. | Critical | Add adversarial data-access tests and least-data log rendering. |

## 3. Missing Thesis Requirements

- Email six-digit MFA/OTP challenge and enforced MFA/AAL policy.
- Invitation issue/accept/revoke workflow and Auth-admin account provisioning.
- Academic guidelines dedicated CRUD/versioning/export workflow.
- Class-record template CRUD/import/export/version/restore workflow.
- LMS adapter configuration, provider connection test, import mapping, import job worker, attendance/engagement ingestion.
- Durable production student add/import/edit/profile/unenroll workflow.
- Durable faculty invitation/profile/class-assignment workflow.
- Durable class record create/import/edit/delete/export/detail/version history/restore workflow.
- Dedicated criteria editor for nested periods/components/categories, reordering, versioning, activation, and formula management.
- Production assessment creation, score entry/import grid, result edit/delete/export, and attendance/participation support.
- End-to-end grader submission and faculty approval/rejection UI/service transaction.
- Automated calculation service that persists evaluations after approved results/criteria changes.
- Approved ML model adapter, feature schema, model registry workflow, prediction worker, prediction scenarios, confidence/explanation UI.
- Grounded AI feedback generation, preview, send by email/account notification, delivery retries, delivery status, and audit.
- Server-side analytics/report filters, sorting, pagination, calculated totals, drill-down, CSV/JSON/PDF exports.
- Full notification triggers for grading, approvals, risk, feedback, security, backup, and system events.
- APMS assistant authorized query service.
- System Operator user/role/permission administration and integration administration.
- Super Admin admin-account lifecycle, backup inspect/restore/delete lifecycle.
- Access/system log instrumentation and export.
- Performance, accessibility, and live RLS/security verification suites.

## 4. Partial Implementations

### Authentication And Routing

Requirement: email/password, Google, recovery, remember, role dashboard, inactive blocking.

Current implementation: `AuthProvider.tsx` supports Supabase password sign-in, profile lookup, inactive rejection, Google OAuth start, password reset request, logout, and demo sessions. Route guards restrict role URLs.

What is missing: MFA/OTP challenge, invitation lifecycle, live Auth tests, session revocation/expiration, complete Auth event logging.

Relevant files: `apps/mobile/src/auth/AuthProvider.tsx`, `apps/mobile/src/auth/RouteGuard.tsx`, `apps/mobile/src/app/index.tsx`, `apps/mobile/src/config/navigation.ts`.

Dependencies: Supabase Auth configuration, email provider, OAuth provider, service-role admin worker.

Recommended completion criteria: live configured Auth tests prove password, Google callback, MFA challenge, disabled account rejection, logout, session expiry, and role routing.

### RBAC And RLS

Requirement: least privilege and separation of duties across six thesis roles.

Current implementation: role/permission constants and tests exist; RLS policies and scope hardening helpers exist; schema contract test checks selected hardening text.

What is missing: live database execution, adversarial RLS tests, broad-policy review, proof that every UI/service mutation uses the correct role and scope.

Relevant files: `packages/domain/src/permissions.ts`, `packages/domain/src/permissions.test.ts`, `supabase/migrations/202608060001_initial_apms.sql`, `supabase/migrations/20260806125202_enforce_scoped_authorization_and_audit.sql`.

Dependencies: Docker/Supabase local or CI database, seed fixtures for every role and scope.

Recommended completion criteria: cross-role tests prove denied access for wrong department/class/student and allowed access only for assigned/self/scope records.

### Academic Data Model

Requirement: centralize records, criteria, results, predictions, feedback, notifications, logs, backups.

Current implementation: 44-table Supabase migration covers most thesis entities and indexes. `npm run test:schema` verifies 9 application contracts.

What is missing: many tables have no connected UI/service/worker; migrations were not executed against PostgreSQL during this audit.

Relevant files: `supabase/migrations/202608060001_initial_apms.sql`, `scripts/verify-schema.mjs`.

Dependencies: Supabase runtime and seed data.

Recommended completion criteria: migrations reset cleanly, policies compile, seed loads, CRUD/RLS tests exercise each table.

### Faculty Demo Workflows

Requirement: faculty manages students, records, feedback, events, analytics.

Current implementation: in demo mode only, `FacultyPortalContent.tsx` provides localStorage-backed fictional student/class/feedback/event data and clear unavailable AI state.

What is missing: production persistence, imports, class structure, linked records, feedback delivery, analytics queries, concurrency/error states.

Relevant files: `apps/mobile/src/screens/FacultyPortalContent.tsx`, `apps/mobile/src/hooks/usePersistentDemoState.ts`.

Dependencies: production Supabase services/RPCs and provider workers.

Recommended completion criteria: demo-only flows are replaced or matched by production workflows tested against live DB.

### Grader Demo Workflow

Requirement: grader enters assigned assessment results and submits for faculty review.

Current implementation: in demo mode only, `GraderPortalContent.tsx` creates draft assessments and saves grade/feedback to localStorage with honest fictional wording.

What is missing: production grader assignment list, submission state transitions, faculty review UI, official-result creation, notifications, audit, locking/resubmission.

Relevant files: `apps/mobile/src/screens/GraderPortalContent.tsx`, `packages/domain/src/workflows.ts`, `supabase/migrations/202608060001_initial_apms.sql`.

Dependencies: assessment/result/grader assignment services and review RPC integration.

Recommended completion criteria: Playwright/API tests cover assignment -> draft -> submitted -> approved/rejected -> official result -> recalculation.

### Events

Requirement: Dean manages academic events with category, priority, dates, description, audience.

Current implementation: `events.ts` validates title, description length, Manila date format/order, inserts production event rows if connected, and demo appends a row.

What is missing: edit/delete/list detail, audience notification triggers, calendar UI, production E2E, duplicate/overlap policy.

Relevant files: `apps/mobile/src/services/events.ts`, `apps/mobile/src/screens/AppPortalScreen.tsx`, `supabase/migrations/202608060001_initial_apms.sql`.

Dependencies: notification service and live DB tests.

Recommended completion criteria: event CRUD persists and sends scoped notifications with audit records.

### Dashboards And Records

Requirement: real-time dashboards and sortable/filterable/paginated/drill-down records.

Current implementation: production dashboard service reads limited counts and student averages; generic records read selected tables. Demo uses mock metrics.

What is missing: most role-specific metrics, charts, trend deltas, server filters/sort/pagination, stable row IDs, detail routes, exports.

Relevant files: `apps/mobile/src/services/dashboard.ts`, `apps/mobile/src/services/records.ts`, `apps/mobile/src/screens/AppPortalScreen.tsx`.

Dependencies: aggregate views/RPCs and query indexes.

Recommended completion criteria: every dashboard card/chart names its source query and is covered by seeded integration tests.

### AI Service

Requirement: model-backed predictions and explanations.

Current implementation: `services/ai` exposes health and prediction endpoint, and correctly refuses prediction without an approved artifact/adapter.

What is missing: approved model artifact, feature schema, model adapter, worker integration, persistence to `prediction_runs`/`performance_predictions`, UI consumption, SHAP/explanations.

Relevant files: `services/ai/src/apms_ai/main.py`, `services/ai/tests/test_service.py`, prediction tables in migration.

Dependencies: institutional model artifact and model governance/approval.

Recommended completion criteria: prediction endpoint runs approved model only, persists run/version/input snapshot/output/explanation, and returns unavailable otherwise.

### Notifications

Requirement: notification center and event-triggered in-app/email messages.

Current implementation: hook reads/marks notification rows and provides demo notifications.

What is missing: all-notifications page, notification preferences per displayed channel/event, delivery attempts worker, automatic triggers, email provider.

Relevant files: `apps/mobile/src/services/notifications.ts`, `supabase/migrations/202608060001_initial_apms.sql`.

Dependencies: notification generation service and email provider.

Recommended completion criteria: grading/approval/feedback/event/backup/security flows generate notifications and delivery_attempts.

### Backups

Requirement: create, inspect, restore, delete backups with confirmation and audit.

Current implementation: Super Admin "Create Backup" can insert a queued `backups` row in production; schema stores checksum/status/size/provider references and restore rows.

What is missing: worker/provider artifact creation, checksum verification, detail inspection, restore/delete actions, retention/schedule.

Relevant files: `apps/mobile/src/services/actions.ts`, `supabase/migrations/202608060001_initial_apms.sql`.

Dependencies: backup target/provider and service-role worker.

Recommended completion criteria: queue worker produces completed backup with checksum; restore/delete produce audited state transitions and verification logs.

## 5. Thesis vs. Implementation Mismatches

1. Thesis conceptual flow expects data changes to iterate through calculation, ML prediction, LLM feedback, REST/API output, and email delivery (manuscript 1075-1076). Current system has no production orchestration across those steps.

2. Thesis login mockup requires email/password plus six-digit email MFA or Google, with recovery and dashboard redirect (manuscript 1093). Current implementation has password, Google start, recovery, and routing, but no six-digit MFA challenge.

3. Thesis says Faculty reviews Grader-submitted results and sends feedback (manuscript 1082). Current Grader UI is demo-only localStorage; production generic screens do not expose assignment/submit/review.

4. Thesis says Student has the most limited scope and views personalized feedback generated by Faculty (manuscript 1082). Current navigation gives Student overview/feedback/grades/settings only, which is directionally correct; however, data is demo/read-only unless production feedback/results exist.

5. Thesis says Academic Admin manages academic guidelines and class-record templates (manuscript 1082). Schema tables exist, but no module or route-specific workflow exists.

6. Thesis says dashboards present performance summaries, trend visualizations, at-risk indicators, and predicted passing rates from academic data (manuscript 1095, 1107). Current demo values are mock constants, and production dashboards provide only limited counts/averages.

7. Thesis says student management supports search/sort/filter, row actions, profile drill-down, assessment history, and prediction links (manuscript 1097, 1109). Current generic details only display concatenated row text and a "Validated mock dataset" source.

8. Thesis says class records support search, semester filters, export, add, detail lists, assessment breakdowns, version history, and export options (manuscript 1099). Current production records view is read-only with client filter; faculty demo edits localStorage only.

9. Thesis says Performance Evaluation Criteria page persists criteria that feed automated grade calculation and downstream modules (manuscript 1111). Current criteria schema/domain checks exist, but no editor/persistence workflow connects to calculations.

10. Thesis says Performance Evaluation & Prediction page includes current grades, predicted grades, trends, risk, AI confidence, prediction scenarios, and PDF export (manuscript 1112-1113). Current AI/prediction pages are unavailable/fail-closed and export is unimplemented.

11. Thesis says feedback can be sent via email and audited (manuscript 1076, 1103). Current demo feedback explicitly says no notification was sent, and no production send worker exists.

12. Thesis lists PyTorch/LSTM/Transformer, SHAP, Pydantic-AI, Docker/Jupyter model tooling (manuscript 606-623). Current AI service is a placeholder boundary with FastAPI/Pydantic and no model adapter.

13. `docs/verification/UI_INTERACTION_CHECKLIST.md` is stale for some current behaviors: it still flags student "Submit Grades" and "Send Feedback" actions as exposed, but current `AppPortalScreen.tsx:280-284` hides primary actions for student/grader/faculty. Treat that checklist as historical, not authoritative current evidence.

## 6. Missing Links and Integration Gaps

- Frontend -> backend: Faculty and Grader specialized portals are demo-only behind `demoMode` and use `usePersistentDemoState`; production falls back to generic read-only or fail-closed screens.
- Backend -> database: Supabase table definitions exist, but no live migration reset/RLS test was run in this environment.
- Authentication -> authorization: Login loads a role from `profiles`/`user_roles`, but no live tests prove inactive users, wrong scopes, MFA, or multi-role selection.
- Forms -> validation -> persistence: Event create has a production insert; profile/settings/password have partial production writes; most academic forms either demo-save or generic action throws.
- APIs -> consumers: AI `/v1/predictions` endpoint has no frontend consumer/worker because no model adapter exists.
- Modules -> dependent modules: Criteria, assessment results, evaluation, prediction, feedback, notification, and dashboard modules are not chained.
- Notifications -> triggering events: Notification table/hook exists, but grading/feedback/events/backups/security flows do not consistently trigger notifications.
- Reports/dashboards -> data sources: Production dashboards use limited counts; charts and analytics are demo/mock or empty.
- Configuration/env -> runtime: `.env.example` defines Supabase and AI variables; `APMS_MODEL_ARTIFACT_PATH` defaults empty and `APMS_MODEL_VERSION=unconfigured`, causing intended AI unavailability.
- User roles -> permitted actions: Domain/RLS scaffolding exists; live DB/RLS verification is missing.
- Thesis workflows -> executable flows: Core thesis value chain from class data import to feedback delivery is not executable end-to-end.
- Orphaned/disconnected modules: `academic_guidelines`, `class_record_templates`, `model_versions`, `prediction_runs`, `performance_predictions`, `delivery_attempts`, `integrations`, `import_jobs`, `access_logs`, `system_logs`, and backup restore tables have little or no connected UI/service/workers.
- Unused/incomplete endpoints/RPCs: `review_grader_submission` exists but is not consumed by the frontend.
- Incomplete routes/actions: Generic primary actions for add/export/run/admin operations call `performScreenAction`; only backup queues a row, all other production actions throw.
- Missing event triggers: `audit_academic_mutation` covers several tables, but access/system logs and notification events are not end-to-end invariants.

## 7. Incomplete or Suspicious Code

- `apps/mobile/src/auth/AuthProvider.tsx:22,48-72`: explicit demo mode stores demo session and uses plaintext fictional demo credentials from `apps/mobile/src/data/demo.ts:5-10`.
- `apps/mobile/src/hooks/usePersistentDemoState.ts:15-22`: demo localStorage is deliberately not an academic system of record.
- `apps/mobile/src/services/actions.ts:8-18`: demo actions are simulated; production only queues backups, otherwise throws that a workflow form/worker is required.
- `apps/mobile/src/services/actions.ts:38-69`: settings saves only profile, one hard-coded notification preference, or selected system settings; displayed security/integration settings are not necessarily enforced.
- `apps/mobile/src/services/dashboard.ts:18-37`: demo dashboard metrics are hard-coded.
- `apps/mobile/src/services/dashboard.ts:59-95`: staff dashboards use generic counts, not role-specific faculty/grader/dean analytics.
- `apps/mobile/src/services/records.ts:12-15,79`: demo records come from `MOCK_SCREEN_RECORDS`.
- `apps/mobile/src/services/records.ts:20-67`: production generic records are read-only, unpaginated, and lack stable record IDs.
- `apps/mobile/src/screens/AppPortalScreen.tsx:615-631`: search/status filtering happens client-side over already loaded rows.
- `apps/mobile/src/screens/AppPortalScreen.tsx:680-697`: row details concatenate visible strings and label source as "Validated mock dataset" even when generic production tables are used.
- `apps/mobile/src/screens/AppPortalScreen.tsx:704-714`: production analytics is empty/unavailable.
- `apps/mobile/src/screens/AppPortalScreen.tsx:1180-1191`: security/system info metrics are hard-coded display values.
- `apps/mobile/src/screens/AppPortalScreen.tsx:1206-1227`: assistant is disabled/unavailable; correct fail-closed behavior but missing thesis feature.
- `apps/mobile/src/screens/FacultyPortalContent.tsx:179-247`: faculty student add is localStorage demo only.
- `apps/mobile/src/screens/FacultyPortalContent.tsx:647-736`: faculty feedback saves local demo record and explicitly sends no notification.
- `apps/mobile/src/screens/FacultyPortalContent.tsx:780-850`: analytics metrics derive from mock faculty arrays.
- `apps/mobile/src/screens/GraderPortalContent.tsx:249-369`: grader assessment/grade workflow is localStorage demo only.
- `apps/mobile/src/screens/GraderPortalContent.tsx:494-620`: save grade/feedback has validation but no submit/review/persistence.
- `services/ai/src/apms_ai/main.py:36-44`: prediction endpoint returns 503/501 without approved artifact/adapter.
- `supabase/migrations/202608060001_initial_apms.sql:833-835`: authenticated role is granted broad table privileges, relying on RLS; this requires live adversarial verification.
- `scripts/verify-schema.mjs:98-109`: schema test is textual/static for selected hardening contracts, not a database execution test.
- `playwright.config.ts`: E2E web server forces `EXPO_PUBLIC_DEMO_MODE=true`; good for UI demo regression, insufficient for production compliance.
- No dedicated TODO/FIXME comments were found in source code during `rg`, but many explicit "demo", "fictional", "unavailable", and "requires worker/form" markers indicate incomplete production behavior.

## 8. End-to-End Feature Audit

**Feature:** Login and role routing

**Expected thesis flow:** User enters PHINMAEd/institutional email, strong password, six-digit email MFA code or Google sign-in, then is routed to role dashboard.

**Actual implementation flow:** Demo mode uses local demo credentials and localStorage. Configured mode calls Supabase `signInWithPassword`, reads `profiles` joined to `user_roles`, rejects inactive/wrong role, and routes using `ROLE_HOME`. Google OAuth start and password reset wrappers exist.

**Breakpoints/gaps:** No MFA/OTP. No live configured Auth E2E. No invitation/account activation flow. Auth event logging incomplete.

**Compliance status:** Partially compliant.

**Evidence:** `AuthProvider.tsx:66-110`; `navigation.ts:15-18`; `tmp/thesis_text.txt:1093`.

**Feature:** Account/user/role administration

**Expected thesis flow:** System Operator manages users, roles, permissions, auth settings, integrations, and logs; Super Admin manages System Operator/admin accounts, backups, logs.

**Actual implementation flow:** Generic role/admin/log tables read selected Supabase tables or mocks. Generic actions are simulated in demo and unimplemented in production, except backup queue insert.

**Breakpoints/gaps:** No user CRUD/invite/disable/delete, role editor, permission assignment, protected Auth admin worker, or production tests.

**Compliance status:** Missing/partial.

**Evidence:** `records.ts:55-61`; `actions.ts:8-18`; `navigation.ts:42-51`; `tmp/thesis_text.txt:1082-1085`.

**Feature:** Student directory and enrollment

**Expected thesis flow:** Authorized user adds/imports students, searches/sorts/filters, opens profile, manages linked class records, and unenrolls with audit.

**Actual implementation flow:** Production generic screen reads `students`; faculty demo can add localStorage student with validation. No production write/import/detail/unenroll.

**Breakpoints/gaps:** No durable production CRUD, CSV/text import, duplicate detection UX, profile drill-down, linked records, or unenroll.

**Compliance status:** Partially compliant.

**Evidence:** `records.ts:22-25`; `FacultyPortalContent.tsx:179-247`; `initial_apms.sql:114-129`; `tmp/thesis_text.txt:1097,1109`.

**Feature:** Faculty directory and assignments

**Expected thesis flow:** Dean/authorized users manage faculty directory, invite accounts, assign class records.

**Actual implementation flow:** Production generic screen reads `faculty_profiles`; schema has `faculty_assignments`.

**Breakpoints/gaps:** No invite/edit/status/assignment forms or service transactions.

**Compliance status:** Partially compliant.

**Evidence:** `records.ts:43-45`; `initial_apms.sql:103-112,196-206`; `tmp/thesis_text.txt:1082`.

**Feature:** Academic guidelines and class-record templates

**Expected thesis flow:** Academic Admin manages guidelines and class-record templates including create/import/view/edit/export/delete/versioning.

**Actual implementation flow:** Tables and policies exist only.

**Breakpoints/gaps:** No UI routes/services/workers/export/version restore.

**Compliance status:** Missing.

**Evidence:** `initial_apms.sql:142-168`; `hardening:99-123`; `tmp/thesis_text.txt:1076,1082,1107`.

**Feature:** Class records

**Expected thesis flow:** Create/import class record with subject/section/term/faculty/students/template, search/sort/filter/export, drill into assessments/version history.

**Actual implementation flow:** Production generic screen reads `class_records`; faculty demo creates/edits local records in localStorage.

**Breakpoints/gaps:** No durable create/import/edit/export/delete/detail/version restore or faculty/student assignment workflow.

**Compliance status:** Partially compliant.

**Evidence:** `records.ts:27-29`; `initial_apms.sql:170-192`; `FacultyPortalContent.tsx` records workflow; `tmp/thesis_text.txt:1099`.

**Feature:** Criteria and grade calculations

**Expected thesis flow:** Academic/faculty users define nested weights summing 100%, persist criteria, and calculations use approved formulas/results.

**Actual implementation flow:** Domain validation and DB checks exist; criteria tables exist; production criteria screen is generic read-only.

**Breakpoints/gaps:** No nested editor, activation transaction, formula validation, automatic recalculation, or downstream evaluation connection.

**Compliance status:** Partially compliant.

**Evidence:** `calculations.ts:3-22`; `initial_apms.sql:218-244`; `records.ts:47-49`; `tmp/thesis_text.txt:230,1111`.

**Feature:** Assessment result recording and grader review

**Expected thesis flow:** Faculty assigns grader; grader enters assigned results; grader submits; faculty approves/rejects; approved results become official and feed calculations.

**Actual implementation flow:** Schema and review RPC exist; domain transition helper exists; grader UI is demo localStorage and does not call production service/RPC.

**Breakpoints/gaps:** Missing production assignment, submit, review UI, status history, notifications, audit verification, and calculation trigger.

**Compliance status:** Partially compliant backend scaffold; missing end-to-end.

**Evidence:** `workflows.ts:3-16`; `initial_apms.sql:260-305,639-680`; `GraderPortalContent.tsx:249-369,494-620`; `tmp/thesis_text.txt:1082`.

**Feature:** Performance evaluation

**Expected thesis flow:** Approved academic data is calculated into performance evaluations, risk classifications, explanations, filters, and outputs.

**Actual implementation flow:** `performance_evaluations` table and `summarizePerformance` helper exist. Production analytics/evaluation is empty or generic; no job writes evaluations.

**Breakpoints/gaps:** No calculation pipeline, persistence, filterable table, report/export, or dashboard integration.

**Compliance status:** Partially compliant.

**Evidence:** `calculations.ts:24-32`; `initial_apms.sql:319-330`; `AppPortalScreen.tsx:704-714`; `tmp/thesis_text.txt:1076,1112`.

**Feature:** AI prediction

**Expected thesis flow:** ML models predict assessment/overall performance with scenarios, confidence, risk, trend, explanations, and advisory framing.

**Actual implementation flow:** AI service health works; prediction endpoint returns 503 when no artifact, 501 if artifact exists but adapter absent. UI shows unavailable states.

**Breakpoints/gaps:** No model artifact/schema/adapter, no worker, no persisted runs/predictions, no scenario execution.

**Compliance status:** Missing, with compliant fail-closed behavior.

**Evidence:** `services/ai/src/apms_ai/main.py:26-44`; `initial_apms.sql:307-370`; `tmp/thesis_text.txt:1076,1112-1113`.

**Feature:** Personalized feedback

**Expected thesis flow:** AI/template feedback is generated from evaluation/prediction, faculty edits/previews/sends, students receive by email/account, send is audited.

**Actual implementation flow:** Feedback schema exists. Faculty demo templates save local feedback and explicitly says no notification was sent. Student can read feedback rows if production data exists.

**Breakpoints/gaps:** No AI generation, persistence workflow, preview, send, email worker, delivery attempts, notifications, retry/status, or audit tests.

**Compliance status:** Partially compliant schema/demo; production send missing.

**Evidence:** `FacultyPortalContent.tsx:647-736`; `initial_apms.sql:373-432`; `records.ts:39-41`; `tmp/thesis_text.txt:233,1076,1103`.

**Feature:** Dashboards/analytics/reports

**Expected thesis flow:** Role dashboards and analytics use stored/calculated data, filters, charts, trends, exports.

**Actual implementation flow:** Demo uses mock constants/local arrays; production dashboard has limited counts/student averages; production analytics empty.

**Breakpoints/gaps:** No full role-specific aggregates, charts, drilldown, real-time updates, server filters, or exports.

**Compliance status:** Partially compliant.

**Evidence:** `dashboard.ts:18-37,59-177`; `FacultyPortalContent.tsx:780-850`; `AppPortalScreen.tsx:704-714`; `tmp/thesis_text.txt:1095,1105,1107`.

**Feature:** Notifications/events

**Expected thesis flow:** Users receive in-app/email notifications for academic/security/system events; Dean manages events/calendar.

**Actual implementation flow:** Notifications hook reads/marks rows. Event create service validates and inserts rows. Demo notifications/events exist.

**Breakpoints/gaps:** Most event triggers absent; no email delivery; no edit/delete/calendar/audience notification.

**Compliance status:** Partially compliant.

**Evidence:** `notifications.ts:14-115`; `events.ts:34-50`; `initial_apms.sql:401-446`; `tmp/thesis_text.txt:1095,1101`.

**Feature:** Backups

**Expected thesis flow:** Super Admin creates, inspects, restores, deletes, and verifies backups.

**Actual implementation flow:** Backup create queues a DB row; schema has backup/restore rows; no worker/provider/lifecycle.

**Breakpoints/gaps:** No artifact, checksum execution, restore/delete, retention/schedule, recovery verification.

**Compliance status:** Partially compliant scaffold.

**Evidence:** `actions.ts:12-16`; `initial_apms.sql:515-535`; `tmp/thesis_text.txt:1082`.

## 9. Security and Access-Control Compliance

Authentication:

- Email/password and Google OAuth wrappers exist. Password recovery exists. MFA/OTP is missing.
- Demo mode contains plaintext fictional credentials and should remain development-only; `.env.example:8-9` warns demo mode is only for fictional local demonstrations and automated tests.

Authorization:

- Domain role permissions align with six roles and preserve narrower technical roles.
- RLS policies exist for all public tables, and hardening migration adds department-scope helpers.
- Missing live RLS tests make server-side least privilege unverified.

Role-based access:

- Route-level role guards work in demo E2E.
- Technical roles are narrower in domain tests, but production route/actions need live scoped DB tests.

Input validation:

- Present for login required fields, events, student/class/grader demo forms, password length/match/current-password reauth, domain weights/scores.
- Missing for import files, many production academic workflows, formula structure, duplicate handling, optimistic locking, and server-side mutation schemas.

Data protection:

- Supabase Auth and RLS are used. Column-level profile update hardening exists.
- Encryption is claimed by thesis but not evidenced in app/database beyond Supabase/TLS assumptions; credential secret storage for integrations is not implemented.

Session/token handling:

- Supabase client persists sessions; logout calls `supabase.auth.signOut`.
- No session list, remote revocation, expiration enforcement, or sensitive-operation policy beyond password reauth.

Sensitive operations:

- Backup create has a confirmation and queues a row.
- Role/user/admin/restore/delete operations are missing or fail closed.

Error exposure:

- Some services throw raw Supabase errors, which can lead to inconsistent or overly detailed user messages.

Security compliance status: **Partially compliant with high-risk unverifiable areas**. The highest-priority work is MFA, invitation/account lifecycle, live RLS tests, event/access logging, and provider/secret management.

## 10. Data and Database Compliance

Thesis entities vs. database models:

- Present: profiles, roles, permissions, user roles, invitations, departments, programs, terms, subjects, students, faculty profiles, guidelines, templates, class records, versions, assignments, enrollments, criteria, assessments, results, grader workflow tables, evaluations, prediction criteria/runs/predictions, feedback, notifications, delivery attempts, events, integrations/import jobs, logs, backups/restores, settings.
- Missing or weak: no explicit academic guideline approval table, no scheduled backup table, no model governance approval workflow beyond status, no durable report/export job table, no direct class-record import file staging table.

Required relationships:

- Most core relationships exist through foreign keys.
- Several lifecycle relationships are not exercised by application code.

Constraints:

- Useful checks exist for statuses, date order, weights, scores, confidence, unique active-ish rows.
- `assessment_results.approval_status` defaults `approved`, which can be risky for manually inserted rows and should be revisited for workflows requiring faculty approval.

Data validation:

- Database checks and some service/domain validators exist.
- Production mutation validators are incomplete because most mutations are not implemented.

Persistence behavior:

- Production reads exist for selected tables.
- Production writes exist only for profile settings, notification preference upsert, system settings upsert, event create, password change, notification read, and backup queue.
- Academic CRUD/workflows mostly do not persist.

Missing fields/tables:

- Report/export jobs, backup schedules/retention policies, import staging/mapping, model approval metadata may be needed for full operational traceability.

Migration/schema inconsistencies:

- Static schema contract passes.
- Migrations were not executed against PostgreSQL during this audit; Docker/local Supabase is documented unavailable.
- Broad authenticated grants rely on RLS and require live verification.

Data/database compliance status: **Partially compliant schema, incomplete operational persistence**.

## 11. Testing and Verification Gaps

- No live Supabase migration reset/lint/advisor evidence.
- No adversarial RLS tests for students/faculty/deans/technical roles across departments/classes/enrollments.
- No production Auth tests for MFA, Google callback, password recovery callback, invitation acceptance, inactive/suspended users, session expiry.
- Playwright runs with `EXPO_PUBLIC_DEMO_MODE=true`; it does not verify production Supabase persistence.
- No E2E tests for production student/faculty/class/criteria/assessment/result CRUD.
- No E2E tests for grader submit/faculty approve/reject and official calculation.
- No tests for prediction worker/model adapter/scenario outputs because the model is unavailable.
- No tests for feedback email/account delivery, delivery retries, and audit entries.
- No export tests for CSV/JSON/PDF.
- No backup worker/restore/delete tests.
- No notification trigger tests.
- No performance benchmark at thesis-controlled scale.
- No formal WCAG 2.1 AA automated/manual audit.
- No full responsive matrix across all roles/dialogs.
- No import file validation tests.

## 12. Prioritized Remediation Backlog

### TASK-1: Establish Live Supabase Verification Harness

**Priority:** Critical

**Compliance requirement:** Server-enforced RBAC/RLS, persistence, data integrity.

**Problem:** Current tests are static or demo-mode; migrations/RLS were not executed against a live database.

**Evidence:** `scripts/verify-schema.mjs` is textual; Playwright config forces demo; `docs/TESTING.md` says database reset/lint requires Docker.

**Files/components involved:** `supabase/migrations/*`, `supabase/seed.sql`, `scripts/verify-schema.mjs`, `tests`.

**Dependencies:** Docker/local Supabase or CI Supabase test project.

**Implementation required:** Add DB reset, seed fixtures for all roles/scopes, RLS adversarial tests, migration compile checks, Supabase db lint/advisor where available.

**Acceptance criteria:** CI proves migrations apply; each role can access only self/assigned/scope records; forbidden cross-role/cross-department access fails.

**Verification steps:** Run `supabase db reset`, DB test suite, `npm run test:schema`, and document results.

### TASK-2: Implement MFA, Invitations, And Account Lifecycle

**Priority:** Critical

**Compliance requirement:** FR-AUTH-002, FR-AUTH-006, FR-AUTH-009, FR-ADMIN-001/002.

**Problem:** No six-digit MFA challenge or invitation acceptance/admin provisioning workflow.

**Evidence:** `AuthProvider.tsx` has password/Google/reset only; `invitations` table exists without consumers.

**Files/components involved:** `apps/mobile/src/auth/*`, `apps/mobile/src/app/index.tsx`, `supabase/migrations`, new protected Auth/admin worker.

**Dependencies:** Supabase Auth email/OAuth/MFA configuration and service role key.

**Implementation required:** Build invitation issue/accept routes, admin account creation/disable/revoke, MFA challenge UI/enforcement, auth/access audit logging.

**Acceptance criteria:** Tests cover invite -> accept -> login -> MFA -> role dashboard; inactive/suspended users are blocked; events logged.

**Verification steps:** Production-mode E2E with seeded/users and Supabase Auth test hooks.

### TASK-3: Complete Student, Faculty, Enrollment, And Assignment Workflows

**Priority:** Critical

**Compliance requirement:** FR-PEOPLE-001 through FR-PEOPLE-005, FR-ACAD-005.

**Problem:** People and assignment flows are schema/read/demo only.

**Evidence:** `records.ts` reads students/faculty; faculty demo add uses localStorage; no production write/import/assign/unenroll.

**Files/components involved:** `apps/mobile/src/services/records.ts`, `FacultyPortalContent.tsx`, `AppPortalScreen.tsx`, `supabase` tables.

**Dependencies:** Live RLS verification and account lifecycle.

**Implementation required:** Add production forms/RPCs for student/faculty CRUD, CSV import, enrollment, unenrollment, class/faculty/grader assignments, audit/notifications.

**Acceptance criteria:** Authorized role can manage scoped records; unauthorized roles are denied; changes persist after reload and are audited.

**Verification steps:** Production E2E and DB assertions.

### TASK-4: Implement Guidelines And Class-Record Templates

**Priority:** High

**Compliance requirement:** FR-ACAD-001, FR-ACAD-002.

**Problem:** Tables exist but no UI/service workflows.

**Evidence:** `academic_guidelines` and `class_record_templates` schema only.

**Files/components involved:** New screens/services; `supabase/migrations`; navigation.

**Dependencies:** RBAC/RLS harness.

**Implementation required:** CRUD/version/import/export/publish/archive/restore flows with scoped permissions.

**Acceptance criteria:** Academic Admin/Faculty allowed scopes manage versions; exports download; audit logs written.

**Verification steps:** Unit, DB, and E2E tests.

### TASK-5: Complete Class Records And Version History

**Priority:** Critical

**Compliance requirement:** FR-ACAD-003 through FR-ACAD-006.

**Problem:** No durable class-record create/import/edit/export/detail/version restore.

**Evidence:** `records.ts:27-29` is read-only; `class_record_versions` unused.

**Files/components involved:** Class record screens/services/RPCs, `class_records`, `class_record_versions`, `faculty_assignments`, `enrollments`.

**Dependencies:** People/assignment workflows and template workflows.

**Implementation required:** Transactional create/import/edit/delete/archive, enrollment and faculty assignment, version snapshot/restore, export.

**Acceptance criteria:** Class record changes persist, version history appears, restore works, RLS/audit enforced.

**Verification steps:** Production E2E and DB audit assertions.

### TASK-6: Build Criteria Editor And Calculation Pipeline

**Priority:** Critical

**Compliance requirement:** FR-GRADE-001, FR-GRADE-002, FR-GRADE-005.

**Problem:** Criteria schema/domain validation is not connected to UI or recalculation.

**Evidence:** `criteria_sets/nodes` exist; `calculateWeightedPercentage` exists; no editor/job/RPC.

**Files/components involved:** `packages/domain/src/calculations.ts`, new criteria screens/services/RPCs, evaluation tables.

**Dependencies:** Class records and assessment workflow.

**Implementation required:** Nested editor, 100% weight validation, version activation, formula validation, recalculation job/RPC using approved results.

**Acceptance criteria:** Active criteria cannot violate 100%; grade recalculations produce persisted evaluations with criteria version.

**Verification steps:** Unit/domain tests, DB tests, production E2E.

### TASK-7: Complete Assessment, Result Entry, And Grader Review

**Priority:** Critical

**Compliance requirement:** FR-GRADE-003, FR-GRADE-004, FR-GRADE-006 through FR-GRADE-008.

**Problem:** Grader workflow is localStorage demo; review RPC unused.

**Evidence:** `GraderPortalContent.tsx` saves local state; `review_grader_submission` exists in SQL only.

**Files/components involved:** Grader/faculty screens, assessment/result services, review RPC, notifications.

**Dependencies:** Criteria/class records/RLS harness.

**Implementation required:** Assessment CRUD, score entry/import, grader assignment, draft/submit, faculty review/reject reason/resubmit, official result update, audit/notification/calculation trigger.

**Acceptance criteria:** Only approved results affect official calculations; rejected submissions can be corrected; statuses visible to grader/faculty.

**Verification steps:** Production E2E from grader save through faculty approval and recalculation.

### TASK-8: Implement Evaluation, Prediction, And Model Governance

**Priority:** Critical

**Compliance requirement:** FR-AI-001 through FR-AI-005.

**Problem:** AI service is fail-closed and prediction tables are unused.

**Evidence:** `main.py:36-44`; no model artifact; prediction/evaluation screens empty/unavailable.

**Files/components involved:** `services/ai`, prediction/evaluation tables, app analytics/evaluation screens.

**Dependencies:** Approved institutional model artifact, feature schema, calculation pipeline.

**Implementation required:** Model registry approval, adapter, prediction worker, scenario execution, persisted runs/predictions, explanations, advisory UI.

**Acceptance criteria:** Prediction runs record model version/input snapshot/status/output/explanation; unavailable state remains transparent when model absent.

**Verification steps:** AI tests with fixture adapter, worker integration tests, production E2E for prediction display.

### TASK-9: Implement Feedback Generation And Delivery

**Priority:** Critical

**Compliance requirement:** FR-AI-006, FR-AI-007.

**Problem:** Feedback demo saves local text and sends no notification/email.

**Evidence:** `FacultyPortalContent.tsx:647-736`; delivery tables unused.

**Files/components involved:** Feedback screens/services, `feedback_records`, `delivery_attempts`, `notifications`, email worker.

**Dependencies:** Evaluation/prediction pipeline and notification/email provider.

**Implementation required:** Generate/edit/preview/send workflow, templates, delivery queue, email/in-app delivery attempts, retry/failure UI, audit logs.

**Acceptance criteria:** Faculty can send scoped feedback; student receives account notification/email; delivery status and audit are visible.

**Verification steps:** Integration tests with fake email provider and student E2E.

### TASK-10: Replace Mock Dashboards With Authorized Aggregates

**Priority:** High

**Compliance requirement:** FR-REPORT-001 through FR-REPORT-006.

**Problem:** Dashboards/analytics are limited counts or mock arrays.

**Evidence:** `dashboard.ts` demo constants; `FacultyPortalContent.tsx` mock analytics; production analytics empty.

**Files/components involved:** `apps/mobile/src/services/dashboard.ts`, analytics screens, new aggregate views/RPCs.

**Dependencies:** Calculation/evaluation data.

**Implementation required:** Role-specific aggregate queries, trend series, filters, timestamps/provenance, drill-down.

**Acceptance criteria:** Every displayed KPI/chart comes from scoped DB data or explicitly unavailable state.

**Verification steps:** Seeded DB tests and visual E2E.

### TASK-11: Implement Server-Side Lists And Exports

**Priority:** High

**Compliance requirement:** FR-ACAD-004, FR-REPORT-007, FR-REPORT-008.

**Problem:** Lists are client-filtered and exports are missing.

**Evidence:** `AppPortalScreen.tsx:615-631`; `actions.ts:18`.

**Files/components involved:** Generic table components, records services, export worker/API.

**Dependencies:** RLS harness and stable record IDs.

**Implementation required:** Server search/sort/filter/pagination, stable row IDs/detail routes, CSV/JSON/PDF export jobs honoring filters.

**Acceptance criteria:** Large lists page correctly; exports match visible scoped filters; unauthorized exports fail.

**Verification steps:** Query tests and browser download tests.

### TASK-12: Complete Notifications And Events

**Priority:** High

**Compliance requirement:** FR-NOTIFY-001 through FR-NOTIFY-003.

**Problem:** Notification center exists but triggers and event lifecycle are incomplete.

**Evidence:** `notifications.ts` reads/updates only; `events.ts` creates only.

**Files/components involved:** Notification service, event screens/services, DB triggers/workers.

**Dependencies:** Feedback/grading/events workflows.

**Implementation required:** Notification rules/preferences, all-notifications page, event edit/delete, audience delivery, triggers for grading/feedback/security/backup.

**Acceptance criteria:** Each thesis event generates expected in-app/email notifications with read state.

**Verification steps:** Integration and E2E tests.

### TASK-13: Complete Backup And Restore Lifecycle

**Priority:** Critical

**Compliance requirement:** FR-ADMIN-003, NFR-BACKUP-001.

**Problem:** Backup create only queues a row.

**Evidence:** `actions.ts:12-16`; backup schema has artifact fields but no worker.

**Files/components involved:** Backup UI, worker/service, `backups`, `backup_restores`, logs.

**Dependencies:** Backup provider/target.

**Implementation required:** Worker creates artifacts, stores provider reference/checksum/size, restore/delete operations, retention/schedule settings.

**Acceptance criteria:** Backup can be created, inspected, verified, restored, deleted, and audited.

**Verification steps:** Worker tests with fake provider plus restore drill.

### TASK-14: Implement Access/System Logging And Export

**Priority:** High

**Compliance requirement:** NFR-OBS-001, FR-ADMIN-001/002.

**Problem:** Log tables exist but access/system logs are not broadly written or exportable.

**Evidence:** `initial_apms.sql:481-513`; `records.ts:31-33` reads only audit logs.

**Files/components involved:** Auth/app event logging, log screens, export service.

**Dependencies:** Auth and workflow services.

**Implementation required:** Standard logging API, event instrumentation, filters/detail/export, immutable policy tests.

**Acceptance criteria:** Auth, privileged operations, system/integration/backup events appear in scoped logs and can export safely.

**Verification steps:** DB tests and E2E.

### TASK-15: Formal Accessibility, Responsive, Performance, And Security Verification

**Priority:** Medium

**Compliance requirement:** NFR-ACCESS-001, NFR-RESP-001, NFR-PERF-001, NFR-SEC-003/004.

**Problem:** Current verification is incomplete.

**Evidence:** No axe/WCAG report, no full viewport matrix, no performance benchmarks, no rate-limit evidence.

**Files/components involved:** `tests/e2e`, Playwright config, UI components, docs.

**Dependencies:** Production workflows stable enough to test.

**Implementation required:** Add accessibility tests/manual checklist, viewport screenshots, performance fixtures, rate-limit/security tests.

**Acceptance criteria:** WCAG 2.1 AA target documented, no mobile overflow, reads meet target at controlled scale, rate limits verified.

**Verification steps:** Run full QA matrix and archive evidence.

## 13. Recommended Execution Order

1. Establish live Supabase verification harness and seed data.
2. Implement MFA/invitations/account lifecycle because other workflows depend on real users/scopes.
3. Harden and verify RBAC/RLS with adversarial tests.
4. Implement student/faculty/enrollment/class/faculty/grader assignment foundations.
5. Implement guidelines and class-record templates.
6. Implement class records and version history.
7. Implement criteria editor and calculation pipeline.
8. Implement assessment/result entry and grader review.
9. Implement evaluation pipeline from approved results.
10. Integrate approved AI prediction model and prediction worker.
11. Implement feedback generation, delivery, and notifications.
12. Replace dashboards/analytics with real aggregates and drill-downs.
13. Add server-side list pagination/filtering and exports.
14. Complete backup/restore and access/system logging.
15. Run full accessibility/responsive/performance/security verification and update acceptance docs.

## 14. Final Compliance Checklist

- [ ] Live Supabase migrations apply and seed data loads.
- [ ] Adversarial RLS tests pass for all roles/scopes.
- [ ] Email/password Auth tested in production mode.
- [ ] Google OAuth callback/profile role resolution tested.
- [ ] Six-digit email MFA/OTP implemented and enforced.
- [ ] Invitations/account activation/revocation implemented.
- [ ] Inactive/suspended account blocking logged and tested.
- [ ] Session expiry/revocation implemented.
- [ ] User/role/permission/admin account management complete.
- [ ] Academic guidelines CRUD/version/export complete.
- [ ] Class-record templates CRUD/import/export/version/restore complete.
- [ ] LMS adapter/import mapping/job processing complete or transparently unavailable.
- [ ] Student CRUD/import/profile/unenroll complete.
- [ ] Faculty directory/invite/assignment complete.
- [ ] Class record create/import/edit/delete/export/detail/version history complete.
- [ ] Criteria nested editor/version/100% activation complete.
- [ ] Assessment/result CRUD/import/export complete.
- [ ] Grader assignment/draft/submit/status complete.
- [ ] Faculty approve/reject/reason/resubmit complete.
- [ ] Only approved results feed official calculations.
- [ ] Automatic calculation pipeline persists evaluations.
- [ ] AI model artifact/schema/adapter approved and integrated.
- [ ] Prediction scenarios min/max/min-pass/stable implemented.
- [ ] Prediction confidence/trend/risk/explanation UI uses persisted model runs.
- [ ] AI remains advisory and fail-closed.
- [ ] Feedback generate/edit/preview/send complete.
- [ ] Email/in-app feedback delivery, retry, and status complete.
- [ ] Notification triggers for assessment/approval/risk/feedback/security/system events complete.
- [ ] Dashboards use scoped stored/calculated data.
- [ ] Analytics filters/drill-downs use server queries.
- [ ] CSV/JSON/PDF exports implemented and authorization-filtered.
- [ ] Server-side list pagination/sort/filter implemented.
- [ ] APMS assistant uses authorized stored-data query provider or remains unavailable.
- [ ] Backups create/inspect/verify/restore/delete/schedule/retention complete.
- [ ] Access/system/audit logs are written, filtered, detailed, exported, and immutable.
- [ ] Import upload allowlists/schema validation implemented.
- [ ] Sensitive configuration/secret storage implemented.
- [ ] Rate limits for Auth and mutation endpoints verified.
- [ ] WCAG 2.1 AA audit passed or exceptions documented.
- [ ] Responsive matrix passed for 320/375/768/1024/desktop across all roles/dialogs.
- [ ] Performance reads meet controlled-scale target.
- [ ] Demo mode is impossible to deploy accidentally.
- [ ] Acceptance docs updated with production-mode evidence.

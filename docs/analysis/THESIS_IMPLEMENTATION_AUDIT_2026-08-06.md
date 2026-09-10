# Thesis-to-Implementation Audit

**System:** AI-Based Student Performance Evaluation and Monitoring System (APMS)  
**Audit date:** 2026-08-06  
**Audited sources:** `docs/SWU-001 - Manuscript.docx`, current Expo application, domain package, AI service, Supabase migrations/seed, and automated tests.

## Executive conclusion

The current APMS is **a functioning interactive prototype and schema scaffold, not a functional implementation of the thesis**.

It builds, passes its unit and browser tests, provides six role-specific portals, and contains a substantial database design. However, the running application is explicitly configured with `EXPO_PUBLIC_DEMO_MODE=true`. Most academic content comes from `mock*.ts` constants. The most convincing workflows—adding students and class records, grading, creating assessments, sending feedback, displaying AI predictions, and querying the AI assistant—either mutate React component state only or return canned results. They are not persisted, do not trigger the thesis workflows, and disappear after reload.

The most serious correctness issue is that the protected AI service correctly returns 503 when no approved model exists, while faculty and grader pages still present precise AI predictions, confidence, pass likelihood, risk classifications, and canned answers. Those outputs are fictional but are displayed as if they were live decision-support results.

The database migration is materially more complete than the UI, but it has not been proven against a running database in this environment. Several RLS policies also check a role permission without correlating the requested row to the user's department/program scope, weakening the thesis's least-privilege requirement.

## Audit method and verified evidence

- Extracted all 434 manuscript paragraphs, 11 tables, 54 inline images, and the four system diagrams. The manuscript's system contract is concentrated in the Scope of the System (pp. 11 onward), conceptual framework/context flow (p. 71), use-case diagram (p. 74), data-flow diagram (p. 76), and mockups (pp. 79 onward).
- Inspected all application routes, screens, services, domain rules, AI boundary, database migrations, RLS policies, seed permissions, and E2E specifications.
- Ran `npm run typecheck`, `npm test`, `npm run test:schema`, `npm run build`, `npm run lint`, `npm run test:e2e`, and the AI pytest suite.
- Results: TypeScript/typecheck passed; 12 domain tests passed; schema verifier found 44 tables and 9 contracts; production web export passed; lint passed; 13 browser tests passed; 2 AI service tests passed.
- Interactively tested the running Expo web application at desktop and 375x812 mobile viewports. Verified role routing, criteria action behavior, faculty portal behavior, validation states, notifications, and mobile overflow.
- The manuscript could not be rendered to page PNGs because LibreOffice is unavailable. Page references below use the manuscript's own table of contents/list of figures and extracted document order.

## 1. Requirement-by-requirement comparison

Status meanings: **Implemented** = works against durable/authorized state; **Partial** = a real layer exists but the end-to-end requirement is incomplete; **Missing** = no usable implementation; **Incorrect** = behavior contradicts the thesis or falsely represents success.

| Thesis requirement | Expected behavior | Current behavior | Status |
|---|---|---|---|
| Six actors and role-specific interactions | Student, Grader, Faculty, Academic Admin, System Admin, and Super Admin get least-privilege workflows | Six portals and cross-role route redirects exist. Faculty/grader screens bypass shared production services and use local mock state. Database scope enforcement has gaps. | Partial |
| Secure login | Password + six-digit email MFA or Google; correct role dashboard; recovery and remembered credentials | Password/role login, remembered email, logout, route guard, and reset API wrapper exist. No MFA challenge is implemented. Google OAuth exists only as an unused provider method; no Google button is rendered. Demo credentials are prefilled. | Partial / Incorrect |
| User invitations/sign-up | Admin/faculty invites graders/users; account lifecycle is managed | Invitations table exists. No invite/sign-up/acceptance UI or protected Auth worker exists. | Missing |
| User, role, permission administration | System Admin imports/creates/edits/deletes users and assigns roles/permissions | Roles/admin tables are readable. “Add Role” and “Add Admin” only open a generic confirmation; demo returns a simulation toast and production rejects the operation as unimplemented. | Missing |
| Academic guidelines | Create/view/edit/delete/export course guidelines | Table and RLS policies exist. No route, page, form, service, version workflow, or export is exposed. | Missing |
| Class-record templates | Create/import/generate/view/edit/export/delete templates | Table and policies exist. No template UI or service exists. | Missing |
| LMS integration | Configure connection; import class, assessment, and attendance data in a controlled environment | Integration/import-job tables exist. “Test connection” always changes local text to “Connection verified with mock service.” No adapter, upload/mapping flow, job monitor, or imported dataset exists. | Incorrect / Missing |
| Student management | Search/sort/filter; add/import; edit profile/status; link classes; monitor performance | Faculty has a validated add form and local search/year filter, but additions are component state only. Dean gets a generic table and simulated confirmation, not a form. No CSV/text import, edit, enrollment, profile drill-down, sorting, pagination, or stable row ID is implemented. | Incorrect / Partial |
| Faculty management | Invite faculty, assign classes, view/edit scoped profiles | Dean can read a mock/generic table. “Add Faculty” is simulated. No invitation, assignment, edit, or profile workflow exists. | Missing |
| Class records | Import/create/view/edit/delete; search/sort/filter/export; version history/restore | Faculty can add/edit fictional rows in local state. Dean actions are simulated. Database tables exist, but no durable CRUD, import/export, assessments breakdown, version history, restore, archive, concurrency, or row-ID detail exists. | Incorrect / Partial |
| Assessments and results | Create/edit/delete assessments; manually record or import attendance, exams, assignments, participation; export results | Grader can create an assessment and save a score in local state. No production service, source categories, bulk grid/import, attendance/participation, durable result, or export workflow exists. | Incorrect / Partial |
| Grader submission lifecycle | Faculty assigns grader; grader collects/submits; faculty reviews/approves/rejects; only approved results become official | Domain transitions, schema, RLS, and a protected review function exist. UI has no assignment, submit, approve, reject, rejection reason, resubmission, status history, or durable write. It labels a local score save as successful. | Partial backend / Missing UI |
| Configurable evaluation criteria | Nested criteria and weights; validate 100%; persist and feed calculations | Domain validation and a database check prevent active totals other than 100%. Dean only sees mock criteria; “Add Criteria” returns “simulated … no production record.” No nested editor, reordering, versioning, activation, or calculation link exists. | Partial backend / Missing UI |
| Automatic grade calculation | Recalculate after assessment/configuration changes using approved results | A tested pure `calculateWeightedPercentage` function exists. It is not invoked from any application/service/database workflow. Local screens use precomputed mock percentages. | Partial |
| Performance evaluation/classification | Generate/view/filter/export calculated performance using transparent criteria | Tables and deterministic classification helper exist. Evaluation page displays a mock chart and “Run Evaluation” simulation. No job, inputs, result set, explanation, filter, or export exists. | Incorrect / Missing |
| AI prediction | Use an approved model to predict assessment/overall performance, risk, trend, confidence, and explanation; advisory only | AI endpoint correctly fails closed when no model exists. UI nevertheless displays precise fictional “AI” values and claims “AI Active—Real-time data access enabled.” No model adapter, feature schema, validated model, run persistence, or real inference exists. | Incorrect |
| Personalized feedback | Generate from evaluation/prediction; faculty edits/previews/sends; audit and email delivery | Faculty selects a canned template, appends a local “Recent Feedback” item, and shows “Feedback sent successfully.” No AI draft, data grounding, preview, persistence, delivery attempt, email, failure state, or audit event occurs. | Incorrect |
| Student feedback | Student can view their own personalized feedback | Student sees mock feedback rows/content. RLS self-read policy exists, but no verified durable feedback/delivery flow populates it. | Partial |
| Real-time dashboard and analytics | Persisted KPIs, trends, distributions, at-risk cohorts, filters/drill-down/export | Demo dashboards are attractive but hard-coded. Production generic dashboards provide limited counts and explicitly show no chart history. Faculty/grader pages always use mock analytical data. No real-time subscription or production aggregation exists. | Incorrect / Partial |
| Notifications | Role-scoped notification center, preferences, related navigation, email | Bell, unread count, mark-read/all-read, and DB service exist. Demo notifications are fictional. Preferences persist only one hard-coded event type in production; related URLs include a record query that pages do not consume. No email worker exists. | Partial |
| Audit/access/system logs | Append meaningful events; inspect/filter/detail/export logs | Tables and a single grader-review audit insert exist. Ordinary profile/event/settings/academic changes are not automatically audited. Lists are generic; filtering, detail, export, immutability verification, and access-log instrumentation are absent. | Partial / Missing |
| Backup management | Create, verify, inspect, restore, delete, configure retention/schedule | Schema exists; production “Create Backup” can only queue a row. No worker/provider, artifact, checksum execution, restore/delete workflow, schedule, retention, or recovery verification exists. Demo only simulates. | Partial scaffold |
| Exports | Raw CSV/JSON and PDF reports | Export-labelled buttons either simulate or are absent. No file generation/download is implemented. | Missing |
| Security/encryption | RBAC, least privilege, confidentiality/integrity, MFA, secure records | RLS is enabled on all public tables and many policies exist. MFA is only a settings value. No encryption mechanism is demonstrated. Department-scoped permissions are not consistently row-scoped. No running DB/advisor/integration evidence is available. | Partial |
| Mobile app and browser | Usable responsive application on mobile and web | Expo supports both targets and sidebar collapses. At 375 px, verified document width was 568 px, causing horizontal overflow. Tables have a hard 760 px minimum; several forms/cards require 400–440 px. | Partial / Incorrect |
| Event logging and iterative updates | Entry/config changes trigger recalculation, prediction, feedback, and logs | Local changes update only the current component. No durable event pipeline or downstream recomputation exists. | Missing |

## 2. Feature classification

### Implemented and verified

- Expo application boot, static web build, routing, sidebar navigation, role home selection, logout, and cross-role route redirection.
- Demo password validation and safe invalid-credential error.
- Shared form primitives, disabled states, some loading/error/empty states, event chronology validation, student form validation, class summary validation, and grader score-range validation.
- Domain-only rules for 100% weights, score bounds, deterministic classification, report summary, permissions, and grader transition legality; these have unit tests.
- AI service fail-closed response when no approved model artifact is configured.
- Substantial relational schema: 44 tables, constraints, indexes, RLS enabling, role/permission seeds, and protected grader-review function.

These implemented pieces do not constitute the thesis's complete user workflows.

### Partially implemented

- Supabase email/password authentication, OAuth provider method, recovery, profile lookup, notification read/update, profile update, system-settings upsert, event insert, backup queue row, and generic production reads.
- RBAC at route, domain, and database levels, but with incomplete scope checks and no running integration verification.
- Dashboard production counts, database read tables, notification center, profile/password forms, event form, criteria/grade validation primitives, and schema for nearly all thesis entities.
- Student own-record and feedback read models, but no verified data-producing workflow.

### Missing

- MFA/OTP challenge and Google sign-in UI.
- Invitations/sign-up/account activation; user/role/permission/admin account CRUD.
- Academic guideline and class-record-template modules.
- LMS connection, mapping, imports, job errors, and attendance/participation ingestion.
- Durable student/faculty/class/assessment/result CRUD, stable record details, archival, version history, and restore.
- Grader assign → draft → submit → faculty approve/reject → official-result UI flow.
- Criteria editor, formula editor, activation/versioning, and calculation orchestration.
- Evaluation/prediction jobs and model-backed outputs.
- Grounded feedback generation, preview, email/account delivery, delivery retries, and audit trail.
- Production analytics, drill-down, server filters/sort/pagination, CSV/JSON/PDF exports.
- Backup worker/provider, verification, restore/delete, schedule/retention.
- Comprehensive audit/access logging and security administration.

### Incorrectly implemented or misleading

- Fictional AI outputs are presented as active, real-time, and high-confidence despite the model service being unavailable.
- Faculty/grader/student-facing mutations report success while changing only local state or explicitly simulating the operation.
- Student Grades and Feedback pages expose “Submit Grades” and “Send Feedback” actions even though the thesis grants the student only feedback receipt/viewing.
- “Test connection” always reports a verified mock service; it does not test an integration.
- Faculty settings tabs state that preferences are stored/saved although most only show a local success toast.
- Demo tests treat the presence of local mock rows as workflow success, so green E2E results overstate implementation completeness.
- The AI assistant says it has access to the “entire school management system,” contradicting least privilege and the absence of an approved model/query service.

## 3. Role, workflow, page, control, validation, and response audit

| Role / page | Controls tested or inspected | Actual result | Audit finding |
|---|---|---|---|
| Public login | Role menu, email, password reveal, remember, reset, Sign In | Demo auto-fills credentials; role match and invalid password work; reset is unavailable in demo | No MFA; no rendered Google button; no invitation/sign-up; email is only required, not institution-domain validated |
| Student overview | Metrics/charts/cards | Fictional grade, risk, and performance content | Read-only intent is reasonable, but output is not derived from persisted student data |
| Student grades | Search, status tabs, rows, “Submit Grades” | Mock read; mutation opens generic simulated action | Incorrect role interaction; students must not submit grades |
| Student feedback | Search, tabs, rows, “Send Feedback” | Mock read; mutation opens generic simulated action | Incorrect role interaction; student should receive/view feedback only |
| Student settings | Profile/password/notifications | Demo save simulates; password unavailable | No privacy/data controls described in mockup; no verified persistence |
| Grader overview | Trend, AI risk, attention list | All values from `mockGrader.ts` | Fictional AI passed off as analytical output |
| Grader grades | Create assessment; tabs; select student; score; feedback; save; grade book | State-only assessment and grade update; no submission state or persistence | Wrong workflow boundary: grader can appear to finalize a grade without faculty approval |
| Grader settings | Profile, security, notification, appearance | Profile save simulates; password unavailable in demo; other tabs informational | Partial form shell only |
| Faculty overview | Metrics, at-risk list, recent assessments, AI prediction | All mock data, including 94.3% confidence | Materially false AI state |
| Faculty students | Search, year filter, Add Student form | Validation works; addition lives only in component state and reload removes it | “Student added successfully” is misleading; no enrollment/import/edit/details |
| Faculty records | Search, semester filter, add/edit form | Passed+failed/average validation works; records are local only | No assessment structure, persistence, versioning, import/export, or concurrent update handling |
| Faculty events | Add form | Valid date/title fields create local card only | Duplicates Dean event implementation and bypasses DB service |
| Faculty feedback | Template, student selection, message, Send, Clear | Adds local recent item and says sent | No persistence or delivery; no preview/audit/error state |
| Faculty analytics | Filters/charts | Filters and values are mock/local | No query, drill-down, evaluation/prediction linkage, or export |
| Faculty assistant | Prompt cards/text Send | Keyword-based canned answer and “real-time data access” claim | Must be removed/disabled until grounded service and authorization exist |
| Faculty settings | Seven tabs; profile/security/preferences/photo | Profile save simulates; preference tabs return local success; photo button only toasts | Misleading success and incomplete sensitive-change confirmations |
| Academic Admin dashboard | KPIs/charts/recent classes | Mock values | Not an executive view over persisted department data |
| Academic Admin students/faculty/records/criteria | Search, status tabs, row detail, primary action | Reads mock/generic rows; action confirms then explicitly says simulated | No domain-specific forms or durable writes; details lose stable IDs |
| Academic Admin evaluation/analytics | Tabs/chart; Run/Export | Mock series; Run/Export simulated | Core thesis objective is absent |
| Academic Admin events | Full event form | Good chronology validation; demo prepends local row; production service exists | Most complete CRUD fragment, but lacks edit/delete/audience notifications and E2E persistence |
| Academic Admin settings | Profile/password/notifications | Same generic partial implementation | No mockup's full privacy/data-backup behavior |
| System Operator dashboard | User metrics/activity | Mock/empty production | No operational health query |
| System Operator roles | Search/table/Add Role | Mock read and simulated action | No role-permission editor or protected workflow |
| System Operator logs | Search/tabs/table/Export | Generic read and simulated export | No log type filters, detail, export file, or access-event instrumentation |
| System Operator system | General/auth/integration tabs, toggles, selects, Test, Save | Demo returns simulated save; test always verifies mock service | Controls are largely cosmetic; MFA value is not authentication enforcement |
| Super Admin backup | Search/table/Create Backup | Demo simulates; production can queue DB row only | No backup execution, artifact, verification, restore, delete, or settings |
| Super Admin admins | Search/table/Add Admin | Simulated | No account lifecycle or restricted Auth worker |
| Super Admin logs | Search/table/Export | Same generic partial list | No verified access/system log management |
| Super Admin system/settings | Config/profile controls | Mostly simulated/local | No initial/backup configuration workflow described by thesis |

### Shared navigation and system-state findings

- Role route protection works, and unknown roles/views redirect safely.
- Global page search only searches permitted route labels; it does not search class records or students as the thesis mockup states.
- Generic row search/filter operates only on the currently loaded client rows. There is no server search, sort, pagination, URL state, or stable selection.
- Generic row details concatenate visible cell strings and report “Validated mock dataset”; they do not retrieve a record by ID.
- Generic database lists expose loading/error/retry/empty states. Specialized faculty and grader mock screens do not provide real request/offline/concurrency states because they never call a backend.
- Notifications support read/unread changes, but demo notifications include targets that some roles do not possess; record query IDs are ignored by destination pages.
- Toasts use one success icon/style for both success and error. Several local-only actions use definitive “successfully” wording.
- Sensitive/local faculty actions have no pending state, duplicate-submit prevention, unsaved-change warning, or confirmation.

### Validation audit

Present validations include required login fields, basic email shape in some forms, `SWU-###` student ID shape, student phone length, event datetime format/order, class passed+failed=total, average range, assessment positive points/weight, score bounds, required feedback, password match, and 12-character password in shared/grader settings.

Missing or incomplete validations include institutional email-domain enforcement, MFA/OTP, duplicate student IDs/emails, class/subject foreign-key selection, term status, enrollment uniqueness feedback, date validity in the grader assessment form, aggregate assessment/criteria weight enforcement in UI, optimistic version/conflict checks, file type/size/schema validation for imports, formula validation, feedback recipient/delivery verification, authorization-aware field options, and accessible field-level summaries/focus management.

## 4. Specific thesis mismatches

1. **Expected:** Predictions come from ML models and are processed into personalized feedback. **Actual:** the AI endpoint refuses predictions, while the faculty screen shows “Model confidence 94.3%” and the grader screen shows AI pass likelihoods from constants. **Problem:** fabricated decision-support outputs can mislead educators. **Correction:** gate all AI UI on a verified model run ID/version; show an explicit unavailable state otherwise.
2. **Expected:** Grader submits results and faculty approves/rejects before official use. **Actual:** grader “Save Grade & Feedback” immediately updates a local grade book; no submit or review step exists. **Correction:** implement assignment, draft batch, submit, lock/version, faculty review, rejection reason, resubmission, approval transaction, and audit event.
3. **Expected:** Academic Admin manages criteria used by calculations. **Actual:** “Add Criteria” opens a generic confirmation and returns “simulated … no production record was written.” **Correction:** build a nested versioned editor with a visible 100% total and activation transaction.
4. **Expected:** Feedback is generated, edited, sent to the student by email/account, and logged. **Actual:** Send appends a local array item and displays “Feedback sent successfully.” **Correction:** create a feedback record, queue delivery, expose pending/sent/failed status, retain delivery attempts, and audit the sender/model/input version.
5. **Expected:** System Admin configures integrations. **Actual:** “Test connection” always sets “Connection verified with mock service.” **Correction:** use a server-side adapter test with timeout, provider identity, scope confirmation, timestamp, and safe error details.
6. **Expected:** Dashboards visualize centralized current data. **Actual:** faculty/grader values remain hard-coded even when the protected model is unavailable. **Correction:** replace `mockFaculty.ts`, `mockGrader.ts`, and `mockDashboard.ts` with authorized aggregate queries and timestamp/source labels.
7. **Expected:** Student only receives/views feedback. **Actual:** student pages expose Submit Grades and Send Feedback. **Correction:** remove the actions and add permission assertions at component/service/database layers.
8. **Expected:** Role-based least privilege limits Academic Admin to assigned scope. **Actual:** policies such as student/event department management use a global permission predicate without matching the row's department to `user_roles.scope_id`. **Correction:** require a scope-aware helper for every department/program/class policy and test cross-department denial.
9. **Expected:** Mobile and web access. **Actual:** at 375 px, the page scroll width is 568 px; tables enforce 760 px minimum and multiple cards/forms enforce 400–440 px minimums. **Correction:** provide table/card mobile patterns, collapse header content, and remove viewport-exceeding minimum widths.

## 5. Usability, interface, accessibility, and technical issues

### Usability and interface

- Primary buttons frequently do not lead to task-specific forms; they open a generic confirmation or a local-only demo mutation.
- Rows look actionable but provide only a concatenated detail panel; no edit/view/history routes exist.
- No breadcrumbs, task progress, durable saved-state indicator, last-synced timestamp, or dataset/model provenance appears.
- Mobile top bar is overcrowded; verified horizontal overflow makes content and table columns inaccessible without page-level sideways scrolling.
- Generic status tabs are not accompanied by counts; specialized filters do not persist across navigation.
- Mock and production states are not consistently distinguished. Some generic actions disclose simulation, while specialized screens say “successfully,” “AI Active,” and “real-time data access.”

### Accessibility

- On the tested faculty student page the DOM had zero semantic headings; page/section titles are generic text.
- Several `Pressable` controls (mobile menu, notification, profile, tabs, row filters) lack explicit button/tab roles. The accessibility snapshot exposed some as generic nodes rather than buttons.
- Search fields rely on placeholders; the record search had no accessible label in the tested DOM.
- Tabs do not expose `tablist`/`tab` roles or selected state.
- Data tables are flexbox rows, not semantic HTML tables; column/header relationships are not communicated to assistive technology.
- Dialogs do not expose a dialog title/description relationship, initial focus, focus trap, or return focus behavior.
- Color/status badges often carry meaning without a separate accessible description; contrast and keyboard traversal have not been formally tested.
- No automated accessibility test suite or stated conformance evidence exists, although the internal assumptions mention WCAG 2.1 AA.

### Technical and security

- Demo mode overrides the configured Supabase client, so current E2E tests do not exercise Auth, SQL constraints, RLS, persistence, concurrency, email, model service, imports, or workers.
- Existing E2E tests deliberately assert fictional AI content and local mutations, embedding prototype behavior as the expected contract.
- `profiles_self_update` grants row-level self update while authenticated users have UPDATE on all columns; column privileges or a restricted RPC should prevent changes to protected profile fields such as status/email.
- Scope-bearing `user_roles` are not consistently used in RLS predicates. `private.has_permission` ignores scope type/id, and several manage/read policies rely only on that global boolean.
- Database schema verification is textual. Local database reset, RLS adversarial tests, advisors, migration execution, and live query tests were not available/proven.
- Most writes do not create audit events; event logging is not an end-to-end invariant.
- No production worker processes prediction runs, delivery attempts, imports, backups, or notifications.
- No idempotency keys, retry strategy, optimistic locking, or transaction boundaries are wired from UI services.
- Raw Supabase errors can propagate from several services, creating inconsistent and potentially over-detailed user feedback.
- The manuscript itself lacks Chapter 5/post-development acceptance evidence, an ERD/data dictionary, model artifact/feature schema/metrics, retention/RTO/RPO, and quantified performance/accessibility targets. These gaps do not justify displaying fictional completion.

## 6. Prioritized recommendations

### Critical

1. **Eliminate misleading AI and success states.** Remove or clearly watermark all fictional AI outputs; gate assistant/prediction/feedback generation on an approved model run and authorized dataset. Use “Demo data—no academic decision” in every demo surface.
2. **Make production persistence the acceptance path.** Set demo mode off for acceptance, apply migrations to an isolated Supabase environment, seed fictional fixtures through the database, and rerun all role workflows against real Auth/RLS/transactions.
3. **Implement the core academic transaction chain.** Criteria/template → class/enrollment → assessment/result/import → grader submit/review → approved calculation → evaluation → prediction → editable feedback → delivery/audit.
4. **Repair scope-aware authorization.** Replace permission-only department policies with helpers that match row department/program/class to active `user_roles` scope. Restrict profile column updates. Add adversarial RLS tests for every role and cross-department access.
5. **Implement the thesis authentication contract.** MFA/OTP for required roles, Google UI/provider handling, invitation acceptance, account activation/suspension, session policy, and sensitive-action reauthentication.

### High

1. Build durable, versioned forms/services for students, faculty assignments, guidelines, templates, class records, assessments, results, criteria, and events.
2. Implement the full grader review lifecycle and ensure only approved results enter calculations.
3. Add real aggregate queries, filters, drill-down, provenance, freshness timestamps, and CSV/JSON/PDF export.
4. Implement feedback persistence and delivery queues with sent/failed/retry status; do not show “sent” before provider confirmation.
5. Add LMS adapter configuration and controlled import with preview, schema mapping, validation report, partial-failure handling, and rollback/idempotency.
6. Add durable audit/access/system events for authentication and every privileged change; expose filters/detail/export without allowing mutation of logs.
7. Implement backup provider/worker, checksum verification, restore drill, retention, and recovery evidence.
8. Fix mobile overflow and verify 320/375/768/1024/desktop widths for every role and modal.

### Medium

1. Add semantic headings, accessible labels, button/tab roles, semantic tables or equivalent grid semantics, keyboard/focus-managed dialogs, live-region error summaries, and automated accessibility checks.
2. Replace client-only list filtering with authorized server search/filter/sort/pagination and stable record IDs/routes.
3. Standardize loading, offline, timeout, retry, empty, validation, conflict, pending, success, and failure states; use different toast semantics/icons.
4. Add optimistic concurrency/version checks, idempotency, duplicate-submit prevention, unsaved-change warnings, and protected transactional RPCs.
5. Split specialized role screens into testable modules and remove parallel mock implementations that bypass shared services.

### Low

1. Improve compact-header behavior, filter counts, breadcrumbs, help text, and consistent terminology (`Academic Admin`/`Dean`, `System Admin`/`System Operator`).
2. Add model/data provenance tooltips, glossary, and clearly labeled advisory disclaimers.
3. Expand documentation with a traceability matrix, data dictionary, API contracts, retention/RTO/RPO, accessibility target, and acceptance-test evidence.

## 7. Final assessment

**Verdict: interactive prototype, not thesis-complete system.**

The application is beyond a static mockup: navigation, form mechanics, validation samples, build tooling, domain rules, an AI fail-closed boundary, and a broad relational/RLS schema are real. Nevertheless, the thesis's defining value chain is not operational. There is no verified durable end-to-end path from authorized academic data entry through approved grade calculation, evaluation, model prediction, personalized feedback, delivery, analytics, audit, and backup. The current experience can make a reviewer believe these processes work because it displays convincing fictional outputs and local success messages. Until the critical items above are completed and verified in non-demo integration tests, the system should be presented only as a **high-fidelity prototype plus backend schema foundation**.

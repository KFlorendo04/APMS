# UI Interaction Audit

Audited 2026-08-06 against the Expo application, Supabase migrations, domain rules, automated tests, and the approved Figma inventory. “Functional” means a real authenticated database/Auth operation is present; a visual state change alone is not counted. Development demo mode is explicitly classified as mock data and is not evidence of production completion.

## Shared application interactions

| Area | Visible interaction/state | Classification | Evidence / gap |
|---|---|---|---|
| Login | Role selector, email, password, visibility, Remember me, submit, validation, loading | Fully functional in configured mode; uses mock data in demo mode | Supabase password sign-in, active-profile lookup, role check, saved-email preference, persistent session, safe errors |
| Login | Sign In with Google | Fully functional when the Google provider is configured; unavailable in demo mode | Supabase OAuth, Expo 57 auth browser session on native, redirect session detection on web |
| Login | Password reset | Fully functional in configured mode; unavailable in demo mode | Supabase reset email request with neutral account-enumeration-safe success text |
| Authentication | Logout and protected redirects | Fully functional | Supabase sign-out; unauthenticated and cross-role route guards |
| Authorization | Manually entered invalid role/view URL | Fully functional | Unknown roles return to login; views outside the role navigation are redirected to role home |
| Shell | Sidebar navigation, active state, mobile drawer, Settings, Logout | Fully functional | Role-specific route map and protected routes |
| Shell | Header page search | Fully functional | Searches the role’s permitted pages and navigates to the selected page |
| Shell | Notification bell, unread count, list, mark read/all read, related navigation | Fully functional in configured mode; empty in demo mode | Reads and updates `notifications` under recipient RLS |
| Shell | Profile menu, settings navigation, sign out | Fully functional | Real navigation/Auth operations |
| Tables | Loading, request error/retry, empty state, row detail | Partially functional | Real reads and RLS exist; detail is generic and does not load the stable record ID |
| Tables | Search | Partially functional | Works on the currently loaded result only; not server-side and not URL-persisted |
| Tables | All/Active/Pending tabs | Static only | Selection changes, but does not constrain the query or rows |
| Tables | Sorting, pagination, row selection/actions | Not yet implemented | No sort headers, page controls, stable selection, or row action menu |
| Forms | Profile save | Fully functional in configured mode; mock-only in demo mode | Required names, pending/duplicate-submit protection, RLS-scoped update, error preservation |
| Forms | Password change | Fully functional in configured mode; unavailable in demo mode | Reauthenticates current password, enforces 12 characters, updates Supabase Auth |
| Forms | Notification/system settings | Partially functional | One preference/system key persists; several visible toggles and fields are local-only |
| Dialogs | Close/Cancel/Escape/background lock/pending | Fully functional | Native modal, request-close handling, disabled pending actions |
| Toasts | Success/error feedback | Partially functional | Feedback works, but a single visual style is used for success and failure |
| Dashboard | Metric cards | Fully functional in configured mode; hard-coded in demo mode | Database counts/aggregates in production; development values remain fictional |
| Dashboard | Charts, activity, student identity panels | Hard-coded in demo mode; empty in configured mode | No production aggregate/chart query implemented |
| Analytics | Tabs, preview, charts, export | Static only / hard-coded | Tabs do nothing; preview values are fictional; production returns an empty state |
| Assistant | Prompt and Send | Static only | Correctly refuses to fabricate; no approved model/provider or persisted query service |

## Route and screen inventory

Each row includes the controls visible on that route in the current shared implementation. All routes also inherit the shared shell controls and loading/error/empty behavior above.

| Role | Route | Figma | Screen | Visible controls | Current classification |
|---|---|---|---|---|---|
| Public | `/` (`/login`) | `354:208` current; `309:4094` role states | Login | role menu, email/password, reveal, Remember me, reset, submit, Google sign-in | Functional configured; mock-capable in explicit demo mode |
| Student | `/portal/student/overview` | `281:938` | Dashboard | metric cards, charts/info | Metrics functional; charts/info hard-coded demo or empty production |
| Student | `/portal/student/grades` | `281:446` | Grades | search, status tabs, rows, Submit Grades | Read functional; search partial; tabs static; action missing backend workflow |
| Student | `/portal/student/feedback` | `281:250` | Feedback | search, tabs, rows, Send Feedback | Read functional; mutation incorrectly exposed for student and unimplemented |
| Student | `/portal/student/settings` | `281:747` | Settings | profile/password/notification tabs and forms | Profile/password functional; preferences partial |
| Grader | `/portal/grader/overview` | `281:3059` | Dashboard | metrics, risk chart, attention table | Metrics functional; remaining content hard-coded demo/empty production |
| Grader | `/portal/grader/grades` | `281:1743`,`281:2160`,`281:2484` | Grade workflow | search, tabs, rows, Submit Grades | Read functional; collection/submission form and status lifecycle missing |
| Grader | `/portal/grader/feedback` | not mapped | Feedback | generic search/tabs/table/action | Route is present in navigation but absent from approved route map; mutation missing |
| Grader | `/portal/grader/settings` | `281:2873` | Settings | profile/password/notification tabs | Profile/password functional; preferences partial |
| Faculty | `/portal/faculty/overview` | `309:4915` | Overview | metrics, trend/risk/recent classes | Metrics functional; remaining content hard-coded/empty |
| Faculty | `/portal/faculty/students` | `309:5312` | Students | search, tabs, rows, Add Student | Read functional; create/import/profile/row actions missing |
| Faculty | `/portal/faculty/records` | `309:5626` | Class records | search, tabs, rows, Create Class Record | Read functional; CRUD/version/export missing |
| Faculty | `/portal/faculty/feedback` | `309:6244` | Feedback | search, tabs, rows, Send Feedback | Read functional; compose/template/send workflow missing |
| Faculty | `/portal/faculty/analytics` | `309:6459` | Analytics | tabs, preview, Export Report | Static/hard-coded demo; production aggregate/export missing |
| Faculty | `/portal/faculty/assistant` | `309:4430` | Assistant | prompt, Send | Service not implemented; no fabricated response |
| Faculty | `/portal/faculty/settings` | `309:6020`,`309:4626` | Settings | profile/password/preferences | Profile/password functional; preferences partial |
| Dean | `/portal/academic_admin/overview` | `309:10690` | Dashboard | metrics, charts, recent classes | Metrics functional; remaining content hard-coded/empty |
| Dean | `/portal/academic_admin/students` | `309:7559` | Students | search, tabs, rows, Add Student | Read functional; add/import/unenroll/details missing |
| Dean | `/portal/academic_admin/faculty` | `309:7897` | Faculty | search, tabs, rows, Add Faculty | Read functional; invite/assign/profile workflow missing |
| Dean | `/portal/academic_admin/records` | `309:8362` | Class records | search, tabs, rows, Create Class Record | Read functional; CRUD/version/export missing |
| Dean | `/portal/academic_admin/criteria` | `309:8660` | Criteria | search, tabs, rows, Add Criteria | Read functional; validated weights/version/publish CRUD missing |
| Dean | `/portal/academic_admin/evaluation` | `309:10268` | Evaluation | analytics tabs, Run Evaluation | Static; model-backed protected run missing |
| Dean | `/portal/academic_admin/analytics` | `309:8927` | Analytics | tabs, preview, Export Report | Static; production aggregate/export missing |
| Dean | `/portal/academic_admin/events` | `309:11386` | Events | search, tabs, rows, Add Event | Read functional; CRUD/audience notification flow missing |
| Dean | `/portal/academic_admin/assistant` | `309:10048` | Assistant | prompt, Send | Service not implemented |
| Dean | `/portal/academic_admin/settings` | `309:9487`,`309:9735` | Settings | profile/password/preferences | Profile/password functional; preferences partial |
| Operator | `/portal/system_operator/overview` | `309:11797` | Dashboard | user metrics, activity/distribution | Metrics functional; activity/distribution hard-coded/empty |
| Operator | `/portal/system_operator/roles` | `309:12246` | Roles | search, tabs, rows, Add Role | Read functional; role/permission CRUD and confirmation missing |
| Operator | `/portal/system_operator/logs` | `309:12673` | Logs | search, tabs, rows, Export Logs | Read functional; filters/detail/export missing |
| Operator | `/portal/system_operator/system` | `309:12046` | System settings | general/auth/integration tabs, fields/toggles/Test/Save | Session value persists; most controls local-only or static |
| Operator | `/portal/system_operator/settings` | `309:12455`,`309:13037`,`309:13320` | Settings | profile/password/preferences | Profile/password functional; preferences partial |
| Super Admin | `/portal/super_admin/backup` | `309:13511` | Backups | search, tabs, rows, Create Backup | Read and queue request functional; worker, details, restore/delete/settings missing |
| Super Admin | `/portal/super_admin/admins` | `309:13767` | Admins | search, tabs, rows, Add Admin | Read functional; protected Auth invite/account lifecycle missing |
| Super Admin | `/portal/super_admin/logs` | `309:14026` | Logs | search, tabs, rows, Export Logs | Read functional; filters/detail/export missing |
| Super Admin | `/portal/super_admin/security` | `309:14980` | Security | metrics, Save Policy | Telemetry hard-coded demo/empty production; save missing |
| Super Admin | `/portal/super_admin/notifications` | `309:15175` | Notification settings | delivery/templates/rules tabs and Save | Preference write partial; templates/rules local-only |
| Super Admin | `/portal/super_admin/system` | `309:14577`,`309:15356` | System settings | general/auth/integration controls and Save | Session value persists; most controls local-only |
| Super Admin | `/portal/super_admin/info` | `309:15536` | System info | metric cards | Hard-coded demo/empty production |
| Super Admin | `/portal/super_admin/assistant` | `309:14383` | Assistant | prompt, Send | Service not implemented |
| Super Admin | `/portal/super_admin/settings` | `309:14759`,`309:15724` | Settings | profile/password/preferences | Profile/password functional; preferences partial |

## Backend and workflow findings

- The database contains 44 normalized tables, explicit RLS policies, scoped helper functions, and a protected grader-review transition. It is substantially ahead of the UI.
- Production reads are real and RLS-scoped, but most list queries have no server-side search/filter/sort/page contract and lose stable record IDs during display mapping.
- With the exception of backup queueing, profile/settings writes, notification reads, and Auth operations, primary screen actions do not have validated forms or complete writes.
- The demo implementation still supplies fake identities, dashboards, charts, rows, and success messages. It is gated by `EXPO_PUBLIC_DEMO_MODE=true`, but must be replaced by database seed fixtures in end-to-end tests before production acceptance.
- Current E2E coverage proves login/guards/navigation and a simulated modal, not cross-role persistent workflows.

This audit intentionally does not label the application complete. Outstanding work is tracked in `docs/verification/UI_INTERACTION_CHECKLIST.md`.

# Acceptance Criteria

## Global definition of done

- [ ] Every `FR-*` and `NFR-*` requirement is traced to implementation and tests or an explicit limitation.
- [ ] All 53 primary Figma frames and every listed modal/state are mapped to a route/component or documented legacy/reference-only state.
- [ ] Protected operations are checked server-side/data-layer-side and by database RLS where applicable.
- [ ] Fresh migrations and fictional seed data succeed.
- [ ] Production paths use stored data; dashboards/reports contain no hard-coded prototype totals.
- [ ] Typecheck, build, unit, integration, database, API, permission, E2E, and report-calculation suites pass.
- [ ] No real secret, plaintext password, universal password, or sensitive log data is committed.
- [ ] Each visible control functions or displays an explicit configuration/unavailable explanation.
- [ ] Visual verification records route, Figma node, viewport, result, and remaining differences.

## Critical workflow criteria

### Authentication and RBAC

1. Valid users reach only their role dashboard; invalid, inactive, expired, and unauthorized requests return safe messages/statuses.
2. Logout revokes/ends the session; protected routes no longer load.
3. Each role is denied every restricted route and mutation in the permission suite.
4. Record-level tests prove student self-only, grader assignment, faculty class assignment, and Dean department scope.
5. Role changes, login failures/successes, sensitive settings, and session events produce appropriate logs without secrets.

### Criteria, class, and assessment workflow

1. Authorized users can create/import, retrieve, update, filter, paginate, export, and permitted-delete/archive class records.
2. Invalid/duplicate records, invalid dates, stale versions, and missing relations fail transactionally with useful messages.
3. Criteria cannot activate unless weights/formulas are valid; calculations identify their criteria version.
4. A grader can edit an assigned draft, submit it once, and see status; cannot self-approve or access another assignment.
5. Faculty can approve/reject assigned submissions; only approved values change calculated performance.

### Evaluation, prediction, and feedback

1. Calculated grades match documented fixtures and ignore unapproved/invalid results.
2. Risk/trend/confidence outputs store model/version/input provenance.
3. Missing model/provider configuration shows an unavailable state and never fake success.
4. Faculty can review/edit/preview/send feedback; students can retrieve only their own sent feedback; send attempts are audited.

### Dashboards and reports

1. Dashboard metrics reconcile with seed/database queries and refresh after mutations.
2. Filters, sorting, date ranges, pagination, totals, and role scopes behave consistently on screen and export.
3. CSV/JSON/PDF exports contain the authorized filtered result, no hidden rows from other scopes, and tested totals.

### Technical administration

1. System Operator can manage users/RBAC/settings/integrations/logs but cannot silently escalate self or read academic content without a separate grant.
2. Super Admin can manage technical admin accounts and backup lifecycle but does not inherit all System Operator functions.
3. Backup create/restore/delete requires confirmation, records status/errors safely, and creates immutable audit events.

## UI and visual criteria

1. Each route matches its Figma frame at the recorded 1179/1194px viewport for layout, typography, colors, spacing, radii, shadows, icons, overflow, table/form geometry, and overlays.
2. Responsive layouts preserve navigation and every action at compact and medium widths without horizontal content loss.
3. All forms have labels, keyboard focus, validation summaries/messages, disabled/pending states, and success/error feedback.
4. Tables implement search/filter/sort/pagination plus loading, empty, error, and access-denied states.
5. Modal focus is trapped/restored, destructive actions require confirmation, and Escape/back behavior is safe.

## Operational criteria

1. `.env.example` lists all variables without secrets; missing optional integrations fail explicitly.
2. Setup documentation gives exact install, environment, database, migration, seed, start, test, and production-build commands.
3. Deployment documentation covers web/mobile client, Supabase migrations/RLS, inference service, secrets, backups, and rollback.
4. Known limitations reflect only genuine unresolved constraints, especially provider credentials and approved model artifacts.


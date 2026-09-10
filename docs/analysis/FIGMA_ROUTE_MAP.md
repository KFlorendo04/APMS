# Figma Route Map

Routes are application mappings for the approved frames. Modal destinations remain overlays on their owning route.

| Role | Route | Figma node | Backend capability / principal calls |
|---|---|---|---|
| Public | `/login` | `309:4094` | auth providers, role discovery, session creation |
| Faculty | `/faculty` | `309:4915` | dashboard aggregates, attention list, recent assessments |
| Faculty | `/faculty/students` | `309:5312` | student roster/profile/import in assigned classes |
| Faculty | `/faculty/classes` | `309:5626` | class records, templates, versions, export |
| Faculty | `/faculty/feedback` | `309:6244` | feedback templates/drafts/send/history |
| Faculty | `/faculty/analytics` | `309:6459` | assigned-class analytics and report export |
| Faculty | `/faculty/assistant` | `309:4430` | permission-filtered assistant/query service |
| Faculty | `/faculty/settings` | `309:6020`, `309:4626` | profile, password/MFA, preferences |
| Student | `/student` | `281:938` | own dashboard aggregates |
| Student | `/student/grades` | `281:446` | own approved results/evaluations |
| Student | `/student/feedback` | `281:250` | own sent feedback |
| Student | `/student/settings` | `281:747` | own profile/security/preferences |
| Grader | `/grader` | `281:3059` | assignment/submission summaries |
| Grader | `/grader/grades` | `281:1743`, `281:2160`, `281:2484` | assigned assessment entry, submit, status |
| Grader | `/grader/settings` | `281:2873` | own profile/security/preferences |
| Dean | `/dean` | `309:10690` | department/program dashboard aggregates |
| Dean | `/dean/students` | `309:7559` | department students/profile/unenroll/import |
| Dean | `/dean/faculty` | `309:7897` | faculty directory/profile/assignment |
| Dean | `/dean/classes` | `309:8362` | department class records/templates/versions |
| Dean | `/dean/criteria` | `309:8660` | criteria set CRUD/version/activation |
| Dean | `/dean/performance` | `309:10268` | evaluation/prediction queries and runs |
| Dean | `/dean/analytics` | `309:8927` | department analytics/report export |
| Dean | `/dean/events` | `309:11386` | event CRUD/audiences/notifications |
| Dean | `/dean/assistant` | `309:10048` | permission-filtered assistant/query service |
| Dean | `/dean/settings` | `309:9487`, `309:9735` | profile/security/preferences |
| System Operator | `/operator` | `309:11797` | technical dashboard/status aggregates |
| System Operator | `/operator/system` | `309:12046` | auth limits/integrations/system settings |
| System Operator | `/operator/roles` | `309:12246` | role/permission CRUD and assignment |
| System Operator | `/operator/logs` | `309:12673` | access/system/audit logs and export |
| System Operator | `/operator/settings` | `309:12455`, `309:13037`, `309:13320` | own profile/security/preferences |
| Super Admin | `/super-admin/backups` | `309:13511` | backup list/create/restore/delete/settings |
| Super Admin | `/super-admin/admins` | `309:13767` | System Operator/admin account lifecycle |
| Super Admin | `/super-admin/logs` | `309:14026` | access/system logs and export |
| Super Admin | `/super-admin/assistant` | `309:14383` | permission-filtered technical assistant |
| Super Admin | `/super-admin/system` | `309:14577`, `309:14980`, `309:15175`, `309:15356`, `309:15536` | permitted system/security/notification/backup/info settings |
| Super Admin | `/super-admin/settings` | `309:14759`, `309:15724` | own profile/security/preferences |

## Navigation and prototype behavior

- Successful role login navigates to its role dashboard.
- Sidebars navigate only within the current role's route namespace; logout returns to `/login`.
- Bell and avatar controls open the shared notification and profile overlays.
- Add/edit/delete/export/restore/review controls open the corresponding modal or toast listed in `FIGMA_SCREEN_INVENTORY.md`.
- Student rows open student detail panels; class rows open edit/detail/version flows; log rows open log details.
- Grader grades progress from entry/collection to submission and review status.
- Protected route loaders call session and authorization checks before domain APIs. Unauthorized users receive `/access-denied`; unauthenticated users return to `/login` with a safe return target.

## Required route states

Every route must implement loading, populated, empty, validation error, request error, unauthorized/forbidden, and retry states. Mutation routes additionally implement confirmation, pending/disabled, success, conflict/concurrent-update, and server-failure behavior.


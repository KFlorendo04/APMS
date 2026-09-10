# Feature Inventory

| ID | Module | Authority | Backend/data dependencies | Planned status |
|---|---|---|---|---|
| AUTH | Email/password, Google, MFA/OTP, recovery, invite, session/logout | Thesis + Figma | Identity provider, profiles, invitations, audit/access logs | Required |
| RBAC | Roles, permissions, role assignment, route/feature/record checks | Thesis diagrams | roles, permissions, user roles, scope assignments | Required |
| DASH | Role dashboards and real metrics | Thesis + Figma | class, enrollment, result, evaluation, prediction queries | Required |
| STUDENTS | Roster, search/filter/paging, profile, import, status, unenroll | Figma + diagrams | students, enrollments, departments/programs | Required |
| FACULTY | Faculty directory/profile and class assignment | Figma + diagrams | profiles, departments, faculty assignments | Required |
| GUIDELINES | Academic guidelines and grading policy | Thesis diagrams | guideline versions, departments/programs | Required |
| TEMPLATES | Class-record template CRUD/import/export/versioning | Thesis diagrams | templates, template versions/criteria | Required |
| CLASSES | Class record CRUD/import/export/search/version history | Thesis + Figma | courses, terms, sections, assignments, enrollments | Required |
| CRITERIA | Nested evaluation criteria and formula/weight validation | Thesis + Figma | criteria, versions, activation rules | Required |
| ASSESSMENTS | Assessment CRUD and result entry/import/export | Thesis diagrams | assessments, results, enrollment constraints | Required |
| GRADER | Assignment, submission, status, approve/reject workflow | Thesis diagrams + Figma | grader assignments/submissions/reviews | Required |
| EVALUATION | Calculated performance, classification, filters/export | Thesis + Figma | criteria version, approved results, evaluations | Required |
| PREDICTION | Scenario criteria, predicted results/grades, confidence/explanation | Thesis + Figma | prediction criteria, model run/output | Required with transparent inference fallback |
| FEEDBACK | Templates, AI draft, edit/preview/send/history | Thesis + Figma | evaluations, predictions, templates, messages, audit | Required |
| ANALYTICS | Trends, distributions, pass/fail, at-risk cohorts, filters | Thesis + Figma | aggregate queries and indexes | Required |
| REPORTS | CSV/JSON raw export and PDF reports | Thesis diagrams | authorized filtered queries, export jobs | Required |
| NOTIFY | Notification center, preferences, email delivery | Thesis diagrams + Figma | notifications, preferences, delivery attempts | Required |
| EVENTS | Dean event/calendar CRUD and priorities | Figma only | events, audiences, notifications | Required as approved UI |
| ASSISTANT | Role-aware APMS assistant surface | Figma only | authorized query service, audit | Required UI; no fabricated AI response |
| USERS | User/account lifecycle and status | Thesis diagrams + Figma | profiles, invitations, identity provider | Required |
| ROLES | Role/permission management | Thesis diagrams + Figma | RBAC tables, protected seed roles | Required |
| LOGS | Access/system/audit list, detail, filter/export | Thesis diagrams + Figma | immutable append-only event records | Required |
| BACKUPS | Create, inspect, restore, delete, settings | Thesis diagrams + Figma | backup records/provider adapter/audit | Required; provider operations need deployment config |
| SETTINGS | Profile, password/MFA, notifications, privacy, data/backup request | Thesis + Figma | profiles, preferences, sessions | Required |
| INTEGRATIONS | LMS connection and controlled imports | Thesis | integration configs, import jobs | Adapter and safe unavailable state required |

## Existing implementation inventory

At analysis time there was no frontend, backend, package manifest, database configuration, environment file, migration, test, CI, or deployment file. The only repository artifact was the manuscript. Therefore no existing implementation can be marked complete.


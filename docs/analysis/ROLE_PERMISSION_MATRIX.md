# Role and Permission Matrix

`Own/assigned` means the record is tied to the user's student identity, assigned class, department, grader assignment, or technical administration scope. Every permission is enforced in the API/data layer in addition to navigation visibility.

| Capability | Student | Grader | Faculty | Dean / Academic Admin | System Operator / System Admin | Super Admin |
|---|---:|---:|---:|---:|---:|---:|
| Authenticate, logout, recover own account | Own | Own | Own | Own | Own | Own |
| View role dashboard and notifications | Own | Assigned | Assigned | Department/program | Technical | Technical |
| Edit own profile/security/preferences | Own | Own | Own | Own | Own | Own |
| View student directory/profile | Self only | Assigned minimum | Assigned classes | Department/program | No academic access by default | No academic access by default |
| Create/import/edit student records | No | No | Assigned-class import where delegated | Yes, department/program | Account provisioning only | No |
| Unenroll student | No | No | No by default | Yes, department/program | No | No |
| View faculty directory | No | No | Own profile | Department/program | Account metadata only | Admin metadata only |
| Manage academic guidelines | No | No | Create/edit in assigned scope per diagram | Approve/manage department scope | No | No |
| Manage class-record templates | No | No | Assigned scope | Department/program | No | No |
| Create/import/edit class records | No | No | Assigned classes | Department/program | No | No |
| Delete class records | No | No | Assigned and policy-permitted | Department/program | No | No |
| View/export class records | Own published data | Assigned minimum | Assigned classes | Department/program | No academic access | No academic access |
| Restore class-record version | No | No | Assigned, if permitted | Yes | No | No |
| Define evaluation criteria/formulas | No | No | Assigned course scope | Department/program | No | No |
| Record assessment results | No | Submit assigned only | Assigned classes | Department/program correction/import | No | No |
| Approve/reject grader results | No | View own status | Assigned faculty reviewer | Oversight/read by default | No | No |
| View own grades/results | Yes | No unless also faculty | Assigned classes | Department/program | No | No |
| Run/view performance evaluation | Own published summary | No | Assigned classes | Department/program | No | No |
| Manage prediction criteria | No | No | Assigned course scope | Department/program | No | No |
| Run/view predictions | Own published summary | No | Assigned classes | Department/program | No | No |
| Generate/edit/send feedback | Receive/view | No | Assigned students | View/oversight; send only if academically assigned | No | No |
| View analytics/reports | Own | Assignment status | Assigned classes | Department/program | Technical reports only | Technical reports only |
| Manage events/calendar | View relevant | View relevant | View relevant | Manage department/program | View technical events | View technical events |
| Manage all user accounts | No | No | Invite grader in assigned context | Invite/assign faculty in department | Yes | System Operator/admin accounts only |
| Manage roles/permissions | No | No | No | No | Yes | No; cannot silently expand own role |
| Configure auth/system limits/integrations | No | No | No | No | Yes | Backup/system-scope settings shown in Figma only |
| View/export access and system logs | No | No | No | No | Yes | Yes |
| Create/restore/delete backups | No | No | No | No | Operational support only if delegated | Yes |
| Manage System Operator accounts | No | No | No | No | No self-escalation | Yes |

## Record-level enforcement rules

1. Student queries must bind to the authenticated student's profile ID.
2. Grader access requires an active grader assignment; submissions remain isolated to that assignment.
3. Faculty access requires active class-record assignment or explicit academic delegation.
4. Dean access is bounded to configured departments/programs; cross-department access requires a separate assignment.
5. Technical roles do not receive academic-content access merely because they administer accounts or infrastructure.
6. Super Admin is intentionally narrower than System Operator in day-to-day configuration, matching the thesis context diagram.
7. No role may approve its own privilege escalation; role/permission changes are audited.

## Permission identifiers

Implementation uses namespaced permissions such as `students.read.assigned`, `class_records.write.assigned`, `assessment_submissions.review.assigned`, `analytics.read.department`, `users.manage`, `roles.manage`, `logs.export`, and `backups.restore`. The exact seed mapping must remain traceable to the table above.


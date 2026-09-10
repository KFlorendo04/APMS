# Administrator guide

APMS has one technical role: **System Admin**. Former Super Admin and System Operator responsibilities are merged into it. From the live User Management workspace, a System Admin can create Supabase Auth accounts, assign one of the three core roles, set department scope for academic users, activate or deactivate accounts, and issue a new temporary password. The protected `admin-users` Edge Function performs privileged Auth operations; the client never receives the service-role credential.

System Admin can also inspect the role catalog and audit trail, edit persisted system settings, and queue a protected backup request. A queued request is not itself a completed database backup: completion requires an institutionally configured backup worker and protected destination.

**Academic Admin** is department-scoped. Its live workspace provides aggregate class and student monitoring, current/provisional SWUNEXT standing, attendance and at-risk drill-down, program scope, versioned evaluation criteria, and CSV reports. It does not encode routine Faculty scores, administer SWU SIS, or write official grades.

SWUNEXT Global Modules criteria are implemented as the default grading model: Effortful Learning is 55% across Start of Class, Let's Practice, and Reflection; Mastery is 45% across Wrap-Up Quiz and Final Project / Output. P1 and P2 are running cumulative views only. Final grade uses P3 effortful learning and FE mastery, and a student must reach both 80% final grade and 80% mastery to meet the APMS provisional passing indicator.

Use least privilege, deactivate departed users, review access and system logs, test backup restoration through the approved institutional process, and rotate server secrets outside Git. Never grant a shared universal password. Administrative changes are permission checked and audited.

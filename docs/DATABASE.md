# Database

The migrations define the normalized identity/scope, academic reference, class/enrollment, criteria, assessment, attendance, evaluation/prediction, feedback, import, audit, backup, and configuration model. The connected project is preserved through safe incremental migrations.

All public tables have RLS enabled. Policies use `auth.uid()`, `private.has_permission`, and `private.can_access_class` to enforce Faculty assignment, Academic Admin scope, and technical boundaries. The former Grader RPC is no longer client-executable; legacy Grader tables are read-only to System Admin for retention review.

The `20260825203428_academic_admin_profile_scope.sql` migration permits an Academic Admin to read Faculty profile identity only when both accounts share the assigned department. `20260825211944_transactional_criteria_version.sql` makes criteria version/node activation atomic, and `20260825214503_atomic_admin_role_assignment.sql` makes server-side role/scope and Faculty-profile reassignment atomic. `20260831215023_swunext_grading_system.sql` adds assessment component/module metadata, removes the obsolete Google Classroom source value, and seeds active SWUNEXT Global Modules criteria for existing classes. `20260831215345_swunext_grading_seed_data.sql` and `20260831215609_swunext_seed_soc2_completion.sql` add fictional sample rows that exercise Start of Class, Let's Practice, Reflection, Wrap-Up Quiz, project check-ins, and final project calculations. Privileged Auth lifecycle operations are not exposed as direct table writes: the `admin-users` Edge Function validates the caller's active System Admin assignment before using its server-only service credential.

Indexes cover common foreign keys, statuses, timestamps, component/module gradebook filters, and report filters. Foreign keys use explicit delete behavior. The local seed contains fictional reference rows and three-role permissions only; no real people, grades, or secrets belong in source control.

See [current schema](database-schema.md).

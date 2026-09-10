update public.roles
set name = 'Academic Admin',
    description = 'Authorized academic oversight, criteria configuration, analytics, and reporting within an assigned scope.'
where key = 'academic_admin';

revoke all on function public.review_grader_submission(uuid, text, text)
from public, anon, authenticated;

create policy grader_assignments_legacy_system_read on public.grader_assignments
for select to authenticated
using ((select private.has_permission('logs.read')));
create policy grader_submissions_legacy_system_read on public.grader_submissions
for select to authenticated
using ((select private.has_permission('logs.read')));
create policy grader_reviews_legacy_system_read on public.grader_reviews
for select to authenticated
using ((select private.has_permission('logs.read')));
grant select on public.grader_assignments, public.grader_submissions, public.grader_reviews to authenticated;

drop policy if exists attendance_sessions_faculty_manage on public.attendance_sessions;
create policy attendance_sessions_faculty_insert on public.attendance_sessions
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_access_class(class_record_id))
  and (select private.has_permission('attendance.manage.assigned'))
);
create policy attendance_sessions_faculty_update on public.attendance_sessions
for update to authenticated
using (
  (select private.can_access_class(class_record_id))
  and (select private.has_permission('attendance.manage.assigned'))
)
with check (
  created_by = (select auth.uid())
  and (select private.can_access_class(class_record_id))
  and (select private.has_permission('attendance.manage.assigned'))
);
create policy attendance_sessions_faculty_delete on public.attendance_sessions
for delete to authenticated
using (
  created_by = (select auth.uid())
  and (select private.can_access_class(class_record_id))
  and (select private.has_permission('attendance.manage.assigned'))
);

drop policy if exists attendance_records_faculty_manage on public.attendance_records;
create policy attendance_records_faculty_insert on public.attendance_records
for insert to authenticated
with check (
  recorded_by = (select auth.uid())
  and exists (
    select 1
    from public.attendance_sessions s
    join public.enrollments e on e.id = enrollment_id and e.class_record_id = s.class_record_id
    where s.id = attendance_session_id
      and (select private.can_access_class(s.class_record_id))
  )
  and (select private.has_permission('attendance.manage.assigned'))
);
create policy attendance_records_faculty_update on public.attendance_records
for update to authenticated
using (
  exists (
    select 1 from public.attendance_sessions s
    where s.id = attendance_session_id
      and (select private.can_access_class(s.class_record_id))
  )
  and (select private.has_permission('attendance.manage.assigned'))
)
with check (
  recorded_by = (select auth.uid())
  and exists (
    select 1
    from public.attendance_sessions s
    join public.enrollments e on e.id = enrollment_id and e.class_record_id = s.class_record_id
    where s.id = attendance_session_id
      and (select private.can_access_class(s.class_record_id))
  )
  and (select private.has_permission('attendance.manage.assigned'))
);
create policy attendance_records_faculty_delete on public.attendance_records
for delete to authenticated
using (
  recorded_by = (select auth.uid())
  and exists (
    select 1 from public.attendance_sessions s
    where s.id = attendance_session_id
      and (select private.can_access_class(s.class_record_id))
  )
  and (select private.has_permission('attendance.manage.assigned'))
);

create index if not exists attendance_sessions_created_by_idx on public.attendance_sessions(created_by);
create index if not exists attendance_records_recorded_by_idx on public.attendance_records(recorded_by);

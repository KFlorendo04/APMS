do $$
declare
  faculty_user_id uuid;
begin
  select created_by into faculty_user_id
  from public.class_records
  where id = 'a3000000-0000-0000-0000-000000000001'::uuid;

  if faculty_user_id is null then
    return;
  end if;

  insert into public.assessment_results(assessment_id, enrollment_id, score, source, approval_status, recorded_by)
  select 'b6000000-0000-0000-0000-000000000002'::uuid, enrollment_id, score, 'manual', 'approved', faculty_user_id
  from (values
    ('a4000000-0000-0000-0000-000000000003'::uuid, 0),
    ('a4000000-0000-0000-0000-000000000004'::uuid, 1),
    ('a4000000-0000-0000-0000-000000000005'::uuid, 1),
    ('a4000000-0000-0000-0000-000000000006'::uuid, 0)
  ) as seeded(enrollment_id, score)
  on conflict (assessment_id, enrollment_id) do update
  set score = excluded.score,
      approval_status = 'approved',
      updated_at = now();
end $$;

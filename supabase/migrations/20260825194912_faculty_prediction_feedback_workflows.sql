-- Scoped Faculty prediction and feedback workflows. The UI calls these RPCs
-- after explicit authentication; each function re-checks permission and class
-- scope before writing advisory AI or feedback records.

create or replace function public.faculty_save_prediction_run(
  p_class_record_id uuid,
  p_model_name text,
  p_model_version text,
  p_input_snapshot jsonb,
  p_predictions jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  resolved_model_version_id uuid;
  resolved_criteria_id uuid;
  resolved_run_id uuid;
begin
  if caller_id is null then raise exception 'Authentication required'; end if;
  if not private.has_permission('predictions.run.assigned') or not private.can_access_class(p_class_record_id) then
    raise exception 'Permission denied';
  end if;
  if jsonb_typeof(p_predictions) <> 'array' or jsonb_array_length(p_predictions) = 0 then
    raise exception 'At least one prediction is required';
  end if;

  insert into public.model_versions(name, version, feature_schema, metrics, status)
  values (
    btrim(coalesce(p_model_name, 'APMS AI Service')),
    btrim(coalesce(p_model_version, 'unversioned')),
    '{"inputs":["current_standing","recent_scores","attendance_rate","missing_assessment_count"]}'::jsonb,
    '{"institutionally_validated":false,"advisory_only":true}'::jsonb,
    'testing'
  )
  on conflict (name, version) do update
    set feature_schema = excluded.feature_schema,
        metrics = excluded.metrics,
        status = case
          when public.model_versions.status = 'active' then public.model_versions.status
          else excluded.status
        end
  returning id into resolved_model_version_id;

  insert into public.prediction_criteria(class_record_id, name, scenario, parameters, status, created_by)
  values (
    p_class_record_id,
    'Faculty live AI prediction',
    'stable',
    '{"source":"apms_ai_service","advisory_only":true}'::jsonb,
    'active',
    caller_id
  )
  returning id into resolved_criteria_id;

  insert into public.prediction_runs(
    class_record_id,
    model_version_id,
    prediction_criteria_id,
    input_snapshot,
    status,
    initiated_by,
    started_at,
    completed_at
  )
  values (
    p_class_record_id,
    resolved_model_version_id,
    resolved_criteria_id,
    coalesce(p_input_snapshot, '{}'::jsonb),
    'completed',
    caller_id,
    now(),
    now()
  )
  returning id into resolved_run_id;

  insert into public.performance_predictions(
    prediction_run_id,
    enrollment_id,
    predicted_score,
    trend,
    risk_level,
    confidence,
    explanation
  )
  select
    resolved_run_id,
    prediction.enrollment_id,
    prediction.predicted_score,
    prediction.trend,
    prediction.risk_level,
    prediction.confidence,
    jsonb_build_object(
      'factors', coalesce(prediction.factors, '[]'::jsonb),
      'advisory', true,
      'data_basis', prediction.data_basis,
      'institutionally_validated', false
    )
  from jsonb_to_recordset(p_predictions) as prediction(
    enrollment_id uuid,
    predicted_score numeric,
    trend text,
    risk_level text,
    confidence numeric,
    factors jsonb,
    data_basis text
  )
  where exists (
    select 1
    from public.enrollments e
    where e.id = prediction.enrollment_id
      and e.class_record_id = p_class_record_id
      and e.status = 'active'
  );

  return resolved_run_id;
end
$$;

create or replace function public.faculty_save_feedback_draft(
  p_enrollment_id uuid,
  p_body text,
  p_category text,
  p_status text default 'draft'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  resolved_student_id uuid;
  resolved_class_id uuid;
  resolved_prediction_id uuid;
  resolved_evaluation_id uuid;
  resolved_feedback_id uuid;
  clean_status text := coalesce(nullif(btrim(p_status), ''), 'draft');
begin
  if caller_id is null then raise exception 'Authentication required'; end if;
  if not private.has_permission('feedback.send.assigned') then
    raise exception 'Permission denied';
  end if;
  if btrim(coalesce(p_body, '')) = '' then raise exception 'Feedback body is required'; end if;
  if clean_status not in ('draft', 'ready') then raise exception 'Feedback can only be saved as draft or ready'; end if;

  select e.student_id, e.class_record_id
    into resolved_student_id, resolved_class_id
  from public.enrollments e
  where e.id = p_enrollment_id and e.status = 'active';

  if resolved_student_id is null or not private.can_access_class(resolved_class_id) then
    raise exception 'Enrollment is outside the Faculty scope';
  end if;

  select pe.id into resolved_evaluation_id
  from public.performance_evaluations pe
  where pe.enrollment_id = p_enrollment_id
  order by pe.calculated_at desc
  limit 1;

  select pp.id into resolved_prediction_id
  from public.performance_predictions pp
  where pp.enrollment_id = p_enrollment_id
  order by pp.created_at desc
  limit 1;

  insert into public.feedback_records(
    student_id,
    enrollment_id,
    evaluation_id,
    prediction_id,
    author_id,
    body,
    category,
    status,
    sent_at
  )
  values (
    resolved_student_id,
    p_enrollment_id,
    resolved_evaluation_id,
    resolved_prediction_id,
    caller_id,
    btrim(p_body),
    coalesce(nullif(btrim(p_category), ''), 'custom'),
    clean_status,
    case when clean_status = 'ready' then now() else null end
  )
  returning id into resolved_feedback_id;

  return resolved_feedback_id;
end
$$;

revoke all on function public.faculty_save_prediction_run(uuid, text, text, jsonb, jsonb) from public, anon;
revoke all on function public.faculty_save_feedback_draft(uuid, text, text, text) from public, anon;
grant execute on function public.faculty_save_prediction_run(uuid, text, text, jsonb, jsonb) to authenticated;
grant execute on function public.faculty_save_feedback_draft(uuid, text, text, text) to authenticated;

# API

Supabase generates REST endpoints for RLS-protected public tables. The application uses authenticated client requests; privileged secrets never enter the client bundle.

Key resources include `/profiles`, `/students`, `/faculty_profiles`, `/class_records`, `/criteria_sets`, `/assessments`, `/assessment_results`, `/grader_assignments`, `/grader_submissions`, `/performance_evaluations`, `/performance_predictions`, `/feedback_records`, `/events`, `/audit_logs`, and `/backups`.

RPC: `review_grader_submission(target_submission_id, review_decision, review_reason)` accepts only `approved|rejected`, requires review permission and class scope, rejects non-submitted records, and returns the updated submission.

AI service:

- `GET /health` — service/model availability.
- `POST /v1/predictions` — validated evaluation input; returns 503 without an approved model and never fabricates a prediction.

Errors shown to users are sanitized; raw database paths, SQL, stack traces, and secrets are not rendered.

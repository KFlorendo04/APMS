alter function private.set_updated_at() set search_path = public;

revoke execute on function public.review_grader_submission(uuid, text, text) from anon;

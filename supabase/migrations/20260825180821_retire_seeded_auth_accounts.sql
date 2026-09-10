-- Retire the original demonstration Auth identities without deleting academic
-- records that retain their profile IDs for audit/history purposes. The Auth
-- identities are soft-deleted separately through the Supabase Admin API.

do $$
declare
  seeded_user_ids constant uuid[] := array[
    '127a10b9-25f5-4d11-880f-5775ee66ce5e'::uuid,
    '38eca08d-a9e7-45dd-badf-4af04b9143bb'::uuid,
    '337afd0e-df2d-492d-8d35-7edc4cfca82d'::uuid,
    '9dd7f9f3-000e-4f39-9ee3-822a6c69804d'::uuid,
    '0e3bc946-ac14-4244-aa5d-cf4b12527a47'::uuid,
    'c5b3d235-9a25-467d-9460-b71f56e2cce3'::uuid
  ];
begin
  delete from public.user_roles ur
  using public.profiles p
  where ur.user_id = p.id
    and p.id = any(seeded_user_ids)
    and p.email like '%@demo.apms.local';

  update public.profiles
  set status = 'inactive',
      updated_at = now()
  where id = any(seeded_user_ids)
    and email like '%@demo.apms.local';

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    after_data
  )
  values (
    null,
    'seeded_auth_accounts.retired',
    'auth.users',
    null,
    jsonb_build_object(
      'account_count', 6,
      'method', 'roles_revoked_profiles_deactivated_auth_soft_deleted'
    )
  );
end
$$;

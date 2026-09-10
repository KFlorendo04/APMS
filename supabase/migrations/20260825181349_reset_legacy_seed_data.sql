-- The connected project contained only the original fictional demonstration
-- profiles and profile-owned sample records. Clear that seed set so the Auth
-- identities can be hard-deleted and replaced by the revised three-role seed.
-- Structural reference data, roles, permissions, and migrations are retained.

truncate table public.profiles restart identity cascade;

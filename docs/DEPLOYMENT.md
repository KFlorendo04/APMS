# Deployment

1. Create separate Supabase projects for staging and production.
2. Review migrations, retention, SMTP, storage limits, and backup policy with SWU PHINMA.
3. Link only after explicit owner approval, then apply migrations through CI using protected secrets.
4. Build Expo web/native artifacts with production environment variables.
5. Deploy the Python service privately; configure its server-only token and approved model artifact.
6. Run type, unit, database, E2E, security, and smoke checks before promotion.

Never deploy demo mode, fictional accounts, service-role keys, an unvalidated model, or insecure default credentials.

# Implementation Plan

## Architecture decision

There was no application stack to preserve. The thesis explicitly selects Expo/React Native, NativeWind, Supabase, JavaScript, Python/PyTorch, Pydantic-AI, and Docker. The implementation will therefore use a TypeScript-first Expo application targeting web and mobile, Supabase PostgreSQL/Auth/Storage for the relational and identity layers, and an independently deployable Python inference service. Shared domain contracts and validation keep presentation, authorization, business logic, and data access separate.

Proposed repository layout:

```text
apps/mobile/                 Expo Router + React Native Web presentation
services/inference/          FastAPI/Pydantic inference adapter
packages/ui/                 reusable Figma-matched components and tokens
packages/domain/             domain types, validation, permissions, calculations
packages/data/               Supabase repositories and queries
supabase/migrations/          PostgreSQL schema, RLS, functions, indexes
supabase/seed.sql             fictional development seed
tests/                       API, permission, database, E2E, visual tests
docs/                        analysis, operations, API, user/admin guides
```

## Delivery increments

1. **Analysis baseline:** commit the nine required analysis files; validate source coverage.
2. **Workspace foundation:** monorepo tooling, TypeScript, lint/format, Expo Router, environment validation, CI scripts, `.env.example`.
3. **Database:** schema, migrations, RLS, constraints, indexes, seed, typed data layer, transactional functions.
4. **Authentication/RBAC:** Supabase Auth adapters, protected layouts, permission service, record scopes, access/audit logs, permission tests.
5. **Design system/shell:** download exact Figma assets; tokens, app shell, sidebar/header, fields, tables, states, modal/toast primitives.
6. **Faculty:** dashboard, students, classes, feedback, analytics, assistant, settings; persisted workflows/tests.
7. **Student and Grader:** own-data views, grader assignment/submission/review status, settings; permission/E2E coverage.
8. **Dean:** dashboard, people, class/templates, criteria, evaluation/prediction, analytics, events, settings/assistant.
9. **Technical roles:** operator users/RBAC/logs/system config; super-admin backups/admins/logs/system settings.
10. **Inference:** deterministic calculation pipeline, model adapter and transparent unavailable state, versioned run storage, explanation contract.
11. **Reports/notifications/integrations:** filtered exports, PDF reports, delivery jobs, LMS adapter boundary.
12. **Security/quality:** threat review, upload validation, rate limits, secret/log audit, concurrency/duplicate tests.
13. **E2E/visual verification:** Playwright web workflows and route-by-route Figma screenshots at exact viewport sizes.
14. **Operations documentation:** setup, architecture, database, API, roles, testing, deployment, guides, known limitations.

## Dependency policy

- Use Expo/React Native and Supabase packages required by the thesis architecture.
- Add Zod (or an existing equivalent if introduced by Expo tooling) for shared input/environment validation.
- Use Vitest/Jest consistent with Expo packages and Playwright for web E2E/visual tests.
- Use a maintained chart library only if React Native SVG primitives cannot reproduce the approved charts without excessive custom code.
- Python service dependencies remain minimal: FastAPI, Pydantic, model adapter packages; PyTorch/SHAP are optional deployment extras until an approved trained model artifact exists.
- Every added major dependency must be documented in `docs/ARCHITECTURE.md`.

## Verification gates per increment

- Typecheck, lint, and relevant unit/integration/permission tests.
- Migrations apply to a clean local Supabase instance and seed succeeds.
- No unresolved visible control in the increment.
- Update requirement traceability and known gaps.
- Commit with the phase-specific message requested by the project brief.


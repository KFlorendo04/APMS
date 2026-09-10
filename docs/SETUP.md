# Setup

## Prerequisites

- Node.js 24 (the installed Expo SDK 57 supports its declared Node engine)
- npm 11+
- Docker Desktop only when running the local Supabase stack
- Python 3.11+ for the required, independently deployable AI component

## Application

```powershell
npm install
Copy-Item .env.example .env
Copy-Item apps/mobile/.env.example apps/mobile/.env.local
npm run dev
```

Put only `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the demo-mode flag in `apps/mobile/.env.local`. Never expose the service-role key or database password to the Expo client. For fictional local UI records, explicitly set `EXPO_PUBLIC_DEMO_MODE=true`.

## Database (after Docker is installed)

```powershell
npx supabase start
npx supabase db reset
npx supabase db lint --local
```

`db reset` creates the local database, runs every migration, and loads `supabase/seed.sql`. Reuse the existing connected project; do not create another Supabase project or replace populated environment variables.

## AI service

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e "services/ai[test]"
uvicorn apms_ai.main:app --app-dir services/ai/src --reload
python -m pytest services/ai
```

The default service runs a controlled-synthetic logistic demonstration model and reports that it is not institutionally validated. Real deployment requires an authorized validation dataset and institutional approval.

## Tests and production build

```powershell
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

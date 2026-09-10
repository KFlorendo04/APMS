# Known Limitations and Architectural Boundaries

1. **Academic Decision Support Scope**: APMS provides provisional running standing, mastery tracking, and advisory risk indicators based on the SWUNEXT grading model. Official academic grades, transcripts, and final completion records remain strictly authoritative within the institutional Student Information System (SWU SIS).
2. **Subject Lifecycle Boundaries**: Subjects are managed per department by Academic Administrators (`subjects.manage.department`). Faculty members can submit subject requests with rationales, which must be approved by Academic Administrators before classes can be created for new course codes.
3. **Local Docker Environment**: In local offline development without Docker Desktop, migrations are maintained imperatively in `supabase/migrations/` and verified with schema contract tests (`npm run test:schema`).
4. **AI Prediction Advisory Status**: Stored AI predictions are traceable decision-support outputs and are not institutionally validated for automated academic penalties or honors.
5. **Security Isolation**: All mutations are permission-checked via PostgreSQL Row Level Security and scoped database functions; no client-side role assertions or unverified department identifiers are trusted.


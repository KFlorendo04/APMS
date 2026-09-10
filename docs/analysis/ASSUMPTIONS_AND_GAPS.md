# Assumptions and Gaps

## Repository gaps

1. **No Git repository existed.** Git was initialized to support the required branch and commits.
2. **No source code or configuration existed.** There is no existing framework, architecture, authentication, database, environment, integration, deployment, migration, or test behavior to preserve.
3. **Only one source file existed:** `docs/SWU-001 - Manuscript.docx`.

## Manuscript gaps and conflicts

1. The manuscript ends after Chapter 4 references. Chapter 5, post-development acceptance findings, completed implementation evidence, and final recommendations are absent.
2. It contains no ERD, SQL schema, field dictionary, API contract, retention periods, recovery objectives, numeric performance target, accessibility standard, password policy, rate limit, or session duration.
3. Several Chapter 4 tables are referenced (Tables 6, 7, and 10-12) without embedded table values.
4. The use-case/context diagrams provide more detailed system requirements than narrative sections; these are labeled diagram-derived.
5. The manuscript calls the role `Academic Admin`; Figma calls it `Dean`. The implementation uses route/UI label `Dean` with stable role key `academic_admin`.
6. The manuscript calls the technical role `System Admin`; the brief and Figma call it `System Operator`. The implementation uses stable role key `system_operator` and documents the alias.
7. Figma gives students grades/dashboard/settings, while thesis prose limits the student mainly to receiving feedback. These are implemented as read-only own-record features because they do not expand modification authority.
8. Figma includes an APMS AI Assistant and academic events, not explicitly required in thesis prose. They are included because the approved interface is authoritative for UI, but assistant access is strictly permission-filtered.
9. The thesis proposes LSTM/Transformer, SHAP, and Pydantic-AI but provides no trained model, dataset, feature schema, validated thresholds, or model artifact. The application will implement the complete model-run contract and deterministic grade/risk baseline; actual ML inference is enabled only by a configured, versioned artifact.
10. The manuscript prototype descriptions and live Figma differ in some labels/screens. Live Figma controls appearance; explicit thesis rules control authority and workflow.

## Figma gaps

1. The file has no local variables or named styles; design values are raw node properties. Tokens will be normalized without changing rendered values.
2. Only desktop frames (1179/1194px wide) exist; no mobile/tablet breakpoint frames are supplied.
3. Dedicated loading, skeleton, empty, access-denied, offline, network error, server error, and concurrent-conflict frames are incomplete or absent.
4. Some alternate/legacy login frames exist in Student and Grader sections. The shared Auth frames are canonical; alternates are inventory references.
5. Repeated settings-password frames and generic component names (`Property 1=Variant2`) require semantic implementation names.
6. Prototype links include a few self-links and overlay/navigation inconsistencies. Application behavior follows the intended destination type, documented route, and thesis workflow.

## Implementation assumptions

| ID | Assumption | Reason / safeguard |
|---|---|---|
| A-01 | Criteria weights must total 100% before activation. | Explicitly visualized in Figma; prevents invalid calculations. |
| A-02 | Grader workflow states are draft, submitted, approved, rejected. | Approval/rejection is explicit; states make the workflow transactional. |
| A-03 | Only approved assessment results affect official grades. | Prevents unreviewed grader data from changing outcomes. |
| A-04 | Academic deletes default to archive/soft-delete; immutable evidence remains auditable. | Thesis requires integrity/logs but does not define destructive retention. |
| A-05 | Student access is self-only; faculty is assigned-class; Dean is department/program scoped. | Applies least privilege to diagram relationships. |
| A-06 | Technical roles do not automatically read academic content. | Separation of duties. |
| A-07 | Default desktop responsive thresholds are compact `<768`, medium `768-1023`, desktop `>=1024`; content reflows rather than scales. | Figma lacks breakpoints; values are conventional and easy to revise. |
| A-08 | Target WCAG 2.1 AA. | No accessibility target is given; this is a conservative baseline. |
| A-09 | Normal non-AI reads target 2 seconds at controlled thesis scale. | No quantitative target is given. |
| A-10 | Backup retention/schedule/session lifetime/password rules are environment-configurable and never hard-coded as thesis policy. | Thesis requires controls but gives no values. |
| A-11 | Concurrent mutable records use optimistic version checks. | Required by the brief's concurrent-update coverage. |
| A-12 | AI unavailability is a visible system state; no fabricated prediction or assistant answer is returned. | No approved model/AI provider credential exists. |
| A-13 | Fictional seed names and institutional-like addresses are development-only. | Avoids real personal data and prototype data in production paths. |

## User-supplied assets/configuration that may be required later

- Supabase project URL/keys or a local Supabase/Docker runtime.
- Google OAuth provider credentials and approved redirect URIs.
- Email provider/SMTP credentials for OTP and feedback delivery.
- LMS provider documentation/credentials and allowed scopes.
- Approved trained model artifacts, feature schema, validation metrics, and risk thresholds.
- Production backup provider/storage credentials and retention policy.

The system must remain buildable and testable without real secrets using local/test adapters; production-only operations expose an explicit configuration-required state.


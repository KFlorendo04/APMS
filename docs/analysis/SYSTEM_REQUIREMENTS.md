# APMS System Requirements

## Source authority and notation

This specification was derived from the complete manuscript, including its tables, embedded figures, context diagram, use-case diagram, data-flow diagram, wireframes, mockups, tracked revisions, and appendices present in `docs/SWU-001 - Manuscript.docx`, plus the approved Figma file `fonSaD6QrrmutBP86Exo75`.

- **T-E** - explicit written thesis requirement.
- **T-D** - requirement shown by a thesis diagram or table.
- **F** - requirement shown only in Figma.
- **R** - existing repository behavior. No application behavior existed at analysis time.
- **A** - documented implementation assumption. See `ASSUMPTIONS_AND_GAPS.md`.

## Identity

- **Title (T-E):** AI-Based Student Performance Evaluation and Monitoring System (APMS).
- **Research title (T-E):** Acceptability of an AI-Based Student Performance Evaluation and Monitoring System in Non-Medical Programs.
- **Institution (T-E):** Southwestern University PHINMA, specifically SWUNEXT: Business School, College of Engineering, College of Information Technology, and School of Design and Communication.
- **Primary objective (T-E):** centralize performance data, improve the efficiency, accuracy, relevance of information retrieval, and security of monitoring, and provide analytical decision support without replacing institutional grading policy or educator judgment.

## Users and roles

The authoritative six-role model is: Student, Grader, Faculty, Academic Admin, System Admin, and Super Admin (T-E/T-D). The approved UI calls Academic Admin **Dean** and System Admin **System Operator**. Those UI labels are aliases, not additional authority levels.

## Functional requirements

### Authentication and account lifecycle

- **FR-AUTH-001 (T-E/F):** authenticate with email and password.
- **FR-AUTH-002 (T-E/T-D):** support a six-digit email OTP/MFA challenge where configured.
- **FR-AUTH-003 (T-E/F):** support Google sign-in where provider configuration is available.
- **FR-AUTH-004 (T-E/F):** provide password recovery.
- **FR-AUTH-005 (T-E/F):** optionally remember the login on the current device without storing a plaintext password.
- **FR-AUTH-006 (T-D):** accept account invitations from the role authorized to provision the account.
- **FR-AUTH-007 (T-E/T-D):** route authenticated users to the correct role dashboard.
- **FR-AUTH-008 (T-E):** enforce RBAC, least privilege, and separation of duties on the server.
- **FR-AUTH-009 (T-D/F):** block inactive or disabled accounts and record important authentication events.
- **FR-AUTH-010 (T-D/F):** provide logout and session revocation/expiration.

### Academic structure and class records

- **FR-ACAD-001 (T-E/T-D):** manage academic guidelines and grading policies.
- **FR-ACAD-002 (T-E/T-D):** create, import, view, edit, export, delete, and version class-record templates subject to role permission.
- **FR-ACAD-003 (T-E/T-D):** create/import class records containing subject, section, term, assigned faculty, students, and record structure.
- **FR-ACAD-004 (T-D/F):** search, sort, filter, paginate, view, edit, export, and permitted-delete class records.
- **FR-ACAD-005 (T-D):** assign faculty to class records and graders to assessments.
- **FR-ACAD-006 (T-D/F):** retain class-record version history and allow authorized restoration.
- **FR-ACAD-007 (T-E):** permit controlled LMS integration for class, assessment, and attendance imports; full multi-LMS interoperability is outside the thesis scope.

### Student and faculty directory

- **FR-PEOPLE-001 (F/T-D):** maintain students with institutional ID, name, email, department/program, year level, section, remarks, and account/enrollment status.
- **FR-PEOPLE-002 (F/T-D):** add students manually or import a fictional/development CSV or institutional class list.
- **FR-PEOPLE-003 (F/T-D):** maintain a faculty directory and role/department assignments.
- **FR-PEOPLE-004 (T-D/F):** authorized users may open student and faculty profiles and linked academic records.
- **FR-PEOPLE-005 (F):** authorized users may unenroll a student with confirmation and an audit entry.

### Evaluation criteria, assessments, and grading

- **FR-GRADE-001 (T-E/T-D/F):** define customizable nested grading criteria: periods, period components, and assessment categories.
- **FR-GRADE-002 (F):** display and validate a weight distribution totaling 100% for the applicable grading scope.
- **FR-GRADE-003 (T-E/T-D):** record examination, quiz, assignment, project, attendance, participation/engagement, and other configured assessment results.
- **FR-GRADE-004 (T-D):** import, view, edit, export, and permitted-delete assessment results.
- **FR-GRADE-005 (T-E/T-D):** calculate grades automatically from recorded results and approved formulas while preserving institutional policy authority.
- **FR-GRADE-006 (T-D):** graders submit results for faculty review; faculty approve or reject them; grader-visible status reflects the review.
- **FR-GRADE-007 (A):** grader submissions use `draft`, `submitted`, `approved`, and `rejected`; only approved results affect official calculations.
- **FR-GRADE-008 (A):** prevent duplicate active assessment results for the same enrollment and assessment.

### AI evaluation, prediction, and feedback

- **FR-AI-001 (T-E/T-D):** evaluate and classify current student performance from configured criteria and academic indicators.
- **FR-AI-002 (T-E/T-D/F):** generate predictions for future assessment and overall performance.
- **FR-AI-003 (F):** support prediction scenarios including minimum, maximum, minimum-to-pass, and stable/current-trend.
- **FR-AI-004 (T-E/F):** show current grade, predicted grade, performance trend, risk level, and model confidence where available.
- **FR-AI-005 (T-E):** use explanations/feature contribution information to support, not replace, human decisions.
- **FR-AI-006 (T-E/T-D/F):** generate editable personalized feedback using templates and AI assistance.
- **FR-AI-007 (T-E/T-D):** faculty review and send feedback to students by email and/or account notification; sending is audited.
- **FR-AI-008 (T-E):** AI output must be presented as decision support and never autonomously determine final grades or academic decisions.
- **FR-AI-009 (A):** unavailable or failed inference produces a transparent unavailable/error state and never fabricated output.

### Dashboards, analytics, reports, and exports

- **FR-REPORT-001 (T-E/F):** role dashboards use stored data and calculated queries, not hard-coded metrics.
- **FR-REPORT-002 (F):** faculty dashboard includes class count, at-risk students, average score, predicted pass rate, attention list, recent assessments, and trend deltas.
- **FR-REPORT-003 (F):** Dean dashboard includes enrolled-student and class totals, pass rate, at-risk indicators, subject pass/fail, and subject averages.
- **FR-REPORT-004 (F):** Student dashboard exposes the student's own grades, trends, and feedback only.
- **FR-REPORT-005 (F):** Grader dashboard exposes assigned work and submission status only.
- **FR-REPORT-006 (F):** analytics filters include subject, section, student, date/term, and score/risk where relevant.
- **FR-REPORT-007 (T-D):** raw data may be exported to CSV or JSON; reports may be exported to PDF.
- **FR-REPORT-008 (T-D/F):** report and table endpoints support authorization, sorting, filtering, pagination, and calculated totals.

### Notifications, events, and assistance

- **FR-NOTIFY-001 (T-D/F):** provide in-app notifications for assessment, approval, risk, feedback, security, and system events.
- **FR-NOTIFY-002 (F):** users can view notification summaries and all notifications.
- **FR-NOTIFY-003 (F):** Dean users manage academic events/calendar entries with category, priority, dates, description, and audience.
- **FR-NOTIFY-004 (F):** an APMS assistant surface may answer queries from authorized stored data; it may not bypass record-level permissions.

### Technical administration

- **FR-ADMIN-001 (T-D):** System Operator manages users, roles, permissions, authentication settings, system limits, integrations, and access/system logs.
- **FR-ADMIN-002 (T-D):** Super Admin manages System Operator/admin accounts, backups, and view/export of access/system logs.
- **FR-ADMIN-003 (T-D/F):** backup operations include create, inspect, restore, and delete for supported scopes, with explicit confirmation and audit events.
- **FR-ADMIN-004 (F):** expose system information, notification settings, security settings, and configurable system settings to the permitted technical role.
- **FR-ADMIN-005 (T-D):** third-party integrations can be connected/configured by the System Operator.

## Core business rules

1. The system is advisory; educators and institutional grading policies retain decision authority (T-E).
2. Data accuracy and prediction quality depend on complete, valid source data (T-E).
3. Access is granted by role and, for academic records, by department/class/enrollment/assignment relationship (T-E/T-D).
4. Grader entries require faculty approval before they become official (T-D).
5. Evaluation criteria and formulas are versioned; calculations identify the version used (T-D/A).
6. Criterion weights must total 100% within the calculation scope before activation (F/A).
7. Feedback is reviewable/editable before sending and every send is logged (T-D/F).
8. Backup restore, deletion, role change, account disablement, approval/rejection, and official result changes require audit records (T-D/A).
9. Exports apply the same authorization and filters as the on-screen query (T-D/A).
10. Student users may access only their own academic and feedback records (T-D/A).

## Non-functional requirements

- **NFR-SEC-001 (T-E):** protect confidentiality and integrity with authentication, encryption, RBAC, least privilege, and separation of duties.
- **NFR-SEC-002 (A):** password hashes use an established adaptive password KDF through the selected identity provider; no plaintext password is stored or logged.
- **NFR-SEC-003 (A):** validate server input, use parameterized data access, safe rendering, upload allowlists, and CSRF protection where cookie sessions are used.
- **NFR-SEC-004 (A):** important authentication and mutation endpoints are rate limited.
- **NFR-PERF-001 (A):** normal authenticated reads should complete within 2 seconds at the thesis's controlled deployment scale, excluding AI inference and exports.
- **NFR-PERF-002 (A):** list endpoints are paginated and indexed on common filter, ownership, status, and timestamp columns.
- **NFR-ACCESS-001 (A):** target WCAG 2.1 AA keyboard, focus, label, contrast, and semantic requirements.
- **NFR-RESP-001 (T-E/F):** support web and mobile-sized clients; desktop frames are authoritative and responsive layouts preserve content/actions rather than pixel scaling.
- **NFR-AVAIL-001 (T-E):** operation depends on institutional network/internet; advanced distributed/cloud guarantees are outside scope.
- **NFR-BACKUP-001 (T-D/A):** backups have scope, status, checksum/metadata, creator, timestamps, and restore audit history; schedules and retention are configurable because the thesis gives no period.
- **NFR-OBS-001 (T-D):** keep access logs, system logs, and audit events with export for permitted technical roles.
- **NFR-PRIV-001 (T-E):** do not disclose student data outside authorized academic relationships; avoid sensitive data in application logs.

## Explicit constraints and limitations

- Limited to SWUNEXT non-health allied units and a controlled academic period (T-E).
- No additional hardware procurement, long-term maintenance, continuous updates, or extended support is promised (T-E).
- Full external LMS and institutional database interoperability is outside scope (T-E).
- Advanced cloud distribution and guaranteed remote access are outside scope (T-E).
- The manuscript is an in-progress 2026 document: Chapter 5 and post-development findings are absent; some Chapter 4 tables are referenced but not embedded (R gap).


# Codex Prompt — Rebuild APMS from Revised Thesis

You are working on an existing thesis system located under:

`D:\APMS`

The authoritative system specification is:

`D:\APMS\docs\SWU-001 - Manuscript - Revised.docx`

The project is an **AI-Based Student Performance Evaluation and Monitoring System for SWUNEXT at Southwestern University PHINMA**.

Your task is to **review the existing codebase and rebuild/refactor the current system so that it accurately implements the requirements in the revised manuscript**.

## CRITICAL RULES

1. **Read the revised manuscript first.**
   - Treat `D:\APMS\docs\SWU-001 - Manuscript - Revised.docx` as the primary source of truth for system requirements.
   - Pay particular attention to:
     - Scope of the System
     - Limitations of the System
     - Conceptual Framework
     - Context Flow Diagram
     - Use Case Diagram
     - Data Flow Diagram
     - Mockups
     - Faculty workflows
     - Academic Admin workflows
     - AI performance evaluation/prediction requirements

2. **Inspect the existing codebase before changing anything.**
   - Identify the current frontend framework.
   - Identify routing/navigation.
   - Identify reusable UI components.
   - Identify current Supabase integration.
   - Inspect current database tables/types/query helpers.
   - Identify authentication implementation.
   - Identify currently implemented modules.
   - Identify incomplete/broken/dead code.

3. **DO NOT replace or unnecessarily reconfigure the existing Supabase connection.**
   - The application is already connected to Supabase.
   - Reuse the existing Supabase project/configuration.
   - Do not create another Supabase project.
   - Do not replace working environment variables.
   - Do not hardcode Supabase credentials.
   - Do not expose service-role keys in frontend code.
   - Before changing database-related code, inspect the existing schema and migration files.

4. **Preserve working functionality where reasonable.**
   - This is a rebuild/refactor, not an automatic delete-and-start-over operation.
   - Reuse good existing components, database helpers, authentication logic, layouts, hooks, utilities, and styles where appropriate.
   - Replace poorly structured or incompatible code only when necessary.

5. Do not invent institutional integrations.
   - SWU SIS is NOT part of the system.
   - The application does NOT submit official grades to SIS.
   - SIS remains the institutional source of official grades.
   - Do not scrape or automate SIS.
   - Do not create fake SIS APIs.
   - Google Classroom integration must not be assumed to be available unless existing code/API credentials already support it.
   - CSV/manual data entry must work independently.

---

# SYSTEM PURPOSE

The application is primarily a **teacher-assistance and academic monitoring system**.

Its purpose is to:

- organize student performance records;
- consolidate assessment and attendance information;
- calculate current/provisional academic standing;
- track student progress;
- use AI/ML to identify students who may be academically at risk;
- show faculty which students require attention;
- provide aggregate monitoring information to academic administrators;
- support academic decision-making without replacing faculty judgment.

The system is **not**:

- a replacement for SWU SIS;
- an enrollment system;
- an official grade submission system;
- a full Learning Management System;
- an autonomous academic decision-making system.

---

# USER ROLES

Implement exactly these core roles unless the existing revised manuscript contains a more specific requirement.

## 1. System Admin

This is the merged former Super Admin/System Admin role.

Responsibilities:

- manage system users;
- assign roles;
- activate/deactivate accounts;
- manage permissions where applicable;
- inspect audit/activity logs;
- manage technical/system-level settings;
- oversee security-related configuration;
- view backup/system status where supported.

Do not give this user unnecessary academic record editing capabilities unless required.

---

## 2. Academic Admin

This represents academic leadership such as:

- Dean;
- Assistant Dean;
- Program Head;
- Program Chair;
- Program Director;
- similar authorized academic administrators.

Academic Admin should primarily have **oversight and configuration responsibilities**, not behave like an ordinary teacher.

Responsibilities include:

- view program/department-level performance;
- monitor classes under their authorized academic scope;
- view aggregated statistics;
- view pass/fail trends;
- view at-risk student counts/cohorts;
- compare subjects/classes/sections where data permits;
- view performance trends;
- manage or define shared performance/grading criteria/templates where required;
- generate/export administrative reports.

Avoid turning Academic Admin into an SIS administrator.

---

## 3. Faculty

Faculty is the PRIMARY operational user.

Faculty responsibilities:

- manage their classes;
- manage class rosters;
- add/import students into local monitoring classes;
- create assessments;
- encode assessment scores;
- import assessment scores through CSV where supported;
- record attendance;
- manage grading/performance criteria where authorized;
- view automatically calculated current/provisional student standing;
- monitor student performance;
- view trends;
- run/view AI performance prediction;
- identify students at risk;
- inspect reasons/contributing factors for risk;
- create/review student feedback;
- generate/export class reports.

Faculty should generally only access classes assigned to them unless permission rules explicitly say otherwise.

---

# STUDENT RECORDS

Students are primarily **records being monitored**, not replacements for SIS user accounts.

The system should maintain only information necessary for monitoring, such as:

- student ID/reference number;
- full name;
- email where legitimately available;
- program;
- year level;
- section;
- enrollment/class membership;
- monitoring status.

Do not attempt to reproduce the entire SIS student profile.

---

# CORE DATA MODEL

First inspect the current Supabase schema.

Reuse existing compatible tables.

If migrations are required, create proper migration files instead of making undocumented schema assumptions.

The logical model should support at minimum:

## users / profiles
- id
- auth user id
- full name
- email
- role
- department/program scope
- active status
- created_at
- updated_at

## academic_units
For colleges/departments/programs where needed.

## subjects
- id
- subject code
- subject name

## academic_terms
- school year
- semester/term

## classes
- id
- subject
- section
- term
- faculty owner
- academic unit
- status

## students
- id
- student reference/ID
- name
- email where available
- program
- year level
- section
- status

## class_students / enrollments
Many-to-many relationship between students and classes.

## assessment_categories
Examples:
- quiz
- activity
- written work
- examination
- project
- laboratory
- assignment
- participation
- other

## assessments
- id
- class_id
- category
- title
- maximum score
- date
- grading period
- source
- external reference if applicable

Possible sources:
- manual
- csv
- google_classroom

Do not assume Google Classroom API access.

## assessment_results
- assessment_id
- student_id
- score
- status
- timestamps

Support missing/unsubmitted values without treating them automatically as zero unless the grading configuration explicitly requires it.

## grading_criteria
Support configurable weighted criteria.

Examples may include:

- grading period;
- component;
- category;
- weight;
- passing threshold.

Validation should prevent invalid total weights where applicable.

## attendance_sessions
- class
- date
- session

## attendance_records
- session
- student
- attendance status

Suggested statuses:
- present
- absent
- late
- excused

If statuses differ from existing manuscript/schema, preserve existing terminology.

## performance_snapshots or calculated performance

Support derived/calculated values such as:

- current standing;
- category averages;
- assessment completion;
- attendance rate;
- trend.

Prefer calculations from source records where practical rather than storing redundant values unnecessarily.

## ai_predictions
Store AI outputs where useful:

- student
- class
- timestamp
- predicted performance
- risk level
- model version
- prediction probability/confidence if methodologically valid
- explanation/contributing features
- input snapshot/reference

## feedback
- student
- class
- generated content
- edited content
- status
- faculty
- sent_at
- timestamps

## audit_logs
Track important changes, especially:

- authentication/account changes;
- grades/scores;
- attendance;
- grading criteria;
- role changes;
- AI prediction runs;
- exports where appropriate.

---

# GRADE AND ASSESSMENT WORKFLOW

The system must support both DIGITAL and PHYSICAL classroom activities.

Examples:

### Digital
- Google Classroom assignment
- Google Forms quiz
- digital project
- online activity

### Physical/manual
- written quiz
- written work
- examination
- physical project
- classroom activity
- recitation/participation

Internally, normalize these into a common **Assessment** model.

Example:

Class
→ Assessments
→ Student Assessment Results
→ Performance Calculation
→ AI Analysis
→ Monitoring Dashboard

Faculty must be able to manually create an assessment.

Example fields:

- title;
- type/category;
- maximum score;
- date;
- grading period;
- weight/category;
- description if needed.

Faculty must then be able to enter scores efficiently in a gradebook-style interface.

Prefer spreadsheet-like batch entry over forcing faculty to open one student at a time.

---

# CSV IMPORT

CSV import is important because external institutional integrations may not be available.

Support CSV-based import where practical for:

- student roster;
- assessment scores;
- possibly attendance.

Provide:

1. file selection;
2. preview;
3. column mapping;
4. validation;
5. error reporting;
6. confirmation;
7. import summary.

Do not silently import malformed rows.

Prevent duplicate students/assessments where identifiable.

---

# GOOGLE CLASSROOM

Treat Google Classroom as an OPTIONAL future/controlled data source.

If working integration already exists in the repository:

- preserve it;
- inspect how OAuth/scopes work;
- make it optional;
- make sure the application works without it.

If no working integration exists:

- do NOT block the rebuild on Google Classroom;
- do NOT invent fake production integration;
- implement a clean adapter/interface for future integration if appropriate;
- prioritize CSV/manual import.

The local class in APMS must remain independent from a Google Classroom class.

If eventually linked:

Local APMS Class
↔ optional Google Classroom course

Google Classroom should not become the authoritative academic record.

---

# ATTENDANCE

Attendance is REQUIRED by the thesis.

Implement a faculty-friendly roll-call workflow.

Example:

Class → Attendance → Create Session → Student List

For each student:

- Present
- Absent
- Late
- Excused

Provide:

- batch marking;
- date/session history;
- attendance percentage;
- absence count;
- attendance trend if useful.

Attendance data should feed the student monitoring view and AI model when configured.

Do not build:

- RFID;
- facial recognition;
- GPS attendance;
- biometric attendance;
- QR attendance;

unless already explicitly required elsewhere.

---

# PERFORMANCE CALCULATION

The application must distinguish between:

## Current / Provisional Standing

Calculated from monitoring data inside APMS.

and

## Official Grade

Official grade maintained in SWU SIS.

Never label APMS-calculated monitoring values as the official SIS grade.

Use terminology such as:

- Current Standing
- Current Performance
- Provisional Grade
- Calculated Standing

Add appropriate UI wording such as:

`For monitoring and decision-support purposes. This is not the official SIS grade.`

where useful.

---

# AI REQUIREMENT

AI is mandatory for the thesis.

Do NOT remove the AI functionality.

However, the AI component should have a clearly defined responsibility:

> Analyze student performance indicators and assist Faculty in identifying students who may be academically at risk.

The core system must remain usable even if the AI service is unavailable.

Possible inputs:

- assessment scores;
- current standing;
- recent score progression;
- attendance;
- missing assessments;
- participation where available;
- category-level performance.

Expected outputs:

- predicted performance;
- performance direction/trend;
- risk classification;
- prediction score/probability where valid;
- contributing factors/explanation.

Risk examples:

- Low
- Medium
- High

Do not automatically make academic decisions.

AI output must be clearly marked as:

- prediction;
- analytical assistance;
- decision-support information.

Faculty remains responsible for deciding whether intervention is appropriate.

---

# MACHINE LEARNING IMPLEMENTATION

The revised thesis still requires an AI/ML component.

Inspect the existing repository for:

- Python AI service;
- PyTorch;
- LSTM;
- Transformer;
- SHAP;
- inference API;
- existing model artifacts;
- training datasets;
- model notebooks.

Do not delete existing viable AI work.

Before implementing or rewriting ML:

1. Determine what dataset currently exists.
2. Determine the number of student records.
3. Determine available features.
4. Determine whether data is longitudinal/sequential.
5. Determine the target variable.
6. Determine train/validation/test split.
7. Check class imbalance.
8. Check missing data.
9. Check current model metrics.

If there is insufficient real SWU student data:

- do not fabricate claims of institutional accuracy;
- allow the system to operate using an approved controlled/synthetic/anonymized demonstration dataset;
- clearly keep model limitations documented;
- keep model components modular so retraining can occur later.

Do not manufacture fake AI confidence percentages.

If SHAP is retained:

Use it to explain model contributing factors in understandable terms.

Example:

Factors increasing risk:
- low recent quiz scores;
- declining assessment trend;
- high number of absences.

The Faculty UI should prioritize understandable explanations over raw ML visualizations.

---

# AI SERVICE ARCHITECTURE

Keep AI separate from ordinary CRUD/business logic.

Preferred conceptual architecture:

Frontend
→ Application/API/Data Layer
→ Supabase

and separately:

Performance Data
→ AI Inference Service
→ Prediction
→ Store/return result
→ Faculty Dashboard

The system should gracefully handle AI service failure.

Example:

`Prediction temporarily unavailable. Student records and calculated standing remain accessible.`

Do not make normal grade entry dependent on Python inference availability.

---

# FACULTY DASHBOARD

This is one of the most important screens.

The Faculty dashboard should prioritize actionable monitoring information.

Include:

### Summary cards
- number of active classes;
- number of students monitored;
- number of students at risk;
- class/current average;
- recent attendance issues where useful.

### Students Requiring Attention

Show prioritized students with:

- student name;
- class;
- current standing;
- risk level;
- trend;
- key contributing reason;
- action/view button.

### Recent Assessments

Show recent assessment activity.

### Performance Overview

Use useful charts where appropriate:

- pass/at-risk distribution;
- class performance trend;
- grade distribution;
- attendance trend.

Avoid decorative charts with no decision-making value.

---

# CLASS RECORD / GRADEBOOK

Build a strong gradebook interface.

Faculty should be able to:

- select a class;
- view all students;
- view assessments as columns;
- enter/update scores;
- create assessment;
- filter by grading period/category;
- see current standing;
- see risk indicator;
- see missing scores;
- save efficiently.

Do not require page reloads for every score when avoidable.

Support good validation:

- score cannot exceed max score unless explicitly permitted;
- invalid values rejected;
- missing score distinguished from zero;
- clear save state.

---

# STUDENT PERFORMANCE DETAILS

Create a student monitoring detail page accessible from Faculty/Admin views.

Include:

- basic monitoring information;
- class;
- current standing;
- risk level;
- predicted performance;
- trend;
- assessment breakdown;
- category averages;
- attendance summary;
- missing assessments;
- AI contributing factors;
- feedback history if applicable.

The screen should answer:

1. Is the student currently at risk?
2. Why?
3. Which assessments/categories are causing the issue?
4. Is performance improving or declining?
5. Is attendance contributing?
6. What information can the teacher use for intervention?

---

# AT-RISK STUDENTS PAGE

Provide a dedicated workflow for Faculty.

Allow:

- filter by class;
- risk level;
- subject;
- trend;
- attendance;
- search student.

Suggested columns:

- Student
- Class
- Current Standing
- Predicted Standing
- Risk Level
- Trend
- Attendance
- Key Factor
- Last Updated

Allow drill-down into student details.

---

# ACADEMIC ADMIN DASHBOARD

Academic Admin needs aggregated oversight rather than day-to-day score encoding.

Include:

- total monitored classes;
- total monitored students;
- pass/current standing summary;
- number/percentage of at-risk students;
- risk by subject;
- risk by section/program where authorized;
- average subject performance;
- trends over time;
- classes requiring attention.

Academic Admin should be able to drill down:

Program
→ Subject/Class
→ Aggregated Student Monitoring

Respect role scope.

A Program Head should not automatically see unrelated departments unless authorized.

---

# PERFORMANCE EVALUATION CRITERIA

Provide configurable grading criteria.

The application should support institution/course-specific structures without hardcoding a single formula.

Allow authorized Faculty/Academic Admin users to configure:

- grading periods;
- categories;
- component weights;
- passing threshold;
- ordering.

Example:

Period 1
- Class Standing 60%
  - Quiz
  - Activity
  - Project
- Period Exam 40%

Validate totals.

Show warnings if weights are incomplete or exceed expected totals.

Changes to grading criteria should be logged.

Avoid retroactively corrupting historical calculations.

---

# REPORTS AND EXPORTS

Implement useful reports.

Faculty reports:

- class performance;
- student performance;
- at-risk students;
- attendance;
- assessment summary.

Academic Admin reports:

- program/department performance;
- risk distribution;
- subject comparison;
- class comparison.

Support:

- CSV export;
- printable/PDF-friendly view where currently supported.

Do not create SIS submission files unless specifically documented and supported.

---

# FEEDBACK

The thesis includes student performance feedback.

Faculty should be able to generate/review feedback based on student performance.

AI-generated feedback may be supported, but faculty must be able to:

- review;
- edit;
- approve;
- optionally send.

Never automatically send sensitive academic feedback without faculty confirmation.

If email sending is not already reliably configured:

- implement the feedback workflow;
- store drafts/history;
- isolate actual email delivery behind a service.

Do not make email delivery mandatory for core monitoring.

---

# AUTHENTICATION

Inspect current Supabase Auth implementation.

Prefer reusing the existing auth solution.

Support:

- secure login;
- session persistence;
- logout;
- password reset where applicable;
- role-based route protection.

If Google Sign-In already works, preserve it.

Do not add multiple redundant authentication mechanisms unless required.

Do not assume PHINMA Google Workspace will approve advanced Classroom scopes.

---

# RBAC

Implement strict RBAC.

## System Admin
Can manage:
- users;
- roles;
- system settings;
- logs.

## Academic Admin
Can:
- view authorized programs/classes;
- view aggregate monitoring data;
- manage authorized evaluation criteria/templates;
- generate administrative reports.

## Faculty
Can:
- manage assigned classes;
- manage assessments;
- encode scores;
- record attendance;
- view AI results;
- generate reports;
- review/send feedback.

Use server/database-level protection where possible, including Supabase Row Level Security if the project already uses it or can support it safely.

Do not rely solely on hiding frontend buttons for authorization.

---

# SECURITY

The manuscript emphasizes:

- confidentiality;
- integrity;
- data privacy;
- authentication;
- RBAC;
- encryption.

Use Supabase security capabilities appropriately.

Check:

- RLS policies;
- authenticated user access;
- role checks;
- unsafe public tables;
- client-side secrets;
- service-role exposure;
- input validation;
- unauthorized cross-class access.

Sensitive student records should never be exposed through anonymous/public queries.

---

# AUDIT LOGGING

Log high-value actions such as:

- score creation/update/delete;
- attendance changes;
- grading criteria changes;
- role/account changes;
- AI prediction execution;
- feedback approval/sending.

Audit records should ideally include:

- actor;
- action;
- entity;
- entity ID;
- timestamp;
- metadata where appropriate.

Do not expose audit editing to ordinary users.

---

# UI/UX REQUIREMENTS

Use the existing design language where good.

Improve consistency across:

- typography;
- spacing;
- cards;
- forms;
- tables;
- filters;
- badges;
- dialogs;
- alerts;
- responsive behavior.

Prioritize desktop/tablet usability because faculty will work heavily with tables and records.

Mobile responsiveness is desirable, but do not sacrifice gradebook usability just to make every dense table look like a mobile application.

Important statuses should be easy to distinguish:

- Low risk
- Medium risk
- High risk
- Improving
- Stable
- Declining
- Present
- Absent
- Late
- Excused

Do not rely exclusively on color; include text labels/icons.

---

# REQUIRED SCREEN STRUCTURE

At minimum, implement or refactor toward:

## Shared
- Login
- Forgot Password
- Profile
- Settings
- Notifications if currently supported

## Faculty
- Faculty Dashboard
- My Classes
- Class Details
- Class Gradebook
- Assessments
- Attendance
- Students
- Student Performance Details
- At-Risk Students
- Analytics & Insights
- Performance Evaluation / AI Prediction
- Feedback
- Reports / Export
- Grading Criteria

## Academic Admin
- Academic Admin Dashboard
- Academic Units / Authorized Programs
- Classes Overview
- Student Performance Monitoring
- At-Risk Overview
- Analytics
- Performance Evaluation Criteria
- Reports

## System Admin
- Admin Dashboard
- User Management
- Role Management
- Audit Logs
- System Settings
- System/backup status where applicable

Do not recreate removed Grader/Super Admin pages.

---

# REMOVE / REFACTOR LEGACY ROLE REFERENCES

Search the entire repository for:

- Super Admin
- super_admin
- Grader
- grader

Remove or migrate these references according to the revised role model.

Former:

Super Admin
+
System Admin

becomes:

System Admin

Former Grader functionality should be removed unless needed internally.

Update:

- TypeScript types;
- enums;
- database role values where safely possible;
- RLS policies;
- UI labels;
- route guards;
- sidebars;
- seed data;
- mock data;
- tests.

If the existing database already contains these values, write a safe migration instead of breaking existing rows.

---

# SYSTEM BOUNDARY

Enforce the following architecture mentally and in code:

External / source data
- manual faculty entry
- CSV
- optionally Google Classroom in the future

↓

APMS
- class records
- assessments
- attendance
- performance calculation
- analytics
- AI at-risk prediction
- reports
- feedback

↓

Faculty / Academic Admin decision support

SWU SIS remains OUTSIDE APMS.

There should be no:

- official SIS grade submission;
- SIS enrollment workflow;
- financial holds;
- student billing;
- SIS account management;
- SIS scraping.

---

# IMPLEMENTATION PROCESS

Work in phases.

## PHASE 1 — AUDIT

Before writing major code:

1. inspect project structure;
2. inspect package.json;
3. inspect current routes;
4. inspect Supabase client;
5. inspect database-related files;
6. inspect auth;
7. inspect existing components/pages;
8. inspect AI service;
9. inspect existing schema/migrations;
10. compare existing implementation against the revised manuscript.

Create:

`D:\APMS\docs\implementation-audit.md`

Include:

- existing modules;
- working modules;
- broken modules;
- missing requirements;
- obsolete requirements;
- database findings;
- AI findings;
- recommended changes.

Do not stop after writing the audit. Continue implementation.

---

# PHASE 2 — DATABASE ALIGNMENT

Inspect current Supabase schema.

Create only necessary migrations.

Avoid destructive reset operations.

Do not drop production data casually.

If schema changes are substantial:

- create migrations;
- migrate role values safely;
- preserve compatible records.

---

# PHASE 3 — ROLE AND AUTH REFACTOR

Implement:

- System Admin
- Academic Admin
- Faculty

Fix:

- route guards;
- sidebars;
- permissions;
- Supabase policies.

---

# PHASE 4 — CORE ACADEMIC RECORDS

Complete:

- academic terms;
- subjects;
- classes;
- class rosters;
- students;
- assessments;
- score entry;
- grading criteria;
- attendance.

These modules must work before AI depends on them.

---

# PHASE 5 — PERFORMANCE ENGINE

Implement:

- assessment totals;
- category averages;
- current standing;
- passing threshold;
- attendance rate;
- performance trend;
- missing assessment indicators.

Keep deterministic grade calculations separate from ML prediction.

---

# PHASE 6 — AI MODULE

Integrate/refactor the existing AI service.

Expose clear prediction input/output contracts.

Example conceptual response:

```json
{
  "studentId": "...",
  "currentStanding": 74.2,
  "predictedStanding": 71.6,
  "riskLevel": "high",
  "trend": "declining",
  "probability": 0.82,
  "factors": [
    "Low recent assessment scores",
    "Declining score trend",
    "High absence rate"
  ],
  "modelVersion": "..."
}
```

Only provide probability/confidence if the model genuinely supports it.

Store enough metadata to reproduce/trace predictions.

---

# PHASE 7 — DASHBOARDS AND MONITORING

Build Faculty dashboard first.

The most important UX question is:

> Which students need the teacher's attention right now, and why?

Then build Academic Admin aggregate dashboard.

---

# PHASE 8 — REPORTS, FEEDBACK, POLISH

Complete:

- exports;
- reports;
- feedback;
- audit trail;
- settings;
- responsive design;
- loading/error/empty states.

---

# TESTING

Add or update tests for critical logic.

At minimum test:

### Authentication / RBAC
- Faculty cannot access System Admin pages.
- Faculty cannot edit another faculty member's classes.
- Academic Admin only sees authorized scope.
- unauthenticated users cannot retrieve protected student records.

### Grade calculations
- weighted calculations;
- max scores;
- missing grades;
- invalid values;
- 100% weighting validation.

### Attendance
- session creation;
- attendance rate;
- absent/late/excused handling.

### Risk prediction integration
- request validation;
- model unavailable;
- prediction result display;
- invalid response;
- old prediction handling.

### CSV
- valid import;
- duplicate handling;
- invalid rows;
- missing columns.

---

# CODE QUALITY

While rebuilding:

- remove dead code;
- avoid huge monolithic components;
- isolate Supabase queries;
- use typed models;
- use shared form validation;
- create reusable tables/forms;
- add meaningful loading states;
- add meaningful error messages;
- avoid `any` where practical;
- avoid duplicated business logic;
- keep grade calculation functions testable;
- keep AI integration behind a dedicated service.

Use the project's existing language/framework conventions unless there is a strong technical reason to change them.

Do NOT migrate to an entirely different frontend framework just because you prefer one.

---

# DOCUMENTATION

Update:

`D:\APMS\README.md`

Include:

- system purpose;
- setup;
- environment variables;
- Supabase requirements;
- roles;
- local development;
- AI service setup;
- migrations;
- test commands;
- build instructions.

Also create:

`D:\APMS\docs\system-architecture.md`

Document:

- users;
- role permissions;
- system boundaries;
- Supabase;
- performance calculation;
- AI module;
- data flow;
- SIS exclusion;
- optional Google Classroom integration.

Create:

`D:\APMS\docs\database-schema.md`

Describe:

- tables;
- key fields;
- relationships;
- important RLS rules.

---

# FINAL ACCEPTANCE CRITERIA

The rebuild is successful when:

1. Faculty can authenticate.
2. Faculty can create/manage a class.
3. Faculty can add/import students.
4. Faculty can create assessments.
5. Faculty can batch-enter scores.
6. Faculty can record attendance.
7. Faculty can configure grading criteria.
8. The system computes current/provisional performance correctly.
9. Faculty can see students requiring attention.
10. AI can analyze supported student performance data.
11. AI can provide at-risk predictions.
12. Faculty can see understandable reasons behind a risk prediction where supported.
13. Faculty can inspect individual student performance history.
14. Academic Admin can view aggregate authorized performance data.
15. Academic Admin can identify problematic classes/subjects/cohorts.
16. System Admin can manage users and roles.
17. Role restrictions are enforced server/database-side where possible.
18. Reports/exports work.
19. The system remains usable if AI prediction is temporarily unavailable.
20. No SIS replacement functionality exists.
21. No production functionality assumes privileged institutional access that the project does not have.
22. Existing working Supabase connectivity remains intact.

---

# IMPORTANT DEVELOPMENT BEHAVIOR

Do not only produce recommendations.

Actually inspect, modify, refactor, test, and complete the application.

When uncertain:

1. check the revised manuscript;
2. inspect existing implementation;
3. prefer the simplest implementation that satisfies the thesis;
4. preserve working Supabase/database functionality;
5. document assumptions.

Do not invent missing institutional requirements.

For unclear business rules, implement a configurable mechanism where appropriate rather than hardcoding undocumented SWU policies.

At the end, provide a concise report containing:

- files changed;
- database migrations added;
- features completed;
- features intentionally excluded;
- AI implementation status;
- test/build results;
- remaining blockers;
- any requirement that cannot be completed without institutional/API/data access.

# Subject Management & Request Lifecycle

This document explains how subjects and subject requests are managed in APMS, ensuring academic integrity and role-scoped authorization.

---

## 1. Overview

In APMS, subjects belong to specific academic departments (`departments.id`). To ensure faculty members teach approved curriculum while removing operational bottlenecks:
- **Academic Administrators** create and manage department subjects.
- **Faculty** can submit **Subject Requests** when a new course is assigned or curriculum expands.
- **Approval** immediately creates or activates the subject in the department so faculty can create classes.

---

## 2. Database Schema & RLS

### `subjects` Table
- `id` (UUID, PK)
- `department_id` (UUID, FK -> `departments.id`)
- `code` (TEXT, e.g. `IT311`, UNIQUE per department)
- `title` (TEXT, e.g. `Mobile Application Development`)
- `units` (NUMERIC, default 3.0)
- `status` (`'active'` | `'inactive'`)

#### RLS Policies on `subjects`
- **Faculty SELECT**: Can only see `status = 'active'` subjects within their assigned department (`faculty_profiles.department_id = subjects.department_id`).
- **Academic Admin SELECT/ALL**: Can read and manage all subjects in their authorized department (`user_roles.scope_id = subjects.department_id`).
- **System Admin**: Global access guarded by `system.configure`.

### `subject_requests` Table
- `id` (UUID, PK)
- `department_id` (UUID, FK -> `departments.id`)
- `requested_by` (UUID, FK -> `profiles.id`)
- `code` (TEXT)
- `title` (TEXT)
- `units` (NUMERIC)
- `rationale` (TEXT, minimum 10 characters)
- `status` (`'pending'` | `'approved'` | `'rejected'`)
- `reviewed_by` (UUID, FK -> `profiles.id`, optional)
- `reviewed_at` (TIMESTAMPTZ, optional)
- `review_note` (TEXT, required on rejection)

#### RLS Policies on `subject_requests`
- **Faculty INSERT**: Allowed only if `requested_by = auth.uid()` and `department_id` matches the user's active faculty profile.
- **Faculty SELECT**: Can view their own submitted requests.
- **Academic Admin ALL**: Can view and update requests matching their authorized department.

---

## 3. RPC Functions

### `faculty_submit_subject_request`
```sql
public.faculty_submit_subject_request(
  p_code text,
  p_title text,
  p_units numeric,
  p_rationale text
) RETURNS uuid
```
- **Security**: `SECURITY DEFINER`, `search_path = ''`.
- **Department**: Derived internally from `private.get_faculty_department_id()` (no client-side spoofing).
- **Validation**: Enforces non-empty strings, positive units, minimum 10-character rationale, and prevents duplicate pending requests for the same code in that department.
- **Audit**: Writes `subject_request.submitted` to `audit_logs`.

### `academic_admin_manage_subject`
```sql
public.academic_admin_manage_subject(
  p_subject_id uuid, -- NULL for create, UUID for update
  p_department_id uuid,
  p_code text,
  p_title text,
  p_units numeric,
  p_status text -- 'active' | 'inactive'
) RETURNS uuid
```
- **Security**: `SECURITY DEFINER`, `search_path = ''`.
- **Authorization**: Verifies caller has `subjects.manage.department` for `p_department_id`.
- **Audit**: Writes `subject.created` or `subject.updated` to `audit_logs`.

### `academic_admin_review_subject_request`
```sql
public.academic_admin_review_subject_request(
  p_request_id uuid,
  p_decision text, -- 'approved' | 'rejected'
  p_review_note text -- Required for rejection
) RETURNS void
```
- **Security**: `SECURITY DEFINER`, `search_path = ''`.
- **Decision Logic**:
  - `approved`: Activates or creates the subject in the department.
  - `rejected`: Requires non-empty `review_note` explaining the reason.
- **Audit**: Writes `subject_request.approved` or `subject_request.rejected` to `audit_logs`.

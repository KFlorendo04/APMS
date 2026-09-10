import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const migrationsDirectory = resolve("supabase/migrations");
const sql = readdirSync(migrationsDirectory)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => readFileSync(resolve(migrationsDirectory, name), "utf8"))
  .join("\n");
const hardeningSql = readFileSync(
  resolve(
    "supabase/migrations/20260806125202_enforce_scoped_authorization_and_audit.sql",
  ),
  "utf8",
);
const tables = new Map();

for (const match of sql.matchAll(
  /create table(?: if not exists)? public\.(\w+)\s*\(([\s\S]*?)\n\);/gi,
)) {
  const columns = new Set();
  for (const line of match[2].split(/\r?\n/)) {
    const column = line
      .trim()
      .match(
        /^(\w+)\s+(?:uuid|text|smallint|integer|bigint|numeric|boolean|date|timestamptz|jsonb)/i,
      );
    if (column) columns.add(column[1]);
  }
  tables.set(match[1], columns);
}

for (const match of sql.matchAll(
  /alter table public\.(\w+)\s+([\s\S]*?);/gi,
)) {
  const columns = tables.get(match[1]) ?? new Set();
  for (const columnMatch of match[2].matchAll(
    /add column if not exists\s+(\w+)\s+(?:uuid|text|smallint|integer|bigint|numeric|boolean|date|timestamptz|jsonb)/gi,
  )) {
    columns.add(columnMatch[1]);
  }
  tables.set(match[1], columns);
}

const contracts = {
  students: [
    "institutional_id",
    "first_name",
    "last_name",
    "year_level",
    "status",
    "program_id",
  ],
  faculty_profiles: ["employee_id", "profile_id", "department_id", "status"],
  assessment_results: [
    "score",
    "approval_status",
    "assessment_id",
    "enrollment_id",
  ],
  assessments: [
    "component_key",
    "module_number",
    "maximum_score",
    "assessment_date",
    "grading_period",
    "source",
  ],
  criteria_sets: [
    "name",
    "version",
    "total_weight",
    "status",
    "class_record_id",
  ],
  attendance_sessions: ["class_record_id", "session_date", "label", "created_by"],
  attendance_records: ["attendance_session_id", "enrollment_id", "status", "recorded_by"],
  import_job_rows: ["import_job_id", "row_number", "raw_data", "status", "errors"],
  feedback_records: ["category", "body", "status", "student_id", "author_id"],
  prediction_criteria: ["class_record_id", "scenario", "parameters"],
  prediction_runs: [
    "class_record_id",
    "prediction_criteria_id",
    "status",
    "initiated_by",
  ],
  events: ["department_id", "starts_at", "ends_at", "audience", "created_by"],
  backups: [
    "id",
    "scope",
    "size_bytes",
    "checksum",
    "status",
    "created_by",
    "created_at",
  ],
};

const errors = [];
for (const [table, requiredColumns] of Object.entries(contracts)) {
  const columns = tables.get(table);
  if (!columns) {
    errors.push(`Missing table public.${table}`);
    continue;
  }
  for (const column of requiredColumns)
    if (!columns.has(column)) errors.push(`Missing public.${table}.${column}`);
}

for (const table of tables.keys()) {
  if (!sql.includes(`public.${table}`))
    errors.push(`Table public.${table} is not referenced by the RLS setup`);
}

for (const forbidden of [
  "prediction_runs.term_id",
  "prediction_criteria.criteria_set_id",
]) {
  if (sql.includes(forbidden))
    errors.push(`Stale schema reference: ${forbidden}`);
}

for (const requirement of [
  "create policy students_department_manage",
  "create policy class_records_scoped_manage",
  "grant update (first_name, last_name, phone, avatar_path)",
  "create trigger audit_academic_mutation",
  "grant usage on schema private to authenticated",
  "grant execute on function private.can_manage_academic_department(uuid, text) to authenticated",
]) {
  if (!hardeningSql.toLowerCase().includes(requirement.toLowerCase())) {
    errors.push(`Missing hardening contract: ${requirement}`);
  }
}

for (const requirement of [
  "set key = 'system_admin'",
  "legacy_role.deactivated",
  "create table if not exists public.attendance_sessions",
  "create table if not exists public.attendance_records",
  "create policy attendance_sessions_faculty_manage",
  "create policy attendance_records_faculty_manage",
  "add column if not exists source text",
  "add column if not exists passing_threshold",
]) {
  if (!sql.toLowerCase().includes(requirement.toLowerCase())) {
    errors.push(`Missing revised-thesis contract: ${requirement}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  `Schema contract verified: ${tables.size} tables, ${Object.keys(contracts).length} application contracts.`,
);

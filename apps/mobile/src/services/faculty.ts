import {
  isSwunextComponent,
  parseCsv,
  summarizeSwunextGrade,
  validateCsvRows,
  type SwunextAssessmentComponent,
  type SwunextGradeBreakdown,
} from '@apms/domain';
import * as XLSX from 'xlsx';

import { supabase } from './supabase';

export type FacultyClass = {
  id: string;
  subjectId: string;
  code: string;
  title: string;
  section: string;
  term: string;
  studentCount: number;
};

export type FacultyReferenceData = {
  subjects: { id: string; code: string; title: string }[];
  terms: { id: string; label: string; status: 'active' | 'planned' }[];
  programs: { id: string; code: string; name: string }[];
};

export type RosterStudent = {
  enrollmentId: string;
  studentId: string;
  programId: string;
  institutionalId: string;
  name: string;
  email: string;
  program: string;
  yearLevel: number;
  section: string;
};

export type FacultyAssessment = {
  id: string;
  title: string;
  type: string;
  component: SwunextAssessmentComponent;
  moduleNumber: number | null;
  maximumScore: number;
  assessmentDate: string;
  gradingPeriod: string;
  source: string;
};

export type FacultyCriteria = {
  id: string;
  name: string;
  version: number;
  passingThreshold: number;
  nodes: { id: string; label: string; weight: number }[];
};

export type FacultyAttendanceSession = { id: string; date: string; label: string };
export type EvaluationRow = {
  enrollmentId: string;
  currentStanding: number | null;
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  predictedStanding: number | null;
  trend: 'improving' | 'stable' | 'declining' | 'unknown';
  factors: string[];
};
export type FeedbackRecord = {
  id: string;
  enrollmentId: string;
  body: string;
  category: string;
  status: 'draft' | 'ready' | 'sent' | 'failed' | 'archived';
  createdAt: string;
};

export type ClassWorkspace = {
  students: RosterStudent[];
  assessments: FacultyAssessment[];
  scores: Record<string, number>;
  criteria: FacultyCriteria | null;
  attendanceSessions: FacultyAttendanceSession[];
  attendance: Record<string, 'present' | 'absent' | 'late' | 'excused'>;
  evaluations: Record<string, EvaluationRow>;
  feedback: Record<string, FeedbackRecord[]>;
};

export const swunextCriteriaNodes = [
  { label: 'Start of Class', weight: 5 },
  { label: "Let's Practice", weight: 35 },
  { label: 'Reflection', weight: 15 },
  { label: 'Wrap-Up Quiz', weight: 15 },
  { label: 'Final Project / Output', weight: 30 },
];

function connected() {
  if (!supabase) throw new Error('APMS is not connected to Supabase.');
  return supabase;
}

export async function loadFacultyClasses(): Promise<FacultyClass[]> {
  const client = connected();
  const { data, error } = await client
    .from('class_records')
    .select('id,subject_id,section,subjects(code,title),academic_terms(academic_year,semester),enrollments(count)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    subjectId: row.subject_id,
    code: row.subjects?.code ?? '—',
    title: row.subjects?.title ?? 'Untitled subject',
    section: row.section,
    term: `${row.academic_terms?.academic_year ?? ''} ${row.academic_terms?.semester ?? ''}`.trim(),
    studentCount: Number(row.enrollments?.[0]?.count ?? 0),
  }));
}

export async function loadFacultyReferenceData(): Promise<FacultyReferenceData> {
  const client = connected();
  // Subjects are now filtered by the database RLS policy:
  // Faculty only see active subjects in their own assigned department.
  // No client-side department filter is needed or trusted.
  const [subjects, terms, programs] = await Promise.all([
    client.from('subjects').select('id,code,title').order('code'),
    client.from('academic_terms').select('id,academic_year,semester,status').in('status', ['active', 'planned']).order('starts_on', { ascending: false }),
    client.from('programs').select('id,code,name').eq('status', 'active').order('code'),
  ]);
  const error = subjects.error ?? terms.error ?? programs.error;
  if (error) throw error;
  return {
    subjects: subjects.data ?? [],
    terms: (terms.data ?? []).map((row) => ({
      id: row.id,
      label: `${row.academic_year} · ${row.semester}`,
      status: row.status as 'active' | 'planned',
    })),
    programs: programs.data ?? [],
  };
}

export async function createFacultyClass(subjectId: string, termId: string, section: string) {
  const { data, error } = await connected().rpc('faculty_create_class', {
    p_subject_id: subjectId,
    p_academic_term_id: termId,
    p_section: section.trim(),
  });
  if (error) {
    // Translate PostgreSQL unique-constraint violation into a user-friendly message.
    if (error.code === '23505' || error.message?.includes('class_records_subject_id_academic_term_id_section_key')) {
      throw new Error('A class for this subject and section already exists in this term. Use a different section identifier.');
    }
    // Surface other actionable messages from the RPC directly.
    throw error;
  }
  return data as string;
}

// ─── Subject requests ────────────────────────────────────────────────────────

export type SubjectRequest = {
  id: string;
  departmentId: string;
  code: string;
  title: string;
  units: number;
  rationale: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote: string | null;
  createdAt: string;
};

export async function submitSubjectRequest(input: {
  code: string;
  title: string;
  units: number;
  rationale: string;
}): Promise<string> {
  const { data, error } = await connected().rpc('faculty_submit_subject_request', {
    p_code: input.code.trim(),
    p_title: input.title.trim(),
    p_units: input.units,
    p_rationale: input.rationale.trim(),
  });
  if (error) throw error;
  return data as string;
}

export async function loadMySubjectRequests(): Promise<SubjectRequest[]> {
  const { data, error } = await connected()
    .from('subject_requests')
    .select('id,department_id,code,title,units,rationale,status,review_note,created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    departmentId: row.department_id,
    code: row.code,
    title: row.title,
    units: Number(row.units),
    rationale: row.rationale,
    status: row.status,
    reviewNote: row.review_note ?? null,
    createdAt: row.created_at,
  }));
}

export type StudentInput = {
  classId: string;
  programId: string;
  institutionalId: string;
  email: string;
  firstName: string;
  lastName: string;
  yearLevel: number;
  section: string;
};

export async function addStudentToClass(input: StudentInput) {
  const { data, error } = await connected().rpc('faculty_upsert_student_enrollment', {
    p_class_record_id: input.classId,
    p_program_id: input.programId,
    p_institutional_id: input.institutionalId.trim(),
    p_email: input.email.trim().toLowerCase(),
    p_first_name: input.firstName.trim(),
    p_last_name: input.lastName.trim(),
    p_year_level: input.yearLevel,
    p_section: input.section.trim(),
  });
  if (error) throw error;
  return data as string;
}

export async function updateStudentDetails(studentId: string, input: Omit<StudentInput, 'classId'>) {
  const { data, error } = await connected()
    .from('students')
    .update({
      program_id: input.programId,
      institutional_id: input.institutionalId.trim(),
      email: input.email.trim().toLowerCase(),
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      year_level: input.yearLevel,
      section: input.section.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentId)
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function removeStudentsFromClass(classId: string, enrollmentIds: string[]) {
  if (!enrollmentIds.length) return;
  const { error } = await connected().from('enrollments').delete().eq('class_record_id', classId).in('id', enrollmentIds);
  if (error) throw error;
}

export type RosterCsvValue = Omit<StudentInput, 'classId' | 'programId'>;

export function normalizeRosterRows(rows: Record<string, string>[]) {
  const aliases: Record<string, string[]> = {
    institutional_id: ['institutional_id', 'student_id', 'student_number', 'student_no', 'student number', 'id'],
    first_name: ['first_name', 'firstname', 'given_name', 'given name'],
    last_name: ['last_name', 'lastname', 'surname', 'family_name', 'family name'],
    full_name: ['full_name', 'fullname', 'full name', 'student_name', 'student name', 'name'],
    email: ['email', 'email_address', 'email address', 'institutional_email'],
    year_level: ['year_level', 'year level', 'year', 'grade', 'level'],
    section: ['section', 'class_section', 'class section', 'section_name'],
  };
  return rows.map((row) => {
    const entries = Object.entries(row).map(([key, value]) => [key.trim().toLowerCase().replaceAll(/\s+/g, ' '), value] as const);
    const values = Object.fromEntries(entries);
    const get = (field: string) => aliases[field].map((alias) => values[alias]).find((value) => value?.trim())?.trim() ?? '';
    const fullName = get('full_name');
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    return {
      ...row,
      institutional_id: get('institutional_id'),
      first_name: get('first_name') || nameParts.shift() || '',
      last_name: get('last_name') || nameParts.join(' '),
      email: get('email'),
      year_level: get('year_level'),
      section: get('section'),
    };
  });
}

function validateRosterRows(rows: Record<string, string>[]) {
  return validateCsvRows(normalizeRosterRows(rows), (row) => {
    const institutionalId = row.institutional_id?.trim();
    const firstName = row.first_name?.trim();
    const lastName = row.last_name?.trim();
    const email = row.email?.trim().toLowerCase();
    const section = row.section?.trim();
    const yearLevel = Number(row.year_level);
    const errors: string[] = [];
    if (!institutionalId) errors.push('institutional_id is required; APMS cannot invent an official student number');
    if (!firstName) errors.push('first_name is required');
    if (!lastName) errors.push('last_name is required');
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push('valid email is required');
    if (!Number.isInteger(yearLevel) || yearLevel < 1 || yearLevel > 8) errors.push('year_level must be 1–8');
    if (!section) errors.push('section is required');
    return {
      errors,
      duplicateKey: institutionalId?.toLowerCase(),
      value: errors.length ? undefined : { institutionalId, firstName, lastName, email, yearLevel, section } as RosterCsvValue,
    };
  });
}

export function previewRosterCsv(csvText: string) {
  return validateRosterRows(parseCsv(csvText));
}

export function previewRosterExcel(fileData: ArrayBuffer) {
  const workbook = XLSX.read(fileData, { type: 'array', cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ''];
  if (!sheet) throw new Error('Excel workbook must contain at least one worksheet.');
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' }).map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), String(value ?? '').trim()])),
  );
  if (!rows.length) throw new Error('The first Excel worksheet does not contain any student rows.');
  return validateRosterRows(rows);
}

async function importRosterPreview(classId: string, programId: string, fileName: string, preview: ReturnType<typeof previewRosterCsv>, fileType: 'csv' | 'xlsx') {
  const client = connected();
  const valid = preview.filter((row) => row.value && row.errors.length === 0 && !row.duplicate);
  const { data: job, error: jobError } = await client.from('import_jobs').insert({
    type: fileType, scope_type: 'class_record', scope_id: classId, status: 'running',
    total_count: preview.length, success_count: 0, failure_count: preview.length - valid.length,
    initiated_by: (await client.auth.getUser()).data.user?.id,
    file_name: fileName, import_kind: 'roster',
    column_mapping: { institutional_id: 'institutional_id', first_name: 'first_name', last_name: 'last_name', email: 'email', year_level: 'year_level', section: 'section' },
  }).select('id').single();
  if (jobError) throw jobError;
  let success = 0;
  for (const row of valid) {
    try {
      await addStudentToClass({ classId, programId, ...row.value! });
      success += 1;
    } catch (cause) {
      row.errors.push(cause instanceof Error ? cause.message : 'Import failed');
    }
  }
  const failures = preview.length - success;
  const detailRows = preview.map((row) => ({
    import_job_id: job.id, row_number: row.rowNumber, raw_data: row.raw,
    normalized_data: row.value ?? null, status: row.errors.length ? 'invalid' : 'imported', errors: row.errors,
  }));
  if (detailRows.length) await client.from('import_job_rows').insert(detailRows);
  await client.from('import_jobs').update({
    status: failures ? (success ? 'completed' : 'failed') : 'completed', success_count: success,
    failure_count: failures, completed_at: new Date().toISOString(), summary: { imported: success, rejected: failures },
  }).eq('id', job.id);
  return { preview, success, failures };
}

export async function importRosterCsv(classId: string, programId: string, fileName: string, csvText: string) {
  return importRosterPreview(classId, programId, fileName, previewRosterCsv(csvText), 'csv');
}

export async function importRosterExcel(classId: string, programId: string, fileName: string, fileData: ArrayBuffer) {
  return importRosterPreview(classId, programId, fileName, previewRosterExcel(fileData), 'xlsx');
}

export async function loadClassWorkspace(classId: string): Promise<ClassWorkspace> {
  const client = connected();
  const [enrollments, assessments, criteriaSets, sessions] = await Promise.all([
    client.from('enrollments').select('id,student_id,students(program_id,institutional_id,email,first_name,last_name,year_level,section,programs(id,code))').eq('class_record_id', classId).eq('status', 'active').order('created_at'),
    client.from('assessments').select('id,title,type,component_key,module_number,maximum_score,assessment_date,grading_period,source').eq('class_record_id', classId).neq('status', 'archived').order('assessment_date'),
    client.from('criteria_sets').select('id,name,version,passing_threshold,criteria_nodes(id,label,weight)').eq('class_record_id', classId).eq('status', 'active').order('version', { ascending: false }).limit(1),
    client.from('attendance_sessions').select('id,session_date,label').eq('class_record_id', classId).order('session_date', { ascending: false }),
  ]);
  const firstError = enrollments.error ?? assessments.error ?? criteriaSets.error ?? sessions.error;
  if (firstError) throw firstError;
  const students: RosterStudent[] = (enrollments.data ?? []).map((row: any) => ({
    enrollmentId: row.id, studentId: row.student_id, institutionalId: row.students?.institutional_id,
    programId: row.students?.program_id,
    name: `${row.students?.first_name ?? ''} ${row.students?.last_name ?? ''}`.trim(), email: row.students?.email ?? '',
    program: row.students?.programs?.code ?? '—', yearLevel: Number(row.students?.year_level ?? 0), section: row.students?.section ?? '',
  }));
  const assessmentRows: FacultyAssessment[] = (assessments.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    type: row.type,
    component: isSwunextComponent(row.component_key) ? row.component_key : componentFromLegacyType(row.type),
    moduleNumber: row.module_number == null ? null : Number(row.module_number),
    maximumScore: Number(row.maximum_score),
    assessmentDate: row.assessment_date,
    gradingPeriod: row.grading_period, source: row.source,
  }));
  const enrollmentIds = students.map((row) => row.enrollmentId);
  const assessmentIds = assessmentRows.map((row) => row.id);
  const sessionIds = (sessions.data ?? []).map((row) => row.id);
  const [results, attendance, evaluations, predictions, feedback] = await Promise.all([
    assessmentIds.length ? client.from('assessment_results').select('assessment_id,enrollment_id,score').in('assessment_id', assessmentIds).in('enrollment_id', enrollmentIds) : Promise.resolve({ data: [], error: null }),
    sessionIds.length ? client.from('attendance_records').select('attendance_session_id,enrollment_id,status').in('attendance_session_id', sessionIds).in('enrollment_id', enrollmentIds) : Promise.resolve({ data: [], error: null }),
    enrollmentIds.length ? client.from('performance_evaluations').select('enrollment_id,score,risk_level,explanation').in('enrollment_id', enrollmentIds) : Promise.resolve({ data: [], error: null }),
    enrollmentIds.length ? client.from('performance_predictions').select('enrollment_id,predicted_score,risk_level,trend,explanation,created_at').in('enrollment_id', enrollmentIds).order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
    enrollmentIds.length ? client.from('feedback_records').select('id,enrollment_id,body,category,status,created_at').in('enrollment_id', enrollmentIds).order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
  ]);
  const secondaryError = results.error ?? attendance.error ?? evaluations.error ?? predictions.error ?? feedback.error;
  if (secondaryError) throw secondaryError;
  const scoreMap: Record<string, number> = {};
  for (const row of results.data ?? []) scoreMap[`${row.enrollment_id}:${row.assessment_id}`] = Number(row.score);
  const attendanceMap: ClassWorkspace['attendance'] = {};
  for (const row of attendance.data ?? []) attendanceMap[`${row.attendance_session_id}:${row.enrollment_id}`] = row.status as ClassWorkspace['attendance'][string];
  const evaluationMap: Record<string, EvaluationRow> = {};
  for (const row of evaluations.data ?? []) evaluationMap[row.enrollment_id] = {
    enrollmentId: row.enrollment_id, currentStanding: Number(row.score), riskLevel: row.risk_level,
    predictedStanding: null, trend: 'unknown', factors: Array.isArray((row.explanation as any)?.factors) ? (row.explanation as any).factors : [],
  };
  for (const row of predictions.data ?? []) {
    const current = evaluationMap[row.enrollment_id] ?? { enrollmentId: row.enrollment_id, currentStanding: null, riskLevel: 'unknown', predictedStanding: null, trend: 'unknown', factors: [] };
    if (current.predictedStanding == null) {
      current.predictedStanding = Number(row.predicted_score); current.riskLevel = row.risk_level; current.trend = row.trend;
      current.factors = Array.isArray((row.explanation as any)?.factors) ? (row.explanation as any).factors : current.factors;
      evaluationMap[row.enrollment_id] = current;
    }
  }
  const feedbackMap: Record<string, FeedbackRecord[]> = {};
  for (const row of feedback.data ?? []) {
    const items = feedbackMap[row.enrollment_id] ?? [];
    items.push({
      id: row.id,
      enrollmentId: row.enrollment_id,
      body: row.body,
      category: row.category,
      status: row.status as FeedbackRecord['status'],
      createdAt: row.created_at,
    });
    feedbackMap[row.enrollment_id] = items;
  }
  const criteriaRow: any = criteriaSets.data?.[0];
  return {
    students, assessments: assessmentRows, scores: scoreMap, attendance: attendanceMap, evaluations: evaluationMap,
    attendanceSessions: (sessions.data ?? []).map((row) => ({ id: row.id, date: row.session_date, label: row.label })),
    criteria: criteriaRow ? { id: criteriaRow.id, name: criteriaRow.name, version: criteriaRow.version, passingThreshold: Number(criteriaRow.passing_threshold), nodes: (criteriaRow.criteria_nodes ?? []).map((node: any) => ({ id: node.id, label: node.label, weight: Number(node.weight) })) } : null,
    feedback: feedbackMap,
  };
}

export type AssessmentInput = {
  title: string;
  type: string;
  component: SwunextAssessmentComponent;
  moduleNumber: number | null;
  maximumScore: number;
  date: string;
  gradingPeriod: string;
  source: 'manual' | 'csv';
};

export async function createAssessment(classId: string, userId: string, input: AssessmentInput) {
  const { error } = await connected().from('assessments').insert({ class_record_id: classId, title: input.title.trim(), type: input.type.trim(), component_key: input.component, module_number: input.moduleNumber, maximum_score: input.maximumScore, due_at: `${input.date}T17:00:00+08:00`, status: 'published', created_by: userId, source: input.source, assessment_date: input.date, grading_period: input.gradingPeriod.trim() });
  if (error) throw error;
}

export async function updateAssessment(assessmentId: string, input: AssessmentInput) {
  const { error } = await connected().from('assessments').update({
    title: input.title.trim(),
    type: input.type.trim(),
    component_key: input.component,
    module_number: input.moduleNumber,
    maximum_score: input.maximumScore,
    due_at: `${input.date}T17:00:00+08:00`,
    source: input.source,
    assessment_date: input.date,
    grading_period: input.gradingPeriod.trim(),
    updated_at: new Date().toISOString(),
  }).eq('id', assessmentId);
  if (error) throw error;
}

export async function saveScores(userId: string, assessmentId: string, scores: { enrollmentId: string; score: number }[]) {
  const { error } = await connected().from('assessment_results').upsert(scores.map((row) => ({ assessment_id: assessmentId, enrollment_id: row.enrollmentId, score: row.score, source: 'manual', approval_status: 'approved', recorded_by: userId })), { onConflict: 'assessment_id,enrollment_id' });
  if (error) throw error;
}

export async function createAttendanceSession(classId: string, userId: string, date: string, label: string) {
  const { data, error } = await connected().from('attendance_sessions').insert({ class_record_id: classId, session_date: date, label: label.trim() || 'Class session', created_by: userId }).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function saveAttendance(userId: string, sessionId: string, rows: { enrollmentId: string; status: 'present' | 'absent' | 'late' | 'excused' }[]) {
  const { error } = await connected().from('attendance_records').upsert(rows.map((row) => ({ attendance_session_id: sessionId, enrollment_id: row.enrollmentId, status: row.status, recorded_by: userId })), { onConflict: 'attendance_session_id,enrollment_id' });
  if (error) throw error;
}

export async function saveCriteria(classId: string, userId: string, name: string, passingThreshold: number, nodes: { label: string; weight: number }[]) {
  const total = nodes.reduce((sum, node) => sum + node.weight, 0);
  if (total !== 100) throw new Error('Criteria weights must total exactly 100%.');
  if (!userId) throw new Error('An authenticated user is required.');
  const { error } = await connected().rpc('save_criteria_version', {
    p_class_id: classId,
    p_name: name.trim(),
    p_passing_threshold: passingThreshold,
    p_nodes: nodes,
  });
  if (error) throw error;
}

function componentFromLegacyType(type: string): SwunextAssessmentComponent {
  const normalized = type.trim().toLowerCase().replaceAll(/[\s-]+/g, '_');
  if (isSwunextComponent(normalized)) return normalized;
  if (normalized.includes('attendance') || normalized.includes('start')) return 'start_of_class';
  if (normalized.includes('practice') || normalized.includes('activity')) return 'lets_practice';
  if (normalized.includes('reflection')) return 'reflection';
  if (normalized.includes('quiz')) return 'wrap_up_quiz';
  if (normalized.includes('check')) return 'project_checkin';
  if (normalized.includes('project') || normalized.includes('performance')) return 'final_project';
  return 'other';
}

export function summarizeEnrollmentStanding(workspace: ClassWorkspace, enrollmentId: string): SwunextGradeBreakdown {
  return summarizeSwunextGrade(workspace.assessments.map((assessment) => ({
    component: assessment.component,
    moduleNumber: assessment.moduleNumber,
    maximumScore: assessment.maximumScore,
    score: workspace.scores[`${enrollmentId}:${assessment.id}`] ?? null,
  })));
}

export type PredictionInput = {
  enrollmentId: string;
  currentStanding: number;
  recentScores: number[];
  attendanceRate: number;
  missingAssessmentCount: number;
};

export type PredictionResult = {
  enrollmentId: string;
  predictedStanding: number;
  riskProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  trend: 'improving' | 'stable' | 'declining';
  factors: string[];
  modelVersion: string;
  dataBasis: string;
};

function aiServiceUrl() {
  return process.env.EXPO_PUBLIC_APMS_AI_SERVICE_URL ?? process.env.APMS_AI_SERVICE_URL ?? '';
}

export async function runAiPredictions(classId: string, inputs: PredictionInput[]) {
  const endpoint = aiServiceUrl();
  if (!inputs.length) throw new Error('At least one student needs scores before prediction can run.');
  const predictions: PredictionResult[] = [];
  if (endpoint) {
    for (const input of inputs) {
      const response = await fetch(`${endpoint.replace(/\/$/, '')}/v1/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_id: input.enrollmentId,
          current_standing: input.currentStanding,
          recent_scores: input.recentScores,
          attendance_rate: input.attendanceRate,
          missing_assessment_count: input.missingAssessmentCount,
        }),
      });
      if (!response.ok) throw new Error(`AI prediction failed (${response.status}). Student records remain available.`);
      const payload = await response.json();
      predictions.push({
        enrollmentId: payload.enrollment_id,
        predictedStanding: Number(payload.predicted_standing),
        riskProbability: Number(payload.risk_probability),
        riskLevel: payload.risk_level,
        trend: payload.trend,
        factors: Array.isArray(payload.factors) ? payload.factors : [],
        modelVersion: payload.model_version,
        dataBasis: payload.data_basis,
      });
    }
  } else {
    const { data, error } = await connected().functions.invoke('apms-predictions', {
      body: {
        class_id: classId,
        inputs: inputs.map((input) => ({
          enrollment_id: input.enrollmentId,
          current_standing: input.currentStanding,
          recent_scores: input.recentScores,
          attendance_rate: input.attendanceRate,
          missing_assessment_count: input.missingAssessmentCount,
        })),
      },
    });
    if (error) {
      let detail = '';
      const functionError = error as typeof error & { context?: Response };
      if (functionError.context) {
        try {
          const body = await functionError.context.clone().json() as { error?: string; message?: string };
          detail = body.error ?? body.message ?? '';
        } catch { /* Use the SDK error when the response is not JSON. */ }
      }
      throw new Error(detail || error.message || 'AI prediction could not run. Student records remain available.');
    }
    const payload = data as { predictions?: any[]; model_version?: string; data_basis?: string };
    for (const result of payload.predictions ?? []) {
      predictions.push({
        enrollmentId: result.enrollment_id,
        predictedStanding: Number(result.predicted_standing),
        riskProbability: Number(result.risk_probability),
        riskLevel: result.risk_level,
        trend: result.trend,
        factors: Array.isArray(result.factors) ? result.factors : [],
        modelVersion: payload.model_version ?? 'unversioned',
        dataBasis: payload.data_basis ?? 'gemini_llm_heuristic',
      });
    }
  }
  const { data, error } = await connected().rpc('faculty_save_prediction_run', {
    p_class_record_id: classId,
    p_model_name: 'APMS AI Service',
    p_model_version: predictions[0]?.modelVersion ?? 'unversioned',
    p_input_snapshot: { inputs, advisory_only: true },
    p_predictions: predictions.map((prediction) => ({
      enrollment_id: prediction.enrollmentId,
      predicted_score: prediction.predictedStanding,
      trend: prediction.trend,
      risk_level: prediction.riskLevel,
      confidence: prediction.riskProbability,
      factors: prediction.factors,
      data_basis: prediction.dataBasis,
    })),
  });
  if (error) throw error;
  return { runId: data as string, predictions };
}

export async function saveFeedbackDraft(enrollmentId: string, body: string, category: string, status: 'draft' | 'ready') {
  const { data, error } = await connected().rpc('faculty_save_feedback_draft', {
    p_enrollment_id: enrollmentId,
    p_body: body,
    p_category: category,
    p_status: status,
  });
  if (error) throw error;
  return data as string;
}

export function exportClassCsv(workspace: ClassWorkspace) {
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const header = ['Student ID', 'Student', 'P1 Running', 'P2 Running', 'P3 Effortful Learning', 'Mastery', 'Final Grade', 'Grade Point', 'Remarks', ...workspace.assessments.map((assessment) => `${assessment.title} (${assessment.maximumScore})`)];
  const rows = workspace.students.map((student) => {
    const summary = summarizeEnrollmentStanding(workspace, student.enrollmentId);
    return [
      student.institutionalId,
      student.name,
      summary.p1 == null ? '' : summary.p1,
      summary.p2 == null ? '' : summary.p2,
      summary.p3 == null ? '' : summary.p3,
      summary.mastery == null ? '' : summary.mastery,
      summary.finalGrade == null ? '' : summary.finalGrade,
      summary.gradePoint == null ? '' : summary.gradePoint.toFixed(2),
      summary.remarks,
      ...workspace.assessments.map((assessment) => workspace.scores[`${student.enrollmentId}:${assessment.id}`] ?? ''),
    ];
  });
  return [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
}

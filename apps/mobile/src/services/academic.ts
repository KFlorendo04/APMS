import { loadClassWorkspace, summarizeEnrollmentStanding, type ClassWorkspace, type FacultyClass } from './faculty';
import { supabase } from './supabase';

export type AcademicClass = FacultyClass & { workspace: ClassWorkspace };
export type AcademicWorkspace = {
  department: { id: string; code: string; name: string } | null;
  programs: { id: string; code: string; name: string }[];
  classes: AcademicClass[];
};

export type AcademicSubject = {
  id: string;
  departmentId: string;
  code: string;
  title: string;
  units: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
};

export type AcademicSubjectRequest = {
  id: string;
  departmentId: string;
  requestedBy: string;
  requesterName: string;
  code: string;
  title: string;
  units: number;
  rationale: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

function client() {
  if (!supabase) throw new Error('APMS is not connected to Supabase.');
  return supabase;
}

export async function loadAcademicWorkspace(userId: string): Promise<AcademicWorkspace> {
  // Find the academic_admin's department scope from user_roles.
  const { data: assignment, error: assignmentError } = await client()
    .from('user_roles')
    .select('scope_id,scope_type,roles!inner(key)')
    .eq('user_id', userId)
    .eq('roles.key', 'academic_admin')
    .single();

  if (assignmentError) throw assignmentError;
  if (assignment.scope_type !== 'department' || !assignment.scope_id) {
    throw new Error('Academic Admin requires an authorized department scope.');
  }
  const departmentId: string = assignment.scope_id;

  const [departmentResult, programResult] = await Promise.all([
    client().from('departments').select('id,code,name').eq('id', departmentId).single(),
    client().from('programs').select('id,code,name').eq('department_id', departmentId).eq('status', 'active').order('code'),
  ]);
  if (departmentResult.error) throw departmentResult.error;
  if (programResult.error) throw programResult.error;

  // Load classes using department scope directly — NOT via loadFacultyClasses which is
  // filtered by faculty_assignments and would return zero classes for an Academic Admin
  // who is not also a Faculty member.
  const { data: classRows, error: classError } = await client()
    .from('class_records')
    .select('id,subject_id,section,subjects(code,title),academic_terms(academic_year,semester),enrollments(count)')
    .eq('department_id', departmentId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (classError) throw classError;

  const classSummaries: FacultyClass[] = (classRows ?? []).map((row: any) => ({
    id: row.id,
    subjectId: row.subject_id,
    code: row.subjects?.code ?? '—',
    title: row.subjects?.title ?? 'Untitled subject',
    section: row.section,
    term: `${row.academic_terms?.academic_year ?? ''} ${row.academic_terms?.semester ?? ''}`.trim(),
    studentCount: Number(row.enrollments?.[0]?.count ?? 0),
  }));

  const classes = await Promise.all(
    classSummaries.map(async (item) => ({ ...item, workspace: await loadClassWorkspace(item.id) }))
  );

  return { department: departmentResult.data, programs: programResult.data ?? [], classes };
}

// ─── Subject management ───────────────────────────────────────────────────────

export async function loadDepartmentSubjects(): Promise<AcademicSubject[]> {
  // RLS restricts results to the Academic Admin's authorized department.
  const { data, error } = await client()
    .from('subjects')
    .select('id,department_id,code,title,units,status,created_at,updated_at')
    .order('code');
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    departmentId: row.department_id,
    code: row.code,
    title: row.title,
    units: Number(row.units),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function manageSubject(input: {
  subjectId?: string;
  departmentId: string;
  code: string;
  title: string;
  units: number;
  status: 'active' | 'inactive';
}): Promise<string> {
  const { data, error } = await client().rpc('academic_admin_manage_subject', {
    p_subject_id: input.subjectId ?? null,
    p_department_id: input.departmentId,
    p_code: input.code.trim(),
    p_title: input.title.trim(),
    p_units: input.units,
    p_status: input.status,
  });
  if (error) {
    if (error.code === '23505') {
      throw new Error(`A subject with code "${input.code}" already exists in this department.`);
    }
    throw error;
  }
  return data as string;
}

export async function loadSubjectRequests(): Promise<AcademicSubjectRequest[]> {
  const { data, error } = await client()
    .from('subject_requests')
    .select('id,department_id,requested_by,code,title,units,rationale,status,review_note,reviewed_at,created_at,profiles!subject_requests_requested_by_fkey(first_name,last_name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    departmentId: row.department_id,
    requestedBy: row.requested_by,
    requesterName: row.profiles
      ? `${row.profiles.first_name} ${row.profiles.last_name}`.trim()
      : 'Unknown',
    code: row.code,
    title: row.title,
    units: Number(row.units),
    rationale: row.rationale,
    status: row.status,
    reviewNote: row.review_note ?? null,
    reviewedAt: row.reviewed_at ?? null,
    createdAt: row.created_at,
  }));
}

export async function reviewSubjectRequest(
  requestId: string,
  decision: 'approved' | 'rejected',
  reviewNote: string,
): Promise<void> {
  const { error } = await client().rpc('academic_admin_review_subject_request', {
    p_request_id: requestId,
    p_decision: decision,
    p_review_note: reviewNote.trim(),
  });
  if (error) throw error;
}

// ─── CSV report export ────────────────────────────────────────────────────────

export function academicReportCsv(workspace: AcademicWorkspace) {
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const rows: unknown[][] = [['Subject', 'Section', 'Students', 'At Risk', 'Average Current Standing', 'Average Mastery', 'Passing Rule Met']];
  for (const item of workspace.classes) {
    const summaries = item.workspace.students.map((student) => summarizeEnrollmentStanding(item.workspace, student.enrollmentId));
    const standings = summaries.flatMap((summary) => summary.finalGrade ?? summary.p3 ?? summary.effortfulLearning ?? summary.mastery ?? []);
    const mastery = summaries.flatMap((summary) => summary.mastery ?? []);
    const atRisk = item.workspace.students.filter((student) => {
      const evaluation = item.workspace.evaluations[student.enrollmentId];
      return evaluation?.riskLevel === 'high' || evaluation?.riskLevel === 'medium';
    }).length;
    rows.push([
      item.code,
      item.section,
      item.workspace.students.length,
      atRisk,
      standings.length ? (standings.reduce((sum, value) => sum + value, 0) / standings.length).toFixed(2) : '',
      mastery.length ? (mastery.reduce((sum, value) => sum + value, 0) / mastery.length).toFixed(2) : '',
      summaries.filter((summary) => summary.remarks === 'passing').length,
    ]);
  }
  return rows.map((row) => row.map(escape).join(',')).join('\n');
}

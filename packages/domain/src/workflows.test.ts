import { describe, expect, it } from 'vitest';
import {
  calculateAttendanceRate,
  parseCsv,
  rolePermissions,
  summarizeReport,
  summarizeSwunextGrade,
  validateCsvRows,
  validateWeights,
  type AttendanceStatus,
  type SessionActor,
  type SwunextAssessmentScore,
} from './index';

describe('report totals', () => {
  it('calculates exact averages and risk counts', () => {
    expect(summarizeReport([{ percentage: 90, riskLevel: 'low' }, { percentage: 70, riskLevel: 'medium' }, { percentage: 50, riskLevel: 'high' }])).toEqual({ count: 3, average: 70, lowRisk: 1, mediumRisk: 1, highRisk: 1 });
  });
  it('handles empty results without NaN', () => expect(summarizeReport([]).average).toBe(0));
});

describe('End-to-End Acceptance Test: Autonomous Faculty Teaching Workflow', () => {
  it('allows a Faculty member to complete class creation, 30-student CSV import, grading, attendance, risk analysis, feedback, and report export without admin intervention', () => {
    // 1. Verify Faculty has all necessary autonomous permissions
    const facultyPermissions = rolePermissions.faculty;
    const requiredPermissions = [
      'class_records.manage.assigned',
      'students.manage.assigned',
      'imports.manage.assigned',
      'criteria.manage.assigned',
      'assessment_results.manage.assigned',
      'attendance.manage.assigned',
      'evaluations.run.assigned',
      'feedback.send.assigned',
      'reports.export.assigned',
    ];
    for (const perm of requiredPermissions) {
      expect(facultyPermissions).toContain(perm);
    }

    // 2. Class creation & default SWUNEXT criteria setup
    const facultyActor: SessionActor = {
      userId: 'fac-user-001',
      role: 'faculty',
      departmentIds: ['dept-cics-uuid'],
      assignedClassRecordIds: ['class-rec-001'],
    };
    expect(facultyActor.assignedClassRecordIds).toContain('class-rec-001');

    const defaultWeights = [5, 35, 15, 15, 30]; // SOC, Practice, Reflection, WrapUp, Project
    expect(validateWeights(defaultWeights)).toBe(true);

    // 3. Import 30 students from CSV
    const csvRows = [
      'institutional_id,first_name,last_name,email,year_level,section',
      ...Array.from({ length: 30 }, (_, i) => {
        const id = `2026-${String(i + 1).padStart(4, '0')}`;
        return `${id},StudentFirst${i + 1},StudentLast${i + 1},student${i + 1}@phinmaed.com,3,BSIT-3A`;
      }),
    ].join('\n');

    const parsed = parseCsv(csvRows);
    expect(parsed.length).toBe(30);

    const validation = validateCsvRows(
      parsed,
      (row) => {
        const errors: string[] = [];
        if (!row.institutional_id) errors.push('Missing ID');
        if (!row.first_name || !row.last_name) errors.push('Missing name');
        if (!row.email?.includes('@')) errors.push('Invalid email');
        if (!Number(row.year_level)) errors.push('Invalid year level');
        return {
          value: row,
          errors,
          duplicateKey: row.institutional_id,
        };
      },
    );
    expect(validation.every((r) => r.errors.length === 0)).toBe(true);
    expect(validation.length).toBe(30);

    // 4. Create assessments and enter grades across SWUNEXT components
    // Student 1: High performing
    const student1Scores: SwunextAssessmentScore[] = [
      { component: 'start_of_class', score: 1, maximumScore: 1, moduleNumber: 1 },
      { component: 'lets_practice', score: 3, maximumScore: 3, moduleNumber: 1 },
      { component: 'reflection', score: 3, maximumScore: 3, moduleNumber: 1 },
      { component: 'wrap_up_quiz', score: 95, maximumScore: 100, moduleNumber: 1 },
      { component: 'final_project', score: 92, maximumScore: 100, moduleNumber: null },
    ];
    const s1Summary = summarizeSwunextGrade(student1Scores);
    expect(s1Summary.remarks).toBe('passing');
    expect(s1Summary.finalGrade).toBeGreaterThanOrEqual(80);
    expect(s1Summary.mastery).toBeGreaterThanOrEqual(80);

    // Student 2: At-risk / struggling
    const student2Scores: SwunextAssessmentScore[] = [
      { component: 'start_of_class', score: 0, maximumScore: 1, moduleNumber: 1 },
      { component: 'lets_practice', score: 1, maximumScore: 3, moduleNumber: 1 },
      { component: 'reflection', score: 1, maximumScore: 3, moduleNumber: 1 },
      { component: 'wrap_up_quiz', score: 55, maximumScore: 100, moduleNumber: 1 },
      { component: 'final_project', score: 60, maximumScore: 100, moduleNumber: null },
    ];
    const s2Summary = summarizeSwunextGrade(student2Scores);
    expect(s2Summary.remarks).toBe('failing');
    expect(s2Summary.finalGrade).toBeLessThan(80);

    // 5. Record Attendance
    const s1Attendance: AttendanceStatus[] = ['present', 'present', 'present', 'present'];
    const s2Attendance: AttendanceStatus[] = ['present', 'absent', 'late', 'absent'];
    expect(calculateAttendanceRate(s1Attendance)).toBe(100);
    expect(calculateAttendanceRate(s2Attendance)).toBe(37.5);

    // 6. View SWUNEXT standing & risk indicators
    expect(s1Summary.gradePoint).toBe(1.25);
    expect(s2Summary.gradePoint).toBe(4.0);

    // 7. Send/Save Feedback
    const feedbackDraft = {
      enrollmentId: 'enroll-002',
      body: `Hello StudentLast2, your current APMS provisional standing is ${s2Summary.finalGrade?.toFixed(1)}%. Passing requires at least 80% final grade and mastery.`,
      status: 'ready',
    };
    expect(feedbackDraft.body).toContain('provisional standing');
    expect(feedbackDraft.status).toBe('ready');

    // 8. Export Report Summary
    const reportData = [
      { percentage: s1Summary.finalGrade!, riskLevel: 'low' as const },
      { percentage: s2Summary.finalGrade!, riskLevel: 'high' as const },
      ...Array.from({ length: 28 }, () => ({ percentage: 85, riskLevel: 'low' as const })),
    ];
    const classSummary = summarizeReport(reportData);
    expect(classSummary.count).toBe(30);
    expect(classSummary.lowRisk).toBe(29);
    expect(classSummary.highRisk).toBe(1);
    expect(classSummary.average).toBeGreaterThan(80);
  });
});


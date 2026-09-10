export const roleKeys = ['system_admin', 'academic_admin', 'faculty'] as const;

export type RoleKey = (typeof roleKeys)[number];
export type Role = RoleKey;

export type RiskLevel = 'low' | 'medium' | 'high';
export type Trend = 'improving' | 'stable' | 'declining';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type MissingScorePolicy = 'exclude' | 'zero';
export type SwunextAssessmentComponent =
  | 'start_of_class'
  | 'lets_practice'
  | 'reflection'
  | 'wrap_up_quiz'
  | 'project_checkin'
  | 'final_project'
  | 'other';

export interface SessionActor {
  userId: string;
  role: RoleKey;
  departmentIds: string[];
  assignedClassRecordIds: string[];
}

export interface AssessmentScore {
  score: number | null;
  maximumScore: number;
  weight: number;
  approved: boolean;
}

export interface SwunextAssessmentScore {
  component: SwunextAssessmentComponent;
  score: number | null;
  maximumScore: number;
  moduleNumber?: number | null;
}

export interface SwunextGradeBreakdown {
  startOfClass: number | null;
  letsPractice: number | null;
  reflection: number | null;
  effortfulLearning: number | null;
  wrapUpQuiz: number | null;
  projectCheckins: number | null;
  finalProject: number | null;
  mastery: number | null;
  p1: number | null;
  p2: number | null;
  p3: number | null;
  finalGrade: number | null;
  gradePoint: number | null;
  remarks: 'passing' | 'failing' | 'incomplete';
  passingRequirementsMet: boolean;
}

export interface PerformanceSummary {
  percentage: number;
  classification: 'excellent' | 'passing' | 'at_risk';
  riskLevel: RiskLevel;
}

export interface PredictionInput {
  enrollmentId: string;
  currentStanding: number;
  recentScores: number[];
  attendanceRate: number;
  missingAssessmentCount: number;
}

export interface PredictionResult {
  enrollmentId: string;
  predictedStanding: number;
  riskLevel: RiskLevel;
  trend: Trend;
  probability?: number;
  factors: string[];
  modelVersion: string;
  generatedAt: string;
  advisoryOnly: true;
}

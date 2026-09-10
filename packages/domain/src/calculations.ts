import type {
  AssessmentScore,
  AttendanceStatus,
  MissingScorePolicy,
  PerformanceSummary,
  SwunextAssessmentComponent,
  SwunextAssessmentScore,
  SwunextGradeBreakdown,
  Trend,
} from './types';

export function validateWeights(weights: readonly number[]): boolean {
  return weights.length > 0
    && weights.every((weight) => Number.isFinite(weight) && weight >= 0 && weight <= 100)
    && Math.abs(weights.reduce((total, weight) => total + weight, 0) - 100) < 0.0001;
}

export function calculateWeightedPercentage(
  scores: readonly AssessmentScore[],
  missingPolicy: MissingScorePolicy = 'exclude',
): number {
  const approved = scores.filter((score) => score.approved);
  if (!approved.length) return 0;
  if (!validateWeights(approved.map((score) => score.weight))) {
    throw new Error('Approved assessment weights must total 100%.');
  }
  const included = missingPolicy === 'zero' ? approved : approved.filter((item) => item.score !== null);
  if (!included.length) return 0;
  const includedWeight = included.reduce((total, item) => total + item.weight, 0);
  const percentage = included.reduce((total, item) => {
    const score = item.score ?? 0;
    if (item.maximumScore <= 0 || score < 0 || score > item.maximumScore) {
      throw new Error('Assessment score is outside its allowed range.');
    }
    const normalizedWeight = missingPolicy === 'exclude' ? (item.weight / includedWeight) * 100 : item.weight;
    return total + (score / item.maximumScore) * normalizedWeight;
  }, 0);
  return Number(percentage.toFixed(2));
}

export function summarizePerformance(percentage: number): PerformanceSummary {
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new Error('Performance percentage must be between 0 and 100.');
  }
  if (percentage >= 90) return { percentage, classification: 'excellent', riskLevel: 'low' };
  if (percentage >= 75) return { percentage, classification: 'passing', riskLevel: 'low' };
  if (percentage >= 60) return { percentage, classification: 'at_risk', riskLevel: 'medium' };
  return { percentage, classification: 'at_risk', riskLevel: 'high' };
}

export function calculateAttendanceRate(statuses: readonly AttendanceStatus[]): number {
  if (!statuses.length) return 0;
  const earned = statuses.reduce((total, status) => {
    if (status === 'present' || status === 'excused') return total + 1;
    if (status === 'late') return total + 0.5;
    return total;
  }, 0);
  return Number(((earned / statuses.length) * 100).toFixed(2));
}

export function calculateTrend(values: readonly number[], tolerance = 2): Trend {
  if (values.length < 2) return 'stable';
  if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
    throw new Error('Trend values must be percentages between 0 and 100.');
  }
  const midpoint = Math.ceil(values.length / 2);
  const average = (items: readonly number[]) => items.reduce((sum, value) => sum + value, 0) / items.length;
  const change = average(values.slice(midpoint)) - average(values.slice(0, midpoint));
  if (change > tolerance) return 'improving';
  if (change < -tolerance) return 'declining';
  return 'stable';
}

const effortComponents = ['start_of_class', 'lets_practice', 'reflection'] as const;
const masteryComponents = ['wrap_up_quiz', 'project_checkin', 'final_project'] as const;

export const swunextAssessmentComponents: readonly {
  key: SwunextAssessmentComponent;
  label: string;
  defaultMaximumScore: number;
}[] = [
  { key: 'start_of_class', label: 'Start of Class', defaultMaximumScore: 1 },
  { key: 'lets_practice', label: "Let's Practice", defaultMaximumScore: 3 },
  { key: 'reflection', label: 'Reflection', defaultMaximumScore: 3 },
  { key: 'wrap_up_quiz', label: 'Wrap-Up Quiz', defaultMaximumScore: 100 },
  { key: 'project_checkin', label: 'Project Check-In', defaultMaximumScore: 100 },
  { key: 'final_project', label: 'Final Project / Output', defaultMaximumScore: 100 },
  { key: 'other', label: 'Other monitoring item', defaultMaximumScore: 100 },
];

export function transmuteSwunextScore(
  component: SwunextAssessmentComponent,
  score: number,
  maximumScore: number,
): number {
  if (!Number.isFinite(score) || !Number.isFinite(maximumScore) || maximumScore <= 0 || score < 0 || score > maximumScore) {
    throw new Error('Assessment score is outside its allowed range.');
  }
  if (component === 'start_of_class') return score > 0 ? 100 : 0;
  if (component === 'lets_practice' || component === 'reflection') {
    const rubric = Math.round(score);
    if (maximumScore !== 3 || rubric !== score || rubric < 0 || rubric > 3) {
      throw new Error("Let's Practice and Reflection use the 0-3 SWUNEXT rubric.");
    }
    return [0, 60, 80, 100][rubric];
  }
  return Number(((score / maximumScore) * 100).toFixed(2));
}

function average(values: readonly number[]): number | null {
  return values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : null;
}

function componentAverage(scores: readonly SwunextAssessmentScore[], component: SwunextAssessmentComponent, maxModule?: number): number | null {
  const values = scores.flatMap((item) => {
    if (item.component !== component || item.score == null) return [];
    if (maxModule != null && (item.moduleNumber == null || item.moduleNumber > maxModule)) return [];
    return [transmuteSwunextScore(item.component, item.score, item.maximumScore)];
  });
  return average(values);
}

function weighted(parts: readonly [number | null, number][]): number | null {
  const present = parts.filter(([value]) => value != null) as [number, number][];
  if (!present.length) return null;
  const presentWeight = present.reduce((sum, [, weight]) => sum + weight, 0);
  return Number((present.reduce((sum, [value, weight]) => sum + value * (weight / presentWeight), 0)).toFixed(2));
}

export function calculateSwunextEffortfulLearning(scores: readonly SwunextAssessmentScore[], maxModule?: number): number | null {
  return weighted([
    [componentAverage(scores, 'start_of_class', maxModule), 5],
    [componentAverage(scores, 'lets_practice', maxModule), 35],
    [componentAverage(scores, 'reflection', maxModule), 15],
  ]);
}

export function calculateSwunextMastery(scores: readonly SwunextAssessmentScore[]): number | null {
  const wrapUp = componentAverage(scores, 'wrap_up_quiz');
  const checkins = componentAverage(scores, 'project_checkin');
  const finalProject = componentAverage(scores, 'final_project');
  const projectWeight = checkins != null && finalProject != null ? weighted([[checkins, 65], [finalProject, 35]]) : weighted([[checkins, 50], [finalProject, 50]]);
  return weighted([[wrapUp, 15], [projectWeight, 30]]);
}

export function convertSwunextGradePoint(finalGrade: number): number {
  if (!Number.isFinite(finalGrade) || finalGrade < 0 || finalGrade > 100) {
    throw new Error('Final grade must be between 0 and 100.');
  }
  if (finalGrade < 80) return 4;
  if (finalGrade >= 98) return 1;
  if (finalGrade >= 96) return 1.25;
  if (finalGrade >= 94) return 1.5;
  if (finalGrade >= 92) return 1.75;
  if (finalGrade >= 90) return 2;
  if (finalGrade >= 88) return 2.25;
  if (finalGrade >= 86) return 2.5;
  if (finalGrade >= 84) return 2.75;
  return 3;
}

export function summarizeSwunextGrade(scores: readonly SwunextAssessmentScore[]): SwunextGradeBreakdown {
  const startOfClass = componentAverage(scores, 'start_of_class');
  const letsPractice = componentAverage(scores, 'lets_practice');
  const reflection = componentAverage(scores, 'reflection');
  const effortfulLearning = calculateSwunextEffortfulLearning(scores);
  const wrapUpQuiz = componentAverage(scores, 'wrap_up_quiz');
  const projectCheckins = componentAverage(scores, 'project_checkin');
  const finalProject = componentAverage(scores, 'final_project');
  const mastery = calculateSwunextMastery(scores);
  const p1 = calculateSwunextEffortfulLearning(scores, 5);
  const p2 = calculateSwunextEffortfulLearning(scores, 10);
  const p3 = calculateSwunextEffortfulLearning(scores, 14);
  const finalGrade = p3 == null || mastery == null ? null : Number((p3 * 0.55 + mastery * 0.45).toFixed(2));
  const passingRequirementsMet = finalGrade != null && finalGrade >= 80 && mastery != null && mastery >= 80;
  return {
    startOfClass,
    letsPractice,
    reflection,
    effortfulLearning,
    wrapUpQuiz,
    projectCheckins,
    finalProject,
    mastery,
    p1,
    p2,
    p3,
    finalGrade,
    gradePoint: finalGrade == null ? null : convertSwunextGradePoint(finalGrade),
    remarks: finalGrade == null ? 'incomplete' : passingRequirementsMet ? 'passing' : 'failing',
    passingRequirementsMet,
  };
}

export function isSwunextComponent(value: string): value is SwunextAssessmentComponent {
  return [...effortComponents, ...masteryComponents, 'other'].includes(value as SwunextAssessmentComponent);
}

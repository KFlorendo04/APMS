import { describe, expect, it } from 'vitest';
import {
  calculateAttendanceRate,
  calculateTrend,
  calculateWeightedPercentage,
  convertSwunextGradePoint,
  summarizePerformance,
  summarizeSwunextGrade,
  transmuteSwunextScore,
  validateWeights,
} from './calculations';

describe('grading calculations', () => {
  it('requires active weights to total 100 percent', () => {
    expect(validateWeights([20, 30, 50])).toBe(true);
    expect(validateWeights([20, 30])).toBe(false);
  });

  it('calculates from approved results only', () => {
    expect(calculateWeightedPercentage([
      { score: 18, maximumScore: 20, weight: 40, approved: true },
      { score: 45, maximumScore: 50, weight: 60, approved: true },
      { score: 0, maximumScore: 100, weight: 100, approved: false },
    ])).toBe(90);
  });

  it('rejects invalid score ranges and invalid weight totals', () => {
    expect(() => calculateWeightedPercentage([
      { score: 11, maximumScore: 10, weight: 100, approved: true },
    ])).toThrow(/outside/);
    expect(() => calculateWeightedPercentage([
      { score: 5, maximumScore: 10, weight: 50, approved: true },
    ])).toThrow(/100%/);
  });

  it('distinguishes missing scores from zero unless configured otherwise', () => {
    const values = [
      { score: 10, maximumScore: 10, weight: 50, approved: true },
      { score: null, maximumScore: 10, weight: 50, approved: true },
    ];
    expect(calculateWeightedPercentage(values)).toBe(100);
    expect(calculateWeightedPercentage(values, 'zero')).toBe(50);
  });

  it('classifies risk without making a final academic decision', () => {
    expect(summarizePerformance(92)).toMatchObject({ classification: 'excellent', riskLevel: 'low' });
    expect(summarizePerformance(68)).toMatchObject({ classification: 'at_risk', riskLevel: 'medium' });
    expect(summarizePerformance(42)).toMatchObject({ classification: 'at_risk', riskLevel: 'high' });
  });
});

describe('monitoring indicators', () => {
  it('calculates attendance with documented late and excused handling', () => {
    expect(calculateAttendanceRate(['present', 'late', 'absent', 'excused'])).toBe(62.5);
    expect(calculateAttendanceRate([])).toBe(0);
  });

  it('identifies improving, stable, and declining score direction', () => {
    expect(calculateTrend([60, 65, 75, 80])).toBe('improving');
    expect(calculateTrend([80, 81, 80, 81])).toBe('stable');
    expect(calculateTrend([90, 85, 70, 65])).toBe('declining');
  });
});

describe('SWUNEXT grading system', () => {
  it('transmutes binary and 0-3 rubric scores before weighting', () => {
    expect(transmuteSwunextScore('start_of_class', 1, 1)).toBe(100);
    expect(transmuteSwunextScore('start_of_class', 0, 1)).toBe(0);
    expect(transmuteSwunextScore('lets_practice', 1, 3)).toBe(60);
    expect(transmuteSwunextScore('reflection', 2, 3)).toBe(80);
    expect(transmuteSwunextScore('wrap_up_quiz', 6, 7)).toBe(85.71);
  });

  it('calculates P1/P2 running views and the P3 plus mastery final grade', () => {
    const summary = summarizeSwunextGrade([
      { component: 'start_of_class', moduleNumber: 1, score: 1, maximumScore: 1 },
      { component: 'start_of_class', moduleNumber: 6, score: 0, maximumScore: 1 },
      { component: 'lets_practice', moduleNumber: 1, score: 3, maximumScore: 3 },
      { component: 'lets_practice', moduleNumber: 6, score: 2, maximumScore: 3 },
      { component: 'reflection', moduleNumber: 1, score: 2, maximumScore: 3 },
      { component: 'reflection', moduleNumber: 6, score: 3, maximumScore: 3 },
      { component: 'wrap_up_quiz', moduleNumber: 1, score: 85, maximumScore: 100 },
      { component: 'wrap_up_quiz', moduleNumber: 6, score: 95, maximumScore: 100 },
      { component: 'project_checkin', score: 80, maximumScore: 100 },
      { component: 'project_checkin', score: 90, maximumScore: 100 },
      { component: 'final_project', score: 88, maximumScore: 100 },
    ]);

    expect(summary.p1).toBe(94.55);
    expect(summary.p2).toBe(86.36);
    expect(summary.p3).toBe(86.36);
    expect(summary.mastery).toBe(87.37);
    expect(summary.finalGrade).toBe(86.81);
    expect(summary.gradePoint).toBe(2.5);
    expect(summary.remarks).toBe('passing');
  });

  it('requires both final grade and mastery to reach 80 percent', () => {
    const summary = summarizeSwunextGrade([
      { component: 'start_of_class', moduleNumber: 14, score: 1, maximumScore: 1 },
      { component: 'lets_practice', moduleNumber: 14, score: 3, maximumScore: 3 },
      { component: 'reflection', moduleNumber: 14, score: 3, maximumScore: 3 },
      { component: 'wrap_up_quiz', moduleNumber: 14, score: 70, maximumScore: 100 },
      { component: 'final_project', score: 70, maximumScore: 100 },
    ]);

    expect(summary.finalGrade).toBe(86.5);
    expect(summary.mastery).toBe(70);
    expect(summary.gradePoint).toBe(2.5);
    expect(summary.remarks).toBe('failing');
  });
});

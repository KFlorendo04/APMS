import { z } from 'zod';
import { roleKeys } from './types';

export const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must contain at least 8 characters.'),
  role: z.enum(roleKeys),
});

export const studentSchema = z.object({
  institutionalId: z.string().trim().min(3).max(40),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email(),
  programId: z.uuid(),
  yearLevel: z.number().int().min(1).max(8),
  section: z.string().trim().min(1).max(40),
});

export const assessmentResultSchema = z.object({
  assessmentId: z.uuid(),
  enrollmentId: z.uuid(),
  score: z.number().min(0),
  maximumScore: z.number().positive(),
}).refine((result) => result.score <= result.maximumScore, {
  message: 'Score cannot exceed the assessment maximum.',
  path: ['score'],
});

export const attendanceRecordSchema = z.object({
  enrollmentId: z.uuid(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  remarks: z.string().trim().max(500).optional(),
});

export const criteriaNodeSchema = z.object({
  label: z.string().trim().min(1).max(120),
  type: z.enum(['period', 'component', 'assessment_category']),
  weight: z.number().min(0).max(100),
  order: z.number().int().nonnegative(),
});

export const predictionRequestSchema = z.object({
  enrollmentId: z.uuid(),
  currentStanding: z.number().min(0).max(100),
  recentScores: z.array(z.number().min(0).max(100)).min(1),
  attendanceRate: z.number().min(0).max(100),
  missingAssessmentCount: z.number().int().nonnegative(),
});

export const eventSchema = z.object({
  title: z.string().trim().min(2).max(160),
  category: z.enum(['assessment', 'meeting', 'training', 'seminar', 'event']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  description: z.string().trim().max(2000),
}).refine((event) => new Date(event.startsAt) <= new Date(event.endsAt), {
  message: 'End date must not be before the start date.',
  path: ['endsAt'],
});

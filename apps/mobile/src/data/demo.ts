import type { Role } from '@apms/domain';

export type DemoUser = { id: string; email: string; password: string; firstName: string; lastName: string; role: Role };
export const DEMO_USERS: DemoUser[] = [
  { id: 'demo-faculty', email: 'faculty@demo.apms.local', password: 'Faculty123!', firstName: 'Myco', lastName: 'Villomo', role: 'faculty' },
  { id: 'demo-dean', email: 'dean@demo.apms.local', password: 'Dean123!', firstName: 'Andrea', lastName: 'Lim', role: 'academic_admin' },
  { id: 'demo-admin', email: 'admin@demo.apms.local', password: 'Admin123!', firstName: 'Paolo', lastName: 'Tan', role: 'system_admin' },
];

export const students = [
  ['2026-00121', 'Mika Santos', 'BSIT', '2nd Year', 'Low Risk'],
  ['2026-00134', 'Liam Garcia', 'BSIT', '2nd Year', 'Medium Risk'],
  ['2026-00187', 'Ava Mendoza', 'BSIT', '3rd Year', 'High Risk'],
  ['2026-00204', 'Ethan Flores', 'BSBA', '1st Year', 'Low Risk'],
];
export const classes = [
  ['IT-301', 'Data Structures and Algorithms', 'BSIT 2A', '38', 'Active'],
  ['IT-305', 'Database Systems', 'BSIT 2B', '35', 'Active'],
  ['BA-210', 'Operations Management', 'BSBA 2A', '42', 'Active'],
];
export const logs = [
  ['2026-08-06 09:41', 'operator@demo.apms.local', 'user.updated', 'Success'],
  ['2026-08-06 09:36', 'faculty@demo.apms.local', 'grades.imported', 'Success'],
  ['2026-08-06 09:17', 'unknown', 'auth.login.failed', 'Warning'],
  ['2026-08-06 08:00', 'system', 'backup.completed', 'Success'],
];

import { describe, expect, it } from 'vitest';
import { canAccessClassRecord, hasPermission, permissionKeys, rolePermissions } from './permissions';
import { roleKeys, type SessionActor } from './types';

describe('role permissions', () => {
  it('contains only known permissions for every thesis role', () => {
    for (const role of roleKeys) {
      expect(rolePermissions[role].length).toBeGreaterThan(0);
      expect(rolePermissions[role].every((permission) => permissionKeys.includes(permission))).toBe(true);
    }
  });

  it('keeps System Admin technical and out of academic record editing', () => {
    expect(hasPermission('system_admin', 'roles.manage')).toBe(true);
    expect(hasPermission('system_admin', 'backups.manage')).toBe(true);
    expect(hasPermission('system_admin', 'assessment_results.manage.assigned')).toBe(false);
  });

  it('gives Academic Admin subjects.manage.department but not system.configure', () => {
    expect(hasPermission('academic_admin', 'subjects.manage.department')).toBe(true);
    expect(hasPermission('academic_admin', 'system.configure')).toBe(false);
    expect(hasPermission('academic_admin', 'users.manage')).toBe(false);
  });

  it('does not give Faculty subjects.manage.department', () => {
    expect(hasPermission('faculty', 'subjects.manage.department')).toBe(false);
    expect(hasPermission('faculty', 'class_records.manage.assigned')).toBe(true);
    expect(hasPermission('faculty', 'attendance.manage.assigned')).toBe(true);
    expect(hasPermission('faculty', 'imports.manage.assigned')).toBe(true);
  });

  it('enforces assigned, department, and self record scopes', () => {
    const base: SessionActor = {
      userId: 'user', role: 'faculty', departmentIds: [],
      assignedClassRecordIds: ['class-a'],
    };
    expect(canAccessClassRecord(base, { id: 'class-a', departmentId: 'dept-a' })).toBe(true);
    expect(canAccessClassRecord(base, { id: 'class-b', departmentId: 'dept-a' })).toBe(false);
    expect(canAccessClassRecord({ ...base, role: 'academic_admin', departmentIds: ['dept-a'] }, { id: 'class-b', departmentId: 'dept-a' })).toBe(true);
    expect(canAccessClassRecord({ ...base, role: 'system_admin' }, { id: 'class-a', departmentId: 'dept-a' })).toBe(false);
  });

  it('Academic Admin cannot access a class in a different department', () => {
    const admin: SessionActor = { userId: 'admin', role: 'academic_admin', departmentIds: ['dept-a'], assignedClassRecordIds: [] };
    expect(canAccessClassRecord(admin, { id: 'class-x', departmentId: 'dept-b' })).toBe(false);
    expect(canAccessClassRecord(admin, { id: 'class-y', departmentId: 'dept-a' })).toBe(true);
  });
});


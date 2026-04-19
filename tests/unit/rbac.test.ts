import { describe, it, expect } from 'vitest';
import { can, requirePermission, ForbiddenError } from '@/lib/rbac';
import type { Role } from '@prisma/client';

const BASE_PERMS = ['audit:read', 'audit:filter', 'calc:access', 'dashboard:view'] as const;

describe('can / permission matrix', () => {
  describe('base permissions (all roles)', () => {
    const roles: Role[] = ['L1', 'L2', 'L3', 'ADMIN'];
    for (const role of roles) {
      for (const perm of BASE_PERMS) {
        it(`${role} has ${perm}`, () => {
          expect(can(role, perm)).toBe(true);
        });
      }
    }
  });

  describe('L1', () => {
    it('cannot update audit status', () => {
      expect(can('L1', 'audit:status:update')).toBe(false);
    });
    it('cannot add comments', () => {
      expect(can('L1', 'audit:comment:add')).toBe(false);
    });
    it('cannot edit analytical fields', () => {
      expect(can('L1', 'audit:edit:analytical')).toBe(false);
    });
    it('cannot update severity', () => {
      expect(can('L1', 'audit:severity:update')).toBe(false);
    });
    it('cannot confirm final', () => {
      expect(can('L1', 'audit:confirm:final')).toBe(false);
    });
    it('cannot access extended analytics', () => {
      expect(can('L1', 'analytics:extended')).toBe(false);
    });
    it('cannot manage users', () => {
      expect(can('L1', 'user:manage')).toBe(false);
    });
  });

  describe('L2', () => {
    it('can update audit status', () => {
      expect(can('L2', 'audit:status:update')).toBe(true);
    });
    it('can add comments', () => {
      expect(can('L2', 'audit:comment:add')).toBe(true);
    });
    it('can edit analytical fields', () => {
      expect(can('L2', 'audit:edit:analytical')).toBe(true);
    });
    it('cannot update severity', () => {
      expect(can('L2', 'audit:severity:update')).toBe(false);
    });
    it('cannot confirm final', () => {
      expect(can('L2', 'audit:confirm:final')).toBe(false);
    });
    it('cannot access extended analytics', () => {
      expect(can('L2', 'analytics:extended')).toBe(false);
    });
    it('cannot manage users', () => {
      expect(can('L2', 'user:manage')).toBe(false);
    });
  });

  describe('L3', () => {
    it('can update audit status', () => {
      expect(can('L3', 'audit:status:update')).toBe(true);
    });
    it('can add comments', () => {
      expect(can('L3', 'audit:comment:add')).toBe(true);
    });
    it('can edit analytical fields', () => {
      expect(can('L3', 'audit:edit:analytical')).toBe(true);
    });
    it('can update severity', () => {
      expect(can('L3', 'audit:severity:update')).toBe(true);
    });
    it('can confirm final', () => {
      expect(can('L3', 'audit:confirm:final')).toBe(true);
    });
    it('can access extended analytics', () => {
      expect(can('L3', 'analytics:extended')).toBe(true);
    });
    it('cannot manage users', () => {
      expect(can('L3', 'user:manage')).toBe(false);
    });
  });

  describe('ADMIN', () => {
    it('can update audit status', () => {
      expect(can('ADMIN', 'audit:status:update')).toBe(true);
    });
    it('can add comments', () => {
      expect(can('ADMIN', 'audit:comment:add')).toBe(true);
    });
    it('can edit analytical fields', () => {
      expect(can('ADMIN', 'audit:edit:analytical')).toBe(true);
    });
    it('can update severity', () => {
      expect(can('ADMIN', 'audit:severity:update')).toBe(true);
    });
    it('can confirm final', () => {
      expect(can('ADMIN', 'audit:confirm:final')).toBe(true);
    });
    it('can access extended analytics', () => {
      expect(can('ADMIN', 'analytics:extended')).toBe(true);
    });
    it('can manage users', () => {
      expect(can('ADMIN', 'user:manage')).toBe(true);
    });
  });
});

describe('requirePermission', () => {
  it('returns void (no throw) when the role has the permission', () => {
    expect(() => requirePermission('ADMIN', 'user:manage')).not.toThrow();
    expect(() => requirePermission('L1', 'audit:read')).not.toThrow();
  });

  it('throws ForbiddenError when the role lacks the permission', () => {
    expect(() => requirePermission('L1', 'user:manage')).toThrow(ForbiddenError);
    expect(() => requirePermission('L2', 'audit:severity:update')).toThrow(ForbiddenError);
  });

  it('ForbiddenError exposes the role, permission, and FORBIDDEN code', () => {
    try {
      requirePermission('L1', 'user:manage');
      throw new Error('expected ForbiddenError');
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenError);
      const fe = err as ForbiddenError;
      expect(fe.role).toBe('L1');
      expect(fe.perm).toBe('user:manage');
      expect(fe.code).toBe('FORBIDDEN');
      expect(fe.name).toBe('ForbiddenError');
    }
  });
});

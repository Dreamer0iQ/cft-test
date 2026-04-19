import type { Role } from '@prisma/client';

export type Permission =
  | 'audit:read'
  | 'audit:filter'
  | 'calc:access'
  | 'dashboard:view'
  | 'audit:status:update'
  | 'audit:comment:add'
  | 'audit:edit:analytical'
  | 'audit:severity:update'
  | 'audit:confirm:final'
  | 'analytics:extended'
  | 'user:manage';

const base: Permission[] = ['audit:read', 'audit:filter', 'calc:access', 'dashboard:view'];
const l2: Permission[] = ['audit:status:update', 'audit:comment:add', 'audit:edit:analytical'];
const l3: Permission[] = ['audit:severity:update', 'audit:confirm:final', 'analytics:extended'];

export const PERMISSIONS: Record<Role, Permission[]> = {
  L1: [...base],
  L2: [...base, ...l2],
  L3: [...base, ...l2, ...l3],
  ADMIN: [...base, ...l2, ...l3, 'user:manage'],
};

export function can(role: Role, perm: Permission): boolean {
  return PERMISSIONS[role]?.includes(perm) ?? false;
}

export class ForbiddenError extends Error {
  readonly code = 'FORBIDDEN';
  constructor(public readonly role: Role, public readonly perm: Permission) {
    super(`Role ${role} lacks permission ${perm}`);
    this.name = 'ForbiddenError';
  }
}

export function requirePermission(role: Role, perm: Permission): void {
  if (!can(role, perm)) throw new ForbiddenError(role, perm);
}

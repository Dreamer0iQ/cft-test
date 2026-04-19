import { z } from 'zod';

export const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
});
export type LoginInput = z.infer<typeof loginInput>;

export const commentInput = z.object({
  auditId: z.string().cuid(),
  text: z.string().trim().min(1).max(4000),
});
export type CommentInput = z.infer<typeof commentInput>;

export const statusUpdateInput = z.object({
  auditId: z.string().cuid(),
  status: z.enum(['NEW', 'IN_PROGRESS', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'ACCEPTED_RISK']),
  note: z.string().trim().max(2000).optional(),
});
export type StatusUpdateInput = z.infer<typeof statusUpdateInput>;

export const severityUpdateInput = z.object({
  auditId: z.string().cuid(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  reason: z.string().trim().min(3).max(2000),
});
export type SeverityUpdateInput = z.infer<typeof severityUpdateInput>;

export const userCreateInput = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(120),
  role: z.enum(['ADMIN', 'L1', 'L2', 'L3']),
  password: z.string().min(8).max(128),
});
export type UserCreateInput = z.infer<typeof userCreateInput>;

export const userRoleUpdateInput = z.object({
  userId: z.string().cuid(),
  role: z.enum(['ADMIN', 'L1', 'L2', 'L3']),
});
export type UserRoleUpdateInput = z.infer<typeof userRoleUpdateInput>;

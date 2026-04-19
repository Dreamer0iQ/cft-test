'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import type { Role } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { auth } from '@/server/auth';
import { requirePermission, ForbiddenError } from '@/lib/rbac';
import { userCreateInput, userRoleUpdateInput } from '@/lib/validators';

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; field?: string };

function errResult(e: unknown): ActionResult {
  if (e instanceof ForbiddenError) return { ok: false, error: 'forbidden' };
  if (e instanceof z.ZodError) {
    const issue = e.issues[0];
    return { ok: false, error: issue?.message ?? 'invalid_input', field: issue?.path?.[0]?.toString() };
  }
  if (e instanceof Error) return { ok: false, error: e.message };
  return { ok: false, error: 'unknown' };
}

export async function createUser(input: {
  email: string;
  name: string;
  role: Role;
  password: string;
}): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) return { ok: false, error: 'unauthorized' };
    requirePermission(session.user.role, 'user:manage');

    const data = userCreateInput.parse(input);

    const passwordHash = await bcrypt.hash(data.password, 10);

    try {
      await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          role: data.role,
          passwordHash,
        },
      });
    } catch (e) {
      // P2002 — unique email
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return { ok: false, error: 'email_taken', field: 'email' };
      }
      throw e;
    }

    revalidatePath('/users');
    return { ok: true };
  } catch (e) {
    return errResult(e);
  }
}

export async function updateUserRole(userId: string, role: Role): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) return { ok: false, error: 'unauthorized' };
    requirePermission(session.user.role, 'user:manage');

    const data = userRoleUpdateInput.parse({ userId, role });

    // admin не может сам себе понизить роль — иначе можно запереть систему без админа
    if (data.userId === session.user.id) {
      return { ok: false, error: 'cannot_change_own_role' };
    }

    const existing = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true, role: true },
    });
    if (!existing) return { ok: false, error: 'not_found' };
    if (existing.role === data.role) {
      return { ok: true };
    }

    await prisma.user.update({
      where: { id: data.userId },
      data: { role: data.role },
    });

    revalidatePath('/users');
    return { ok: true };
  } catch (e) {
    return errResult(e);
  }
}

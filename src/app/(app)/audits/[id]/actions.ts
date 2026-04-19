'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { AuditStatus, Severity } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { auth } from '@/server/auth';
import { requirePermission, ForbiddenError } from '@/lib/rbac';
import { calculateRisk } from '@/lib/calculators';
import {
  commentInput,
  statusUpdateInput,
  severityUpdateInput,
} from '@/lib/validators';

export type ActionResult = { ok: true } | { ok: false; error: string };

const confirmFinalInput = z.object({ auditId: z.string().cuid() });

function errMessage(e: unknown): string {
  if (e instanceof ForbiddenError) return 'Недостаточно прав';
  if (e instanceof z.ZodError) return e.issues[0]?.message ?? 'Некорректные данные';
  if (e instanceof Error) return e.message;
  return 'Неизвестная ошибка';
}

export async function addComment(auditId: string, text: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');
    requirePermission(session.user.role, 'audit:comment:add');

    const data = commentInput.parse({ auditId, text });

    const audit = await prisma.auditResult.findUnique({ where: { id: data.auditId }, select: { id: true } });
    if (!audit) return { ok: false, error: 'Аудит не найден' };

    await prisma.$transaction([
      prisma.comment.create({
        data: { auditId: data.auditId, authorId: session.user.id, text: data.text },
      }),
      prisma.activityLog.create({
        data: {
          auditId: data.auditId,
          actorId: session.user.id,
          action: 'comment_added',
        },
      }),
    ]);

    revalidatePath(`/audits/${data.auditId}`);
    revalidatePath('/audits');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMessage(e) };
  }
}

export async function updateStatus(auditId: string, status: AuditStatus): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');
    requirePermission(session.user.role, 'audit:status:update');

    const data = statusUpdateInput.parse({ auditId, status });

    const current = await prisma.auditResult.findUnique({
      where: { id: data.auditId },
      select: { id: true, status: true },
    });
    if (!current) return { ok: false, error: 'Аудит не найден' };
    if (current.status === data.status) return { ok: true };

    await prisma.$transaction([
      prisma.auditResult.update({
        where: { id: data.auditId },
        data: { status: data.status },
      }),
      prisma.activityLog.create({
        data: {
          auditId: data.auditId,
          actorId: session.user.id,
          action: 'status_changed',
          field: 'status',
          oldValue: current.status,
          newValue: data.status,
        },
      }),
    ]);

    revalidatePath(`/audits/${data.auditId}`);
    revalidatePath('/audits');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMessage(e) };
  }
}

export async function updateSeverity(
  auditId: string,
  severity: Severity,
  reason: string,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');
    requirePermission(session.user.role, 'audit:severity:update');

    const data = severityUpdateInput.parse({ auditId, severity, reason });

    const current = await prisma.auditResult.findUnique({
      where: { id: data.auditId },
      select: {
        id: true,
        severity: true,
        probability: true,
        impact: true,
        hasMitigation: true,
      },
    });
    if (!current) return { ok: false, error: 'Аудит не найден' };
    if (current.severity === data.severity) return { ok: true };

    const { score } = calculateRisk({
      severity: data.severity,
      probability: current.probability,
      impact: current.impact,
      hasMitigation: current.hasMitigation,
    });

    await prisma.$transaction([
      prisma.auditResult.update({
        where: { id: data.auditId },
        data: { severity: data.severity, riskScore: score },
      }),
      prisma.activityLog.create({
        data: {
          auditId: data.auditId,
          actorId: session.user.id,
          action: 'severity_changed',
          field: 'severity',
          oldValue: current.severity,
          newValue: data.severity,
        },
      }),
    ]);

    revalidatePath(`/audits/${data.auditId}`);
    revalidatePath('/audits');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMessage(e) };
  }
}

export async function confirmFinal(auditId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');
    requirePermission(session.user.role, 'audit:confirm:final');

    const data = confirmFinalInput.parse({ auditId });

    const current = await prisma.auditResult.findUnique({
      where: { id: data.auditId },
      select: { id: true, status: true },
    });
    if (!current) return { ok: false, error: 'Аудит не найден' };

    const now = new Date();

    await prisma.$transaction([
      prisma.auditResult.update({
        where: { id: data.auditId },
        data: { status: 'RESOLVED', resolvedAt: now },
      }),
      prisma.activityLog.create({
        data: {
          auditId: data.auditId,
          actorId: session.user.id,
          action: 'confirmed_final',
          field: 'status',
          oldValue: current.status,
          newValue: 'RESOLVED',
        },
      }),
    ]);

    revalidatePath(`/audits/${data.auditId}`);
    revalidatePath('/audits');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errMessage(e) };
  }
}

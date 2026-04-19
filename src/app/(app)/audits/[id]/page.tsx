import { redirect, notFound } from 'next/navigation';
import { Stack } from '@mantine/core';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';
import { calculateSla } from '@/lib/calculators';
import { Card } from '@/components/ui/Card';
import { AuditHeader } from './AuditHeader';
import { AuditInfoGrid } from './AuditInfoGrid';
import { CommentsList } from './CommentsList';
import { CommentForm } from './CommentForm';
import { ActivityTimeline } from './ActivityTimeline';
import { ActionBar } from './ActionBar';
import styles from './page.module.scss';

interface PageProps {
  params: { id: string };
}

export default async function AuditDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const audit = await prisma.auditResult.findUnique({
    where: { id: params.id },
    include: {
      system: true,
      responsible: true,
      comments: {
        include: { author: true },
        orderBy: { createdAt: 'desc' },
      },
      logs: {
        include: { actor: true },
        orderBy: { createdAt: 'desc' },
        take: 15,
      },
    },
  });

  if (!audit) notFound();

  const sla = calculateSla({
    detectedAt: audit.detectedAt,
    severity: audit.severity,
    resolvedAt: audit.resolvedAt,
  });

  const role = session.user.role;

  return (
    <div className={styles.page}>
      <AuditHeader audit={audit} sla={sla} />

      <ActionBar
        auditId={audit.id}
        status={audit.status}
        severity={audit.severity}
        role={role}
      />

      <div className={styles.grid}>
        <Stack gap="md" className={styles.left}>
          <AuditInfoGrid audit={audit} sla={sla} />
          <Card>
            <h3 className={styles.sectionTitle}>Описание</h3>
            <p className={styles.description}>{audit.description}</p>
          </Card>
        </Stack>

        <div className={styles.right}>
          <ActivityTimeline logs={audit.logs} />
        </div>
      </div>

      <Card>
        <h3 className={styles.sectionTitle}>Комментарии</h3>
        <Stack gap="md">
          <CommentsList comments={audit.comments} />
          <CommentForm auditId={audit.id} role={role} />
        </Stack>
      </Card>
    </div>
  );
}

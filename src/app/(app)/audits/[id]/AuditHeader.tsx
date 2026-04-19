import Link from 'next/link';
import { Group } from '@mantine/core';
import { IconChevronLeft } from '@tabler/icons-react';
import type { AuditResult, System, User } from '@prisma/client';
import { Card } from '@/components/ui/Card';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { SlaOutput } from '@/lib/calculators';
import styles from './AuditHeader.module.scss';

interface Props {
  audit: AuditResult & { system: System; responsible: User | null };
  sla: SlaOutput;
}

const SLA_LABEL: Record<SlaOutput['status'], string> = {
  on_track: 'В срок',
  due_soon: 'Скоро дедлайн',
  overdue: 'Просрочено',
  met: 'Исполнено в срок',
};

function formatDate(d: Date | null | undefined): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  }).format(d);
}

export function AuditHeader({ audit, sla }: Props) {
  return (
    <Card className={styles.header}>
      <div className={styles.breadcrumb}>
        <Link href="/audits" className={styles.back}>
          <IconChevronLeft size={14} />
          <span>Аудиты</span>
        </Link>
        <span className={styles.sep}>/</span>
        <span className={styles.crumbTitle}>{audit.title}</span>
      </div>

      <div className={styles.titleRow}>
        <h1 className={styles.title}>{audit.title}</h1>
        <div className={styles.risk}>
          <span className={styles.riskLabel}>Риск-скор</span>
          <span className={styles.riskValue}>{audit.riskScore}</span>
        </div>
      </div>

      <Group gap={10} wrap="wrap" className={styles.badges}>
        <SeverityBadge severity={audit.severity} />
        <StatusBadge status={audit.status} />
        <span className={`${styles.slaChip} ${styles[sla.status]}`}>
          SLA · {SLA_LABEL[sla.status]}
        </span>
      </Group>

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Обнаружен</span>
          <span className={styles.metaValue}>{formatDate(audit.detectedAt)}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Срок</span>
          <span className={styles.metaValue}>{formatDate(audit.dueDate)}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Дедлайн SLA</span>
          <span className={styles.metaValue}>{formatDate(sla.deadline)}</span>
        </div>
      </div>
    </Card>
  );
}

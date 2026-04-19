import type { AuditResult, System, User } from '@prisma/client';
import { Card } from '@/components/ui/Card';
import { RoleBadge } from '@/components/ui/RoleBadge';
import type { SlaOutput } from '@/lib/calculators';
import styles from './AuditInfoGrid.module.scss';

interface Props {
  audit: AuditResult & { system: System; responsible: User | null };
  sla: SlaOutput;
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Moscow',
  }).format(d);
}

export function AuditInfoGrid({ audit, sla }: Props) {
  const systemLabel = audit.system.module
    ? `${audit.system.name} · ${audit.system.module}`
    : audit.system.name;

  const slaLeft =
    sla.status === 'overdue'
      ? `просрочено на ${sla.overdueHours} ч`
      : sla.status === 'met'
        ? 'исполнено'
        : `осталось ${sla.hoursLeft} ч`;

  return (
    <Card>
      <h3 className={styles.sectionTitle}>Детали</h3>
      <dl className={styles.grid}>
        <Row label="ID">
          <span className={styles.mono}>{audit.id}</span>
        </Row>
        <Row label="Система">{systemLabel}</Row>
        <Row label="Категория">{audit.category}</Row>
        <Row label="Ответственный">
          {audit.responsible ? (
            <span className={styles.inline}>
              <span>{audit.responsible.name}</span>
              <RoleBadge role={audit.responsible.role} />
            </span>
          ) : (
            <span className={styles.muted}>не назначен</span>
          )}
        </Row>
        <Row label="Дата обнаружения">{formatDate(audit.detectedAt)}</Row>
        <Row label="Срок">{formatDate(audit.dueDate)}</Row>
        <Row label="Дата устранения">
          {audit.resolvedAt ? formatDate(audit.resolvedAt) : <span className={styles.muted}>—</span>}
        </Row>
        <Row label="SLA">{slaLeft}</Row>
        <Row label="Риск-скор">
          <span className={styles.risk}>{audit.riskScore}</span>
        </Row>
        <Row label="Вероятность">{audit.probability} / 5</Row>
        <Row label="Влияние">{audit.impact} / 5</Row>
        <Row label="Меры смягчения">{audit.hasMitigation ? 'Да' : 'Нет'}</Row>
      </dl>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{children}</dd>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { SegmentedControl, NumberInput, Stack } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconClock, IconCalendarEvent } from '@tabler/icons-react';
import type { Severity } from '@prisma/client';
import { calculateSla, slaNormHours, type SlaStatus } from '@/lib/calculators';
import { Card } from '@/components/ui/Card';
import { ResultPanel } from '../_components/ResultPanel';
import styles from './page.module.scss';

interface SlaFormValues {
  detectedAt: Date | null;
  severity: Severity;
  normHours: number | '';
}

const SEVERITY_OPTIONS = [
  { label: 'LOW', value: 'LOW' },
  { label: 'MEDIUM', value: 'MEDIUM' },
  { label: 'HIGH', value: 'HIGH' },
  { label: 'CRITICAL', value: 'CRITICAL' },
];

const STATUS_META: Record<SlaStatus, { label: string; className: string }> = {
  on_track: { label: 'В рамках', className: 'statusOn' },
  due_soon: { label: 'Скоро дедлайн', className: 'statusDue' },
  overdue: { label: 'Просрочено', className: 'statusOver' },
  met: { label: 'Устранено', className: 'statusMet' },
};

function formatDate(d: Date): string {
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatHours(h: number): string {
  if (h >= 24) {
    const days = Math.floor(h / 24);
    const rest = Math.round(h - days * 24);
    return rest > 0 ? `${days} д ${rest} ч` : `${days} д`;
  }
  return `${Math.round(h)} ч`;
}

export default function SlaCalculatorPage() {
  const form = useForm<SlaFormValues>({
    initialValues: {
      detectedAt: new Date(),
      severity: 'MEDIUM',
      normHours: '',
    },
  });

  const v = form.values;
  const now = useMemo(() => new Date(), []);

  const result = useMemo(() => {
    if (!v.detectedAt) return null;
    // норматив: если поле пустое — берётся из slaNormHours (см. /lib/calculators)
    const normHours = typeof v.normHours === 'number' ? v.normHours : undefined;
    return calculateSla({
      detectedAt: v.detectedAt,
      severity: v.severity,
      normHours,
      now,
    });
  }, [v.detectedAt, v.severity, v.normHours, now]);

  const defaultNorm = slaNormHours[v.severity];
  const statusInfo = result ? STATUS_META[result.status] : null;
  const statusClassMap: Record<SlaStatus, string> = {
    on_track: styles.statusOn,
    due_soon: styles.statusDue,
    overdue: styles.statusOver,
    met: styles.statusMet,
  };

  return (
    <div className={styles.grid}>
      <Card className={styles.formCard}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>
            <IconClock size={18} />
          </span>
          Параметры SLA
        </h3>

        <Stack gap="md">
          <div className={styles.field}>
            <div className={styles.label}>Дата обнаружения</div>
            <DatePickerInput
              value={v.detectedAt}
              onChange={(val) => form.setFieldValue('detectedAt', val)}
              leftSection={<IconCalendarEvent size={16} />}
              valueFormat="DD.MM.YYYY"
              popoverProps={{ withinPortal: true }}
            />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>Критичность</div>
            <SegmentedControl
              fullWidth
              data={SEVERITY_OPTIONS}
              value={v.severity}
              onChange={(val) => form.setFieldValue('severity', val as Severity)}
            />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>Норматив, часов (необязательно)</div>
            <NumberInput
              min={1}
              placeholder={`по умолчанию ${defaultNorm} ч`}
              value={v.normHours}
              onChange={(val) => form.setFieldValue('normHours', val === '' ? '' : Number(val))}
              allowDecimal={false}
            />
            <div className={styles.normHint}>
              По умолчанию берётся норматив по критичности: {defaultNorm} ч.
            </div>
          </div>
        </Stack>
      </Card>

      <ResultPanel
        caption="Дедлайн по SLA"
        topRight={
          statusInfo && result ? (
            <span className={`${styles.statusChip} ${statusClassMap[result.status]}`}>
              {statusInfo.label}
            </span>
          ) : null
        }
        footer={
          result ? (
            <>
              норматив: {typeof v.normHours === 'number' ? v.normHours : defaultNorm} ч ·
              порог due_soon — 20% от норматива
            </>
          ) : null
        }
      >
        {result ? (
          <>
            <div className={styles.deadline}>{formatDate(result.deadline)}</div>
            <div className={styles.metaRow}>
              {result.status === 'overdue' ? (
                <span>
                  Просрочка: <span className={styles.metaValue}>{formatHours(result.overdueHours)}</span>
                </span>
              ) : (
                <span>
                  Осталось: <span className={styles.metaValue}>{formatHours(result.hoursLeft)}</span>
                </span>
              )}
            </div>
          </>
        ) : (
          <div className={styles.metaRow}>Укажите дату обнаружения</div>
        )}
      </ResultPanel>
    </div>
  );
}

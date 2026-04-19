'use client';

import { useMemo } from 'react';
import { NumberInput, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconChecklist } from '@tabler/icons-react';
import { calculateCompliance, type ComplianceLevel } from '@/lib/calculators';
import { Card } from '@/components/ui/Card';
import { ResultPanel } from '../_components/ResultPanel';
import styles from './page.module.scss';

interface ComplianceFormValues {
  fulfilled: number | '';
  unfulfilled: number | '';
}

const LEVEL_LABEL: Record<ComplianceLevel, string> = {
  full: 'Полное соответствие',
  partial: 'Частичное',
  non_compliant: 'Не соответствует',
};

// пороги уровня — см. /lib/calculators (>=95 full, >=60 partial)
const LEVEL_CLASS: Record<ComplianceLevel, string> = {
  full: styles.levelFull,
  partial: styles.levelPartial,
  non_compliant: styles.levelFail,
};

function toNum(v: number | ''): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0;
}

export default function ComplianceCalculatorPage() {
  const form = useForm<ComplianceFormValues>({
    initialValues: {
      fulfilled: 8,
      unfulfilled: 2,
    },
  });

  const v = form.values;
  const fulfilled = toNum(v.fulfilled);
  const unfulfilled = toNum(v.unfulfilled);
  const total = fulfilled + unfulfilled;

  const result = useMemo(
    () => calculateCompliance({ fulfilled, unfulfilled }),
    [fulfilled, unfulfilled],
  );

  return (
    <div className={styles.grid}>
      <Card className={styles.formCard}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>
            <IconChecklist size={18} />
          </span>
          Требования
        </h3>

        <Stack gap="md">
          <div className={styles.field}>
            <div className={styles.label}>Выполненные</div>
            <NumberInput
              min={0}
              value={v.fulfilled}
              onChange={(val) => form.setFieldValue('fulfilled', val === '' ? '' : Number(val))}
              allowDecimal={false}
              allowNegative={false}
            />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>Невыполненные</div>
            <NumberInput
              min={0}
              value={v.unfulfilled}
              onChange={(val) => form.setFieldValue('unfulfilled', val === '' ? '' : Number(val))}
              allowDecimal={false}
              allowNegative={false}
            />
          </div>

          <div className={styles.totals}>
            Всего требований: {total}. При 0 оценка — «Не соответствует».
          </div>
        </Stack>
      </Card>

      <ResultPanel
        caption="Уровень соответствия"
        topRight={
          <span className={`${styles.levelChip} ${LEVEL_CLASS[result.level]}`}>
            {LEVEL_LABEL[result.level]}
          </span>
        }
        footer={
          <>
            {fulfilled} / {total || 0} · пороги: ≥95% полное, ≥60% частичное
          </>
        }
      >
        <div className={styles.percent}>
          <span>{result.percent}</span>
          <span className={styles.percentUnit}>%</span>
        </div>

        <div className={styles.barWrap}>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: `${Math.min(100, Math.max(0, result.percent))}%` }}
            />
          </div>
          <div className={styles.barMeta}>
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </ResultPanel>
    </div>
  );
}

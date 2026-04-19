'use client';

import { useMemo } from 'react';
import { SegmentedControl, Slider, Switch, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconShieldHalf } from '@tabler/icons-react';
import type { Severity } from '@prisma/client';
import { calculateRisk, severityWeight } from '@/lib/calculators';
import type { RiskLevel } from '@/lib/calculators';
import { Card } from '@/components/ui/Card';
import { ResultPanel } from '../_components/ResultPanel';
import type { ResultPanelTone } from '../_components/ResultPanel';
import styles from './page.module.scss';

interface RiskFormValues {
  severity: Severity;
  probability: number;
  impact: number;
  hasMitigation: boolean;
}

const SEVERITY_OPTIONS = [
  { label: 'LOW', value: 'LOW' },
  { label: 'MEDIUM', value: 'MEDIUM' },
  { label: 'HIGH', value: 'HIGH' },
  { label: 'CRITICAL', value: 'CRITICAL' },
];

const LEVEL_LABEL: Record<RiskLevel, string> = {
  low: 'низкий',
  medium: 'средний',
  high: 'высокий',
  critical: 'критический',
};

const LEVEL_CLASS: Record<RiskLevel, string> = {
  low: styles.levelLow,
  medium: styles.levelMedium,
  high: styles.levelHigh,
  critical: styles.levelCritical,
};

// свечение итогового балла растёт с уровнем риска — по нарастающей, чтобы critical сразу бросался в глаза
const TONE_BY_LEVEL: Record<RiskLevel, ResultPanelTone> = {
  low: 'slate',
  medium: 'blue',
  high: 'amber',
  critical: 'red',
};

const INTENSITY_BY_LEVEL: Record<RiskLevel, number> = {
  low: 0.15,
  medium: 0.4,
  high: 0.7,
  critical: 1,
};

export default function RiskCalculatorPage() {
  const form = useForm<RiskFormValues>({
    initialValues: {
      severity: 'MEDIUM',
      probability: 3,
      impact: 3,
      hasMitigation: false,
    },
  });

  const v = form.values;
  const result = useMemo(
    () =>
      calculateRisk({
        severity: v.severity,
        probability: v.probability,
        impact: v.impact,
        hasMitigation: v.hasMitigation,
      }),
    [v.severity, v.probability, v.impact, v.hasMitigation],
  );

  const weight = severityWeight[v.severity];
  const mitigationFactor = v.hasMitigation ? 0.5 : 1;

  return (
    <div className={styles.grid}>
      <Card className={styles.formCard}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>
            <IconShieldHalf size={18} />
          </span>
          Параметры риска
        </h3>

        <Stack gap="md">
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
            <div className={styles.sliderRow}>
              <span className={styles.label}>Вероятность</span>
              <span className={styles.sliderValue}>{v.probability}</span>
            </div>
            <Slider
              min={1}
              max={5}
              step={1}
              marks={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
              value={v.probability}
              onChange={(val) => form.setFieldValue('probability', val)}
            />
          </div>

          <div className={styles.field}>
            <div className={styles.sliderRow}>
              <span className={styles.label}>Воздействие</span>
              <span className={styles.sliderValue}>{v.impact}</span>
            </div>
            <Slider
              min={1}
              max={5}
              step={1}
              marks={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
              value={v.impact}
              onChange={(val) => form.setFieldValue('impact', val)}
            />
          </div>

          <div className={styles.switchWrap}>
            <div className={styles.switchMeta}>
              <span className={styles.switchTitle}>Есть компенсирующие меры</span>
              <span className={styles.switchHint}>снижает итоговый балл вдвое</span>
            </div>
            <Switch
              checked={v.hasMitigation}
              onChange={(e) => form.setFieldValue('hasMitigation', e.currentTarget.checked)}
              size="md"
            />
          </div>
        </Stack>
      </Card>

      <ResultPanel
        caption="Итоговый балл"
        tone={TONE_BY_LEVEL[result.level]}
        intensity={INTENSITY_BY_LEVEL[result.level]}
        topRight={
          <span className={`${styles.levelChip} ${LEVEL_CLASS[result.level]}`} key={result.level}>
            {LEVEL_LABEL[result.level]}
          </span>
        }
        footer={
          <>
            {weight} × {v.probability} × {v.impact} × {mitigationFactor} = {result.score}
          </>
        }
      >
        {/* key={level} перезапускает CSS-анимацию при переходе между уровнями */}
        <div className={styles.score} key={result.level}>
          {result.score}
        </div>
        <div className={styles.verbal}>
          Уровень риска:{' '}
          <span className={styles.verbalStrong} key={`v-${result.level}`}>
            {LEVEL_LABEL[result.level]}
          </span>
        </div>
      </ResultPanel>
    </div>
  );
}

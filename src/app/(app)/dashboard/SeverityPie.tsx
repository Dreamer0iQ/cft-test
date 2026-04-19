'use client';

import { memo, useMemo } from 'react';
import { DonutChart } from '@mantine/charts';
import styles from './SeverityPie.module.scss';

export interface SeverityDatum {
  name: string;
  value: number;
  color: string;
}

function SeverityPieImpl({ data }: { data: SeverityDatum[] }) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  if (total === 0) {
    return <div className={styles.empty}>Нет данных</div>;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.donutBox}>
        <DonutChart
          data={data}
          size={200}
          thickness={28}
          withTooltip
          tooltipDataSource="segment"
          withLabels={false}
          paddingAngle={2}
          strokeWidth={0}
          chartLabel=" "
        />
        <div className={styles.center}>
          <div className={styles.centerValue}>{total}</div>
          <div className={styles.centerLabel}>записей</div>
        </div>
      </div>

      <ul className={styles.legend}>
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <li key={d.name} className={styles.legendRow}>
              <span className={styles.dot} style={{ background: d.color }} />
              <span className={styles.legendLabel}>{d.name}</span>
              <span className={styles.legendCount}>{d.value}</span>
              <span className={styles.bar}>
                <span
                  className={styles.barFill}
                  style={{ width: `${pct}%`, background: d.color }}
                />
              </span>
              <span className={styles.legendPct}>{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export const SeverityPie = memo(SeverityPieImpl);

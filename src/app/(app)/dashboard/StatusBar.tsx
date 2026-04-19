'use client';

import { memo } from 'react';
import { BarChart } from '@mantine/charts';
import styles from './StatusBar.module.scss';

export interface StatusDatum {
  name: string;
  count: number;
}

function StatusBarImpl({ data }: { data: StatusDatum[] }) {
  const hasAny = data.some((d) => d.count > 0);
  if (!hasAny) return <div className={styles.empty}>Нет данных</div>;

  return (
    <div className={styles.wrap}>
      <BarChart
        data={data}
        dataKey="name"
        orientation="vertical"
        h={260}
        series={[{ name: 'count', color: '#7DF9FF', label: 'Кол-во' }]}
        withLegend={false}
        withTooltip
        gridColor="rgba(255,255,255,0.05)"
        textColor="rgba(230,243,246,0.65)"
        yAxisProps={{ width: 110 }}
        barProps={{ radius: 4 }}
        fillOpacity={0.85}
      />
    </div>
  );
}

export const StatusBar = memo(StatusBarImpl);

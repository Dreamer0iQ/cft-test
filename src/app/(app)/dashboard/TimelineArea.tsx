'use client';

import { memo } from 'react';
import { AreaChart } from '@mantine/charts';
import styles from './TimelineArea.module.scss';

export interface TimelineDatum {
  month: string;
  detected: number;
  resolved: number;
}

function TimelineAreaImpl({ data }: { data: TimelineDatum[] }) {
  return (
    <div className={styles.wrap}>
      <AreaChart
        h={300}
        data={data}
        dataKey="month"
        series={[
          { name: 'detected', color: '#FF5D8F', label: 'Обнаружено' },
          { name: 'resolved', color: '#7DF9FF', label: 'Устранено' },
        ]}
        curveType="monotone"
        withGradient
        withLegend
        withDots={false}
        strokeWidth={2}
        fillOpacity={0.25}
        gridColor="rgba(255,255,255,0.05)"
        textColor="rgba(230,243,246,0.65)"
        tooltipProps={{
          cursor: {
            stroke: '#7DF9FF',
            strokeWidth: 2,
            strokeOpacity: 0.85,
            strokeDasharray: '4 4',
          },
        }}
      />
    </div>
  );
}

export const TimelineArea = memo(TimelineAreaImpl);

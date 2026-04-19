'use client';

import { memo, useMemo } from 'react';
import styles from './SystemBar.module.scss';

export interface SystemDatum {
  name: string;
  count: number;
}

const HUES = [
  '#7DF9FF',
  '#5EEAF2',
  '#4DD2F2',
  '#3EB8E8',
  '#4D9FE0',
  '#6A88DC',
  '#8A75D3',
  '#A763C6',
  '#C053B5',
  '#D547A0',
];

function SystemBarImpl({ data }: { data: SystemDatum[] }) {
  const max = useMemo(() => Math.max(...data.map((d) => d.count), 1), [data]);

  if (!data.length) return <div className={styles.empty}>Нет данных</div>;

  return (
    <ul className={styles.list}>
      {data.map((d, i) => {
        const pct = (d.count / max) * 100;
        const color = HUES[i] ?? HUES[HUES.length - 1];
        return (
          <li key={d.name} className={styles.row}>
            <span className={styles.rank}>{String(i + 1).padStart(2, '0')}</span>
            <span className={styles.name}>{d.name}</span>
            <span className={styles.track}>
              <span
                className={styles.fill}
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
              />
            </span>
            <span className={styles.count}>{d.count}</span>
          </li>
        );
      })}
    </ul>
  );
}

export const SystemBar = memo(SystemBarImpl);

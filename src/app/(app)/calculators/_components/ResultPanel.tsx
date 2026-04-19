import type { CSSProperties } from 'react';
import { Card } from '@/components/ui/Card';
import styles from './ResultPanel.module.scss';

export type ResultPanelTone = 'cyan' | 'slate' | 'blue' | 'amber' | 'red';

interface ResultPanelProps {
  caption: string;
  topRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  tone?: ResultPanelTone;
  intensity?: number;
}

// CSS-переменные, а не новый класс на каждый тон — иначе переходы между тонами не анимировались бы
const TONE_RGB: Record<ResultPanelTone, string> = {
  cyan: '125, 249, 255',
  slate: '148, 163, 184',
  blue: '96, 165, 250',
  amber: '245, 158, 11',
  red: '239, 68, 68',
};

export function ResultPanel({
  caption,
  topRight,
  children,
  footer,
  tone = 'cyan',
  intensity = 0.5,
}: ResultPanelProps) {
  const styleVars = {
    '--tone-color': TONE_RGB[tone],
    '--tone-intensity': String(Math.max(0, Math.min(1, intensity))),
  } as CSSProperties;

  return (
    <Card className={styles.panel} style={styleVars}>
      <div className={styles.head}>
        <span className={styles.caption}>{caption}</span>
        {topRight}
      </div>
      <div className={styles.body}>{children}</div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </Card>
  );
}

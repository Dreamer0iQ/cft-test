import { memo } from 'react';
import { Badge } from '@mantine/core';
import type { Severity } from '@prisma/client';
import styles from './SeverityBadge.module.scss';

const LABEL: Record<Severity, string> = {
  LOW: 'Низкая',
  MEDIUM: 'Средняя',
  HIGH: 'Высокая',
  CRITICAL: 'Критическая',
};

function SeverityBadgeImpl({ severity }: { severity: Severity }) {
  return (
    <Badge variant="filled" radius="sm" className={`${styles.badge} ${styles[severity.toLowerCase()]}`}>
      {LABEL[severity]}
    </Badge>
  );
}

export const SeverityBadge = memo(SeverityBadgeImpl);

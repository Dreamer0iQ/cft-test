import { memo } from 'react';
import { Badge } from '@mantine/core';
import type { AuditStatus } from '@prisma/client';
import styles from './StatusBadge.module.scss';

const LABEL: Record<AuditStatus, string> = {
  NEW: 'Новый',
  IN_PROGRESS: 'В работе',
  UNDER_REVIEW: 'На проверке',
  RESOLVED: 'Решён',
  REJECTED: 'Отклонён',
  ACCEPTED_RISK: 'Принятый риск',
};

const CLASS: Record<AuditStatus, string> = {
  NEW: 'new',
  IN_PROGRESS: 'inprogress',
  UNDER_REVIEW: 'review',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
  ACCEPTED_RISK: 'accepted',
};

function StatusBadgeImpl({ status }: { status: AuditStatus }) {
  return (
    <Badge variant="filled" radius="sm" className={`${styles.badge} ${styles[CLASS[status]]}`}>
      {LABEL[status]}
    </Badge>
  );
}

export const StatusBadge = memo(StatusBadgeImpl);

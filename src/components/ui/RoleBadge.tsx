import { memo } from 'react';
import { Badge } from '@mantine/core';
import type { Role } from '@prisma/client';
import styles from './RoleBadge.module.scss';

const LABEL: Record<Role, string> = {
  ADMIN: 'Админ',
  L3: 'L3',
  L2: 'L2',
  L1: 'L1',
};

function RoleBadgeImpl({ role }: { role: Role }) {
  return (
    <Badge variant="filled" radius="sm" className={`${styles.badge} ${styles[role.toLowerCase()]}`}>
      {LABEL[role]}
    </Badge>
  );
}

export const RoleBadge = memo(RoleBadgeImpl);

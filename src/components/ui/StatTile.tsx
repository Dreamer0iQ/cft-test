import { memo } from 'react';
import { Group, Stack, Text } from '@mantine/core';
import { Card } from './Card';
import styles from './StatTile.module.scss';

export interface StatTileProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  accent?: boolean;
}

function StatTileImpl({ label, value, hint, icon, accent }: StatTileProps) {
  return (
    <Card className={styles.tile}>
      <Stack gap={8}>
        <Group justify="space-between" align="center">
          <Text className={styles.label}>{label}</Text>
          {icon ? <span className={styles.icon}>{icon}</span> : null}
        </Group>
        <Text className={`${styles.value} ${accent ? styles.glow : ''}`}>{value}</Text>
        {hint ? <Text className={styles.hint}>{hint}</Text> : null}
      </Stack>
    </Card>
  );
}

export const StatTile = memo(StatTileImpl);

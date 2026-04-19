import { Skeleton, Stack, Group } from '@mantine/core';
import { Card } from '@/components/ui/Card';

export default function Loading() {
  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Skeleton height={28} width={280} radius="sm" />
        <Skeleton height={14} width={140} radius="sm" />
      </Stack>

      <Card>
        <Group gap="sm" wrap="wrap">
          <Skeleton height={36} style={{ flex: '1 1 260px' }} radius="md" />
          <Skeleton height={36} style={{ flex: '1 1 180px' }} radius="md" />
          <Skeleton height={36} style={{ flex: '1 1 180px' }} radius="md" />
          <Skeleton height={36} style={{ flex: '1 1 180px' }} radius="md" />
          <Skeleton height={36} style={{ flex: '1 1 180px' }} radius="md" />
          <Skeleton height={36} style={{ flex: '1 1 220px' }} radius="md" />
        </Group>
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Stack gap={0}>
          <Skeleton height={44} radius={0} />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height={52} radius={0} style={{ opacity: 1 - i * 0.08 }} />
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}

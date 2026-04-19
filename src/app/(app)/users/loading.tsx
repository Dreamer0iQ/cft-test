import { Stack, Skeleton, Group } from '@mantine/core';
import { Card } from '@/components/ui/Card';

export default function Loading() {
  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <div>
          <Skeleton height={28} width={220} radius="sm" />
          <Skeleton height={14} width={260} radius="sm" mt={8} />
        </div>
        <Skeleton height={36} width={200} radius="sm" />
      </Group>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Stack gap={0}>
          <Skeleton height={42} radius={0} />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={52} radius={0} style={{ opacity: 0.55 }} />
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}

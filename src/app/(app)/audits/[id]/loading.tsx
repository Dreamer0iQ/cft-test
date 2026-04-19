import { Skeleton, Stack } from '@mantine/core';
import { Card } from '@/components/ui/Card';

export default function Loading() {
  return (
    <Stack gap="md">
      <Card>
        <Skeleton height={14} width={140} mb={14} />
        <Skeleton height={28} width="60%" mb={14} />
        <Skeleton height={20} width="40%" mb={10} />
        <Skeleton height={14} width="30%" />
      </Card>
      <Card>
        <Skeleton height={60} />
      </Card>
      <Card>
        <Skeleton height={180} />
      </Card>
    </Stack>
  );
}

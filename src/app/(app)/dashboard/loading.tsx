import { Stack, Skeleton, SimpleGrid } from '@mantine/core';

export default function DashboardLoading() {
  return (
    <Stack gap="lg">
      <Skeleton height={32} width={220} />
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <Skeleton height={104} radius={14} />
        <Skeleton height={104} radius={14} />
        <Skeleton height={104} radius={14} />
        <Skeleton height={104} radius={14} />
      </SimpleGrid>
      <Skeleton height={340} radius={14} />
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        <Skeleton height={320} radius={14} />
        <Skeleton height={320} radius={14} />
      </SimpleGrid>
      <Skeleton height={360} radius={14} />
    </Stack>
  );
}

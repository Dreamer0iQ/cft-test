import Link from 'next/link';
import { Button, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { Card } from '@/components/ui/Card';

export default function NotFound() {
  return (
    <Card>
      <Stack gap="sm" align="flex-start">
        <Title order={3}>Аудит не найден</Title>
        <Text c="dimmed" size="sm">
          Запрошенная запись отсутствует или была удалена.
        </Text>
        <Button
          component={Link}
          href="/audits"
          leftSection={<IconArrowLeft size={16} />}
          variant="light"
          color="cyan"
        >
          К списку аудитов
        </Button>
      </Stack>
    </Card>
  );
}

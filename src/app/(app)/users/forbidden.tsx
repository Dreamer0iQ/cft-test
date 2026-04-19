import { Stack, Title, Text, Button } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export default function Forbidden() {
  return (
    <Stack gap="md" align="center" justify="center" style={{ minHeight: '60vh' }}>
      <Card style={{ maxWidth: 440, textAlign: 'center', padding: 32 }}>
        <Stack gap="sm" align="center">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(125, 249, 255, 0.08)',
              border: '1px solid rgba(125, 249, 255, 0.25)',
              color: '#7DF9FF',
            }}
          >
            <IconLock size={26} />
          </div>
          <Title order={3} style={{ color: '#E6F3F6' }}>
            Нет доступа
          </Title>
          <Text c="dimmed" size="sm">
            Управление пользователями доступно только администраторам.
          </Text>
          <Button component={Link} href="/audits" color="cyan" variant="light" mt="xs">
            Вернуться к аудитам
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
}

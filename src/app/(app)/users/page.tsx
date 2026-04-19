import { redirect } from 'next/navigation';
import { Stack, Title, Text, Group } from '@mantine/core';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';
import { Card } from '@/components/ui/Card';
import { UsersTable } from './UsersTable';
import { CreateUserButton } from './CreateUserModal';
import { RolesInfoButton } from './RolesInfoButton';
import Forbidden from './forbidden';
import styles from './page.module.scss';

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  if (!can(session.user.role, 'user:manage')) {
    return <Forbidden />;
  }

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });

  const rows = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <Stack gap="md" className={styles.wrap}>
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2} className={styles.title}>
            Пользователи
          </Title>
          <Text c="dimmed" size="sm" mt={4}>
            Управление доступом и ролями
          </Text>
        </div>
        <Group gap="sm">
          <RolesInfoButton />
          <CreateUserButton />
        </Group>
      </Group>

      <Card className={styles.tableCard}>
        <UsersTable rows={rows} currentUserId={session.user.id} />
      </Card>
    </Stack>
  );
}

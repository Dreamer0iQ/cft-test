'use client';

import { Group, Menu, Text, UnstyledButton, Avatar } from '@mantine/core';
import { IconChevronDown, IconLogout } from '@tabler/icons-react';
import type { Role } from '@prisma/client';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { signOutAction } from '@/app/(auth)/actions';
import styles from './Header.module.scss';

export interface HeaderProps {
  title?: string;
  user: { name: string; email: string; role: Role };
}

export function Header({ title, user }: HeaderProps) {
  const initials =
    user.name
      .split(/\s+/)
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  return (
    <header className={styles.header}>
      <div className={styles.title}>
        {title ? <Text className={styles.titleText}>{title}</Text> : <span />}
      </div>

      <Group gap={8} wrap="nowrap">
        <ThemeToggle />

        <Menu position="bottom-end" shadow="md" width={220} withArrow arrowPosition="center">
          <Menu.Target>
            <UnstyledButton className={styles.userBtn}>
              <Group gap={10} wrap="nowrap">
                <Avatar size={32} radius="xl" color="cyan" className={styles.avatar}>
                  {initials}
                </Avatar>
                <div className={styles.userMeta}>
                  <Text className={styles.userName}>{user.name}</Text>
                  <RoleBadge role={user.role} />
                </div>
                <IconChevronDown size={14} className={styles.chev} />
              </Group>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown className={styles.menu}>
            <Menu.Label>{user.email}</Menu.Label>
            <form action={signOutAction}>
              <Menu.Item
                component="button"
                type="submit"
                leftSection={<IconLogout size={14} />}
                color="red"
              >
                Выйти
              </Menu.Item>
            </form>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </header>
  );
}

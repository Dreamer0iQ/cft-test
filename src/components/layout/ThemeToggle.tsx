'use client';

import { ActionIcon, Tooltip, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';
import styles from './ThemeToggle.module.scss';

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme('dark', { getInitialValueInEffect: true });
  const isDark = computed === 'dark';

  const toggle = () => setColorScheme(isDark ? 'light' : 'dark');

  return (
    <Tooltip
      label={isDark ? 'Светлая тема' : 'Тёмная тема'}
      position="bottom"
      withArrow
      arrowSize={6}
    >
      <ActionIcon
        variant="subtle"
        color="gray"
        size="lg"
        radius="md"
        aria-label={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
        onClick={toggle}
        className={styles.toggle}
      >
        {isDark ? <IconSun size={18} stroke={1.7} /> : <IconMoon size={18} stroke={1.7} />}
      </ActionIcon>
    </Tooltip>
  );
}

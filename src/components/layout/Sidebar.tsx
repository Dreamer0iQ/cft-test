'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Stack, Text, UnstyledButton, Collapse, Group } from '@mantine/core';
import {
  IconShieldHalf,
  IconLayoutDashboard,
  IconCalculator,
  IconUsers,
  IconChevronRight,
} from '@tabler/icons-react';
import type { Role } from '@prisma/client';
import styles from './Sidebar.module.scss';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const primary: NavItem[] = [
  { href: '/audits', label: 'Аудиты', icon: <IconShieldHalf size={18} /> },
  { href: '/dashboard', label: 'Дашборд', icon: <IconLayoutDashboard size={18} /> },
];

const calcChildren: { href: string; label: string }[] = [
  { href: '/calculators/risk', label: 'Риск' },
  { href: '/calculators/sla', label: 'SLA' },
  { href: '/calculators/compliance', label: 'Соответствие' },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [calcOpen, setCalcOpen] = useState(pathname.startsWith('/calculators'));

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandDot} />
        <span className={styles.brandText}>cft.audit</span>
      </div>

      <Stack gap={4} className={styles.nav}>
        {primary.map((it) => (
          <NavLink key={it.href} href={it.href} active={isActive(it.href)} icon={it.icon}>
            {it.label}
          </NavLink>
        ))}

        <UnstyledButton
          className={`${styles.link} ${pathname.startsWith('/calculators') ? styles.activeParent : ''}`}
          onClick={() => setCalcOpen((v) => !v)}
        >
          <Group gap={10} wrap="nowrap">
            <span className={styles.icon}>
              <IconCalculator size={18} />
            </span>
            <span className={styles.label}>Калькуляторы</span>
          </Group>
          <IconChevronRight
            size={14}
            className={`${styles.chev} ${calcOpen ? styles.chevOpen : ''}`}
          />
        </UnstyledButton>

        <Collapse in={calcOpen}>
          <Stack gap={2} className={styles.subNav}>
            {calcChildren.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className={`${styles.subLink} ${isActive(c.href) ? styles.subActive : ''}`}
              >
                {c.label}
              </Link>
            ))}
          </Stack>
        </Collapse>

        {role === 'ADMIN' && (
          <NavLink href="/users" active={isActive('/users')} icon={<IconUsers size={18} />}>
            Пользователи
          </NavLink>
        )}
      </Stack>

      <Text className={styles.footer}>v0.1 · scaffold</Text>
    </aside>
  );
}

function NavLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${styles.link} ${active ? styles.active : ''}`}>
      <Group gap={10} wrap="nowrap">
        <span className={styles.icon}>{icon}</span>
        <span className={styles.label}>{children}</span>
      </Group>
    </Link>
  );
}

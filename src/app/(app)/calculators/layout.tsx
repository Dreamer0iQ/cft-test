'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Title, Text } from '@mantine/core';
import { IconShieldHalf, IconClock, IconChecklist } from '@tabler/icons-react';
import styles from './layout.module.scss';

interface TabDef {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { href: '/calculators/risk', label: 'Риск', icon: <IconShieldHalf size={16} /> },
  { href: '/calculators/sla', label: 'SLA', icon: <IconClock size={16} /> },
  { href: '/calculators/compliance', label: 'Соответствие', icon: <IconChecklist size={16} /> },
];

export default function CalculatorsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <Title order={2} className={styles.title}>
          Калькуляторы
        </Title>
        <Text className={styles.hint}>
          Быстрые оценки риска, SLA и соответствия. Расчёт идёт на клиенте по формулам из{' '}
          <code>/lib/calculators</code> — ничего не сохраняется.
        </Text>
      </div>

      <div className={styles.tabsRow}>
        <nav className={styles.tabs} aria-label="Переключатель калькуляторов">
          {TABS.map((t) => {
            const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`${styles.tab} ${active ? styles.tabActive : ''}`}
              >
                <span className={styles.tabIcon}>{t.icon}</span>
                <span>{t.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div>{children}</div>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { Stack, Title, Text, SimpleGrid, Group } from '@mantine/core';
import {
  IconClipboardList,
  IconFlame,
  IconClock,
  IconAlertTriangle,
} from '@tabler/icons-react';
import type { Severity, AuditStatus } from '@prisma/client';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';
import { Card } from '@/components/ui/Card';
import { StatTile } from '@/components/ui/StatTile';
import { SeverityPie } from './SeverityPie';
import { StatusBar } from './StatusBar';
import { SystemBar } from './SystemBar';
import { TimelineArea } from './TimelineArea';
import styles from './page.module.scss';

// severity идёт в фиксированном порядке — стабильность графика и цветовой схемы
const SEVERITY_ORDER: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUS_ORDER: AuditStatus[] = [
  'NEW',
  'IN_PROGRESS',
  'UNDER_REVIEW',
  'RESOLVED',
  'REJECTED',
  'ACCEPTED_RISK',
];

const STATUS_LABEL: Record<AuditStatus, string> = {
  NEW: 'Новые',
  IN_PROGRESS: 'В работе',
  UNDER_REVIEW: 'На проверке',
  RESOLVED: 'Устранены',
  REJECTED: 'Отклонены',
  ACCEPTED_RISK: 'Принятый риск',
};

const SEVERITY_LABEL: Record<Severity, string> = {
  LOW: 'Низкая',
  MEDIUM: 'Средняя',
  HIGH: 'Высокая',
  CRITICAL: 'Критическая',
};

// стандартная security-палитра: LOW slate → CRITICAL red
const SEVERITY_COLOR: Record<Severity, string> = {
  LOW: '#64748B',
  MEDIUM: '#3B82F6',
  HIGH: '#F59E0B',
  CRITICAL: '#EF4444',
};

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function readableMonth(key: string): string {
  const [y, m] = key.split('-');
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const mi = Number(m) - 1;
  return `${months[mi] ?? m} ${String(y).slice(2)}`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = session.user.role;
  if (!can(role, 'dashboard:view')) redirect('/');

  const now = new Date();
  // нижняя граница — начало месяца 8 месяцев назад, итого 9 букетов
  const timelineFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 8, 1));

  const extended = can(role, 'analytics:extended');

  const [
    totalCount,
    openCount,
    overdueCount,
    criticalOpenCount,
    severityGroup,
    statusGroup,
    systemGroup,
    timelineRows,
    riskBySeverity,
  ] = await Promise.all([
    prisma.auditResult.count(),
    prisma.auditResult.count({ where: { status: { not: 'RESOLVED' } } }),
    prisma.auditResult.count({
      where: {
        status: { not: 'RESOLVED' },
        dueDate: { lt: now },
      },
    }),
    prisma.auditResult.count({
      where: { severity: 'CRITICAL', status: { not: 'RESOLVED' } },
    }),
    prisma.auditResult.groupBy({ by: ['severity'], _count: { _all: true } }),
    prisma.auditResult.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.auditResult.groupBy({
      by: ['systemId'],
      _count: { _all: true },
      orderBy: { _count: { systemId: 'desc' } },
      take: 10,
    }),
    prisma.auditResult.findMany({
      where: {
        OR: [
          { detectedAt: { gte: timelineFrom } },
          { resolvedAt: { gte: timelineFrom } },
        ],
      },
      select: { detectedAt: true, resolvedAt: true },
    }),
    extended
      ? prisma.auditResult.groupBy({
          by: ['severity'],
          _avg: { riskScore: true },
        })
      : Promise.resolve([] as { severity: Severity; _avg: { riskScore: number | null } }[]),
  ]);

  const severityData = SEVERITY_ORDER.map((sev) => {
    const row = severityGroup.find((r) => r.severity === sev);
    return {
      name: SEVERITY_LABEL[sev],
      value: row?._count._all ?? 0,
      color: SEVERITY_COLOR[sev],
    };
  });

  const statusData = STATUS_ORDER.map((st) => {
    const row = statusGroup.find((r) => r.status === st);
    return {
      name: STATUS_LABEL[st],
      count: row?._count._all ?? 0,
    };
  });

  const systemIds = systemGroup.map((s) => s.systemId);
  const systems = systemIds.length
    ? await prisma.system.findMany({
        where: { id: { in: systemIds } },
        select: { id: true, name: true },
      })
    : [];
  const systemNameById = new Map(systems.map((s) => [s.id, s.name]));
  const systemData = systemGroup.map((s) => ({
    name: systemNameById.get(s.systemId) ?? '—',
    count: s._count._all,
  }));

  // месяц группируется на сервере, чтобы клиент не получал 50+ записей
  const buckets = new Map<string, { detected: number; resolved: number }>();
  for (let i = 8; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.set(monthKey(d), { detected: 0, resolved: 0 });
  }
  for (const r of timelineRows) {
    if (r.detectedAt && r.detectedAt >= timelineFrom) {
      const k = monthKey(r.detectedAt);
      const b = buckets.get(k);
      if (b) b.detected += 1;
    }
    if (r.resolvedAt && r.resolvedAt >= timelineFrom) {
      const k = monthKey(r.resolvedAt);
      const b = buckets.get(k);
      if (b) b.resolved += 1;
    }
  }
  const timelineData = Array.from(buckets.entries()).map(([k, v]) => ({
    month: readableMonth(k),
    detected: v.detected,
    resolved: v.resolved,
  }));

  const riskRows = extended
    ? SEVERITY_ORDER.map((sev) => {
        const row = riskBySeverity.find((r) => r.severity === sev);
        const avg = row?._avg.riskScore ?? 0;
        return { severity: sev, label: SEVERITY_LABEL[sev], avg };
      })
    : [];

  return (
    <Stack gap="lg" className={styles.wrap}>
      <div>
        <Title order={2} className={styles.title}>
          Дашборд
        </Title>
        <Text c="dimmed" size="sm" mt={4}>
          Сводная аналитика по аудитам
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <StatTile
          label="Всего записей"
          value={totalCount}
          icon={<IconClipboardList size={22} />}
        />
        <StatTile
          label="Открытых"
          value={openCount}
          icon={<IconFlame size={22} />}
          accent
        />
        <StatTile
          label="Просрочено"
          value={overdueCount}
          icon={<IconClock size={22} />}
        />
        <StatTile
          label="Критичных открытых"
          value={criticalOpenCount}
          icon={<IconAlertTriangle size={22} />}
          accent
        />
      </SimpleGrid>

      <Card className={styles.headlineCard}>
        <Group justify="space-between" align="flex-start" mb="sm">
          <div>
            <Text className={styles.panelTitle}>Динамика обнаружения и устранения</Text>
            <Text size="xs" c="dimmed">
              За последние 9 месяцев
            </Text>
          </div>
        </Group>
        <TimelineArea data={timelineData} />
      </Card>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        <Card>
          <Text className={styles.panelTitle} mb="sm">
            Распределение по критичности
          </Text>
          <SeverityPie data={severityData} />
        </Card>
        <Card>
          <Text className={styles.panelTitle} mb="sm">
            Распределение по статусам
          </Text>
          <StatusBar data={statusData} />
        </Card>
      </SimpleGrid>

      <Card>
        <Text className={styles.panelTitle} mb="sm">
          Топ-10 систем по количеству записей
        </Text>
        <SystemBar data={systemData} />
      </Card>

      {extended && (
        <Card>
          <Text className={styles.panelTitle} mb="sm">
            Расширенная аналитика
          </Text>
          <Text size="xs" c="dimmed" mb="md">
            Средний risk-score по уровням критичности
          </Text>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            {riskRows.map((r) => (
              <div key={r.severity} className={styles.riskTile}>
                <Text className={styles.riskLabel}>{r.label}</Text>
                <Text className={styles.riskValue}>{r.avg.toFixed(2)}</Text>
              </div>
            ))}
          </SimpleGrid>
        </Card>
      )}
    </Stack>
  );
}

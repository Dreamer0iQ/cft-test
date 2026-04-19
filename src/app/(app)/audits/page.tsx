import { redirect } from 'next/navigation';
import { Stack, Title, Text, Group } from '@mantine/core';
import type { Prisma, Severity, AuditStatus } from '@prisma/client';
import { auth } from '@/server/auth';
import { prisma } from '@/lib/prisma';
import { severityWeight } from '@/lib/calculators';
import { Card } from '@/components/ui/Card';
import { AuditsToolbar } from './AuditsToolbar';
import { AuditTable } from './AuditTable';
import { Pagination } from './Pagination';
import styles from './page.module.scss';

const PAGE_SIZE = 20;

const SEVERITY_VALUES: readonly Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUS_VALUES: readonly AuditStatus[] = [
  'NEW',
  'IN_PROGRESS',
  'UNDER_REVIEW',
  'RESOLVED',
  'REJECTED',
  'ACCEPTED_RISK',
];
const SORT_VALUES = ['detectedAt', 'dueDate', 'severity', 'status', 'riskScore', 'title'] as const;
type SortKey = (typeof SORT_VALUES)[number];

type SearchParams = Record<string, string | string[] | undefined>;

interface PageProps {
  searchParams: SearchParams;
}

function firstValue(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function parseCsv<T extends string>(v: string | string[] | undefined, allowed: readonly T[]): T[] {
  const raw = firstValue(v);
  if (!raw) return [];
  const set = new Set(allowed);
  return raw
    .split(',')
    .map((x) => x.trim())
    .filter((x): x is T => (set as Set<string>).has(x));
}

function parseStringsCsv(v: string | string[] | undefined): string[] {
  const raw = firstValue(v);
  if (!raw) return [];
  return raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseDate(v: string | string[] | undefined): Date | null {
  const raw = firstValue(v);
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function parsePage(v: string | string[] | undefined): number {
  const raw = firstValue(v);
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function parseSort(v: string | string[] | undefined): SortKey {
  const raw = firstValue(v);
  return (SORT_VALUES as readonly string[]).includes(raw ?? '')
    ? (raw as SortKey)
    : 'detectedAt';
}

function parseOrder(v: string | string[] | undefined): 'asc' | 'desc' {
  const raw = firstValue(v);
  return raw === 'asc' ? 'asc' : 'desc';
}

export default async function AuditsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect('/login');

  const q = firstValue(searchParams.q)?.trim() ?? '';
  const severity = parseCsv(searchParams.severity, SEVERITY_VALUES);
  const status = parseCsv(searchParams.status, STATUS_VALUES);
  const systemIds = parseStringsCsv(searchParams.systemId);
  const responsibleIds = parseStringsCsv(searchParams.responsibleId);
  const from = parseDate(searchParams.from);
  const to = parseDate(searchParams.to);
  const sort = parseSort(searchParams.sort);
  const order = parseOrder(searchParams.order);
  const page = parsePage(searchParams.page);

  const where: Prisma.AuditResultWhereInput = {};

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (severity.length) where.severity = { in: severity };
  if (status.length) where.status = { in: status };
  if (systemIds.length) where.systemId = { in: systemIds };
  if (responsibleIds.length) where.responsibleId = { in: responsibleIds };
  if (from || to) {
    where.detectedAt = {};
    if (from) where.detectedAt.gte = from;
    if (to) where.detectedAt.lte = to;
  }

  // severity сортируется по весу из calculators, не алфавитно по enum
  const useSeveritySort = sort === 'severity';

  const orderBy: Prisma.AuditResultOrderByWithRelationInput | undefined = useSeveritySort
    ? undefined
    : { [sort]: order };

  const skip = (page - 1) * PAGE_SIZE;

  const [rowsRaw, total, systems, users] = await Promise.all([
    useSeveritySort
      ? prisma.auditResult.findMany({
          where,
          include: { system: true, responsible: true },
        })
      : prisma.auditResult.findMany({
          where,
          orderBy,
          skip,
          take: PAGE_SIZE,
          include: { system: true, responsible: true },
        }),
    prisma.auditResult.count({ where }),
    prisma.system.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({
      where: { role: { in: ['L1', 'L2', 'L3'] } },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const rows = useSeveritySort
    ? rowsRaw
        .slice()
        .sort((a, b) => {
          const diff = severityWeight[a.severity] - severityWeight[b.severity];
          return order === 'asc' ? diff : -diff;
        })
        .slice(skip, skip + PAGE_SIZE)
    : rowsRaw;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const tableRows = rows.map((r) => ({
    id: r.id,
    title: r.title,
    systemName: r.system?.name ?? '—',
    category: r.category,
    severity: r.severity,
    status: r.status,
    responsibleName: r.responsible?.name ?? null,
    detectedAt: r.detectedAt.toISOString(),
    dueDate: r.dueDate ? r.dueDate.toISOString() : null,
    riskScore: r.riskScore,
  }));

  return (
    <Stack gap="md" className={styles.wrap}>
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2} className={styles.title}>
            Результаты аудитов
          </Title>
          <Text c="dimmed" size="sm" mt={4}>
            Найдено {total} записей
          </Text>
        </div>
      </Group>

      <Card>
        <AuditsToolbar
          systems={systems}
          users={users}
          initial={{
            q,
            severity,
            status,
            systemId: systemIds,
            responsibleId: responsibleIds,
            from: from ? from.toISOString() : null,
            to: to ? to.toISOString() : null,
          }}
        />
      </Card>

      <Card className={styles.tableCard}>
        <AuditTable rows={tableRows} sort={sort} order={order} />
      </Card>

      <Pagination page={page} totalPages={totalPages} />
    </Stack>
  );
}

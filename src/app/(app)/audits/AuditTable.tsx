'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Table, Text } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import type { Severity, AuditStatus } from '@prisma/client';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import styles from './AuditTable.module.scss';

type SortKey = 'detectedAt' | 'dueDate' | 'severity' | 'status' | 'riskScore' | 'title';

export interface AuditRow {
  id: string;
  title: string;
  systemName: string;
  category: string;
  severity: Severity;
  status: AuditStatus;
  responsibleName: string | null;
  detectedAt: string;
  dueDate: string | null;
  riskScore: number;
}

interface Props {
  rows: AuditRow[];
  sort: SortKey;
  order: 'asc' | 'desc';
}

interface ColumnDef {
  key: string;
  label: string;
  sortKey?: SortKey;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'id', label: 'ID', width: '110px' },
  { key: 'title', label: 'Название', sortKey: 'title' },
  { key: 'system', label: 'Система' },
  { key: 'category', label: 'Категория' },
  { key: 'severity', label: 'Критичность', sortKey: 'severity' },
  { key: 'status', label: 'Статус', sortKey: 'status' },
  { key: 'responsible', label: 'Ответственный' },
  { key: 'detectedAt', label: 'Обнаружено', sortKey: 'detectedAt' },
  { key: 'dueDate', label: 'Срок', sortKey: 'dueDate' },
  { key: 'riskScore', label: 'Риск', sortKey: 'riskScore', align: 'right' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function AuditTable({ rows, sort, order }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const toggleSort = useCallback(
    (key: SortKey) => {
      const params = new URLSearchParams(searchParams.toString());
      if (sort === key) {
        params.set('order', order === 'asc' ? 'desc' : 'asc');
      } else {
        params.set('sort', key);
        params.set('order', 'asc');
      }
      params.delete('page');
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [order, pathname, router, searchParams, sort],
  );

  const goTo = useCallback(
    (id: string) => {
      router.push(`/audits/${id}`);
    },
    [router],
  );

  // прогреваем RSC-пейлоад карточки по ховеру — пропадает ощущение пролага при переходе
  const prefetch = useCallback(
    (id: string) => {
      router.prefetch(`/audits/${id}`);
    },
    [router],
  );

  return (
    <div className={styles.wrap}>
      <Table
        highlightOnHover={false}
        verticalSpacing="sm"
        horizontalSpacing="md"
        className={styles.table}
        withRowBorders={false}
      >
        <Table.Thead className={styles.thead}>
          <Table.Tr>
            {COLUMNS.map((col) => {
              const sortable = Boolean(col.sortKey);
              const active = col.sortKey === sort;
              return (
                <Table.Th
                  key={col.key}
                  style={{ width: col.width, textAlign: col.align ?? 'left' }}
                  className={`${styles.th} ${sortable ? styles.sortable : ''} ${active ? styles.active : ''}`}
                  onClick={sortable && col.sortKey ? () => toggleSort(col.sortKey!) : undefined}
                >
                  <span className={styles.thInner}>
                    {col.label}
                    {sortable && active ? (
                      order === 'asc' ? (
                        <IconChevronUp size={14} />
                      ) : (
                        <IconChevronDown size={14} />
                      )
                    ) : null}
                  </span>
                </Table.Th>
              );
            })}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={COLUMNS.length} className={styles.empty}>
                <Text c="dimmed" ta="center" py="xl">
                  Ничего не найдено
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            rows.map((r) => (
              <Table.Tr
                key={r.id}
                className={styles.row}
                onClick={() => goTo(r.id)}
                onMouseEnter={() => prefetch(r.id)}
                onFocus={() => prefetch(r.id)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') goTo(r.id);
                }}
              >
                <Table.Td>
                  <span className={styles.id}>{r.id.slice(0, 8)}</span>
                </Table.Td>
                <Table.Td className={styles.titleCell}>{r.title}</Table.Td>
                <Table.Td className={styles.muted}>{r.systemName}</Table.Td>
                <Table.Td className={styles.muted}>{r.category}</Table.Td>
                <Table.Td>
                  <SeverityBadge severity={r.severity} />
                </Table.Td>
                <Table.Td>
                  <StatusBadge status={r.status} />
                </Table.Td>
                <Table.Td className={styles.muted}>{r.responsibleName ?? '—'}</Table.Td>
                <Table.Td className={styles.date}>{formatDate(r.detectedAt)}</Table.Td>
                <Table.Td className={styles.date}>{formatDate(r.dueDate)}</Table.Td>
                <Table.Td className={styles.risk}>{r.riskScore.toFixed(2)}</Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
}

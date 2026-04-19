'use client';

import { useState, useTransition } from 'react';
import { Table, Select, LoadingOverlay, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import type { Role } from '@prisma/client';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { updateUserRole } from './actions';
import styles from './UsersTable.module.scss';

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

interface Props {
  rows: UserRow[];
  currentUserId: string;
}

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'ADMIN', label: 'Админ' },
  { value: 'L3', label: 'L3' },
  { value: 'L2', label: 'L2' },
  { value: 'L1', label: 'L1' },
];

const ROLE_SET: ReadonlySet<Role> = new Set<Role>(['ADMIN', 'L3', 'L2', 'L1']);

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function errorMessage(code: string): string {
  switch (code) {
    case 'unauthorized':
      return 'Не авторизовано';
    case 'forbidden':
      return 'Недостаточно прав';
    case 'cannot_change_own_role':
      return 'Нельзя менять собственную роль';
    case 'not_found':
      return 'Пользователь не найден';
    default:
      return 'Не удалось обновить роль';
  }
}

export function UsersTable({ rows, currentUserId }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const onRoleChange = (userId: string, next: string | null) => {
    if (!next || !ROLE_SET.has(next as Role)) return;
    setPendingId(userId);
    startTransition(async () => {
      const res = await updateUserRole(userId, next as Role);
      setPendingId(null);
      if (res.ok) {
        notifications.show({ color: 'teal', message: 'Роль обновлена' });
      } else {
        notifications.show({ color: 'red', message: errorMessage(res.error) });
      }
    });
  };

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
            <Table.Th className={styles.th}>Имя</Table.Th>
            <Table.Th className={styles.th}>Email</Table.Th>
            <Table.Th className={styles.th} style={{ width: 220 }}>
              Роль
            </Table.Th>
            <Table.Th className={styles.th} style={{ width: 160 }}>
              Создан
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={4} className={styles.empty}>
                <Text c="dimmed" ta="center" py="xl">
                  Нет пользователей
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            rows.map((r) => {
              const isSelf = r.id === currentUserId;
              const loading = pendingId === r.id;
              return (
                <Table.Tr key={r.id} className={styles.row}>
                  <Table.Td className={styles.nameCell}>
                    <span className={styles.name}>{r.name}</span>
                    {isSelf ? <span className={styles.youTag}>вы</span> : null}
                  </Table.Td>
                  <Table.Td className={styles.muted}>{r.email}</Table.Td>
                  <Table.Td className={styles.roleCell}>
                    <div className={styles.roleWrap}>
                      <LoadingOverlay
                        visible={loading}
                        zIndex={2}
                        overlayProps={{ blur: 1, backgroundOpacity: 0.35 }}
                      />
                      {isSelf ? (
                        <RoleBadge role={r.role} />
                      ) : (
                        <Select
                          value={r.role}
                          data={ROLE_OPTIONS}
                          onChange={(v) => onRoleChange(r.id, v)}
                          allowDeselect={false}
                          checkIconPosition="right"
                          size="xs"
                          className={styles.select}
                          comboboxProps={{ withinPortal: true }}
                          disabled={loading}
                        />
                      )}
                    </div>
                  </Table.Td>
                  <Table.Td className={styles.date}>{formatDate(r.createdAt)}</Table.Td>
                </Table.Tr>
              );
            })
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
}

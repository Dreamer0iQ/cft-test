'use client';

import { useState } from 'react';
import { Button, Modal, Stack } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import type { Role } from '@prisma/client';
import { RoleBadge } from '@/components/ui/RoleBadge';
import styles from './RolesInfoButton.module.scss';

interface RoleSpec {
  role: Role;
  title: string;
  summary: string;
  capabilities: string[];
}

const ROLES: RoleSpec[] = [
  {
    role: 'ADMIN',
    title: 'Администратор',
    summary: 'Полный доступ. Управление пользователями и ролями.',
    capabilities: [
      'Все возможности L3',
      'Создание пользователей и смена ролей',
      'Доступ ко всем разделам сервиса',
    ],
  },
  {
    role: 'L3',
    title: 'Эксперт',
    summary: 'Экспертная оценка и подтверждение критичных решений.',
    capabilities: [
      'Все возможности L2',
      'Изменение критичности записей',
      'Подтверждение финального решения по аудиту',
      'Доступ к расширенной аналитике на дашборде',
    ],
  },
  {
    role: 'L2',
    title: 'Аналитик',
    summary: 'Уточнение, анализ, изменение статуса.',
    capabilities: [
      'Все возможности L1',
      'Изменение статуса записи',
      'Добавление комментариев',
      'Редактирование аналитических полей',
    ],
  },
  {
    role: 'L1',
    title: 'Первая линия',
    summary: 'Первичный просмотр и обработка.',
    capabilities: [
      'Просмотр списка результатов аудита',
      'Поиск, фильтрация, сортировка',
      'Просмотр карточки записи',
      'Работа с дашбордом и калькуляторами',
    ],
  },
];

export function RolesInfoButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="default"
        leftSection={<IconInfoCircle size={16} />}
        onClick={() => setOpen(true)}
      >
        Права ролей
      </Button>

      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title="Матрица прав"
        size="lg"
        centered
        classNames={{ content: styles.modalContent, header: styles.modalHeader }}
      >
        <Stack gap="md">
          {ROLES.map((r) => (
            <div key={r.role} className={styles.roleBlock}>
              <div className={styles.roleHead}>
                <RoleBadge role={r.role} />
                <div className={styles.roleTitle}>{r.title}</div>
              </div>
              <div className={styles.roleSummary}>{r.summary}</div>
              <ul className={styles.caps}>
                {r.capabilities.map((cap) => (
                  <li key={cap} className={styles.cap}>
                    {cap}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Stack>
      </Modal>
    </>
  );
}

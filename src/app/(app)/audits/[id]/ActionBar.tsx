'use client';

import { memo, useCallback, useMemo, useState, useTransition } from 'react';
import {
  Select,
  Button,
  Modal,
  Group,
  Text,
  Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCircleCheck } from '@tabler/icons-react';
import type { AuditStatus, Severity, Role } from '@prisma/client';
import { can } from '@/lib/rbac';
import { Card } from '@/components/ui/Card';
import { updateStatus, updateSeverity, confirmFinal } from './actions';
import styles from './ActionBar.module.scss';

interface Props {
  auditId: string;
  status: AuditStatus;
  severity: Severity;
  role: Role;
}

const STATUS_OPTIONS: Array<{ value: AuditStatus; label: string }> = [
  { value: 'NEW', label: 'Новый' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'UNDER_REVIEW', label: 'На проверке' },
  { value: 'RESOLVED', label: 'Решён' },
  { value: 'REJECTED', label: 'Отклонён' },
  { value: 'ACCEPTED_RISK', label: 'Принятый риск' },
];

const SEVERITY_OPTIONS: Array<{ value: Severity; label: string }> = [
  { value: 'LOW', label: 'Низкая' },
  { value: 'MEDIUM', label: 'Средняя' },
  { value: 'HIGH', label: 'Высокая' },
  { value: 'CRITICAL', label: 'Критическая' },
];

function ActionBarImpl({ auditId, status, severity, role }: Props) {
  const perms = useMemo(
    () => ({
      status: can(role, 'audit:status:update'),
      severity: can(role, 'audit:severity:update'),
      confirm: can(role, 'audit:confirm:final'),
    }),
    [role],
  );

  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sevModalOpen, setSevModalOpen] = useState(false);
  const [pendingSeverity, setPendingSeverity] = useState<Severity | null>(null);
  const [severityReason, setSeverityReason] = useState('');

  const onStatusChange = useCallback(
    (value: string | null) => {
      if (!value || value === status) return;
      startTransition(async () => {
        const res = await updateStatus(auditId, value as AuditStatus);
        notifications.show(
          res.ok
            ? { color: 'cyan', title: 'Статус обновлён', message: '' }
            : { color: 'red', title: 'Ошибка', message: res.error },
        );
      });
    },
    [auditId, status],
  );

  const onSeveritySelect = useCallback(
    (value: string | null) => {
      if (!value || value === severity) return;
      setPendingSeverity(value as Severity);
      setSeverityReason('');
      setSevModalOpen(true);
    },
    [severity],
  );

  const submitSeverity = useCallback(() => {
    if (!pendingSeverity) return;
    const reason = severityReason.trim();
    if (reason.length < 3) {
      notifications.show({
        color: 'red',
        title: 'Укажите причину',
        message: 'Минимум 3 символа',
      });
      return;
    }
    startTransition(async () => {
      const res = await updateSeverity(auditId, pendingSeverity, reason);
      if (res.ok) {
        notifications.show({ color: 'cyan', title: 'Критичность обновлена', message: '' });
        setSevModalOpen(false);
        setPendingSeverity(null);
        setSeverityReason('');
      } else {
        notifications.show({ color: 'red', title: 'Ошибка', message: res.error });
      }
    });
  }, [auditId, pendingSeverity, severityReason]);

  const onConfirm = useCallback(() => {
    startTransition(async () => {
      const res = await confirmFinal(auditId);
      if (res.ok) {
        notifications.show({ color: 'cyan', title: 'Решение подтверждено', message: '' });
        setConfirmOpen(false);
      } else {
        notifications.show({ color: 'red', title: 'Ошибка', message: res.error });
      }
    });
  }, [auditId]);

  const closeSevModal = useCallback(() => {
    setSevModalOpen(false);
    setPendingSeverity(null);
  }, []);

  const openConfirm = useCallback(() => setConfirmOpen(true), []);
  const closeConfirm = useCallback(() => setConfirmOpen(false), []);
  const onReasonChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => setSeverityReason(e.currentTarget.value),
    [],
  );

  if (!perms.status && !perms.severity && !perms.confirm) return null;

  return (
    <Card className={styles.bar}>
      <div className={styles.actions}>
        {perms.status && (
          <div className={styles.field}>
            <span className={styles.label}>Статус</span>
            <Select
              data={STATUS_OPTIONS}
              value={status}
              onChange={onStatusChange}
              disabled={pending}
              allowDeselect={false}
              comboboxProps={{ withinPortal: true }}
              className={styles.select}
            />
          </div>
        )}

        {perms.severity && (
          <div className={styles.field}>
            <span className={styles.label}>Критичность</span>
            <Select
              data={SEVERITY_OPTIONS}
              value={severity}
              onChange={onSeveritySelect}
              disabled={pending}
              allowDeselect={false}
              comboboxProps={{ withinPortal: true }}
              className={styles.select}
            />
          </div>
        )}

        {perms.confirm && (
          <Button
            color="cyan"
            variant="light"
            leftSection={<IconCircleCheck size={16} />}
            onClick={openConfirm}
            disabled={pending || status === 'RESOLVED'}
            className={styles.confirmBtn}
          >
            Подтвердить решение
          </Button>
        )}
      </div>

      <Modal opened={confirmOpen} onClose={closeConfirm} title="Подтверждение решения" centered>
        <Text size="sm" c="dimmed">
          Аудит будет переведён в статус «Решён». Дата устранения — сейчас. Продолжить?
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeConfirm} disabled={pending}>
            Отмена
          </Button>
          <Button color="cyan" onClick={onConfirm} loading={pending}>
            Подтвердить
          </Button>
        </Group>
      </Modal>

      <Modal opened={sevModalOpen} onClose={closeSevModal} title="Смена критичности" centered>
        <Text size="sm" c="dimmed" mb="sm">
          Укажите причину смены критичности. Это попадёт в историю изменений.
        </Text>
        <Textarea
          value={severityReason}
          onChange={onReasonChange}
          placeholder="Причина..."
          autosize
          minRows={3}
          maxRows={6}
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeSevModal} disabled={pending}>
            Отмена
          </Button>
          <Button color="cyan" onClick={submitSeverity} loading={pending}>
            Сохранить
          </Button>
        </Group>
      </Modal>
    </Card>
  );
}

export const ActionBar = memo(ActionBarImpl);

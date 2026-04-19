'use client';

import { memo } from 'react';
import { Timeline } from '@mantine/core';
import {
  IconMessage,
  IconActivity,
  IconAlertTriangle,
  IconCircleCheck,
  IconArrowRight,
  IconPencil,
} from '@tabler/icons-react';
import type { ActivityLog, User } from '@prisma/client';
import { Card } from '@/components/ui/Card';
import styles from './ActivityTimeline.module.scss';

interface Props {
  logs: Array<ActivityLog & { actor: User }>;
}

const ACTION_LABEL: Record<string, string> = {
  comment_added: 'добавил(а) комментарий',
  status_changed: 'сменил(а) статус',
  severity_changed: 'сменил(а) критичность',
  confirmed_final: 'подтвердил(а) решение',
  created: 'создал(а) аудит',
  updated: 'обновил(а) аудит',
};

function iconFor(action: string) {
  switch (action) {
    case 'comment_added':
      return <IconMessage size={12} />;
    case 'status_changed':
      return <IconArrowRight size={12} />;
    case 'severity_changed':
      return <IconAlertTriangle size={12} />;
    case 'confirmed_final':
      return <IconCircleCheck size={12} />;
    case 'updated':
      return <IconPencil size={12} />;
    default:
      return <IconActivity size={12} />;
  }
}

function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  }).format(d);
}

const TimelineRow = memo(function TimelineRow({
  log,
}: {
  log: ActivityLog & { actor: User };
}) {
  const label = ACTION_LABEL[log.action] ?? log.action;
  return (
    <Timeline.Item
      bullet={iconFor(log.action)}
      title={
        <span className={styles.title}>
          <span className={styles.actor}>{log.actor.name}</span>
          <span className={styles.action}> {label}</span>
        </span>
      }
    >
      {log.field && (log.oldValue || log.newValue) && (
        <div className={styles.diff}>
          <span className={styles.field}>{log.field}:</span>{' '}
          <span className={styles.old}>{log.oldValue ?? '—'}</span>
          <span className={styles.arrow}> → </span>
          <span className={styles.new}>{log.newValue ?? '—'}</span>
        </div>
      )}
      <div className={styles.time}>{formatDateTime(log.createdAt)}</div>
    </Timeline.Item>
  );
});

function ActivityTimelineImpl({ logs }: Props) {
  return (
    <Card>
      <h3 className={styles.sectionTitle}>История</h3>
      {logs.length === 0 ? (
        <div className={styles.empty}>Событий пока нет</div>
      ) : (
        <Timeline active={logs.length} bulletSize={20} lineWidth={1} color="cyan">
          {logs.map((log) => (
            <TimelineRow key={log.id} log={log} />
          ))}
        </Timeline>
      )}
    </Card>
  );
}

export const ActivityTimeline = memo(ActivityTimelineImpl);

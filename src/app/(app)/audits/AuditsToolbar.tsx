'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Group, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconSearch, IconX } from '@tabler/icons-react';
import type { Role } from '@prisma/client';
import { FilterPopover } from './FilterPopover';
import styles from './AuditsToolbar.module.scss';

interface SystemOption {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  name: string;
  role: Role;
}

interface Initial {
  q: string;
  severity: string[];
  status: string[];
  systemId: string[];
  responsibleId: string[];
  from: string | null;
  to: string | null;
}

interface Props {
  systems: SystemOption[];
  users: UserOption[];
  initial: Initial;
}

const SEVERITY_OPTIONS = [
  { value: 'LOW', label: 'Низкая' },
  { value: 'MEDIUM', label: 'Средняя' },
  { value: 'HIGH', label: 'Высокая' },
  { value: 'CRITICAL', label: 'Критическая' },
];

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'Новый' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'UNDER_REVIEW', label: 'На проверке' },
  { value: 'RESOLVED', label: 'Решён' },
  { value: 'REJECTED', label: 'Отклонён' },
  { value: 'ACCEPTED_RISK', label: 'Принятый риск' },
];

export function AuditsToolbar({ systems, users, initial }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(initial.q);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const systemOptions = useMemo(
    () => systems.map((s) => ({ value: s.id, label: s.name })),
    [systems],
  );

  const userOptions = useMemo(
    () => users.map((u) => ({ value: u.id, label: `${u.name} · ${u.role}` })),
    [users],
  );

  const fromDate = initial.from ? new Date(initial.from) : null;
  const toDate = initial.to ? new Date(initial.to) : null;

  const buildParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      // сброс page при любом изменении фильтра
      params.delete('page');
      return params;
    },
    [searchParams],
  );

  const push = useCallback(
    (params: URLSearchParams) => {
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router],
  );

  const setCsv = useCallback(
    (key: string, values: string[]) => {
      const params = buildParams((p) => {
        if (values.length) p.set(key, values.join(','));
        else p.delete(key);
      });
      push(params);
    },
    [buildParams, push],
  );

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q === initial.q) return;
    searchTimer.current = setTimeout(() => {
      const params = buildParams((p) => {
        if (q.trim()) p.set('q', q.trim());
        else p.delete('q');
      });
      push(params);
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const onDateRange = (value: [Date | null, Date | null]) => {
    const [f, t] = value;
    const params = buildParams((p) => {
      if (f) p.set('from', f.toISOString());
      else p.delete('from');
      if (t) p.set('to', t.toISOString());
      else p.delete('to');
    });
    push(params);
  };

  const reset = () => {
    setQ('');
    router.push(pathname);
  };

  const hasActive =
    q.length > 0 ||
    initial.severity.length > 0 ||
    initial.status.length > 0 ||
    initial.systemId.length > 0 ||
    initial.responsibleId.length > 0 ||
    !!initial.from ||
    !!initial.to;

  return (
    <div className={styles.toolbar}>
      <Group gap="sm" wrap="wrap" align="center">
        <TextInput
          className={styles.search}
          placeholder="Поиск по названию, описанию, категории"
          leftSection={<IconSearch size={16} />}
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          aria-label="Поиск"
        />
        <FilterPopover
          label="Критичность"
          options={SEVERITY_OPTIONS}
          selected={initial.severity}
          onChange={(v) => setCsv('severity', v)}
        />
        <FilterPopover
          label="Статус"
          options={STATUS_OPTIONS}
          selected={initial.status}
          onChange={(v) => setCsv('status', v)}
        />
        <FilterPopover
          label="Система"
          options={systemOptions}
          selected={initial.systemId}
          onChange={(v) => setCsv('systemId', v)}
          searchable
        />
        <FilterPopover
          label="Ответственный"
          options={userOptions}
          selected={initial.responsibleId}
          onChange={(v) => setCsv('responsibleId', v)}
          searchable
        />
        <DatePickerInput
          type="range"
          className={styles.date}
          placeholder="Обнаружено: период"
          value={[fromDate, toDate]}
          onChange={onDateRange}
          clearable
          valueFormat="DD.MM.YYYY"
        />
        {hasActive ? (
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconX size={14} />}
            onClick={reset}
            className={styles.reset}
          >
            Сбросить
          </Button>
        ) : null}
      </Group>
    </div>
  );
}

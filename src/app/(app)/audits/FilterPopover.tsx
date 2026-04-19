'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { Button, Checkbox, Popover, ScrollArea, Stack, TextInput, UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconX, IconSearch } from '@tabler/icons-react';
import styles from './FilterPopover.module.scss';

export interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (v: string[]) => void;
  searchable?: boolean;
}

function FilterPopoverImpl({ label, options, selected, onChange, searchable = false }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!searchable || !q) return options;
    const needle = q.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(needle));
  }, [options, q, searchable]);

  const handleToggle = useCallback(
    (v: string) => {
      if (selected.includes(v)) onChange(selected.filter((x) => x !== v));
      else onChange([...selected, v]);
    },
    [onChange, selected],
  );

  const clear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange([]);
    },
    [onChange],
  );

  const handleClearAll = useCallback(() => onChange([]), [onChange]);
  const toggleOpen = useCallback(() => setOpen((v) => !v), []);
  const onQChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setQ(e.currentTarget.value), []);

  const count = selected.length;
  const active = count > 0;

  return (
    <Popover opened={open} onChange={setOpen} position="bottom-start" withinPortal shadow="lg">
      <Popover.Target>
        <UnstyledButton
          className={`${styles.trigger} ${active ? styles.active : ''}`}
          onClick={toggleOpen}
        >
          <span className={styles.label}>{label}</span>
          {active ? <span className={styles.count}>{count}</span> : null}
          {active ? (
            <span role="button" aria-label="Очистить" className={styles.clear} onClick={clear}>
              <IconX size={12} />
            </span>
          ) : (
            <IconChevronDown size={14} className={styles.chev} />
          )}
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown className={styles.dropdown}>
        <Stack gap={8}>
          {searchable && (
            <TextInput
              size="xs"
              placeholder="Поиск..."
              leftSection={<IconSearch size={12} />}
              value={q}
              onChange={onQChange}
            />
          )}
          <ScrollArea.Autosize mah={280}>
            <Stack gap={4} className={styles.options}>
              {filtered.length === 0 ? (
                <div className={styles.empty}>Ничего не найдено</div>
              ) : (
                filtered.map((o) => (
                  <label key={o.value} className={styles.option}>
                    <Checkbox
                      size="xs"
                      checked={selected.includes(o.value)}
                      onChange={() => handleToggle(o.value)}
                    />
                    <span className={styles.optionLabel}>{o.label}</span>
                  </label>
                ))
              )}
            </Stack>
          </ScrollArea.Autosize>
          {active ? (
            <Button
              variant="subtle"
              size="xs"
              color="gray"
              onClick={handleClearAll}
              leftSection={<IconX size={12} />}
            >
              Сбросить
            </Button>
          ) : null}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

export const FilterPopover = memo(FilterPopoverImpl);

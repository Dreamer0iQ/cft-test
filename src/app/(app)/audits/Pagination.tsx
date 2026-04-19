'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Group, Pagination as MantinePagination } from '@mantine/core';
import styles from './Pagination.module.scss';

interface Props {
  page: number;
  totalPages: number;
}

export function Pagination({ page, totalPages }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (p <= 1) params.delete('page');
      else params.set('page', String(p));
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  if (totalPages <= 1) return null;

  return (
    <Group justify="flex-end" className={styles.wrap}>
      <MantinePagination
        value={page}
        total={totalPages}
        onChange={onChange}
        radius="md"
        withEdges
        siblings={1}
        color="cyan"
      />
    </Group>
  );
}

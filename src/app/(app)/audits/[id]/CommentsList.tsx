'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import type { Comment, User } from '@prisma/client';
import { RoleBadge } from '@/components/ui/RoleBadge';
import styles from './CommentsList.module.scss';

interface Props {
  comments: Array<Comment & { author: User }>;
}

function formatAbsolute(d: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Moscow',
  }).format(d);
}

function computeRelative(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} дн назад`;
  return formatAbsolute(d);
}

// изначально — абсолютная дата (совпадает между SSR и клиентом),
// после mount useEffect подменяет на относительную; иначе ловим #418/#423 из-за Date.now()
const RelativeTime = memo(function RelativeTime({ iso }: { iso: string }) {
  const date = useMemo(() => new Date(iso), [iso]);
  const [label, setLabel] = useState(() => formatAbsolute(date));

  useEffect(() => {
    setLabel(computeRelative(date));
    const tid = setInterval(() => setLabel(computeRelative(date)), 30_000);
    return () => clearInterval(tid);
  }, [date]);

  return <span>{label}</span>;
});

const CommentItem = memo(function CommentItem({
  comment,
}: {
  comment: Comment & { author: User };
}) {
  return (
    <li className={styles.item}>
      <div className={styles.head}>
        <span className={styles.author}>{comment.author.name}</span>
        <RoleBadge role={comment.author.role} />
        <span className={styles.time}>
          <RelativeTime iso={comment.createdAt.toISOString()} />
        </span>
      </div>
      <div className={styles.body}>{comment.text}</div>
    </li>
  );
});

function CommentsListImpl({ comments }: Props) {
  if (comments.length === 0) {
    return <div className={styles.empty}>Комментариев пока нет</div>;
  }

  return (
    <ul className={styles.list}>
      {comments.map((c) => (
        <CommentItem key={c.id} comment={c} />
      ))}
    </ul>
  );
}

export const CommentsList = memo(CommentsListImpl);

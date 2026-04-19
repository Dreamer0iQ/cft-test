'use client';

import { memo, useCallback, useState, useTransition } from 'react';
import { Textarea, Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSend } from '@tabler/icons-react';
import type { Role } from '@prisma/client';
import { can } from '@/lib/rbac';
import { commentInput } from '@/lib/validators';
import { addComment } from './actions';
import styles from './CommentForm.module.scss';

interface Props {
  auditId: string;
  role: Role;
}

function CommentFormImpl({ auditId, role }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = useCallback(() => {
    const parsed = commentInput.safeParse({ auditId, text });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Некорректный ввод');
      return;
    }
    setError(null);

    startTransition(async () => {
      const res = await addComment(auditId, parsed.data.text);
      if (res.ok) {
        setText('');
        notifications.show({
          color: 'cyan',
          title: 'Комментарий добавлен',
          message: '',
        });
      } else {
        notifications.show({
          color: 'red',
          title: 'Не удалось отправить',
          message: res.error,
        });
      }
    });
  }, [auditId, text]);

  if (!can(role, 'audit:comment:add')) return null;

  return (
    <div className={styles.form}>
      <Textarea
        placeholder="Добавьте комментарий..."
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        autosize
        minRows={3}
        maxRows={8}
        disabled={pending}
        error={error ?? undefined}
        classNames={{ input: styles.input }}
      />
      <Group justify="flex-end" mt="sm">
        <Button
          onClick={submit}
          loading={pending}
          disabled={text.trim().length === 0}
          leftSection={<IconSend size={14} />}
          color="cyan"
          variant="light"
        >
          Отправить
        </Button>
      </Group>
    </div>
  );
}

export const CommentForm = memo(CommentFormImpl);

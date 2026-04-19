'use client';

import { useState, useTransition } from 'react';
import {
  Button,
  Modal,
  PasswordInput,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUserPlus } from '@tabler/icons-react';
import type { Role } from '@prisma/client';
import { userCreateInput } from '@/lib/validators';
import { createUser } from './actions';
import styles from './CreateUserModal.module.scss';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'ADMIN', label: 'Админ' },
  { value: 'L3', label: 'L3' },
  { value: 'L2', label: 'L2' },
  { value: 'L1', label: 'L1' },
];

interface FormValues {
  email: string;
  name: string;
  role: Role;
  password: string;
}

function errorMessage(code: string): string {
  switch (code) {
    case 'unauthorized':
      return 'Не авторизовано';
    case 'forbidden':
      return 'Недостаточно прав';
    case 'email_taken':
      return 'Пользователь с таким email уже существует';
    default:
      return 'Не удалось создать пользователя';
  }
}

export function CreateUserButton() {
  const [opened, setOpened] = useState(false);
  return (
    <>
      <Button
        color="cyan"
        leftSection={<IconUserPlus size={16} />}
        onClick={() => setOpened(true)}
      >
        Добавить пользователя
      </Button>
      <CreateUserModal opened={opened} onClose={() => setOpened(false)} />
    </>
  );
}

function CreateUserModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const [pending, start] = useTransition();

  const form = useForm<FormValues>({
    initialValues: {
      email: '',
      name: '',
      role: 'L1',
      password: '',
    },
    validate: (values) => {
      const parsed = userCreateInput.safeParse(values);
      if (parsed.success) return {};
      const errs: Partial<Record<keyof FormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormValues | undefined;
        if (key && !errs[key]) errs[key] = issue.message;
      }
      return errs;
    },
  });

  const handleClose = () => {
    if (pending) return;
    form.reset();
    onClose();
  };

  const onSubmit = form.onSubmit((values) => {
    start(async () => {
      const res = await createUser(values);
      if (res.ok) {
        notifications.show({ color: 'teal', message: 'Пользователь создан' });
        form.reset();
        onClose();
        return;
      }
      if (res.field && (res.field in values)) {
        form.setFieldError(res.field as keyof FormValues, errorMessage(res.error));
      } else {
        notifications.show({ color: 'red', message: errorMessage(res.error) });
      }
    });
  });

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Новый пользователь"
      centered
      classNames={{
        content: styles.modalContent,
        header: styles.modalHeader,
        title: styles.modalTitle,
      }}
    >
      <form onSubmit={onSubmit} noValidate>
        <Stack gap={14}>
          <TextInput
            label="Имя"
            placeholder="Иван Иванов"
            autoComplete="off"
            {...form.getInputProps('name')}
          />
          <TextInput
            label="Email"
            placeholder="user@cft.local"
            type="email"
            autoComplete="off"
            {...form.getInputProps('email')}
          />
          <Select
            label="Роль"
            data={ROLE_OPTIONS}
            allowDeselect={false}
            checkIconPosition="right"
            {...form.getInputProps('role')}
          />
          <PasswordInput
            label="Пароль"
            placeholder="Минимум 8 символов"
            autoComplete="new-password"
            {...form.getInputProps('password')}
          />
          <div className={styles.actions}>
            <Button variant="subtle" color="gray" onClick={handleClose} disabled={pending}>
              Отмена
            </Button>
            <Button type="submit" color="cyan" loading={pending}>
              Создать
            </Button>
          </div>
        </Stack>
      </form>
    </Modal>
  );
}

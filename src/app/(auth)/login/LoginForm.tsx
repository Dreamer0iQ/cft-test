'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, PasswordInput, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { signIn } from 'next-auth/react';
import styles from './login.module.scss';

type Preset = { label: string; role: 'ADMIN' | 'L3' | 'L2' | 'L1'; email: string };

const PRESETS: Preset[] = [
  { label: 'Админ', role: 'ADMIN', email: 'admin@cft.local' },
  { label: 'Эксперт', role: 'L3', email: 'l3@cft.local' },
  { label: 'Аналитик', role: 'L2', email: 'l2@cft.local' },
  { label: 'Первая линия', role: 'L1', email: 'l1@cft.local' },
];

const DEMO_PASSWORD = 'password123';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Укажите корректный email'),
      password: (v) => (v.length >= 6 ? null : 'Минимум 6 символов'),
    },
  });

  const onSubmit = form.onSubmit((values) => {
    setError(null);
    start(async () => {
      const res = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (!res || res.error) {
        setError('Неверный email или пароль');
        return;
      }
      const next = params.get('next') ?? '/dashboard';
      router.replace(next);
      router.refresh();
    });
  });

  const applyPreset = (p: Preset) => {
    form.setValues({ email: p.email, password: DEMO_PASSWORD });
    setError(null);
  };

  return (
    <div className={styles.card}>
      <span className={styles.cardAccent} aria-hidden />

      <div className={styles.mobileBrand}>
        <span className={styles.brandDot} />
        <span>cft.audit</span>
      </div>

      <div className={styles.tagRow}>
        <span className={styles.tag}>
          <span className={styles.tagDot} />
          Внутренний сервис
        </span>
        <span className={styles.meta}>v0.1</span>
      </div>

      <h2 className={styles.title}>Вход в систему</h2>
      <p className={styles.subtitle}>
        Аутентификация по корпоративному email. Доступ к записям аудита определяется ролью.
      </p>

      <form onSubmit={onSubmit} noValidate className={styles.form}>
        <Stack gap={14}>
          <TextInput
            label="Email"
            placeholder="you@cft.local"
            type="email"
            autoComplete="email"
            size="md"
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label="Пароль"
            placeholder="••••••••"
            autoComplete="current-password"
            size="md"
            {...form.getInputProps('password')}
          />
          {error ? <div className={styles.error}>{error}</div> : null}
          <Button
            type="submit"
            color="cyan"
            loading={pending}
            className={styles.submit}
            size="md"
            fullWidth
          >
            Войти
          </Button>
        </Stack>
      </form>

      <div className={styles.divider}>
        <span>или быстрый вход</span>
      </div>

      <div className={styles.presets}>
        {PRESETS.map((p) => (
          <button
            key={p.email}
            type="button"
            className={styles.preset}
            onClick={() => applyPreset(p)}
          >
            <span className={`${styles.presetRole} ${styles[`role_${p.role}`]}`}>{p.role}</span>
            <span className={styles.presetBody}>
              <span className={styles.presetLabel}>{p.label}</span>
              <span className={styles.presetEmail}>{p.email}</span>
            </span>
          </button>
        ))}
      </div>

      <p className={styles.footer}>
        Пароль для всех тестовых учёток: <code>{DEMO_PASSWORD}</code>
      </p>
    </div>
  );
}

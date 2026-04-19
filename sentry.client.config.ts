import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// без DSN SDK остаётся no-op — билд этим не ломаем, прод просто не шлёт события
Sentry.init({
  dsn,
  enabled: !!dsn,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  ignoreErrors: [
    // Next.js RSC prefetch race — benign, происходит при быстрой навигации
    'Failed to fetch RSC payload',
  ],
});

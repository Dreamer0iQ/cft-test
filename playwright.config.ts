import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: CI ? 2 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});

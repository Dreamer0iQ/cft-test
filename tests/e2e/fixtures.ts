import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001';

export const TEST_PASSWORD = 'password123';

export const TEST_USERS = {
  admin: { email: 'admin@cft.local', password: TEST_PASSWORD, role: 'ADMIN' as const },
  l3: { email: 'l3@cft.local', password: TEST_PASSWORD, role: 'L3' as const },
  l2: { email: 'l2@cft.local', password: TEST_PASSWORD, role: 'L2' as const },
  l1: { email: 'l1@cft.local', password: TEST_PASSWORD, role: 'L1' as const },
} as const;

/**
 * Navigate to /login, submit credentials and wait for the post-login page.
 * Works whether the app lands on /dashboard (ADMIN/L3) or /audits (L1/L2) —
 * we just wait until the URL stops being /login.
 */
export async function login(page: Page, email: string, password: string = TEST_PASSWORD) {
  await page.goto('/login');
  await page.getByLabel(/e-?mail|почта/i).fill(email);
  await page.getByLabel(/пароль|password/i).fill(password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 }),
    page
      .getByRole('button', { name: /войти|sign ?in|log ?in/i })
      .click(),
  ]);
  // Sanity check: we are no longer on /login.
  expect(new URL(page.url()).pathname.startsWith('/login')).toBe(false);
}

/**
 * Click the logout control in the shell. Falls back to hitting the NextAuth
 * signout route directly if no UI button is found.
 */
export async function logout(page: Page) {
  const btn = page.getByRole('button', { name: /выйти|logout|sign ?out/i }).first();
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
  } else {
    await page.goto('/api/auth/signout');
    const submit = page.getByRole('button', { name: /sign ?out|выйти/i });
    if (await submit.isVisible().catch(() => false)) {
      await submit.click();
    }
  }
  await page.waitForURL((url) => url.pathname.startsWith('/login') || url.pathname === '/', {
    timeout: 10_000,
  });
}

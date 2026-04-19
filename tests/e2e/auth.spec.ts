import { test, expect } from '@playwright/test';
import { TEST_USERS, login } from './fixtures';

test.describe('authentication', () => {
  test('invalid credentials show an error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/e-?mail|почта/i).fill('nobody@cft.local');
    await page.getByLabel(/пароль|password/i).fill('wrong-password');
    await page.getByRole('button', { name: /войти|sign ?in|log ?in/i }).click();

    // Stay on /login and surface an error message.
    await expect(page).toHaveURL(/\/login/);
    const err = page
      .getByText(/неверн|invalid|incorrect|ошибк|error/i)
      .first();
    await expect(err).toBeVisible({ timeout: 10_000 });
  });

  test('admin login redirects to /dashboard', async ({ page }) => {
    await login(page, TEST_USERS.admin.email);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('accessing /audits without a session redirects to /login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/audits');
    await expect(page).toHaveURL(/\/login/);
  });
});

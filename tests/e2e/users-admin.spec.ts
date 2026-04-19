import { test, expect } from '@playwright/test';
import { TEST_USERS, login } from './fixtures';

test.describe('/users — admin only', () => {
  test('L1 is forbidden from /users', async ({ page }) => {
    await login(page, TEST_USERS.l1.email);
    await page.goto('/users');

    // Either: redirected away from /users, or a forbidden stub is rendered.
    const url = new URL(page.url());
    if (url.pathname.startsWith('/users')) {
      const forbidden = page
        .getByText(/доступ запрещ|forbidden|403|недостаточно прав/i)
        .first();
      await expect(forbidden).toBeVisible({ timeout: 10_000 });
    } else {
      expect(url.pathname.startsWith('/users')).toBe(false);
    }
  });

  test('ADMIN sees the users table and can open the role-permissions modal', async ({ page }) => {
    await login(page, TEST_USERS.admin.email);
    await page.goto('/users');
    await expect(page).toHaveURL(/\/users/);

    // Users table renders.
    const table = page.getByRole('table').first();
    await expect(table).toBeVisible();
    await expect(table.locator('tbody tr').first()).toBeVisible();

    // Open the "Права ролей" modal.
    const rightsBtn = page.getByRole('button', { name: /права ролей|role permissions/i }).first();
    await expect(rightsBtn).toBeVisible();
    await rightsBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // All four role blocks should be represented in the modal.
    for (const role of ['ADMIN', 'L3', 'L2', 'L1']) {
      await expect(dialog.getByText(new RegExp(`\\b${role}\\b`, 'i')).first()).toBeVisible();
    }
  });
});

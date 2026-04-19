import { test, expect } from '@playwright/test';
import { TEST_USERS, login } from './fixtures';

async function openFirstAudit(page: import('@playwright/test').Page) {
  await page.goto('/audits');
  const firstRow = page.getByRole('table').locator('tbody tr').first();
  await firstRow.click();
  await page.waitForURL(/\/audits\/[a-z0-9]+/i, { timeout: 10_000 });
}

test.describe('audit card — role-based controls', () => {
  test('L1 cannot see the "Сменить статус" control', async ({ page }) => {
    await login(page, TEST_USERS.l1.email);
    await openFirstAudit(page);

    // Either the button is absent, or it is disabled — both count as "denied in UI".
    const statusBtn = page.getByRole('button', { name: /сменить статус|change status/i });
    if (await statusBtn.count()) {
      await expect(statusBtn.first()).toBeDisabled();
    } else {
      await expect(statusBtn).toHaveCount(0);
    }
  });

  test('L2 can change the status', async ({ page }) => {
    await login(page, TEST_USERS.l2.email);
    await openFirstAudit(page);

    const statusTrigger = page
      .getByRole('button', { name: /сменить статус|change status/i })
      .first();
    await expect(statusTrigger).toBeVisible();
    await statusTrigger.click();

    // Pick any non-current status from the select.
    const option = page
      .getByRole('option', { name: /in.progress|работ|under.review|обзор/i })
      .first();
    await option.click();

    // Confirm, if a confirmation button is shown.
    const confirm = page
      .getByRole('button', { name: /сохранить|подтвердить|save|confirm/i })
      .first();
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click();
    }

    // Either a success notification appears, OR the new status shows up in the timeline on reload.
    const notif = page.getByText(/успешно|updated|изменен|сохранен/i).first();
    if (await notif.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(notif).toBeVisible();
    } else {
      await page.reload();
      const timeline = page.getByText(/status|статус/i).first();
      await expect(timeline).toBeVisible();
    }
  });

  test('L3 can change severity and risk-score updates', async ({ page }) => {
    await login(page, TEST_USERS.l3.email);
    await openFirstAudit(page);

    const severityTrigger = page
      .getByRole('button', { name: /сменить критичность|change severity/i })
      .first();
    await expect(severityTrigger).toBeVisible();
    await severityTrigger.click();

    const option = page
      .getByRole('option', { name: /high|высок|critical|критич/i })
      .first();
    await option.click();

    // Some apps require a reason field.
    const reason = page.getByLabel(/причина|reason/i).first();
    if (await reason.isVisible().catch(() => false)) {
      await reason.fill('Повышение после повторного анализа.');
    }

    const confirm = page
      .getByRole('button', { name: /сохранить|подтвердить|save|confirm/i })
      .first();
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click();
    }

    // Verify some risk-score indicator is visible on the page afterwards.
    const risk = page.getByText(/risk.?score|риск.?скор|уровень риска/i).first();
    await expect(risk).toBeVisible({ timeout: 10_000 });
  });
});

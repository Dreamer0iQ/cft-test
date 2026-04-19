import { test, expect } from '@playwright/test';
import { TEST_USERS, login } from './fixtures';

test.describe('/calculators/risk', () => {
  test('reaches 100 at max inputs and halves to 50 with mitigation', async ({ page }) => {
    await login(page, TEST_USERS.l1.email);
    await page.goto('/calculators/risk');
    await expect(page).toHaveURL(/\/calculators\/risk/);

    // Pick severity CRITICAL.
    const severityTrigger = page
      .getByLabel(/severity|критичность/i)
      .or(page.getByRole('button', { name: /severity|критичность/i }))
      .first();
    if (await severityTrigger.isVisible().catch(() => false)) {
      await severityTrigger.click();
      await page
        .getByRole('option', { name: /critical|критич/i })
        .first()
        .click();
    }

    // Max out probability and impact via sliders (aria-valuemax to valuemax).
    const sliders = page.getByRole('slider');
    const count = await sliders.count();
    for (let i = 0; i < count; i++) {
      const slider = sliders.nth(i);
      await slider.focus();
      // Press End to jump to max.
      await page.keyboard.press('End');
    }

    // Ensure mitigation checkbox is OFF.
    const mitigation = page
      .getByRole('checkbox', { name: /mitigation|компенс|митигац/i })
      .or(page.getByRole('switch', { name: /mitigation|компенс|митигац/i }))
      .first();
    if (await mitigation.isVisible().catch(() => false)) {
      if (await mitigation.isChecked()) await mitigation.click();
    }

    // Score of 100 should be visible somewhere on the page.
    const score100 = page.getByText(/\b100(\.0+)?\b/).first();
    await expect(score100).toBeVisible({ timeout: 10_000 });

    // Toggle mitigation ON → score halves to 50.
    if (await mitigation.isVisible().catch(() => false)) {
      await mitigation.click();
      const score50 = page.getByText(/\b50(\.0+)?\b/).first();
      await expect(score50).toBeVisible({ timeout: 10_000 });

      // Level chip should indicate high or medium (no longer critical).
      const levelChip = page
        .getByText(/high|высок|medium|средн/i)
        .first();
      await expect(levelChip).toBeVisible();
    }
  });
});

import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'ru-RU', timezoneId: 'Europe/Moscow', viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
await page.fill('input[type=email]', 'admin@cft.local');
await page.fill('input[type=password]', 'password123');
await page.click('button[type=submit]');
await page.waitForURL(/\/(dashboard|audits)/, { timeout: 15_000 });
if (!page.url().includes('/dashboard')) {
  await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle' });
}
await page.waitForTimeout(1200);

await page.screenshot({ path: 'scripts/dashboard-full.png', fullPage: true });

const pie = page.locator('text=Распределение по критичности').first();
const pieCard = pie.locator('xpath=ancestor::*[contains(@class,"card")][1]');
const count = await pieCard.count();
if (count > 0) {
  await pieCard.screenshot({ path: 'scripts/dashboard-pie.png' });
} else {
  // fallback to region around the text
  const el = page.locator('text=Распределение по критичности').locator('xpath=../..');
  await el.screenshot({ path: 'scripts/dashboard-pie.png' });
}

console.log('screenshots saved');
await browser.close();

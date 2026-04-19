import { chromium } from 'playwright';

const BASE = 'http://85.198.108.217';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  locale: 'ru-RU',
  timezoneId: 'Europe/Moscow',
  viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.screenshot({ path: 'scripts/prod-login.png', fullPage: false });
console.log('login shot ok');

await page.fill('input[type=email]', 'admin@cft.local');
await page.fill('input[type=password]', 'password123');
await page.click('button[type=submit]');
await page.waitForURL(/\/(dashboard|audits)/, { timeout: 15_000 });
if (!page.url().includes('/dashboard')) {
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
}
await page.waitForTimeout(1500);
await page.screenshot({ path: 'scripts/prod-dashboard.png', fullPage: true });
console.log('dashboard shot ok');

await browser.close();

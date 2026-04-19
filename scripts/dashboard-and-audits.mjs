import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  locale: 'ru-RU',
  timezoneId: 'Europe/Moscow',
  viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();

await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
await page.fill('input[type=email]', 'admin@cft.local');
await page.fill('input[type=password]', 'password123');
await page.click('button[type=submit]');
await page.waitForURL(/\/(dashboard|audits)/, { timeout: 15_000 });
if (!page.url().includes('/dashboard')) {
  await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle' });
}
await page.waitForTimeout(1500);
await page.screenshot({ path: 'scripts/shot-dashboard.png', fullPage: true });

// аудит список с активными фильтрами
await page.goto('http://localhost:3001/audits?severity=MEDIUM%2CHIGH%2CCRITICAL&status=NEW%2CIN_PROGRESS', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.screenshot({ path: 'scripts/shot-audits-filters.png', fullPage: true });

console.log('shots saved');
await browser.close();

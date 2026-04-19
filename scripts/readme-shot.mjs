import { chromium } from 'playwright';

const BASE = 'http://85.198.108.217';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  locale: 'ru-RU',
  timezoneId: 'Europe/Moscow',
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'docs/login.png', fullPage: false });
console.log('login shot');

await browser.close();

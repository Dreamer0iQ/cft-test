import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';
const TARGET_ID = 'cmo5hujoo0023jj9f9pqvgk27';

const consoleErrors = [];
const pageErrors = [];
const requestFailures = [];

const browser = await chromium.launch();
const context = await browser.newContext({ locale: 'ru-RU', timezoneId: 'Europe/Moscow' });
const page = await context.newPage();

page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => pageErrors.push(String(err)));
page.on('requestfailed', (r) =>
  requestFailures.push(`${r.method()} ${r.url()} — ${r.failure()?.errorText}`),
);

console.log('→ /login');
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.fill('input[type=email]', 'admin@cft.local');
await page.fill('input[type=password]', 'password123');
await page.click('button[type=submit]');
await page.waitForURL(/\/(dashboard|audits)/, { timeout: 15_000 });
console.log('  logged in at', page.url());

const auditUrl = `${BASE}/audits/${TARGET_ID}`;
console.log('→', auditUrl);
const resp = await page.goto(auditUrl, { waitUntil: 'networkidle' });
console.log('  status', resp?.status());

await page.waitForTimeout(1500);

await page.screenshot({ path: 'scripts/audit-detail.png', fullPage: true });
console.log('  screenshot saved');

const title = await page.title();
const h1 = await page.locator('h1').first().textContent().catch(() => null);
console.log('  title:', title);
console.log('  h1:', h1);

console.log('\n=== console errors:', consoleErrors.length);
consoleErrors.forEach((e) => console.log('  •', e));
console.log('=== page errors:', pageErrors.length);
pageErrors.forEach((e) => console.log('  •', e));
console.log('=== request failures:', requestFailures.length);
requestFailures.forEach((e) => console.log('  •', e));

await browser.close();

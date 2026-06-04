import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const OUT = '/tmp/iiq-audit-phase1';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

// Wide screen dashboard, to verify max-width cap
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    colorScheme: theme,
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.addInitScript((t) => { localStorage.setItem('theme', t); }, theme);
  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    const file = `${OUT}/dashboard__${theme}__wide-1920.png`;
    await page.screenshot({ path: file });
    console.log('OK  ' + file);
  } catch (e) { console.log('ERR ' + theme + ' wide: ' + e.message); }
  await ctx.close();
}

// Mobile sidebar/header touch-target visual check
for (const theme of ['light']) {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    colorScheme: theme,
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.addInitScript((t) => { localStorage.setItem('theme', t); }, theme);
  try {
    await page.goto('http://localhost:3000/exceptions', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    const file = `${OUT}/exceptions-list__${theme}__mobile-375.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log('OK  ' + file);
  } catch (e) { console.log('ERR mobile exceptions: ' + e.message); }
  await ctx.close();
}

await browser.close();
console.log('DONE');

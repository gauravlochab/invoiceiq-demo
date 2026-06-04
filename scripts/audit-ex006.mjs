import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const OUT = '/tmp/iiq-audit-phase1';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const themes = ['light', 'dark'];

for (const theme of themes) {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    colorScheme: theme,
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.addInitScript((t) => {
    localStorage.setItem('theme', t);
  }, theme);
  try {
    await page.goto('http://localhost:3000/exceptions/EX-006', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    const file = `${OUT}/exception-detail-EX-006__${theme}__mobile-375.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log('OK  ' + file);
  } catch (e) {
    console.log('ERR ' + theme + ' :: ' + e.message);
  }
  await ctx.close();
}

await browser.close();
console.log('DONE');

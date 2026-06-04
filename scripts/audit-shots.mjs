import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const OUT = '/tmp/iiq-audit';
mkdirSync(OUT, { recursive: true });

const routes = [
  { path: '/', name: 'dashboard' },
  { path: '/exceptions', name: 'exceptions' },
  { path: '/exceptions/EX-006', name: 'exception-detail' },
  { path: '/pipeline', name: 'pipeline' },
  { path: '/recovery', name: 'recovery' },
  { path: '/contracts', name: 'contracts' },
  { path: '/som', name: 'som' },
];

const breakpoints = [
  { w: 375, h: 812, name: 'mobile' },
  { w: 768, h: 1024, name: 'tablet' },
  { w: 1280, h: 900, name: 'laptop' },
  { w: 1920, h: 1080, name: 'wide' },
];

const themes = ['light', 'dark'];

const browser = await chromium.launch();

for (const theme of themes) {
  for (const bp of breakpoints) {
    const ctx = await browser.newContext({
      viewport: { width: bp.w, height: bp.h },
      colorScheme: theme,
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    // set theme via next-themes localStorage
    await page.addInitScript((t) => {
      localStorage.setItem('theme', t);
    }, theme);

    for (const r of routes) {
      try {
        await page.goto('http://localhost:3000' + r.path, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1200);
        const file = `${OUT}/${r.name}__${theme}__${bp.name}.png`;
        await page.screenshot({ path: file, fullPage: bp.name === 'laptop' });
        console.log('OK  ' + file);
      } catch (e) {
        console.log('ERR ' + r.name + ' ' + theme + ' ' + bp.name + ' :: ' + e.message);
      }
    }
    await ctx.close();
  }
}

await browser.close();
console.log('DONE');

// Phase 1 v2 audit — re-verify destructive contrast fix.
// Captures the two screens called out by the 2026-05-23 v2 audit:
//   /exceptions/EX-006 at 375px (mobile detail page)
//   /                  at 1920px (dashboard)
// Each in both light + dark themes. Output: /tmp/iiq-audit-phase1-v2/

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const OUT = '/tmp/iiq-audit-phase1-v2';
mkdirSync(OUT, { recursive: true });

const shots = [
  { path: '/exceptions/EX-006', name: 'exception-EX006', w: 375, h: 812, label: 'mobile-375' },
  { path: '/',                  name: 'dashboard',       w: 1920, h: 1080, label: 'wide-1920' },
];

const themes = ['light', 'dark'];

const browser = await chromium.launch();

for (const theme of themes) {
  for (const s of shots) {
    const ctx = await browser.newContext({
      viewport: { width: s.w, height: s.h },
      colorScheme: theme,
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    await page.addInitScript((t) => {
      localStorage.setItem('theme', t);
    }, theme);
    try {
      await page.goto('http://localhost:3000' + s.path, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      const file = `${OUT}/${s.name}__${theme}__${s.label}.png`;
      await page.screenshot({ path: file, fullPage: true });
      console.log('OK  ' + file);
    } catch (e) {
      console.log('ERR ' + s.name + ' ' + theme + ' :: ' + e.message);
    }
    await ctx.close();
  }
}

await browser.close();
console.log('DONE');

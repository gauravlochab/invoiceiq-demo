import { chromium } from 'playwright';

const browser = await chromium.launch();

async function shot(name, viewport, theme) {
  const ctx = await browser.newContext({
    viewport,
    colorScheme: theme === 'dark' ? 'dark' : 'light',
  });
  const page = await ctx.newPage();
  // set theme storage BEFORE first nav so next-themes picks it up
  await page.addInitScript((t) => {
    try { localStorage.setItem('theme', t); } catch {}
  }, theme);
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  // force theme class to be safe
  await page.evaluate((t) => {
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, theme);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `/tmp/now-${name}.png`, fullPage: false });
  console.log('saved /tmp/now-' + name + '.png');
  await ctx.close();
}

await shot('dashboard-light-1440', { width: 1440, height: 900 }, 'light');
await shot('dashboard-dark-1440',  { width: 1440, height: 900 }, 'dark');
await shot('sidebar-zoom-light',   { width: 380, height: 700 },  'light'); // narrow to focus sidebar
await browser.close();

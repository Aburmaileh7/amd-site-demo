// QA for one or more built sites: serves dist/, checks overflow, console errors,
// clipped text and links, and saves screenshots to qa-out/<slug>/.
// Usage: npm run build && node scripts/qa.mjs [slug ...]
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('playwright not installed: npm i -D playwright (browsers are preinstalled in Claude sessions)'); process.exit(2); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  let path = join('dist', decodeURIComponent(req.url.split('?')[0]));
  if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
  if (!existsSync(path)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
  res.end(readFileSync(path));
}).listen(4399);

const slugs = process.argv.slice(2).length ? process.argv.slice(2)
  : readdirSync('sites', { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const browser = await chromium.launch();
let problems = 0;
for (const slug of slugs) {
  const out = `qa-out/${slug}`; mkdirSync(out, { recursive: true });
  for (const [vp, w, h] of [['mobile', 390, 844], ['desktop', 1440, 900]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`http://localhost:4399/${slug}/`); await page.waitForTimeout(1800);
    await page.screenshot({ path: `${out}/${vp}-0.png` });
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let i = 1; i <= 6; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * i / 7));
      await page.waitForTimeout(1100);
      await page.screenshot({ path: `${out}/${vp}-${i}.png` });
    }
    const r = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      badLinks: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))
        .filter((h) => !/^(https:\/\/|tel:\+\d+|#)/.test(h)),
      preview: !!document.querySelector('.preview-bar'),
      noindex: document.querySelector('meta[name=robots]')?.content.includes('noindex')
    }));
    const issues = [];
    if (r.overflow > 0) issues.push(`horizontal overflow ${r.overflow}px`);
    if (r.badLinks.length) issues.push(`bad links ${r.badLinks.join(', ')}`);
    if (errors.length) issues.push(`js errors ${errors.join(' | ')}`);
    if (!r.preview || !r.noindex) issues.push('preview bar / noindex missing');
    problems += issues.length;
    console.log(`${issues.length ? '✗' : '✓'} ${slug} ${vp}${issues.length ? ': ' + issues.join('; ') : ''}`);
    await page.close();
  }
}
await browser.close(); server.close();
console.log(`screenshots: qa-out/<slug>/  (images from Unsplash only load with internet access)`);
process.exit(problems ? 1 : 0);

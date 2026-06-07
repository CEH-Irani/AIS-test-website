import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';

const existing = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(n => !isNaN(n));
const next = nums.length ? Math.max(...nums) + 1 : 1;
const filename = `screenshot-${next}${label}.png`;
const outPath = path.join(dir, filename);

const browser = await puppeteer.launch({
  executablePath: 'C:/Users/ghs/.cache/puppeteer/chrome/win64-149.0.7827.22/chrome-win64/chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
await new Promise(r => setTimeout(r, 500));
// Trigger all fade-up animations immediately
await page.evaluate(() => {
  document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
});
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path: outPath, fullPage: true });
// Also capture viewport-sized sections
const sections = ['#hero', '#programs', '#events', '#community', '#join'];
for (const sel of sections) {
  await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ behavior: 'instant' }), sel);
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: outPath.replace('.png', `-${sel.replace('#','')}.png`) });
}
// High-res viewport screenshot (top of page, no clip)
await page.evaluate(() => window.scrollTo(0, 0));
await page.setViewport({ width: 1440, height: 300, deviceScaleFactor: 2 });
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path: outPath.replace('.png', '-nav-hires.png') });
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await browser.close();
console.log(`Saved: temporary screenshots/${filename}`);

import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('web');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
// Serve at both domain root and a repository subpath to catch Pages regressions.
const server = http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.startsWith('/repo-preview/')) pathname = pathname.slice('/repo-preview'.length);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(`${root}${path.sep}`)) { res.writeHead(403).end(); return; }
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(content);
  } catch { res.writeHead(404).end('Not found'); }
});
let browser;
try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  for (const prefix of ['/', '/repo-preview/']) {
    for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
      const context = await browser.newContext({ viewport });
      const errors = [];
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
      page.on('requestfailed', request => errors.push(`Request failed: ${request.url()}`));
      await context.route('**/*', route => {
        if (new URL(route.request().url()).origin !== origin) {
          errors.push(`External runtime request: ${route.request().url()}`);
          return route.abort();
        }
        return route.continue();
      });
      await page.goto(`${origin}${prefix}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('html[data-ready="true"]');
      assert.equal(await page.locator('#hardware-list tr').count(), 7);
      assert.equal(await page.locator('#letter').textContent(), 'A');
      await page.getByRole('button', { name: 'Previous letter', exact: true }).click();
      assert.equal(await page.locator('#letter').textContent(), 'Ż');
      await page.getByRole('button', { name: 'Next letter', exact: true }).click();
      assert.equal(await page.locator('#letter').textContent(), 'A');
      for (let i = 0; i < 12; i++) await page.getByRole('button', { name: 'Increase volume', exact: true }).click();
      assert.equal(await page.locator('#volume-label').textContent(), '50%');
      for (let i = 0; i < 12; i++) await page.getByRole('button', { name: 'Decrease volume', exact: true }).click();
      assert.equal(await page.locator('#volume-label').textContent(), '0%');
      await page.getByRole('button', { name: 'Play or stop', exact: true }).click();
      assert.equal(await page.locator('[data-action="toggle"]').getAttribute('aria-pressed'), 'true');
      await page.locator('body').click({ position: { x: 1, y: 1 } });
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('#letter').textContent(), 'Ą');
      const before = await page.locator('html').getAttribute('data-theme');
      await page.getByRole('button', { name: 'Switch color theme' }).click();
      assert.notEqual(await page.locator('html').getAttribute('data-theme'), before);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Mobile layout overflows');
      assert.equal(await page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), true);
      assert.deepEqual(errors, []);
      if (prefix === '/' && viewport.width === 1280 && process.env.SMOKE_SCREENSHOT) await page.screenshot({ path: process.env.SMOKE_SCREENSHOT, fullPage: true });
      await context.close();
      console.log(`PASS: ${prefix} at ${viewport.width}px, controls, images, theme, no external requests`);
    }
  }
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}

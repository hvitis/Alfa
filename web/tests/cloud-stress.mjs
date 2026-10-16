import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

// Defaults to a pure static export. CLOUD_BASE_URL also exercises live Vite.
const root = path.resolve('_site');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.svg': 'image/svg+xml' };
const server = http.createServer(async (request, response) => {
  try {
    let url = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (url.startsWith('/repo-preview/')) url = url.slice('/repo-preview'.length);
    if (url.endsWith('/')) url += 'index.html';
    const file = path.resolve(root, `.${url}`);
    if (!file.startsWith(root+path.sep)) return response.writeHead(403).end();
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(content);
  } catch { response.writeHead(404).end(); }
});
let browser;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = process.argv.find(value => /^https?:/.test(value)) || process.env.CLOUD_BASE_URL || `http://127.0.0.1:${server.address().port}/repo-preview/`;
  browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const errors = [], failures = [];
  page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
  page.on('console', message => { if (message.type() === 'error') { errors.push(message.text()); console.error(message.text()); } });
  page.on('requestfailed', request => failures.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const waitCloud = mode => page.waitForSelector(`#viewport[data-scene="cloud"][data-loaded="true"][data-mode="${mode}"]`);
  await page.goto(`${base}#3dprint`);
  await waitCloud('assembled');
  await page.reload(); await waitCloud('assembled');
  const checks = await (await page.request.get(`${base}cloud/verification.json`)).json();
  assert(checks.passed); assert(checks.checks.length > 100);
  const manifest = await (await page.request.get(`${base}cloud/manifest.json`)).json();
  assert(manifest.frame_features.length > 30);
  assert.equal(new Set(manifest.frame_features.map(item => item.id)).size, manifest.frame_features.length);
  await page.locator('#cloud-labels').check();
  const frontLabel = page.locator('.annotation').filter({ hasText: /^F-00 · Front shell$/ });
  const lcdLabel = page.locator('.annotation').filter({ hasText: /^Waveshare 2-inch LCD$/ });
  await frontLabel.waitFor({ state: 'visible' });
  // Raycast through the label's projected centre onto the real CAD surface.
  // A mount behind the front skin must not override the visible shell ID.
  for (const [label,id,title] of [[frontLabel,'F-00','Front shell'],[lcdLabel,'lcd','Waveshare 2-inch LCD']]) {
    const rect = await label.boundingBox(); assert(rect);
    await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
    await page.waitForFunction(id => document.querySelector('#viewport').dataset.hoverId === id,id);
    assert((await page.locator('.model-tooltip').textContent()).includes(title));
    await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);
    assert((await page.locator('#viewer-status').textContent()).includes(title));
  }
  await page.mouse.move(5,5);
  assert(await page.locator('.model-tooltip').isHidden());
  await page.locator('#cloud-labels').uncheck();
  for (const selector of ['front.stl', 'rear.stl', 'battery_door.stl', 'cloud-radio.step', 'cloud-radio.zip']) {
    const downloadPromise = page.waitForEvent('download');
    await page.locator(`.download-buttons a[href$="${selector}"]`).click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), selector);
    assert.equal(await download.failure(), null);
  }
  await page.getByRole('tab', { name: 'Hardware' }).click();
  await page.waitForSelector('#viewport[data-scene="raspberry"][data-loaded="true"]');
  await page.getByRole('tab', { name: '3DPrint' }).click(); await waitCloud('assembled');
  // Warm all resources before measuring bounded growth.
  const before = await page.evaluate(() => window.__cloudViewerStats?.());
  const modes = ['exploded', 'inside', 'battery_open', 'assembled'];
  const started = Date.now();
  for (let i = 0; i < 100; i++) {
    const mode = modes[i % modes.length];
    await page.selectOption('#cloud-mode', mode); await waitCloud(mode);
    await page.setViewportSize(i % 2 ? { width: 1440, height: 1000 } : { width: 375, height: 812 });
    await page.getByRole('tab', { name: 'Software' }).click();
    await page.getByRole('tab', { name: '3DPrint' }).click(); await waitCloud(mode);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at cycle ${i}`);
    assert.equal(await page.locator('#viewport canvas').count(), 1);
  }
  const after = await page.evaluate(() => window.__cloudViewerStats?.());
  if (before && after) {
    assert.equal(after.scenes, before.scenes);
    assert(after.geometries <= before.geometries + 2, JSON.stringify({ before, after }));
    assert(after.textures <= before.textures + 1);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.selectOption('#cloud-mode', 'assembled'); await waitCloud('assembled');
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/cloud-radio.png', fullPage: true });
  assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  const report = { passed: true, cycles: 100, elapsed_ms: Date.now()-started, geometry_checks: checks.checks.length, before, after, base };
  await writeFile('test-results/cloud-stress.json', JSON.stringify(report, null, 2)+'\n');
  console.log(JSON.stringify(report));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}

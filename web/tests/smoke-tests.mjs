import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(process.env.SMOKE_SITE_DIR || '_site');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.md': 'text/plain', '.mmd': 'text/plain', '.txt': 'text/plain', '.png':'image/png', '.pdf':'application/pdf' };
const server = http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.startsWith('/repo-preview/')) pathname = pathname.slice('/repo-preview'.length);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(`${root}${path.sep}`)) { res.writeHead(403).end(); return; }
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }); res.end(content);
  } catch { res.writeHead(404).end('Not found'); }
});
let browser;
try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const atlas = JSON.parse(await readFile('web/hardware-visualisation/src/data/setup.json', 'utf8'));
  for (const prefix of ['/', '/repo-preview/']) {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 375, height: 812 }]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      const errors = [], meshes = [];
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); if (response.url().endsWith('.glb') && response.ok()) meshes.push(response.url()); });
      page.on('requestfailed', request => errors.push(`Request failed: ${request.url()} (${request.failure()?.errorText})`));
      await context.route('**/*', route => {
        if (new URL(route.request().url()).origin !== origin) { errors.push(`External runtime request: ${route.request().url()}`); return route.abort(); }
        return route.continue();
      });
      async function scene(id, mode) {
        await page.waitForSelector(`#viewport[data-scene="${id}"][data-loaded="true"]${mode ? `[data-mode="${mode}"]` : ''}`);
        assert(Number(await page.locator('#viewport').getAttribute('data-meshes')) > 1, 'Actual 3D meshes must load');
      }
      async function noOverflow() { assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page overflows at mobile width'); }
      await page.goto(`${origin}${prefix}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('html[data-ready="true"]');
      assert.deepEqual(await page.getByRole('tab').allTextContents().then(items => items.map(text => text.trim().replace(/^\d+\s*/, ''))), ['Plywood', '3DPrint', 'Hardware', 'Software']);
      assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'),'https://hvitis.github.io/Alfa/og-cloud.png');
      assert.equal(await page.locator('meta[name="twitter:card"]').getAttribute('content'),'summary_large_image');
      const pdf=await page.request.get(`${origin}${prefix}docs/adr.pdf`);
      assert((await pdf.body()).subarray(0,5).equals(Buffer.from('%PDF-')),'ADR download must be a real PDF');
      const card=await page.request.get(`${origin}${prefix}og-cloud.png`);
      const png=await card.body();
      assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
      await scene('house', 'assembled');
      await noOverflow();
      for (const mode of ['roof_open', 'inside', 'exploded', 'assembled']) {
        await page.selectOption('#assembly-mode', mode); await scene('house', mode);
      }
      await page.locator('#show-wood').uncheck(); await page.locator('#show-wood').check();
      await page.locator('#show-labels').check(); await page.locator('#show-labels').uncheck();
      await page.selectOption('#plywood-project', 'case'); await scene('case', 'enclosure');
      await page.selectOption('#assembly-mode', 'internals'); await scene('case', 'internals');
      await page.selectOption('#assembly-mode', 'exploded'); await scene('case', 'exploded');
      await page.getByRole('tab', { name: '3DPrint' }).click();
      await scene('cloud', 'assembled');
      if (prefix === '/' && viewport.width === 1440 && process.env.SMOKE_SCREENSHOT) await page.screenshot({ path: process.env.SMOKE_SCREENSHOT, fullPage: true });
      assert((await page.locator('#cloud-facts').textContent()).includes('PETG'));
      for (const mode of ['exploded', 'inside', 'battery_open', 'assembled']) {
        await page.selectOption('#cloud-mode', mode); await scene('cloud', mode);
      }
      await page.locator('#cloud-labels').check(); await page.locator('#cloud-labels').uncheck();
      await page.locator('#cloud-clearances').check(); await page.locator('#cloud-clearances').uncheck();
      for (const asset of ['front.stl', 'rear.stl', 'battery_door.stl', 'cloud-radio.step', 'cloud-radio.zip', 'README.md', 'verification.json']) {
        const response = await page.request.get(`${origin}${prefix}cloud/${asset}`);
        assert(response.ok(), asset); assert((await response.body()).length > 100, asset);
      }
      await noOverflow();
      await page.getByRole('tab', { name: 'Hardware' }).click(); await scene('raspberry');
      assert.equal(await page.locator('#wiring-body tr').count(), atlas.wires.length);
      assert((await page.locator('#wiring-body').textContent()).includes('physical pin'));
      const first = atlas.wires[0].id;
      await page.getByRole('button', { name: `Trace wire ${first}`, exact: true }).click();
      assert.equal(await page.locator(`[data-wire="${first}"]`).getAttribute('aria-pressed'), 'true');
      assert((await page.locator('#wire-detail').textContent()).includes(first));
      await page.selectOption('#circuit-filter', 'Audio');
      assert.equal(await page.locator('#wiring-body tr').count(), atlas.wires.filter(wire => wire.group === 'Audio').length);
      await page.getByRole('button', { name: 'Show all wires', exact: true }).click();
      assert.equal(await page.locator('#wiring-body tr').count(), atlas.wires.length);
      await page.selectOption('#hardware-controller', 'pico'); await scene('pico');
      assert.equal(await page.locator('#wiring-body tr').count(), atlas.wires.length + 2);
      assert.equal(await page.locator('#pico-notice').isVisible(), true);
      assert((await page.locator('#wiring-body').textContent()).includes('GP'));
      assert((await page.locator('#wiring-body').textContent()).includes('PWR3'));
      await page.getByRole('button', { name: 'Reset camera' }).click();
      await noOverflow();
      await page.getByRole('tab', { name: 'Software' }).click();
      assert.equal(await page.locator('#software-view').inputValue(), 'design');
      assert((await page.locator('#adr-content h1').textContent()).includes('ADR 0001'));
      assert((await page.locator('#adr-content').textContent()).includes('PlayerSession'));
      await page.selectOption('#software-view', 'implementation');
      await page.waitForSelector('#architecture-diagram[data-rendered="true"] svg');
      assert.equal(await page.locator('#architecture-diagram').getAttribute('aria-busy'), 'false');
      for (const name of ['PlayerSession', 'ST7789', 'StreamingAudioPlayer', 'Debouncer', 'PreviewDisplay', 'ServiceWatchdog']) assert((await page.locator('#architecture-diagram').textContent()).includes(name), name);
      assert((await page.locator('#mermaid-source').textContent()).startsWith('flowchart TB'));
      await noOverflow();
      if (prefix === '/' && viewport.width === 1440 && process.env.SMOKE_SCREENSHOT) {
        const directory = path.dirname(process.env.SMOKE_SCREENSHOT);
        await mkdir(directory, { recursive: true });
        await page.screenshot({ path: path.join(directory, 'software-architecture.png'), fullPage: true });
      }
      // The fictional MDR example must never ship without its notice, watermark, and disclaimer footer.
      await page.selectOption('#software-view', 'teaching');
      await page.waitForSelector('#teaching-adr-content .teaching-diagram[data-rendered="true"] svg');
      const teaching = await page.locator('#teaching-adr-content').textContent();
      for (const phrase of ['TEACHING MATERIAL · NOT A MEDICAL DEVICE · FOR EDUCATIONAL PURPOSES ONLY', 'Read this first', 'Alfa is not a medical device', 'Alfa-L does not exist', 'Nobody signed anything']) assert(teaching.includes(phrase), phrase);
      assert((await page.locator('#teaching-adr-content').evaluate(element => getComputedStyle(element, '::after').backgroundImage)).includes('TEACHING'), 'Teaching ADR watermark');
      assert(await page.locator('#teaching-adr-content').isVisible());
      assert((await page.locator('footer').textContent()).includes('Not a medical device. For educational purposes only.'));
      await noOverflow();
      const teachingPdf = await page.request.get(`${origin}${prefix}docs/teaching-material-adr-example-not-a-medical-device.pdf`);
      assert((await teachingPdf.body()).subarray(0, 5).equals(Buffer.from('%PDF-')), 'Teaching ADR download must be a real PDF');
      assert((await (await page.request.get(`${origin}${prefix}docs/teaching-material-adr-example-not-a-medical-device.md`)).text()).includes('NOT A MEDICAL DEVICE'));
      for (const asset of ['docs/adr.md', 'docs/adr.pdf', 'og-cloud.png', 'docs/architecture.mmd', 'THIRD-PARTY-LICENSES.txt']) assert((await page.request.get(`${origin}${prefix}${asset}`)).ok());
      // Direct links and refreshes must work without server-side routing.
      await page.goto(`${origin}${prefix}#hardware`, { waitUntil: 'networkidle' });
      await scene('pico'); // Hash navigation retains the selected controller.
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForSelector('html[data-ready="true"]'); await scene('raspberry');
      await page.getByRole('tab', { name: 'Hardware' }).focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.getByRole('tab', { name: 'Software' }).getAttribute('aria-selected'), 'true');
      for (const tab of ['software', '3dprint']) {
        await page.goto(`${origin}${prefix}#${tab}`, { waitUntil: 'networkidle' });
        // A hash-only navigation does not wait for lazy module imports.
        // Finish the requested view before the explicit refresh check.
        if (tab === '3dprint') await scene('cloud', 'assembled');
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForSelector('html[data-ready="true"]');
        assert.equal(await page.locator('#viewer-card').isVisible(), tab === '3dprint');
        if (tab === '3dprint') await scene('cloud', 'assembled');
        assert.equal(await page.locator(`#panel-${tab}`).isVisible(), true);
      }
      assert(meshes.length >= 7, 'All plywood model files must load');
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS: ${prefix} at ${viewport.width}px · plywood meshes, cloud CAD and downloads, both wiring atlases, ADR, rendered Mermaid, offline assets`);
    }
  }
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}

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
      if (viewport.width === 1440) {
        await page.getByRole('link', { name: 'EN', exact: true }).click();
        await page.waitForURL(url => url.pathname.endsWith('/en/'));
        await page.waitForSelector('html[lang="en"][data-ready="true"]');
        assert.match(await page.locator('.intro h1').innerHTML(), /Little radio/);
        assert.equal(await page.locator('base').getAttribute('href'), '../');
        await page.getByRole('tab', { name: 'Enclosure' }).click();
        await scene('cloud', 'assembled');
        await page.locator('[data-for="pricing-case"] [data-value="plywood-case"]').click();
        assert((await page.locator('#pricing-tbody').textContent()).includes('Sklejka') || (await page.locator('#pricing-tbody').textContent()).includes('plywood'));
        assert((await page.locator('footer').textContent()).includes('Not a medical device. For educational purposes only.'));
        await page.getByRole('tab', { name: 'Home' }).click();
        await page.getByRole('link', { name: 'PL', exact: true }).click();
        await page.waitForURL(url => !url.pathname.includes('/en'));
        await page.waitForSelector('html[lang="pl"][data-ready="true"]');
      }
      assert.equal(await page.locator('html').getAttribute('lang'), 'pl');
      assert.deepEqual(await page.getByRole('tab').allTextContents().then(items => items.map(text => text.trim().replace(/^\d+\s*/, ''))), ['Główna', 'Obudowa', 'Elektronika', 'Oprogramowanie', 'Inne']);
      await page.getByRole('tab', { name: 'Główna' }).click();
      assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'),'https://hvitis.github.io/Alfa/og-cloud.png');
      assert.equal(await page.locator('meta[name="twitter:card"]').getAttribute('content'),'summary_large_image');
      const pdf=await page.request.get(`${origin}${prefix}docs/adr.pdf`);
      assert((await pdf.body()).subarray(0,5).equals(Buffer.from('%PDF-')),'ADR download must be a real PDF');
      const card=await page.request.get(`${origin}${prefix}og-cloud.png`);
      const png=await card.body();
      assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);

      // Verify version dropdown is visible
      assert.equal(await page.locator('#version-switch').isVisible(), true);
      assert.equal(await page.locator('#version-btn').isVisible(), true);

      // Verify cards on the main page (1 static image/element per card, no switching)
      assert.equal(await page.locator('.shade-card').count(), 4);
      assert.equal(await page.locator('.shade-card .card-media-img').count(), 3);
      assert.equal(await page.locator('.shade-card .code-preview-window').count(), 1);
      assert.equal(await page.locator('.shade-card .shade-layer').count(), 0);

      // Navigate to Obudowa via the card button
      await page.locator('.shade-card[data-card="obudowa"] .card-nav-btn').click();
      assert.equal(await page.locator('#panel-obudowa').isVisible(), true);
      await scene('cloud', 'assembled');
      if (prefix === '/' && viewport.width === 1440 && process.env.SMOKE_SCREENSHOT) await page.screenshot({ path: process.env.SMOKE_SCREENSHOT, fullPage: true });
      assert((await page.locator('#cloud-facts').textContent()).includes('PETG'));
      for (const mode of ['exploded', 'inside', 'battery_open', 'assembled']) {
        await page.locator(`[data-for="cloud-mode"] [data-value="${mode}"]`).click();
        await scene('cloud', mode);
      }
      await page.locator('#cloud-labels').check(); await page.locator('#cloud-labels').uncheck();
      await page.locator('#cloud-clearances').check(); await page.locator('#cloud-clearances').uncheck();
      for (const asset of ['front.stl', 'rear.stl', 'battery_door.stl', 'cloud-radio.step', 'cloud-radio.zip', 'README.md', 'verification.json']) {
        const response = await page.request.get(`${origin}${prefix}cloud/${asset}`);
        assert(response.ok(), asset); assert((await response.body()).length > 100, asset);
      }
      assert((await page.locator('.pricing-total-value').textContent()).includes('400 – 490'));
      await page.locator('[data-for="pricing-case"] [data-value="plywood-case"]').click();
      assert((await page.locator('#pricing-tbody').textContent()).includes('Sklejka brzozowa 6 mm'));
      await page.locator('button[data-sort-key="name"]').click();
      const firstNameAsc = await page.locator('#pricing-tbody tr td strong').first().textContent();
      assert(firstNameAsc.includes('Przycisk arcade') || firstNameAsc.includes('Arcade') || firstNameAsc.includes('Głośnik'));
      await page.locator('[data-for="pricing-case"] [data-value="3d-print"]').click();
      await noOverflow();

      // Obudowa: Switch to Sklejka via top big button
      await page.locator('[data-subview="sklejka"]').click();
      assert.equal(await page.locator('#subview-sklejka').isVisible(), true);
      await scene('case', 'enclosure');
      for (const mode of ['internals', 'exploded', 'enclosure']) {
        await page.locator(`[data-for="assembly-mode"] [data-value="${mode}"]`).click();
        await scene('case', mode);
      }
      await page.locator('#show-wood').uncheck(); await page.locator('#show-wood').check();
      await page.locator('#show-labels').check(); await page.locator('#show-labels').uncheck();
      await noOverflow();

      // Switch to Elektronika tab
      await page.getByRole('tab', { name: 'Elektronika' }).click();
      await scene('raspberry');
      assert.equal(await page.locator('#hardware-diagram-card').isVisible(), true);
      assert.equal(await page.locator('.hardware-diagram-img').isVisible(), true);
      const diagramBox = await page.locator('.hardware-diagram-img').boundingBox();
      assert(diagramBox && diagramBox.height > 100, `Hardware diagram height must be > 100px, got ${diagramBox?.height}`);

      // Elektronika: Switch to PCB via top big button
      await page.locator('[data-controller="pcb"]').click();
      await scene('pcb');
      assert.equal(await page.locator('#pcb-wip-card').isVisible(), true);
      await page.locator('[data-for="pcb-mode"] [data-value="board"]').click();
      await scene('pcb', 'board');
      await page.locator('[data-for="pcb-mode"] [data-value="assembled"]').click();
      await scene('pcb', 'assembled');
      await page.locator('[data-controller="raspberry"]').click();
      await page.locator('#reset-camera').click();
      await noOverflow();

      // Switch to Oprogramowanie tab
      await page.getByRole('tab', { name: 'Oprogramowanie' }).click();
      assert.equal(await page.locator('#panel-oprogramowanie .wip-subpage-card').isVisible(), true);
      await noOverflow();

      // Switch to Inne tab
      await page.getByRole('tab', { name: 'Inne' }).click();
      assert.equal(await page.locator('#teaching-adr-content').isVisible(), false);
      await page.locator('#show-teaching-adr-btn').click();
      await page.waitForSelector('#teaching-adr-content .teaching-diagram[data-rendered="true"] svg');
      const teaching = await page.locator('#teaching-adr-content').textContent();
      for (const phrase of ['TEACHING MATERIAL · NOT A MEDICAL DEVICE · FOR EDUCATIONAL PURPOSES ONLY', 'Read this first', 'Alfa is not a medical device', 'Alfa-L does not exist', 'Nobody signed anything']) assert(teaching.includes(phrase), phrase);
      assert((await page.locator('#teaching-adr-content').evaluate(element => getComputedStyle(element, '::after').backgroundImage)).includes('TEACHING'), 'Teaching ADR watermark');
      assert(await page.locator('#teaching-adr-content').isVisible());
      assert((await page.locator('footer').textContent()).includes('To nie jest wyrób medyczny. Wyłącznie do celów edukacyjnych.'));
      assert.equal(await page.locator('.hub-download-card').count(), 3);
      await noOverflow();

      const teachingPdf = await page.request.get(`${origin}${prefix}docs/teaching-material-adr-example-not-a-medical-device.pdf`);
      assert((await teachingPdf.body()).subarray(0, 5).equals(Buffer.from('%PDF-')), 'Teaching ADR download must be a real PDF');
      assert((await (await page.request.get(`${origin}${prefix}docs/teaching-material-adr-example-not-a-medical-device.md`)).text()).includes('NOT A MEDICAL DEVICE'));
      for (const asset of ['docs/adr.md', 'docs/adr.pdf', 'og-cloud.png', 'docs/architecture.mmd', 'THIRD-PARTY-LICENSES.txt']) assert((await page.request.get(`${origin}${prefix}${asset}`)).ok());

      // Direct links and refreshes must work without server-side routing.
      await page.goto(`${origin}${prefix}#elektronika`, { waitUntil: 'networkidle' });
      await scene('raspberry');
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForSelector('html[data-ready="true"]'); await scene('raspberry');
      await page.getByRole('tab', { name: 'Elektronika' }).focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.getByRole('tab', { name: 'Oprogramowanie' }).getAttribute('aria-selected'), 'true');
      for (const [hashTab, panelName] of [['software', 'oprogramowanie'], ['3dprint', 'obudowa'], ['elektronika', 'elektronika'], ['inne', 'inne'], ['glowna', 'glowna']]) {
        await page.goto(`${origin}${prefix}#${hashTab}`, { waitUntil: 'networkidle' });
        if (['3dprint', 'obudowa'].includes(hashTab)) await scene('cloud', 'assembled');
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForSelector('html[data-ready="true"]');
        assert.equal(await page.locator('#viewer-card').isVisible(), ['3dprint', 'obudowa', 'elektronika'].includes(hashTab));
        if (['3dprint', 'obudowa'].includes(hashTab)) await scene('cloud', 'assembled');
        assert.equal(await page.locator(`#panel-${panelName}`).isVisible(), true);
      }
      // Check v1 snapshot exists and is accessible
      const v1Resp = await page.request.get(`${origin}${prefix}v1/index.html`);
      assert(v1Resp.ok(), 'v1 snapshot must exist and be accessible');
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

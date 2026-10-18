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
  assert.equal(await page.locator('#cloud-color-front').inputValue(),'#86bfea');
  assert.equal(await page.locator('#cloud-color-rear').inputValue(),'#70acd9');
  const colorPanel=await page.locator('#cloud-colors').boundingBox();
  const downloads=await page.locator('.cloud-downloads').boundingBox();
  assert(colorPanel.width<=downloads.width/2+.5,'Desktop color panel must use at most half the page width');
  assert(colorPanel.y>=downloads.y+downloads.height,'Color controls must follow Print your cloud');
  const canvasBefore=await page.locator('#viewport canvas').screenshot();
  await page.locator('.palette-picker summary').click();
  assert.equal(await page.locator('.palette-options .palette-swatches i').count(),18);
  await page.getByRole('button',{name:'Cukierkowa chmurka',exact:true}).click();
  assert.equal(await page.locator('#cloud-color-front').inputValue(),'#ffd6e6');
  const canvasAfter=await page.locator('#viewport canvas').screenshot();
  assert(!canvasBefore.equals(canvasAfter),'Palette selection must repaint the actual 3D canvas');
  await page.locator('[data-part=front] summary').click();
  assert.equal(await page.locator('[data-part=front] .filament-color').count(),16);
  await page.getByRole('button',{name:'Skorupa przednia: Pomarańcz',exact:true}).click();
  assert.equal(await page.locator('#cloud-color-front').inputValue(),'#eb5403');
  assert.equal(await page.locator('#cloud-color-rear').inputValue(),'#d7c6f5');
  for(const [part,title,color,value] of [['rear','Skorupa tylna','Błękit nieba','#346ce3'],['battery_door','Drzwiczki baterii','Żółty','#f2b706']]) {
    await page.locator(`[data-part=${part}] summary`).click();
    assert.equal(await page.locator(`[data-part=${part}] .filament-color`).count(),16);
    await page.getByRole('button',{name:`${title}: ${color}`,exact:true}).click();
    assert.equal(await page.locator(`#cloud-color-${part}`).inputValue(),value);
    assert.equal(await page.locator('#cloud-color-front').inputValue(),'#eb5403');
  }
  await page.locator('.palette-picker summary').click();
  await page.getByRole('button',{name:'Cukierkowa chmurka',exact:true}).click();
  await page.locator('[data-part=front] summary').click();
  await page.locator('#cloud-color-front').fill('#aabbcc');
  assert.equal(await page.locator('.palette-name').textContent(),'Własne kolory');
  await page.reload(); await waitCloud('assembled');
  assert.equal(await page.locator('#cloud-color-front').inputValue(),'#aabbcc');
  assert.equal(await page.locator('#cloud-color-rear').inputValue(),'#d7c6f5');
  await page.locator('.palette-picker summary').click();
  await page.getByRole('button',{name:'Chmurowy błękit',exact:true}).click();
  assert.equal(await page.locator('#cloud-color-front').inputValue(),'#86bfea');
  const checks = await (await page.request.get(`${base}cloud/verification.json`)).json();
  assert(checks.passed); assert(checks.checks.length > 100);
  const manifest = await (await page.request.get(`${base}cloud/manifest.json`)).json();
  assert(manifest.frame_features.length > 30);
  assert.equal(new Set(manifest.frame_features.map(item => item.id)).size, manifest.frame_features.length);
  await page.locator('#cloud-labels').check();
  const frontLabel = page.locator('.annotation').filter({ hasText: /^F-00 · Skorupa przednia$/ });
  const lcdLabel = page.locator('.annotation').filter({ hasText: /^Wyświetlacz LCD Waveshare, 2 cale$/ });
  await frontLabel.waitFor({ state: 'visible' });
  // Raycast through the label's projected centre onto the real CAD surface.
  // A mount behind the front skin must not override the visible shell ID.
  for (const [label,id,title] of [[frontLabel,'F-00','Skorupa przednia'],[lcdLabel,'lcd','Wyświetlacz LCD Waveshare, 2 cale']]) {
    await label.scrollIntoViewIfNeeded();
    const rect = await label.boundingBox(); assert(rect);
    await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
    await page.waitForFunction(id => document.querySelector('#viewport').dataset.hoverId === id,id);
    assert((await page.locator('.model-tooltip').textContent()).includes(title));
    await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);
    assert((await page.locator('#viewer-status').textContent()).includes(title));
  }
  await page.locator('[data-for="cloud-mode"] [data-value="battery_open"]').click(); await waitCloud('battery_open');
  const rearLabel=page.locator('.annotation').filter({hasText:/^R-00 · Skorupa tylna$/});
  await rearLabel.waitFor({state:'visible'});
  await rearLabel.scrollIntoViewIfNeeded();
  const rearRect=await rearLabel.boundingBox(); assert(rearRect);
  await page.mouse.move(rearRect.x+rearRect.width/2,rearRect.y+rearRect.height/2);
  await page.waitForFunction(()=>document.querySelector('#viewport').dataset.hoverId==='R-00');
  await page.locator('#cloud-labels').uncheck();
  await mkdir('test-results',{recursive:true});
  await page.locator('#viewport').screenshot({path:'test-results/cloud-rear.png'});
  await page.locator('[data-for="cloud-mode"] [data-value="assembled"]').click(); await waitCloud('assembled');
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
  await page.getByRole('tab', { name: 'Elektronika' }).click();
  await page.waitForSelector('#viewport[data-scene="raspberry"][data-loaded="true"]');
  await page.getByRole('tab', { name: 'Obudowa' }).click(); await waitCloud('assembled');
  // Warm all resources before measuring bounded growth.
  const before = await page.evaluate(() => window.__cloudViewerStats?.());
  const modes = ['exploded', 'inside', 'battery_open', 'assembled'];
  const started = Date.now();
  for (let i = 0; i < 100; i++) {
    const mode = modes[i % modes.length];
    await page.locator(`[data-for="cloud-mode"] [data-value="${mode}"]`).click(); await waitCloud(mode);
    await page.setViewportSize(i % 2 ? { width: 1440, height: 1000 } : { width: 375, height: 812 });
    await page.getByRole('tab', { name: 'Oprogramowanie' }).click();
    await page.getByRole('tab', { name: 'Obudowa' }).click(); await waitCloud(mode);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at cycle ${i}`);
    assert.equal(await page.locator('#viewport canvas').count(), 1);
  }
  const after = await page.evaluate(() => window.__cloudViewerStats?.());
  if (before && after) {
    assert.equal(after.scenes, before.scenes);
    assert(after.geometries <= before.geometries + 2, JSON.stringify({ before, after }));
    assert(after.textures <= before.textures + 1);
  }
  await page.setViewportSize({width:375,height:812});
  for(const part of ['front','rear','battery_door']) {
    await page.locator(`[data-part=${part}] summary`).click();
    const menu=await page.locator(`[data-part=${part}] .filament-menu`).boundingBox();
    assert(menu.x>=0 && menu.x+menu.width<=375,'Mobile filament menu must fit the screen');
    await page.locator(`[data-part=${part}] summary`).press('Escape');
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('[data-for="cloud-mode"] [data-value="assembled"]').click(); await waitCloud('assembled');
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/cloud-radio.png', fullPage: true });
  // Keep a high oblique detail view so shoulder changes can be reviewed.
  const canvas = page.locator('#viewport canvas');
  await canvas.scrollIntoViewIfNeeded();
  const rect = await canvas.boundingBox();
  const x=rect.x+rect.width/2,y=rect.y+rect.height*.45;
  await page.mouse.move(x,y); await page.mouse.down();
  await page.mouse.move(x,y+rect.height*.09,{steps:16}); await page.mouse.up();
  await page.waitForTimeout(700);
  await page.locator('#viewport').screenshot({path:'test-results/cloud-handle.png'});
  await page.locator('[data-part=front] summary').click();
  await page.screenshot({path:'test-results/cloud-colors.png',fullPage:true});
  assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  const report = { passed: true, cycles: 100, elapsed_ms: Date.now()-started, geometry_checks: checks.checks.length, before, after, base };
  await writeFile('test-results/cloud-stress.json', JSON.stringify(report, null, 2)+'\n');
  console.log(JSON.stringify(report));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}

import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {brandCard} from './brand-art.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const base=(process.argv[2]||'http://127.0.0.1:8000/').replace(/\/?$/,'/');
await Promise.all(['docs/images','web/assets','.github'].map(p=>mkdir(resolve(root,p),{recursive:true})));
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  const page=await browser.newPage({viewport:{width:1400,height:1200},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(new URL('render.html',base).href);
  await page.waitForFunction(()=>window.renderReady);
  await page.evaluate(()=>window.renderReady);
  const report={},transparent={};
  for(const view of ['assembled','exploded','rear','side']){
    const size=view==='exploded'?{width:1800,height:1000}:{width:1400,height:1200};
    await page.setViewportSize(size);
    report[view]=await page.evaluate(options=>window.renderCloud(options),{view,...size});
    transparent[view]=await page.locator('canvas').screenshot({omitBackground:true});
    if(view==='assembled')await writeFile(resolve(root,'web/assets/cloud-render.png'),transparent[view]);
    await page.evaluate(()=>{document.body.style.background='#fff2c6'});
    await page.locator('canvas').screenshot({path:resolve(root,`docs/images/cloud-${view}.png`)});
    await page.evaluate(()=>{document.body.style.background='transparent'});
  }
  const extraViews = [
    { view: 'connections', width: 1400, height: 1050, path: 'docs/images/hardware-connections.png' },
    { view: 'case_inside', width: 1200, height: 1200, path: 'docs/images/inside-back-case.png' },
    { view: 'roentgen', width: 1400, height: 1200, path: 'docs/images/roentgen-look.png' },
  ];
  for (const { view, width, height, path } of extraViews) {
    await page.setViewportSize({ width, height });
    report[view] = await page.evaluate(options => window.renderCloud(options), { view, width, height });
    if(view==='case_inside'&&(report[view].scene!=='cloud'||report[view].visibleParts.join(',')!=='rear'))throw new Error('Inside-back render must show the rear shell with the flat battery and rear Pi mounts');
    if(view==='roentgen'&&report[view].scene!=='cloud')throw new Error('X-ray render must use the current cloud CAD');
    await page.evaluate(() => { document.body.style.background = '#fff2c6'; });
    await page.locator('canvas').screenshot({ path: resolve(root, path) });
    await page.evaluate(() => { document.body.style.background = 'transparent'; });
  }
  const assembled=`data:image/png;base64,${(await readFile(resolve(root,'web/assets/cloud-render.png'))).toString('base64')}`;
  const exploded=`data:image/png;base64,${transparent.exploded.toString('base64')}`;
  for(const [kind,width,height,path,image] of [
    ['social',1200,630,'web/assets/og-cloud.png',assembled],
    ['github',1280,640,'.github/social-preview.png',assembled],
    ['readme',1600,840,'docs/images/readme-banner.png',assembled],
    ['assembly',1600,900,'docs/images/cloud-assembly.png',exploded],
  ]){
    await page.setViewportSize({width,height});
    await page.setContent(brandCard({image,kind,width,height}));
    await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode())));
    await page.screenshot({path:resolve(root,path)});
  }
  if(errors.length)throw new Error(errors.join('\n'));
  await writeFile(resolve(root,'docs/images/render-manifest.json'),JSON.stringify({source:'Verified cloud-radio.glb; web/render.js; default Cloud blue palette',renders:report},null,2)+'\n');
  console.log(`Rendered ${report.assembled.revision}: CAD views, hardware connections, inside back case, roentgen view, README cards.`);
}finally{await browser.close()}

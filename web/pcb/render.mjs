import {chromium} from 'playwright';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');

export async function renderPcbImages(baseURL) {
  let server,browser;
  try {
    if(!baseURL) {
      server=await createServer({configFile:resolve(root,'web/vite.config.js'),logLevel:'error',server:{host:'127.0.0.1',port:0,strictPort:false}});
      await server.listen();baseURL=`http://127.0.0.1:${server.httpServer.address().port}/`;
    }
    browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const page=await browser.newPage({viewport:{width:1600,height:1150},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(new URL('?controller=pcb#hardware',baseURL).href,{waitUntil:'networkidle'});
    await page.waitForSelector('#viewport[data-scene="pcb"][data-loaded="true"]');
    await page.locator('#pcb-labels').uncheck();
    await page.waitForTimeout(350);
    const assembled=await page.locator('#viewport').screenshot();
    const boardBtn=page.locator('[data-for="pcb-mode"] [data-value="board"]');
    if(await boardBtn.count()) await boardBtn.click();
    else await page.selectOption('#pcb-mode','board');
    await page.waitForSelector('#viewport[data-mode="board"]');
    await page.waitForTimeout(200);
    const board=await page.locator('#viewport').screenshot();
    if(errors.length)throw new Error(errors.join('\n'));
    await mkdir(resolve(root,'docs/images'),{recursive:true});
    await mkdir(resolve(root,'web/assets'),{recursive:true});
    const image=`data:image/png;base64,${assembled.toString('base64')}`;
    const detail=`data:image/png;base64,${board.toString('base64')}`;
    function card(width,height) {
      return `<!doctype html><html><head><style>*{box-sizing:border-box}body{margin:0;width:${width}px;height:${height}px;background:#edf1fc;color:#263a44;font:20px Arial,sans-serif;padding:44px;display:flex;flex-direction:column}.tag{color:#55736e;font-size:15px;letter-spacing:3px;font-weight:bold}h1{font-size:54px;margin:12px 0 8px;letter-spacing:-2px}.lead{margin:0;color:#57717b;font-size:21px}.content{display:flex;min-height:0;flex:1;gap:28px;align-items:center}.main{width:73%;height:100%;object-fit:contain}.detail{width:100%;height:150px;object-fit:contain}.facts{flex:1;font-size:18px;line-height:1.8}.facts b{font-size:21px}.foot{font-size:15px;color:#617983;display:flex;justify-content:space-between}</style></head><body><div class="tag">ALFA / HARDWARE PROTOTYPE A</div><h1>Raspi 3 PCB</h1><p class="lead">The ADC, amplifier and divider. One Raspberry Pi shield.</p><div class="content"><img class="main" src="${image}"><div class="facts"><b>65 × 56 mm</b><br>ADS1115 ADC<br>MAX98357A audio<br>3 keyed connectors<br>2 copper layers<img class="detail" src="${detail}"></div></div><div class="foot"><span>Rendered from the KiCad PCB · hardware validation pending</span><span>hvitis.github.io/Alfa/pcb/ ↗</span></div></body></html>`;
    }
    for(const [width,height,file] of [[1600,900,'docs/images/pi3-shield.png'],[1200,630,'web/assets/og-pcb.png']]) {
      await page.setViewportSize({width,height});
      await page.setContent(card(width,height));
      await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode())));
      await page.screenshot({path:resolve(root,file)});
    }
    console.log('Rendered PCB README and social images from the KiCad 3D model.');
  } finally {await browser?.close();await server?.close();}
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await renderPcbImages(process.argv[2]);

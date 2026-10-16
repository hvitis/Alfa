import {chromium} from 'playwright';
import MarkdownIt from 'markdown-it';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {adrDocument} from './adr-document.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export async function exportAdr(destination) {
  const md=await readFile(resolve(root,'web/content/adr.md'),'utf8');
  const image=`data:image/png;base64,${(await readFile(resolve(root,'web/assets/cloud-render.png'))).toString('base64')}`;
  const html=adrDocument(new MarkdownIt({html:false}).render(md),image);
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage();
    await page.setContent(html,{waitUntil:'load'});
    await page.emulateMedia({media:'print'});
    await page.evaluate(()=>document.fonts.ready);
    const overflow=await page.locator('.page').evaluateAll(pages=>pages.map((page,i)=>({page:i+1,height:page.getBoundingClientRect().height})).filter(page=>page.height>1124));
    if(overflow.length)throw new Error(`ADR content exceeds A4 pages: ${JSON.stringify(overflow)}`);
    const pdf=await page.pdf({preferCSSPageSize:true,printBackground:true,tagged:true,outline:true});
    await mkdir(dirname(destination),{recursive:true});
    await writeFile(`${destination}.tmp`,pdf);await rename(`${destination}.tmp`,destination);
    console.log(`Exported illustrated ADR PDF: ${destination}`);
  }finally{await browser.close()}
}
if(process.argv[1]===fileURLToPath(import.meta.url))await exportAdr(resolve(process.argv[2]||'web/.generated/adr.pdf'));

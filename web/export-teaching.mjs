// Teaching ADR export: every PDF page carries the diagonal watermark and the disclaimer footer.
import {chromium} from 'playwright';
import MarkdownIt from 'markdown-it';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const TEACHING_SOURCE=resolve(root,'web/content/teaching-adr.md');
// The published name repeats the disclaimer, so a forwarded file still says what it is.
export const TEACHING_FILE='teaching-material-adr-example-not-a-medical-device';
export const WATERMARK='TEACHING MATERIAL';
export const FOOTER='TEACHING MATERIAL · Not a medical device · For educational purposes only';
const REQUIRED=['TEACHING MATERIAL · NOT A MEDICAL DEVICE · FOR EDUCATIONAL PURPOSES ONLY','## Read this first','### Purpose of this document',
  'Alfa is not a medical device','Alfa-L does not exist','Nobody signed anything','not legal, regulatory, clinical, or medical advice','## End of teaching example'];

// The build refuses to publish the example if an edit removes any part of its disclaimer.
export async function teachingMarkdown(source=TEACHING_SOURCE) {
  const markdown=await readFile(source,'utf8');
  const missing=REQUIRED.filter(phrase=>!markdown.includes(phrase));
  if(missing.length)throw new Error(`Teaching ADR disclaimer is incomplete; missing: ${missing.join(' | ')}`);
  return markdown;
}

// Shared by the website and the PDF. IDs such as SRS-010 never break at their hyphen; Mermaid sources stay untouched.
export function renderTeaching(markdown) {
  return new MarkdownIt({html:false}).render(markdown).split(/(<pre>[\s\S]*?<\/pre>)/)
    .map(part=>part.startsWith('<pre>')?part:part.replace(/\b[A-Z][A-Z0-9]{1,5}(?:-[A-Z0-9]{1,5})*-\d{2,4}\b/g,'<span class="id">$&</span>')).join('');
}

const style=`@page{size:A4;margin:20mm 16mm 18mm}*{box-sizing:border-box}.id{white-space:nowrap}
html{color:#241f33;font:9.4pt/1.5 -apple-system,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0}
.watermark{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:2}
.watermark span{transform:rotate(-45deg);font:800 58pt/1 Arial,Helvetica,sans-serif;letter-spacing:.04em;color:rgba(180,35,24,.13);white-space:nowrap}
h1{font-size:21pt;line-height:1.2;margin:0 0 12pt}h2{font-size:13pt;margin:16pt 0 6pt;padding-bottom:3pt;border-bottom:1.2pt solid #241f33;break-after:avoid}
h3{font-size:10.5pt;margin:10pt 0 3pt;break-after:avoid}p,li{margin:3pt 0}ul{padding-left:14pt;margin:4pt 0}a{color:inherit}
blockquote{margin:0 0 10pt;padding:8pt 11pt;border:2pt solid #b42318;border-radius:6pt;background:#fdecea;color:#7a1f16}blockquote p{margin:2pt 0}
table{width:100%;border-collapse:collapse;margin:6pt 0 8pt;font-size:7.6pt;line-height:1.38}tr{break-inside:avoid}
th,td{border:.6pt solid #c9c3d6;padding:3pt 4.5pt;text-align:left;vertical-align:top;overflow-wrap:break-word}th{background:#eeeaf5}
code{font:7.4pt ui-monospace,Menlo,monospace;background:#f1eef7;padding:0 2pt;border-radius:2pt;overflow-wrap:break-word}
pre.mermaid{display:flex;justify-content:center;margin:8pt 0;break-inside:avoid}pre.mermaid svg{max-width:100%;height:auto;max-height:150mm}
.record{break-before:page}`;
const bar='width:100%;padding:0 16mm;box-sizing:border-box;display:flex;justify-content:space-between;font:7pt Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact';
const headerTemplate=`<div style="${bar};color:#6b6478"><span>Alfa · AL-ADR-0001 · Fictional worked example</span><span>Not a real record</span></div>`;
const footerTemplate=`<div style="${bar};color:#b42318;font-weight:bold"><span>${FOOTER}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;

// Page 1 is the title and "Read this first". The record itself starts on page 2.
export function teachingDocument(html) {
  const body=html.replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,'<pre class="mermaid">$1</pre>');
  const cut=body.indexOf('<h2>Document control</h2>');
  if(cut<0)throw new Error('Teaching ADR needs a "Document control" section after its notice.');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>TEACHING MATERIAL · Fictional ADR example · Not a medical device</title><style>${style}</style>
<div class="watermark" aria-hidden="true"><span>${WATERMARK}</span></div><main><section>${body.slice(0,cut)}</section><section class="record">${body.slice(cut)}</section></main></html>`;
}

export async function exportTeachingAdr(destination) {
  const html=teachingDocument(renderTeaching(await teachingMarkdown()));
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage();
    await page.setContent(html,{waitUntil:'load'});
    await page.addScriptTag({path:resolve(root,'node_modules/mermaid/dist/mermaid.min.js')});
    await page.evaluate(async()=>{
      mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:'base',fontFamily:'Helvetica, Arial, sans-serif',
        themeVariables:{primaryColor:'#e8ddff',primaryTextColor:'#241f33',primaryBorderColor:'#8b7bad',lineColor:'#75678f',clusterBkg:'#fcf8ff',clusterBorder:'#c9bbdf',fontSize:'12px'},
        flowchart:{htmlLabels:false,curve:'basis'}});
      await mermaid.run({querySelector:'pre.mermaid'});
    });
    await page.emulateMedia({media:'print'});
    await page.evaluate(()=>document.fonts.ready);
    const pdf=await page.pdf({preferCSSPageSize:true,printBackground:true,tagged:true,outline:true,displayHeaderFooter:true,headerTemplate,footerTemplate});
    await mkdir(dirname(destination),{recursive:true});
    await writeFile(`${destination}.tmp`,pdf);await rename(`${destination}.tmp`,destination);
    console.log(`Exported teaching ADR PDF: ${destination}`);
  }finally{await browser.close()}
}
if(process.argv[1]===fileURLToPath(import.meta.url))await exportTeachingAdr(resolve(process.argv[2]||`web/.generated/${TEACHING_FILE}.pdf`));

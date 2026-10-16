import {build} from 'vite';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../../design/wooden-case');
await build({configFile:false,root:resolve(root,'../../web/hardware-visualisation/case-planner'),resolve:{alias:[{find:'three/addons',replacement:resolve(root,'../../node_modules/three/examples/jsm')},{find:'three',replacement:resolve(root,'../../node_modules/three/build/three.module.js')}]},build:{outDir:resolve(root,'viewer-dist'),emptyOutDir:true,assetsInlineLimit:Infinity,minify:true,rolldownOptions:{output:{codeSplitting:false}}}});
let html=await readFile(resolve(root,'viewer-dist/index.html'),'utf8');
const names=await readdir(resolve(root,'viewer-dist/assets'));
for(const name of names){const code=await readFile(resolve(root,'viewer-dist/assets',name),'utf8');if(name.endsWith('.js'))html=html.replace(/<script[^>]+src="[^"]+\.js"[^>]*><\/script>/,()=>`<script type="module">${code.replaceAll('</script','<\\/script')}</script>`);if(name.endsWith('.css'))html=html.replace(/<link[^>]+href="[^"]+\.css"[^>]*>/,()=>`<style>${code}</style>`);}
const glb={};for(const name of ['enclosure','internals','exploded'])glb[name]=(await readFile(resolve(root,'GLB',name+'.glb'))).toString('base64');
const data=JSON.parse(await readFile(resolve(root,'routing.json'),'utf8'));
html=html.replace('</head>',()=>`<script>window.__CASE_GLB__=${JSON.stringify(glb)};window.__CASE_DATA__=${JSON.stringify(data)};</script></head>`);
await writeFile(resolve(root,'viewer.html'),html);console.log('Wrote fully offline viewer.html with embedded native CAD models.');

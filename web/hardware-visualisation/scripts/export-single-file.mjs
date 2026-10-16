import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let html = await readFile(resolve(root, 'dist/index.html'), 'utf8');
const script = html.match(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/);
if (!script) throw new Error('Built entry script was not found.');
const js = await readFile(resolve(root, 'dist', script[1]), 'utf8');
html = html.replace(script[0], () => '<script type="module">\n' + js.replace(/<\/script/gi, '<\\/script') + '\n</script>');
const styles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)];
for (const style of styles) {
  const css = await readFile(resolve(root, 'dist', style[1]), 'utf8');
  html = html.replace(style[0], () => '<style>' + css + '</style>');
}
html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/, '');

const caseGlb = {};
for (const name of ['enclosure', 'internals', 'exploded']) {
  const buf = await readFile(resolve(root, 'src/data/case-glb', name + '.glb'));
  caseGlb[name] = buf.toString('base64');
}

const radioGlb = {};
for (const name of ['assembled', 'roof_open', 'inside', 'exploded']) {
  const buf = await readFile(resolve(root, 'src/data/radio-glb', `house_${name}.glb`));
  radioGlb[name] = buf.toString('base64');
}

const radioImages = {};
const imgDir = resolve(root, 'src/data/radio-images');
const imgFiles = await readdir(imgDir);
for (const file of imgFiles) {
  if (file.endsWith('.png')) {
    const key = file.replace(/\.png$/, '');
    const buf = await readFile(resolve(imgDir, file));
    radioImages[key] = `data:image/png;base64,${buf.toString('base64')}`;
  }
}

const embeddedScript = `<script>
window.__CASE_GLB__=${JSON.stringify(caseGlb)};
window.__RADIO_GLB__=${JSON.stringify(radioGlb)};
window.__RADIO_IMAGES__=${JSON.stringify(radioImages)};
</script>`;
html = html.replace('</head>', () => `${embeddedScript}</head>`);

// Embedded shader templates contain vendor indentation; keep generated HTML clean.
html = html.replace(/[ \t]+$/gm, '').replace(/^[ \t]+/gm, indent => indent.replaceAll('\t', '  '));
await writeFile(resolve(root, 'viewer.html'), html);
await writeFile(resolve(root, '../output/wiring-3d.html'), html);
console.log('Exported viewer.html with embedded CAD models and updated output/wiring-3d.html.');

import { build } from 'vite';
import { exportAdr } from './export-pdf.mjs';
import { exportTeachingAdr, renderTeaching, teachingMarkdown, TEACHING_FILE } from './export-teaching.mjs';
import { exportPlywoodGuide } from './export-plywood-guide.mjs';
import { writeEnglishPage } from './i18n-html.mjs';
import {pcbPage} from './pcb/page.mjs';
import {renderPcbImages} from './pcb/render.mjs';
import MarkdownIt from 'markdown-it';
import { readFile, writeFile, mkdir, copyFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = dirname(fileURLToPath(import.meta.url));
const root = resolve(web, '..');
const destination = resolve(process.argv[2] || resolve(root, '_site'));
const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false });
await mkdir(resolve(web, '.generated'), { recursive: true });
await writeFile(resolve(web, '.generated/adr.html'), markdown.render(await readFile(resolve(web, 'content/adr.md'), 'utf8')));
await writeFile(resolve(web, '.generated/adr.pl.html'), markdown.render(await readFile(resolve(web, 'content/adr.pl.md'), 'utf8')));
// teachingMarkdown() stops the build if the fictional example loses any part of its disclaimer.
await writeFile(resolve(web, '.generated/teaching-adr.html'), renderTeaching(await teachingMarkdown()));
await writeFile(resolve(web, '.generated/teaching-adr.pl.html'), renderTeaching(await readFile(resolve(web, 'content/teaching-adr.pl.md'), 'utf8')));
await renderPcbImages();
await build({ configFile: resolve(web, 'vite.config.js'), logLevel: 'warn', build: { outDir: destination } });
await writeEnglishPage(destination);
await mkdir(resolve(destination,'pcb'),{recursive:true});
await writeFile(resolve(destination,'pcb/index.html'),pcbPage(await readFile(resolve(destination,'index.html'),'utf8')));
await copyFile(resolve(web,'assets/og-pcb.png'),resolve(destination,'og-pcb.png'));
await mkdir(resolve(destination, 'data'), { recursive: true });
await mkdir(resolve(destination, 'docs'), { recursive: true });
await copyFile(resolve(web, '.generated/manifest.json'), resolve(destination, 'data/manifest.json'));
await copyFile(resolve(web, 'content/adr.md'), resolve(destination, 'docs/adr.md'));
await copyFile(resolve(web, 'content/adr.pl.md'), resolve(destination, 'docs/adr.pl.md'));
await copyFile(resolve(web, 'content/teaching-adr.md'), resolve(destination, `docs/${TEACHING_FILE}.md`));
await copyFile(resolve(web, 'content/teaching-adr.pl.md'), resolve(destination, 'docs/teaching-adr.pl.md'));
await copyFile(resolve(web, 'content/architecture.mmd'), resolve(destination, 'docs/architecture.mmd'));
await copyFile(resolve(web, 'assets/wiring-diagram.svg'), resolve(destination, 'docs/wiring-diagram.svg'));
await mkdir(resolve(destination, 'assets'), { recursive: true });
for (const file of ['house-preview.png', 'pcb-render.svg', 'pdf-preview.png', 'software-architecture.png']) {
  await copyFile(resolve(web, `assets/${file}`), resolve(destination, `assets/${file}`));
}
await writeFile(resolve(destination, '.nojekyll'), '');
await copyFile(resolve(web, 'assets/og-cloud.png'), resolve(destination, 'og-cloud.png'));
await exportAdr(resolve(destination, 'docs/adr.pdf'));
await copyFile(resolve(destination, 'docs/adr.pdf'),resolve(web,'.generated/adr.pdf'));
await exportTeachingAdr(resolve(destination, `docs/${TEACHING_FILE}.pdf`));
await exportPlywoodGuide(resolve(destination, 'docs/plywood-assembly-guide.pdf'));
await copyFile(resolve(destination, 'docs/plywood-assembly-guide.pdf'), resolve(web, '.generated/plywood-assembly-guide.pdf'));
await copyFile(resolve(destination, 'docs/plywood-assembly-guide.pdf'), resolve(root, 'design/cloud-radio/generated/cloud/plywood-assembly-guide.pdf'));
// Retain notices for installed packages, including dependencies bundled by Mermaid.
const lock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'));
const notices = ['Third-party package notices for the static website.\nOriginal project code: MIT.\n'];
for (const [directory, entry] of Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b))) {
  if (!directory.startsWith('node_modules/')) continue;
  const location = resolve(root, directory);
  let files;
  try { files = await readdir(location); } catch { continue; }
  const licenses = files.filter(name => /^(?:licen[sc]e|copying|notice)(?:[.-]|$)/i.test(name)).sort();
  for (const name of licenses) {
    try {
      notices.push(`\n--- ${directory} ${entry.version} / ${name} ---\n${await readFile(resolve(location, name), 'utf8')}`);
    } catch { /* Some distributions use a license directory instead of a file. */ }
  }
}
await writeFile(resolve(destination, 'THIRD-PARTY-LICENSES.txt'), notices.join('\n'));
console.log(`Exported complete GitHub Pages site to ${destination}`);

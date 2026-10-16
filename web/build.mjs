import { build } from 'vite';
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
await build({ configFile: resolve(web, 'vite.config.js'), logLevel: 'warn', build: { outDir: destination } });
await mkdir(resolve(destination, 'data'), { recursive: true });
await mkdir(resolve(destination, 'docs'), { recursive: true });
await copyFile(resolve(web, '.generated/manifest.json'), resolve(destination, 'data/manifest.json'));
await copyFile(resolve(web, 'content/adr.md'), resolve(destination, 'docs/adr.md'));
await copyFile(resolve(web, 'content/architecture.mmd'), resolve(destination, 'docs/architecture.mmd'));
await writeFile(resolve(destination, '.nojekyll'), '');
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

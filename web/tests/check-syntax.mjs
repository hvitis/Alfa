import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { messages } from '../i18n.js';
import { englishPage } from '../i18n-html.mjs';

let count = 0;
function walk(directory) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'data', '.generated', '.venv', '__pycache__'].includes(item.name)) continue;
    const file = path.join(directory, item.name);
    if (item.isDirectory()) walk(file);
    else if (/\.(?:js|mjs)$/.test(item.name)) {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
      count++;
    }
  }
}
for (const directory of ['web', 'tests']) walk(directory);
const html = readFileSync('web/index.html', 'utf8');
if (/(?:src|href)=["']\/(?!\/)/.test(html)) throw new Error('Showcase URLs must be relative');
if (!html.includes('<html lang="pl"')) throw new Error('The default page must be Polish');
const keys = [...html.matchAll(/data-i18n(?:-[a-z0-9-]+)?="([^"]+)"/g)].map(match => match[1]);
const missing = [...new Set(keys.filter(key => messages.en[key] == null))];
if (missing.length) throw new Error(`Missing English translation: ${missing.join(', ')}`);
const english = englishPage(html);
if (!english.includes('<html lang="en"')) throw new Error('English page must set lang=en');
if (!english.includes('<base href="../">')) throw new Error('English page must resolve assets from the site root');
if (!english.includes('Little radio.')) throw new Error('English page must translate the hero');
const teachingPl = readFileSync('web/content/teaching-adr.pl.md', 'utf8');
const teachingEn = readFileSync('web/content/teaching-adr.md', 'utf8');
const mermaid = teachingEn.match(/```mermaid[\s\S]*?```/)?.[0];
if (!mermaid || !teachingPl.includes(mermaid)) throw new Error('Polish teaching ADR must keep the English architecture diagram');
for (const phrase of ['TEACHING MATERIAL · NOT A MEDICAL DEVICE · FOR EDUCATIONAL PURPOSES ONLY', 'Read this first', 'Alfa is not a medical device', 'Alfa-L does not exist', 'Nobody signed anything']) {
  if (!teachingPl.includes(phrase)) throw new Error(`Polish teaching ADR is missing: ${phrase}`);
}
console.log(`PASS: ${count} JavaScript modules, showcase asset paths, and both languages`);

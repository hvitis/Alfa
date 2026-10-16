import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

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
console.log(`PASS: ${count} JavaScript modules and showcase asset paths`);

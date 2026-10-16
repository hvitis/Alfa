import { execFileSync } from 'node:child_process';
import { dirname,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
execFileSync(process.execPath,[resolve(root,'node_modules/vite/bin/vite.js'),'build'],{cwd:root,stdio:'inherit'});
await import('./export-single-file.mjs');

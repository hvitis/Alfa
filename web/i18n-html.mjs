import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { messages } from './i18n.js';
import {pcbPage} from './pcb/page.mjs';

const indexPath = fileURLToPath(new URL('./index.html', import.meta.url));

function escapeAttr(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

function findClose(html, from, name) {
  const openRe = new RegExp(`<${name}(?:\\s|>|/)`, 'gi');
  const closeRe = new RegExp(`</${name}\\s*>`, 'gi');
  let depth = 1;
  let i = from;
  while (i < html.length) {
    openRe.lastIndex = i;
    closeRe.lastIndex = i;
    const open = openRe.exec(html);
    const close = closeRe.exec(html);
    if (!close) break;
    if (open && open.index < close.index) {
      const end = html.indexOf('>', open.index);
      if (html[end - 1] !== '/') depth += 1;
      i = end + 1;
      continue;
    }
    depth -= 1;
    i = close.index + close[0].length;
    if (depth === 0) return i;
  }
  throw new Error(`Unclosed <${name}> in language template`);
}

function rewriteTag(tag, dict) {
  const specs = [...tag.matchAll(/data-i18n-([a-z0-9-]+)="([^"]+)"/g)];
  if (!specs.length) return tag;
  let next = tag;
  for (const [, attr, key] of specs) {
    const value = dict[key];
    if (value == null) throw new Error(`Missing English translation for ${key}`);
    const re = new RegExp(`(\\s${attr}=")[^"]*(")`);
    if (!re.test(next)) throw new Error(`Tag is missing ${attr} for ${key}`);
    next = next.replace(re, `$1${escapeAttr(value)}$2`);
  }
  return next;
}

function replaceText(html, dict) {
  const needle = 'data-i18n="';
  let out = '';
  let i = 0;
  while (i < html.length) {
    const at = html.indexOf(needle, i);
    if (at < 0) return out + html.slice(i);
    const tagStart = html.lastIndexOf('<', at);
    const tagEnd = html.indexOf('>', at);
    const keyEnd = html.indexOf('"', at + needle.length);
    const key = html.slice(at + needle.length, keyEnd);
    const value = dict[key];
    if (value == null) throw new Error(`Missing English translation for ${key}`);
    const name = html.slice(tagStart + 1).match(/^([a-zA-Z0-9]+)/)[1];
    const closeEnd = findClose(html, tagEnd + 1, name);
    const tag = rewriteTag(html.slice(tagStart, tagEnd + 1), dict);
    out += html.slice(i, tagStart) + tag + value + `</${name}>`;
    i = closeEnd;
  }
  return out;
}

// Polish is the source document. English is the same structure with translated copy.
export function applyLocale(html, locale = 'pl') {
  const lang = locale === 'en' ? 'en' : 'pl';
  let next = html.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);
  if (lang !== 'en') return next;
  next = next.replace(/<[^>]+>/g, tag => rewriteTag(tag, messages.en));
  next = replaceText(next, messages.en);
  next = next.replace('hreflang="pl" lang="pl" aria-current="page"', 'hreflang="pl" lang="pl"');
  next = next.replace('hreflang="en" lang="en">', 'hreflang="en" lang="en" aria-current="page">');
  return next;
}

export function englishPage(html) {
  const translated = applyLocale(html, 'en');
  if (translated.includes('<base ')) return translated;
  return translated.replace('<head>', '<head>\n  <base href="../">');
}

export function bilingualDevPlugin() {
  return {
    name: 'alfa-bilingual-pages',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        if (url.pathname === '/v1') {
          res.statusCode = 302;
          res.setHeader('Location', `/v1/${url.search}`);
          res.end();
          return;
        }
        if (url.pathname.startsWith('/v1/')) {
          req.url = req.url.replace(/^\/v1(\/|$)/, '/v1-snapshot$1');
          return next();
        }
        if(url.pathname==='/pcb') {
          res.statusCode=302;res.setHeader('Location',`/pcb/${url.search}`);res.end();return;
        }
        if(url.pathname==='/pcb/'||url.pathname==='/pcb/index.html') {
          try {
            const source=await readFile(indexPath,'utf8');
            const transformed=await server.transformIndexHtml('/index.html',source);
            res.statusCode=200;res.setHeader('Content-Type','text/html; charset=utf-8');res.end(pcbPage(transformed));
          } catch(error){next(error)}
          return;
        }
        if (url.pathname === '/en') {
          res.statusCode = 302;
          res.setHeader('Location', `/en/${url.search}`);
          res.end();
          return;
        }
        if (url.pathname !== '/en/' && url.pathname !== '/en/index.html') return next();
        try {
          const source = await readFile(indexPath, 'utf8');
          const transformed = await server.transformIndexHtml('/index.html', source);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(englishPage(transformed));
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

export async function writeEnglishPage(destination) {
  const html = await readFile(resolve(destination, 'index.html'), 'utf8');
  const target = resolve(destination, 'en/index.html');
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, englishPage(html));
}

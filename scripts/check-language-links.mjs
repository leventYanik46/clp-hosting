#!/usr/bin/env node
/**
 * Fails the build when a localized page links to a page in another language,
 * or to a same-language page that was not built.
 *
 * Rule: a visitor on /tr/... (or /es, /pt, /fr) must never be sent to an
 * English page. If a translation is missing, build the native page; do not
 * link to the English one. See src/data/practiceAreaMenu.ts for the menu side.
 *
 * Usage: node scripts/check-language-links.mjs [distDir]
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = process.argv[2] ?? 'dist';
const LANGS = ['tr', 'es', 'pt', 'fr'];
const SKIP_EXT = /\.(xml|pdf|css|js|svg|png|jpe?g|webp|avif|gif|ico|txt|json|mp4|woff2?|zip|docx)$/i;
const SKIP_PREFIX = ['/_astro/', '/admin', '/rss', '/sitemap', '/cdn-cgi/', '/images/', '/api/'];

const langOf = (path) => {
  const seg = path.split('/').filter(Boolean)[0];
  return LANGS.includes(seg) ? seg : 'en';
};

const exists = (path) => {
  const clean = path.replace(/\/+$/, '');
  if (clean === '') return true;
  const full = join(DIST, clean);
  return existsSync(join(full, 'index.html')) || (existsSync(full) && statSync(full).isFile()) || existsSync(`${full}.html`);
};

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name === 'index.html') out.push(full);
  }
  return out;
};

if (!existsSync(DIST)) {
  console.error(`check-language-links: ${DIST} not found; run the build first.`);
  process.exit(1);
}

const problems = new Map();
for (const lang of LANGS) {
  const root = join(DIST, lang);
  if (!existsSync(root)) continue;
  for (const file of walk(root)) {
    const page = '/' + file.slice(DIST.length + 1).replace(/\/?index\.html$/, '');
    const html = readFileSync(file, 'utf8');
    for (const match of html.matchAll(/<a\b[^>]*?\shref="([^"]*)"/gi)) {
      let href = match[1].trim();
      if (!href || /^(#|mailto:|tel:|sms:|javascript:|whatsapp:)/i.test(href)) continue;
      if (/^(https?:)?\/\//i.test(href)) {
        const own = href.match(/^https?:\/\/(www\.)?capitollawpartners\.com(\/.*)?$/i);
        if (!own) continue;
        href = own[2] || '/';
      }
      const path = href.split(/[?#]/)[0] || '/';
      if (SKIP_EXT.test(path) || SKIP_PREFIX.some((p) => path.startsWith(p))) continue;
      const targetLang = langOf(path);
      let reason;
      if (targetLang !== lang) reason = `links to ${targetLang.toUpperCase()} page`;
      else if (!exists(path)) reason = 'links to a page that was not built';
      if (!reason) continue;
      const key = `${reason}: ${path}`;
      if (!problems.has(key)) problems.set(key, new Set());
      problems.get(key).add(page);
    }
  }
}

if (problems.size === 0) {
  console.log('check-language-links: OK, every localized page links only within its own language.');
  process.exit(0);
}

console.error(`check-language-links: ${problems.size} cross-language or broken link target(s) found.`);
for (const [key, pages] of [...problems].sort((a, b) => b[1].size - a[1].size)) {
  const sample = [...pages].slice(0, 3).join(', ');
  console.error(`  ${key}  (on ${pages.size} page(s), e.g. ${sample})`);
}
console.error('Fix: build the native page and link to it. Never link a localized page to English.');
process.exit(1);

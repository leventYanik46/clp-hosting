import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import slugify from 'limax';

const rootDir = process.cwd();
const postsDir = path.join(rootDir, 'src/content/post');
const configPath = path.join(rootDir, 'src/config.yaml');

const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
const siteUrl = String(config?.site?.site || 'https://capitollawpartners.com');
const siteHost = new URL(siteUrl).hostname;
const defaultLanguage = String(config?.i18n?.defaultLanguage || 'en')
  .trim()
  .toLowerCase();
const defaultLanguageInSubdirRaw = config?.i18n?.default_language_in_subdir;

const parseBooleanLike = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value
      .trim()
      .replace(/,+$/g, '')
      .toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
};

const defaultLanguageInSubdir = parseBooleanLike(defaultLanguageInSubdirRaw, false);

const normalizePathname = (pathname = '/') => {
  let value = String(pathname || '/').trim();
  if (!value.startsWith('/')) value = `/${value}`;
  value = value.replace(/\/+/g, '/');
  if (value.length > 1 && value.endsWith('/')) value = value.slice(0, -1);
  return value || '/';
};

const sanitizeCanonical = (rawCanonical) => {
  if (!rawCanonical || typeof rawCanonical !== 'string') return undefined;

  const trimmedCanonical = rawCanonical
    .trim()
    .replace(/\u00a0/g, '')
    .replace(/\s+/g, '-');

  if (!trimmedCanonical) return undefined;

  try {
    const url = new URL(trimmedCanonical, siteUrl);
    url.protocol = 'https:';
    url.hostname = siteHost;
    url.search = '';
    url.hash = '';
    url.pathname = normalizePathname(url.pathname).toLowerCase();
    return url.toString();
  } catch {
    return undefined;
  }
};

const cleanSlug = (text = '') =>
  String(text)
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .map((segment) => slugify(segment))
    .join('/');

const getExpectedCanonical = (fileName, data) => {
  const slug = cleanSlug(fileName.replace(/\.(md|mdx)$/i, ''));
  const rawLang = data?.lang;
  const languageCodes = Array.isArray(rawLang)
    ? rawLang.filter((language) => typeof language === 'string' && language.trim().length > 0)
    : typeof rawLang === 'string' && rawLang.trim().length > 0
      ? [rawLang.trim()]
      : [defaultLanguage];
  const primaryLanguage = String(languageCodes[0] || defaultLanguage).toLowerCase();
  const languagePrefix = primaryLanguage === defaultLanguage && !defaultLanguageInSubdir ? '' : primaryLanguage;
  const pathname = languagePrefix ? `/${languagePrefix}/${slug}` : `/${slug}`;

  return new URL(pathname, siteUrl).toString();
};

const files = fs
  .readdirSync(postsDir)
  .filter((name) => /\.(md|mdx)$/i.test(name))
  .sort((a, b) => a.localeCompare(b));

let changed = 0;

for (const fileName of files) {
  const filePath = path.join(postsDir, fileName);
  const raw = fs.readFileSync(filePath, 'utf8');

  if (!raw.startsWith('---')) continue;
  const frontmatterEnd = raw.indexOf('\n---', 3);
  if (frontmatterEnd === -1) continue;

  const frontmatter = raw.slice(4, frontmatterEnd);
  const body = raw.slice(frontmatterEnd + 4);

  const data = yaml.load(frontmatter) || {};

  if (!data.metadata || typeof data.metadata !== 'object') {
    data.metadata = {};
  }
  if (!data.seo || typeof data.seo !== 'object') {
    data.seo = {};
  }

  const expectedCanonical = sanitizeCanonical(getExpectedCanonical(fileName, data));

  if (expectedCanonical) {
    data.metadata.canonical = expectedCanonical;
    data.seo.canonicalOverride = expectedCanonical;
  }

  if (fileName === 'dummy.md') {
    data.draft = true;
    data.metadata.robots = {
      index: false,
      follow: false,
    };
  }

  const updatedFrontmatter = yaml.dump(data, {
    lineWidth: 0,
    noRefs: true,
    sortKeys: false,
  });

  const nextRaw = `---\n${updatedFrontmatter}---${body}`;

  if (nextRaw !== raw) {
    fs.writeFileSync(filePath, nextRaw, 'utf8');
    changed += 1;
  }
}

console.log(`Normalized canonicals in ${changed} file(s).`);

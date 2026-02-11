import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const rootDir = process.cwd();
const contentDir = path.join(rootDir, 'src/content');
const configPath = path.join(rootDir, 'src/config.yaml');

const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
const siteUrl = String(config?.site?.site || 'https://capitollawpartners.com');
const siteHost = new URL(siteUrl).hostname;

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

const walkFiles = (dir, accumulator = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, accumulator);
    } else if (/\.(md|mdx)$/i.test(entry.name)) {
      accumulator.push(fullPath);
    }
  }
  return accumulator;
};

const files = walkFiles(contentDir).sort((a, b) => a.localeCompare(b));
const errors = [];
const SEO_OPTIONAL_PREFIXES = ['src/content/announcement/', 'src/content/note/'];

for (const filePath of files) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');

  if (!raw.startsWith('---')) continue;
  const frontmatterEnd = raw.indexOf('\n---', 3);
  if (frontmatterEnd === -1) continue;

  const frontmatter = raw.slice(4, frontmatterEnd);

  let data;
  try {
    data = yaml.load(frontmatter) || {};
  } catch (error) {
    errors.push(`${relPath}: invalid YAML frontmatter (${error.message})`);
    continue;
  }

  const metadata = data?.metadata;
  const seo = data?.seo;
  const isPost = relPath.startsWith('src/content/post/');
  const seoOptional = SEO_OPTIONAL_PREFIXES.some((prefix) => relPath.startsWith(prefix));

  const hasSeo = seo && typeof seo === 'object';
  const hasMetadata = metadata && typeof metadata === 'object';

  if (hasSeo) {
    if (!seoOptional && (!seo.title || typeof seo.title !== 'string' || !seo.title.trim())) {
      errors.push(`${relPath}: seo.title is missing or empty`);
    }
    if (!seoOptional && (!seo.description || typeof seo.description !== 'string' || !seo.description.trim())) {
      errors.push(`${relPath}: seo.description is missing or empty`);
    }
    if (typeof seo.noindex !== 'undefined' && typeof seo.noindex !== 'boolean') {
      errors.push(`${relPath}: seo.noindex must be boolean`);
    }
    if (typeof seo.nofollow !== 'undefined' && typeof seo.nofollow !== 'boolean') {
      errors.push(`${relPath}: seo.nofollow must be boolean`);
    }
    if (seo.canonicalOverride) {
      const canonical = String(seo.canonicalOverride);
      const sanitized = sanitizeCanonical(canonical);
      if (!sanitized) {
        errors.push(`${relPath}: seo.canonicalOverride is invalid (${canonical})`);
      } else if (canonical !== sanitized) {
        errors.push(`${relPath}: seo.canonicalOverride is not normalized. Expected: ${sanitized}`);
      }
    }
    if (seo.schema?.mode && !['auto', 'merge', 'replace'].includes(seo.schema.mode)) {
      errors.push(`${relPath}: seo.schema.mode must be one of auto|merge|replace`);
    }
    if (seo.schema?.entity && !['service', 'person'].includes(seo.schema.entity)) {
      errors.push(`${relPath}: seo.schema.entity must be one of service|person`);
    }
    if (seo.schema?.person) {
      const person = seo.schema.person;
      if (person.sameAs && (!Array.isArray(person.sameAs) || person.sameAs.some((value) => typeof value !== 'string'))) {
        errors.push(`${relPath}: seo.schema.person.sameAs must be an array of strings`);
      }
      if (
        person.knowsAbout &&
        (!Array.isArray(person.knowsAbout) || person.knowsAbout.some((value) => typeof value !== 'string'))
      ) {
        errors.push(`${relPath}: seo.schema.person.knowsAbout must be an array of strings`);
      }
      if (
        person.knowsLanguage &&
        (!Array.isArray(person.knowsLanguage) || person.knowsLanguage.some((value) => typeof value !== 'string'))
      ) {
        errors.push(`${relPath}: seo.schema.person.knowsLanguage must be an array of strings`);
      }
      if (person.alumniOf && !Array.isArray(person.alumniOf)) {
        errors.push(`${relPath}: seo.schema.person.alumniOf must be an array`);
      }
      if (person.worksFor && typeof person.worksFor !== 'object') {
        errors.push(`${relPath}: seo.schema.person.worksFor must be an object`);
      }
    }
    if (typeof seo.schema?.custom !== 'undefined' && !Array.isArray(seo.schema.custom)) {
      errors.push(`${relPath}: seo.schema.custom must be an array`);
    }
  } else if (hasMetadata) {
    const description = metadata.description;
    if (!description || typeof description !== 'string' || !description.trim()) {
      errors.push(`${relPath}: metadata.description is missing or empty`);
    }

    if (metadata.canonical) {
      const canonical = String(metadata.canonical);
      const sanitized = sanitizeCanonical(canonical);

      if (!sanitized) {
        errors.push(`${relPath}: metadata.canonical is invalid (${canonical})`);
      } else if (canonical !== sanitized) {
        errors.push(`${relPath}: metadata.canonical is not normalized. Expected: ${sanitized}`);
      }
    }
  } else if (!seoOptional) {
    errors.push(`${relPath}: missing seo object (or legacy metadata during migration)`);
  }

  if (isPost) {
    if (!hasSeo && !hasMetadata) {
      errors.push(`${relPath}: post is missing seo object (or legacy metadata during migration)`);
      continue;
    }

    if (hasSeo && (!seo.canonicalOverride || typeof seo.canonicalOverride !== 'string')) {
      errors.push(`${relPath}: post is missing seo.canonicalOverride`);
    }

    if (!hasSeo && hasMetadata && (!metadata.canonical || typeof metadata.canonical !== 'string')) {
      errors.push(`${relPath}: post is missing metadata.canonical`);
    }

    if (hasSeo && (!seo.description || typeof seo.description !== 'string' || !seo.description.trim())) {
      errors.push(`${relPath}: post is missing seo.description`);
    }

    if (!hasSeo && hasMetadata && (!metadata.description || typeof metadata.description !== 'string' || !metadata.description.trim())) {
      errors.push(`${relPath}: post is missing metadata.description`);
    }

    if (path.basename(filePath).toLowerCase() === 'dummy.md' && data?.draft !== true) {
      errors.push(`${relPath}: dummy post must be draft: true`);
    }
  }
}

if (errors.length > 0) {
  console.error('\nSEO validation failed:\n');
  errors.forEach((error) => console.error(`- ${error}`));
  console.error(`\nTotal issues: ${errors.length}`);
  process.exit(1);
}

console.log(`SEO validation passed for ${files.length} content file(s).`);

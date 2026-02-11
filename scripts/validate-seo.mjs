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
  const isPost = relPath.startsWith('src/content/post/');

  if (metadata && typeof metadata === 'object') {
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
  }

  if (isPost) {
    if (!metadata || typeof metadata !== 'object') {
      errors.push(`${relPath}: post is missing metadata object`);
      continue;
    }

    if (!metadata.canonical || typeof metadata.canonical !== 'string') {
      errors.push(`${relPath}: post is missing metadata.canonical`);
    }

    if (!metadata.description || typeof metadata.description !== 'string' || !metadata.description.trim()) {
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

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const rootDir = process.cwd();
const contentDir = path.join(rootDir, 'src/content');

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
let changed = 0;

for (const filePath of files) {
  const raw = fs.readFileSync(filePath, 'utf8');
  if (!raw.startsWith('---')) continue;

  const frontmatterEnd = raw.indexOf('\n---', 3);
  if (frontmatterEnd === -1) continue;

  const frontmatter = raw.slice(4, frontmatterEnd);
  const body = raw.slice(frontmatterEnd + 4);

  let data = {};
  try {
    data = yaml.load(frontmatter) || {};
  } catch {
    continue;
  }

  const metadata = data?.metadata && typeof data.metadata === 'object' ? data.metadata : {};
  const topLevelTitle = typeof data?.title === 'string' ? data.title : undefined;
  const topLevelDescription = typeof data?.excerpt === 'string' ? data.excerpt : undefined;
  const nextSeo = {
    ...(data?.seo && typeof data.seo === 'object' ? data.seo : {}),
    ...(topLevelTitle ? { title: topLevelTitle } : {}),
    ...(topLevelDescription ? { description: topLevelDescription } : {}),
    ...(metadata.title ? { title: metadata.title } : {}),
    ...(metadata.description ? { description: metadata.description } : {}),
    ...(metadata.openGraph?.images?.[0]?.url ? { ogImage: metadata.openGraph.images[0].url } : {}),
    ...(typeof metadata.robots?.index === 'boolean' ? { noindex: metadata.robots.index === false } : {}),
    ...(typeof metadata.robots?.follow === 'boolean' ? { nofollow: metadata.robots.follow === false } : {}),
    ...(metadata.canonical ? { canonicalOverride: metadata.canonical } : {}),
  };

  if (Object.keys(nextSeo).length === 0) continue;

  data.seo = nextSeo;

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

console.log(`Seeded seo fields in ${changed} file(s).`);

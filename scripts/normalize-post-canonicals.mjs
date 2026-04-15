import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const rootDir = process.cwd();
const postsDir = path.join(rootDir, 'src/content/post');

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

  delete data.metadata.canonical;
  delete data.seo.canonicalOverride;

  if (fileName === 'dummy.md') {
    data.draft = true;
    data.metadata.robots = {
      index: false,
      follow: false,
    };
  }

  if (Object.keys(data.metadata).length === 0) {
    delete data.metadata;
  }

  if (Object.keys(data.seo).length === 0) {
    delete data.seo;
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

console.log(`Removed stored post canonicals in ${changed} file(s).`);

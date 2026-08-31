import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contentDir = path.join(root, 'content', 'posts');
const dataDir = path.join(root, 'data');
const pagesDir = path.join(root, 'posts');
const template = await fs.readFile(path.join(root, 'templates', 'post.html'), 'utf8');
const files = (await fs.readdir(contentDir)).filter(file => file.endsWith('.json')).sort();

function html(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function readingTime(body = '') {
  const chinese = (body.match(/[\u3400-\u9fff]/g) || []).length;
  const words = (body.replace(/[\u3400-\u9fff]/g, ' ').match(/[\p{L}\p{N}]+/gu) || []).length;
  return Math.max(1, Math.ceil(chinese / 400 + words / 200));
}

const posts = [];
for (const file of files) {
  const slug = path.basename(file, '.json');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw new Error(`Invalid post slug: ${slug}`);
  const post = JSON.parse(await fs.readFile(path.join(contentDir, file), 'utf8'));
  for (const field of ['title', 'date', 'category', 'excerpt', 'body']) {
    if (!post[field]) throw new Error(`${file} is missing ${field}`);
  }
  if (post.published === false) continue;
  posts.push({
    slug,
    title: String(post.title),
    date: new Date(post.date).toISOString(),
    category: String(post.category),
    tags: Array.isArray(post.tags) ? post.tags.map(String) : [],
    excerpt: String(post.excerpt),
    cover: post.cover ? String(post.cover) : '',
    readingTime: readingTime(post.body),
    body: String(post.body),
  });
}

posts.sort((a, b) => new Date(b.date) - new Date(a.date));
await fs.mkdir(dataDir, { recursive: true });
await fs.writeFile(path.join(dataDir, 'posts.json'), `${JSON.stringify(posts, null, 2)}\n`);

await fs.rm(pagesDir, { recursive: true, force: true });
for (const post of posts) {
  const targetDir = path.join(pagesDir, post.slug);
  await fs.mkdir(targetDir, { recursive: true });
  const coverCandidate = post.cover ? new URL(post.cover.replace(/^\/Answer\//, ''), 'https://9tianchang.github.io/Answer/') : null;
  const absoluteCover = coverCandidate && ['http:', 'https:'].includes(coverCandidate.protocol) ? coverCandidate.href : '';
  const imageMeta = absoluteCover ? `<meta property="og:image" content="${html(absoluteCover)}">\n  <meta name="twitter:image" content="${html(absoluteCover)}">` : '';
  const replacements = {
    TITLE: html(post.title),
    DESCRIPTION: html(post.excerpt),
    DATE: html(post.date),
    SLUG: html(post.slug),
    OG_IMAGE_META: imageMeta,
  };
  const page = template.replace(/\{\{(TITLE|DESCRIPTION|DATE|SLUG|OG_IMAGE_META)\}\}/g, (_, key) => replacements[key]);
  await fs.writeFile(path.join(targetDir, 'index.html'), page);
}

console.log(`Built ${posts.length} published posts.`);

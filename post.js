const articleRoot = document.documentElement;
const article = document.querySelector('#article');
const slug = document.body.dataset.postSlug;

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function safeUrl(value = '') {
  const url = String(value).trim();
  return /^(https?:\/\/|\/|\.\.\/|\.\/)/i.test(url) ? escapeHtml(url) : '#';
}

function inlineMarkdown(text) {
  let result = escapeHtml(text);
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => `<img src="${safeUrl(url)}" alt="${alt}" loading="lazy">`);
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => `<a href="${safeUrl(url)}" target="_blank" rel="noreferrer">${label}</a>`);
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return result;
}

function renderMarkdown(markdown = '') {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const output = [];
  let paragraph = [];
  let listType = '';
  let inCode = false;
  let code = [];

  const flushParagraph = () => {
    if (paragraph.length) output.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (listType) output.push(`</${listType}>`);
    listType = '';
  };

  lines.forEach(line => {
    if (line.trim().startsWith('```')) {
      flushParagraph(); closeList();
      if (inCode) { output.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`); code = []; }
      inCode = !inCode;
      return;
    }
    if (inCode) { code.push(line); return; }
    if (!line.trim()) { flushParagraph(); closeList(); return; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { flushParagraph(); closeList(); const level = heading[1].length + 1; output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`); return; }
    const quote = line.match(/^>\s?(.+)$/);
    if (quote) { flushParagraph(); closeList(); output.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`); return; }
    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? 'ul' : 'ol';
      if (listType !== nextType) { closeList(); listType = nextType; output.push(`<${listType}>`); }
      output.push(`<li>${inlineMarkdown((unordered || ordered)[1])}</li>`);
      return;
    }
    paragraph.push(line.trim());
  });
  if (inCode && code.length) output.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
  flushParagraph(); closeList();
  return output.join('');
}

function setArticleTheme(theme) {
  articleRoot.dataset.theme = theme;
  localStorage.setItem('blog-theme', theme);
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#11151e' : '#f5f7fb';
}

setArticleTheme(localStorage.getItem('blog-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
document.querySelector('#articleThemeToggle').addEventListener('click', () => setArticleTheme(articleRoot.dataset.theme === 'dark' ? 'light' : 'dark'));

async function loadArticle() {
  try {
    const response = await fetch('../../data/posts.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to load article data');
    const posts = await response.json();
    const post = posts.find(item => item.slug === slug);
    if (!post) throw new Error('Article not found');
    const date = new Date(post.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    const tags = (post.tags || []).map(tag => `# ${escapeHtml(tag)}`).join(' · ');
    article.innerHTML = `<header class="article-header"><span class="section-kicker">${escapeHtml(post.category)}</span><h1>${escapeHtml(post.title)}</h1><div class="article-meta"><span>${date}</span><span>${escapeHtml(post.readingTime)} 分钟阅读</span>${tags ? `<span>${tags}</span>` : ''}</div>${post.cover ? `<img class="article-cover" src="${safeUrl(post.cover)}" alt="${escapeHtml(post.title)}">` : ''}</header><div class="article-content">${renderMarkdown(post.body)}</div>`;
  } catch (error) {
    article.innerHTML = '<div class="article-error"><h1>文章暂时无法打开</h1><p>它可能尚未完成同步，请稍后再试。</p><a href="../../">返回首页</a></div>';
  }
}

loadArticle();

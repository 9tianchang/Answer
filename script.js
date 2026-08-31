const root = document.documentElement;
const searchInput = document.querySelector('#searchInput');
const postList = document.querySelector('#postList');
const emptyState = document.querySelector('#emptyState');
const profilePanel = document.querySelector('#profilePanel');
const menuButton = document.querySelector('#menuButton');
const scrim = document.querySelector('#scrim');
let posts = [...document.querySelectorAll('.post-card')];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function postUrl(slug) { return `post.html?slug=${encodeURIComponent(slug)}`; }

function renderPost(post) {
  const date = new Date(post.date);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const year = date.getFullYear();
  const tags = (post.tags || []).map(tag => `<a href="#categories"># ${escapeHtml(tag)}</a>`).join('');
  const url = postUrl(post.slug);
  const search = [post.title, post.category, post.excerpt, ...(post.tags || [])].join(' ');
  return `<article class="post-card" id="post-${escapeHtml(post.slug)}" data-search="${escapeHtml(search)}">
    <div class="post-date"><strong>${day}</strong><span>${month}<br>${year}</span></div>
    <div class="post-body"><div class="post-meta"><span>${escapeHtml(post.category)}</span><span>${escapeHtml(post.readingTime)} 分钟阅读</span></div><h3><a href="${url}">${escapeHtml(post.title)}</a></h3><p>${escapeHtml(post.excerpt)}</p><div class="post-tags">${tags}</div></div>
    <a class="post-arrow" href="${url}" aria-label="阅读：${escapeHtml(post.title)}">↗</a>
  </article>`;
}

function renderWidgets(data) {
  const categoryList = document.querySelector('#categoryList');
  const categoryCount = document.querySelector('#categoryCount');
  const archiveList = document.querySelector('#archiveList');
  const archiveYear = document.querySelector('#archiveYear');
  const counts = data.reduce((map, post) => map.set(post.category, (map.get(post.category) || 0) + 1), new Map());
  categoryCount.textContent = String(counts.size);
  categoryList.innerHTML = [...counts.entries()].map(([name, count]) => `<a href="#articles"><span>${escapeHtml(name)}</span><b>${String(count).padStart(2, '0')}</b></a>`).join('');
  archiveYear.textContent = data[0] ? String(new Date(data[0].date).getFullYear()) : '—';
  archiveList.innerHTML = data.slice(0, 5).map(post => {
    const date = new Date(post.date);
    const shortDate = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return `<li><a href="${postUrl(post.slug)}"><time>${shortDate}</time><span>${escapeHtml(post.title)}</span></a></li>`;
  }).join('');
}

async function loadPosts() {
  try {
    const response = await fetch('data/posts.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to load posts');
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return;
    postList.innerHTML = data.map(renderPost).join('');
    posts = [...document.querySelectorAll('.post-card')];
    renderWidgets(data);
  } catch (error) {
    console.warn('Using built-in article fallback.', error);
  }
}

function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem('blog-theme', theme);
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#11151e' : '#f5f7fb';
}

const savedTheme = localStorage.getItem('blog-theme');
const preferredTheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
setTheme(savedTheme || preferredTheme);

function toggleTheme() { setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'); }
document.querySelector('#themeToggle').addEventListener('click', toggleTheme);
document.querySelector('#mobileThemeToggle').addEventListener('click', toggleTheme);

function closeMenu() {
  profilePanel.classList.remove('open');
  scrim.classList.remove('show');
  menuButton.setAttribute('aria-expanded', 'false');
}

menuButton.addEventListener('click', () => {
  const isOpen = profilePanel.classList.toggle('open');
  scrim.classList.toggle('show', isOpen);
  menuButton.setAttribute('aria-expanded', String(isOpen));
});
scrim.addEventListener('click', closeMenu);
profilePanel.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  let visibleCount = 0;
  posts.forEach(post => {
    const visible = post.dataset.search.toLowerCase().includes(query) || post.innerText.toLowerCase().includes(query);
    post.hidden = !visible;
    if (visible) visibleCount += 1;
  });
  emptyState.hidden = visibleCount !== 0;
});

document.addEventListener('keydown', event => {
  if (event.key === '/' && document.activeElement !== searchInput) { event.preventDefault(); searchInput.focus(); }
  if (event.key === 'Escape') closeMenu();
});

loadPosts();

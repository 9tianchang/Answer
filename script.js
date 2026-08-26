const root = document.documentElement;
const searchInput = document.querySelector('#searchInput');
const posts = [...document.querySelectorAll('.post-card')];
const emptyState = document.querySelector('#emptyState');
const profilePanel = document.querySelector('#profilePanel');
const menuButton = document.querySelector('#menuButton');
const scrim = document.querySelector('#scrim');

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

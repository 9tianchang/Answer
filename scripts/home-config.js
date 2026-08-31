'use strict';

hexo.extend.filter.register('before_generate', () => {
  const data = hexo.locals.get('data') || {};
  const home = data.home || {};
  const theme = hexo.theme && hexo.theme.config;

  for (const key of ['title', 'subtitle', 'description', 'author']) {
    if (home[key]) hexo.config[key] = home[key];
  }

  if (!theme) return;

  theme.logo = theme.logo || {};
  if (home.title) theme.logo.title = `[${home.title}](/Answer/)`;
  if (home.subtitle) theme.logo.subtitle = home.subtitle;

  theme.footer = theme.footer || {};
  if (home.footer_text) theme.footer.content = home.footer_text;

  data.widgets = data.widgets || {};
  data.widgets.welcome = {
    ...(data.widgets.welcome || {}),
    layout: 'markdown',
    title: home.welcome_title || home.author || '欢迎',
    content: `${home.welcome_text || home.description || ''}\n\n[GitHub](${home.github_url || 'https://github.com/9tianchang'}) · [进入写作后台](/Answer/admin/)`
  };
});

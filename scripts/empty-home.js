'use strict';

const pagination = require('hexo-pagination');

hexo.extend.generator.register('empty-home', function emptyHomeGenerator(locals) {
  if (locals.posts.length > 0) return [];

  const config = this.config;
  const path = config.index_generator.path || '';

  return pagination(path, locals.posts, {
    perPage: 0,
    layout: config.index_generator.layout || ['index', 'archive'],
    format: (config.index_generator.pagination_dir || config.pagination_dir || 'page') + '/%d/',
    data: {
      __index: true
    }
  });
});

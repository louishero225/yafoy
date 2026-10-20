import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.yafoy.net',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap()],
});

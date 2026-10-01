// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://snibi.github.io',
  base: '/forever-meta',
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()],
  },
});

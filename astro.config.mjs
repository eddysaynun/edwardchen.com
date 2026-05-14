/// <reference types="astro" />
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: 'https://edwardchen.com',

  integrations: [
    tailwind(),
  ],

  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },

  output: "hybrid",
  adapter: cloudflare()
});
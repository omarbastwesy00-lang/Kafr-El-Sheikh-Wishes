import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const publicRoot = resolve(projectRoot, 'public');
const outputRoot = resolve(projectRoot, 'dist');

export default defineConfig({
  root: publicRoot,
  envDir: projectRoot,
  publicDir: false,
  build: {
    outDir: outputRoot,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(publicRoot, 'index.html'),
        admin: resolve(publicRoot, 'admin/index.html'),
        terms: resolve(publicRoot, 'terms.html')
      }
    }
  },
  plugins: [{
    name: 'copy-search-files',
    closeBundle() {
      mkdirSync(outputRoot, { recursive: true });
      for (const file of ['robots.txt', 'sitemap.xml', 'favicon.svg', 'og-image.png']) {
        copyFileSync(resolve(publicRoot, file), resolve(outputRoot, file));
      }
    }
  }]
});
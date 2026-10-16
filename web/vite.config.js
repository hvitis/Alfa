import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { cloudDevelopment } from './cloud/dev-plugin.js';

export default defineConfig({
  root: fileURLToPath(new URL('./', import.meta.url)),
  base: './',
  publicDir: fileURLToPath(new URL('../design/cloud-radio/generated/', import.meta.url)),
  plugins: [cloudDevelopment(fileURLToPath(new URL('../', import.meta.url)))],
  server: { host: '127.0.0.1', port: 8000, strictPort: true },
  assetsInclude: ['**/*.glb'],
  build: {
    outDir: '../_site',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2200,
  },
});

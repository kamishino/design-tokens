import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'site',
  base: '/design-tokens/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'site/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@tokens': resolve(__dirname, 'dist/json/tokens.json'),
      '@css': resolve(__dirname, 'dist/css'),
    },
  },
  publicDir: resolve(__dirname, 'dist'),
});

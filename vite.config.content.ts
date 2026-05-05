import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '',
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'src/content/index.ts'),
      output: {
        entryFileNames: 'content.js',
        assetFileNames: 'content.[ext]',
        format: 'iife'
      }
    },
    outDir: 'dist',
    minify: false,
    emptyOutDir: true
  },
  css: {
    postcss: {}
  }
});
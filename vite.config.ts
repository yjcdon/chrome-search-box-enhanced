import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '',
  build: {
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content/index.ts'),
        popup: resolve(__dirname, 'src/popup/popup.html')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    outDir: 'dist',
    minify: false
  },
  css: {
    postcss: {}
  }
});

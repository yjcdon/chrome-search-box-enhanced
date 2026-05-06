import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '',
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'src/popup/Popup.html'),
      output: {
        entryFileNames: 'popup.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    outDir: 'dist',
    minify: false,
    emptyOutDir: false
  },
  css: {
    postcss: {}
  }
});
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
        format: 'iife',
        // 不内联 CSS，保持为单独文件
        inlineDynamicImports: true
      }
    },
    outDir: 'dist',
    minify: false,
    emptyOutDir: true,
    // 不将 CSS 内联到 JS
    cssCodeSplit: false
  },
  css: {
    postcss: {}
  }
});
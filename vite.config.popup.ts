import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import fs from 'node:fs';

/**
 * 自定义插件：将 HTML 输出到 dist 根目录，并修正资源引用路径
 */
function moveHtmlPlugin(): Plugin {
  return {
    name: 'move-html-to-root',
    enforce: 'post',
    closeBundle() {
      const srcHtml = resolve(__dirname, 'dist/src/popup/Popup.html');
      const destHtml = resolve(__dirname, 'dist/Popup.html');

      if (fs.existsSync(srcHtml)) {
        let content = fs.readFileSync(srcHtml, 'utf-8');
        // 修正资源路径：../../popup.js -> popup.js, ../../Popup.css -> Popup.css
        content = content.replace(/\.\.\/\.\.\/popup\.js/g, 'popup.js');
        content = content.replace(/\.\.\/\.\.\/Popup\.css/g, 'Popup.css');
        fs.writeFileSync(destHtml, content);
        // 删除旧的 HTML 目录
        fs.rmSync(resolve(__dirname, 'dist/src'), { recursive: true, force: true });
      }
    }
  };
}

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
  },
  plugins: [moveHtmlPlugin()]
});
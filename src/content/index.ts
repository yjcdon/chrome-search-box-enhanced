import { SearchBox } from './SearchBox.js';
import { SearchEngine } from './SearchEngine.js';
import { Highlighter } from './Highlighter.js';
import { Navigator } from './Navigator.js';
import type { SearchOptions } from '../types/index.js';

/**
 * 判断是否是查找快捷键 (Cmd+F / Ctrl+F)
 */
function isFindShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase();
  const isMacFind = event.metaKey && !event.ctrlKey && key === 'f';
  const isWindowsOrLinuxFind = event.ctrlKey && !event.metaKey && key === 'f';

  return (isMacFind || isWindowsOrLinuxFind)
    && !event.altKey
    && !event.shiftKey
    && !event.isComposing;
}

/**
 * 安装快捷键拦截器
 */
function installShortcutInterceptor(searchBox: SearchBox): void {
  document.addEventListener('keydown', (event) => {
    if (isFindShortcut(event)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      searchBox.open({ preserveSelection: true });
      return;
    }

    if (event.key === 'Escape' && searchBox.isOpen()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      searchBox.close();
    }
  }, { capture: true });
}

/**
 * 主入口
 */
function main(): void {
  // 初始化组件
  const searchEngine = new SearchEngine();
  const highlighter = new Highlighter();
  const navigator = new Navigator(highlighter);
  const searchBox = new SearchBox();

  // 配置搜索框回调
  searchBox.setOnSearch((query: string, options: SearchOptions) => {
    // 清除旧高亮
    highlighter.clear();

    if (!query.trim()) {
      searchBox.updateResult({ total: 0, currentIndex: 0 });
      return;
    }

    // 执行搜索
    const ranges = searchEngine.search(query, options);

    // 高亮结果
    highlighter.highlight(ranges);

    // 更新结果显示
    const total = highlighter.getCount();
    const currentIndex = total > 0 ? highlighter.getCurrentIndex() : 0;
    searchBox.updateResult({ total, currentIndex });

    // 滚动到第一个匹配
    if (total > 0) {
      highlighter.scrollToCurrent();
    }
  });

  searchBox.setOnNavigate((direction: 'next' | 'prev') => {
    const success = direction === 'next' ? navigator.next() : navigator.prev();

    if (success) {
      // 更新结果显示
      const total = navigator.getTotal();
      const currentIndex = navigator.getCurrentIndex();
      searchBox.updateResult({ total, currentIndex });
    }
  });

  searchBox.setOnClose(() => {
    highlighter.clear();
  });

  searchBox.setOnOptionChange((_options: SearchOptions) => {
    // 选项变更时自动触发重新搜索（在 setOnSearch 中处理）
  });

  // 安装快捷键拦截
  installShortcutInterceptor(searchBox);
}

// 启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

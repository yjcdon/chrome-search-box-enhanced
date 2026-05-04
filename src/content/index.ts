import '../styles/search-box.css';

import { SearchBox } from './SearchBox.js';
import { SearchEngine } from './SearchEngine.js';
import { Highlighter } from './Highlighter.js';
import { Navigator } from './Navigator.js';
import type { SearchOptions } from '../types/index.js';

// 当前搜索状态
let currentQuery = '';
let currentOptions: SearchOptions = { caseSensitive: false, wholeWord: false, regex: false };
let searchObserver: MutationObserver | null = null;
let observerDebounceTimer: number | null = null;

/**
 * 判断当前窗口是否是主 frame
 */
function isMainFrame(): boolean {
  return window.self === window.top;
}

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
 * 设置动态内容监听
 */
function setupDynamicContentObserver(
  searchBox: SearchBox,
  searchEngine: SearchEngine,
  highlighter: Highlighter
): void {
  // 创建 MutationObserver 监听 DOM 变化
  searchObserver = new MutationObserver((mutations) => {
    // 忽略高亮元素自身的变化
    const isHighlightChange = mutations.some(m =>
      m.target instanceof HTMLElement &&
      (m.target.classList.contains('vs-search-highlight') ||
       m.target.classList.contains('vs-search-current') ||
       m.target.closest('.vs-search-box'))
    );

    if (isHighlightChange || !currentQuery.trim()) {
      return;
    }

    // 防抖重新搜索
    if (observerDebounceTimer !== null) {
      window.clearTimeout(observerDebounceTimer);
    }

    observerDebounceTimer = window.setTimeout(() => {
      // 重新搜索
      const ranges = searchEngine.search(currentQuery, currentOptions);
      highlighter.highlight(ranges);

      const total = highlighter.getCount();
      const totalMatches = highlighter.getTotalMatches();
      const currentIndex = total > 0 ? highlighter.getCurrentIndex() : 0;
      searchBox.updateResult({ total, currentIndex, totalMatches });

      observerDebounceTimer = null;
    }, 200);
  });

  // 开始监听
  searchObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'hidden', 'display']
  });
}

/**
 * 主入口
 */
function main(): void {
  // 仅在主 frame 中初始化搜索框
  // iframe 中不显示搜索框，但保留快捷键拦截以便在 iframe 内也能触发主 frame 搜索
  if (!isMainFrame()) {
    // 在 iframe 中，仅转发快捷键到主 frame
    // 搜索框和搜索逻辑只在主 frame 中运行
    return;
  }

  // 初始化组件
  const searchEngine = new SearchEngine();
  const highlighter = new Highlighter();
  const navigator = new Navigator(highlighter);
  const searchBox = new SearchBox();

  // 设置动态内容监听
  setupDynamicContentObserver(searchBox, searchEngine, highlighter);

  // 配置搜索框回调
  searchBox.setOnSearch((query: string, options: SearchOptions) => {
    // 保存当前搜索状态
    currentQuery = query;
    currentOptions = options;

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
    const totalMatches = highlighter.getTotalMatches();
    const currentIndex = total > 0 ? highlighter.getCurrentIndex() : 0;
    searchBox.updateResult({ total, currentIndex, totalMatches });

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
    // 清空搜索状态
    currentQuery = '';
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

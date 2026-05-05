import '../styles/search-box.css';

import { SearchBox } from './SearchBox.js';
import { SearchEngine } from './SearchEngine.js';
import { Highlighter } from './Highlighter.js';
import { Navigator } from './Navigator.js';
import type { SearchContext, SearchOptions } from '../types/index.js';
import { getDisabledSites, isSiteDisabled } from '../storage.js';

// 当前搜索状态
let currentQuery = '';
let currentOptions: SearchOptions = { caseSensitive: false, wholeWord: false, regex: false };
let searchObserver: MutationObserver | null = null;
let observerDebounceTimer: number | null = null;
let isSearching = false; // 搜索过程中暂停 observer
let isNavigating = false; // 导航过程中暂停 observer
let isCurrentSiteDisabled = false; // 当前网站是否被禁用

function clearObserverDebounceTimer(): void {
  if (observerDebounceTimer !== null) {
    window.clearTimeout(observerDebounceTimer);
    observerDebounceTimer = null;
  }
}

/**
 * 刷新当前网站的禁用状态
 */
async function refreshDisabledState(searchBox?: SearchBox, highlighter?: Highlighter): Promise<void> {
  try {
    const sites = await getDisabledSites();
    isCurrentSiteDisabled = isSiteDisabled(window.location.hostname, sites);

    if (isCurrentSiteDisabled && searchBox?.isOpen()) {
      searchBox.close();
      highlighter?.clear();
    }
  } catch {
    // 如果 storage API 不可用，默认不禁用
    isCurrentSiteDisabled = false;
  }
}

/**
 * 监听禁用网站列表变化
 */
function watchDisabledSites(searchBox: SearchBox, highlighter: Highlighter): void {
  try {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local' || !changes.disabledSites) {
        return;
      }
      void refreshDisabledState(searchBox, highlighter);
    });
  } catch {
    // storage API 不可用时忽略监听
  }
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function textMatchesCurrentQuery(text: string | null): boolean {
  const query = currentQuery.trim();
  if (!query || !text) {
    return false;
  }

  try {
    if (currentOptions.regex || currentOptions.wholeWord) {
      const source = currentOptions.regex ? query : escapeRegExp(query);
      const pattern = currentOptions.wholeWord ? `\\b${source}\\b` : source;
      const flags = currentOptions.caseSensitive ? '' : 'i';
      return new RegExp(pattern, flags).test(text);
    }

    if (currentOptions.caseSensitive) {
      return text.includes(query);
    }

    return text.toLowerCase().includes(query.toLowerCase());
  } catch {
    return false;
  }
}

function nodeTextMatchesCurrentQuery(node: Node): boolean {
  return textMatchesCurrentQuery(node.textContent);
}

function mutationsMayAffectCurrentSearch(mutations: MutationRecord[]): boolean {
  return mutations.some((mutation) => {
    if (mutation.type === 'characterData') {
      return textMatchesCurrentQuery(mutation.target.textContent) ||
        textMatchesCurrentQuery(mutation.oldValue);
    }

    if (mutation.type !== 'childList') {
      return false;
    }

    const changedNodes = [...Array.from(mutation.addedNodes), ...Array.from(mutation.removedNodes)];
    return changedNodes.some(nodeTextMatchesCurrentQuery);
  });
}

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
  // 检查 key 是否存在，某些特殊键盘事件可能没有此属性
  if (!event.key) return false;

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
    // 当前网站被禁用时，不拦截快捷键
    if (isCurrentSiteDisabled) {
      return;
    }

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
    // 如果正在搜索或导航过程中，忽略所有变化
    if (isSearching || isNavigating) {
      return;
    }

    // 忽略高亮元素相关的变化
    const isHighlightRelated = mutations.some(m => {
      const target = m.target;

      // 检查目标元素本身
      if (target instanceof HTMLElement) {
        // 高亮元素的变化
        if (target.classList.contains('vs-search-highlight') ||
            target.classList.contains('vs-search-current')) {
          return true;
        }
        // 搜索框的变化
        if (target.closest('.vs-search-box')) {
          return true;
        }
        // 新添加/移除的高亮元素
        if (m.type === 'childList') {
          const changedNodes = [...Array.from(m.addedNodes), ...Array.from(m.removedNodes)];
          const hasHighlight = changedNodes.some(node =>
            node instanceof HTMLElement &&
            (node.classList.contains('vs-search-highlight') ||
             node.classList.contains('vs-search-current') ||
             !!node.querySelector('.vs-search-highlight, .vs-search-current'))
          );
          if (hasHighlight) {
            return true;
          }
        }
      }

      return false;
    });

    if (isHighlightRelated || !currentQuery.trim() || !mutationsMayAffectCurrentSearch(mutations)) {
      return;
    }

    // 防抖重新搜索
    clearObserverDebounceTimer();

    observerDebounceTimer = window.setTimeout(() => {
      // 只有在有实际变化时才重新搜索
      if (currentQuery.trim() && !isNavigating && !isSearching) {
        performSearch(searchBox, searchEngine, highlighter, { preserveIndex: true });
      }
      observerDebounceTimer = null;
    }, 500);  // 增加防抖时间到 500ms
  });

  // 开始监听
  searchObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    characterDataOldValue: true
  });
}

/**
 * 执行搜索（统一的搜索逻辑）
 */
function performSearch(
  searchBox: SearchBox,
  searchEngine: SearchEngine,
  highlighter: Highlighter,
  options: { preserveIndex?: boolean; initialPosition?: SearchContext['initialPosition'] } = {}
): void {
  // 标记正在搜索
  isSearching = true;
  clearObserverDebounceTimer();

  // 暂停 observer（断开连接）
  if (searchObserver) {
    searchObserver.disconnect();
    searchObserver.takeRecords();
  }

  try {
    // 先清除旧高亮，再基于干净 DOM 计算 Range。
    // 如果先搜索再清除，Range 会指向即将被移除的 mark 内文本节点，动态页面上会出现闪烁和索引错位。
    const preserveIndex = options.preserveIndex ? highlighter.getCurrentIndex() : 0;
    highlighter.clear();

    // 执行搜索
    const ranges = searchEngine.search(currentQuery, currentOptions);
    const skipSetCurrent = !!options.initialPosition;
    highlighter.highlight(ranges, { preserveIndex, skipSetCurrent });

    if (options.initialPosition && highlighter.getCount() > 0) {
      // 强制同步布局计算，确保 getBoundingClientRect 返回正确值
      document.body.offsetHeight;

      const nearestIndex = highlighter.findNearestIndex(options.initialPosition);
      if (nearestIndex !== -1) {
        highlighter.setCurrent(nearestIndex);
      } else {
        // 兜底：如果找不到最近项，设置为第一个
        highlighter.setCurrent(0);
      }
    }

    const total = highlighter.getCount();
    const totalMatches = highlighter.getTotalMatches();
    const currentIndex = total > 0 ? highlighter.getCurrentIndex() : 0;
    searchBox.updateResult({ total, currentIndex, totalMatches });

    // 滚动到当前匹配
    if (total > 0 && highlighter.getCurrentIndex() >= 0) {
      highlighter.scrollToCurrent();
    }
  } catch (error) {
    console.error('执行搜索错误:', error);
    highlighter.clear();
    searchBox.updateResult({ total: 0, currentIndex: 0 });
  } finally {
    // 搜索完成，延迟恢复 observer
    setTimeout(() => {
      isSearching = false;
      if (searchObserver) {
        searchObserver.takeRecords();
        searchObserver.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
          characterDataOldValue: true
        });
      }
    }, 100);
  }
}

/**
 * 主入口
 */
function main(): void {
  // 仅在主 frame 中初始化搜索框
  // iframe 中有意跳过初始化，仅搜索顶层文档
  if (!isMainFrame()) {
    return;
  }

  // 初始化组件
  const searchEngine = new SearchEngine();
  const highlighter = new Highlighter();
  const navigator = new Navigator(highlighter);
  const searchBox = new SearchBox();

  highlighter.setOnClick((index: number) => {
    searchBox.updateResult({
      total: highlighter.getCount(),
      currentIndex: index,
      totalMatches: highlighter.getTotalMatches()
    });
  });

  // 设置动态内容监听
  setupDynamicContentObserver(searchBox, searchEngine, highlighter);

  // 初始化禁用网站状态
  void refreshDisabledState(searchBox, highlighter);
  watchDisabledSites(searchBox, highlighter);

  // 配置搜索框回调
  searchBox.setOnSearch((query: string, options: SearchOptions, context?: SearchContext) => {
    // 保存当前搜索状态
    currentQuery = query;
    currentOptions = options;

    if (!query.trim()) {
      clearObserverDebounceTimer();
      highlighter.clear();
      searchBox.updateResult({ total: 0, currentIndex: 0 });
      return;
    }

    // 使用统一的搜索函数
    performSearch(searchBox, searchEngine, highlighter, {
      initialPosition: context?.initialPosition
    });
  });

  searchBox.setOnNavigate((direction: 'next' | 'prev') => {
    // 标记正在导航，暂停 observer
    isNavigating = true;
    clearObserverDebounceTimer();

    // 先暂停 observer
    if (searchObserver) {
      searchObserver.disconnect();
      searchObserver.takeRecords();
    }

    const nextIndex = direction === 'next' ? navigator.next() : navigator.prev();

    if (nextIndex !== -1) {
      // 更新结果显示
      const total = navigator.getTotal();
      const currentIndex = navigator.getCurrentIndex();
      searchBox.updateResult({ total, currentIndex });
    }

    // 导航完成，延迟恢复 observer
    setTimeout(() => {
      isNavigating = false;
      if (searchObserver) {
        searchObserver.takeRecords();
        searchObserver.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
          characterDataOldValue: true
        });
      }
    }, 500);
  });

  searchBox.setOnClose(() => {
    // 清空搜索状态
    currentQuery = '';
    clearObserverDebounceTimer();
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

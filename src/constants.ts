/**
 * 全局常量配置
 */

// ==================== 平台检测 ====================

/** 是否为 macOS */
export const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/** 是否为中文环境 */
export const isChinese = navigator.language.startsWith('zh');

// ==================== 国际化文本 ====================

export const i18n = {
  placeholder: isChinese ? '查找' : 'Find',
  noResults: isChinese ? '无结果' : 'No results',
  totalLabel: isChinese ? '共' : 'total',
  dragTitle: isChinese ? '拖动移动位置' : 'Drag to move',
  caseSensitiveTitle: isChinese ? '区分大小写' : 'Match Case',
  wholeWordTitle: isChinese ? '全词匹配' : 'Match Whole Word',
  regexTitle: isChinese ? '使用正则表达式' : 'Use Regex',
  prevTitle: isChinese ? '上一个' : 'Previous',
  nextTitle: isChinese ? '下一个' : 'Next',
  closeTitle: isChinese ? '关闭' : 'Close'
};

// ==================== 键盘符号 ====================

export const KEY_SYMBOLS = {
  mac: {
    alt: '⌥',
    shift: '⇧',
    enter: '↩︎',
    esc: 'Esc'
  },
  windows: {
    alt: 'Alt',
    shift: 'Shift',
    enter: 'Enter',
    esc: 'Esc'
  }
};

/** 获取键盘符号 */
export function getKeySymbol(key: 'alt' | 'shift' | 'enter' | 'esc'): string {
  return isMac ? KEY_SYMBOLS.mac[key] : KEY_SYMBOLS.windows[key];
}

// ==================== 搜索框配置 ====================

/** 位置存储 key */
export const POSITION_STORAGE_KEY = 'vs-search-box-position';

/** 默认位置 */
export const DEFAULT_POSITION = { right: 10, top: 10 };

/** 防抖延迟（毫秒） */
export const DEBOUNCE_DELAY = 150;

// ==================== 高亮配置 ====================

export const MAX_HIGHLIGHTS = 1000;
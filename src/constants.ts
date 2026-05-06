/**
 * 全局常量配置
 */

import type { SearchOptions } from './types/index.js';

// ==================== 平台检测 ====================

/** 是否为 macOS */
export const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/** 是否为中文环境 */
export const isChinese = navigator.language.startsWith('zh');

// ==================== 国际化文本 ====================

export const i18n = {
  // 搜索框
  placeholder: isChinese ? '查找' : 'Find',
  noResults: isChinese ? '无结果' : 'No results',
  totalLabel: isChinese ? '共' : 'total',
  dragTitle: isChinese ? '拖动移动位置' : 'Drag to move',
  caseSensitiveTitle: isChinese ? '区分大小写' : 'Match Case',
  wholeWordTitle: isChinese ? '全词匹配' : 'Match Whole Word',
  regexTitle: isChinese ? '使用正则表达式' : 'Use Regex',
  prevTitle: isChinese ? '上一个' : 'Previous',
  nextTitle: isChinese ? '下一个' : 'Next',
  closeTitle: isChinese ? '关闭' : 'Close',
  // Popup
  popupTitle: isChinese ? '添加插件禁用网站' : 'Add Disabled Site',
  popupInputLabel: isChinese ? '网站域名:' : 'Site Domain:',
  popupInputPlaceholder: isChinese ? '输入域名' : 'Enter domain',
  popupAddBtn: isChinese ? '添加禁用' : 'Add',
  popupCancelBtn: isChinese ? '取消' : 'Cancel',
  popupAlreadyDisabled: isChinese ? '该网站已禁用' : 'Already disabled',
  popupEmptyState: isChinese ? '暂无禁用网站' : 'No disabled sites',
  popupListTitle: isChinese ? '已禁用网站' : 'Disabled Sites',
  popupInvalidInput: isChinese ? '请输入有效的网站域名' : 'Please enter a valid domain',
  popupAddFailed: isChinese ? '添加失败，请重试' : 'Failed to add, please retry',
  popupDeleteAria: isChinese ? '删除' : 'Delete'
};

// ==================== 键盘符号 ====================

export const KEY_SYMBOLS = {
  mac: {
    cmd: '⌘',
    alt: '⌥',
    shift: '⇧',
    enter: '↩︎',
    esc: 'Esc'
  },
  windows: {
    cmd: '',
    alt: 'Alt',
    shift: 'Shift',
    enter: 'Enter',
    esc: 'Esc'
  }
};

/** 获取键盘符号 */
export function getKeySymbol(key: 'cmd' | 'alt' | 'shift' | 'enter' | 'esc'): string {
  return isMac ? KEY_SYMBOLS.mac[key] : KEY_SYMBOLS.windows[key];
}

/** 获取选项快捷键提示文字 */
export function getOptionKeyHint(letter: string): string {
  return isMac ? `${getKeySymbol('alt')}${getKeySymbol('cmd')}${letter}` : `${getKeySymbol('alt')}+${letter}`;
}

// ==================== 搜索框配置 ====================

/** 搜索框根元素 class */
export const SEARCH_BOX_CLASS = 'vs-search-box';

/** 搜索框根元素 selector */
export const SEARCH_BOX_SELECTOR = `.${SEARCH_BOX_CLASS}`;

/** 位置存储 key */
export const POSITION_STORAGE_KEY = 'vs-search-box-position';

/** 默认位置 */
export const DEFAULT_POSITION = { right: 10, top: 10 };

/** 默认搜索选项 */
export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  caseSensitive: false,
  wholeWord: false,
  regex: false
};

/** 防抖延迟（毫秒） */
export const DEBOUNCE_DELAY = 150;

/** 动态内容变化后的重新搜索防抖延迟（毫秒） */
export const DYNAMIC_CONTENT_DEBOUNCE_DELAY = 500;

/** 搜索完成后恢复 MutationObserver 的延迟（毫秒） */
export const SEARCH_OBSERVER_RESTORE_DELAY = 100;

/** 导航完成后恢复 MutationObserver 的延迟（毫秒） */
export const NAVIGATION_OBSERVER_RESTORE_DELAY = 500;

/** MutationObserver 通用配置 */
export const SEARCH_OBSERVER_OPTIONS: MutationObserverInit = {
  childList: true,
  subtree: true,
  characterData: true,
  characterDataOldValue: true
};

// ==================== 高亮配置 ====================

export const MAX_HIGHLIGHTS = 1000;

/** 普通高亮 class */
export const HIGHLIGHT_CLASS = 'vs-search-highlight';

/** 当前高亮 class */
export const CURRENT_HIGHLIGHT_CLASS = 'vs-search-current';

/** 高亮相关 selector */
export const HIGHLIGHT_SELECTOR = `.${HIGHLIGHT_CLASS}, .${CURRENT_HIGHLIGHT_CLASS}`;

/** 普通高亮背景色，内联设置用于兼容 Shadow DOM */
export const HIGHLIGHT_BACKGROUND_COLOR = '#ffd700';

/** 当前高亮背景色，内联设置用于兼容 Shadow DOM */
export const CURRENT_HIGHLIGHT_BACKGROUND_COLOR = '#ff9632';

/** 高亮文本色，内联设置用于兼容 Shadow DOM */
export const HIGHLIGHT_TEXT_COLOR = '#000000';

// ==================== 搜索配置 ====================

/** 搜索时跳过的元素标签 */
export const SKIPPED_SEARCH_TAGS = ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT'];

/** 文本节点聚合时作为边界的元素标签 */
export const SEARCH_UNIT_BOUNDARY_TAGS = [
  'ARTICLE',
  'ASIDE',
  'BLOCKQUOTE',
  'BUTTON',
  'CAPTION',
  'CODE',
  'DD',
  'DIV',
  'DT',
  'FIGCAPTION',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'LI',
  'P',
  'PRE',
  'TD',
  'TH'
];

// ==================== Storage 配置 ====================

/** 禁用网站 storage key */
export const DISABLED_SITES_STORAGE_KEY = 'disabledSites';

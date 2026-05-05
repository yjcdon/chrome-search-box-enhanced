import {
  CURRENT_HIGHLIGHT_CLASS,
  HIGHLIGHT_CLASS,
  HIGHLIGHT_SELECTOR,
  SEARCH_BOX_SELECTOR
} from '../constants.js';

/**
 * 判断元素是否属于扩展自己的搜索框。
 */
export function isInsideSearchBox(element: Element): boolean {
  return !!element.closest(SEARCH_BOX_SELECTOR);
}

/**
 * 判断元素本身是否是搜索高亮。
 */
export function isSearchHighlightElement(element: Element): boolean {
  return element.classList.contains(HIGHLIGHT_CLASS) ||
    element.classList.contains(CURRENT_HIGHLIGHT_CLASS);
}

/**
 * 判断元素内部是否包含搜索高亮。
 */
export function containsSearchHighlight(element: Element): boolean {
  return isSearchHighlightElement(element) || !!element.querySelector(HIGHLIGHT_SELECTOR);
}

/**
 * 判断元素是否被隐藏。保持和原有逻辑一致，不检查 aria-hidden。
 */
export function isElementHidden(element: Element): boolean {
  if ((element as HTMLElement).hidden) {
    return true;
  }

  const style = window.getComputedStyle(element);
  return style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.visibility === 'collapse';
}

import type { SearchPosition } from '../types/index.js';

/**
 * 获取当前页面选区/光标位置。
 */
export function getSelectionPosition(excludedSelector: string): SearchPosition | undefined {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return undefined;
  }

  const anchorElement = selection.anchorNode instanceof Element
    ? selection.anchorNode
    : selection.anchorNode?.parentElement;

  if (anchorElement?.closest(excludedSelector)) {
    return undefined;
  }

  const range = selection.getRangeAt(0).cloneRange();
  const rect = getUsableRangeRect(range) ?? getCollapsedRangeRect(range);

  if (!rect) {
    return undefined;
  }

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

/**
 * 从 Range 中取一个可用矩形。
 */
function getUsableRangeRect(range: Range): DOMRect | undefined {
  const rects = Array.from(range.getClientRects());
  const rect = rects.find(item => item.width > 0 || item.height > 0);
  if (rect) {
    return rect;
  }

  const boundingRect = range.getBoundingClientRect();
  if (boundingRect.width > 0 || boundingRect.height > 0) {
    return boundingRect;
  }

  return undefined;
}

/**
 * 折叠光标没有可见矩形时，取光标附近字符的矩形作为近似位置。
 */
function getCollapsedRangeRect(range: Range): DOMRect | undefined {
  if (!range.collapsed) {
    return undefined;
  }

  if (range.startContainer instanceof Element) {
    const container = range.startContainer;
    const childIndex = range.startOffset;

    let targetElement: Element | null = null;
    if (childIndex < container.children.length) {
      targetElement = container.children[childIndex];
    } else if (container.children.length > 0) {
      targetElement = container.children[container.children.length - 1];
    }

    if (!targetElement) {
      targetElement = container;
    }

    const rect = targetElement.getBoundingClientRect();
    if (rect.width > 0 || rect.height > 0) {
      return new DOMRect(
        rect.left + rect.width / 2 - 1,
        rect.top + rect.height / 2 - 1,
        2,
        2
      );
    }
    return undefined;
  }

  if (!(range.startContainer instanceof Text)) {
    return undefined;
  }

  const textNode = range.startContainer;
  if (textNode.length === 0) {
    return undefined;
  }

  const probeRange = document.createRange();
  const start = Math.min(range.startOffset, textNode.length - 1);
  const end = Math.min(start + 1, textNode.length);
  probeRange.setStart(textNode, start);
  probeRange.setEnd(textNode, end);

  const rect = getUsableRangeRect(probeRange);
  probeRange.detach();
  return rect;
}

/**
 * 按视口位置比较两个矩形，用于不同 DOM root 无法直接比较文档顺序时兜底。
 */
export function compareRectsByViewportPosition(a: DOMRect, b: DOMRect): number {
  if (a.top !== b.top) {
    return a.top - b.top;
  }

  return a.left - b.left;
}

export function compareElementsByViewportPosition(a: Element, b: Element): number {
  return compareRectsByViewportPosition(a.getBoundingClientRect(), b.getBoundingClientRect());
}

export function compareRangesByViewportPosition(a: Range, b: Range): number {
  return compareRectsByViewportPosition(a.getBoundingClientRect(), b.getBoundingClientRect());
}

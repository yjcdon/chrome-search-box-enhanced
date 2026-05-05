import { MAX_HIGHLIGHTS } from '../constants.js';

/**
 * 高亮管理器
 * 负责将匹配范围渲染为可视高亮
 */
export class Highlighter {
  private highlights: HTMLElement[][] = [];
  private currentIndex = 0;
  private totalMatches = 0; // 实际匹配总数（可能超过 MAX_HIGHLIGHTS）
  private preservedIndex = 0; // 记录当前索引，用于恢复位置
  private onClickCallback: ((index: number) => void) | null = null;

  /**
   * 高亮匹配范围
   * @param ranges 匹配范围数组
   */
  highlight(ranges: Range[], options: { preserveIndex?: number } = {}): void {
    const preserveIndex = options.preserveIndex ?? this.currentIndex;
    // 先清除旧高亮
    this.clear();

    if (ranges.length === 0) {
      return;
    }

    // 记录实际匹配总数
    this.totalMatches = ranges.length;

    // 限制高亮数量，防止大页面卡顿
    const limitedRanges = ranges.slice(0, MAX_HIGHLIGHTS);

    // 从后往前处理，避免 DOM 变化影响后续 range
    const sortedRanges = [...limitedRanges].sort((a, b) => this.compareRangesDescending(a, b));

    sortedRanges.forEach((range) => {
      const mark = document.createElement('mark');
      mark.className = 'vs-search-highlight';
      this.bindHighlightClick(mark);

      try {
        // 尝试直接包裹（range 在同一个文本节点内）
        range.surroundContents(mark);
        this.highlights.push([mark]);
      } catch (e) {
        const marks = this.handleCrossBoundary(range);
        if (marks.length > 0) {
          this.highlights.push(marks);
        }
      }
    });

    // 按文档位置重新排序
    this.sortHighlightsByDocumentPosition();

    // 尝试恢复之前的索引（保持在相近的位置）
    let newIndex = 0;
    if (preserveIndex > 0 && preserveIndex < this.highlights.length) {
      // 如果之前的索引在有效范围内，保持它
      newIndex = preserveIndex;
    } else if (preserveIndex >= this.highlights.length && this.highlights.length > 0) {
      // 如果之前的索引超出范围（高亮数量减少了），保持在最后一个
      newIndex = this.highlights.length - 1;
    }

    // 设置当前项
    this.setCurrent(newIndex);
  }

  /**
   * 设置高亮点击回调
   */
  setOnClick(callback: (index: number) => void): void {
    this.onClickCallback = callback;
  }

  /**
   * 绑定高亮点击事件
   */
  private bindHighlightClick(mark: HTMLElement): void {
    mark.addEventListener('click', (event) => {
      event.stopPropagation();
      const index = parseInt(mark.dataset.index || '-1', 10);
      if (index < 0 || index >= this.highlights.length) {
        return;
      }

      this.setCurrent(index);
      this.onClickCallback?.(index);
    });
  }

  /**
   * 根据页面位置找到最近的匹配索引
   */
  findNearestIndex(position: { x: number; y: number }): number {
    if (this.highlights.length === 0) {
      return -1;
    }

    let nearestIndex = 0;
    let minDistance = Infinity;

    this.highlights.forEach((group, index) => {
      const distance = group.reduce((minDistance, el) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        return Math.min(minDistance, Math.hypot(centerX - position.x, centerY - position.y));
      }, Infinity);

      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  /**
   * 安全比较两个 Range（处理不同 DOM root 的情况）
   */
  private compareRangesDescending(a: Range, b: Range): number {
    try {
      return b.compareBoundaryPoints(Range.START_TO_START, a);
    } catch {
      // 不同 DOM root 的 Range 无法直接 compareBoundaryPoints，使用视口位置兜底
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      if (rectA.top !== rectB.top) {
        return rectB.top - rectA.top;
      }
      return rectB.left - rectA.left;
    }
  }

  /**
   * 处理跨元素边界的匹配。
   * 只包装命中的文本片段，避免克隆、删除或移动页面原有元素节点。
   */
  private handleCrossBoundary(range: Range): HTMLElement[] {
    const textParts = this.getTextPartsInRange(range);
    const marks: HTMLElement[] = [];

    // 从后往前包裹，避免前面的文本节点拆分影响后续 Range。
    for (let i = textParts.length - 1; i >= 0; i--) {
      const part = textParts[i];
      const mark = document.createElement('mark');
      mark.className = 'vs-search-highlight';
      this.bindHighlightClick(mark);

      const partRange = document.createRange();
      partRange.setStart(part.node, part.start);
      partRange.setEnd(part.node, part.end);

      try {
        partRange.surroundContents(mark);
        marks.unshift(mark);
      } catch {
        // 单个文本片段失败时跳过该片段，避免破坏宿主页面 DOM。
      } finally {
        partRange.detach();
      }
    }

    return marks;
  }

  /**
   * 获取 Range 覆盖到的文本节点片段
   */
  private getTextPartsInRange(range: Range): Array<{ node: Text; start: number; end: number }> {
    const root = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentNode
      : range.commonAncestorContainer;

    if (!root) {
      return [];
    }

    const parts: Array<{ node: Text; start: number; end: number }> = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

    let textNode: Text | null;
    while ((textNode = walker.nextNode() as Text | null)) {
      if (!this.rangeIntersectsTextNode(range, textNode)) {
        continue;
      }

      const start = textNode === range.startContainer ? range.startOffset : 0;
      const end = textNode === range.endContainer ? range.endOffset : textNode.length;

      if (start < end) {
        parts.push({ node: textNode, start, end });
      }
    }

    return parts;
  }

  /**
   * 判断 Range 是否覆盖指定文本节点
   */
  private rangeIntersectsTextNode(range: Range, node: Text): boolean {
    try {
      return range.intersectsNode(node);
    } catch {
      return false;
    }
  }

  /**
   * 按文档位置排序高亮元素
   */
  private sortHighlightsByDocumentPosition(): void {
    this.highlights.sort((a, b) => {
      const firstA = a[0];
      const firstB = b[0];

      if (!firstA || !firstB) {
        return 0;
      }

      const position = firstA.compareDocumentPosition(firstB);
      if (position & Node.DOCUMENT_POSITION_DISCONNECTED) {
        return this.compareElementsByRect(firstA, firstB);
      }
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
      }
      if (position & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1;
      }
      return 0;
    });

    // 更新索引
    this.highlights.forEach((group, index) => {
      group.forEach((el) => {
        el.dataset.index = String(index);
      });
    });
  }

  /**
   * 不同 DOM root 的元素用视口位置兜底排序
   */
  private compareElementsByRect(a: HTMLElement, b: HTMLElement): number {
    const rectA = a.getBoundingClientRect();
    const rectB = b.getBoundingClientRect();

    if (rectA.top !== rectB.top) {
      return rectA.top - rectB.top;
    }

    return rectA.left - rectB.left;
  }

  /**
   * 设置当前高亮项
   * @param index 索引
   */
  setCurrent(index: number): void {
    // 移除旧当前项样式
    this.highlights.forEach(group => {
      group.forEach(h => {
        h.classList.remove('vs-search-current');
      });
    });

    // 设置新当前项
    this.currentIndex = index;
    const current = this.highlights[index];
    if (current) {
      current.forEach(h => {
        h.classList.add('vs-search-current');
      });
    }
  }

  /**
   * 获取当前索引
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * 获取可导航的高亮数量
   */
  getCount(): number {
    return this.highlights.length;
  }

  /**
   * 获取实际匹配总数（可能超过 MAX_HIGHLIGHTS）
   */
  getTotalMatches(): number {
    return this.totalMatches;
  }

  /**
   * 获取指定索引的高亮元素
   */
  getHighlight(index: number): HTMLElement | null {
    return this.highlights[index]?.[0] || null;
  }

  /**
   * 获取所有高亮元素
   */
  getAllHighlights(): HTMLElement[] {
    return this.highlights.flat();
  }

  /**
   * 清除所有高亮
   */
  clear(): void {
    // 从后往前移除，避免索引问题
    for (let i = this.highlights.length - 1; i >= 0; i--) {
      const group = this.highlights[i];
      for (let j = group.length - 1; j >= 0; j--) {
        const mark = group[j];
        const parent = mark.parentNode;

        if (parent) {
          // 将 mark 的子节点移回原位置（保留页面原有元素节点和属性）
          while (mark.firstChild) {
            parent.insertBefore(mark.firstChild, mark);
          }
          parent.removeChild(mark);

          // 合并相邻文本节点
          parent.normalize();
        }
      }
    }

    this.highlights = [];
    this.currentIndex = 0;
    this.totalMatches = 0;
  }

  /**
   * 滚动到当前高亮项
   */
  scrollToCurrent(): void {
    const current = this.getHighlight(this.currentIndex);
    if (current) {
      current.scrollIntoView({
        behavior: 'instant',
        block: 'center',
        inline: 'nearest'
      });
    }
  }

  /**
   * 导航到下一个
   * @returns 是否成功
   */
  next(): boolean {
    if (this.highlights.length === 0) return false;

    const newIndex = (this.currentIndex + 1) % this.highlights.length;
    this.setCurrent(newIndex);
    this.scrollToCurrent();
    return true;
  }

  /**
   * 导航到上一个
   * @returns 是否成功
   */
  prev(): boolean {
    if (this.highlights.length === 0) return false;

    const newIndex = (this.currentIndex - 1 + this.highlights.length) % this.highlights.length;
    this.setCurrent(newIndex);
    this.scrollToCurrent();
    return true;
  }
}

import { MAX_HIGHLIGHTS } from '../constants.js';

/**
 * 高亮管理器
 * 负责将匹配范围渲染为可视高亮
 */
export class Highlighter {
  private highlights: HTMLElement[] = [];
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

    sortedRanges.forEach((range, index) => {
      const mark = document.createElement('mark');
      mark.className = 'vs-search-highlight';
      mark.dataset.index = String(limitedRanges.length - 1 - index); // 反向索引
      this.bindHighlightClick(mark);

      try {
        // 尝试直接包裹（range 在同一个文本节点内）
        range.surroundContents(mark);
        this.highlights.push(mark);
      } catch (e) {
        // 处理跨元素边界的情况（会自动添加到 highlights）
        // 注意：不使用传入的 mark，handleCrossBoundary 会创建自己的 marks
        this.handleCrossBoundary(range);
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

    this.highlights.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.hypot(centerX - position.x, centerY - position.y);

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
   * 处理跨元素边界的匹配
   * 使用 cloneContents + deleteContents + insertNode 方案
   * 避免 extractContents 部分包含元素时留下空克隆
   */
  private handleCrossBoundary(range: Range): void {
    const mark = document.createElement('mark');
    mark.className = 'vs-search-highlight';
    this.bindHighlightClick(mark);

    // 先克隆内容
    const fragment = range.cloneContents();
    mark.appendChild(fragment);

    // 记录删除前的父元素
    const parentElement = range.commonAncestorContainer.parentElement ||
      (range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? range.commonAncestorContainer as Element
        : null);

    // 删除原内容
    range.deleteContents();

    // 清理空元素：遍历父元素的所有后代，移除空的内联元素
    if (parentElement) {
      this.cleanupEmptyElements(parentElement);
    }

    // 插入 mark
    range.insertNode(mark);
    this.highlights.push(mark);
  }

  /**
   * 清理空的内联元素（deleteContents 可能留下空克隆）
   */
  private cleanupEmptyElements(parent: Element): void {
    // 查找所有可能被部分包含的元素类型
    const emptySelectors = 'strong:empty, em:empty, span:empty, b:empty, i:empty, a:empty';
    parent.querySelectorAll(emptySelectors).forEach((el) => {
      el.remove();
    });
  }

  /**
   * 按文档位置排序高亮元素
   */
  private sortHighlightsByDocumentPosition(): void {
    this.highlights.sort((a, b) => {
      const position = a.compareDocumentPosition(b);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
      }
      if (position & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1;
      }
      return 0;
    });

    // 更新索引
    this.highlights.forEach((el, index) => {
      el.dataset.index = String(index);
    });
  }

  /**
   * 设置当前高亮项
   * @param index 索引
   */
  setCurrent(index: number): void {
    // 移除旧当前项样式
    this.highlights.forEach(h => {
      h.classList.remove('vs-search-current');
    });

    // 设置新当前项
    this.currentIndex = index;
    const current = this.highlights[index];
    if (current) {
      current.classList.add('vs-search-current');
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
    return this.highlights[index] || null;
  }

  /**
   * 获取所有高亮元素
   */
  getAllHighlights(): HTMLElement[] {
    return [...this.highlights];
  }

  /**
   * 清除所有高亮
   */
  clear(): void {
    // 从后往前移除，避免索引问题
    for (let i = this.highlights.length - 1; i >= 0; i--) {
      const mark = this.highlights[i];
      const parent = mark.parentNode;

      if (parent) {
        // 将 mark 的子节点移回原位置（保留元素节点和属性）
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);

        // 合并相邻文本节点
        parent.normalize();
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
    const current = this.highlights[this.currentIndex];
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

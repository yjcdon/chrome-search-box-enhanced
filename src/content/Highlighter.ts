/**
 * 高亮管理器
 * 负责将匹配范围渲染为可视高亮
 */
export class Highlighter {
  private highlights: HTMLElement[] = [];
  private currentIndex = 0;
  private totalMatches = 0; // 实际匹配总数（可能超过 MAX_HIGHLIGHTS）
  private readonly MAX_HIGHLIGHTS = 500; // 最大高亮数量，防止大页面卡顿

  /**
   * 高亮匹配范围
   * @param ranges 匹配范围数组
   */
  highlight(ranges: Range[]): void {
    // 先清除旧高亮
    this.clear();

    if (ranges.length === 0) {
      return;
    }

    // 记录实际匹配总数
    this.totalMatches = ranges.length;

    // 限制高亮数量，防止大页面卡顿
    const limitedRanges = ranges.slice(0, this.MAX_HIGHLIGHTS);

    // 从后往前处理，避免 DOM 变化影响后续 range
    const sortedRanges = [...limitedRanges].sort((a, b) => {
      return b.compareBoundaryPoints(Range.START_TO_START, a);
    });

    sortedRanges.forEach((range, index) => {
      const mark = document.createElement('mark');
      mark.className = 'vs-search-highlight';
      mark.dataset.index = String(limitedRanges.length - 1 - index); // 反向索引

      try {
        // 尝试直接包裹（range 在同一个文本节点内）
        range.surroundContents(mark);
        this.highlights.push(mark);
      } catch (e) {
        // 处理跨元素边界的情况
        this.handleCrossBoundary(range, mark);
        this.highlights.push(mark);
      }
    });

    // 按文档位置重新排序
    this.sortHighlightsByDocumentPosition();

    // 设置第一个为当前项
    if (this.highlights.length > 0) {
      this.setCurrent(0);
    }
  }

  /**
   * 处理跨元素边界的匹配
   */
  private handleCrossBoundary(range: Range, mark: HTMLElement): void {
    // 提取内容并包裹
    const fragment = range.extractContents();
    mark.appendChild(fragment);
    range.insertNode(mark);
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
   * 获取高亮元素数量（实际匹配总数）
   */
  getCount(): number {
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
        // 将 mark 的内容替换为文本节点
        const textContent = mark.textContent || '';
        const textNode = document.createTextNode(textContent);
        parent.replaceChild(textNode, mark);

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
        behavior: 'smooth',
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

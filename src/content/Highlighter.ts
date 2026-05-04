/**
 * 高亮管理器
 * 负责将匹配范围渲染为可视高亮
 */
export class Highlighter {
  private highlights: HTMLElement[] = [];
  private currentIndex = 0;
  private totalMatches = 0; // 实际匹配总数（可能超过 MAX_HIGHLIGHTS）
  private readonly MAX_HIGHLIGHTS = 500; // 最大高亮数量，防止大页面卡顿
  private preservedIndex = 0; // 记录当前索引，用于恢复位置

  /**
   * 高亮匹配范围
   * @param ranges 匹配范围数组
   */
  highlight(ranges: Range[]): void {
    // 记录当前索引（在清除前）
    const preserveIndex = this.currentIndex;

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
   * 处理跨元素边界的匹配
   * 使用逐节点包裹策略，避免破坏原有 DOM 结构
   */
  private handleCrossBoundary(range: Range): void {
    // 获取 range 内的所有文本节点
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node: Node) => {
          // 只接受在 range 内的节点
          if (range.intersectsNode(node)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        }
      }
    );

    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      textNodes.push(node);
    }

    // 为每个文本节点创建包裹
    textNodes.forEach((textNode, idx) => {
      const nodeMark = document.createElement('mark');
      nodeMark.className = 'vs-search-highlight';

      // 计算该节点在 range 内的范围
      const startOffset = (idx === 0 && textNode === range.startContainer)
        ? range.startOffset
        : 0;
      const endOffset = (idx === textNodes.length - 1 && textNode === range.endContainer)
        ? range.endOffset
        : textNode.length;

      // 创建子 range 并包裹
      const subRange = document.createRange();
      subRange.setStart(textNode, startOffset);
      subRange.setEnd(textNode, endOffset);

      try {
        subRange.surroundContents(nodeMark);
        this.highlights.push(nodeMark);
      } catch {
        // 如果仍然失败，使用 extractContents 作为后备
        const fragment = subRange.extractContents();
        nodeMark.appendChild(fragment);
        subRange.insertNode(nodeMark);
        this.highlights.push(nodeMark);
      }
    });

    // 移除原始 mark（它不会被使用）
    // mark 元素是调用者创建的，但我们没有使用它
    // 由于我们直接操作 DOM，不需要额外的处理
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

import type { SearchOptions, MatchRange } from '../types/index.js';

/**
 * 搜索引擎
 * 负责在页面文本中查找匹配
 */
export class SearchEngine {
  /**
   * 执行搜索
   * @param query 搜索关键词
   * @param options 搜索选项
   * @returns 匹配范围数组
   */
  search(query: string, options: SearchOptions): Range[] {
    if (!query.trim()) {
      return [];
    }

    try {
      // 1. 构建正则表达式
      const pattern = this.buildPattern(query, options);

      // 2. 遍历页面所有文本节点
      const ranges: Range[] = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        (node) => this.shouldSearchNode(node)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
      );

      // 3. 在每个文本节点中查找匹配
      let textNode: Text | null;
      while (textNode = walker.nextNode() as Text | null) {
        const text = textNode.textContent || '';
        const matches = this.findMatches(text, pattern);

        matches.forEach(match => {
          const range = document.createRange();
          range.setStart(textNode!, match.start);
          range.setEnd(textNode!, match.end);
          ranges.push(range);
        });
      }

      // 按文档位置排序
      return this.sortRangesByDocumentPosition(ranges);
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * 构建正则表达式
   */
  private buildPattern(query: string, options: SearchOptions): RegExp {
    let pattern = query;

    // 如果不是正则模式，转义特殊字符
    if (!options.regex) {
      pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // 全词匹配
    if (options.wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }

    // 构建正则
    const flags = options.caseSensitive ? 'g' : 'gi';
    return new RegExp(pattern, flags);
  }

  /**
   * 在文本中查找所有匹配位置
   */
  private findMatches(text: string, pattern: RegExp): MatchRange[] {
    const matches: MatchRange[] = [];

    // 重置 lastIndex 确保从头开始匹配
    pattern.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length
      });

      // 防止零宽匹配导致死循环
      if (match[0].length === 0) {
        pattern.lastIndex++;
      }
    }

    return matches;
  }

  /**
   * 判断是否应该搜索该节点
   */
  private shouldSearchNode(node: Node): boolean {
    // 跳过 script、style、textarea、input、select
    const skipTags = ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT'];

    let parent: Node | null = node.parentNode;
    while (parent) {
      if (parent.nodeType === Node.ELEMENT_NODE) {
        const element = parent as HTMLElement;
        const tagName = element.tagName;

        if (skipTags.includes(tagName)) {
          return false;
        }

        // 跳过 contenteditable 区域
        if (element.isContentEditable) {
          return false;
        }

        // 跳过扩展自己的搜索框
        if (element.closest('.vs-search-box')) {
          return false;
        }
      }
      parent = parent.parentNode;
    }

    return true;
  }

  /**
   * 按文档位置排序 ranges
   */
  private sortRangesByDocumentPosition(ranges: Range[]): Range[] {
    return ranges.sort((a, b) => {
      const comparison = a.compareBoundaryPoints(Range.START_TO_START, b);
      return comparison;
    });
  }
}

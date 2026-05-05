import type { SearchOptions, MatchRange } from '../types/index.js';

interface TextSegment {
  node: Text;
  start: number;
  end: number;
}

interface SearchUnit {
  text: string;
  segments: TextSegment[];
}

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

      // 2. 遍历页面所有文本节点，并按可连续搜索的区域聚合
      const ranges: Range[] = [];
      const searchUnits = this.collectSearchUnits();

      // 3. 在每个搜索区域中查找匹配。聚合后可以匹配被语法高亮拆开的文本节点，如 console + .
      searchUnits.forEach((unit) => {
        const matches = this.findMatches(unit.text, pattern);

        matches.forEach(match => {
          const range = this.createRangeFromMatch(unit, match);
          if (range) {
            ranges.push(range);
          }
        });
      });

      // 按文档位置排序
      return this.sortRangesByDocumentPosition(ranges);
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * 收集所有可搜索区域
   */
  private collectSearchUnits(): SearchUnit[] {
    const roots = this.collectSearchRoots(document.body);
    const units: SearchUnit[] = [];

    roots.forEach((root) => {
      const unitNodes = new Map<Node, Text[]>();
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        (node) => this.shouldSearchNode(node)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
      );

      let textNode: Text | null;
      while ((textNode = walker.nextNode() as Text | null)) {
        const text = textNode.textContent || '';
        if (!text) {
          continue;
        }

        const unitRoot = this.getSearchUnitRoot(textNode, root);
        const nodes = unitNodes.get(unitRoot);
        if (nodes) {
          nodes.push(textNode);
        } else {
          unitNodes.set(unitRoot, [textNode]);
        }
      }

      unitNodes.forEach((nodes) => {
        const segments: TextSegment[] = [];
        let text = '';

        nodes.forEach((node) => {
          const nodeText = node.textContent || '';
          if (!nodeText) {
            return;
          }

          const start = text.length;
          text += nodeText;
          segments.push({
            node,
            start,
            end: text.length
          });
        });

        if (text) {
          units.push({ text, segments });
        }
      });
    });

    return units;
  }

  /**
   * 收集 document body 以及开放的 ShadowRoot
   * 跳过隐藏元素的 ShadowRoot
   */
  private collectSearchRoots(root: ParentNode): ParentNode[] {
    const roots: ParentNode[] = [root];
    const elements = root.querySelectorAll('*');

    elements.forEach((element) => {
      if (element.shadowRoot) {
        // 检查宿主元素是否可见
        if (this.isElementVisible(element)) {
          roots.push(...this.collectSearchRoots(element.shadowRoot));
        }
      }
    });

    return roots;
  }

  /**
   * 检查元素是否可见（不被隐藏）
   */
  private isElementVisible(element: Element): boolean {
    let el: Element | null = element;
    while (el) {
      const computedStyle = window.getComputedStyle(el);

      // 跳过 display:none
      if (computedStyle.display === 'none') {
        return false;
      }

      // 跳过 visibility:hidden / collapse
      if (computedStyle.visibility === 'hidden' ||
          computedStyle.visibility === 'collapse') {
        return false;
      }

      // 跳过 hidden 属性（不检查 aria-hidden，保持和 Chrome 原生查找一致）
      if ((el as HTMLElement).hidden) {
        return false;
      }

      el = el.parentElement;
    }

    return true;
  }

  /**
   * 找到文本节点所属的连续搜索区域
   */
  private getSearchUnitRoot(textNode: Text, root: Node): Node {
    const boundaryTags = new Set([
      'A',
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
    ]);

    let parent = textNode.parentElement;
    while (parent && parent !== root) {
      if (boundaryTags.has(parent.tagName)) {
        return parent;
      }
      parent = parent.parentElement;
    }

    return root;
  }

  /**
   * 将聚合文本中的匹配位置映射回 DOM Range
   */
  private createRangeFromMatch(unit: SearchUnit, match: MatchRange): Range | null {
    const startSegment = unit.segments.find(segment =>
      match.start >= segment.start && match.start < segment.end
    );
    const endSegment = unit.segments.find(segment =>
      match.end > segment.start && match.end <= segment.end
    );

    if (!startSegment || !endSegment) {
      return null;
    }

    const range = document.createRange();
    range.setStart(startSegment.node, match.start - startSegment.start);
    range.setEnd(endSegment.node, match.end - endSegment.start);
    return range;
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

        // 跳过扩展自己的搜索框
        if (element.closest('.vs-search-box')) {
          return false;
        }

        // 跳过隐藏元素（只检查 hidden 属性，不检查 aria-hidden，保持和 Chrome 原生查找一致）
        if (element.hidden) {
          return false;
        }

        // 跳过 display:none / visibility:hidden 的元素
        const style = window.getComputedStyle(element);
        if (style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.visibility === 'collapse') {
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
      try {
        return a.compareBoundaryPoints(Range.START_TO_START, b);
      } catch {
        return this.compareRangeRects(a, b);
      }
    });
  }

  /**
   * 不同 DOM root 的 Range 无法直接 compareBoundaryPoints，使用视口位置兜底
   */
  private compareRangeRects(a: Range, b: Range): number {
    const rectA = a.getBoundingClientRect();
    const rectB = b.getBoundingClientRect();

    if (rectA.top !== rectB.top) {
      return rectA.top - rectB.top;
    }

    return rectA.left - rectB.left;
  }
}

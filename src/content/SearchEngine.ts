import { SEARCH_UNIT_BOUNDARY_TAGS, SKIPPED_SEARCH_TAGS } from '../constants.js';
import { isElementHidden, isInsideSearchBox } from './dom-utils.js';
import { compareRangesByViewportPosition } from './dom-position-utils.js';
import { buildSearchPattern, findMatches } from '../search-utils.js';
import type { MatchRange, SearchOptions } from '../types/index.js';

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
      // 1. 构建正则表达式（trim 搜索词，忽略前后空格）
      const pattern = buildSearchPattern(query.trim(), options);

      // 2. 遍历页面所有文本节点，并按可连续搜索的区域聚合
      const ranges: Range[] = [];
      const searchUnits = this.collectSearchUnits();

      // 3. 在每个搜索区域中查找匹配。聚合后可以匹配被语法高亮拆开的文本节点，如 console + .
      searchUnits.forEach((unit) => {
        const matches = findMatches(unit.text, pattern);

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
      if (isElementHidden(el)) {
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
    let parent = textNode.parentElement;
    while (parent && parent !== root) {
      if (SEARCH_UNIT_BOUNDARY_TAGS.includes(parent.tagName)) {
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
   * 判断是否应该搜索该节点
   */
  private shouldSearchNode(node: Node): boolean {
    let parent: Node | null = node.parentNode;
    while (parent) {
      if (parent.nodeType === Node.ELEMENT_NODE) {
        const element = parent as HTMLElement;
        const tagName = element.tagName;

        if (SKIPPED_SEARCH_TAGS.includes(tagName)) {
          return false;
        }

        // 跳过扩展自己的搜索框
        if (isInsideSearchBox(element)) {
          return false;
        }

        // 跳过隐藏元素（不检查 aria-hidden，保持和 Chrome 原生查找一致）
        if (isElementHidden(element)) {
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
        return compareRangesByViewportPosition(a, b);
      }
    });
  }
}

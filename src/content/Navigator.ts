import type { Highlighter } from './Highlighter.js';

/**
 * 导航器
 * 处理匹配项之间的导航
 */
export class Navigator {
  private highlighter: Highlighter;

  constructor(highlighter: Highlighter) {
    this.highlighter = highlighter;
  }

  /**
   * 导航到下一个匹配项
   * @returns 新的索引，如果没有匹配项返回 -1
   */
  next(): number {
    if (this.highlighter.next()) {
      return this.highlighter.getCurrentIndex();
    }
    return -1;
  }

  /**
   * 导航到上一个匹配项
   * @returns 新的索引，如果没有匹配项返回 -1
   */
  prev(): number {
    if (this.highlighter.prev()) {
      return this.highlighter.getCurrentIndex();
    }
    return -1;
  }

  /**
   * 导航到指定索引
   * @param index 目标索引
   * @returns 是否成功
   */
  goTo(index: number): boolean {
    const count = this.highlighter.getCount();
    if (count === 0 || index < 0 || index >= count) {
      return false;
    }

    this.highlighter.setCurrent(index);
    this.highlighter.scrollToCurrent();
    return true;
  }

  /**
   * 获取当前索引
   */
  getCurrentIndex(): number {
    return this.highlighter.getCurrentIndex();
  }

  /**
   * 获取匹配总数
   */
  getTotal(): number {
    return this.highlighter.getCount();
  }

  /**
   * 是否有匹配项
   */
  hasMatches(): boolean {
    return this.highlighter.getCount() > 0;
  }
}

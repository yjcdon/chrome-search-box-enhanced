class SearchBox {
  constructor() {
    this.container = null;
    this.input = null;
    this.resultLabel = null;
    this.optionButtons = /* @__PURE__ */ new Map();
    this.isOpenState = false;
    this.options = {
      caseSensitive: false,
      wholeWord: false,
      regex: false
    };
    this.onSearch = null;
    this.onNavigate = null;
    this.onClose = null;
    this.onOptionChange = null;
    this.createDOM();
  }
  /**
   * 创建搜索框 DOM 结构
   */
  createDOM() {
    this.container = document.createElement("div");
    this.container.className = "vs-search-box";
    this.container.style.display = "none";
    this.input = document.createElement("input");
    this.input.type = "text";
    this.input.placeholder = "查找";
    this.input.className = "vs-search-input";
    this.container.appendChild(this.input);
    const optionsGroup = document.createElement("div");
    optionsGroup.className = "vs-search-options";
    const optionConfigs = [
      { key: "caseSensitive", title: "区分大小写 (Alt+C)", text: "Aa" },
      { key: "wholeWord", title: "全词匹配 (Alt+W)", text: "ab" },
      { key: "regex", title: "使用正则表达式 (Alt+R)", text: ".*" }
    ];
    optionConfigs.forEach((config) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vs-search-option-btn";
      btn.dataset.option = config.key;
      btn.title = config.title;
      btn.textContent = config.text;
      btn.addEventListener("click", () => this.toggleOption(config.key));
      optionsGroup.appendChild(btn);
      this.optionButtons.set(config.key, btn);
    });
    this.container.appendChild(optionsGroup);
    this.resultLabel = document.createElement("span");
    this.resultLabel.className = "vs-search-results";
    this.resultLabel.textContent = "无结果";
    this.container.appendChild(this.resultLabel);
    const navGroup = document.createElement("div");
    navGroup.className = "vs-search-nav";
    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "vs-search-nav-btn prev";
    prevBtn.title = "上一个 (Shift+Enter)";
    prevBtn.innerHTML = "↑";
    prevBtn.addEventListener("click", () => this.navigate("prev"));
    navGroup.appendChild(prevBtn);
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "vs-search-nav-btn next";
    nextBtn.title = "下一个 (Enter)";
    nextBtn.innerHTML = "↓";
    nextBtn.addEventListener("click", () => this.navigate("next"));
    navGroup.appendChild(nextBtn);
    this.container.appendChild(navGroup);
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "vs-search-close";
    closeBtn.title = "关闭 (Esc)";
    closeBtn.innerHTML = "×";
    closeBtn.addEventListener("click", () => this.close());
    this.container.appendChild(closeBtn);
    this.input.addEventListener("input", () => this.handleInput());
    this.input.addEventListener("keydown", (e) => this.handleKeyDown(e));
    document.body.appendChild(this.container);
  }
  /**
   * 处理输入事件
   */
  handleInput() {
    if (this.onSearch && this.input) {
      this.onSearch(this.input.value, this.options);
    }
  }
  /**
   * 处理键盘事件
   */
  handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      this.navigate(event.shiftKey ? "prev" : "next");
    }
  }
  /**
   * 切换搜索选项
   */
  toggleOption(key) {
    this.options[key] = !this.options[key];
    this.updateOptionButtons();
    if (this.onOptionChange) {
      this.onOptionChange(this.options);
    }
    if (this.onSearch && this.input) {
      this.onSearch(this.input.value, this.options);
    }
  }
  /**
   * 更新选项按钮状态
   */
  updateOptionButtons() {
    this.optionButtons.forEach((btn, key) => {
      const isActive = this.options[key];
      btn.classList.toggle("active", isActive);
    });
  }
  /**
   * 导航到上一个/下一个匹配
   */
  navigate(direction) {
    if (this.onNavigate) {
      this.onNavigate(direction);
    }
  }
  /**
   * 设置搜索回调
   */
  setOnSearch(callback) {
    this.onSearch = callback;
  }
  /**
   * 设置导航回调
   */
  setOnNavigate(callback) {
    this.onNavigate = callback;
  }
  /**
   * 设置关闭回调
   */
  setOnClose(callback) {
    this.onClose = callback;
  }
  /**
   * 设置选项变更回调
   */
  setOnOptionChange(callback) {
    this.onOptionChange = callback;
  }
  /**
   * 打开搜索框
   */
  open(options = {}) {
    var _a;
    if (!this.container || !this.input) return;
    this.container.style.display = "flex";
    this.isOpenState = true;
    if (options.preserveSelection) {
      const selection = ((_a = window.getSelection()) == null ? void 0 : _a.toString()) || "";
      if (selection) {
        this.input.value = selection;
      }
    }
    this.input.focus();
    this.input.select();
    this.handleInput();
  }
  /**
   * 关闭搜索框
   */
  close() {
    if (!this.container) return;
    this.container.style.display = "none";
    this.isOpenState = false;
    if (this.onClose) {
      this.onClose();
    }
  }
  /**
   * 是否已打开
   */
  isOpen() {
    return this.isOpenState;
  }
  /**
   * 更新结果显示
   */
  updateResult(result) {
    if (!this.resultLabel) return;
    if (result.total === 0) {
      this.resultLabel.textContent = "无结果";
      this.resultLabel.classList.add("no-results");
    } else {
      this.resultLabel.textContent = `${result.currentIndex + 1}/${result.total}`;
      this.resultLabel.classList.remove("no-results");
    }
  }
  /**
   * 销毁组件
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.input = null;
    this.resultLabel = null;
    this.optionButtons.clear();
  }
}
class SearchEngine {
  /**
   * 执行搜索
   * @param query 搜索关键词
   * @param options 搜索选项
   * @returns 匹配范围数组
   */
  search(query, options) {
    if (!query.trim()) {
      return [];
    }
    try {
      const pattern = this.buildPattern(query, options);
      const ranges = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        (node) => this.shouldSearchNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
      );
      let textNode;
      while (textNode = walker.nextNode()) {
        const text = textNode.textContent || "";
        const matches = this.findMatches(text, pattern);
        matches.forEach((match) => {
          const range = document.createRange();
          range.setStart(textNode, match.start);
          range.setEnd(textNode, match.end);
          ranges.push(range);
        });
      }
      return this.sortRangesByDocumentPosition(ranges);
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  }
  /**
   * 构建正则表达式
   */
  buildPattern(query, options) {
    let pattern = query;
    if (!options.regex) {
      pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    if (options.wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }
    const flags = options.caseSensitive ? "g" : "gi";
    return new RegExp(pattern, flags);
  }
  /**
   * 在文本中查找所有匹配位置
   */
  findMatches(text, pattern) {
    const matches = [];
    const globalPattern = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
    let match;
    while ((match = globalPattern.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length
      });
      if (match[0].length === 0) {
        globalPattern.lastIndex++;
      }
    }
    return matches;
  }
  /**
   * 判断是否应该搜索该节点
   */
  shouldSearchNode(node) {
    const skipTags = ["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT"];
    let parent = node.parentNode;
    while (parent) {
      if (parent.nodeType === Node.ELEMENT_NODE) {
        const element = parent;
        const tagName = element.tagName;
        if (skipTags.includes(tagName)) {
          return false;
        }
        if (element.isContentEditable) {
          return false;
        }
        if (element.closest(".vs-search-box")) {
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
  sortRangesByDocumentPosition(ranges) {
    return ranges.sort((a, b) => {
      const comparison = a.compareBoundaryPoints(Range.START_TO_START, b);
      return comparison;
    });
  }
}
class Highlighter {
  constructor() {
    this.highlights = [];
    this.currentIndex = 0;
  }
  /**
   * 高亮匹配范围
   * @param ranges 匹配范围数组
   */
  highlight(ranges) {
    this.clear();
    if (ranges.length === 0) {
      return;
    }
    const sortedRanges = [...ranges].sort((a, b) => {
      return b.compareBoundaryPoints(Range.START_TO_START, a);
    });
    sortedRanges.forEach((range, index) => {
      const mark = document.createElement("mark");
      mark.className = "vs-search-highlight";
      mark.dataset.index = String(ranges.length - 1 - index);
      try {
        range.surroundContents(mark);
        this.highlights.push(mark);
      } catch (e) {
        this.handleCrossBoundary(range, mark);
        this.highlights.push(mark);
      }
    });
    this.sortHighlightsByDocumentPosition();
    if (this.highlights.length > 0) {
      this.setCurrent(0);
    }
  }
  /**
   * 处理跨元素边界的匹配
   */
  handleCrossBoundary(range, mark) {
    const fragment = range.extractContents();
    mark.appendChild(fragment);
    range.insertNode(mark);
  }
  /**
   * 按文档位置排序高亮元素
   */
  sortHighlightsByDocumentPosition() {
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
    this.highlights.forEach((el, index) => {
      el.dataset.index = String(index);
    });
  }
  /**
   * 设置当前高亮项
   * @param index 索引
   */
  setCurrent(index) {
    this.highlights.forEach((h) => {
      h.classList.remove("vs-search-current");
    });
    this.currentIndex = index;
    const current = this.highlights[index];
    if (current) {
      current.classList.add("vs-search-current");
    }
  }
  /**
   * 获取当前索引
   */
  getCurrentIndex() {
    return this.currentIndex;
  }
  /**
   * 获取高亮元素数量
   */
  getCount() {
    return this.highlights.length;
  }
  /**
   * 获取指定索引的高亮元素
   */
  getHighlight(index) {
    return this.highlights[index] || null;
  }
  /**
   * 获取所有高亮元素
   */
  getAllHighlights() {
    return [...this.highlights];
  }
  /**
   * 清除所有高亮
   */
  clear() {
    for (let i = this.highlights.length - 1; i >= 0; i--) {
      const mark = this.highlights[i];
      const parent = mark.parentNode;
      if (parent) {
        const textContent = mark.textContent || "";
        const textNode = document.createTextNode(textContent);
        parent.replaceChild(textNode, mark);
        parent.normalize();
      }
    }
    this.highlights = [];
    this.currentIndex = 0;
  }
  /**
   * 滚动到当前高亮项
   */
  scrollToCurrent() {
    const current = this.highlights[this.currentIndex];
    if (current) {
      current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest"
      });
    }
  }
  /**
   * 导航到下一个
   * @returns 是否成功
   */
  next() {
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
  prev() {
    if (this.highlights.length === 0) return false;
    const newIndex = (this.currentIndex - 1 + this.highlights.length) % this.highlights.length;
    this.setCurrent(newIndex);
    this.scrollToCurrent();
    return true;
  }
}
class Navigator {
  constructor(highlighter) {
    this.highlighter = highlighter;
  }
  /**
   * 导航到下一个匹配项
   * @returns 新的索引，如果没有匹配项返回 -1
   */
  next() {
    if (this.highlighter.next()) {
      return this.highlighter.getCurrentIndex();
    }
    return -1;
  }
  /**
   * 导航到上一个匹配项
   * @returns 新的索引，如果没有匹配项返回 -1
   */
  prev() {
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
  goTo(index) {
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
  getCurrentIndex() {
    return this.highlighter.getCurrentIndex();
  }
  /**
   * 获取匹配总数
   */
  getTotal() {
    return this.highlighter.getCount();
  }
  /**
   * 是否有匹配项
   */
  hasMatches() {
    return this.highlighter.getCount() > 0;
  }
}
function isFindShortcut(event) {
  const key = event.key.toLowerCase();
  const isMacFind = event.metaKey && !event.ctrlKey && key === "f";
  const isWindowsOrLinuxFind = event.ctrlKey && !event.metaKey && key === "f";
  return (isMacFind || isWindowsOrLinuxFind) && !event.altKey && !event.shiftKey && !event.isComposing;
}
function installShortcutInterceptor(searchBox) {
  document.addEventListener("keydown", (event) => {
    if (isFindShortcut(event)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      searchBox.open({ preserveSelection: true });
      return;
    }
    if (event.key === "Escape" && searchBox.isOpen()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      searchBox.close();
    }
  }, { capture: true });
}
function main() {
  const searchEngine = new SearchEngine();
  const highlighter = new Highlighter();
  const navigator = new Navigator(highlighter);
  const searchBox = new SearchBox();
  searchBox.setOnSearch((query, options) => {
    highlighter.clear();
    if (!query.trim()) {
      searchBox.updateResult({ total: 0, currentIndex: 0 });
      return;
    }
    const ranges = searchEngine.search(query, options);
    highlighter.highlight(ranges);
    const total = highlighter.getCount();
    const currentIndex = total > 0 ? highlighter.getCurrentIndex() : 0;
    searchBox.updateResult({ total, currentIndex });
    if (total > 0) {
      highlighter.scrollToCurrent();
    }
  });
  searchBox.setOnNavigate((direction) => {
    const success = direction === "next" ? navigator.next() : navigator.prev();
    if (success) {
      const total = navigator.getTotal();
      const currentIndex = navigator.getCurrentIndex();
      searchBox.updateResult({ total, currentIndex });
    }
  });
  searchBox.setOnClose(() => {
    highlighter.clear();
  });
  searchBox.setOnOptionChange((_options) => {
  });
  installShortcutInterceptor(searchBox);
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}

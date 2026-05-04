import type { SearchOptions, SearchResult } from '../types/index.js';

/**
 * VSCode 风格搜索框组件
 */
export class SearchBox {
  private container: HTMLElement | null = null;
  private input: HTMLInputElement | null = null;
  private resultLabel: HTMLElement | null = null;
  private optionButtons: Map<string, HTMLButtonElement> = new Map();
  private isOpenState = false;

  private options: SearchOptions = {
    caseSensitive: false,
    wholeWord: false,
    regex: false
  };

  // 回调函数
  private onSearch: ((query: string, options: SearchOptions) => void) | null = null;
  private onNavigate: ((direction: 'next' | 'prev') => void) | null = null;
  private onClose: (() => void) | null = null;
  private onOptionChange: ((options: SearchOptions) => void) | null = null;

  constructor() {
    this.createDOM();
  }

  /**
   * 创建搜索框 DOM 结构
   */
  private createDOM(): void {
    // 主容器
    this.container = document.createElement('div');
    this.container.className = 'vs-search-box';
    this.container.style.display = 'none';

    // 输入框
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = '查找';
    this.input.className = 'vs-search-input';
    this.container.appendChild(this.input);

    // 选项按钮组
    const optionsGroup = document.createElement('div');
    optionsGroup.className = 'vs-search-options';

    const optionConfigs = [
      { key: 'caseSensitive', title: '区分大小写 (Alt+C)', text: 'Aa' },
      { key: 'wholeWord', title: '全词匹配 (Alt+W)', text: 'ab' },
      { key: 'regex', title: '使用正则表达式 (Alt+R)', text: '.*' }
    ];

    optionConfigs.forEach(config => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vs-search-option-btn';
      btn.dataset.option = config.key;
      btn.title = config.title;
      btn.textContent = config.text;
      btn.addEventListener('click', () => this.toggleOption(config.key as keyof SearchOptions));
      optionsGroup.appendChild(btn);
      this.optionButtons.set(config.key, btn);
    });

    this.container.appendChild(optionsGroup);

    // 结果计数
    this.resultLabel = document.createElement('span');
    this.resultLabel.className = 'vs-search-results';
    this.resultLabel.textContent = '无结果';
    this.container.appendChild(this.resultLabel);

    // 导航按钮组
    const navGroup = document.createElement('div');
    navGroup.className = 'vs-search-nav';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'vs-search-nav-btn prev';
    prevBtn.title = '上一个 (Shift+Enter)';
    prevBtn.innerHTML = '↑';
    prevBtn.addEventListener('click', () => this.navigate('prev'));
    navGroup.appendChild(prevBtn);

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'vs-search-nav-btn next';
    nextBtn.title = '下一个 (Enter)';
    nextBtn.innerHTML = '↓';
    nextBtn.addEventListener('click', () => this.navigate('next'));
    navGroup.appendChild(nextBtn);

    this.container.appendChild(navGroup);

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'vs-search-close';
    closeBtn.title = '关闭 (Esc)';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', () => this.close());
    this.container.appendChild(closeBtn);

    // 绑定输入事件
    this.input.addEventListener('input', () => this.handleInput());
    this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // 添加到页面
    document.body.appendChild(this.container);
  }

  /**
   * 处理输入事件
   */
  private handleInput(): void {
    if (this.onSearch && this.input) {
      this.onSearch(this.input.value, this.options);
    }
  }

  /**
   * 处理键盘事件
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.navigate(event.shiftKey ? 'prev' : 'next');
    }
  }

  /**
   * 切换搜索选项
   */
  private toggleOption(key: keyof SearchOptions): void {
    this.options[key] = !this.options[key];
    this.updateOptionButtons();

    if (this.onOptionChange) {
      this.onOptionChange(this.options);
    }

    // 重新搜索
    if (this.onSearch && this.input) {
      this.onSearch(this.input.value, this.options);
    }
  }

  /**
   * 更新选项按钮状态
   */
  private updateOptionButtons(): void {
    this.optionButtons.forEach((btn, key) => {
      const isActive = this.options[key as keyof SearchOptions];
      btn.classList.toggle('active', isActive);
    });
  }

  /**
   * 导航到上一个/下一个匹配
   */
  private navigate(direction: 'next' | 'prev'): void {
    if (this.onNavigate) {
      this.onNavigate(direction);
    }
  }

  /**
   * 设置搜索回调
   */
  setOnSearch(callback: (query: string, options: SearchOptions) => void): void {
    this.onSearch = callback;
  }

  /**
   * 设置导航回调
   */
  setOnNavigate(callback: (direction: 'next' | 'prev') => void): void {
    this.onNavigate = callback;
  }

  /**
   * 设置关闭回调
   */
  setOnClose(callback: () => void): void {
    this.onClose = callback;
  }

  /**
   * 设置选项变更回调
   */
  setOnOptionChange(callback: (options: SearchOptions) => void): void {
    this.onOptionChange = callback;
  }

  /**
   * 打开搜索框
   */
  open(options: { preserveSelection?: boolean } = {}): void {
    if (!this.container || !this.input) return;

    this.container.style.display = 'flex';
    this.isOpenState = true;

    // 获取选中的文本作为默认搜索词
    if (options.preserveSelection) {
      const selection = window.getSelection()?.toString() || '';
      if (selection) {
        this.input.value = selection;
      }
    }

    // 聚焦输入框并选中文本
    this.input.focus();
    this.input.select();

    // 触发搜索
    this.handleInput();
  }

  /**
   * 关闭搜索框
   */
  close(): void {
    if (!this.container) return;

    this.container.style.display = 'none';
    this.isOpenState = false;

    if (this.onClose) {
      this.onClose();
    }
  }

  /**
   * 是否已打开
   */
  isOpen(): boolean {
    return this.isOpenState;
  }

  /**
   * 更新结果显示
   */
  updateResult(result: SearchResult): void {
    if (!this.resultLabel) return;

    if (result.total === 0) {
      this.resultLabel.textContent = '无结果';
      this.resultLabel.classList.add('no-results');
    } else {
      this.resultLabel.textContent = `${result.currentIndex + 1}/${result.total}`;
      this.resultLabel.classList.remove('no-results');
    }
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.input = null;
    this.resultLabel = null;
    this.optionButtons.clear();
  }
}

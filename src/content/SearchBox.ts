import type { SearchContext, SearchOptions, SearchResult } from '../types/index.js';
import {
  POSITION_STORAGE_KEY,
  DEFAULT_POSITION,
  DEFAULT_SEARCH_OPTIONS,
  i18n,
  isMac,
  SEARCH_BOX_CLASS,
  SEARCH_BOX_SELECTOR,
  getKeySymbol,
  getOptionKeyHint,
  DEBOUNCE_DELAY
} from '../constants.js';
import { getSelectionPosition } from '../utils/Selection.js';

/**
 * 搜索框组件
 */
export class SearchBox {
  private container: HTMLElement | null = null;
  private input: HTMLInputElement | null = null;
  private resultLabel: HTMLElement | null = null;
  private dragHandle: HTMLElement | null = null;
  private optionButtons: Map<string, HTMLButtonElement> = new Map();
  private isOpenState = false;
  private debounceTimer: number | null = null;
  private abortController: AbortController | null = null;
  private isComposing = false; // 输入法组合状态

  // 拖动状态
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private containerStartX = 0;
  private containerStartY = 0;

  private options: SearchOptions = { ...DEFAULT_SEARCH_OPTIONS };

  // 回调函数
  private onSearch: ((query: string, options: SearchOptions, context?: SearchContext) => void) | null = null;
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
    // 创建 AbortController 用于管理事件监听器
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // 主容器
    this.container = document.createElement('div');
    this.container.className = SEARCH_BOX_CLASS;
    this.container.style.display = 'none';

    // 拖动手柄
    this.dragHandle = document.createElement('div');
    this.dragHandle.className = 'vs-search-drag-handle';
    this.dragHandle.title = i18n.dragTitle;
    this.dragHandle.innerHTML = '⋮⋮';
    this.container.appendChild(this.dragHandle);

    // 输入框
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = i18n.placeholder;
    this.input.className = 'vs-search-input';
    this.container.appendChild(this.input);

    // 选项按钮组
    const optionsGroup = document.createElement('div');
    optionsGroup.className = 'vs-search-options';

    const optionConfigs = [
      { key: 'caseSensitive', title: `${i18n.caseSensitiveTitle} (${getOptionKeyHint('C')})`, text: 'Cc', className: '' },
      { key: 'wholeWord', title: `${i18n.wholeWordTitle} (${getOptionKeyHint('W')})`, text: 'W', className: 'whole-word' },
      { key: 'regex', title: `${i18n.regexTitle} (${getOptionKeyHint('R')})`, text: '.*', className: 'regex' }
    ];

    optionConfigs.forEach(config => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vs-search-option-btn' + (config.className ? ' ' + config.className : '');
      btn.dataset.option = config.key;
      btn.title = config.title;
      btn.textContent = config.text;
      btn.addEventListener('click', () => this.toggleOption(config.key as keyof SearchOptions), { signal });
      optionsGroup.appendChild(btn);
      this.optionButtons.set(config.key, btn);
    });

    this.container.appendChild(optionsGroup);

    // 结果计数
    this.resultLabel = document.createElement('span');
    this.resultLabel.className = 'vs-search-results';
    this.resultLabel.textContent = i18n.noResults;
    this.container.appendChild(this.resultLabel);

    // 导航按钮组
    const navGroup = document.createElement('div');
    navGroup.className = 'vs-search-nav';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'vs-search-nav-btn prev';
    prevBtn.title = `${i18n.prevTitle} (${getKeySymbol('shift')}${getKeySymbol('enter')})`;
    prevBtn.innerHTML = '↑';
    prevBtn.addEventListener('click', () => this.navigate('prev'), { signal });
    navGroup.appendChild(prevBtn);

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'vs-search-nav-btn next';
    nextBtn.title = `${i18n.nextTitle} (${getKeySymbol('enter')})`;
    nextBtn.innerHTML = '↓';
    nextBtn.addEventListener('click', () => this.navigate('next'), { signal });
    navGroup.appendChild(nextBtn);

    this.container.appendChild(navGroup);

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'vs-search-close';
    closeBtn.title = `${i18n.closeTitle} (${getKeySymbol('esc')})`;
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', () => this.close(), { signal });
    this.container.appendChild(closeBtn);

    // 绑定输入事件
    this.input.addEventListener('input', () => this.handleInput(), { signal });
    this.input.addEventListener('keydown', (e) => this.handleKeyDown(e), { signal });

    // 绑定输入法组合事件，避免在输入法组合过程中搜索
    this.input.addEventListener('compositionstart', () => { this.isComposing = true; }, { signal });
    this.input.addEventListener('compositionend', () => { this.isComposing = false; this.handleInput(); }, { signal });

    // 绑定拖动事件
    this.dragHandle.addEventListener('mousedown', (e) => this.handleDragStart(e), { signal });
    document.addEventListener('mousemove', (e) => this.handleDragMove(e), { signal });
    document.addEventListener('mouseup', () => this.handleDragEnd(), { signal });

    // 添加到页面
    document.body.appendChild(this.container);

    // 初始化位置
    this.initPosition();
  }

  /**
   * 初始化位置（从 localStorage 读取或使用默认位置）
   */
  private initPosition(): void {
    if (!this.container) return;

    const savedPosition = this.loadPosition();
    if (savedPosition) {
      this.container.style.left = `${savedPosition.left}px`;
      this.container.style.top = `${savedPosition.top}px`;
      this.container.style.right = 'auto';
    } else {
      // 使用默认位置（右上角）
      this.container.style.right = `${DEFAULT_POSITION.right}px`;
      this.container.style.top = `${DEFAULT_POSITION.top}px`;
      this.container.style.left = 'auto';
    }
  }

  /**
   * 从 sessionStorage 加载位置（关闭标签页后清除）
   */
  private loadPosition(): { left: number; top: number } | null {
    try {
      const saved = sessionStorage.getItem(POSITION_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // sessionStorage 不可用或数据损坏
    }
    return null;
  }

  /**
   * 保存位置到 sessionStorage（关闭标签页后清除）
   */
  private savePosition(): void {
    if (!this.container) return;

    const left = parseInt(this.container.style.left || '0', 10);
    const top = parseInt(this.container.style.top || '0', 10);

    try {
      sessionStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify({ left, top }));
    } catch {
      // sessionStorage 不可用
    }
  }

  /**
   * 拖动开始
   */
  private handleDragStart(event: MouseEvent): void {
    if (!this.container) return;

    event.preventDefault();
    this.isDragging = true;

    // 记录起始位置
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    // 获取容器当前位置
    const rect = this.container.getBoundingClientRect();
    this.containerStartX = rect.left;
    this.containerStartY = rect.top;

    // 切换到 left/top 定位（如果之前是 right 定位）
    if (this.container.style.left === 'auto' || !this.container.style.left) {
      this.container.style.left = `${rect.left}px`;
      this.container.style.top = `${rect.top}px`;
      this.container.style.right = 'auto';
    }

    // 添加拖动样式
    this.container.classList.add('dragging');
  }

  /**
   * 拖动移动
   */
  private handleDragMove(event: MouseEvent): void {
    if (!this.isDragging || !this.container) return;

    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;

    let newLeft = this.containerStartX + deltaX;
    let newTop = this.containerStartY + deltaY;

    // 边界限制：不超出视口
    const containerWidth = this.container.offsetWidth;
    const containerHeight = this.container.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    newLeft = Math.max(0, Math.min(newLeft, viewportWidth - containerWidth));
    newTop = Math.max(0, Math.min(newTop, viewportHeight - containerHeight));

    this.container.style.left = `${newLeft}px`;
    this.container.style.top = `${newTop}px`;
  }

  /**
   * 拖动结束
   */
  private handleDragEnd(): void {
    if (!this.isDragging) return;

    this.isDragging = false;

    if (this.container) {
      this.container.classList.remove('dragging');
    }

    // 保存位置
    this.savePosition();
  }

  /**
   * 清除防抖定时器
   */
  private clearDebounceTimer(): void {
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * 处理输入事件（带防抖）
   */
  private handleInput(context?: SearchContext): void {
    // 如果在输入法组合过程中，不执行搜索
    if (this.isComposing) {
      return;
    }

    // 清除之前的定时器
    this.clearDebounceTimer();

    // 设置新的定时器
    this.debounceTimer = window.setTimeout(() => {
      if (this.onSearch && this.input) {
        this.onSearch(this.input.value, this.options, context);
      }
      this.debounceTimer = null;
    }, DEBOUNCE_DELAY);
  }

  /**
   * 处理键盘事件
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // 导航快捷键
    if (event.key === 'Enter' && !event.altKey) {
      event.preventDefault();
      this.navigate(event.shiftKey ? 'prev' : 'next');
      return;
    }

    // 选项快捷键 (Mac: Cmd+Option, Windows: Alt)
    if ((isMac && event.metaKey && event.altKey) || (!isMac && event.altKey)) {
      const optionKey: keyof SearchOptions | null =
        event.code === 'KeyC' ? 'caseSensitive' :
        event.code === 'KeyW' ? 'wholeWord' :
        event.code === 'KeyR' ? 'regex' : null;

      if (optionKey) {
        event.preventDefault();
        this.toggleOption(optionKey);
      }
    }
  }

  /**
   * 切换搜索选项
   */
  private toggleOption(key: keyof SearchOptions): void {
    this.options[key] = !this.options[key];
    this.updateOptionButtons();

    // 将焦点返回输入框，确保 Enter 键执行导航而非触发按钮
    if (this.input) {
      this.input.focus();
    }

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
  setOnSearch(callback: (query: string, options: SearchOptions, context?: SearchContext) => void): void {
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

    const initialPosition = getSelectionPosition(SEARCH_BOX_SELECTOR);

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
    this.handleInput({ initialPosition });
  }

  /**
   * 关闭搜索框
   */
  close(): void {
    if (!this.container) return;

    // 清除待处理的防抖定时器
    this.clearDebounceTimer();

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
      this.resultLabel.textContent = i18n.noResults;
      this.resultLabel.classList.add('no-results');
    } else if (result.totalMatches && result.totalMatches > result.total) {
      // 超过最大高亮限制时显示提示
      this.resultLabel.textContent = `${result.currentIndex + 1}/${result.total}+ (${i18n.totalLabel}${result.totalMatches})`;
      this.resultLabel.classList.remove('no-results');
    } else {
      this.resultLabel.textContent = `${result.currentIndex + 1}/${result.total}`;
      this.resultLabel.classList.remove('no-results');
    }
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    // 终止所有事件监听器
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // 清除防抖定时器
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // 清理拖动状态
    this.isDragging = false;

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.input = null;
    this.resultLabel = null;
    this.dragHandle = null;
    this.optionButtons.clear();
  }
}

/**
 * 搜索选项配置
 */
export interface SearchOptions {
  /** 区分大小写 */
  caseSensitive: boolean;
  /** 全词匹配 */
  wholeWord: boolean;
  /** 使用正则表达式 */
  regex: boolean;
}

/**
 * 匹配结果范围
 */
export interface MatchRange {
  /** 起始位置 */
  start: number;
  /** 结束位置 */
  end: number;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  /** 可导航的匹配数（实际高亮数） */
  total: number;
  /** 当前索引 */
  currentIndex: number;
  /** 实际匹配总数（可能超过最大高亮限制） */
  totalMatches?: number;
}

/**
 * 页面中的坐标位置（视口坐标）
 */
export interface SearchPosition {
  x: number;
  y: number;
}

/**
 * 搜索请求上下文
 */
export interface SearchContext {
  /** 初始定位位置，用于从光标/选区附近的匹配项开始 */
  initialPosition?: SearchPosition;
}

/**
 * 搜索框状态
 */
export interface SearchBoxState {
  /** 是否打开 */
  isOpen: boolean;
  /** 搜索关键词 */
  query: string;
  /** 搜索选项 */
  options: SearchOptions;
  /** 搜索结果 */
  result: SearchResult;
}

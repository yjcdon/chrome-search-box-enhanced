import type { MatchRange, SearchOptions } from './types/index.js';

/**
 * 转义正则特殊字符，用于普通文本搜索。
 */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 根据搜索选项构建搜索正则。
 */
export function buildSearchPattern(
  query: string,
  options: SearchOptions,
  config: { global?: boolean } = {}
): RegExp {
  const source = options.regex ? query : escapeRegExp(query);
  const pattern = options.wholeWord ? `\\b${source}\\b` : source;
  const flags = `${config.global === false ? '' : 'g'}${options.caseSensitive ? '' : 'i'}`;
  return new RegExp(pattern, flags);
}

/**
 * 判断一段文本是否匹配当前搜索条件。
 */
export function textMatchesSearchQuery(
  text: string | null,
  query: string,
  options: SearchOptions
): boolean {
  if (!query || !text) {
    return false;
  }

  try {
    return buildSearchPattern(query, options, { global: false }).test(text);
  } catch {
    return false;
  }
}

/**
 * 在文本中查找所有匹配区间。
 */
export function findMatches(text: string, pattern: RegExp): MatchRange[] {
  const matches: MatchRange[] = [];

  pattern.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length
    });

    if (match[0].length === 0) {
      pattern.lastIndex++;
    }
  }

  return matches;
}

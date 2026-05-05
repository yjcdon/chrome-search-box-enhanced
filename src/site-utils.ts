const REGEX_SPECIAL_CHARS = /[\^$+|()[\]\\{}]/;

function isRegexPattern(value: string): boolean {
  return value?.includes('*') || REGEX_SPECIAL_CHARS.test(value);
}

function wildcardToRegex(pattern: string): string {
  return pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
}

function parseHostname(input: string): string | null {
  try {
    const url = new URL(input.includes('://') ? input : `https://${input}`);
    return (url.protocol === 'http:' || url.protocol === 'https:') ? url.hostname : null;
  } catch {
    return null;
  }
}

/**
 * 规范化网站输入：
 * - 正则/通配符：保持原样
 * - 普通域名/URL：解析为 hostname
 */
export function normalizeSiteInput(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  if (isRegexPattern(trimmed)) return trimmed;

  return parseHostname(trimmed);
}

export function normalizeSiteList(sites: string[]): string[] {
  return Array.from(new Set(
    sites.map(normalizeSiteInput).filter(Boolean) as string[]
  ));
}

/**
 * 将存储值转换为匹配模式：
 * - 通配符：转换为正则（*.zsxq.com -> .*\.zsxq\.com）
 * - 正则/普通域名：保持不变
 */
function toMatchPattern(storedValue: string): string {
  if (storedValue.includes('*') && !REGEX_SPECIAL_CHARS.test(storedValue)) {
    return wildcardToRegex(storedValue);
  }
  return storedValue;
}

export function isSiteDisabled(hostname: string, disabledSites: string[]): boolean {
  const normalized = normalizeSiteInput(hostname);
  if (!normalized) return false;

  if (disabledSites.includes(normalized)) return true;

  return disabledSites
    .filter(isRegexPattern)
    .map(toMatchPattern)
    .some(pattern => {
      try { return new RegExp(pattern, 'i').test(normalized); }
      catch { return false; }
    });
}

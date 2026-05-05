const STORAGE_KEY = 'disabledSites';

// 正则特殊字符（不含 * 和 .，它们有特殊处理）
const REGEX_SPECIAL_CHARS = /[\^$+|()[\]\\{}]/;

/**
 * 规范化输入：
 * - 包含 *：通配符语法，转换为正则（* 变 .*，. 变 \.）
 * - 包含其他正则特殊字符：直接作为正则规则
 * - 普通域名：解析为 hostname
 */
export function normalizeSiteInput(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  // 包含 *：通配符语法，转换为正则
  if (trimmed.includes('*')) {
    // 如果还包含其他复杂正则特殊字符，直接返回让用户自己处理
    if (REGEX_SPECIAL_CHARS.test(trimmed)) {
      return trimmed;
    }
    // 简单通配符：* -> .*，. -> \.
    return trimmed.replace(/\./g, m => '\\' + m).replace(/\*/g, '.*');
  }

  // 包含正则特殊字符：直接作为正则规则
  if (REGEX_SPECIAL_CHARS.test(trimmed)) {
    return trimmed;
  }

  // 普通域名：解析为 hostname
  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.hostname || null;
  } catch {
    return null;
  }
}

export async function getDisabledSites(): Promise<string[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const value = result[STORAGE_KEY];
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((site): site is string => typeof site === 'string')
        .map(normalizeSiteInput)
        .filter((site): site is string => !!site)
    )
  );
}

export async function setDisabledSites(sites: string[]): Promise<void> {
  const normalizedSites = Array.from(
    new Set(sites.map(normalizeSiteInput).filter((site): site is string => !!site))
  );
  await chrome.storage.local.set({ [STORAGE_KEY]: normalizedSites });
}

export async function addDisabledSite(site: string): Promise<void> {
  const normalizedSite = normalizeSiteInput(site);
  if (!normalizedSite) {
    throw new Error('Invalid site');
  }

  const sites = await getDisabledSites();
  if (!sites.includes(normalizedSite)) {
    await setDisabledSites([normalizedSite, ...sites]);
  }
}

export async function removeDisabledSite(site: string): Promise<void> {
  const normalizedSite = normalizeSiteInput(site);
  if (!normalizedSite) {
    return;
  }

  const sites = await getDisabledSites();
  await setDisabledSites(sites.filter(item => item !== normalizedSite));
}

export function isSiteDisabled(hostname: string, disabledSites: string[]): boolean {
  const normalizedHostname = normalizeSiteInput(hostname);
  if (!normalizedHostname) {
    return false;
  }

  // disabledSites 已经是规范化后的数据，直接使用
  const siteSet = new Set(disabledSites);

  // 精确匹配
  if (siteSet.has(normalizedHostname)) {
    return true;
  }

  // 正则匹配
  for (const site of siteSet) {
    try {
      if (new RegExp(site, 'i').test(normalizedHostname)) {
        return true;
      }
    } catch {
      // 无效正则，跳过
    }
  }

  return false;
}

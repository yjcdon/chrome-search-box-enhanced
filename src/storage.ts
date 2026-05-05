import { DISABLED_SITES_STORAGE_KEY } from './constants.js';

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
 * 规范化存储值：
 * - 正则/通配符：保持原样存储（显示友好）
 * - 普通域名：解析为 hostname
 */
export function normalizeSiteInput(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  // 正则/通配符：保持原样
  if (isRegexPattern(trimmed)) return trimmed;

  // 普通域名：解析为 hostname
  return parseHostname(trimmed);
}

/**
 * 将存储值转换为匹配模式：
 * - 通配符：转换为正则（*.zsxq.com → .*\.zsxq\.com）
 * - 正则/普通域名：保持不变
 */
function toMatchPattern(storedValue: string): string {
  if (storedValue.includes('*') && !REGEX_SPECIAL_CHARS.test(storedValue)) {
    return wildcardToRegex(storedValue);
  }
  return storedValue;
}

export async function getDisabledSites(): Promise<string[]> {
  const { [DISABLED_SITES_STORAGE_KEY]: value } = await chrome.storage.local.get(DISABLED_SITES_STORAGE_KEY);
  if (!Array.isArray(value)) return [];

  return Array.from(new Set(
    value.filter((s): s is string => typeof s === 'string')
         .map(normalizeSiteInput)
         .filter(Boolean) as string[]
  ));
}

export async function setDisabledSites(sites: string[]): Promise<void> {
  const normalized = Array.from(new Set(
    sites.map(normalizeSiteInput).filter(Boolean) as string[]
  ));
  await chrome.storage.local.set({ [DISABLED_SITES_STORAGE_KEY]: normalized });
}

export async function addDisabledSite(site: string): Promise<void> {
  const normalized = normalizeSiteInput(site);
  if (!normalized) throw new Error('Invalid site');

  const sites = await getDisabledSites();
  if (!sites.includes(normalized)) {
    await setDisabledSites([normalized, ...sites]);
  }
}

export async function removeDisabledSite(site: string): Promise<void> {
  const normalized = normalizeSiteInput(site);
  if (!normalized) return;

  const sites = await getDisabledSites();
  await setDisabledSites(sites.filter(s => s !== normalized));
}

export function isSiteDisabled(hostname: string, disabledSites: string[]): boolean {
  const normalized = normalizeSiteInput(hostname);
  if (!normalized) return false;

  // 精确匹配
  if (disabledSites.includes(normalized)) return true;

  // 正则匹配（转换通配符后再匹配）
  return disabledSites
    .filter(isRegexPattern)
    .map(toMatchPattern)
    .some(pattern => {
      try { return new RegExp(pattern, 'i').test(normalized); }
      catch { return false; }
    });
}
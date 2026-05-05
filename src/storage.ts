const STORAGE_KEY = 'disabledSites';

const REGEX_SPECIAL_CHARS = /[\^$+|()[\]\\{}]/;

function isRegexPattern(value: string): boolean {
  return value.includes('*') || REGEX_SPECIAL_CHARS.test(value);
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

export function normalizeSiteInput(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  if (trimmed.includes('*')) {
    return REGEX_SPECIAL_CHARS.test(trimmed) ? trimmed : wildcardToRegex(trimmed);
  }

  if (REGEX_SPECIAL_CHARS.test(trimmed)) return trimmed;

  return parseHostname(trimmed);
}

export async function getDisabledSites(): Promise<string[]> {
  const { [STORAGE_KEY]: value } = await chrome.storage.local.get(STORAGE_KEY);
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
  await chrome.storage.local.set({ [STORAGE_KEY]: normalized });
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

  // 正则匹配（只对正则规则）
  return disabledSites
    .filter(isRegexPattern)
    .some(pattern => {
      try { return new RegExp(pattern, 'i').test(normalized); }
      catch { return false; }
    });
}
const STORAGE_KEY = 'disabledSites';

export function normalizeSiteInput(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

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
  return Array.isArray(value) ? value : [];
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
  return !!normalizedHostname && disabledSites.includes(normalizedHostname);
}
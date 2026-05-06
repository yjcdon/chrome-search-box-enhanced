import { DISABLED_SITES_STORAGE_KEY } from '../constants.js';
import { normalizeSiteInput, normalizeSiteList } from './Site.js';

export async function getDisabledSites(): Promise<string[]> {
  const { [DISABLED_SITES_STORAGE_KEY]: value } = await chrome.storage.local.get(DISABLED_SITES_STORAGE_KEY);
  if (!Array.isArray(value)) return [];

  return normalizeSiteList(value.filter((s): s is string => typeof s === 'string'));
}

export async function setDisabledSites(sites: string[]): Promise<void> {
  await chrome.storage.local.set({ [DISABLED_SITES_STORAGE_KEY]: normalizeSiteList(sites) });
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

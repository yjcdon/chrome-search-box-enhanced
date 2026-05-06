import { i18n } from '../constants.js';
import { isSiteDisabled, normalizeSiteInput } from '../utils/site.js';
import { addDisabledSite, getDisabledSites, removeDisabledSite } from '../utils/storage.js';

const input = document.getElementById('siteInput') as HTMLInputElement;
const addBtn = document.getElementById('addBtn') as HTMLButtonElement;
const cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement;
const errorMsg = document.getElementById('errorMsg') as HTMLParagraphElement;
const disabledList = document.getElementById('disabledList') as HTMLUListElement;
const popupTitle = document.getElementById('popupTitle') as HTMLHeadingElement;
const inputLabel = document.getElementById('inputLabel') as HTMLLabelElement;
const listTitle = document.getElementById('listTitle') as HTMLHeadingElement;

// 缓存禁用列表，避免频繁读取 storage
let cachedDisabledSites: string[] = [];

/**
 * 初始化 UI 文本（国际化）
 */
function initUIText(): void {
  document.title = i18n.popupTitle;
  popupTitle.textContent = i18n.popupTitle;
  inputLabel.textContent = i18n.popupInputLabel;
  input.placeholder = i18n.popupInputPlaceholder;
  addBtn.textContent = i18n.popupAddBtn;
  cancelBtn.textContent = i18n.popupCancelBtn;
  // 使用 innerHTML 构建 title + count 结构
  listTitle.innerHTML = `${i18n.popupListTitle} (<span id="siteCount">0</span>)`;
}

/**
 * 更新添加按钮状态：根据输入框域名是否已禁用，禁用或启用按钮
 */
function updateAddButtonState(): void {
  const normalizedSite = normalizeSiteInput(input.value);

  if (!normalizedSite) {
    addBtn.disabled = false;
    addBtn.textContent = i18n.popupAddBtn;
    return;
  }

  if (isSiteDisabled(normalizedSite, cachedDisabledSites)) {
    addBtn.disabled = true;
    addBtn.textContent = i18n.popupAlreadyDisabled;
  } else {
    addBtn.disabled = false;
    addBtn.textContent = i18n.popupAddBtn;
  }
}

function showError(message: string): void {
  errorMsg.textContent = message;
}

function clearError(): void {
  errorMsg.textContent = '';
}

function renderEmptyState(): void {
  const item = document.createElement('li');
  item.className = 'empty-state';
  item.textContent = i18n.popupEmptyState;
  disabledList.replaceChildren(item);
}

function renderDisabledSite(site: string): HTMLLIElement {
  const item = document.createElement('li');

  const siteName = document.createElement('span');
  siteName.className = 'site-name';
  siteName.textContent = site;

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.type = 'button';
  deleteBtn.textContent = '×';
  deleteBtn.setAttribute('aria-label', `${i18n.popupDeleteAria} ${site}`);
  deleteBtn.addEventListener('click', async () => {
    await removeDisabledSite(site);
    await loadDisabledSites();
  });

  item.append(siteName, deleteBtn);
  return item;
}

async function loadDisabledSites(): Promise<void> {
  cachedDisabledSites = await getDisabledSites();
  const siteCount = listTitle.querySelector('#siteCount');
  if (siteCount) {
    siteCount.textContent = String(cachedDisabledSites.length);
  }

  // 根据输入框当前内容更新按钮状态
  updateAddButtonState();

  if (cachedDisabledSites.length === 0) {
    renderEmptyState();
    return;
  }

  disabledList.replaceChildren(...cachedDisabledSites.map(renderDisabledSite));
}

document.addEventListener('DOMContentLoaded', async () => {
  // 初始化 UI 文本
  initUIText();

  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentSite = tab?.url ? normalizeSiteInput(tab.url) : null;

  if (currentSite) {
    input.value = currentSite;
  } else {
    input.value = '';
    input.placeholder = i18n.popupInputPlaceholder;
  }

  await loadDisabledSites();

  // 确认禁用按钮
  addBtn.addEventListener('click', async () => {
    clearError();
    const site = normalizeSiteInput(input.value);
    if (!site) {
      showError(i18n.popupInvalidInput);
      return;
    }

    try {
      await addDisabledSite(site);
      input.value = '';
      await loadDisabledSites();
    } catch {
      showError(i18n.popupAddFailed);
    }
  });

  // 取消按钮
  cancelBtn.addEventListener('click', () => {
    window.close();
  });

  // 输入框变化时清除错误并更新按钮状态
  input.addEventListener('input', () => {
    clearError();
    updateAddButtonState();
  });
});
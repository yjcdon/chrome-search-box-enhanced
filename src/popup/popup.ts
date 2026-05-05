import { addDisabledSite, getDisabledSites, isSiteDisabled, normalizeSiteInput, removeDisabledSite } from '../storage.js';

const input = document.getElementById('siteInput') as HTMLInputElement;
const addBtn = document.getElementById('addBtn') as HTMLButtonElement;
const cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement;
const errorMsg = document.getElementById('errorMsg') as HTMLParagraphElement;
const disabledList = document.getElementById('disabledList') as HTMLUListElement;
const siteCount = document.getElementById('siteCount') as HTMLSpanElement;

// 缓存禁用列表，避免频繁读取 storage
let cachedDisabledSites: string[] = [];

/**
 * 更新添加按钮状态：根据输入框域名是否已禁用，禁用或启用按钮
 */
function updateAddButtonState(): void {
  const normalizedSite = normalizeSiteInput(input.value);

  if (!normalizedSite) {
    addBtn.disabled = false;
    addBtn.textContent = '添加禁用';
    return;
  }

  if (isSiteDisabled(normalizedSite, cachedDisabledSites)) {
    addBtn.disabled = true;
    addBtn.textContent = '该网站已禁用';
  } else {
    addBtn.disabled = false;
    addBtn.textContent = '添加禁用';
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
  item.textContent = '暂无禁用网站';
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
  deleteBtn.setAttribute('aria-label', `删除 ${site}`);
  deleteBtn.addEventListener('click', async () => {
    await removeDisabledSite(site);
    await loadDisabledSites();
  });

  item.append(siteName, deleteBtn);
  return item;
}

async function loadDisabledSites(): Promise<void> {
  cachedDisabledSites = await getDisabledSites();
  siteCount.textContent = String(cachedDisabledSites.length);

  // 根据输入框当前内容更新按钮状态
  updateAddButtonState();

  if (cachedDisabledSites.length === 0) {
    renderEmptyState();
    return;
  }

  disabledList.replaceChildren(...cachedDisabledSites.map(renderDisabledSite));
}

document.addEventListener('DOMContentLoaded', async () => {
  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentSite = tab?.url ? normalizeSiteInput(tab.url) : null;

  if (currentSite) {
    input.value = currentSite;
  } else {
    input.value = '';
    input.placeholder = '输入要禁用的域名';
  }

  await loadDisabledSites();

  // 确认禁用按钮
  addBtn.addEventListener('click', async () => {
    clearError();
    const site = normalizeSiteInput(input.value);
    if (!site) {
      showError('请输入有效的网站域名');
      return;
    }

    try {
      await addDisabledSite(site);
      input.value = '';
      await loadDisabledSites();
    } catch {
      showError('添加失败，请重试');
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

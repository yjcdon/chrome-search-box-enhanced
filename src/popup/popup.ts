import { addDisabledSite, getDisabledSites, normalizeSiteInput, removeDisabledSite } from '../storage.js';

const input = document.getElementById('siteInput') as HTMLInputElement;
const addBtn = document.getElementById('addBtn') as HTMLButtonElement;
const cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement;
const errorMsg = document.getElementById('errorMsg') as HTMLParagraphElement;
const disabledList = document.getElementById('disabledList') as HTMLUListElement;
const siteCount = document.getElementById('siteCount') as HTMLSpanElement;

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
  const sites = await getDisabledSites();
  siteCount.textContent = String(sites.length);

  if (sites.length === 0) {
    renderEmptyState();
    return;
  }

  disabledList.replaceChildren(...sites.map(renderDisabledSite));
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
      await loadDisabledSites();
      input.value = site;
    } catch {
      showError('添加失败，请重试');
    }
  });

  // 取消按钮
  cancelBtn.addEventListener('click', () => {
    window.close();
  });

  // 输入框变化时清除错误
  input.addEventListener('input', () => {
    clearError();
  });
});

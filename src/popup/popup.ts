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

async function loadDisabledSites(): Promise<void> {
  const sites = await getDisabledSites();
  siteCount.textContent = String(sites.length);

  if (sites.length === 0) {
    disabledList.innerHTML = '<li class="empty-state">暂无禁用网站</li>';
    return;
  }

  disabledList.innerHTML = sites.map(site => `
    <li>
      <span class="site-name">${site}</span>
      <button class="delete-btn" data-site="${site}">×</button>
    </li>
  `).join('');

  // 绑定删除按钮事件
  disabledList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const site = target.dataset.site;
      if (site) {
        await removeDisabledSite(site);
        await loadDisabledSites();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentSite = tab?.url ? normalizeSiteInput(tab.url) : null;

  if (currentSite) {
    input.value = currentSite;
  } else {
    input.value = '';
    input.placeholder = '当前页面不可添加';
    input.disabled = true;
    addBtn.disabled = true;
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
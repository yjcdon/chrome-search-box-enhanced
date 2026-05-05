# Chrome Search Box Enhanced

[English](./README_EN.md) | 中文

---

Chrome 原生查找的增强版：支持高亮所有匹配、实时计数、从光标位置搜索等高级功能。

### 功能特性

- 🔍 **高亮所有匹配** — 同时高亮页面上所有匹配项，直观浏览全局结果
- 🔢 **实时计数** — 显示当前第几个/总共几个，快速了解匹配分布
- 📍 **从光标位置搜索** — 打开搜索框后自动定位到离光标最近的匹配项
- 🖱️ **点击高亮导航** — 点击任意高亮项可直接跳转到该匹配位置
- ⚙️ **多种搜索模式** — 支持区分大小写、全词匹配、正则表达式
- 🌐 **跨节点/Shadow DOM 匹配** — 支持被语法高亮拆分的文本及 ShadowRoot 内容

### 快捷键

| 功能 | macOS | Windows |
|------|-------|---------|
| 打开搜索框 | `⌘F` | `Ctrl+F` |
| 下一个匹配 | `Enter` | `Enter` |
| 上一个匹配 | `⇧ Enter` | `Shift+Enter` |
| 区分大小写 | `⌥⌘C` | `Alt+C` |
| 全词匹配 | `⌥⌘W` | `Alt+W` |
| 正则表达式 | `⌥⌘R` | `Alt+R` |
| 关闭搜索框 | `Esc` | `Esc` |

### 安装

#### 从 Release 下载（推荐）

1. 从 [Release](https://github.com/yjcdon/chrome-search-box-enhanced/releases) 下载插件压缩包
2. Chrome 地址栏输入 `chrome://extensions/`
3. 打开「开发者模式」
4. 将压缩包拖入页面即可

#### 从源码构建

```bash
git clone https://github.com/yjcdon/chrome-search-box-enhanced.git
pnpm install
pnpm build
```

然后 Chrome 扩展页面 → 加载已解压的扩展程序 → 选择 `dist` 目录

### 开发

```bash
pnpm dev    # 开发模式
pnpm build  # 构建
```

### 许可证

[MIT License](LICENSE)

### 致谢

- [Claude Code](https://github.com/anthropics/claude-code)
- [Codex](https://github.com/openai/codex)
- [Browser Harness](https://github.com/browser-use/browser-harness)
# Chrome Search Box Enhanced

[English](#english) | [中文](#中文)

---

## 中文

Chrome 原生查找的增强版：支持高亮所有匹配、实时计数、从光标位置搜索等高级功能。

### 功能特性

- 🔍 **高亮所有匹配** — 同时高亮页面上所有匹配项，直观浏览全局结果
- 🔢 **实时计数** — 显示当前第几个/总共几个，快速了解匹配分布
- 📍 **从光标位置搜索** — 打开搜索框后自动定位到离光标最近的匹配项
- 🖱️ **点击高亮导航** — 点击任意高亮项可直接跳转到该匹配位置
- ⚙️ **多种搜索模式** — 支持区分大小写、全词匹配、正则表达式
- 🌐 **跨节点匹配** — 支持匹配被语法高亮拆分的文本（如代码块）
- 🎯 **Shadow DOM 支持** — 可搜索 ShadowRoot 内的文本内容
- 🌓 **主题自适应** — 自动适配浏览器深色/浅色模式
- 🖱️ **可拖动位置** — 搜索框位置可自由拖动，自动记忆
- ⌨️ **快捷键支持** — 键盘操作流畅高效

### 快捷键

| 功能 | macOS | Windows |
|------|-------|---------|
| 打开搜索框 | `⌘F` | `Ctrl+F` |
| 下一个匹配 | `Enter` | `Enter` |
| 上一个匹配 | `⇧ Enter` | `Shift+Enter` |
| 区分大小写 | `⌥ C` | `Alt+C` |
| 全词匹配 | `⌥ W` | `Alt+W` |
| 正则表达式 | `⌥ R` | `Alt+R` |
| 关闭搜索框 | `Esc` | `Esc` |

### 安装方法

#### 方式一：加载已解压的扩展程序（开发模式）

1. 克隆或下载本项目
   ```bash
   git clone https://github.com/yjcdon/chrome-search-box-enhanced.git
   ```
2. 安装依赖并构建
   ```bash
   pnpm install
   pnpm build
   ```
3. 打开 Chrome，进入扩展管理页面
   - 地址栏输入 `chrome://extensions/`
   - 或菜单 → 更多工具 → 扩展程序
4. 开启右上角「开发者模式」
5. 点击「加载已解压的扩展程序」，选择项目的 `dist` 目录
6. 安装完成，刷新页面即可使用

#### 方式二：直接加载源码（无需构建）

如果想快速体验，可直接加载源码目录：

1. 下载项目源码
2. Chrome 扩展管理页面 → 开启开发者模式 → 加载已解压的扩展程序
3. 选择项目根目录（包含 `manifest.json` 的目录）
4. 注意：此方式需要手动提供 `content.js` 和 `content.css`，建议使用构建方式

### 开发

```bash
# 安装依赖
pnpm install

# 开发模式（监听文件变化）
pnpm dev

# 构建
pnpm build
```

构建产物位于 `dist/` 目录，包含：
- `manifest.json` — 扩展配置
- `content.js` — 内容脚本
- `content.css` — 样式文件
- `icons/` — 扩展图标

### 许可证

[MIT License](LICENSE)

---

## English

An enhanced version of Chrome's native find feature: highlights all matches, shows real-time count, searches from cursor position, and more.

### Features

- 🔍 **Highlight All Matches** — Highlight all matches simultaneously for a global view
- 🔢 **Real-time Count** — Shows current/total position, quick overview of match distribution
- 📍 **Search from Cursor** — Automatically locate the nearest match to cursor position
- 🖱️ **Click to Navigate** — Click any highlight to jump directly to that match
- ⚙️ **Multiple Search Modes** — Case sensitive, whole word, regular expression support
- 🌐 **Cross-node Matching** — Match text split by syntax highlighting (e.g., code blocks)
- 🎯 **Shadow DOM Support** — Search within ShadowRoot content
- 🌓 **Theme Adaptive** — Automatically adapts to browser dark/light mode
- 🖱️ **Draggable Position** — Freely drag the search box, auto-remember position
- ⌨️ **Keyboard Shortcuts** — Smooth and efficient keyboard operations

### Keyboard Shortcuts

| Function | macOS | Windows |
|----------|-------|---------|
| Open search box | `⌘F` | `Ctrl+F` |
| Next match | `Enter` | `Enter` |
| Previous match | `⇧ Enter` | `Shift+Enter` |
| Case sensitive | `⌥ C` | `Alt+C` |
| Whole word | `⌥ W` | `Alt+W` |
| Regular expression | `⌥ R` | `Alt+R` |
| Close search box | `Esc` | `Esc` |

### Installation

#### Method 1: Load Unpacked Extension (Development Mode)

1. Clone or download this project
   ```bash
   git clone https://github.com/yjcdon/chrome-search-box-enhanced.git
   ```
2. Install dependencies and build
   ```bash
   pnpm install
   pnpm build
   ```
3. Open Chrome and go to extensions page
   - Enter `chrome://extensions/` in address bar
   - Or Menu → More tools → Extensions
4. Enable "Developer mode" (top right toggle)
5. Click "Load unpacked" and select the `dist` directory
6. Installation complete, refresh pages to use

#### Method 2: Load Source Directly (No Build)

For quick testing, you can load the source directory directly:

1. Download project source
2. Chrome extensions page → Enable developer mode → Load unpacked
3. Select project root directory (containing `manifest.json`)
4. Note: This requires manual `content.js` and `content.css`, build method recommended

### Development

```bash
# Install dependencies
pnpm install

# Development mode (watch file changes)
pnpm dev

# Build
pnpm build
```

Build output in `dist/` directory includes:
- `manifest.json` — Extension config
- `content.js` — Content script
- `content.css` — Styles
- `icons/` — Extension icons

### License

[MIT License](LICENSE)
# Chrome Search Box Enhanced

English | [中文](./README_CN.md)

---

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
| Case sensitive | `⌥⌘C` | `Alt+C` |
| Whole word | `⌥⌘W` | `Alt+W` |
| Regular expression | `⌥⌘R` | `Alt+R` |
| Close search box | `Esc` | `Esc` |

### Installation

#### Method 1: Download from Release (Recommended)

1. Download the packaged extension zip from [Release](https://github.com/yjcdon/chrome-search-box-enhanced/releases) page
2. Open Chrome and enter `chrome://extensions/` in address bar
3. Enable "Developer mode" (top right toggle)
4. Drag the downloaded extension zip file into the `chrome://extensions/` page

#### Method 2: Load Unpacked Extension (Development Mode)

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

#### Method 3: Load Source Directly (No Build)

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
# Chrome Search Box Enhanced

English | [中文](./README.md)

---

An enhanced version of Chrome's native find feature: highlights all matches, shows real-time count, searches from cursor position, and more.

### Features

- 🔍 **Highlight All Matches** — Highlight all matches simultaneously for a global view
- 🔢 **Real-time Count** — Shows current/total position, quick overview of match distribution
- 📍 **Search from Cursor** — Automatically locate the nearest match to cursor position
- 🖱️ **Click to Navigate** — Click any highlight to jump directly to that match
- ⚙️ **Multiple Search Modes** — Case sensitive, whole word, regular expression support
- 🌐 **Cross-node/Shadow DOM Matching** — Match text split by syntax highlighting and ShadowRoot content
- 🚫 **Disabled Sites** — Fall back to Chrome native find or site-provided find on selected sites

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

### Disabled Sites

Click the extension icon to open disabled site settings. The popup fills in the current tab hostname by default, and you can also enter another hostname manually.

On disabled sites, the extension does not intercept `⌘F` / `Ctrl+F`, so Chrome native find or the site's own find behavior continues to work. The disabled site list is stored locally with `chrome.storage.local`.

### Installation

#### Download from Release (Recommended)

1. Download extension zip from [Release](https://github.com/yjcdon/chrome-search-box-enhanced/releases)
2. Enter `chrome://extensions/` in Chrome address bar
3. Enable "Developer mode"
4. Drag the zip file into the page

#### Build from Source

```bash
git clone https://github.com/yjcdon/chrome-search-box-enhanced.git
pnpm install
pnpm build
```

Then Chrome extensions page → Load unpacked → Select `dist` directory

### Development

```bash
pnpm dev          # Watch content and popup builds
pnpm dev:content  # Watch content script build only
pnpm dev:popup    # Watch popup build only
pnpm build        # Build
```

### License

[MIT License](LICENSE)

### Acknowledgments

- [Claude Code](https://github.com/anthropics/claude-code)
- [Codex](https://github.com/openai/codex)
- [Browser Harness](https://github.com/browser-use/browser-harness)

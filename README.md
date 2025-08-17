# cReturn - Browser Extension

![cReturn Icon](assets/icon.png)

## Prevent Accidental Message Sending During Character Conversion

cReturn is a lightweight browser extension that prevents accidental message sending when typing languages that require character conversion or composition, such as:
- **Converting to kanji** (Japanese, Chinese)
- **Composing Hangul** (Korean)
- **Combining Indic scripts** (Hindi, Bengali, Tamil, etc.)
- **Combining Arabic scripts**

**The Problem:**
When using these input methods in AI chat services, pressing Enter to confirm character conversion often accidentally sends incomplete messages, since both text confirmation and message sending use the same Enter key.

**The Solution:**
- Use **Ctrl+Enter** (Windows/Linux) or **Command+Enter** (macOS) to send messages
- **Enter** key inserts line breaks and confirms character conversion
- Custom configuration support via GitHub

## Installation

### Chrome
1. Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/dpfkfjilfchkjcohjfmdnlmecgbpakfd)
2. Click "Add to Chrome"

### Firefox
*Coming soon*

## Supported AI Chat Services

- ChatGPT (chat.openai.com)
- Claude (claude.ai)
- Google Gemini (gemini.google.com)
- Perplexity AI (www.perplexity.ai)
- Microsoft Copilot (copilot.microsoft.com)
- GitHub Copilot (github.com)
- Poe (poe.com)
- Mistral AI (chat.mistral.ai)
- DeepSeek (chat.deepseek.com)
- NotebookLM (notebooklm.google.com)
- Phind (www.phind.com)
- Grok (grok.com)
- And many others!

## Usage

- **Extension icon**: Colored when active, gray when inactive
- **Click icon**: Toggle on/off for current site or access options
- **Typing**: Enter for line breaks/character conversion, Ctrl+Enter to send

## Technical Implementation

### Architecture

cReturn is built with the [WXT Framework](https://wxt.dev/) for modern Chrome extension development using:
- **Manifest V3** for enhanced security and performance
- **TypeScript** for type safety and better development experience
- **Svelte** for lightweight, reactive UI components
- **WXT Browser API** for cross-browser compatibility

### Core Components

#### Background Script (`background.ts`)
- Extension lifecycle management (install/update)
- Icon state management using `webNavigation` API
- Configuration loading and caching

#### Content Script (`content.ts`)
- IME-aware keyboard event handling
- Domain-specific selector matching
- Real-time input field detection

#### Icon Manager (`lib/icons.ts`)
- Dynamic icon updates based on site support
- Tab-specific state tracking

#### Configuration System (`lib/config.ts`)
- Local and remote configuration loading
- GitHub-hosted config support
- Automatic migration and updates

### Key Features

#### IME-Aware Input Handling
```typescript
// IME conversion protection
if (event.isComposing) {
  event.stopImmediatePropagation();
  return;
}
```

#### Dynamic Site Detection
```typescript
// Wildcard domain matching
if (domain.startsWith('*.')) {
  const baseDomain = domain.substring(2);
  if (currentDomain.endsWith('.' + baseDomain) || currentDomain === baseDomain) {
    return service;
  }
}
```

#### Reliable Icon Updates
```typescript
// Using webNavigation for accurate page change detection
browser.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return; // Main frame only
  const domain = new URL(details.url).hostname;
  if (domain) {
    IconManager.updateIcon(domain, details.tabId);
  }
});
```

## Custom Configuration

Add support for additional sites by creating a JSON configuration file:

1. Create a configuration file (format below)
2. Host it on GitHub (raw.githubusercontent.com URL)
3. Enter the URL in extension options

### Configuration Format

```json
{
  "updated": "2025-05-07",
  "license": "MIT ©︎ 2025 cojiso",
  "contact": "form / email / sns id",
  "description": "Optional",
  "services": {
    "chat.openai.com": {
      "name": "ChatGPT",
      "selectors": [
        "#prompt-textarea"
      ]
    },
    "claude.ai": {
      "name": "Claude",
      "selectors": [
        "div[contenteditable='true']",
        "div.ProseMirror" 
      ]
    },
    "*.example.com": {
      "name": "Example Service",
      "selectors": [
        "textarea.chat-input"
      ]
    }
  }
}
```

The `selectors` field defines CSS selectors for text input areas on each domain. Wildcard domains (starting with `*.`) are supported for subdomain matching.

## Development

### Setup

1. Clone the repository
```bash
git clone https://github.com/cojiso/creturn.git
cd creturn
```

2. Install dependencies
```bash
pnpm install
```

3. Start development server
```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Project Structure

```
├── entrypoints/
│   ├── background.ts      # Service worker
│   ├── content.ts         # Content script
│   ├── popup/            # Extension popup
│   └── options/          # Options page
├── lib/
│   ├── config.ts         # Configuration management
│   ├── icons.ts          # Icon state management
│   └── utils.ts          # Utility functions
├── assets/               # Static assets
└── wxt.config.ts         # WXT configuration
```

### Release Strategy

This project uses simplified Trunk-Based Development for streamlined releases and configuration updates.

#### Branch Structure
- `main` - Primary development branch
- `develop` - Development integration branch
- `feature/name` - Optional short-lived feature branches

#### Update Workflows

##### Configuration Updates (Weekly)
Fast deployment without store approval:
1. Update `creturn-config.json` in `main`
2. Tag with `config-vYYYYMMDD`
3. Update hosted config file on GitHub

##### Store Releases (Quarterly)
1. Update version in `manifest.json`
2. Commit with "Release vX.Y.Z"
3. Tag with `vX.Y.Z`
4. Package and submit to Chrome Web Store

##### How to use tag
1. git commit
2. git tag TAG_NAME
3. git push origin main --tags

## Privacy

cReturn:
- Stores settings locally only
- No data collection or transmission
- No analytics or tracking
- Minimal webpage access for input field functionality

## Troubleshooting

If cReturn doesn't work:
1. Refresh the page
2. Check if enabled (click icon)
3. Verify supported input area
4. For custom configs, check JSON format
5. Check browser console for errors

### Common Issues

#### Extension Not Working on Specific Sites
- Verify the site is in your configuration
- Check if the CSS selectors match the actual input elements
- Try refreshing the page after enabling

#### IME Conversion Issues
- Ensure your input method is properly configured
- Test with different text areas to isolate the issue
- Check if other extensions conflict with keyboard handling

## Browser Compatibility

- **Chrome**: Fully supported (Manifest V3)
- **Edge**: Supported via Chrome Web Store
- **Firefox**: Planned support
- **Safari**: Under consideration

## Store Descriptions

**Short Description (max 132　words):**
```
Enter for line breaks, Ctrl+Enter to send on any site. Custom configs supported. Prevents accidental sends during conversion.
```

**Full Description:**
```
▍Features:
- 12+ built-in sites + unlimited custom site additions
- Load custom configuration files created on GitHub
- Reliable prevention of accidental sends even in chat editing areas

▍Core functionality:
- Enter key = line breaks + character conversion confirmation
- Ctrl+Enter (macOS: Command+Enter) = send message
- One-click on/off toggle

▍Supported sites:
- ChatGPT, Claude, Gemini, Perplexity, Copilot, and more
- Full site list (config file): 
  https://github.com/cojiso/creturn/blob/main/public/creturn-config.json

▍Custom configuration:
1. Create JSON site configuration file
2. Upload to GitHub
3. Register file URL in extension settings

▍Issues or feature requests: GitHub repository
https://github.com/cojiso/creturn
```

**短文説明:**
```
どんなサイトでも、Enterで改行、Ctrl+Enterで送信。GitHubでのカスタム設定に対応。漢字変換時の誤送信を防ぐ拡張機能です。
```

**説明文：**
```
▍特徴：
- 標準12サイト + 好みのサイトを無制限に追加
- GitHubに作成したカスタム設定ファイルの読込オプション
- チャットの修正エリアの中でも、誤送信を確実に防止

▍基本機能：
- Enterキー = 改行・文字変換の確定  
- Ctrl+Enter (macOS: Command+Enter) = メッセージの送信
- ワンクリックでのオン/オフ切替

▍対応サイト：
- ChatGPT、Claude、Gemini、Perplexity、Copilot等
- 対応サイト一覧(設定ファイル): 
  https://github.com/cojiso/creturn/blob/main/public/creturn-config.json

▍カスタム設定の方法：
1. JSONファイルでサイト設定を作成
2. GitHubへのアップロード  
3. 設定画面にファイルのURLを登録

▍不具合やご要望は GitHubリポジトリまで。
https://github.com/cojiso/creturn
```

## Support

If you encounter issues or have suggestions:
- GitHub Issues: [Report issues here](https://github.com/cojiso/creturn/issues)

## License

cReturn is released under the MIT License.
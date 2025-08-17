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
Prevent accidental sending when pressing Enter for line breaks/kanji conversion. Use Ctrl+Enter to send. Custom configs available.
```

**Full Description:**
```
Use Ctrl+Enter to send messages in AI chat apps like ChatGPT and Claude. This prevents accidental sending when you type languages that need character conversion or composition, like:
- Converting to kanji (Japanese, Chinese)
- Composing Hangul (Korean)
- Combining Indic scripts (Hindi, Bengali, Tamil, etc.)
- Combining Arabic scripts

Key features:
- Press Enter = new line and finish character conversion/composition
- Press Ctrl+Enter (Windows/Linux) or Command+Enter (Mac) = send message
- Click the icon to turn on/off easily
- You can make your own config file on GitHub to add more websites.

Works on these sites:
- ChatGPT (chat.openai.com)
- Claude (claude.ai)
- Google Gemini (gemini.google.com)
- Perplexity AI
- Microsoft Copilot
- Many other AI chat sites. See: https://github.com/cojiso/creturn/blob/main/creturn-config.json

Questions or problems? Visit our GitHub page.
https://github.com/cojiso/creturn
```

**短文説明:**
```
チャットでのキー挙動を変更し、Ctrl+Enterで送信、Enterで改行、漢字変換をしようとして誤ってメッセージが送信されることを防ぎます。そして、GitHubのJSONファイルを読み込むことでカスタムのサイト設定を追加できます。
```

**説明文：**
```
ChatGPTやClaudeなどのAIチャットサービスでメッセージ送信を「Ctrl+Enter」に割り当て、文字変換・合成が必要な言語での誤送信を防ぎます。以下のような言語入力時に適しています：
- 漢字変換（日本語・中国語）
- ハングル合成（韓国語）
- インド系文字の結合（ヒンディー語・ベンガル語・タミル語等）
- アラビア系文字の結合

主な機能：
- Enterキーで改行・文字変換/合成確定
- Ctrl+Enter（Windows/Linux）またはCommand+Enter（macOS）でメッセージ送信
- 拡張機能アイコンクリックで簡単にオン/オフ切り替え
- GitHubでカスタム設定ファイルを作成・読み込みすることで、標準対応サイト以外も追加可能

対応サイト：
- ChatGPT (chat.openai.com)
- Claude (claude.ai)
- Google Gemini (gemini.google.com)
- Perplexity AI
- Microsoft Copilot
- その他多数のAIチャットサービス: https://github.com/cojiso/creturn/blob/main/creturn-config.json

不具合やご要望は GitHubリポジトリまで。
https://github.com/cojiso/creturn
```

## Support

If you encounter issues or have suggestions:
- GitHub Issues: [Report issues here](https://github.com/cojiso/creturn/issues)

## License

cReturn is released under the MIT License.
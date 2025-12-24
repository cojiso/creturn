# cReturn - Enter Key Swapper + Custom Site Configs (Browser Extension)

<img src="public/assets/icon.png" align="right" width="64" alt="cReturn Icon">

cReturn is a lightweight browser extension that swaps Enter key behavior: **Enter** for line breaks, **Ctrl+Enter** (Command+Enter on macOS) to send messages. You can create custom site configurations via GitHub.

**The Problem:**
When typing languages that require character conversion (Japanese kanji, Korean Hangul, Chinese characters, Indic scripts, Arabic scripts, etc.), you press Enter intending to confirm conversion, but it accidentally sends the incomplete message. This happens in various platforms: AI chats, video meetings, social media, and many others.

## Features

- **Enter** key for line breaks and character conversion confirmation
- **Ctrl+Enter** (Command+Enter on macOS) to send messages
- One-click on/off toggle via extension icon (colored when active, gray when inactive)
- 12+ built-in sites & unlimited custom site additions via GitHub

## Installation

### Chrome
1. Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/dpfkfjilfchkjcohjfmdnlmecgbpakfd)
2. Click "Add to Chrome"

### Firefox
*Coming soon*

## Supported Sites

- **AI Chat:**  
[ChatGPT](https://chatgpt.com), [Claude](https://claude.ai), [Gemini](https://gemini.google.com)
- **Original LLM AI Chat:**  
[DeepSeek](https://chat.deepseek.com), [Mistral AI](https://chat.mistral.ai), [Cohere Playground](https://dashboard.cohere.com)
- **Integrated LLM AI Chat:**  
[Microsoft Copilot](https://copilot.microsoft.com), [Grok](https://grok.com), [Felo](https://felo.ai), [Manus](https://manus.im), [Poe](https://poe.com)
- **Research AI Chat:**  
[Perplexity AI](https://www.perplexity.ai), [You.com](https://you.com), [Phind](https://www.phind.com)
- **Coding AI Chat:**  
[GitHub Copilot](https://github.com)
- **Design AI Chat:**  
[v0.app](https://v0.app), [Bolt](https://bolt.new)
- **Google Gemini Ecosystem:**  
[Gemini in Google Drive](https://drive.google.com), [NotebookLM](https://notebooklm.google.com)
- **Video Meeting Chat:**  
[Google Meet](https://meet.google.com), [Zoom](https://zoom.us)
- **SNS Chat:**  
[Discord](https://discord.com), [Google Chat](https://chat.google.com), [X (formerly Twitter)](https://x.com)

[View full configuration file here](https://github.com/cojiso/creturn/blob/main/public/creturn-config.jsonc)

## Custom Configuration

You can use cReturn on any sites by creating your own configuration file.

1. **Create a JSONC file** (see format below)
2. **Upload to GitHub** as a public repository or gist
3. **Copy the raw URL** (raw.githubusercontent.com/...)
4. **Paste the URL** in cReturn's extension options page

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
        "[contenteditable='true']",
        "textarea" 
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

### Setup & Build
```sh
# 1. Clone the repository
git clone https://github.com/cojiso/creturn.git
cd creturn

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev

# 4. Build
pnpm build

# 5. Create a ZIP file for Chrome Web Store
pnpm zip
```

### Architecture

cReturn is built with:
- **[WXT Framework](https://wxt.dev/)**: Modern browser extension framework
- **Svelte**: Lightweight reactive UI framework (Compiler)

### Project Structure

```
├── entrypoints/
│   ├── background.ts     # Service worker
│   ├── content.ts        # Content script
│   ├── popup/            # Extension popup UI
│   └── options/          # Options page UI
├── lib/
│   ├── config.ts         # Configuration management
│   ├── icons.ts          # Icon state management
│   └── utils.ts          # Utility functions
├── assets/               # Static assets
└── wxt.config.ts         # WXT configuration
```

### Release & Branch Strategy

This project uses simplified Trunk-Based Development for streamlined releases and configuration updates.

#### Branch Structure
- `main` - Primary development branch
- `develop` - Development integration branch
- `feature/name` - Optional short-lived feature branches

#### Update Workflows

##### Configuration Updates
Fast config file deployment without store approval:
1. Update `public/creturn-config.jsonc` in `main` branch
2. Tag with `config-vYYYYMMDD`
3. Update hosted config file on GitHub

##### Store Releases
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
2. Check if enabled (click menuber icon)
3. Refresh the Plugin
4. For custom configs, check JSONC format
5. Check browser console for errors

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
  https://github.com/cojiso/creturn/blob/main/public/creturn-config.jsonc

▍Custom configuration:
1. Create JSONC site configuration file
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
  https://github.com/cojiso/creturn/blob/main/public/creturn-config.jsonc

▍カスタム設定の方法：
1. JSONCファイルでサイト設定を作成
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
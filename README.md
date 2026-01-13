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

Configuration Format Example:
```jsonc
{
  "updated": "2025-05-07",
  "license": "MIT ©︎ 2025 name",
  "contact": "form / email / sns id",
  "description": "Optional",
  "sites": {
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

> The `selectors` field defines CSS selectors for text input areas on each domain. Wildcard domains (starting with `*.`) are supported for subdomain matching.

> [Important Notice] The configuration field name has been changed from `services` (v0.5.1) to `sites` (v0.6.0). Please update your custom configuration files accordingly.

## Architecture

cReturn is built with:
- **[WXT Framework](https://wxt.dev/)**: Modern browser extension framework
- **[Svelte](https://svelte.dev)**: Lightweight reactive UI framework (Compiler)

```sh
pnpm install  # Install dependencies
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm zip      # Create ZIP for store submission
```

## Release & Branch Strategy

This project uses simplified Trunk-Based Development for streamlined releases and configuration updates.

### Branch Structure
- `main` - Primary development branch
- `develop` - Development integration branch
- `feature/name` - Optional short-lived feature branches

### Configuration File Updates
Fast config file deployment without store approval:
1. Update `public/creturn-config.jsonc` in `main` branch
2. Tag with `config-vYYYYMMDD`
3. Update hosted config file on GitHub

### Store Releases

#### Automated Release (Recommended):
1. Update version in `package.json`
2. Commit with message starting with `release: v`:
    ```sh
    git add package.json
    git commit -m "release: v0.5.1"
    git push origin main
    ```
3. GitHub Actions will automatically:
    - Create git tag (e.g., `v0.5.1`)
    - Build the extension
    - Create ZIP file
    - Upload to Chrome Web Store
    - Create GitHub Release draft with the ZIP file
4. Setup requirements
    - Set [BPP_KEYS](https://github.com/PlasmoHQ/bpp#usage) secret in GitHub repository settings
    - Go to: [Actions secrets and variables](https://github.com/cojiso/creturn/settings/secrets/actions)

#### Manual Release (Alternative):
1. Update version in `package.json`
2. Build and package:
    ```sh
    pnpm build
    pnpm zip
    ```
3. Create git tag manually:
    ```sh
    git tag v0.5.1
    git push origin --tags
    ```
4. Manually submit ZIP file to Chrome Web Store
5. Create GitHub Release manually

## Supported Languages
en, ja, bn, da, de, fil, hi, ko, ne, ru, tr, vi, zh_CN, zh_TW

## Troubleshooting

If cReturn doesn't work:
1. Refresh the page
2. Check if enabled (click extension icon)
3. Reload the extension
4. For custom configs, verify JSONC format
5. Check browser console for errors

## Support

If you encounter issues or have suggestions:
- GitHub Issues: [Report issues here](https://github.com/cojiso/creturn/issues)

## License

cReturn is released under the [MIT License](https://github.com/cojiso/creturn/blob/main/LICENSE).

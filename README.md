# cReturn - Browser Extension

![cReturn Icon](assets/icon.png)

## Prevent Accidental Message Sending During IME Text Input

cReturn is a lightweight browser extension that solves a common problem for users of IME (Input Method Editor) systems such as Japanese, Chinese, and Korean input methods.

**The Problem:**
- When using IME to type text in AI chat services (ChatGPT, Claude, etc.), pressing Enter to confirm text conversion often accidentally sends incomplete messages
- Both IME text confirmation and message sending use the same Enter/Return key, causing conflicts

**The Solution:**
- cReturn separates these actions by intercepting Enter keypresses during IME input
- Use Ctrl+Enter (Windows/Linux) or Command+Enter (macOS) to send messages
- Normal Enter keypresses insert a line break instead of sending

## Supported AI Chat Services

The extension supports many popular AI chat services including:

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

## Custom Configuration

You can customize cReturn with your own configuration file:

1. Create a JSON configuration file (see format below)
2. Host it on GitHub
3. Enter the URL (raw.​githubusercontent.​com) in the extension options page

### Configuration File Format

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
    }
    // Add more domains as needed
  }
}
```

The `selectors` field defines CSS selectors that identify text input areas on each domain. You can add multiple selectors per domain to cover all possible input areas.

## Installation

### Chrome
1. Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/dpfkfjilfchkjcohjfmdnlmecgbpakfd)
2. Or search for "cReturn" in the Chrome Web Store
3. Click "Add to Chrome"

### Firefox (In Development)
1. Visit the Firefox Add-ons website
2. Search for "cReturn"
3. Click "Add to Firefox"

## Using cReturn

Once installed:

1. The extension icon indicates whether cReturn is active on the current site
   - Colored: Active
   - Gray: Inactive or site not supported

2. Click the extension icon to:
   - Enable/disable cReturn for the current site
   - Open extension options

3. When typing with IME on supported sites:
   - Press Enter to confirm text conversion or insert line breaks
   - Press Ctrl+Enter (Windows/Linux) or Command+Enter (macOS) to send messages

## Options

Access extension options by right-clicking the extension icon and selecting "Options" or through your browser's extension management page.

In the options page you can:
- Enable/disable cReturn for specific domains
- Add a custom configuration URL
- View currently supported services

## Troubleshooting

If cReturn doesn't work on a supported site:

1. Refresh the page
2. Check if cReturn is enabled for the domain (click extension icon)
3. Make sure you're using a supported input area
4. If using a custom configuration, verify your JSON format

## Privacy

cReturn:
- Stores your settings locally in Chrome storage
- Does not collect or transmit your personal data
- Does not send any information to remote servers
- Contains no analytics or tracking code
- Only accesses webpage content needed for input field functionality

## Development & Release Strategy

This project uses a simplified Trunk-Based Development approach that streamlines both store releases and configuration updates.

### Branch Structure

- `main` - Single primary branch for all development
- `feature/name` - Optional short-lived feature branches when needed

### Update Workflows

#### Configuration Updates (Weekly)
Configuration updates don't require store approval and can be deployed quickly:

1. Make changes directly to `creturn-config.json` in `main` (or via short-lived feature branch if needed)
2. After commit/merge, tag with `config-vYYYYMMDD`
3. Update the hosted config file on GitHub

#### Store Releases (Quarterly)
Store releases require Chrome Web Store approval:

1. When ready for release, ensure all changes are complete in `main`
2. Update version in `manifest.json`
3. Commit changes with message "Release vX.Y.Z"
4. Tag with `vX.Y.Z`
5. Package and submit to Chrome Web Store

### Version Scheme

- Extension versions: Semantic versioning (`X.Y.Z`)
  - `X`: Major version (significant changes)
  - `Y`: Minor version (new features)
  - `Z`: Patch version (bugfixes)
- Config updates: Date-based versioning (`config-vYYYYMMDD`)

### Release Artifacts

- Store releases: ZIP archive built from `main` at tag `vX.Y.Z`
- Config file: JSON file hosted on GitHub, referenced in extension options

This workflow allows for rapid config updates while maintaining stable store releases.

## Support

If you encounter issues or have suggestions:
- GitHub Issues: [Report issues here](https://github.com/cojiso/creturn/issues)

## License

cReturn is released under the MIT License.
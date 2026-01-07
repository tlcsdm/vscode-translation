# VSCode Translation

Translation plugin supporting Tencent Cloud, Baidu, and Youdao translation APIs. This extension helps developers translate text directly within VS Code.

Now supports VS Code 1.107.0 and later, macOS, Linux, and Windows.

## Features

* **Context menu translation**: Right-click on selected text and choose "tlcsdm" → "Translate" to translate.
* **Keyboard shortcut**: Press `Ctrl+Alt+T` (Windows/Linux) or `Cmd+Alt+T` (macOS) with selected text to translate.
* **Translation View**: Dedicated panel for translation with source and target language selection.
* **Status bar engine switch**: Click the translation engine indicator in the status bar to switch between providers.
* **Multiple providers**: Support for Tencent Cloud, Baidu, and Youdao translation services.
* **Configurable settings**: Customize default engine, source/target languages, and API credentials.

## Usage

### Manual Translation (Context Menu)
1. Select the text you want to translate
2. Right-click to open context menu
3. Select "tlcsdm" → "Translate"

### Keyboard Shortcut
1. Select the text you want to translate
2. Press `Ctrl+Alt+T` (Windows/Linux) or `Cmd+Alt+T` (macOS)

### Translation View
1. Click the Translation icon in the Activity Bar
2. Enter text in the source text area
3. Select source and target languages
4. Click "Translate" or enable auto-translation

### Switch Translation Engine
* Click on the engine name in the status bar (bottom right)
* Or use Command Palette: "Translation: Switch Engine"

## Configuration

Open VS Code Settings and search for "Translation" to configure:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `tlcsdm.translation.defaultEngine` | string | tencent | Default translation engine |
| `tlcsdm.translation.sourceLanguage` | string | auto | Source language for translation |
| `tlcsdm.translation.targetLanguage` | string | zh | Target language for translation |
| `tlcsdm.translation.tencent.secretId` | string | | Tencent Cloud SecretId |
| `tlcsdm.translation.tencent.secretKey` | string | | Tencent Cloud SecretKey |
| `tlcsdm.translation.baidu.appId` | string | | Baidu Translation API App ID |
| `tlcsdm.translation.baidu.secretKey` | string | | Baidu Translation API Secret Key |
| `tlcsdm.translation.youdao.appKey` | string | | Youdao Translation API App Key |
| `tlcsdm.translation.youdao.appSecret` | string | | Youdao Translation API App Secret |

### Supported Languages

| Code | Language |
|------|----------|
| auto | Auto detect |
| zh | Chinese |
| en | English |
| ja | Japanese |

## API Configuration

### Tencent Cloud Translation
1. Visit [Tencent Cloud Console](https://console.cloud.tencent.com/)
2. Create a new CAM user or use existing credentials
3. Copy SecretId and SecretKey to extension settings

### Baidu Translation
1. Visit [Baidu Translation Open Platform](https://fanyi-api.baidu.com/)
2. Create an application
3. Copy App ID and Secret Key to extension settings

### Youdao Translation
1. Visit [Youdao AI Open Platform](https://ai.youdao.com/)
2. Create an application
3. Copy App Key and App Secret to extension settings

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "Translation"
4. Click Install

### From VSIX File
1. Download the `.vsix` file from [Releases](https://github.com/tlcsdm/vscode-translation/releases)
2. In VS Code, open Command Palette (`Ctrl+Shift+P`)
3. Search for "Extensions: Install from VSIX..."
4. Select the downloaded `.vsix` file

### From Jenkins
Download from [Jenkins](https://jenkins.tlcsdm.com/job/vscode-plugin/job/vscode-translation/)

## Build

This project uses TypeScript and npm (Node.js 22).

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode (for development)
npm run watch

# Lint
npm run lint

# Package
npx @vscode/vsce package

# Test
npm run test
```

## Related Projects

* [eclipse-translation](https://github.com/tlcsdm/eclipse-translation) - Eclipse version of this plugin
* [vscode-fixcnchar](https://github.com/tlcsdm/vscode-fixcnchar) - Fix Chinese punctuation plugin

## License

MIT License - see [LICENSE](LICENSE) for details.

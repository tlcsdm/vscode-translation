import * as vscode from 'vscode';
import {
    TranslationProvider,
    TencentTranslationProvider,
    BaiduTranslationProvider,
    YoudaoTranslationProvider
} from '../providers';

/**
 * Translation View Panel
 * Provides a webview-based translation interface
 */
export class TranslationViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'tlcsdm.translation.translationView';

    private _view?: vscode.WebviewView;
    private providers: Map<string, TranslationProvider>;

    constructor(private readonly _extensionUri: vscode.Uri) {
        this.providers = new Map();
        this.providers.set('tencent', new TencentTranslationProvider());
        this.providers.set('baidu', new BaiduTranslationProvider());
        this.providers.set('youdao', new YoudaoTranslationProvider());
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView
    ): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview();

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'translate':
                    await this._handleTranslate(data.text, data.from, data.to, data.engine);
                    break;
            }
        });
    }

    private async _handleTranslate(text: string, from: string, to: string, engine: string): Promise<void> {
        if (!this._view) {
            return;
        }

        const provider = this.providers.get(engine);
        if (!provider) {
            this._view.webview.postMessage({ type: 'error', message: 'Unknown translation engine' });
            return;
        }

        try {
            const result = await provider.translate(text, from, to);
            this._view.webview.postMessage({ type: 'result', result: result });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Translation failed';
            this._view.webview.postMessage({ type: 'error', message: message });
        }
    }

    private _getHtmlForWebview(): string {
        const config = vscode.workspace.getConfiguration('tlcsdm.translation');
        const defaultEngine = config.get<string>('defaultEngine', 'tencent');
        const sourceLanguage = config.get<string>('sourceLanguage', 'auto');
        const targetLanguage = config.get<string>('targetLanguage', 'zh');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Translation</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            padding: 10px;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .container {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .controls {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
        }
        select, button {
            padding: 4px 8px;
            font-size: var(--vscode-font-size);
            color: var(--vscode-dropdown-foreground);
            background-color: var(--vscode-dropdown-background);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 2px;
        }
        select:focus, button:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: -1px;
        }
        button {
            cursor: pointer;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        textarea {
            width: 100%;
            min-height: 100px;
            padding: 8px;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            color: var(--vscode-input-foreground);
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            resize: vertical;
        }
        textarea:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: -1px;
        }
        .result-container {
            padding: 8px;
            min-height: 80px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .error {
            color: var(--vscode-errorForeground);
        }
        .label {
            font-weight: bold;
            margin-bottom: 4px;
        }
        .checkbox-container {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        input[type="checkbox"] {
            accent-color: var(--vscode-checkbox-background);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="controls">
            <select id="from-lang" title="Source Language">
                <option value="auto" ${sourceLanguage === 'auto' ? 'selected' : ''}>Auto</option>
                <option value="zh" ${sourceLanguage === 'zh' ? 'selected' : ''}>Chinese</option>
                <option value="en" ${sourceLanguage === 'en' ? 'selected' : ''}>English</option>
                <option value="ja" ${sourceLanguage === 'ja' ? 'selected' : ''}>Japanese</option>
            </select>
            <span>→</span>
            <select id="to-lang" title="Target Language">
                <option value="zh" ${targetLanguage === 'zh' ? 'selected' : ''}>Chinese</option>
                <option value="en" ${targetLanguage === 'en' ? 'selected' : ''}>English</option>
                <option value="ja" ${targetLanguage === 'ja' ? 'selected' : ''}>Japanese</option>
            </select>
            <select id="engine" title="Translation Engine">
                <option value="tencent" ${defaultEngine === 'tencent' ? 'selected' : ''}>Tencent</option>
                <option value="baidu" ${defaultEngine === 'baidu' ? 'selected' : ''}>Baidu</option>
                <option value="youdao" ${defaultEngine === 'youdao' ? 'selected' : ''}>Youdao</option>
            </select>
            <button id="translate-btn">Translate</button>
            <div class="checkbox-container">
                <input type="checkbox" id="auto-translate" checked>
                <label for="auto-translate">Auto</label>
            </div>
        </div>
        
        <div>
            <div class="label">Source Text</div>
            <textarea id="source-text" placeholder="Enter text to translate..."></textarea>
        </div>
        
        <div>
            <div class="label">Translation Result</div>
            <div id="result" class="result-container"></div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        const sourceText = document.getElementById('source-text');
        const resultDiv = document.getElementById('result');
        const fromLang = document.getElementById('from-lang');
        const toLang = document.getElementById('to-lang');
        const engine = document.getElementById('engine');
        const translateBtn = document.getElementById('translate-btn');
        const autoTranslate = document.getElementById('auto-translate');
        
        let debounceTimer;

        function translate() {
            const text = sourceText.value.trim();
            if (!text) {
                resultDiv.textContent = '';
                resultDiv.classList.remove('error');
                return;
            }
            
            vscode.postMessage({
                type: 'translate',
                text: text,
                from: fromLang.value,
                to: toLang.value,
                engine: engine.value
            });
        }

        function debounceTranslate() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(translate, 500);
        }

        translateBtn.addEventListener('click', translate);
        
        sourceText.addEventListener('input', () => {
            if (autoTranslate.checked) {
                debounceTranslate();
            }
        });

        fromLang.addEventListener('change', () => {
            if (autoTranslate.checked && sourceText.value.trim()) {
                translate();
            }
        });

        toLang.addEventListener('change', () => {
            if (autoTranslate.checked && sourceText.value.trim()) {
                translate();
            }
        });

        engine.addEventListener('change', () => {
            if (autoTranslate.checked && sourceText.value.trim()) {
                translate();
            }
        });

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'result':
                    resultDiv.textContent = message.result;
                    resultDiv.classList.remove('error');
                    break;
                case 'error':
                    resultDiv.textContent = message.message;
                    resultDiv.classList.add('error');
                    break;
            }
        });
    </script>
</body>
</html>`;
    }
}

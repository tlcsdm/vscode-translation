import * as vscode from 'vscode';
import {
    TranslationProvider,
    TencentTranslationProvider,
    BaiduTranslationProvider,
    YoudaoTranslationProvider
} from './providers';
import { TranslationViewProvider } from './views';

// Status bar item for engine switching
let statusBarItem: vscode.StatusBarItem;

// Current translation engine
let currentEngine = 'baidu';

// Translation providers
const providers: Map<string, TranslationProvider> = new Map();
providers.set('tencent', new TencentTranslationProvider());
providers.set('baidu', new BaiduTranslationProvider());
providers.set('youdao', new YoudaoTranslationProvider());

// Decoration type for inline translation display
let translationDecorationType: vscode.TextEditorDecorationType | undefined;

/**
 * Get the current translation provider
 */
function getCurrentProvider(): TranslationProvider | undefined {
    return providers.get(currentEngine);
}

/**
 * Clear any existing translation decoration
 */
function clearTranslationDecoration(): void {
    if (translationDecorationType) {
        // Clear decorations from the editor first
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.setDecorations(translationDecorationType, []);
        }
        translationDecorationType.dispose();
        translationDecorationType = undefined;
    }
}

/**
 * Translate selected text
 */
async function translateSelection(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No active text editor');
        return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
        vscode.window.showWarningMessage('No text selected');
        return;
    }

    const text = editor.document.getText(selection);
    const provider = getCurrentProvider();

    if (!provider) {
        vscode.window.showErrorMessage('Unknown translation engine');
        return;
    }

    const config = vscode.workspace.getConfiguration('tlcsdm.translation');
    const from = config.get<string>('sourceLanguage', 'auto');
    const to = config.get<string>('targetLanguage', 'zh');

    try {
        const result = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Translating...',
                cancellable: false
            },
            async () => {
                return await provider.translate(text, from, to);
            }
        );

        // Clear any previous translation decoration
        clearTranslationDecoration();

        // Create decoration type for tooltip-style popup display
        // Use after decoration with styling to create a floating popup appearance
        translationDecorationType = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: ` ▼ ${result}`,
                color: new vscode.ThemeColor('editorHoverWidget.foreground'),
                backgroundColor: new vscode.ThemeColor('editorHoverWidget.background'),
                border: '1px solid',
                borderColor: new vscode.ThemeColor('editorHoverWidget.border'),
                margin: '0 0 0 0.5em'
            }
        });

        // Apply decoration at the end of the selection to appear like a floating popup
        const endPosition = selection.end;
        const decorationRange = new vscode.Range(endPosition, endPosition);

        editor.setDecorations(translationDecorationType, [decorationRange]);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Translation failed';
        vscode.window.showErrorMessage(message);
    }
}

/**
 * Show translation view
 */
async function showTranslationView(): Promise<void> {
    await vscode.commands.executeCommand('workbench.view.extension.translation-explorer');
}

/**
 * Switch translation engine
 */
async function switchEngine(context: vscode.ExtensionContext): Promise<void> {
    const engines: (vscode.QuickPickItem & { value: string })[] = [
        { 
            label: 'Tencent Cloud', 
            description: 'Tencent Cloud Translation', 
            value: 'tencent',
            iconPath: vscode.Uri.joinPath(context.extensionUri, 'images', 'tencent.png')
        },
        { 
            label: 'Baidu', 
            description: 'Baidu Translation', 
            value: 'baidu',
            iconPath: vscode.Uri.joinPath(context.extensionUri, 'images', 'baidu.png')
        },
        { 
            label: 'Youdao', 
            description: 'Youdao Translation', 
            value: 'youdao',
            iconPath: vscode.Uri.joinPath(context.extensionUri, 'images', 'youdao.png')
        }
    ];

    const selected = await vscode.window.showQuickPick(engines, {
        placeHolder: `Current: ${currentEngine.charAt(0).toUpperCase() + currentEngine.slice(1)}`,
        title: 'Select Translation Engine'
    });

    if (selected) {
        currentEngine = selected.value;
        updateStatusBar();

        // Update configuration
        const config = vscode.workspace.getConfiguration('tlcsdm.translation');
        await config.update('defaultEngine', currentEngine, vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage(`Translation engine switched to ${currentEngine}`);
    }
}

/**
 * Update status bar item
 */
function updateStatusBar(): void {
    const engineLabels: Record<string, string> = {
        tencent: '$(cloud) Tencent',
        baidu: '$(globe) Baidu',
        youdao: '$(book) Youdao'
    };

    statusBarItem.text = engineLabels[currentEngine] || currentEngine;
    statusBarItem.tooltip = `Translation Engine: ${currentEngine.charAt(0).toUpperCase() + currentEngine.slice(1)}\nClick to switch`;
}

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext): void {
    // Load default engine from configuration
    const config = vscode.workspace.getConfiguration('tlcsdm.translation');
    currentEngine = config.get<string>('defaultEngine', 'baidu');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'tlcsdm.translation.switchEngine';
    updateStatusBar();
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Register translation view provider
    const translationViewProvider = new TranslationViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            TranslationViewProvider.viewType,
            translationViewProvider
        )
    );

    // Register commands
    const translateSelectionCmd = vscode.commands.registerCommand(
        'tlcsdm.translation.translateSelection',
        translateSelection
    );

    const showTranslationViewCmd = vscode.commands.registerCommand(
        'tlcsdm.translation.showTranslationView',
        showTranslationView
    );

    const switchEngineCmd = vscode.commands.registerCommand(
        'tlcsdm.translation.switchEngine',
        () => switchEngine(context)
    );

    context.subscriptions.push(translateSelectionCmd, showTranslationViewCmd, switchEngineCmd);

    // Listen for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('tlcsdm.translation.defaultEngine')) {
                const newEngine = vscode.workspace.getConfiguration('tlcsdm.translation')
                    .get<string>('defaultEngine', 'baidu');
                if (newEngine !== currentEngine) {
                    currentEngine = newEngine;
                    updateStatusBar();
                }
            }
        })
    );

    console.log('Translation extension is now active');
}

/**
 * Extension deactivation
 */
export function deactivate(): void {
    // Clean up resources
}

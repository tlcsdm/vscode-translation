import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('unknowIfGuestInDream.tlcsdm-translation'));
    });

    test('Commands should be registered', async () => {
        const extension = vscode.extensions.getExtension('unknowIfGuestInDream.tlcsdm-translation');
        await extension?.activate();

        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('tlcsdm.translation.translateSelection'));
        assert.ok(commands.includes('tlcsdm.translation.showTranslationView'));
        assert.ok(commands.includes('tlcsdm.translation.switchEngine'));
    });

    test('Configuration should have default values', () => {
        const config = vscode.workspace.getConfiguration('tlcsdm.translation');
        const defaultEngine = config.get<string>('defaultEngine');
        assert.strictEqual(defaultEngine, 'baidu');

        const sourceLanguage = config.get<string>('sourceLanguage');
        assert.strictEqual(sourceLanguage, 'auto');

        const targetLanguage = config.get<string>('targetLanguage');
        assert.strictEqual(targetLanguage, 'zh');
    });
});

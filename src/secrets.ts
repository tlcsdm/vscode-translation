import * as vscode from 'vscode';

/**
 * Secret keys for translation API credentials
 */
export const SecretKeys = {
    // Tencent Cloud
    TENCENT_SECRET_ID: 'tlcsdm.translation.tencent.secretId',
    TENCENT_SECRET_KEY: 'tlcsdm.translation.tencent.secretKey',
    // Baidu
    BAIDU_APP_ID: 'tlcsdm.translation.baidu.appId',
    BAIDU_SECRET_KEY: 'tlcsdm.translation.baidu.secretKey',
    // Youdao
    YOUDAO_APP_KEY: 'tlcsdm.translation.youdao.appKey',
    YOUDAO_APP_SECRET: 'tlcsdm.translation.youdao.appSecret'
} as const;

/**
 * Secret Storage Manager for securely storing API credentials
 */
export class SecretStorageManager {
    private static instance: SecretStorageManager;
    private secretStorage: vscode.SecretStorage;

    private constructor(secretStorage: vscode.SecretStorage) {
        this.secretStorage = secretStorage;
    }

    /**
     * Initialize the secret storage manager
     */
    static initialize(context: vscode.ExtensionContext): void {
        SecretStorageManager.instance = new SecretStorageManager(context.secrets);
    }

    /**
     * Get the singleton instance
     */
    static getInstance(): SecretStorageManager {
        if (!SecretStorageManager.instance) {
            throw new Error('SecretStorageManager not initialized. Call initialize() first.');
        }
        return SecretStorageManager.instance;
    }

    /**
     * Get a secret value
     */
    async get(key: string): Promise<string | undefined> {
        return this.secretStorage.get(key);
    }

    /**
     * Store a secret value
     */
    async store(key: string, value: string): Promise<void> {
        await this.secretStorage.store(key, value);
    }

    /**
     * Delete a secret value
     */
    async delete(key: string): Promise<void> {
        await this.secretStorage.delete(key);
    }

    /**
     * Get Tencent Cloud credentials
     */
    async getTencentCredentials(): Promise<{ secretId: string; secretKey: string } | undefined> {
        const secretId = await this.get(SecretKeys.TENCENT_SECRET_ID);
        const secretKey = await this.get(SecretKeys.TENCENT_SECRET_KEY);
        if (secretId && secretKey) {
            return { secretId, secretKey };
        }
        return undefined;
    }

    /**
     * Get Baidu credentials
     */
    async getBaiduCredentials(): Promise<{ appId: string; secretKey: string } | undefined> {
        const appId = await this.get(SecretKeys.BAIDU_APP_ID);
        const secretKey = await this.get(SecretKeys.BAIDU_SECRET_KEY);
        if (appId && secretKey) {
            return { appId, secretKey };
        }
        return undefined;
    }

    /**
     * Get Youdao credentials
     */
    async getYoudaoCredentials(): Promise<{ appKey: string; appSecret: string } | undefined> {
        const appKey = await this.get(SecretKeys.YOUDAO_APP_KEY);
        const appSecret = await this.get(SecretKeys.YOUDAO_APP_SECRET);
        if (appKey && appSecret) {
            return { appKey, appSecret };
        }
        return undefined;
    }
}

/**
 * Prompt user to enter API credentials for a specific engine
 */
export async function promptForCredentials(engine: 'tencent' | 'baidu' | 'youdao'): Promise<boolean> {
    const manager = SecretStorageManager.getInstance();

    switch (engine) {
        case 'tencent': {
            const secretId = await vscode.window.showInputBox({
                title: 'Tencent Cloud SecretId',
                prompt: 'Enter your Tencent Cloud SecretId',
                password: true,
                ignoreFocusOut: true
            });
            if (!secretId) {
                return false;
            }

            const secretKey = await vscode.window.showInputBox({
                title: 'Tencent Cloud SecretKey',
                prompt: 'Enter your Tencent Cloud SecretKey',
                password: true,
                ignoreFocusOut: true
            });
            if (!secretKey) {
                return false;
            }

            await manager.store(SecretKeys.TENCENT_SECRET_ID, secretId);
            await manager.store(SecretKeys.TENCENT_SECRET_KEY, secretKey);
            return true;
        }
        case 'baidu': {
            const appId = await vscode.window.showInputBox({
                title: 'Baidu Translation App ID',
                prompt: 'Enter your Baidu Translation API App ID',
                ignoreFocusOut: true
            });
            if (!appId) {
                return false;
            }

            const secretKey = await vscode.window.showInputBox({
                title: 'Baidu Translation Secret Key',
                prompt: 'Enter your Baidu Translation API Secret Key',
                password: true,
                ignoreFocusOut: true
            });
            if (!secretKey) {
                return false;
            }

            await manager.store(SecretKeys.BAIDU_APP_ID, appId);
            await manager.store(SecretKeys.BAIDU_SECRET_KEY, secretKey);
            return true;
        }
        case 'youdao': {
            const appKey = await vscode.window.showInputBox({
                title: 'Youdao Translation App Key',
                prompt: 'Enter your Youdao Translation API App Key',
                ignoreFocusOut: true
            });
            if (!appKey) {
                return false;
            }

            const appSecret = await vscode.window.showInputBox({
                title: 'Youdao Translation App Secret',
                prompt: 'Enter your Youdao Translation API App Secret',
                password: true,
                ignoreFocusOut: true
            });
            if (!appSecret) {
                return false;
            }

            await manager.store(SecretKeys.YOUDAO_APP_KEY, appKey);
            await manager.store(SecretKeys.YOUDAO_APP_SECRET, appSecret);
            return true;
        }
        default:
            return false;
    }
}

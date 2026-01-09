import * as crypto from 'crypto';
import * as https from 'https';
import * as vscode from 'vscode';
import { TranslationProvider, LanguageMap } from './types';

interface BaiduTransResult {
    src: string;
    dst: string;
}

interface BaiduResponse {
    from?: string;
    to?: string;
    trans_result?: BaiduTransResult[];
    error_code?: string;
    error_msg?: string;
}

/**
 * Baidu Translation Provider
 */
export class BaiduTranslationProvider implements TranslationProvider {
    name = 'baidu';
    private static readonly API_HOST = 'api.fanyi.baidu.com';
    private static readonly API_PATH = '/api/trans/vip/translate';

    async translate(text: string, from: string, to: string): Promise<string> {
        const config = vscode.workspace.getConfiguration('tlcsdm.translation.baidu');
        const appId = config.get<string>('appId', '');
        const secretKey = config.get<string>('secretKey', '');

        if (!appId || !secretKey) {
            throw new Error('Baidu Translation API App ID or Secret Key not configured. Please configure in settings.');
        }

        const sourceLanguage = LanguageMap.baidu[from] || 'auto';
        const targetLanguage = LanguageMap.baidu[to] || 'zh';

        const salt = Date.now().toString();
        const sign = this.md5(`${appId}${text}${salt}${secretKey}`);

        const params = new URLSearchParams({
            q: text,
            from: sourceLanguage,
            to: targetLanguage,
            appid: appId,
            salt: salt,
            sign: sign
        });

        return new Promise((resolve, reject) => {
            const options: https.RequestOptions = {
                hostname: BaiduTranslationProvider.API_HOST,
                port: 443,
                path: `${BaiduTranslationProvider.API_PATH}?${params.toString()}`,
                method: 'GET'
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const response: BaiduResponse = JSON.parse(data);
                        if (response.error_code) {
                            reject(new Error(`Baidu API Error: ${response.error_msg || response.error_code}`));
                        } else if (response.trans_result && response.trans_result.length > 0) {
                            const result = response.trans_result.map(item => item.dst).join('\n');
                            resolve(result);
                        } else {
                            reject(new Error('No translation result returned'));
                        }
                    } catch {
                        reject(new Error(`Failed to parse response: ${data}`));
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });
    }

    private md5(text: string): string {
        return crypto.createHash('md5').update(text, 'utf8').digest('hex');
    }
}

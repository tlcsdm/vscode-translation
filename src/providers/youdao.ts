import * as crypto from 'crypto';
import * as https from 'https';
import { TranslationProvider, LanguageMap } from './types';
import { SecretStorageManager } from '../secrets';

interface YoudaoResponse {
    errorCode?: string;
    translation?: string[];
    basic?: {
        phonetic?: string;
        explains?: string[];
    };
}

/**
 * Youdao Translation Provider
 */
export class YoudaoTranslationProvider implements TranslationProvider {
    name = 'youdao';
    private static readonly API_HOST = 'openapi.youdao.com';
    private static readonly API_PATH = '/api';

    async translate(text: string, from: string, to: string): Promise<string> {
        const credentials = await SecretStorageManager.getInstance().getYoudaoCredentials();

        if (!credentials) {
            throw new Error('Youdao Translation API credentials not configured. Please use the "Configure API Keys" command.');
        }

        const { appKey, appSecret } = credentials;

        const sourceLanguage = LanguageMap.youdao[from] || 'auto';
        const targetLanguage = LanguageMap.youdao[to] || 'zh-CHS';

        const salt = Date.now().toString();
        const curtime = Math.floor(Date.now() / 1000).toString();
        const input = text.length > 20 
            ? `${text.substring(0, 10)}${text.length}${text.substring(text.length - 10)}`
            : text;
        const sign = this.sha256(`${appKey}${input}${salt}${curtime}${appSecret}`);

        const params = new URLSearchParams({
            q: text,
            from: sourceLanguage,
            to: targetLanguage,
            appKey: appKey,
            salt: salt,
            sign: sign,
            signType: 'v3',
            curtime: curtime
        });

        return new Promise((resolve, reject) => {
            const options: https.RequestOptions = {
                hostname: YoudaoTranslationProvider.API_HOST,
                port: 443,
                path: `${YoudaoTranslationProvider.API_PATH}?${params.toString()}`,
                method: 'GET'
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const response: YoudaoResponse = JSON.parse(data);
                        if (response.errorCode && response.errorCode !== '0') {
                            reject(new Error(`Youdao API Error: ${this.getErrorMessage(response.errorCode)}`));
                        } else if (response.translation && response.translation.length > 0) {
                            const result = response.translation.join('\n');
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

    private sha256(text: string): string {
        return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
    }

    private getErrorMessage(code: string): string {
        const errorMessages: Record<string, string> = {
            '101': 'Missing required parameters',
            '102': 'Unsupported language type',
            '103': 'Text too long',
            '104': 'Unsupported API type',
            '105': 'Unsupported signature type',
            '106': 'Unsupported response type',
            '107': 'Unsupported transport encryption type',
            '108': 'Invalid appKey',
            '109': 'Batch operation limit exceeded',
            '110': 'Invalid IP address',
            '111': 'URL too long',
            '201': 'Decryption failed',
            '202': 'Invalid signature',
            '203': 'Access IP not in whitelist',
            '301': 'Dictionary query failed',
            '302': 'Translation query failed',
            '303': 'Other server errors',
            '401': 'Insufficient account balance',
            '411': 'Concurrent access limit exceeded',
            '412': 'Long text request frequency limit'
        };
        return errorMessages[code] || `Unknown error (${code})`;
    }
}

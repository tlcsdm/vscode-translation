import * as crypto from 'crypto';
import * as https from 'https';
import * as vscode from 'vscode';
import { TranslationProvider, LanguageMap } from './types';

interface TencentResponse {
    Response: {
        TargetText?: string;
        Error?: {
            Code: string;
            Message: string;
        };
    };
}

/**
 * Tencent Cloud Translation Provider
 */
export class TencentTranslationProvider implements TranslationProvider {
    name = 'tencent';
    private static readonly SERVICE = 'tmt';
    private static readonly REGION = 'ap-beijing';
    private static readonly VERSION = '2018-03-21';
    private static readonly ACTION = 'TextTranslate';
    private static readonly HOST = 'tmt.tencentcloudapi.com';

    async translate(text: string, from: string, to: string): Promise<string> {
        const config = vscode.workspace.getConfiguration('tlcsdm.translation.tencent');
        const secretId = config.get<string>('secretId', '');
        const secretKey = config.get<string>('secretKey', '');

        if (!secretId || !secretKey) {
            throw new Error('Tencent Cloud SecretId or SecretKey not configured. Please configure in settings.');
        }

        const sourceLanguage = LanguageMap.tencent[from] || 'auto';
        const targetLanguage = LanguageMap.tencent[to] || 'zh';

        const body = JSON.stringify({
            SourceText: text,
            Source: sourceLanguage,
            Target: targetLanguage,
            ProjectId: 0
        });

        const timestamp = Math.floor(Date.now() / 1000).toString();
        const authorization = this.getAuth(secretId, secretKey, timestamp, body);

        return new Promise((resolve, reject) => {
            const options: https.RequestOptions = {
                hostname: TencentTranslationProvider.HOST,
                port: 443,
                path: '/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'X-TC-Action': TencentTranslationProvider.ACTION,
                    'X-TC-Version': TencentTranslationProvider.VERSION,
                    'X-TC-Region': TencentTranslationProvider.REGION,
                    'X-TC-Timestamp': timestamp,
                    'Authorization': authorization
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const response: TencentResponse = JSON.parse(data);
                        if (response.Response.Error) {
                            reject(new Error(response.Response.Error.Message));
                        } else {
                            resolve(response.Response.TargetText || '');
                        }
                    } catch {
                        reject(new Error(`Failed to parse response: ${data}`));
                    }
                });
            });

            req.on('error', reject);
            req.write(body);
            req.end();
        });
    }

    private getAuth(secretId: string, secretKey: string, timestamp: string, body: string): string {
        const date = new Date(parseInt(timestamp) * 1000).toISOString().split('T')[0];
        const contentType = 'application/json; charset=utf-8';

        // Step 1: Create canonical request
        const hashedRequestPayload = this.sha256Hex(body);
        const canonicalRequest = [
            'POST',
            '/',
            '',
            `content-type:${contentType}\nhost:${TencentTranslationProvider.HOST}\n`,
            'content-type;host',
            hashedRequestPayload
        ].join('\n');

        // Step 2: Create string to sign
        const credentialScope = `${date}/${TencentTranslationProvider.SERVICE}/tc3_request`;
        const hashedCanonicalRequest = this.sha256Hex(canonicalRequest);
        const stringToSign = [
            'TC3-HMAC-SHA256',
            timestamp,
            credentialScope,
            hashedCanonicalRequest
        ].join('\n');

        // Step 3: Calculate signature
        const secretDate = this.hmac256(`TC3${secretKey}`, date);
        const secretService = this.hmac256(secretDate, TencentTranslationProvider.SERVICE);
        const secretSigning = this.hmac256(secretService, 'tc3_request');
        const signature = this.hmac256(secretSigning, stringToSign).toString('hex');

        // Step 4: Create authorization header
        return `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=content-type;host, Signature=${signature}`;
    }

    private sha256Hex(message: string): string {
        return crypto.createHash('sha256').update(message, 'utf8').digest('hex');
    }

    private hmac256(key: string | Buffer, message: string): Buffer {
        return crypto.createHmac('sha256', key).update(message, 'utf8').digest();
    }
}

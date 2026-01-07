/**
 * Translation provider interface
 */
export interface TranslationProvider {
    name: string;
    translate(text: string, from: string, to: string): Promise<string>;
}

/**
 * Translation result structure
 */
export interface TranslationResult {
    text: string;
    from: string;
    to: string;
    result: string;
    provider: string;
}

/**
 * Language mapping for different providers
 */
export const LanguageMap: Record<string, Record<string, string>> = {
    tencent: {
        auto: 'auto',
        zh: 'zh',
        en: 'en',
        ja: 'ja'
    },
    baidu: {
        auto: 'auto',
        zh: 'zh',
        en: 'en',
        ja: 'jp'
    },
    youdao: {
        auto: 'auto',
        zh: 'zh-CHS',
        en: 'en',
        ja: 'ja'
    }
};

// ============================================
// RAG MULTI-LANGUAGE SUPPORT
// Detect language and adapt responses
// ============================================

export type SupportedLanguage =
  | 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it'
  | 'ru' | 'zh' | 'ja' | 'ko' | 'ar' | 'hi';

interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  promptAddition: string;
}

const LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  en: { code: 'en', name: 'English', nativeName: 'English', promptAddition: '' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', promptAddition: 'Respond in Spanish (Español).' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', promptAddition: 'Respond in French (Français).' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', promptAddition: 'Respond in German (Deutsch).' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', promptAddition: 'Respond in Portuguese (Português).' },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', promptAddition: 'Respond in Italian (Italiano).' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', promptAddition: 'Respond in Russian (Русский).' },
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文', promptAddition: 'Respond in Chinese (中文).' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', promptAddition: 'Respond in Japanese (日本語).' },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', promptAddition: 'Respond in Korean (한국어).' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', promptAddition: 'Respond in Arabic (العربية).' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', promptAddition: 'Respond in Hindi (हिन्दी).' },
};

// Language detection patterns
const LANGUAGE_PATTERNS: { pattern: RegExp; lang: SupportedLanguage }[] = [
  // Spanish
  { pattern: /\b(qué|cómo|cuál|precio|mercado|comprar|vender|análisis)\b/i, lang: 'es' },
  { pattern: /[áéíóúñ¿¡]/i, lang: 'es' },

  // French
  { pattern: /\b(quel|comment|pourquoi|marché|acheter|vendre|analyse)\b/i, lang: 'fr' },
  { pattern: /[àâçéèêëîïôùûüœæ]/i, lang: 'fr' },

  // German
  { pattern: /\b(was|wie|warum|markt|kaufen|verkaufen|analyse)\b/i, lang: 'de' },
  { pattern: /[äöüß]/i, lang: 'de' },

  // Portuguese
  { pattern: /\b(qual|como|por que|mercado|comprar|vender|análise)\b/i, lang: 'pt' },
  { pattern: /[ãõç]/i, lang: 'pt' },

  // Italian
  { pattern: /\b(quale|come|perché|mercato|comprare|vendere|analisi)\b/i, lang: 'it' },
  { pattern: /[àèéìíîòóùú]/i, lang: 'it' },

  // Russian
  { pattern: /[а-яА-ЯёЁ]/i, lang: 'ru' },

  // Chinese
  { pattern: /[\u4e00-\u9fff]/i, lang: 'zh' },

  // Japanese
  { pattern: /[\u3040-\u309f\u30a0-\u30ff]/i, lang: 'ja' },

  // Korean
  { pattern: /[\uac00-\ud7af\u1100-\u11ff]/i, lang: 'ko' },

  // Arabic
  { pattern: /[\u0600-\u06ff]/i, lang: 'ar' },

  // Hindi
  { pattern: /[\u0900-\u097f]/i, lang: 'hi' },
];

/**
 * Detect language from text
 */
export function detectLanguage(text: string): SupportedLanguage {
  // Check for non-Latin scripts first (more reliable)
  for (const { pattern, lang } of LANGUAGE_PATTERNS.slice(-6)) {
    if (pattern.test(text)) {
      return lang;
    }
  }

  // Check Latin-based languages
  for (const { pattern, lang } of LANGUAGE_PATTERNS.slice(0, -6)) {
    if (pattern.test(text)) {
      return lang;
    }
  }

  // Default to English
  return 'en';
}

/**
 * Get language info
 */
export function getLanguageInfo(code: SupportedLanguage): LanguageInfo {
  return LANGUAGES[code] || LANGUAGES.en;
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): LanguageInfo[] {
  return Object.values(LANGUAGES);
}

/**
 * Adapt system prompt for detected language
 */
export function adaptPromptForLanguage(
  systemPrompt: string,
  detectedLanguage: SupportedLanguage
): string {
  if (detectedLanguage === 'en') {
    return systemPrompt;
  }

  const langInfo = LANGUAGES[detectedLanguage];
  if (!langInfo) {
    return systemPrompt;
  }

  // Add language instruction to prompt
  return `${systemPrompt}

LANGUAGE INSTRUCTION: ${langInfo.promptAddition}
Keep all technical terms (BTC, ETH, market cap, etc.) in English, but explain everything else in ${langInfo.name}.
Format numbers according to ${langInfo.name} conventions.`;
}

/**
 * Common crypto terms that should stay in English
 */
export const UNIVERSAL_TERMS = [
  'BTC', 'ETH', 'SOL', 'XRP', 'USDT', 'USDC',
  'Bitcoin', 'Ethereum', 'blockchain', 'wallet',
  'DeFi', 'NFT', 'DAO', 'DEX', 'CEX',
  'bull', 'bear', 'HODL', 'FOMO', 'FUD',
  'market cap', 'volume', 'liquidity',
  'staking', 'yield', 'APY', 'APR',
  'whale', 'pump', 'dump', 'ATH', 'ATL',
];

/**
 * Format number for locale
 */
export function formatNumberForLocale(
  value: number,
  language: SupportedLanguage,
  options?: Intl.NumberFormatOptions
): string {
  const localeMap: Record<SupportedLanguage, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    pt: 'pt-BR',
    it: 'it-IT',
    ru: 'ru-RU',
    zh: 'zh-CN',
    ja: 'ja-JP',
    ko: 'ko-KR',
    ar: 'ar-SA',
    hi: 'hi-IN',
  };

  try {
    return new Intl.NumberFormat(localeMap[language], options).format(value);
  } catch {
    return value.toLocaleString();
  }
}

/**
 * Format currency for locale
 */
export function formatCurrencyForLocale(
  value: number,
  language: SupportedLanguage,
  currency: string = 'USD'
): string {
  return formatNumberForLocale(value, language, {
    style: 'currency',
    currency,
  });
}

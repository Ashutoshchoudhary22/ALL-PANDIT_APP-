import type { AppLanguage } from '@/constants/i18n';
import type { TranslationKey } from '@/constants/i18n/en';

export const PANDIT_LANGUAGE_OPTIONS = [
  { code: 'en', labelKey: 'language.en' as const },
  { code: 'hi', labelKey: 'language.hi' as const },
] as const;

export type PanditLanguageCode = (typeof PANDIT_LANGUAGE_OPTIONS)[number]['code'];

export function formatPanditAppLanguage(code?: string | null, language: AppLanguage = 'en') {
  if (!code) return language === 'hi' ? 'हिंदी' : 'English';
  const key = code.trim().toLowerCase();
  if (key === 'hi' || key === 'hindi') return language === 'hi' ? 'हिंदी' : 'Hindi';
  if (key === 'en' || key === 'english') return language === 'hi' ? 'अंग्रेज़ी' : 'English';
  return code;
}

export type LanguageLabelKey = Extract<TranslationKey, 'language.en' | 'language.hi'>;

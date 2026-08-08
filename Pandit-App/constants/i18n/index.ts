import AsyncStorage from '@react-native-async-storage/async-storage';

import en, { TranslationKey } from '@/constants/i18n/en';
import hi from '@/constants/i18n/hi';

export type { TranslationKey };
export type AppLanguage = 'en' | 'hi';

export const APP_LANGUAGE_STORAGE_KEY = 'pandit_app_language';
export const DEFAULT_APP_LANGUAGE: AppLanguage = 'en';

const dictionaries: Record<AppLanguage, Record<TranslationKey, string>> = {
  en,
  hi,
};

export function normalizeAppLanguage(code?: string | null): AppLanguage {
  if (!code) return DEFAULT_APP_LANGUAGE;
  const key = code.trim().toLowerCase();
  if (key === 'hi' || key === 'hindi') return 'hi';
  if (key === 'en' || key === 'english') return 'en';
  return DEFAULT_APP_LANGUAGE;
}

export function translate(
  language: AppLanguage,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  let text = dictionaries[language][key] ?? dictionaries.en[key] ?? key;

  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
    });
  }

  return text;
}

export async function readStoredAppLanguage(): Promise<AppLanguage | null> {
  const stored = await AsyncStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
  if (!stored) return null;
  return normalizeAppLanguage(stored);
}

export async function writeStoredAppLanguage(language: AppLanguage) {
  await AsyncStorage.setItem(APP_LANGUAGE_STORAGE_KEY, language);
}

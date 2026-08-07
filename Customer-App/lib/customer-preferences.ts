import type { AppLanguage } from '@/constants/i18n';
import type { TranslationKey } from '@/constants/i18n/en';

export const CUSTOMER_LANGUAGE_OPTIONS = [
  { code: 'en', labelKey: 'language.en' as const },
  { code: 'hi', labelKey: 'language.hi' as const },
] as const;

export type CustomerLanguageCode = (typeof CUSTOMER_LANGUAGE_OPTIONS)[number]['code'];

export function formatCustomerLanguage(code?: string | null, language: AppLanguage = 'en') {
  if (!code) return language === 'hi' ? 'हिंदी' : 'English';
  const key = code.trim().toLowerCase();
  if (key === 'hi' || key === 'hindi') return language === 'hi' ? 'हिंदी' : 'Hindi';
  if (key === 'en' || key === 'english') return language === 'hi' ? 'अंग्रेज़ी' : 'English';
  return code;
}

type NotificationTranslationKey =
  | 'preferences.notifications.off'
  | 'preferences.notifications.on'
  | 'preferences.notifications.unread';

export function formatNotificationPreference(
  enabled: boolean,
  unreadCount = 0,
  t?: (key: NotificationTranslationKey, params?: Record<string, string | number>) => string,
) {
  if (!enabled) return t ? t('preferences.notifications.off') : 'Off';
  if (unreadCount > 0) {
    return t ? t('preferences.notifications.unread', { count: unreadCount }) : `${unreadCount} unread`;
  }
  return t ? t('preferences.notifications.on') : 'On';
}

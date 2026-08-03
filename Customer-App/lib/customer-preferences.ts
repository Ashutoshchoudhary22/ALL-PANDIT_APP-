export const CUSTOMER_LANGUAGE_OPTIONS = [
  { code: 'hi', label: 'Hindi' },
  { code: 'en', label: 'English' },
  { code: 'sa', label: 'Sanskrit' },
] as const;

const LANGUAGE_LABELS: Record<string, string> = {
  hi: 'Hindi',
  en: 'English',
  sa: 'Sanskrit',
  sanskrit: 'Sanskrit',
  hindi: 'Hindi',
  english: 'English',
};

export function formatCustomerLanguage(code?: string | null) {
  if (!code) return 'Hindi';
  const key = code.trim().toLowerCase();
  return LANGUAGE_LABELS[key] || code;
}

export function formatNotificationPreference(enabled: boolean, unreadCount = 0) {
  if (!enabled) return 'Off';
  if (unreadCount > 0) return `${unreadCount} unread`;
  return 'On';
}

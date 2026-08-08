const en = {
  'common.cancel': 'Cancel',
  'common.error': 'Error',

  'language.hi': 'Hindi',
  'language.en': 'English',

  'profile.section.preferences': 'Preferences',
  'profile.pref.language': 'Language',
  'profile.language.selectTitle': 'Select Language',
  'profile.language.selectMessage': 'Choose your preferred app language',
  'profile.language.englishHint': 'App will display in English',
  'profile.language.hindiHint': 'पूरा ऐप हिंदी में दिखेगा',
  'profile.language.errorFallback': 'Could not update language',
} as const;

export type TranslationKey = keyof typeof en;
export default en;

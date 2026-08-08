import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AppLanguage,
  DEFAULT_APP_LANGUAGE,
  TranslationKey,
  normalizeAppLanguage,
  readStoredAppLanguage,
  translate,
  writeStoredAppLanguage,
} from '@/constants/i18n';
import { useAuth } from '@/providers/AuthProvider';

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_APP_LANGUAGE);

  useEffect(() => {
    let cancelled = false;

    const hydrateLanguage = async () => {
      const fromUser = user?.languageCode ? normalizeAppLanguage(user.languageCode) : null;
      if (fromUser) {
        if (!cancelled) setLanguageState(fromUser);
        await writeStoredAppLanguage(fromUser);
        return;
      }

      const stored = await readStoredAppLanguage();
      if (!cancelled && stored) {
        setLanguageState(stored);
      }
    };

    void hydrateLanguage();

    return () => {
      cancelled = true;
    };
  }, [user?.languageCode]);

  const setLanguage = useCallback(async (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    await writeStoredAppLanguage(nextLanguage);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(language, key, params),
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export function useTranslation() {
  return useLanguage();
}

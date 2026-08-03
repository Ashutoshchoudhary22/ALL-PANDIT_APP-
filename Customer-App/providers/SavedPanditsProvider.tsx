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
  loadSavedPandits,
  saveSavedPandits,
  SavedPanditEntry,
} from '@/lib/saved-pandits-storage';
import { useAuth } from '@/providers/AuthProvider';
import { PublicPanditProfile } from '@/services/pandit-profile.api';

type SavedPanditsContextValue = {
  savedPandits: SavedPanditEntry[];
  savedCount: number;
  isLoading: boolean;
  isSaved: (panditId: number) => boolean;
  toggleSaved: (pandit: PublicPanditProfile) => Promise<boolean>;
  refreshSavedPandits: () => Promise<void>;
};

const SavedPanditsContext = createContext<SavedPanditsContextValue | null>(null);

export function SavedPanditsProvider({ children }: { children: ReactNode }) {
  const { token, user, isLoading: authLoading } = useAuth();
  const [savedPandits, setSavedPandits] = useState<SavedPanditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSavedPandits = useCallback(async () => {
    if (!token || user?.role !== 'customer' || !user.id) {
      setSavedPandits([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const items = await loadSavedPandits(user.id);
      setSavedPandits(items);
    } finally {
      setIsLoading(false);
    }
  }, [token, user?.id, user?.role]);

  useEffect(() => {
    if (authLoading) return;
    void refreshSavedPandits();
  }, [authLoading, refreshSavedPandits]);

  const isSaved = useCallback(
    (panditId: number) => savedPandits.some((item) => item.id === panditId),
    [savedPandits],
  );

  const toggleSaved = useCallback(
    async (pandit: PublicPanditProfile) => {
      if (!user?.id) return false;

      const exists = savedPandits.some((item) => item.id === pandit.id);
      const next = exists
        ? savedPandits.filter((item) => item.id !== pandit.id)
        : [{ ...pandit, savedAt: new Date().toISOString() }, ...savedPandits];

      setSavedPandits(next);
      await saveSavedPandits(user.id, next);
      return !exists;
    },
    [savedPandits, user?.id],
  );

  const value = useMemo(
    () => ({
      savedPandits,
      savedCount: savedPandits.length,
      isLoading,
      isSaved,
      toggleSaved,
      refreshSavedPandits,
    }),
    [savedPandits, isLoading, isSaved, toggleSaved, refreshSavedPandits],
  );

  return <SavedPanditsContext.Provider value={value}>{children}</SavedPanditsContext.Provider>;
}

export function useSavedPandits() {
  const ctx = useContext(SavedPanditsContext);
  if (!ctx) {
    throw new Error('useSavedPandits must be used within SavedPanditsProvider');
  }
  return ctx;
}

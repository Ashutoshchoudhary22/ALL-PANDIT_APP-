import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import {
  DEFAULT_PANDIT_FILTERS,
  PanditFilters,
  countActiveFilters,
} from '@/lib/pandit-filters';

type PanditFiltersContextValue = {
  filters: PanditFilters;
  draftFilters: PanditFilters;
  isOpen: boolean;
  activeCount: number;
  openFilters: () => void;
  closeFilters: () => void;
  setDraftFilters: (next: PanditFilters) => void;
  updateDraftFilters: (patch: Partial<PanditFilters>) => void;
  applyFilters: () => void;
  resetFilters: () => void;
};

const PanditFiltersContext = createContext<PanditFiltersContextValue | null>(null);

export function PanditFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<PanditFilters>(DEFAULT_PANDIT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<PanditFilters>(DEFAULT_PANDIT_FILTERS);
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<PanditFiltersContextValue>(
    () => ({
      filters,
      draftFilters,
      isOpen,
      activeCount: countActiveFilters(filters),
      openFilters: () => {
        setDraftFilters(filters);
        setIsOpen(true);
      },
      closeFilters: () => setIsOpen(false),
      setDraftFilters,
      updateDraftFilters: (patch) => setDraftFilters((current) => ({ ...current, ...patch })),
      applyFilters: () => {
        setFilters(draftFilters);
        setIsOpen(false);
      },
      resetFilters: () => {
        setDraftFilters(DEFAULT_PANDIT_FILTERS);
        setFilters(DEFAULT_PANDIT_FILTERS);
        setIsOpen(false);
      },
    }),
    [draftFilters, filters, isOpen],
  );

  return <PanditFiltersContext.Provider value={value}>{children}</PanditFiltersContext.Provider>;
}

export function usePanditFilters() {
  const context = useContext(PanditFiltersContext);
  if (!context) {
    throw new Error('usePanditFilters must be used within PanditFiltersProvider');
  }
  return context;
}

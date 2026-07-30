import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react';

import { AdminDrawer } from '@/components/AdminDrawer';

type AdminDrawerContextValue = {
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
};

const AdminDrawerContext = createContext<AdminDrawerContextValue | null>(null);

export function AdminDrawerProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  const openDrawer = useCallback(() => setVisible(true), []);
  const closeDrawer = useCallback(() => setVisible(false), []);
  const toggleDrawer = useCallback(() => setVisible((value) => !value), []);

  const value = useMemo(
    () => ({ openDrawer, closeDrawer, toggleDrawer }),
    [openDrawer, closeDrawer, toggleDrawer],
  );

  return (
    <AdminDrawerContext.Provider value={value}>
      {children}
      <AdminDrawer visible={visible} onClose={closeDrawer} />
    </AdminDrawerContext.Provider>
  );
}

export function useAdminDrawer() {
  const ctx = useContext(AdminDrawerContext);
  if (!ctx) throw new Error('useAdminDrawer must be used within AdminDrawerProvider');
  return ctx;
}

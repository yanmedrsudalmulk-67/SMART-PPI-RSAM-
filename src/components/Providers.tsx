import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface AppContextType {
  appLogoUrl: string | null;
  setAppLogoUrl: (url: string | null) => void;
  hospitalLogoUrl: string | null;
  setHospitalLogoUrl: (url: string | null) => void;
  userRole: string;
  setUserRole: (role: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ROLE_STORAGE_KEY = 'smart_ppi_role';
const SIDEBAR_STORAGE_KEY = 'smart_ppi_sidebar_open';

export function AppProvider({ children }: { children: ReactNode }) {
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
  const [hospitalLogoUrl, setHospitalLogoUrl] = useState<string | null>(null);
  const [userRole, setUserRoleState] = useState<string>('IPCN');
  const [isSidebarOpen, setIsSidebarOpenState] = useState<boolean>(true);

  // Pulihkan status sidebar & role login terakhir
  useEffect(() => {
    try {
      const savedRole = localStorage.getItem(ROLE_STORAGE_KEY);
      if (savedRole) setUserRoleState(savedRole);

      const savedSidebar = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (savedSidebar !== null) {
        setIsSidebarOpenState(savedSidebar === 'true');
      }
    } catch (e) {
      // ignore storage errors
    }
  }, []);

  const setIsSidebarOpen = useCallback((openOrFn: boolean | ((prev: boolean) => boolean)) => {
    setIsSidebarOpenState((prev) => {
      const next = typeof openOrFn === 'function' ? openOrFn(prev) : openOrFn;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const setUserRole = useCallback((role: string) => {
    setUserRoleState(role);
    try {
      if (role) {
        localStorage.setItem(ROLE_STORAGE_KEY, role);
      } else {
        localStorage.removeItem(ROLE_STORAGE_KEY);
        localStorage.removeItem('smart_ppi_user');
      }
    } catch (e) {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const { data: publicAppLogo } = supabase.storage.from('logos').getPublicUrl('public/app_logo.png');
        const { data: publicHospitalLogo } = supabase.storage.from('logos').getPublicUrl('public/hospital_logo.png');
        
        if (publicAppLogo?.publicUrl) setAppLogoUrl(publicAppLogo.publicUrl);
        if (publicHospitalLogo?.publicUrl) setHospitalLogoUrl(publicHospitalLogo.publicUrl);
      } catch (err) {
        console.error("Gagal memuat logo:", err);
      }
    };
    fetchLogos();
  }, []);

  const contextValue = useMemo(() => ({
    appLogoUrl, setAppLogoUrl,
    hospitalLogoUrl, setHospitalLogoUrl,
    userRole, setUserRole,
    isSidebarOpen, setIsSidebarOpen
  }), [appLogoUrl, hospitalLogoUrl, userRole, setUserRole, isSidebarOpen]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}

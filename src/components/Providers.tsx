import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AppContextType {
  appLogoUrl: string | null;
  setAppLogoUrl: (url: string | null) => void;
  hospitalLogoUrl: string | null;
  setHospitalLogoUrl: (url: string | null) => void;
  userRole: string;
  setUserRole: (role: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
  const [hospitalLogoUrl, setHospitalLogoUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('IPCN');

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

  return (
    <AppContext.Provider value={{ appLogoUrl, setAppLogoUrl, hospitalLogoUrl, setHospitalLogoUrl, userRole, setUserRole }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}

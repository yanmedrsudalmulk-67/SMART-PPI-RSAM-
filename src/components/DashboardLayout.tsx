import { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Activity, 
  FileText, 
  Settings, 
  Bell, 
  Menu,
  LogOut,
  Sun,
  Moon,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/components/Providers';
import { AppLogo } from '@/components/AppLogo';
import { ClockWidget } from '@/components/ClockWidget';
import { useDashboardStore } from '@/hooks/useDashboardStore';
import { supabase } from '@/lib/supabase';

const NavItem = memo(({ item, isActive, isLightMode }: { item: any, isActive: boolean, isLightMode?: boolean }) => (
  <Link 
    href={item.href}
    prefetch={false}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
      isActive 
        ? isLightMode
          ? 'bg-white/20 text-white border border-white/30'
          : 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
        : isLightMode
          ? 'text-white/70 hover:bg-white/10 hover:text-white'
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <div className={isActive ? 'animate-float' : ''}>
      <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? (isLightMode ? 'text-white' : 'text-blue-400') : ''}`} />
    </div>
    <span className="text-sm font-semibold">{item.name}</span>
  </Link>
));

NavItem.displayName = 'NavItem';

const navItems = [
  { name: 'Beranda', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Input', href: '/dashboard/input', icon: ClipboardCheck },
  { name: 'Analitik', href: '/dashboard/analytics', icon: Activity },
  { name: 'Laporan', href: '/dashboard/reports', icon: FileText },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = router.pathname;
  const { userRole, setUserRole, hospitalLogoUrl } = useAppContext();
  const { isDashboardLoaded, setDashboardData, isGlobalLoading, setIsGlobalLoading } = useDashboardStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    // Global Data Pre-fetching
    if (!isDashboardLoaded && !isGlobalLoading) {
      const loadGlobalData = async () => {
        setIsGlobalLoading(true);
        try {
          const currentYear = new Date().getFullYear();
          const startDate = new Date(currentYear - 1, 0, 1).toISOString(); // last year and current year
          
          const [slidesRes, stdRes, hhRes, apdRes, haisRes] = await Promise.all([
            supabase.from('dashboard_slider').select('*').order('sort_order', { ascending: true }),
            supabase.from('dashboard_standards').select('*'),
            supabase.from('audit_hand_hygiene').select('*'),
            supabase.from('audit_apd').select('*'),
            supabase.from('insiden_hais').select('*')
          ]);

          let newSlides: any[] = [];
          if (slidesRes.data) newSlides = slidesRes.data;

          const newRawData = {
            hh: hhRes.data || [],
            apd: apdRes.data || [],
            hais: haisRes.data || []
          };

          const newStandards: any = {
            hh: { indikator: 'Kebersihan Tangan', nilai_standar: 85, operator: '>=' },
            apd: { indikator: 'Kepatuhan Penggunaan APD', nilai_standar: 100, operator: '>=' },
            phlebitis: { indikator: 'Phlebitis', nilai_standar: 1.5, operator: '<=' },
            isk: { indikator: 'ISK', nilai_standar: 5, operator: '<=' },
            ido: { indikator: 'IDO', nilai_standar: 2, operator: '<=' },
            vap: { indikator: 'VAP', nilai_standar: 5, operator: '<=' }
          };
          if (stdRes.data) {
            stdRes.data.forEach(s => {
              const key = s.indikator.toLowerCase();
              newStandards[key] = s;
              // Aliases for common typos or variations to match dashboardpage logic
              if (key.includes('phle')) newStandards.phlebitis = s;
              else if (key.includes('isk')) newStandards.isk = s;
              else if (key.includes('ido')) newStandards.ido = s;
              else if (key.includes('vap')) newStandards.vap = s;
            });
          }

          setDashboardData({
            slides: newSlides,
            standards: newStandards,
            rawData: newRawData
          });
        } catch (e) {
          console.error("Global load error", e);
          setIsGlobalLoading(false);
        }
      };
      loadGlobalData();
    }
  }, [isDashboardLoaded, isGlobalLoading, setIsGlobalLoading, setDashboardData]);

  useEffect(() => {
    setMounted(true);
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsLightMode(true);
    }
    
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isLightMode) {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode, mounted]);

  if (!mounted) return null;

  return (
    <div className={`min-h-screen flex ${isLightMode ? 'bg-white text-slate-900' : 'bg-[#0a0f1c] text-slate-200'}`}>
      {/* Desktop Sidebar */}
      <AnimatePresence mode="wait">
        {!isMobile && isSidebarOpen && (
          <motion.aside 
            initial={false}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={`backdrop-blur-xl border-r flex flex-col fixed inset-y-0 left-0 z-20 shadow-2xl overflow-hidden ${isLightMode ? 'bg-[#006B3F] border-white/10 shadow-emerald-900/10' : 'bg-[#0f172a]/50 border-white/5'}`}
          >
            <div className={`h-16 flex items-center px-6 border-b shrink-0 ${isLightMode ? 'border-white/10' : 'border-white/5'}`}>
              <AppLogo className={`w-8 h-8 mr-3 ${isLightMode ? 'text-[#38C968]' : 'text-white'}`} iconClassName={`w-5 h-5 ${isLightMode ? 'text-white' : 'text-white'}`} />
              <span className={`font-heading font-bold text-xl tracking-widest transition-all ${isLightMode ? 'text-white' : 'text-[#3b82f6] drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]'}`}>
                SMART PPI
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
              <div className="mb-8 px-2">
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${isLightMode ? 'text-green-400' : 'text-slate-500'}`}>Menu Utama</p>
              </div>
              {navItems.map((item) => (
                <NavItem 
                  key={item.name} 
                  item={item} 
                  isActive={pathname === item.href} 
                  isLightMode={isLightMode}
                />
              ))}
            </div>            
            <div className={`p-6 border-t shrink-0 flex items-center justify-between ${isLightMode ? 'border-white/10' : 'border-white/5'}`}>
              <div className="flex items-center gap-2 opacity-50">
                <AppLogo className="w-5 h-5 text-white" iconClassName="w-3 h-3 text-white" />
                <span className={`text-[8px] font-bold uppercase tracking-widest ${isLightMode ? 'text-green-400' : 'text-slate-500'}`}>SMART PPI v1.0</span>
              </div>
              <Link 
                href="/login"
                prefetch={false}
                onClick={() => setUserRole('IPCN')}
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all group ${isLightMode ? 'text-green-300 hover:text-red-300' : 'text-slate-500 hover:text-red-400'}`}
              >
                <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                <span>Keluar</span>
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 ${!isMobile && isSidebarOpen ? 'ml-[260px]' : ''}`}>
        {/* Top Header */}
        <header className={`min-h-[56px] sm:h-16 py-2 sm:py-0 backdrop-blur-xl border-b flex items-center justify-between px-3 sm:px-6 sticky top-0 z-10 ${isLightMode ? 'bg-white/80 border-slate-200' : 'bg-[#0a0f1c]/50 border-white/5'}`}>
          <div className="flex items-center gap-2 sm:gap-4">
            {!isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 rounded-xl transition-colors ${isLightMode ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'}`}
                title="Toggle Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            {/* Clock Widget */}
            <ClockWidget isLightMode={isLightMode} />

            {/* Mobile Hospital Identity */}
            {isMobile && (
              <div className="flex items-center gap-2 sm:hidden px-1">
                <div className="w-9 h-9 md:w-10 md:h-10 flex-shrink-0 bg-white/5 border border-white/10 rounded-[10px] flex items-center justify-center overflow-hidden relative">
                  {hospitalLogoUrl ? (
                    <Image src={hospitalLogoUrl} alt="Logo RS" fill priority className="object-contain p-1" referrerPolicy="no-referrer" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                  )}
                </div>
                
                <div className="flex flex-col text-left">
                  <span className="font-heading font-bold text-sm tracking-wide text-white leading-tight">
                    UOBK RSUD AL-MULK
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-tight mt-0.5">
                    KOTA SUKABUMI
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4 z-50">
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className={`relative w-[84px] sm:w-[94px] h-[40px] sm:h-[48px] rounded-full p-1.5 flex items-center transition-all duration-500 ease-in-out cursor-pointer overflow-hidden ${
                !isLightMode 
                  ? 'bg-[#1e293b]/80 backdrop-blur-md shadow-inner border border-slate-700/50' 
                  : 'bg-white/80 backdrop-blur-md shadow-inner border border-white/80'
              }`}
              title="Toggle Tema"
            >
              <div className="absolute inset-0 w-full h-full pointer-events-none rounded-full shadow-inner opacity-50 mix-blend-overlay"></div>
              <div className={`absolute left-[12px] sm:left-[14px] top-1/2 -translate-y-1/2 transition-opacity duration-300 ${isLightMode ? 'opacity-100' : 'opacity-30'}`}>
                <Sun className={`w-4 h-4 sm:w-5 sm:h-5 ${!isLightMode ? 'text-slate-400' : 'text-[#0F3D2E]/50'}`} />
              </div>
              <div className={`absolute right-[12px] sm:right-[14px] top-1/2 -translate-y-1/2 transition-opacity duration-300 ${!isLightMode ? 'opacity-100' : 'opacity-30'}`}>
                <Moon className={`w-4 h-4 sm:w-5 sm:h-5 ${!isLightMode ? 'text-slate-600' : 'text-[#0F3D2E]'}`} />
              </div>

              <motion.div
                animate={{ 
                  x: !isLightMode ? (isMobile ? 44 : 46) : 0, 
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`relative h-[28px] w-[28px] sm:h-[36px] sm:w-[36px] flex items-center justify-center rounded-full shadow-lg z-10 transition-colors duration-500 ${!isLightMode ? 'bg-blue-600' : 'bg-[#38C968]'}`}
              >
                  {!isLightMode ? <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /> : <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
              </motion.div>
            </button>
            
            <button className={`hidden sm:block relative p-2 rounded-full transition-colors ${isLightMode ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'}`}>
              <Bell className="w-5 h-5" />
              <span className={`absolute top-2 right-2 w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full border-2 ${isLightMode ? 'border-white' : 'border-[#0a0f1c]'}`}></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8 relative">
          <div className="fixed top-[20%] right-[10%] w-[30%] h-[30%] bg-gradient-to-r from-blue-400 to-purple-500/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
          <div className="fixed bottom-[10%] left-[10%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
          
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className={`fixed bottom-0 inset-x-0 backdrop-blur-2xl border-t flex justify-around items-center h-16 px-2 z-50 transition-all ${isLightMode ? 'bg-[#006B3F] border-slate-100/20' : 'bg-[#0f172a]/80 border-white/5'}`}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                prefetch={false}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive 
                    ? isLightMode ? 'text-white' : 'text-blue-400' 
                    : isLightMode ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className={isActive ? 'animate-float' : ''}>
                  <item.icon className={`w-5 h-5 ${isActive ? (isLightMode ? '' : 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]') : ''}`} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

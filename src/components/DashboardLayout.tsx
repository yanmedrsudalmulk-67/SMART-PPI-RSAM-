import { useState, useEffect, memo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
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
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/components/Providers';
import { AppLogo } from '@/components/AppLogo';
import { ClockWidget } from '@/components/ClockWidget';
import { useDashboardStore } from '@/hooks/useDashboardStore';
import { supabase } from '@/lib/supabase';

const NavItem = memo(({ item, isActive, isLightMode, onClick }: { item: any, isActive: boolean, isLightMode?: boolean, onClick?: () => void }) => {
  const baseClasses = "relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ease-in-out group antialiased hover:scale-[1.02] active:scale-[0.98] transform-gpu will-change-transform";
  
  const activeClasses = isLightMode 
    ? "bg-white/20 border border-white/40 shadow-sm text-white font-bold ring-1 ring-white/50" 
    : "bg-white/10 border border-white/20 shadow-sm text-white font-bold ring-1 ring-white/20";
    
  const inactiveClasses = isLightMode
    ? "text-white/90 hover:bg-white/10 hover:text-white hover:shadow-md border border-transparent"
    : "text-white/70 hover:bg-white/10 hover:text-white hover:shadow-md border border-transparent";

  const iconBase = "w-[22px] h-[22px]";
  const iconActive = "text-white drop-shadow-md";
  const iconInactive = "text-white/80 group-hover:text-white transition-colors duration-300";

  return (
    <Link 
      href={item.href}
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {isActive && isLightMode && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
      )}
      {isActive && !isLightMode && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-emerald-400 rounded-r-full shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
      )}
      <motion.div 
        animate={isActive ? { y: [-2, 2, -2] } : { y: 0 }}
        transition={isActive ? { repeat: Infinity, duration: 3, ease: "easeInOut" } : { duration: 0.3 }}
        className={`relative z-10 flex items-center justify-center transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-lg' : 'group-hover:scale-110'}`}
      >
        <item.icon className={`${iconBase} ${isActive ? iconActive : iconInactive}`} strokeWidth={isActive ? 2.5 : 2} />
      </motion.div>
      <span className={`text-[15px] sm:text-[14px] tracking-wide relative z-10 ${isActive ? 'font-bold drop-shadow-md' : 'font-medium'}`}>{item.name}</span>
    </Link>
  );
});

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

  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      window.scrollTo(0, 0);
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
    };
    handleScroll();
    requestAnimationFrame(handleScroll);
    setTimeout(handleScroll, 10);
    setTimeout(handleScroll, 100);
    setTimeout(handleScroll, 300);
  }, [pathname]);

  useEffect(() => {
    // Global Data Pre-fetching
    if (!isDashboardLoaded && !isGlobalLoading) {
      const loadGlobalData = async () => {
        setIsGlobalLoading(true);
        try {
          const currentYear = new Date().getFullYear();
          const startDate = new Date(currentYear - 1, 0, 1).toISOString(); // last year and current year
          
          const [slidesRes, stdRes, hhRes, apdRes, haisRes, fapdRes, linenRes] = await Promise.all([
            supabase.from('dashboard_slider').select('*').order('sort_order', { ascending: true }),
            supabase.from('dashboard_standards').select('*'),
            supabase.from('audit_hand_hygiene').select('*'),
            supabase.from('audit_apd').select('*'),
            supabase.from('audit_sessions').select('*').eq('kategori', 'Surveilans HAIs'),
            supabase.from('monitoring_fasilitas_apd').select('*'),
            supabase.from('audit_penatalaksanaan_linen').select('*')
          ]);

          let newSlides: any[] = [];
          if (slidesRes.data && slidesRes.data.length > 0) {
            newSlides = slidesRes.data;
          } else {
            // Fallback to DEFAULT_SLIDES if table is empty or doesn't exist
            newSlides = []; 
          }

          const newRawData = {
            hh: hhRes.data || [],
            apd: apdRes.data || [],
            hais: haisRes.data || [],
            fasilitas_apd: fapdRes.data || [],
            linen: linenRes.data || []
          };

          const newStandards: any = {
            hh: { indikator: 'Kebersihan Tangan', nilai_standar: 85, operator: '>=' },
            apd: { indikator: 'Kepatuhan Penggunaan APD', nilai_standar: 100, operator: '>=' },
            phlebitis: { indikator: 'Phlebitis', nilai_standar: 1.5, operator: '<=' },
            isk: { indikator: 'ISK', nilai_standar: 5, operator: '<=' },
            ido: { indikator: 'IDO', nilai_standar: 2, operator: '<=' },
            vap: { indikator: 'VAP', nilai_standar: 5, operator: '<=' },
            fasilitas_apd: { indikator: 'Fasilitas APD', nilai_standar: 100, operator: '>=' },
            linen: { indikator: 'Penatalaksanaan Linen', nilai_standar: 100, operator: '>=' }
          };
          if (stdRes.data) {
            stdRes.data.forEach(s => {
              const key = s.indikator.toLowerCase();
              if (key.includes('tangan') || key === 'hh') newStandards.hh = { ...s, nilai_standar: s.nilai_standar <= 1 ? s.nilai_standar * 100 : s.nilai_standar };
              else if (key.includes('apd')) newStandards.apd = { ...s, nilai_standar: s.nilai_standar <= 1 ? s.nilai_standar * 100 : s.nilai_standar };
              else if (key.includes('phle')) newStandards.phlebitis = s;
              else if (key.includes('isk')) newStandards.isk = s;
              else if (key.includes('ido')) newStandards.ido = s;
              else if (key.includes('vap')) newStandards.vap = s;
              else if (key.includes('fasilitas') || key.includes('fapd')) newStandards.fasilitas_apd = s;
              else if (key.includes('linen')) newStandards.linen = s;
              else newStandards[key] = s;
            });
          }

          setDashboardData({
            slides: newSlides,
            standards: newStandards,
            rawData: newRawData
          });
        } catch (e) {
          console.error("Global load error", e);
        } finally {
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
    <div className={`h-[100dvh] w-screen overflow-hidden flex ${isLightMode ? 'bg-white text-slate-900' : 'bg-[#0a0f1c] text-slate-200'}`}>
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
          />
        )}
      </AnimatePresence>

      {/* Desktop & Mobile Sidebar Drawer */}
      <motion.aside 
        initial={false}
        animate={{ 
          x: isSidebarOpen ? 0 : -360,
          opacity: isSidebarOpen ? 1 : 0
        }}
        transition={{ 
          type: "spring",
          stiffness: 420,
          damping: 36,
          mass: 0.8
        }}
        className={`backdrop-blur-md border-r flex flex-col fixed inset-y-4 left-4 z-50 w-[280px] rounded-[24px] overflow-hidden transition-colors duration-500 print:hidden transform-gpu will-change-transform ${isLightMode ? 'bg-[linear-gradient(180deg,#10b981_0%,#059669_55%,#047857_100%)] text-white border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)]' : 'bg-[#0a0f1c]/95 border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]'}`}
      >
        <div className={`flex flex-col items-center justify-center pt-5 pb-4 border-b shrink-0 px-4 ${isLightMode ? 'border-white/5' : 'border-white/5'}`}>
          <div className="flex items-center justify-center w-[56px] h-[56px] rounded-[18px] shadow-sm bg-white/5 mb-3 border border-white/10 relative group">
            <AppLogo className="w-full h-full text-white group-hover:text-emerald-100 transition-colors" iconClassName="w-6 h-6 text-emerald-600 dark:text-[#0a0f1c]" />
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="font-heading font-[800] text-[18px] tracking-[1.5px] transition-all antialiased text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              SMART PPI
            </span>
            <span className={`text-[8px] whitespace-nowrap leading-[1.4] text-center mt-1 transition-all antialiased ${isLightMode ? 'text-white/80' : 'text-slate-400'}`}>
              Sistem Monitoring, Audit dan Supervisi Terintegrasi
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-sidebar-scrollbar">
          <div className="mb-5 px-1">
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] antialiased ${isLightMode ? 'text-white/90 drop-shadow-sm' : 'text-slate-500'}`}>Menu Utama</p>
          </div>
          {navItems.map((item) => (
            <NavItem 
              key={item.name} 
              item={item} 
              isActive={pathname === item.href} 
              isLightMode={isLightMode}
              onClick={() => { if (isMobile) setIsSidebarOpen(false); }}
            />
          ))}
        </div>            
        <div className="p-5 pt-2 mt-auto shrink-0 antialiased">
          <button 
            onClick={(e) => {
              e.preventDefault();
              setUserRole('');
              router.push('/login');
            }}
            className="flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl font-bold text-[14px] tracking-wide transition-all duration-300 group bg-red-500/20 hover:bg-red-500/40 text-white border border-red-500/30 hover:border-red-400/50 hover:shadow-[0_4px_20px_rgba(239,68,68,0.3)] hover:scale-[1.02] active:scale-[0.98]"
            title="Keluar"
          >
            <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" strokeWidth={2.5} />
            <span>Keluar</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col h-full min-w-0 overflow-hidden transition-[margin-left] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] print:ml-0 ${!isMobile && isSidebarOpen ? 'ml-[312px]' : 'ml-0'}`}>
        {/* Top Header */}
        <header className={`min-h-[64px] sm:h-20 shrink-0 border-b flex items-center justify-between px-4 sm:px-8 sticky top-0 z-[45] backdrop-blur-md transition-all duration-500 print:hidden ${
          isLightMode 
            ? 'bg-white/80 border-slate-200/60 shadow-sm' 
            : 'bg-[#0a0f1c]/80 border-white/5 shadow-[0_4px_20px_rgba(59,130,246,0.08)]'
        }`}>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-xl transition-colors hidden md:block ${isLightMode ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'}`}
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Clock Widget */}
            <ClockWidget isLightMode={isLightMode} />

            {/* Mobile Hospital Identity */}
            {isMobile && (
              <div className="flex items-center gap-2 sm:hidden px-1">
                <div className={`w-9 h-9 md:w-10 md:h-10 flex-shrink-0 rounded-[10px] flex items-center justify-center overflow-hidden relative border ${
                  isLightMode ? 'bg-slate-50 border-slate-200/80' : 'bg-white/5 border-white/10'
                }`}>
                  {hospitalLogoUrl ? (
                    <Image src={hospitalLogoUrl} alt="Logo RS" fill sizes="40px" priority className="object-contain p-1" referrerPolicy="no-referrer" />
                  ) : (
                    <ShieldCheck className={`w-5 h-5 md:w-6 md:h-6 ${isLightMode ? 'text-emerald-600' : 'text-blue-400'}`} />
                  )}
                </div>
                
                <div className="flex flex-col text-left">
                  <span className={`font-heading font-bold text-xs sm:text-sm tracking-wide leading-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    UOBK RSUD AL-MULK
                  </span>
                  <span className={`text-[8px] font-bold uppercase tracking-[0.2em] leading-tight mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
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
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 pb-32 sm:p-6 sm:pb-8 lg:p-8 relative overscroll-y-none [transform:translateZ(0)] will-change-scroll">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ type: "spring", stiffness: 450, damping: 30, mass: 0.8 }}
              className="w-full h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-5 inset-x-5 z-50 flex justify-center md:hidden pb-[env(safe-area-inset-bottom)]">
        <nav className={`w-full max-w-md flex justify-around items-center h-[72px] px-2 rounded-[36px] border backdrop-blur-xl transition-all duration-300 ${
          isLightMode 
            ? 'bg-white/40 border-white/60 shadow-[0_12px_40px_rgba(31,41,55,0.08),inset_0_1px_1px_rgba(255,255,255,0.7)]' 
            : 'bg-[#0a0f1c]/40 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15),_0_0_25px_rgba(16,185,129,0.05)]'
        }`}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className="relative flex-1 h-[56px] flex flex-col items-center justify-center transition-all duration-200 outline-none px-1"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileNavIndicator"
                    className={`absolute inset-x-1.5 inset-y-1.5 rounded-[22px] ${
                      isLightMode 
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border border-emerald-400/40 shadow-[0_4px_12px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]' 
                        : 'bg-gradient-to-br from-emerald-500/80 to-teal-600/80 backdrop-blur-md border border-emerald-400/30 shadow-[0_4px_16px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]'
                    }`}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                
                <div className={`relative z-10 flex flex-col items-center justify-center transition-all duration-200 ${
                  isActive ? 'scale-105 opacity-100' : 'opacity-70 hover:opacity-100'
                }`}>
                  <item.icon 
                    className={`w-[20px] h-[20px] transition-colors duration-200 ${
                      isActive 
                        ? 'text-white drop-shadow-md' 
                        : (isLightMode ? 'text-slate-600' : 'text-slate-300')
                    }`} 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                  <span className={`text-[9px] font-semibold tracking-wide mt-1 transition-colors duration-200 ${
                    isActive 
                      ? 'text-white font-bold drop-shadow-sm' 
                      : (isLightMode ? 'text-slate-500 font-medium' : 'text-slate-400 font-medium')
                  }`}>
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

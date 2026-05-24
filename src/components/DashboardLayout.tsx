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

const NavItem = memo(({ item, isActive, isLightMode, onClick }: { item: any, isActive: boolean, isLightMode?: boolean, onClick?: () => void }) => {
  const baseClasses = "relative flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 ease-out group antialiased";
  
  const activeClasses = isLightMode 
    ? "bg-[#10B981]/12 border border-[#10B981]/25 backdrop-blur-[12px] shadow-[0_0_20px_rgba(16,185,129,0.15)] text-white font-[700]" 
    : "bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 text-white shadow-[0_4px_20px_rgba(16,185,129,0.15)] font-[700]";
    
  const inactiveClasses = isLightMode
    ? "text-[rgba(255,255,255,0.92)] hover:bg-white/10 hover:text-white hover:translate-x-1"
    : "text-[rgba(255,255,255,0.8)] hover:bg-white/10 hover:text-white hover:translate-x-1";

  const iconBase = "w-[20px] h-[20px]";
  const iconActive = "text-white";
  const iconInactive = "text-[rgba(255,255,255,0.88)] group-hover:text-white";

  return (
    <Link 
      href={item.href}
      prefetch={false}
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {isActive && isLightMode && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#34D399] rounded-r-full shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
      )}
      {isActive && !isLightMode && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-cyan-500 shadow-[0_0_8px_rgba(52,211,153,0.5)] rounded-r-full" />
      )}
      <div className={`relative z-10 flex items-center justify-center transition-transform duration-300 ${isActive ? 'animate-float' : 'group-hover:scale-110'}`}>
        <item.icon className={`${iconBase} ${isActive ? iconActive : iconInactive}`} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      <span className={`text-[15px] sm:text-[13px] tracking-wide relative z-10 ${isActive ? 'font-bold' : 'font-semibold'}`}>{item.name}</span>
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
    <div className={`min-h-screen flex ${isLightMode ? 'bg-white text-slate-900' : 'bg-[#0a0f1c] text-slate-200'}`}>
      {/* Desktop & Mobile Sidebar Drawer */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <>
            {isMobile && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
              />
            )}
            <motion.aside 
              initial={false}
              animate={{ width: isMobile ? '82%' : 280, maxWidth: isMobile ? 320 : 280, opacity: 1, x: 0 }}
              exit={{ width: isMobile ? '82%' : 0, maxWidth: isMobile ? 320 : 280, opacity: 0, x: isMobile ? '-100%' : 0 }}
              className={`backdrop-blur-xl border-r flex flex-col fixed inset-y-4 left-4 z-50 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] overflow-hidden transition-colors duration-500 print:hidden ${isLightMode ? 'bg-[linear-gradient(180deg,#10b981_0%,#059669_55%,#047857_100%)] text-white border-white/10' : 'bg-[#0a0f1c]/80 border-white/5 shadow-black/50'}`}
            >
            <div className={`flex flex-col items-center justify-center pt-5 pb-4 border-b shrink-0 px-4 ${isLightMode ? 'border-white/5' : 'border-white/5'}`}>
              <div className="flex items-center justify-center w-[56px] h-[56px] rounded-[18px] shadow-[0_10px_30px_rgba(0,0,0,0.12)] bg-white/5 backdrop-blur-md mb-3 border border-white/10 relative group">
                <AppLogo className="w-full h-full text-white group-hover:text-emerald-100 transition-colors" iconClassName="w-6 h-6 text-emerald-600 dark:text-[#0a0f1c]" />
              </div>
              <div className="flex flex-col items-center text-center">
                <span className={`font-heading font-[800] text-[16px] tracking-[1px] transition-all antialiased text-white ${isLightMode ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.12)]' : 'drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]'}`}>
                  SMART PPI
                </span>
                <span className={`text-[8px] whitespace-nowrap leading-[1.4] text-center mt-1 transition-all antialiased ${isLightMode ? 'text-[rgba(255,255,255,0.72)]' : 'text-slate-400'}`}>
                  Sistem Monitoring, Audit dan Supervisi Terintegrasi
                </span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto py-5 px-4 space-y-1 custom-sidebar-scrollbar">
              <div className="mb-4 px-1">
                <p className={`text-[10px] font-bold uppercase tracking-widest antialiased ${isLightMode ? 'text-[rgba(255,255,255,0.92)]' : 'text-slate-500'}`}>Menu Utama</p>
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
            <div className="p-4 pt-2 mt-auto shrink-0 antialiased">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setUserRole('');
                  router.push('/login');
                }}
                className={`flex items-center justify-center gap-2 w-full p-3 rounded-xl font-[600] text-[15px] sm:text-[13px] tracking-wide transition-all group ${isLightMode ? 'bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(239,68,68,0.12)] text-[#FFFFFF] border border-[rgba(255,255,255,0.10)]' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'}`}
                title="Keluar"
              >
                <LogOut className={`w-4 h-4 transition-transform group-hover:-translate-x-1 ${isLightMode ? 'text-[#FFFFFF]' : ''}`} strokeWidth={2.5} />
                <span>Keluar</span>
              </button>
            </div>
          </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 print:ml-0 ${!isMobile && isSidebarOpen ? 'ml-[312px]' : ''}`}>
        {/* Top Header */}
        <header className={`min-h-[56px] sm:h-20 py-2 sm:py-0 backdrop-blur-xl border-b flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10 transition-colors duration-500 print:hidden ${isLightMode ? 'bg-white/80 border-slate-100 shadow-sm' : 'bg-[#0a0f1c]/80 border-white/5 shadow-md'}`}>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-xl transition-colors hidden sm:block ${isLightMode ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'}`}
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Clock Widget */}
            <ClockWidget isLightMode={isLightMode} />

            {/* Mobile Hospital Identity */}
            {isMobile && (
              <div className="flex items-center gap-2 sm:hidden px-1">
                <div className="w-9 h-9 md:w-10 md:h-10 flex-shrink-0 bg-white/5 border border-white/10 rounded-[10px] flex items-center justify-center overflow-hidden relative">
                  {hospitalLogoUrl ? (
                    <Image src={hospitalLogoUrl} alt="Logo RS" fill sizes="40px" priority className="object-contain p-1" referrerPolicy="no-referrer" />
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <div className="fixed top-[20%] right-[10%] w-[30%] h-[30%] bg-gradient-to-r from-blue-400 to-purple-500/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
          <div className="fixed bottom-[10%] left-[10%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
          
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className={`fixed bottom-0 inset-x-0 backdrop-blur-2xl border-t flex justify-around items-center h-16 px-2 z-40 transition-all ${isLightMode ? 'bg-emerald-600 border-emerald-500' : 'bg-[#0a0f1c]/90 border-white/10'}`}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                prefetch={false}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive 
                    ? isLightMode ? 'text-white' : 'text-emerald-400' 
                    : isLightMode ? 'text-white/70 hover:text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className={`relative transition-transform duration-300 ${isActive ? 'scale-110 animate-float' : ''}`}>
                  <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
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

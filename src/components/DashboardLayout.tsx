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
  Menu,
  LogOut,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/components/Providers';
import { AppLogo } from '@/components/AppLogo';
import { ClockWidget } from '@/components/ClockWidget';
import { useDashboardStore } from '@/hooks/useDashboardStore';
import { supabase } from '@/lib/supabase';

const NavItem = memo(({ item, isActive, onClick }: { item: any, isActive: boolean, onClick?: () => void }) => {
  const baseClasses = "relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ease-in-out group antialiased hover:scale-[1.02] active:scale-[0.98] transform-gpu will-change-transform";
  
  const activeClasses = "bg-white/10 border border-white/20 shadow-sm text-white font-bold ring-1 ring-white/20";
  const inactiveClasses = "text-white/70 hover:bg-white/10 hover:text-white hover:shadow-md border border-transparent";

  const iconBase = "w-[22px] h-[22px]";
  const iconActive = "text-white drop-shadow-md";
  const iconInactive = "text-white/80 group-hover:text-white transition-colors duration-300";

  return (
    <Link 
      href={item.href}
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {isActive && (
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
  const { setUserRole, hospitalLogoUrl } = useAppContext();
  const { isDashboardLoaded, setDashboardData, isGlobalLoading, setIsGlobalLoading } = useDashboardStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

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
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="h-[100dvh] w-screen overflow-hidden flex bg-gradient-to-br from-[#130b29] via-[#0a0f1c] to-[#09152b] text-slate-200">
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
          x: isSidebarOpen ? 0 : (isMobile ? -360 : -280),
          opacity: (isSidebarOpen || !isMobile) ? 1 : 0
        }}
        transition={{ 
          type: "spring",
          stiffness: 450,
          damping: 40,
          mass: 0.8
        }}
        className="border-r flex flex-col fixed inset-y-4 left-4 z-50 w-[280px] rounded-[24px] transition-colors duration-500 print:hidden transform-gpu will-change-transform backdrop-blur-[40px] bg-white/[0.02] border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
      >
        {/* New Elegant Toggle Button on the Right Border */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center border shadow-md transition-all duration-300 z-50 group hidden md:flex bg-[#151f32] border-white/10 text-emerald-400 hover:bg-[#1e2c45] hover:border-emerald-400/40"
          title={isSidebarOpen ? "Minimize Sidebar" : "Expand Sidebar"}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-500 ${isSidebarOpen ? 'rotate-0' : 'rotate-180'}`} />
        </button>

        <div className="flex flex-col items-center justify-center pt-5 pb-4 border-b shrink-0 px-4 relative border-white/5">
          <div className="flex items-center justify-center w-[56px] h-[56px] rounded-[18px] shadow-sm bg-white/5 mb-3 border border-white/10 relative group">
            <AppLogo className="w-full h-full text-white group-hover:text-emerald-100 transition-colors" iconClassName="w-6 h-6 text-emerald-600 dark:text-[#0a0f1c]" />
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="font-heading font-[800] text-[18px] tracking-[1.5px] transition-all antialiased text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              SMART PPI
            </span>
            <span className="text-[8px] whitespace-nowrap leading-[1.4] text-center mt-1 transition-all antialiased text-slate-400">
              Sistem Monitoring, Audit dan Supervisi Terintegrasi
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-sidebar-scrollbar">
          <div className="mb-5 px-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] antialiased text-slate-500">Menu Utama</p>
          </div>
          {navItems.map((item) => (
            <NavItem 
              key={item.name} 
              item={item} 
              isActive={pathname === item.href} 
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
      <div className={`flex-1 flex flex-col h-full min-w-0 overflow-hidden transition-[margin-left] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] print:ml-0 ${
        !isMobile ? (isSidebarOpen ? 'ml-[312px]' : 'ml-[40px]') : 'ml-0'
      }`}>
        {/* Top Header */}
        <header className="min-h-[64px] sm:h-20 shrink-0 border-b flex items-center justify-between px-4 sm:px-8 sticky top-0 z-[45] transition-all duration-500 print:hidden backdrop-blur-[40px] bg-white/[0.02] border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Mobile Hamburger Menu Toggle */}
            {!navItems.some(item => item.href === pathname) && !pathname.startsWith('/dashboard/input') && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden p-2 -ml-2 rounded-lg transition-colors text-slate-400 hover:bg-white/5"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}

            {/* Clock Widget */}
            <ClockWidget />

            {/* Mobile Hospital Identity */}
            {isMobile && (
              <div className="flex items-center gap-2 sm:hidden px-1">
                <div className="w-9 h-9 md:w-10 md:h-10 flex-shrink-0 rounded-[10px] flex items-center justify-center overflow-hidden relative border bg-white/5 border-white/10">
                  {hospitalLogoUrl ? (
                    <Image src={hospitalLogoUrl} alt="Logo RS" fill sizes="40px" priority className="object-contain p-1" referrerPolicy="no-referrer" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                  )}
                </div>
                
                <div className="flex flex-col text-left">
                  <span className="font-heading font-bold text-xs sm:text-sm tracking-wide leading-tight text-white">
                    UOBK RSUD AL-MULK
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] leading-tight mt-0.5 text-slate-400">
                    KOTA SUKABUMI
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4 z-50">
            {/* Theme toggle and notifications removed for clean dark design and optimal speed */}
          </div>
        </header>

        {/* Page Content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 pb-56 sm:p-6 sm:pb-8 lg:p-8 relative overscroll-y-none [transform:translateZ(0)] will-change-scroll">
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
        <nav className="w-full max-w-md flex justify-around items-center h-[72px] px-2 rounded-[36px] border backdrop-blur-xl transition-all duration-300 bg-[#0a0f1c]/40 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15),_0_0_25px_rgba(16,185,129,0.05)]">
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
                    className="absolute inset-x-1.5 inset-y-1.5 rounded-[22px] bg-gradient-to-br from-emerald-500/80 to-teal-600/80 backdrop-blur-md border border-emerald-400/30 shadow-[0_4px_16px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]"
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
                        : 'text-slate-300'
                    }`} 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                  <span className={`text-[9px] font-semibold tracking-wide mt-1 transition-colors duration-200 ${
                    isActive 
                      ? 'text-white font-bold drop-shadow-sm' 
                      : 'text-slate-400 font-medium'
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

import { useState, useEffect, memo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Activity, 
  BarChart2,
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
  const baseClasses = "relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ease-in-out group antialiased hover:scale-[1.01] active:scale-[0.98] transform-gpu will-change-transform";
  
  // Vibrant Royal Blue active styling matching the "Input Sekarang" button with realistic 3D dark shadow and specular highlight
  const activeClasses = "bg-[#2563EB] bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white font-bold border border-blue-400/40 shadow-[0_10px_22px_-4px_rgba(0,0,0,0.45),0_4px_8px_-2px_rgba(0,0,0,0.35),0_0_15px_rgba(37,99,235,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.35),inset_0_-1px_1.5px_rgba(0,0,0,0.25)]";
  const inactiveClasses = "text-slate-300/90 hover:bg-white/10 hover:text-white border border-transparent";

  const iconBase = "w-[22px] h-[22px]";
  const iconActive = "text-white";
  const iconInactive = "text-slate-400 group-hover:text-white transition-colors duration-300";

  return (
    <Link 
      href={item.href}
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      <motion.div 
        animate={isActive ? { 
          y: [0, -8, 0, -4, 0],
          scale: [1, 1.15, 1, 1.08, 1],
        } : { 
          y: 0,
          scale: 1,
        }}
        transition={isActive ? { 
          duration: 0.8,
          repeat: Infinity,
          repeatDelay: 4.2, // Cycles every 5 seconds (0.8s jump + 4.2s delay = 5.0s)
          ease: "easeInOut"
        } : { duration: 0.2 }}
        className={`relative z-10 flex items-center justify-center transition-transform duration-300 ${isActive ? 'scale-105' : 'group-hover:scale-110'}`}
      >
        <item.icon className={`${iconBase} ${isActive ? iconActive : iconInactive}`} strokeWidth={isActive ? 2.3 : 2} />
      </motion.div>
      <span className={`text-[15px] sm:text-[14px] tracking-wide relative z-10 ${isActive ? 'font-bold text-white' : 'font-medium'}`}>{item.name}</span>
    </Link>
  );
});

NavItem.displayName = 'NavItem';

const navItems = [
  { name: 'Dashboard', shortName: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Input Data', shortName: 'Input', href: '/dashboard/input', icon: ClipboardCheck },
  { name: 'Grafik Capaian', shortName: 'Grafik', href: '/dashboard/analytics', icon: BarChart2 },
  { name: 'Laporan PPI', shortName: 'Laporan', href: '/dashboard/reports', icon: FileText },
  { name: 'Pengaturan', shortName: 'Pengaturan', href: '/dashboard/settings', icon: Settings },
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
            // Preload active slider images in parallel in the background
            newSlides.forEach((slide: any) => {
              if (slide.image_url && slide.active && typeof window !== "undefined") {
                const img = new window.Image();
                img.src = slide.image_url;
                img.referrerPolicy = "no-referrer";
              }
            });
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

    // Warm up and prefetch routes to prevent route change aborts
    navItems.forEach((item) => {
      try {
        router.prefetch(item.href);
      } catch (e) {
        // ignore prefetch errors
      }
    });
  }, [mounted, router]);

  if (!mounted) return null;

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex bg-[#091526] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.18),rgba(255,255,255,0))] bg-[radial-gradient(circle_at_85%_20%,rgba(2,132,199,0.22),transparent_45%)] bg-[radial-gradient(circle_at_10%_80%,rgba(30,64,175,0.25),transparent_50%)] text-slate-200 relative">
      {/* Subtle Ambient Steel-Cyan Background Glow Accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-200 backdrop-blur-sm"
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
        className="border flex flex-col fixed inset-y-4 left-4 z-50 w-[280px] rounded-[24px] transition-colors duration-500 print:hidden transform-gpu will-change-transform backdrop-blur-xl bg-[#0A192F]/98 border-[#1B3B6F]/70 shadow-[0_12px_45px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.12)]"
      >
        {/* Toggle Button on the Right Border */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center border shadow-lg transition-all duration-300 z-50 group hidden md:flex bg-[#0D2140] border-[#254E86] text-sky-400 hover:bg-[#14325E] hover:border-sky-300 hover:scale-110"
          title={isSidebarOpen ? "Minimize Sidebar" : "Expand Sidebar"}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-500 ${isSidebarOpen ? 'rotate-0' : 'rotate-180'}`} />
        </button>

        <div className="flex flex-col items-center justify-center pt-5 pb-4 border-b shrink-0 px-4 relative border-[#1B3B6F]/60 bg-[#0F2445]/60 rounded-t-[23px]">
          <div className="flex items-center justify-center w-[56px] h-[56px] mb-3 relative group">
            <AppLogo className="w-full h-full text-white group-hover:text-sky-200 transition-colors" iconClassName="w-7 h-7 text-sky-400" />
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="font-heading font-[800] text-[18px] tracking-[1.5px] transition-all antialiased text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
              SMART PPI
            </span>
            <span className="text-[8.5px] whitespace-nowrap leading-[1.4] text-center mt-1 transition-all antialiased text-sky-200/70 font-medium">
              Sistem Monitoring, Audit dan Supervisi Terintegrasi
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-sidebar-scrollbar">
          <div className="mb-5 px-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] antialiased text-sky-400/80">Menu Utama</p>
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
              router.push('/');
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
        {/* Page Content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-32 sm:pb-10 relative overscroll-y-none [transform:translateZ(0)] will-change-scroll w-full max-w-full">
          {/* Header Khusus Mode Portrait untuk Seluruh Menu (Dashboard, Input, Grafik, Laporan, Pengaturan) */}
          <div className="flex sm:hidden flex-col mb-4 print:hidden">
            <div className="flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center relative">
                  {hospitalLogoUrl ? (
                    <img src={hospitalLogoUrl} alt="Logo RS" className="w-full h-full object-contain" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 transition-colors duration-500 text-sky-400" />
                  )}
                </div>
                
                <div className="flex flex-col text-left transition-colors duration-500">
                  <span className="font-heading font-bold text-[13px] tracking-wide leading-tight transition-colors duration-500 text-white">
                    UOBK RSUD AL-MULK
                  </span>
                  <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 text-slate-400">
                    KOTA SUKABUMI
                  </span>
                </div>
              </div>

              <div className="shrink-0 scale-90 origin-right">
                <ClockWidget />
              </div>
            </div>

            {/* Garis Pembatas Tipis Gradasi Biru-Ungu Animasi Menyala */}
            <div className="relative w-full mt-3">
              <div className="h-[2px] w-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 via-purple-500 to-sky-400 bg-[length:200%_auto] animate-gradient shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
              <div className="absolute inset-0 h-[2px] w-full rounded-full bg-gradient-to-r from-sky-400 via-purple-400 to-blue-500 blur-[2px] opacity-80 animate-pulse" />
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full h-full max-w-full overflow-x-hidden transform-gpu"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-5 inset-x-5 z-50 flex justify-center md:hidden pb-[env(safe-area-inset-bottom)]">
        <nav className="w-full max-w-md flex justify-around items-center h-[72px] px-2 rounded-[36px] border backdrop-blur-xl transition-all duration-300 bg-[#0B1A2C]/95 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.15)]">
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
                    className="absolute inset-x-1.5 inset-y-1.5 rounded-[22px] bg-[#2563EB] bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] border border-blue-400/40 shadow-[0_8px_18px_-3px_rgba(0,0,0,0.45),0_3px_6px_-2px_rgba(0,0,0,0.35),0_0_12px_rgba(37,99,235,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.35),inset_0_-1px_1.5px_rgba(0,0,0,0.25)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                
                <div className={`relative z-10 flex flex-col items-center justify-center transition-all duration-200 ${
                  isActive ? 'scale-105 opacity-100' : 'opacity-75 hover:opacity-100'
                }`}>
                  <motion.div
                    animate={isActive ? { 
                      y: [0, -6, 0, -3, 0],
                      scale: [1, 1.15, 1, 1.08, 1],
                    } : { 
                      y: 0,
                      scale: 1,
                    }}
                    transition={isActive ? { 
                      duration: 0.8,
                      repeat: Infinity,
                      repeatDelay: 4.2,
                      ease: "easeInOut"
                    } : { duration: 0.2 }}
                  >
                    <item.icon 
                      className={`w-[20px] h-[20px] transition-colors duration-200 ${
                        isActive 
                          ? 'text-white' 
                          : 'text-slate-300'
                      }`} 
                      strokeWidth={isActive ? 2.3 : 2} 
                    />
                  </motion.div>
                  <span className={`text-[9px] font-semibold tracking-wide mt-1 transition-colors duration-200 ${
                    isActive 
                      ? 'text-white font-bold' 
                      : 'text-slate-400 font-medium'
                  }`}>
                    {item.shortName || item.name}
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

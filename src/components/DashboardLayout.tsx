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

interface NavTheme {
  bg: string;
  shadow: string;
  border: string;
}

interface NavItemData {
  name: string;
  shortName: string;
  href: string;
  icon: any;
  theme: NavTheme;
}

const navItems: NavItemData[] = [
  { 
    name: 'Dashboard', 
    shortName: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard,
    theme: {
      bg: "bg-gradient-to-br from-sky-500 to-blue-600",
      shadow: "shadow-[2px_3px_8px_rgba(0,0,0,0.35)]",
      border: "border-sky-400/40"
    }
  },
  { 
    name: 'Input Data', 
    shortName: 'Input', 
    href: '/dashboard/input', 
    icon: ClipboardCheck,
    theme: {
      bg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      shadow: "shadow-[2px_3px_8px_rgba(0,0,0,0.35)]",
      border: "border-emerald-400/40"
    }
  },
  { 
    name: 'Grafik Capaian', 
    shortName: 'Grafik', 
    href: '/dashboard/analytics', 
    icon: BarChart2,
    theme: {
      bg: "bg-gradient-to-br from-purple-500 to-indigo-600",
      shadow: "shadow-[2px_3px_8px_rgba(0,0,0,0.35)]",
      border: "border-purple-400/40"
    }
  },
  { 
    name: 'Laporan PPI', 
    shortName: 'Laporan', 
    href: '/dashboard/reports', 
    icon: FileText,
    theme: {
      bg: "bg-gradient-to-br from-amber-500 to-orange-600",
      shadow: "shadow-[2px_3px_8px_rgba(0,0,0,0.35)]",
      border: "border-amber-400/40"
    }
  },
  { 
    name: 'Pengaturan', 
    shortName: 'Pengaturan', 
    href: '/dashboard/settings', 
    icon: Settings,
    theme: {
      bg: "bg-gradient-to-br from-rose-500 to-pink-600",
      shadow: "shadow-[2px_3px_8px_rgba(0,0,0,0.35)]",
      border: "border-rose-400/40"
    }
  },
];

const NavItem = memo(({ item, isActive, onClick }: { item: NavItemData, isActive: boolean, onClick?: () => void }) => {
  const baseClasses = "relative flex items-center gap-3.5 px-3.5 py-3 rounded-[20px] transition-all duration-300 ease-out group antialiased transform-gpu will-change-transform";
  
  // 3D Neumorphic Active Plate with rich extruded tactile elevation
  const activeClasses = "bg-gradient-to-b from-[#f8fafc] via-[#e2e8f0] to-[#cbd5e1] text-[#1e293b] border border-white/90 shadow-[-3px_-3px_9px_rgba(255,255,255,0.35),4px_5px_16px_rgba(0,0,0,0.55),inset_1.5px_1.5px_2px_rgba(255,255,255,1),inset_-1.5px_-1.5px_2px_rgba(0,0,0,0.12)]";
  const inactiveClasses = "text-slate-300/85 hover:bg-[#18193b]/70 hover:text-white border border-transparent shadow-none hover:shadow-[-2px_-2px_6px_rgba(140,165,255,0.05),3px_3px_8px_rgba(0,0,0,0.4)]";

  return (
    <Link 
      href={item.href}
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {/* Matte Colorful Icon - 3D Squircle with Tactile Shadow */}
      <motion.div 
        animate={isActive ? { 
          y: [0, -9, 0, -4, 0],
          scale: [1, 1.14, 1, 1.06, 1],
        } : { 
          y: 0,
          scale: 1,
        }}
        transition={isActive ? { 
          duration: 0.8,
          repeat: Infinity,
          repeatDelay: 4.2, // Cycles every 5.0 seconds (0.8s jump + 4.2s delay = 5.0s)
          ease: "easeInOut"
        } : { duration: 0.2 }}
        className="relative z-10 flex items-center justify-center flex-shrink-0"
      >
        <div className={`relative w-[38px] h-[38px] rounded-[13px] flex items-center justify-center text-white border ${item.theme.bg} ${item.theme.border} ${isActive ? 'shadow-[-2px_-2px_6px_rgba(255,255,255,0.3),3px_3px_8px_rgba(0,0,0,0.45),inset_1px_1px_1.5px_rgba(255,255,255,0.4),inset_-1px_-1px_1.5px_rgba(0,0,0,0.2)]' : item.theme.shadow} overflow-hidden transform-gpu`}>
          <item.icon className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] relative z-10" strokeWidth={2.4} />
        </div>
      </motion.div>

      {/* Text label with high legibility */}
      <span className={`text-[14px] tracking-wide relative z-10 transition-colors duration-200 ${
        isActive 
          ? 'font-black text-[#1e293b] drop-shadow-[0_0.5px_0_rgba(255,255,255,0.8)]' 
          : 'font-bold text-slate-300/90 group-hover:text-white'
      }`}>
        {item.name}
      </span>
    </Link>
  );
});

NavItem.displayName = 'NavItem';

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
    <div className="h-[100dvh] w-full overflow-hidden flex bg-gradient-to-b from-[#181938] via-[#12142e] to-[#0c0d20] text-slate-100 relative">
      {/* Subtle Ambient Deep Indigo-Purple Radial Glow Accent */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-700/12 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="absolute top-1/3 right-0 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-700/12 rounded-full blur-[170px] pointer-events-none z-0" />

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
          x: isSidebarOpen ? 0 : (isMobile ? -360 : -274),
          opacity: (isSidebarOpen || !isMobile) ? 1 : 0
        }}
        transition={{ 
          type: "spring",
          stiffness: 450,
          damping: 40,
          mass: 0.8
        }}
        className="fixed inset-y-4 left-4 z-50 w-[280px] print:hidden transform-gpu will-change-transform pointer-events-auto"
      >
        {/* Main Inner Card with Glass/Border/Shadow & overflow-hidden */}
        <div className="flex flex-col h-full w-full rounded-[30px] transition-colors duration-500 backdrop-blur-2xl bg-gradient-to-b from-[#1c183a] via-[#14172f] to-[#0c0e1e] border border-[#2b2d56] shadow-[-6px_-6px_20px_rgba(140,165,255,0.08),12px_14px_36px_rgba(0,0,0,0.75),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] overflow-hidden relative">
          {/* Top Bevel Highlight */}
          <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none z-20" />

          <div className="flex flex-col items-center justify-center pt-6 pb-5 border-b shrink-0 px-4 relative border-indigo-900/40 bg-[#141532]/70 backdrop-blur-md rounded-t-[29px]">
            {/* 3D Neumorphic Floating SMART PPI Logo (No Box Container) */}
            <div className="relative mb-3 flex items-center justify-center transition-transform duration-300 hover:scale-105">
              <AppLogo 
                className="w-14 h-14 md:w-[68px] md:h-[68px] drop-shadow-[-3px_-3px_8px_rgba(140,165,255,0.2)] drop-shadow-[5px_8px_16px_rgba(0,0,0,0.85)] filter transition-all duration-300" 
                iconClassName="w-11 h-11 md:w-[54px] md:h-[54px] text-cyan-400 drop-shadow-[-2px_-2px_6px_rgba(140,165,255,0.25)] drop-shadow-[4px_7px_14px_rgba(0,0,0,0.9)]"
                imageClassName="drop-shadow-[-3px_-3px_8px_rgba(140,165,255,0.2)] drop-shadow-[5px_8px_16px_rgba(0,0,0,0.85)]"
              />
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="font-heading font-[800] text-[18px] tracking-[1.5px] transition-all antialiased text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
                SMART PPI
              </span>
              <span className="text-[8.5px] whitespace-nowrap leading-[1.4] text-center mt-1 transition-all antialiased text-indigo-200/80 font-bold uppercase tracking-wider">
                Sistem Monitoring & Audit Terpadu
              </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto py-5 px-3.5 space-y-2 custom-sidebar-scrollbar">
            <div className="mb-4 px-2">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] antialiased text-indigo-300/80">Menu Utama</p>
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
          <div className="p-4 pt-2 mt-auto shrink-0 antialiased">
            <button 
              onClick={(e) => {
                e.preventDefault();
                setUserRole('');
                router.push('/');
              }}
              className="flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-2xl font-black text-[12px] uppercase tracking-wider transition-all duration-300 group bg-gradient-to-r from-red-600/25 via-rose-600/20 to-red-700/25 hover:from-red-600/40 hover:to-rose-600/40 text-red-200 border border-red-500/35 shadow-[-2px_-2px_6px_rgba(255,100,100,0.08),4px_6px_16px_rgba(0,0,0,0.5),inset_1px_1px_1.5px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98]"
              title="Keluar"
            >
              <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" strokeWidth={2.5} />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Premium Vertical Scroll Handle Bar Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-4 h-20 rounded-r-xl flex flex-col items-center justify-center gap-1.5 border border-l-0 border-indigo-500/60 bg-gradient-to-b from-[#222452] via-[#161838] to-[#0e1026] text-cyan-300 shadow-[4px_0_16px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.3)] hover:border-cyan-400 hover:text-white hover:shadow-[0_0_18px_rgba(6,182,212,0.6)] hover:w-5 hover:-right-4.5 transition-all duration-300 z-[60] group hidden md:flex cursor-pointer"
          title={isSidebarOpen ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
          aria-label={isSidebarOpen ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
        >
          {/* Top Tactile Scroll Grip Bar */}
          <div className="w-1.5 h-0.5 rounded-full bg-cyan-400/80 group-hover:bg-cyan-300 transition-colors shadow-[0_0_4px_rgba(6,182,212,0.6)]" />
          
          {/* Chevron Indicator */}
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-500 ${isSidebarOpen ? 'rotate-0' : 'rotate-180'}`} />
          
          {/* Bottom Tactile Scroll Grip Bar */}
          <div className="w-1.5 h-0.5 rounded-full bg-cyan-400/80 group-hover:bg-cyan-300 transition-colors shadow-[0_0_4px_rgba(6,182,212,0.6)]" />
        </button>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col h-full min-w-0 overflow-hidden transition-[margin-left] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] print:ml-0 ${
        !isMobile ? (isSidebarOpen ? 'ml-[312px]' : 'ml-[64px]') : 'ml-0'
      }`}>
        {/* Page Content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-32 sm:pb-10 relative overscroll-y-none [transform:translateZ(0)] will-change-scroll w-full max-w-full z-10">
          {/* Header Desktop saat Sidebar Minimized */}
          {!isMobile && !isSidebarOpen && (
            <div className="mb-6 flex items-center justify-between gap-4 p-3.5 px-5 rounded-2xl bg-[#141532]/80 border border-indigo-900/40 backdrop-blur-md shadow-[-4px_-4px_12px_rgba(140,165,255,0.06),6px_8px_20px_rgba(0,0,0,0.6)] print:hidden">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                    {hospitalLogoUrl ? (
                      <img src={hospitalLogoUrl} alt="Logo RS" className="w-full h-full object-contain" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-indigo-300" />
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-heading font-bold text-xs tracking-wide text-white leading-tight">
                      UOBK RSUD AL-MULK
                    </span>
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-indigo-200/80">
                      KOTA SUKABUMI
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <ClockWidget />
              </div>
            </div>
          )}

          {/* Header Khusus Mode Portrait untuk Seluruh Menu (Dashboard, Input, Grafik, Laporan, Pengaturan) */}
          <div className="flex sm:hidden flex-col mb-4 print:hidden">
            <div className="flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center relative">
                  {hospitalLogoUrl ? (
                    <img src={hospitalLogoUrl} alt="Logo RS" className="w-full h-full object-contain" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 transition-colors duration-500 text-indigo-300" />
                  )}
                </div>
                
                <div className="flex flex-col text-left transition-colors duration-500">
                  <span className="font-heading font-bold text-[13px] tracking-wide leading-tight transition-colors duration-500 text-white">
                    UOBK RSUD AL-MULK
                  </span>
                  <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 text-indigo-200/80">
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

      {/* Mobile Bottom Navigation - Neumorphic (Neuromorphism) Bar with 3D Tactile Squircle Icons */}
      <div className="fixed bottom-4 inset-x-3 sm:inset-x-5 z-50 flex justify-center md:hidden pb-[env(safe-area-inset-bottom)]">
        <nav className="w-full max-w-md flex justify-around items-center h-[76px] px-2.5 py-1.5 rounded-[30px] border border-white/10 bg-gradient-to-b from-[#1c1f40]/95 via-[#13162f]/95 to-[#0b0d1e]/95 backdrop-blur-2xl shadow-[-6px_-6px_18px_rgba(140,165,255,0.08),8px_8px_24px_rgba(0,0,0,0.8),inset_1px_1px_2px_rgba(255,255,255,0.15),inset_-1.5px_-1.5px_2px_rgba(0,0,0,0.6)]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link 
                key={item.name} 
                href={item.href}
                className="relative flex-1 h-[62px] flex flex-col items-center justify-center transition-all duration-200 outline-none px-0.5"
              >
                {/* Neumorphic Extruded Active Plate Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="mobileNavIndicatorWhite"
                    className="absolute inset-x-1 inset-y-1 rounded-[22px] bg-gradient-to-b from-[#f8fafc] via-[#e2e8f0] to-[#cbd5e1] border border-white/90 shadow-[-2px_-2px_7px_rgba(255,255,255,0.3),4px_4px_12px_rgba(0,0,0,0.5),inset_1.5px_1.5px_2px_rgba(255,255,255,1),inset_-1.5px_-1.5px_2px_rgba(0,0,0,0.12)]"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                
                <motion.div 
                  animate={isActive ? { 
                    y: [0, -7, 0, -3, 0],
                    scale: [1, 1.12, 1, 1.05, 1],
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
                  className={`relative z-10 flex flex-col items-center justify-center transition-all duration-200 ${
                    isActive ? 'scale-105' : 'opacity-85 hover:opacity-100 active:scale-95'
                  }`}
                >
                  {/* Neumorphic 3D Squircle Icon */}
                  <div className={`relative w-[34px] h-[34px] rounded-[11px] flex items-center justify-center text-white border ${item.theme.bg} ${item.theme.border} shadow-[-2px_-2px_6px_rgba(255,255,255,0.25),3px_3px_8px_rgba(0,0,0,0.45),inset_1px_1px_1.5px_rgba(255,255,255,0.4),inset_-1px_-1px_1.5px_rgba(0,0,0,0.2)] overflow-hidden transform-gpu`}>
                    <item.icon className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] relative z-10" strokeWidth={2.4} />
                  </div>

                  {/* Neumorphic Embossed Text */}
                  <span className={`text-[9.5px] tracking-tight mt-1 transition-colors duration-200 ${
                    isActive 
                      ? 'text-[#1e293b] font-black drop-shadow-[0_0.5px_0_rgba(255,255,255,0.7)]' 
                      : 'text-slate-400 font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                  }`}>
                    {item.shortName || item.name}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

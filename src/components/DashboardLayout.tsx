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
  LogOut,
  ShieldCheck,
  ChevronLeft,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/components/Providers';
import { AppLogo } from '@/components/AppLogo';
import { ClockWidget } from '@/components/ClockWidget';
import MobilePortraitNavBar from '@/components/MobilePortraitNavBar';
import { useDashboardStore } from '@/hooks/useDashboardStore';
import { supabase } from '@/lib/supabase';

interface NavSubItemData {
  name: string;
  href: string;
  badge?: string;
}

interface NavItemData {
  name: string;
  shortName?: string;
  href: string;
  icon: any;
  subItems?: NavSubItemData[];
}

const navItems: NavItemData[] = [
  { 
    name: 'Dashboard', 
    shortName: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard,
  },
  { 
    name: 'Input Data', 
    shortName: 'Input', 
    href: '/dashboard/input', 
    icon: ClipboardCheck,
  },
  { 
    name: 'Grafik Capaian', 
    shortName: 'Grafik', 
    href: '/dashboard/analytics', 
    icon: BarChart2,
  },
  { 
    name: 'Laporan PPI', 
    shortName: 'Laporan', 
    href: '/dashboard/reports', 
    icon: FileText,
    subItems: [
      { name: 'Rekap Laporan PPI', href: '/dashboard/reports' },
      { name: 'Laporan PPI', href: '/dashboard/reports/resmi' },
      { name: 'Bukti Supervisi', href: '/dashboard/reports/supervisi' },
    ]
  },
  { 
    name: 'Pengaturan', 
    shortName: 'Pengaturan', 
    href: '/dashboard/settings', 
    icon: Settings,
  },
];

const NavItem = memo(({ 
  item, 
  isActive, 
  isCollapsed, 
  pathname,
  onExpandSidebar,
  onClick 
}: { 
  item: NavItemData; 
  isActive: boolean; 
  isCollapsed: boolean; 
  pathname: string;
  onExpandSidebar?: () => void;
  onClick?: () => void;
}) => {
  const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
  const isAnySubActive = hasSubItems && item.subItems!.some(s => pathname === s.href || (s.href !== '/dashboard/reports' && pathname.startsWith(s.href)));
  
  // Auto open dropdown if on its subpages
  const [isOpen, setIsOpen] = useState(isAnySubActive || pathname.startsWith(item.href));

  useEffect(() => {
    if (isAnySubActive || pathname.startsWith(item.href)) {
      setIsOpen(true);
    }
  }, [pathname, isAnySubActive, item.href]);

  const baseClasses = isCollapsed
    ? "relative flex items-center justify-center w-12 h-12 mx-auto rounded-[18px] transition-all duration-300 ease-out group antialiased transform-gpu will-change-transform cursor-pointer"
    : "relative flex items-center justify-between w-full px-4 py-3 rounded-[22px] transition-all duration-300 ease-out group antialiased transform-gpu will-change-transform cursor-pointer";
  
  // Neumorphic Active Plate matching theme
  const activeClasses = "bg-gradient-to-r from-[#272952] via-[#1e2044] to-[#141535] text-white border border-indigo-400/40 shadow-[-3px_-3px_9px_rgba(140,165,255,0.15),5px_6px_16px_rgba(0,0,0,0.65),inset_1px_1px_1.5px_rgba(255,255,255,0.25),inset_-1px_-1px_2px_rgba(0,0,0,0.4)]";
  const inactiveClasses = "text-slate-300/80 hover:text-white hover:bg-[#18193b]/70 border border-transparent shadow-none hover:shadow-[-2px_-2px_6px_rgba(140,165,255,0.05),3px_3px_8px_rgba(0,0,0,0.4)]";

  const handleParentClick = (e: React.MouseEvent) => {
    if (hasSubItems) {
      if (isCollapsed) {
        onExpandSidebar?.();
        setIsOpen(true);
      } else {
        setIsOpen(!isOpen);
      }
    } else {
      onClick?.();
    }
  };

  return (
    <div className="w-full">
      {hasSubItems ? (
        <button
          type="button"
          onClick={handleParentClick}
          title={item.name}
          className={`${baseClasses} ${isActive || isAnySubActive ? activeClasses : inactiveClasses}`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <motion.div 
              animate={isActive || isAnySubActive ? { 
                scale: 1.06,
              } : { 
                scale: 1,
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-10 flex items-center justify-center flex-shrink-0 w-8 h-8"
            >
              <item.icon 
                className={`w-6 h-6 transition-all duration-300 relative z-10 ${
                  isActive || isAnySubActive
                    ? 'text-cyan-400 drop-shadow-[2px_3px_4px_rgba(0,0,0,0.9)] drop-shadow-[0_0_12px_rgba(6,182,212,0.7)]' 
                    : 'text-slate-300/85 group-hover:text-cyan-300 drop-shadow-[1.5px_2px_3px_rgba(0,0,0,0.85)]'
                }`} 
                strokeWidth={2.2} 
              />
            </motion.div>

            {!isCollapsed && (
              <span className={`text-[14px] tracking-wide relative z-10 transition-colors duration-200 truncate ${
                isActive || isAnySubActive 
                  ? 'font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]' 
                  : 'font-bold text-slate-300/80 group-hover:text-white'
              }`}>
                {item.name}
              </span>
            )}
          </div>
        </button>
      ) : (
        <Link 
          href={item.href}
          onClick={onClick}
          title={item.name}
          prefetch={true}
          scroll={false}
          className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <motion.div 
              animate={isActive ? { 
                scale: 1.06,
              } : { 
                scale: 1,
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-10 flex items-center justify-center flex-shrink-0 w-8 h-8"
            >
              <item.icon 
                className={`w-6 h-6 transition-all duration-300 relative z-10 ${
                  isActive 
                    ? 'text-cyan-400 drop-shadow-[2px_3px_4px_rgba(0,0,0,0.9)] drop-shadow-[0_0_12px_rgba(6,182,212,0.7)]' 
                    : 'text-slate-300/85 group-hover:text-cyan-300 drop-shadow-[1.5px_2px_3px_rgba(0,0,0,0.85)]'
                }`} 
                strokeWidth={2.2} 
              />
            </motion.div>

            {!isCollapsed && (
              <span className={`text-[14px] tracking-wide relative z-10 transition-colors duration-200 truncate ${
                isActive 
                  ? 'font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]' 
                  : 'font-bold text-slate-300/80 group-hover:text-white'
              }`}>
                {item.name}
              </span>
            )}
          </div>
        </Link>
      )}

      {/* Dropdown Sub-menu matching User Reference Image 1 */}
      {hasSubItems && !isCollapsed && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden pl-7 pr-1 pt-1.5 pb-1 space-y-1.5 relative before:content-[''] before:absolute before:left-[24px] before:top-2 before:bottom-3 before:w-[2px] before:bg-indigo-500/35 before:rounded-full"
            >
              {item.subItems!.map((sub) => {
                const isSubActive = pathname === sub.href;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={onClick}
                    prefetch={true}
                    scroll={false}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] transition-all duration-200 group/sub relative ${
                      isSubActive
                        ? 'text-cyan-300 font-extrabold bg-[#18193b]/70 border border-indigo-500/30 shadow-none'
                        : 'text-slate-300/80 hover:text-white hover:bg-[#18193b]/40 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                        isSubActive 
                          ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] scale-110' 
                          : 'bg-indigo-400/50 group-hover/sub:bg-cyan-400'
                      }`} />
                      <span className="truncate">{sub.name}</span>
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
});

NavItem.displayName = 'NavItem';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = router.pathname;
  const { userRole, setUserRole, hospitalLogoUrl, isSidebarOpen, setIsSidebarOpen } = useAppContext();
  const { isDashboardLoaded, setDashboardData, isGlobalLoading, setIsGlobalLoading } = useDashboardStore();
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Akun IPCLN memiliki akses terbatas: menu Pengaturan disembunyikan
  const isIPCLN = userRole === 'IPCLN';
  const visibleNavItems = isIPCLN ? navItems.filter((item) => !item.href.startsWith('/dashboard/settings')) : navItems;

  // Cegah IPCLN membuka halaman Pengaturan lewat URL langsung
  useEffect(() => {
    if (isIPCLN && pathname.startsWith('/dashboard/settings')) {
      router.replace('/dashboard');
    }
  }, [isIPCLN, pathname, router]);

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
            newSlides = slidesRes.data.map((s: any, idx: number) => {
              let url = s.image_url || '/uploads/public/slider/slider_1787961366248.png';
              if (url.includes('/storage/v1/object/public/')) {
                const rel = url.split('/storage/v1/object/public/')[1]?.split('?')[0];
                if (rel) url = `/uploads/${rel}`;
              }
              return {
                ...s,
                image_url: url,
                active: s.active === undefined ? true : s.active === true || s.active === 1 || s.active === '1' || s.active === 'true',
                sort_order: Number(s.sort_order) || idx + 1,
              };
            });
            try {
              localStorage.setItem('spp_slides', JSON.stringify(newSlides));
            } catch (e) {}
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
      const isPortrait = typeof window !== 'undefined' && (window.matchMedia("(orientation: portrait)").matches || window.innerHeight > window.innerWidth);
      const isTabletOrPhone = typeof window !== 'undefined' && window.innerWidth <= 1024;
      const mobile = typeof window !== 'undefined' && (window.innerWidth < 768 || (isTabletOrPhone && isPortrait));
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('orientationchange', checkScreenSize);

    const handleScrollTopEvent = () => {
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
        mainRef.current.scrollLeft = 0;
      }
    };
    window.addEventListener('smart_ppi_scroll_top', handleScrollTopEvent);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('orientationchange', checkScreenSize);
      window.removeEventListener('smart_ppi_scroll_top', handleScrollTopEvent);
    };
  }, [setIsSidebarOpen]);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');

    // Warm up and prefetch routes once with low priority after mount
    const timer = setTimeout(() => {
      navItems.forEach((item) => {
        try {
          router.prefetch(item.href);
        } catch (e) {
          // ignore prefetch errors
        }
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex bg-gradient-to-b from-[#181938] via-[#12142e] to-[#0c0d20] text-slate-100 relative">
      {/* Subtle Ambient Deep Blue-Purple Radial Glow Accent - Hardware Optimized */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(6,182,212,0.08)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(99,102,241,0.09)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(67,56,202,0.08)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* Mobile Backdrop Overlay - Portrait mode uses bottom nav */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/70 z-40 transition-opacity duration-200 backdrop-blur-sm portrait:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop & Landscape Sidebar Drawer (Collapsible to Mini Icon Sidebar) */}
      <motion.aside 
        initial={false}
        animate={{ 
          x: isMobile ? (isSidebarOpen ? 0 : -360) : 0,
          width: isMobile ? 280 : (isSidebarOpen ? 280 : 80),
          opacity: (isSidebarOpen || !isMobile) ? 1 : 0
        }}
        transition={{ 
          duration: 0.24,
          ease: [0.16, 1, 0.3, 1]
        }}
        className={`fixed inset-y-4 left-4 z-50 print:hidden sidebar-layer-gpu fps-optimized pointer-events-auto select-none portrait:hidden landscape:block ${
          isMobile ? 'w-[280px]' : (isSidebarOpen ? 'w-[280px]' : 'w-[80px]')
        }`}
      >
        {/* Main Inner Card with Glass/Border/Shadow & overflow-hidden */}
        <div className="flex flex-col h-full w-full rounded-[30px] transition-colors duration-300 backdrop-blur-md bg-gradient-to-b from-[#1c183a]/95 via-[#14172f]/95 to-[#0c0e1e] border border-[#2b2d56] shadow-[-6px_-6px_20px_rgba(140,165,255,0.08),12px_14px_36px_rgba(0,0,0,0.75),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] overflow-hidden relative">
          {/* Top Bevel Highlight */}
          <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none z-20" />

          {/* Logo Section */}
          <div className={`flex flex-col items-center justify-center border-b shrink-0 relative border-indigo-900/40 bg-[#141532]/70 backdrop-blur-md rounded-t-[29px] transition-all duration-300 ${
            !isSidebarOpen && !isMobile ? 'pt-4 pb-4 px-2' : 'pt-6 pb-5 px-4'
          }`}>
            {/* 3D Neumorphic Floating SMART PPI Logo */}
            <div className={`relative flex items-center justify-center transition-transform duration-300 hover:scale-105 ${
              !isSidebarOpen && !isMobile ? 'mb-0' : 'mb-3'
            }`}>
              <AppLogo 
                className={`${!isSidebarOpen && !isMobile ? 'w-11 h-11' : 'w-14 h-14 md:w-[68px] md:h-[68px]'} drop-shadow-[-3px_-3px_8px_rgba(140,165,255,0.2)] drop-shadow-[5px_8px_16px_rgba(0,0,0,0.85)] filter transition-all duration-300`} 
                iconClassName={`${!isSidebarOpen && !isMobile ? 'w-8 h-8' : 'w-11 h-11 md:w-[54px] md:h-[54px]'} text-cyan-400 drop-shadow-[-2px_-2px_6px_rgba(140,165,255,0.25)] drop-shadow-[4px_7px_14px_rgba(0,0,0,0.9)]`}
                imageClassName="drop-shadow-[-3px_-3px_8px_rgba(140,165,255,0.2)] drop-shadow-[5px_8px_16px_rgba(0,0,0,0.85)]"
              />
            </div>
            {(isSidebarOpen || isMobile) && (
              <div className="flex flex-col items-center text-center">
                <span className="font-heading font-[800] text-[18px] tracking-[1.5px] transition-all antialiased text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
                  SMART PPI
                </span>
                <span className="text-[8.5px] whitespace-nowrap leading-[1.4] text-center mt-1 transition-all antialiased text-indigo-200/80 font-bold uppercase tracking-wider">
                  Sistem Monitoring & Audit Terpadu
                </span>
              </div>
            )}
          </div>
          
          {/* Navigation Items */}
          <div className={`flex-1 overflow-y-auto py-5 space-y-2.5 custom-sidebar-scrollbar ${
            !isSidebarOpen && !isMobile ? 'px-2' : 'px-3.5'
          }`}>
            {(isSidebarOpen || isMobile) ? (
              <div className="mb-4 px-2">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] antialiased text-indigo-300/80">Menu Utama</p>
              </div>
            ) : (
              <div className="mb-3 mx-auto w-6 h-[1.5px] bg-indigo-500/25 rounded-full" />
            )}
            {visibleNavItems.map((item) => (
              <NavItem 
                key={item.name} 
                item={item} 
                isActive={pathname === item.href} 
                isCollapsed={!isSidebarOpen && !isMobile}
                pathname={pathname}
                onExpandSidebar={() => setIsSidebarOpen(true)}
                onClick={() => { if (isMobile) setIsSidebarOpen(false); }}
              />
            ))}
          </div>            

          {/* Keluar Button */}
          <div className={`pt-2 mt-auto shrink-0 antialiased ${
            !isSidebarOpen && !isMobile ? 'p-2 pb-4' : 'p-4'
          }`}>
            <button 
              onClick={(e) => {
                e.preventDefault();
                setUserRole('');
                router.push('/');
              }}
              title="Keluar"
              className={`flex items-center justify-center transition-all duration-300 group bg-gradient-to-r from-red-600/25 via-rose-600/20 to-red-700/25 hover:from-red-600/40 hover:to-rose-600/40 text-red-200 border border-red-500/35 shadow-[-2px_-2px_6px_rgba(255,100,100,0.08),4px_6px_16px_rgba(0,0,0,0.5),inset_1px_1px_1.5px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98] ${
                !isSidebarOpen && !isMobile 
                  ? 'w-12 h-12 mx-auto rounded-[18px] p-0' 
                  : 'gap-3 w-full py-3.5 px-4 rounded-2xl font-black text-[12px] uppercase tracking-wider'
              }`}
            >
              <LogOut className={`transition-transform duration-300 group-hover:-translate-x-0.5 ${!isSidebarOpen && !isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} strokeWidth={2.5} />
              {(isSidebarOpen || isMobile) && <span>Keluar</span>}
            </button>
          </div>
        </div>

        {/* Circular Sidebar Toggle Button - Centered & Touch Friendly */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsSidebarOpen(!isSidebarOpen);
          }}
          className="absolute -right-4 sm:-right-4.5 top-1/2 -translate-y-1/2 w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-full flex items-center justify-center border border-indigo-400/60 bg-gradient-to-b from-[#252858] via-[#17193c] to-[#0d0f26] text-cyan-300 shadow-[0_4px_16px_rgba(0,0,0,0.65),inset_1px_1px_2px_rgba(255,255,255,0.25)] hover:border-cyan-400 hover:text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.65)] hover:scale-105 active:scale-90 transition-all duration-150 z-[60] group hidden landscape:flex cursor-pointer touch-manipulation select-none before:content-[''] before:absolute before:-inset-3 before:rounded-full before:z-10"
          title={isSidebarOpen ? "Sembunyikan Label (Icon Saja)" : "Buka Menu Lengkap"}
          aria-label={isSidebarOpen ? "Sembunyikan Label (Icon Saja)" : "Buka Menu Lengkap"}
        >
          {/* Chevron Indicator */}
          <ChevronLeft className={`w-4 h-4 sm:w-4.5 sm:h-4.5 text-cyan-300 group-hover:text-cyan-100 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${isSidebarOpen ? 'rotate-0' : 'rotate-180'}`} strokeWidth={2.5} />
        </button>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col h-full min-w-0 overflow-hidden transition-[margin-left] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[margin-left] print:ml-0 ${
        !isMobile ? (isSidebarOpen ? 'ml-[312px]' : 'ml-[112px]') : 'ml-0'
      }`}>
        {/* Page Content */}
        <main 
          ref={mainRef} 
          className={`flex-1 overflow-y-auto overflow-x-hidden ${
            pathname.startsWith('/dashboard/reports/supervisi')
              ? 'p-2 sm:p-3 lg:p-3.5'
              : 'p-4 sm:p-6 lg:p-8'
          } pb-32 sm:pb-10 relative scroll-container-120fps w-full max-w-full z-10 ${
            pathname.startsWith('/dashboard/reports/resmi') ? 'resmi-report-scroll-container' : ''
          }`}
        >
          {/* Header Desktop & Landscape saat Sidebar Minimized */}
          <AnimatePresence>
            {!isMobile && !isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="mb-6 flex items-center justify-between gap-4 p-3.5 px-5 rounded-2xl bg-[#141532]/80 border border-indigo-900/40 backdrop-blur-md shadow-[-4px_-4px_12px_rgba(140,165,255,0.06),6px_8px_20px_rgba(0,0,0,0.6)] print:hidden landscape:hidden"
              >
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

                <div className="flex items-center gap-3">
                  <ClockWidget />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header Khusus Mode Mobile & Tablet Portrait */}
          <div className="flex landscape:hidden portrait:flex flex-col mb-4 print:hidden">
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

              <div className="flex items-center gap-2 shrink-0 scale-90 origin-right">
                <ClockWidget />
              </div>
            </div>

            {/* Garis Pembatas Tipis Gradasi Biru-Ungu Animasi Menyala */}
            <div className="relative w-full mt-3">
              <div className="h-[2px] w-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 via-purple-500 to-sky-400 bg-[length:200%_auto] animate-gradient shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
              <div className="absolute inset-0 h-[2px] w-full rounded-full bg-gradient-to-r from-sky-400 via-purple-400 to-blue-500 blur-[2px] opacity-80 animate-pulse" />
            </div>
          </div>

          <div
            key={pathname}
            className="w-full h-full max-w-full overflow-x-hidden"
          >
            {isIPCLN && pathname.startsWith('/dashboard/settings') ? null : children}
          </div>
        </main>
      </div>

      {/* Mobile & Tablet Portrait Bottom Navigation - Design matching reference image */}
      <MobilePortraitNavBar currentPath={pathname} hideSettings={isIPCLN} />
    </div>
  );
}

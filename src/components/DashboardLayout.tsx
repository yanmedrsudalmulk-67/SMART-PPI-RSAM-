import {
  useState,
  useEffect,
  useLayoutEffect,
  memo,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import Link from 'next/link';
import Router from 'next/router';
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import {
  LayoutDashboard,
  ClipboardCheck,
  BarChart2,
  FileText,
  Settings,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronDown,
} from 'lucide-react';
import { useAppContext, useSidebar } from '@/components/Providers';
import { AppLogo } from '@/components/AppLogo';
import { ClockWidget } from '@/components/ClockWidget';
import MobilePortraitNavBar from '@/components/MobilePortraitNavBar';
import { useDashboardStore } from '@/hooks/useDashboardStore';
import { supabase } from '@/lib/supabase';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

type ViewportMode = 'portrait' | 'tablet-landscape' | 'desktop';

const SIDEBAR_EXPANDED_W = 280;
const SIDEBAR_COLLAPSED_W = 80;
const SIDEBAR_DELTA = SIDEBAR_EXPANDED_W - SIDEBAR_COLLAPSED_W; // 200px
const DESKTOP_MARGIN_OPEN = 312; // 16px left + 280px sidebar + 16px gap
const DESKTOP_MARGIN_CLOSED = 112; // 16px left + 80px rail + 16px gap
const TABLET_MARGIN_FIXED = 104; // 16px left + 80px rail + 8px gap
const ANIM_DURATION_MS = 240;
const ANIM_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

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
    name: 'ICRA & KLB',
    shortName: 'ICRA & KLB',
    href: '/dashboard/icra',
    icon: ShieldAlert,
    subItems: [
      { name: 'ICRA PPI', href: '/dashboard/icra' },
      { name: 'Investigasi KLB', href: '/dashboard/klb' },
    ],
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
      { name: 'Laporan ICRA', href: '/dashboard/reports/icra' },
    ],
  },
  {
    name: 'Pengaturan',
    shortName: 'Pengaturan',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

function detectViewportMode(): ViewportMode {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  const h = window.innerHeight;
  const isPortrait =
    window.matchMedia('(orientation: portrait)').matches || h > w;
  if (isPortrait || w < 768) return 'portrait';
  if (w < 1280) return 'tablet-landscape';
  return 'desktop';
}

/**
 * Isolated 120Hz/144Hz GPU route-change progress indicator.
 * Subscribes to Router.events internally so DashboardLayout & page children never re-render.
 */
const RouteProgressBar = memo(function RouteProgressBar() {
  const [state, setState] = useState<'idle' | 'loading' | 'finishing'>('idle');
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      if (doneTimerRef.current) {
        clearTimeout(doneTimerRef.current);
        doneTimerRef.current = null;
      }
    };

    const handleStart = (url: string) => {
      if (url === Router.asPath) return;
      clearTimers();
      // Only reveal progress bar if transition takes > 70ms (instant cached transitions stay invisible)
      showTimerRef.current = setTimeout(() => {
        setState('loading');
      }, 70);
    };

    const handleDone = () => {
      clearTimers();
      setState((prev) => {
        if (prev === 'idle') return 'idle';
        doneTimerRef.current = setTimeout(() => setState('idle'), 200);
        return 'finishing';
      });
    };

    Router.events.on('routeChangeStart', handleStart);
    Router.events.on('routeChangeComplete', handleDone);
    Router.events.on('routeChangeError', handleDone);

    return () => {
      clearTimers();
      Router.events.off('routeChangeStart', handleStart);
      Router.events.off('routeChangeComplete', handleDone);
      Router.events.off('routeChangeError', handleDone);
    };
  }, []);

  if (state === 'idle') return null;

  return (
    <div
      className="fixed top-0 inset-x-0 h-[2.5px] z-[9999] pointer-events-none print:hidden"
      aria-hidden="true"
    >
      <div
        className="h-full w-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-sky-300 route-progress-bar"
        style={{
          transform:
            state === 'loading'
              ? 'scaleX(0.72) translateZ(0)'
              : 'scaleX(1) translateZ(0)',
          opacity: state === 'finishing' ? 0 : 1,
        }}
      />
    </div>
  );
});

const NavItem = memo(function NavItem({
  item,
  isActive,
  isCollapsed,
  effectivePath,
  onExpandSidebar,
  onNavigate,
  onPrefetch,
}: {
  item: NavItemData;
  isActive: boolean;
  isCollapsed: boolean;
  effectivePath: string;
  onExpandSidebar: () => void;
  onNavigate: (href: string) => void;
  onPrefetch: (href: string) => void;
}) {
  const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
  const isAnySubActive =
    hasSubItems &&
    item.subItems!.some(
      (s) =>
        effectivePath === s.href ||
        (s.href !== '/dashboard/reports' && effectivePath.startsWith(s.href))
    );

  const [isOpen, setIsOpen] = useState(
    isAnySubActive || effectivePath.startsWith(item.href)
  );

  useEffect(() => {
    if (isAnySubActive || effectivePath.startsWith(item.href)) {
      setIsOpen(true);
    }
  }, [effectivePath, isAnySubActive, item.href]);

  const highlighted = isActive || isAnySubActive;
  const IconComp = item.icon;

  const handleParentClick = () => {
    if (hasSubItems) {
      if (isCollapsed) {
        onExpandSidebar();
        setIsOpen(true);
      } else {
        setIsOpen((prev) => !prev);
      }
    } else {
      onNavigate(item.href);
    }
  };

  const handleParentHover = () => {
    if (hasSubItems) {
      item.subItems?.forEach((sub) => onPrefetch(sub.href));
    } else {
      onPrefetch(item.href);
    }
  };

  const rowInner = (
    <>
      {/* Expanded Active Neumorphic Plate — GPU opacity crossfade (zero width/radius reflow) */}
      <span
        aria-hidden="true"
        className="absolute inset-0 w-[248px] rounded-[22px] bg-gradient-to-r from-[#272952] via-[#1e2044] to-[#141535] border border-indigo-400/40 shadow-[-2px_-2px_8px_rgba(140,165,255,0.12),4px_6px_14px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.22)] pointer-events-none sidebar-opacity-transition"
        style={{ opacity: highlighted && !isCollapsed ? 1 : 0 }}
      />

      {/* Collapsed Active / Hover Squircle Plate — GPU opacity crossfade */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-[48px] rounded-[18px] pointer-events-none sidebar-opacity-transition ${
          highlighted
            ? 'bg-gradient-to-br from-[#272952] via-[#1e2044] to-[#141535] border border-indigo-400/45 shadow-[0_4px_12px_rgba(0,0,0,0.55),inset_1px_1px_1.5px_rgba(255,255,255,0.22)]'
            : 'bg-[#18193b]/75 border border-indigo-400/20 opacity-0 group-hover:opacity-100'
        }`}
        style={highlighted ? { opacity: isCollapsed ? 1 : 0 } : isCollapsed ? undefined : { opacity: 0 }}
      />

      {/* Stationary Icon Container — locked at x=40px in the 80px rail (zero horizontal jump) */}
      <span
        className={`relative z-10 w-12 h-full flex items-center justify-center shrink-0 transition-transform duration-150 ease-out ${
          highlighted ? 'scale-[1.06]' : 'group-hover:scale-105'
        }`}
      >
        <IconComp
          className={`w-6 h-6 transition-colors duration-150 ${
            highlighted
              ? 'text-cyan-400'
              : 'text-slate-300/85 group-hover:text-cyan-300'
          }`}
          strokeWidth={2.2}
        />
      </span>

      {/* Label + Optional Submenu Chevron — pure GPU opacity + translate3d */}
      <span
        className="relative z-10 flex-1 flex items-center justify-between pr-3.5 pl-1.5 min-w-0 sidebar-gpu-transition"
        style={{
          opacity: isCollapsed ? 0 : 1,
          transform: isCollapsed
            ? 'translate3d(-10px, 0, 0)'
            : 'translate3d(0, 0, 0)',
          pointerEvents: isCollapsed ? 'none' : 'auto',
        }}
      >
        <span
          className={`text-[14px] tracking-wide whitespace-nowrap truncate transition-colors duration-150 ${
            highlighted
              ? 'font-black text-white'
              : 'font-bold text-slate-300/85 group-hover:text-white'
          }`}
        >
          {item.name}
        </span>

        {hasSubItems && (
          <ChevronDown
            className={`w-4 h-4 shrink-0 text-slate-400 group-hover:text-cyan-300 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-cyan-300' : 'rotate-0'
            }`}
            strokeWidth={2.4}
          />
        )}
      </span>
    </>
  );

  const rowClassName = `relative flex items-center h-[50px] w-[248px] rounded-[22px] group antialiased cursor-pointer select-none touch-manipulation transition-colors duration-150 active:scale-[0.985] ${
    highlighted
      ? 'text-white'
      : isCollapsed
      ? 'text-slate-300/80 hover:text-white'
      : 'text-slate-300/80 hover:text-white hover:bg-[#18193b]/70'
  }`;

  return (
    <div className="w-[248px]">
      {hasSubItems ? (
        <button
          type="button"
          onClick={handleParentClick}
          onMouseEnter={handleParentHover}
          onTouchStart={handleParentHover}
          title={item.name}
          className={rowClassName}
        >
          {rowInner}
        </button>
      ) : (
        <Link
          href={item.href}
          onClick={() => onNavigate(item.href)}
          onMouseEnter={handleParentHover}
          onTouchStart={handleParentHover}
          title={item.name}
          prefetch={true}
          scroll={false}
          className={rowClassName}
        >
          {rowInner}
        </Link>
      )}

      {/* CSS Grid Sub-menu Dropdown (zero Framer Motion layout thrash) */}
      {hasSubItems && (
        <div
          className="sidebar-submenu-grid"
          style={{
            gridTemplateRows: !isCollapsed && isOpen ? '1fr' : '0fr',
            opacity: !isCollapsed && isOpen ? 1 : 0,
            pointerEvents: !isCollapsed && isOpen ? 'auto' : 'none',
          }}
        >
          <div className="overflow-hidden">
            <div className="pl-7 pr-1 pt-1.5 pb-1 space-y-1.5 relative before:content-[''] before:absolute before:left-[24px] before:top-2 before:bottom-3 before:w-[2px] before:bg-indigo-500/35 before:rounded-full">
              {item.subItems!.map((sub) => {
                const isSubActive = effectivePath === sub.href;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={() => onNavigate(sub.href)}
                    onMouseEnter={() => onPrefetch(sub.href)}
                    onTouchStart={() => onPrefetch(sub.href)}
                    prefetch={true}
                    scroll={false}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] transition-colors duration-150 group/sub relative touch-manipulation active:scale-[0.985] ${
                      isSubActive
                        ? 'text-cyan-300 font-extrabold bg-[#18193b]/80 border border-indigo-500/35'
                        : 'text-slate-300/80 hover:text-white hover:bg-[#18193b]/45 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`w-1.5 h-1.5 rounded-full transition-transform duration-150 ${
                          isSubActive
                            ? 'bg-cyan-400 scale-110'
                            : 'bg-indigo-400/50 group-hover/sub:bg-cyan-400'
                        }`}
                      />
                      <span className="truncate">{sub.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * 120Hz / 144Hz Pure GPU-Composited Desktop & Tablet Landscape Sidebar.
 * Uses a 9-slice GPU shell (scaleX + translate3d) + GPU clip-path content boundary +
 * stationary 80px icon rail so toggling never triggers a single layout reflow or repaint.
 */
const DesktopSidebar = memo(function DesktopSidebar({
  pathname,
  viewportMode,
  visibleNavItems,
  onLogout,
  onPrefetch,
}: {
  pathname: string;
  viewportMode: ViewportMode;
  visibleNavItems: NavItemData[];
  onLogout: () => void;
  onPrefetch: (href: string) => void;
}) {
  const { isSidebarOpen, setIsSidebarOpen, toggleSidebar } = useSidebar();
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);

  // Sync optimistic active highlight as soon as route navigation settles
  useEffect(() => {
    setOptimisticPath(null);
  }, [pathname]);

  useEffect(() => {
    const clearOptimistic = () => setOptimisticPath(null);
    Router.events.on('routeChangeError', clearOptimistic);
    return () => {
      Router.events.off('routeChangeError', clearOptimistic);
    };
  }, []);

  const effectivePath = optimisticPath ?? pathname;
  const isTabletOverlay = viewportMode === 'tablet-landscape';
  const isCollapsed = !isSidebarOpen;

  const handleExpandSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, [setIsSidebarOpen]);

  const handleNavigate = useCallback(
    (href: string) => {
      if (href !== pathname) {
        setOptimisticPath(href);
      }
      if (isTabletOverlay) {
        setIsSidebarOpen(false);
      }
    },
    [pathname, isTabletOverlay, setIsSidebarOpen]
  );

  return (
    <>
      {/* Lightweight Click-Away Scrim for Tablet Landscape Overlay Mode (zero backdrop-blur lag) */}
      <div
        aria-hidden="true"
        onClick={() => setIsSidebarOpen(false)}
        className="fixed inset-0 bg-black/45 z-30 print:hidden portrait:hidden landscape:block sidebar-opacity-transition"
        style={{
          opacity: isTabletOverlay && isSidebarOpen ? 1 : 0,
          pointerEvents: isTabletOverlay && isSidebarOpen ? 'auto' : 'none',
        }}
      />

      {/* Fixed 280px GPU Sidebar Frame — pointer-events outside clipped rail pass through to main content */}
      <aside
        id="app-sidebar"
        className="fixed inset-y-4 left-4 z-40 w-[280px] pointer-events-none select-none print:hidden portrait:hidden landscape:block"
        style={{ contain: 'layout style' }}
      >
        {/* === 9-SLICE GPU CARD SHELL (ZERO LAYOUT REFLOW, ZERO SEAMS) === */}
        {/* 1. Ambient Elevation Shadow Layer */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-[30px] shadow-[0_14px_38px_rgba(0,0,0,0.72)] origin-left pointer-events-none sidebar-gpu-transition will-change-transform"
          style={{
            transform: isCollapsed
              ? `scaleX(${SIDEBAR_COLLAPSED_W / SIDEBAR_EXPANDED_W}) translateZ(0)`
              : 'scaleX(1) translateZ(0)',
          }}
        />

        {/* 2. Left Cap (0..42px, fixed) */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-[42px] rounded-l-[30px] bg-gradient-to-b from-[#1c183a] via-[#14172f] to-[#0c0e1e] border-y border-l border-[#2b2d56] pointer-events-none"
        />

        {/* 3. Middle Stretch (40..240px, GPU scaleX 0 -> 1, 2px overlap both ends) */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-[40px] w-[200px] bg-gradient-to-b from-[#1c183a] via-[#14172f] to-[#0c0e1e] border-y border-[#2b2d56] origin-left pointer-events-none sidebar-gpu-transition will-change-transform"
          style={{
            transform: isCollapsed
              ? 'scaleX(0) translateZ(0)'
              : 'scaleX(1) translateZ(0)',
          }}
        />

        {/* 4. Right Cap (38..80px collapsed -> 238..280px expanded, GPU translate3d) */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-[38px] w-[42px] rounded-r-[30px] bg-gradient-to-b from-[#1c183a] via-[#14172f] to-[#0c0e1e] border-y border-r border-[#2b2d56] pointer-events-none sidebar-gpu-transition will-change-transform"
          style={{
            transform: isCollapsed
              ? 'translate3d(0, 0, 0)'
              : `translate3d(${SIDEBAR_DELTA}px, 0, 0)`,
          }}
        />

        {/* 5. Top Bevel Specular Highlight (GPU scaleX) */}
        <div
          aria-hidden="true"
          className="absolute top-[1px] left-[22px] w-[236px] h-[1.5px] bg-gradient-to-r from-transparent via-white/25 to-transparent origin-left pointer-events-none z-20 sidebar-gpu-transition will-change-transform"
          style={{
            transform: isCollapsed
              ? 'scaleX(0.16) translateZ(0)'
              : 'scaleX(1) translateZ(0)',
          }}
        />

        {/* 6. Logo Header Divider Line (GPU scaleX) */}
        <div
          aria-hidden="true"
          className="absolute top-[138px] left-[1px] w-[278px] h-[1px] bg-indigo-900/45 origin-left pointer-events-none z-20 sidebar-gpu-transition will-change-transform"
          style={{
            transform: isCollapsed
              ? `scaleX(${(SIDEBAR_COLLAPSED_W - 2) / (SIDEBAR_EXPANDED_W - 2)}) translateZ(0)`
              : 'scaleX(1) translateZ(0)',
          }}
        />

        {/* === CONTENT LAYER (FIXED 280px INNER GEOMETRY, CLIPPED TO ACTIVE RAIL) === */}
        {/* Note: CSS clip-path clips visuals AND automatically lets clicks outside the 80px rail pass through to main content */}
        <div
          className="relative z-10 flex flex-col h-full w-[280px] rounded-[30px] overflow-hidden pointer-events-auto"
          style={{
            clipPath: isCollapsed
              ? `inset(0px ${SIDEBAR_DELTA}px 0px 0px round 30px)`
              : 'inset(0px 0px 0px 0px round 30px)',
            transition: `clip-path ${ANIM_DURATION_MS}ms ${ANIM_EASING}`,
            willChange: 'clip-path',
          }}
        >
          {/* Logo Header — Fixed 138px height so nav list never jumps vertically */}
          <div className="relative h-[138px] w-[280px] shrink-0 flex flex-col items-center justify-center px-4">
            {/* Logo glides smoothly between x=140px (expanded) and x=40px (collapsed) purely via GPU transform */}
            <div
              className="flex items-center justify-center sidebar-gpu-transition will-change-transform"
              style={{
                transform: isCollapsed
                  ? 'translate3d(-100px, 20px, 0) scale(0.74)'
                  : 'translate3d(0, 0, 0) scale(1)',
              }}
            >
              <AppLogo
                className="w-[62px] h-[62px]"
                iconClassName="w-11 h-11 text-cyan-400"
              />
            </div>

            {/* Brand Title + Subtitle — pure GPU opacity + translate3d */}
            <div
              className="flex flex-col items-center text-center mt-2 sidebar-gpu-transition will-change-transform"
              style={{
                opacity: isCollapsed ? 0 : 1,
                transform: isCollapsed
                  ? 'translate3d(-18px, 0, 0)'
                  : 'translate3d(0, 0, 0)',
                pointerEvents: isCollapsed ? 'none' : 'auto',
              }}
            >
              <span className="font-heading font-[800] text-[18px] leading-tight tracking-[1.5px] whitespace-nowrap antialiased text-white">
                SMART PPI
              </span>
              <span className="text-[8.5px] whitespace-nowrap leading-[1.4] text-center mt-0.5 antialiased text-indigo-200/80 font-bold uppercase tracking-wider">
                Sistem Monitoring &amp; Audit Terpadu
              </span>
            </div>
          </div>

          {/* Navigation Items — Stationary 80px left icon rail (px-4 + w-12 icon = centered at x=40px) */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-4 space-y-2 custom-sidebar-scrollbar">
            <div
              className="h-5 mb-2 pl-2 flex items-center sidebar-gpu-transition"
              style={{
                opacity: isCollapsed ? 0 : 1,
                transform: isCollapsed
                  ? 'translate3d(-10px, 0, 0)'
                  : 'translate3d(0, 0, 0)',
              }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.22em] antialiased text-indigo-300/80 whitespace-nowrap">
                Menu Utama
              </p>
            </div>

            {visibleNavItems.map((item) => (
              <NavItem
                key={item.name}
                item={item}
                isActive={effectivePath === item.href}
                isCollapsed={isCollapsed}
                effectivePath={effectivePath}
                onExpandSidebar={handleExpandSidebar}
                onNavigate={handleNavigate}
                onPrefetch={onPrefetch}
              />
            ))}
          </div>

          {/* Keluar Button — Fixed height & crossfaded GPU plates */}
          <div className="p-4 pt-2 mt-auto shrink-0 antialiased">
            <button
              type="button"
              onClick={onLogout}
              title="Keluar"
              className="relative flex items-center h-[48px] w-[248px] rounded-2xl text-red-200 group cursor-pointer select-none touch-manipulation active:scale-[0.98]"
            >
              {/* Expanded Red Plate */}
              <span
                aria-hidden="true"
                className="absolute inset-0 w-[248px] rounded-2xl bg-gradient-to-r from-red-600/25 via-rose-600/20 to-red-700/25 group-hover:from-red-600/40 group-hover:to-rose-600/40 border border-red-500/35 shadow-[0_4px_14px_rgba(0,0,0,0.45),inset_1px_1px_1.5px_rgba(255,255,255,0.14)] pointer-events-none sidebar-opacity-transition"
                style={{ opacity: isCollapsed ? 0 : 1 }}
              />

              {/* Collapsed Red Square Plate */}
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-[48px] rounded-[18px] bg-gradient-to-br from-red-600/30 to-rose-700/25 group-hover:from-red-600/45 group-hover:to-rose-600/45 border border-red-500/40 shadow-[0_4px_12px_rgba(0,0,0,0.45),inset_1px_1px_1.5px_rgba(255,255,255,0.14)] pointer-events-none sidebar-opacity-transition"
                style={{ opacity: isCollapsed ? 1 : 0 }}
              />

              {/* LogOut Icon — glides cleanly from centered (expanded) to x=40px rail (collapsed) */}
              <span
                className="relative z-10 w-12 h-full flex items-center justify-center shrink-0 sidebar-gpu-transition will-change-transform"
                style={{
                  transform: isCollapsed
                    ? 'translate3d(0, 0, 0)'
                    : 'translate3d(68px, 0, 0)',
                }}
              >
                <LogOut className="w-[18px] h-[18px]" strokeWidth={2.5} />
              </span>

              {/* KELUAR Label */}
              <span
                className="relative z-10 font-black text-[12px] uppercase tracking-wider whitespace-nowrap sidebar-gpu-transition"
                style={{
                  opacity: isCollapsed ? 0 : 1,
                  transform: isCollapsed
                    ? 'translate3d(-12px, 0, 0)'
                    : 'translate3d(64px, 0, 0)',
                  pointerEvents: isCollapsed ? 'none' : 'auto',
                }}
              >
                Keluar
              </span>
            </button>
          </div>
        </div>

        {/* === CIRCULAR SIDEBAR TOGGLE BUTTON (VALID 36px CIRCLE + 60px TOUCH TARGET) === */}
        {/* Outer wrapper translates strictly on GPU; inner circle handles hover/press scale with zero transform conflict */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSidebar();
          }}
          className="absolute left-0 top-1/2 z-[70] w-9 h-9 pointer-events-auto cursor-pointer touch-manipulation select-none group hidden landscape:flex items-center justify-center sidebar-gpu-transition will-change-transform before:content-[''] before:absolute before:-inset-3 before:rounded-full"
          style={{
            transform: isCollapsed
              ? `translate3d(${SIDEBAR_COLLAPSED_W - 18}px, -50%, 0)`
              : `translate3d(${SIDEBAR_EXPANDED_W - 18}px, -50%, 0)`,
          }}
          title={
            isSidebarOpen
              ? 'Sembunyikan Sidebar (Mode Ikon)'
              : 'Buka Menu Lengkap'
          }
          aria-label={
            isSidebarOpen
              ? 'Sembunyikan Sidebar (Mode Ikon)'
              : 'Buka Menu Lengkap'
          }
        >
          <span className="w-9 h-9 rounded-full flex items-center justify-center border border-indigo-400/65 bg-gradient-to-b from-[#282b60] via-[#181b40] to-[#0e102a] text-cyan-300 shadow-[0_4px_16px_rgba(0,0,0,0.7),inset_1px_1px_2px_rgba(255,255,255,0.28)] group-hover:border-cyan-400 group-hover:text-white group-hover:shadow-[0_0_18px_rgba(6,182,212,0.55)] group-hover:scale-105 group-active:scale-90 transition-transform duration-150 ease-out">
            <ChevronLeft
              className="w-5 h-5 text-cyan-300 group-hover:text-white transition-transform duration-200 ease-out"
              style={{
                transform: isSidebarOpen
                  ? 'rotate(0deg) translateZ(0)'
                  : 'rotate(180deg) translateZ(0)',
              }}
              strokeWidth={2.6}
            />
          </span>
        </button>
      </aside>
    </>
  );
});

/**
 * Main Content Frame with Interruptible 120Hz/144Hz GPU FLIP Engine on Desktop
 * and Zero-Reflow Fixed Rail Margin on Tablet Landscape.
 * Receives {children} from DashboardLayout so toggling sidebar NEVER re-renders page content.
 */
const MainContentFrame = memo(function MainContentFrame({
  viewportMode,
  pathname,
  hospitalLogoUrl,
  isIPCLN,
  children,
}: {
  viewportMode: ViewportMode;
  pathname: string;
  hospitalLogoUrl: string | null;
  isIPCLN: boolean;
  children: React.ReactNode;
}) {
  const { isSidebarOpen } = useSidebar();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const prevStateRef = useRef<{
    initialized: boolean;
    mode: ViewportMode;
    open: boolean;
  }>({ initialized: false, mode: viewportMode, open: isSidebarOpen });
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to top cleanly once per route navigation or custom event
  useEffect(() => {
    const scrollToTop = () => {
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
        mainRef.current.scrollLeft = 0;
      }
    };
    scrollToTop();
    window.addEventListener('smart_ppi_scroll_top', scrollToTop);
    return () => {
      window.removeEventListener('smart_ppi_scroll_top', scrollToTop);
    };
  }, [pathname]);

  // Interruptible GPU FLIP controller for zero-reflow 120Hz/144Hz sidebar toggle
  useIsomorphicLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }

    const prev = prevStateRef.current;

    // Portrait mode: always 0 margin (bottom nav bar)
    if (viewportMode === 'portrait') {
      el.style.transition = '';
      el.style.transform = '';
      el.style.willChange = '';
      el.style.marginLeft = '0px';
      prevStateRef.current = { initialized: true, mode: viewportMode, open: isSidebarOpen };
      return;
    }

    // Tablet Landscape mode: permanent 104px margin — sidebar glides over on GPU with ZERO content reflow ever
    if (viewportMode === 'tablet-landscape') {
      el.style.transition = '';
      el.style.transform = '';
      el.style.willChange = '';
      el.style.marginLeft = `${TABLET_MARGIN_FIXED}px`;
      prevStateRef.current = { initialized: true, mode: viewportMode, open: isSidebarOpen };
      return;
    }

    // Desktop mode (>= 1280px landscape)
    const targetMargin = isSidebarOpen ? DESKTOP_MARGIN_OPEN : DESKTOP_MARGIN_CLOSED;

    // Initial mount or viewport mode switch: snap silently without animation
    if (!prev.initialized || prev.mode !== 'desktop' || prev.open === isSidebarOpen) {
      el.style.transition = '';
      el.style.transform = '';
      el.style.willChange = '';
      el.style.marginLeft = `${targetMargin}px`;
      prevStateRef.current = { initialized: true, mode: viewportMode, open: isSidebarOpen };
      return;
    }

    // Read live visual X position so rapid mid-flight toggles are 100% seamless & jump-free
    const computed = window.getComputedStyle(el);
    const currentMargin = parseFloat(computed.marginLeft) || DESKTOP_MARGIN_CLOSED;
    let currentTx = 0;
    if (computed.transform && computed.transform !== 'none') {
      try {
        currentTx = new DOMMatrix(computed.transform).m41;
      } catch {
        currentTx = 0;
      }
    }
    const currentVisualLeft = currentMargin + currentTx;

    if (!isSidebarOpen) {
      // COLLAPSING (312 -> 112): Widen once to 112px, invert visual X to currentVisualLeft, glide smoothly on GPU to 0
      el.style.transition = 'none';
      el.style.marginLeft = `${DESKTOP_MARGIN_CLOSED}px`;
      const invertX = currentVisualLeft - DESKTOP_MARGIN_CLOSED;
      el.style.willChange = 'transform';
      el.style.transform = `translate3d(${invertX}px, 0, 0)`;

      // Single synchronous layout sync before paint (prevents frame-0 jump)
      void el.offsetWidth;

      el.style.transition = `transform ${ANIM_DURATION_MS}ms ${ANIM_EASING}`;
      el.style.transform = 'translate3d(0px, 0, 0)';

      commitTimerRef.current = setTimeout(() => {
        if (!wrapperRef.current) return;
        wrapperRef.current.style.transition = '';
        wrapperRef.current.style.transform = '';
        wrapperRef.current.style.willChange = '';
        commitTimerRef.current = null;
      }, ANIM_DURATION_MS + 20);
    } else {
      // EXPANDING (112 -> 312): Keep marginLeft at 112px during 240ms GPU glide (zero reflow!), commit 312px silently after finish
      const startMargin = DESKTOP_MARGIN_CLOSED;
      const startTx = currentVisualLeft - startMargin;

      el.style.transition = 'none';
      el.style.marginLeft = `${startMargin}px`;
      el.style.willChange = 'transform';
      el.style.transform = `translate3d(${startTx}px, 0, 0)`;

      void el.offsetWidth;

      el.style.transition = `transform ${ANIM_DURATION_MS}ms ${ANIM_EASING}`;
      el.style.transform = `translate3d(${SIDEBAR_DELTA}px, 0, 0)`;

      commitTimerRef.current = setTimeout(() => {
        if (!wrapperRef.current) return;
        wrapperRef.current.style.transition = 'none';
        wrapperRef.current.style.marginLeft = `${DESKTOP_MARGIN_OPEN}px`;
        wrapperRef.current.style.transform = '';
        wrapperRef.current.style.willChange = '';
        void wrapperRef.current.offsetWidth;
        wrapperRef.current.style.transition = '';
        commitTimerRef.current = null;
      }, ANIM_DURATION_MS + 20);
    }

    prevStateRef.current = { initialized: true, mode: viewportMode, open: isSidebarOpen };
  }, [isSidebarOpen, viewportMode]);

  useEffect(() => {
    return () => {
      if (commitTimerRef.current) {
        clearTimeout(commitTimerRef.current);
      }
    };
  }, []);

  const isSupervisi = pathname.startsWith('/dashboard/reports/supervisi');
  const isResmiScroll =
    pathname.startsWith('/dashboard/reports/resmi') ||
    pathname.startsWith('/dashboard/reports/icra');

  return (
    <div
      ref={wrapperRef}
      className="flex-1 flex flex-col h-full min-w-0 overflow-hidden portrait:!ml-0 landscape:ml-[104px] xl:ml-[312px] print:!ml-0"
    >
      <main
        ref={mainRef}
        className={`flex-1 overflow-y-auto overflow-x-clip ${
          isSupervisi
            ? 'p-2 sm:p-3 lg:p-3.5'
            : 'p-3.5 sm:p-5 lg:p-6 xl:p-7'
        } pb-32 sm:pb-10 relative scroll-container-120fps w-full max-w-full ${
          isResmiScroll ? 'resmi-report-scroll-container' : ''
        }`}
        style={{
          backgroundColor: '#12142e',
        }}
      >
        {/* Header Khusus Mode Mobile & Tablet Portrait */}
        <div className="flex landscape:hidden portrait:flex flex-col mb-4 print:hidden">
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center relative">
                {hospitalLogoUrl ? (
                  <img
                    src={hospitalLogoUrl}
                    alt="Logo RS"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-indigo-300" />
                )}
              </div>

              <div className="flex flex-col text-left">
                <span className="font-heading font-bold text-[13px] tracking-wide leading-tight text-white">
                  UOBK RSUD AL-MULK
                </span>
                <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-indigo-200/80">
                  KOTA SUKABUMI
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 scale-90 origin-right">
              <ClockWidget />
            </div>
          </div>

          {/* Garis Pembatas Tipis Gradasi Biru-Ungu */}
          <div className="relative w-full mt-3">
            <div className="h-[2px] w-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 via-purple-500 to-sky-400 shadow-[0_0_10px_rgba(168,85,247,0.65)]" />
          </div>
        </div>

        <div className="w-full min-h-full max-w-full overflow-x-clip">
          {isIPCLN && pathname.startsWith('/dashboard/settings')
            ? null
            : children}
        </div>
      </main>
    </div>
  );
});

/**
 * Isolated Viewport/Sidebar Auto-Sync Helper so DashboardLayout never subscribes to isSidebarOpen.
 */
function TabletAutoCollapseSync({ viewportMode }: { viewportMode: ViewportMode }) {
  const { setIsSidebarOpen } = useSidebar();
  const prevModeRef = useRef<ViewportMode | null>(null);

  useEffect(() => {
    const prev = prevModeRef.current;
    // On initial mount in tablet-landscape/portrait, or when rotating into portrait/tablet-landscape,
    // default sidebar to collapsed rail for generous touch workspace without fighting manual toggles.
    if (
      (viewportMode === 'portrait' || viewportMode === 'tablet-landscape') &&
      prev !== viewportMode
    ) {
      setIsSidebarOpen(false);
    }
    prevModeRef.current = viewportMode;
  }, [viewportMode, setIsSidebarOpen]);

  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = router.pathname;
  const { userRole, setUserRole, hospitalLogoUrl } = useAppContext();
  const {
    isDashboardLoaded,
    setDashboardData,
    isGlobalLoading,
    setIsGlobalLoading,
  } = useDashboardStore();
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());

  // Akun IPCLN memiliki akses terbatas: menu Pengaturan disembunyikan
  const isIPCLN = userRole === 'IPCLN';
  const visibleNavItems = useMemo(
    () =>
      isIPCLN
        ? navItems.filter((item) => !item.href.startsWith('/dashboard/settings'))
        : navItems,
    [isIPCLN]
  );

  // Cegah IPCLN membuka halaman Pengaturan lewat URL langsung
  useEffect(() => {
    if (isIPCLN && pathname.startsWith('/dashboard/settings')) {
      router.replace('/dashboard');
    }
  }, [isIPCLN, pathname, router]);

  // Global Data Pre-fetching (runs once across session)
  useEffect(() => {
    if (!isDashboardLoaded && !isGlobalLoading) {
      const loadGlobalData = async () => {
        setIsGlobalLoading(true);
        try {
          const [
            slidesRes,
            stdRes,
            hhRes,
            apdRes,
            haisRes,
            fapdRes,
            linenRes,
          ] = await Promise.all([
            supabase
              .from('dashboard_slider')
              .select('*')
              .order('sort_order', { ascending: true }),
            supabase.from('dashboard_standards').select('*'),
            supabase.from('audit_hand_hygiene').select('*'),
            supabase.from('audit_apd').select('*'),
            supabase
              .from('audit_sessions')
              .select('*')
              .eq('kategori', 'Surveilans HAIs'),
            supabase.from('monitoring_fasilitas_apd').select('*'),
            supabase.from('audit_penatalaksanaan_linen').select('*'),
          ]);

          let newSlides: any[] = [];
          if (slidesRes.data && slidesRes.data.length > 0) {
            newSlides = slidesRes.data.map((s: any, idx: number) => {
              let url =
                s.image_url || '/uploads/public/slider/slider_1787961366248.png';
              if (url.includes('/storage/v1/object/public/')) {
                const rel = url
                  .split('/storage/v1/object/public/')[1]
                  ?.split('?')[0];
                if (rel) url = `/uploads/${rel}`;
              }
              return {
                ...s,
                image_url: url,
                active:
                  s.active === undefined
                    ? true
                    : s.active === true ||
                      s.active === 1 ||
                      s.active === '1' ||
                      s.active === 'true',
                sort_order: Number(s.sort_order) || idx + 1,
              };
            });
            try {
              localStorage.setItem('spp_slides', JSON.stringify(newSlides));
            } catch (e) {}
            newSlides.forEach((slide: any) => {
              if (
                slide.image_url &&
                slide.active &&
                typeof window !== 'undefined'
              ) {
                const img = new window.Image();
                img.src = slide.image_url;
                img.referrerPolicy = 'no-referrer';
              }
            });
          }

          const newRawData = {
            hh: hhRes.data || [],
            apd: apdRes.data || [],
            hais: haisRes.data || [],
            fasilitas_apd: fapdRes.data || [],
            linen: linenRes.data || [],
          };

          const newStandards: any = {
            hh: { indikator: 'Kebersihan Tangan', nilai_standar: 85, operator: '>=' },
            apd: { indikator: 'Kepatuhan Penggunaan APD', nilai_standar: 100, operator: '>=' },
            phlebitis: { indikator: 'Phlebitis', nilai_standar: 1.5, operator: '<=' },
            isk: { indikator: 'ISK', nilai_standar: 5, operator: '<=' },
            ido: { indikator: 'IDO', nilai_standar: 2, operator: '<=' },
            vap: { indikator: 'VAP', nilai_standar: 5, operator: '<=' },
            fasilitas_apd: { indikator: 'Fasilitas APD', nilai_standar: 100, operator: '>=' },
            linen: { indikator: 'Penatalaksanaan Linen', nilai_standar: 100, operator: '>=' },
          };
          if (stdRes.data) {
            stdRes.data.forEach((s) => {
              const key = s.indikator.toLowerCase();
              if (key.includes('tangan') || key === 'hh')
                newStandards.hh = {
                  ...s,
                  nilai_standar:
                    s.nilai_standar <= 1
                      ? s.nilai_standar * 100
                      : s.nilai_standar,
                };
              else if (key.includes('apd'))
                newStandards.apd = {
                  ...s,
                  nilai_standar:
                    s.nilai_standar <= 1
                      ? s.nilai_standar * 100
                      : s.nilai_standar,
                };
              else if (key.includes('phle')) newStandards.phlebitis = s;
              else if (key.includes('isk')) newStandards.isk = s;
              else if (key.includes('ido')) newStandards.ido = s;
              else if (key.includes('vap')) newStandards.vap = s;
              else if (key.includes('fasilitas') || key.includes('fapd'))
                newStandards.fasilitas_apd = s;
              else if (key.includes('linen')) newStandards.linen = s;
              else newStandards[key] = s;
            });
          }

          setDashboardData({
            slides: newSlides,
            standards: newStandards,
            rawData: newRawData,
          });
        } catch (e) {
          console.error('Global load error', e);
        } finally {
          setIsGlobalLoading(false);
        }
      };
      loadGlobalData();
    }
  }, [isDashboardLoaded, isGlobalLoading, setIsGlobalLoading, setDashboardData]);

  // Responsive viewport mode detector (debounced via rAF to avoid resize spam)
  useIsomorphicLayoutEffect(() => {
    let rafId = 0;
    const syncViewport = () => {
      const nextMode = detectViewportMode();
      setViewportMode((prev) => (prev === nextMode ? prev : nextMode));
    };

    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(syncViewport);
    };

    syncViewport();
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Theme init & background route prefetching via requestIdleCallback
  useEffect(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    try {
      localStorage.setItem('theme', 'dark');
    } catch {}

    const warmRoutes = () => {
      navItems.forEach((item) => {
        if (!prefetchedRoutesRef.current.has(item.href)) {
          prefetchedRoutesRef.current.add(item.href);
          router.prefetch(item.href);
        }
        item.subItems?.forEach((sub) => {
          if (!prefetchedRoutesRef.current.has(sub.href)) {
            prefetchedRoutesRef.current.add(sub.href);
            router.prefetch(sub.href);
          }
        });
      });
    };

    if ('requestIdleCallback' in window) {
      const idleId = (window as any).requestIdleCallback(warmRoutes, {
        timeout: 800,
      });
      return () => (window as any).cancelIdleCallback(idleId);
    }
    const timer = setTimeout(warmRoutes, 300);
    return () => clearTimeout(timer);
  }, [router]);

  const handlePrefetch = useCallback(
    (href: string) => {
      if (prefetchedRoutesRef.current.has(href)) return;
      prefetchedRoutesRef.current.add(href);
      router.prefetch(href);
    },
    [router]
  );

  const handleLogout = useCallback(() => {
    setUserRole('');
    router.push('/');
  }, [setUserRole, router]);

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex bg-[#12142e] text-slate-100 relative">
      {/* Global 120Hz GPU Route Transition Progress Bar */}
      <RouteProgressBar />

      {/* Sync default collapsed rail cleanly on tablet/portrait rotation */}
      <TabletAutoCollapseSync viewportMode={viewportMode} />

      {/* Pure GPU 120Hz/144Hz Desktop & Tablet Landscape Sidebar */}
      <DesktopSidebar
        pathname={pathname}
        viewportMode={viewportMode}
        visibleNavItems={visibleNavItems}
        onLogout={handleLogout}
        onPrefetch={handlePrefetch}
      />

      {/* Main Content Area — isolated from SidebarContext re-renders, GPU FLIP animated */}
      <MainContentFrame
        viewportMode={viewportMode}
        pathname={pathname}
        hospitalLogoUrl={hospitalLogoUrl}
        isIPCLN={isIPCLN}
      >
        {children}
      </MainContentFrame>

      {/* Mobile & Tablet Portrait Bottom Navigation */}
      <MobilePortraitNavBar currentPath={pathname} hideSettings={isIPCLN} />
    </div>
  );
}

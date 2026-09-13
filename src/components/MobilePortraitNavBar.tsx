'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export interface MobileNavItem {
  id: string;
  name: string;
  shortName: string;
  href: string;
}

export const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { 
    id: 'dashboard',
    name: 'Dashboard', 
    shortName: 'Dashboard', 
    href: '/dashboard', 
  },
  { 
    id: 'input',
    name: 'Input Data', 
    shortName: 'Input', 
    href: '/dashboard/input', 
  },
  { 
    id: 'analytics',
    name: 'Grafik Capaian', 
    shortName: 'Grafik', 
    href: '/dashboard/analytics', 
  },
  { 
    id: 'reports',
    name: 'Laporan PPI', 
    shortName: 'Laporan', 
    href: '/dashboard/reports', 
  },
  { 
    id: 'settings',
    name: 'Pengaturan', 
    shortName: 'Setting', 
    href: '/dashboard/settings', 
  },
];

/**
 * Solid 3D SVG Icons designed to match the reference image aesthetics
 */
function SolidNavIcon({ id, className = "" }: { id: string; className?: string }) {
  switch (id) {
    case 'dashboard':
      // Solid Home Icon with chimney and arched door cutout matching the reference image exactly
      return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path 
            fillRule="evenodd" 
            clipRule="evenodd" 
            d="M 14.7 5.8 C 15.4 5.1 16.6 5.1 17.3 5.8 L 20.5 8.7 L 20.5 7.2 C 20.5 6.6 21 6.1 21.6 6.1 L 23.9 6.1 C 24.5 6.1 25 6.6 25 7.2 L 25 12.8 L 26.9 14.5 C 27.5 15.1 27.5 16 26.9 16.6 C 26.3 17.2 25.4 17.2 24.8 16.6 L 24 15.9 L 24 24.5 C 24 25.9 22.9 27 21.5 27 L 18.5 27 L 18.5 20 C 18.5 18.6 17.4 17.5 16 17.5 C 14.6 17.5 13.5 18.6 13.5 20 L 13.5 27 L 10.5 27 C 9.1 27 8 25.9 8 24.5 L 8 15.9 L 7.2 16.6 C 6.6 17.2 5.7 17.2 5.1 16.6 C 4.5 16 4.5 15.1 5.1 14.5 L 14.7 5.8 Z" 
            fill="currentColor" 
          />
        </svg>
      );

    case 'input':
      // Solid Clipboard Check Icon with rounded clip, board base, and 3D checkmark cutout
      return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path 
            fillRule="evenodd" 
            clipRule="evenodd" 
            d="M 11 4.8 C 11 3.8 11.8 3 12.8 3 L 19.2 3 C 20.2 3 21 3.8 21 4.8 L 23 4.8 C 24.7 4.8 26 6.1 26 7.8 L 26 25.2 C 26 26.9 24.7 28.2 23 28.2 L 9 28.2 C 7.3 28.2 6 26.9 6 25.2 L 6 7.8 C 6 6.1 7.3 4.8 9 4.8 L 11 4.8 Z M 13.2 5.2 L 18.8 5.2 C 19.2 5.2 19.5 5.5 19.5 5.9 C 19.5 6.7 18.8 7.3 18 7.3 L 14 7.3 C 13.2 7.3 12.5 6.7 12.5 5.9 C 12.5 5.5 12.8 5.2 13.2 5.2 Z M 21.6 13.3 C 22.2 13.9 22.2 14.8 21.6 15.4 L 15.6 21.4 C 15 22 14.1 22 13.5 21.4 L 10.4 18.3 C 9.8 17.7 9.8 16.8 10.4 16.2 C 11 15.6 11.9 15.6 12.5 16.2 L 14.6 18.3 L 19.5 13.3 C 20.1 12.7 21 12.7 21.6 13.3 Z" 
            fill="currentColor" 
          />
        </svg>
      );

    case 'analytics':
      // Solid Bar Chart with rounded pillar tops and dynamic heights
      return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path 
            fillRule="evenodd" 
            clipRule="evenodd" 
            d="M 6.5 20 C 6.5 18.6 7.6 17.5 9 17.5 L 9.8 17.5 C 11.2 17.5 12.3 18.6 12.3 20 L 12.3 25.5 C 12.3 26.9 11.2 28 9.8 28 L 9 28 C 7.6 28 6.5 26.9 6.5 25.5 L 6.5 20 Z M 13.7 13 C 13.7 11.6 14.8 10.5 16.2 10.5 L 17 10.5 C 18.4 10.5 19.5 11.6 19.5 13 L 19.5 25.5 C 19.5 26.9 18.4 28 17 28 L 16.2 28 C 14.8 28 13.7 26.9 13.7 25.5 L 13.7 13 Z M 20.9 6.5 C 20.9 5.1 22 4 23.4 4 L 24.2 4 C 25.6 4 26.7 5.1 26.7 6.5 L 26.7 25.5 C 26.7 26.9 25.6 28 24.2 28 L 23.4 28 C 22 28 20.9 26.9 20.9 25.5 L 20.9 6.5 Z" 
            fill="currentColor" 
          />
        </svg>
      );

    case 'reports':
      // Solid Document Sheet with folded corner and rounded content lines
      return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path 
            fillRule="evenodd" 
            clipRule="evenodd" 
            d="M 7.5 5 C 7.5 3.6 8.6 2.5 10 2.5 L 19 2.5 C 19.8 2.5 20.5 2.8 21.1 3.4 L 25.1 7.4 C 25.7 8 26 8.7 26 9.5 L 26 25.5 C 26 26.9 24.9 28 23.5 28 L 10 28 C 8.6 28 7.5 26.9 7.5 25.5 L 7.5 5 Z M 11.5 12 C 10.7 12 10 12.7 10 13.5 C 10 14.3 10.7 15 11.5 15 L 20.5 15 C 21.3 15 22 14.3 22 13.5 C 22 12.7 21.3 12 20.5 12 L 11.5 12 Z M 11.5 16.5 C 10.7 16.5 10 17.2 10 18 C 10 18.8 10.7 19.5 11.5 19.5 L 20.5 19.5 C 21.3 19.5 22 18.8 22 18 C 22 17.2 21.3 16.5 20.5 16.5 L 11.5 16.5 Z M 11.5 21 C 10.7 21 10 21.7 10 22.5 C 10 23.3 10.7 24 11.5 24 L 17 24 C 17.8 24 18.5 23.3 18.5 22.5 C 18.5 21.7 17.8 21 17 21 L 11.5 21 Z" 
            fill="currentColor" 
          />
        </svg>
      );

    case 'settings':
      // Solid Gear Cog with rounded teeth and center circular cutout
      return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path 
            fillRule="evenodd" 
            clipRule="evenodd" 
            d="M 13.8 3.5 C 13.8 2.7 14.5 2 15.3 2 L 16.7 2 C 17.5 2 18.2 2.7 18.2 3.5 L 18.7 5.8 C 19.8 6.3 20.8 6.9 21.6 7.7 L 23.9 6.8 C 24.6 6.5 25.4 6.8 25.8 7.5 L 26.8 9.3 C 27.2 10 27 10.8 26.4 11.3 L 24.5 12.8 C 24.7 13.5 24.8 14.2 24.8 15 C 24.8 15.8 24.7 16.5 24.5 17.2 L 26.4 18.7 C 27 19.2 27.2 20 26.8 20.7 L 25.8 22.5 C 25.4 23.2 24.6 23.5 23.9 23.2 L 21.6 22.3 C 20.8 23.1 19.8 23.7 18.7 24.2 L 18.2 26.5 C 18.2 27.3 17.5 28 16.7 28 L 15.3 28 C 14.5 28 13.8 27.3 13.8 26.5 L 13.3 24.2 C 12.2 23.7 11.2 23.1 10.4 22.3 L 8.1 23.2 C 7.4 23.5 6.6 23.2 6.2 22.5 L 5.2 20.7 C 4.8 20 5 19.2 5.6 18.7 L 7.5 17.2 C 7.3 16.5 7.2 15.8 7.2 15 C 7.2 14.2 7.3 13.5 7.5 12.8 L 5.6 11.3 C 5 10.8 4.8 10 5.2 9.3 L 6.2 7.5 C 6.6 6.8 7.4 6.5 8.1 6.8 L 10.4 7.7 C 11.2 6.9 12.2 6.3 13.3 5.8 L 13.8 3.5 Z M 16 11 C 13.8 11 12 12.8 12 15 C 12 17.2 13.8 19 16 19 C 18.2 19 20 17.2 20 15 C 20 12.8 18.2 11 16 11 Z" 
            fill="currentColor" 
          />
        </svg>
      );

    default:
      return null;
  }
}

/**
 * 3D Icon Presentation Component
 * - For active state: Matches reference image with pearl-white solid silhouette, 3D bottom drop shadow, and crisp highlight.
 * - For inactive state: Matches application's dark theme with metallic chiseled 3D depth and subtle ambient glow on hover.
 */
function NavIcon3D({ 
  id, 
  isActive 
}: { 
  id: string; 
  isActive: boolean; 
}) {
  if (isActive) {
    return (
      <div className="relative flex items-center justify-center">
        {/* Soft 3D cast shadow underneath the white icon */}
        <SolidNavIcon 
          id={id}
          className="absolute w-7 h-7 sm:w-8 sm:h-8 text-black/60 translate-y-[3px] translate-x-[0.5px] blur-[1.5px]" 
        />
        {/* Solid Icon Face with slight pearl white gradient and top specular highlight */}
        <SolidNavIcon 
          id={id}
          className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] filter brightness-105" 
        />
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-200">
      {/* 3D Cast Shadow / Embossed Base */}
      <SolidNavIcon 
        id={id}
        className="absolute w-[22px] h-[22px] text-black translate-y-[2px] translate-x-[0.5px] opacity-80 blur-[0.6px]" 
      />
      {/* 3D Mid-tone Body */}
      <SolidNavIcon 
        id={id}
        className="absolute w-[22px] h-[22px] text-[#0f1228] translate-y-[1px] opacity-90" 
      />
      {/* 3D Foreground Face */}
      <SolidNavIcon 
        id={id}
        className="relative z-10 w-[22px] h-[22px] text-slate-300/85 group-hover:text-violet-200 transition-colors duration-200 drop-shadow-[0_-0.8px_0.5px_rgba(255,255,255,0.25)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
      />
    </div>
  );
}

/**
 * Calculates the exact SVG path contour for the navigation bar based on the active index.
 */
function getNavContourPath(activeIndex: number): string {
  const cx = 100 + activeIndex * 200;
  const R_ARCH = 95;

  let tl_start_y: number;
  let tl_c1: string, tl_c2: string, tl_end: string;
  let flat_left_end: string;
  let arch_up_c1: string, arch_up_c2: string, arch_peak: string;
  let arch_down_c1: string, arch_down_c2: string, arch_down_end: string;
  let flat_right_end: string;
  let tr_c1: string, tr_c2: string, tr_end_y: number;

  if (activeIndex === 0) {
    tl_start_y = 65;
    tl_c1 = "0 30";
    tl_c2 = "40 12";
    tl_end = "100 12";
    flat_left_end = "100 12";
    arch_up_c1 = "100 12";
    arch_up_c2 = "100 12";
    arch_peak = "100 12";
    arch_down_c1 = "155 12";
    arch_down_c2 = "170 55";
    arch_down_end = "195 55";
    flat_right_end = "960 55";
    tr_c1 = "985 55";
    tr_c2 = "1000 70";
    tr_end_y = 95;
  } else if (activeIndex === 4) {
    tl_start_y = 95;
    tl_c1 = "0 70";
    tl_c2 = "15 55";
    tl_end = "40 55";
    flat_left_end = "805 55";
    arch_up_c1 = "830 55";
    arch_up_c2 = "845 12";
    arch_peak = "900 12";
    arch_down_c1 = "900 12";
    arch_down_c2 = "900 12";
    arch_down_end = "900 12";
    flat_right_end = "900 12";
    tr_c1 = "960 12";
    tr_c2 = "1000 30";
    tr_end_y = 65;
  } else {
    const x_left = cx - R_ARCH;
    const x_right = cx + R_ARCH;
    tl_start_y = 95;
    tl_c1 = "0 70";
    tl_c2 = "15 55";
    tl_end = "40 55";
    flat_left_end = `${x_left} 55`;
    arch_up_c1 = `${x_left + 45} 55`;
    arch_up_c2 = `${cx - 45} 12`;
    arch_peak = `${cx} 12`;
    arch_down_c1 = `${cx + 45} 12`;
    arch_down_c2 = `${x_right - 45} 55`;
    arch_down_end = `${x_right} 55`;
    flat_right_end = "960 55";
    tr_c1 = "985 55";
    tr_c2 = "1000 70";
    tr_end_y = 95;
  }

  return `M 0 120 L 0 ${tl_start_y} C ${tl_c1}, ${tl_c2}, ${tl_end} L ${flat_left_end} C ${arch_up_c1}, ${arch_up_c2}, ${arch_peak} C ${arch_down_c1}, ${arch_down_c2}, ${arch_down_end} L ${flat_right_end} C ${tr_c1}, ${tr_c2}, 1000 ${tr_end_y} L 1000 120 C 1000 145, 980 165, 955 165 L 45 165 C 20 165, 0 145, 0 120 Z`;
}

interface MobilePortraitNavBarProps {
  currentPath: string;
}

export default function MobilePortraitNavBar({ currentPath }: MobilePortraitNavBarProps) {
  // Determine active index safely
  const activeIndex = useMemo(() => {
    if (currentPath === '/dashboard') return 0;
    if (currentPath.startsWith('/dashboard/input')) return 1;
    if (currentPath.startsWith('/dashboard/analytics')) return 2;
    if (currentPath.startsWith('/dashboard/reports')) return 3;
    if (currentPath.startsWith('/dashboard/settings')) return 4;
    return 0;
  }, [currentPath]);

  const svgPath = useMemo(() => getNavContourPath(activeIndex), [activeIndex]);

  return (
    <div className="fixed bottom-3 sm:bottom-4 inset-x-3 sm:inset-x-6 z-50 flex justify-center landscape:hidden portrait:flex pb-[env(safe-area-inset-bottom)] pointer-events-none">
      <nav 
        aria-label="Mobile Navigation Bar"
        className="w-full max-w-md h-[86px] relative pointer-events-auto select-none"
      >
        {/* SVG Container Background Shape with Smooth Curved Contour & Dark Theme */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_16px_36px_rgba(0,0,0,0.85)] drop-shadow-[0_4px_14px_rgba(0,0,0,0.7)]" 
          viewBox="0 0 1000 170" 
          preserveAspectRatio="none"
        >
          <defs>
            {/* Dark background gradient matching the application */}
            <linearGradient id="mobileNavDarkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e2248" />
              <stop offset="45%" stopColor="#131535" />
              <stop offset="100%" stopColor="#0a0c1e" />
            </linearGradient>

            {/* Subtle top bevel stroke border gradient */}
            <linearGradient id="mobileNavBorderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2c3162" />
              <stop offset="50%" stopColor="#454e99" />
              <stop offset="100%" stopColor="#2c3162" />
            </linearGradient>
          </defs>

          <motion.path 
            d={svgPath} 
            fill="url(#mobileNavDarkGrad)" 
            stroke="url(#mobileNavBorderGrad)"
            strokeWidth="2.5"
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
          />
        </svg>

        {/* 5 Navigation Item Tabs */}
        <div className="relative z-10 w-full h-full flex items-center justify-around px-1 pt-1 pb-2">
          {MOBILE_NAV_ITEMS.map((item, idx) => {
            const isActive = activeIndex === idx;

            return (
              <Link 
                key={item.id} 
                href={item.href}
                className="relative flex-1 h-full flex flex-col items-center justify-end pb-3 pt-1 outline-none group"
              >
                {isActive ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-between">
                    {/* 
                      Selected Button exactly matching the reference image:
                      - Squircle / rounded rectangle with smooth continuous curvature
                      - Dual-gradient border: glowing electric blue/cyan on the left, rich lilac/violet/magenta on the right
                      - Dark purple-indigo interior gradient
                      - Glowing ambient drop shadow
                    */}
                    <motion.div
                      layoutId="mobileActiveSquircleButton"
                      className="absolute -top-3.5 sm:-top-4 w-[58px] h-[58px] rounded-[22px] p-[1.8px] bg-gradient-to-tr from-[#38bdf8] via-[#818cf8] to-[#d946ef] shadow-[0_10px_26px_rgba(112,68,229,0.45),0_18px_36px_rgba(0,0,0,0.9)] flex items-center justify-center z-20 cursor-pointer active:scale-95 transition-transform"
                      transition={{ type: "spring", stiffness: 440, damping: 30 }}
                    >
                      {/* Inner Dark Violet/Indigo Glass Surface */}
                      <div className="w-full h-full rounded-[20px] bg-gradient-to-b from-[#251d56] via-[#1a1542] to-[#120e2f] shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.25),inset_0_-2px_4px_rgba(0,0,0,0.6)] flex items-center justify-center">
                        <NavIcon3D id={item.id} isActive={true} />
                      </div>
                    </motion.div>

                    {/* Spacer to push label below the raised squircle button */}
                    <div className="h-[44px]" />

                    {/* Active Label in Soft Bright Lavender/White */}
                    <span className="text-[11px] font-black text-violet-200 tracking-tight z-10 text-center leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                      {item.shortName}
                    </span>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex flex-col items-center justify-center pt-5">
                    <NavIcon3D id={item.id} isActive={false} />
                    <span className="text-[11px] font-semibold text-slate-400 group-hover:text-violet-200 tracking-tight mt-1 text-center leading-none transition-colors duration-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      {item.shortName}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}


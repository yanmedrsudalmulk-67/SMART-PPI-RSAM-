'use client';

import { useState, useEffect, memo } from 'react';
import { Clock } from 'lucide-react';

export const ClockWidget = memo(() => {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const mt = setTimeout(() => setMounted(true), 0);
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => {
      clearTimeout(mt);
      clearInterval(interval);
    };
  }, []);

  if (!mounted) return (
    <div className="flex items-center gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border animate-pulse bg-[#16122e]/60 border-indigo-500/20">
      <Clock className="w-4 h-4 text-indigo-400" />
      <div className="w-20 h-8 bg-indigo-500/10 rounded-lg"></div>
    </div>
  );

  return (
    <div className="flex items-center gap-3 px-3.5 sm:px-4 py-2 rounded-2xl border transition-all duration-300 shadow-[-4px_-4px_12px_rgba(130,160,255,0.08),6px_8px_18px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.15),inset_-1px_-1px_1.5px_rgba(0,0,0,0.35)] bg-gradient-to-br from-[#231b4b]/80 via-[#18224e]/75 to-[#0e1635]/85 backdrop-blur-xl border-indigo-200/20 hover:border-indigo-200/40 hover:shadow-[-6px_-6px_16px_rgba(130,160,255,0.12),8px_12px_24px_rgba(0,0,0,0.7)]">
      <div className="flex items-center justify-center transition-colors duration-300 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.4)]">
        <Clock className="w-4 h-4" />
      </div>
      <div className="flex flex-col items-start min-w-[90px]">
        <span className="text-[9px] uppercase tracking-widest font-black transition-colors duration-300 text-indigo-200/90">
          {time.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
        <span className="text-xs font-black font-mono tracking-widest leading-none mt-0.5 transition-colors duration-300 text-white drop-shadow-sm">
          {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </div>
  );
});

ClockWidget.displayName = 'ClockWidget';

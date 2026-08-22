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
    <div className="flex items-center gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border animate-pulse bg-[#10243C]/60 border-sky-400/20">
      <Clock className="w-4 h-4 text-sky-400" />
      <div className="w-20 h-8 bg-sky-400/10 rounded-lg"></div>
    </div>
  );

  return (
    <div className="flex items-center gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border transition-all duration-500 shadow-lg bg-[#10243C]/80 border-sky-400/25 hover:bg-[#152E4C] hover:border-sky-400/40">
      <div className="flex items-center justify-center transition-colors duration-500 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
        <Clock className="w-4 h-4 text-sky-400" />
      </div>
      <div className="flex flex-col items-start min-w-[90px]">
        <span className="text-[9px] uppercase tracking-widest font-bold transition-colors duration-500 text-sky-200/80">
          {time.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
        <span className="text-xs font-bold font-mono tracking-widest leading-none mt-0.5 transition-colors duration-500 text-white">
          {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </div>
  );
});

ClockWidget.displayName = 'ClockWidget';

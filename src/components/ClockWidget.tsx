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
    <div className="flex items-center gap-3 px-3.5 sm:px-4 py-2 rounded-2xl border shadow-[-4px_-4px_12px_rgba(130,160,255,0.06),6px_8px_18px_rgba(0,0,0,0.55),inset_1px_1px_1.5px_rgba(255,255,255,0.15)] bg-gradient-to-br from-[#211b46] via-[#172047] to-[#0f1633] border-indigo-200/20 hover:border-indigo-200/40 transition-colors duration-200">
      <div className="flex items-center justify-center text-indigo-300">
        <Clock className="w-4 h-4" />
      </div>
      <div className="flex flex-col items-start min-w-[90px]">
        <span className="text-[9px] uppercase tracking-widest font-black text-indigo-200/90">
          {time.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
        <span className="text-xs font-black font-mono tracking-widest leading-none mt-0.5 text-white tabular-nums">
          {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </div>
  );
});

ClockWidget.displayName = 'ClockWidget';

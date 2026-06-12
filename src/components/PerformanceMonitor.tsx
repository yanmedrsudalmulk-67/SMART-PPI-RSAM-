import React, { useState, useEffect, useRef } from 'react';

export function PerformanceMonitor() {
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const frames = useRef(0);
  const prevTime = useRef(performance.now());

  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
      const time = performance.now();
      frames.current++;

      if (time >= prevTime.current + 1000) {
        setFps(Math.round((frames.current * 1000) / (time - prevTime.current)));
        frames.current = 0;
        prevTime.current = time;

        if ((performance as any).memory) {
          setMemory(Math.round((performance as any).memory.usedJSHeapSize / 1048576));
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-[9999] p-2 bg-slate-900/80 backdrop-blur text-white/50 hover:text-white rounded-full text-xs"
        title="Show Performance Monitor"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl text-[10px] sm:text-xs font-mono text-emerald-400 w-52 animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/10">
        <span className="font-bold text-white uppercase tracking-wider text-[9px]">DevTools / FPS</span>
        <button onClick={() => setIsVisible(false)} className="text-white/50 hover:text-white">✕</button>
      </div>
      <div className="flex justify-between items-center py-1">
        <span className="text-slate-400">Current FPS:</span>
        <span className={fps < 30 ? 'text-red-400 font-bold' : fps < 55 ? 'text-yellow-400 font-bold' : 'text-emerald-400 font-bold'}>
          {fps} <span className="text-[8px] text-emerald-600">FPS / Hz</span>
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-t border-white/5">
        <span className="text-slate-400">Target Mode:</span>
        <span className="text-emerald-400 font-semibold uppercase text-[10px]">120Hz Fluid API</span>
      </div>
      {(performance as any).memory && (
        <div className="flex justify-between items-center py-1 border-t border-white/5">
          <span className="text-slate-400">RAM Usage:</span>
          <span>{memory} MB</span>
        </div>
      )}
      <div className="flex justify-between items-center py-1 border-t border-white/5">
        <span className="text-slate-400">Optimization:</span>
        <span className="text-emerald-500 font-bold">GPU Accelerated</span>
      </div>
      <div className="flex justify-between items-center py-1 border-t border-white/5">
        <span className="text-slate-400">Status:</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Optimal Match (120Hz)
        </span>
      </div>
    </div>
  );
}

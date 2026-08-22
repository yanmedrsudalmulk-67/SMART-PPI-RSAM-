import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { 
  BarChart2, User, ChevronDown, CheckCircle2, ShieldCheck, Activity, Users, 
  MapPin, Clock, Calendar as CalendarIcon, Check, X, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine, ComposedChart, Line, Cell
} from '@/components/ChartComponents';
import { format, parseISO } from 'date-fns';
import { useAppContext } from '@/components/Providers';
import { ReportSkeleton } from '@/components/SkeletonLoading';


const ProfessionFilter = ({ 
  selectedProfessions, 
  setSelectedProfessions, 
  allProfessions 
}: { 
  selectedProfessions: string[], 
  setSelectedProfessions: React.Dispatch<React.SetStateAction<string[]>>,
  allProfessions: string[]
}) => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg px-3 py-2 outline-none w-48 justify-between hover:border-blue-500/50 transition-colors"
      >
        <span className="truncate">{selectedProfessions.length > 0 ? `${selectedProfessions.length} Profesi dipilih` : 'Semua Profesi'}</span>
        <ChevronDown className="w-4 h-4 flex-shrink-0" />
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
                onClick={() => setOpen(false)} 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl p-6 max-h-[80vh] flex flex-col"
              >
                <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">Filter Profesi</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Pilih profesi untuk dianalisis</p>
                    </div>
                    <button 
                      onClick={() => setOpen(false)} 
                      className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5"/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                  <label className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl cursor-pointer transition-colors group">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${selectedProfessions.length === 0 ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-white/20'}`}>
                      {selectedProfessions.length === 0 && <Check className="w-3 h-3 text-white stroke-[4]" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={selectedProfessions.length === 0} 
                      onChange={() => setSelectedProfessions([])} 
                    />
                    <span className="text-sm font-bold text-slate-700 dark:text-white group-hover:text-blue-500 transition-colors">Semua Profesi</span>
                  </label>

                  <div className="h-px bg-slate-200 dark:bg-white/10 my-3 ml-3" />

                  {allProfessions.length === 0 && (
                    <div className="p-8 text-center text-slate-400 font-medium text-xs">
                      Tidak ada data profesi ditemukan
                    </div>
                  )}

                  {allProfessions.map(prof => {
                    const isSelected = selectedProfessions.includes(prof);
                    return (
                      <label key={prof} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl cursor-pointer transition-colors group">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-white/20'}`}>
                          {isSelected && <Check className="w-3 h-3 text-white stroke-[4]" />}
                        </div>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={isSelected} 
                          onChange={() => {
                            setSelectedProfessions(prev => prev.includes(prof) ? prev.filter(p => p !== prof) : [...prev, prof]);
                          }} 
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-white uppercase group-hover:text-blue-500 transition-colors">{prof}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
                  <button 
                    onClick={() => setOpen(false)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                  >
                    Selesai
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default function HandHygieneReport({ 
  filters 
}: { 
  filters: { searchQuery: string, periode: string, type: string, unitFilter?: string } 
}) {
  const { hospitalLogoUrl } = useAppContext();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'bar'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('hh_report_chart_type') as 'line' | 'bar') || 'line';
    }
    return 'line';
  });

  useEffect(() => {
    localStorage.setItem('hh_report_chart_type', chartType);
  }, [chartType]);
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [professionsOpen, setProfessionsOpen] = useState(false);


  const M1M5Info = () => {
    const items = [
      { id: 'M1', label: 'Sebelum kontak dengan pasien' },
      { id: 'M2', label: 'Sebelum tindakan aseptik' },
      { id: 'M3', label: 'Setelah terkena cairan tubuh pasien' },
      { id: 'M4', label: 'Setelah kontak dengan pasien' },
      { id: 'M5', label: 'Setelah kontak dengan lingkungan pasien' },
    ];
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {items.map(m => (
          <div key={m.id} className="p-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm hover:border-emerald-500/50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm mb-2">{m.id}</div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.label}</p>
          </div>
        ))}
      </div>
    );
  };

  const AuditLegend = () => (
    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
      {[
        { icon: <Check className="w-3 h-3 text-emerald-500" />, label: 'Handrub', color: 'text-emerald-500' },
        { icon: <Check className="w-3 h-3 text-blue-500" />, label: 'Handwash', color: 'text-blue-500' },
        { icon: <X className="w-3 h-3 text-rose-500" />, label: 'Tidak Patuh', color: 'text-rose-500' },
        { icon: <span className="text-slate-400">-</span>, label: 'N/A', color: 'text-slate-400' },
      ].map((l, i) => (
        <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-white/5">
          {l.icon}
          <span className={`text-[10px] font-bold ${l.color}`}>{l.label}</span>
        </div>
      ))}
    </div>
  );

  const normalizeHH = (item: any) => {
    const json = item.data_indikator || item.checklist_json || {};
    return {
      ...item,
      id: item.id,
      observer: item.observer || item.supervisor || '',
      unit: item.unit || item.ruangan || '',
      profesi: item.profesi || json.profesi || 'LAINNYA',
      start_time: item.start_time || item.tanggal_waktu || item.created_at,
      end_time: item.end_time || item.tanggal_waktu || item.start_time || item.created_at,
      m1: item.m1 || json.m1 || null,
      m2: item.m2 || json.m2 || null,
      m3: item.m3 || json.m3 || null,
      m4: item.m4 || json.m4 || null,
      m5: item.m5 || json.m5 || null,
      peluang: item.peluang !== undefined ? item.peluang : item.jumlah_dinilai !== undefined ? item.jumlah_dinilai : 0,
      patuh: item.patuh !== undefined ? item.patuh : item.jumlah_patuh !== undefined ? item.jumlah_patuh : 0,
      persentase: item.persentase !== undefined ? item.persentase : 0,
    };
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [hhRes, sessionsRes] = await Promise.all([
        supabase.from('audit_hand_hygiene').select('*').order('start_time', { ascending: false }),
        supabase.from('audit_sessions').select('*').eq('indikator_id', 'audit_hand_hygiene').order('tanggal_waktu', { ascending: false })
      ]);

      const raw = [...(hhRes.data || []), ...(sessionsRes.data || [])];
      const seen = new Set<string>();
      const combined = raw.filter(item => {
        if (!item.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      }).map(normalizeHH);

      combined.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
      setData(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const ch = supabase.channel('audit_hand_hygiene_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_hand_hygiene' }, () => {
         fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_sessions', filter: 'indikator_id=eq.audit_hand_hygiene' }, () => {
         fetchData();
      })
      .on('broadcast', { event: 'audit_submitted' }, (payload) => {
        if (payload?.payload?.indikator_id === 'audit_hand_hygiene') {
          fetchData();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchData]);

  // Ensure scroll resets to top when data loading finishes
  useEffect(() => {
    const scrollToTop = () => {
      const mainEl = document.querySelector("main");
      if (mainEl) {
        mainEl.scrollTop = 0;
        mainEl.scrollTo({ top: 0, behavior: "instant" as any });
      }
      const scrollableElements = document.querySelectorAll('.overflow-y-auto');
      scrollableElements.forEach(el => {
        el.scrollTop = 0;
      });
      window.scrollTo({ top: 0, behavior: "instant" as any });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    if (!loading) {
      scrollToTop();
      requestAnimationFrame(scrollToTop);
      setTimeout(scrollToTop, 50);
      setTimeout(scrollToTop, 150);
    }
  }, [loading]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (selectedProfessions.length > 0) {
        if (!item.profesi || !selectedProfessions.includes(item.profesi.trim().toUpperCase())) return false;
      }
      if (filters.unitFilter && filters.unitFilter !== 'Semua Unit') {
        if (item.unit !== filters.unitFilter && item.ruangan !== filters.unitFilter) return false;
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!item.observer?.toLowerCase().includes(query) && !item.unit?.toLowerCase().includes(query) && !item.profesi?.toLowerCase().includes(query)) return false;
      }
      if (filters.periode) {
        const itemDateStr = item.start_time || item.tanggal_waktu;
        if (!itemDateStr) return false;
        const itemDate = new Date(itemDateStr);
        const filterDate = new Date(filters.periode);
        
        if (filters.type === 'Bulanan') {
          return itemDate.getUTCMonth() === filterDate.getUTCMonth() && 
                 itemDate.getUTCFullYear() === filterDate.getUTCFullYear();
        }
        
        if (itemDate < filterDate) return false;
      }
      return true;
    });
  }, [data, filters, selectedProfessions]);

  const allProfessions = useMemo(() => {
    const profs = new Set<string>();
    data.forEach(item => { if (item.profesi) profs.add(item.profesi.trim().toUpperCase()); });
    return Array.from(profs).sort();
  }, [data]);

  const { trendData, momentStats, overallStats } = useMemo(() => {
    if (filteredData.length === 0) return { 
      trendData: [], 
      momentStats: { m1: 0, m2: 0, m3: 0, m4: 0, m5: 0 },
      overallStats: { patuh: 0, total: 0, avg: 0 }
    };

    const getGroupKey = (dStr: string) => {
        if(!dStr) return "Unknown";
        const date = new Date(dStr);
        const y = date.getFullYear();
        const m = date.getMonth();
        return `${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"][m]}`;
    };

    const periodMap = new Map<string, any[]>();
    
    // Pre-fill months based on filter
    const filterDate = filters.periode ? new Date(filters.periode) : new Date();
    const fYear = filterDate.getFullYear();
    let startMonth = 0;
    let endMonth = 11;

    if (filters.type === 'Bulanan') {
        startMonth = filterDate.getMonth();
        endMonth = filterDate.getMonth();
    } else if (filters.type === 'Triwulan') {
        startMonth = Math.floor(filterDate.getMonth() / 3) * 3;
        endMonth = startMonth + 2;
    } else if (filters.type === 'Semester') {
        startMonth = Math.floor(filterDate.getMonth() / 6) * 6;
        endMonth = startMonth + 5;
    }

    for (let i = startMonth; i <= endMonth; i++) {
        const k = `${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"][i]}`;
        periodMap.set(k, []);
    }

    let totalPatuhMomen = 0;
    let totalActionMomen = 0;
    
    filteredData.forEach(row => {
      const key = getGroupKey(row.start_time || row.tanggal_waktu || '');
      if(periodMap.has(key)) {
        periodMap.get(key)!.push(row);
      }
    });

    const trend = Array.from(periodMap.entries()).map(([k, recs]) => {
       const group: any = { name: k };
       const profMap = new Map<string, { sum: number, count: number }>();
       
       recs.forEach(r => {
           const p = (r.profesi || 'LAINNYA').trim().toUpperCase();
           if (!profMap.has(p)) profMap.set(p, { sum: 0, count: 0 });
           const entry = profMap.get(p)!;
           entry.sum += (r.persentase || 0);
           entry.count++;
       });
       
       profMap.forEach((data, prof) => {
           group[prof] = Math.round(data.sum / data.count);
       });
       
       return group;
    });

    const mStats = { m1: {p:0, t:0}, m2: {p:0, t:0}, m3: {p:0, t:0}, m4: {p:0, t:0}, m5: {p:0, t:0} };
    filteredData.forEach(r => {
      const moments = ['m1', 'm2', 'm3', 'm4', 'm5'] as const;
      moments.forEach(m => {
        if (r[m] === 'hr' || r[m] === 'hw') { mStats[m].p++; mStats[m].t++; totalPatuhMomen++; totalActionMomen++; }
        else if (r[m] === 'miss') { mStats[m].t++; totalActionMomen++; }
      });
    });

    const momentPercentages = {
      m1: mStats.m1.t > 0 ? Math.round((mStats.m1.p / mStats.m1.t) * 100) : 0,
      m2: mStats.m2.t > 0 ? Math.round((mStats.m2.p / mStats.m2.t) * 100) : 0,
      m3: mStats.m3.t > 0 ? Math.round((mStats.m3.p / mStats.m3.t) * 100) : 0,
      m4: mStats.m4.t > 0 ? Math.round((mStats.m4.p / mStats.m4.t) * 100) : 0,
      m5: mStats.m5.t > 0 ? Math.round((mStats.m5.p / mStats.m5.t) * 100) : 0,
    };
    
    const avgOverall = filteredData.reduce((sum, r) => sum + (r.persentase || 0), 0) / filteredData.length;

    return { 
      trendData: trend, 
      momentStats: momentPercentages,
      overallStats: {
        patuh: totalPatuhMomen,
        total: totalActionMomen,
        avg: Math.round(avgOverall)
      }
    };
  }, [filteredData, filters.type, filters.periode]);

  const mapMomentAction = (val: string | null) => {
    if (val === 'hr') return <span className="flex justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></span>;
    if (val === 'hw') return <span className="flex justify-center"><CheckCircle2 className="w-4 h-4 text-blue-500" /></span>;
    if (val === 'miss') return <span className="flex justify-center"><X className="w-4 h-4 text-rose-500" /></span>;
    return <span className="flex justify-center text-slate-300 dark:text-slate-700">-</span>;
  };

  const calculateRowStats = (row: any) => {
    let patuh = 0;
    let tidakPatuh = 0;
    ['m1','m2','m3','m4','m5'].forEach(m => {
       if (row[m] === 'hr' || row[m] === 'hw') patuh++;
       else if (row[m] === 'miss') tidakPatuh++;
    });
    return { patuh, tidakPatuh };
  };

  const PROFESSION_COLORS: { [key: string]: string } = {
    'DOKTER': '#3b82f6', // blue
    'PERAWAT': '#10b981', // green
    'BIDAN': '#8b5cf6', // purple
    'FARMASI': '#f97316', // orange
    'ANALIS': '#06b6d4', // cyan
    'LAINNYA': '#64748b' // slate
  };

  const STANDARD_PPI = 85;

  const getProfessionColor = (prof: string) => PROFESSION_COLORS[prof] || '#64748b';

  const chartProfessions = useMemo(() => {
    if (selectedProfessions.length > 0) return selectedProfessions.map(p => p.toUpperCase());
    return allProfessions;
  }, [selectedProfessions, allProfessions]);

  const renderTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-[#0f172a]/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl">
          <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-2">{label}</p>
          <div className="space-y-1.5">
             {payload.map((entry: any, index: number) => {
                 return (
                 <div key={index} className="flex justify-between gap-4 text-xs font-bold items-center">
                    <span style={{ color: entry.stroke || entry.fill }}>{entry.name}:</span>
                    <span className="text-slate-700 dark:text-slate-300">
                        {entry.value}%
                    </span>
                 </div>
             )})}
          </div>
        </div>
      );
    }
    return null;
  };

  const generateAutoInsight = () => {
    return "Analisis tren disajikan per profesi.";
  };

  if (loading && !data.length) return <ReportSkeleton />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      
      {/* Filter Bar */}
      <div className="flex gap-4 p-4 bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-white/10 overflow-x-auto">
        <ProfessionFilter 
           selectedProfessions={selectedProfessions}
           setSelectedProfessions={setSelectedProfessions}
           allProfessions={allProfessions}
        />
      </div>
      
      <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm rounded-[2rem] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm transition-all -mx-4 sm:mx-0">
        <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#0f172a]">
           <div className="flex flex-col md:flex-row items-center gap-6">
             {hospitalLogoUrl && (
               <img src={hospitalLogoUrl} alt="Logo RS" className="w-20 h-20 object-contain" />
             )}
             <div className="text-center md:text-left">
               <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient uppercase tracking-tight">Laporan Audit Kebersihan Tangan</h2>
               <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 uppercase">UOBK RSUD AL-MULK KOTA SUKABUMI</h3>
               <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase">
                 Periode: {filters.periode ? (
                   (() => {
                     const date = parseISO(filters.periode);
                     const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                     return `${months[date.getMonth()]} ${date.getFullYear()}`;
                   })()
                 ) : '-'}
               </p>
             </div>
           </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <th className="px-4 py-4 border-b border-slate-200 dark:border-white/5">WAKTU MULAI</th>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-white/5">WAKTU SELESAI</th>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-white/5 text-left">OBSERVER</th>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-white/5 text-left">UNIT</th>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-white/5">PROFESI</th>
                <th className="px-2 py-4 border-b border-slate-200 dark:border-white/5">M1</th>
                <th className="px-2 py-4 border-b border-slate-200 dark:border-white/5">M2</th>
                <th className="px-2 py-4 border-b border-slate-200 dark:border-white/5">M3</th>
                <th className="px-2 py-4 border-b border-slate-200 dark:border-white/5">M4</th>
                <th className="px-2 py-4 border-b border-slate-200 dark:border-white/5">M5</th>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400">PELUANG HAND HYGIENE</th>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-white/5 text-emerald-600 dark:text-emerald-400">HAND HYGIENE YANG DILAKUKAN</th>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-white/5 text-blue-600 dark:text-blue-400">PERSENTASE (TOTAL)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-[10px] sm:text-xs font-bold text-slate-900 dark:text-slate-300">
              {filteredData.map((row) => {
                return (
                  <tr key={row.id} className="hover:bg-blue-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-4">
                      {row.start_time || row.tanggal_waktu ? format(parseISO(row.start_time || row.tanggal_waktu), 'dd/MM/yyyy HH:mm') : '-'}
                    </td>
                    <td className="px-4 py-4">
                      {row.end_time ? format(parseISO(row.end_time), 'dd/MM/yyyy HH:mm') : '-'}
                    </td>
                    <td className="px-4 py-4 text-left font-normal italic text-slate-500 whitespace-nowrap">{row.observer || '-'}</td>
                    <td className="px-4 py-4 text-left font-normal text-slate-500">{row.unit || '-'}</td>
                    <td className="px-4 py-4 uppercase text-slate-700 dark:text-slate-300">{row.profesi || '-'}</td>
                    <td className="px-2 py-4">{mapMomentAction(row.m1)}</td>
                    <td className="px-2 py-4">{mapMomentAction(row.m2)}</td>
                    <td className="px-2 py-4">{mapMomentAction(row.m3)}</td>
                    <td className="px-2 py-4">{mapMomentAction(row.m4)}</td>
                    <td className="px-2 py-4">{mapMomentAction(row.m5)}</td>
                    <td className="px-4 py-4 text-rose-600 dark:text-rose-400 font-black">{row.peluang || 0}</td>
                    <td className="px-4 py-4 text-emerald-600 dark:text-emerald-400 font-black">{row.patuh || 0}</td>
                    <td className="px-4 py-4 font-black">
                      <span className={`px-2 py-1 rounded-full text-[10px] ${
                        (row.persentase || 0) >= 85 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                        (row.persentase || 0) >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                      }`}>
                        {row.persentase || 0}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-4 py-12 text-center text-slate-500 font-medium">Belum ada data untuk periode ini</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <M1M5Info />
      <AuditLegend />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-[2rem] p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] group-hover:bg-blue-500/20 transition-all" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Observasi</h4>
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{filteredData.length}</p>
              </div>
            </div>
         </div>
         
         <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-[2rem] p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] group-hover:bg-emerald-500/20 transition-all" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Tindakan (Momen)</h4>
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{overallStats.patuh} / {overallStats.total}</p>
              </div>
            </div>
         </div>

         <div className="bg-gradient-to-br from-emerald-500 to-blue-600 rounded-[2rem] p-6 border border-white/20 shadow-lg relative overflow-hidden group text-white h-full flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-white/20 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Rata-rata Kepatuhan</h4>
                <p className="text-4xl font-black leading-none mt-1">{overallStats.avg}%</p>
              </div>
            </div>
         </div>
      </div>

      {/* Recaps Percentage Per Moment (Circular Progress) */}
      <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6 px-2">Analisis Persentase Per Momen</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(momentStats).map(([moment, perc], idx) => {
            const isTargetMet = perc >= 85;
            return (
              <div key={moment} className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                 <div className="relative w-16 h-16 flex items-center justify-center mb-3">
                   <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-200 dark:text-slate-700" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className={`${isTargetMet ? 'text-emerald-500' : 'text-rose-500'} drop-shadow-sm transition-all duration-1000`} strokeDasharray={`${perc}, 100`} strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                   </svg>
                   <span className="absolute text-xs font-black text-slate-900 dark:text-white">{perc}%</span>
                 </div>
                 <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center">Momen {idx + 1}</h4>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm pt-6 sm:pt-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex px-6 sm:px-8 justify-between items-center mb-8">
           <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
             <BarChart2 className="w-5 h-5 text-emerald-500" /> Analitik Tren Kepatuhan
           </h3>
           <div className="flex gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
             <button onClick={() => setChartType('line')} className={`px-4 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${chartType === 'line' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>Run Chart</button>
             <button onClick={() => setChartType('bar')} className={`px-4 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${chartType === 'bar' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>Bar Chart</button>
           </div>
        </div>
        <div className="h-[300px] w-full px-8">
          <ResponsiveContainer width="100%" height="100%">
             {chartType === 'line' ? (
               <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                 <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} axisLine={false} tickLine={false} dx={-10} />
                 <Tooltip content={renderTooltipContent} cursor={{ fill: 'rgba(255,255,255,0.02)' }}/>
                 {chartProfessions.map(prof => (
                   <Line key={prof} type="monotone" dataKey={prof} stroke={getProfessionColor(prof)} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                 ))}
                 <ReferenceLine y={STANDARD_PPI} stroke="#06b6d4" strokeDasharray="5 5" label={{ position: 'top', value: `Standar ${STANDARD_PPI}%`, fill: '#06b6d4', fontSize: 10 }} />
               </ComposedChart>
             ) : (
               <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                 <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} axisLine={false} tickLine={false} dx={-10} />
                 <Tooltip content={renderTooltipContent} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                 {chartProfessions.map(prof => (
                   <Bar key={prof} dataKey={prof} fill={getProfessionColor(prof)} radius={[4, 4, 0, 0]} />
                 ))}
                 <ReferenceLine y={STANDARD_PPI} stroke="#06b6d4" strokeDasharray="5 5" label={{ position: 'top', value: `Standar ${STANDARD_PPI}%`, fill: '#06b6d4', fontSize: 10 }} />
               </ComposedChart>
             )}
          </ResponsiveContainer>
        </div>

        {/* Auto Insight Card */}
        <div className="px-8 pb-8 pt-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-[#1e293b]/50 border border-blue-100 dark:border-white/5">
                <div className="flex-1">
                   <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Analisa Data</h4>
                   <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 text-justify leading-relaxed">{generateAutoInsight()}</p>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { 
  BarChart2, User, ChevronDown, CheckCircle2, ShieldCheck, Activity, Users, 
  MapPin, Clock, Calendar as CalendarIcon, Check, X, TrendingUp, Edit, Trash2, AlertTriangle
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
          <div key={m.id} className="relative p-5 bg-[#18193b] border border-[#2b2d56] rounded-[22px] shadow-[-4px_-4px_12px_rgba(140,165,255,0.05),6px_8px_20px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.15)] overflow-hidden group">
            <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xs mb-3 shadow-[0_4px_10px_rgba(16,185,129,0.4),inset_1px_1px_2px_rgba(255,255,255,0.4)]">{m.id}</div>
            <p className="text-xs font-bold text-slate-200 leading-relaxed">{m.label}</p>
          </div>
        ))}
      </div>
    );
  };

  const AuditLegend = () => (
    <div className="flex flex-wrap gap-2.5 p-4 bg-[#12132e] rounded-2xl border border-indigo-900/40 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
      {[
        { icon: <Check className="w-3.5 h-3.5 text-emerald-400" />, label: 'Handrub', color: 'text-emerald-300' },
        { icon: <Check className="w-3.5 h-3.5 text-blue-400" />, label: 'Handwash', color: 'text-blue-300' },
        { icon: <X className="w-3.5 h-3.5 text-rose-400" />, label: 'Tidak Patuh', color: 'text-rose-300' },
        { icon: <span className="text-slate-400 font-bold">-</span>, label: 'N/A', color: 'text-slate-400' },
      ].map((l, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-[#18193b] rounded-xl border border-white/10 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.4)]">
          {l.icon}
          <span className={`text-[11px] font-black uppercase tracking-wider ${l.color}`}>{l.label}</span>
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

  const router = useSafeRouter();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditClick = (recordId: string) => {
    router.push(`/dashboard/input/hand-hygiene?id=${recordId}&mode=edit`);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      await supabase.from("audit_hand_hygiene").delete().eq("id", deleteConfirmId);
      await supabase.from("audit_sessions").delete().eq("id", deleteConfirmId);
      await fetchData();
    } catch (err: any) {
      console.error("Gagal menghapus data:", err);
      alert("Gagal menghapus data: " + (err.message || err));
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [hhRes, sessionsRes] = await Promise.all([
        supabase.from('audit_hand_hygiene').select('*').order('start_time', { ascending: true }),
        supabase.from('audit_sessions').select('*').eq('indikator_id', 'audit_hand_hygiene').order('tanggal_waktu', { ascending: true })
      ]);

      const sessions = (sessionsRes.data || []).map(normalizeHH);
      const hh = (hhRes.data || []).map(normalizeHH);

      const seenIds = new Set<string>();
      const seenKeys = new Set<string>();
      const combined: any[] = [];

      for (const item of sessions) {
        if (!item.id || seenIds.has(item.id)) continue;
        seenIds.add(item.id);
        const obs = (item.observer || '').toLowerCase().trim();
        const unt = (item.unit || '').toLowerCase().trim();
        const timeKey = item.start_time ? new Date(item.start_time).toISOString().substring(0, 16) : '';
        if (obs && unt && timeKey) {
          seenKeys.add(`${obs}_${unt}_${timeKey}`);
        }
        combined.push(item);
      }

      for (const item of hh) {
        if (!item.id || seenIds.has(item.id)) continue;
        const obs = (item.observer || '').toLowerCase().trim();
        const unt = (item.unit || '').toLowerCase().trim();
        const timeKey = item.start_time ? new Date(item.start_time).toISOString().substring(0, 16) : '';
        const key = `${obs}_${unt}_${timeKey}`;
        if (obs && unt && timeKey && seenKeys.has(key)) continue;

        seenIds.add(item.id);
        if (obs && unt && timeKey) seenKeys.add(key);
        combined.push(item);
      }

      combined.sort((a, b) => new Date(a.start_time || 0).getTime() - new Date(b.start_time || 0).getTime());
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
        try {
          mainEl.scrollTo({ top: 0, behavior: "instant" as any });
        } catch (_) {}
      }
      const scrollableElements = document.querySelectorAll('.overflow-y-auto, [data-scroll-container]');
      scrollableElements.forEach(el => {
        el.scrollTop = 0;
      });

      const headerEl = document.getElementById('report-detail-header') || document.getElementById('report-top-anchor');
      if (headerEl) {
        try {
          headerEl.scrollIntoView({ behavior: 'instant' as any, block: 'start' });
        } catch (_) {}
      }

      try {
        window.scrollTo({ top: 0, behavior: "instant" as any });
      } catch (_) {}
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    scrollToTop();
    requestAnimationFrame(scrollToTop);
    setTimeout(scrollToTop, 30);
    setTimeout(scrollToTop, 100);
    setTimeout(scrollToTop, 250);
    setTimeout(scrollToTop, 500);
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
      <div className="flex gap-4 p-4 bg-[#18193b] rounded-[24px] border border-[#2b2d56] shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] overflow-x-auto">
        <ProfessionFilter 
           selectedProfessions={selectedProfessions}
           setSelectedProfessions={setSelectedProfessions}
           allProfessions={allProfessions}
        />
      </div>
      
      {/* Tabel Data Audit */}
      <div className="bg-[#18193b] rounded-[28px] md:rounded-[32px] border border-[#2b2d56] overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] relative group transition-all -mx-4 sm:mx-0">
        {/* Top Bevel Highlight */}
        <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="p-6 sm:p-8 border-b border-indigo-900/30 bg-[#141532]/60 backdrop-blur-md">
           <div className="flex flex-col md:flex-row items-center gap-6">
             {hospitalLogoUrl && (
               <img src={hospitalLogoUrl} alt="Logo RS" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
             )}
             <div className="text-center md:text-left">
               <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-300 uppercase tracking-tight">Laporan Audit Kebersihan Tangan</h2>
               <h3 className="text-base sm:text-lg font-black text-slate-200 uppercase mt-0.5">UOBK RSUD AL-MULK KOTA SUKABUMI</h3>
               <p className="text-slate-400 font-bold text-xs sm:text-sm mt-1 uppercase tracking-wider">
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
          <table className="w-full text-center border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#12132e] text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-indigo-900/30">
                <th className="px-4 py-4">WAKTU MULAI</th>
                <th className="px-4 py-4">WAKTU SELESAI</th>
                <th className="px-4 py-4 text-left">OBSERVER</th>
                <th className="px-4 py-4 text-left">UNIT</th>
                <th className="px-4 py-4">PROFESI</th>
                <th className="px-2 py-4">M1</th>
                <th className="px-2 py-4">M2</th>
                <th className="px-2 py-4">M3</th>
                <th className="px-2 py-4">M4</th>
                <th className="px-2 py-4">M5</th>
                <th className="px-4 py-4 text-rose-400">PELUANG HAND HYGIENE</th>
                <th className="px-4 py-4 text-emerald-400">HAND HYGIENE DILAKUKAN</th>
                <th className="px-4 py-4 text-cyan-400">PERSENTASE</th>
                <th className="px-4 py-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[10px] sm:text-xs font-bold text-slate-200">
              {filteredData.map((row) => {
                return (
                  <tr key={row.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-4 py-4 text-slate-300 font-mono">
                      {row.start_time || row.tanggal_waktu ? format(parseISO(row.start_time || row.tanggal_waktu), 'dd/MM/yyyy HH:mm') : '-'}
                    </td>
                    <td className="px-4 py-4 text-slate-300 font-mono">
                      {row.end_time ? format(parseISO(row.end_time), 'dd/MM/yyyy HH:mm') : '-'}
                    </td>
                    <td className="px-4 py-4 text-left font-normal italic text-slate-400">{row.observer || '-'}</td>
                    <td className="px-4 py-4 text-left font-semibold text-white">{row.unit || '-'}</td>
                    <td className="px-4 py-4 uppercase text-slate-300 font-bold">{row.profesi || '-'}</td>
                    <td className="px-2 py-4">{mapMomentAction(row.m1)}</td>
                    <td className="px-2 py-4">{mapMomentAction(row.m2)}</td>
                    <td className="px-2 py-4">{mapMomentAction(row.m3)}</td>
                    <td className="px-2 py-4">{mapMomentAction(row.m4)}</td>
                    <td className="px-2 py-4">{mapMomentAction(row.m5)}</td>
                    <td className="px-4 py-4 text-rose-400 font-black font-mono">{row.peluang || 0}</td>
                    <td className="px-4 py-4 text-emerald-400 font-black font-mono">{row.patuh || 0}</td>
                    <td className="px-4 py-4 font-black">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] ${
                        (row.persentase || 0) >= 85 ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' :
                        (row.persentase || 0) >= 70 ? 'bg-amber-950/80 text-amber-300 border-amber-500/40' :
                        'bg-rose-950/80 text-rose-300 border-rose-500/40'
                      }`}>
                        {row.persentase || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(row.id)}
                          type="button"
                          className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-200 shadow-sm border border-blue-500/20"
                          title="Edit Data"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(row.id)}
                          type="button"
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-200 shadow-sm border border-rose-500/20"
                          title="Hapus Data"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-4 py-12 text-center text-slate-400 font-bold uppercase tracking-wider">Belum ada data untuk periode ini</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <M1M5Info />
      <AuditLegend />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Card 1 */}
         <div className="group relative bg-[#18193b] p-6 sm:p-7 rounded-[28px] md:rounded-[32px] border border-[#2b2d56] transition-all duration-300 transform-gpu hover:-translate-y-1.5 overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] flex flex-col justify-between">
            <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Total Observasi
                </span>
                <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                  Jumlah Sesi Audit
                </h3>
              </div>
              <div className="shrink-0">
                <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#272952] to-[#12132d] border-2 border-indigo-400/30 shadow-[-3px_-3px_10px_rgba(140,165,255,0.12),6px_8px_18px_rgba(0,0,0,0.7),inset_1.5px_1.5px_2px_rgba(255,255,255,0.2)] flex items-center justify-center">
                  <div className="w-9 h-9 rounded-[14px] bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 shadow-[0_6px_16px_rgba(59,130,246,0.5),inset_1px_1px_2px_rgba(255,255,255,0.4)] flex items-center justify-center text-white">
                    <Users className="w-5 h-5 drop-shadow" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-auto bg-[#12132e] rounded-2xl p-4 border border-black/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
              <span className="text-3xl sm:text-4xl font-black font-mono text-cyan-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                {filteredData.length}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Sesi Terdata</span>
            </div>
         </div>
         
         {/* Card 2 */}
         <div className="group relative bg-[#18193b] p-6 sm:p-7 rounded-[28px] md:rounded-[32px] border border-[#2b2d56] transition-all duration-300 transform-gpu hover:-translate-y-1.5 overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] flex flex-col justify-between">
            <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Total Tindakan Momen
                </span>
                <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                  Kepatuhan Tindakan
                </h3>
              </div>
              <div className="shrink-0">
                <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#272952] to-[#12132d] border-2 border-indigo-400/30 shadow-[-3px_-3px_10px_rgba(140,165,255,0.12),6px_8px_18px_rgba(0,0,0,0.7),inset_1.5px_1.5px_2px_rgba(255,255,255,0.2)] flex items-center justify-center">
                  <div className="w-9 h-9 rounded-[14px] bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 shadow-[0_6px_16px_rgba(16,185,129,0.5),inset_1px_1px_2px_rgba(255,255,255,0.4)] flex items-center justify-center text-white">
                    <Activity className="w-5 h-5 drop-shadow" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-auto bg-[#12132e] rounded-2xl p-4 border border-black/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] flex items-baseline justify-between">
              <div>
                <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                  {overallStats.patuh}
                </span>
                <span className="text-slate-400 font-mono text-lg font-bold ml-1">/ {overallStats.total}</span>
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Momen Patuh</span>
            </div>
         </div>

         {/* Card 3 */}
         <div className="group relative bg-[#18193b] p-6 sm:p-7 rounded-[28px] md:rounded-[32px] border border-[#2b2d56] transition-all duration-300 transform-gpu hover:-translate-y-1.5 overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] flex flex-col justify-between">
            <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Rata-rata Kepatuhan
                </span>
                <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                  Capaian Periode Ini
                </h3>
              </div>
              <div className="shrink-0">
                <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#272952] to-[#12132d] border-2 border-indigo-400/30 shadow-[-3px_-3px_10px_rgba(140,165,255,0.12),6px_8px_18px_rgba(0,0,0,0.7),inset_1.5px_1.5px_2px_rgba(255,255,255,0.2)] flex items-center justify-center">
                  <div className="w-9 h-9 rounded-[14px] bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 shadow-[0_6px_16px_rgba(168,85,247,0.5),inset_1px_1px_2px_rgba(255,255,255,0.4)] flex items-center justify-center text-white">
                    <ShieldCheck className="w-5 h-5 drop-shadow" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-auto bg-[#12132e] rounded-2xl p-4 border border-black/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] flex items-center justify-between">
              <span className={`text-4xl font-black font-mono tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] ${overallStats.avg >= 85 ? "text-emerald-400" : "text-rose-400"}`}>
                {overallStats.avg}%
              </span>
              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] ${overallStats.avg >= 85 ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" : "bg-rose-950/80 text-rose-300 border-rose-500/40"}`}>
                {overallStats.avg >= 85 ? "Tercapai" : "Di Bawah Standar"}
              </span>
            </div>
         </div>
      </div>

      {/* Recaps Percentage Per Moment (Circular Progress) */}
      <div className="bg-[#18193b] rounded-[28px] md:rounded-[32px] border border-[#2b2d56] p-6 sm:p-7 shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 px-1">Analisis Persentase Per Momen</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(momentStats).map(([moment, perc], idx) => {
            const isTargetMet = perc >= 85;
            return (
              <div key={moment} className="flex flex-col items-center justify-center p-5 bg-[#12132e] rounded-2xl border border-indigo-900/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] hover:border-indigo-500/40 transition-colors">
                 <div className="relative w-16 h-16 flex items-center justify-center mb-3">
                   <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className={`${isTargetMet ? 'text-emerald-400' : 'text-rose-400'} drop-shadow-sm transition-all duration-1000`} strokeDasharray={`${perc}, 100`} strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                   </svg>
                   <span className="absolute text-xs font-black text-white font-mono">{perc}%</span>
                 </div>
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Momen {idx + 1}</h4>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart and Analytics Section */}
      <div className="bg-[#18193b] rounded-[28px] md:rounded-[32px] border border-[#2b2d56] shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] overflow-hidden relative group">
        <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="flex px-6 sm:px-8 py-5 justify-between items-center border-b border-indigo-900/30 bg-[#141532]/60 backdrop-blur-md mb-6">
           <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-3">
             <BarChart2 className="w-5 h-5 text-emerald-400" /> Grafik Tren Kepatuhan
           </h3>
           <div className="flex gap-1.5 bg-[#12132e] p-1 rounded-xl border border-indigo-900/40 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
             <button onClick={() => setChartType('line')} className={`px-3.5 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all ${chartType === 'line' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Run Chart</button>
             <button onClick={() => setChartType('bar')} className={`px-3.5 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all ${chartType === 'bar' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Bar Chart</button>
           </div>
        </div>
        <div className="h-[300px] w-full px-6 sm:px-8">
          <ResponsiveContainer width="100%" height="100%">
             {chartType === 'line' ? (
               <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                 <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} axisLine={false} tickLine={false} dx={-10} />
                 <Tooltip content={renderTooltipContent} cursor={{ fill: 'rgba(255,255,255,0.02)' }}/>
                 {chartProfessions.map(prof => (
                   <Line key={prof} type="monotone" dataKey={prof} stroke={getProfessionColor(prof)} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                 ))}
                 <ReferenceLine y={STANDARD_PPI} stroke="#06b6d4" strokeDasharray="5 5" label={{ position: 'top', value: `Standar ${STANDARD_PPI}%`, fill: '#06b6d4', fontSize: 10 }} />
               </ComposedChart>
             ) : (
               <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                 <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} axisLine={false} tickLine={false} dx={-10} />
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
        <div className="px-6 sm:px-8 pb-8 pt-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#12132e] border border-indigo-900/40 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
                <div className="flex-1">
                   <h4 className="text-sm font-black text-white uppercase tracking-wider">Analisa Data</h4>
                   <p className="text-xs text-slate-300 mt-1 leading-relaxed">{generateAutoInsight()}</p>
                </div>
            </div>
         </div>
      </div>

      {/* Modal Konfirmasi Hapus */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isDeleting && setDeleteConfirmId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-6 overflow-hidden z-10"
            >
              <div className="flex items-center gap-4 text-rose-500 mb-4">
                <div className="p-3 bg-rose-500/10 rounded-2xl">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Hapus Data Audit?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                Apakah Anda yakin ingin menghapus data laporan audit kebersihan tangan ini?
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2"
                >
                  {isDeleting ? "Menghapus..." : "Ya, Hapus Data"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

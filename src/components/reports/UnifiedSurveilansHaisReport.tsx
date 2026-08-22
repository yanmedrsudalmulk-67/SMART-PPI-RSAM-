import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, ArrowDown, ArrowUp, BarChart, LineChart, Table2, TrendingUp,
  AlertCircle, Calendar, Building2, Filter, CheckCircle2, RefreshCw, LayoutGrid
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Bar, Line, ReferenceLine
} from 'recharts';

import { useAppContext } from '@/components/Providers';
import { ReportSkeleton } from '@/components/SkeletonLoading';

// Standard clinical indicators for HAIs
const INDICATORS = [
  { id: 'phlebitis', name: 'Phlebitis', label: 'Phlebitis', labelLines: ['Phlebitis'], unit: '‰', multiplier: 1000, target: 1, targetLabel: '≤ 1‰' },
  { id: 'isk', name: 'ISK', label: 'ISK Terkait Kateter (CAUTI)', labelLines: ['ISK Terkait', 'Kateter (CAUTI)'], unit: '‰', multiplier: 1000, target: 4.7, targetLabel: '≤ 4.7‰' },
  { id: 'decubitus', name: 'Decubitus', label: 'Decubitus', labelLines: ['Decubitus'], unit: '‰', multiplier: 1000, target: 1.5, targetLabel: '≤ 1.5‰' },
  { id: 'ido', name: 'IDO', label: 'Infeksi Daerah Operasi (IDO)', labelLines: ['Infeksi Daerah', 'Operasi (IDO)'], unit: '%', multiplier: 100, target: 2, targetLabel: '≤ 2%' },
  { id: 'vap', name: 'VAP', label: 'Ventilator Associated Pneumonia (VAP)', labelLines: ['Ventilator Associated', 'Pneumonia (VAP)'], unit: '‰', multiplier: 1000, target: 5.8, targetLabel: '≤ 5.8‰' },
];

const COLORS: Record<string, string> = {
  Phlebitis: "#06b6d4", // Cyan
  ISK: "#10b981", // Emerald
  IDO: "#f97316", // Orange
  VAP: "#a855f7", // Purple
  Decubitus: "#f43f5e", // Rose/Pink
};

const ROOMS_BASE = ["Ranap Anak", "Ranap Dewasa", "Ranap Bedah", "Ranap Kebidanan"];

const KATEGORI_HAIS = [
  "Semua HAIs",
  "Phlebitis",
  "ISK",
  "IDO",
  "VAP",
  "Decubitus"
];

const RUANGAN_LIST = [
  "Semua Ruangan",
  "Ranap Anak",
  "Ranap Dewasa",
  "Ranap Bedah",
  "Ranap Kebidanan",
];

export default function UnifiedSurveilansHaisReport() {
  const { hospitalLogoUrl } = useAppContext();
  const [periodeType, setPeriodeType] = useState("Bulanan");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3));
  const [selectedSemester, setSelectedSemester] = useState(Math.floor(new Date().getMonth() / 6));

  const [selectedRuangan, setSelectedRuangan] = useState("Semua Ruangan");
  const [selectedHais, setSelectedHais] = useState("Semua HAIs");
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<"bar" | "line">("bar");

  // Format date range
  const { startDateISO, endDateISO, prevStartDateISO } = useMemo(() => {
    let dt = new Date();
    let prev = new Date();
    
    if (periodeType === "Bulanan") {
      dt = new Date(selectedYear, selectedMonth, 1);
      prev = new Date(selectedYear, selectedMonth - 1, 1);
    } else if (periodeType === "Triwulan") {
      dt = new Date(selectedYear, selectedQuarter * 3, 1);
      prev = new Date(selectedYear, (selectedQuarter - 1) * 3, 1);
    } else if (periodeType === "Semester") {
      dt = new Date(selectedYear, selectedSemester * 6, 1);
      prev = new Date(selectedYear, (selectedSemester - 1) * 6, 1);
    } else if (periodeType === "Tahunan") {
      dt = new Date(selectedYear, 0, 1);
      prev = new Date(selectedYear - 1, 0, 1);
    }

    const start = dt.toISOString();
    const prevStart = prev.toISOString();

    let endDt = new Date(dt);
    if (periodeType === "Bulanan") endDt.setMonth(endDt.getMonth() + 1);
    else if (periodeType === "Triwulan") endDt.setMonth(endDt.getMonth() + 3);
    else if (periodeType === "Semester") endDt.setMonth(endDt.getMonth() + 6);
    else if (periodeType === "Tahunan") endDt.setFullYear(endDt.getFullYear() + 1);
    
    endDt.setMilliseconds(endDt.getMilliseconds() - 1); // latest moment
    const end = endDt.toISOString();
    
    return { startDateISO: start, endDateISO: end, prevStartDateISO: prevStart };
  }, [periodeType, selectedMonth, selectedYear, selectedQuarter, selectedSemester]);

  const loadData = async () => {
    setLoading(true);
    try {
      const yearStart = new Date(selectedYear, 0, 1).toISOString();
      let query = supabase
        .from("audit_sessions")
        .select("*")
        .eq("kategori", "Surveilans HAIs")
        .gte("tanggal_waktu", yearStart)
        .order("tanggal_waktu", { ascending: true });

      if (selectedRuangan !== "Semua Ruangan") {
        query = query.eq("unit", selectedRuangan);
      }
      
      const { data: resData } = await query;
      let filteredDb = resData || [];
      
      if (selectedHais !== "Semua HAIs") {
        const key = selectedHais.toLowerCase();
        filteredDb = filteredDb.filter(r => r.indikator_id === key || r.nama_indikator === selectedHais);
      }
      
      setData(filteredDb);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const ch = supabase
      .channel("hais_report_changes_unified")
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_sessions", filter: "kategori=eq.Surveilans HAIs" }, loadData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDateISO, endDateISO, selectedRuangan, selectedHais]);

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

  const { currentData, previousData } = useMemo(() => {
    return {
      currentData: data.filter(d => d.tanggal_waktu >= startDateISO && d.tanggal_waktu <= endDateISO),
      previousData: data.filter(d => d.tanggal_waktu >= prevStartDateISO && d.tanggal_waktu < startDateISO)
    };
  }, [data, startDateISO, endDateISO, prevStartDateISO]);

  // Derive rooms to display in rows
  const roomsToDisplay = useMemo(() => {
    if (selectedRuangan !== "Semua Ruangan") {
      return [selectedRuangan].filter(r => r !== "ICU");
    }
    const activeUnits = new Set<string>();
    currentData.forEach(d => {
      if (d.unit && d.unit !== "ICU") activeUnits.add(d.unit);
    });
    ROOMS_BASE.forEach(r => {
      if (r !== "ICU") activeUnits.add(r);
    });
    return Array.from(activeUnits);
  }, [currentData, selectedRuangan]);

  // Utility to fetch specific indicator values for a room
  const getIndicatorDataForRoom = React.useCallback((room: string, indicatorId: string) => {
    const filtered = currentData.filter(d => {
      if (d.unit !== room) return false;
      
      const dbId = (d.indikator_id || "").toLowerCase();
      const dbName = (d.nama_indikator || "").toLowerCase();
      
      return dbId === indicatorId || 
             dbName === indicatorId || 
             dbName === indicatorId.replace('_', ' ') ||
             (indicatorId === 'isk' && (dbId === 'isk' || dbName === 'isk' || dbName.includes('saluran kemih'))) ||
             (indicatorId === 'phlebitis' && (dbId === 'phlebitis' || dbName === 'phlebitis' || dbName.includes('plebitis'))) ||
             (indicatorId === 'vap' && (dbId === 'vap' || dbName === 'vap' || dbName.includes('ventilator'))) ||
             (indicatorId === 'ido' && (dbId === 'ido' || dbName === 'ido' || dbName.includes('operasi'))) ||
             (indicatorId === 'decubitus' && (dbId === 'decubitus' || dbName === 'decubitus' || dbName.includes('dekubitus'))) ||
             (indicatorId === 'iadp' && (dbId === 'iadp' || dbName === 'iadp' || dbName.includes('iadp') || dbName.includes('aliran darah'))) ||
             (indicatorId === 'hap' && (dbId === 'hap' || dbName === 'hap' || dbName.includes('hap') || dbName.includes('pneumonia')));
    });

    const n = filtered.reduce((sum, item) => sum + (item.jumlah_patuh || 0), 0);
    const d = filtered.reduce((sum, item) => sum + (item.jumlah_dinilai || 0), 0);
    
    const indicatorObj = INDICATORS.find(ind => ind.id === indicatorId);
    const multiplier = indicatorObj ? indicatorObj.multiplier : 1000;
    const rate = d > 0 ? (n / d) * multiplier : 0;
    const hasData = d > 0;

    return { n, d, rate, hasData };
  }, [currentData]);

  // Aggregate values for bottom row (TOTAL)
  const getIndicatorTotal = React.useCallback((indicatorId: string) => {
    let totalN = 0;
    let totalD = 0;
    
    roomsToDisplay.forEach(room => {
      const { n, d } = getIndicatorDataForRoom(room, indicatorId);
      totalN += n;
      totalD += d;
    });

    const indicatorObj = INDICATORS.find(ind => ind.id === indicatorId);
    const multiplier = indicatorObj ? indicatorObj.multiplier : 1000;
    const rate = totalD > 0 ? (totalN / totalD) * multiplier : 0;
    const hasData = totalD > 0;

    return { n: totalN, d: totalD, rate, hasData };
  }, [roomsToDisplay, getIndicatorDataForRoom]);

  // --- COMPACT SUMMARY STATS ---
  const totalRuanganTerpantau = useMemo(() => {
    const monitored = new Set<string>();
    currentData.forEach(d => {
      if (d.unit) monitored.add(d.unit);
    });
    return monitored.size;
  }, [currentData]);

  const totalKasusHais = useMemo(() => {
    return currentData.reduce((acc, d) => acc + (d.jumlah_patuh || 0), 0);
  }, [currentData]);

  const totalDeviceDays = useMemo(() => {
    return currentData.reduce((acc, d) => acc + (d.jumlah_dinilai || 0), 0);
  }, [currentData]);

  const indicatorStats = useMemo(() => {
    const results = INDICATORS.map(ind => {
      let totalN = 0;
      let totalD = 0;
      currentData.forEach(d => {
        const dbId = (d.indikator_id || "").toLowerCase();
        const dbName = (d.nama_indikator || "").toLowerCase();
        if (dbId === ind.id || 
            dbName === ind.id || 
            dbName === ind.id.replace('_', ' ') || 
            dbName.includes(ind.id) ||
            (ind.id === 'isk' && dbName.includes('saluran kemih')) ||
            (ind.id === 'phlebitis' && dbName.includes('plebitis')) ||
            (ind.id === 'vap' && dbName.includes('ventilator')) ||
            (ind.id === 'ido' && dbName.includes('operasi')) ||
            (ind.id === 'decubitus' && dbName.includes('dekubitus')) ||
            (ind.id === 'iadp' && (dbName.includes('iadp') || dbName.includes('aliran darah'))) ||
            (ind.id === 'hap' && (dbName.includes('hap') || dbName.includes('pneumonia')))) {
          totalN += d.jumlah_patuh || 0;
          totalD += d.jumlah_dinilai || 0;
        }
      });
      const rate = totalD > 0 ? (totalN / totalD) * ind.multiplier : 0;
      return { id: ind.id, name: ind.name, n: totalN, d: totalD, rate, hasData: totalD > 0 };
    }).filter(r => r.hasData);
    
    if (results.length === 0) {
      return { highest: "-", lowest: "-" };
    }
    
    const sorted = [...results].sort((a, b) => b.rate - a.rate);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];
    
    const highestLabel = `${highest.name} (${highest.rate.toFixed(1)}${highest.id === 'ido' ? '%' : '‰'})`;
    const lowestLabel = `${lowest.name} (${lowest.rate.toFixed(1)}${lowest.id === 'ido' ? '%' : '‰'})`;
    
    return { highest: highestLabel, lowest: lowestLabel };
  }, [currentData]);

  const capaianTargetKeseluruhan = useMemo(() => {
    let totalCells = 0;
    let compliantCells = 0;
    
    roomsToDisplay.forEach(room => {
      INDICATORS.forEach(ind => {
        const { d, rate } = getIndicatorDataForRoom(room, ind.id);
        if (d > 0) {
          totalCells++;
          if (rate <= ind.target) {
            compliantCells++;
          }
        }
      });
    });
    
    return totalCells > 0 ? Math.round((compliantCells / totalCells) * 100) : 0;
  }, [roomsToDisplay, getIndicatorDataForRoom]);

  // Dynamic Charting Data setup
  const chartData = useMemo(() => {
    const byPeriodAndType: any = {};
    
    let startMonth = 0;
    let endMonth = 11;
    if (periodeType === "Bulanan") {
      startMonth = selectedMonth;
      endMonth = selectedMonth;
    } else if (periodeType === "Triwulan") {
      startMonth = selectedQuarter * 3;
      endMonth = startMonth + 2;
    } else if (periodeType === "Semester") {
      startMonth = selectedSemester * 6;
      endMonth = startMonth + 5;
    }

    // Pre-fill months
    for (let i = startMonth; i <= endMonth; i++) {
      const monthKey = `${["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"][i]}`;
      byPeriodAndType[monthKey] = { period: monthKey };
      KATEGORI_HAIS.filter(k => k !== "Semua HAIs").forEach(k => {
         byPeriodAndType[monthKey][`${k}_num`] = 0;
         byPeriodAndType[monthKey][`${k}_den`] = 0;
         byPeriodAndType[monthKey][k] = 0;
      });
    }

    const currentPeriodData = data.filter(d => d.tanggal_waktu >= startDateISO && d.tanggal_waktu <= endDateISO);

    currentPeriodData.forEach((item) => {
      const dt = parseISO(item.tanggal_waktu);
      const k = `${["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"][dt.getMonth()]}`;
      
      if (!byPeriodAndType[k]) {
        byPeriodAndType[k] = { period: k };
        KATEGORI_HAIS.filter(kat => kat !== "Semua HAIs").forEach(kat => {
           byPeriodAndType[k][`${kat}_num`] = 0;
           byPeriodAndType[k][`${kat}_den`] = 0;
           byPeriodAndType[k][kat] = 0;
        });
      }
      
      const typeKey = item.nama_indikator || (item.indikator_id === 'ido' ? 'IDO' : 
                   item.indikator_id === 'isk' ? 'ISK' : 
                   item.indikator_id === 'vap' ? 'VAP' : 
                   item.indikator_id === 'phlebitis' ? 'Phlebitis' : 'Decubitus');
                   
      if (byPeriodAndType[k][`${typeKey}_num`] !== undefined) {
         byPeriodAndType[k][`${typeKey}_num`] += item.jumlah_patuh || 0;
         byPeriodAndType[k][`${typeKey}_den`] += item.jumlah_dinilai || 0;
      }
    });

    return Object.values(byPeriodAndType).map((row: any) => {
      KATEGORI_HAIS.filter(k => k !== "Semua HAIs").forEach(k => {
         const num = row[`${k}_num`];
         const den = row[`${k}_den`];
         const mult = k === 'IDO' ? 100 : 1000;
         row[k] = den > 0 ? Number(((num / den) * mult).toFixed(2)) : 0;
      });
      return row;
    });
  }, [data, periodeType, selectedMonth, selectedQuarter, selectedSemester, startDateISO, endDateISO]);

  return (
    <div className="flex flex-col gap-6 w-full fade-in zoom-in-95 animate-in duration-500 pb-32">
      
      {/* HEADER PAGE */}
      <div className="text-center lg:text-left mb-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase mb-2">
          SURVEILANS HAIs
        </h1>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-full sm:whitespace-nowrap">
          Monitoring realtime insiden Healthcare Associated Infections (HAIs) berdasarkan periode dan kategori ruangan.
        </p>
      </div>

      {/* TOP FILTER SECTION */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-4 justify-between items-center w-full">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Periode */}
          <div className="glowing-border-container w-full sm:w-auto">
            {/* Spinning gradient layer */}
            <div className="glowing-border-bg" />
            {/* Glowing shadow layer underneath */}
            <div className="glowing-border-shadow" />
            
            <div className="glowing-border-inner flex flex-wrap justify-center items-center gap-2 rounded-[14px] p-1 shadow-sm w-full sm:w-auto">
              <select value={periodeType} onChange={(e) => setPeriodeType(e.target.value)} className="bg-transparent border-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer">
                {['Bulanan', 'Triwulan', 'Semester', 'Tahunan'].map(p => <option key={p} value={p} className="bg-white dark:bg-slate-900">{p}</option>)}
              </select>
              
              {(periodeType === 'Bulanan' || periodeType === 'Triwulan' || periodeType === 'Semester') && (
                 <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
              )}

              {periodeType === 'Bulanan' && (
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-transparent border-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer">
                  {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"].map((m, i) => <option key={m} value={i} className="bg-white dark:bg-slate-900">{m}</option>)}
                </select>
              )}
              {periodeType === 'Triwulan' && (
                <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(parseInt(e.target.value))} className="bg-transparent border-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer">
                  {["Q1", "Q2", "Q3", "Q4"].map((q, i) => <option key={q} value={i} className="bg-white dark:bg-slate-900">{q}</option>)}
                </select>
              )}
              {periodeType === 'Semester' && (
                <select value={selectedSemester} onChange={(e) => setSelectedSemester(parseInt(e.target.value))} className="bg-transparent border-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer">
                  {["S1", "S2"].map((s, i) => <option key={s} value={i} className="bg-white dark:bg-slate-900">{s}</option>)}
                </select>
              )}

              <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-transparent border-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer">
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y} className="bg-white dark:bg-slate-900">{y}</option>)}
              </select>
            </div>
          </div>

          {/* Ruangan */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 rounded-xl p-1 px-3 flex-grow sm:flex-grow-0 min-w-max">
            <Building2 className="w-4 h-4 text-blue-500" />
            <select value={selectedRuangan} onChange={(e) => setSelectedRuangan(e.target.value)} className="bg-transparent border-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer w-full">
              {RUANGAN_LIST.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* Kategori HAIs */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-1 px-3 w-full md:w-auto mt-2 md:mt-0 max-w-full">
          <Activity className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <select value={selectedHais} onChange={(e) => setSelectedHais(e.target.value)} className="bg-transparent border-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer w-full text-ellipsis overflow-hidden">
            {KATEGORI_HAIS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {loading && !data.length ? (
        <ReportSkeleton />
      ) : (
        <>
          {/* MAIN CONTAINER AND SUMMARY CARDS */}
          <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm rounded-[2rem] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm transition-all mt-4">
            
            {/* Logo, Header Laporan */}
            <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#0f172a]">
               <div className="flex flex-col md:flex-row items-center gap-6">
                 {hospitalLogoUrl && (
                   <img src={hospitalLogoUrl} alt="Logo RS" className="w-20 h-20 object-contain" />
                 )}
                 <div className="text-center md:text-left">
                   <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                     Laporan Surveilans HAIs
                   </h2>
                   <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase">UOBK RSUD AL-MULK KOTA SUKABUMI</h3>
                   <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase">
                     Periode: {periodeType} {selectedYear} {periodeType === 'Bulanan' ? `- ${["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][selectedMonth]}` : ''}
                   </p>
                 </div>
               </div>
            </div>
            <div className="overflow-x-auto relative max-w-full scrollbar-thin">
              <table className="w-full text-left border-collapse min-w-full">
                <thead>
                  
                  {/* Super Header Row */}
                  <tr className="bg-slate-100/80 dark:bg-[#1e293b]/70 border-b border-slate-200 dark:border-white/10">
                    <th className="py-2 px-1 text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 w-[3%] text-center bg-slate-100 dark:bg-[#1e293b] border-r border-slate-300 dark:border-white/20" rowSpan={2}>No</th>
                    <th className="py-2 px-2 text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 w-[11%] bg-slate-100 dark:bg-[#1e293b] border-r border-slate-300 dark:border-white/20" rowSpan={2}>Ruangan</th>
                    
                    {INDICATORS.map(ind => (
                      <th key={ind.id} className="py-1.5 px-1.5 text-center text-[10px] font-black uppercase tracking-wider text-white border-r border-slate-300 dark:border-white/20 leading-tight" colSpan={4} style={{ backgroundColor: COLORS[ind.name] + 'dd' }}>
                        <div className="flex flex-col justify-center items-center">
                          {ind.labelLines.map((line, lIdx) => (
                            <span key={lIdx} className="block whitespace-normal">{line}</span>
                          ))}
                        </div>
                      </th>
                    ))}
                  </tr>

                  {/* Sub Header Row */}
                  <tr className="bg-slate-50 dark:bg-[#0f172a]/90 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-white/10">
                    {INDICATORS.map(ind => (
                      <React.Fragment key={`${ind.id}-sub`}>
                        <th className="py-1 px-1 text-center font-black w-[4%] bg-slate-50/70 dark:bg-slate-900 border-r border-slate-150 dark:border-slate-800">N</th>
                        <th className="py-1 px-1 text-center font-black w-[4%] bg-slate-50/70 dark:bg-slate-900 border-r border-slate-150 dark:border-slate-800">D</th>
                        <th className="py-1 px-1.5 text-center font-black w-[6%] bg-slate-50/70 dark:bg-slate-900 border-r border-slate-150 dark:border-slate-800">%</th>
                        <th className="py-1 px-1.5 text-center font-black w-[6%] bg-slate-100/50 dark:bg-slate-800/80 border-r-2 border-slate-300 dark:border-white/20">Target</th>
                      </React.Fragment>
                    ))}
                  </tr>

                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-white/5 text-[12px]">
                  
                  {/* Rows for Rooms */}
                  {roomsToDisplay.map((room, idx) => (
                    <tr key={room} className="hover:bg-slate-100/40 dark:hover:bg-white/5 transition-colors group">
                      
                      {/* Column "No" */}
                      <td className="py-1.5 px-1 text-center font-bold text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-800/40 bg-white dark:bg-[#0f172a] border-r border-slate-300 dark:border-white/20 transition-colors">
                        {idx + 1}
                      </td>

                      {/* Column "Ruangan" */}
                      <td className="py-1.5 px-2 font-bold text-slate-900 dark:text-white group-hover:bg-slate-100 dark:group-hover:bg-slate-800/40 bg-white dark:bg-[#0f172a] border-r border-slate-300 dark:border-white/20 transition-colors">
                        {room}
                      </td>

                      {/* Render each of the indicators */}
                      {INDICATORS.map(ind => {
                        const { n, d, rate, hasData } = getIndicatorDataForRoom(room, ind.id);
                        const isCompliant = rate <= ind.target;
                        const badgeColorText = isCompliant 
                          ? "text-emerald-600 dark:text-emerald-400" 
                          : "text-red-600 dark:text-red-400 font-black";

                        return (
                          <React.Fragment key={`${room}-${ind.id}`}>
                            <td className="py-1.5 px-1 text-center font-semibold font-mono text-slate-500 border-r border-slate-150 dark:border-slate-800">{n}</td>
                            <td className="py-1.5 px-1 text-center font-semibold font-mono text-slate-500 border-r border-slate-150 dark:border-slate-800">{d}</td>
                            
                            {/* Rate (%) */}
                            <td className={`py-1.5 px-1.5 text-center font-mono font-bold border-r border-slate-150 dark:border-slate-800 transition-colors ${d > 0 ? (isCompliant ? 'bg-emerald-500/5' : 'bg-red-500/5') : ''}`}>
                              {d > 0 ? (
                                <span className={badgeColorText}>
                                  {rate.toFixed(1)}{ind.unit}
                                </span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-700">0.0{ind.unit}</span>
                              )}
                            </td>

                            {/* Target value */}
                            <td className="py-1.5 px-1 text-center font-mono font-bold text-[10px] text-slate-400 bg-slate-50/40 dark:bg-slate-800/20 border-r-2 border-slate-300 dark:border-white/20">
                              {ind.targetLabel}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}

                  {/* TOTAL (JUMLAH) ROW AT THE BOTTOM */}
                  <tr className="bg-slate-100/90 dark:bg-[#1e293b]/80 border-t-2 border-slate-300 dark:border-white/30 text-slate-900 dark:text-white font-black text-[12px]">
                    <td className="py-2 px-1 text-center bg-slate-100 dark:bg-[#1e293b] border-r border-slate-300 dark:border-white/20" colSpan={1}>
                    </td>
                    <td className="py-2 px-2 uppercase tracking-wider bg-slate-100 dark:bg-[#1e293b] border-r border-slate-300 dark:border-white/20">
                      JUMLAH
                    </td>

                    {/* Aggregate calculations for the bottom row */}
                    {INDICATORS.map(ind => {
                      const { n, d, rate, hasData } = getIndicatorTotal(ind.id);
                      const isCompliant = rate <= ind.target;
                      const textColorClass = isCompliant 
                        ? "text-emerald-700 dark:text-emerald-400" 
                        : "text-red-700 dark:text-red-400";

                      return (
                        <React.Fragment key={`total-${ind.id}`}>
                          <td className="py-2 px-1 text-center font-mono text-slate-700 dark:text-slate-300">{n}</td>
                          <td className="py-2 px-1 text-center font-mono text-slate-700 dark:text-slate-300">{d}</td>
                          
                          {/* Aggregate Rate */}
                          <td className={`py-2 px-1 text-center font-mono font-extrabold border-r border-slate-200 dark:border-slate-800 ${d > 0 ? (isCompliant ? 'bg-emerald-500/10' : 'bg-red-500/10') : ''}`}>
                            {d > 0 ? (
                              <span className={textColorClass}>
                                {rate.toFixed(1)}{ind.unit}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-700">0.0{ind.unit}</span>
                            )}
                          </td>

                          {/* Static Target info */}
                          <td className="py-2 px-1 text-center font-mono font-black text-[10px] text-[#475569] bg-slate-150 dark:bg-slate-800/40 border-r-2 border-slate-300 dark:border-white/20">
                            {ind.targetLabel}
                          </td>
                        </React.Fragment>
                      );
                    })}

                  </tr>

                </tbody>
              </table>
            </div>

          </div>

          {/* CHART SECTION */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden mt-4">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 whitespace-nowrap font-sans">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Grafik Monitoring Surveilans HAIs
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">Menampilkan capaian sepanjang periode tahun terpilih.</p>
                </div>
                
                <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                  <button onClick={() => setChartMode("bar")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${chartMode === "bar" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}>
                    <BarChart className="w-4 h-4" /> Bar
                  </button>
                  <button onClick={() => setChartMode("line")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${chartMode === "line" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}>
                    <LineChart className="w-4 h-4" /> Line
                  </button>
                </div>
             </div>
             
             <div className="h-[350px] w-full">
               {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" vertical={false} />
                        <XAxis dataKey="period" stroke="#64748b" fontSize={9} tickMargin={10} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={40} />
                        <YAxis stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)', color: '#fff' }}
                          itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
                          labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} iconType="circle" />
                        
                        {selectedHais === "Semua HAIs" ? (
                          KATEGORI_HAIS.filter(k => k !== "Semua HAIs").map((k) => (
                            chartMode === "bar" ? 
                              <Bar key={k} dataKey={k} fill={COLORS[k]} radius={[4, 4, 0, 0]} maxBarSize={30} /> :
                              <Line key={k} type="monotone" dataKey={k} stroke={COLORS[k]} strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                          ))
                        ) : (
                          chartMode === "bar" ? 
                              <Bar dataKey={selectedHais} fill={COLORS[selectedHais]} radius={[6, 6, 0, 0]} maxBarSize={50} /> :
                              <Line type="monotone" dataKey={selectedHais} stroke={COLORS[selectedHais]} strokeWidth={4} dot={{ r: 5, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                        )}
                        
                        {selectedHais !== "Semua HAIs" && (
                          <ReferenceLine
                            y={INDICATORS.find(ind => ind.name.toLowerCase() === selectedHais.toLowerCase())?.target || 1}
                            stroke="#06b6d4"
                            strokeDasharray="5 5"
                            label={{
                              position: "top",
                              value: `Standar ${INDICATORS.find(ind => ind.name.toLowerCase() === selectedHais.toLowerCase())?.target || 1}${selectedHais === 'IDO' ? '%' : '‰'}`,
                              fill: "#06b6d4",
                              fontSize: 10,
                            }}
                          />
                        )}
                     </ComposedChart>
                  </ResponsiveContainer>
               ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                    <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Belum ada data untuk grafik</span>
                  </div>
               )}
             </div>
          </div>
          
        </>
      )}
    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity, ArrowDown, ArrowUp, BarChart, LineChart, Table2, TrendingUp,
  AlertCircle, Calendar, Building2, Filter, CheckCircle2
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Bar, Line
} from 'recharts';

const STANDARDS: Record<string, number> = {
  phlebitis: 1,
  isk: 4.7,
  vap: 5.8,
  ido: 2,
  decubitus: 1.5,
};

const KATEGORI_HAIS = [
  "Semua HAIs",
  "Phlebitis",
  "ISK",
  "IDO",
  "VAP",
  "Decubitus",
];

const COLORS: Record<string, string> = {
  Phlebitis: "#06b6d4", // Cyan
  ISK: "#10b981", // Emerald
  IDO: "#f97316", // Orange
  VAP: "#a855f7", // Purple
  Decubitus: "#f43f5e", // Rose/Pink
};

const RUANGAN_LIST = [
  "Semua Ruangan",
  "Ranap Anak",
  "Ranap Dewasa",
  "Ranap Bedah",
  "Ranap Kebidanan",
  "ICU",
];

export default function UnifiedSurveilansHaisReport() {
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
      // fetch more to allow comparison with previous period and trend analysis within year
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

  const { currentData, previousData } = useMemo(() => {
    return {
      currentData: data.filter(d => d.tanggal_waktu >= startDateISO && d.tanggal_waktu <= endDateISO),
      previousData: data.filter(d => d.tanggal_waktu >= prevStartDateISO && d.tanggal_waktu < startDateISO)
    };
  }, [data, startDateISO, endDateISO, prevStartDateISO]);

  const { summarized, overallStats } = useMemo(() => {
    const sum = (arr: any[]) => {
      let num = 0, den = 0;
      arr.forEach(d => { num += d.jumlah_patuh || 0; den += d.jumlah_dinilai || 0; });
      return { num, den, rate: den ? (num / den) * 1000 : 0 };
    };

    const grouped: any = {};
    KATEGORI_HAIS.filter(k => k !== "Semua HAIs").forEach(k => {
      grouped[k] = { num: 0, den: 0, count: 0, rate: 0, prevRate: 0 };
    });

    data.forEach(d => {
      const isCur = d.tanggal_waktu >= startDateISO && d.tanggal_waktu <= endDateISO;
      const isPrev = d.tanggal_waktu >= prevStartDateISO && d.tanggal_waktu < startDateISO;
      if (!isCur && !isPrev) return;

      const key = d.nama_indikator || (d.indikator_id === 'ido' ? 'IDO' : 
                   d.indikator_id === 'isk' ? 'ISK' : 
                   d.indikator_id === 'vap' ? 'VAP' : 
                   d.indikator_id === 'phlebitis' ? 'Phlebitis' : 'Decubitus');
      
      if (!grouped[key]) return;
      
      if (isCur) {
        grouped[key].num += d.jumlah_patuh || 0;
        grouped[key].den += d.jumlah_dinilai || 0;
        grouped[key].count++;
      } else if (isPrev) {
        // prev not stored in grouped easily
      }
    });

    // recalculate rate
    Object.keys(grouped).forEach(k => {
      const mult = k === 'IDO' ? 100 : 1000;
      grouped[k].rate = grouped[k].den > 0 ? (grouped[k].num / grouped[k].den) * mult : 0;
      
      const prevDataArr = previousData.filter(d => (d.nama_indikator || "").toUpperCase() === k.toUpperCase() || (d.indikator_id || "").toUpperCase() === k.toUpperCase());
      const pStats = sum(prevDataArr);
      grouped[k].prevRate = pStats.den > 0 ? (pStats.num / pStats.den) * mult : 0;
    });

    const oNum = currentData.reduce((a, b) => a + (b.jumlah_patuh || 0), 0);
    const oDen = currentData.reduce((a, b) => a + (b.jumlah_dinilai || 0), 0);
    
    const poNum = previousData.reduce((a, b) => a + (b.jumlah_patuh || 0), 0);
    const poDen = previousData.reduce((a, b) => a + (b.jumlah_dinilai || 0), 0);

    return { 
      summarized: grouped, 
      overallStats: { 
        count: currentData.length,
        num: oNum,
        den: oDen,
        rate: oDen > 0 ? (oNum / oDen) * 1000 : 0,
        prevRate: poDen > 0 ? (poNum / poDen) * 1000 : 0
      } 
    };
  }, [currentData, previousData, data, startDateISO, endDateISO, prevStartDateISO]);

  const chartData = useMemo(() => {
    if (!data.length) return [];
    
    const byPeriodAndType: any = {};
    const getPeriodKey = (d: string) => {
      const dt = parseISO(d);
      if (periodeType === "Bulanan" || periodeType === "Tahunan") return format(dt, "MMM yyyy", { locale: idLocale });
      if (periodeType === "Triwulan") return `Q${Math.floor(dt.getMonth() / 3) + 1} ${dt.getFullYear()}`;
      if (periodeType === "Semester") return `S${Math.floor(dt.getMonth() / 6) + 1} ${dt.getFullYear()}`;
      return `${dt.getFullYear()}`;
    };

    data.forEach((item) => {
      const key = getPeriodKey(item.tanggal_waktu);
      if (!byPeriodAndType[key]) {
        byPeriodAndType[key] = { period: key };
        KATEGORI_HAIS.filter(k => k !== "Semua HAIs").forEach(k => {
           byPeriodAndType[key][`${k}_num`] = 0;
           byPeriodAndType[key][`${k}_den`] = 0;
           byPeriodAndType[key][k] = 0;
        });
      }
      
      const typeKey = item.nama_indikator || (item.indikator_id === 'ido' ? 'IDO' : 
                   item.indikator_id === 'isk' ? 'ISK' : 
                   item.indikator_id === 'vap' ? 'VAP' : 
                   item.indikator_id === 'phlebitis' ? 'Phlebitis' : 'Decubitus');
                   
      if (byPeriodAndType[key][`${typeKey}_num`] !== undefined) {
         byPeriodAndType[key][`${typeKey}_num`] += item.jumlah_patuh || 0;
         byPeriodAndType[key][`${typeKey}_den`] += item.jumlah_dinilai || 0;
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
  }, [data, periodeType]);

  return (
    <div className="flex flex-col gap-6 w-full fade-in zoom-in-95 animate-in duration-500 pb-32">
      
      {/* HEADER PAGE */}
      <div className="text-center lg:text-left mb-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase mb-2">
          SURVEILANS HAIs
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-2xl">
          Monitoring realtime insiden Healthcare Associated Infections (HAIs) berdasarkan periode dan kategori ruangan.
        </p>
      </div>

      {/* TOP FILTER SECTION (STICKY RESPONSIVE) */}
      <div className="sticky top-20 z-40 bg-white/80 dark:bg-[#0f172a]/90 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-4 justify-between items-center w-full">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Periode */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 rounded-xl p-1 px-2 flex-grow sm:flex-grow-0 min-w-max">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <select value={periodeType} onChange={(e) => setPeriodeType(e.target.value)} className="bg-transparent border-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer">
              {['Bulanan', 'Triwulan', 'Semester', 'Tahunan'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            
            {(periodeType === 'Bulanan' || periodeType === 'Triwulan' || periodeType === 'Semester') && (
               <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
            )}

            {periodeType === 'Bulanan' && (
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-transparent border-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer">
                {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"].map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            )}
            {periodeType === 'Triwulan' && (
              <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(parseInt(e.target.value))} className="bg-transparent border-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer">
                {["Q1", "Q2", "Q3", "Q4"].map((q, i) => <option key={q} value={i}>{q}</option>)}
              </select>
            )}
            {periodeType === 'Semester' && (
              <select value={selectedSemester} onChange={(e) => setSelectedSemester(parseInt(e.target.value))} className="bg-transparent border-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer">
                {["S1", "S2"].map((s, i) => <option key={s} value={i}>{s}</option>)}
              </select>
            )}

            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-transparent border-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer">
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
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

      {loading ? (
        <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <>
          {/* SUMMARY CARDS */}
          {selectedHais === "Semua HAIs" ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-6 mt-2">
                {Object.keys(summarized).map(k => {
                  const stat = summarized[k];
                  const standard = STANDARDS[k.toLowerCase()] || 0;
                  const isPercent = k === 'IDO';
                  const symbol = isPercent ? '%' : '‰';
                  
                  const isSesuai = stat.rate <= standard;
                  const targetStatus = stat.count === 0 ? 'Belum ada data' : isSesuai ? 'Sesuai Standar' : 'Di atas standar';
                  
                  const trendUp = stat.rate > stat.prevRate;
                  const trendDown = stat.rate < stat.prevRate;
                  
                  return (
                    <div key={k} className="bg-white dark:bg-[#111827] backdrop-blur-xl rounded-3xl p-5 border shadow-sm group hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col"
                      style={{ borderColor: COLORS[k] + '33' }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity rounded-full pointer-events-none" style={{ background: COLORS[k] }} />
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl text-white shadow-inner" style={{ background: COLORS[k] }}>
                           <Activity className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-black font-mono tracking-tighter" style={{ color: COLORS[k] }}>
                            {stat.rate.toFixed(2)}{symbol}
                          </span>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Rate Realtime</p>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5 space-y-2">
                        <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{k}</h3>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">Status</span>
                          {stat.count === 0 ? (
                            <span className="text-slate-400 font-bold bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">Belum ada data</span>
                          ) : isSesuai ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-400/10 px-2 py-0.5 rounded">Sesuai Standar</span>
                          ) : (
                            <span className="text-red-500 font-bold bg-red-50 dark:bg-red-400/10 px-2 py-0.5 rounded">Di Atas Standar</span>
                          )}
                        </div>

                        <div className="flex justify-between items-center text-xs">
                           <span className="text-slate-500 font-medium">Trend (vs sblm)</span>
                           {stat.count === 0 ? <span className="text-slate-400">-</span> : 
                            trendUp ? <span className="text-red-500 font-bold flex items-center gap-1">Naik <Activity className="w-3 h-3" /></span> :
                            trendDown ? <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">Turun <Activity className="w-3 h-3 rotate-180" /></span> :
                            <span className="text-slate-400 font-bold">-</span>
                           }
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-slate-500 font-medium">Total Input</span>
                           <span className="text-slate-900 dark:text-white font-bold">{stat.count} Data</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>
          ) : (
             <div className="bg-white dark:bg-[#111827] backdrop-blur-xl rounded-3xl p-6 border shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center w-full"
                  style={{ borderColor: COLORS[selectedHais] + '44' }}
             >
                <div className="absolute top-0 right-0 w-64 h-64 blur-[80px] opacity-10 rounded-full pointer-events-none" style={{ background: COLORS[selectedHais] }} />
                <div className="flex items-center gap-5 relative z-10 w-full sm:w-auto">
                   <div className="p-4 rounded-2xl shadow-inner text-white hidden sm:block" style={{ background: COLORS[selectedHais] }}>
                      <Activity className="w-8 h-8" />
                   </div>
                   <div>
                     <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-1">{selectedHais}</h3>
                     <div className="flex items-center gap-2">
                       <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-500">Standar Maksimal: {STANDARDS[selectedHais.toLowerCase()]} {selectedHais === 'IDO' ? '%' : '‰'}</span>
                       <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-500">{summarized[selectedHais]?.count || 0} Audit Realtime</span>
                     </div>
                   </div>
                </div>
                
                <div className="text-left sm:text-right mt-4 sm:mt-0 relative z-10 w-full sm:w-auto">
                  <span className="text-4xl sm:text-5xl font-black font-mono tracking-tighter drop-shadow-md" style={{ color: COLORS[selectedHais] }}>
                    {summarized[selectedHais]?.rate.toFixed(2)}{selectedHais === 'IDO' ? '%' : '‰'}
                  </span>
                  <div className="flex items-center sm:justify-end gap-2 mt-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rate Saat Ini</span>
                    {summarized[selectedHais]?.count > 0 && summarized[selectedHais]?.rate > STANDARDS[selectedHais.toLowerCase()] && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 rounded-full uppercase tracking-wider"><AlertCircle className="w-3 h-3"/> Warning</span>
                    )}
                  </div>
                </div>
             </div>
          )}

          {/* TABLE SECTION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl mt-4">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Table2 className="w-5 h-5 text-emerald-500" />
                Data Monitoring Realtime
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[700px]">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-800/50 text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4 font-black w-12 text-center">No</th>
                    <th className="py-3 px-4 font-black">Waktu Input</th>
                    <th className="py-3 px-4 font-black">Ruangan</th>
                    <th className="py-3 px-4 font-black">Kategori</th>
                    <th className="py-3 px-4 font-black text-right">Numerator</th>
                    <th className="py-3 px-4 font-black text-right">Denominator</th>
                    <th className="py-3 px-4 font-black text-right">Rate</th>
                    <th className="py-3 px-4 font-black text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px] sm:text-sm">
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 bg-slate-50 dark:bg-transparent">
                         <div className="flex flex-col items-center justify-center opacity-70">
                           <AlertCircle className="w-8 h-8 mb-3" />
                           <p className="font-semibold">Belum ada data untuk filter yang dipilih.</p>
                         </div>
                      </td>
                    </tr>
                  ) : (
                    currentData.map((row, idx) => {
                      const iden = row.nama_indikator || (row.indikator_id === 'ido' ? 'IDO' : row.indikator_id === 'isk' ? 'ISK' : row.indikator_id === 'vap' ? 'VAP' : row.indikator_id === 'phlebitis' ? 'Phlebitis' : 'Decubitus');
                      const indColor = COLORS[iden] || '#10b981';
                      const mult = iden === 'IDO' ? 100 : 1000;
                      const symb = iden === 'IDO' ? '%' : '‰';
                      const vRate = row.jumlah_dinilai > 0 ? (row.jumlah_patuh / row.jumlah_dinilai) * mult : 0;
                      const cStandard = STANDARDS[iden.toLowerCase()] || 0;
                      const cSesuai = vRate <= cStandard;
                      
                      return (
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                            {format(parseISO(row.tanggal_waktu || row.created_at), "dd MMM yyyy HH:mm", { locale: idLocale })}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{row.unit}</td>
                          <td className="py-3 px-4">
                             <span className="font-bold px-2 py-0.5 rounded text-[11px]" style={{ color: indColor, backgroundColor: indColor + '22' }}>
                               {iden}
                             </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500">{row.jumlah_patuh}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500">{row.jumlah_dinilai}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold" style={{ color: indColor }}>
                            {vRate.toFixed(2)}{symb}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {cSesuai ? (
                              <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg uppercase tracking-widest border border-emerald-500/20">Sesuai</span>
                            ) : (
                              <span className="px-2 py-1 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-lg uppercase tracking-widest border border-red-500/20">Warning</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CHART SECTION */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden mt-4">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Grafik Monitoring Dinamis
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
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" vertical={false} />
                       <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
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

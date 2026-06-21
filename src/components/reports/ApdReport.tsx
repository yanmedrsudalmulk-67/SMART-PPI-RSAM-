import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { ReportSkeleton } from '@/components/SkeletonLoading';
import { supabase } from '@/lib/supabase';
import { 
  BarChart2, Target as TargetIcon, Activity, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown,
  Users, MapPin, Clock, Calendar as CalendarIcon, Check, X, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Cell, ComposedChart, Line, PieChart, Pie
} from '@/components/ChartComponents';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useAppContext } from '@/components/Providers';

export default function ApdReport({ 
  filters 
}: { 
  filters: { searchQuery: string, periode: string, type?: string } 
}) {
  const { hospitalLogoUrl } = useAppContext();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'line'|'bar'>('bar');

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: result } = await supabase.from('audit_apd').select('*').order('tanggal_waktu', { ascending: false });
      if (result) {
        const mappedResult = result.map(item => {
          let dinilai = 0;
          let patuh = 0;
          const components = ['masker', 'sarung_tangan', 'penutup_kepala', 'apron', 'goggle', 'sepatu_boot', 'gaun_pelindung'];
          components.forEach(comp => {
            const val = String(item[comp] || '').toLowerCase();
            if (val === 'ya' || val === 'sesuai' || val === 'tidak' || val === 'tidak sesuai') {
              dinilai++;
              if (val === 'ya' || val === 'sesuai') patuh++;
            }
          });
          const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : item.persentase || 0;
          return { ...item, jumlah_dinilai: dinilai || item.jumlah_dinilai, jumlah_patuh: patuh || item.jumlah_patuh, persentase };
        });
        setData(mappedResult);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const ch = supabase.channel('audit_apd_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_apd' }, (payload) => {
         if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
             setData(prev => {
                const norm = payload.new as any;
                let patuh = 0;
                let dinilai = 0;
                const components = ['masker', 'sarung_tangan', 'penutup_kepala', 'apron', 'goggle', 'sepatu_boot', 'gaun_pelindung'];
                components.forEach(comp => {
                  const val = String(norm[comp] || '').toLowerCase();
                  if (val === 'ya' || val === 'sesuai' || val === 'tidak' || val === 'tidak sesuai') {
                    dinilai++;
                    if (val === 'ya' || val === 'sesuai') patuh++;
                  }
                });
                const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : norm.persentase || 0;
                const mappedNorm = { ...norm, jumlah_dinilai: dinilai || norm.jumlah_dinilai, jumlah_patuh: patuh || norm.jumlah_patuh, persentase };

                const isUpdate = prev.some(p => p.id === mappedNorm.id);
                const nextData = isUpdate ? prev.map(p => p.id === mappedNorm.id ? mappedNorm : p) : [mappedNorm, ...prev];
                return nextData.sort((a,b) => new Date(b.tanggal_waktu || b.created_at).getTime() - new Date(a.tanggal_waktu || a.created_at).getTime());
             });
          } else if (payload.eventType === 'DELETE') {
             setData(prev => prev.filter(p => p.id !== payload.old.id));
          }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

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
    }
  }, [loading]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!item.observer?.toLowerCase().includes(query) && !item.unit?.toLowerCase().includes(query) && !item.tindakan?.toLowerCase().includes(query)) return false;
      }
      
      if (filters.periode) {
        const itemDateStr = item.tanggal_waktu;
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
  }, [data, filters]);

  const { summaryStats, pieData, trendData, recommendationData } = useMemo(() => {
    if (filteredData.length === 0) return { 
      summaryStats: { avg: 0, count: 0, patuh: 0, dinilai: 0, tidakPatuh: 0 },
      pieData: [], trendData: [], recommendationData: { mostMissingItem: '', mostMissingCount: 0 }
    };

    let totalPatuh = 0;
    let totalDinilai = 0;
    let totalTidakPatuh = 0;
    const periodMap = new Map<string, any[]>();
    
    // items count for recommendation
    const itemMissingCount: Record<string, number> = {
      'Masker': 0, 'Sarung Tangan': 0, 'Penutup Kepala': 0, 'Apron': 0, 'Kaca Mata/Goggle': 0, 'Sepatu Boots': 0, 'Gaun/Baju Pelindung': 0
    };

    const getGroupKey = (dStr: string) => {
        if(!dStr) return "Unknown";
        const date = new Date(dStr);
        const y = date.getFullYear();
        const m = date.getMonth();
        return `${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"][m]}`;
    };
    
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

    filteredData.forEach(item => {
      periodMap.get(getGroupKey(item.tanggal_waktu || ''))?.push(item);
      
      const itemsMap: Record<string, string | null> = {
        'Masker': item.masker,
        'Sarung Tangan': item.sarung_tangan,
        'Penutup Kepala': item.penutup_kepala,
        'Apron': item.apron,
        'Kaca Mata/Goggle': item.goggle,
        'Sepatu Boots': item.sepatu_boot,
        'Gaun/Baju Pelindung': item.gaun_pelindung
      };
      
      Object.entries(itemsMap).forEach(([key, val]) => {
         if (val && (val.toLowerCase() === 'tidak' || val.toLowerCase() === 'tidak sesuai')) {
           itemMissingCount[key]++;
         }
      });
      
      const patuh = Object.values(itemsMap).filter(val => val && (val.toLowerCase() === 'ya' || val.toLowerCase() === 'sesuai')).length;
      const tidak = Object.values(itemsMap).filter(val => val && (val.toLowerCase() === 'tidak' || val.toLowerCase() === 'tidak sesuai')).length;
      
      totalPatuh += patuh;
      totalTidakPatuh += tidak;
      totalDinilai += (patuh + tidak);
    });

    const trend = Array.from(periodMap.entries()).map(([k, recs]) => {
         let p = 0; let d = 0;
         recs.forEach(r => {
             const items = [r.masker, r.sarung_tangan, r.penutup_kepala, r.apron, r.goggle, r.sepatu_boot, r.gaun_pelindung];
             const cPatuh = items.filter(val => val && (val.toLowerCase() === 'ya' || val.toLowerCase() === 'sesuai')).length;
             const cTidak = items.filter(val => val && (val.toLowerCase() === 'tidak' || val.toLowerCase() === 'tidak sesuai')).length;
             p += cPatuh; d += (cPatuh + cTidak);
         });
         return { name: k, val: d > 0 ? Math.round((p / d) * 100) : 0 };
    });

    const pData = [
      { name: 'Patuh', value: totalPatuh, color: '#10b981' },
      { name: 'Tidak Patuh', value: totalTidakPatuh, color: '#f43f5e' }
    ];
    
    let mostMissingItem = '';
    let mostMissingCount = -1;
    Object.entries(itemMissingCount).forEach(([k, v]) => {
       if (v > mostMissingCount) {
         mostMissingCount = v;
         mostMissingItem = k;
       }
    });

    return {
      summaryStats: { 
        avg: totalDinilai > 0 ? Math.round((totalPatuh / totalDinilai) * 100) : 0, 
        count: filteredData.length, patuh: totalPatuh, dinilai: totalDinilai, tidakPatuh: totalTidakPatuh
      },
      pieData: pData, trendData: trend, recommendationData: { mostMissingItem, mostMissingCount }
    };
  }, [filteredData, filters.type, filters.periode]);

  const mapApdAction = (val: string | null) => {
    if (!val) return <span className="flex justify-center font-bold text-slate-400">N/A</span>;
    const lower = val.toLowerCase();
    if (lower === 'ya' || lower === 'sesuai') return <span className="flex justify-center font-bold text-emerald-600 dark:text-emerald-400">YA</span>;
    if (lower === 'tidak' || lower === 'tidak sesuai') return <span className="flex justify-center font-bold text-rose-600 dark:text-rose-400">TIDAK</span>;
    if (lower === 'n/a' || lower === 'na') return <span className="flex justify-center font-bold text-slate-400">N/A</span>;
    return <span className="flex justify-center font-bold text-slate-400 uppercase">{val}</span>;
  };

  if (loading && !data.length) return <ReportSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      
      {/* LAPORAN HEADER (PRINT READY) */}
      <div className="hidden print:flex items-center justify-between gap-6 mb-8 border-b-4 border-slate-300 pb-6 w-full">
         <div className="flex items-center gap-5 w-full justify-center text-center">
            <div className="w-20 h-20 bg-white flex items-center justify-center p-1 border-2 border-slate-300 relative">
              {hospitalLogoUrl ? (
                <Image src={hospitalLogoUrl} alt="Logo RS" fill sizes="80px" className="object-contain" referrerPolicy="no-referrer" />
              ) : (
                <ShieldCheck className="w-12 h-12 text-black" />
              )}
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black tracking-tight leading-tight uppercase text-black">LAPORAN MONITORING KEPATUHAN PENGGUNAAN APD</h1>
              <p className="text-sm font-bold uppercase text-black tracking-widest mt-1">UOBK RSUD AL-MULK KOTA SUKABUMI</p>
              <p className="text-xs text-slate-600 mt-1">Periode: {filters.periode ? format(new Date(filters.periode), 'MMMM yyyy', {locale: idLocale}) : 'Semua Periode'} {filters.type ? `| Tipe: ${filters.type}` : ''}</p>
            </div>
         </div>
      </div>

      <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm rounded-[2rem] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm transition-all -mx-4 sm:mx-0 print:border-none print:shadow-none print:rounded-none">
        
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#0f172a]">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex flex-col md:flex-row items-center gap-6 w-full text-left justify-start">
               <div className="flex-shrink-0">
                 {hospitalLogoUrl ? (
                   <img src={hospitalLogoUrl} alt="Logo RS" className="w-20 h-20 object-contain" />
                 ) : (
                   <ShieldCheck className="w-16 h-16 text-slate-800 dark:text-slate-200" />
                 )}
               </div>
               <div>
                 <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient uppercase tracking-tight">LAPORAN MONITORING KEPATUHAN PENGGUNAAN APD</h2>
                 <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 uppercase">UOBK RSUD AL-MULK KOTA SUKABUMI</h3>
                 <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase text-xs">
                   Periode: {filters.periode ? format(new Date(filters.periode), 'MMMM yyyy', {locale: idLocale}) : 'Semua Periode'}
                   {filters.type ? ` | Tipe: ${filters.type}` : ''}
                   {filters.searchQuery ? ` | Filter: ${filters.searchQuery}` : ''}
                 </p>
               </div>
             </div>
           </div>
        </div>

        <div className="overflow-x-auto pb-4 max-h-[600px] print:max-h-none print:overflow-visible relative">
          <table className="w-full text-center border-collapse whitespace-nowrap">
            <thead className="sticky top-0 z-20 print:static">
              <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm print:shadow-none">
                <th className="px-4 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">NO</th>
                <th className="px-4 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">WAKTU</th>
                <th className="px-4 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-left">OBSERVER</th>
                <th className="px-4 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-left">UNIT / RUANGAN</th>
                <th className="px-4 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-left">TINDAKAN</th>
                <th className="px-2 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 leading-tight min-w-[70px] whitespace-normal">MASKER</th>
                <th className="px-2 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 leading-tight min-w-[80px] whitespace-normal">SARUNG TANGAN</th>
                <th className="px-2 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 leading-tight min-w-[80px] whitespace-normal">PENUTUP KEPALA</th>
                <th className="px-2 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 leading-tight min-w-[70px] whitespace-normal">APRON</th>
                <th className="px-2 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 leading-tight min-w-[90px] whitespace-normal">KACA MATA / GOGGLE</th>
                <th className="px-2 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 leading-tight min-w-[80px] whitespace-normal">SEPATU BOOTS</th>
                <th className="px-2 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 leading-tight min-w-[90px] whitespace-normal">GAUN / BAJU PELINDUNG</th>
                <th className="px-4 py-3 border-b-2 border-l-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400">PATUH</th>
                <th className="px-4 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 whitespace-nowrap min-w-[100px]">TIDAK PATUH</th>
                <th className="px-4 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 whitespace-nowrap">HASIL (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50 text-[10px] sm:text-xs font-semibold text-slate-900 dark:text-slate-300">
              {filteredData.map((row, index) => {
                const items = [row.masker, row.sarung_tangan, row.penutup_kepala, row.apron, row.goggle, row.sepatu_boot, row.gaun_pelindung];
                const patuh = items.filter(val => val && (val.toLowerCase() === 'ya' || val.toLowerCase() === 'sesuai')).length;
                const tidakPatuh = items.filter(val => val && (val.toLowerCase() === 'tidak' || val.toLowerCase() === 'tidak sesuai')).length;
                const dinilai = patuh + tidakPatuh;
                const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;

                return (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-4 py-4 group-hover:bg-slate-50 dark:group-hover:bg-[#151e2e] transition-colors font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4 group-hover:bg-slate-50 dark:group-hover:bg-[#151e2e] transition-colors">
                      {row.tanggal_waktu ? format(parseISO(row.tanggal_waktu), 'dd/MM/yyyy HH:mm') : '-'}
                    </td>
                    <td className="px-4 py-4 text-left text-slate-700 dark:text-slate-300 uppercase group-hover:bg-slate-50 dark:group-hover:bg-[#151e2e] transition-colors">
                      {row.observer || '-'}
                    </td>
                    <td className="px-4 py-4 text-left text-[11px] font-bold text-slate-500 uppercase group-hover:bg-slate-50 dark:group-hover:bg-[#151e2e] transition-colors">
                      {row.unit || '-'}
                    </td>
                    <td className="px-4 py-4 text-left uppercase text-[9px] leading-relaxed max-w-[150px] whitespace-pre-wrap">{row.tindakan || '-'}</td>
                    <td className="px-2 py-4">{mapApdAction(row.masker)}</td>
                    <td className="px-2 py-4">{mapApdAction(row.sarung_tangan)}</td>
                    <td className="px-2 py-4">{mapApdAction(row.penutup_kepala)}</td>
                    <td className="px-2 py-4">{mapApdAction(row.apron)}</td>
                    <td className="px-2 py-4">{mapApdAction(row.goggle)}</td>
                    <td className="px-2 py-4">{mapApdAction(row.sepatu_boot)}</td>
                    <td className="px-2 py-4">{mapApdAction(row.gaun_pelindung)}</td>
                    <td className="px-4 py-4 border-l border-slate-100 dark:border-white/5 text-emerald-600 dark:text-emerald-400 text-sm font-black">{patuh}</td>
                    <td className="px-4 py-4 text-rose-600 dark:text-rose-400 text-sm font-black">{tidakPatuh}</td>
                    <td className="px-4 py-4 font-black text-sm">
                      <span className={`px-2 py-1 rounded-full ${
                        persentase >= 85 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                        persentase >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                      }`}>
                        {persentase}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={15} className="px-4 py-12 text-center text-slate-500 font-medium">Belum ada data untuk periode ini</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ringkasan Monitoring APD */}
      <div>
         <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-4">Rekapan Monitoring Kepatuhan APD</h3>
         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-5 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Observasi</span>
              <span className="text-3xl font-black text-slate-800 dark:text-white">{summaryStats.count}</span>
            </div>
            <div className="p-5 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total APD Dinilai</span>
              <span className="text-3xl font-black text-slate-800 dark:text-white">{summaryStats.dinilai}</span>
            </div>
            <div className="p-5 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 shadow-sm flex flex-col justify-center items-center text-center text-emerald-600 dark:text-emerald-400">
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1">Total Patuh</span>
              <span className="text-3xl font-black">{summaryStats.patuh}</span>
            </div>
            <div className="p-5 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-200 dark:border-rose-500/20 shadow-sm flex flex-col justify-center items-center text-center text-rose-600 dark:text-rose-400">
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1">Total Tidak Patuh</span>
              <span className="text-3xl font-black">{summaryStats.tidakPatuh}</span>
            </div>
            <div className="p-5 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-200 dark:border-blue-500/20 shadow-sm flex flex-col justify-center items-center text-center text-blue-600 dark:text-blue-400">
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1">Kepatuhan</span>
              <span className="text-3xl font-black">{summaryStats.avg}%</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
             <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                 <TrendingUp className="w-5 h-5 text-emerald-500" /> Grafik Capaian Kepatuhan APD
               </h3>
               <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                 <button onClick={() => setChartType('bar')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${chartType === 'bar' ? 'bg-white dark:bg-slate-700 shadow flex items-center gap-2 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                   <BarChart2 className="w-3.5 h-3.5" /> Bar
                 </button>
                 <button onClick={() => setChartType('line')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${chartType === 'line' ? 'bg-white dark:bg-slate-700 shadow flex items-center gap-2 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                   <TrendingUp className="w-3.5 h-3.5" /> Line
                 </button>
               </div>
             </div>
             <div className="h-[250px] w-full mt-auto">
               <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.2)" />
                     <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                     <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} axisLine={false} tickLine={false} />
                     <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} wrapperClassName="text-sm font-bold bg-white dark:bg-slate-800 rounded-xl shadow-lg border-none" labelClassName="text-slate-500 mb-2"/>
                     {chartType === 'line' ? (
                       <Line type="monotone" dataKey="val" name="Kepatuhan (%)" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#10b981' }} activeDot={{ r: 6 }} animationDuration={1000} />
                     ) : (
                       <Bar dataKey="val" name="Kepatuhan (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={1000}>
                         {trendData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.val >= 85 ? '#10b981' : entry.val >= 75 ? '#f59e0b' : '#f43f5e'} />
                         ))}
                       </Bar>
                     )}
                  </ComposedChart>
               </ResponsiveContainer>
             </div>
          </div>
          
         {/* Analysis Otomatis */}
         <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-6">
               <TrendingUp className="w-5 h-5 text-blue-500" />
               Analisa Data
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium text-justify">
              Pada periode {filters.periode ? format(new Date(filters.periode), 'MMMM yyyy', {locale: idLocale}) : 'ini'} terdapat <span className="font-bold text-slate-900 dark:text-white">{summaryStats.count} observasi</span> dengan total <span className="font-bold text-slate-900 dark:text-white">{summaryStats.dinilai} item APD</span> yang dinilai. Sebanyak <span className="font-bold text-emerald-600 dark:text-emerald-400">{summaryStats.patuh} item dinyatakan patuh</span> dan <span className="font-bold text-rose-600 dark:text-rose-400">{summaryStats.tidakPatuh} item tidak patuh</span> sehingga tingkat kepatuhan mencapai <span className="font-bold text-blue-600 dark:text-blue-400">{summaryStats.avg}%</span>.
              {recommendationData.mostMissingCount > 0 ? ` Ketidakpatuhan paling banyak ditemukan pada penggunaan ${recommendationData.mostMissingItem}.` : ' Kepatuhan sangat baik tanpa ada ketidakpatuhan.'}
            </p>
         </div>
      </div>

    </div>
  );
}

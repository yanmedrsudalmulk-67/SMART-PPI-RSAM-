import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ReportSkeleton } from '@/components/SkeletonLoading';
import { forceScrollToTop } from '@/utils/scrollHelper';
import { supabase } from '@/lib/supabase';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { 
  BarChart2, Target as TargetIcon, Activity, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown,
  Users, MapPin, Clock, Calendar as CalendarIcon, Check, X, ShieldCheck, Edit, Trash2
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
  filters: { searchQuery: string, periode: string, type?: string, unitFilter?: string } 
}) {
  const { hospitalLogoUrl } = useAppContext();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'line'|'bar'>('bar');

  const normalizeApd = (item: any) => {
    const json = item.data_indikator || item.checklist_json || {};
    let dinilai = 0;
    let patuh = 0;
    const components = ['masker', 'sarung_tangan', 'penutup_kepala', 'apron', 'goggle', 'sepatu_boot', 'gaun_pelindung'];
    components.forEach(comp => {
      const val = String(item[comp] || json[comp] || '').toLowerCase();
      if (val === 'ya' || val === 'sesuai' || val === 'tidak' || val === 'tidak sesuai') {
        dinilai++;
        if (val === 'ya' || val === 'sesuai') patuh++;
      }
    });
    const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : item.persentase || 0;
    return {
      ...item,
      id: item.id,
      tanggal_waktu: item.tanggal_waktu || item.waktu || item.created_at,
      observer: item.observer || item.supervisor || '',
      unit: item.unit || item.ruangan || '',
      profesi: item.profesi || json.profesi || 'LAINNYA',
      tindakan: item.tindakan || item.jenis_tindakan || json.tindakan || '',
      masker: item.masker || json.masker,
      sarung_tangan: item.sarung_tangan || json.sarung_tangan,
      penutup_kepala: item.penutup_kepala || json.penutup_kepala,
      apron: item.apron || json.apron,
      goggle: item.goggle || json.goggle,
      sepatu_boot: item.sepatu_boot || json.sepatu_boot,
      gaun_pelindung: item.gaun_pelindung || json.gaun_pelindung,
      jumlah_dinilai: dinilai || item.jumlah_dinilai || 0,
      jumlah_patuh: patuh || item.jumlah_patuh || 0,
      persentase,
    };
  };

  const router = useSafeRouter();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditClick = (recordId: string) => {
    router.push(`/dashboard/input/apd?id=${recordId}&mode=edit`);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      await supabase.from("audit_apd").delete().eq("id", deleteConfirmId);
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
      const [apdRes, sessionsRes] = await Promise.all([
        supabase.from('audit_apd').select('*').order('tanggal_waktu', { ascending: true }),
        supabase.from('audit_sessions').select('*').eq('indikator_id', 'audit_apd').order('tanggal_waktu', { ascending: true })
      ]);

      const sessions = (sessionsRes.data || []).map(normalizeApd);
      const apd = (apdRes.data || []).map(normalizeApd);

      const seenIds = new Set<string>();
      const seenKeys = new Set<string>();
      const combined: any[] = [];

      for (const item of sessions) {
        if (!item.id || seenIds.has(item.id)) continue;
        seenIds.add(item.id);
        const obs = (item.observer || '').toLowerCase().trim();
        const unt = (item.unit || '').toLowerCase().trim();
        const timeKey = item.tanggal_waktu ? new Date(item.tanggal_waktu).toISOString().substring(0, 16) : '';
        if (obs && unt && timeKey) {
          seenKeys.add(`${obs}_${unt}_${timeKey}`);
        }
        combined.push(item);
      }

      for (const item of apd) {
        if (!item.id || seenIds.has(item.id)) continue;
        const obs = (item.observer || '').toLowerCase().trim();
        const unt = (item.unit || '').toLowerCase().trim();
        const timeKey = item.tanggal_waktu ? new Date(item.tanggal_waktu).toISOString().substring(0, 16) : '';
        const key = `${obs}_${unt}_${timeKey}`;
        if (obs && unt && timeKey && seenKeys.has(key)) continue;

        seenIds.add(item.id);
        if (obs && unt && timeKey) seenKeys.add(key);
        combined.push(item);
      }

      combined.sort((a, b) => new Date(a.tanggal_waktu || 0).getTime() - new Date(b.tanggal_waktu || 0).getTime());
      setData(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const ch = supabase.channel('audit_apd_realtime_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_apd' }, () => {
         fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_sessions', filter: 'indikator_id=eq.audit_apd' }, () => {
         fetchData();
      })
      .on('broadcast', { event: 'audit_submitted' }, (payload) => {
        if (payload?.payload?.indikator_id === 'audit_apd') {
          fetchData();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchData]);

  const isInitialLoadRef = useRef(true);

  // Ensure scroll resets to top when navigating to report and after initial data load
  useEffect(() => {
    forceScrollToTop();
  }, []);

  useEffect(() => {
    if (!loading && isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      forceScrollToTop();
    }
  }, [loading]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filters.unitFilter && filters.unitFilter !== 'Semua Unit') {
        if (item.unit !== filters.unitFilter && item.ruangan !== filters.unitFilter) return false;
      }
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
            <div className="w-20 h-20 bg-white flex items-center justify-center relative">
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

      {/* Tabel Data Audit APD */}
      <div className="bg-[#18193b] rounded-[28px] md:rounded-[32px] border border-[#2b2d56] overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] relative group transition-all -mx-4 sm:mx-0 print:border-none print:shadow-none print:rounded-none">
        {/* Top Bevel Highlight */}
        <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="p-6 sm:p-8 border-b border-indigo-900/30 bg-[#141532]/60 backdrop-blur-md">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex flex-col md:flex-row items-center gap-6 w-full text-left justify-start">
               <div className="flex-shrink-0">
                 {hospitalLogoUrl ? (
                   <img src={hospitalLogoUrl} alt="Logo RS" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
                 ) : (
                   <ShieldCheck className="w-14 h-14 text-emerald-400" />
                 )}
               </div>
               <div>
                 <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-300 uppercase tracking-tight">LAPORAN MONITORING KEPATUHAN PENGGUNAAN APD</h2>
                 <h3 className="text-base sm:text-lg font-black text-slate-200 uppercase mt-0.5">UOBK RSUD AL-MULK KOTA SUKABUMI</h3>
                 <p className="text-slate-400 font-bold text-xs sm:text-sm mt-1 uppercase tracking-wider">
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
              <tr className="bg-[#12132e] text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-indigo-900/30 shadow-sm print:shadow-none">
                <th className="px-4 py-3.5 bg-[#12132e]">NO</th>
                <th className="px-4 py-3.5 bg-[#12132e]">WAKTU</th>
                <th className="px-4 py-3.5 bg-[#12132e] text-left">OBSERVER</th>
                <th className="px-4 py-3.5 bg-[#12132e] text-left">UNIT / RUANGAN</th>
                <th className="px-4 py-3.5 bg-[#12132e] text-left">TINDAKAN</th>
                <th className="px-2 py-3.5 bg-[#12132e] leading-tight min-w-[70px] whitespace-normal">MASKER</th>
                <th className="px-2 py-3.5 bg-[#12132e] leading-tight min-w-[80px] whitespace-normal">SARUNG TANGAN</th>
                <th className="px-2 py-3.5 bg-[#12132e] leading-tight min-w-[80px] whitespace-normal">PENUTUP KEPALA</th>
                <th className="px-2 py-3.5 bg-[#12132e] leading-tight min-w-[70px] whitespace-normal">APRON</th>
                <th className="px-2 py-3.5 bg-[#12132e] leading-tight min-w-[90px] whitespace-normal">KACA MATA / GOGGLE</th>
                <th className="px-2 py-3.5 bg-[#12132e] leading-tight min-w-[80px] whitespace-normal">SEPATU BOOTS</th>
                <th className="px-2 py-3.5 bg-[#12132e] leading-tight min-w-[90px] whitespace-normal">GAUN / BAJU PELINDUNG</th>
                <th className="px-4 py-3.5 bg-[#12132e] text-emerald-400 border-l border-white/5">PATUH</th>
                <th className="px-4 py-3.5 bg-[#12132e] text-rose-400 whitespace-nowrap min-w-[100px]">TIDAK PATUH</th>
                <th className="px-4 py-3.5 bg-[#12132e] text-cyan-400 whitespace-nowrap">HASIL (%)</th>
                <th className="px-4 py-3.5 bg-[#12132e] text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[10px] sm:text-xs font-bold text-slate-200">
              {filteredData.map((row, index) => {
                const items = [row.masker, row.sarung_tangan, row.penutup_kepala, row.apron, row.goggle, row.sepatu_boot, row.gaun_pelindung];
                const patuh = items.filter(val => val && (val.toLowerCase() === 'ya' || val.toLowerCase() === 'sesuai')).length;
                const tidakPatuh = items.filter(val => val && (val.toLowerCase() === 'tidak' || val.toLowerCase() === 'tidak sesuai')).length;
                const dinilai = patuh + tidakPatuh;
                const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;

                return (
                  <tr key={row.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-4 py-4 font-mono font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4 text-slate-300 font-mono">
                      {row.tanggal_waktu ? format(parseISO(row.tanggal_waktu), 'dd/MM/yyyy HH:mm') : '-'}
                    </td>
                    <td className="px-4 py-4 text-left text-slate-400 italic">
                      {row.observer || '-'}
                    </td>
                    <td className="px-4 py-4 text-left text-[11px] font-bold text-white uppercase">
                      {row.unit || '-'}
                    </td>
                    <td className="px-4 py-4 text-left uppercase text-[10px] font-bold text-slate-300 leading-relaxed max-w-[150px] whitespace-pre-wrap">{row.tindakan || '-'}</td>
                    <td className="px-2 py-4">{mapApdAction(row.masker)}</td>
                    <td className="px-2 py-4">{mapApdAction(row.sarung_tangan)}</td>
                    <td className="px-2 py-4">{mapApdAction(row.penutup_kepala)}</td>
                    <td className="px-2 py-4">{mapApdAction(row.apron)}</td>
                    <td className="px-2 py-4">{mapApdAction(row.goggle)}</td>
                    <td className="px-2 py-4">{mapApdAction(row.sepatu_boot)}</td>
                    <td className="px-2 py-4">{mapApdAction(row.gaun_pelindung)}</td>
                    <td className="px-4 py-4 border-l border-white/5 text-emerald-400 text-sm font-black font-mono">{patuh}</td>
                    <td className="px-4 py-4 text-rose-400 text-sm font-black font-mono">{tidakPatuh}</td>
                    <td className="px-4 py-4 font-black">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] ${
                        persentase >= 85 ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' :
                        persentase >= 70 ? 'bg-amber-950/80 text-amber-300 border-amber-500/40' :
                        'bg-rose-950/80 text-rose-300 border-rose-500/40'
                      }`}>
                        {persentase}%
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
                  <td colSpan={16} className="px-4 py-12 text-center text-slate-400 font-bold uppercase tracking-wider">Belum ada data untuk periode ini</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ringkasan Monitoring APD */}
      <div>
         <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider mb-4">Rekapan Monitoring Kepatuhan APD</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-5 bg-[#18193b] rounded-[24px] border border-[#2b2d56] shadow-[-4px_-4px_12px_rgba(140,165,255,0.05),6px_8px_20px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.15)] flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Total Observasi</span>
              <div className="bg-[#12132e] rounded-xl p-3 border border-black/40 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.7)] text-center">
                <span className="text-3xl font-black font-mono text-cyan-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">{summaryStats.count}</span>
              </div>
            </div>
            
            <div className="p-5 bg-[#18193b] rounded-[24px] border border-[#2b2d56] shadow-[-4px_-4px_12px_rgba(140,165,255,0.05),6px_8px_20px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.15)] flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Total APD Dinilai</span>
              <div className="bg-[#12132e] rounded-xl p-3 border border-black/40 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.7)] text-center">
                <span className="text-3xl font-black font-mono text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">{summaryStats.dinilai}</span>
              </div>
            </div>
            
            <div className="p-5 bg-[#18193b] rounded-[24px] border border-[#2b2d56] shadow-[-4px_-4px_12px_rgba(140,165,255,0.05),6px_8px_20px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.15)] flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Total Patuh</span>
              <div className="bg-[#12132e] rounded-xl p-3 border border-black/40 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.7)] text-center">
                <span className="text-3xl font-black font-mono text-emerald-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">{summaryStats.patuh}</span>
              </div>
            </div>
            
            <div className="p-5 bg-[#18193b] rounded-[24px] border border-[#2b2d56] shadow-[-4px_-4px_12px_rgba(140,165,255,0.05),6px_8px_20px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.15)] flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Total Tidak Patuh</span>
              <div className="bg-[#12132e] rounded-xl p-3 border border-black/40 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.7)] text-center">
                <span className="text-3xl font-black font-mono text-rose-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">{summaryStats.tidakPatuh}</span>
              </div>
            </div>
            
            <div className="p-5 bg-[#18193b] rounded-[24px] border border-[#2b2d56] shadow-[-4px_-4px_12px_rgba(140,165,255,0.05),6px_8px_20px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.15)] flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Kepatuhan</span>
              <div className="bg-[#12132e] rounded-xl p-3 border border-black/40 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.7)] text-center">
                <span className={`text-3xl font-black font-mono drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] ${summaryStats.avg >= 85 ? "text-emerald-400" : "text-amber-400"}`}>{summaryStats.avg}%</span>
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
                Apakah Anda yakin ingin menghapus data laporan audit kepatuhan penggunaan APD ini?
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

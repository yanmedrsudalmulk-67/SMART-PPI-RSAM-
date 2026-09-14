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
import PdfDownloadButton from '@/components/reports/PdfDownloadButton';
import ZoomableReportViewer from '@/components/reports/ZoomableReportViewer';

const APD_COMPONENT_ITEMS = [
  { id: 'masker', name: 'Masker', key: 'masker' },
  { id: 'sarung_tangan', name: 'Sarung Tangan', key: 'sarung_tangan' },
  { id: 'penutup_kepala', name: 'Penutup Kepala', key: 'penutup_kepala' },
  { id: 'apron', name: 'Apron', key: 'apron' },
  { id: 'goggle', name: 'Kaca Mata / Goggle', key: 'goggle' },
  { id: 'sepatu_boot', name: 'Sepatu Boots', key: 'sepatu_boot' },
  { id: 'gaun_pelindung', name: 'Gaun / Baju Pelindung', key: 'gaun_pelindung' },
];

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

  const componentStats = useMemo(() => {
    return APD_COMPONENT_ITEMS.map(comp => {
      let patuh = 0;
      let dinilai = 0;
      filteredData.forEach(row => {
        const val = String(row[comp.key] || '').toLowerCase();
        if (val === 'ya' || val === 'sesuai') {
          patuh++;
          dinilai++;
        } else if (val === 'tidak' || val === 'tidak sesuai') {
          dinilai++;
        }
      });
      const perc = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;
      return {
        id: comp.id,
        name: comp.name,
        patuh,
        dinilai,
        perc
      };
    });
  }, [filteredData]);

  const toTitleCase = (str?: string | null) => {
    if (!str || str === '-') return '-';
    const acronyms = new Set(['IGD', 'ICU', 'NICU', 'PICU', 'VK', 'OK', 'HD', 'CSSD', 'LAB', 'UTD', 'PPI', 'APD', 'WIB']);
    return str
      .trim()
      .split(/\s+/)
      .map(chunk => {
        return chunk
          .split(/([/\\-])/)
          .map(part => {
            if (part === '/' || part === '-' || part === '\\') return part;
            const upper = part.toUpperCase();
            if (acronyms.has(upper)) return upper;
            if (part.length <= 1) return part.toUpperCase();
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          })
          .join('');
      })
      .join(' ');
  };

  const formatDateTimeSafe = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      const parsed = parseISO(dateStr);
      if (isNaN(parsed.getTime())) return dateStr;
      return format(parsed, 'dd/MM/yyyy HH:mm');
    } catch (_) {
      return dateStr;
    }
  };

  const formatApdOfficial = (val: string | null | undefined) => {
    if (!val) return <span className="text-slate-400 font-bold">-</span>;
    const lower = String(val).toLowerCase();
    if (lower === 'ya' || lower === 'sesuai') {
      return <span className="font-bold text-emerald-800">✓</span>;
    }
    if (lower === 'tidak' || lower === 'tidak sesuai') {
      return <span className="font-bold text-rose-800">✗</span>;
    }
    return <span className="text-slate-400 font-bold">-</span>;
  };

  if (loading && !data.length) return <ReportSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      
      {/* LAPORAN HEADER (PRINT READY) */}
      <div className="hidden print:flex items-center gap-6 mb-8 border-b-4 border-slate-900 pb-6 w-full">
         <div className="flex items-center gap-5 w-full">
            <div className="w-20 h-20 bg-white flex items-center justify-center relative pl-2 sm:pl-3 shrink-0">
              {hospitalLogoUrl ? (
                <Image src={hospitalLogoUrl} alt="Logo RS" fill sizes="80px" className="object-contain" referrerPolicy="no-referrer" />
              ) : (
                <ShieldCheck className="w-12 h-12 text-black" />
              )}
            </div>
            <div className="text-center flex-1 pr-8 sm:pr-12">
              <h1 className="text-xl font-black tracking-tight leading-tight uppercase text-black">TIM PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)</h1>
              <p className="text-sm font-black uppercase text-black tracking-wider mt-0.5">UOBK RSUD AL-MULK KOTA SUKABUMI</p>
              <p className="text-xs text-slate-600 italic mt-0.5">Jl. Pelabuhan II No. Km.6, Lembursitu, Kec. Lembursitu, Kota Sukabumi, Jawa Barat 43168</p>
              <p className="text-xs text-slate-700 font-bold mt-1">LAPORAN MONITORING KEPATUHAN PENGGUNAAN APD | Periode: {filters.periode ? format(new Date(filters.periode), 'MMMM yyyy', {locale: idLocale}) : 'Semua Periode'} {filters.type ? `| Tipe: ${filters.type}` : ''}</p>
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
                <th className="px-4 py-3.5 bg-[#12132e] text-center">NO</th>
                <th className="px-4 py-3.5 bg-[#12132e] text-center">WAKTU</th>
                <th className="px-4 py-3.5 bg-[#12132e] text-center">OBSERVER</th>
                <th className="px-4 py-3.5 bg-[#12132e] text-center">UNIT / RUANGAN</th>
                <th className="px-4 py-3.5 bg-[#12132e] text-center">PROFESI</th>
                <th className="px-4 py-3.5 bg-[#12132e] text-center">TINDAKAN</th>
                <th className="px-2 py-3.5 bg-[#12132e] leading-tight min-w-[70px] whitespace-normal text-center">MASKER</th>
                <th className="px-2 py-3.5 bg-[#12132e] leading-tight min-w-[80px] whitespace-normal text-center">SARUNG TANGAN</th>
                <th className="px-2 py-3.5 bg-[#12132e] leading-tight min-w-[80px] whitespace-normal text-center">PENUTUP KEPALA</th>
                <th className="px-2 py-3.5 bg-[#12132e] leading-tight min-w-[70px] whitespace-normal text-center">APRON</th>
                <th className="px-2 py-3.5 bg-[#12132e] leading-tight min-w-[90px] whitespace-normal text-center">KACA MATA / GOGGLE</th>
                <th className="px-2 py-3.5 bg-[#12132e] leading-tight min-w-[80px] whitespace-normal text-center">SEPATU BOOTS</th>
                <th className="px-2 py-3.5 bg-[#12132e] leading-tight min-w-[90px] whitespace-normal text-center">GAUN / BAJU PELINDUNG</th>
                <th className="px-4 py-3.5 bg-[#12132e] text-emerald-400 border-l border-white/5 text-center">PATUH</th>
                <th className="px-4 py-3.5 bg-[#12132e] text-rose-400 whitespace-nowrap min-w-[100px] text-center">TIDAK PATUH</th>
                <th className="px-4 py-3.5 bg-[#12132e] text-cyan-400 whitespace-nowrap text-center">HASIL (%)</th>
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
                    <td className="px-4 py-4 font-mono font-bold text-slate-400 text-center">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4 text-slate-300 font-mono text-center whitespace-nowrap">
                      {row.tanggal_waktu ? format(parseISO(row.tanggal_waktu), 'dd/MM/yyyy HH:mm') : '-'}
                    </td>
                    <td className="px-4 py-4 text-center text-slate-400 italic">
                      {row.observer || '-'}
                    </td>
                    <td className="px-4 py-4 text-center text-[11px] text-white">
                      {toTitleCase(row.unit)}
                    </td>
                    <td className="px-4 py-4 text-center text-[11px] text-slate-300">
                      {toTitleCase(row.profesi)}
                    </td>
                    <td className="px-4 py-4 text-center text-[10px] font-bold text-slate-300 leading-relaxed max-w-[150px] whitespace-pre-wrap">{toTitleCase(row.tindakan)}</td>
                    <td className="px-2 py-4 text-center">{mapApdAction(row.masker)}</td>
                    <td className="px-2 py-4 text-center">{mapApdAction(row.sarung_tangan)}</td>
                    <td className="px-2 py-4 text-center">{mapApdAction(row.penutup_kepala)}</td>
                    <td className="px-2 py-4 text-center">{mapApdAction(row.apron)}</td>
                    <td className="px-2 py-4 text-center">{mapApdAction(row.goggle)}</td>
                    <td className="px-2 py-4 text-center">{mapApdAction(row.sepatu_boot)}</td>
                    <td className="px-2 py-4 text-center">{mapApdAction(row.gaun_pelindung)}</td>
                    <td className="px-4 py-4 border-l border-white/5 text-emerald-400 text-sm font-black font-mono text-center">{patuh}</td>
                    <td className="px-4 py-4 text-rose-400 text-sm font-black font-mono text-center">{tidakPatuh}</td>
                    <td className="px-4 py-4 font-black text-center">
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
                  <td colSpan={17} className="px-4 py-12 text-center text-slate-400 font-bold uppercase tracking-wider">Belum ada data untuk periode ini</td>
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

      {/* Lembar Cetak Laporan Resmi (Official Printable Document & Viewer) */}
      <div className="pt-8 border-t border-indigo-900/30 space-y-4">
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Laporan Resmi
            </h4>
          </div>
          <PdfDownloadButton
            targetElementId="apd-official-report"
            filename={`Laporan_Kepatuhan_Penggunaan_APD_RSUD_AL_MULK_${(filters.periode || 'Periode').replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`}
            title="Download PDF Laporan Kepatuhan Penggunaan APD (Landscape F4)"
            size="md"
            orientation="landscape"
            paperSize="f4"
          />
        </div>

        <ZoomableReportViewer>
          <div
            id="apd-official-report"
            data-pdf-page="true"
            data-orientation="landscape"
            className="official-report-paper official-pdf-page landscape bg-force-white text-black border border-slate-300 shadow-2xl p-6 sm:p-7 relative overflow-hidden print:shadow-none print:border-none print:p-0 print:m-0 w-[1248px] min-w-[1248px] max-w-[330mm] mx-auto"
            style={{
              width: "1248px",
              minWidth: "1248px",
              maxWidth: "1248px",
              backgroundColor: "#ffffff",
              color: "#000000",
              fontFamily: "'Calibri', 'Carlito', 'Candara', 'Segoe UI', Arial, sans-serif",
              fontSize: "9.5pt",
            }}
          >
            {/* Inline CSS print isolation */}
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                @page {
                  size: 330mm 215mm;
                  margin: 6mm;
                }
                body * {
                  visibility: hidden !important;
                }
                #apd-official-report, #apd-official-report * {
                  visibility: visible !important;
                }
                #apd-official-report {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 6mm !important;
                  border: none !important;
                  box-shadow: none !important;
                  background: white !important;
                }
              }
            `}} />

            {/* Kop Surat Resmi RSUD AL-MULK (Standar Dinas) */}
            <div className="mb-2">
              <div className="border-b-[2.5px] border-black pb-2 mb-1">
                <div className="flex items-center justify-center gap-4 sm:gap-5 max-w-4xl mx-auto">
                  <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                    {hospitalLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={hospitalLogoUrl}
                        alt="Logo RS"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <ShieldCheck className="w-10 h-10 text-black" />
                    )}
                  </div>
                  <div className="text-center">
                    <h1 className="text-[11pt] sm:text-[12pt] font-black uppercase tracking-wide leading-tight text-black">
                      TIM PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)
                    </h1>
                    <h2 className="text-[11pt] sm:text-[12pt] font-black uppercase tracking-wider leading-tight text-black mt-0.5">
                      UOBK RSUD AL-MULK KOTA SUKABUMI
                    </h2>
                    <p className="text-[8pt] sm:text-[8.5pt] text-black italic mt-0.5 leading-tight">
                      Jl. Pelabuhan II No. Km.6, Lembursitu, Kec. Lembursitu, Kota Sukabumi, Jawa Barat 43168
                    </p>
                  </div>
                </div>
              </div>
              {/* Garis batas ganda kop surat standar dinas */}
              <div className="border-b border-black mb-3" />
            </div>

            {/* Judul & Metadata Laporan */}
            <div className="text-center mb-4">
              <h1 className="text-[13pt] font-black uppercase text-black underline tracking-tight">
                LAPORAN KEPATUHAN PENGGUNAAN ALAT PELINDUNG DIRI (APD)
              </h1>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9pt] mt-3 p-2.5 bg-slate-50 border border-slate-300 rounded text-left">
                <div>
                  <span className="font-bold text-slate-600 block text-[8pt] uppercase">Periode:</span>
                  <span className="font-black text-black">
                    {filters.periode ? (
                      (() => {
                        try {
                          const date = parseISO(filters.periode);
                          const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                          return `${months[date.getMonth()]} ${date.getFullYear()}`;
                        } catch (_) {
                          return filters.periode;
                        }
                      })()
                    ) : 'Semua Periode'} {filters.type ? `(${filters.type})` : ''}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 block text-[8pt] uppercase">Unit / Ruangan:</span>
                  <span className="font-black text-black">{filters.unitFilter || 'Semua Unit'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 block text-[8pt] uppercase">Target Standar Mutu:</span>
                  <span className="font-black text-emerald-800">100% (Standar Nasional)</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 block text-[8pt] uppercase">Tanggal Unduh:</span>
                  <span className="font-black text-black">{format(new Date(), 'dd/MM/yyyy HH:mm')} WIB</span>
                </div>
              </div>
            </div>

            {/* TABEL KEPATUHAN PENGGUNAAN APD */}
            <div className="mb-4">
              <h4 className="text-[10pt] font-black uppercase tracking-wider text-slate-900 mb-1.5">
                I. Tabel Data Audit Kepatuhan Penggunaan APD
              </h4>
              <table className="w-full text-center border-collapse border border-black text-[8pt] table-fixed">
                <colgroup>
                  <col style={{ width: '3%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '8.5%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '11.5%' }} />
                  <col style={{ width: '4.5%' }} />
                  <col style={{ width: '5%' }} />
                  <col style={{ width: '5%' }} />
                  <col style={{ width: '4.5%' }} />
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '5%' }} />
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '4%' }} />
                  <col style={{ width: '4%' }} />
                  <col style={{ width: '4.5%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-slate-100 text-black font-black uppercase tracking-wider border-b border-black text-[7.5pt]">
                    <th className="border border-black px-1 py-1.5 text-center align-middle">
                      NO
                    </th>
                    <th className="border border-black px-1 py-1.5 text-center align-middle whitespace-nowrap">
                      WAKTU
                    </th>
                    <th className="border border-black px-1 py-1.5 text-center align-middle">
                      OBSERVER
                    </th>
                    <th className="border border-black px-1 py-1.5 text-center align-middle leading-tight">
                      <div>UNIT /</div>
                      <div>RUANGAN</div>
                    </th>
                    <th className="border border-black px-1 py-1.5 text-center align-middle">
                      PROFESI
                    </th>
                    <th className="border border-black px-1 py-1.5 text-center align-middle">
                      TINDAKAN
                    </th>
                    <th className="border border-black px-0.5 py-1.5 text-center align-middle">
                      MASKER
                    </th>
                    <th className="border border-black px-0.5 py-1.5 text-center align-middle leading-tight">
                      <div>SARUNG</div>
                      <div>TANGAN</div>
                    </th>
                    <th className="border border-black px-0.5 py-1.5 text-center align-middle leading-tight">
                      <div>PENUTUP</div>
                      <div>KEPALA</div>
                    </th>
                    <th className="border border-black px-0.5 py-1.5 text-center align-middle">
                      APRON
                    </th>
                    <th className="border border-black px-0.5 py-1.5 text-center align-middle leading-tight">
                      <div>KACA MATA /</div>
                      <div>GOGGLE</div>
                    </th>
                    <th className="border border-black px-0.5 py-1.5 text-center align-middle leading-tight">
                      <div>SEPATU</div>
                      <div>BOOTS</div>
                    </th>
                    <th className="border border-black px-0.5 py-1.5 text-center align-middle leading-tight">
                      <div>GAUN / BAJU</div>
                      <div>PELINDUNG</div>
                    </th>
                    <th className="border border-black px-1 py-1.5 text-center align-middle text-emerald-900">
                      PATUH
                    </th>
                    <th className="border border-black px-0.5 py-1.5 text-center align-middle leading-tight text-rose-900">
                      <div>TIDAK</div>
                      <div>PATUH</div>
                    </th>
                    <th className="border border-black px-0.5 py-1.5 text-center align-middle leading-tight">
                      <div>HASIL</div>
                      <div>(%)</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, index) => {
                    const items = [row.masker, row.sarung_tangan, row.penutup_kepala, row.apron, row.goggle, row.sepatu_boot, row.gaun_pelindung];
                    const patuh = items.filter(val => val && (val.toLowerCase() === 'ya' || val.toLowerCase() === 'sesuai')).length;
                    const tidakPatuh = items.filter(val => val && (val.toLowerCase() === 'tidak' || val.toLowerCase() === 'tidak sesuai')).length;
                    const dinilai = patuh + tidakPatuh;
                    const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;

                    return (
                      <tr key={`print_apd_${row.id || index}`} className="even:bg-slate-50/50">
                        <td className="border border-black px-1 py-1 text-center font-mono text-[7.5pt] align-middle">{index + 1}</td>
                        <td className="border border-black px-1 py-1 text-center font-mono text-[7.5pt] whitespace-nowrap align-middle">
                          {formatDateTimeSafe(row.tanggal_waktu)}
                        </td>
                        <td className="border border-black px-1 py-1 text-center text-slate-800 text-[7.5pt] leading-tight break-words align-middle" title={row.observer || '-'}>{row.observer || '-'}</td>
                        <td className="border border-black px-1 py-1 text-center text-[7.5pt] leading-tight break-words align-middle" title={row.unit || '-'}>{toTitleCase(row.unit)}</td>
                        <td className="border border-black px-1 py-1 text-center text-[7.5pt] leading-tight break-words align-middle" title={row.profesi || '-'}>{toTitleCase(row.profesi)}</td>
                        <td className="border border-black px-1 py-1 text-center text-[7.5pt] leading-tight break-words align-middle" title={row.tindakan || '-'}>{toTitleCase(row.tindakan)}</td>
                        <td className="border border-black px-0.5 py-1 text-center text-[8pt] align-middle">{formatApdOfficial(row.masker)}</td>
                        <td className="border border-black px-0.5 py-1 text-center text-[8pt] align-middle">{formatApdOfficial(row.sarung_tangan)}</td>
                        <td className="border border-black px-0.5 py-1 text-center text-[8pt] align-middle">{formatApdOfficial(row.penutup_kepala)}</td>
                        <td className="border border-black px-0.5 py-1 text-center text-[8pt] align-middle">{formatApdOfficial(row.apron)}</td>
                        <td className="border border-black px-0.5 py-1 text-center text-[8pt] align-middle">{formatApdOfficial(row.goggle)}</td>
                        <td className="border border-black px-0.5 py-1 text-center text-[8pt] align-middle">{formatApdOfficial(row.sepatu_boot)}</td>
                        <td className="border border-black px-0.5 py-1 text-center text-[8pt] align-middle">{formatApdOfficial(row.gaun_pelindung)}</td>
                        <td className="border border-black px-1 py-1 text-center font-mono text-emerald-800 text-[8pt] align-middle">{patuh}</td>
                        <td className="border border-black px-1 py-1 text-center font-mono text-rose-800 text-[8pt] align-middle">{tidakPatuh}</td>
                        <td className="border border-black px-1 py-1 text-center text-[8pt] align-middle">
                          <span className={persentase >= 85 ? 'text-emerald-800' : persentase >= 70 ? 'text-amber-800' : 'text-rose-800'}>
                            {persentase}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={16} className="border border-black px-4 py-6 text-center text-slate-500 font-bold align-middle">
                        Tidak ada data audit kepatuhan APD untuk periode ini
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black border-t-2 border-black text-black">
                    <td colSpan={13} className="border border-black px-3 py-1.5 text-center uppercase tracking-wider text-[7.5pt] align-middle">
                      TOTAL DAN RATA-RATA KESELURUHAN:
                    </td>
                    <td className="border border-black px-1 py-1.5 text-center font-mono text-[8.5pt] align-middle text-emerald-900">
                      {summaryStats.patuh}
                    </td>
                    <td className="border border-black px-1 py-1.5 text-center font-mono text-[8.5pt] align-middle text-rose-900">
                      {summaryStats.tidakPatuh}
                    </td>
                    <td className="border border-black px-1 py-1.5 text-center font-mono text-[8.5pt] align-middle">
                      <span className={summaryStats.avg >= 85 ? 'text-emerald-800 font-black' : 'text-rose-800 font-black'}>
                        {summaryStats.avg}%
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* II. Ringkasan Evaluasi & Analisis Indikator Kepatuhan APD */}
            <div className="space-y-3 mt-2 break-inside-avoid">
              <h4 className="text-[10pt] font-black uppercase tracking-wider text-slate-900">
                II. Ringkasan Evaluasi & Analisis Indikator Kepatuhan APD
              </h4>

              {/* 3 Overview Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-300 rounded text-center">
                  <span className="text-[7.5pt] font-black uppercase tracking-wider text-slate-600 block">Total Observasi</span>
                  <span className="text-[16pt] font-black font-mono text-black leading-tight block mt-0.5">
                    {summaryStats.count}
                  </span>
                  <span className="text-[7.5pt] text-slate-500 font-bold uppercase">Sesi Audit Terdata</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-300 rounded text-center">
                  <span className="text-[7.5pt] font-black uppercase tracking-wider text-slate-600 block">Kepatuhan Tindakan</span>
                  <span className="text-[16pt] font-black font-mono text-emerald-800 leading-tight block mt-0.5">
                    {summaryStats.patuh} / {summaryStats.dinilai}
                  </span>
                  <span className="text-[7.5pt] text-slate-500 font-bold uppercase">Item APD Patuh Digunakan</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-300 rounded text-center">
                  <span className="text-[7.5pt] font-black uppercase tracking-wider text-slate-600 block">Rata-rata Kepatuhan</span>
                  <span className={`text-[16pt] font-black font-mono leading-tight block mt-0.5 ${summaryStats.avg >= 85 ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {summaryStats.avg}%
                  </span>
                  <span className={`text-[7.5pt] font-black uppercase inline-block px-1.5 py-0.5 rounded mt-0.5 ${summaryStats.avg === 100 ? 'bg-emerald-100 text-emerald-800' : summaryStats.avg >= 85 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>
                    {summaryStats.avg === 100 ? 'Sempurna (100%)' : summaryStats.avg >= 85 ? 'Sesuai Standar (≥85%)' : 'Di Bawah Standar'}
                  </span>
                </div>
              </div>

              {/* Analisis Persentase Per Komponen APD (7 Komponen) */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-black text-black uppercase text-[8.5pt]">
                    Analisis Persentase Capaian Per Komponen APD
                  </h5>
                  <span className="text-[7.5pt] text-slate-600 font-bold">Target Mutu PPI: 100%</span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {componentStats.map((item) => {
                    const isMet = item.perc >= 85;
                    return (
                      <div key={item.id} className="p-2 bg-white border border-slate-300 rounded text-center">
                        <span className="text-[7.5pt] font-black text-black block truncate" title={item.name}>{item.name}</span>
                        <span className={`text-[13pt] font-black font-mono leading-none block my-1 ${isMet ? 'text-emerald-800' : 'text-rose-800'}`}>
                          {item.perc}%
                        </span>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden my-1">
                          <div
                            className={`h-full ${isMet ? 'bg-emerald-600' : 'bg-rose-600'}`}
                            style={{ width: `${Math.min(item.perc, 100)}%` }}
                          />
                        </div>
                        <span className="text-[6.5pt] font-bold text-slate-600 block leading-tight">
                          {item.patuh}/{item.dinilai}
                        </span>
                        <span className={`text-[6.5pt] font-black uppercase mt-0.5 inline-block px-1 rounded ${isMet ? 'text-emerald-800 bg-emerald-50' : 'text-rose-800 bg-rose-50'}`}>
                          {isMet ? 'Tercapai' : '< 85%'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Standar & Keterangan Tambahan */}
              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded flex items-center justify-between text-[8pt] text-slate-700">
                <div>
                  <strong className="text-black">Standar Akreditasi Kemenkes RI:</strong> Penggunaan Alat Pelindung Diri (APD) harus sesuai indikasi dan transmisi risiko penularan infeksi dengan target kepatuhan 100%.
                </div>
                <div className="text-[7.5pt] text-slate-500 font-bold shrink-0 ml-4">
                  Keterangan: (✓) = Patuh/Sesuai | (✗) = Tidak Patuh | (-) = Tidak Dinilai/NA
                </div>
              </div>

              {/* Lembar Tanda Tangan / Pengesahan */}
              <div className="mt-4 pt-3 border-t border-slate-300 grid grid-cols-2 gap-8 text-[9pt] text-center signature-block break-inside-avoid" data-pdf-block="signature" data-pdf-signature="true">
                <div>
                  <p className="text-slate-700 font-bold mb-16">
                    Mengetahui,<br />
                    <span className="text-black font-black">Ketua PPI</span>
                  </p>
                  <p className="font-black text-black underline text-[9.5pt]">
                    dr. Nurul Iman
                  </p>
                </div>
                <div>
                  <p className="text-slate-700 font-bold mb-16">
                    Sukabumi, {format(new Date(), 'd MMMM yyyy', { locale: idLocale })}<br />
                    <span className="text-black font-black">IPCN</span>
                  </p>
                  <p className="font-black text-black underline text-[9.5pt]">
                    Adi Tresa Purnama
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ZoomableReportViewer>
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

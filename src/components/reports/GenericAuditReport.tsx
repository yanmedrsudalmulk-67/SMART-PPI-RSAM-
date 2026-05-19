import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { utils, writeFile } from 'xlsx';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, Activity, BarChart2, TrendingDown, Target, Calendar, CheckSquare, Search, FileText, Printer, Download, FileSpreadsheet,
  CheckCircle2, AlertTriangle, ShieldCheck, User, Building2, Clock, Check, Trash2, Edit, Plus
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell
} from '@/components/ChartComponents';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { useAppContext } from '@/components/Providers';

interface GenericAuditData {
  id: string;
  tanggal_waktu?: string;
  waktu?: string;
  observer?: string;
  supervisor?: string;
  unit?: string;
  ruangan?: string;
  profesi?: string;
  nama_pasien?: string;
  data_indikator?: Record<string, string | null>;
  checklist_json?: Record<string, string | null>;
  persentase: number;
  status_kepatuhan?: string;
  temuan?: string;
  rekomendasi?: string;
  foto?: string[];
  dokumentasi?: string[];
  tanda_tangan_1?: string;
  tanda_tangan_2?: string;
  ttd_pj_ruangan?: string;
  ttd_ipcn?: string;
  tanda_tangan?: string[];
}

export default function GenericAuditReport({ 
  tableName,
  indicatorItems,
  title,
  extraFilter,
  filters
}: { 
  tableName: string,
  indicatorItems: {id: string, label: string, key: string, isNegative?: boolean}[],
  title: string,
  extraFilter?: Record<string, string>,
  filters?: { periode?: string; unitFilter?: string; searchQuery?: string; type?: string }
}) {
  const { hospitalLogoUrl } = useAppContext();
  const [data, setData] = useState<GenericAuditData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [searchDoc, setSearchDoc] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let sessionQuery = supabase.from('audit_sessions').select('*').eq('indikator_id', tableName);
      if (extraFilter) sessionQuery = sessionQuery.match(extraFilter);
      const { data: sessionData } = await sessionQuery.order('tanggal_waktu', { ascending: false });
      
      let tableData: any[] = [];
      try {
        let tableQuery = supabase.from(tableName).select('*');
        if (extraFilter) tableQuery = tableQuery.match(extraFilter);
        const { data: tData } = await tableQuery.order('tanggal_waktu', { ascending: false });
        if (tData) tableData = tData;
      } catch (e) {}

      const rawData = [...(sessionData || []), ...tableData];
      const ids = new Set();
      const result = rawData.filter(d => {
         const key = d.id;
         if (key && ids.has(key)) return false;
         if (key) ids.add(key);
         return true;
      });
      
      const normalized = result.map((item: any) => ({
        ...item,
        waktu: item.tanggal_waktu || item.waktu || item.created_at,
        checklist_json: item.checklist_json || item.data_indikator || item.checklist_data || {},
        persentase: item.persentase !== undefined ? item.persentase : (item.compliance_score !== undefined ? item.compliance_score : 0),
        tanda_tangan_1: item.ttd_pj_ruangan || item.ttd_pj || item.tanda_tangan_1 || item.tanda_tangan?.[0],
        tanda_tangan_2: item.ttd_ipcn || item.tanda_tangan_2 || item.tanda_tangan?.[1],
        foto: item.dokumentasi || item.foto || []
      })).sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());
      
      setData(normalized);
      if (normalized.length > 0 && selectedRecordId === null) setSelectedRecordId(normalized[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tableName, extraFilter, selectedRecordId]);

  useEffect(() => {
    fetchData();
    const chTarget = supabase.channel(`changes_${tableName}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => fetchData())
      .subscribe();
      
    return () => { supabase.removeChannel(chTarget); };
  }, [tableName, fetchData]);

  useEffect(() => {
    const handleExportExcel = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.indicator === tableName) {
        if (!data || data.length === 0) {
          alert('Tidak ada data untuk diekspor');
          return;
        }

        const wb = utils.book_new();
        
        // Export Overview
        const wsData = data.map(item => ({
          'ID': item.id,
          'Waktu': item.waktu ? format(parseISO(item.waktu), 'dd/MM/yyyy HH:mm') : '',
          'Supervisor': item.supervisor || item.observer || '-',
          'Unit/Ruangan': item.unit || item.ruangan || '-',
          'Profesi/Pasien': item.profesi || item.nama_pasien || '-',
          'Skor Kepatuhan (%)': item.persentase || 0,
          'Temuan': item.temuan || '-',
          'Rekomendasi': item.rekomendasi || '-'
        }));
        const ws = utils.json_to_sheet(wsData);
        utils.book_append_sheet(wb, ws, "Rekap Audit");

        writeFile(wb, `Laporan_${tableName}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
      }
    };
    window.addEventListener('export-excel', handleExportExcel);
    return () => window.removeEventListener('export-excel', handleExportExcel);
  }, [data, tableName]);

  const { filteredRecords, summaryStats, trendData } = useMemo(() => {
    let filteredData = data;
    if (filters) {
      filteredData = data.filter(item => {
        if (filters.periode) {
           if (!item.waktu) return false;
           
           const itemDate = new Date(item.waktu);
           const filterDate = new Date(filters.periode);
           const type = filters.type || 'Tahunan';
           
           if (type === 'Bulanan') {
             if (itemDate.getMonth() !== filterDate.getMonth() || itemDate.getFullYear() !== filterDate.getFullYear()) return false;
           } else if (type === 'Triwulan') {
             const qtItem = Math.floor(itemDate.getMonth() / 3);
             const qtFilter = Math.floor(filterDate.getMonth() / 3);
             if (qtItem !== qtFilter || itemDate.getFullYear() !== filterDate.getFullYear()) return false;
           } else if (type === 'Semester') {
             const sItem = Math.floor(itemDate.getMonth() / 6);
             const sFilter = Math.floor(filterDate.getMonth() / 6);
             if (sItem !== sFilter || itemDate.getFullYear() !== filterDate.getFullYear()) return false;
           } else if (type === 'Tahunan') {
             if (itemDate.getFullYear() !== filterDate.getFullYear()) return false;
           }
        }
        if (filters.unitFilter && filters.unitFilter !== 'Semua Unit') {
          if (item.unit !== filters.unitFilter && item.ruangan !== filters.unitFilter) return false;
        }
        if (searchDoc) {
          const query = searchDoc.toLowerCase();
          if (!item.observer?.toLowerCase().includes(query) && !item.unit?.toLowerCase().includes(query) && !item.ruangan?.toLowerCase().includes(query)) return false;
        }
        return true;
      });
    }

    if (filteredData.length === 0) return { filteredRecords: [], summaryStats: { avg: 0, count: 0, high: 0, low: 0, trend: 0 }, trendData: [] };

    const allPerc = filteredData.map(r => r.persentase);
    const avg = allPerc.reduce((a,b)=>a+b,0) / allPerc.length;

    // Trend Data Logic
    const periodMap = new Map<string, any[]>();
    const filterDate = filters?.periode ? new Date(filters.periode) : new Date();
    const fYear = filterDate.getFullYear();
    let startMonth = 0;
    let endMonth = 11;
    const type = filters?.type || 'Tahunan';

    if (type === 'Bulanan') {
        startMonth = filterDate.getMonth();
        endMonth = filterDate.getMonth();
    } else if (type === 'Triwulan') {
        startMonth = Math.floor(filterDate.getMonth() / 3) * 3;
        endMonth = startMonth + 2;
    } else if (type === 'Semester') {
        startMonth = Math.floor(filterDate.getMonth() / 6) * 6;
        endMonth = startMonth + 5;
    }

    for (let i = startMonth; i <= endMonth; i++) {
        const k = `${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"][i]} ${fYear}`;
        periodMap.set(k, []);
    }

    filteredData.forEach(row => {
      if(!row.waktu) return;
      const date = new Date(row.waktu);
      const k = `${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"][date.getMonth()]} ${date.getFullYear()}`;
      if(periodMap.has(k)) {
        periodMap.get(k)!.push(row);
      }
    });

    const trend = Array.from(periodMap.entries()).map(([k, recs]) => {
       const a = recs.length > 0 ? recs.reduce((sum, r) => sum + (r.persentase || 0), 0) / recs.length : 0;
       return { name: k, val: Math.round(a) };
    });

    return { 
      filteredRecords: filteredData,
      summaryStats: {
        avg: Math.round(avg),
        count: filteredData.length,
        high: Math.max(...allPerc),
        low: Math.min(...allPerc),
        trend: trend.length > 1 ? trend[trend.length-1].val - trend[0].val : 0
      },
      trendData: trend
    };
  }, [data, filters, searchDoc]);

  // If selected record is not in filtered list, select the first one from filtered
  useEffect(() => {
    if (filteredRecords.length > 0 && (!selectedRecordId || !filteredRecords.find(r => r.id === selectedRecordId))) {
      setSelectedRecordId(filteredRecords[0].id);
    } else if (filteredRecords.length === 0) {
      setSelectedRecordId(null);
    }
  }, [filteredRecords, selectedRecordId]);

  const selectedRecord = filteredRecords.find(r => r.id === selectedRecordId);

  const getStatus = (itemId: string) => {
    if(!selectedRecord) return undefined;
    const val: any = selectedRecord.checklist_json?.[itemId];
    if (typeof val === 'string') return val.toLowerCase();
    if (val && typeof val === 'object' && 'status' in val && typeof val.status === 'string') {
      return val.status.toLowerCase();
    }
    return undefined;
  };

  const getKeterangan = (itemId: string) => {
    if(!selectedRecord) return '';
    const val: any = selectedRecord.checklist_json?.[itemId];
    if (val && typeof val === 'object' && 'keterangan' in val && typeof val.keterangan === 'string') {
      return val.keterangan;
    }
    return '';
  };

  const toSentenceCase = (str: string) => {
    if (!str) return '';
    const cleaned = str.replace(/_/g, ' ');
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  };

  const checklistItems = indicatorItems && indicatorItems.length > 0 
      ? indicatorItems.map(i => ({ id: i.key, label: i.label }))
      : Object.keys(selectedRecord?.checklist_json || {}).map(k => ({ id: k, label: toSentenceCase(k) }));

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('record-selected', { detail: { id: selectedRecordId } }));
  }, [selectedRecordId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 bg-white/5 backdrop-blur-md rounded-3xl animate-pulse">
      <Activity className="w-10 h-10 text-slate-400 mb-4 animate-spin" />
      <span className="text-slate-500 font-medium">Memuat Data Analisis...</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      
      {/* SELECTION ROW */}
      <div className="bg-white dark:bg-[#111827]/80 backdrop-blur-xl rounded-[2rem] p-4 sm:p-6 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center z-10 relative print:hidden">
        <div className="flex-1 w-full">
           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Pilih Data Audit ({filteredRecords.length})</label>
           <select 
             value={selectedRecordId || ''} 
             onChange={(e) => setSelectedRecordId(e.target.value)}
             className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
           >
             {filteredRecords.length === 0 && <option value="">Belum ada data di periode ini</option>}
             {filteredRecords.map((rec, i) => (
               <option key={rec.id} value={rec.id}>
                 {rec.waktu ? format(parseISO(rec.waktu), 'dd/MM/yyyy HH:mm') : '-'}  |  {rec.unit || rec.ruangan || 'Tanpa Unit'}  |  {rec.observer || rec.supervisor || 'Tanpa Supervisor'}  |  {rec.persentase}%
               </option>
             ))}
           </select>
        </div>
        
        <div className="flex-1 w-full relative">
           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Pencarian Cepat</label>
           <div className="relative w-full">
             <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Cari unit atau supervisor..." 
               value={searchDoc}
               onChange={e => setSearchDoc(e.target.value)}
               className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
             />
           </div>
        </div>
      </div>

      {filteredRecords.length > 0 && selectedRecord ? (
        <div className="bg-white dark:bg-[#0b1121] rounded-[2rem] border border-slate-200 dark:border-blue-500/20 shadow-xl overflow-hidden print:m-0 print:border-none print:shadow-none min-h-[500px]">
          {/* HEADER RESMI */}
          <div className="p-6 md:p-8 pb-0 border-b-4 border-double border-slate-300 dark:border-blue-500/30 w-full bg-white dark:bg-[#0b1121] print:bg-white print:border-slate-300">
             <div className="flex items-center justify-between gap-6 pb-6">
                <div className="flex items-center gap-4 md:gap-5 w-full justify-center md:justify-start">
                   <div className="w-16 h-16 md:w-20 md:h-20 bg-white flex items-center justify-center p-1 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden shrink-0">
                     {hospitalLogoUrl ? (
                       <Image src={hospitalLogoUrl} alt="Logo RS" fill sizes="80px" className="object-contain" referrerPolicy="no-referrer" />
                     ) : (
                       <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-slate-800" />
                     )}
                   </div>
                   <div className="text-left flex flex-col justify-center">
                     <h1 className="text-lg md:text-2xl font-black tracking-tight text-slate-900 dark:text-white print:text-black uppercase leading-tight print:break-normal">
                       TIM PENCEGAHAN & PENGENDALIAN INFEKSI
                     </h1>
                     <p className="text-xs md:text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 print:text-black uppercase tracking-widest mt-1">
                       UOBK RSUD AL-MULK KOTA SUKABUMI
                     </p>
                   </div>
                </div>
                <div className="hidden lg:flex flex-col items-end">
                  <div className="px-4 py-2 bg-slate-50 dark:bg-blue-500/5 print:bg-white print:border-slate-200 border border-slate-200 dark:border-blue-500/20 rounded-xl text-right inline-block">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 print:text-slate-600">Kode Dokumen</p>
                    <p className="text-sm md:text-lg font-mono font-bold text-slate-900 dark:text-blue-400 print:text-black">#AUDIT-{selectedRecord.id.substring(0,6).toUpperCase()}</p>
                  </div>
                </div>
             </div>
          </div>

          <div className="p-6 md:p-8 text-center bg-white dark:bg-[#0b1121] print:bg-white border-b border-slate-100 dark:border-white/5 print:border-none">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white print:text-black leading-tight">
              FORMULIR LAPORAN AUDIT
            </h2>
            <h3 className="text-sm md:text-lg font-bold uppercase tracking-wider text-slate-600 dark:text-blue-300 print:text-slate-700 mt-2">
              {title}
            </h3>
          </div>

          {/* INFO AUDIT CARD */}
          <div className="px-4 md:px-8 pb-8 bg-white dark:bg-[#0b1121] print:bg-white pt-4">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 bg-slate-50 dark:bg-[#111827]/80 print:bg-white rounded-xl md:rounded-[1.5rem] p-3 md:p-4 text-slate-900 border border-slate-200 dark:border-white/10 print:border-slate-300 dark:text-white shadow-inner print:shadow-none">
               <div className="p-3 md:p-4 bg-white dark:bg-white/5 print:bg-white rounded-lg md:rounded-xl border border-slate-100 dark:border-white/5 print:border-slate-200 flex flex-col print:border-0 print:p-2">
                 <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5 print:text-slate-600"><Clock className="w-3 h-3"/> Waktu Pelaksanaan</span>
                 <span className="text-xs md:text-sm font-bold truncate mt-auto print:text-black">{selectedRecord.waktu ? format(parseISO(selectedRecord.waktu), 'dd MMM yyyy, HH:mm', { locale: idLocale }) : '-'}</span>
               </div>
               <div className="p-3 md:p-4 bg-white dark:bg-white/5 print:bg-white rounded-lg md:rounded-xl border border-slate-100 dark:border-white/5 print:border-slate-200 flex flex-col print:border-0 print:p-2">
                 <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5 print:text-slate-600"><User className="w-3 h-3"/> Supervisor / IPCN</span>
                 <span className="text-xs md:text-sm font-bold uppercase truncate mt-auto print:text-black" title={selectedRecord.supervisor || selectedRecord.observer || '-'}>{selectedRecord.supervisor || selectedRecord.observer || '-'}</span>
               </div>
               <div className="p-3 md:p-4 bg-white dark:bg-white/5 print:bg-white rounded-lg md:rounded-xl border border-slate-100 dark:border-white/5 print:border-slate-200 flex flex-col print:border-0 print:p-2">
                 <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5 print:text-slate-600"><Building2 className="w-3 h-3"/> Unit / Ruangan</span>
                 <span className="text-xs md:text-sm font-bold uppercase truncate mt-auto print:text-black" title={selectedRecord.unit || selectedRecord.ruangan || '-'}>{selectedRecord.unit || selectedRecord.ruangan || '-'}</span>
               </div>
               <div className="p-3 md:p-4 bg-white dark:bg-white/5 print:bg-white rounded-lg md:rounded-xl border border-slate-100 dark:border-white/5 print:border-slate-200 flex flex-col print:border-0 print:p-2">
                 <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5 print:text-slate-600"><Activity className="w-3 h-3"/> Profesi / Pasien</span>
                 <span className="text-xs md:text-sm font-bold uppercase truncate mt-auto print:text-black" title={selectedRecord.profesi || selectedRecord.nama_pasien || '-'}>{selectedRecord.profesi || selectedRecord.nama_pasien || '-'}</span>
               </div>
             </div>
          </div>

          {/* TABEL AUDIT UTAMA */}
          <div className="px-4 md:px-8 pb-8 bg-white dark:bg-[#0b1121] print:bg-white overflow-x-auto print:overflow-visible w-full">
             <table className="w-full text-left border-collapse border border-slate-200 dark:border-blue-500/20 print:border-slate-300 min-w-[600px]">
               <thead>
                 <tr className="bg-slate-100 dark:bg-blue-500/10 print:bg-slate-50 text-slate-900 dark:text-blue-300 print:text-black text-[10px] md:text-[11px] font-black uppercase tracking-widest">
                   <th className="px-3 md:px-4 py-3 md:py-4 w-8 md:w-12 text-center border-r border-slate-200 dark:border-blue-500/20 print:border-slate-300">NO</th>
                   <th className="px-4 md:px-6 py-3 md:py-4 border-r border-slate-200 dark:border-blue-500/20 print:border-slate-300">ITEM STANDAR AUDIT</th>
                   <th className="px-2 md:px-4 py-3 md:py-4 w-12 md:w-16 text-center border-r border-slate-200 dark:border-blue-500/20 print:border-slate-300 text-emerald-600 dark:text-emerald-400 print:text-black">YA</th>
                   <th className="px-2 md:px-4 py-3 md:py-4 w-12 md:w-16 text-center border-r border-slate-200 dark:border-blue-500/20 print:border-slate-300 text-rose-600 dark:text-rose-400 print:text-black">TDK</th>
                   <th className="px-2 md:px-4 py-3 md:py-4 w-12 md:w-16 text-center border-r border-slate-200 dark:border-blue-500/20 print:border-slate-300 text-slate-500 print:text-black">N/A</th>
                   <th className="px-4 md:px-6 py-3 md:py-4 text-left border-slate-200 dark:border-blue-500/20 print:border-slate-300">CATATAN TEMUAN</th>
                 </tr>
               </thead>
               <tbody className="text-xs md:text-sm text-slate-800 dark:text-slate-200 print:text-black font-medium">
                 {checklistItems.map((item, idx) => {
                   const status = getStatus(item.id);
                   const keterangan = getKeterangan(item.id);
                   return (
                     <tr key={item.id} className="border-b border-slate-200 dark:border-blue-500/10 hover:bg-slate-50 dark:hover:bg-blue-500/5 print:border-slate-300 transition-colors">
                       <td className="px-3 md:px-4 py-3 md:py-4 text-center border-r border-slate-200 dark:border-blue-500/20 print:border-slate-300 text-slate-500 print:text-black">{idx + 1}</td>
                       <td className="px-4 md:px-6 py-3 md:py-4 border-r border-slate-200 dark:border-blue-500/20 print:border-slate-300 leading-relaxed font-semibold">{item.label}</td>
                       <td className="px-2 md:px-4 py-3 md:py-4 text-center border-r border-slate-200 dark:border-blue-500/20 print:border-slate-300">
                         {status === 'ya' && <Check className="w-4 h-4 md:w-5 md:h-5 mx-auto text-emerald-500 dark:text-emerald-400 print:text-black drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] print:drop-shadow-none" strokeWidth={3} />}
                       </td>
                       <td className="px-2 md:px-4 py-3 md:py-4 text-center border-r border-slate-200 dark:border-blue-500/20 print:border-slate-300">
                         {status === 'tidak' && <Check className="w-4 h-4 md:w-5 md:h-5 mx-auto text-rose-500 dark:text-rose-400 print:text-black drop-shadow-[0_0_8px_rgba(244,63,94,0.5)] print:drop-shadow-none" strokeWidth={3} />}
                       </td>
                       <td className="px-2 md:px-4 py-3 md:py-4 text-center border-r border-slate-200 dark:border-blue-500/20 print:border-slate-300">
                         {status === 'na' && <Check className="w-4 h-4 md:w-5 md:h-5 mx-auto text-slate-400 print:text-black" strokeWidth={3} />}
                       </td>
                       <td className="px-4 md:px-6 py-3 md:py-4 text-xs text-slate-600 dark:text-slate-400 print:text-black">{keterangan || '-'}</td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
          </div>

          <div className="px-4 md:px-8 pb-8 bg-white dark:bg-[#0b1121] print:bg-white">
             {/* SUMMARY CARDS */}
             <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-8 print:hidden">
               <div className="col-span-2 bg-gradient-to-br from-blue-600 to-emerald-600 text-white p-4 md:p-6 rounded-xl md:rounded-[1.5rem] shadow-lg flex items-center justify-between relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px]" />
                 <div>
                   <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/80 mb-2">Persentase Kepatuhan</p>
                   <p className="text-4xl md:text-5xl font-black">{selectedRecord.persentase}%</p>
                 </div>
                 <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex-shrink-0">
                   {selectedRecord.persentase >= 85 ? <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8" /> : <AlertTriangle className="w-6 h-6 md:w-8 md:h-8" />}
                 </div>
               </div>
               
               <div className="p-4 md:p-5 border border-slate-200 dark:border-blue-500/20 rounded-xl md:rounded-[1.5rem] flex flex-col justify-center bg-slate-50 dark:bg-white/5">
                 <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Audit Periode</p>
                 <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{summaryStats.count}</p>
               </div>
               <div className="p-4 md:p-5 border border-slate-200 dark:border-blue-500/20 rounded-xl md:rounded-[1.5rem] flex flex-col justify-center bg-slate-50 dark:bg-white/5">
                 <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Nilai Tertinggi</p>
                 <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{summaryStats.high}%</p>
               </div>
               <div className="p-4 md:p-5 border border-slate-200 dark:border-blue-500/20 rounded-xl md:rounded-[1.5rem] flex flex-col justify-center bg-slate-50 dark:bg-white/5">
                 <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Tren Capaian</p>
                 <div className="flex items-center gap-1.5 md:gap-2">
                   <p className={`text-xl md:text-2xl font-black ${summaryStats.trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                     {summaryStats.trend >= 0 ? '+' : ''}{summaryStats.trend}%
                   </p>
                   {summaryStats.trend >= 0 ? <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-emerald-500"/> : <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-rose-500"/>}
                 </div>
               </div>
             </div>

             {/* GRAPH */}
             <div className="bg-slate-50 dark:bg-[#111827]/80 rounded-xl md:rounded-[1.5rem] border border-slate-200 dark:border-blue-500/20 p-4 md:p-6 pt-6 md:pt-8 mb-8 print:hidden">
                <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center mb-6">
                   <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                     <BarChart2 className="w-4 h-4 text-blue-500" /> Analisis Tren {filters?.periode ? format(new Date(filters.periode), 'MMMM yyyy', {locale: idLocale}) : ''} {filters?.type || ''}
                   </h3>
                   <div className="flex gap-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl w-fit">
                     <button onClick={() => setChartType('line')} className={`px-4 py-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${chartType === 'line' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>Line</button>
                     <button onClick={() => setChartType('bar')} className={`px-4 py-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${chartType === 'bar' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>Bar</button>
                   </div>
                </div>
                <div className="h-[200px] md:h-[250px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                     {chartType === 'line' ? (
                        <AreaChart data={trendData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--tw-colors-slate-200)" opacity={0.2} />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                          <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid rgba(100,116,139,0.2)', backgroundColor: 'var(--tw-colors-slate-900)', color: 'white' }}
                          />
                          <Area type="monotone" dataKey="val" name="Capaian (%)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
                        </AreaChart>
                     ) : (
                        <BarChart data={trendData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--tw-colors-slate-200)" opacity={0.2} />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                          <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid rgba(100,116,139,0.2)', backgroundColor: 'var(--tw-colors-slate-900)', color: 'white' }}
                          />
                          <Bar dataKey="val" name="Capaian (%)" radius={[4, 4, 0, 0]} maxBarSize={60}>
                            {(trendData || []).map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.val >= 85 ? '#10b981' : (entry.val >= 70 ? '#3b82f6' : '#f43f5e')} />
                            ))}
                          </Bar>
                        </BarChart>
                     )}
                  </ResponsiveContainer>
                </div>
             </div>

             {/* TEMUAN & REKOMENDASI */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 page-break-inside-avoid">
                <div className="bg-rose-50 dark:bg-rose-500/10 print:bg-white print:border-slate-300 border border-rose-200 dark:border-rose-500/20 rounded-xl md:rounded-[1.5rem] p-5 md:p-6 text-rose-900 dark:text-rose-200 print:text-black">
                  <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                     <AlertTriangle className="w-4 h-4 print:hidden" /> Catatan Temuan Lapangan
                  </h3>
                  <div className="text-xs md:text-sm font-medium whitespace-pre-wrap leading-relaxed opacity-90">
                    {selectedRecord.temuan || 'Tidak ada catatan temuan untuk audit ini.'}
                  </div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-500/10 print:bg-white print:border-slate-300 border border-emerald-200 dark:border-emerald-500/20 rounded-xl md:rounded-[1.5rem] p-5 md:p-6 text-emerald-900 dark:text-emerald-200 print:text-black">
                  <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                     <CheckCircle2 className="w-4 h-4 print:hidden" /> Rekomendasi Tindak Lanjut
                  </h3>
                  <div className="text-xs md:text-sm font-medium whitespace-pre-wrap leading-relaxed opacity-90">
                    {selectedRecord.rekomendasi || 'Tidak ada catatan rekomendasi untuk audit ini.'}
                  </div>
                </div>
             </div>

             {/* DOKUMENTASI VISUAL */}
             {selectedRecord.foto && selectedRecord.foto.length > 0 && (
               <div className="mb-10 page-break-inside-avoid">
                 <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-500 print:text-black mb-4 border-b border-slate-200 dark:border-white/10 print:border-slate-300 pb-2">G. Dokumentasi Audit</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {selectedRecord.foto.map((f, i) => (
                     <div key={i} onClick={() => setZoomedImage(f)} className="relative aspect-video rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-white/10 print:border-slate-300 cursor-zoom-in group">
                       <Image src={f} alt={`Dokumentasi ${i+1}`} fill sizes="25vw" className="object-cover group-hover:scale-105 transition-transform duration-500 print:transform-none" referrerPolicy="no-referrer" />
                     </div>
                   ))}
                 </div>
               </div>
             )}

             {/* TANDA TANGAN */}
             <div className="grid grid-cols-2 gap-6 md:gap-12 pt-8 mt-8 border-t border-slate-200 dark:border-white/10 print:border-slate-300 page-break-inside-avoid w-full">
                <div className="text-center flex flex-col items-center">
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 print:text-black mb-4">PJ Ruangan / Auditee</p>
                  <div className="relative w-32 md:w-40 h-20 md:h-24 mb-4 flex items-center justify-center">
                    {selectedRecord.tanda_tangan_1 ? (
                      <Image src={selectedRecord.tanda_tangan_1} alt="TTD PJ" fill sizes="200px" className="object-contain filter dark:invert print:filter-none" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full border-b border-dashed border-slate-300 dark:border-white/20 print:border-slate-300 mx-4" />
                    )}
                  </div>
                  <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white print:text-black mt-2 pt-2 border-t w-full border-transparent border-t-slate-200 print:border-t-slate-300">
                    ( .............................. )
                  </p>
                </div>
                
                <div className="text-center flex flex-col items-center">
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 print:text-black mb-4">IPCN / Auditor</p>
                  <div className="relative w-32 md:w-40 h-20 md:h-24 mb-4 flex items-center justify-center">
                    {selectedRecord.tanda_tangan_2 ? (
                      <Image src={selectedRecord.tanda_tangan_2} alt="TTD IPCN" fill sizes="200px" className="object-contain filter dark:invert print:filter-none" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full border-b border-dashed border-slate-300 dark:border-white/20 print:border-slate-300 mx-4" />
                    )}
                  </div>
                  <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white print:text-black mt-2 pt-2 border-t w-full border-transparent border-t-slate-200 print:border-t-slate-300 break-words">
                    {selectedRecord.supervisor || selectedRecord.observer || '( .............................. )'}
                  </p>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="h-full bg-slate-50 dark:bg-[#111827]/80 rounded-[2rem] border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center p-12 md:p-20 text-center text-slate-500 shadow-sm min-h-[400px]">
          <FileText className="w-16 h-16 md:w-20 md:h-20 mb-6 text-slate-300 dark:text-slate-700" />
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-2">Belum Ada Data Audit</h2>
          <p className="text-xs md:text-sm max-w-sm">Data laporan audit untuk indikator dan periode yang dipilih saat ini belum tersedia.</p>
        </div>
      )}

      {/* ZOOM IMAGE MODAL */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out print:hidden"
          >
            <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-full object-contain rounded-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:m-0, .print\\:m-0 * {
            visibility: visible;
          }
          .print\\:m-0 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

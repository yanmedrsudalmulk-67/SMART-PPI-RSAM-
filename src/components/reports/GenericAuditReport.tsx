import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import OfficialReportSheet from '@/components/reports/OfficialReportSheet';
import { 
  TrendingUp, Activity, BarChart2, TrendingDown, Target, Calendar, CheckSquare, Search, FileText
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell
} from '@/components/ChartComponents';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface GenericAuditData {
  id: string;
  tanggal_waktu?: string;
  waktu?: string;
  observer?: string;
  supervisor?: string;
  unit?: string;
  ruangan?: string;
  data_indikator?: Record<string, string | null>;
  checklist_json?: Record<string, string | null>;
  persentase: number;
  status_kepatuhan?: string;
  temuan?: string;
  rekomendasi?: string;
  foto?: string[];
  tanda_tangan_1?: string;
  tanda_tangan_2?: string;
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
  const [data, setData] = useState<GenericAuditData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

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
        tanda_tangan_1: item.ttd_pj_ruangan || item.tanda_tangan_1 || item.tanda_tangan?.[0],
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

  const { filteredRecords, summaryStats, trendData } = useMemo(() => {
    let filteredData = data;
    if (filters) {
      filteredData = data.filter(item => {
        if (filters.periode) {
           if (!item.waktu) return false;
           if (new Date(item.waktu) < new Date(filters.periode)) return false;
        }
        if (filters.unitFilter && filters.unitFilter !== 'Semua Unit') {
          if (item.unit !== filters.unitFilter && item.ruangan !== filters.unitFilter) return false;
        }
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          if (!item.observer?.toLowerCase().includes(query) && !item.unit?.toLowerCase().includes(query) && !item.ruangan?.toLowerCase().includes(query)) return false;
        }
        return true;
      });
    }

    if (filteredData.length === 0) return { filteredRecords: [], summaryStats: { avg: 0, count: 0, high: 0, low: 0 }, trendData: [] };

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
        low: Math.min(...allPerc)
      },
      trendData: trend
    };
  }, [data, filters, filters?.periode, filters?.type]);

  const selectedRecord = filteredRecords.find(r => r.id === selectedRecordId) || filteredRecords[0];

  const toSentenceCase = (str: string) => {
    if (!str) return '';
    const cleaned = str.replace(/_/g, ' ');
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 bg-white/5 backdrop-blur-md rounded-3xl animate-pulse">
      <Activity className="w-10 h-10 text-slate-400 mb-4 animate-spin" />
      <span className="text-slate-500 font-medium">Memuat Data Analisis...</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] group-hover:bg-blue-500/20 transition-all" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Audit</h4>
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{summaryStats.count}</p>
              </div>
            </div>
         </div>
         
         <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] group-hover:bg-purple-500/20 transition-all" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tertinggi</h4>
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{summaryStats.high}%</p>
              </div>
            </div>
         </div>

         <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-[40px] group-hover:bg-rose-500/20 transition-all" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Terendah</h4>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 leading-none mt-1">{summaryStats.low}%</p>
              </div>
            </div>
         </div>

         <div className="bg-gradient-to-br from-emerald-500 to-blue-600 rounded-[2rem] p-6 border border-white/20 shadow-lg relative overflow-hidden group text-white h-full flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-white/20 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Rata-rata Capaian</h4>
                <p className="text-4xl font-black leading-none mt-1">{summaryStats.avg}%</p>
              </div>
            </div>
         </div>
      </div>
      
      {/* Trend Analysis */}
      <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl pt-6 sm:pt-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm mb-6">
        <div className="flex px-6 sm:px-8 justify-between items-center mb-8">
           <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
             <BarChart2 className="w-5 h-5 text-emerald-500" /> Analitik Tren Capaian
           </h3>
           <div className="flex gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
             <button onClick={() => setChartType('line')} className={`px-4 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${chartType === 'line' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>Run Chart</button>
             <button onClick={() => setChartType('bar')} className={`px-4 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${chartType === 'bar' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>Bar Chart</button>
           </div>
        </div>
        <div className="h-[300px] w-full px-8">
          <ResponsiveContainer width="100%" height="100%">
             {chartType === 'line' ? (
                <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="val" name="Capaian (%)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
                </AreaChart>
             ) : (
                <BarChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="val" name="Capaian (%)" radius={[6, 6, 0, 0]}>
                    {(trendData || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.val >= 85 ? '#10b981' : (entry.val >= 70 ? '#f59e0b' : '#f43f5e')} />
                    ))}
                  </Bar>
                </BarChart>
             )}
          </ResponsiveContainer>
        </div>
        
        {/* Insight */}
        {trendData.length >= 1 && (
           <div className="px-8 pb-8 pt-6">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-[#1e293b]/50 border border-blue-100 dark:border-white/5">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                      <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                     <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Analisis Otomatis</h4>
                     <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {trendData.length > 1 
                          ? `Capaian terakhir berada di angka ${trendData[trendData.length-1].val}% . ${
                              trendData[trendData.length-1].val >= 85 ? 'Kinerja sangat baik dan memenuhi standar.' : 'Perlu evaluasi untuk mencapai target standar PPI.'
                            }`
                          : 'Data pembanding belum tersedia untuk analisis tren.'
                        }
                     </p>
                  </div>
              </div>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-500" /> Riwayat Audit
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5 overflow-y-auto max-h-[600px]">
            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">Belum ada data untuk periode ini</div>
            ) : (
              filteredRecords.map(record => (
                <button
                  key={record.id}
                  onClick={() => setSelectedRecordId(record.id)}
                  className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-l-4 ${
                    selectedRecordId === record.id 
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10' 
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase truncate flex-1 pr-2">
                      {record.unit || record.ruangan || 'Tanpa Unit'}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      record.persentase >= 85 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                      record.persentase >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                      'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                    }`}>
                      {record.persentase || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <span className="truncate">{record.observer}</span>
                    <span>{record.waktu ? format(parseISO(record.waktu), 'dd/MM/yy') : '-'}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedRecord ? (
            <div className="bg-white dark:bg-[#111827]/80 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm relative pt-4 px-4 pb-4 h-full">
              <OfficialReportSheet 
                  data={{
                    ...selectedRecord,
                    persentase: selectedRecord.persentase || 0,
                    foto: selectedRecord.foto,
                    ttd_pj: selectedRecord.tanda_tangan_1,
                    ttd_ipcn: selectedRecord.tanda_tangan_2
                  } as any} 
                  categories={[
                    { 
                      id: 'all', 
                      title: 'STANDAR CHECKLIST PPI', 
                      items: indicatorItems && indicatorItems.length > 0 
                        ? indicatorItems.map(i => ({ id: i.key, label: i.label }))
                        : Object.keys(selectedRecord.checklist_json || {}).map(k => ({ id: k, label: toSentenceCase(k) }))
                    }
                  ]} 
                  title={title} 
              />
            </div>
          ) : (
            <div className="h-full bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center p-12 text-center text-slate-500 min-h-[400px]">
              <FileText className="w-16 h-16 mb-4 opacity-20" />
              <p>Pilih data audit di sebelah kiri untuk melihat detail borang laporan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

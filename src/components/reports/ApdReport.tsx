import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart2, Target as TargetIcon, Activity, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown,
  Users, MapPin, Clock, Calendar as CalendarIcon, Check, X, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Cell
} from '@/components/ChartComponents';
import { format, parseISO } from 'date-fns';
import { useAppContext } from '@/components/Providers';

export default function ApdReport({ 
  filters 
}: { 
  filters: { searchQuery: string, periode: string } 
}) {
  const { hospitalLogoUrl } = useAppContext();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_apd' }, () => {
         fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!item.observer?.toLowerCase().includes(query) && !item.unit?.toLowerCase().includes(query) && !item.tindakan?.toLowerCase().includes(query)) return false;
      }
      
      if (filters.periode) {
        if (!item.tanggal_waktu) return false;
        if (new Date(item.tanggal_waktu) < new Date(filters.periode)) return false;
      }

      return true;
    });
  }, [data, filters]);

  const { summaryStats, unitStats } = useMemo(() => {
    if (filteredData.length === 0) return { 
      summaryStats: { avg: 0, count: 0, patuh: 0, dinilai: 0, tidakPatuh: 0 },
      unitStats: []
    };

    let totalPatuh = 0;
    let totalDinilai = 0;
    let tidakPatuh = 0;
    const statsByUnit: Record<string, { totalDinilai: number, totalPatuh: number }> = {};

    filteredData.forEach(item => {
      totalPatuh += (item.jumlah_patuh || 0);
      totalDinilai += (item.jumlah_dinilai || 0);
      if ((item.persentase || 0) < 85) tidakPatuh++;
      
      if (item.unit) {
        const unit = item.unit.trim();
        if (!statsByUnit[unit]) statsByUnit[unit] = { totalDinilai: 0, totalPatuh: 0 };
        statsByUnit[unit].totalDinilai += (item.jumlah_dinilai || 0);
        statsByUnit[unit].totalPatuh += (item.jumlah_patuh || 0);
      }
    });

    const unit = Object.entries(statsByUnit).map(([name, stats]) => ({
      name,
      persentase: stats.totalDinilai > 0 ? Math.round((stats.totalPatuh / stats.totalDinilai) * 100) : 0
    })).sort((a, b) => b.persentase - a.persentase);

    return {
      summaryStats: { 
        avg: totalDinilai > 0 ? Math.round((totalPatuh / totalDinilai) * 100) : 0, 
        count: filteredData.length, patuh: totalPatuh, dinilai: totalDinilai, tidakPatuh 
      },
      unitStats: unit
    };
  }, [filteredData]);

  const mapApdAction = (val: string | null) => {
    if (!val) return <span className="flex justify-center text-slate-300 dark:text-slate-700">-</span>;
    const lower = val.toLowerCase();
    if (lower === 'ya' || lower === 'sesuai') return <span className="flex justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></span>;
    if (lower === 'tidak' || lower === 'tidak sesuai') return <span className="flex justify-center"><X className="w-4 h-4 text-rose-500" /></span>;
    return <span className="flex justify-center text-slate-300 dark:text-slate-700">-</span>;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 bg-white/5 backdrop-blur-md rounded-3xl animate-pulse">
      <Activity className="w-10 h-10 text-slate-400 mb-4 animate-spin" />
      <span className="text-slate-500 font-medium">Memuat Data Analisis...</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] group-hover:bg-blue-500/20 transition-all" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Observasi</h4>
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{summaryStats.count}</p>
              </div>
            </div>
         </div>
         
         <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] group-hover:bg-emerald-500/20 transition-all" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Peluang APD (Item)</h4>
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{summaryStats.patuh} / {summaryStats.dinilai}</p>
              </div>
            </div>
         </div>

         <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-[40px] group-hover:bg-rose-500/20 transition-all" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risiko Tinggi</h4>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 leading-none mt-1">{summaryStats.tidakPatuh}</p>
              </div>
            </div>
         </div>

         <div className="bg-gradient-to-br from-emerald-500 to-blue-600 rounded-[2rem] p-6 border border-white/20 shadow-lg relative overflow-hidden group text-white h-full flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-white/20 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Rata-rata Kepatuhan</h4>
                <p className="text-4xl font-black leading-none mt-1">{summaryStats.avg}%</p>
              </div>
            </div>
         </div>
      </div>

      {/* Chart */}
      <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
          <BarChart2 className="w-5 h-5 text-blue-500" /> Kepatuhan per Unit
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={unitStats} layout="vertical" margin={{ left: 40, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#64748b" strokeOpacity={0.1} />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
              <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} cursor={{ fill: '#64748b', opacity: 0.1 }} />
              <Bar dataKey="persentase" radius={[0, 6, 6, 0]} barSize={24}>
                {unitStats.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.persentase >= 85 ? '#10b981' : entry.persentase >= 70 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
              <ReferenceLine x={85} stroke="#ef4444" strokeDasharray="3 3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl rounded-[2rem] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm transition-all -mx-4 sm:mx-0">
        <div className="p-6 border-b border-slate-100 dark:border-white/5">
           <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
             <CalendarIcon className="w-5 h-5 text-emerald-500" /> Tabel Monitoring Realtime
           </h3>
        </div>

        <div className="overflow-x-auto pb-4">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <th className="px-4 py-4 sticky left-0 z-10 bg-slate-50 dark:bg-[#111827] border-b border-slate-200 dark:border-white/5">WAKTU</th>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-white/5">OBSERVER/UNIT</th>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-white/5 text-left">TINDAKAN</th>
                <th className="px-2 py-4 border-b border-slate-200 dark:border-white/5">MASKER</th>
                <th className="px-2 py-4 border-b border-slate-200 dark:border-white/5">S.TGN</th>
                <th className="px-2 py-4 border-b border-slate-200 dark:border-white/5">HEAD</th>
                <th className="px-2 py-4 border-b border-slate-200 dark:border-white/5">APRON</th>
                <th className="px-2 py-4 border-b border-slate-200 dark:border-white/5">GOGGLE</th>
                <th className="px-2 py-4 border-b border-slate-200 dark:border-white/5">BOOTS</th>
                <th className="px-2 py-4 border-b border-slate-200 dark:border-white/5">GAUN</th>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-white/5 border-l border-slate-200 dark:border-white/5 text-emerald-600 dark:text-emerald-400">PATUH</th>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-white/5 text-rose-600 dark:text-rose-400">TIDAK PATUH</th>
                <th className="px-4 py-4 border-b border-slate-200 dark:border-white/5 text-blue-600 dark:text-blue-400">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-[10px] sm:text-xs font-bold text-slate-900 dark:text-slate-300">
              {filteredData.map((row) => {
                const tidakPatuh = (row.jumlah_dinilai || 0) - (row.jumlah_patuh || 0);

                return (
                  <tr key={row.id} className="hover:bg-blue-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-4 sticky left-0 z-10 bg-white dark:bg-[#111827] group-hover:bg-blue-50/50 dark:group-hover:bg-[#151e2e] transition-colors">
                      {row.tanggal_waktu ? format(parseISO(row.tanggal_waktu), 'dd/MM/yyyy HH:mm') : '-'}
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300 uppercase">
                      {row.observer || '-'}<br/>
                      <span className="text-[9px] text-slate-500 font-normal">{row.unit || '-'}</span>
                    </td>
                    <td className="px-4 py-4 text-left uppercase text-[9px] leading-relaxed max-w-[150px] truncate">{row.tindakan || '-'}</td>
                    <td className="px-2 py-4">{mapApdAction(row.masker)}</td>
                    <td className="px-2 py-4">{mapApdAction(row.sarung_tangan)}</td>
                    <td className="px-2 py-4">{mapApdAction(row.penutup_kepala)}</td>
                    <td className="px-2 py-4">{mapApdAction(row.apron)}</td>
                    <td className="px-2 py-4">{mapApdAction(row.goggle)}</td>
                    <td className="px-2 py-4">{mapApdAction(row.sepatu_boot)}</td>
                    <td className="px-2 py-4">{mapApdAction(row.gaun_pelindung)}</td>
                    <td className="px-4 py-4 border-l border-slate-100 dark:border-white/5 text-emerald-600 dark:text-emerald-400 text-sm font-black">{row.jumlah_patuh || 0}</td>
                    <td className="px-4 py-4 text-rose-600 dark:text-rose-400 text-sm font-black">{tidakPatuh}</td>
                    <td className="px-4 py-4 font-black text-sm">
                      <span className={`px-2 py-1 rounded-full ${
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
    </div>
  );
}

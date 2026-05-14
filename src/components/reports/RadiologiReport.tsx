import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, Activity, BarChart2, TrendingDown, Target, Building2, ClipboardCheck, AlertTriangle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from '@/components/ChartComponents';
import OfficialReportSheet from '@/components/reports/OfficialReportSheet';
import { genericAuditConfigs } from '@/lib/audit-configs';

interface RadiologiRecord {
  id: string;
  waktu: string;
  supervisor: string;
  ruangan: string;
  persentase: number;
  status: string;
  temuan: string;
  rekomendasi: string;
  checklist_json: any;
  nama_pj: string;
  dokumentasi?: string[];
  ttd_pj?: string;
  ttd_ipcn?: string;
}

export default function RadiologiReport({ filters }: { filters?: any }) {
  const [data, setData] = useState<RadiologiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: dbData } = await supabase
          .from('audit_radiologi')
          .select('*')
          .order('waktu', { ascending: false });
        
        if (dbData) {
          setData(dbData);
          if (dbData.length > 0) {
            setSelectedRecordId(dbData[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { trendData, summaryStats, subsectionCompliance, commonFindings } = useMemo(() => {
    let filteredData = data;
    if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredData = data.filter(d => 
            d.supervisor?.toLowerCase().includes(query) || 
            d.ruangan?.toLowerCase().includes(query) ||
            d.temuan?.toLowerCase().includes(query)
        );
    }

    if (filteredData.length === 0) return { trendData: [], summaryStats: { avg: 0, count: 0, high: 0, low: 0, baik: 0 }, subsectionCompliance: [], commonFindings: [] };

    const getGroupKey = (dStr: string) => {
        if(!dStr) return "Unknown";
        const date = new Date(dStr);
        return `${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"][date.getMonth()]} ${date.getFullYear()}`;
    };

    const periodMap = new Map<string, number[]>();
    const subsectionMap: Record<string, { patuh: number; total: number }> = {
      'A. KONTROL LINGKUNGAN': { patuh: 0, total: 0 },
      'B. MANAJEMEN LIMBAH': { patuh: 0, total: 0 },
      'C. PRAKTIK KONTROL INFEKSI': { patuh: 0, total: 0 }
    };
    const findingsList: string[] = [];
    let baikCount = 0;

    filteredData.forEach(row => {
      const key = getGroupKey(row.waktu);
      if(!periodMap.has(key)) periodMap.set(key, []);
      periodMap.get(key)!.push(row.persentase);

      if (row.status === 'Baik') baikCount++;
      if (row.temuan && row.temuan.trim() !== '') findingsList.push(row.temuan);

      const items = genericAuditConfigs.monitoring_radiologi.items;
      items.forEach((item: any) => {
         const val = row.checklist_json?.[item.key];
         if (val === 'ya') {
            subsectionMap[item.section].patuh++;
            subsectionMap[item.section].total++;
         } else if (val === 'tidak') {
            subsectionMap[item.section].total++;
         }
      });
    });

    const parsedKeys = Array.from(periodMap.keys()).reverse();
    const trend = parsedKeys.map(k => {
       const recs = periodMap.get(k)!;
       const avg = recs.reduce((sum, val) => sum + val, 0) / recs.length;
       return { name: k, val: Math.round(avg) };
    });

    const allPerc = filteredData.map(r => r.persentase);
    const avg = allPerc.reduce((a,b)=>a+b,0) / allPerc.length;

    const subArray = Object.keys(subsectionMap).map(k => {
       const m = subsectionMap[k];
       return {
         name: k,
         val: m.total > 0 ? Math.round((m.patuh / m.total) * 100) : 0
       }
    });

    return { 
      trendData: trend, 
      summaryStats: {
        avg: Math.round(avg),
        count: filteredData.length,
        high: Math.max(...allPerc),
        low: Math.min(...allPerc),
        baik: Math.round((baikCount / filteredData.length) * 100)
      },
      subsectionCompliance: subArray,
      commonFindings: findingsList.slice(0, 5) // top 5 recent findings
    };
  }, [data, filters]);

  const selectedRecord = data.find(r => r.id === selectedRecordId) || data[0];

  if (loading) return <div className="p-20 text-center text-slate-900 dark:text-white">Memuat Data Radiologi...</div>;
  if (data.length === 0) return <div className="p-12 text-center text-slate-500 font-bold uppercase">Belum ada data audit Radiologi.</div>;

  return (
    <div className="space-y-8">
      {/* Dashboard Top Level Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none hover:shadow-lg transition-all group">
            <Activity className="w-6 h-6 text-blue-500 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rerata Kepatuhan</p>
            <p className="text-4xl font-black text-blue-600 dark:text-blue-400 mt-1">{summaryStats.avg}%</p>
          </div>
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none hover:shadow-lg transition-all group">
            <TrendingUp className="w-6 h-6 text-emerald-500 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Kondisi Baik</p>
            <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{summaryStats.baik}%</p>
          </div>
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none hover:shadow-lg transition-all group">
            <ClipboardCheck className="w-6 h-6 text-purple-500 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Audit</p>
            <p className="text-4xl font-black text-slate-900 dark:text-white mt-1">{summaryStats.count}</p>
          </div>
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none hover:shadow-lg transition-all group">
            <Building2 className="w-6 h-6 text-rose-500 dark:text-rose-400 mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Capaian Terendah</p>
            <p className="text-4xl font-black text-rose-600 dark:text-rose-400 mt-1">{summaryStats.low}%</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trend Chart */}
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 dark:text-white uppercase text-sm tracking-widest">Trend Kepatuhan Bulanan</h3>
                <div className="flex gap-2">
                    <button onClick={() => setChartType('bar')} className={`p-1.5 rounded-lg border ${chartType === 'bar' ? 'bg-blue-500 text-white border-blue-500' : 'border-slate-200 dark:border-white/10 text-slate-400'}`}>
                        <BarChart2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setChartType('line')} className={`p-1.5 rounded-lg border ${chartType === 'line' ? 'bg-blue-500 text-white border-blue-500' : 'border-slate-200 dark:border-white/10 text-slate-400'}`}>
                        <TrendingUp className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                        <AreaChart data={trendData}>
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px' }} />
                            <Area type="monotone" dataKey="val" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={3} />
                        </AreaChart>
                    ) : (
                        <BarChart data={trendData}>
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px' }} />
                            <Bar dataKey="val" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col gap-8">
              {/* Kepatuhan per Sub Section */}
              <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none flex-1">
                  <h3 className="font-bold text-slate-800 dark:text-white uppercase text-sm tracking-widest mb-6">Kepatuhan Per Sub-Section</h3>
                  <div className="space-y-4">
                      {subsectionCompliance.map(sub => (
                          <div key={sub.name}>
                              <div className="flex justify-between items-end mb-2">
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">{sub.name}</span>
                                  <span className="text-xs font-black text-blue-500">{sub.val}%</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${sub.val}%` }}></div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Temuan Terbanyak */}
              <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none flex-1">
                  <h3 className="font-bold text-slate-800 dark:text-white uppercase text-sm tracking-widest mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Riwayat Temuan
                  </h3>
                  {commonFindings.length > 0 ? (
                      <ul className="space-y-3 max-h-40 overflow-y-auto">
                          {commonFindings.map((t, idx) => (
                              <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5 leading-relaxed">
                                  &quot;{t}&quot;
                              </li>
                          ))}
                      </ul>
                  ) : (
                      <p className="text-xs text-slate-500 italic">Tidak ada catatan temuan yang signifikan.</p>
                  )}
              </div>
          </div>
      </div>

      <div className="bg-white dark:bg-white/5 rounded-[32px] overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none mt-12 mb-8">
           <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-bold text-slate-800 dark:text-white uppercase text-sm tracking-widest">Detail Dokumen Audit</h3>
              <select 
                 className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                 value={selectedRecordId || ''}
                 onChange={(e) => setSelectedRecordId(e.target.value)}
              >
                  {data.map(d => (
                      <option key={d.id} value={d.id}>
                          {new Date(d.waktu).toLocaleDateString('id-ID')} - {d.supervisor} ({d.persentase}%)
                      </option>
                  ))}
              </select>
           </div>
           
           <div className="p-2 sm:p-6 lg:p-8">
              {selectedRecord && (
                  <OfficialReportSheet 
                      data={{
                        ...selectedRecord,
                        waktu: selectedRecord.waktu,
                        observer: selectedRecord.supervisor, 
                        foto: selectedRecord.dokumentasi,
                        ttd_pj_ruangan: selectedRecord.ttd_pj,
                        ttd_ipcn: selectedRecord.ttd_ipcn,
                        checklist_json: selectedRecord.checklist_json
                      } as any}
                      categories={[
                        {
                            id: 'a',
                            title: 'A. KONTROL LINGKUNGAN',
                            items: (genericAuditConfigs.monitoring_radiologi.items || []).filter(i => i.section === 'A. KONTROL LINGKUNGAN').map(i => ({ id: i.key, label: i.label }))
                        },
                        {
                            id: 'b',
                            title: 'B. MANAJEMEN LIMBAH',
                            items: (genericAuditConfigs.monitoring_radiologi.items || []).filter(i => i.section === 'B. MANAJEMEN LIMBAH').map(i => ({ id: i.key, label: i.label }))
                        },
                        {
                            id: 'c',
                            title: 'C. PRAKTIK KONTROL INFEKSI',
                            items: (genericAuditConfigs.monitoring_radiologi.items || []).filter(i => i.section === 'C. PRAKTIK KONTROL INFEKSI').map(i => ({ id: i.key, label: i.label }))
                        }
                      ]}
                      title="LAPORAN AUDIT RADIOLOGI"
                  />
              )}
           </div>
      </div>

    </div>
  )
}

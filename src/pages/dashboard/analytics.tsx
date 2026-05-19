import { ReactElement, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Filter,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';
import DashboardLayout from '@/components/DashboardLayout';
import { useDashboardStore } from '@/hooks/useDashboardStore';

import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ReferenceLine 
} from '@/components/ChartComponents';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function AnalyticsPage() {
  const { dashboardData, isDashboardLoaded } = useDashboardStore();

  const { unitCompliance, haisTypeData, riskTable } = useMemo(() => {
    if (!isDashboardLoaded || !dashboardData || !dashboardData.rawData) return { unitCompliance: [], haisTypeData: [], riskTable: [] };
    const { hh, apd, hais } = dashboardData.rawData;

    // Unit Compliance
    const unitStats: Record<string, { hhP: number, hhT: number, apdP: number, apdT: number }> = {};
    hh.forEach((d: any) => {
      const u = d.unit || d.ruangan;
      if (!u) return;
      if (!unitStats[u]) unitStats[u] = { hhP: 0, hhT: 0, apdP: 0, apdT: 0 };
      
      let dPatuh = 0;
      let dPel = 0;
      const moments = ['m1', 'm2', 'm3', 'm4', 'm5'];
      moments.forEach(m => {
         if (d[m] === 'hr' || d[m] === 'hw') { dPatuh++; dPel++; }
         else if (d[m] === 'miss') { dPel++; }
      });
      
      unitStats[u].hhP += dPatuh;
      unitStats[u].hhT += dPel;
    });
    apd.forEach((d: any) => {
      const u = d.unit || d.ruangan;
      if (!u) return;
      if (!unitStats[u]) unitStats[u] = { hhP: 0, hhT: 0, apdP: 0, apdT: 0 };
      unitStats[u].apdP += d.jumlah_patuh || 0;
      unitStats[u].apdT += d.jumlah_dinilai || 0;
    });

    const cmp = Object.keys(unitStats).map(u => ({
       name: u.toUpperCase(),
       hh: unitStats[u].hhT > 0 ? Math.round((unitStats[u].hhP / unitStats[u].hhT) * 100) : 0,
       apd: unitStats[u].apdT > 0 ? Math.round((unitStats[u].apdP / unitStats[u].apdT) * 100) : 0
    }));

    // HAIs
    const haisStats: Record<string, number> = { IADP: 0, ISK: 0, VAP: 0, IDO: 0 };
    hais.forEach((d: any) => {
      const t = String(d.jenis).toUpperCase();
      const r = parseFloat(d.rate) || 0;
      if(t.includes('IADP') || t.includes('PHLE')) haisStats['IADP'] += r;
      else if(t.includes('ISK')) haisStats['ISK'] += r;
      else if(t.includes('VAP')) haisStats['VAP'] += r;
      else if(t.includes('IDO')) haisStats['IDO'] += r;
    });
    const htd = Object.keys(haisStats).map(k => ({ name: k, value: haisStats[k] })).filter(h => h.value > 0);

    // Risk Table
    const rt = cmp.map(c => {
       let score = 0;
       if (c.hh < 85) score += 3;
       if (c.apd < 100) score += 2;
       
       const rHais = hais.filter((x: any) => (x.unit || x.ruangan)?.toUpperCase() === c.name).reduce((sum: number, x: any) => sum + (parseFloat(x.rate) || 0), 0);
       score += (rHais * 2);

       let status = 'Aman', statusClass = 'bg-emerald-500/10 text-emerald-600', riskLabel = 'Low', riskClass = 'text-blue-600';
       if (score > 8) { status = 'Perlu Supervisi'; statusClass = 'bg-red-500/10 text-red-600'; riskLabel = 'High'; riskClass = 'text-red-600'; }
       else if (score > 3) { status = 'Monitoring'; statusClass = 'bg-amber-500/10 text-amber-600'; riskLabel = 'Medium'; riskClass = 'text-amber-600'; }

       return {
         unit: c.name,
         riskScore: Number(score.toFixed(1)),
         hh: c.hh,
         apd: c.apd,
         hais: Number(rHais.toFixed(2)),
         status, statusClass, riskLabel, riskClass
       };
    }).sort((a, b) => b.riskScore - a.riskScore);

    return { unitCompliance: cmp, haisTypeData: htd.length ? htd : [{ name: 'Belum Ada Data', value: 1 }], riskTable: rt };
  }, [dashboardData, isDashboardLoaded]);

  if (!isDashboardLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Memuat analitik data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 py-4 border-b border-slate-200 dark:border-white/5">
        <div className="text-center lg:text-left w-full lg:w-auto">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient uppercase">Analitik Mutu</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Analisa mendalam data PPI Rumah Sakit</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-all shadow-md">
            <Download className="w-4 h-4" /> Export Data
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Kepatuhan per Unit</h3>
            <BarChart3 className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitCompliance} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/5" />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={60} />
                <Tooltip 
                  cursor={{ fill: 'rgba(59,130,246,0.05)' }}
                  contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '10px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <ReferenceLine x={85} stroke="#3b82f6" strokeDasharray="3 3" label={{ position: 'top', value: 'Standar HH', fill: '#3b82f6', fontSize: 8 }} />
                <Bar dataKey="hh" name="Kebersihan Tangan (%)" radius={[0, 4, 4, 0]} barSize={8}>
                  {unitCompliance.map((entry, index) => (
                    <Cell key={`cell-hh-${index}`} fill={entry.hh >= 85 ? '#22c55e' : (entry.hh >= 75 ? '#f59e0b' : '#ef4444')} />
                  ))}
                </Bar>
                <Bar dataKey="apd" name="APD (%)" radius={[0, 4, 4, 0]} barSize={8}>
                  {unitCompliance.map((entry, index) => (
                    <Cell key={`cell-apd-${index}`} fill={entry.apd >= 100 ? '#22c55e' : (entry.apd >= 90 ? '#f59e0b' : '#ef4444')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Proporsi Jenis HAIs</h3>
            <PieChartIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={haisTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {haisTypeData.map((entry, index) => (
                    <Cell key={`cell-hais-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--tw-backdrop-bg, white)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                />
                <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Heatmap Risiko Unit</h3>
            <TrendingUp className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-white/5">Unit</th>
                  <th className="py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-white/5">Risk Score</th>
                  <th className="py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-white/5">Kepatuhan HH</th>
                  <th className="py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-white/5">Kepatuhan Penggunaan APD</th>
                  <th className="py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-white/5">HAIs Rate</th>
                  <th className="py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-white/5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {riskTable.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                    <td className="py-4 font-medium text-slate-800 dark:text-white">{r.unit}</td>
                    <td className="py-4"><span className={`${r.riskClass} font-bold`}>{r.riskLabel} ({r.riskScore})</span></td>
                    <td className="py-4 text-blue-600 dark:text-blue-400 font-bold">{r.hh}%</td>
                    <td className="py-4 text-purple-600 dark:text-purple-400 font-bold">{r.apd}%</td>
                    <td className="py-4 text-red-600 dark:text-red-400 font-bold">{r.hais}‰</td>
                    <td className="py-4"><span className={`px-2 py-1 ${r.statusClass} rounded text-[10px] font-bold uppercase`}>{r.status}</span></td>
                  </tr>
                ))}
                {riskTable.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">Belum ada data tersedia.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

AnalyticsPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

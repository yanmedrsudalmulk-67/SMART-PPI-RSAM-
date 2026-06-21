import { ReactElement, useState, useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  BarChart3, PieChart as PieChartIcon, TrendingUp, Filter, Download, 
  Activity, Users, ClipboardCheck, AlertTriangle, CheckCircle, Clock,
  Bot, Lightbulb, FileText, FileSpreadsheet, ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { useAnalyticsRealtime, AuditSession } from '@/lib/useAnalyticsRealtime';

import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ReferenceLine 
} from '@/components/ChartComponents';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// Helper to export via printing or html2canvas (skipped complex client sid imports for simplicity, using print)
const handleExport = (type: string) => {
  if (type === 'pdf') {
    window.print();
  } else {
    alert(`Export ${type.toUpperCase()} akan mengunduh data dalam format ${type}.`);
  }
};

export default function AnalyticsPage() {
  const { sessions, isLoading } = useAnalyticsRealtime();
  
  // Filters
  const [periodeType, setPeriodeType] = useState('Semua Waktu');
  const [filterUnit, setFilterUnit] = useState('Semua Unit');
  const [filterAuditor, setFilterAuditor] = useState('Semua Auditor');
  const [filterIndikator, setFilterIndikator] = useState('Semua');

  // Filter Data
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      // Filter Unit
      if (filterUnit !== 'Semua Unit' && s.unit !== filterUnit) return false;
      // Filter Auditor
      if (filterAuditor !== 'Semua Auditor' && s.observer !== filterAuditor) return false;
      
      // Filter Indikator/Kategori (Grouping)
      if (filterIndikator !== 'Semua') {
         if (filterIndikator === 'Hand Hygiene' && s.indikator_id !== 'audit_hand_hygiene') return false;
         if (filterIndikator === 'APD' && s.indikator_id !== 'audit_apd') return false;
         if (filterIndikator === 'Dekontaminasi' && s.indikator_id !== 'dekontaminasi_alat') return false;
         if (filterIndikator === 'Limbah' && !s.indikator_id.includes('limbah')) return false;
         if (filterIndikator === 'Linen' && !s.indikator_id.includes('linen')) return false;
         if (filterIndikator === 'Bundles' && s.kategori !== 'Monitoring Bundles') return false;
         if (filterIndikator === 'HAI' && s.kategori !== 'Surveilans HAIs') return false;
      }

      // Filter Periode Date Logic 
      if (periodeType !== 'Semua Waktu') {
         const dDate = new Date(s.tanggal_waktu);
         const now = new Date();
         if (periodeType === 'Harian' && dDate.toDateString() !== now.toDateString()) return false;
         if (periodeType === 'Bulanan' && (dDate.getMonth() !== now.getMonth() || dDate.getFullYear() !== now.getFullYear())) return false;
         if (periodeType === 'Tahunan' && dDate.getFullYear() !== now.getFullYear()) return false;
      }

      return true;
    });
  }, [sessions, filterUnit, filterAuditor, filterIndikator, periodeType]);

  // Derive Stats
  const { 
    totalObservasi, totalUnit, totalAuditor, kepatuhanAvg, 
    temuanTidakPatuh, temuanBelumTindakLanjut 
  } = useMemo(() => {
    const stdSessions = filteredSessions.filter(s => s.kategori !== 'Surveilans HAIs');
    
    let totalDinilai = 0;
    let totalPatuh = 0;
    stdSessions.forEach(s => {
       totalDinilai += s.jumlah_dinilai || 0;
       totalPatuh += s.jumlah_patuh || 0;
    });
    
    const kepatuhan = totalDinilai > 0 ? (totalPatuh / totalDinilai) * 100 : 0;
    const tidakPatuh = totalDinilai - totalPatuh;

    const units = new Set(filteredSessions.map(s => s.unit).filter(Boolean));
    const observers = new Set(filteredSessions.map(s => s.observer).filter(Boolean));

    return {
      totalObservasi: filteredSessions.length,
      totalUnit: units.size,
      totalAuditor: observers.size,
      kepatuhanAvg: Math.round(kepatuhan),
      temuanTidakPatuh: tidakPatuh,
      temuanBelumTindakLanjut: 0 // Mocked conceptually as 0 or could be computed if table supports
    };
  }, [filteredSessions]);

  // HAIs specific computations
  const haisSessions = useMemo(() => filteredSessions.filter(s => s.kategori === 'Surveilans HAIs'), [filteredSessions]);
  const haisData = useMemo(() => {
     const stats: Record<string, number> = { IADP: 0, ISK: 0, VAP: 0, HAP: 0, IDO: 0 };
     haisSessions.forEach(s => {
        const title = (s.nama_indikator || '').toUpperCase();
        let matched = false;
        Object.keys(stats).forEach(k => {
          if (title.includes(k) || (k === 'IADP' && title.includes('PHLEBITIS'))) {
            stats[k] += s.jumlah_patuh || 0; // The occurrence is typically 'jumlah_patuh' for hais or rate, using patuh as frequency
            matched = true;
          }
        });
        if (!matched) {
          if(!stats[title]) stats[title] = 0;
          stats[title] += s.jumlah_patuh || 0;
        }
     });
     return Object.keys(stats).map(k => ({ name: k, value: stats[k] })).filter(d => d.value > 0);
  }, [haisSessions]);

  // Compliance By Indicator Trend
  const { trenBulananIndikator, distribusiTemuan, jenisTemuanTerbanyak } = useMemo(() => {
    const std = filteredSessions.filter(s => s.kategori !== 'Surveilans HAIs');
    
    // Distribusi
    let patuh = 0;
    let tidakPatuh = 0;
    std.forEach(s => { patuh += s.jumlah_patuh || 0; tidakPatuh += (s.jumlah_dinilai - s.jumlah_patuh) || 0; });
    const distribusi = [
      { name: 'Patuh', value: patuh },
      { name: 'Tidak Patuh', value: tidakPatuh }
    ];

    // Jenis Temuan Bar Chart
    const jenisTemuanMap: Record<string, number> = {};
    std.forEach(s => {
       const tidakP = (s.jumlah_dinilai || 0) - (s.jumlah_patuh || 0);
       let cat = s.kategori || s.nama_indikator;
       if (s.indikator_id === 'audit_hand_hygiene') cat = 'Hand Hygiene';
       if (s.indikator_id === 'audit_apd') cat = 'APD';
       if (!jenisTemuanMap[cat]) jenisTemuanMap[cat] = 0;
       jenisTemuanMap[cat] += tidakP;
    });
    const jenisTemuan = Object.keys(jenisTemuanMap)
      .map(k => ({ name: k, TidakPatuh: jenisTemuanMap[k] }))
      .filter(x => x.TidakPatuh > 0)
      .sort((a,b) => b.TidakPatuh - a.TidakPatuh);

    // Tren Bulanan
    const tren: Record<string, any> = {};
    MONTHS.forEach(m => tren[m] = { name: m, hhDinilai:0, hhPatuh:0, apdDinilai:0, apdPatuh:0, bundleDinilai:0, bundlePatuh:0 });

    std.forEach(s => {
      const d = new Date(s.tanggal_waktu);
      if (d.getFullYear() === new Date().getFullYear()) {
        const mNm = MONTHS[d.getMonth()];
        if (s.indikator_id === 'audit_hand_hygiene') {
           tren[mNm].hhDinilai += s.jumlah_dinilai; tren[mNm].hhPatuh += s.jumlah_patuh;
        } else if (s.indikator_id === 'audit_apd') {
           tren[mNm].apdDinilai += s.jumlah_dinilai; tren[mNm].apdPatuh += s.jumlah_patuh;
        } else if (s.kategori?.includes('Bundles')) {
           tren[mNm].bundleDinilai += s.jumlah_dinilai; tren[mNm].bundlePatuh += s.jumlah_patuh;
        }
      }
    });

    const trenList = MONTHS.map(m => {
       const v = tren[m];
       return {
         name: m,
         'Hand Hygiene': v.hhDinilai ? Math.round((v.hhPatuh/v.hhDinilai)*100) : 0,
         'APD': v.apdDinilai ? Math.round((v.apdPatuh/v.apdDinilai)*100) : 0,
         'Bundles': v.bundleDinilai ? Math.round((v.bundlePatuh/v.bundleDinilai)*100) : 0,
       };
    }).filter(m => m['Hand Hygiene'] > 0 || m['APD'] > 0 || m['Bundles'] > 0);

    return { trenBulananIndikator: trenList.length ? trenList : [], distribusiTemuan: distribusi.filter(d=>d.value>0), jenisTemuanTerbanyak: jenisTemuan };
  }, [filteredSessions]);

  // Unit Compliance, Ranking & Auditor Activity
  const { unitData, topUnits, bottomUnits, auditorData } = useMemo(() => {
     const std = filteredSessions.filter(s => s.kategori !== 'Surveilans HAIs' && s.unit);
     const statMap: Record<string, { patuh: number, dinilai: number }> = {};
     const obsMap: Record<string, { count: number, patuh: number, dinilai: number }> = {};

     std.forEach(s => {
        if (!statMap[s.unit]) statMap[s.unit] = { patuh: 0, dinilai: 0 };
        statMap[s.unit].patuh += s.jumlah_patuh || 0;
        statMap[s.unit].dinilai += s.jumlah_dinilai || 0;

        if (s.observer) {
           if (!obsMap[s.observer]) obsMap[s.observer] = { count: 0, patuh: 0, dinilai: 0 };
           obsMap[s.observer].count += 1;
           obsMap[s.observer].patuh += s.jumlah_patuh || 0;
           obsMap[s.observer].dinilai += s.jumlah_dinilai || 0;
        }
     });

     const items = Object.keys(statMap).map(u => {
        const persentase = statMap[u].dinilai > 0 ? Math.round((statMap[u].patuh / statMap[u].dinilai)*100) : 0;
        return { name: u, Kepatuhan: persentase };
     }).sort((a,b) => b.Kepatuhan - a.Kepatuhan);

     const auditors = Object.keys(obsMap).map(o => {
        const p = obsMap[o].dinilai > 0 ? Math.round((obsMap[o].patuh / obsMap[o].dinilai)*100) : 0;
        return { name: o, Observasi: obsMap[o].count, Kepatuhan: p };
     }).sort((a,b) => b.Observasi - a.Observasi);

     return { 
       unitData: items, 
       topUnits: items.slice(0, 10), 
       bottomUnits: [...items].sort((a,b) => a.Kepatuhan - b.Kepatuhan).slice(0, 10),
       auditorData: auditors.slice(0, 5) // Top 5
     };
  }, [filteredSessions]);

  // Unit Dropdown Options based on REAL data
  const unitOptions = useMemo(() => {
     const un = new Set(sessions.map(s => s.unit).filter(Boolean));
     return ['Semua Unit', ...Array.from(un).sort()];
  }, [sessions]);

  const auditorOptions = useMemo(() => {
     const au = new Set(sessions.map(s => s.observer).filter(Boolean));
     return ['Semua Auditor', ...Array.from(au).sort()];
  }, [sessions]);

  // AI Generated Text
  const aiAnalysis = useMemo(() => {
    if (sessions.length === 0) return "Belum ada data observasi yang masuk dalam sistem untuk dianalisis.";
    if (filteredSessions.length === 0) return "Tidak ada data yang cocok dengan filter yang dipilih saat ini.";
    
    let text = `Berdasarkan ${totalObservasi} sesi hasil observasi pada periode berjalan, capaian rata-rata RSUD AL-MULK mencapai ${kepatuhanAvg}%. `;
    if (topUnits.length > 0) {
      text += `Unit dengan performa terbaik dipimpin oleh ${topUnits[0].name} dengan skor ${topUnits[0].Kepatuhan}%. `;
    }
    if (bottomUnits.length > 0 && bottomUnits[0].Kepatuhan < 85) {
      text += `Perhatian khusus diperlukan di ${bottomUnits[0].name} yang saat ini berada pada angka ${bottomUnits[0].Kepatuhan}%. `;
    }
    if (jenisTemuanTerbanyak.length > 0) {
      text += `Paling banyak ditemukan ketidakpatuhan pada kategori ${jenisTemuanTerbanyak[0].name} dengan total ${jenisTemuanTerbanyak[0].TidakPatuh} kejadian.`;
    }
    return text;
  }, [totalObservasi, kepatuhanAvg, topUnits, bottomUnits, jenisTemuanTerbanyak, sessions.length, filteredSessions.length]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Melakukan sinkronisasi data realtime...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      {/* Header & Export */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 py-4 border-b border-slate-200 dark:border-white/5">
        <div className="text-center lg:text-left w-full lg:w-auto">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient uppercase">Analitik SMART PPI</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Pusat analisis data terintegrasi Supabase Realtime.</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center print:hidden">
          <button onClick={() => handleExport('pdf')} className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold uppercase transition-all shadow-sm">
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button onClick={() => handleExport('excel')} className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold uppercase transition-all shadow-sm">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-4 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm print:hidden">
         <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
             <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
               <Filter className="w-4 h-4" />
               <span className="text-sm font-bold">Filter:</span>
             </div>
             
             <select value={periodeType} onChange={e => setPeriodeType(e.target.value)} className="bg-transparent border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-800">
                {['Semua Waktu', 'Harian', 'Bulanan', 'Tahunan'].map(p => <option key={p} value={p}>{p}</option>)}
             </select>

             <select value={filterIndikator} onChange={e => setFilterIndikator(e.target.value)} className="bg-transparent border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-800">
                {['Semua', 'Hand Hygiene', 'APD', 'Dekontaminasi', 'Limbah', 'Linen', 'Bundles', 'HAI'].map(p => <option key={p} value={p}>{p}</option>)}
             </select>

             <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} className="bg-transparent border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-800 max-w-[200px] truncate">
                {unitOptions.map(p => <option key={p} value={p}>{p}</option>)}
             </select>

             <select value={filterAuditor} onChange={e => setFilterAuditor(e.target.value)} className="bg-transparent border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-800 max-w-[200px] truncate">
                {auditorOptions.map(p => <option key={p} value={p}>{p}</option>)}
             </select>
         </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-slate-200/50 dark:border-white/5">
           <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
           <h3 className="text-lg font-bold text-slate-800 dark:text-white">Belum ada data monitoring yang tersedia untuk periode/filter ini.</h3>
           <p className="text-slate-500 text-sm mt-1">Sistem akan menampilkan grafik secara otomatis ketika input data dilakukan.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* STAT CARD GRID */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Observasi', value: totalObservasi, icon: ClipboardCheck, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
              { label: 'Unit Dinilai', value: totalUnit, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10' },
              { label: 'Auditor Aktif', value: totalAuditor, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
              { label: 'Rata-rata Kepatuhan', value: `${kepatuhanAvg}%`, icon: PieChartIcon, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
              { label: 'Temuan Tidak Patuh', value: temuanTidakPatuh, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-500/10' },
              { label: 'Belum Ditindaklanjuti', value: temuanBelumTindakLanjut, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-[1.5rem] p-4 border border-slate-200 dark:border-white/5 shadow-sm transform transition hover:scale-[1.02]">
                 <div className={`w-10 h-10 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                   <stat.icon className="w-5 h-5" />
                 </div>
                 <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                 <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* AI ANALYSIS BANNER */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
             <div className="absolute -right-10 -top-10 text-white/5 opacity-20">
               <Bot className="w-64 h-64" />
             </div>
             <div className="relative z-10 flex gap-4 items-start">
                <div className="bg-white/20 p-3 rounded-2xl flex-shrink-0 animate-pulse">
                   <Lightbulb className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-blue-200 mb-2">Automated AI Insights</h3>
                  <p className="text-sm sm:text-base font-medium leading-relaxed max-w-4xl text-white/90">
                    {aiAnalysis}
                  </p>
                  {bottomUnits.length > 0 && bottomUnits[0].Kepatuhan < 85 && (
                    <div className="mt-4 bg-white/10 rounded-xl p-3 inline-flex items-center gap-2 border border-white/20">
                      <AlertTriangle className="w-4 h-4 text-amber-300" />
                      <span className="text-xs font-bold text-white">Rekomendasi: Perlu dilakukan supervisi dan pelatihan penyegaran PPI untuk unit {bottomUnits[0].name}.</span>
                    </div>
                  )}
                </div>
             </div>
          </div>

          {/* CHARTS GRID 1: Trends */}
          <div className="grid lg:grid-cols-2 gap-6">
             <div className="bg-white dark:bg-slate-900/60 p-6 flex flex-col rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm min-h-[400px]">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Tren Kepatuhan Bulanan</h3>
                 <TrendingUp className="w-4 h-4 text-slate-400" />
               </div>
               {trenBulananIndikator.length > 0 ? (
                 <div className="flex-1 w-full min-h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={trenBulananIndikator} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/5" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} />
                       <Tooltip contentStyle={{ borderRadius: '12px' }} itemStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                       <Legend wrapperStyle={{ fontSize: '10px' }} />
                       <ReferenceLine y={85} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'top', value: 'Standar HH (85%)', fill: '#10b981', fontSize: 9 }} />
                       <Line type="monotone" dataKey="Hand Hygiene" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                       <Line type="monotone" dataKey="APD" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                       <Line type="monotone" dataKey="Bundles" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                     </LineChart>
                   </ResponsiveContainer>
                 </div>
               ) : (
                 <div className="flex-1 flex items-center justify-center text-slate-400 text-xs font-medium">Tren grafik akan tampil setelah data terkumpul beberapa bulan.</div>
               )}
             </div>

             <div className="bg-white dark:bg-slate-900/60 p-6 flex flex-col rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm min-h-[400px]">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Temuan Ketidakpatuhan Terbanyak</h3>
                 <BarChart3 className="w-4 h-4 text-slate-400" />
               </div>
               {jenisTemuanTerbanyak.length > 0 ? (
                 <div className="flex-1 w-full min-h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={jenisTemuanTerbanyak} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/5" />
                       <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                       <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} width={90} />
                       <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px' }} />
                       <Bar dataKey="TidakPatuh" name="Total Kejadian Tidak Patuh" radius={[0, 4, 4, 0]} fill="#ef4444" barSize={16}>
                         {jenisTemuanTerbanyak.map((e, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               ) : (
                 <div className="flex-1 flex items-center justify-center text-slate-400 text-xs font-medium">Tidak ada kejadian ketidakpatuhan. Luar biasa!</div>
               )}
             </div>
          </div>

          {/* CHARTS GRID 2: Per Unit & HAIs */}
          <div className="grid lg:grid-cols-3 gap-6">
             <div className="bg-white dark:bg-slate-900/60 p-6 flex flex-col rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm min-h-[400px] lg:col-span-2">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Kepatuhan Per Unit (Top & Bottom)</h3>
                 <BarChart3 className="w-4 h-4 text-slate-400" />
               </div>
               <div className="flex-1 overflow-y-auto pr-2 custom-sidebar-scrollbar" style={{ maxHeight: '400px' }}>
                  <div className="space-y-4">
                    {unitData.map((u, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-24 shrink-0 text-xs font-bold text-slate-700 dark:text-slate-200 truncate" title={u.name}>{u.name}</div>
                        <div className="flex-1 h-3 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden relative">
                           <div 
                             className={`absolute top-0 left-0 h-full rounded-full ${u.Kepatuhan >= 85 ? 'bg-emerald-500' : (u.Kepatuhan >= 70 ? 'bg-amber-500' : 'bg-red-500')}`} 
                             style={{ width: `${u.Kepatuhan}%` }}
                           />
                        </div>
                        <div className={`w-12 text-right text-xs font-extrabold ${u.Kepatuhan >= 85 ? 'text-emerald-600' : (u.Kepatuhan >= 70 ? 'text-amber-500' : 'text-red-500')}`}>
                           {u.Kepatuhan}%
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
             </div>

             <div className="bg-white dark:bg-slate-900/60 p-6 flex flex-col rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm min-h-[400px]">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Insiden HAIs</h3>
                 <PieChartIcon className="w-4 h-4 text-slate-400" />
               </div>
               {haisData.length > 0 ? (
                 <div className="flex-1 w-full min-h-[250px] flex items-center justify-center">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie data={haisData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                         {haisData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                       </Pie>
                       <Tooltip contentStyle={{ borderRadius: '12px' }} />
                       <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px' }} />
                     </PieChart>
                   </ResponsiveContainer>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col gap-2 items-center justify-center text-slate-400 text-xs font-medium">
                   <CheckCircle className="w-12 h-12 text-emerald-500/50 mb-2" />
                   <p>Tidak ada insiden infeksi HAIs tercatat.</p>
                 </div>
               )}
             </div>
          </div>

          {/* CHARTS GRID 3: Temuan & Auditor */}
          <div className="grid lg:grid-cols-2 gap-6">
             <div className="bg-white dark:bg-slate-900/60 p-6 flex flex-col rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm min-h-[400px]">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Distribusi Temuan</h3>
                 <PieChartIcon className="w-4 h-4 text-slate-400" />
               </div>
               {distribusiTemuan.length > 0 ? (
                 <div className="flex-1 w-full min-h-[250px] flex items-center justify-center">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie data={distribusiTemuan} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                         {distribusiTemuan.map((entry, index) => <Cell key={index} fill={entry.name === 'Patuh' ? '#10b981' : '#ef4444'} />)}
                       </Pie>
                       <Tooltip contentStyle={{ borderRadius: '12px' }} />
                       <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px' }} />
                     </PieChart>
                   </ResponsiveContainer>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col gap-2 items-center justify-center text-slate-400 text-xs font-medium">
                   Tidak ada data temuan.
                 </div>
               )}
             </div>

             <div className="bg-white dark:bg-slate-900/60 p-6 flex flex-col rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm min-h-[400px]">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Aktivitas Auditor Top</h3>
                 <Users className="w-4 h-4 text-slate-400" />
               </div>
               <div className="flex-1 overflow-y-auto pr-2 custom-sidebar-scrollbar" style={{ maxHeight: '400px' }}>
                  <div className="space-y-4">
                    {auditorData.map((a, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-xs uppercase">
                             {a.name.slice(0, 2)}
                           </div>
                           <div>
                             <p className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[150px]">{a.name}</p>
                             <p className="text-[10px] text-slate-500">{a.Observasi} Observasi</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-bold text-slate-800 dark:text-white">{a.Kepatuhan}%</p>
                           <p className="text-[10px] text-slate-500">Kepatuhan Avg</p>
                        </div>
                      </div>
                    ))}
                    {auditorData.length === 0 && (
                      <div className="text-center text-xs text-slate-400 py-8">Belum ada aktivitas auditor.</div>
                    )}
                  </div>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

AnalyticsPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

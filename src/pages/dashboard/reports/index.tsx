import { useState, useMemo, useEffect, ReactElement } from 'react';
import { 
  FileText, Download, Calendar, Filter, FileSpreadsheet, Search, ArrowLeft, 
  Activity, ShieldCheck, ClipboardCheck, GraduationCap, Building2, User, AlertTriangle, Truck, Users, Wind, ShieldAlert,
  ChevronDown, CheckCircle2, ChevronRight, Edit, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/components/Providers';
import DashboardLayout from '@/components/DashboardLayout';
import { genericAuditConfigs } from '@/lib/audit-configs';

import dynamic from 'next/dynamic';
import { ReportSkeleton } from '@/components/SkeletonLoading';

const GenericAuditReport = dynamic(() => import('@/components/reports/GenericAuditReport'), { ssr: false, loading: () => <ReportSkeleton /> });
const HandHygieneReport = dynamic(() => import('@/components/reports/HandHygieneReport'), { ssr: false, loading: () => <ReportSkeleton /> });
const ApdReport = dynamic(() => import('@/components/reports/ApdReport'), { ssr: false, loading: () => <ReportSkeleton /> });
const SurveilansHaisReport = dynamic(() => import('@/components/reports/SurveilansHaisReport'), { ssr: false, loading: () => <ReportSkeleton /> });
const UnifiedSurveilansHaisReport = dynamic(() => import('@/components/reports/UnifiedSurveilansHaisReport'), { ssr: false, loading: () => <ReportSkeleton /> });

const INDICATORS_MAP: Record<string, { cat: string, subcat?: string, title: string, id: string, icon: any }> = {
  // Kewaspadaan Isolasi - Standar
  'audit_hand_hygiene': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Kepatuhan Kebersihan Tangan', id: 'audit_hand_hygiene', icon: Activity },
  'audit_apd': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Kepatuhan Penggunaan APD', id: 'audit_apd', icon: ShieldCheck },
  'dekontaminasi_alat': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Dekontaminasi Alat', id: 'dekontaminasi_alat', icon: ClipboardCheck },
  'pengendalian_lingkungan': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Pengendalian Lingkungan', id: 'pengendalian_lingkungan', icon: Wind },
  'pengelolaan_limbah_medis': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Pengelolaan Limbah Medis', id: 'pengelolaan_limbah_medis', icon: AlertTriangle },
  'pengelolaan_limbah_tajam': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Pengelolaan Limbah Tajam', id: 'pengelolaan_limbah_tajam', icon: AlertTriangle },
  'penatalaksanaan_linen': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Penatalaksanaan Linen', id: 'penatalaksanaan_linen', icon: ClipboardCheck },
  'perlindungan_petugas': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Perlindungan Petugas', id: 'perlindungan_petugas', icon: ShieldCheck },
  'penempatan_pasien': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Penempatan Pasien', id: 'penempatan_pasien', icon: Users },
  'etika_batuk': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Etika Batuk', id: 'etika_batuk', icon: Wind },
  'penyuntikan_aman': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Penyuntikan Aman', id: 'penyuntikan_aman', icon: ShieldAlert },

  // Kewaspadaan Isolasi - Transmisi
  'monitoring_airborne': { cat: 'Kewaspadaan Isolasi', subcat: 'Transmisi', title: 'Transmisi Airborne', id: 'monitoring_airborne', icon: Wind },

  // Kewaspadaan Isolasi - Monitoring
  'monitoring_fasilitas_hand_hygiene': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Fasilitas Hand Hygiene', id: 'monitoring_fasilitas_hand_hygiene', icon: Activity },
  'monitoring_fasilitas_apd': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Fasilitas APD', id: 'monitoring_fasilitas_apd', icon: ShieldCheck },
  'monitoring_ibs': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Ruangan IBS', id: 'monitoring_ibs', icon: Building2 },
  'monitoring_cssd': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'CSSD', id: 'monitoring_cssd', icon: Building2 },
  'monitoring_laboratorium': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Laboratorium', id: 'monitoring_laboratorium', icon: Activity },
  'monitoring_radiologi': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Radiologi', id: 'monitoring_radiologi', icon: Activity },
  'monitoring_farmasi': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Farmasi', id: 'monitoring_farmasi', icon: Building2 },
  'monitoring_gizi': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Gizi', id: 'monitoring_gizi', icon: Building2 },
  'monitoring_jenazah': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Kamar Jenazah', id: 'monitoring_jenazah', icon: Building2 },
  'monitoring_ambulance': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Ambulance', id: 'monitoring_ambulance', icon: Truck },
  'monitoring_tps': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'TPS Limbah', id: 'monitoring_tps', icon: AlertTriangle },
  'monitoring_tunggu': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Ruang Tunggu', id: 'monitoring_tunggu', icon: Users },
  'monitoring_ppi_ruang_isolasi': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Ruang Isolasi', id: 'monitoring_ppi_ruang_isolasi', icon: Users },
  'monitoring_immuno': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Immunocompromised', id: 'monitoring_immuno', icon: ShieldAlert },
  
  // Surveilans HAIs
  'isk': { cat: 'Surveilans HAIs', title: 'Infeksi Saluran Kemih (ISK)', id: 'isk', icon: Activity },
  'phlebitis': { cat: 'Surveilans HAIs', title: 'Phlebitis', id: 'phlebitis', icon: Activity },
  'vap': { cat: 'Surveilans HAIs', title: 'Ventilator Associated Pneumonia (VAP)', id: 'vap', icon: Activity },
  'ido': { cat: 'Surveilans HAIs', title: 'Infeksi Daerah Operasi (IDO)', id: 'ido', icon: Activity },
};

const CATEGORIES = [
  'Kewaspadaan Isolasi',
  'Surveilans HAIs',
  'Monitoring Bundles',
  'Pendidikan dan Pelatihan'
];

const SUB_CATEGORIES = {
  'Kewaspadaan Isolasi': ['Standar', 'Transmisi', 'Monitoring']
};

const SummaryCard = ({ indicator, stats, onClick }: any) => {
  const avgPercent = stats ? stats.avgPercent : 0;
  const count = stats ? stats.count : 0;
  
  let colorClass = 'text-slate-400';
  let bgClass = 'bg-slate-500/10';
  let borderClass = 'border-slate-500/20';
  let targetStatus = 'Belum ada data';
  
  if (count > 0) {
    if (avgPercent < 75) {
      colorClass = 'text-red-500'; bgClass = 'bg-red-500/10'; borderClass = 'border-red-500/30';
      targetStatus = 'Di bawah target';
    }
    else if (avgPercent < 85) {
      colorClass = 'text-yellow-500'; bgClass = 'bg-yellow-500/10'; borderClass = 'border-yellow-500/30';
      targetStatus = 'Mendekati target';
    }
    else {
      colorClass = 'text-emerald-500'; bgClass = 'bg-emerald-500/10'; borderClass = 'border-emerald-500/30';
      targetStatus = 'Target tercapai';
    }
  }

  const Icon = indicator.icon;

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }} 
      onClick={onClick}
      className={`bg-white dark:bg-[#111827]/80 backdrop-blur-sm p-5 sm:p-6 rounded-3xl border ${borderClass} cursor-pointer group relative overflow-hidden transition-all shadow-sm hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col justify-between min-h-[220px]`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -z-10 opacity-20 transition-all duration-500 group-hover:opacity-40 group-hover:scale-150 ${bgClass.replace('/10', '')}`} />
      
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3.5 rounded-2xl ${bgClass} ${colorClass} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-3xl font-black font-mono tracking-tighter drop-shadow-md transition-colors ${colorClass}`}>
            {Math.round(avgPercent)}%
          </span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Capaian Rata-rata</span>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-tight leading-snug group-hover:text-blue-500 transition-colors">
          {indicator.title}
        </h3>
        
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4">
          <div className="flex flex-col">
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{count} Audit</span>
             <span className={`text-[10px] font-bold ${colorClass}`}>{targetStatus}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors text-slate-400">
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </div>
        </div>
      </div>
      
      {/* Decorative Target Line */}
       <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 dark:bg-white/5">
         <div className={`h-full ${bgClass.replace('/10', '')} transition-all duration-1000 ease-out`} style={{ width: `${avgPercent}%` }} />
      </div>
    </motion.div>
  );
};

const SurveilansSummaryCard = ({ indicator, stats, onClick }: any) => {
  const rate = stats ? stats.rate : 0;
  const count = stats ? stats.count : 0;
  const prevRate = stats ? stats.prevRate : 0;
  
  const isPercent = indicator.id === 'ido';
  const symbol = isPercent ? '%' : '‰';
  
  // Standard logic
  const standards: Record<string, number> = { phlebitis: 1, isk: 4.7, vap: 5.8, ido: 2 };
  const maxStandard = standards[indicator.id] || 0;
  const isSesuai = rate <= maxStandard;

  let colorClass = 'text-slate-400';
  let bgClass = 'bg-slate-500/10';
  let borderClass = 'border-slate-500/20';
  
  if (indicator.id === 'phlebitis') {
    colorClass = 'text-cyan-500'; bgClass = 'bg-cyan-500/10'; borderClass = 'border-cyan-500/30';
  } else if (indicator.id === 'isk') {
    colorClass = 'text-emerald-500'; bgClass = 'bg-emerald-500/10'; borderClass = 'border-emerald-500/30';
  } else if (indicator.id === 'vap') {
    colorClass = 'text-purple-500'; bgClass = 'bg-purple-500/10'; borderClass = 'border-purple-500/30';
  } else if (indicator.id === 'ido') {
    colorClass = 'text-orange-500'; bgClass = 'bg-orange-500/10'; borderClass = 'border-orange-500/30';
  }

  const Icon = indicator.icon;
  const trendUp = rate > prevRate;
  const trendDown = rate < prevRate;
  const trendSame = rate === prevRate;

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }} 
      onClick={onClick}
      className={`bg-slate-900/40 backdrop-blur-sm p-5 sm:p-6 rounded-3xl border ${borderClass} cursor-pointer group relative overflow-hidden transition-all shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col justify-between min-h-[240px]`}
    >
      <div className={`absolute top-0 right-0 w-40 h-40 blur-[80px] rounded-full -z-10 opacity-20 transition-all duration-500 group-hover:opacity-40 group-hover:scale-150 ${bgClass.replace('/10', '')}`} />
      
      <div className="flex justify-between items-start mb-4">
        <div className={`p-4 rounded-2xl ${bgClass} ${colorClass} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-4xl font-black font-mono tracking-tighter drop-shadow-md transition-colors ${colorClass}`}>
            {rate.toFixed(2)}{symbol}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Rate Realtime</span>
        </div>
      </div>

      <div className="mt-auto">
        <h3 className="text-base font-bold text-white mb-4 uppercase tracking-tight leading-snug group-hover:opacity-80 transition-opacity">
          {indicator.title}
        </h3>
        
        <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
          <div className="flex justify-between items-center text-xs">
             <span className="text-slate-400 font-medium">Status</span>
             {count === 0 ? (
                <span className="text-slate-500 font-bold">Belum ada data</span>
             ) : isSesuai ? (
                <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded">Sesuai Standar</span>
             ) : (
                <span className="text-red-400 font-bold bg-red-400/10 px-2 py-0.5 rounded">Di Atas Standar</span>
             )}
          </div>
          <div className="flex justify-between items-center text-xs">
             <span className="text-slate-400 font-medium">Trend (vs sblm)</span>
             {count === 0 ? (
                <span className="text-slate-500 font-bold">-</span>
             ) : trendSame ? (
                <span className="text-slate-300 font-bold">-</span>
             ) : trendUp ? (
                <span className="text-red-400 font-bold flex items-center gap-1">Naik <Activity className="w-3 h-3" /></span>
             ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1">Turun <Activity className="w-3 h-3 rotate-180" /></span>
             )}
          </div>
          <div className="flex justify-between items-center text-xs">
             <span className="text-slate-400 font-medium">Total Input</span>
             <span className="text-white font-bold">{count} Data</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};


import { useDashboardStore } from '@/hooks/useDashboardStore';

export default function ReportsPage() {
  const { reportsData, setReportsData, isReportsLoaded } = useDashboardStore();
  const [periode, setPeriode] = useState('Bulanan');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3));
  const [selectedSemester, setSelectedSemester] = useState(Math.floor(new Date().getMonth() / 6));
  const [kategori, setKategori] = useState('Kewaspadaan Isolasi');
  const [subKategori, setSubKategori] = useState('Standar');
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>('Semua Unit');
  
  const [statsMap, setStatsMap] = useState<Map<string, { count: number, sum: number, avgPercent: number }>>(new Map());
  const [haisStatsMap, setHaisStatsMap] = useState<Map<string, { count: number, num: number, den: number, rate: number, prevRate: number }>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isReportsLoaded && reportsData && reportsData.statsMap && reportsData.haisStatsMap) {
      setStatsMap(reportsData.statsMap);
      setHaisStatsMap(reportsData.haisStatsMap);
      setLoading(false);
    }
  }, [isReportsLoaded, reportsData]);

  // Automatically scroll main container to top when changing indicators
  useEffect(() => {
    const scrollToTop = () => {
      const mainEl = document.querySelector('main');
      if (mainEl) {
        mainEl.scrollTop = 0;
        mainEl.scrollTo({ top: 0, behavior: 'instant' as any });
      }
      
      const scrollableElements = document.querySelectorAll('.overflow-y-auto');
      scrollableElements.forEach(el => {
        el.scrollTop = 0;
      });

      window.scrollTo({ top: 0, behavior: 'instant' as any });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    // Scroll immediately
    scrollToTop();
  }, [selectedIndicator]);

  const startDateISO = useMemo(() => {
    if (periode === 'Bulanan') {
      return new Date(selectedYear, selectedMonth, 1).toISOString();
    }
    if (periode === 'Triwulan') {
      return new Date(selectedYear, selectedQuarter * 3, 1).toISOString();
    }
    if (periode === 'Semester') {
      return new Date(selectedYear, selectedSemester * 6, 1).toISOString();
    }
    if (periode === 'Tahunan') {
      return new Date(selectedYear, 0, 1).toISOString();
    }
    
    return new Date().toISOString();
  }, [periode, selectedMonth, selectedYear, selectedQuarter, selectedSemester]);

  // Calculate previous period for trend comparison
  const prevPeriodStartISO = useMemo(() => {
    const d = new Date(startDateISO);
    if (periode === 'Bulanan') d.setMonth(d.getMonth() - 1);
    else if (periode === 'Triwulan') d.setMonth(d.getMonth() - 3);
    else if (periode === 'Semester') d.setMonth(d.getMonth() - 6);
    else if (periode === 'Tahunan') d.setFullYear(d.getFullYear() - 1);
    return d.toISOString();
  }, [startDateISO, periode]);

  useEffect(() => {
    if (isReportsLoaded && reportsData && reportsData.startDateISO === startDateISO) {
      return;
    }

    const fetchStats = async () => {
      if (!isReportsLoaded) setLoading(true);
      try {
        const [auditRes] = await Promise.all([
           supabase.from('audit_sessions').select('indikator_id, kategori, persentase, tanggal_waktu, jumlah_patuh, jumlah_dinilai').gte('tanggal_waktu', prevPeriodStartISO)
        ]);
          
        if (auditRes.data) {
          const map = new Map<string, { count: number, sum: number, avgPercent: number }>();
          const hMap = new Map<string, { count: number, num: number, den: number, rate: number, prevRate: number, prevNum: number, prevDen: number }>();

          auditRes.data.forEach((row: any) => {
             const key = row.indikator_id;

             // HAIs stats
             if (row.kategori === 'Surveilans HAIs' && ['isk', 'phlebitis', 'vap', 'ido'].includes(key)) {
                if (!hMap.has(key)) hMap.set(key, { count: 0, num: 0, den: 0, rate: 0, prevRate: 0, prevNum: 0, prevDen: 0 });
                const entry = hMap.get(key)!;
                if (row.tanggal_waktu >= startDateISO) {
                   entry.count += 1;
                   entry.num += (row.jumlah_patuh || 0);
                   entry.den += (row.jumlah_dinilai || 0);
                } else {
                   entry.prevNum += (row.jumlah_patuh || 0);
                   entry.prevDen += (row.jumlah_dinilai || 0);
                }
             }

             // General stats
             if (row.tanggal_waktu >= startDateISO) {
                 if (!map.has(key)) map.set(key, { count: 0, sum: 0, avgPercent: 0 });
                 const entry = map.get(key)!;
                 entry.count += 1;
                 entry.sum += (row.persentase || 0);
             }
          });
          
          for (let [key, val] of Array.from(map.entries())) {
             val.avgPercent = val.count > 0 ? (val.sum / val.count) : 0;
          }
          setStatsMap(map);

          for (let [key, val] of Array.from(hMap.entries())) {
             const mult = key === 'ido' ? 100 : 1000;
             val.rate = val.den > 0 ? (val.num / val.den) * mult : 0;
             val.prevRate = val.prevDen > 0 ? (val.prevNum / val.prevDen) * mult : 0;
          }
          setHaisStatsMap(hMap);
          
          setReportsData({ statsMap: map, haisStatsMap: hMap, startDateISO });
        } else {
          const map = new Map();
          const hMap = new Map();
          setStatsMap(map);
          setHaisStatsMap(hMap);
          setReportsData({ statsMap: map, haisStatsMap: hMap, startDateISO });
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    
    const channelAudit = supabase.channel('audit_sessions_changes_rep')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_sessions' }, fetchStats)
      .subscribe();
      
    return () => {
      supabase.removeChannel(channelAudit);
    };
  }, [startDateISO, prevPeriodStartISO, isReportsLoaded, reportsData, setReportsData]);

  // Compute displayed indicators based on category/subcategory
  const displayedIndicators = useMemo(() => {
    return Object.values(INDICATORS_MAP).filter(ind => {
      if (ind.cat !== kategori) return false;
      if (subKategori && ind.subcat !== subKategori) return false;
      return true;
    });
  }, [kategori, subKategori]);

  const handleBack = () => {
     setSelectedIndicator(null);
     const mainEl = document.querySelector('main');
     if (mainEl) {
       mainEl.scrollTo({ top: 0, behavior: 'smooth' });
     } else {
       window.scrollTo({ top: 0, behavior: 'smooth' });
     }
  };

  const selectedData = INDICATORS_MAP[selectedIndicator || ''];

  return (
    <div className="max-w-[1600px] mx-auto pb-32">
      <AnimatePresence mode="wait">
        {!selectedIndicator && (
          <motion.div key="hub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, scale: 0.98 }} className="space-y-8">
            
            {/* Header & Filter Periode */}
            {kategori !== 'Surveilans HAIs' && (
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="text-center lg:text-left w-full lg:w-auto">
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase mb-2">
                     Laporan SMART PPI
                  </h1>
                  <p className="text-sm font-normal text-slate-500 dark:text-slate-400 mx-auto md:mx-0 max-w-[280px] sm:max-w-none">
                     Pusat analisis data pencegahan dan pengendalian infeksi terintegrasi.
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-3 bg-white/60 dark:bg-[#111827]/60 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-2xl p-2 shadow-sm">
                     <select 
                       value={periode} 
                       onChange={(e) => setPeriode(e.target.value)}
                       className="bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white pr-2 cursor-pointer"
                     >
                       {['Bulanan', 'Triwulan', 'Semester', 'Tahunan'].map(p => (
                         <option key={p} value={p} className="bg-white dark:bg-slate-900">{p}</option>
                       ))}
                     </select>
  
                     {periode === 'Bulanan' && (
                       <>
                         <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />
                         <select 
                           value={selectedMonth} 
                           onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                           className="bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white pr-2 cursor-pointer"
                         >
                           {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                             <option key={m} value={i} className="bg-white dark:bg-slate-900">{m}</option>
                           ))}
                         </select>
                       </>
                     )}
  
                     {periode === 'Triwulan' && (
                       <>
                         <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />
                         <select 
                           value={selectedQuarter} 
                           onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                           className="bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white pr-2 cursor-pointer"
                         >
                           {["Triwulan 1", "Triwulan 2", "Triwulan 3", "Triwulan 4"].map((q, i) => (
                             <option key={q} value={i} className="bg-white dark:bg-slate-900">{q}</option>
                           ))}
                         </select>
                       </>
                     )}
  
                     {periode === 'Semester' && (
                       <>
                         <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />
                         <select 
                           value={selectedSemester} 
                           onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                           className="bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white pr-2 cursor-pointer"
                         >
                           {["Semester 1", "Semester 2"].map((s, i) => (
                             <option key={s} value={i} className="bg-white dark:bg-slate-900">{s}</option>
                           ))}
                         </select>
                       </>
                     )}
  
                     <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />
                     <select 
                       value={selectedYear} 
                       onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                       className="bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white pr-2 cursor-pointer"
                     >
                       {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                         <option key={y} value={y} className="bg-white dark:bg-slate-900">{y}</option>
                       ))}
                     </select>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Filter Kategori & Sub */}
            <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-2 shadow-lg dark:shadow-[0_0_40px_rgba(0,0,0,0.2)]">
               <div className="flex flex-wrap items-center gap-2">
                 {CATEGORIES.map(cat => (
                   <button
                     key={cat}
                     onClick={() => { setKategori(cat); setSubKategori((SUB_CATEGORIES as any)[cat]?.[0] || null); }}
                     className={`px-5 py-3 rounded-2xl text-[11px] sm:text-xs font-bold uppercase tracking-widest transition-all ${
                       kategori === cat 
                         ? 'bg-blue-600 text-white shadow-md' 
                         : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                     }`}
                   >
                     {cat}
                   </button>
                 ))}
               </div>
               
               <AnimatePresence>
                 {(SUB_CATEGORIES as any)[kategori] && (
                   <motion.div 
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: 'auto', opacity: 1 }}
                     exit={{ height: 0, opacity: 0 }}
                     className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-2 overflow-hidden"
                   >
                     {(SUB_CATEGORIES as any)[kategori].map((sub: string) => (
                       <button
                         key={sub}
                         onClick={() => setSubKategori(sub)}
                         className={`px-4 py-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                           subKategori === sub 
                             ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                             : 'border border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                         }`}
                       >
                         {subKategori === sub && <CheckCircle2 className="w-3 h-3" />}
                         {sub}
                       </button>
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            {/* Indicator Grid or Unified Report */}
            <div className="pt-4">
              {kategori === 'Surveilans HAIs' ? (
                 <UnifiedSurveilansHaisReport />
              ) : loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1,2,3,4,5,6].map(n => <div key={n} className="h-56 bg-white dark:bg-white/5 rounded-3xl animate-pulse"></div>)}
                </div>
              ) : displayedIndicators.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-center bg-white/50 dark:bg-[#111827]/50 rounded-3xl border border-slate-200 dark:border-white/5">
                  <Filter className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Kategori Belum Tersedia</h3>
                  <p className="text-sm font-medium text-slate-500">Silakan pilih kategori lain yang tersedia.</p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {displayedIndicators.map((ind, idx) => (
                    <motion.div
                      key={ind.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <SummaryCard
                        indicator={ind}
                        stats={statsMap.get(ind.id)}
                        onClick={() => {
                          setSelectedIndicator(ind.id);
                          const mainEl = document.querySelector('main');
                          if (mainEl) {
                            mainEl.scrollTo({ top: 0, behavior: 'instant' as any });
                          } else {
                            window.scrollTo({ top: 0, behavior: 'auto' });
                          }
                        }}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

          </motion.div>
        )}

        {selectedIndicator && (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            
            {/* Header Detail View */}
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                 <button onClick={handleBack} className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-slate-300">
                   <ArrowLeft className="w-5 h-5" />
                 </button>
                 <div>
                   <h1 className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient uppercase leading-none">
                     {selectedData?.title}
                   </h1>
                   <div className="flex items-center gap-2 mt-2 font-medium text-[11px] text-slate-500 uppercase tracking-widest">
                     <span>{selectedData?.cat}</span>
                     {selectedData?.subcat && (
                       <>
                         <ChevronRight className="w-3 h-3" />
                         <span>{selectedData.subcat}</span>
                       </>
                     )}
                   </div>
                 </div>
               </div>
               
               <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
                 <div className="flex items-center gap-2 bg-white/60 dark:bg-[#111827]/60 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl p-1 shadow-sm">
                   
                   <select 
                     value={periode} 
                     onChange={(e) => setPeriode(e.target.value)}
                     className="bg-transparent border-none outline-none text-xs font-bold text-slate-900 dark:text-white pr-2 cursor-pointer"
                   >
                     {['Bulanan', 'Triwulan', 'Semester', 'Tahunan'].map(p => (
                       <option key={p} value={p} className="bg-white dark:bg-slate-900">{p}</option>
                     ))}
                   </select>

                   {periode === 'Bulanan' && (
                     <>
                       <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
                       <select 
                         value={selectedMonth} 
                         onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                         className="bg-transparent border-none outline-none text-xs font-bold text-slate-900 dark:text-white pr-2 cursor-pointer"
                       >
                         {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                           <option key={m} value={i} className="bg-white dark:bg-slate-900">{m}</option>
                         ))}
                       </select>
                     </>
                   )}
                   {periode === 'Triwulan' && (
                     <>
                       <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
                       <select 
                         value={selectedQuarter} 
                         onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                         className="bg-transparent border-none outline-none text-xs font-bold text-slate-900 dark:text-white pr-2 cursor-pointer"
                       >
                         {["Triwulan 1", "Triwulan 2", "Triwulan 3", "Triwulan 4"].map((q, i) => (
                           <option key={q} value={i} className="bg-white dark:bg-slate-900">{q}</option>
                         ))}
                       </select>
                     </>
                   )}
                   {periode === 'Semester' && (
                     <>
                       <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
                       <select 
                         value={selectedSemester} 
                         onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                         className="bg-transparent border-none outline-none text-xs font-bold text-slate-900 dark:text-white pr-2 cursor-pointer"
                       >
                         {["Semester 1", "Semester 2"].map((s, i) => (
                           <option key={s} value={i} className="bg-white dark:bg-slate-900">{s}</option>
                         ))}
                       </select>
                     </>
                   )}
                 </div>

                 <div className="flex items-center gap-2 bg-white/60 dark:bg-[#111827]/60 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-xl p-1 shadow-sm">
                   <div className="p-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
                     <Building2 className="w-4 h-4" />
                   </div>
                   <select 
                     value={selectedUnit} 
                     onChange={(e) => setSelectedUnit(e.target.value)}
                     className="bg-transparent border-none outline-none text-xs font-bold text-slate-900 dark:text-white pr-2 max-w-[120px] sm:max-w-none cursor-pointer"
                   >
                     <option value="Semua Unit" className="bg-white dark:bg-slate-900">Semua Unit</option>
                     {['IGD', 'ICU', 'IBS', 'Rawat Jalan', 'Ranap Aisyah', 'Ranap Fatimah', 'Ranap Khadijah', 'Ranap Usman', 'Radiologi', 'Laboratorium', 'Pantry', 'Emergency Kebidanan'].map(u => (
                       <option key={u} value={u} className="bg-white dark:bg-slate-900">{u}</option>
                     ))}
                   </select>
                 </div>

                 {selectedIndicator === 'dekontaminasi_alat' && (
                   <div className="flex gap-2">
                     <button
                       onClick={() => window.dispatchEvent(new Event('edit-dekontaminasi'))}
                       className="p-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded-xl transition-colors"
                       title="Edit Laporan"
                     >
                       <Edit className="w-5 h-5" />
                     </button>
                     <button
                       onClick={() => window.dispatchEvent(new Event('delete-dekontaminasi'))}
                       className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-xl transition-colors"
                       title="Hapus Laporan"
                     >
                       <Trash2 className="w-5 h-5" />
                     </button>
                     <button
                       onClick={() => window.dispatchEvent(new Event('print-dekontaminasi'))}
                       className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl transition-colors"
                       title="Print PDF"
                     >
                       <FileText className="w-5 h-5" />
                     </button>
                   </div>
                 )}

               </div>
             </div>

            {/* Dynamic Report Content */}
            <div className="pt-2">
              {kategori === 'Surveilans HAIs' && ['phlebitis', 'isk', 'vap', 'ido'].includes(selectedIndicator || '') ? (
                 <SurveilansHaisReport indicator={selectedIndicator!} periodeStartISO={startDateISO} periodeType={periode} />
              ) : selectedIndicator === 'audit_hand_hygiene' ? (
                 <HandHygieneReport filters={{ searchQuery: '', periode: startDateISO, type: periode, unitFilter: selectedUnit } as any} />
              ) : selectedIndicator === 'audit_apd' ? (
                 <ApdReport filters={{ searchQuery: '', periode: startDateISO, type: periode, unitFilter: selectedUnit } as any} />
              ) : (
                 <GenericAuditReport 
                    tableName={selectedIndicator}
                    indicatorItems={genericAuditConfigs[selectedIndicator]?.items || []}
                    title={selectedData?.title || 'Laporan'}
                    filters={{ searchQuery: '', periode: startDateISO, type: periode }}
                  />
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

ReportsPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

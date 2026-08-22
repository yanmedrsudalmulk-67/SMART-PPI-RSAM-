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
const EtikaBatukReport = dynamic(() => import('@/components/reports/EtikaBatukReport'), { ssr: false, loading: () => <ReportSkeleton /> });
const DiklatReport = dynamic(() => import('@/components/reports/DiklatReport'), { ssr: false, loading: () => <ReportSkeleton /> });

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
  'monitoring_ppi_ruang_isolasi': { cat: 'Kewaspadaan Isolasi', subcat: 'Transmisi', title: 'Ruang Isolasi', id: 'monitoring_ppi_ruang_isolasi', icon: Users },
  'ppi_ruang_isolasi': { cat: 'Kewaspadaan Isolasi', subcat: 'Transmisi', title: 'PPI di Ruang Isolasi', id: 'ppi_ruang_isolasi', icon: ShieldAlert },
  'monitoring_airborne': { cat: 'Kewaspadaan Isolasi', subcat: 'Transmisi', title: 'Penempatan Pasien Airborne', id: 'monitoring_airborne', icon: Wind },
  'monitoring_immuno': { cat: 'Kewaspadaan Isolasi', subcat: 'Transmisi', title: 'Penempatan Pasien Immunocompromised', id: 'monitoring_immuno', icon: ShieldCheck },

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
  
  // Surveilans HAIs
  'isk': { cat: 'Surveilans HAIs', title: 'Infeksi Saluran Kemih (ISK)', id: 'isk', icon: Activity },
  'phlebitis': { cat: 'Surveilans HAIs', title: 'Phlebitis', id: 'phlebitis', icon: Activity },
  'vap': { cat: 'Surveilans HAIs', title: 'Ventilator Associated Pneumonia (VAP)', id: 'vap', icon: Activity },
  'ido': { cat: 'Surveilans HAIs', title: 'Infeksi Daerah Operasi (IDO)', id: 'ido', icon: Activity },

  // Monitoring Bundles
  'iadp': { cat: 'Monitoring Bundles', title: 'Bundles PLABSI / IADP', id: 'iadp', icon: ClipboardCheck },
  'cauti': { cat: 'Monitoring Bundles', title: 'Bundles CAUTI / ISK', id: 'cauti', icon: ClipboardCheck },
  'ido_b': { cat: 'Monitoring Bundles', title: 'Bundles IDO', id: 'ido_b', icon: ClipboardCheck },
  'vap_b': { cat: 'Monitoring Bundles', title: 'Bundles VAP', id: 'vap_b', icon: ClipboardCheck },

  // Pendidikan dan Pelatihan
  'diklat_ppi': { cat: 'Pendidikan dan Pelatihan', title: 'Pendidikan Dan Pelatihan Staff', id: 'diklat_ppi', icon: GraduationCap },
};

const CATEGORIES = [
  'Kewaspadaan Isolasi',
  'Surveilans HAIs',
  'Monitoring Bundles',
  'Pendidikan dan Pelatihan'
];

const CATEGORY_DETAILS = [
  {
    id: 'Kewaspadaan Isolasi',
    title: 'Kewaspadaan Isolasi',
    subtitle: 'Monitoring Kepatuhan Isolasi',
    statistic: '8 Indikator Terintegrasi',
    icon: ShieldCheck,
    emoji: '🛡️',
    gradient: 'from-emerald-500/10 via-emerald-500/5 to-cyan-500/5',
    activeGradient: 'from-emerald-500/20 via-emerald-500/10 to-cyan-500/10',
    border: 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10',
    activeBorder: 'border-emerald-500/60 dark:border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    textGlow: 'hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
  },
  {
    id: 'Surveilans HAIs',
    title: 'Surveilans HAIs',
    subtitle: 'Monitoring Healthcare Associated Infections',
    statistic: '7 Indikator Realtime Monitoring',
    icon: Activity,
    emoji: '🦠',
    gradient: 'from-blue-500/10 via-blue-500/5 to-cyan-500/5',
    activeGradient: 'from-blue-500/20 via-blue-500/10 to-cyan-500/10',
    border: 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10',
    activeBorder: 'border-blue-500/60 dark:border-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    textGlow: 'hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    iconColor: 'text-blue-500 dark:text-blue-400',
  },
  {
    id: 'Monitoring Bundles',
    title: 'Monitoring Bundles',
    subtitle: 'Monitoring Bundle Pencegahan Infeksi',
    statistic: '6 Bundle Aktif',
    icon: ClipboardCheck,
    emoji: '📋',
    gradient: 'from-amber-500/10 via-amber-500/5 to-orange-500/5',
    activeGradient: 'from-amber-500/20 via-amber-500/10 to-orange-500/10',
    border: 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10',
    activeBorder: 'border-amber-500/60 dark:border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    textGlow: 'hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    iconColor: 'text-amber-500 dark:text-amber-400',
  },
  {
    id: 'Pendidikan dan Pelatihan',
    title: 'Pendidikan & Pelatihan',
    subtitle: 'Pelatihan dan Edukasi PPI',
    statistic: 'Pelatihan PPI Terdokumentasi',
    icon: GraduationCap,
    emoji: '🎓',
    gradient: 'from-purple-500/10 via-purple-500/5 to-pink-500/5',
    activeGradient: 'from-purple-500/20 via-purple-500/10 to-pink-500/10',
    border: 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10',
    activeBorder: 'border-purple-500/60 dark:border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.3)]',
    textGlow: 'hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    iconColor: 'text-purple-500 dark:text-purple-400',
  }
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
  const [isCategoryTransitioning, setIsCategoryTransitioning] = useState(false);

  const handleCategoryChange = (cat: string) => {
    if (cat === kategori) return;
    setIsCategoryTransitioning(true);
    setKategori(cat);
    setSubKategori((SUB_CATEGORIES as any)[cat]?.[0] || null);
    forceScrollToTop();
    setTimeout(() => {
      setIsCategoryTransitioning(false);
      forceScrollToTop();
    }, 280);
  };
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

  // Helper to force scroll reset across main layout, window, and all scroll containers
  const forceScrollToTop = () => {
    if (typeof window === 'undefined') return;
    const reset = () => {
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

    reset();
    requestAnimationFrame(reset);
    setTimeout(reset, 50);
    setTimeout(reset, 150);
    setTimeout(reset, 300);
    setTimeout(reset, 500);
  };

  // Automatically scroll main container to top when changing indicators, categories, or subcategories
  useEffect(() => {
    forceScrollToTop();
  }, [selectedIndicator, kategori, subKategori]);

  const startDateISO = useMemo(() => {
    if (periode === 'Bulanan') {
      return new Date(Date.UTC(selectedYear, selectedMonth, 1)).toISOString();
    }
    if (periode === 'Triwulan') {
      return new Date(Date.UTC(selectedYear, selectedQuarter * 3, 1)).toISOString();
    }
    if (periode === 'Semester') {
      return new Date(Date.UTC(selectedYear, selectedSemester * 6, 1)).toISOString();
    }
    if (periode === 'Tahunan') {
      return new Date(Date.UTC(selectedYear, 0, 1)).toISOString();
    }
    
    return new Date().toISOString();
  }, [periode, selectedMonth, selectedYear, selectedQuarter, selectedSemester]);

  // Calculate previous period for trend comparison
  const prevPeriodStartISO = useMemo(() => {
    const d = new Date(startDateISO);
    if (periode === 'Bulanan') d.setUTCMonth(d.getUTCMonth() - 1);
    else if (periode === 'Triwulan') d.setUTCMonth(d.getUTCMonth() - 3);
    else if (periode === 'Semester') d.setUTCMonth(d.getUTCMonth() - 6);
    else if (periode === 'Tahunan') d.setUTCFullYear(d.getUTCFullYear() - 1);
    return d.toISOString();
  }, [startDateISO, periode]);

  useEffect(() => {
    const fetchStats = async () => {
      const currentIsLoaded = useDashboardStore.getState().isReportsLoaded;
      if (!currentIsLoaded) setLoading(true);
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
                 entry.sum += (key === 'etika_batuk' ? 100 : (row.persentase || 0));
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
  }, [startDateISO, prevPeriodStartISO, setReportsData]);

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
     forceScrollToTop();
  };

  const selectedData = INDICATORS_MAP[selectedIndicator || ''];

  return (
    <div className="max-w-[1600px] mx-auto pb-32">
      <AnimatePresence mode="wait">
        {!selectedIndicator && (
          <motion.div key="hub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, scale: 0.98 }} onAnimationComplete={forceScrollToTop} className="space-y-8">
            
            {/* Header & Filter Periode */}
            {kategori !== 'Surveilans HAIs' && (
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="text-center lg:text-left w-full lg:w-auto">
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient transition-all uppercase mb-2">
                     Laporan SMART PPI
                  </h1>
                  <p className="text-sm font-normal text-white mx-auto md:mx-0 max-w-[280px] sm:max-w-none">
                     Pusat analisis data pencegahan dan pengendalian infeksi terintegrasi.
                  </p>
                </div>
                 <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
                  <div className="glowing-border-container w-full sm:w-auto">
                    {/* Spinning gradient layer */}
                    <div className="glowing-border-bg" />
                    {/* Glowing shadow layer underneath */}
                    <div className="glowing-border-shadow" />

                    <div className="glowing-border-inner flex flex-wrap justify-center items-center gap-3 rounded-[14px] p-2 w-full sm:w-auto">
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
              </div>
            )}

            {/* Navigation Filter Kategori & Sub */}
            <div id="smart-ppi-category-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {CATEGORY_DETAILS.map(detail => {
                const isActive = kategori === detail.id;
                const Icon = detail.icon;
                
                return (
                  <motion.div
                    key={detail.id}
                    id={`cat-card-${detail.id.toLowerCase().replace(/\s+/g, '-')}`}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategoryChange(detail.id)}
                    className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden backdrop-blur-md flex flex-col justify-between min-h-[140px] select-none ${
                      isActive 
                        ? `bg-[#0f172a]/90 dark:bg-slate-900/95 bg-gradient-to-br ${detail.activeGradient} ${detail.activeBorder} z-10` 
                        : `bg-white/80 dark:bg-[#111827]/80 hover:bg-slate-50 dark:hover:bg-white/5 ${detail.border} ${detail.textGlow}`
                    }`}
                  >
                    {/* Glow Accent Background Ornaments */}
                    {isActive && (
                      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full blur-xl pointer-events-none animate-pulse" />
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl filter drop-shadow">{detail.emoji}</span>
                          <h3 className={`text-sm sm:text-base font-extrabold tracking-tight ${
                            isActive ? 'text-white' : 'text-slate-800 dark:text-slate-100'
                          }`}>
                            {detail.title}
                          </h3>
                        </div>
                        <p className={`text-[10px] sm:text-xs leading-normal mt-1 font-medium ${
                          isActive ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {detail.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between">
                      <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider ${
                        isActive ? 'text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {detail.statistic}
                      </span>
                      {isActive && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Sub-Category Premium Redesigned Tabs */}
            <AnimatePresence>
              {(SUB_CATEGORIES as any)[kategori] && (
                <motion.div
                  id="smart-ppi-subcategory-container"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 mb-2 max-w-2xl mx-auto w-full"
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5 px-3">Klasifikasi Indikator</p>
                  <div className="relative flex p-1.5 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-sm rounded-full mb-4 border border-white/20 dark:border-white/10 shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)] w-full">
                    <motion.div
                      className={`absolute top-1.5 bottom-1.5 rounded-full transition-colors duration-500 border ${
                        subKategori === "Standar"
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] border-blue-400/30"
                          : subKategori === "Transmisi"
                            ? "bg-gradient-to-r from-purple-600 to-purple-500 shadow-[0_0_20px_rgba(139,92,246,0.4)] border-purple-400/30"
                            : "bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] border-emerald-400/30"
                      }`}
                      initial={false}
                      style={{ left: "6px" }}
                      animate={{
                        x:
                          subKategori === "Standar"
                            ? "0%"
                            : subKategori === "Transmisi"
                              ? "100%"
                              : "200%",
                        width: "calc(33.33% - 4px)",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    {[
                      { id: "Standar", label: "Standar", icon: ShieldCheck },
                      { id: "Transmisi", label: "Transmisi", icon: ShieldAlert },
                      { id: "Monitoring", label: "Monitoring", icon: Activity },
                    ].map((tab) => {
                      const isSubActive = subKategori === tab.id;
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          id={`sub-tab-${tab.id.toLowerCase()}`}
                          onClick={() => {
                            setSubKategori(tab.id);
                            forceScrollToTop();
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-colors relative z-10 whitespace-nowrap shrink-0 overflow-hidden text-ellipsis ${
                            isSubActive
                              ? "text-white"
                              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                          }`}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-300 ${isSubActive ? "text-white" : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white"}`}
                          />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Indicator Grid or Unified Report */}
            <div className="pt-4">
              {isCategoryTransitioning || loading ? (
                <div id="reports-skeleton-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <div key={n} id={`skeleton-indicator-${n}`} className="h-56 bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-between animate-pulse">
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-slate-200 dark:bg-white/10 rounded-2xl" />
                        <div className="w-16 h-8 bg-slate-200 dark:bg-white/10 rounded-xl" />
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
                      </div>
                      <div className="border-t border-slate-100 dark:border-white/5 pt-4 flex justify-between">
                        <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-1/4" />
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : kategori === 'Surveilans HAIs' ? (
                 <UnifiedSurveilansHaisReport />
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
                          forceScrollToTop();
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
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onAnimationComplete={forceScrollToTop} className="space-y-6">
            
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
               
               <div className="flex flex-wrap justify-center items-center gap-3 self-center md:self-auto w-full md:w-auto mt-4 md:mt-0">
                  <div className="glowing-border-container w-full sm:w-auto">
                    {/* Spinning gradient layer */}
                    <div className="glowing-border-bg" />
                    {/* Glowing shadow layer underneath */}
                    <div className="glowing-border-shadow" />
                 <div className="glowing-border-inner flex flex-wrap justify-center items-center gap-2 rounded-[14px] p-1 shadow-sm w-full sm:w-auto">
                   
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
              ) : selectedIndicator === 'etika_batuk' ? (
                 <EtikaBatukReport 
                    tableName={selectedIndicator}
                    title={selectedData?.title || 'Laporan Edukasi'}
                    filters={{ searchQuery: '', periode: startDateISO, type: periode, unitFilter: selectedUnit } as any}
                  />
              ) : selectedIndicator === 'diklat_ppi' ? (
                 <DiklatReport 
                    tableName={selectedIndicator}
                    title={selectedData?.title || 'Laporan Pelatihan'}
                    filters={{ searchQuery: '', periode: startDateISO, type: periode, unitFilter: selectedUnit } as any}
                  />
              ) : (
                 <GenericAuditReport 
                    tableName={selectedIndicator}
                    indicatorItems={genericAuditConfigs[selectedIndicator]?.items || []}
                    title={selectedData?.title || 'Laporan'}
                    extraFilter={genericAuditConfigs[selectedIndicator]?.extraFilter}
                    filters={{ searchQuery: '', periode: startDateISO, type: periode, unitFilter: selectedUnit } as any}
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

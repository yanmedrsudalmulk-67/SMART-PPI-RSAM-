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

import GenericAuditReport from '@/components/reports/GenericAuditReport';
import HandHygieneReport from '@/components/reports/HandHygieneReport';
import ApdReport from '@/components/reports/ApdReport';
import SurveilansHaisReport from '@/components/reports/SurveilansHaisReport';
import UnifiedSurveilansHaisReport from '@/components/reports/UnifiedSurveilansHaisReport';
import EtikaBatukReport from '@/components/reports/EtikaBatukReport';
import DiklatReport from '@/components/reports/DiklatReport';
import { ReportSkeleton } from '@/components/SkeletonLoading';

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

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const SummaryCard = ({ indicator, stats, onClick }: any) => {
  const avgPercent = stats ? stats.avgPercent : 0;
  const count = stats ? stats.count : 0;
  
  let colorClass = 'text-slate-400';
  let badgeBg = 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  let targetStatus = 'Belum ada data';
  
  if (count > 0) {
    if (avgPercent < 75) {
      colorClass = 'text-rose-400';
      badgeBg = 'bg-rose-950/80 text-rose-300 border-rose-500/40';
      targetStatus = 'Di bawah target';
    }
    else if (avgPercent < 85) {
      colorClass = 'text-amber-400';
      badgeBg = 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      targetStatus = 'Mendekati target';
    }
    else {
      colorClass = 'text-emerald-400';
      badgeBg = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      targetStatus = 'Target tercapai';
    }
  }

  const Icon = indicator.icon;

  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.02 }} 
      onClick={onClick}
      className="group relative bg-[#18193b] p-6 sm:p-7 rounded-[28px] md:rounded-[32px] border border-[#2b2d56] cursor-pointer overflow-hidden flex flex-col justify-between min-h-[240px] shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] hover:shadow-[-8px_-8px_24px_rgba(140,165,255,0.1),12px_16px_40px_rgba(0,0,0,0.8),inset_1px_1px_2px_rgba(255,255,255,0.25)] transition-all duration-300 transform-gpu"
    >
      {/* Top Bevel Highlight */}
      <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="shrink-0 relative">
          <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#272952] to-[#12132d] border-2 border-indigo-400/30 shadow-[-3px_-3px_10px_rgba(140,165,255,0.12),6px_8px_18px_rgba(0,0,0,0.7),inset_1.5px_1.5px_2px_rgba(255,255,255,0.2)] flex items-center justify-center transform group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300">
            <div className="w-9 h-9 rounded-[14px] bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 shadow-[0_6px_16px_rgba(59,130,246,0.5),inset_1px_1px_2px_rgba(255,255,255,0.4)] flex items-center justify-center text-white">
              <Icon className="w-5 h-5 drop-shadow" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end text-right">
          <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] ${colorClass}`}>
            {Math.round(avgPercent)}%
          </span>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 text-right">CAPAIAN RATA-RATA</span>
        </div>
      </div>

      <div className="mt-2 relative z-10">
        <h3 className="text-sm sm:text-base font-extrabold text-white mb-3 uppercase tracking-tight leading-snug group-hover:text-cyan-300 transition-colors">
          {indicator.title}
        </h3>
        
        {/* Recessed Tray for details */}
        <div className="bg-[#12132e] rounded-2xl p-3 border border-black/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{count} Audit Terdata</span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 mt-1 rounded-full border ${badgeBg} w-fit`}>
              {targetStatus}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-[#18193b] border border-white/10 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)]">
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </div>
        </div>
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

  let colorClass = isSesuai ? 'text-emerald-400' : 'text-rose-400';

  const Icon = indicator.icon;
  const trendUp = rate > prevRate;
  const trendDown = rate < prevRate;
  const trendSame = rate === prevRate;

  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.02 }} 
      onClick={onClick}
      className="group relative bg-[#18193b] p-6 sm:p-7 rounded-[28px] md:rounded-[32px] border border-[#2b2d56] cursor-pointer overflow-hidden flex flex-col justify-between min-h-[250px] shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] hover:shadow-[-8px_-8px_24px_rgba(140,165,255,0.1),12px_16px_40px_rgba(0,0,0,0.8),inset_1px_1px_2px_rgba(255,255,255,0.25)] transition-all duration-300 transform-gpu"
    >
      {/* Top Bevel Highlight */}
      <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="shrink-0 relative">
          <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#272952] to-[#12132d] border-2 border-indigo-400/30 shadow-[-3px_-3px_10px_rgba(140,165,255,0.12),6px_8px_18px_rgba(0,0,0,0.7),inset_1.5px_1.5px_2px_rgba(255,255,255,0.2)] flex items-center justify-center transform group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300">
            <div className="w-9 h-9 rounded-[14px] bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-pink-500 shadow-[0_6px_16px_rgba(168,85,247,0.5),inset_1px_1px_2px_rgba(255,255,255,0.4)] flex items-center justify-center text-white">
              <Icon className="w-5 h-5 drop-shadow" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end text-right">
          <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] ${colorClass}`}>
            {rate.toFixed(2)}{symbol}
          </span>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 text-right">RATE REALTIME</span>
        </div>
      </div>

      <div className="mt-auto relative z-10">
        <h3 className="text-sm sm:text-base font-extrabold text-white mb-3 uppercase tracking-tight leading-snug group-hover:text-cyan-300 transition-colors">
          {indicator.title}
        </h3>
        
        {/* Recessed Tray for details */}
        <div className="bg-[#12132e] rounded-2xl p-3 border border-black/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Status</span>
            {count === 0 ? (
              <span className="text-slate-500 font-bold text-[10px]">Belum ada data</span>
            ) : isSesuai ? (
              <span className="text-emerald-300 font-black text-[10px] bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">Sesuai Standar</span>
            ) : (
              <span className="text-rose-300 font-black text-[10px] bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-full">Di Atas Standar</span>
            )}
          </div>
          <div className="flex justify-between items-center text-xs border-t border-white/5 pt-1.5">
            <span className="text-slate-400 font-medium text-[11px]">Trend (vs sblm)</span>
            {count === 0 ? (
              <span className="text-slate-500 font-bold text-[10px]">-</span>
            ) : trendSame ? (
              <span className="text-slate-300 font-bold text-[10px]">-</span>
            ) : trendUp ? (
              <span className="text-rose-400 font-bold text-[10px] flex items-center gap-1">Naik <Activity className="w-3 h-3" /></span>
            ) : (
              <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">Turun <Activity className="w-3 h-3 rotate-180" /></span>
            )}
          </div>
          <div className="flex justify-between items-center text-xs border-t border-white/5 pt-1.5">
            <span className="text-slate-400 font-medium text-[11px]">Total Input</span>
            <span className="text-white font-bold text-[11px]">{count} Data</span>
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
        try {
          mainEl.scrollTo({ top: 0, behavior: 'instant' as any });
        } catch (_) {}
      }
      const scrollableElements = document.querySelectorAll('.overflow-y-auto, [data-scroll-container]');
      scrollableElements.forEach(el => {
        el.scrollTop = 0;
      });

      const headerEl = document.getElementById('report-detail-header') || document.getElementById('report-top-anchor');
      if (headerEl) {
        try {
          headerEl.scrollIntoView({ behavior: 'instant' as any, block: 'start' });
        } catch (_) {}
      }

      try {
        window.scrollTo({ top: 0, behavior: 'instant' as any });
      } catch (_) {}
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    reset();
    requestAnimationFrame(reset);
    setTimeout(reset, 20);
    setTimeout(reset, 50);
    setTimeout(reset, 100);
    setTimeout(reset, 200);
    setTimeout(reset, 350);
    setTimeout(reset, 500);
    setTimeout(reset, 800);
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
              <div className="mb-6 flex flex-col lg:flex-row justify-between items-center lg:items-center gap-4">
                <div className="text-center lg:text-left w-full lg:w-auto shrink-0">
                  <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient uppercase">
                     Laporan SMART PPI
                  </h1>
                  <p className="text-sm text-slate-300 mt-1 font-medium">
                     Laporan Data Monitoring PPI Terintegrasi
                  </p>
                </div>

                {/* Filter Periode - 3D Tactile Neumorphic Container */}
                <div className="relative group w-full lg:w-auto">
                  <div className="relative bg-[#18193b] rounded-[24px] p-2.5 sm:p-3 border border-[#2b2d56] transition-all duration-300 transform-gpu overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)]">
                    {/* Top Bevel Specular Highlight */}
                    <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                    <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2.5 relative z-10">
                      {/* Neumorphic Capsule Badge */}
                      <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#12132e] border border-white/10 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.06)]">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                          PERIODE
                        </span>
                      </div>

                      {/* Tipe Periode - Recessed Neumorphic Well */}
                      <div className="relative">
                        <select 
                          value={periode} 
                          onChange={(e) => setPeriode(e.target.value)}
                          className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-xl pl-3.5 pr-8 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] capitalize"
                        >
                          <option value="Bulanan" className="bg-[#18193b] text-white">Bulanan</option>
                          <option value="Triwulan" className="bg-[#18193b] text-white">Triwulan</option>
                          <option value="Semester" className="bg-[#18193b] text-white">Semester</option>
                          <option value="Tahunan" className="bg-[#18193b] text-white">Tahunan</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </div>
   
                      {periode === 'Bulanan' && (
                        <div className="relative">
                          <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-xl pl-3.5 pr-8 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                          >
                            {MONTHS_SHORT.map((m, i) => (
                              <option key={m} value={i} className="bg-[#18193b] text-white">{m}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
   
                      {periode === 'Triwulan' && (
                        <div className="relative">
                          <select 
                            value={selectedQuarter} 
                            onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                            className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-xl pl-3.5 pr-8 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                          >
                            <option value={0} className="bg-[#18193b] text-white">TW 1 (Jan-Mar)</option>
                            <option value={1} className="bg-[#18193b] text-white">TW 2 (Apr-Jun)</option>
                            <option value={2} className="bg-[#18193b] text-white">TW 3 (Jul-Sep)</option>
                            <option value={3} className="bg-[#18193b] text-white">TW 4 (Okt-Des)</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
   
                      {periode === 'Semester' && (
                        <div className="relative">
                          <select 
                            value={selectedSemester} 
                            onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                            className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-xl pl-3.5 pr-8 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                          >
                            <option value={0} className="bg-[#18193b] text-white">SM 1 (Jan-Jun)</option>
                            <option value={1} className="bg-[#18193b] text-white">SM 2 (Jul-Des)</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
   
                      {/* Tahun - Recessed Neumorphic Well */}
                      <div className="relative">
                        <select 
                          value={selectedYear} 
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-xl pl-3.5 pr-8 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                        >
                          <option value={2026} className="bg-[#18193b] text-white">2026</option>
                          <option value={2025} className="bg-[#18193b] text-white">2025</option>
                          <option value={2024} className="bg-[#18193b] text-white">2024</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </div>
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
                    whileHover={{ y: -5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategoryChange(detail.id)}
                    className={`relative rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 border transition-all duration-300 transform-gpu overflow-hidden cursor-pointer select-none flex flex-col justify-between min-h-[160px] shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] ${
                      isActive 
                        ? `bg-[#1c1e48] border-cyan-400/50 shadow-[-6px_-6px_20px_rgba(140,165,255,0.12),12px_16px_36px_rgba(0,0,0,0.85),inset_1px_1px_2px_rgba(255,255,255,0.25)] ring-1 ring-cyan-400/30` 
                        : `bg-[#18193b] hover:bg-[#1f214d] border-[#2b2d56]`
                    }`}
                  >
                    {/* Top Bevel Specular Highlight */}
                    <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex flex-col gap-1 pr-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl filter drop-shadow">{detail.emoji}</span>
                          <h3 className={`text-sm sm:text-base font-black tracking-tight leading-snug ${
                            isActive ? 'text-cyan-300' : 'text-white'
                          }`}>
                            {detail.title}
                          </h3>
                        </div>
                        <p className="text-[10px] sm:text-xs leading-relaxed mt-1 font-medium text-slate-300">
                          {detail.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between relative z-10">
                      <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${
                        isActive ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {detail.statistic}
                      </span>
                      {isActive ? (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                        </span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-white/20" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Sub-Category Neumorphic Tabs */}
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-3 text-center sm:text-left">Klasifikasi Indikator</p>
                  <div className="relative flex p-1.5 bg-[#12132e] rounded-full mb-4 border border-indigo-900/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] w-full">
                    <motion.div
                      className={`absolute top-1.5 bottom-1.5 rounded-full transition-colors duration-500 border ${
                        subKategori === "Standar"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[-2px_-2px_8px_rgba(140,165,255,0.2),4px_6px_16px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.3)] border-white/20"
                          : subKategori === "Transmisi"
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[-2px_-2px_8px_rgba(140,165,255,0.2),4px_6px_16px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.3)] border-white/20"
                            : "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-[-2px_-2px_8px_rgba(140,165,255,0.2),4px_6px_16px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.3)] border-white/20"
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
                          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-full transition-colors relative z-10 whitespace-nowrap shrink-0 overflow-hidden text-ellipsis ${
                            isSubActive
                              ? "text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-300 ${isSubActive ? "text-cyan-300" : "text-slate-400"}`}
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
          <motion.div
            key={`detail-${selectedIndicator}`}
            id="report-top-anchor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onAnimationStart={forceScrollToTop}
            onAnimationComplete={forceScrollToTop}
            className="space-y-6"
          >
            
            {/* Header Detail View */}
            <div
              id="report-detail-header"
              className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative"
            >
              <div className="flex items-center gap-4 relative z-10 w-full lg:w-auto shrink-0">
                <button onClick={handleBack} className="p-3 bg-[#12132e] border border-white/10 rounded-2xl hover:bg-[#20224a] transition-colors text-slate-300 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.06)]">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient uppercase leading-none">
                    {selectedData?.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-2 font-medium text-[11px] text-slate-400 uppercase tracking-widest">
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
              
              <div className="flex flex-wrap justify-center lg:justify-end items-center gap-3 relative z-10 w-full lg:w-auto mt-2 lg:mt-0">
                {/* Filter Periode - 3D Tactile Neumorphic Container */}
                <div className="relative group w-full sm:w-auto">
                  <div className="relative bg-[#18193b] rounded-[24px] p-2.5 sm:p-3 border border-[#2b2d56] transition-all duration-300 transform-gpu overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)]">
                    {/* Top Bevel Highlight */}
                    <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                    <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2.5 relative z-10">
                      {/* Neumorphic Capsule Badge */}
                      <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#12132e] border border-white/10 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.06)]">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                          PERIODE
                        </span>
                      </div>

                      {/* Tipe Periode - Recessed Neumorphic Well */}
                      <div className="relative">
                        <select 
                          value={periode} 
                          onChange={(e) => setPeriode(e.target.value)}
                          className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-xl pl-3.5 pr-8 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] capitalize"
                        >
                          <option value="Bulanan" className="bg-[#18193b] text-white">Bulanan</option>
                          <option value="Triwulan" className="bg-[#18193b] text-white">Triwulan</option>
                          <option value="Semester" className="bg-[#18193b] text-white">Semester</option>
                          <option value="Tahunan" className="bg-[#18193b] text-white">Tahunan</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {periode === 'Bulanan' && (
                        <div className="relative">
                          <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-xl pl-3.5 pr-8 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                          >
                            {MONTHS_SHORT.map((m, i) => (
                              <option key={m} value={i} className="bg-[#18193b] text-white">{m}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}

                      {periode === 'Triwulan' && (
                        <div className="relative">
                          <select 
                            value={selectedQuarter} 
                            onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                            className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-xl pl-3.5 pr-8 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                          >
                            <option value={0} className="bg-[#18193b] text-white">TW 1 (Jan-Mar)</option>
                            <option value={1} className="bg-[#18193b] text-white">TW 2 (Apr-Jun)</option>
                            <option value={2} className="bg-[#18193b] text-white">TW 3 (Jul-Sep)</option>
                            <option value={3} className="bg-[#18193b] text-white">TW 4 (Okt-Des)</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}

                      {periode === 'Semester' && (
                        <div className="relative">
                          <select 
                            value={selectedSemester} 
                            onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                            className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-xl pl-3.5 pr-8 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                          >
                            <option value={0} className="bg-[#18193b] text-white">SM 1 (Jan-Jun)</option>
                            <option value={1} className="bg-[#18193b] text-white">SM 2 (Jul-Des)</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}

                      {/* Tahun - Recessed Neumorphic Well */}
                      <div className="relative">
                        <select 
                          value={selectedYear} 
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-xl pl-3.5 pr-8 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                        >
                          <option value={2026} className="bg-[#18193b] text-white">2026</option>
                          <option value={2025} className="bg-[#18193b] text-white">2025</option>
                          <option value={2024} className="bg-[#18193b] text-white">2024</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Unit Filter - Styled Matching Neumorphic Container */}
                <div className="relative group">
                  <div className="relative bg-[#18193b] rounded-[24px] p-2.5 sm:p-3 border border-[#2b2d56] transition-all duration-300 transform-gpu overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 inset-x-4 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex items-center">
                      <select 
                        value={selectedUnit} 
                        onChange={(e) => setSelectedUnit(e.target.value)}
                        className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-xl pl-3.5 pr-8 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                      >
                        <option value="Semua Unit" className="bg-[#18193b] text-white">Semua Unit</option>
                        {['IGD', 'ICU', 'IBS', 'Rawat Jalan', 'Ranap Aisyah', 'Ranap Fatimah', 'Ranap Khadijah', 'Ranap Usman', 'Radiologi', 'Laboratorium', 'Pantry', 'Emergency Kebidanan'].map(u => (
                          <option key={u} value={u} className="bg-[#18193b] text-white">{u}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {selectedIndicator === 'dekontaminasi_alat' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.dispatchEvent(new Event('edit-dekontaminasi'))}
                      className="p-2.5 bg-[#12132e] hover:bg-[#22244e] text-blue-400 rounded-xl border border-indigo-900/40 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] transition-colors"
                      title="Edit Laporan"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => window.dispatchEvent(new Event('delete-dekontaminasi'))}
                      className="p-2.5 bg-[#12132e] hover:bg-rose-950/40 text-rose-400 rounded-xl border border-rose-900/40 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] transition-colors"
                      title="Hapus Laporan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => window.dispatchEvent(new Event('print-dekontaminasi'))}
                      className="p-2.5 bg-[#12132e] hover:bg-emerald-950/40 text-emerald-400 rounded-xl border border-emerald-900/40 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] transition-colors"
                      title="Print PDF"
                    >
                      <FileText className="w-4 h-4" />
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

import { ReactElement, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { 
  BarChart2, TrendingUp, Filter, Download, Activity, Users, ClipboardCheck, 
  AlertTriangle, CheckCircle2, Clock, ShieldCheck, Shield, FileText, 
  FileSpreadsheet, ImageIcon, Calendar, Award, AlertCircle, UserCheck, 
  RefreshCw, Building2, Layers, ChevronDown, Check, HelpCircle, Droplets, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Cell, LabelList
} from '@/components/ChartComponents';

// --- CHART TYPE TOGGLE COMPONENT ---
const ChartTypeToggle = ({ 
  type, 
  onChange, 
  colorScheme = 'emerald' 
}: { 
  type: 'line' | 'bar'; 
  onChange: (t: 'line' | 'bar') => void;
  colorScheme?: 'emerald' | 'sky' | 'purple';
}) => {
  const activeBg = {
    emerald: 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-[-2px_-2px_6px_rgba(255,255,255,0.25),3px_3px_8px_rgba(0,0,0,0.5),inset_1px_1px_1.5px_rgba(255,255,255,0.4)]',
    sky: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[-2px_-2px_6px_rgba(255,255,255,0.25),3px_3px_8px_rgba(0,0,0,0.5),inset_1px_1px_1.5px_rgba(255,255,255,0.4)]',
    purple: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[-2px_-2px_6px_rgba(255,255,255,0.25),3px_3px_8px_rgba(0,0,0,0.5),inset_1px_1px_1.5px_rgba(255,255,255,0.4)]',
  }[colorScheme];

  return (
    <div className="flex items-center bg-[#12132e] p-1.5 rounded-2xl border border-indigo-900/40 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
      <button
        type="button"
        onClick={() => onChange('line')}
        title="Grafik Line"
        aria-label="Grafik Line"
        className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
          type === 'line' ? activeBg : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <TrendingUp className="w-3.5 h-3.5" /> Line
      </button>
      <button
        type="button"
        onClick={() => onChange('bar')}
        title="Grafik Batang"
        aria-label="Grafik Batang"
        className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
          type === 'bar' ? activeBg : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <BarChart2 className="w-3.5 h-3.5" /> Bar
      </button>
    </div>
  );
};

// --- HELPER CONSTANTS ---
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const QUARTER_NAMES = [
  'Triwulan I (Jan - Mar)',
  'Triwulan II (Apr - Jun)',
  'Triwulan III (Jul - Sep)',
  'Triwulan IV (Okt - Des)'
];

const SEMESTER_NAMES = [
  'Semester I (Jan - Jun)',
  'Semester II (Jul - Des)'
];

const PROFESI_OPTIONS = [
  'Perawat / Bidan',
  'Dokter',
  'Radiografer',
  'Analis Laboratorium',
  'Nakes Lainnya'
];

// Profession Group Classifier
function getProfessionGroup(profesiStr: string | null | undefined): 'Perawat / Bidan' | 'Dokter' | 'Radiografer' | 'Analis Laboratorium' | 'Nakes Lainnya' {
  if (!profesiStr) return 'Nakes Lainnya';
  const p = profesiStr.toLowerCase().trim();
  if (p.includes('radiografer') || p.includes('radiologi')) {
    return 'Radiografer';
  }
  if (p.includes('analis') || p.includes('laboratorium') || p.includes('laboran') || p.includes('analis lab')) {
    return 'Analis Laboratorium';
  }
  if (p.includes('perawat') || p.includes('bidan') || p.includes('nurse') || p.includes('midwife')) {
    return 'Perawat / Bidan';
  }
  if (p.includes('dokter') || p.includes('dr.') || p.includes('spesialis') || p.includes('dpjp') || p.includes('residen')) {
    return 'Dokter';
  }
  return 'Nakes Lainnya';
}

const getProfCardTheme = (profName: string) => {
  switch (profName) {
    case 'Perawat / Bidan':
      return {
        text: 'text-emerald-400',
        border: 'hover:border-emerald-500/40',
        glow: 'drop-shadow-[0_2px_6px_rgba(16,185,129,0.4)]',
        gradient: 'from-emerald-600 via-teal-500 to-emerald-400',
        shadow: 'shadow-[0_0_10px_rgba(52,211,153,0.5)]',
        badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
      };
    case 'Dokter':
      return {
        text: 'text-blue-400',
        border: 'hover:border-blue-500/40',
        glow: 'drop-shadow-[0_2px_6px_rgba(59,130,246,0.4)]',
        gradient: 'from-blue-600 via-indigo-500 to-blue-400',
        shadow: 'shadow-[0_0_10px_rgba(96,165,250,0.5)]',
        badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30'
      };
    case 'Radiografer':
      return {
        text: 'text-purple-400',
        border: 'hover:border-purple-500/40',
        glow: 'drop-shadow-[0_2px_6px_rgba(168,85,247,0.4)]',
        gradient: 'from-purple-600 via-violet-500 to-purple-400',
        shadow: 'shadow-[0_0_10px_rgba(192,132,252,0.5)]',
        badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30'
      };
    case 'Analis Laboratorium':
      return {
        text: 'text-cyan-400',
        border: 'hover:border-cyan-500/40',
        glow: 'drop-shadow-[0_2px_6px_rgba(6,182,212,0.4)]',
        gradient: 'from-cyan-600 via-teal-500 to-cyan-400',
        shadow: 'shadow-[0_0_10px_rgba(34,211,238,0.5)]',
        badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
      };
    default:
      return {
        text: 'text-amber-400',
        border: 'hover:border-amber-500/40',
        glow: 'drop-shadow-[0_2px_6px_rgba(245,158,11,0.4)]',
        gradient: 'from-amber-600 via-orange-500 to-amber-400',
        shadow: 'shadow-[0_0_10px_rgba(251,191,36,0.5)]',
        badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
      };
  }
};

// Custom Glassmorphism / Neumorphic Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#18193b] backdrop-blur-xl border border-[#2b2d56] p-4 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.8)] text-xs space-y-2 text-white z-50 min-w-[210px]">
        <div className="font-black border-b border-indigo-900/40 pb-1.5 text-cyan-300 flex items-center justify-between uppercase tracking-wider">
          <span>{label}</span>
          <span className="text-[9px] text-slate-400 font-bold">Realtime</span>
        </div>
        <div className="space-y-1.5 pt-1">
          {payload.map((entry: any, index: number) => {
            const extra = entry.payload;
            return (
              <div key={`item-${index}`} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-4 font-bold">
                  <span className="flex items-center gap-1.5 text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name}:
                  </span>
                  <span className="font-mono font-black text-white">
                    {typeof entry.value === 'number' ? `${entry.value}%` : entry.value}
                  </span>
                </div>
                {extra && extra.details && extra.details[entry.name] && (
                  <div className="pl-3 text-[10px] text-slate-300 grid grid-cols-2 gap-x-2 gap-y-0.5 bg-[#12132e] p-2 rounded-xl border border-indigo-900/30">
                    <span>Observasi: <strong className="text-white font-mono">{extra.details[entry.name].observasi || 0}</strong></span>
                    <span>Patuh: <strong className="text-emerald-400 font-mono">{extra.details[entry.name].patuh || 0}</strong></span>
                    <span>T.Patuh: <strong className="text-rose-400 font-mono">{extra.details[entry.name].tidakPatuh || 0}</strong></span>
                    <span>N/A: <strong className="text-slate-400 font-mono">{extra.details[entry.name].na || 0}</strong></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for HAIs
const HaisTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#18193b] backdrop-blur-xl border border-[#2b2d56] p-4 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.8)] text-xs space-y-2 text-white z-50 min-w-[200px]">
        <div className="font-black border-b border-indigo-900/40 pb-1.5 text-purple-300 uppercase tracking-wider">
          {label}
        </div>
        <div className="space-y-1.5 pt-1">
          {payload.map((entry: any, index: number) => (
            <div key={`hais-${index}`} className="flex items-center justify-between gap-4 font-bold">
              <span className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-mono font-black text-white">{entry.value} Kasus</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Generic PPI Audits
const GenericTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const data = item.payload;
    return (
      <div className="bg-[#18193b] backdrop-blur-xl border border-[#2b2d56] p-4 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.8)] text-xs space-y-2 text-white z-50 min-w-[210px]">
        <div className="font-black border-b border-indigo-900/40 pb-1.5 text-cyan-300 flex items-center justify-between uppercase tracking-wider">
          <span>{label}</span>
          <span className="text-[9px] text-slate-400 font-bold">Kepatuhan</span>
        </div>
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between gap-4 font-bold">
            <span className="text-slate-300">Capaian:</span>
            <span className="font-mono font-black text-cyan-400 text-sm">
              {typeof item.value === 'number' ? `${item.value}%` : item.value}
            </span>
          </div>
          {data && data.Target !== undefined && (
            <div className="flex items-center justify-between gap-4 text-slate-400 font-medium">
              <span>Target Mutu:</span>
              <span className="font-mono font-bold text-amber-400">{data.Target}%</span>
            </div>
          )}
          {data && data.Observasi !== undefined && (
            <div className="flex items-center justify-between gap-4 text-slate-400 font-medium">
              <span>Sesi Audit:</span>
              <span className="font-mono font-bold text-white">{data.Observasi} Sesi</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// All PPI Indicators Definition and Targets
export const ALL_PPI_INDICATORS: { id: string; title: string; category: string; target: number }[] = [
  // Kewaspadaan Isolasi - Standar
  { id: 'dekontaminasi_alat', title: 'Dekontaminasi Alat', category: 'Kewaspadaan Standar', target: 100 },
  { id: 'pengendalian_lingkungan', title: 'Pengendalian Lingkungan', category: 'Kewaspadaan Standar', target: 100 },
  { id: 'pengelolaan_limbah_medis', title: 'Pengelolaan Limbah Medis', category: 'Kewaspadaan Standar', target: 100 },
  { id: 'pengelolaan_limbah_tajam', title: 'Pengelolaan Limbah Tajam', category: 'Kewaspadaan Standar', target: 100 },
  { id: 'penatalaksanaan_linen', title: 'Penatalaksanaan Linen', category: 'Kewaspadaan Standar', target: 100 },
  { id: 'perlindungan_petugas', title: 'Perlindungan Petugas', category: 'Kewaspadaan Standar', target: 100 },
  { id: 'penempatan_pasien', title: 'Penempatan Pasien', category: 'Kewaspadaan Standar', target: 100 },
  { id: 'etika_batuk', title: 'Etika Batuk', category: 'Kewaspadaan Standar', target: 100 },
  { id: 'penyuntikan_aman', title: 'Penyuntikan Aman', category: 'Kewaspadaan Standar', target: 100 },

  // Kewaspadaan Isolasi - Transmisi
  { id: 'monitoring_ppi_ruang_isolasi', title: 'Ruang Isolasi', category: 'Kewaspadaan Transmisi', target: 100 },
  { id: 'ppi_ruang_isolasi', title: 'PPI di Ruang Isolasi', category: 'Kewaspadaan Transmisi', target: 100 },
  { id: 'monitoring_airborne', title: 'Penempatan Pasien Airborne', category: 'Kewaspadaan Transmisi', target: 100 },
  { id: 'monitoring_immuno', title: 'Penempatan Pasien Immunocompromised', category: 'Kewaspadaan Transmisi', target: 100 },

  // Monitoring Fasilitas & Penunjang
  { id: 'monitoring_fasilitas_hand_hygiene', title: 'Fasilitas Hand Hygiene', category: 'Monitoring Fasilitas', target: 100 },
  { id: 'monitoring_fasilitas_apd', title: 'Fasilitas APD', category: 'Monitoring Fasilitas', target: 100 },
  { id: 'monitoring_ibs', title: 'Ruangan IBS', category: 'Monitoring Fasilitas', target: 100 },
  { id: 'monitoring_cssd', title: 'CSSD', category: 'Monitoring Fasilitas', target: 100 },
  { id: 'monitoring_laboratorium', title: 'Laboratorium', category: 'Monitoring Fasilitas', target: 100 },
  { id: 'monitoring_radiologi', title: 'Radiologi', category: 'Monitoring Fasilitas', target: 100 },
  { id: 'monitoring_farmasi', title: 'Farmasi', category: 'Monitoring Fasilitas', target: 100 },
  { id: 'monitoring_gizi', title: 'Gizi & Dapur', category: 'Monitoring Fasilitas', target: 100 },
  { id: 'monitoring_jenazah', title: 'Kamar Jenazah', category: 'Monitoring Fasilitas', target: 100 },
  { id: 'monitoring_ambulance', title: 'Ambulance', category: 'Monitoring Fasilitas', target: 100 },
  { id: 'monitoring_tps', title: 'TPS Limbah', category: 'Monitoring Fasilitas', target: 100 },
  { id: 'monitoring_tunggu', title: 'Ruang Tunggu', category: 'Monitoring Fasilitas', target: 100 },

  // Monitoring Bundles
  { id: 'iadp', title: 'Bundles PLABSI / IADP', category: 'Monitoring Bundles', target: 100 },
  { id: 'cauti', title: 'Bundles CAUTI / ISK', category: 'Monitoring Bundles', target: 100 },
  { id: 'ido_b', title: 'Bundles IDO', category: 'Monitoring Bundles', target: 100 },
  { id: 'vap_b', title: 'Bundles VAP', category: 'Monitoring Bundles', target: 100 },

  // Diklat PPI
  { id: 'diklat_ppi', title: 'Pendidikan & Pelatihan Staf', category: 'Pendidikan & Pelatihan', target: 100 }
];

function normalizeGenericIndikatorId(id: string | null | undefined): string {
  if (!id) return '';
  const clean = id.toLowerCase().trim();
  if (clean === 'audit_dekontaminasi_alat') return 'dekontaminasi_alat';
  if (clean === 'audit_pengendalian_lingkungan') return 'pengendalian_lingkungan';
  if (clean === 'audit_pengelolaan_limbah_medis') return 'pengelolaan_limbah_medis';
  if (clean === 'audit_pengelolaan_limbah_tajam') return 'pengelolaan_limbah_tajam';
  if (clean === 'audit_penatalaksanaan_linen') return 'penatalaksanaan_linen';
  if (clean === 'audit_perlindungan_petugas') return 'perlindungan_petugas';
  if (clean === 'audit_penempatan_pasien') return 'penempatan_pasien';
  if (clean === 'audit_etika_batuk') return 'etika_batuk';
  if (clean === 'audit_penyuntikan_aman') return 'penyuntikan_aman';
  if (clean === 'audit_ruang_isolasi') return 'monitoring_ppi_ruang_isolasi';
  if (clean === 'fasilitas_hand_hygiene') return 'monitoring_fasilitas_hand_hygiene';
  if (clean === 'fasilitas_apd') return 'monitoring_fasilitas_apd';
  if (clean === 'diklat') return 'diklat_ppi';
  return clean;
}

// Global in-memory cache for instant zero-delay navigation without loading flickers
let cachedSessions: any[] = [];
let cachedHH: any[] = [];
let cachedApd: any[] = [];

export default function AnalyticsPage() {
  // Raw Database States initialized from memory cache
  const [rawSessions, setRawSessions] = useState<any[]>(cachedSessions);
  const [rawHH, setRawHH] = useState<any[]>(cachedHH);
  const [rawApd, setRawApd] = useState<any[]>(cachedApd);

  // Period Filters
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [periodeType, setPeriodeType] = useState<'Bulanan' | 'Triwulan' | 'Semester' | 'Tahunan'>('Bulanan');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.floor(currentMonth / 3) + 1);
  const [selectedSemester, setSelectedSemester] = useState<number>(currentMonth < 6 ? 1 : 2);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Sub Filters
  const [selectedUnit, setSelectedUnit] = useState<string>('Semua Unit');
  const [selectedProfesiGroups, setSelectedProfesiGroups] = useState<string[]>([]);
  const [isProfesiDropdownOpen, setIsProfesiDropdownOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const profesiDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and listen for Escape key when popup is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isProfesiDropdownOpen) {
        setIsProfesiDropdownOpen(false);
      }
    };
    if (isProfesiDropdownOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfesiDropdownOpen]);

  // Toggle single profession selection
  const toggleProfesiGroup = (profName: string) => {
    setSelectedProfesiGroups(prev => {
      if (prev.length === 0) {
        return [profName];
      }
      if (prev.includes(profName)) {
        const next = prev.filter(p => p !== profName);
        return next;
      } else {
        const next = [...prev, profName];
        if (next.length === PROFESI_OPTIONS.length) {
          return [];
        }
        return next;
      }
    });
  };

  // Check if a profession is currently active
  const isProfesiActive = useCallback((profName: string) => {
    if (selectedProfesiGroups.length === 0) return true;
    return selectedProfesiGroups.includes(profName);
  }, [selectedProfesiGroups]);

  // Auto-detect latest active month if current selected month has 0 data on initial load
  const hasAdjustedInitialMonth = useRef(false);
  useEffect(() => {
    if (!hasAdjustedInitialMonth.current && rawSessions.length > 0) {
      const currentMonthHasData = rawSessions.some(s => {
        if (!s.tanggal_waktu) return false;
        const d = new Date(s.tanggal_waktu);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });
      if (!currentMonthHasData) {
        const thisYearSessions = rawSessions.filter(s => {
          if (!s.tanggal_waktu) return false;
          return new Date(s.tanggal_waktu).getFullYear() === currentYear;
        });
        if (thisYearSessions.length > 0) {
          const latestD = new Date(thisYearSessions[thisYearSessions.length - 1].tanggal_waktu);
          setSelectedMonth(latestD.getMonth());
          setSelectedQuarter(Math.floor(latestD.getMonth() / 3) + 1);
          setSelectedSemester(latestD.getMonth() < 6 ? 1 : 2);
        }
      }
      hasAdjustedInitialMonth.current = true;
    }
  }, [rawSessions, currentYear, currentMonth]);

  // Chart Type Display States (Grafik Line vs Grafik Batang)
  const [hhChartType, setHhChartType] = useState<'line' | 'bar'>('line');
  const [apdChartType, setApdChartType] = useState<'line' | 'bar'>('line');
  const [haisChartType, setHaisChartType] = useState<'line' | 'bar'>('line');
  const [haisRoomChartType, setHaisRoomChartType] = useState<'line' | 'bar'>('bar');
  const [selectedGenericIndicator, setSelectedGenericIndicator] = useState<string>('dekontaminasi_alat');
  const [genericChartType, setGenericChartType] = useState<'line' | 'bar'>('line');
  const [genericUnitChartType, setGenericUnitChartType] = useState<'line' | 'bar'>('bar');

  // Fetch Data from Supabase in the background
  const fetchData = useCallback(async () => {
    try {
      const [sessionsRes, hhRes, apdRes] = await Promise.all([
        supabase.from('audit_sessions').select('*').order('tanggal_waktu', { ascending: true }),
        supabase.from('audit_hand_hygiene').select('*').order('start_time', { ascending: true }),
        supabase.from('audit_apd').select('*').order('tanggal_waktu', { ascending: true })
      ]);

      const sData = sessionsRes.data || [];
      const hData = hhRes.data || [];
      const aData = apdRes.data || [];

      cachedSessions = sData;
      cachedHH = hData;
      cachedApd = aData;

      setRawSessions(sData);
      setRawHH(hData);
      setRawApd(aData);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    }
  }, []);

  // Supabase Realtime Subscriptions
  useEffect(() => {
    fetchData();

    const chSessions = supabase
      .channel('realtime_grafik_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_sessions' }, () => fetchData())
      .subscribe();

    const chHH = supabase
      .channel('realtime_grafik_hh')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_hand_hygiene' }, () => fetchData())
      .subscribe();

    const chApd = supabase
      .channel('realtime_grafik_apd')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_apd' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(chSessions);
      supabase.removeChannel(chHH);
      supabase.removeChannel(chApd);
    };
  }, [fetchData]);

  // Extract All Available Unique Units dynamically
  const availableUnits = useMemo(() => {
    const unitsSet = new Set<string>();
    rawSessions.forEach(s => s.unit && unitsSet.add(s.unit.trim()));
    rawHH.forEach(s => s.unit && unitsSet.add(s.unit.trim()));
    rawApd.forEach(s => s.unit && unitsSet.add(s.unit.trim()));
    return ['Semua Unit', ...Array.from(unitsSet).sort()];
  }, [rawSessions, rawHH, rawApd]);

  // Helper Date Matcher
  const matchesPeriod = useCallback((dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    if (d.getFullYear() !== selectedYear) return false;

    const m = d.getMonth();
    if (periodeType === 'Bulanan') {
      return m === selectedMonth;
    } else if (periodeType === 'Triwulan') {
      if (selectedQuarter === 1) return m >= 0 && m <= 2;
      if (selectedQuarter === 2) return m >= 3 && m <= 5;
      if (selectedQuarter === 3) return m >= 6 && m <= 8;
      if (selectedQuarter === 4) return m >= 9 && m <= 11;
    } else if (periodeType === 'Semester') {
      if (selectedSemester === 1) return m >= 0 && m <= 5;
      if (selectedSemester === 2) return m >= 6 && m <= 11;
    } else if (periodeType === 'Tahunan') {
      return true;
    }
    return true;
  }, [periodeType, selectedMonth, selectedQuarter, selectedSemester, selectedYear]);

  // Normalize & Process Hand Hygiene Data
  const normalizedHH = useMemo(() => {
    const records: any[] = [];
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();

    // 1. From audit_sessions
    const hhSessions = rawSessions.filter(s => s.indikator_id === 'audit_hand_hygiene');
    for (const s of hhSessions) {
      if (!s.id || seenIds.has(s.id)) continue;
      if (!matchesPeriod(s.tanggal_waktu)) continue;
      if (selectedUnit !== 'Semua Unit' && (s.unit || '').trim() !== selectedUnit) continue;

      const profGroup = getProfessionGroup(s.profesi);
      if (selectedProfesiGroups.length > 0 && !selectedProfesiGroups.includes(profGroup)) continue;

      seenIds.add(s.id);
      const timeKey = s.tanggal_waktu ? new Date(s.tanggal_waktu).toISOString().substring(0, 16) : '';
      if (s.observer && s.unit && timeKey) {
        seenKeys.add(`${s.observer.toLowerCase().trim()}_${s.unit.toLowerCase().trim()}_${timeKey}`);
      }

      const patuh = Number(s.jumlah_patuh) || 0;
      const dinilai = Number(s.jumlah_dinilai) || 0;
      const tidakPatuh = Math.max(0, dinilai - patuh);
      const na = Number(s.data_indikator?.na_count) || 0;

      records.push({
        id: s.id,
        date: new Date(s.tanggal_waktu),
        unit: s.unit || '-',
        observer: s.observer || '-',
        profesi: s.profesi || '-',
        profGroup,
        patuh,
        tidakPatuh,
        na,
        dinilai
      });
    }

    // 2. From audit_hand_hygiene
    for (const item of rawHH) {
      const dt = item.start_time || item.created_at || item.tanggal_waktu;
      if (!item.id || seenIds.has(item.id)) continue;
      if (!matchesPeriod(dt)) continue;
      if (selectedUnit !== 'Semua Unit' && (item.unit || '').trim() !== selectedUnit) continue;

      const profGroup = getProfessionGroup(item.profesi);
      if (selectedProfesiGroups.length > 0 && !selectedProfesiGroups.includes(profGroup)) continue;

      const timeKey = dt ? new Date(dt).toISOString().substring(0, 16) : '';
      const key = `${(item.observer || '').toLowerCase().trim()}_${(item.unit || '').toLowerCase().trim()}_${timeKey}`;
      if (item.observer && item.unit && timeKey && seenKeys.has(key)) continue;

      seenIds.add(item.id);
      if (item.observer && item.unit && timeKey) seenKeys.add(key);

      // Moments evaluation
      let patuh = Number(item.patuh) || 0;
      let dinilai = Number(item.peluang) || Number(item.jumlah_dinilai) || 0;
      let tidakPatuh = 0;
      let na = 0;

      if (!dinilai && (item.m1 !== undefined || item.m2 !== undefined)) {
        const moments = [item.m1, item.m2, item.m3, item.m4, item.m5];
        moments.forEach(m => {
          if (!m || m === 'N/A' || m === 'TIDAK_DILAKUKAN') {
            na++;
          } else if (m === 'HR' || m === 'HW' || m === 'Selesai' || m === 'Patuh' || m === true) {
            patuh++;
            dinilai++;
          } else {
            tidakPatuh++;
            dinilai++;
          }
        });
      } else {
        tidakPatuh = Math.max(0, dinilai - patuh);
      }

      records.push({
        id: item.id,
        date: new Date(dt),
        unit: item.unit || '-',
        observer: item.observer || '-',
        profesi: item.profesi || '-',
        profGroup,
        patuh,
        tidakPatuh,
        na,
        dinilai
      });
    }

    return records;
  }, [rawSessions, rawHH, matchesPeriod, selectedUnit, selectedProfesiGroups]);

  // Normalize & Process APD Data
  const normalizedApd = useMemo(() => {
    const records: any[] = [];
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();

    // 1. From audit_sessions
    const apdSessions = rawSessions.filter(s => s.indikator_id === 'audit_apd');
    for (const s of apdSessions) {
      if (!s.id || seenIds.has(s.id)) continue;
      if (!matchesPeriod(s.tanggal_waktu)) continue;
      if (selectedUnit !== 'Semua Unit' && (s.unit || '').trim() !== selectedUnit) continue;

      const profGroup = getProfessionGroup(s.profesi);
      if (selectedProfesiGroups.length > 0 && !selectedProfesiGroups.includes(profGroup)) continue;

      seenIds.add(s.id);
      const timeKey = s.tanggal_waktu ? new Date(s.tanggal_waktu).toISOString().substring(0, 16) : '';
      if (s.observer && s.unit && timeKey) {
        seenKeys.add(`${s.observer.toLowerCase().trim()}_${s.unit.toLowerCase().trim()}_${timeKey}`);
      }

      const patuh = Number(s.jumlah_patuh) || 0;
      const dinilai = Number(s.jumlah_dinilai) || 0;
      const tidakPatuh = Math.max(0, dinilai - patuh);
      const na = Number(s.data_indikator?.na_count) || 0;

      records.push({
        id: s.id,
        date: new Date(s.tanggal_waktu),
        unit: s.unit || '-',
        observer: s.observer || '-',
        profesi: s.profesi || '-',
        profGroup,
        patuh,
        tidakPatuh,
        na,
        dinilai
      });
    }

    // 2. From audit_apd
    for (const item of rawApd) {
      const dt = item.tanggal_waktu || item.created_at;
      if (!item.id || seenIds.has(item.id)) continue;
      if (!matchesPeriod(dt)) continue;
      if (selectedUnit !== 'Semua Unit' && (item.unit || '').trim() !== selectedUnit) continue;

      const profGroup = getProfessionGroup(item.profesi);
      if (selectedProfesiGroups.length > 0 && !selectedProfesiGroups.includes(profGroup)) continue;

      const timeKey = dt ? new Date(dt).toISOString().substring(0, 16) : '';
      const key = `${(item.observer || '').toLowerCase().trim()}_${(item.unit || '').toLowerCase().trim()}_${timeKey}`;
      if (item.observer && item.unit && timeKey && seenKeys.has(key)) continue;

      seenIds.add(item.id);
      if (item.observer && item.unit && timeKey) seenKeys.add(key);

      let patuh = Number(item.jumlah_apd_patuh) || Number(item.jumlah_patuh) || 0;
      let dinilai = Number(item.jumlah_apd_wajib) || Number(item.jumlah_dinilai) || 0;
      let tidakPatuh = 0;
      let na = 0;

      if (!dinilai && (item.masker !== undefined || item.sarung_tangan !== undefined)) {
        const apdItems = [
          item.masker, item.sarung_tangan, item.penutup_kepala, 
          item.apron, item.goggle, item.sepatu_boot, item.gaun_pelindung
        ];
        apdItems.forEach(a => {
          if (!a || a === 'N/A' || a === 'TIDAK_DIBUTUHKAN') {
            na++;
          } else if (a === 'Patuh' || a === 'Ya' || a === true) {
            patuh++;
            dinilai++;
          } else if (a === 'Tidak Patuh' || a === 'Tidak' || a === false) {
            tidakPatuh++;
            dinilai++;
          }
        });
      } else {
        tidakPatuh = Math.max(0, dinilai - patuh);
      }

      records.push({
        id: item.id,
        date: new Date(dt),
        unit: item.unit || '-',
        observer: item.observer || '-',
        profesi: item.profesi || '-',
        profGroup,
        patuh,
        tidakPatuh,
        na,
        dinilai
      });
    }

    return records;
  }, [rawSessions, rawApd, matchesPeriod, selectedUnit, selectedProfesiGroups]);

  // Normalize & Process HAIs Data
  const normalizedHais = useMemo(() => {
    const haisSessions = rawSessions.filter(s => 
      s.kategori === 'Surveilans HAIs' || 
      (s.indikator_id && s.indikator_id.startsWith('surveilans'))
    );

    const records: any[] = [];
    for (const s of haisSessions) {
      if (!matchesPeriod(s.tanggal_waktu)) continue;
      if (selectedUnit !== 'Semua Unit' && (s.unit || '').trim() !== selectedUnit) continue;

      const indId = (s.indikator_id || '').toLowerCase();
      const nama = (s.nama_indikator || '').toUpperCase();

      let haisType = 'Lainnya';
      if (indId.includes('phlebitis') || nama.includes('PHLEBITIS')) haisType = 'Phlebitis';
      else if (indId.includes('isk') || indId.includes('cauti') || nama.includes('ISK') || nama.includes('CAUTI')) haisType = 'CAUTI / ISK';
      else if (indId.includes('ido') || nama.includes('IDO')) haisType = 'IDO';
      else if (indId.includes('vap') || nama.includes('VAP')) haisType = 'VAP';
      else if (indId.includes('dekubitus') || nama.includes('DEKUBITUS')) haisType = 'Dekubitus';

      const cases = Number(s.jumlah_patuh) || 0; // In HAIs, jumlah_patuh represents incident count
      const denominator = Number(s.jumlah_dinilai) || 0;

      records.push({
        id: s.id,
        date: new Date(s.tanggal_waktu),
        unit: s.unit || 'Lainnya',
        haisType,
        cases,
        denominator
      });
    }

    return records;
  }, [rawSessions, matchesPeriod, selectedUnit]);

  // Normalize & Process Generic Audit Sessions (all indicators other than HH, APD, and HAIs)
  const normalizedGenericSessions = useMemo(() => {
    const records: any[] = [];
    for (const s of rawSessions) {
      if (!s.id) continue;
      const indId = (s.indikator_id || '').toLowerCase().trim();
      // Skip HH and APD (they have dedicated sections 1 & 2)
      if (indId === 'audit_hand_hygiene' || indId === 'audit_apd') continue;
      // Skip HAIs (dedicated section 3)
      if (
        s.kategori === 'Surveilans HAIs' ||
        indId.startsWith('surveilans') ||
        ['isk', 'phlebitis', 'vap', 'ido', 'decubitus'].includes(indId)
      ) {
        continue;
      }

      if (!matchesPeriod(s.tanggal_waktu)) continue;
      if (selectedUnit !== 'Semua Unit' && (s.unit || '').trim() !== selectedUnit) continue;

      const normalizedId = normalizeGenericIndikatorId(indId);
      const patuh = Number(s.jumlah_patuh) || 0;
      const dinilai = Number(s.jumlah_dinilai) || 0;
      let persentase = 0;
      if (s.persentase !== null && s.persentase !== undefined && !isNaN(Number(s.persentase))) {
        persentase = Number(s.persentase);
      } else if (dinilai > 0) {
        persentase = Math.round((patuh / dinilai) * 100);
      }

      records.push({
        id: s.id,
        indikator_id: normalizedId,
        raw_indikator_id: indId,
        nama_indikator: s.nama_indikator || normalizedId,
        unit: (s.unit || 'Lainnya').trim(),
        date: new Date(s.tanggal_waktu),
        persentase,
        patuh,
        dinilai,
        observer: s.observer || '-'
      });
    }
    return records;
  }, [rawSessions, matchesPeriod, selectedUnit]);

  // Indicator counts for badge display in dropdown
  const genericIndicatorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    normalizedGenericSessions.forEach(s => {
      counts[s.indikator_id] = (counts[s.indikator_id] || 0) + 1;
    });
    return counts;
  }, [normalizedGenericSessions]);

  // Active indicator definition
  const activeIndicatorDef = useMemo(() => {
    return ALL_PPI_INDICATORS.find(i => i.id === selectedGenericIndicator) || {
      id: selectedGenericIndicator,
      title: selectedGenericIndicator.replace(/_/g, ' ').toUpperCase(),
      category: 'Indikator PPI',
      target: 100
    };
  }, [selectedGenericIndicator]);

  // Filtered records for the selected generic indicator
  const selectedGenericData = useMemo(() => {
    return normalizedGenericSessions.filter(r => r.indikator_id === selectedGenericIndicator);
  }, [normalizedGenericSessions, selectedGenericIndicator]);

  // KPIs for the selected generic indicator
  const selectedGenericStats = useMemo(() => {
    if (selectedGenericData.length === 0) {
      return { avgPct: null, totalObs: 0, totalPatuh: 0, totalDinilai: 0 };
    }
    let sumPct = 0;
    let totalPatuh = 0;
    let totalDinilai = 0;
    selectedGenericData.forEach(r => {
      sumPct += r.persentase;
      totalPatuh += r.patuh;
      totalDinilai += r.dinilai;
    });
    const avgPct = Math.round(sumPct / selectedGenericData.length);
    return {
      avgPct,
      totalObs: selectedGenericData.length,
      totalPatuh,
      totalDinilai
    };
  }, [selectedGenericData]);

  // Master comparison & ranking across ALL active PPI indicators in current period
  const allIndicatorsRanking = useMemo(() => {
    const list: { id: string; name: string; category: string; pct: number; count: number; target: number }[] = [];

    // 1. Hand Hygiene
    let hhP = 0, hhD = 0;
    normalizedHH.forEach(r => { hhP += r.patuh; hhD += r.dinilai; });
    if (normalizedHH.length > 0 && hhD > 0) {
      list.push({
        id: 'audit_hand_hygiene',
        name: 'Kepatuhan Kebersihan Tangan',
        category: 'Kewaspadaan Standar',
        pct: Math.round((hhP / hhD) * 100),
        count: normalizedHH.length,
        target: 85
      });
    }

    // 2. APD
    let apdP = 0, apdD = 0;
    normalizedApd.forEach(r => { apdP += r.patuh; apdD += r.dinilai; });
    if (normalizedApd.length > 0 && apdD > 0) {
      list.push({
        id: 'audit_apd',
        name: 'Kepatuhan Penggunaan APD',
        category: 'Kewaspadaan Standar',
        pct: Math.round((apdP / apdD) * 100),
        count: normalizedApd.length,
        target: 100
      });
    }

    // 3. Generic indicators
    const groupMap: Record<string, { sumPct: number; count: number }> = {};
    normalizedGenericSessions.forEach(r => {
      if (!groupMap[r.indikator_id]) {
        groupMap[r.indikator_id] = { sumPct: 0, count: 0 };
      }
      groupMap[r.indikator_id].sumPct += r.persentase;
      groupMap[r.indikator_id].count += 1;
    });

    Object.keys(groupMap).forEach(indId => {
      const def = ALL_PPI_INDICATORS.find(i => i.id === indId);
      const name = def ? def.title : indId.replace(/_/g, ' ').toUpperCase();
      const cat = def ? def.category : 'Indikator PPI';
      const target = def ? def.target : 100;
      const avg = Math.round(groupMap[indId].sumPct / groupMap[indId].count);
      list.push({
        id: indId,
        name,
        category: cat,
        pct: avg,
        count: groupMap[indId].count,
        target
      });
    });

    return list.sort((a, b) => b.pct - a.pct);
  }, [normalizedHH, normalizedApd, normalizedGenericSessions]);

  // --- STATS COMPUTATION FOR TOP SUMMARY CARDS ---
  const summaryStats = useMemo(() => {
    // 1. Hand Hygiene Avg
    let hhPatuh = 0, hhDinilai = 0;
    normalizedHH.forEach(r => {
      hhPatuh += r.patuh;
      hhDinilai += r.dinilai;
    });
    const hhAvg = hhDinilai > 0 ? Math.round((hhPatuh / hhDinilai) * 100) : null;

    // 2. APD Avg
    let apdPatuh = 0, apdDinilai = 0;
    normalizedApd.forEach(r => {
      apdPatuh += r.patuh;
      apdDinilai += r.dinilai;
    });
    const apdAvg = apdDinilai > 0 ? Math.round((apdPatuh / apdDinilai) * 100) : null;

    // 3. Total Observasi (includes HH, APD, and ALL Generic Audit Sessions)
    const totalObservasi = normalizedHH.length + normalizedApd.length + normalizedGenericSessions.length;

    // 4. Total HAIs Incidents
    let totalHaisCases = 0;
    normalizedHais.forEach(r => totalHaisCases += r.cases);

    // 5. Best & Improvement Needed Indicators (computed across ALL indicators)
    let bestInd = '-';
    let worstInd = '-';

    if (allIndicatorsRanking.length > 0) {
      bestInd = `${allIndicatorsRanking[0].name} (${allIndicatorsRanking[0].pct}%)`;
      worstInd = `${allIndicatorsRanking[allIndicatorsRanking.length - 1].name} (${allIndicatorsRanking[allIndicatorsRanking.length - 1].pct}%)`;
    }

    return {
      hhAvg,
      apdAvg,
      totalObservasi,
      totalHaisCases,
      bestInd,
      worstInd
    };
  }, [normalizedHH, normalizedApd, normalizedHais, normalizedGenericSessions, allIndicatorsRanking]);

  // --- HAND HYGIENE PROFESSION BREAKDOWN ---
  const hhProfBreakdown = useMemo(() => {
    const groups: Record<string, { patuh: number; dinilai: number; tidakPatuh: number; na: number; obs: number }> = {
      'Perawat / Bidan': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
      'Dokter': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
      'Radiografer': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
      'Analis Laboratorium': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
      'Nakes Lainnya': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 }
    };

    normalizedHH.forEach(r => {
      const g = groups[r.profGroup];
      if (g) {
        g.patuh += r.patuh;
        g.dinilai += r.dinilai;
        g.tidakPatuh += r.tidakPatuh;
        g.na += r.na;
        g.obs += 1;
      }
    });

    const all = [
      {
        name: 'Perawat / Bidan',
        pct: groups['Perawat / Bidan'].dinilai > 0 ? Math.round((groups['Perawat / Bidan'].patuh / groups['Perawat / Bidan'].dinilai) * 100) : 0,
        data: groups['Perawat / Bidan']
      },
      {
        name: 'Dokter',
        pct: groups['Dokter'].dinilai > 0 ? Math.round((groups['Dokter'].patuh / groups['Dokter'].dinilai) * 100) : 0,
        data: groups['Dokter']
      },
      {
        name: 'Radiografer',
        pct: groups['Radiografer'].dinilai > 0 ? Math.round((groups['Radiografer'].patuh / groups['Radiografer'].dinilai) * 100) : 0,
        data: groups['Radiografer']
      },
      {
        name: 'Analis Laboratorium',
        pct: groups['Analis Laboratorium'].dinilai > 0 ? Math.round((groups['Analis Laboratorium'].patuh / groups['Analis Laboratorium'].dinilai) * 100) : 0,
        data: groups['Analis Laboratorium']
      },
      {
        name: 'Nakes Lainnya',
        pct: groups['Nakes Lainnya'].dinilai > 0 ? Math.round((groups['Nakes Lainnya'].patuh / groups['Nakes Lainnya'].dinilai) * 100) : 0,
        data: groups['Nakes Lainnya']
      }
    ];

    if (selectedProfesiGroups.length > 0) {
      return all.filter(p => selectedProfesiGroups.includes(p.name));
    }
    return all;
  }, [normalizedHH, selectedProfesiGroups]);

  // --- TIME BUCKETS GENERATOR FOR TREND CHARTS ---
  const timeBuckets = useMemo(() => {
    if (periodeType === 'Bulanan') {
      return ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];
    } else if (periodeType === 'Triwulan') {
      const startM = (selectedQuarter - 1) * 3;
      return [MONTH_SHORT[startM], MONTH_SHORT[startM + 1], MONTH_SHORT[startM + 2]];
    } else if (periodeType === 'Semester') {
      const startM = (selectedSemester - 1) * 6;
      return Array.from({ length: 6 }, (_, i) => MONTH_SHORT[startM + i]);
    } else {
      return MONTH_SHORT;
    }
  }, [periodeType, selectedQuarter, selectedSemester]);

  // Helper to map a Date object to its Bucket Label index
  const getBucketLabel = useCallback((d: Date) => {
    const m = d.getMonth();
    const dateNum = d.getDate();

    if (periodeType === 'Bulanan') {
      if (dateNum <= 7) return 'Minggu 1';
      if (dateNum <= 14) return 'Minggu 2';
      if (dateNum <= 21) return 'Minggu 3';
      return 'Minggu 4';
    } else if (periodeType === 'Triwulan') {
      return MONTH_SHORT[m];
    } else if (periodeType === 'Semester') {
      return MONTH_SHORT[m];
    } else {
      return MONTH_SHORT[m];
    }
  }, [periodeType]);

  // --- HAND HYGIENE TREND DATA ---
  const hhTrendData = useMemo(() => {
    if (normalizedHH.length === 0) return [];

    const bucketMap: Record<string, Record<string, { patuh: number; dinilai: number; tidakPatuh: number; na: number; obs: number }>> = {};
    
    timeBuckets.forEach(b => {
      bucketMap[b] = {
        'Perawat / Bidan': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
        'Dokter': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
        'Radiografer': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
        'Analis Laboratorium': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
        'Nakes Lainnya': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 }
      };
    });

    normalizedHH.forEach(r => {
      const bLabel = getBucketLabel(r.date);
      if (bucketMap[bLabel] && bucketMap[bLabel][r.profGroup]) {
        const item = bucketMap[bLabel][r.profGroup];
        item.patuh += r.patuh;
        item.dinilai += r.dinilai;
        item.tidakPatuh += r.tidakPatuh;
        item.na += r.na;
        item.obs += 1;
      }
    });

    return timeBuckets.map(b => {
      const pData = bucketMap[b]['Perawat / Bidan'];
      const dData = bucketMap[b]['Dokter'];
      const rData = bucketMap[b]['Radiografer'];
      const aData = bucketMap[b]['Analis Laboratorium'];
      const nData = bucketMap[b]['Nakes Lainnya'];

      const pPct = pData.dinilai > 0 ? Math.round((pData.patuh / pData.dinilai) * 100) : 0;
      const dPct = dData.dinilai > 0 ? Math.round((dData.patuh / dData.dinilai) * 100) : 0;
      const rPct = rData.dinilai > 0 ? Math.round((rData.patuh / rData.dinilai) * 100) : 0;
      const aPct = aData.dinilai > 0 ? Math.round((aData.patuh / aData.dinilai) * 100) : 0;
      const nPct = nData.dinilai > 0 ? Math.round((nData.patuh / nData.dinilai) * 100) : 0;

      return {
        periode: b,
        'Perawat / Bidan': pPct,
        'Dokter': dPct,
        'Radiografer': rPct,
        'Analis Laboratorium': aPct,
        'Nakes Lainnya': nPct,
        details: {
          'Perawat / Bidan': { observasi: pData.obs, patuh: pData.patuh, tidakPatuh: pData.tidakPatuh, na: pData.na },
          'Dokter': { observasi: dData.obs, patuh: dData.patuh, tidakPatuh: dData.tidakPatuh, na: dData.na },
          'Radiografer': { observasi: rData.obs, patuh: rData.patuh, tidakPatuh: rData.tidakPatuh, na: rData.na },
          'Analis Laboratorium': { observasi: aData.obs, patuh: aData.patuh, tidakPatuh: aData.tidakPatuh, na: aData.na },
          'Nakes Lainnya': { observasi: nData.obs, patuh: nData.patuh, tidakPatuh: nData.tidakPatuh, na: nData.na }
        }
      };
    });
  }, [normalizedHH, timeBuckets, getBucketLabel]);

  // --- APD PROFESSION BREAKDOWN ---
  const apdProfBreakdown = useMemo(() => {
    const groups: Record<string, { patuh: number; dinilai: number; tidakPatuh: number; na: number; obs: number }> = {
      'Perawat / Bidan': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
      'Dokter': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
      'Radiografer': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
      'Analis Laboratorium': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
      'Nakes Lainnya': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 }
    };

    normalizedApd.forEach(r => {
      const g = groups[r.profGroup];
      if (g) {
        g.patuh += r.patuh;
        g.dinilai += r.dinilai;
        g.tidakPatuh += r.tidakPatuh;
        g.na += r.na;
        g.obs += 1;
      }
    });

    const all = [
      {
        name: 'Perawat / Bidan',
        pct: groups['Perawat / Bidan'].dinilai > 0 ? Math.round((groups['Perawat / Bidan'].patuh / groups['Perawat / Bidan'].dinilai) * 100) : 0,
        data: groups['Perawat / Bidan']
      },
      {
        name: 'Dokter',
        pct: groups['Dokter'].dinilai > 0 ? Math.round((groups['Dokter'].patuh / groups['Dokter'].dinilai) * 100) : 0,
        data: groups['Dokter']
      },
      {
        name: 'Radiografer',
        pct: groups['Radiografer'].dinilai > 0 ? Math.round((groups['Radiografer'].patuh / groups['Radiografer'].dinilai) * 100) : 0,
        data: groups['Radiografer']
      },
      {
        name: 'Analis Laboratorium',
        pct: groups['Analis Laboratorium'].dinilai > 0 ? Math.round((groups['Analis Laboratorium'].patuh / groups['Analis Laboratorium'].dinilai) * 100) : 0,
        data: groups['Analis Laboratorium']
      },
      {
        name: 'Nakes Lainnya',
        pct: groups['Nakes Lainnya'].dinilai > 0 ? Math.round((groups['Nakes Lainnya'].patuh / groups['Nakes Lainnya'].dinilai) * 100) : 0,
        data: groups['Nakes Lainnya']
      }
    ];

    if (selectedProfesiGroups.length > 0) {
      return all.filter(p => selectedProfesiGroups.includes(p.name));
    }
    return all;
  }, [normalizedApd, selectedProfesiGroups]);

  // --- APD TREND DATA ---
  const apdTrendData = useMemo(() => {
    if (normalizedApd.length === 0) return [];

    const bucketMap: Record<string, Record<string, { patuh: number; dinilai: number; tidakPatuh: number; na: number; obs: number }>> = {};
    
    timeBuckets.forEach(b => {
      bucketMap[b] = {
        'Perawat / Bidan': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
        'Dokter': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
        'Radiografer': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
        'Analis Laboratorium': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
        'Nakes Lainnya': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 }
      };
    });

    normalizedApd.forEach(r => {
      const bLabel = getBucketLabel(r.date);
      if (bucketMap[bLabel] && bucketMap[bLabel][r.profGroup]) {
        const item = bucketMap[bLabel][r.profGroup];
        item.patuh += r.patuh;
        item.dinilai += r.dinilai;
        item.tidakPatuh += r.tidakPatuh;
        item.na += r.na;
        item.obs += 1;
      }
    });

    return timeBuckets.map(b => {
      const pData = bucketMap[b]['Perawat / Bidan'];
      const dData = bucketMap[b]['Dokter'];
      const rData = bucketMap[b]['Radiografer'];
      const aData = bucketMap[b]['Analis Laboratorium'];
      const nData = bucketMap[b]['Nakes Lainnya'];

      const pPct = pData.dinilai > 0 ? Math.round((pData.patuh / pData.dinilai) * 100) : 0;
      const dPct = dData.dinilai > 0 ? Math.round((dData.patuh / dData.dinilai) * 100) : 0;
      const rPct = rData.dinilai > 0 ? Math.round((rData.patuh / rData.dinilai) * 100) : 0;
      const aPct = aData.dinilai > 0 ? Math.round((aData.patuh / aData.dinilai) * 100) : 0;
      const nPct = nData.dinilai > 0 ? Math.round((nData.patuh / nData.dinilai) * 100) : 0;

      return {
        periode: b,
        'Perawat / Bidan': pPct,
        'Dokter': dPct,
        'Radiografer': rPct,
        'Analis Laboratorium': aPct,
        'Nakes Lainnya': nPct,
        'Target': 100,
        details: {
          'Perawat / Bidan': { observasi: pData.obs, patuh: pData.patuh, tidakPatuh: pData.tidakPatuh, na: pData.na },
          'Dokter': { observasi: dData.obs, patuh: dData.patuh, tidakPatuh: dData.tidakPatuh, na: dData.na },
          'Radiografer': { observasi: rData.obs, patuh: rData.patuh, tidakPatuh: rData.tidakPatuh, na: rData.na },
          'Analis Laboratorium': { observasi: aData.obs, patuh: aData.patuh, tidakPatuh: aData.tidakPatuh, na: aData.na },
          'Nakes Lainnya': { observasi: nData.obs, patuh: nData.patuh, tidakPatuh: nData.tidakPatuh, na: nData.na }
        }
      };
    });
  }, [normalizedApd, timeBuckets, getBucketLabel]);

  // --- HAIs TREND & ROOM DISTRIBUTION ---
  const { haisTrendData, haisRoomData } = useMemo(() => {
    if (normalizedHais.length === 0) return { haisTrendData: [], haisRoomData: [] };

    // 1. Trend Data
    const bucketMap: Record<string, Record<string, number>> = {};
    timeBuckets.forEach(b => {
      bucketMap[b] = { 'Phlebitis': 0, 'CAUTI / ISK': 0, 'IDO': 0, 'VAP': 0, 'Dekubitus': 0 };
    });

    // 2. Room Distribution
    const roomMap: Record<string, number> = {};

    normalizedHais.forEach(r => {
      const bLabel = getBucketLabel(r.date);
      if (bucketMap[bLabel] && bucketMap[bLabel][r.haisType] !== undefined) {
        bucketMap[bLabel][r.haisType] += r.cases;
      }

      if (!roomMap[r.unit]) roomMap[r.unit] = 0;
      roomMap[r.unit] += r.cases;
    });

    const trend = timeBuckets.map(b => ({
      periode: b,
      ...bucketMap[b]
    }));

    const room = Object.keys(roomMap)
      .map(unit => ({ unit, Kejadian: roomMap[unit] }))
      .sort((a, b) => b.Kejadian - a.Kejadian);

    return { haisTrendData: trend, haisRoomData: room };
  }, [normalizedHais, timeBuckets, getBucketLabel]);

  // --- GENERIC PPI AUDIT TREND & UNIT DATA ---
  const { genericTrendData, genericUnitData } = useMemo(() => {
    if (selectedGenericData.length === 0) return { genericTrendData: [], genericUnitData: [] };

    // 1. Trend by Time Bucket
    const bucketMap: Record<string, { sumPct: number; count: number; patuh: number; dinilai: number }> = {};
    timeBuckets.forEach(b => {
      bucketMap[b] = { sumPct: 0, count: 0, patuh: 0, dinilai: 0 };
    });

    // 2. Breakdown by Unit
    const unitMap: Record<string, { sumPct: number; count: number; patuh: number; dinilai: number }> = {};

    selectedGenericData.forEach(r => {
      const bLabel = getBucketLabel(r.date);
      if (bucketMap[bLabel]) {
        bucketMap[bLabel].sumPct += r.persentase;
        bucketMap[bLabel].count += 1;
        bucketMap[bLabel].patuh += r.patuh;
        bucketMap[bLabel].dinilai += r.dinilai;
      }

      const u = r.unit || 'Lainnya';
      if (!unitMap[u]) {
        unitMap[u] = { sumPct: 0, count: 0, patuh: 0, dinilai: 0 };
      }
      unitMap[u].sumPct += r.persentase;
      unitMap[u].count += 1;
      unitMap[u].patuh += r.patuh;
      unitMap[u].dinilai += r.dinilai;
    });

    const targetVal = activeIndicatorDef?.target || 100;

    const trend = timeBuckets.map(b => {
      const item = bucketMap[b];
      const avg = item.count > 0 ? Math.round(item.sumPct / item.count) : 0;
      return {
        periode: b,
        Capaian: avg,
        Target: targetVal,
        Observasi: item.count,
        Patuh: item.patuh,
        Dinilai: item.dinilai
      };
    });

    const unitArr = Object.keys(unitMap).map(u => {
      const item = unitMap[u];
      const avg = item.count > 0 ? Math.round(item.sumPct / item.count) : 0;
      return {
        unit: u,
        Capaian: avg,
        Target: targetVal,
        Observasi: item.count
      };
    }).sort((a, b) => b.Capaian - a.Capaian);

    return { genericTrendData: trend, genericUnitData: unitArr };
  }, [selectedGenericData, timeBuckets, getBucketLabel, activeIndicatorDef]);

  // EXPORT FUNCTIONALITY (PDF, EXCEL, PRINT)
  const handleExport = (type: 'pdf' | 'excel' | 'print') => {
    const filterTitle = `${periodeType} - ${
      periodeType === 'Bulanan' ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}` :
      periodeType === 'Triwulan' ? `${QUARTER_NAMES[selectedQuarter - 1]} ${selectedYear}` :
      periodeType === 'Semester' ? `${SEMESTER_NAMES[selectedSemester - 1]} ${selectedYear}` :
      `Tahun ${selectedYear}`
    } (${selectedUnit})`;

    if (type === 'excel') {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Summary Stats
      const summaryData = [
        ['SMART-PPI - REKAPITULASI CAPAIAN GRAFIK INDIKATOR MUTU'],
        ['Periode Filter:', filterTitle],
        ['Unit / Ruangan:', selectedUnit],
        ['Profesi Filter:', selectedProfesiGroups.length === 0 ? 'Semua Profesi' : selectedProfesiGroups.join(', ')],
        [],
        ['INDIKATOR', 'NILAI CAPAIAN / HASIL'],
        ['Rata-rata Kebersihan Tangan', summaryStats.hhAvg !== null ? `${summaryStats.hhAvg}%` : 'Belum Ada Data'],
        ['Rata-rata Kepatuhan APD', summaryStats.apdAvg !== null ? `${summaryStats.apdAvg}%` : 'Belum Ada Data'],
        ['Total Sesi Observasi', summaryStats.totalObservasi],
        ['Total Kejadian HAIs', summaryStats.totalHaisCases],
        ['Indikator Performa Terbaik', summaryStats.bestInd],
        ['Indikator Perlu Perbaikan', summaryStats.worstInd]
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan Capaian');

      // Sheet 2: Kebersihan Tangan
      const hhExportData = [
        ['PROFESI', 'TOTAL OBSERVASI', 'JUMLAH PATUH', 'TIDAK PATUH', 'N/A', 'PERSENTASE (%)'],
        ...hhProfBreakdown.map(p => [
          p.name, p.data.obs, p.data.patuh, p.data.tidakPatuh, p.data.na, `${p.pct}%`
        ])
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(hhExportData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Kebersihan Tangan');

      // Sheet 3: APD
      const apdExportData = [
        ['PROFESI', 'TOTAL OBSERVASI', 'JUMLAH PATUH', 'TIDAK PATUH', 'N/A', 'PERSENTASE (%)'],
        ...apdProfBreakdown.map(p => [
          p.name, p.data.obs, p.data.patuh, p.data.tidakPatuh, p.data.na, `${p.pct}%`
        ])
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(apdExportData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Kepatuhan APD');

      // Sheet 4: Surveilans HAIs
      const haisExportData = [
        ['RUANGAN / UNIT', 'TOTAL KEJADIAN HAIS'],
        ...haisRoomData.map(r => [r.unit, r.Kejadian])
      ];
      const ws4 = XLSX.utils.aoa_to_sheet(haisExportData);
      XLSX.utils.book_append_sheet(wb, ws4, 'Surveilans HAIs');

      // Sheet 5: Audit Indikator Terpilih
      const genericExportData = [
        ['INDIKATOR AUDIT', activeIndicatorDef?.title || selectedGenericIndicator],
        ['TARGET STANDAR', `${activeIndicatorDef?.target || 100}%`],
        ['RATA-RATA CAPAIAN', selectedGenericStats.avgPct !== null ? `${selectedGenericStats.avgPct}%` : '0%'],
        ['TOTAL OBSERVASI', selectedGenericStats.totalObs],
        [],
        ['UNIT / RUANGAN', 'RATA-RATA CAPAIAN (%)', 'JUMLAH OBSERVASI'],
        ...genericUnitData.map(u => [u.unit, `${u.Capaian}%`, u.Observasi])
      ];
      const ws5 = XLSX.utils.aoa_to_sheet(genericExportData);
      XLSX.utils.book_append_sheet(wb, ws5, 'Audit Indikator Terpilih');

      // Sheet 6: Rekap Seluruh Indikator
      const allIndExportData = [
        ['NO', 'NAMA INDIKATOR PPI', 'KATEGORI', 'TARGET (%)', 'CAPAIAN (%)', 'JUMLAH AUDIT', 'STATUS'],
        ...allIndicatorsRanking.map((ind, idx) => [
          idx + 1,
          ind.name,
          ind.category,
          `${ind.target}%`,
          `${ind.pct}%`,
          ind.count,
          ind.pct >= ind.target ? 'Memenuhi Standar' : 'Perlu Evaluasi'
        ])
      ];
      const ws6 = XLSX.utils.aoa_to_sheet(allIndExportData);
      XLSX.utils.book_append_sheet(wb, ws6, 'Rekap Semua Indikator');

      // Save file
      const fileName = `Grafik_SMART_PPI_${selectedYear}_${periodeType}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24 text-slate-100 animate-in fade-in duration-300">
      
      {/* HEADER PAGE - 3D Tactile Neumorphic Container */}
      <div className="relative group bg-[#18193b] rounded-[28px] md:rounded-[32px] p-6 sm:p-7 border border-[#2b2d56] transition-all duration-300 transform-gpu overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)]">
        {/* Top Bevel Highlight */}
        <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="flex flex-col items-center text-center justify-between gap-6 relative z-10 landscape:lg:flex-row landscape:lg:items-center landscape:lg:text-left">
          <div className="flex flex-col items-center text-center landscape:lg:items-start landscape:lg:text-left">
            <div className="flex items-center justify-center landscape:lg:justify-start gap-2.5 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient uppercase text-center landscape:lg:text-left">
                Grafik SMART PPI
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1 text-center landscape:lg:text-left">
              Pusat Visualisasi Realtime Capaian Indikator Mutu PPI Terintegrasi
            </p>
          </div>
        </div>
      </div>

        {/* CONTROLS & FILTER SECTION - 3D Tactile Container with Recessed Trays */}
        <div className="relative group bg-[#18193b] rounded-[28px] md:rounded-[32px] p-6 sm:p-7 border border-[#2b2d56] transition-all duration-300 transform-gpu overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] space-y-4 print:hidden">
          {/* Top Bevel Highlight */}
          <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          <div className="flex items-center justify-between border-b border-indigo-900/40 pb-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#12132e] border border-white/10 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.06)]">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
                PARAMETER FILTER GRAFIK
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-400 hidden sm:inline-block">
              Pilih periode, unit & kategori profesi
            </span>
          </div>

          {/* Recessed Control Area */}
          <div className="bg-[#12132e] rounded-2xl p-4 border border-black/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Periode Type */}
              <div className="relative group/select">
                <label className="absolute -top-2.5 left-3 px-2 bg-[#18193b] border border-indigo-500/20 text-[9px] font-black text-indigo-300 uppercase tracking-widest z-10 rounded-md shadow-sm">
                  Tipe Periode
                </label>
                <select
                  value={periodeType}
                  onChange={(e: any) => setPeriodeType(e.target.value)}
                  className="w-full bg-[#161735] border border-indigo-900/40 text-white text-xs font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                >
                  <option value="Bulanan" className="bg-[#18193b] text-white">Bulanan</option>
                  <option value="Triwulan" className="bg-[#18193b] text-white">Triwulan</option>
                  <option value="Semester" className="bg-[#18193b] text-white">Semester</option>
                  <option value="Tahunan" className="bg-[#18193b] text-white">Tahunan</option>
                </select>
              </div>

              {/* Specific Period Selection */}
              <div className="relative group/select">
                <label className="absolute -top-2.5 left-3 px-2 bg-[#18193b] border border-indigo-500/20 text-[9px] font-black text-indigo-300 uppercase tracking-widest z-10 rounded-md shadow-sm">
                  Pilihan Periode
                </label>
                {periodeType === 'Bulanan' && (
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="w-full bg-[#161735] border border-indigo-900/40 text-white text-xs font-bold rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={m} value={idx} className="bg-[#18193b] text-white">{m}</option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full bg-[#161735] border border-indigo-900/40 text-white text-xs font-bold rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                    >
                      {[2024, 2025, 2026, 2027].map(y => (
                        <option key={y} value={y} className="bg-[#18193b] text-white">{y}</option>
                      ))}
                    </select>
                  </div>
                )}

                {periodeType === 'Triwulan' && (
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                      className="w-full bg-[#161735] border border-indigo-900/40 text-white text-xs font-bold rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                    >
                      {QUARTER_NAMES.map((q, idx) => (
                        <option key={q} value={idx + 1} className="bg-[#18193b] text-white">{q}</option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full bg-[#161735] border border-indigo-900/40 text-white text-xs font-bold rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                    >
                      {[2024, 2025, 2026, 2027].map(y => (
                        <option key={y} value={y} className="bg-[#18193b] text-white">{y}</option>
                      ))}
                    </select>
                  </div>
                )}

                {periodeType === 'Semester' && (
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(Number(e.target.value))}
                      className="w-full bg-[#161735] border border-indigo-900/40 text-white text-xs font-bold rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                    >
                      {SEMESTER_NAMES.map((s, idx) => (
                        <option key={s} value={idx + 1} className="bg-[#18193b] text-white">{s}</option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full bg-[#161735] border border-indigo-900/40 text-white text-xs font-bold rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                    >
                      {[2024, 2025, 2026, 2027].map(y => (
                        <option key={y} value={y} className="bg-[#18193b] text-white">{y}</option>
                      ))}
                    </select>
                  </div>
                )}

                {periodeType === 'Tahunan' && (
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full bg-[#161735] border border-indigo-900/40 text-white text-xs font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y} className="bg-[#18193b] text-white">Tahun {y}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Sub Filter: Unit/Ruangan */}
              <div className="relative group/select">
                <label className="absolute -top-2.5 left-3 px-2 bg-[#18193b] border border-indigo-500/20 text-[9px] font-black text-indigo-300 uppercase tracking-widest z-10 rounded-md shadow-sm">
                  Unit / Ruangan
                </label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full bg-[#161735] border border-indigo-900/40 text-white text-xs font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] truncate"
                >
                  {availableUnits.map(u => (
                    <option key={u} value={u} className="bg-[#18193b] text-white">{u}</option>
                  ))}
                </select>
              </div>

              {/* Sub Filter: Profesi (Multi-Select Pop-up Modal Trigger) */}
              <div className="relative group/select" ref={profesiDropdownRef}>
                <label className="absolute -top-2.5 left-3 px-2 bg-[#18193b] border border-indigo-500/20 text-[9px] font-black text-indigo-300 uppercase tracking-widest z-10 rounded-md shadow-sm flex items-center gap-1">
                  <span>Kategori Profesi</span>
                  {selectedProfesiGroups.length > 0 && (
                    <span className="bg-cyan-500/20 text-cyan-300 px-1 rounded text-[8px] font-bold">
                      {selectedProfesiGroups.length}
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => setIsProfesiDropdownOpen(true)}
                  className="w-full bg-[#161735] border border-indigo-900/40 text-white text-xs font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all flex items-center justify-between hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] text-left cursor-pointer"
                >
                  <span className="truncate">
                    {selectedProfesiGroups.length === 0
                      ? 'Semua Profesi'
                      : selectedProfesiGroups.length === 1
                      ? selectedProfesiGroups[0]
                      : `${selectedProfesiGroups.length} Profesi Terpilih`}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                      Pilih
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400 transition-transform duration-200" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* POP-UP MODAL PORTAL DENGAN EFEK FULLSCREEN ZOOM-IN GLASSMORPHISM & BACKGROUND BLUR */}
        {mounted && typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {isProfesiDropdownOpen && (
              <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 select-none">
                {/* Full Backdrop Blur Morphism */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="fixed inset-0 bg-black/75 backdrop-blur-xl cursor-pointer"
                  onClick={() => setIsProfesiDropdownOpen(false)}
                />

                {/* Modal Pop-up Card with Zoom-In Glassmorphism */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.6, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.6, y: 30 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 350 }}
                  className="relative w-full max-w-lg bg-[#141635]/90 border border-white/20 rounded-[32px] shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(99,102,241,0.3),inset_0_1px_2px_rgba(255,255,255,0.4)] p-6 sm:p-7 z-10 backdrop-blur-3xl text-white space-y-5 overflow-hidden"
                >
                  {/* Subtle top light sheen for glassmorphism */}
                  <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

                  {/* Header Pop-up */}
                  <div className="flex items-start justify-between border-b border-indigo-900/50 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/25 to-cyan-500/25 border border-indigo-400/40 flex items-center justify-center shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3)] text-cyan-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                          Filter Kategori Profesi
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                          Pilih satu atau lebih profesi untuk memfilter data &amp; grafik
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsProfesiDropdownOpen(false)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/10"
                      aria-label="Tutup Filter"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Quick Selection Action Bar */}
                  <div className="flex items-center justify-between gap-2 bg-[#0e0f24]/80 p-2 rounded-2xl border border-indigo-900/50">
                    <button
                      type="button"
                      onClick={() => setSelectedProfesiGroups([])}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedProfesiGroups.length === 0
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md border border-indigo-400/50'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Semua Profesi ({PROFESI_OPTIONS.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedProfesiGroups([...PROFESI_OPTIONS])}
                      className="py-2 px-3 rounded-xl text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                  </div>

                  {/* List of Professions */}
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {PROFESI_OPTIONS.map(prof => {
                      const isSelected = selectedProfesiGroups.length === 0 || selectedProfesiGroups.includes(prof);
                      const isExplicitlySelected = selectedProfesiGroups.includes(prof);
                      const theme = getProfCardTheme(prof);

                      return (
                        <button
                          key={prof}
                          type="button"
                          onClick={() => toggleProfesiGroup(prof)}
                          className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer group ${
                            isExplicitlySelected
                              ? 'bg-gradient-to-r from-indigo-950/80 to-indigo-900/50 border-indigo-400/60 shadow-[0_4px_16px_rgba(79,70,229,0.2)]'
                              : selectedProfesiGroups.length === 0
                              ? 'bg-white/[0.03] border-white/10 hover:border-indigo-500/40 hover:bg-white/5'
                              : 'bg-[#0f1026]/70 border-white/5 opacity-55 hover:opacity-100 hover:border-white/15'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={`w-3.5 h-3.5 rounded-full ring-4 shrink-0 ${
                              prof === 'Perawat / Bidan' ? 'bg-emerald-400 ring-emerald-500/25' :
                              prof === 'Dokter' ? 'bg-blue-400 ring-blue-500/25' :
                              prof === 'Radiografer' ? 'bg-purple-400 ring-purple-500/25' :
                              prof === 'Analis Laboratorium' ? 'bg-cyan-400 ring-cyan-500/25' :
                              'bg-amber-400 ring-amber-500/25'
                            }`} />
                            <div>
                              <span className={`text-sm font-bold block leading-tight ${isSelected ? theme.text : 'text-slate-400'}`}>
                                {prof}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {prof === 'Perawat / Bidan' ? 'Perawat Rawat Inap, Bidan & Rawat Jalan' :
                                 prof === 'Dokter' ? 'Dokter Umum & Dokter Spesialis' :
                                 prof === 'Radiografer' ? 'Tenaga Radiologi & Imaging' :
                                 prof === 'Analis Laboratorium' ? 'Petugas Analis Patologi & Laboratorium' :
                                 'Pramusaji, Farmasi, Gizi & Nakes Lain'}
                              </span>
                            </div>
                          </div>

                          <div className={`w-6 h-6 rounded-xl border flex items-center justify-center transition-all shrink-0 ml-3 ${
                            isExplicitlySelected || selectedProfesiGroups.length === 0
                              ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 border-indigo-300 text-white shadow-[0_0_12px_rgba(99,102,241,0.6)]'
                              : 'border-slate-700 bg-[#0e0f24] text-transparent'
                          }`}>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer Pop-up */}
                  <div className="pt-3 border-t border-indigo-900/50 flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-400">
                      Status:{' '}
                      <span className="font-bold text-cyan-400">
                        {selectedProfesiGroups.length === 0
                          ? 'Semua Profesi Aktif'
                          : `${selectedProfesiGroups.length} dari ${PROFESI_OPTIONS.length} dipilih`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsProfesiDropdownOpen(false)}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-[0_4px_16px_rgba(79,70,229,0.4)] cursor-pointer"
                    >
                      Terapkan Filter
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* SECTION 1: KEPATUHAN KEBERSIHAN TANGAN - 3D Tactile Neumorphic Container */}
        <div className="relative group bg-[#18193b] rounded-[28px] md:rounded-[32px] p-6 sm:p-8 border border-[#2b2d56] transition-all duration-300 transform-gpu overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] space-y-6">
          {/* Top Bevel Highlight */}
          <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-900/40 pb-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-[#272952] to-[#12132d] border border-emerald-400/30 shadow-[-2px_-2px_6px_rgba(16,185,129,0.15),3px_4px_12px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.25)] flex items-center justify-center text-emerald-400">
                <Droplets className="w-5 h-5 drop-shadow" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase font-heading">
                    KEPATUHAN KEBERSIHAN TANGAN
                  </h2>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Capaian dan Perkembangan Kebersihan Tangan Berdasarkan Profesi & Periode
                </p>
              </div>
            </div>
          </div>

          {/* A. Capaian Berdasarkan Profesi */}
          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#12132e] border border-white/10 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)]">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">
                A. Capaian Kepatuhan Berdasarkan Profesi
              </span>
            </div>

            {normalizedHH.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#12132e] border border-indigo-900/40 text-center space-y-2 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8)]">
                <BarChart2 className="w-10 h-10 text-slate-500 mx-auto animate-pulse" />
                <h4 className="text-sm font-bold text-slate-300">Belum tersedia data grafik pada periode yang dipilih.</h4>
                <p className="text-xs text-slate-400">Data grafik akan ditampilkan secara otomatis setelah terdapat data pada Menu Input.</p>
              </div>
            ) : (
              <div className={`grid gap-4 ${hhProfBreakdown.length === 1 ? 'grid-cols-1 max-w-sm' : hhProfBreakdown.length <= 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'}`}>
                {hhProfBreakdown.map((prof) => {
                  const theme = getProfCardTheme(prof.name);
                  return (
                    <div
                      key={prof.name}
                      className={`p-5 rounded-2xl bg-[#12132e] border border-indigo-900/40 space-y-3 relative overflow-hidden shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] ${theme.border} transition-all`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-200">{prof.name}</span>
                        <span className={`text-2xl font-black ${theme.text} font-heading ${theme.glow}`}>{prof.pct}%</span>
                      </div>

                      {/* Recessed Progress Bar */}
                      <div className="w-full h-3 bg-[#0a0a1a] rounded-full overflow-hidden p-0.5 border border-black/40 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8)]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${prof.pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full bg-gradient-to-r ${theme.gradient} rounded-full ${theme.shadow}`}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-indigo-900/30 text-[10px] text-slate-400 text-center font-bold">
                        <div className="bg-[#161735]/60 p-1.5 rounded-lg border border-white/5">Obs: <strong className="text-white font-mono">{prof.data.obs}</strong></div>
                        <div className="bg-[#161735]/60 p-1.5 rounded-lg border border-white/5">Patuh: <strong className={`${theme.text} font-mono`}>{prof.data.patuh}</strong></div>
                        <div className="bg-[#161735]/60 p-1.5 rounded-lg border border-white/5">T.Patuh: <strong className="text-rose-400 font-mono">{prof.data.tidakPatuh}</strong></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* B. Grafik Tren Waktu */}
          <div className="space-y-4 pt-4 border-t border-indigo-900/40 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#12132e] border border-white/10 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)]">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">
                  B. Tren Kepatuhan Kebersihan Tangan
                </span>
              </div>
              <ChartTypeToggle type={hhChartType} onChange={setHhChartType} colorScheme="emerald" />
            </div>

            {hhTrendData.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#12132e] border border-indigo-900/40 text-center space-y-2 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8)]">
                <BarChart2 className="w-10 h-10 text-slate-500 mx-auto animate-pulse" />
                <h4 className="text-sm font-bold text-slate-300">Belum tersedia data grafik pada periode yang dipilih.</h4>
                <p className="text-xs text-slate-400">Data grafik akan ditampilkan secara otomatis setelah terdapat data pada Menu Input.</p>
              </div>
            ) : (
              <div className="bg-[#12132e] p-4 sm:p-5 rounded-2xl border border-indigo-900/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
                <div className="h-[340px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    {hhChartType === 'line' ? (
                      <LineChart data={hhTrendData} margin={{ top: 25, right: 30, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b2d56" />
                        <XAxis dataKey="periode" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                        <YAxis domain={[0, 115]} stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} unit="%" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <ReferenceLine y={85} stroke="#34d399" strokeDasharray="5 5" strokeWidth={2} label={{ value: 'Standar Target: ≥85%', fill: '#34d399', fontSize: 11, position: 'top', fontWeight: 'bold' }} />
                        {isProfesiActive('Perawat / Bidan') && (
                          <Line type="monotone" dataKey="Perawat / Bidan" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} activeDot={{ r: 8 }}>
                            <LabelList dataKey="Perawat / Bidan" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#34d399" fontSize={10} fontWeight="bold" dy={-6} />
                          </Line>
                        )}
                        {isProfesiActive('Dokter') && (
                          <Line type="monotone" dataKey="Dokter" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6' }} activeDot={{ r: 8 }}>
                            <LabelList dataKey="Dokter" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#60a5fa" fontSize={10} fontWeight="bold" dy={-6} />
                          </Line>
                        )}
                        {isProfesiActive('Radiografer') && (
                          <Line type="monotone" dataKey="Radiografer" stroke="#a855f7" strokeWidth={3} dot={{ r: 5, fill: '#a855f7' }} activeDot={{ r: 8 }}>
                            <LabelList dataKey="Radiografer" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#c084fc" fontSize={10} fontWeight="bold" dy={-6} />
                          </Line>
                        )}
                        {isProfesiActive('Analis Laboratorium') && (
                          <Line type="monotone" dataKey="Analis Laboratorium" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5, fill: '#06b6d4' }} activeDot={{ r: 8 }}>
                            <LabelList dataKey="Analis Laboratorium" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#22d3ee" fontSize={10} fontWeight="bold" dy={-6} />
                          </Line>
                        )}
                        {isProfesiActive('Nakes Lainnya') && (
                          <Line type="monotone" dataKey="Nakes Lainnya" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b' }} activeDot={{ r: 8 }}>
                            <LabelList dataKey="Nakes Lainnya" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#fbbf24" fontSize={10} fontWeight="bold" dy={-6} />
                          </Line>
                        )}
                      </LineChart>
                    ) : (
                      <BarChart data={hhTrendData} margin={{ top: 25, right: 30, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b2d56" />
                        <XAxis dataKey="periode" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                        <YAxis domain={[0, 115]} stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} unit="%" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <ReferenceLine y={85} stroke="#34d399" strokeDasharray="5 5" strokeWidth={2} label={{ value: 'Standar Target: ≥85%', fill: '#34d399', fontSize: 11, position: 'top', fontWeight: 'bold' }} />
                        {isProfesiActive('Perawat / Bidan') && (
                          <Bar dataKey="Perawat / Bidan" fill="#10b981" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="Perawat / Bidan" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#34d399" fontSize={10} fontWeight="bold" />
                          </Bar>
                        )}
                        {isProfesiActive('Dokter') && (
                          <Bar dataKey="Dokter" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="Dokter" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#60a5fa" fontSize={10} fontWeight="bold" />
                          </Bar>
                        )}
                        {isProfesiActive('Radiografer') && (
                          <Bar dataKey="Radiografer" fill="#a855f7" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="Radiografer" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#c084fc" fontSize={10} fontWeight="bold" />
                          </Bar>
                        )}
                        {isProfesiActive('Analis Laboratorium') && (
                          <Bar dataKey="Analis Laboratorium" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="Analis Laboratorium" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#22d3ee" fontSize={10} fontWeight="bold" />
                          </Bar>
                        )}
                        {isProfesiActive('Nakes Lainnya') && (
                          <Bar dataKey="Nakes Lainnya" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="Nakes Lainnya" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#fbbf24" fontSize={10} fontWeight="bold" />
                          </Bar>
                        )}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: KEPATUHAN PENGGUNAAN APD - 3D Tactile Neumorphic Container */}
        <div className="relative group bg-[#18193b] rounded-[28px] md:rounded-[32px] p-6 sm:p-8 border border-[#2b2d56] transition-all duration-300 transform-gpu overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] space-y-6">
          {/* Top Bevel Highlight */}
          <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-900/40 pb-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-[#272952] to-[#12132d] border border-sky-400/30 shadow-[-2px_-2px_6px_rgba(56,189,248,0.15),3px_4px_12px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.25)] flex items-center justify-center text-sky-400">
                <ShieldCheck className="w-5 h-5 drop-shadow" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase font-heading">
                    KEPATUHAN PENGGUNAAN APD
                  </h2>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Capaian Kepatuhan Penggunaan Alat Pelindung Diri (APD) dan Baseline Target
                </p>
              </div>
            </div>
          </div>

          {/* A. Capaian Berdasarkan Profesi */}
          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#12132e] border border-white/10 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)]">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[10px] font-black text-sky-300 uppercase tracking-wider">
                A. Capaian Kepatuhan APD Berdasarkan Profesi
              </span>
            </div>

            {normalizedApd.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#12132e] border border-indigo-900/40 text-center space-y-2 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8)]">
                <BarChart2 className="w-10 h-10 text-slate-500 mx-auto animate-pulse" />
                <h4 className="text-sm font-bold text-slate-300">Belum tersedia data grafik pada periode yang dipilih.</h4>
                <p className="text-xs text-slate-400">Data grafik akan ditampilkan secara otomatis setelah terdapat data pada Menu Input.</p>
              </div>
            ) : (
              <div className={`grid gap-4 ${apdProfBreakdown.length === 1 ? 'grid-cols-1 max-w-sm' : apdProfBreakdown.length <= 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'}`}>
                {apdProfBreakdown.map((prof) => {
                  const theme = getProfCardTheme(prof.name);
                  return (
                    <div
                      key={prof.name}
                      className={`p-5 rounded-2xl bg-[#12132e] border border-indigo-900/40 space-y-3 relative overflow-hidden shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] ${theme.border} transition-all`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-200">{prof.name}</span>
                        <span className={`text-2xl font-black ${theme.text} font-heading ${theme.glow}`}>{prof.pct}%</span>
                      </div>

                      {/* Recessed Progress Bar */}
                      <div className="w-full h-3 bg-[#0a0a1a] rounded-full overflow-hidden p-0.5 border border-black/40 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8)]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${prof.pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full bg-gradient-to-r ${theme.gradient} rounded-full ${theme.shadow}`}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-indigo-900/30 text-[10px] text-slate-400 text-center font-bold">
                        <div className="bg-[#161735]/60 p-1.5 rounded-lg border border-white/5">Obs: <strong className="text-white font-mono">{prof.data.obs}</strong></div>
                        <div className="bg-[#161735]/60 p-1.5 rounded-lg border border-white/5">Patuh: <strong className={`${theme.text} font-mono`}>{prof.data.patuh}</strong></div>
                        <div className="bg-[#161735]/60 p-1.5 rounded-lg border border-white/5">T.Patuh: <strong className="text-rose-400 font-mono">{prof.data.tidakPatuh}</strong></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* B. Grafik Tren APD */}
          <div className="space-y-4 pt-4 border-t border-indigo-900/40 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#12132e] border border-white/10 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)]">
                <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[10px] font-black text-sky-300 uppercase tracking-wider">
                  B. Tren Kepatuhan Penggunaan APD
                </span>
              </div>
              <ChartTypeToggle type={apdChartType} onChange={setApdChartType} colorScheme="sky" />
            </div>

            {apdTrendData.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#12132e] border border-indigo-900/40 text-center space-y-2 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8)]">
                <BarChart2 className="w-10 h-10 text-slate-500 mx-auto animate-pulse" />
                <h4 className="text-sm font-bold text-slate-300">Belum tersedia data grafik pada periode yang dipilih.</h4>
                <p className="text-xs text-slate-400">Data grafik akan ditampilkan secara otomatis setelah terdapat data pada Menu Input.</p>
              </div>
            ) : (
              <div className="bg-[#12132e] p-4 sm:p-5 rounded-2xl border border-indigo-900/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
                <div className="h-[340px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    {apdChartType === 'line' ? (
                      <LineChart data={apdTrendData} margin={{ top: 25, right: 30, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b2d56" />
                        <XAxis dataKey="periode" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                        <YAxis domain={[0, 115]} stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} unit="%" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <ReferenceLine y={100} label={{ value: 'Standar Target: 100%', fill: '#f59e0b', fontSize: 11, position: 'top', fontWeight: 'bold' }} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} />
                        {isProfesiActive('Perawat / Bidan') && (
                          <Line type="monotone" dataKey="Perawat / Bidan" stroke="#0284c7" strokeWidth={3} dot={{ r: 5, fill: '#0284c7' }} activeDot={{ r: 8 }}>
                            <LabelList dataKey="Perawat / Bidan" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#38bdf8" fontSize={10} fontWeight="bold" dy={-6} />
                          </Line>
                        )}
                        {isProfesiActive('Dokter') && (
                          <Line type="monotone" dataKey="Dokter" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: '#6366f1' }} activeDot={{ r: 8 }}>
                            <LabelList dataKey="Dokter" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#818cf8" fontSize={10} fontWeight="bold" dy={-6} />
                          </Line>
                        )}
                        {isProfesiActive('Radiografer') && (
                          <Line type="monotone" dataKey="Radiografer" stroke="#a855f7" strokeWidth={3} dot={{ r: 5, fill: '#a855f7' }} activeDot={{ r: 8 }}>
                            <LabelList dataKey="Radiografer" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#c084fc" fontSize={10} fontWeight="bold" dy={-6} />
                          </Line>
                        )}
                        {isProfesiActive('Analis Laboratorium') && (
                          <Line type="monotone" dataKey="Analis Laboratorium" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5, fill: '#06b6d4' }} activeDot={{ r: 8 }}>
                            <LabelList dataKey="Analis Laboratorium" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#22d3ee" fontSize={10} fontWeight="bold" dy={-6} />
                          </Line>
                        )}
                        {isProfesiActive('Nakes Lainnya') && (
                          <Line type="monotone" dataKey="Nakes Lainnya" stroke="#ec4899" strokeWidth={3} dot={{ r: 5, fill: '#ec4899' }} activeDot={{ r: 8 }}>
                            <LabelList dataKey="Nakes Lainnya" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#f472b6" fontSize={10} fontWeight="bold" dy={-6} />
                          </Line>
                        )}
                      </LineChart>
                    ) : (
                      <BarChart data={apdTrendData} margin={{ top: 25, right: 30, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b2d56" />
                        <XAxis dataKey="periode" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                        <YAxis domain={[0, 115]} stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} unit="%" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <ReferenceLine y={100} label={{ value: 'Standar Target: 100%', fill: '#f59e0b', fontSize: 11, position: 'top', fontWeight: 'bold' }} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} />
                        {isProfesiActive('Perawat / Bidan') && (
                          <Bar dataKey="Perawat / Bidan" fill="#0284c7" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="Perawat / Bidan" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#38bdf8" fontSize={10} fontWeight="bold" />
                          </Bar>
                        )}
                        {isProfesiActive('Dokter') && (
                          <Bar dataKey="Dokter" fill="#6366f1" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="Dokter" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#818cf8" fontSize={10} fontWeight="bold" />
                          </Bar>
                        )}
                        {isProfesiActive('Radiografer') && (
                          <Bar dataKey="Radiografer" fill="#a855f7" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="Radiografer" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#c084fc" fontSize={10} fontWeight="bold" />
                          </Bar>
                        )}
                        {isProfesiActive('Analis Laboratorium') && (
                          <Bar dataKey="Analis Laboratorium" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="Analis Laboratorium" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#22d3ee" fontSize={10} fontWeight="bold" />
                          </Bar>
                        )}
                        {isProfesiActive('Nakes Lainnya') && (
                          <Bar dataKey="Nakes Lainnya" fill="#ec4899" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="Nakes Lainnya" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#f472b6" fontSize={10} fontWeight="bold" />
                          </Bar>
                        )}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: GRAFIK SURVEILANS HAIs - 3D Tactile Neumorphic Container */}
        <div className="relative group bg-[#18193b] rounded-[28px] md:rounded-[32px] p-6 sm:p-8 border border-[#2b2d56] transition-all duration-300 transform-gpu overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] space-y-6">
          {/* Top Bevel Highlight */}
          <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-900/40 pb-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-[#272952] to-[#12132d] border border-purple-400/30 shadow-[-2px_-2px_6px_rgba(192,132,252,0.15),3px_4px_12px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.25)] flex items-center justify-center text-purple-400">
                <Activity className="w-5 h-5 drop-shadow" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase font-heading">
                    GRAFIK SURVEILANS HAIS
                  </h2>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Tren Insiden Phlebitis, CAUTI/ISK, IDO, VAP, dan Distribusi Berdasarkan Ruangan
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
            {/* A. Tren Insiden HAIs */}
            <div className="space-y-4 p-5 rounded-2xl bg-[#12132e] border border-indigo-900/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18193b] border border-white/10 shadow-sm">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10px] font-black text-purple-300 uppercase tracking-wider">
                    A. Tren Insiden HAIs Periode
                  </span>
                </div>
                <ChartTypeToggle type={haisChartType} onChange={setHaisChartType} colorScheme="purple" />
              </div>

              {haisTrendData.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#161735]/40 border border-white/5 text-center space-y-2">
                  <BarChart2 className="w-8 h-8 text-slate-500 mx-auto animate-pulse" />
                  <p className="text-xs text-slate-400">Belum tersedia data surveilans HAIs pada periode ini.</p>
                </div>
              ) : (
                <div className="h-[290px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    {haisChartType === 'line' ? (
                      <LineChart data={haisTrendData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b2d56" />
                        <XAxis dataKey="periode" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#cbd5e1' }} allowDecimals={false} />
                        <Tooltip content={<HaisTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        <Line type="monotone" dataKey="Phlebitis" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 4 }}>
                          <LabelList dataKey="Phlebitis" position="top" formatter={(val: any) => typeof val === 'number' && val > 0 ? val : ''} fill="#c084fc" fontSize={10} fontWeight="bold" dy={-6} />
                        </Line>
                        <Line type="monotone" dataKey="CAUTI / ISK" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }}>
                          <LabelList dataKey="CAUTI / ISK" position="top" formatter={(val: any) => typeof val === 'number' && val > 0 ? val : ''} fill="#60a5fa" fontSize={10} fontWeight="bold" dy={-6} />
                        </Line>
                        <Line type="monotone" dataKey="IDO" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4 }}>
                          <LabelList dataKey="IDO" position="top" formatter={(val: any) => typeof val === 'number' && val > 0 ? val : ''} fill="#fb7185" fontSize={10} fontWeight="bold" dy={-6} />
                        </Line>
                        <Line type="monotone" dataKey="VAP" stroke="#eab308" strokeWidth={2.5} dot={{ r: 4 }}>
                          <LabelList dataKey="VAP" position="top" formatter={(val: any) => typeof val === 'number' && val > 0 ? val : ''} fill="#facc15" fontSize={10} fontWeight="bold" dy={-6} />
                        </Line>
                      </LineChart>
                    ) : (
                      <BarChart data={haisTrendData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b2d56" />
                        <XAxis dataKey="periode" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#cbd5e1' }} allowDecimals={false} />
                        <Tooltip content={<HaisTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        <Bar dataKey="Phlebitis" fill="#a855f7" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="Phlebitis" position="top" formatter={(val: any) => typeof val === 'number' && val > 0 ? val : ''} fill="#c084fc" fontSize={10} fontWeight="bold" />
                        </Bar>
                        <Bar dataKey="CAUTI / ISK" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="CAUTI / ISK" position="top" formatter={(val: any) => typeof val === 'number' && val > 0 ? val : ''} fill="#60a5fa" fontSize={10} fontWeight="bold" />
                        </Bar>
                        <Bar dataKey="IDO" fill="#f43f5e" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="IDO" position="top" formatter={(val: any) => typeof val === 'number' && val > 0 ? val : ''} fill="#fb7185" fontSize={10} fontWeight="bold" />
                        </Bar>
                        <Bar dataKey="VAP" fill="#eab308" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="VAP" position="top" formatter={(val: any) => typeof val === 'number' && val > 0 ? val : ''} fill="#facc15" fontSize={10} fontWeight="bold" />
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* B. Distribusi HAIs Berdasarkan Ruangan */}
            <div className="space-y-4 p-5 rounded-2xl bg-[#12132e] border border-indigo-900/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18193b] border border-white/10 shadow-sm">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10px] font-black text-purple-300 uppercase tracking-wider">
                    B. Distribusi HAIs per Ruangan
                  </span>
                </div>
                <ChartTypeToggle type={haisRoomChartType} onChange={setHaisRoomChartType} colorScheme="purple" />
              </div>

              {haisRoomData.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#161735]/40 border border-white/5 text-center space-y-2">
                  <BarChart2 className="w-8 h-8 text-slate-500 mx-auto animate-pulse" />
                  <p className="text-xs text-slate-400">Belum tersedia data distribusi ruangan pada periode ini.</p>
                </div>
              ) : (
                <div className="h-[290px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    {haisRoomChartType === 'bar' ? (
                      <BarChart data={haisRoomData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b2d56" />
                        <XAxis dataKey="unit" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#cbd5e1' }} allowDecimals={false} />
                        <Tooltip content={<HaisTooltip />} />
                        <Bar dataKey="Kejadian" fill="#8b5cf6" radius={[6, 6, 0, 0]}>
                          <LabelList dataKey="Kejadian" position="top" formatter={(val: any) => typeof val === 'number' && val > 0 ? val : ''} fill="#c084fc" fontSize={10} fontWeight="bold" />
                          {haisRoomData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#a855f7'} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <LineChart data={haisRoomData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b2d56" />
                        <XAxis dataKey="unit" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#cbd5e1' }} allowDecimals={false} />
                        <Tooltip content={<HaisTooltip />} />
                        <Line type="monotone" dataKey="Kejadian" stroke="#a855f7" strokeWidth={3} dot={{ r: 5, fill: '#a855f7' }}>
                          <LabelList dataKey="Kejadian" position="top" formatter={(val: any) => typeof val === 'number' && val > 0 ? val : ''} fill="#c084fc" fontSize={10} fontWeight="bold" dy={-6} />
                        </Line>
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: INDIKATOR MUTU & AUDIT PPI TERINTEGRASI - 3D Tactile Neumorphic Container */}
        <div className="relative group bg-[#18193b] rounded-[28px] md:rounded-[32px] p-6 sm:p-8 border border-[#2b2d56] transition-all duration-300 transform-gpu overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] space-y-6">
          {/* Top Bevel Highlight */}
          <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-indigo-900/40 pb-5 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-[#272952] to-[#12132d] border border-cyan-400/30 shadow-[-2px_-2px_6px_rgba(34,211,238,0.15),3px_4px_12px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.25)] flex items-center justify-center text-cyan-400">
                <ClipboardCheck className="w-5 h-5 drop-shadow" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase font-heading">
                    INDIKATOR MUTU &amp; AUDIT PPI TERINTEGRASI
                  </h2>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Visualisasi Kepatuhan Kewaspadaan Standar, Penempatan Pasien, Fasilitas, dan Bundles PPI
                </p>
              </div>
            </div>

            {/* Indicator Selector Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative min-w-[280px]">
                <label className="absolute -top-2.5 left-3 px-2 bg-[#18193b] border border-cyan-500/20 text-[9px] font-black text-cyan-300 uppercase tracking-widest z-10 rounded-md shadow-sm">
                  PILIH INDIKATOR AUDIT
                </label>
                <select
                  value={selectedGenericIndicator}
                  onChange={(e) => setSelectedGenericIndicator(e.target.value)}
                  className="w-full bg-[#12132e] border border-cyan-500/30 text-cyan-300 text-xs font-bold rounded-xl px-4 py-2.5 pr-8 outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all appearance-none cursor-pointer hover:border-cyan-400/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                >
                  {/* Categorized options */}
                  {['Kewaspadaan Standar', 'Kewaspadaan Transmisi', 'Monitoring Fasilitas', 'Monitoring Bundles', 'Pendidikan & Pelatihan'].map(cat => {
                    const inds = ALL_PPI_INDICATORS.filter(i => i.category === cat);
                    if (inds.length === 0) return null;
                    return (
                      <optgroup key={cat} label={`── ${cat} ──`} className="bg-[#18193b] text-slate-300 font-bold">
                        {inds.map(ind => {
                          const count = genericIndicatorCounts[ind.id] || 0;
                          return (
                            <option key={ind.id} value={ind.id} className="bg-[#12132e] text-white">
                              {ind.title} {count > 0 ? `(${count} data)` : ''}
                            </option>
                          );
                        })}
                      </optgroup>
                    );
                  })}
                </select>
                <ChevronDown className="w-4 h-4 text-cyan-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Indicator KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            {/* 1. Capaian Rata-Rata */}
            <div className="p-4 rounded-2xl bg-[#12132e] border border-indigo-900/40 space-y-1.5 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Capaian Rata-Rata</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black font-heading ${
                  selectedGenericStats.avgPct === null ? 'text-slate-400' :
                  selectedGenericStats.avgPct >= (activeIndicatorDef?.target || 85) ? 'text-emerald-400 drop-shadow-[0_2px_6px_rgba(16,185,129,0.4)]' :
                  'text-rose-400 drop-shadow-[0_2px_6px_rgba(244,63,94,0.4)]'
                }`}>
                  {selectedGenericStats.avgPct !== null ? `${selectedGenericStats.avgPct}%` : 'Belum Ada Data'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                {selectedGenericStats.avgPct !== null && selectedGenericStats.avgPct >= (activeIndicatorDef?.target || 85)
                  ? '✓ Memenuhi Standar Mutu'
                  : selectedGenericStats.avgPct !== null
                  ? '⚠ Di Bawah Target Standar'
                  : 'Belum ada observasi'}
              </span>
            </div>

            {/* 2. Target Standar */}
            <div className="p-4 rounded-2xl bg-[#12132e] border border-indigo-900/40 space-y-1.5 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Target Standar Mutu</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-400 font-heading drop-shadow-[0_2px_6px_rgba(245,158,11,0.4)]">
                  {activeIndicatorDef?.target || 100}%
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">Standar Komite PPI</span>
            </div>

            {/* 3. Total Sesi Audit */}
            <div className="p-4 rounded-2xl bg-[#12132e] border border-indigo-900/40 space-y-1.5 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Sesi Audit</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-cyan-400 font-heading drop-shadow-[0_2px_6px_rgba(34,211,238,0.4)]">
                  {selectedGenericStats.totalObs}
                </span>
                <span className="text-xs text-slate-400">Sesi</span>
              </div>
              <span className="text-[10px] text-slate-400 block">Tercatat di Sistem</span>
            </div>

            {/* 4. Ruangan Tervalidasi */}
            <div className="p-4 rounded-2xl bg-[#12132e] border border-indigo-900/40 space-y-1.5 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Unit Terobservasi</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-purple-400 font-heading drop-shadow-[0_2px_6px_rgba(192,132,252,0.4)]">
                  {genericUnitData.length}
                </span>
                <span className="text-xs text-slate-400">Unit</span>
              </div>
              <span className="text-[10px] text-slate-400 block">Cakupan Ruangan Audit</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
            {/* A. Tren Kepatuhan Waktu */}
            <div className="space-y-4 p-5 rounded-2xl bg-[#12132e] border border-indigo-900/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18193b] border border-white/10 shadow-sm">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider">
                    A. Tren Kepatuhan ({activeIndicatorDef?.title || 'Indikator'})
                  </span>
                </div>
                <ChartTypeToggle type={genericChartType} onChange={setGenericChartType} colorScheme="sky" />
              </div>

              {genericTrendData.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#161735]/40 border border-white/5 text-center space-y-2">
                  <BarChart2 className="w-8 h-8 text-slate-500 mx-auto animate-pulse" />
                  <p className="text-xs text-slate-400">Belum ada data audit {activeIndicatorDef?.title || 'indikator ini'} pada periode yang dipilih.</p>
                </div>
              ) : (
                <div className="h-[290px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    {genericChartType === 'line' ? (
                      <LineChart data={genericTrendData} margin={{ top: 25, right: 25, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b2d56" />
                        <XAxis dataKey="periode" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                        <YAxis domain={[0, 115]} stroke="#94a3b8" tick={{ fontSize: 10, fill: '#cbd5e1' }} unit="%" />
                        <Tooltip content={<GenericTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        <ReferenceLine y={activeIndicatorDef?.target || 100} label={{ value: `Target: ${activeIndicatorDef?.target || 100}%`, fill: '#f59e0b', fontSize: 10, position: 'top', fontWeight: 'bold' }} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} />
                        <Line type="monotone" dataKey="Capaian" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5, fill: '#06b6d4' }} activeDot={{ r: 8 }}>
                          <LabelList dataKey="Capaian" position="top" formatter={(val: any) => typeof val === 'number' && val > 0 ? `${val}%` : ''} fill="#22d3ee" fontSize={10} fontWeight="bold" dy={-6} />
                        </Line>
                      </LineChart>
                    ) : (
                      <BarChart data={genericTrendData} margin={{ top: 25, right: 25, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b2d56" />
                        <XAxis dataKey="periode" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                        <YAxis domain={[0, 115]} stroke="#94a3b8" tick={{ fontSize: 10, fill: '#cbd5e1' }} unit="%" />
                        <Tooltip content={<GenericTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        <ReferenceLine y={activeIndicatorDef?.target || 100} label={{ value: `Target: ${activeIndicatorDef?.target || 100}%`, fill: '#f59e0b', fontSize: 10, position: 'top', fontWeight: 'bold' }} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} />
                        <Bar dataKey="Capaian" fill="#06b6d4" radius={[6, 6, 0, 0]}>
                          <LabelList dataKey="Capaian" position="top" formatter={(val: any) => typeof val === 'number' && val > 0 ? `${val}%` : ''} fill="#22d3ee" fontSize={10} fontWeight="bold" />
                          {genericTrendData.map((entry, index) => (
                            <Cell key={`trend-cell-${index}`} fill={entry.Capaian >= (activeIndicatorDef?.target || 85) ? '#10b981' : '#f59e0b'} />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* B. Distribusi Capaian Berdasarkan Unit / Ruangan */}
            <div className="space-y-4 p-5 rounded-2xl bg-[#12132e] border border-indigo-900/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18193b] border border-white/10 shadow-sm">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider">
                    B. Capaian per Unit / Ruangan
                  </span>
                </div>
                <ChartTypeToggle type={genericUnitChartType} onChange={setGenericUnitChartType} colorScheme="sky" />
              </div>

              {genericUnitData.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#161735]/40 border border-white/5 text-center space-y-2">
                  <BarChart2 className="w-8 h-8 text-slate-500 mx-auto animate-pulse" />
                  <p className="text-xs text-slate-400">Belum ada distribusi unit untuk {activeIndicatorDef?.title || 'indikator ini'}.</p>
                </div>
              ) : (
                <div className="h-[290px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    {genericUnitChartType === 'bar' ? (
                      <BarChart data={genericUnitData} margin={{ top: 25, right: 25, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b2d56" />
                        <XAxis dataKey="unit" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                        <YAxis domain={[0, 115]} stroke="#94a3b8" tick={{ fontSize: 10, fill: '#cbd5e1' }} unit="%" />
                        <Tooltip content={<GenericTooltip />} />
                        <ReferenceLine y={activeIndicatorDef?.target || 100} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} />
                        <Bar dataKey="Capaian" fill="#38bdf8" radius={[6, 6, 0, 0]}>
                          <LabelList dataKey="Capaian" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#7dd3fc" fontSize={10} fontWeight="bold" />
                          {genericUnitData.map((entry, index) => (
                            <Cell key={`unit-cell-${index}`} fill={entry.Capaian >= (activeIndicatorDef?.target || 85) ? '#0284c7' : '#e11d48'} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <LineChart data={genericUnitData} margin={{ top: 25, right: 25, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b2d56" />
                        <XAxis dataKey="unit" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                        <YAxis domain={[0, 115]} stroke="#94a3b8" tick={{ fontSize: 10, fill: '#cbd5e1' }} unit="%" />
                        <Tooltip content={<GenericTooltip />} />
                        <ReferenceLine y={activeIndicatorDef?.target || 100} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} />
                        <Line type="monotone" dataKey="Capaian" stroke="#38bdf8" strokeWidth={3} dot={{ r: 5, fill: '#38bdf8' }}>
                          <LabelList dataKey="Capaian" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#7dd3fc" fontSize={10} fontWeight="bold" dy={-6} />
                        </Line>
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Master Section: Ranking & Rekap Seluruh Indikator PPI */}
          <div className="space-y-4 pt-4 border-t border-indigo-900/40 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#12132e] border border-white/10 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)]">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">
                  C. Komparasi Capaian Seluruh Indikator Mutu PPI ({allIndicatorsRanking.length} Indikator Aktif)
                </span>
              </div>
            </div>

            {allIndicatorsRanking.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#12132e] border border-indigo-900/40 text-center space-y-2 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8)]">
                <BarChart2 className="w-10 h-10 text-slate-500 mx-auto animate-pulse" />
                <h4 className="text-sm font-bold text-slate-300">Belum tersedia data indikator pada periode yang dipilih.</h4>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {allIndicatorsRanking.map((ind, idx) => {
                  const isPassed = ind.pct >= ind.target;
                  return (
                    <div
                      key={ind.id}
                      onClick={() => {
                        if (ALL_PPI_INDICATORS.some(i => i.id === ind.id)) {
                          setSelectedGenericIndicator(ind.id);
                        }
                      }}
                      className={`p-4 rounded-2xl bg-[#12132e] border transition-all cursor-pointer hover:scale-[1.01] ${
                        selectedGenericIndicator === ind.id
                          ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                          : 'border-indigo-900/40 hover:border-indigo-600/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                          #{idx + 1} {ind.category}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          isPassed
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          Target: {ind.target}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-black text-white truncate max-w-[70%]" title={ind.name}>
                          {ind.name}
                        </span>
                        <span className={`text-xl font-black font-heading ${
                          isPassed ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {ind.pct}%
                        </span>
                      </div>

                      {/* Recessed Progress Bar */}
                      <div className="w-full h-2 bg-[#0a0a1a] rounded-full overflow-hidden p-0.5 mt-2.5 border border-black/40">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPassed
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : 'bg-gradient-to-r from-rose-500 to-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, ind.pct)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mt-2 pt-1.5 border-t border-indigo-900/30">
                        <span>{ind.count} Sesi Audit</span>
                        <span className={isPassed ? 'text-emerald-400' : 'text-amber-400'}>
                          {isPassed ? 'Memenuhi Standar' : 'Perlu Evaluasi'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
  );
}

AnalyticsPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

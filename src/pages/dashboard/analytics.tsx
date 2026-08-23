import { ReactElement, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  BarChart2, TrendingUp, Filter, Download, Activity, Users, ClipboardCheck, 
  AlertTriangle, CheckCircle2, Clock, ShieldCheck, Shield, FileText, 
  FileSpreadsheet, ImageIcon, Calendar, Award, AlertCircle, UserCheck, 
  RefreshCw, Building2, Layers, ChevronDown, Check, HelpCircle
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
    emerald: 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]',
    sky: 'bg-sky-500 text-white shadow-[0_0_12px_rgba(14,165,233,0.4)]',
    purple: 'bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]',
  }[colorScheme];

  return (
    <div className="flex items-center bg-[#071322] p-1 rounded-2xl border border-white/10 shadow-inner">
      <button
        type="button"
        onClick={() => onChange('line')}
        title="Grafik Line"
        aria-label="Grafik Line"
        className={`p-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center ${
          type === 'line' ? activeBg : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        }`}
      >
        <TrendingUp className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('bar')}
        title="Grafik Batang"
        aria-label="Grafik Batang"
        className={`p-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center ${
          type === 'bar' ? activeBg : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        }`}
      >
        <BarChart2 className="w-4 h-4" />
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

// Profession Group Classifier
function getProfessionGroup(profesiStr: string | null | undefined): 'Perawat / Bidan' | 'Dokter' | 'Nakes Lainnya' {
  if (!profesiStr) return 'Nakes Lainnya';
  const p = profesiStr.toLowerCase().trim();
  if (p.includes('perawat') || p.includes('bidan') || p.includes('nurse') || p.includes('midwife')) {
    return 'Perawat / Bidan';
  }
  if (p.includes('dokter') || p.includes('dr.') || p.includes('spesialis') || p.includes('dpjp') || p.includes('residen')) {
    return 'Dokter';
  }
  return 'Nakes Lainnya';
}

// Custom Glassmorphism Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0b172a]/95 backdrop-blur-xl border border-sky-400/30 p-4 rounded-2xl shadow-2xl text-xs space-y-2 text-white z-50 min-w-[200px]">
        <div className="font-bold border-b border-white/10 pb-1.5 text-sky-300 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-slate-400 font-normal">Realtime Data</span>
        </div>
        <div className="space-y-1.5 pt-1">
          {payload.map((entry: any, index: number) => {
            const extra = entry.payload;
            return (
              <div key={`item-${index}`} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name}:
                  </span>
                  <span className="font-bold text-white">
                    {typeof entry.value === 'number' ? `${entry.value}%` : entry.value}
                  </span>
                </div>
                {extra && extra.details && extra.details[entry.name] && (
                  <div className="pl-3 text-[10px] text-slate-300 grid grid-cols-2 gap-x-2 gap-y-0.5 bg-white/5 p-1.5 rounded-lg border border-white/5">
                    <span>Observasi: <strong>{extra.details[entry.name].observasi || 0}</strong></span>
                    <span>Patuh: <strong className="text-emerald-400">{extra.details[entry.name].patuh || 0}</strong></span>
                    <span>Tidak Patuh: <strong className="text-rose-400">{extra.details[entry.name].tidakPatuh || 0}</strong></span>
                    <span>N/A: <strong>{extra.details[entry.name].na || 0}</strong></span>
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
      <div className="bg-[#0b172a]/95 backdrop-blur-xl border border-purple-400/30 p-4 rounded-2xl shadow-2xl text-xs space-y-2 text-white z-50 min-w-[200px]">
        <div className="font-bold border-b border-white/10 pb-1.5 text-purple-300">
          {label}
        </div>
        <div className="space-y-1.5 pt-1">
          {payload.map((entry: any, index: number) => (
            <div key={`hais-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold text-white">{entry.value} Kejadian</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Raw Database States
  const [rawSessions, setRawSessions] = useState<any[]>([]);
  const [rawHH, setRawHH] = useState<any[]>([]);
  const [rawApd, setRawApd] = useState<any[]>([]);

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
  const [selectedProfesiGroup, setSelectedProfesiGroup] = useState<string>('Semua Profesi');

  // Chart Type Display States (Grafik Line vs Grafik Batang)
  const [hhChartType, setHhChartType] = useState<'line' | 'bar'>('line');
  const [apdChartType, setApdChartType] = useState<'line' | 'bar'>('line');
  const [haisChartType, setHaisChartType] = useState<'line' | 'bar'>('line');
  const [haisRoomChartType, setHaisRoomChartType] = useState<'line' | 'bar'>('bar');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Data from Supabase
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsRes, hhRes, apdRes] = await Promise.all([
        supabase.from('audit_sessions').select('*').order('tanggal_waktu', { ascending: true }),
        supabase.from('audit_hand_hygiene').select('*').order('start_time', { ascending: true }),
        supabase.from('audit_apd').select('*').order('tanggal_waktu', { ascending: true })
      ]);

      setRawSessions(sessionsRes.data || []);
      setRawHH(hhRes.data || []);
      setRawApd(apdRes.data || []);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
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
      if (selectedProfesiGroup !== 'Semua Profesi' && profGroup !== selectedProfesiGroup) continue;

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
      if (selectedProfesiGroup !== 'Semua Profesi' && profGroup !== selectedProfesiGroup) continue;

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
  }, [rawSessions, rawHH, matchesPeriod, selectedUnit, selectedProfesiGroup]);

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
      if (selectedProfesiGroup !== 'Semua Profesi' && profGroup !== selectedProfesiGroup) continue;

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
      if (selectedProfesiGroup !== 'Semua Profesi' && profGroup !== selectedProfesiGroup) continue;

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
  }, [rawSessions, rawApd, matchesPeriod, selectedUnit, selectedProfesiGroup]);

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

    // 3. Total Observasi
    const totalObservasi = normalizedHH.length + normalizedApd.length;

    // 4. Total HAIs Incidents
    let totalHaisCases = 0;
    normalizedHais.forEach(r => totalHaisCases += r.cases);

    // 5. Best & Improvement Needed Indicators
    const indicatorsList: { name: string; pct: number }[] = [];
    if (hhAvg !== null) indicatorsList.push({ name: 'Kebersihan Tangan', pct: hhAvg });
    if (apdAvg !== null) indicatorsList.push({ name: 'Kepatuhan APD', pct: apdAvg });

    let bestInd = '-';
    let worstInd = '-';

    if (indicatorsList.length > 0) {
      indicatorsList.sort((a, b) => b.pct - a.pct);
      bestInd = `${indicatorsList[0].name} (${indicatorsList[0].pct}%)`;
      worstInd = `${indicatorsList[indicatorsList.length - 1].name} (${indicatorsList[indicatorsList.length - 1].pct}%)`;
    }

    return {
      hhAvg,
      apdAvg,
      totalObservasi,
      totalHaisCases,
      bestInd,
      worstInd
    };
  }, [normalizedHH, normalizedApd, normalizedHais]);

  // --- HAND HYGIENE PROFESSION BREAKDOWN ---
  const hhProfBreakdown = useMemo(() => {
    const groups = {
      'Perawat / Bidan': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
      'Dokter': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
      'Nakes Lainnya': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 }
    };

    normalizedHH.forEach(r => {
      const g = groups[r.profGroup as keyof typeof groups];
      if (g) {
        g.patuh += r.patuh;
        g.dinilai += r.dinilai;
        g.tidakPatuh += r.tidakPatuh;
        g.na += r.na;
        g.obs += 1;
      }
    });

    return [
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
        name: 'Nakes Lainnya',
        pct: groups['Nakes Lainnya'].dinilai > 0 ? Math.round((groups['Nakes Lainnya'].patuh / groups['Nakes Lainnya'].dinilai) * 100) : 0,
        data: groups['Nakes Lainnya']
      }
    ];
  }, [normalizedHH]);

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
      const nData = bucketMap[b]['Nakes Lainnya'];

      const pPct = pData.dinilai > 0 ? Math.round((pData.patuh / pData.dinilai) * 100) : 0;
      const dPct = dData.dinilai > 0 ? Math.round((dData.patuh / dData.dinilai) * 100) : 0;
      const nPct = nData.dinilai > 0 ? Math.round((nData.patuh / nData.dinilai) * 100) : 0;

      return {
        periode: b,
        'Perawat / Bidan': pPct,
        'Dokter': dPct,
        'Nakes Lainnya': nPct,
        details: {
          'Perawat / Bidan': { observasi: pData.obs, patuh: pData.patuh, tidakPatuh: pData.tidakPatuh, na: pData.na },
          'Dokter': { observasi: dData.obs, patuh: dData.patuh, tidakPatuh: dData.tidakPatuh, na: dData.na },
          'Nakes Lainnya': { observasi: nData.obs, patuh: nData.patuh, tidakPatuh: nData.tidakPatuh, na: nData.na }
        }
      };
    });
  }, [normalizedHH, timeBuckets, getBucketLabel]);

  // --- APD PROFESSION BREAKDOWN ---
  const apdProfBreakdown = useMemo(() => {
    const groups = {
      'Perawat / Bidan': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
      'Dokter': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
      'Nakes Lainnya': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 }
    };

    normalizedApd.forEach(r => {
      const g = groups[r.profGroup as keyof typeof groups];
      if (g) {
        g.patuh += r.patuh;
        g.dinilai += r.dinilai;
        g.tidakPatuh += r.tidakPatuh;
        g.na += r.na;
        g.obs += 1;
      }
    });

    return [
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
        name: 'Nakes Lainnya',
        pct: groups['Nakes Lainnya'].dinilai > 0 ? Math.round((groups['Nakes Lainnya'].patuh / groups['Nakes Lainnya'].dinilai) * 100) : 0,
        data: groups['Nakes Lainnya']
      }
    ];
  }, [normalizedApd]);

  // --- APD TREND DATA ---
  const apdTrendData = useMemo(() => {
    if (normalizedApd.length === 0) return [];

    const bucketMap: Record<string, Record<string, { patuh: number; dinilai: number; tidakPatuh: number; na: number; obs: number }>> = {};
    
    timeBuckets.forEach(b => {
      bucketMap[b] = {
        'Perawat / Bidan': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
        'Dokter': { patuh: 0, dinilai: 0, tidakPatuh: 0, na: 0, obs: 0 },
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
      const nData = bucketMap[b]['Nakes Lainnya'];

      const pPct = pData.dinilai > 0 ? Math.round((pData.patuh / pData.dinilai) * 100) : 0;
      const dPct = dData.dinilai > 0 ? Math.round((dData.patuh / dData.dinilai) * 100) : 0;
      const nPct = nData.dinilai > 0 ? Math.round((nData.patuh / nData.dinilai) * 100) : 0;

      return {
        periode: b,
        'Perawat / Bidan': pPct,
        'Dokter': dPct,
        'Nakes Lainnya': nPct,
        'Target': 100,
        details: {
          'Perawat / Bidan': { observasi: pData.obs, patuh: pData.patuh, tidakPatuh: pData.tidakPatuh, na: pData.na },
          'Dokter': { observasi: dData.obs, patuh: dData.patuh, tidakPatuh: dData.tidakPatuh, na: dData.na },
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
        ['Profesi Filter:', selectedProfesiGroup],
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

      // Save file
      const fileName = `Grafik_SMART_PPI_${selectedYear}_${periodeType}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } else {
      window.print();
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-24 text-slate-100 animate-in fade-in duration-300">
        
        {/* HEADER PAGE */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-3xl bg-gradient-to-r from-[#091b33]/90 via-[#0d284c]/80 to-[#091b33]/90 border border-sky-500/20 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-1 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-400/30 text-sky-400 shadow-inner">
                <BarChart2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase font-heading flex items-center gap-2">
                    GRAFIK <span className="text-sky-400">SMART-PPI</span>
                  </h1>
                  {loading && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin text-sky-400" />
                      Memuat Data...
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  Pusat Visualisasi Realtime Capaian Indikator Mutu PPI Terintegrasi
                </p>
              </div>
            </div>
          </div>

          {/* EXPORT BUTTONS */}
          <div className="flex items-center gap-2.5 z-10 print:hidden flex-wrap">
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 font-bold text-xs transition-all shadow-lg shadow-sky-500/10 active:scale-95"
            >
              <FileText className="w-4 h-4" /> Cetak / PDF
            </button>
          </div>
        </div>

        {/* CONTROLS & FILTER SECTION */}
        <div className="p-6 rounded-3xl bg-[#092340]/60 border border-sky-400/20 backdrop-blur-xl shadow-xl space-y-4 print:hidden">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-sm border-b border-white/10 pb-3">
            <Filter className="w-4 h-4" />
            <span>Filter Periode & Sub-Indikator</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Periode Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tipe Periode</label>
              <select
                value={periodeType}
                onChange={(e: any) => setPeriodeType(e.target.value)}
                className="w-full bg-[#0b172a] border border-sky-500/30 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-sky-400/50"
              >
                <option value="Bulanan">Bulanan</option>
                <option value="Triwulan">Triwulan</option>
                <option value="Semester">Semester</option>
                <option value="Tahunan">Tahunan</option>
              </select>
            </div>

            {/* Specific Period Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pilihan Periode</label>
              {periodeType === 'Bulanan' && (
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full bg-[#0b172a] border border-sky-500/30 rounded-2xl px-2.5 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-sky-400/50"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={m} value={idx}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full bg-[#0b172a] border border-sky-500/30 rounded-2xl px-2.5 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-sky-400/50"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              )}

              {periodeType === 'Triwulan' && (
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                    className="w-full bg-[#0b172a] border border-sky-500/30 rounded-2xl px-2.5 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-sky-400/50"
                  >
                    {QUARTER_NAMES.map((q, idx) => (
                      <option key={q} value={idx + 1}>{q}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full bg-[#0b172a] border border-sky-500/30 rounded-2xl px-2.5 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-sky-400/50"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              )}

              {periodeType === 'Semester' && (
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(Number(e.target.value))}
                    className="w-full bg-[#0b172a] border border-sky-500/30 rounded-2xl px-2.5 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-sky-400/50"
                  >
                    {SEMESTER_NAMES.map((s, idx) => (
                      <option key={s} value={idx + 1}>{s}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full bg-[#0b172a] border border-sky-500/30 rounded-2xl px-2.5 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-sky-400/50"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              )}

              {periodeType === 'Tahunan' && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full bg-[#0b172a] border border-sky-500/30 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-sky-400/50"
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>Tahun {y}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Sub Filter: Unit/Ruangan */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unit / Ruangan</label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full bg-[#0b172a] border border-sky-500/30 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-sky-400/50 truncate"
              >
                {availableUnits.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Sub Filter: Profesi */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kategori Profesi</label>
              <select
                value={selectedProfesiGroup}
                onChange={(e) => setSelectedProfesiGroup(e.target.value)}
                className="w-full bg-[#0b172a] border border-sky-500/30 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-sky-400/50"
              >
                <option value="Semua Profesi">Semua Profesi</option>
                <option value="Perawat / Bidan">Perawat / Bidan</option>
                <option value="Dokter">Dokter</option>
                <option value="Nakes Lainnya">Nakes Lainnya</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 1: KEPATUHAN KEBERSIHAN TANGAN */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#081e36]/70 border border-emerald-500/20 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-8 bg-emerald-400 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase font-heading">
                    KEPATUHAN KEBERSIHAN TANGAN
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Standar Target: ≥ 85%
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Capaian dan Perkembangan Kebersihan Tangan Berdasarkan Profesi & Periode
                </p>
              </div>
            </div>
          </div>

          {/* A. Capaian Berdasarkan Profesi */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>A. Capaian Kepatuhan Berdasarkan Profesi</span>
            </h3>

            {normalizedHH.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#09172a]/60 border border-white/5 text-center space-y-2">
                <BarChart2 className="w-10 h-10 text-slate-500 mx-auto animate-pulse" />
                <h4 className="text-sm font-bold text-slate-300">Belum tersedia data grafik pada periode yang dipilih.</h4>
                <p className="text-xs text-slate-400">Data grafik akan ditampilkan secara otomatis setelah terdapat data pada Menu Input.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {hhProfBreakdown.map((prof) => (
                  <div
                    key={prof.name}
                    className="p-5 rounded-2xl bg-[#0b1b30] border border-emerald-500/20 space-y-3 relative overflow-hidden shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{prof.name}</span>
                      <span className="text-xl font-black text-emerald-400 font-heading">{prof.pct}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${prof.pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/5 text-[10px] text-slate-400 text-center">
                      <div>Obs: <strong className="text-white">{prof.data.obs}</strong></div>
                      <div>Patuh: <strong className="text-emerald-400">{prof.data.patuh}</strong></div>
                      <div>T.Patuh: <strong className="text-rose-400">{prof.data.tidakPatuh}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* B. Grafik Tren Waktu */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>B. Tren Kepatuhan Kebersihan Tangan</span>
              </h3>
              <ChartTypeToggle type={hhChartType} onChange={setHhChartType} colorScheme="emerald" />
            </div>

            {hhTrendData.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#09172a]/60 border border-white/5 text-center space-y-2">
                <BarChart2 className="w-10 h-10 text-slate-500 mx-auto animate-pulse" />
                <h4 className="text-sm font-bold text-slate-300">Belum tersedia data grafik pada periode yang dipilih.</h4>
                <p className="text-xs text-slate-400">Data grafik akan ditampilkan secara otomatis setelah terdapat data pada Menu Input.</p>
              </div>
            ) : (
              <div className="h-[340px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  {hhChartType === 'line' ? (
                    <LineChart data={hhTrendData} margin={{ top: 25, right: 30, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="periode" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                      <YAxis domain={[0, 115]} stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} unit="%" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <ReferenceLine y={85} stroke="#34d399" strokeDasharray="5 5" strokeWidth={2} label={{ value: 'Standar Target: ≥85%', fill: '#34d399', fontSize: 11, position: 'top', fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey="Perawat / Bidan" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} activeDot={{ r: 8 }}>
                        <LabelList dataKey="Perawat / Bidan" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#34d399" fontSize={10} fontWeight="bold" dy={-6} />
                      </Line>
                      <Line type="monotone" dataKey="Dokter" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6' }} activeDot={{ r: 8 }}>
                        <LabelList dataKey="Dokter" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#60a5fa" fontSize={10} fontWeight="bold" dy={-6} />
                      </Line>
                      <Line type="monotone" dataKey="Nakes Lainnya" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b' }} activeDot={{ r: 8 }}>
                        <LabelList dataKey="Nakes Lainnya" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#fbbf24" fontSize={10} fontWeight="bold" dy={-6} />
                      </Line>
                    </LineChart>
                  ) : (
                    <BarChart data={hhTrendData} margin={{ top: 25, right: 30, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="periode" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                      <YAxis domain={[0, 115]} stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} unit="%" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <ReferenceLine y={85} stroke="#34d399" strokeDasharray="5 5" strokeWidth={2} label={{ value: 'Standar Target: ≥85%', fill: '#34d399', fontSize: 11, position: 'top', fontWeight: 'bold' }} />
                      <Bar dataKey="Perawat / Bidan" fill="#10b981" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="Perawat / Bidan" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#34d399" fontSize={10} fontWeight="bold" />
                      </Bar>
                      <Bar dataKey="Dokter" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="Dokter" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#60a5fa" fontSize={10} fontWeight="bold" />
                      </Bar>
                      <Bar dataKey="Nakes Lainnya" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="Nakes Lainnya" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#fbbf24" fontSize={10} fontWeight="bold" />
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: KEPATUHAN PENGGUNAAN APD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#081e36]/70 border border-sky-500/20 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-8 bg-sky-400 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase font-heading">
                    KEPATUHAN PENGGUNAAN APD
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    Standar Target: 100%
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Capaian Kepatuhan Penggunaan Alat Pelindung Diri (APD) dan Baseline Target
                </p>
              </div>
            </div>
          </div>

          {/* A. Capaian Berdasarkan Profesi */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>A. Capaian Kepatuhan APD Berdasarkan Profesi</span>
            </h3>

            {normalizedApd.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#09172a]/60 border border-white/5 text-center space-y-2">
                <BarChart2 className="w-10 h-10 text-slate-500 mx-auto animate-pulse" />
                <h4 className="text-sm font-bold text-slate-300">Belum tersedia data grafik pada periode yang dipilih.</h4>
                <p className="text-xs text-slate-400">Data grafik akan ditampilkan secara otomatis setelah terdapat data pada Menu Input.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {apdProfBreakdown.map((prof) => (
                  <div
                    key={prof.name}
                    className="p-5 rounded-2xl bg-[#0b1b30] border border-sky-500/20 space-y-3 relative overflow-hidden shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{prof.name}</span>
                      <span className="text-xl font-black text-sky-400 font-heading">{prof.pct}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${prof.pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-400 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/5 text-[10px] text-slate-400 text-center">
                      <div>Obs: <strong className="text-white">{prof.data.obs}</strong></div>
                      <div>Patuh: <strong className="text-sky-400">{prof.data.patuh}</strong></div>
                      <div>T.Patuh: <strong className="text-rose-400">{prof.data.tidakPatuh}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* B. Grafik Tren APD */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>B. Tren Kepatuhan Penggunaan APD</span>
              </h3>
              <ChartTypeToggle type={apdChartType} onChange={setApdChartType} colorScheme="sky" />
            </div>

            {apdTrendData.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#09172a]/60 border border-white/5 text-center space-y-2">
                <BarChart2 className="w-10 h-10 text-slate-500 mx-auto animate-pulse" />
                <h4 className="text-sm font-bold text-slate-300">Belum tersedia data grafik pada periode yang dipilih.</h4>
                <p className="text-xs text-slate-400">Data grafik akan ditampilkan secara otomatis setelah terdapat data pada Menu Input.</p>
              </div>
            ) : (
              <div className="h-[340px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  {apdChartType === 'line' ? (
                    <LineChart data={apdTrendData} margin={{ top: 25, right: 30, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="periode" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                      <YAxis domain={[0, 115]} stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} unit="%" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <ReferenceLine y={100} label={{ value: 'Standar Target: 100%', fill: '#f59e0b', fontSize: 11, position: 'top', fontWeight: 'bold' }} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} />
                      <Line type="monotone" dataKey="Perawat / Bidan" stroke="#0284c7" strokeWidth={3} dot={{ r: 5, fill: '#0284c7' }} activeDot={{ r: 8 }}>
                        <LabelList dataKey="Perawat / Bidan" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#38bdf8" fontSize={10} fontWeight="bold" dy={-6} />
                      </Line>
                      <Line type="monotone" dataKey="Dokter" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: '#6366f1' }} activeDot={{ r: 8 }}>
                        <LabelList dataKey="Dokter" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#818cf8" fontSize={10} fontWeight="bold" dy={-6} />
                      </Line>
                      <Line type="monotone" dataKey="Nakes Lainnya" stroke="#ec4899" strokeWidth={3} dot={{ r: 5, fill: '#ec4899' }} activeDot={{ r: 8 }}>
                        <LabelList dataKey="Nakes Lainnya" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#f472b6" fontSize={10} fontWeight="bold" dy={-6} />
                      </Line>
                    </LineChart>
                  ) : (
                    <BarChart data={apdTrendData} margin={{ top: 25, right: 30, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="periode" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                      <YAxis domain={[0, 115]} stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} unit="%" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <ReferenceLine y={100} label={{ value: 'Standar Target: 100%', fill: '#f59e0b', fontSize: 11, position: 'top', fontWeight: 'bold' }} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} />
                      <Bar dataKey="Perawat / Bidan" fill="#0284c7" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="Perawat / Bidan" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#38bdf8" fontSize={10} fontWeight="bold" />
                      </Bar>
                      <Bar dataKey="Dokter" fill="#6366f1" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="Dokter" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#818cf8" fontSize={10} fontWeight="bold" />
                      </Bar>
                      <Bar dataKey="Nakes Lainnya" fill="#ec4899" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="Nakes Lainnya" position="top" formatter={(val: any) => typeof val === 'number' ? `${val}%` : ''} fill="#f472b6" fontSize={10} fontWeight="bold" />
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: GRAFIK SURVEILANS HAIs */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#081e36]/70 border border-purple-500/20 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-8 bg-purple-400 rounded-full shadow-[0_0_12px_rgba(192,132,252,0.8)]" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase font-heading">
                    GRAFIK SURVEILANS HAIS
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 shadow-sm">
                    <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
                    Standar Indikator: Phlebitis ≤ 1.5‰ | ISK ≤ 5‰ | IDO ≤ 2% | VAP ≤ 5‰
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Tren Insiden Phlebitis, CAUTI/ISK, IDO, VAP, dan Distribusi Berdasarkan Ruangan
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* A. Tren Insiden HAIs */}
            <div className="space-y-4 p-5 rounded-2xl bg-[#0b1b30] border border-purple-500/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>A. Tren Insiden HAIs Berdasarkan Periode</span>
                </h3>
                <ChartTypeToggle type={haisChartType} onChange={setHaisChartType} colorScheme="purple" />
              </div>

              {haisTrendData.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#09172a]/60 border border-white/5 text-center space-y-2">
                  <BarChart2 className="w-8 h-8 text-slate-500 mx-auto animate-pulse" />
                  <p className="text-xs text-slate-400">Belum tersedia data surveilans HAIs pada periode ini.</p>
                </div>
              ) : (
                <div className="h-[290px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    {haisChartType === 'line' ? (
                      <LineChart data={haisTrendData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
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
            <div className="space-y-4 p-5 rounded-2xl bg-[#0b1b30] border border-purple-500/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>B. Distribusi Insiden HAIs Berdasarkan Ruangan</span>
                </h3>
                <ChartTypeToggle type={haisRoomChartType} onChange={setHaisRoomChartType} colorScheme="purple" />
              </div>

              {haisRoomData.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#09172a]/60 border border-white/5 text-center space-y-2">
                  <BarChart2 className="w-8 h-8 text-slate-500 mx-auto animate-pulse" />
                  <p className="text-xs text-slate-400">Belum tersedia data distribusi ruangan pada periode ini.</p>
                </div>
              ) : (
                <div className="h-[290px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    {haisRoomChartType === 'bar' ? (
                      <BarChart data={haisRoomData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
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

      </div>
    </DashboardLayout>
  );
}

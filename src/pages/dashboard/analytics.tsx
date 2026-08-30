import { ReactElement, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  BarChart2, TrendingUp, Filter, Download, Activity, Users, ClipboardCheck, 
  AlertTriangle, CheckCircle2, Clock, ShieldCheck, Shield, FileText, 
  FileSpreadsheet, ImageIcon, Calendar, Award, AlertCircle, UserCheck, 
  RefreshCw, Building2, Layers, ChevronDown, Check, HelpCircle, Droplets
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
        
        {/* HEADER PAGE - 3D Tactile Neumorphic Container */}
        <div className="relative group bg-[#18193b] rounded-[28px] md:rounded-[32px] p-6 sm:p-7 border border-[#2b2d56] transition-all duration-300 transform-gpu overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)]">
          {/* Top Bevel Highlight */}
          <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient uppercase">
                  Grafik SMART PPI
                </h1>
                {loading && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#12132e] text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                    Memuat Data...
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
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

              {/* Sub Filter: Profesi */}
              <div className="relative group/select">
                <label className="absolute -top-2.5 left-3 px-2 bg-[#18193b] border border-indigo-500/20 text-[9px] font-black text-indigo-300 uppercase tracking-widest z-10 rounded-md shadow-sm">
                  Kategori Profesi
                </label>
                <select
                  value={selectedProfesiGroup}
                  onChange={(e) => setSelectedProfesiGroup(e.target.value)}
                  className="w-full bg-[#161735] border border-indigo-900/40 text-white text-xs font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                >
                  <option value="Semua Profesi" className="bg-[#18193b] text-white">Semua Profesi</option>
                  <option value="Perawat / Bidan" className="bg-[#18193b] text-white">Perawat / Bidan</option>
                  <option value="Dokter" className="bg-[#18193b] text-white">Dokter</option>
                  <option value="Nakes Lainnya" className="bg-[#18193b] text-white">Nakes Lainnya</option>
                </select>
              </div>
            </div>
          </div>
        </div>

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {hhProfBreakdown.map((prof) => (
                  <div
                    key={prof.name}
                    className="p-5 rounded-2xl bg-[#12132e] border border-indigo-900/40 space-y-3 relative overflow-hidden shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] hover:border-emerald-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-200">{prof.name}</span>
                      <span className="text-2xl font-black text-emerald-400 font-heading drop-shadow-[0_2px_6px_rgba(16,185,129,0.4)]">{prof.pct}%</span>
                    </div>

                    {/* Recessed Progress Bar */}
                    <div className="w-full h-3 bg-[#0a0a1a] rounded-full overflow-hidden p-0.5 border border-black/40 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8)]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${prof.pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-2 border-t border-indigo-900/30 text-[10px] text-slate-400 text-center font-bold">
                      <div className="bg-[#161735]/60 p-1.5 rounded-lg border border-white/5">Obs: <strong className="text-white font-mono">{prof.data.obs}</strong></div>
                      <div className="bg-[#161735]/60 p-1.5 rounded-lg border border-white/5">Patuh: <strong className="text-emerald-400 font-mono">{prof.data.patuh}</strong></div>
                      <div className="bg-[#161735]/60 p-1.5 rounded-lg border border-white/5">T.Patuh: <strong className="text-rose-400 font-mono">{prof.data.tidakPatuh}</strong></div>
                    </div>
                  </div>
                ))}
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b2d56" />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {apdProfBreakdown.map((prof) => (
                  <div
                    key={prof.name}
                    className="p-5 rounded-2xl bg-[#12132e] border border-indigo-900/40 space-y-3 relative overflow-hidden shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] hover:border-sky-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-200">{prof.name}</span>
                      <span className="text-2xl font-black text-sky-400 font-heading drop-shadow-[0_2px_6px_rgba(56,189,248,0.4)]">{prof.pct}%</span>
                    </div>

                    {/* Recessed Progress Bar */}
                    <div className="w-full h-3 bg-[#0a0a1a] rounded-full overflow-hidden p-0.5 border border-black/40 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8)]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${prof.pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-sky-600 via-indigo-500 to-sky-400 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-2 border-t border-indigo-900/30 text-[10px] text-slate-400 text-center font-bold">
                      <div className="bg-[#161735]/60 p-1.5 rounded-lg border border-white/5">Obs: <strong className="text-white font-mono">{prof.data.obs}</strong></div>
                      <div className="bg-[#161735]/60 p-1.5 rounded-lg border border-white/5">Patuh: <strong className="text-sky-400 font-mono">{prof.data.patuh}</strong></div>
                      <div className="bg-[#161735]/60 p-1.5 rounded-lg border border-white/5">T.Patuh: <strong className="text-rose-400 font-mono">{prof.data.tidakPatuh}</strong></div>
                    </div>
                  </div>
                ))}
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#2b2d56" />
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

      </div>
    </DashboardLayout>
  );
}

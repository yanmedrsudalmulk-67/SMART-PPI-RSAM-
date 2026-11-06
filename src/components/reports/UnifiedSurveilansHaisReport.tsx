import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Activity, BarChart, LineChart, TrendingUp,
  Calendar, ChevronDown
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, LabelList
} from 'recharts';

import { useAppContext } from '@/components/Providers';
import { ReportSkeleton } from '@/components/SkeletonLoading';
import { forceScrollToTop } from '@/utils/scrollHelper';

// Standard clinical indicators for HAIs
const INDICATORS = [
  {
    id: 'phlebitis',
    name: 'Phlebitis',
    label: 'Phlebitis',
    labelLines: ['Phlebitis'],
    unit: '‰',
    multiplier: 1000,
    target: 1,
    targetLabel: '≤ 1‰',
    caseColor: '#3b82f6', // Blue line (Gambar 3)
    rateColor: '#f97316', // Orange line (Gambar 3)
    targetColor: '#94a3b8', // Grey line (Gambar 3)
  },
  {
    id: 'isk',
    name: 'ISK',
    label: 'ISK Terkait Kateter (CAUTI)',
    labelLines: ['ISK Terkait', 'Kateter (CAUTI)'],
    unit: '‰',
    multiplier: 1000,
    target: 4.7,
    targetLabel: '≤ 4.7‰',
    caseColor: '#22c55e', // Green line (Gambar 3)
    rateColor: '#38bdf8', // Sky blue line (Gambar 3)
    targetColor: '#eab308', // Yellow/Amber line (Gambar 3)
  },
  {
    id: 'decubitus',
    name: 'Decubitus',
    label: 'Decubitus',
    labelLines: ['Decubitus'],
    unit: '‰',
    multiplier: 1000,
    target: 1.5,
    targetLabel: '≤ 1.5‰',
    caseColor: '#22c55e',
    rateColor: '#38bdf8',
    targetColor: '#eab308',
  },
  {
    id: 'ido',
    name: 'IDO',
    label: 'Infeksi Daerah Operasi (IDO)',
    labelLines: ['Infeksi Daerah', 'Operasi (IDO)'],
    unit: '%',
    multiplier: 100,
    target: 2,
    targetLabel: '≤ 2%',
    caseColor: '#f97316',
    rateColor: '#38bdf8',
    targetColor: '#eab308',
  },
  {
    id: 'vap',
    name: 'VAP',
    label: 'Ventilator Associated Pneumonia (VAP)',
    labelLines: ['Ventilator Associated', 'Pneumonia (VAP)'],
    unit: '‰',
    multiplier: 1000,
    target: 5.8,
    targetLabel: '≤ 5.8‰',
    caseColor: '#a855f7',
    rateColor: '#38bdf8',
    targetColor: '#eab308',
  },
];

const COLORS: Record<string, string> = {
  Phlebitis: '#06b6d4',
  ISK: '#10b981',
  IDO: '#f97316',
  VAP: '#a855f7',
  Decubitus: '#f43f5e',
};

// Canonical room order matching Input Surveilans HAIs and Gambar 3
const ROOMS_BASE = ['Ranap Dewasa', 'Ranap Anak', 'Ranap Kebidanan', 'Ranap Bedah'];

const KATEGORI_HAIS = [
  'Semua HAIs',
  'Phlebitis',
  'ISK',
  'Decubitus',
  'IDO',
  'VAP',
];

const RUANGAN_LIST = [
  'Semua Ruangan',
  'Ranap Dewasa',
  'Ranap Anak',
  'Ranap Kebidanan',
  'Ranap Bedah',
];

const MONTHS_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const MONTHS_EXCEL_HEADER = [
  'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN',
  'JUL', 'AGST', 'SEPT', 'OKTBR', 'NVMBR', 'DSMBR',
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function lastDayOfMonth(year: number, monthZeroIndexed: number): number {
  return new Date(year, monthZeroIndexed + 1, 0).getDate();
}

function fmtChartNum(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '';
  if (val === 0) return '0';
  const rounded1 = Number(val.toFixed(1));
  return Number.isInteger(rounded1) ? String(rounded1) : rounded1.toFixed(1).replace('.', ',');
}

export interface ExternalPeriodeProps {
  periodeType: string;
  setPeriodeType: (v: string) => void;
  selectedMonth: number;
  setSelectedMonth: (v: number) => void;
  selectedYear: number;
  setSelectedYear: (v: number) => void;
  selectedQuarter: number;
  setSelectedQuarter: (v: number) => void;
  selectedSemester: number;
  setSelectedSemester: (v: number) => void;
}

export default function UnifiedSurveilansHaisReport({
  externalPeriode,
}: {
  externalPeriode?: ExternalPeriodeProps;
}) {
  const { hospitalLogoUrl } = useAppContext();

  const [localPeriodeType, setLocalPeriodeType] = useState('Bulanan');
  const [localMonth, setLocalMonth] = useState(new Date().getMonth());
  const [localYear, setLocalYear] = useState(new Date().getFullYear());
  const [localQuarter, setLocalQuarter] = useState(Math.floor(new Date().getMonth() / 3));
  const [localSemester, setLocalSemester] = useState(Math.floor(new Date().getMonth() / 6));

  const periodeType = externalPeriode ? externalPeriode.periodeType : localPeriodeType;
  const setPeriodeType = externalPeriode ? externalPeriode.setPeriodeType : setLocalPeriodeType;
  const selectedMonth = externalPeriode ? externalPeriode.selectedMonth : localMonth;
  const setSelectedMonth = externalPeriode ? externalPeriode.setSelectedMonth : setLocalMonth;
  const selectedYear = externalPeriode ? externalPeriode.selectedYear : localYear;
  const setSelectedYear = externalPeriode ? externalPeriode.setSelectedYear : setLocalYear;
  const selectedQuarter = externalPeriode ? externalPeriode.selectedQuarter : localQuarter;
  const setSelectedQuarter = externalPeriode ? externalPeriode.setSelectedQuarter : setLocalQuarter;
  const selectedSemester = externalPeriode ? externalPeriode.selectedSemester : localSemester;
  const setSelectedSemester = externalPeriode ? externalPeriode.setSelectedSemester : setLocalSemester;

  const [yearlyTrendInd, setYearlyTrendInd] = useState<string>('phlebitis');

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const syncedYearsRef = useRef<Set<number>>(new Set());

  // Compute timezone-safe YYYY-MM-DD start & end dates
  const { startDateStr, endDateStr, periodTitle } = useMemo(() => {
    if (periodeType === 'Bulanan') {
      const m = selectedMonth;
      const lastDay = lastDayOfMonth(selectedYear, m);
      return {
        startDateStr: `${selectedYear}-${pad2(m + 1)}-01`,
        endDateStr: `${selectedYear}-${pad2(m + 1)}-${pad2(lastDay)}`,
        periodTitle: `Bulan ${MONTHS_FULL[m]} ${selectedYear}`,
      };
    } else if (periodeType === 'Triwulan') {
      const mStart = selectedQuarter * 3;
      const mEnd = mStart + 2;
      const lastDay = lastDayOfMonth(selectedYear, mEnd);
      return {
        startDateStr: `${selectedYear}-${pad2(mStart + 1)}-01`,
        endDateStr: `${selectedYear}-${pad2(mEnd + 1)}-${pad2(lastDay)}`,
        periodTitle: `Triwulan ${['I', 'II', 'III', 'IV'][selectedQuarter]} ${selectedYear}`,
      };
    } else if (periodeType === 'Semester') {
      const mStart = selectedSemester * 6;
      const mEnd = mStart + 5;
      const lastDay = lastDayOfMonth(selectedYear, mEnd);
      return {
        startDateStr: `${selectedYear}-${pad2(mStart + 1)}-01`,
        endDateStr: `${selectedYear}-${pad2(mEnd + 1)}-${pad2(lastDay)}`,
        periodTitle: `Semester ${['I', 'II'][selectedSemester]} ${selectedYear}`,
      };
    } else {
      return {
        startDateStr: `${selectedYear}-01-01`,
        endDateStr: `${selectedYear}-12-31`,
        periodTitle: `Tahun ${selectedYear}`,
      };
    }
  }, [periodeType, selectedMonth, selectedYear, selectedQuarter, selectedSemester]);

  const loadData = useCallback(async () => {
    try {
      const yearStart = `${selectedYear}-01-01T00:00:00.000Z`;
      const yearEnd = `${selectedYear}-12-31T23:59:59.999Z`;
      const query = supabase
        .from('audit_sessions')
        .select('*')
        .eq('kategori', 'Surveilans HAIs')
        .gte('tanggal_waktu', yearStart)
        .lte('tanggal_waktu', yearEnd)
        .order('tanggal_waktu', { ascending: true });

      const { data: resData } = await query;
      const filteredDb = (resData || []).map((r: any) => ({
        ...r,
        jumlah_patuh: Number(r.jumlah_patuh) || 0,
        jumlah_dinilai: Number(r.jumlah_dinilai) || 0,
        persentase: Number(r.persentase) || 0,
      }));

      setData(filteredDb);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  // Realtime auto-sync with SIMRS Khanza whenever report is opened or period changes
  const syncFromSimrs = useCallback(async () => {
    try {
      if (!syncedYearsRef.current.has(selectedYear)) {
        syncedYearsRef.current.add(selectedYear);
        const todayStr = new Date().toISOString().slice(0, 10);
        const maxEnd = `${selectedYear}-12-31` > todayStr ? todayStr : `${selectedYear}-12-31`;
        await fetch(`/api/simrs/hais?startDate=${selectedYear}-01-01&endDate=${maxEnd}&autoSync=true`);
        await loadData();
      } else {
        await fetch(`/api/simrs/hais?startDate=${startDateStr}&endDate=${endDateStr}&autoSync=true`);
        await loadData();
      }
    } catch {
      // SIMRS offline fallback uses existing local SQLite data
    }
  }, [selectedYear, startDateStr, endDateStr, loadData]);

  useEffect(() => {
    loadData();
    syncFromSimrs();

    const interval = setInterval(() => {
      syncFromSimrs();
    }, 30000);

    const ch = supabase
      .channel('hais_report_changes_unified')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_sessions', filter: 'kategori=eq.Surveilans HAIs' },
        () => loadData()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(ch);
    };
  }, [loadData, syncFromSimrs]);

  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    forceScrollToTop();
  }, []);

  useEffect(() => {
    if (!loading && isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      forceScrollToTop();
    }
  }, [loading]);

  // Filter data strictly by YYYY-MM-DD string comparison (zero timezone shift)
  const currentData = useMemo(() => {
    return data.filter((d) => {
      const tgl = (d.tanggal_waktu || d.created_at || '').slice(0, 10);
      return tgl >= startDateStr && tgl <= endDateStr;
    });
  }, [data, startDateStr, endDateStr]);

  // Canonical rooms list
  const roomsToDisplay = useMemo(() => {
    return [...ROOMS_BASE];
  }, []);

  // Helper to match indicator row
  const matchesIndicator = useCallback((d: any, indicatorId: string) => {
    const dbId = (d.indikator_id || '').toLowerCase();
    const dbName = (d.nama_indikator || '').toLowerCase();
    return (
      dbId === indicatorId ||
      dbName === indicatorId ||
      dbName === indicatorId.replace('_', ' ') ||
      (indicatorId === 'isk' && (dbId === 'isk' || dbName === 'isk' || dbName.includes('saluran kemih'))) ||
      (indicatorId === 'phlebitis' && (dbId === 'phlebitis' || dbName === 'phlebitis' || dbName.includes('plebitis'))) ||
      (indicatorId === 'vap' && (dbId === 'vap' || dbName === 'vap' || dbName.includes('ventilator'))) ||
      (indicatorId === 'ido' && (dbId === 'ido' || dbName === 'ido' || dbName.includes('operasi'))) ||
      (indicatorId === 'decubitus' && (dbId === 'decubitus' || dbName === 'decubitus' || dbName.includes('dekubitus'))) ||
      (indicatorId === 'iadp' && (dbId === 'iadp' || dbName === 'iadp' || dbName.includes('iadp') || dbName.includes('aliran darah'))) ||
      (indicatorId === 'hap' && (dbId === 'hap' || dbName === 'hap' || dbName.includes('hap') || dbName.includes('pneumonia')))
    );
  }, []);

  // Utility to fetch specific indicator values for a room
  const getIndicatorDataForRoom = useCallback(
    (room: string, indicatorId: string) => {
      const filtered = currentData.filter((d) => d.unit === room && matchesIndicator(d, indicatorId));
      const n = filtered.reduce((sum, item) => sum + (Number(item.jumlah_patuh) || 0), 0);
      const d = filtered.reduce((sum, item) => sum + (Number(item.jumlah_dinilai) || 0), 0);

      const indicatorObj = INDICATORS.find((ind) => ind.id === indicatorId);
      const multiplier = indicatorObj ? indicatorObj.multiplier : 1000;
      const rate = d > 0 ? Number(((n / d) * multiplier).toFixed(2)) : 0;
      const hasData = d > 0;

      return { n, d, rate, hasData };
    },
    [currentData, matchesIndicator]
  );

  // Aggregate values for bottom row (JUMLAH)
  const getIndicatorTotal = useCallback(
    (indicatorId: string) => {
      let totalN = 0;
      let totalD = 0;

      roomsToDisplay.forEach((room) => {
        const { n, d } = getIndicatorDataForRoom(room, indicatorId);
        totalN += n;
        totalD += d;
      });

      const indicatorObj = INDICATORS.find((ind) => ind.id === indicatorId);
      const multiplier = indicatorObj ? indicatorObj.multiplier : 1000;
      const rate = totalD > 0 ? Number(((totalN / totalD) * multiplier).toFixed(2)) : 0;
      const hasData = totalD > 0;

      return { n: totalN, d: totalD, rate, hasData };
    },
    [roomsToDisplay, getIndicatorDataForRoom]
  );

  // Indicators to show in Gambar 3 Room Breakdown Charts
  const indicatorsForBreakdown = useMemo(() => {
    return INDICATORS;
  }, []);

  // 12-Month Trend Data for Gambar 4 (JAN .. DSMBR)
  const yearlyMonthlyDataByIndicator = useMemo(() => {
    const result: Record<
      string,
      Array<{
        monthIndex: number;
        monthShort: string;
        num: number;
        den: number;
        hasData: boolean;
        pencapaian: number | null;
        target: number;
      }>
    > = {};

    INDICATORS.forEach((ind) => {
      const monthsArr = Array.from({ length: 12 }, (_, mIdx) => ({
        monthIndex: mIdx,
        monthShort: MONTHS_EXCEL_HEADER[mIdx],
        num: 0,
        den: 0,
        hasData: false,
        pencapaian: null as number | null,
        target: ind.target,
      }));

      data.forEach((row) => {
        if (!matchesIndicator(row, ind.id)) return;
        const tgl = (row.tanggal_waktu || row.created_at || '').slice(0, 10);
        if (!tgl.startsWith(`${selectedYear}-`)) return;
        const mIdx = parseInt(tgl.slice(5, 7), 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          monthsArr[mIdx].num += Number(row.jumlah_patuh) || 0;
          monthsArr[mIdx].den += Number(row.jumlah_dinilai) || 0;
        }
      });

      monthsArr.forEach((m) => {
        if (m.den > 0) {
          m.hasData = true;
          m.pencapaian = Number(((m.num / m.den) * ind.multiplier).toFixed(1));
        } else {
          m.hasData = false;
          m.pencapaian = null;
        }
      });

      result[ind.id] = monthsArr;
    });

    return result;
  }, [data, selectedYear, matchesIndicator]);

  return (
    <div className="flex flex-col gap-6 w-full fade-in zoom-in-95 animate-in duration-500 pb-32">
      {/* HEADER & FILTER PERIODE */}
      <div className="mb-2 flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="text-center lg:text-left w-full lg:w-auto shrink-0">
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient uppercase">
            SURVEILANS HAIs
          </h1>
          <p className="text-sm text-slate-300 mt-1 font-medium">
            Monitoring Real-Time Insiden Healthcare-Associated Infections (HAIs) Terintegrasi SIMRS
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
          {/* Filter Periode */}
          <div className="relative group w-full sm:w-auto">
            <div className="relative bg-[#18193b] rounded-full p-2 sm:p-2.5 sm:px-3.5 border border-[#2b2d56] transition-all duration-300 transform-gpu overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)]">
              <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

              <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 relative z-10">
                <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12132e] border border-white/10 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.06)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                    PERIODE
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={periodeType}
                    onChange={(e) => setPeriodeType(e.target.value)}
                    className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-full pl-3.5 pr-8 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] capitalize"
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

                {periodeType === 'Bulanan' && (
                  <div className="relative">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-full pl-3.5 pr-8 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                    >
                      {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'].map((m, i) => (
                        <option key={m} value={i} className="bg-[#18193b] text-white">{m}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}
                {periodeType === 'Triwulan' && (
                  <div className="relative">
                    <select
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                      className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-full pl-3.5 pr-8 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
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
                {periodeType === 'Semester' && (
                  <div className="relative">
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                      className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-full pl-3.5 pr-8 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                    >
                      <option value={0} className="bg-[#18193b] text-white">SM 1 (Jan-Jun)</option>
                      <option value={1} className="bg-[#18193b] text-white">SM 2 (Jul-Des)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}

                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-full pl-3.5 pr-8 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
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
      </div>

      {loading && !data.length ? (
        <ReportSkeleton />
      ) : (
        <>
          {/* 1. TABEL UTAMA LAPORAN SURVEILANS HAIs */}
          <div className="bg-[#18193b] rounded-[28px] md:rounded-[32px] border border-[#2b2d56] overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] transition-all mt-2 relative">
            <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            {/* Logo, Header Laporan */}
            <div className="p-6 sm:p-8 border-b border-indigo-900/30 bg-[#141532]/60 backdrop-blur-md">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {hospitalLogoUrl && (
                  <img src={hospitalLogoUrl} alt="Logo RS" className="w-20 h-20 object-contain" />
                )}
                <div className="text-center md:text-left">
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">
                    Laporan Surveilans HAIs
                  </h2>
                  <h3 className="text-sm font-bold text-slate-300 uppercase">
                    UOBK RSUD AL-MULK KOTA SUKABUMI
                  </h3>
                  <p className="text-slate-400 font-bold mt-1 uppercase text-xs">
                    Periode: {periodeType} {selectedYear}{' '}
                    {periodeType === 'Bulanan' ? `- ${MONTHS_FULL[selectedMonth]}` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto relative max-w-full scrollbar-thin">
              <table className="w-full text-left border-collapse min-w-full">
                <thead>
                  <tr className="bg-[#12132e] border-b border-indigo-900/30">
                    <th
                      className="py-2.5 px-2 text-[11px] font-black uppercase tracking-wider text-slate-300 w-[3%] text-center border-r border-indigo-900/30"
                      rowSpan={2}
                    >
                      No
                    </th>
                    <th
                      className="py-2.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-300 w-[11%] border-r border-indigo-900/30"
                      rowSpan={2}
                    >
                      Ruangan
                    </th>

                    {INDICATORS.map((ind) => (
                      <th
                        key={ind.id}
                        className="py-1.5 px-1.5 text-center text-[10px] font-black uppercase tracking-wider text-white border-r border-indigo-900/30 leading-tight"
                        colSpan={4}
                        style={{ backgroundColor: COLORS[ind.name] + 'dd' }}
                      >
                        <div className="flex flex-col justify-center items-center">
                          {ind.labelLines.map((line, lIdx) => (
                            <span key={lIdx} className="block whitespace-normal">
                              {line}
                            </span>
                          ))}
                        </div>
                      </th>
                    ))}
                  </tr>

                  <tr className="bg-[#0e0f24] text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-indigo-900/30">
                    {INDICATORS.map((ind) => (
                      <React.Fragment key={`${ind.id}-sub`}>
                        <th className="py-1.5 px-1 text-center font-black w-[4%] border-r border-indigo-950/60">N</th>
                        <th className="py-1.5 px-1 text-center font-black w-[4%] border-r border-indigo-950/60">D</th>
                        <th className="py-1.5 px-1.5 text-center font-black w-[6%] border-r border-indigo-950/60">{ind.unit}</th>
                        <th className="py-1.5 px-1.5 text-center font-black w-[6%] border-r-2 border-indigo-900/40 bg-indigo-950/20">Target</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[12px]">
                  {roomsToDisplay.map((room, idx) => (
                    <tr key={room} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="py-2 px-2 text-center font-bold text-slate-400 border-r border-indigo-900/30 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-bold text-white border-r border-indigo-900/30 uppercase">
                        {room}
                      </td>

                      {INDICATORS.map((ind) => {
                        const { n, d, rate } = getIndicatorDataForRoom(room, ind.id);
                        const isCompliant = rate <= ind.target;
                        const badgeColorText = isCompliant
                          ? 'text-emerald-400 font-black'
                          : 'text-red-400 font-black';

                        return (
                          <React.Fragment key={`${room}-${ind.id}`}>
                            <td className="py-2 px-1 text-center font-semibold font-mono text-slate-300 border-r border-indigo-950/40">
                              {n}
                            </td>
                            <td className="py-2 px-1 text-center font-semibold font-mono text-slate-300 border-r border-indigo-950/40">
                              {d}
                            </td>
                            <td
                              className={`py-2 px-1.5 text-center font-mono font-bold border-r border-indigo-950/40 transition-colors ${
                                d > 0 ? (isCompliant ? 'bg-emerald-500/10' : 'bg-red-500/10') : ''
                              }`}
                            >
                              {d > 0 ? (
                                <span className={badgeColorText}>
                                  {rate.toFixed(2)}
                                  {ind.unit}
                                </span>
                              ) : (
                                <span className="text-slate-600 font-mono">0.00{ind.unit}</span>
                              )}
                            </td>
                            <td className="py-2 px-1 text-center font-mono font-bold text-[10px] text-slate-400 bg-indigo-950/20 border-r-2 border-indigo-900/40">
                              {ind.targetLabel}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}

                  {/* TOTAL (JUMLAH) ROW */}
                  <tr className="bg-[#12132e] border-t-2 border-indigo-900/40 text-white font-black text-[12px]">
                    <td className="py-2.5 px-2 text-center border-r border-indigo-900/30" />
                    <td className="py-2.5 px-3 uppercase tracking-wider border-r border-indigo-900/30 font-black text-cyan-400">
                      JUMLAH
                    </td>

                    {INDICATORS.map((ind) => {
                      const { n, d, rate } = getIndicatorTotal(ind.id);
                      const isCompliant = rate <= ind.target;
                      const textColorClass = isCompliant
                        ? 'text-emerald-400 font-black'
                        : 'text-red-400 font-black';

                      return (
                        <React.Fragment key={`total-${ind.id}`}>
                          <td className="py-2.5 px-1 text-center font-mono text-slate-200 font-bold border-r border-indigo-950/40">
                            {n}
                          </td>
                          <td className="py-2.5 px-1 text-center font-mono text-slate-200 font-bold border-r border-indigo-950/40">
                            {d}
                          </td>
                          <td
                            className={`py-2.5 px-1 text-center font-mono font-extrabold border-r border-indigo-950/40 ${
                              d > 0 ? (isCompliant ? 'bg-emerald-500/20' : 'bg-red-500/20') : ''
                            }`}
                          >
                            {d > 0 ? (
                              <span className={textColorClass}>
                                {rate.toFixed(2)}
                                {ind.unit}
                              </span>
                            ) : (
                              <span className="text-slate-600">0.00{ind.unit}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-1 text-center font-mono font-black text-[10px] text-slate-400 bg-indigo-950/30 border-r-2 border-indigo-900/40">
                            {ind.targetLabel}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. GRAFIK INSIDEN RATE HAIs PER RUANGAN (PERSIS FORMAT GAMBAR 3) */}
          <div className="bg-[#18193b] rounded-[28px] md:rounded-[32px] border border-[#2b2d56] p-5 sm:p-7 shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-indigo-900/30">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5 uppercase tracking-wider">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Grafik Insiden Rate HAIs Per Ruangan ({periodTitle})
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5">
                  Perbandingan jumlah kasus, insiden rate (‰ / %), dan target standar di tiap ruangan rawat inap
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {indicatorsForBreakdown.map((ind) => {
                const roomRows = ROOMS_BASE.map((room) => {
                  const { n, d, rate } = getIndicatorDataForRoom(room, ind.id);
                  const rate1 = Number(rate.toFixed(1));
                  return {
                    room,
                    kasus: n,
                    den: d,
                    rate: rate1,
                    target: ind.target,
                  };
                });

                const maxChartVal = Math.max(
                  ...roomRows.map((r) => Math.max(r.kasus, r.rate, r.target)),
                  ind.target + 1,
                  5
                );
                const yDomainMax = Math.ceil(maxChartVal * 1.2);

                return (
                  <div
                    key={`room-breakdown-${ind.id}`}
                    className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch bg-[#12132e]/80 rounded-2xl p-4 sm:p-5 border border-indigo-900/40"
                  >
                    {/* LEFT TABLE: Rekap Ruangan (Sesuai Gambar 3 Kiri) */}
                    <div className="xl:col-span-4 flex flex-col justify-start">
                      <div className="bg-[#00b050] text-white font-extrabold text-xs sm:text-sm text-center py-2.5 px-3 rounded-t-xl tracking-wide shadow-sm">
                        {ind.name} {periodTitle}
                      </div>
                      <div className="overflow-hidden rounded-b-xl border border-indigo-900/50 bg-[#161838]">
                        <table className="w-full text-xs sm:text-sm border-collapse">
                          <thead>
                            <tr className="bg-[#1e2148] text-slate-200 border-b border-indigo-900/50">
                              <th className="py-2.5 px-3 text-center font-bold border-r border-indigo-900/40">
                                Ruangan
                              </th>
                              <th className="py-2.5 px-2.5 text-center font-bold border-r border-indigo-900/40">
                                {ind.name}
                              </th>
                              <th className="py-2.5 px-2.5 text-center font-bold border-r border-indigo-900/40">
                                {ind.unit}
                              </th>
                              <th className="py-2.5 px-2.5 text-center font-bold">
                                Target
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-indigo-900/30">
                            {roomRows.map((r) => (
                              <tr key={r.room} className="hover:bg-white/[0.03] transition-colors">
                                <td className="py-2.5 px-3 text-center font-semibold text-slate-200 border-r border-indigo-900/40">
                                  {r.room}
                                </td>
                                <td className="py-2.5 px-2.5 text-center font-mono font-bold text-white border-r border-indigo-900/40">
                                  {r.kasus}
                                </td>
                                <td className="py-2.5 px-2.5 text-center font-mono font-bold text-cyan-300 border-r border-indigo-900/40">
                                  {fmtChartNum(r.rate)}
                                </td>
                                <td className="py-2.5 px-2.5 text-center font-mono font-bold text-amber-300">
                                  {fmtChartNum(ind.target)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* RIGHT CHART + INTEGRATED DATA TABLE (Sesuai Gambar 3 Kanan) */}
                    <div className="xl:col-span-8 bg-[#161838] rounded-xl border border-indigo-900/50 p-4 sm:p-5 flex flex-col justify-between">
                      <h4 className="text-center text-sm sm:text-base font-extrabold text-slate-200 tracking-wide mb-3">
                        Insiden rate HAIs {ind.name} {periodeType === 'Bulanan' ? MONTHS_FULL[selectedMonth] : ''} {selectedYear}
                      </h4>

                      {/* Line Chart */}
                      <div className="h-[230px] sm:h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart
                            data={roomRows}
                            margin={{ top: 24, right: 24, left: 0, bottom: 4 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#2b2d56" />
                            <XAxis
                              dataKey="room"
                              stroke="#94a3b8"
                              fontSize={11}
                              tickLine={false}
                              axisLine={{ stroke: '#334155' }}
                              padding={{ left: 45, right: 45 }}
                            />
                            <YAxis
                              stroke="#94a3b8"
                              fontSize={11}
                              tickLine={false}
                              axisLine={{ stroke: '#334155' }}
                              domain={[0, yDomainMax]}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#12132e',
                                borderRadius: '12px',
                                border: '1px solid #2b2d56',
                                color: '#fff',
                              }}
                              formatter={(val: any, name: any) => [
                                typeof val === 'number' ? fmtChartNum(val) : val,
                                name,
                              ]}
                            />
                            <Line
                              type="linear"
                              dataKey="kasus"
                              name={ind.name}
                              stroke={ind.caseColor}
                              strokeWidth={2.5}
                              dot={{ r: 4.5, fill: '#161838', stroke: ind.caseColor, strokeWidth: 2.5 }}
                              activeDot={{ r: 6 }}
                            >
                              <LabelList
                                dataKey="kasus"
                                position="top"
                                offset={10}
                                fill="#e2e8f0"
                                fontSize={11}
                                fontWeight="bold"
                              />
                            </Line>
                            <Line
                              type="linear"
                              dataKey="rate"
                              name={ind.unit}
                              stroke={ind.rateColor}
                              strokeWidth={2.5}
                              dot={{ r: 4.5, fill: '#161838', stroke: ind.rateColor, strokeWidth: 2.5 }}
                              activeDot={{ r: 6 }}
                            >
                              <LabelList
                                dataKey="rate"
                                position="top"
                                offset={10}
                                fill="#fdba74"
                                fontSize={11}
                                fontWeight="bold"
                                formatter={(v: any) => fmtChartNum(Number(v))}
                              />
                            </Line>
                            <Line
                              type="linear"
                              dataKey="target"
                              name="Target"
                              stroke={ind.targetColor}
                              strokeWidth={2.5}
                              dot={{ r: 4.5, fill: '#161838', stroke: ind.targetColor, strokeWidth: 2.5 }}
                              activeDot={{ r: 6 }}
                            >
                              <LabelList
                                dataKey="target"
                                position="top"
                                offset={8}
                                fill="#fde047"
                                fontSize={10}
                                fontWeight="bold"
                                formatter={(v: any) => fmtChartNum(Number(v))}
                              />
                            </Line>
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Integrated Excel-Style Data Table Below Chart */}
                      <div className="mt-1 overflow-x-auto">
                        <table className="w-full text-[11px] sm:text-xs border-collapse border border-indigo-900/50 bg-[#12132e]">
                          <thead>
                            <tr className="bg-[#1a1c3f] text-slate-300 border-b border-indigo-900/50">
                              <th className="py-1.5 px-2.5 text-left font-bold w-[125px] border-r border-indigo-900/50">
                                Indikator
                              </th>
                              {roomRows.map((r) => (
                                <th
                                  key={`hdr-${r.room}`}
                                  className="py-1.5 px-2 text-center font-bold border-r border-indigo-900/50 last:border-r-0"
                                >
                                  {r.room}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-indigo-900/40 font-mono">
                            {/* Row 1: Kasus */}
                            <tr>
                              <td className="py-1.5 px-2.5 font-sans font-bold text-slate-200 border-r border-indigo-900/50 flex items-center gap-2">
                                <span
                                  className="inline-flex items-center justify-center w-5 h-0.5 relative shrink-0"
                                  style={{ backgroundColor: ind.caseColor }}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full bg-[#12132e] border-2"
                                    style={{ borderColor: ind.caseColor }}
                                  />
                                </span>
                                <span className="truncate">{ind.name}</span>
                              </td>
                              {roomRows.map((r) => (
                                <td
                                  key={`kasus-${r.room}`}
                                  className="py-1.5 px-2 text-center font-bold text-slate-200 border-r border-indigo-900/50 last:border-r-0"
                                >
                                  {r.kasus}
                                </td>
                              ))}
                            </tr>

                            {/* Row 2: Rate (‰ or %) */}
                            <tr>
                              <td className="py-1.5 px-2.5 font-sans font-bold text-slate-200 border-r border-indigo-900/50 flex items-center gap-2">
                                <span
                                  className="inline-flex items-center justify-center w-5 h-0.5 relative shrink-0"
                                  style={{ backgroundColor: ind.rateColor }}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full bg-[#12132e] border-2"
                                    style={{ borderColor: ind.rateColor }}
                                  />
                                </span>
                                <span>{ind.unit}</span>
                              </td>
                              {roomRows.map((r) => (
                                <td
                                  key={`rate-${r.room}`}
                                  className="py-1.5 px-2 text-center font-bold text-amber-300 border-r border-indigo-900/50 last:border-r-0"
                                >
                                  {fmtChartNum(r.rate)}
                                </td>
                              ))}
                            </tr>

                            {/* Row 3: Target */}
                            <tr>
                              <td className="py-1.5 px-2.5 font-sans font-bold text-slate-200 border-r border-indigo-900/50 flex items-center gap-2">
                                <span
                                  className="inline-flex items-center justify-center w-5 h-0.5 relative shrink-0"
                                  style={{ backgroundColor: ind.targetColor }}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full bg-[#12132e] border-2"
                                    style={{ borderColor: ind.targetColor }}
                                  />
                                </span>
                                <span>Target</span>
                              </td>
                              {roomRows.map((r) => (
                                <td
                                  key={`target-${r.room}`}
                                  className="py-1.5 px-2 text-center font-bold text-slate-300 border-r border-indigo-900/50 last:border-r-0"
                                >
                                  {fmtChartNum(ind.target)}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. TABEL & GRAFIK TREN TAHUNAN 12 BULAN (PERSIS FORMAT GAMBAR 4) */}
          <div className="bg-[#18193b] rounded-[28px] md:rounded-[32px] border border-[#2b2d56] p-5 sm:p-7 shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-4 border-b border-indigo-900/30">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5 uppercase tracking-wider">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Rekapitulasi & Grafik Tren Insiden Rate HAIs Tahunan ({selectedYear})
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5">
                  Tren pencapaian bulanan (Januari s/d Desember {selectedYear}) terhadap standar target nasional
                </p>
              </div>

              {/* Selector Indikator untuk Tren 12 Bulan */}
              <div className="flex flex-wrap gap-1.5 bg-[#12132e] p-1.5 rounded-2xl border border-indigo-900/40">
                {INDICATORS.map((ind) => {
                  const isActive = yearlyTrendInd === ind.id;
                  return (
                    <button
                      key={`yr-tab-${ind.id}`}
                      type="button"
                      onClick={() => setYearlyTrendInd(ind.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-400 text-slate-950 shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {ind.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {INDICATORS.filter((ind) => ind.id === yearlyTrendInd).map((ind) => {
              const monthsData = yearlyMonthlyDataByIndicator[ind.id] || [];
              const maxMonthVal = Math.max(
                ...monthsData.map((m) => Math.max(m.pencapaian ?? 0, m.target)),
                ind.target + 2,
                10
              );
              const yMax = Math.ceil(maxMonthVal * 1.15);

              return (
                <div key={`yearly-section-${ind.id}`} className="space-y-6">
                  {/* Badge Kuning Sesuai Gambar 4 (mis. PHLEBITIS 2026) */}
                  <div className="inline-block bg-yellow-300 text-slate-950 font-black text-sm sm:text-base px-4 py-1.5 rounded-md shadow-sm uppercase tracking-wider">
                    {ind.name.toUpperCase()} {selectedYear}
                  </div>

                  {/* Tabel Rekap 12 Bulan di Atas (Header Biru Muda / Cyan Sesuai Gambar 4) */}
                  <div className="overflow-x-auto rounded-xl border border-indigo-900/60 bg-[#12132e]">
                    <table className="w-full text-xs border-collapse min-w-[760px]">
                      <thead>
                        <tr className="bg-[#00b0f0] text-slate-950 font-black uppercase">
                          <th
                            rowSpan={2}
                            className="py-2.5 px-3 text-center border-r border-slate-900/30 w-[150px]"
                          >
                            INDIKATOR
                          </th>
                          <th colSpan={12} className="py-1.5 px-2 text-center border-b border-slate-900/30">
                            BULAN
                          </th>
                        </tr>
                        <tr className="bg-[#00b0f0] text-slate-950 font-extrabold uppercase text-[11px]">
                          {monthsData.map((m) => (
                            <th
                              key={`top-hdr-${m.monthShort}`}
                              className="py-1.5 px-1.5 text-center border-r border-slate-900/30 last:border-r-0"
                            >
                              {m.monthShort}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-900/40 font-mono">
                        <tr className="bg-[#161838] hover:bg-white/[0.02]">
                          <td className="py-2 px-3 font-sans font-extrabold text-white text-center border-r border-indigo-900/50">
                            PENCAPAIAN
                          </td>
                          {monthsData.map((m) => (
                            <td
                              key={`top-val-${m.monthShort}`}
                              className="py-2 px-1.5 text-center font-bold text-emerald-300 border-r border-indigo-900/40 last:border-r-0"
                            >
                              {m.pencapaian !== null ? fmtChartNum(m.pencapaian) : ''}
                            </td>
                          ))}
                        </tr>
                        <tr className="bg-[#12132e] hover:bg-white/[0.02]">
                          <td className="py-2 px-3 font-sans font-extrabold text-white text-center border-r border-indigo-900/50">
                            TARGET
                          </td>
                          {monthsData.map((m) => (
                            <td
                              key={`top-tgt-${m.monthShort}`}
                              className="py-2 px-1.5 text-center font-bold text-cyan-300 border-r border-indigo-900/40 last:border-r-0"
                            >
                              {fmtChartNum(m.target)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Card Grafik Line 12 Bulan + Tabel Terintegrasi di Bawahnya (Sesuai Gambar 4) */}
                  <div className="bg-[#161838] rounded-2xl border border-indigo-900/50 p-4 sm:p-6">
                    <h4 className="text-center text-base sm:text-lg font-extrabold text-slate-200 tracking-wide mb-4">
                      Insiden Rate HAIs {ind.name.toUpperCase()} {selectedYear}
                    </h4>

                    <div className="h-[270px] sm:h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={monthsData}
                          margin={{ top: 24, right: 20, left: 0, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#2b2d56" />
                          <XAxis
                            dataKey="monthShort"
                            stroke="#94a3b8"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: '#334155' }}
                            padding={{ left: 20, right: 20 }}
                          />
                          <YAxis
                            stroke="#94a3b8"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: '#334155' }}
                            domain={[0, yMax]}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#12132e',
                              borderRadius: '12px',
                              border: '1px solid #2b2d56',
                              color: '#fff',
                            }}
                            formatter={(val: any, name: any) => [
                              typeof val === 'number' ? `${fmtChartNum(val)} ${ind.unit}` : '-',
                              name,
                            ]}
                          />
                          <Line
                            type="linear"
                            dataKey="pencapaian"
                            name="PENCAPAIAN"
                            stroke="#22c55e"
                            strokeWidth={2.5}
                            connectNulls={false}
                            dot={{ r: 4, fill: '#22c55e', stroke: '#22c55e', strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          >
                            <LabelList
                              dataKey="pencapaian"
                              position="top"
                              offset={10}
                              fill="#86efac"
                              fontSize={11}
                              fontWeight="bold"
                              formatter={(v: any) =>
                                v !== null && v !== undefined ? fmtChartNum(Number(v)) : ''
                              }
                            />
                          </Line>
                          <Line
                            type="linear"
                            dataKey="target"
                            name="TARGET"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#3b82f6', stroke: '#3b82f6', strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          >
                            <LabelList
                              dataKey="target"
                              position="top"
                              offset={8}
                              fill="#93c5fd"
                              fontSize={10}
                              fontWeight="bold"
                              formatter={(v: any) => fmtChartNum(Number(v))}
                            />
                          </Line>
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Tabel Terintegrasi di Bawah Grafik 12 Bulan (Persis Gambar 4) */}
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-[11px] sm:text-xs border-collapse border border-indigo-900/50 bg-[#12132e] min-w-[760px]">
                        <thead>
                          <tr className="bg-[#1a1c3f] text-slate-300 border-b border-indigo-900/50">
                            <th
                              rowSpan={2}
                              className="py-1.5 px-2.5 text-left font-bold w-[145px] border-r border-indigo-900/50"
                            />
                            {monthsData.map((m) => (
                              <th
                                key={`btm-hdr-${m.monthShort}`}
                                className="py-1.5 px-1.5 text-center font-bold border-r border-indigo-900/50 last:border-r-0"
                              >
                                {m.monthShort}
                              </th>
                            ))}
                          </tr>
                          <tr className="bg-[#151735] text-slate-400 border-b border-indigo-900/50">
                            <th colSpan={12} className="py-1 text-center text-[10px] font-extrabold tracking-widest uppercase">
                              BULAN
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-900/40 font-mono">
                          <tr>
                            <td className="py-1.5 px-2.5 font-sans font-bold text-slate-200 border-r border-indigo-900/50 flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-5 h-0.5 bg-[#22c55e] relative shrink-0">
                                <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                              </span>
                              <span>PENCAPAIAN</span>
                            </td>
                            {monthsData.map((m) => (
                              <td
                                key={`btm-val-${m.monthShort}`}
                                className="py-1.5 px-1.5 text-center font-bold text-emerald-300 border-r border-indigo-900/50 last:border-r-0"
                              >
                                {m.pencapaian !== null ? fmtChartNum(m.pencapaian) : ''}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="py-1.5 px-2.5 font-sans font-bold text-slate-200 border-r border-indigo-900/50 flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-5 h-0.5 bg-[#3b82f6] relative shrink-0">
                                <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                              </span>
                              <span>TARGET</span>
                            </td>
                            {monthsData.map((m) => (
                              <td
                                key={`btm-tgt-${m.monthShort}`}
                                className="py-1.5 px-1.5 text-center font-bold text-blue-300 border-r border-indigo-900/50 last:border-r-0"
                              >
                                {fmtChartNum(m.target)}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo, ReactElement } from 'react';
import dynamic from 'next/dynamic';
import { 
  AlertCircle, Shield, Droplets, BarChart2, LineChart, Settings, ChevronLeft, ChevronRight, TrendingUp, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { useAppContext } from '@/components/Providers';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useDashboardStore } from '@/hooks/useDashboardStore';

import { 
  ResponsiveContainer, ComposedChart, AreaChart, Bar, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine
} from '@/components/ChartComponents';

// --- Types ---
interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  active: boolean;
  sort_order: number;
}

interface Standard {
  indikator: string;
  nilai_standar: number;
  operator: '>=' | '<=';
}

interface HaisData {
  phlebitis: number;
  isk: number;
  ido: number;
  vap: number;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    id: 's1',
    title: 'SMART PPI Terpadu',
    subtitle: 'Pusat Pemantauan dan Pengendalian Infeksi UOBK RSUD AL-MULK. Mencegah lebih baik daripada mengobati.',
    image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1600',
    active: true,
    sort_order: 1
  },
  {
    id: 's2',
    title: 'Standar Keselamatan Pasien',
    subtitle: 'Mari tingkatkan kepatuhan Kebersihan Tangan dan penggunaan APD demi mewujudkan zero insiden.',
    image_url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=1600',
    active: true,
    sort_order: 2
  }
];

const DEFAULT_STANDARDS: Record<string, Standard> = {
  hh: { indikator: 'Kebersihan Tangan', nilai_standar: 85, operator: '>=' },
  apd: { indikator: 'Kepatuhan Penggunaan APD', nilai_standar: 100, operator: '>=' },
  phlebitis: { indikator: 'Phlebitis', nilai_standar: 1.5, operator: '<=' },
  isk: { indikator: 'ISK', nilai_standar: 5, operator: '<=' },
  ido: { indikator: 'IDO', nilai_standar: 2, operator: '<=' },
  vap: { indikator: 'VAP', nilai_standar: 5, operator: '<=' }
};

// --- Standalone Components & Helpers for Performance ---
const HeroSlider = ({ slides, isLoading }: { slides: Slide[], isLoading: boolean }) => {
  const [idx, setIdx] = useState(0);
  const visibleSlides = useMemo(() => slides.filter(s => s.active), [slides]);
  
  useEffect(() => {
    if(visibleSlides.length <= 1) return;
    const timer = setInterval(() => {
       setIdx(p => (p + 1) % visibleSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [visibleSlides.length]);

  if (isLoading) return (
    <div className="relative w-full h-[300px] md:h-[400px] rounded-[32px] overflow-hidden bg-slate-100 dark:bg-[#0B1120] flex items-center justify-center">
       <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if(visibleSlides.length === 0) return null;

  return (
    <div className="relative w-full h-[300px] md:h-[400px] rounded-[32px] overflow-hidden bg-slate-100 dark:bg-[#0b1120]">
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Image src={visibleSlides[idx].image_url} alt="Slide" fill priority className="object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 z-10">
            <h2 className="text-xl md:text-4xl font-black mb-3 text-white drop-shadow-md">{visibleSlides[idx].title}</h2>
            <p className="text-sm md:text-xl font-bold opacity-100 max-w-2xl text-white drop-shadow-md">{visibleSlides[idx].subtitle}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
         {visibleSlides.map((_, i) => (
           <button key={i} onClick={() => setIdx(i)} className={`w-2 h-2 rounded-full transition-all ${idx === i ? 'bg-white w-6' : 'bg-white/40'}`} />
         ))}
      </div>
    </div>
  );
};

const getStatusColor = (val: number, std: Standard) => {
  if(!std) return 'text-slate-400 dark:text-slate-500';
  const pass = std.operator === '>=' ? val >= std.nilai_standar : val <= std.nilai_standar;
  if (pass) return 'text-emerald-600 dark:text-emerald-400';
  return 'text-red-600 dark:text-red-400';
};

export default function DashboardPage() {
  const { userRole } = useAppContext();
  
  const { dashboardData, setDashboardData, isDashboardLoaded, isGlobalLoading } = useDashboardStore();

  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [isSlidesLoading, setIsSlidesLoading] = useState(true);
  const [standards, setStandards] = useState<Record<string, Standard>>(DEFAULT_STANDARDS);

  const [filterPeriodType, setFilterPeriodType] = useState<'bulanan'|'triwulan'|'semester'|'tahunan'>('bulanan');
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth());
  const [filterQuarter, setFilterQuarter] = useState<number>(Math.floor(new Date().getMonth() / 3));
  const [filterSemester, setFilterSemester] = useState<number>(Math.floor(new Date().getMonth() / 6));
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  const [activeTab, setActiveTab] = useState<'hh'|'apd'|'hais'>('hh');
  const [chartMode, setChartMode] = useState<'bar'|'line'>('bar');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  const [rawData, setRawData] = useState<any>({ hh: [], apd: [], hais: [] });
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Synchronize state with store when it changes
  useEffect(() => {
    if (isDashboardLoaded && dashboardData) {
      setSlides(dashboardData.slides || DEFAULT_SLIDES);
      setStandards(dashboardData.standards || DEFAULT_STANDARDS);
      setRawData(dashboardData.rawData || { hh: [], apd: [], hais: [] });
      setIsSlidesLoading(false);
      setIsDataLoading(false);
    }
  }, [isDashboardLoaded, dashboardData]);

  useEffect(() => {
    // If not loaded yet, fetch will be handled by Layout
    // But we still need to subscribe to changes for immediate local updates
    let mounted = true;
    const fetchFresh = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear - 1, 0, 1).toISOString();

        const [slidesRes, stdRes, hhRes, apdRes, haisRes] = await Promise.all([
          supabase.from('dashboard_slider').select('*').order('sort_order', { ascending: true }),
          supabase.from('dashboard_standards').select('*'),
          supabase.from('audit_hand_hygiene').select('*'),
          supabase.from('audit_apd').select('*'),
          supabase.from('insiden_hais').select('*')
        ]);

        if (!mounted) return;

        const newRawData = { hh: hhRes.data || [], apd: apdRes.data || [], hais: haisRes.data || [] };
        const newSlides = (slidesRes.data && slidesRes.data.length > 0) ? slidesRes.data : DEFAULT_SLIDES;
        const newStandards: any = {
          hh: { indikator: 'Kebersihan Tangan', nilai_standar: 85, operator: '>=' },
          apd: { indikator: 'Kepatuhan Penggunaan APD', nilai_standar: 100, operator: '>=' },
          phlebitis: { indikator: 'Phlebitis', nilai_standar: 1.5, operator: '<=' },
          isk: { indikator: 'ISK', nilai_standar: 5, operator: '<=' },
          ido: { indikator: 'IDO', nilai_standar: 2, operator: '<=' },
          vap: { indikator: 'VAP', nilai_standar: 5, operator: '<=' }
        };
        if (stdRes.data) {
          stdRes.data.forEach(s => {
            const key = s.indikator.toLowerCase();
            if (newStandards[key]) newStandards[key] = s;
            else if (key.includes('phle')) newStandards.phlebitis = s;
            else if (key.includes('isk')) newStandards.isk = s;
            else if (key.includes('ido')) newStandards.ido = s;
            else if (key.includes('vap')) newStandards.vap = s;
          });
        }

        setDashboardData({ slides: newSlides, standards: newStandards, rawData: newRawData });
      } catch (e) {
        console.error("Manual refresh error", e);
      }
    };

    const channels = [
      supabase.channel('hh_ch').on('postgres_changes', { event: '*', schema: 'public', table: 'audit_hand_hygiene' }, () => fetchFresh()).subscribe(),
      supabase.channel('apd_ch').on('postgres_changes', { event: '*', schema: 'public', table: 'audit_apd' }, () => fetchFresh()).subscribe(),
      supabase.channel('hais_ch').on('postgres_changes', { event: '*', schema: 'public', table: 'insiden_hais' }, () => fetchFresh()).subscribe(),
      supabase.channel('std_ch').on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_standards' }, () => fetchFresh()).subscribe()
    ];

    return () => { 
      mounted = false; 
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [setDashboardData]);

    const { units, stats, chartDataList } = useMemo(() => {
      const isDateMatch = (dateStr: string) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (d.getFullYear() !== filterYear) return false;
        if (filterPeriodType === 'bulanan') return d.getMonth() === filterMonth;
        if (filterPeriodType === 'triwulan') return Math.floor(d.getMonth() / 3) === filterQuarter;
        if (filterPeriodType === 'semester') return Math.floor(d.getMonth() / 6) === filterSemester;
        return true; // tahunan
      };

      const hhData = rawData.hh.filter((d: any) => isDateMatch(d.start_time || d.created_at));
      const apdData = rawData.apd.filter((d: any) => isDateMatch(d.tanggal_waktu || d.created_at));
      const haisData = (rawData.hais || []).filter((d: any) => isDateMatch(d.tanggal_waktu || d.created_at));

      const unitSet = new Set<string>();
      [...hhData, ...apdData, ...haisData].forEach(d => {
        if (d.unit) unitSet.add(d.unit);
        if (d.ruangan) unitSet.add(d.ruangan);
      });
      const unitsList = ['all', ...Array.from(unitSet).sort()];

      // Helper for grouping
      const getGroupKey = (dateStr: string, pType: string) => {
        if(!dateStr) return "Unknown";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "Unknown";
        const m = date.getMonth();
        const y = date.getFullYear();
        if (pType === "bulanan") return `${["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"][m]} ${y}`;
        if (pType === "triwulan") return `TW${Math.floor(m / 3) + 1} ${y}`;
        if (pType === "semester") return `SM${Math.floor(m / 6) + 1} ${y}`;
        return `${y}`;
      };

      const grouped: Record<string, any> = {};
      let totalHhPercSum = 0;
      let hhRecordCount = 0;
      let tApdPatuh = 0;
      let tApdDinilai = 0;
      const tHais = { phlebitis: 0, isk: 0, ido: 0, vap: 0 };
      const tHaisCounts = { phlebitis: 0, isk: 0, ido: 0, vap: 0 };

      const unitMatch = (d: any) => selectedUnit === 'all' || d.unit === selectedUnit || d.ruangan === selectedUnit;

      hhData.filter(unitMatch).forEach((d: any) => {
         const k = getGroupKey(d.start_time || d.created_at, filterPeriodType);
         if(!grouped[k]) grouped[k] = { hhSum: 0, hhCount: 0, apdPatuh: 0, apdDin: 0, hPhle: 0, hIsk: 0, hIdo: 0, hVap: 0 };
         
         const p = Number(d.persentase) || 0;
         grouped[k].hhSum += p;
         grouped[k].hhCount++;
         totalHhPercSum += p;
         hhRecordCount++;
      });

      apdData.filter(unitMatch).forEach((d: any) => {
         const k = getGroupKey(d.tanggal_waktu || d.created_at, filterPeriodType);
         if(!grouped[k]) grouped[k] = { hhSum: 0, hhCount: 0, apdPatuh: 0, apdDin: 0, hPhle: 0, hIsk: 0, hIdo: 0, hVap: 0 };
         
         // Recalculate APD to match report logic if necessary
         let p = Number(d.jumlah_patuh) || 0;
         let n = Number(d.jumlah_dinilai) || 0;
         
         const components = ['masker', 'sarung_tangan', 'penutup_kepala', 'apron', 'goggle', 'sepatu_boot', 'gaun_pelindung'];
         let cDinilai = 0;
         let cPatuh = 0;
         components.forEach(comp => {
           const val = String(d[comp] || '').toLowerCase();
           if (val === 'ya' || val === 'sesuai' || val === 'tidak' || val === 'tidak sesuai') {
             cDinilai++;
             if (val === 'ya' || val === 'sesuai') cPatuh++;
           }
         });
         
         if (cDinilai > 0) {
           p = cPatuh;
           n = cDinilai;
         }

         grouped[k].apdPatuh += p;
         grouped[k].apdDin += n;
         tApdPatuh += p;
         tApdDinilai += n;
      });

      haisData.filter(unitMatch).forEach((d: any) => {
         const k = getGroupKey(d.tanggal_waktu || d.created_at, filterPeriodType);
         if(!grouped[k]) grouped[k] = { hhSum: 0, hhCount: 0, apdPatuh: 0, apdDin: 0, hPhle: 0, hIsk: 0, hIdo: 0, hVap: 0 };
         const r = parseFloat(d.rate) || 0;
         const type = String(d.jenis).toLowerCase();
         if(type.includes('ph')) { grouped[k].hPhle += r; tHais.phlebitis += r; tHaisCounts.phlebitis++; }
         else if(type.includes('isk')) { grouped[k].hIsk += r; tHais.isk += r; tHaisCounts.isk++; }
         else if(type.includes('ido')) { grouped[k].hIdo += r; tHais.ido += r; tHaisCounts.ido++; }
         else if(type.includes('vap')) { grouped[k].hVap += r; tHais.vap += r; tHaisCounts.vap++; }
      });

      // Simple string sort
      const sortedKeys = Object.keys(grouped).sort((a,b) => {
        const getVal = (s:string) => { 
          const p = s.split(' '); 
          const year = parseInt(p[p.length-1]);
          const monthIdx = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"].indexOf(p[0]);
          return (isNaN(year) ? 0 : year * 100) + (monthIdx === -1 ? 0 : monthIdx);
        }
        return getVal(a) - getVal(b);
      }); 

      const finalChartData = sortedKeys.map(k => {
         const g = grouped[k];
         return {
            name: k,
            hh: g.hhCount > 0 ? Number((g.hhSum / g.hhCount).toFixed(1)) : 0,
            apd: g.apdDin > 0 ? Number(((g.apdPatuh / g.apdDin)*100).toFixed(1)) : 0,
            phlebitis: Number(g.hPhle.toFixed(2)), 
            isk: Number(g.hIsk.toFixed(2)), 
            ido: Number(g.hIdo.toFixed(2)), 
            vap: Number(g.hVap.toFixed(2))
         }
      });

      const computedStats = {
        hh: hhRecordCount > 0 ? Math.round(totalHhPercSum / hhRecordCount) : 0,
        apd: tApdDinilai > 0 ? Math.round((tApdPatuh / tApdDinilai) * 100) : 0,
        hais: {
          phlebitis: tHaisCounts.phlebitis > 0 ? Number((tHais.phlebitis / tHaisCounts.phlebitis).toFixed(2)) : 0,
          isk: tHaisCounts.isk > 0 ? Number((tHais.isk / tHaisCounts.isk).toFixed(2)) : 0,
          ido: tHaisCounts.ido > 0 ? Number((tHais.ido / tHaisCounts.ido).toFixed(2)) : 0,
          vap: tHaisCounts.vap > 0 ? Number((tHais.vap / tHaisCounts.vap).toFixed(2)) : 0
        }
      };

      return { units: unitsList, stats: computedStats, chartDataList: finalChartData };
    }, [rawData, selectedUnit, filterPeriodType, filterMonth, filterQuarter, filterSemester, filterYear]);

  const getStatusColor = (val: number, std: Standard) => {
     if(!std) return 'text-slate-400 dark:text-slate-500';
     const pass = std.operator === '>=' ? val >= std.nilai_standar : val <= std.nilai_standar;
     if (pass) return 'text-emerald-600 dark:text-emerald-400';
     return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient transition-all uppercase">Dashboard SMART PPI</h1>
          <div className="mt-1">
            <p className="text-slate-900 dark:text-slate-400 text-[13px] sm:text-lg font-normal leading-tight max-w-[280px] sm:max-w-none">
              Pencegahan Dan Pengendalian Infeksi di UOBK RSUD Al-Mulk Kota Sukabumi
            </p>
          </div>
        </div>
      </div>

      <HeroSlider slides={slides} isLoading={isSlidesLoading} />
      
      {/* Global Period Filter - Control Center Style */}
      <section className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[32px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="relative bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl rounded-[32px] p-6 md:p-8 border border-slate-200 dark:border-white/10 shadow-sm transition-all overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
            <Activity className="w-24 h-24" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 dark:bg-blue-600/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Filter Data Utama</h3>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100">Pilih Periode Monitoring</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto lg:min-w-[600px]">
              {/* Select Period Type */}
              <div className="relative group/select">
                <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[#111827] text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest z-10">Tipe</label>
                <select 
                  value={filterPeriodType} 
                  onChange={(e) => setFilterPeriodType(e.target.value as any)} 
                  className="w-full bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="bulanan" className="dark:bg-slate-900">BULANAN</option>
                  <option value="triwulan" className="dark:bg-slate-900">TRIWULAN</option>
                  <option value="semester" className="dark:bg-slate-900">SEMESTER</option>
                  <option value="tahunan" className="dark:bg-slate-900">TAHUNAN</option>
                </select>
              </div>

              {/* Select Detail Period */}
              <div className="relative group/select">
                <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[#111827] text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest z-10">
                  {filterPeriodType === 'bulanan' ? 'Bulan' : filterPeriodType === 'triwulan' ? 'Triwulan' : filterPeriodType === 'semester' ? 'Semester' : 'Detail'}
                </label>
                <div className="relative">
                  {filterPeriodType === 'bulanan' && (
                    <select value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))} className="w-full bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all appearance-none cursor-pointer disabled:opacity-50">
                      {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => <option key={i} value={i} className="dark:bg-slate-900">{m}</option>)}
                    </select>
                  )}
                  {filterPeriodType === 'triwulan' && (
                    <select value={filterQuarter} onChange={(e) => setFilterQuarter(parseInt(e.target.value))} className="w-full bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all appearance-none cursor-pointer">
                      <option value={0} className="dark:bg-slate-900">TW 1 (Jan-Mar)</option>
                      <option value={1} className="dark:bg-slate-900">TW 2 (Apr-Jun)</option>
                      <option value={2} className="dark:bg-slate-900">TW 3 (Jul-Sep)</option>
                      <option value={3} className="dark:bg-slate-900">TW 4 (Okt-Des)</option>
                    </select>
                  )}
                  {filterPeriodType === 'semester' && (
                    <select value={filterSemester} onChange={(e) => setFilterSemester(parseInt(e.target.value))} className="w-full bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all appearance-none cursor-pointer">
                      <option value={0} className="dark:bg-slate-900">SM 1 (Jan-Jun)</option>
                      <option value={1} className="dark:bg-slate-900">SM 2 (Jul-Des)</option>
                    </select>
                  )}
                  {filterPeriodType === 'tahunan' && (
                    <div className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500 text-sm font-bold rounded-2xl px-4 py-4">Tahun Penuh</div>
                  )}
                </div>
              </div>

              {/* Select Year */}
              <div className="relative group/select">
                <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[#111827] text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest z-10">Tahun</label>
                <select value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))} className="w-full bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all appearance-none cursor-pointer">
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} className="dark:bg-slate-900">{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* HH Card */}
        <div 
          className="group relative bg-white dark:bg-[#111827] p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500"
        >
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
            <Droplets className="w-16 h-16 text-blue-600" />
          </div>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-600/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 leading-none mb-1">Indikator Mutu</h3>
              <p className="text-[20px] font-bold text-slate-700 dark:text-slate-300">Kepatuhan Kebersihan Tangan</p>
            </div>
          </div>
          <div className="flex items-baseline gap-3 mb-4">
            <span className={`text-6xl font-black tracking-tighter ${getStatusColor(stats.hh, standards.hh)}`}>{stats.hh}%</span>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-[15px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Capaian</span>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1">Standard: {standards.hh.nilai_standar}%</span>
              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${stats.hh >= standards.hh.nilai_standar ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                {stats.hh >= standards.hh.nilai_standar ? 'Tercapai' : 'Di Bawah Standar'}
              </span>
            </div>
          </div>
        </div>

        {/* APD Card */}
        <div 
          className="group relative bg-white dark:bg-[#111827] p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-500"
        >
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
            <Shield className="w-16 h-16 text-emerald-600" />
          </div>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-600/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 leading-none mb-1">Indikator Mutu</h3>
              <p className="text-[20px] font-bold text-slate-700 dark:text-slate-300">Kepatuhan Penggunaan APD</p>
            </div>
          </div>
          <div className="flex items-baseline gap-3 mb-4">
            <span className={`text-6xl font-black tracking-tighter ${getStatusColor(stats.apd, standards.apd)}`}>{stats.apd}%</span>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-[15px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Capaian</span>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1">Standard: {standards.apd.nilai_standar}%</span>
              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${stats.apd >= standards.apd.nilai_standar ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                {stats.apd >= standards.apd.nilai_standar ? 'Tercapai' : 'Di Bawah Standar'}
              </span>
            </div>
          </div>
        </div>

        {/* HAIs Card */}
        <div 
          className="group relative bg-white dark:bg-[#111827] p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-red-500/10 transition-all duration-500"
        >
           <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
            <AlertCircle className="w-16 h-16 text-red-600" />
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 dark:bg-red-600/20 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 leading-none mb-1">Indikator Mutu</h3>
              <p className="text-[20px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">Monitoring INSIDEN RATE HAIs</p>
            </div>
          </div>
           <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-[16px] border border-slate-100 dark:border-white/5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Phlebitis</p>
                <p className={`text-lg font-black ${getStatusColor(stats.hais.phlebitis, standards.phlebitis)}`}>{stats.hais.phlebitis}‰</p>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-[16px] border border-slate-100 dark:border-white/5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">ISK</p>
                <p className={`text-lg font-black ${getStatusColor(stats.hais.isk, standards.isk)}`}>{stats.hais.isk}‰</p>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-[16px] border border-slate-100 dark:border-white/5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">IDO</p>
                <p className={`text-lg font-black ${getStatusColor(stats.hais.ido, standards.ido)}`}>{stats.hais.ido}‰</p>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-[16px] border border-slate-100 dark:border-white/5">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">VAP</p>
                <p className={`text-lg font-black ${getStatusColor(stats.hais.vap, standards.vap)}`}>{stats.hais.vap}‰</p>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-[32px] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm dark:shadow-none transition-all mt-8">
         <div className="p-6 border-b border-slate-200 dark:border-white/5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-wrap gap-2">
               {[ { id: 'hh', label: 'KEBERSIHAN TANGAN', icon: Droplets, c: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-white/10' }, 
                  { id: 'apd', label: 'KEPATUHAN APD', icon: Shield, c: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-white/10' },
                  { id: 'hais', label: 'INSIDEN HAIS', icon: AlertCircle, c: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 dark:bg-white/10' }
               ].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                     className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === t.id ? `${t.bg} ${t.c}` : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                     <t.icon className="w-4 h-4" /> {t.label}
                  </button>
               ))}
            </div>

            <div className="flex flex-wrap gap-3">
               <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg px-3 py-2 outline-none">
                 {units.map(u => <option key={u} value={u} className="bg-white dark:bg-slate-900">{u.toUpperCase()}</option>)}
               </select>
               <div className="flex bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
                 <button onClick={() => setChartMode('bar')} className={`p-2 transition-colors ${chartMode === 'bar' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 dark:text-slate-500'}`}><BarChart2 className="w-4 h-4" /></button>
                 <button onClick={() => setChartMode('line')} className={`p-2 transition-colors ${chartMode === 'line' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 dark:text-slate-500'}`}><LineChart className="w-4 h-4" /></button>
               </div>
            </div>
         </div>

         <div className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
               {isDataLoading ? (
                 <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
                   <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                   <p className="text-sm font-medium">Memuat data monitoring...</p>
                 </div>
               ) : chartDataList.length > 0 ? (
                 chartMode === 'bar' ? (
                   <ComposedChart data={chartDataList}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                     <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                     <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                     <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                     <Legend />
                     {activeTab === 'hais' ? (
                       <>
                         <Bar dataKey="phlebitis" name="Phlebitis (‰)" fill="#f43f5e" radius={[4,4,0,0]} stackId="a" />
                         <Bar dataKey="isk" name="ISK (‰)" fill="#3b82f6" radius={[4,4,0,0]} stackId="a" />
                         <Bar dataKey="ido" name="IDO (‰)" fill="#10b981" radius={[4,4,0,0]} stackId="a" />
                         <Bar dataKey="vap" name="VAP (‰)" fill="#f59e0b" radius={[4,4,0,0]} stackId="a" />
                       </>
                     ) : activeTab === 'hh' ? (
                       <Bar dataKey="hh" name="Capaian HH (%)" fill="#3b82f6" radius={[8,8,0,0]} />
                     ) : (
                       <Bar dataKey="apd" name="Capaian APD (%)" fill="#10b981" radius={[8,8,0,0]} />
                     )}
                     {/* <Line type="monotone" dataKey={() => standards[activeTab]?.nilai_standar || 0} stroke="#f43f5e" strokeDasharray="5 5" name="Target" dot={false} /> */}
                   </ComposedChart>
                 ) : (
                   <AreaChart data={chartDataList}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                     <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                     <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                     <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                     <Legend />
                     {activeTab === 'hais' ? (
                       <>
                         <Area type="monotone" dataKey="phlebitis" name="Phlebitis" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} />
                         <Area type="monotone" dataKey="isk" name="ISK" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                         <Area type="monotone" dataKey="ido" name="IDO" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                         <Area type="monotone" dataKey="vap" name="VAP" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                       </>
                     ) : activeTab === 'hh' ? (
                       <Area type="monotone" dataKey="hh" name="Capaian HH" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                     ) : (
                       <Area type="monotone" dataKey="apd" name="Capaian APD" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                     )}
                   </AreaChart>
                 )
               ) : (
                   <div className="flex items-center justify-center h-full text-slate-500">No data available</div>
               )}
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
}

DashboardPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

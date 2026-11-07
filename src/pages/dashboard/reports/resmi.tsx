import { useState, useMemo, ReactElement, useRef, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import ZoomableReportViewer from '@/components/reports/ZoomableReportViewer';
import PdfDownloadButton from '@/components/reports/PdfDownloadButton';
import MonthlyOfficialReport from '@/components/reports/official/MonthlyOfficialReport';
import QuarterlyOfficialReport from '@/components/reports/official/QuarterlyOfficialReport';
import SemesterOfficialReport from '@/components/reports/official/SemesterOfficialReport';
import AnnualOfficialReport from '@/components/reports/official/AnnualOfficialReport';
import { useOfficialReportData } from '@/hooks/useOfficialReportData';
import { 
  FileText, Calendar, BarChart3, TrendingUp, Award, ChevronDown, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SheetType = 'monthly' | 'quarterly' | 'semester' | 'annual';

const SHEETS_CONFIG = [
  { id: 'monthly' as SheetType, label: 'Bulanan', icon: Calendar, desc: 'Laporan IPCN Bulanan (F4)' },
  { id: 'quarterly' as SheetType, label: 'Triwulan', icon: BarChart3, desc: 'Laporan Mutu Triwulan Direktur (F4)' },
  { id: 'semester' as SheetType, label: 'Semester', icon: TrendingUp, desc: 'Laporan Semester I & II (F4)' },
  { id: 'annual' as SheetType, label: 'Tahunan', icon: Award, desc: 'Laporan Tahunan Lengkap (F4)' },
];

const MONTH_OPTIONS = [
  { value: 0, label: 'Januari' },
  { value: 1, label: 'Februari' },
  { value: 2, label: 'Maret' },
  { value: 3, label: 'April' },
  { value: 4, label: 'Mei' },
  { value: 5, label: 'Juni' },
  { value: 6, label: 'Juli' },
  { value: 7, label: 'Agustus' },
  { value: 8, label: 'September' },
  { value: 9, label: 'Oktober' },
  { value: 10, label: 'November' },
  { value: 11, label: 'Desember' },
];

const QUARTER_OPTIONS = [
  { value: 0, label: 'Triwulan I (Jan - Mar)' },
  { value: 1, label: 'Triwulan II (Apr - Jun)' },
  { value: 2, label: 'Triwulan III (Jul - Sep)' },
  { value: 3, label: 'Triwulan IV (Okt - Des)' },
];

const SEMESTER_OPTIONS = [
  { value: 0, label: 'Semester I (Jan - Jun)' },
  { value: 1, label: 'Semester II (Jul - Des)' },
];

const YEAR_OPTIONS = [2024, 2025, 2026, 2027];

/** Quick touch-scrubber scrollbar for mobile screens */
function MobileQuickScroller() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;

    const handleScroll = () => {
      const max = mainEl.scrollHeight - mainEl.clientHeight;
      if (max > 0) {
        setScrollProgress(mainEl.scrollTop / max);
      }
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToY = (clientY: number) => {
    const mainEl = document.querySelector('main');
    if (!mainEl || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const offsetY = Math.max(0, Math.min(clientY - rect.top, rect.height));
    const fraction = rect.height > 0 ? offsetY / rect.height : 0;
    const max = mainEl.scrollHeight - mainEl.clientHeight;
    mainEl.scrollTop = fraction * max;
    setScrollProgress(fraction);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    scrollToY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    scrollToY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div 
      ref={trackRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="md:hidden fixed right-1 top-24 bottom-24 w-6 z-40 flex items-center justify-center select-none touch-none no-print"
      title="Scroll Cepat Laporan"
      aria-label="Scroll Cepat Laporan"
    >
      {/* Background Track Rail */}
      <div className={`w-2 h-full rounded-full transition-all duration-200 border border-indigo-900/50 relative shadow-inner ${
        isDragging ? 'bg-cyan-500/30' : 'bg-[#12132e]/80'
      }`}>
        {/* Draggable Thumb Indicator */}
        <div 
          className="w-full absolute left-0"
          style={{ top: `${Math.min(Math.max(scrollProgress * 88, 0), 88)}%` }}
        >
          <div className={`w-5 h-8 -ml-1.5 rounded-full shadow-lg border border-cyan-300 flex items-center justify-center transition-transform ${
            isDragging ? 'scale-110 bg-cyan-400' : 'bg-gradient-to-b from-cyan-400 to-blue-600'
          }`}>
            <div className="w-1.5 h-3 flex flex-col justify-between items-center">
              <span className="w-1.5 h-0.5 bg-slate-900 rounded-full" />
              <span className="w-1.5 h-0.5 bg-slate-900 rounded-full" />
              <span className="w-1.5 h-0.5 bg-slate-900 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LaporanResmiPage() {
  const [activeSheet, setActiveSheet] = useState<SheetType>('monthly');

  // Selected period state
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // September
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(2); // Triwulan III (Juli - September)
  const [selectedSemester, setSelectedSemester] = useState<number>(0); // Semester I

  // Dynamic Report Data Hook connected to SQLite / Supabase tables
  const reportData = useOfficialReportData({
    periodType: activeSheet,
    month: selectedMonth,
    year: selectedYear,
    quarter: selectedQuarter,
    semester: selectedSemester,
  });

  // Dropdown period state & controls
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [openSection, setOpenSection] = useState<'monthly' | 'quarterly' | 'semester' | null>('monthly');
  const periodDropdownRef = useRef<HTMLDivElement>(null);

  // Auto-expand current category when dropdown opens
  useEffect(() => {
    if (isPeriodDropdownOpen) {
      if (activeSheet === 'monthly') setOpenSection('monthly');
      else if (activeSheet === 'quarterly') setOpenSection('quarterly');
      else if (activeSheet === 'semester') setOpenSection('semester');
      else setOpenSection(null);
    }
  }, [isPeriodDropdownOpen, activeSheet]);

  // Click outside & Escape key handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(e.target as Node)) {
        setIsPeriodDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPeriodDropdownOpen(false);
    };

    if (isPeriodDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPeriodDropdownOpen]);

  const { currentPeriodLabel, ActivePeriodIcon } = useMemo(() => {
    switch (activeSheet) {
      case 'monthly':
        return {
          currentPeriodLabel: `Bulanan: ${MONTH_OPTIONS[selectedMonth].label}`,
          ActivePeriodIcon: Calendar,
        };
      case 'quarterly':
        return {
          currentPeriodLabel: `Triwulan: ${['I', 'II', 'III', 'IV'][selectedQuarter]}`,
          ActivePeriodIcon: BarChart3,
        };
      case 'semester':
        return {
          currentPeriodLabel: `Semester: ${['I', 'II'][selectedSemester]}`,
          ActivePeriodIcon: TrendingUp,
        };
      case 'annual':
        return {
          currentPeriodLabel: 'Tahunan',
          ActivePeriodIcon: Award,
        };
      default:
        return {
          currentPeriodLabel: 'Pilih Periode',
          ActivePeriodIcon: Calendar,
        };
    }
  }, [activeSheet, selectedMonth, selectedQuarter, selectedSemester]);

  // Target element ID for PDF & Print export
  const targetElementId = useMemo(() => {
    switch (activeSheet) {
      case 'monthly': return 'print-area-monthly';
      case 'quarterly': return 'print-area-quarterly';
      case 'semester': return 'print-area-semester';
      case 'annual': return 'print-area-annual';
      default: return 'print-area-monthly';
    }
  }, [activeSheet]);

  const pdfFilename = useMemo(() => {
    switch (activeSheet) {
      case 'monthly':
        return `Laporan_Resmi_IPCN_${MONTH_OPTIONS[selectedMonth].label}_${selectedYear}_F4.pdf`;
      case 'quarterly':
        return `Laporan_Resmi_Triwulan_${['I', 'II', 'III', 'IV'][selectedQuarter]}_${selectedYear}_F4.pdf`;
      case 'semester':
        return `Laporan_Resmi_Semester_${['I', 'II'][selectedSemester]}_${selectedYear}_F4.pdf`;
      case 'annual':
        return `Laporan_Resmi_Tahunan_${selectedYear}_F4.pdf`;
      default:
        return `Laporan_Resmi_IPCN_${MONTH_OPTIONS[selectedMonth].label}_${selectedYear}_F4.pdf`;
    }
  }, [activeSheet, selectedMonth, selectedYear, selectedQuarter, selectedSemester]);

  return (
    <>
      <Head>
        <title>Laporan PPI | UOBK RSUD Al-Mulk</title>
        <meta name="description" content="Laporan PPI UOBK RSUD Al-Mulk Kertas F4 Terintegrasi Menu Input dan Laporan Audit Indikator" />
      </Head>

      <div className="max-w-[1600px] mx-auto pb-32 relative space-y-4 sm:space-y-6">
        {/* Mobile Quick Scrubber Rail */}
        <MobileQuickScroller />
        
        {/* ================= UNIFIED SINGLE HEADER CARD (1 BARIS) ================= */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 sm:p-4 bg-[#151736] border border-indigo-900/40 rounded-2xl shadow-[-4px_-4px_12px_rgba(140,165,255,0.06),6px_8px_20px_rgba(0,0,0,0.6)] no-print relative z-50">
          
          {/* Left: Title & Logo Icon */}
          <div className="flex items-center gap-3">
            <span className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-sm flex-shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase whitespace-nowrap">
              LAPORAN PPI
            </h1>
          </div>

          {/* Right: Unified Controls in 1 Line (Period Dropdown + Year Select + Download PDF) */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 justify-start md:justify-end">
            
            {/* Period Dropdown Button & Popover Menu */}
            <div className="relative" ref={periodDropdownRef}>
              <button
                type="button"
                onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border shadow-sm cursor-pointer ${
                  isPeriodDropdownOpen
                    ? 'bg-[#1e2254] border-emerald-400 text-white shadow-[0_0_14px_rgba(16,185,129,0.35)]'
                    : 'bg-[#181a3f] hover:bg-[#202356] border-indigo-700/60 text-white'
                }`}
                title="Pilih Jenis & Periode Laporan"
                aria-expanded={isPeriodDropdownOpen}
              >
                <ActivePeriodIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="whitespace-nowrap font-bold text-white">{currentPeriodLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-200 ${isPeriodDropdownOpen ? 'rotate-180 text-emerald-400' : ''}`} />
              </button>

              {/* Dropdown Popup Menu - Solid Theme Color, 100% Opaque (No Translucent Blur) */}
              <AnimatePresence>
                {isPeriodDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    style={{ backgroundColor: '#131536' }}
                    className="absolute right-0 top-full mt-2 w-72 sm:w-84 border-2 border-indigo-500/70 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_20px_rgba(99,102,241,0.25)] p-3 z-50 text-white select-none"
                  >
                    <div className="px-2 pb-2.5 mb-2 border-b border-indigo-800/80 flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      <span>Pilih Periode Laporan</span>
                      <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/90 px-2 py-0.5 rounded border border-cyan-500/40">Format F4</span>
                    </div>

                    <div className="space-y-1.5">
                      {/* --- 1. BULANAN --- */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setOpenSection(openSection === 'monthly' ? null : 'monthly')}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                            activeSheet === 'monthly'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 shadow-sm'
                              : 'text-white hover:text-white hover:bg-[#1e2254] border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Calendar className="w-4 h-4 text-emerald-400" />
                            <span className="font-bold">Bulanan</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {activeSheet === 'monthly' && (
                              <span className="text-[11px] font-mono text-cyan-200 bg-cyan-900/90 px-2 py-0.5 rounded border border-cyan-400/50 font-bold">
                                {MONTH_OPTIONS[selectedMonth].label.slice(0, 3)}
                              </span>
                            )}
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openSection === 'monthly' ? 'rotate-180 text-emerald-400' : 'text-slate-300'}`} />
                          </div>
                        </button>

                        {openSection === 'monthly' && (
                          <div 
                            style={{ backgroundColor: '#0a0c1e' }}
                            className="grid grid-cols-3 gap-1.5 p-2 rounded-xl border border-indigo-900/80 my-1.5"
                          >
                            {MONTH_OPTIONS.map((m) => {
                              const isSel = activeSheet === 'monthly' && selectedMonth === m.value;
                              return (
                                <button
                                  key={m.value}
                                  type="button"
                                  onClick={() => {
                                    setSelectedMonth(m.value);
                                    setActiveSheet('monthly');
                                    setIsPeriodDropdownOpen(false);
                                  }}
                                  className={`px-2 py-2 rounded-lg text-xs font-bold transition-all text-center ${
                                    isSel
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                                      : 'bg-[#15183d] text-slate-200 hover:text-white hover:bg-[#21265c] border border-indigo-950'
                                  }`}
                                >
                                  {m.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* --- 2. TRIWULAN --- */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setOpenSection(openSection === 'quarterly' ? null : 'quarterly')}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                            activeSheet === 'quarterly'
                              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 shadow-sm'
                              : 'text-white hover:text-white hover:bg-[#1e2254] border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <BarChart3 className="w-4 h-4 text-cyan-400" />
                            <span className="font-bold">Triwulan</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {activeSheet === 'quarterly' && (
                              <span className="text-[11px] font-mono text-cyan-200 bg-cyan-900/90 px-2 py-0.5 rounded border border-cyan-400/50 font-bold">
                                TW {['I', 'II', 'III', 'IV'][selectedQuarter]}
                              </span>
                            )}
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openSection === 'quarterly' ? 'rotate-180 text-cyan-400' : 'text-slate-300'}`} />
                          </div>
                        </button>

                        {openSection === 'quarterly' && (
                          <div 
                            style={{ backgroundColor: '#0a0c1e' }}
                            className="flex flex-col gap-1.5 p-2 rounded-xl border border-indigo-900/80 my-1.5"
                          >
                            {QUARTER_OPTIONS.map((q) => {
                              const isSel = activeSheet === 'quarterly' && selectedQuarter === q.value;
                              return (
                                <button
                                  key={q.value}
                                  type="button"
                                  onClick={() => {
                                    setSelectedQuarter(q.value);
                                    setActiveSheet('quarterly');
                                    setIsPeriodDropdownOpen(false);
                                  }}
                                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                    isSel
                                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black shadow-md'
                                      : 'bg-[#15183d] text-slate-200 hover:text-white hover:bg-[#21265c] border border-indigo-950'
                                  }`}
                                >
                                  <span>{q.label}</span>
                                  {isSel && <Check className="w-4 h-4 text-white stroke-[3]" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* --- 3. SEMESTER --- */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setOpenSection(openSection === 'semester' ? null : 'semester')}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                            activeSheet === 'semester'
                              ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/60 shadow-sm'
                              : 'text-white hover:text-white hover:bg-[#1e2254] border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <TrendingUp className="w-4 h-4 text-indigo-400" />
                            <span className="font-bold">Semester</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {activeSheet === 'semester' && (
                              <span className="text-[11px] font-mono text-indigo-200 bg-indigo-900/90 px-2 py-0.5 rounded border border-indigo-400/50 font-bold">
                                Sem {['I', 'II'][selectedSemester]}
                              </span>
                            )}
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openSection === 'semester' ? 'rotate-180 text-indigo-400' : 'text-slate-300'}`} />
                          </div>
                        </button>

                        {openSection === 'semester' && (
                          <div 
                            style={{ backgroundColor: '#0a0c1e' }}
                            className="flex flex-col gap-1.5 p-2 rounded-xl border border-indigo-900/80 my-1.5"
                          >
                            {SEMESTER_OPTIONS.map((s) => {
                              const isSel = activeSheet === 'semester' && selectedSemester === s.value;
                              return (
                                <button
                                  key={s.value}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSemester(s.value);
                                    setActiveSheet('semester');
                                    setIsPeriodDropdownOpen(false);
                                  }}
                                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                    isSel
                                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black shadow-md'
                                      : 'bg-[#15183d] text-slate-200 hover:text-white hover:bg-[#21265c] border border-indigo-950'
                                  }`}
                                >
                                  <span>{s.label}</span>
                                  {isSel && <Check className="w-4 h-4 text-white stroke-[3]" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* --- 4. TAHUNAN --- */}
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSheet('annual');
                            setIsPeriodDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                            activeSheet === 'annual'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 shadow-[0_0_14px_rgba(245,158,11,0.3)]'
                              : 'text-white hover:text-white hover:bg-[#1e2254] border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Award className="w-4 h-4 text-amber-400" />
                            <span className="font-bold">Tahunan (12 Bulan)</span>
                          </div>
                          {activeSheet === 'annual' && <Check className="w-4 h-4 text-amber-300 stroke-[3]" />}
                        </button>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Year Dropdown Select */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-[#181a3f] hover:bg-[#202356] border border-indigo-700/60 hover:border-emerald-500/80 text-white rounded-xl px-2.5 py-2 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer outline-none focus:border-emerald-500"
              title="Pilih Tahun"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y} className="bg-[#151736] text-white">
                  {y}
                </option>
              ))}
            </select>

            {/* PDF Download Button */}
            <PdfDownloadButton 
              targetElementId={targetElementId}
              filename={pdfFilename}
              title="Download Dokumen PDF Resmi Format F4"
              paperSize="f4"
              margin={0}
              size="md"
              className="justify-center"
            />

          </div>
        </div>

        {/* ================= REPORT DOCUMENT VIEWER (F4 PAPER WYSIWYG) ================= */}
        <ZoomableReportViewer reportId={targetElementId} showToolbar={false}>
          <div className="w-full flex justify-center">
            <AnimatePresence mode="wait">
              {activeSheet === 'monthly' && (
                <motion.div
                  key={`monthly-${selectedMonth}-${selectedYear}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  <MonthlyOfficialReport
                    reportData={reportData}
                    month={selectedMonth}
                    year={selectedYear}
                  />
                </motion.div>
              )}

              {activeSheet === 'quarterly' && (
                <motion.div
                  key={`quarterly-${selectedQuarter}-${selectedYear}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  <QuarterlyOfficialReport
                    reportData={reportData}
                    quarter={selectedQuarter}
                    year={selectedYear}
                  />
                </motion.div>
              )}

              {activeSheet === 'semester' && (
                <motion.div
                  key={`semester-${selectedSemester}-${selectedYear}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  <SemesterOfficialReport
                    reportData={reportData}
                    semester={selectedSemester}
                    year={selectedYear}
                  />
                </motion.div>
              )}

              {activeSheet === 'annual' && (
                <motion.div
                  key={`annual-${selectedYear}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  <AnnualOfficialReport year={selectedYear} reportData={reportData} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ZoomableReportViewer>

      </div>
    </>
  );
}

LaporanResmiPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

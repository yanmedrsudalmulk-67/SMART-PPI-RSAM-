import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import {
  Activity,
  ArrowLeft,
  Calendar,
  Search,
  Printer,
  FileSpreadsheet,
  Info,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { SimrsHaisWebResponse, SimrsHaisWebItem } from "@/lib/simrs-db";

type RoomTabKey = 'dewasa' | 'anak' | 'kebidanan' | 'bedah' | 'all';

export default function SurveilansFormPage() {
  const router = useRouter();

  // Sub-tab ruangan SIMRS (persis seperti http://192.168.18.11/almulk/ranap/data_hais1)
  const [selectedRoomTab, setSelectedRoomTab] = useState<RoomTabKey>('dewasa');

  const formatLocalYmd = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Filter tanggal (default: awal bulan berjalan s/d hari ini)
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return formatLocalYmd(d);
  });
  const [endDate, setEndDate] = useState<string>(() => formatLocalYmd(new Date()));

  // Pencarian nama / RM pasien
  const [searchQuery, setSearchQuery] = useState("");

  // Data dari API SIMRS
  const [simrsData, setSimrsData] = useState<SimrsHaisWebResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Debounce ref untuk input tanggal
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load data & auto-sync otomatis saat komponen pertama kali dimuat + polling 30 detik
  useEffect(() => {
    fetchAndAutoSync(startDate, endDate);
    const interval = setInterval(() => {
      fetchAndAutoSync(startDate, endDate, true);
    }, 30000);
    return () => clearInterval(interval);
  }, [startDate, endDate]);

  // Fungsi memuat data dari SIMRS dan otomatis sinkron ke Laporan PPI
  const fetchAndAutoSync = async (start: string, end: string, silent = false) => {
    if (!silent) setIsLoading(true);
    setErrorMessage(null);
    try {
      // autoSync=true memastikan data langsung masuk ke audit_sessions SMART PPI di background
      const res = await fetch(`/api/simrs/hais?startDate=${start}&endDate=${end}&autoSync=true`);
      const data = await res.json();
      if (data.ok) {
        setSimrsData(data);
        if (!data.isOfflineFallback && data.syncedToSmartPpi > 0 && typeof window !== 'undefined') {
          window.postMessage({ type: 'AUDIT_SUBMITTED' }, '*');
          try {
            if ('BroadcastChannel' in window) {
              const bc = new BroadcastChannel('smart_ppi_channel');
              bc.postMessage({ table: 'audit_sessions', eventType: 'INSERT' });
              bc.close();
            }
          } catch {}
        }
      } else {
        throw new Error(data.error || 'Gagal memuat data HAIs');
      }
    } catch (err: any) {
      console.error(err);
      if (!silent) setErrorMessage(`Gagal mengambil data dari SIMRS: ${err.message}`);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Handler perubahan tanggal dengan auto-fetch & auto-sync otomatis
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
  };

  // Preset Cepat Tanggal (langsung auto-fetch & auto-sync)
  const setDatePreset = (preset: 'today' | 'thisMonth' | 'lastMonth' | 'q3_2026') => {
    const now = new Date();
    if (preset === 'today') {
      const today = formatLocalYmd(now);
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'thisMonth') {
      const start = formatLocalYmd(new Date(now.getFullYear(), now.getMonth(), 1));
      const end = formatLocalYmd(now);
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'lastMonth') {
      const start = formatLocalYmd(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const end = formatLocalYmd(new Date(now.getFullYear(), now.getMonth(), 0));
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'q3_2026') {
      setStartDate('2026-09-01');
      setEndDate('2026-09-30');
    }
  };

  // Ekspor Excel (CSV kompatibel Excel)
  const exportToExcel = () => {
    if (!activeRows || activeRows.length === 0) return;
    const roomLabel = selectedRoomTab === 'all'
      ? 'Semua Ruangan'
      : (simrsData?.tabs[selectedRoomTab as keyof typeof simrsData.tabs]?.label || selectedRoomTab);
    const headers = [
      '#', 'Tanggal', 'No RM', 'Nama Pasien', 'Tgl Lahir', 'Dx Medis',
      'ETT', 'CVL', 'IVL', 'UC', 'VAP', 'IAD', 'PLEB', 'ISK', 'ILO', 'Tirah Baring', 'Decubitus', 'Antibiotik', 'Unit'
    ];
    const csvRows = [
      `"Laporan Surveilans HAIs - ${roomLabel}"`,
      `"Periode: ${startDate} s/d ${endDate}"`,
      '',
      headers.join(';')
    ];

    activeRows.forEach((r, idx) => {
      csvRows.push([
        idx + 1,
        `"${r.tanggal}"`,
        `"${r.no_rkm_medis}"`,
        `"${r.nama_pasien.replace(/"/g, '""')}"`,
        `"${r.tgl_lahir}"`,
        `"${r.dx_medis}"`,
        r.ett,
        r.cvl,
        r.ivl,
        r.uc,
        r.vap,
        r.iad,
        r.pleb,
        r.isk,
        r.ilo,
        r.hap,
        `"${r.deku}"`,
        `"${r.antibiotik}"`,
        `"${r.unit}"`
      ].join(';'));
    });

    if (activeTotals) {
      csvRows.push([
        'Total', '', '', '', '', '',
        activeTotals.ett, activeTotals.cvl, activeTotals.ivl, activeTotals.uc,
        activeTotals.vap, activeTotals.iad, activeTotals.pleb, activeTotals.isk,
        activeTotals.ilo, activeTotals.hap, activeTotals.deku, '', ''
      ].join(';'));
      csvRows.push('');
      csvRows.push(`"IR Plebitis: ${activeSummary?.irPlebitis || 0} % (${activeSummary?.irPlebitisPermil?.toFixed(2) || 0} permil)"`);
      csvRows.push(`"IR ISK: ${activeSummary?.irIsk || 0} % (${activeSummary?.irIskPermil?.toFixed(2) || 0} permil)"`);
    }

    const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Data_HAIs_${selectedRoomTab}_${startDate}_sd_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Cetak dokumen
  const handlePrint = () => {
    window.print();
  };

  // Baris aktif berdasarkan sub-tab ruangan yang dipilih
  const activeSummary = useMemo(() => {
    if (!simrsData) return null;
    if (selectedRoomTab === 'all') {
      const gt = simrsData.grandTotal;
      return {
        label: 'Semua Ruangan Rawat Inap',
        rows: simrsData.allRows,
        totals: gt,
        irPlebitis: gt.ivl > 0 ? Number(((gt.pleb / gt.ivl) * 100).toFixed(2)) : 0,
        irIsk: gt.uc > 0 ? Number(((gt.isk / gt.uc) * 100).toFixed(2)) : 0,
        irPlebitisPermil: gt.ivl > 0 ? Number(((gt.pleb / gt.ivl) * 1000).toFixed(2)) : 0,
        irIskPermil: gt.uc > 0 ? Number(((gt.isk / gt.uc) * 1000).toFixed(2)) : 0,
      };
    }
    return simrsData.tabs[selectedRoomTab];
  }, [simrsData, selectedRoomTab]);

  const activeRows = useMemo(() => {
    if (!activeSummary) return [];
    if (!searchQuery.trim()) return activeSummary.rows;
    const q = searchQuery.toLowerCase();
    return activeSummary.rows.filter(
      (r) =>
        r.nama_pasien.toLowerCase().includes(q) ||
        r.no_rkm_medis.toLowerCase().includes(q) ||
        r.dx_medis.toLowerCase().includes(q)
    );
  }, [activeSummary, searchQuery]);

  const activeTotals = activeSummary?.totals;

  return (
    <div className="space-y-6 pb-20 print:p-0 print:space-y-4">
      {/* HEADER SECTION - CLEAN & ELEGAN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Laporan PPI</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </span>
            Surveilans HAIs
          </h1>
        </div>
        {simrsData && (
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[11px] font-bold ${
              simrsData.isOfflineFallback
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                simrsData.isOfflineFallback ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span>
              {simrsData.isOfflineFallback
                ? 'Data Terakhir Terkoneksi SIMRS • Otomatis Update Saat SIMRS Terhubung'
                : 'SIMRS Terhubung Realtime'}
            </span>
          </div>
        )}
      </div>

      {/* ERROR ALERT JIKA ADA */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-xs">
          <Info className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* FILTER PERIODE & RUANGAN - CLEAN, RAPIH, ELEGAN */}
      <div className="bg-slate-900/60 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10 shadow-xl space-y-4 print:hidden">
        {/* Baris 1: Filter Tanggal & Presets */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-white outline-none [color-scheme:dark]"
              />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-white outline-none [color-scheme:dark]"
              />
            </div>

            {/* Presets Cepat */}
            <div className="flex items-center gap-1.5 bg-slate-950/50 p-1 border border-white/5 rounded-xl">
              <button
                type="button"
                onClick={() => setDatePreset('today')}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('thisMonth')}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('lastMonth')}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
              >
                Bulan Lalu
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('q3_2026')}
                className="px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 rounded-lg hover:bg-emerald-500/10 transition-all border border-emerald-500/20"
                title="Bulan September 2026 (1.490 Data Acuan)"
              >
                Sep 2026
              </button>
            </div>
          </div>

          {/* Kotak Pencarian Pasien Minimalis & Rapi */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari pasien / no RM / diagnosa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Baris 2: Tab Ruangan (Persis format http://192.168.18.11/almulk/ranap/data_hais1) */}
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedRoomTab('dewasa')}
            className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 border ${
              selectedRoomTab === 'dewasa'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 font-black'
                : 'bg-slate-950/50 border-white/10 text-slate-300 hover:bg-white/5 font-bold'
            }`}
          >
            <span>Ranap Dewasa</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              selectedRoomTab === 'dewasa' ? 'bg-slate-950/30 text-slate-950' : 'bg-white/10 text-emerald-400'
            }`}>
              {simrsData?.tabs?.dewasa?.totals?.ivl ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRoomTab('anak')}
            className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 border ${
              selectedRoomTab === 'anak'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 font-black'
                : 'bg-slate-950/50 border-white/10 text-slate-300 hover:bg-white/5 font-bold'
            }`}
          >
            <span>Ranap Anak</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              selectedRoomTab === 'anak' ? 'bg-slate-950/30 text-slate-950' : 'bg-white/10 text-emerald-400'
            }`}>
              {simrsData?.tabs?.anak?.totals?.ivl ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRoomTab('kebidanan')}
            className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 border ${
              selectedRoomTab === 'kebidanan'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 font-black'
                : 'bg-slate-950/50 border-white/10 text-slate-300 hover:bg-white/5 font-bold'
            }`}
          >
            <span>Ranap Kebidanan</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              selectedRoomTab === 'kebidanan' ? 'bg-slate-950/30 text-slate-950' : 'bg-white/10 text-emerald-400'
            }`}>
              {simrsData?.tabs?.kebidanan?.totals?.ivl ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRoomTab('bedah')}
            className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 border ${
              selectedRoomTab === 'bedah'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 font-black'
                : 'bg-slate-950/50 border-white/10 text-slate-300 hover:bg-white/5 font-bold'
            }`}
          >
            <span>Ranap Bedah</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              selectedRoomTab === 'bedah' ? 'bg-slate-950/30 text-slate-950' : 'bg-white/10 text-emerald-400'
            }`}>
              {simrsData?.tabs?.bedah?.totals?.ivl ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRoomTab('all')}
            className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 border ${
              selectedRoomTab === 'all'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 font-black'
                : 'bg-slate-950/50 border-white/10 text-slate-300 hover:bg-white/5 font-bold'
            }`}
          >
            <span>Semua Ruangan</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              selectedRoomTab === 'all' ? 'bg-slate-950/30 text-slate-950' : 'bg-white/10 text-emerald-400'
            }`}>
              {simrsData?.grandTotal?.ivl ?? 0}
            </span>
          </button>
        </div>
      </div>

      {/* KARTU KPI RINGKASAN PERSIS STANDAR AKREDITASI */}
      {activeTotals && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:grid-cols-6 print:gap-2">
          <div className="p-3.5 bg-slate-900/60 border border-white/10 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-0.5">
              Phlebitis (IVL)
            </span>
            <div className="text-xl font-black text-white font-mono flex items-baseline gap-1 flex-wrap">
              <span>{Number(activeSummary?.irPlebitis || 0).toFixed(2)}</span>
              <span className="text-xs font-normal text-slate-400">%</span>
              <span className="text-xs font-semibold text-emerald-400 ml-1">
                ({Number(activeSummary?.irPlebitisPermil || 0).toFixed(2)} ‰)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {activeTotals.pleb} infeksi / {activeTotals.ivl} hari infus
            </div>
            <div className="text-[9px] font-bold text-emerald-500 mt-0.5">Standar &lt; 1 ‰</div>
          </div>

          <div className="p-3.5 bg-slate-900/60 border border-white/10 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block mb-0.5">
              ISK (Kateter UC)
            </span>
            <div className="text-xl font-black text-white font-mono flex items-baseline gap-1 flex-wrap">
              <span>{Number(activeSummary?.irIsk || 0).toFixed(2)}</span>
              <span className="text-xs font-normal text-slate-400">%</span>
              <span className="text-xs font-semibold text-blue-400 ml-1">
                ({Number(activeSummary?.irIskPermil || 0).toFixed(2)} ‰)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {activeTotals.isk} infeksi / {activeTotals.uc} hari kateter
            </div>
            <div className="text-[9px] font-bold text-blue-400 mt-0.5">Standar &lt; 4.7 ‰</div>
          </div>

          <div className="p-3.5 bg-slate-900/60 border border-white/10 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block mb-0.5">
              VAP (Ventilator)
            </span>
            <div className="text-xl font-black text-white font-mono">
              {activeTotals.vap} <span className="text-xs font-normal text-slate-400">kasus</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {activeTotals.ett} hari pasang ETT
            </div>
            <div className="text-[9px] font-bold text-indigo-400 mt-0.5">Standar &lt; 5.8 ‰</div>
          </div>

          <div className="p-3.5 bg-slate-900/60 border border-white/10 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block mb-0.5">
              IADP (CVL)
            </span>
            <div className="text-xl font-black text-white font-mono">
              {activeTotals.iad} <span className="text-xs font-normal text-slate-400">kasus</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {activeTotals.cvl} hari pasang CVL
            </div>
            <div className="text-[9px] font-bold text-purple-400 mt-0.5">Standar &lt; 1 ‰</div>
          </div>

          <div className="p-3.5 bg-slate-900/60 border border-white/10 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-0.5">
              Decubitus
            </span>
            <div className="text-xl font-black text-white font-mono">
              {activeTotals.deku} <span className="text-xs font-normal text-slate-400">kasus</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Dari {activeTotals.totalPasien} total pasien
            </div>
            <div className="text-[9px] font-bold text-amber-400 mt-0.5">Standar &lt; 1.5 ‰</div>
          </div>

          <div className="p-3.5 bg-slate-900/60 border border-white/10 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block mb-0.5">
              IDO (Operasi)
            </span>
            <div className="text-xl font-black text-white font-mono">
              {activeTotals.ilo} <span className="text-xs font-normal text-slate-400">kasus</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Tindakan Operasi Bedah
            </div>
            <div className="text-[9px] font-bold text-rose-400 mt-0.5">Standar &lt; 2 %</div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TABEL DATA HAIS PERSIS FORMAT HTTP://192.168.18.11/ALMULK/RANAP/DATA_HAIS1 */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/60 backdrop-blur-md p-3.5 sm:p-5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden print:p-0 print:border-none print:shadow-none">
        {/* Header info tabel */}
        <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Data HAIs {activeSummary?.label || 'Ruang Perawatan'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Periode: <strong className="text-white">{startDate}</strong> s/d <strong className="text-white">{endDate}</strong> &bull; Total: <strong className="text-emerald-300 font-mono">{activeTotals?.ivl ?? activeRows.length}</strong> IVL ({activeRows.length} data pasien)
            </p>
          </div>
        </div>

        {/* Kontainer Tabel */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <p className="text-sm font-bold text-white">Memuat Data HAIs Terintegrasi SIMRS...</p>
          </div>
        ) : activeRows.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-white/10 rounded-2xl">
            <Info className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white">Tidak ada data HAIs pada periode ini</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Belum ada inputan data HAIs pada rentang tanggal {startDate} s/d {endDate} untuk {activeSummary?.label}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full pb-1">
            <table className="w-full table-fixed text-[10px] sm:text-[11px] border border-white/15 border-collapse text-left">
              <colgroup>
                <col className="w-[3%]" />     {/* # */}
                <col className="w-[7.5%]" />   {/* Tanggal */}
                <col className="w-[5.5%]" />   {/* RM */}
                <col className="w-[17%]" />    {/* Pasien */}
                <col className="w-[7.5%]" />   {/* Tgl Lahir */}
                <col className="w-[5.5%]" />   {/* Dx Medis */}
                <col className="w-[3%]" />     {/* ETT */}
                <col className="w-[3%]" />     {/* CVL */}
                <col className="w-[3%]" />     {/* IVL */}
                <col className="w-[3%]" />     {/* UC */}
                <col className="w-[3%]" />     {/* VAP */}
                <col className="w-[3%]" />     {/* IAD */}
                <col className="w-[3%]" />     {/* PLEB */}
                <col className="w-[3%]" />     {/* ISK */}
                <col className="w-[3%]" />     {/* ILO */}
                <col className="w-[4%]" />     {/* Tirah Baring */}
                <col className="w-[5%]" />     {/* Decubitus */}
                <col className="w-[11.5%]" />  {/* Antibiotik */}
                <col className="w-[10%]" />    {/* Unit */}
              </colgroup>
              {/* TWO-TIER THEAD PERSIS DATA_HAIS1 */}
              <thead>
                <tr className="bg-slate-950/90 text-white font-black text-[10px] sm:text-[11px] border-b border-white/15">
                  <th rowSpan={2} className="py-2 px-1 border-r border-white/15 text-center">#</th>
                  <th rowSpan={2} className="py-2 px-1 border-r border-white/15 text-center">Tanggal</th>
                  <th rowSpan={2} className="py-2 px-1 border-r border-white/15 text-center">RM</th>
                  <th rowSpan={2} className="py-2 px-1.5 border-r border-white/15">Pasien</th>
                  <th rowSpan={2} className="py-2 px-1 border-r border-white/15 text-center">Tgl Lahir</th>
                  <th rowSpan={2} className="py-2 px-1 border-r border-white/15 text-center">Dx Medis</th>
                  <th colSpan={4} className="py-1 px-1 border-r border-white/15 text-center bg-blue-950/60 text-blue-200 font-extrabold text-[9px] sm:text-[10px]">
                    Tindakan
                  </th>
                  <th colSpan={5} className="py-1 px-1 border-r border-white/15 text-center bg-rose-950/60 text-rose-200 font-extrabold text-[9px] sm:text-[10px]">
                    Infeksi RS
                  </th>
                  <th rowSpan={2} className="py-2 px-0.5 border-r border-white/15 text-center leading-tight text-[9px] sm:text-[10px]">Tirah Baring</th>
                  <th rowSpan={2} className="py-2 px-0.5 border-r border-white/15 text-center leading-tight text-[9px] sm:text-[10px]">Decubitus</th>
                  <th rowSpan={2} className="py-2 px-1.5 border-r border-white/15">Antibiotik</th>
                  <th rowSpan={2} className="py-2 px-1.5">Unit</th>
                </tr>
                <tr className="bg-slate-950/90 text-slate-300 font-bold text-[9px] sm:text-[10px] border-b border-white/15 font-mono">
                  {/* Sub-header Tindakan */}
                  <th className="py-1 px-0.5 border-r border-white/15 text-center bg-blue-950/40">ETT</th>
                  <th className="py-1 px-0.5 border-r border-white/15 text-center bg-blue-950/40">CVL</th>
                  <th className="py-1 px-0.5 border-r border-white/15 text-center bg-blue-950/40">IVL</th>
                  <th className="py-1 px-0.5 border-r border-white/15 text-center bg-blue-950/40">UC</th>
                  {/* Sub-header Infeksi RS */}
                  <th className="py-1 px-0.5 border-r border-white/15 text-center bg-rose-950/40">VAP</th>
                  <th className="py-1 px-0.5 border-r border-white/15 text-center bg-rose-950/40">IAD</th>
                  <th className="py-1 px-0.5 border-r border-white/15 text-center bg-rose-950/40">PLEB</th>
                  <th className="py-1 px-0.5 border-r border-white/15 text-center bg-rose-950/40">ISK</th>
                  <th className="py-1 px-0.5 border-r border-white/15 text-center bg-rose-950/40">ILO</th>
                </tr>
              </thead>

              {/* DATA ROWS */}
              <tbody className="divide-y divide-white/10 text-slate-200">
                {activeRows.map((row, idx) => {
                  const hasInfeksi = row.pleb > 0 || row.isk > 0 || row.vap > 0 || row.iad > 0 || row.ilo > 0;
                  return (
                    <tr
                      key={`${row.no_rkm_medis}-${row.tanggal}-${idx}`}
                      className={`hover:bg-white/[0.04] transition-colors ${hasInfeksi ? 'bg-rose-500/10' : ''}`}
                    >
                      <td className="py-1.5 px-0.5 border-r border-white/10 text-center font-mono text-slate-400 text-[9px] sm:text-[10px]">
                        {row.no || idx + 1}
                      </td>
                      <td className="py-1.5 px-1 border-r border-white/10 font-mono text-slate-300 text-[9px] sm:text-[10px] text-center truncate" title={row.tanggal}>
                        {row.tanggal}
                      </td>
                      <td className="py-1.5 px-1 border-r border-white/10 font-mono font-bold text-white text-[9px] sm:text-[10px] text-center truncate" title={row.no_rkm_medis}>
                        {row.no_rkm_medis}
                      </td>
                      <td className="py-1.5 px-1.5 border-r border-white/10 font-semibold text-white text-[10px] sm:text-[11px] truncate" title={row.nama_pasien}>
                        {row.nama_pasien}
                      </td>
                      <td className="py-1.5 px-1 border-r border-white/10 font-mono text-slate-300 text-[9px] sm:text-[10px] text-center truncate" title={row.tgl_lahir}>
                        {row.tgl_lahir}
                      </td>
                      <td className="py-1.5 px-1 border-r border-white/10 font-mono text-amber-300 text-[9px] sm:text-[10px] text-center truncate" title={row.dx_medis}>
                        {row.dx_medis}
                      </td>
                      {/* Tindakan */}
                      <td className="py-1.5 px-0.5 border-r border-white/10 text-center font-mono font-bold text-[9px] sm:text-[10px]">
                        {row.ett}
                      </td>
                      <td className="py-1.5 px-0.5 border-r border-white/10 text-center font-mono font-bold text-[9px] sm:text-[10px]">
                        {row.cvl}
                      </td>
                      <td className="py-1.5 px-0.5 border-r border-white/10 text-center font-mono font-bold text-emerald-400 text-[9px] sm:text-[10px]">
                        {row.ivl}
                      </td>
                      <td className="py-1.5 px-0.5 border-r border-white/10 text-center font-mono font-bold text-blue-400 text-[9px] sm:text-[10px]">
                        {row.uc}
                      </td>
                      {/* Infeksi RS */}
                      <td className="py-1.5 px-0.5 border-r border-white/10 text-center font-mono text-[9px] sm:text-[10px]">
                        <span className={row.vap > 0 ? 'text-rose-400 font-bold bg-rose-500/20 px-1 py-0.5 rounded' : 'text-slate-400'}>
                          {row.vap}
                        </span>
                      </td>
                      <td className="py-1.5 px-0.5 border-r border-white/10 text-center font-mono text-[9px] sm:text-[10px]">
                        <span className={row.iad > 0 ? 'text-rose-400 font-bold bg-rose-500/20 px-1 py-0.5 rounded' : 'text-slate-400'}>
                          {row.iad}
                        </span>
                      </td>
                      <td className="py-1.5 px-0.5 border-r border-white/10 text-center font-mono text-[9px] sm:text-[10px]">
                        <span className={row.pleb > 0 ? 'text-rose-400 font-bold bg-rose-500/20 px-1 py-0.5 rounded' : 'text-slate-400'}>
                          {row.pleb}
                        </span>
                      </td>
                      <td className="py-1.5 px-0.5 border-r border-white/10 text-center font-mono text-[9px] sm:text-[10px]">
                        <span className={row.isk > 0 ? 'text-rose-400 font-bold bg-rose-500/20 px-1 py-0.5 rounded' : 'text-slate-400'}>
                          {row.isk}
                        </span>
                      </td>
                      <td className="py-1.5 px-0.5 border-r border-white/10 text-center font-mono text-[9px] sm:text-[10px]">
                        <span className={row.ilo > 0 ? 'text-rose-400 font-bold bg-rose-500/20 px-1 py-0.5 rounded' : 'text-slate-400'}>
                          {row.ilo}
                        </span>
                      </td>
                      {/* Tirah Baring */}
                      <td className="py-1.5 px-0.5 border-r border-white/10 text-center font-mono text-slate-300 text-[9px] sm:text-[10px]">
                        {row.hap}
                      </td>
                      {/* Decubitus */}
                      <td className="py-1.5 px-0.5 border-r border-white/10 text-center">
                        <span className={`text-[8px] sm:text-[9px] font-black px-1 py-0.5 rounded ${
                          row.deku === 'IYA' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'
                        }`}>
                          {row.deku}
                        </span>
                      </td>
                      {/* Antibiotik */}
                      <td className="py-1.5 px-1.5 border-r border-white/10 text-[9px] sm:text-[10px] text-amber-200 truncate" title={row.antibiotik}>
                        {row.antibiotik || '-'}
                      </td>
                      {/* Unit */}
                      <td className="py-1.5 px-1.5 text-[9px] sm:text-[10px] font-semibold text-slate-300 truncate" title={row.unit}>
                        {row.unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* TOTAL ROW PERSIS DATA_HAIS1 */}
              {activeTotals && (
                <tfoot>
                  <tr className="bg-slate-950 font-black text-white text-[10px] sm:text-[11px] border-t-2 border-white/20">
                    <td colSpan={6} className="py-2 px-2 text-center border-r border-white/15 uppercase tracking-wider">
                      Total
                    </td>
                    <td className="py-2 px-0.5 border-r border-white/15 text-center font-mono text-white">
                      {activeTotals.ett}
                    </td>
                    <td className="py-2 px-0.5 border-r border-white/15 text-center font-mono text-white">
                      {activeTotals.cvl}
                    </td>
                    <td className="py-2 px-0.5 border-r border-white/15 text-center font-mono text-emerald-400">
                      {activeTotals.ivl}
                    </td>
                    <td className="py-2 px-0.5 border-r border-white/15 text-center font-mono text-blue-400">
                      {activeTotals.uc}
                    </td>
                    <td className="py-2 px-0.5 border-r border-white/15 text-center font-mono text-white">
                      {activeTotals.vap}
                    </td>
                    <td className="py-2 px-0.5 border-r border-white/15 text-center font-mono text-white">
                      {activeTotals.iad}
                    </td>
                    <td className="py-2 px-0.5 border-r border-white/15 text-center font-mono text-white">
                      {activeTotals.pleb}
                    </td>
                    <td className="py-2 px-0.5 border-r border-white/15 text-center font-mono text-white">
                      {activeTotals.isk}
                    </td>
                    <td className="py-2 px-0.5 border-r border-white/15 text-center font-mono text-white">
                      {activeTotals.ilo}
                    </td>
                    <td className="py-2 px-0.5 border-r border-white/15 text-center font-mono text-white">
                      {activeTotals.hap}
                    </td>
                    <td className="py-2 px-0.5 border-r border-white/15 text-center font-mono text-amber-300">
                      {activeTotals.deku}
                    </td>
                    <td className="py-2 px-1 border-r border-white/15"></td>
                    <td className="py-2 px-1"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* RINGKASAN IR DI BAWAH TABEL PERSIS SEPERTI DI DATA_HAIS1 */}
        {activeSummary && (
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 font-sans">
              <p className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>
                  IR Plebitis dari tanggal <strong className="text-white">{startDate}</strong> s/d <strong className="text-white">{endDate}</strong> adalah{' '}
                  <strong className="text-emerald-400 font-mono text-sm sm:text-base">
                    {Number(activeSummary.irPlebitis || 0).toFixed(2)} %
                  </strong>
                  <span className="text-slate-400 text-xs ml-1 font-mono">
                    ({Number(activeSummary.irPlebitisPermil || 0).toFixed(2)} ‰ &bull; Standar Kemenkes: &lt; 1 ‰)
                  </span>
                </span>
              </p>

              <p className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>
                  IR ISK dari tanggal <strong className="text-white">{startDate}</strong> s/d <strong className="text-white">{endDate}</strong> adalah{' '}
                  <strong className="text-blue-400 font-mono text-sm sm:text-base">
                    {Number(activeSummary.irIsk || 0).toFixed(2)} %
                  </strong>
                  <span className="text-slate-400 text-xs ml-1 font-mono">
                    ({Number(activeSummary.irIskPermil || 0).toFixed(2)} ‰ &bull; Standar Kemenkes: &lt; 4.7 ‰)
                  </span>
                </span>
              </p>
            </div>

            {/* Tombol Print & Excel di bawah tabel persis web SIMRS */}
            <div className="flex items-center gap-2 print:hidden self-start md:self-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 transition-all"
              >
                <Printer className="w-3.5 h-3.5 text-rose-400" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={exportToExcel}
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

SurveilansFormPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Sparkles,
  Printer,
  FileSpreadsheet,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Save,
  Loader2,
  Calculator,
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { supabase } from '@/lib/supabase';
import {
  IcraProgramItem,
  ICRA_RISK_CATEGORIES,
  ICRA_UNITS_LIST,
  PROBABILITY_SCALE,
  IMPACT_SCALE,
  PREPAREDNESS_SCALE,
  DEFAULT_PROGRAM_RISK_TEMPLATES,
  calculateRiskScore,
  getRiskLevel,
  RiskLevel,
} from '@/utils/icraData';
import IcraProgramReportModal from './IcraProgramReportModal';

function normalizeProgramRow(raw: any): IcraProgramItem {
  const prob = Number(raw.probability) || 1;
  const imp = Number(raw.impact) || 1;
  const prep = Number(raw.preparedness) || 1;
  const total = Number(raw.total_score) || calculateRiskScore(prob, imp, prep);
  const level = (raw.risk_level as RiskLevel) || getRiskLevel(total);
  return {
    id: String(raw.id),
    created_at: raw.created_at,
    tahun: Number(raw.tahun) || new Date().getFullYear(),
    kategori_risiko: raw.kategori_risiko || 'Kewaspadaan Standar',
    masalah_risiko: raw.masalah_risiko || '',
    unit_terkait: raw.unit_terkait || 'Seluruh Ruangan',
    probability: prob,
    impact: imp,
    preparedness: prep,
    total_score: total,
    risk_level: level,
    tujuan_umum: raw.tujuan_umum || '',
    strategi_poa: raw.strategi_poa || '',
    pj_pelaksana: raw.pj_pelaksana || 'IPCN & IPCLN',
    target_waktu: raw.target_waktu || 'Triwulan I - IV',
    evaluasi_status: raw.evaluasi_status || 'Dalam Proses',
    catatan_evaluasi: raw.catatan_evaluasi || '',
    created_by: raw.created_by || 'IPCN',
  };
}

export default function IcraProgramTab() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [filterLevel, setFilterLevel] = useState<'Semua' | RiskLevel>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const [items, setItems] = useState<IcraProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IcraProgramItem | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Form State
  const [formState, setFormState] = useState({
    kategori_risiko: ICRA_RISK_CATEGORIES[0],
    masalah_risiko: '',
    unit_terkait: 'Seluruh Ruangan',
    probability: 3,
    impact: 4,
    preparedness: 3,
    tujuan_umum: '',
    strategi_poa: '',
    pj_pelaksana: 'IPCN & IPCLN Ruangan',
    target_waktu: `Triwulan I - IV ${currentYear}`,
    evaluasi_status: 'Dalam Proses' as IcraProgramItem['evaluasi_status'],
    catatan_evaluasi: '',
  });

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('icra_program')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const normalized = Array.isArray(data) ? data.map(normalizeProgramRow) : [];
      setItems(normalized);
    } catch (err: any) {
      console.error('Error loading ICRA Program:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const yearItems = useMemo(() => {
    return items
      .filter((it) => Number(it.tahun) === selectedYear)
      .sort((a, b) => b.total_score - a.total_score);
  }, [items, selectedYear]);

  const filteredItems = useMemo(() => {
    return yearItems.filter((it) => {
      if (filterLevel !== 'Semua' && it.risk_level !== filterLevel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${it.masalah_risiko} ${it.kategori_risiko} ${it.unit_terkait} ${it.strategi_poa} ${it.pj_pelaksana}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [yearItems, filterLevel, searchQuery]);

  const stats = useMemo(() => {
    const high = yearItems.filter((i) => i.risk_level === 'Tinggi').length;
    const med = yearItems.filter((i) => i.risk_level === 'Sedang').length;
    const low = yearItems.filter((i) => i.risk_level === 'Rendah').length;
    const done = yearItems.filter((i) => i.evaluasi_status === 'Tercapai').length;
    return { total: yearItems.length, high, med, low, done };
  }, [yearItems]);

  const liveScore = calculateRiskScore(formState.probability, formState.impact, formState.preparedness);
  const liveLevel = getRiskLevel(liveScore);

  const openAddForm = () => {
    setEditingItem(null);
    setFormState({
      kategori_risiko: ICRA_RISK_CATEGORIES[0],
      masalah_risiko: '',
      unit_terkait: 'Seluruh Ruangan',
      probability: 3,
      impact: 4,
      preparedness: 3,
      tujuan_umum: '',
      strategi_poa: '',
      pj_pelaksana: 'IPCN & IPCLN Ruangan',
      target_waktu: `Triwulan I - IV ${selectedYear}`,
      evaluasi_status: 'Dalam Proses',
      catatan_evaluasi: '',
    });
    setIsFormOpen(true);
  };

  const openEditForm = (item: IcraProgramItem) => {
    setEditingItem(item);
    setFormState({
      kategori_risiko: item.kategori_risiko,
      masalah_risiko: item.masalah_risiko,
      unit_terkait: item.unit_terkait,
      probability: item.probability,
      impact: item.impact,
      preparedness: item.preparedness,
      tujuan_umum: item.tujuan_umum,
      strategi_poa: item.strategi_poa,
      pj_pelaksana: item.pj_pelaksana,
      target_waktu: item.target_waktu,
      evaluasi_status: item.evaluasi_status,
      catatan_evaluasi: item.catatan_evaluasi || '',
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.masalah_risiko.trim()) {
      showToast('Uraian masalah risiko wajib diisi!', 'error');
      return;
    }

    setSaving(true);
    try {
      const score = calculateRiskScore(formState.probability, formState.impact, formState.preparedness);
      const level = getRiskLevel(score);
      const observerName =
        (typeof window !== 'undefined' && localStorage.getItem('smart_ppi_observer')) || 'IPCN';

      if (editingItem) {
        const updates = {
          tahun: selectedYear,
          kategori_risiko: formState.kategori_risiko,
          masalah_risiko: formState.masalah_risiko.trim(),
          unit_terkait: formState.unit_terkait,
          probability: formState.probability,
          impact: formState.impact,
          preparedness: formState.preparedness,
          total_score: score,
          risk_level: level,
          tujuan_umum: formState.tujuan_umum.trim(),
          strategi_poa: formState.strategi_poa.trim(),
          pj_pelaksana: formState.pj_pelaksana.trim(),
          target_waktu: formState.target_waktu.trim(),
          evaluasi_status: formState.evaluasi_status,
          catatan_evaluasi: formState.catatan_evaluasi.trim(),
        };
        const { error } = await supabase.from('icra_program').update(updates).eq('id', editingItem.id);
        if (error) throw error;
        showToast('Data risiko ICRA Program berhasil diperbarui!');
      } else {
        const newRow = {
          id: `icra_prog_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          created_at: new Date().toISOString(),
          tahun: selectedYear,
          kategori_risiko: formState.kategori_risiko,
          masalah_risiko: formState.masalah_risiko.trim(),
          unit_terkait: formState.unit_terkait,
          probability: formState.probability,
          impact: formState.impact,
          preparedness: formState.preparedness,
          total_score: score,
          risk_level: level,
          tujuan_umum: formState.tujuan_umum.trim(),
          strategi_poa: formState.strategi_poa.trim(),
          pj_pelaksana: formState.pj_pelaksana.trim(),
          target_waktu: formState.target_waktu.trim(),
          evaluasi_status: formState.evaluasi_status,
          catatan_evaluasi: formState.catatan_evaluasi.trim(),
          created_by: observerName,
        };
        const { error } = await supabase.from('icra_program').insert([newRow]);
        if (error) throw error;
        showToast('Data risiko ICRA Program baru berhasil ditambahkan!');
      }

      setIsFormOpen(false);
      await fetchItems();
    } catch (err: any) {
      showToast(`Gagal menyimpan data: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadTemplates = async () => {
    setSaving(true);
    try {
      const existingProblems = new Set(yearItems.map((i) => i.masalah_risiko.toLowerCase().trim()));
      const toInsert = DEFAULT_PROGRAM_RISK_TEMPLATES.filter(
        (tpl) => !existingProblems.has(tpl.masalah_risiko.toLowerCase().trim())
      ).map((tpl, idx) => {
        const score = calculateRiskScore(tpl.probability, tpl.impact, tpl.preparedness);
        return {
          id: `icra_prog_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
          created_at: new Date().toISOString(),
          tahun: selectedYear,
          kategori_risiko: tpl.kategori_risiko,
          masalah_risiko: tpl.masalah_risiko,
          unit_terkait: tpl.unit_terkait,
          probability: tpl.probability,
          impact: tpl.impact,
          preparedness: tpl.preparedness,
          total_score: score,
          risk_level: getRiskLevel(score),
          tujuan_umum: tpl.tujuan_umum,
          strategi_poa: tpl.strategi_poa,
          pj_pelaksana: tpl.pj_pelaksana,
          target_waktu: `${tpl.target_waktu} ${selectedYear}`,
          evaluasi_status: tpl.evaluasi_status,
          catatan_evaluasi: tpl.catatan_evaluasi || '',
          created_by: 'Template Standar PPI',
        };
      });

      if (toInsert.length === 0) {
        showToast(`Seluruh template risiko standar untuk tahun ${selectedYear} sudah dimuat.`, 'success');
        setSaving(false);
        return;
      }

      const { error } = await supabase.from('icra_program').insert(toInsert);
      if (error) throw error;
      showToast(`Berhasil memuat ${toInsert.length} template risiko PPI standar rumah sakit!`);
      await fetchItems();
    } catch (err: any) {
      showToast(`Gagal memuat template: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus item risiko ICRA Program ini?')) return;
    try {
      const { error } = await supabase.from('icra_program').delete().eq('id', id);
      if (error) throw error;
      showToast('Data risiko berhasil dihapus.');
      await fetchItems();
    } catch (err: any) {
      showToast(`Gagal menghapus: ${err.message}`, 'error');
    }
  };

  const handleQuickCycleStatus = async (item: IcraProgramItem) => {
    const order: IcraProgramItem['evaluasi_status'][] = ['Belum Terlaksana', 'Dalam Proses', 'Tercapai'];
    const nextStatus = order[(order.indexOf(item.evaluasi_status) + 1) % order.length];
    try {
      const { error } = await supabase
        .from('icra_program')
        .update({ evaluasi_status: nextStatus })
        .eq('id', item.id);
      if (error) throw error;
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, evaluasi_status: nextStatus } : x))
      );
      showToast(`Status evaluasi diperbarui menjadi "${nextStatus}"`);
    } catch (err: any) {
      showToast(`Gagal update status: ${err.message}`, 'error');
    }
  };

  const handleExportExcel = () => {
    if (yearItems.length === 0) {
      showToast('Tidak ada data untuk diekspor ke Excel.', 'error');
      return;
    }
    const rows = yearItems.map((it, idx) => ({
      'Prioritas': `#${idx + 1}`,
      'Tahun': it.tahun,
      'Kategori Risiko': it.kategori_risiko,
      'Unit Terkait': it.unit_terkait,
      'Potensi Risiko / Masalah Infeksi': it.masalah_risiko,
      'Probabilitas (P)': it.probability,
      'Dampak (I)': it.impact,
      'Kesiapan Sistem (S)': it.preparedness,
      'Total Skor (P×I×S)': it.total_score,
      'Level Risiko': it.risk_level,
      'Tujuan Umum': it.tujuan_umum,
      'Strategi / POA': it.strategi_poa,
      'Penanggung Jawab': it.pj_pelaksana,
      'Target Waktu': it.target_waktu,
      'Status Evaluasi': it.evaluasi_status,
      'Catatan Evaluasi': it.catatan_evaluasi || '',
    }));
    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, `ICRA_Program_${selectedYear}`);
    writeFile(wb, `Matriks_ICRA_Program_PPI_${selectedYear}_RSUD_Al_Mulk.xlsx`);
    showToast('File Excel Matriks ICRA Program berhasil diunduh!');
  };

  const yearOptions = Array.from(new Set([2024, 2025, 2026, 2027, currentYear])).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`fixed top-5 right-5 z-[99999] px-4 py-3 rounded-2xl border shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold backdrop-blur-xl ${
              toastMsg.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistik Ringkas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-[#141634] border border-indigo-900/40 p-4 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Risiko</span>
          <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
          <span className="text-[11px] text-indigo-300/80">Tahun {selectedYear}</span>
        </div>
        <div className="rounded-2xl bg-[#1e1228] border border-rose-500/35 p-4 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">Risiko Tinggi (&ge; 45)</span>
          <div className="text-2xl font-black text-rose-400 mt-1">{stats.high}</div>
          <span className="text-[11px] text-rose-300/80">Prioritas Utama</span>
        </div>
        <div className="rounded-2xl bg-[#1f1a24] border border-amber-500/35 p-4 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">Risiko Sedang (18–44)</span>
          <div className="text-2xl font-black text-amber-400 mt-1">{stats.med}</div>
          <span className="text-[11px] text-amber-300/80">Perlu Pengendalian</span>
        </div>
        <div className="rounded-2xl bg-[#10242c] border border-emerald-500/35 p-4 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Risiko Rendah (&lt; 18)</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{stats.low}</div>
          <span className="text-[11px] text-emerald-300/80">Monitoring Rutin</span>
        </div>
        <div className="col-span-2 lg:col-span-1 rounded-2xl bg-[#131c3d] border border-cyan-500/35 p-4 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">POA Tercapai</span>
          <div className="text-2xl font-black text-cyan-400 mt-1">
            {stats.done} <span className="text-sm font-bold text-slate-400">/ {stats.total}</span>
          </div>
          <span className="text-[11px] text-cyan-300/80">Evaluasi Program</span>
        </div>
      </div>

      {/* Toolbar Filter & Actions */}
      <div className="rounded-2xl bg-[#141634]/90 border border-indigo-900/40 p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tahun */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-[#0e1028] border border-indigo-800/60 text-white text-xs sm:text-sm font-bold rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>Tahun {y}</option>
            ))}
          </select>

          {/* Filter Level */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as any)}
            className="bg-[#0e1028] border border-indigo-800/60 text-white text-xs sm:text-sm font-bold rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
          >
            <option value="Semua">Semua Level Risiko</option>
            <option value="Tinggi">Risiko Tinggi</option>
            <option value="Sedang">Risiko Sedang</option>
            <option value="Rendah">Risiko Rendah</option>
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari risiko, unit, atau POA..."
              className="w-full bg-[#0e1028] border border-indigo-800/60 text-white text-xs sm:text-sm rounded-xl pl-9 pr-3 py-2 outline-none focus:border-cyan-400 placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={handleLoadTemplates}
            className="w-10 h-10 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-400/40 text-indigo-200 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
            title="Template Standar RS (Isi otomatis 8 masalah risiko infeksi standar akreditasi RS)"
            aria-label="Template Standar RS"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="w-10 h-10 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-200 flex items-center justify-center transition-all cursor-pointer"
            title="Ekspor Excel"
            aria-label="Ekspor Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          </button>

          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="w-10 h-10 rounded-xl bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/40 text-rose-200 flex items-center justify-center transition-all cursor-pointer"
            title="Cetak Laporan F4"
            aria-label="Cetak Laporan F4"
          >
            <Printer className="w-4 h-4 text-rose-400" />
          </button>

          <button
            type="button"
            onClick={openAddForm}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            title="Tambah Risiko"
            aria-label="Tambah Risiko"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List / Matriks Table */}
      {loading ? (
        <div className="rounded-2xl bg-[#141634] border border-indigo-900/40 p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-sm font-semibold">Memuat matriks ICRA Program PPI...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl bg-[#141634]/80 border border-indigo-900/40 p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center mx-auto text-cyan-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              Belum Ada Data Risiko ICRA Program ({selectedYear})
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mt-1">
              Tambahkan potensi risiko infeksi rumah sakit atau klik tombol di bawah untuk langsung mengisi 8 template risiko standar akreditasi (Hand Hygiene, Phlebitis, ISK, IDO, Benda Tajam, APD, Limbah, CSSD).
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleLoadTemplates}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Muat 8 Template Risiko PPI Standar RS</span>
            </button>
            <button
              type="button"
              onClick={openAddForm}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Input Risiko Manual</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#141634] border border-indigo-900/40 overflow-hidden shadow-xl">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f112a] border-b border-indigo-900/50 text-[11px] font-black uppercase tracking-wider text-indigo-300">
                  <th className="px-4 py-3.5 text-center w-16">Prioritas</th>
                  <th className="px-4 py-3.5 w-[24%]">Masalah / Risiko & Unit</th>
                  <th className="px-2 py-3.5 text-center w-12" title="Probability (1-5)">P</th>
                  <th className="px-2 py-3.5 text-center w-12" title="Impact (1-5)">I</th>
                  <th className="px-2 py-3.5 text-center w-12" title="Preparedness / System (1-5)">S</th>
                  <th className="px-3 py-3.5 text-center w-20">Skor</th>
                  <th className="px-3 py-3.5 text-center w-24">Level</th>
                  <th className="px-4 py-3.5 w-[26%]">Tujuan & Plan of Action (POA)</th>
                  <th className="px-3 py-3.5 text-center w-32">Status</th>
                  <th className="px-4 py-3.5 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-950/60 text-xs">
                {filteredItems.map((item, idx) => {
                  const badgeStyle =
                    item.risk_level === 'Tinggi'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : item.risk_level === 'Sedang'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

                  const statusStyle =
                    item.evaluasi_status === 'Tercapai'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                      : item.evaluasi_status === 'Dalam Proses'
                      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35'
                      : 'bg-slate-700/40 text-slate-300 border-slate-600/50';

                  return (
                    <tr key={item.id} className="hover:bg-[#191d42]/60 transition-colors align-top">
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-400/30 font-black text-white">
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                            {item.kategori_risiko}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                            {item.unit_terkait}
                          </span>
                        </div>
                        <p className="text-slate-100 font-semibold leading-relaxed">{item.masalah_risiko}</p>
                      </td>
                      <td className="px-2 py-3.5 text-center font-bold text-slate-200">{item.probability}</td>
                      <td className="px-2 py-3.5 text-center font-bold text-slate-200">{item.impact}</td>
                      <td className="px-2 py-3.5 text-center font-bold text-slate-200">{item.preparedness}</td>
                      <td className="px-3 py-3.5 text-center">
                        <span className="text-base font-black text-white">{item.total_score}</span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-black uppercase border ${badgeStyle}`}>
                          {item.risk_level}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 space-y-1">
                        {item.tujuan_umum && (
                          <p className="text-[11px] text-cyan-300 font-semibold">
                            Target: {item.tujuan_umum}
                          </p>
                        )}
                        <p className="text-slate-300 leading-relaxed">{item.strategi_poa || '-'}</p>
                        <p className="text-[10px] text-slate-400 pt-0.5">
                          PJ: <span className="text-slate-200 font-semibold">{item.pj_pelaksana}</span> • {item.target_waktu}
                        </p>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleQuickCycleStatus(item)}
                          title="Klik untuk ubah status evaluasi"
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all hover:scale-105 cursor-pointer ${statusStyle}`}
                        >
                          {item.evaluasi_status}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditForm(item)}
                            className="p-2 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 transition-colors cursor-pointer"
                            title="Edit Risiko & POA"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile / Tablet Card View */}
          <div className="lg:hidden divide-y divide-indigo-950/60">
            {filteredItems.map((item, idx) => {
              const badgeStyle =
                item.risk_level === 'Tinggi'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : item.risk_level === 'Sedang'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

              return (
                <div key={item.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-white font-black text-xs">
                        Prioritas #{idx + 1}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${badgeStyle}`}>
                        {item.risk_level} ({item.total_score})
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditForm(item)}
                        className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-300"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg bg-rose-500/15 text-rose-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm font-bold text-white leading-snug">{item.masalah_risiko}</p>
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                    <span>Unit: <strong>{item.unit_terkait}</strong></span>
                    <span>•</span>
                    <span>P:{item.probability} × I:{item.impact} × S:{item.preparedness}</span>
                  </div>
                  {item.strategi_poa && (
                    <p className="text-xs text-slate-300 bg-[#0f112a] p-2.5 rounded-xl border border-indigo-900/40">
                      <strong className="text-cyan-300">POA:</strong> {item.strategi_poa}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">PJ: {item.pj_pelaksana}</span>
                    <button
                      type="button"
                      onClick={() => handleQuickCycleStatus(item)}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                    >
                      {item.evaluasi_status}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Risiko ICRA Program */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-3xl max-h-[92vh] bg-[#121432] border border-indigo-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-[#171a42] border-b border-indigo-900/50">
                <div className="flex items-center gap-2.5">
                  <Calculator className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-black uppercase tracking-wide text-white">
                    {editingItem ? 'Edit Penilaian Risiko ICRA' : 'Tambah Risiko Baru ICRA Program'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                {/* Kategori & Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-indigo-300 mb-1.5">
                      Kategori Risiko PPI
                    </label>
                    <select
                      value={formState.kategori_risiko}
                      onChange={(e) => setFormState((s) => ({ ...s, kategori_risiko: e.target.value }))}
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-400"
                    >
                      {ICRA_RISK_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-indigo-300 mb-1.5">
                      Unit / Ruangan Terdampak
                    </label>
                    <select
                      value={formState.unit_terkait}
                      onChange={(e) => setFormState((s) => ({ ...s, unit_terkait: e.target.value }))}
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-400"
                    >
                      {ICRA_UNITS_LIST.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Masalah Risiko */}
                <div>
                  <label className="block text-xs font-bold uppercase text-indigo-300 mb-1.5">
                    Potensi Risiko / Masalah Infeksi *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formState.masalah_risiko}
                    onChange={(e) => setFormState((s) => ({ ...s, masalah_risiko: e.target.value }))}
                    placeholder="Contoh: Kepatuhan hand hygiene di ruang rawat inap masih di bawah standar 85%"
                    className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Kalkulator Skor P x I x S */}
                <div className="rounded-2xl bg-[#0b0d21] border border-indigo-800/50 p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-indigo-900/40">
                    <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                      Kalkulator Matriks Skor Risiko (P × I × S)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Skor RPN:</span>
                      <span className="text-lg font-black text-white">{liveScore}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                          liveLevel === 'Tinggi'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : liveLevel === 'Sedang'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {liveLevel}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                        Probability (Peluang: 1–5)
                      </label>
                      <select
                        value={formState.probability}
                        onChange={(e) => setFormState((s) => ({ ...s, probability: Number(e.target.value) }))}
                        className="w-full bg-[#141738] border border-indigo-700/60 text-white text-xs rounded-xl px-3 py-2 outline-none"
                      >
                        {PROBABILITY_SCALE.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {PROBABILITY_SCALE.find((p) => p.value === formState.probability)?.desc}
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                        Impact (Dampak: 1–5)
                      </label>
                      <select
                        value={formState.impact}
                        onChange={(e) => setFormState((s) => ({ ...s, impact: Number(e.target.value) }))}
                        className="w-full bg-[#141738] border border-indigo-700/60 text-white text-xs rounded-xl px-3 py-2 outline-none"
                      >
                        {IMPACT_SCALE.map((im) => (
                          <option key={im.value} value={im.value}>{im.label}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {IMPACT_SCALE.find((im) => im.value === formState.impact)?.desc}
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                        Preparedness (Sistem: 1–5)
                      </label>
                      <select
                        value={formState.preparedness}
                        onChange={(e) => setFormState((s) => ({ ...s, preparedness: Number(e.target.value) }))}
                        className="w-full bg-[#141738] border border-indigo-700/60 text-white text-xs rounded-xl px-3 py-2 outline-none"
                      >
                        {PREPAREDNESS_SCALE.map((pr) => (
                          <option key={pr.value} value={pr.value}>{pr.label}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {PREPAREDNESS_SCALE.find((pr) => pr.value === formState.preparedness)?.desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tujuan & Strategi POA */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-indigo-300 mb-1.5">
                      Tujuan Umum / Target Capaian
                    </label>
                    <input
                      type="text"
                      value={formState.tujuan_umum}
                      onChange={(e) => setFormState((s) => ({ ...s, tujuan_umum: e.target.value }))}
                      placeholder="Contoh: Mencapai kepatuhan kebersihan tangan >= 85%"
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-indigo-300 mb-1.5">
                      Strategi / Rencana Tindak Lanjut (Plan of Action / POA)
                    </label>
                    <textarea
                      rows={2}
                      value={formState.strategi_poa}
                      onChange={(e) => setFormState((s) => ({ ...s, strategi_poa: e.target.value }))}
                      placeholder="Uraikan langkah pengendalian risiko, supervisi, edukasi, atau perbaikan sarana..."
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* PJ, Target Waktu & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-indigo-300 mb-1.5">
                      Penanggung Jawab
                    </label>
                    <input
                      type="text"
                      value={formState.pj_pelaksana}
                      onChange={(e) => setFormState((s) => ({ ...s, pj_pelaksana: e.target.value }))}
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3.5 py-2 outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-indigo-300 mb-1.5">
                      Target Waktu
                    </label>
                    <input
                      type="text"
                      value={formState.target_waktu}
                      onChange={(e) => setFormState((s) => ({ ...s, target_waktu: e.target.value }))}
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3.5 py-2 outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-indigo-300 mb-1.5">
                      Status Evaluasi
                    </label>
                    <select
                      value={formState.evaluasi_status}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, evaluasi_status: e.target.value as any }))
                      }
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3.5 py-2 outline-none focus:border-cyan-400"
                    >
                      <option value="Belum Terlaksana">Belum Terlaksana</option>
                      <option value="Dalam Proses">Dalam Proses</option>
                      <option value="Tercapai">Tercapai</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-indigo-900/50">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{editingItem ? 'Simpan Perubahan' : 'Simpan Risiko ICRA'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Pratinjau & Cetak Resmi F4 Landscape */}
      <IcraProgramReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        items={yearItems}
        tahun={selectedYear}
      />
    </div>
  );
}

import React, { useState, useEffect, useMemo, useCallback, useRef, ReactElement } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { utils, writeFile } from 'xlsx';
import SignatureCanvas from 'react-signature-canvas';
import {
  Activity,
  Plus,
  Search,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  Edit3,
  Trash2,
  X,
  Users,
  TrendingUp,
  ClipboardCheck,
  Loader2,
  Save,
  Building2,
  Calendar,
  Eraser,
  BellRing,
  Camera,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { uploadImagesToSupabase } from '@/lib/upload';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import { normalizeImageUrl } from '@/utils/imageHelper';
import { exportBlackSignatureCanvas } from '@/utils/signatureUtils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from '@/components/ChartComponents';
import { ICRA_UNITS_LIST, normalizeStringArray, toBool } from '@/utils/icraData';
import {
  KlbEventItem,
  KlbCaseItem,
  KlbStatus,
  SubjectCategory,
  CaseOutcome,
  HaisClusterAlert,
  KLB_AGENT_TYPES,
  KLB_CASE_OUTCOMES,
  buildDefaultKlbChecklist,
  normalizeKlbChecklist,
  calculateAttackRate,
  buildEpiCurveData,
} from '@/utils/klbData';
import KlbReportModal from '@/components/klb/KlbReportModal';

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function normalizeKlbEvent(raw: any): KlbEventItem {
  return {
    id: String(raw.id),
    created_at: raw.created_at,
    nomor_klb: raw.nomor_klb || '',
    judul_kejadian: raw.judul_kejadian || '',
    jenis_agen: raw.jenis_agen || KLB_AGENT_TYPES[0],
    unit_terdampak: raw.unit_terdampak || 'Ranap Dewasa',
    tanggal_terdeteksi: raw.tanggal_terdeteksi || format(new Date(), 'yyyy-MM-dd'),
    tanggal_berakhir: raw.tanggal_berakhir || '',
    populasi_berisiko: Math.max(0, Number(raw.populasi_berisiko) || 0),
    status_klb: (raw.status_klb as KlbStatus) || 'Investigasi Aktif',
    lapor_w1_dinkes: toBool(raw.lapor_w1_dinkes),
    kronologi_ringkas: raw.kronologi_ringkas || '',
    hasil_lab_swab: raw.hasil_lab_swab || '',
    checklist_intervensi: normalizeKlbChecklist(raw.checklist_intervensi),
    kesimpulan_rekomendasi: raw.kesimpulan_rekomendasi || '',
    foto_dokumentasi: normalizeStringArray(raw.foto_dokumentasi),
    nama_ipcn: raw.nama_ipcn || 'Adi Tresa Purnama, A.M.Kep',
    nama_ketua_ppi: raw.nama_ketua_ppi || 'dr. Nurul Iman',
    nama_direktur: raw.nama_direktur || 'Direktur UOBK RSUD Al-Mulk',
    ttd_ipcn: raw.ttd_ipcn || null,
  };
}

function normalizeKlbCase(raw: any): KlbCaseItem {
  return {
    id: String(raw.id),
    created_at: raw.created_at,
    klb_id: String(raw.klb_id || ''),
    nama_inisial: raw.nama_inisial || '',
    no_rm_nip: raw.no_rm_nip || '',
    kategori_subjek: (raw.kategori_subjek as SubjectCategory) || 'Pasien',
    usia_kelamin: raw.usia_kelamin || '',
    lokasi_bed: raw.lokasi_bed || '',
    tanggal_onset: raw.tanggal_onset || format(new Date(), 'yyyy-MM-dd'),
    gejala_utama: raw.gejala_utama || '',
    hasil_lab: raw.hasil_lab || '',
    status_akhir: (raw.status_akhir as CaseOutcome) || 'Dalam Perawatan',
  };
}

function safeFmt(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy', { locale: idLocale });
  } catch {
    return dateStr;
  }
}

export default function KlbPage() {
  const [events, setEvents] = useState<KlbEventItem[]>([]);
  const [allCases, setAllCases] = useState<KlbCaseItem[]>([]);
  const [haisAlerts, setHaisAlerts] = useState<HaisClusterAlert[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'linelist' | 'intervensi'>('overview');

  const [filterStatus, setFilterStatus] = useState<'Semua' | KlbStatus>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<KlbEventItem | null>(null);

  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<KlbCaseItem | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Event Form
  const todayIso = format(new Date(), 'yyyy-MM-dd');
  const sigIpcnRef = useRef<SignatureCanvas>(null);
  const [existingTtdIpcn, setExistingTtdIpcn] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    nomor_klb: '',
    judul_kejadian: '',
    jenis_agen: KLB_AGENT_TYPES[0],
    unit_terdampak: 'Ranap Dewasa',
    tanggal_terdeteksi: todayIso,
    tanggal_berakhir: '',
    populasi_berisiko: 20,
    status_klb: 'Investigasi Aktif' as KlbStatus,
    lapor_w1_dinkes: false,
    kronologi_ringkas: '',
    hasil_lab_swab: '',
    kesimpulan_rekomendasi: '',
    nama_ipcn: 'Adi Tresa Purnama, A.M.Kep',
    nama_ketua_ppi: 'dr. Nurul Iman',
    nama_direktur: 'Direktur UOBK RSUD Al-Mulk',
  });

  // Case Form
  const [caseForm, setCaseForm] = useState({
    nama_inisial: '',
    no_rm_nip: '',
    kategori_subjek: 'Pasien' as SubjectCategory,
    usia_kelamin: '',
    lokasi_bed: '',
    tanggal_onset: todayIso,
    gejala_utama: '',
    hasil_lab: 'Dalam Pemeriksaan',
    status_akhir: 'Dalam Perawatan' as CaseOutcome,
  });

  // Intervention Detail Local Editing State
  const [detailPhotos, setDetailPhotos] = useState<DocImage[]>([]);
  const [detailConclusion, setDetailConclusion] = useState('');

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [evRes, caseRes, haisRes] = await Promise.all([
        supabase.from('klb_events').select('*').order('created_at', { ascending: false }),
        supabase.from('klb_cases').select('*').order('tanggal_onset', { ascending: true }),
        supabase
          .from('audit_sessions')
          .select('*')
          .eq('kategori', 'Surveilans HAIs')
          .gte('tanggal_waktu', thirtyDaysAgo.toISOString()),
      ]);

      const normEvents = Array.isArray(evRes.data) ? evRes.data.map(normalizeKlbEvent) : [];
      const normCases = Array.isArray(caseRes.data) ? caseRes.data.map(normalizeKlbCase) : [];
      setEvents(normEvents);
      setAllCases(normCases);

      // Compute potential cluster alerts (>= 2 positive HAIs cases in the same unit & indicator in 30 days)
      if (Array.isArray(haisRes.data) && haisRes.data.length > 0) {
        const clusterMap = new Map<string, HaisClusterAlert>();
        haisRes.data.forEach((row: any) => {
          const casesNum = Number(row.jumlah_patuh) || 0;
          if (casesNum <= 0) return;
          const unit = String(row.unit || 'Ruangan Umum');
          const ind = String(row.indikator_id || 'hais').toUpperCase();
          const key = `${unit}__${ind}`;
          const prev = clusterMap.get(key);
          const dtStr = String(row.tanggal_waktu || row.created_at || '').slice(0, 10);
          if (!prev) {
            clusterMap.set(key, { key, unit, indikator: ind, totalCases: casesNum, latestDate: dtStr });
          } else {
            prev.totalCases += casesNum;
            if (dtStr > prev.latestDate) prev.latestDate = dtStr;
          }
        });
        const detected = Array.from(clusterMap.values())
          .filter((a) => a.totalCases >= 2)
          .sort((a, b) => b.totalCases - a.totalCases);
        setHaisAlerts(detected);
      } else {
        setHaisAlerts([]);
      }

      setSelectedEventId((prev) => {
        if (prev && normEvents.some((e) => e.id === prev)) return prev;
        return normEvents[0]?.id || null;
      });
    } catch (err) {
      console.error('Failed to load KLB data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) || null,
    [events, selectedEventId]
  );

  // Sync intervention editor state when selected event switches
  useEffect(() => {
    if (selectedEvent) {
      setDetailPhotos(
        selectedEvent.foto_dokumentasi.map((u) => ({ url: normalizeImageUrl(u), file: null }))
      );
      setDetailConclusion(selectedEvent.kesimpulan_rekomendasi || '');
    } else {
      setDetailPhotos([]);
      setDetailConclusion('');
    }
  }, [selectedEvent]);

  const selectedCases = useMemo(() => {
    if (!selectedEvent) return [];
    return allCases
      .filter((c) => c.klb_id === selectedEvent.id)
      .sort((a, b) => a.tanggal_onset.localeCompare(b.tanggal_onset));
  }, [allCases, selectedEvent]);

  const epiCurveData = useMemo(() => buildEpiCurveData(selectedCases), [selectedCases]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filterStatus !== 'Semua' && ev.status_klb !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${ev.nomor_klb} ${ev.judul_kejadian} ${ev.jenis_agen} ${ev.unit_terdampak}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: events.length,
      aktif: events.filter((e) => e.status_klb === 'Investigasi Aktif').length,
      pantau: events.filter((e) => e.status_klb === 'Terkendali / Pemantauan').length,
      selesai: events.filter((e) => e.status_klb === 'Selesai (Closed)').length,
    };
  }, [events]);

  const generateKlbNumber = useCallback(() => {
    const now = new Date();
    const seq = String(events.length + 1).padStart(3, '0');
    const roman = ROMAN_MONTHS[now.getMonth()];
    return `${seq}/KLB-PPI/${roman}/${now.getFullYear()}`;
  }, [events.length]);

  const openNewEventModal = (prefillAlert?: HaisClusterAlert) => {
    const savedObserver =
      (typeof window !== 'undefined' && localStorage.getItem('smart_ppi_observer')) ||
      'Adi Tresa Purnama, A.M.Kep';

    let jenisAgen = KLB_AGENT_TYPES[0];
    if (prefillAlert) {
      if (prefillAlert.indikator.includes('PHLE')) jenisAgen = 'Klaster Phlebitis / IADP';
      else if (prefillAlert.indikator.includes('IDO')) jenisAgen = 'Klaster Infeksi Daerah Operasi (IDO)';
      else if (prefillAlert.indikator.includes('ISK')) jenisAgen = 'Klaster ISK / CAUTI';
      else if (prefillAlert.indikator.includes('VAP')) jenisAgen = 'Klaster VAP / Pneumonia Nosokomial';
    }

    setEditingEvent(null);
    setEventForm({
      nomor_klb: generateKlbNumber(),
      judul_kejadian: prefillAlert
        ? `Investigasi Klaster ${prefillAlert.indikator} (${prefillAlert.totalCases} Kasus) di ${prefillAlert.unit}`
        : '',
      jenis_agen: jenisAgen,
      unit_terdampak: prefillAlert?.unit || 'Ranap Dewasa',
      tanggal_terdeteksi: prefillAlert?.latestDate || todayIso,
      tanggal_berakhir: '',
      populasi_berisiko: 20,
      status_klb: 'Investigasi Aktif',
      lapor_w1_dinkes: false,
      kronologi_ringkas: prefillAlert
        ? `Terdeteksi ${prefillAlert.totalCases} kasus ${prefillAlert.indikator} pada data surveilans HAIs di ruang ${prefillAlert.unit} dalam 30 hari terakhir.`
        : '',
      hasil_lab_swab: '',
      kesimpulan_rekomendasi: '',
      nama_ipcn: savedObserver,
      nama_ketua_ppi: 'dr. Nurul Iman',
      nama_direktur: 'Direktur UOBK RSUD Al-Mulk',
    });
    setExistingTtdIpcn(null);
    setIsEventModalOpen(true);
  };

  const openEditEventModal = (ev: KlbEventItem) => {
    setEditingEvent(ev);
    setEventForm({
      nomor_klb: ev.nomor_klb,
      judul_kejadian: ev.judul_kejadian,
      jenis_agen: ev.jenis_agen,
      unit_terdampak: ev.unit_terdampak,
      tanggal_terdeteksi: ev.tanggal_terdeteksi,
      tanggal_berakhir: ev.tanggal_berakhir || '',
      populasi_berisiko: ev.populasi_berisiko,
      status_klb: ev.status_klb,
      lapor_w1_dinkes: ev.lapor_w1_dinkes,
      kronologi_ringkas: ev.kronologi_ringkas,
      hasil_lab_swab: ev.hasil_lab_swab,
      kesimpulan_rekomendasi: ev.kesimpulan_rekomendasi,
      nama_ipcn: ev.nama_ipcn,
      nama_ketua_ppi: ev.nama_ketua_ppi,
      nama_direktur: ev.nama_direktur,
    });
    setExistingTtdIpcn(ev.ttd_ipcn || null);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.judul_kejadian.trim()) {
      showToast('Judul / nama klaster KLB wajib diisi!', 'error');
      return;
    }

    setSaving(true);
    try {
      let ttdIpcn = existingTtdIpcn;
      if (sigIpcnRef.current && !sigIpcnRef.current.isEmpty()) {
        ttdIpcn = exportBlackSignatureCanvas(sigIpcnRef.current.getCanvas());
      }

      if (editingEvent) {
        const updates = {
          ...eventForm,
          judul_kejadian: eventForm.judul_kejadian.trim(),
          ttd_ipcn: ttdIpcn,
        };
        const { error } = await supabase.from('klb_events').update(updates).eq('id', editingEvent.id);
        if (error) throw error;
        showToast('Data investigasi KLB berhasil diperbarui!');
      } else {
        const newId = `klb_ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const newRow = {
          id: newId,
          created_at: new Date().toISOString(),
          ...eventForm,
          judul_kejadian: eventForm.judul_kejadian.trim(),
          checklist_intervensi: buildDefaultKlbChecklist(),
          foto_dokumentasi: [],
          ttd_ipcn: ttdIpcn,
        };
        const { error } = await supabase.from('klb_events').insert([newRow]);
        if (error) throw error;
        setSelectedEventId(newId);
        showToast('Registrasi investigasi KLB baru berhasil dibuat!');
      }

      setIsEventModalOpen(false);
      await fetchData();
    } catch (err: any) {
      showToast(`Gagal menyimpan kejadian KLB: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (evId: string) => {
    if (!confirm('Hapus kejadian KLB beserta seluruh data Line Listing kasusnya?')) return;
    try {
      const { error } = await supabase.from('klb_events').delete().eq('id', evId);
      if (error) throw error;
      await supabase.from('klb_cases').delete().eq('klb_id', evId);
      showToast('Data investigasi KLB telah dihapus.');
      await fetchData();
    } catch (err: any) {
      showToast(`Gagal menghapus: ${err.message}`, 'error');
    }
  };

  // Case CRUD
  const openAddCase = () => {
    setEditingCase(null);
    setCaseForm({
      nama_inisial: '',
      no_rm_nip: '',
      kategori_subjek: 'Pasien',
      usia_kelamin: '',
      lokasi_bed: selectedEvent?.unit_terdampak || '',
      tanggal_onset: todayIso,
      gejala_utama: '',
      hasil_lab: 'Dalam Pemeriksaan',
      status_akhir: 'Dalam Perawatan',
    });
    setIsCaseModalOpen(true);
  };

  const openEditCase = (c: KlbCaseItem) => {
    setEditingCase(c);
    setCaseForm({
      nama_inisial: c.nama_inisial,
      no_rm_nip: c.no_rm_nip,
      kategori_subjek: c.kategori_subjek,
      usia_kelamin: c.usia_kelamin,
      lokasi_bed: c.lokasi_bed,
      tanggal_onset: c.tanggal_onset,
      gejala_utama: c.gejala_utama,
      hasil_lab: c.hasil_lab,
      status_akhir: c.status_akhir,
    });
    setIsCaseModalOpen(true);
  };

  const handleSaveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    if (!caseForm.nama_inisial.trim()) {
      showToast('Inisial / Nama subjek wajib diisi!', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingCase) {
        const { error } = await supabase
          .from('klb_cases')
          .update({ ...caseForm, nama_inisial: caseForm.nama_inisial.trim() })
          .eq('id', editingCase.id);
        if (error) throw error;
        showToast('Data kasus Line Listing diperbarui!');
      } else {
        const row = {
          id: `klb_case_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          created_at: new Date().toISOString(),
          klb_id: selectedEvent.id,
          ...caseForm,
          nama_inisial: caseForm.nama_inisial.trim(),
        };
        const { error } = await supabase.from('klb_cases').insert([row]);
        if (error) throw error;
        showToast('Kasus baru ditambahkan ke Line Listing & Epi-Curve!');
      }
      setIsCaseModalOpen(false);
      await fetchData();
    } catch (err: any) {
      showToast(`Gagal menyimpan kasus: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!confirm('Hapus kasus ini dari Line Listing?')) return;
    try {
      const { error } = await supabase.from('klb_cases').delete().eq('id', caseId);
      if (error) throw error;
      showToast('Kasus dihapus dari daftar.');
      await fetchData();
    } catch (err: any) {
      showToast(`Gagal menghapus kasus: ${err.message}`, 'error');
    }
  };

  // Intervention Checklist & W1 Toggle
  const handleToggleChecklistStep = async (stepIndex: number) => {
    if (!selectedEvent) return;
    const updated = [...selectedEvent.checklist_intervensi];
    updated[stepIndex] = { ...updated[stepIndex], done: !updated[stepIndex].done };

    // Optimistic UI update
    setEvents((prev) =>
      prev.map((ev) => (ev.id === selectedEvent.id ? { ...ev, checklist_intervensi: updated } : ev))
    );

    try {
      const { error } = await supabase
        .from('klb_events')
        .update({ checklist_intervensi: updated })
        .eq('id', selectedEvent.id);
      if (error) throw error;
    } catch (err: any) {
      showToast(`Gagal menyimpan checklist: ${err.message}`, 'error');
    }
  };

  const handleToggleW1 = async () => {
    if (!selectedEvent) return;
    const nextVal = !selectedEvent.lapor_w1_dinkes;
    setEvents((prev) =>
      prev.map((ev) => (ev.id === selectedEvent.id ? { ...ev, lapor_w1_dinkes: nextVal } : ev))
    );
    try {
      const { error } = await supabase
        .from('klb_events')
        .update({ lapor_w1_dinkes: nextVal })
        .eq('id', selectedEvent.id);
      if (error) throw error;
      showToast(nextVal ? 'Notifikasi W1 ditandai Sudah Dilaporkan!' : 'Status Notifikasi W1 diubah.');
    } catch (err: any) {
      showToast(`Gagal mengubah status W1: ${err.message}`, 'error');
    }
  };

  const handleSaveInterventionNotesAndPhotos = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      const uploadedUrls = await uploadImagesToSupabase(
        supabase,
        detailPhotos,
        'audit_images',
        'klb-investigasi'
      );
      const { error } = await supabase
        .from('klb_events')
        .update({
          kesimpulan_rekomendasi: detailConclusion.trim(),
          foto_dokumentasi: uploadedUrls,
        })
        .eq('id', selectedEvent.id);
      if (error) throw error;
      showToast('Kesimpulan & foto dokumentasi penanggulangan KLB tersimpan!');
      await fetchData();
    } catch (err: any) {
      showToast(`Gagal menyimpan dokumentasi: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportLineListingExcel = () => {
    if (!selectedEvent || selectedCases.length === 0) {
      showToast('Belum ada data kasus Line Listing untuk diekspor.', 'error');
      return;
    }
    const rows = selectedCases.map((c, idx) => ({
      No: idx + 1,
      'Nomor KLB': selectedEvent.nomor_klb,
      'Inisial / Nama': c.nama_inisial,
      'No RM / NIP': c.no_rm_nip,
      Kategori: c.kategori_subjek,
      'Usia / JK': c.usia_kelamin,
      'Lokasi / Bed': c.lokasi_bed,
      'Tanggal Onset': c.tanggal_onset,
      'Gejala Utama': c.gejala_utama,
      'Hasil Lab': c.hasil_lab,
      'Status Akhir': c.status_akhir,
    }));
    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Line_Listing_KLB');
    writeFile(
      wb,
      `Line_Listing_KLB_${(selectedEvent.nomor_klb || 'Data').replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
    );
    showToast('File Excel Line Listing KLB berhasil diunduh!');
  };

  const selectedAttackRate = selectedEvent
    ? calculateAttackRate(selectedCases.length, selectedEvent.populasi_berisiko)
    : { percent: 0, formatted: '0,0%' };

  const pasienTotal = selectedCases.filter((c) => c.kategori_subjek === 'Pasien').length;
  const stafTotal = selectedCases.filter((c) => c.kategori_subjek === 'Petugas / Staf').length;

  return (
    <>
      <Head>
        <title>Investigasi KLB PPI - SMART PPI RSUD Al-Mulk</title>
      </Head>

      {/* Toast */}
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

      <div className="space-y-6 pb-20 sm:pb-8">
        {/* Header Card */}
        <div className="rounded-3xl bg-gradient-to-br from-[#191b42] via-[#131535] to-[#0d0f26] border border-indigo-500/30 p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.12)] relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-rose-500/10 blur-2xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-rose-500/25 via-amber-500/20 to-indigo-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 shadow-[0_8px_20px_rgba(0,0,0,0.5)] shrink-0">
                <Activity className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-400/30 text-[10px] font-black uppercase tracking-widest text-rose-300 mb-1.5">
                  Deteksi Dini & Manajemen Outbreak STARKES
                </div>
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-tight">
                  Investigasi KLB (Kejadian Luar Biasa) PPI
                </h1>
                <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-2xl">
                  Pelacakan klaster infeksi HAIs, Line Listing kasus, Kurva Epidemiologi otomatis, 10 langkah intervensi, dan Laporan Resmi F4.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openNewEventModal()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Buka Investigasi KLB Baru</span>
            </button>
          </div>
        </div>

        {/* Early Warning Banner dari Surveilans HAIs */}
        {haisAlerts.length > 0 ? (
          <div className="rounded-2xl bg-gradient-to-r from-rose-950/60 via-[#22142f] to-[#17163b] border border-rose-500/45 p-4 shadow-xl space-y-2.5">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-black uppercase tracking-wider">
              <BellRing className="w-4 h-4 animate-bounce" />
              <span>Peringatan Dini Surveilans HAIs (30 Hari Terakhir) — Potensi Klaster Terdeteksi</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {haisAlerts.slice(0, 3).map((al) => (
                <div
                  key={al.key}
                  className="bg-[#0e1026]/85 border border-rose-500/30 rounded-xl p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-black text-white">
                      {al.totalCases} Kasus {al.indikator}
                    </div>
                    <div className="text-[11px] text-rose-200/80">
                      Ruangan: <strong>{al.unit}</strong> • Terakhir: {safeFmt(al.latestDate)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openNewEventModal(al)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shrink-0 cursor-pointer transition-colors"
                  >
                    Tindak Lanjut KLB
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#10202e]/80 border border-emerald-500/30 px-4 py-2.5 flex items-center gap-2.5 text-xs text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Pemantauan Dini Surveilans HAIs 30 hari terakhir: Belum terdeteksi potensi klaster (&ge; 2 kasus sejenis di satu unit).
            </span>
          </div>
        )}

        {/* Top Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl bg-[#141634] border border-indigo-900/40 p-4 shadow-lg">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Kejadian</span>
            <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
            <span className="text-[11px] text-indigo-300/80">Tercatat</span>
          </div>
          <div className="rounded-2xl bg-[#221226] border border-rose-500/35 p-4 shadow-lg">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">Investigasi Aktif</span>
            <div className="text-2xl font-black text-rose-400 mt-1">{stats.aktif}</div>
            <span className="text-[11px] text-rose-300/80">Dalam Penanganan</span>
          </div>
          <div className="rounded-2xl bg-[#1e1a28] border border-amber-500/35 p-4 shadow-lg">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">Pemantauan</span>
            <div className="text-2xl font-black text-amber-400 mt-1">{stats.pantau}</div>
            <span className="text-[11px] text-amber-300/80">2× Masa Inkubasi</span>
          </div>
          <div className="rounded-2xl bg-[#10242c] border border-emerald-500/35 p-4 shadow-lg">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Selesai (Closed)</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{stats.selesai}</div>
            <span className="text-[11px] text-emerald-300/80">KLB Berakhir</span>
          </div>
        </div>

        {/* Main Workspace: Master List + Detail View */}
        {loading ? (
          <div className="rounded-2xl bg-[#141634] border border-indigo-900/40 p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
            <p className="text-sm font-semibold">Memuat data investigasi KLB PPI...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT PANEL: DAFTAR KEJADIAN KLB */}
            <div className="lg:col-span-4 space-y-3">
              <div className="rounded-2xl bg-[#141634] border border-indigo-900/40 p-3.5 space-y-2.5 shadow-xl">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nomor KLB, ruangan, agen..."
                    className="w-full bg-[#0c0e24] border border-indigo-800/60 text-white text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-cyan-400"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full bg-[#0c0e24] border border-indigo-800/60 text-white text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
                >
                  <option value="Semua">Semua Status Kejadian</option>
                  <option value="Investigasi Aktif">Investigasi Aktif</option>
                  <option value="Terkendali / Pemantauan">Terkendali / Pemantauan</option>
                  <option value="Selesai (Closed)">Selesai (Closed)</option>
                </select>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="rounded-2xl bg-[#141634]/80 border border-indigo-900/40 p-6 text-center space-y-3">
                  <ShieldAlert className="w-10 h-10 text-rose-400/70 mx-auto" />
                  <p className="text-xs text-slate-300 font-semibold">
                    Belum ada kejadian investigasi KLB yang tercatat.
                  </p>
                  <button
                    type="button"
                    onClick={() => openNewEventModal()}
                    className="px-4 py-2 rounded-xl bg-rose-600/25 border border-rose-500/40 text-rose-200 text-xs font-bold cursor-pointer hover:bg-rose-600/40"
                  >
                    + Buat Investigasi Baru
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
                  {filteredEvents.map((ev) => {
                    const evCases = allCases.filter((c) => c.klb_id === ev.id);
                    const ar = calculateAttackRate(evCases.length, ev.populasi_berisiko);
                    const isSelected = ev.id === selectedEventId;

                    const stStyle =
                      ev.status_klb === 'Selesai (Closed)'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : ev.status_klb === 'Terkendali / Pemantauan'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40';

                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setSelectedEventId(ev.id)}
                        className={`w-full text-left rounded-2xl p-4 border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#1d2152] to-[#13163b] border-cyan-400/70 shadow-[0_8px_24px_rgba(6,182,212,0.2)]'
                            : 'bg-[#141634] border-indigo-900/40 hover:border-indigo-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-mono font-bold text-indigo-300 bg-[#0b0d22] px-2 py-0.5 rounded-md border border-indigo-800/60">
                            {ev.nomor_klb || 'NO-KLB'}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${stStyle}`}>
                            {ev.status_klb}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white leading-snug line-clamp-2">
                          {ev.judul_kejadian}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-300 mt-2">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-cyan-400" /> {ev.unit_terdampak}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-rose-400" /> {evCases.length} Kasus ({ar.formatted})
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT PANEL: DETAIL INVESTIGASI TERPILIH */}
            <div className="lg:col-span-8">
              {!selectedEvent ? (
                <div className="rounded-3xl bg-[#141634]/80 border border-indigo-900/40 p-10 text-center space-y-3">
                  <Activity className="w-12 h-12 text-indigo-400/60 mx-auto" />
                  <h3 className="text-base font-black text-white">Pilih atau Buat Kejadian KLB</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Klik salah satu kejadian KLB di daftar sebelah kiri, atau klik &ldquo;Buka Investigasi KLB Baru&rdquo; untuk memulai pencatatan Line Listing dan Kurva Epidemiologi.
                  </p>
                </div>
              ) : (
                <div className="rounded-3xl bg-[#141634] border border-indigo-500/35 shadow-2xl overflow-hidden">
                  {/* Header Detail */}
                  <div className="p-5 sm:p-6 bg-[#171a42] border-b border-indigo-900/50 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-cyan-300 bg-[#0d0f26] px-2.5 py-0.5 rounded-lg border border-indigo-800/60">
                            {selectedEvent.nomor_klb}
                          </span>
                          <span className="text-xs font-bold text-slate-300">
                            • {selectedEvent.jenis_agen}
                          </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
                          {selectedEvent.judul_kejadian}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                            Unit: <strong>{selectedEvent.unit_terdampak}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            Terdeteksi: <strong>{safeFmt(selectedEvent.tanggal_terdeteksi)}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsReportModalOpen(true)}
                          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-rose-600/25 cursor-pointer transition-all"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Laporan Resmi (F4)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditEventModal(selectedEvent)}
                          className="p-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 cursor-pointer"
                          title="Edit Identitas KLB"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(selectedEvent.id)}
                          className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 cursor-pointer"
                          title="Hapus Kejadian KLB"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 3 Sub-Tabs Detail */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        { id: 'overview', label: 'Ringkasan & Epi-Curve', icon: TrendingUp },
                        { id: 'linelist', label: `Line Listing Kasus (${selectedCases.length})`, icon: Users },
                        {
                          id: 'intervensi',
                          label: `10 Langkah Intervensi (${selectedEvent.checklist_intervensi.filter((c) => c.done).length}/10)`,
                          icon: ClipboardCheck,
                        },
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const active = detailTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setDetailTab(tab.id as any)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              active
                                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                                : 'bg-[#0e1028] text-slate-300 hover:text-white border border-indigo-900/50'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detail Content Area */}
                  <div className="p-5 sm:p-6">
                    {/* SUB-TAB 1: OVERVIEW & KURVA EPIDEMIOLOGI */}
                    {detailTab === 'overview' && (
                      <div className="space-y-5">
                        {/* 4 Epidemiological KPIs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="rounded-2xl bg-[#0e1028] border border-indigo-900/50 p-3.5">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Total Kasus</span>
                            <div className="text-xl font-black text-white mt-0.5">{selectedCases.length} Orang</div>
                            <span className="text-[11px] text-cyan-300">{pasienTotal} Pasien • {stafTotal} Staf</span>
                          </div>
                          <div className="rounded-2xl bg-[#0e1028] border border-indigo-900/50 p-3.5">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Populasi Berisiko</span>
                            <div className="text-xl font-black text-white mt-0.5">{selectedEvent.populasi_berisiko} Orang</div>
                            <span className="text-[11px] text-slate-400">Di unit terdampak</span>
                          </div>
                          <div className="rounded-2xl bg-rose-950/35 border border-rose-500/40 p-3.5">
                            <span className="text-[10px] font-bold uppercase text-rose-300">Attack Rate</span>
                            <div className="text-xl font-black text-rose-400 mt-0.5">{selectedAttackRate.formatted}</div>
                            <span className="text-[11px] text-rose-200/80">Kasus / Populasi</span>
                          </div>
                          <div className="rounded-2xl bg-[#0e1028] border border-indigo-900/50 p-3.5">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Notifikasi W1</span>
                            <div className="text-sm font-black text-white mt-1">
                              {selectedEvent.lapor_w1_dinkes ? 'Sudah Dilapor' : 'Internal / Proses'}
                            </div>
                            <span className="text-[11px] text-slate-400">Direktur & Dinkes</span>
                          </div>
                        </div>

                        {/* Interactive Epi-Curve Chart */}
                        <div className="rounded-2xl bg-[#0c0e24] border border-indigo-900/50 p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wider text-cyan-300">
                                Kurva Epidemiologi Otomatis (Epi-Curve)
                              </h4>
                              <p className="text-[11px] text-slate-400">
                                Distribusi jumlah kasus harian berdasarkan Tanggal Onset gejala dari tabel Line Listing.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setDetailTab('linelist');
                                openAddCase();
                              }}
                              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/40 text-cyan-200 text-[11px] font-bold cursor-pointer"
                            >
                              + Tambah Kasus
                            </button>
                          </div>

                          {epiCurveData.length === 0 ? (
                            <div className="h-44 flex flex-col items-center justify-center text-center border border-dashed border-indigo-900/60 rounded-xl p-4 text-slate-400 text-xs">
                              Belum ada kasus di Line Listing. Klik <strong>&ldquo;+ Tambah Kasus&rdquo;</strong> untuk mulai menggambar Kurva Epidemiologi secara otomatis.
                            </div>
                          ) : (
                            <div className="h-64 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={epiCurveData} margin={{ top: 12, right: 12, left: -16, bottom: 4 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                  <XAxis dataKey="label" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                                  <YAxis allowDecimals={false} tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: '#0f172a',
                                      border: '1px solid #334155',
                                      borderRadius: '12px',
                                      fontSize: '12px',
                                    }}
                                  />
                                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                                  <Bar dataKey="pasien" name="Pasien" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} />
                                  <Bar dataKey="staf" name="Petugas / Staf" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </div>

                        {/* Kronologi & Lab Notes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="rounded-2xl bg-[#0e1028] border border-indigo-900/40 p-4 space-y-1.5">
                            <span className="text-[11px] font-black uppercase text-indigo-300">Kronologi Singkat</span>
                            <p className="text-slate-200 leading-relaxed whitespace-pre-line">
                              {selectedEvent.kronologi_ringkas || 'Belum diisi. Klik ikon Edit di kanan atas untuk melengkapi kronologi.'}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[#0e1028] border border-indigo-900/40 p-4 space-y-1.5">
                            <span className="text-[11px] font-black uppercase text-amber-300">Hasil Lab / Kultur / Swab</span>
                            <p className="text-slate-200 leading-relaxed whitespace-pre-line">
                              {selectedEvent.hasil_lab_swab || 'Belum ada hasil kultur / swab lingkungan tercatat.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 2: LINE LISTING KASUS */}
                    {detailTab === 'linelist' && (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-black text-white">Daftar Kasus Terdampak (Line Listing)</h4>
                            <p className="text-[11px] text-slate-400">
                              Setiap kasus yang dicatat otomatis memperbarui Attack Rate & Kurva Epidemiologi.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleExportLineListingExcel}
                              className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                              <span>Excel</span>
                            </button>
                            <button
                              type="button"
                              onClick={openAddCase}
                              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Tambah Kasus</span>
                            </button>
                          </div>
                        </div>

                        {selectedCases.length === 0 ? (
                          <div className="rounded-2xl bg-[#0c0e24] border border-dashed border-indigo-800/60 p-8 text-center space-y-3">
                            <Users className="w-10 h-10 text-cyan-400/70 mx-auto" />
                            <p className="text-xs text-slate-300">
                              Belum ada kasus tercatat pada kejadian KLB ini.
                            </p>
                            <button
                              type="button"
                              onClick={openAddCase}
                              className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold cursor-pointer"
                            >
                              + Input Kasus Pertama
                            </button>
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-2xl border border-indigo-900/50 bg-[#0e1028]">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-[#090b1d] border-b border-indigo-900/60 text-[10px] font-black uppercase text-indigo-300">
                                  <th className="px-3 py-3 text-center w-10">No</th>
                                  <th className="px-3 py-3">Inisial / No.RM</th>
                                  <th className="px-3 py-3">Subjek</th>
                                  <th className="px-3 py-3">Lokasi/Bed</th>
                                  <th className="px-3 py-3">Tgl Onset</th>
                                  <th className="px-3 py-3">Gejala & Lab</th>
                                  <th className="px-3 py-3 text-center">Status</th>
                                  <th className="px-3 py-3 text-center">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-indigo-950/60">
                                {selectedCases.map((c, idx) => (
                                  <tr key={c.id} className="hover:bg-[#171b40]/60 align-top">
                                    <td className="px-3 py-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                                    <td className="px-3 py-2.5">
                                      <div className="font-bold text-white">{c.nama_inisial}</div>
                                      <div className="text-[10px] text-slate-400">
                                        {c.no_rm_nip || '-'} • {c.usia_kelamin || '-'}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          c.kategori_subjek === 'Pasien'
                                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                        }`}
                                      >
                                        {c.kategori_subjek}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-200">{c.lokasi_bed || '-'}</td>
                                    <td className="px-3 py-2.5 font-bold text-white whitespace-nowrap">
                                      {safeFmt(c.tanggal_onset)}
                                    </td>
                                    <td className="px-3 py-2.5 max-w-[220px]">
                                      <p className="text-slate-200 leading-snug">{c.gejala_utama || '-'}</p>
                                      {c.hasil_lab && (
                                        <p className="text-[10px] text-cyan-300 mt-0.5">Lab: {c.hasil_lab}</p>
                                      )}
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 text-[10px] font-bold">
                                        {c.status_akhir}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => openEditCase(c)}
                                          className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/30 cursor-pointer"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteCase(c.id)}
                                          className="p-1.5 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/30 cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-TAB 3: 10 LANGKAH INTERVENSI & DOKUMENTASI FOTO */}
                    {detailTab === 'intervensi' && (
                      <div className="space-y-5">
                        {/* W1 Quick Banner */}
                        <div className="rounded-2xl bg-[#0e1028] border border-indigo-800/60 p-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h4 className="text-xs font-black uppercase text-amber-300">
                              Kewajiban Pelaporan Cepat W1 (1×24 Jam)
                            </h4>
                            <p className="text-[11px] text-slate-300 mt-0.5">
                              Notifikasi wajib kepada Direktur RS & Dinas Kesehatan bila klaster termasuk penyakit berpotensi wabah.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleToggleW1}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                              selectedEvent.lapor_w1_dinkes
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                : 'bg-slate-800 text-slate-300 border-slate-600 hover:text-white'
                            }`}
                          >
                            {selectedEvent.lapor_w1_dinkes ? '✓ Sudah Dilaporkan (W1)' : 'Tandai Sudah Lapor W1'}
                          </button>
                        </div>

                        {/* 10 Steps Checklist */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-black uppercase text-cyan-300">
                            Checklist 10 Langkah Investigasi & Penanggulangan KLB (Klik untuk Centang)
                          </h4>
                          {selectedEvent.checklist_intervensi.map((step, idx) => (
                            <label
                              key={step.id}
                              className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer text-xs ${
                                step.done
                                  ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-100'
                                  : 'bg-[#0e1028] border-indigo-900/40 text-slate-200 hover:border-indigo-600/60'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={step.done}
                                onChange={() => handleToggleChecklistStep(idx)}
                                className="mt-0.5 w-4 h-4 accent-emerald-500 shrink-0"
                              />
                              <span className="leading-relaxed">
                                <strong className="text-cyan-300 mr-1.5">Langkah {step.step}.</strong>
                                {step.label}
                              </span>
                            </label>
                          ))}
                        </div>

                        {/* Kesimpulan & Foto Dokumentasi */}
                        <div className="rounded-2xl bg-[#0e1028] border border-indigo-900/50 p-4 space-y-4">
                          <div>
                            <label className="block text-xs font-black uppercase text-indigo-300 mb-1.5">
                              Kesimpulan & Rekomendasi Permanen Pencegahan Berulang
                            </label>
                            <textarea
                              rows={3}
                              value={detailConclusion}
                              onChange={(e) => setDetailConclusion(e.target.value)}
                              placeholder="Tuliskan kesimpulan akhir setelah pemantauan 2× masa inkubasi dan rekomendasi agar kejadian serupa tidak terulang..."
                              className="w-full bg-[#141738] border border-indigo-800/60 text-white text-xs sm:text-sm rounded-xl p-3 outline-none focus:border-cyan-400"
                            />
                          </div>

                          <div className="bg-[#141738] rounded-xl p-3.5 border border-indigo-900/50">
                            <DocumentationUploader images={detailPhotos} setImages={setDetailPhotos} />
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="button"
                              disabled={saving}
                              onClick={handleSaveInterventionNotesAndPhotos}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-60"
                            >
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              <span>Simpan Kesimpulan & Foto Dokumentasi</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MODAL: BUAT / EDIT KEJADIAN KLB                                      */}
      {/* =================================================================== */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="w-full max-w-3xl max-h-[93vh] bg-[#121432] border border-rose-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-[#171a42] border-b border-indigo-900/50">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wide text-white">
                    {editingEvent ? 'Edit Identitas Investigasi KLB' : 'Registrasi Investigasi KLB Baru'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Nomor Laporan KLB</label>
                    <input
                      type="text"
                      value={eventForm.nomor_klb}
                      onChange={(e) => setEventForm((f) => ({ ...f, nomor_klb: e.target.value }))}
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm font-mono rounded-xl px-3 py-2"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">
                      Judul Kejadian / Nama Klaster *
                    </label>
                    <input
                      type="text"
                      required
                      value={eventForm.judul_kejadian}
                      onChange={(e) => setEventForm((f) => ({ ...f, judul_kejadian: e.target.value }))}
                      placeholder="Contoh: Klaster Phlebitis Pasien Ranap Dewasa Bulan November"
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Jenis Infeksi / Agen</label>
                    <select
                      value={eventForm.jenis_agen}
                      onChange={(e) => setEventForm((f) => ({ ...f, jenis_agen: e.target.value }))}
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2"
                    >
                      {KLB_AGENT_TYPES.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Unit / Ruangan Terdampak</label>
                    <select
                      value={eventForm.unit_terdampak}
                      onChange={(e) => setEventForm((f) => ({ ...f, unit_terdampak: e.target.value }))}
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2"
                    >
                      {ICRA_UNITS_LIST.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Populasi Berisiko (Orang)</label>
                    <input
                      type="number"
                      min={1}
                      value={eventForm.populasi_berisiko}
                      onChange={(e) => setEventForm((f) => ({ ...f, populasi_berisiko: Number(e.target.value) || 0 }))}
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Tanggal Terdeteksi</label>
                    <input
                      type="date"
                      value={eventForm.tanggal_terdeteksi}
                      onChange={(e) => setEventForm((f) => ({ ...f, tanggal_terdeteksi: e.target.value }))}
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Tanggal Berakhir (Opsional)</label>
                    <input
                      type="date"
                      value={eventForm.tanggal_berakhir}
                      onChange={(e) => setEventForm((f) => ({ ...f, tanggal_berakhir: e.target.value }))}
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Status KLB</label>
                    <select
                      value={eventForm.status_klb}
                      onChange={(e) => setEventForm((f) => ({ ...f, status_klb: e.target.value as KlbStatus }))}
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2"
                    >
                      <option value="Investigasi Aktif">Investigasi Aktif</option>
                      <option value="Terkendali / Pemantauan">Terkendali / Pemantauan</option>
                      <option value="Selesai (Closed)">Selesai (Closed)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Kronologi Awal</label>
                    <textarea
                      rows={3}
                      value={eventForm.kronologi_ringkas}
                      onChange={(e) => setEventForm((f) => ({ ...f, kronologi_ringkas: e.target.value }))}
                      placeholder="Uraikan bagaimana klaster kasus ini pertama kali ditemukan..."
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-xs sm:text-sm rounded-xl p-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Hasil Lab / Kultur / Swab</label>
                    <textarea
                      rows={3}
                      value={eventForm.hasil_lab_swab}
                      onChange={(e) => setEventForm((f) => ({ ...f, hasil_lab_swab: e.target.value }))}
                      placeholder="Catat hasil kultur pasien, swab permukaan alat, atau uji air..."
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-xs sm:text-sm rounded-xl p-3"
                    />
                  </div>
                </div>

                {/* Penanda Tangan Resmi */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Nama IPCN</label>
                    <input
                      type="text"
                      value={eventForm.nama_ipcn}
                      onChange={(e) => setEventForm((f) => ({ ...f, nama_ipcn: e.target.value }))}
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-xs rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Ketua Komite PPI</label>
                    <input
                      type="text"
                      value={eventForm.nama_ketua_ppi}
                      onChange={(e) => setEventForm((f) => ({ ...f, nama_ketua_ppi: e.target.value }))}
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-xs rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Direktur RSUD Al-Mulk</label>
                    <input
                      type="text"
                      value={eventForm.nama_direktur}
                      onChange={(e) => setEventForm((f) => ({ ...f, nama_direktur: e.target.value }))}
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-xs rounded-xl px-3 py-2"
                    />
                  </div>
                </div>

                {/* TTD IPCN */}
                <div className="rounded-2xl bg-[#0d0f26] border border-indigo-900/40 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-300">Tanda Tangan IPCN (Opsional)</span>
                    <button
                      type="button"
                      onClick={() => {
                        sigIpcnRef.current?.clear();
                        setExistingTtdIpcn(null);
                      }}
                      className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Eraser className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                  <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden h-24 relative">
                    <SignatureCanvas
                      ref={sigIpcnRef}
                      penColor="#38bdf8"
                      canvasProps={{ className: 'sigCanvas w-full h-full cursor-crosshair touch-none' }}
                    />
                    {existingTtdIpcn && (
                      <span className="absolute bottom-1 right-2 text-[10px] text-emerald-400 pointer-events-none">
                        TTD tersimpan
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-indigo-900/50">
                  <button
                    type="button"
                    onClick={() => setIsEventModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{editingEvent ? 'Simpan Perubahan' : 'Simpan & Mulai Investigasi'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* MODAL: TAMBAH / EDIT KASUS LINE LISTING                             */}
      {/* =================================================================== */}
      <AnimatePresence>
        {isCaseModalOpen && (
          <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="w-full max-w-2xl max-h-[90vh] bg-[#121432] border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-[#171a42] border-b border-indigo-900/50">
                <div className="flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm sm:text-base font-black uppercase text-white">
                    {editingCase ? 'Edit Data Kasus Line Listing' : 'Tambah Kasus ke Line Listing'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCaseModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCase} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Inisial / Nama *</label>
                    <input
                      type="text"
                      required
                      value={caseForm.nama_inisial}
                      onChange={(e) => setCaseForm((c) => ({ ...c, nama_inisial: e.target.value }))}
                      placeholder="Contoh: Ny. S / Tn. A"
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">No. RM / NIP</label>
                    <input
                      type="text"
                      value={caseForm.no_rm_nip}
                      onChange={(e) => setCaseForm((c) => ({ ...c, no_rm_nip: e.target.value }))}
                      placeholder="Contoh: 00-12-34-56"
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Kategori Subjek</label>
                    <select
                      value={caseForm.kategori_subjek}
                      onChange={(e) => setCaseForm((c) => ({ ...c, kategori_subjek: e.target.value as SubjectCategory }))}
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2"
                    >
                      <option value="Pasien">Pasien</option>
                      <option value="Petugas / Staf">Petugas / Staf</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Usia / JK</label>
                    <input
                      type="text"
                      value={caseForm.usia_kelamin}
                      onChange={(e) => setCaseForm((c) => ({ ...c, usia_kelamin: e.target.value }))}
                      placeholder="Contoh: 42 Th / P"
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Lokasi / Nomor Bed</label>
                    <input
                      type="text"
                      value={caseForm.lokasi_bed}
                      onChange={(e) => setCaseForm((c) => ({ ...c, lokasi_bed: e.target.value }))}
                      placeholder="Contoh: Kamar 2 / Bed B"
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Tanggal Onset Gejala *</label>
                    <input
                      type="date"
                      required
                      value={caseForm.tanggal_onset}
                      onChange={(e) => setCaseForm((c) => ({ ...c, tanggal_onset: e.target.value }))}
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Gejala Klinis Utama</label>
                  <input
                    type="text"
                    value={caseForm.gejala_utama}
                    onChange={(e) => setCaseForm((c) => ({ ...c, gejala_utama: e.target.value }))}
                    placeholder="Contoh: Demam >= 38°C, eritema & nyeri pada area tusukan IV line"
                    className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Hasil Kultur / Lab</label>
                    <input
                      type="text"
                      value={caseForm.hasil_lab}
                      onChange={(e) => setCaseForm((c) => ({ ...c, hasil_lab: e.target.value }))}
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Status Akhir Kasus</label>
                    <select
                      value={caseForm.status_akhir}
                      onChange={(e) => setCaseForm((c) => ({ ...c, status_akhir: e.target.value as CaseOutcome }))}
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2"
                    >
                      {KLB_CASE_OUTCOMES.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-indigo-900/50">
                  <button
                    type="button"
                    onClick={() => setIsCaseModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Simpan Kasus</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: PRATINJAU & UNDUH LAPORAN RESMI KLB (F4 MARGIN 2,5 CM) */}
      <KlbReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        event={selectedEvent}
        cases={selectedCases}
      />
    </>
  );
}

KlbPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

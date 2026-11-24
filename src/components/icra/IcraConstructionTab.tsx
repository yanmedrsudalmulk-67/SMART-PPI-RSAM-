import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { utils, writeFile } from 'xlsx';
import SignatureCanvas from 'react-signature-canvas';
import {
  Plus,
  Search,
  HardHat,
  FileCheck2,
  ClipboardList,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  Calendar,
  Building2,
  Camera,
  FileSpreadsheet,
  Eraser,
  ShieldAlert,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadImagesToSupabase } from '@/lib/upload';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import { normalizeImageUrl } from '@/utils/imageHelper';
import { exportBlackSignatureCanvas } from '@/utils/signatureUtils';
import {
  IcraKonstruksiItem,
  IcraMonitoringItem,
  ConstructionType,
  PatientRiskGroup,
  ConstructionClass,
  ICRA_UNITS_LIST,
  CONSTRUCTION_TYPES,
  PATIENT_RISK_GROUPS,
  CONSTRUCTION_MATRIX,
  CONSTRUCTION_CLASS_CONTROLS,
  getConstructionClass,
  normalizeStringArray,
  normalizeChecklist,
  toBool,
} from '@/utils/icraData';
import IcraConstructionPermitModal from './IcraConstructionPermitModal';

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function normalizeKonstruksiRow(raw: any): IcraKonstruksiItem {
  const tipe = (raw.tipe_konstruksi || 'A') as ConstructionType;
  const risk = (String(raw.kelompok_risiko || '1')) as PatientRiskGroup;
  const kelas = (raw.kelas_tindakan || getConstructionClass(risk, tipe).classLevel) as ConstructionClass;
  return {
    id: String(raw.id),
    created_at: raw.created_at,
    nomor_izin: raw.nomor_izin || '',
    nama_proyek: raw.nama_proyek || '',
    lokasi_area: raw.lokasi_area || '',
    area_terdampak: raw.area_terdampak || '',
    kontraktor_pelaksana: raw.kontraktor_pelaksana || '',
    pj_proyek: raw.pj_proyek || '',
    tgl_mulai: raw.tgl_mulai || format(new Date(), 'yyyy-MM-dd'),
    tgl_selesai_estimasi: raw.tgl_selesai_estimasi || format(new Date(), 'yyyy-MM-dd'),
    tipe_konstruksi: tipe,
    kelompok_risiko: risk,
    kelas_tindakan: kelas,
    persyaratan_khusus: raw.persyaratan_khusus || '',
    checklist_pengendalian: normalizeChecklist(raw.checklist_pengendalian, kelas),
    foto_sebelum: normalizeStringArray(raw.foto_sebelum),
    foto_sesudah: normalizeStringArray(raw.foto_sesudah),
    status_proyek: raw.status_proyek || 'Aktif Berjalan',
    nama_ipcn: raw.nama_ipcn || 'Adi Tresa Purnama, A.M.Kep',
    nama_k3rs: raw.nama_k3rs || 'Tim K3RS RSUD Al-Mulk',
    ttd_ipcn: raw.ttd_ipcn || null,
    ttd_pelaksana: raw.ttd_pelaksana || null,
  };
}

function normalizeMonitoringRow(raw: any): IcraMonitoringItem {
  return {
    id: String(raw.id),
    created_at: raw.created_at,
    konstruksi_id: String(raw.konstruksi_id || ''),
    tanggal_monitoring: raw.tanggal_monitoring || format(new Date(), 'yyyy-MM-dd'),
    jam_monitoring: raw.jam_monitoring || format(new Date(), 'HH:mm'),
    petugas_ipcn: raw.petugas_ipcn || 'IPCN',
    barier_tertutup: toBool(raw.barier_tertutup),
    tekanan_negatif_hepa: raw.tekanan_negatif_hepa || 'N/A',
    keset_basah_pintu: toBool(raw.keset_basah_pintu),
    area_sekitar_bersih: toBool(raw.area_sekitar_bersih),
    jalur_limbah_tertutup: toBool(raw.jalur_limbah_tertutup),
    apd_pekerja: toBool(raw.apd_pekerja),
    temuan_lapangan: raw.temuan_lapangan || '',
    tindakan_koreksi: raw.tindakan_koreksi || '',
    status_kepatuhan: raw.status_kepatuhan || 'Sesuai Standar',
    foto_monitoring: normalizeStringArray(raw.foto_monitoring),
  };
}

function safeFormatDate(d?: string): string {
  if (!d) return '-';
  try {
    return format(parseISO(d), 'dd MMM yyyy', { locale: idLocale });
  } catch {
    return d;
  }
}

export default function IcraConstructionTab() {
  const [projects, setProjects] = useState<IcraKonstruksiItem[]>([]);
  const [monitoringLogs, setMonitoringLogs] = useState<IcraMonitoringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [filterStatus, setFilterStatus] = useState<'Semua' | IcraKonstruksiItem['status_proyek']>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Project Form Modal
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<IcraKonstruksiItem | null>(null);

  // Permit Print Modal
  const [permitProject, setPermitProject] = useState<IcraKonstruksiItem | null>(null);

  // Daily Monitoring Modal
  const [monitoringProject, setMonitoringProject] = useState<IcraKonstruksiItem | null>(null);

  // Signature Pads Refs
  const sigIpcnRef = useRef<SignatureCanvas>(null);
  const sigPelaksanaRef = useRef<SignatureCanvas>(null);

  // Project Form State
  const todayIso = format(new Date(), 'yyyy-MM-dd');
  const [projForm, setProjForm] = useState({
    nomor_izin: '',
    nama_proyek: '',
    lokasi_area: 'Ranap Usman',
    area_terdampak: '',
    kontraktor_pelaksana: 'IPSRS RSUD Al-Mulk',
    pj_proyek: '',
    tgl_mulai: todayIso,
    tgl_selesai_estimasi: todayIso,
    tipe_konstruksi: 'C' as ConstructionType,
    kelompok_risiko: '3' as PatientRiskGroup,
    kelas_tindakan: 'III' as ConstructionClass,
    persyaratan_khusus: '',
    checklist_pengendalian: normalizeChecklist(null, 'III'),
    status_proyek: 'Aktif Berjalan' as IcraKonstruksiItem['status_proyek'],
    nama_ipcn: 'Adi Tresa Purnama, A.M.Kep',
    nama_k3rs: 'Tim K3RS RSUD Al-Mulk',
  });
  const [fotoSebelum, setFotoSebelum] = useState<DocImage[]>([]);
  const [fotoSesudah, setFotoSesudah] = useState<DocImage[]>([]);
  const [existingTtdIpcn, setExistingTtdIpcn] = useState<string | null>(null);
  const [existingTtdPelaksana, setExistingTtdPelaksana] = useState<string | null>(null);

  // Monitoring Form State
  const [monForm, setMonForm] = useState({
    tanggal_monitoring: todayIso,
    jam_monitoring: format(new Date(), 'HH:mm'),
    petugas_ipcn: 'Adi Tresa Purnama, A.M.Kep',
    barier_tertutup: true,
    tekanan_negatif_hepa: 'Ya' as 'Ya' | 'Tidak' | 'N/A',
    keset_basah_pintu: true,
    area_sekitar_bersih: true,
    jalur_limbah_tertutup: true,
    apd_pekerja: true,
    temuan_lapangan: '',
    tindakan_koreksi: '',
    status_kepatuhan: 'Sesuai Standar' as IcraMonitoringItem['status_kepatuhan'],
  });
  const [monPhotos, setMonPhotos] = useState<DocImage[]>([]);

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, monRes] = await Promise.all([
        supabase.from('icra_konstruksi').select('*').order('created_at', { ascending: false }),
        supabase.from('icra_konstruksi_monitoring').select('*').order('created_at', { ascending: false }),
      ]);
      if (projRes.error) throw projRes.error;
      if (monRes.error) throw monRes.error;

      setProjects(Array.isArray(projRes.data) ? projRes.data.map(normalizeKonstruksiRow) : []);
      setMonitoringLogs(Array.isArray(monRes.data) ? monRes.data.map(normalizeMonitoringRow) : []);
    } catch (err: any) {
      console.error('Error loading ICRA Konstruksi:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const generatePermitNumber = useCallback(() => {
    const now = new Date();
    const seq = String(projects.length + 1).padStart(3, '0');
    const roman = ROMAN_MONTHS[now.getMonth()];
    return `${seq}/ICRA-PPI/${roman}/${now.getFullYear()}`;
  }, [projects.length]);

  const handleMatrixChange = (newRisk: PatientRiskGroup, newType: ConstructionType) => {
    const calc = getConstructionClass(newRisk, newType);
    setProjForm((prev) => ({
      ...prev,
      kelompok_risiko: newRisk,
      tipe_konstruksi: newType,
      kelas_tindakan: calc.classLevel,
      checklist_pengendalian: normalizeChecklist(null, calc.classLevel),
    }));
  };

  const handleOverrideClass = (cls: ConstructionClass) => {
    setProjForm((prev) => ({
      ...prev,
      kelas_tindakan: cls,
      checklist_pengendalian: normalizeChecklist(null, cls),
    }));
  };

  const openAddProject = () => {
    const defaultClass = getConstructionClass('3', 'C').classLevel;
    const savedObserver =
      (typeof window !== 'undefined' && localStorage.getItem('smart_ppi_observer')) ||
      'Adi Tresa Purnama, A.M.Kep';

    setEditingProject(null);
    setProjForm({
      nomor_izin: generatePermitNumber(),
      nama_proyek: '',
      lokasi_area: 'Ranap Usman',
      area_terdampak: '',
      kontraktor_pelaksana: 'IPSRS RSUD Al-Mulk',
      pj_proyek: '',
      tgl_mulai: todayIso,
      tgl_selesai_estimasi: todayIso,
      tipe_konstruksi: 'C',
      kelompok_risiko: '3',
      kelas_tindakan: defaultClass,
      persyaratan_khusus: '',
      checklist_pengendalian: normalizeChecklist(null, defaultClass),
      status_proyek: 'Aktif Berjalan',
      nama_ipcn: savedObserver,
      nama_k3rs: 'Tim K3RS RSUD Al-Mulk',
    });
    setFotoSebelum([]);
    setFotoSesudah([]);
    setExistingTtdIpcn(null);
    setExistingTtdPelaksana(null);
    setIsProjectModalOpen(true);
  };

  const openEditProject = (proj: IcraKonstruksiItem) => {
    setEditingProject(proj);
    setProjForm({
      nomor_izin: proj.nomor_izin,
      nama_proyek: proj.nama_proyek,
      lokasi_area: proj.lokasi_area,
      area_terdampak: proj.area_terdampak,
      kontraktor_pelaksana: proj.kontraktor_pelaksana,
      pj_proyek: proj.pj_proyek,
      tgl_mulai: proj.tgl_mulai,
      tgl_selesai_estimasi: proj.tgl_selesai_estimasi,
      tipe_konstruksi: proj.tipe_konstruksi,
      kelompok_risiko: proj.kelompok_risiko,
      kelas_tindakan: proj.kelas_tindakan,
      persyaratan_khusus: proj.persyaratan_khusus || '',
      checklist_pengendalian: proj.checklist_pengendalian,
      status_proyek: proj.status_proyek,
      nama_ipcn: proj.nama_ipcn,
      nama_k3rs: proj.nama_k3rs || 'Tim K3RS RSUD Al-Mulk',
    });
    setFotoSebelum(proj.foto_sebelum.map((u) => ({ url: normalizeImageUrl(u), file: null })));
    setFotoSesudah(proj.foto_sesudah.map((u) => ({ url: normalizeImageUrl(u), file: null })));
    setExistingTtdIpcn(proj.ttd_ipcn || null);
    setExistingTtdPelaksana(proj.ttd_pelaksana || null);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projForm.nama_proyek.trim()) {
      showToast('Nama proyek / pekerjaan wajib diisi!', 'error');
      return;
    }

    setSaving(true);
    try {
      const uploadedSebelum = await uploadImagesToSupabase(supabase, fotoSebelum, 'audit_images', 'icra-konstruksi');
      const uploadedSesudah = await uploadImagesToSupabase(supabase, fotoSesudah, 'audit_images', 'icra-konstruksi');

      let ttdIpcn = existingTtdIpcn;
      if (sigIpcnRef.current && !sigIpcnRef.current.isEmpty()) {
        ttdIpcn = exportBlackSignatureCanvas(sigIpcnRef.current.getCanvas());
      }

      let ttdPelaksana = existingTtdPelaksana;
      if (sigPelaksanaRef.current && !sigPelaksanaRef.current.isEmpty()) {
        ttdPelaksana = exportBlackSignatureCanvas(sigPelaksanaRef.current.getCanvas());
      }

      const payload = {
        nomor_izin: (projForm.nomor_izin?.trim() || generatePermitNumber()),
        nama_proyek: projForm.nama_proyek.trim(),
        lokasi_area: projForm.lokasi_area,
        area_terdampak: projForm.area_terdampak.trim(),
        kontraktor_pelaksana: projForm.kontraktor_pelaksana.trim(),
        pj_proyek: projForm.pj_proyek.trim(),
        tgl_mulai: projForm.tgl_mulai,
        tgl_selesai_estimasi: projForm.tgl_selesai_estimasi,
        tipe_konstruksi: projForm.tipe_konstruksi,
        kelompok_risiko: projForm.kelompok_risiko,
        kelas_tindakan: projForm.kelas_tindakan,
        persyaratan_khusus: projForm.persyaratan_khusus.trim(),
        checklist_pengendalian: projForm.checklist_pengendalian,
        foto_sebelum: uploadedSebelum,
        foto_sesudah: uploadedSesudah,
        status_proyek: projForm.status_proyek,
        nama_ipcn: projForm.nama_ipcn.trim(),
        nama_k3rs: projForm.nama_k3rs.trim(),
        ttd_ipcn: ttdIpcn,
        ttd_pelaksana: ttdPelaksana,
      };

      if (editingProject) {
        const { error } = await supabase.from('icra_konstruksi').update(payload).eq('id', editingProject.id);
        if (error) throw error;
        showToast('Data proyek ICRA Konstruksi berhasil diperbarui!');
      } else {
        const { error } = await supabase.from('icra_konstruksi').insert([
          {
            id: `icra_kon_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            created_at: new Date().toISOString(),
            ...payload,
          },
        ]);
        if (error) throw error;
        showToast('Proyek ICRA Konstruksi & Izin Kerja berhasil diterbitkan!');
      }

      setIsProjectModalOpen(false);
      await fetchAll();
    } catch (err: any) {
      showToast(`Gagal menyimpan proyek: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Hapus data proyek ICRA Konstruksi ini?')) return;
    try {
      const { error } = await supabase.from('icra_konstruksi').delete().eq('id', id);
      if (error) throw error;
      await supabase.from('icra_konstruksi_monitoring').delete().eq('konstruksi_id', id);
      showToast('Data proyek berhasil dihapus.');
      await fetchAll();
    } catch (err: any) {
      showToast(`Gagal menghapus: ${err.message}`, 'error');
    }
  };

  const openMonitoringModal = (proj: IcraKonstruksiItem) => {
    setMonitoringProject(proj);
    setMonForm({
      tanggal_monitoring: format(new Date(), 'yyyy-MM-dd'),
      jam_monitoring: format(new Date(), 'HH:mm'),
      petugas_ipcn: proj.nama_ipcn || 'Adi Tresa Purnama, A.M.Kep',
      barier_tertutup: true,
      tekanan_negatif_hepa: proj.kelas_tindakan === 'III' || proj.kelas_tindakan === 'IV' ? 'Ya' : 'N/A',
      keset_basah_pintu: true,
      area_sekitar_bersih: true,
      jalur_limbah_tertutup: true,
      apd_pekerja: true,
      temuan_lapangan: '',
      tindakan_koreksi: '',
      status_kepatuhan: 'Sesuai Standar',
    });
    setMonPhotos([]);
  };

  const handleSaveMonitoring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monitoringProject) return;
    setSaving(true);
    try {
      const uploadedMonPhotos = await uploadImagesToSupabase(
        supabase,
        monPhotos,
        'audit_images',
        'icra-monitoring'
      );
      const row = {
        id: `icra_mon_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        created_at: new Date().toISOString(),
        konstruksi_id: monitoringProject.id,
        ...monForm,
        foto_monitoring: uploadedMonPhotos,
      };
      const { error } = await supabase.from('icra_konstruksi_monitoring').insert([row]);
      if (error) throw error;
      showToast('Log monitoring harian proyek berhasil disimpan!');
      setMonForm((m) => ({
        ...m,
        temuan_lapangan: '',
        tindakan_koreksi: '',
        jam_monitoring: format(new Date(), 'HH:mm'),
      }));
      setMonPhotos([]);
      await fetchAll();
    } catch (err: any) {
      showToast(`Gagal menyimpan monitoring: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMonitoring = async (logId: string) => {
    if (!confirm('Hapus catatan monitoring ini?')) return;
    try {
      const { error } = await supabase.from('icra_konstruksi_monitoring').delete().eq('id', logId);
      if (error) throw error;
      showToast('Catatan monitoring dihapus.');
      await fetchAll();
    } catch (err: any) {
      showToast(`Gagal menghapus log: ${err.message}`, 'error');
    }
  };

  const handleExportExcel = () => {
    if (projects.length === 0) {
      showToast('Belum ada proyek ICRA Konstruksi untuk diekspor.', 'error');
      return;
    }
    const rows = projects.map((p, idx) => ({
      No: idx + 1,
      'Nomor Izin': p.nomor_izin,
      'Nama Proyek': p.nama_proyek,
      Lokasi: p.lokasi_area,
      'Area Terdampak': p.area_terdampak,
      Pelaksana: p.kontraktor_pelaksana,
      'PJ Proyek': p.pj_proyek,
      'Tanggal Mulai': p.tgl_mulai,
      'Estimasi Selesai': p.tgl_selesai_estimasi,
      'Tipe Konstruksi': `Tipe ${p.tipe_konstruksi}`,
      'Kelompok Risiko': `Kelompok ${p.kelompok_risiko}`,
      'Kelas Tindakan': `Kelas ${p.kelas_tindakan}`,
      Status: p.status_proyek,
      'Jumlah Log Monitoring': monitoringLogs.filter((m) => m.konstruksi_id === p.id).length,
    }));
    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'ICRA_Konstruksi');
    writeFile(wb, `Rekap_ICRA_Konstruksi_RSUD_Al_Mulk.xlsx`);
    showToast('File Excel rekap ICRA Konstruksi berhasil diunduh!');
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filterStatus !== 'Semua' && p.status_proyek !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${p.nomor_izin} ${p.nama_proyek} ${p.lokasi_area} ${p.kontraktor_pelaksana}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [projects, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: projects.length,
      aktif: projects.filter((p) => p.status_proyek === 'Aktif Berjalan').length,
      selesai: projects.filter((p) => p.status_proyek === 'Selesai').length,
      highClass: projects.filter((p) => p.kelas_tindakan === 'III' || p.kelas_tindakan === 'IV').length,
    };
  }, [projects]);

  const currentProjectLogs = useMemo(() => {
    if (!monitoringProject) return [];
    return monitoringLogs
      .filter((m) => m.konstruksi_id === monitoringProject.id)
      .sort((a, b) =>
        `${b.tanggal_monitoring} ${b.jam_monitoring}`.localeCompare(`${a.tanggal_monitoring} ${a.jam_monitoring}`)
      );
  }, [monitoringLogs, monitoringProject]);

  const permitProjectLogs = useMemo(() => {
    if (!permitProject) return [];
    return monitoringLogs.filter((m) => m.konstruksi_id === permitProject.id);
  }, [monitoringLogs, permitProject]);

  const calcResult = getConstructionClass(projForm.kelompok_risiko, projForm.tipe_konstruksi);

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

      {/* Ringkasan Statistik Proyek */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-[#141634] border border-indigo-900/40 p-4 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Proyek</span>
          <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
          <span className="text-[11px] text-indigo-300/80">Terdaftar</span>
        </div>
        <div className="rounded-2xl bg-[#131e3c] border border-cyan-500/35 p-4 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Aktif Berjalan</span>
          <div className="text-2xl font-black text-cyan-400 mt-1">{stats.aktif}</div>
          <span className="text-[11px] text-cyan-300/80">Dalam Pengawasan</span>
        </div>
        <div className="rounded-2xl bg-[#1f1325] border border-rose-500/35 p-4 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">Kelas III & IV</span>
          <div className="text-2xl font-black text-rose-400 mt-1">{stats.highClass}</div>
          <span className="text-[11px] text-rose-300/80">Wajib Barier & HEPA</span>
        </div>
        <div className="rounded-2xl bg-[#10242c] border border-emerald-500/35 p-4 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Proyek Selesai</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{stats.selesai}</div>
          <span className="text-[11px] text-emerald-300/80">Lulus Inspeksi PPI</span>
        </div>
      </div>

      {/* Toolbar Filter & Aksi */}
      <div className="rounded-2xl bg-[#141634]/90 border border-indigo-900/40 p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-[#0e1028] border border-indigo-800/60 text-white text-xs sm:text-sm font-bold rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
          >
            <option value="Semua">Semua Status Proyek</option>
            <option value="Aktif Berjalan">Aktif Berjalan</option>
            <option value="Menunggu Izin">Menunggu Izin</option>
            <option value="Selesai">Selesai</option>
          </select>

          <div className="relative flex-1 min-w-[210px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama proyek, nomor izin, lokasi..."
              className="w-full bg-[#0e1028] border border-indigo-800/60 text-white text-xs sm:text-sm rounded-xl pl-9 pr-3 py-2 outline-none focus:border-cyan-400 placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Rekap Excel</span>
          </button>

          <button
            type="button"
            onClick={openAddProject}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajukan ICRA Konstruksi Baru</span>
          </button>
        </div>
      </div>

      {/* Daftar Proyek Renovasi */}
      {loading ? (
        <div className="rounded-2xl bg-[#141634] border border-indigo-900/40 p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm font-semibold">Memuat proyek ICRA Konstruksi...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-3xl bg-[#141634]/80 border border-indigo-900/40 p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400">
            <HardHat className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              Belum Ada Proyek Renovasi / Konstruksi Tercatat
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mt-1">
              Setiap pekerjaan renovasi, perbaikan plafon, pengecatan, atau pembongkaran bangunan di RSUD Al-Mulk wajib melalui kajian ICRA Konstruksi dan diterbitkan Surat Izin Kerja PPI (Kelas I–IV).
            </p>
          </div>
          <button
            type="button"
            onClick={openAddProject}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs sm:text-sm font-black uppercase tracking-wider inline-flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Pengajuan ICRA Konstruksi Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredProjects.map((proj) => {
            const projLogs = monitoringLogs.filter((m) => m.konstruksi_id === proj.id);
            const classBadge =
              proj.kelas_tindakan === 'IV'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : proj.kelas_tindakan === 'III'
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                : proj.kelas_tindakan === 'II'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';

            const statusBadge =
              proj.status_proyek === 'Selesai'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : proj.status_proyek === 'Aktif Berjalan'
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-700/50 text-slate-300 border-slate-600';

            return (
              <div
                key={proj.id}
                className="rounded-3xl bg-[#141634] border border-indigo-900/50 p-5 shadow-xl flex flex-col justify-between gap-4 hover:border-indigo-500/50 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#0c0e22] text-indigo-300 border border-indigo-800/50">
                      {proj.nomor_izin || 'NO-IZIN'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full border ${classBadge}`}>
                        Kelas {proj.kelas_tindakan}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusBadge}`}>
                        {proj.status_proyek}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-white leading-snug">{proj.nama_proyek}</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1.5">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                        {proj.lokasi_area}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        {safeFormatDate(proj.tgl_mulai)} – {safeFormatDate(proj.tgl_selesai_estimasi)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] bg-[#0e1026] p-3 rounded-2xl border border-indigo-900/40">
                    <div>
                      <span className="text-slate-400 block">Tipe Aktivitas</span>
                      <span className="font-bold text-white">Tipe {proj.tipe_konstruksi}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Risiko Pasien</span>
                      <span className="font-bold text-white">Kelompok {proj.kelompok_risiko}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Pelaksana / PJ</span>
                      <span className="font-bold text-white truncate block">{proj.kontraktor_pelaksana}</span>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-indigo-950">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPermitProject(proj)}
                      className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FileCheck2 className="w-4 h-4 text-rose-400" />
                      <span>Surat Izin (F4)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openMonitoringModal(proj)}
                      className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/35 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4 text-cyan-400" />
                      <span>Monitoring ({projLogs.length})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditProject(proj)}
                      className="p-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 transition-colors cursor-pointer"
                      title="Edit Proyek & Checklist"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(proj.id)}
                      className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 transition-colors cursor-pointer"
                      title="Hapus Proyek"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: FORM PENGKAJIAN ICRA KONSTRUKSI & PENERBITAN IZIN KERJA     */}
      {/* =================================================================== */}
      <AnimatePresence>
        {isProjectModalOpen && (
          <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="w-full max-w-5xl max-h-[94vh] bg-[#121432] border border-indigo-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-[#171a42] border-b border-indigo-900/50 shrink-0">
                <div className="flex items-center gap-2.5">
                  <HardHat className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wide text-white">
                    {editingProject ? 'Edit Pengkajian ICRA Konstruksi' : 'Pengkajian Baru ICRA Konstruksi & Izin Kerja PPI'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProject} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {/* Bagian 1: Identitas Proyek */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-cyan-400 border-b border-indigo-900/50 pb-1.5">
                    1. Identitas Proyek Renovasi / Konstruksi
                  </h4>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">
                      Nama Proyek / Uraian Pekerjaan *
                    </label>
                    <input
                      type="text"
                      required
                      value={projForm.nama_proyek}
                      onChange={(e) => setProjForm((p) => ({ ...p, nama_proyek: e.target.value }))}
                      placeholder="Contoh: Pembongkaran & Penggantian Plafon Ruang Ranap Usman"
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Lokasi / Unit Kerja</label>
                      <select
                        value={projForm.lokasi_area}
                        onChange={(e) => setProjForm((p) => ({ ...p, lokasi_area: e.target.value }))}
                        className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
                      >
                        {ICRA_UNITS_LIST.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">
                        Area Terdampak Sekitar (Atas / Bawah / Samping)
                      </label>
                      <input
                        type="text"
                        value={projForm.area_terdampak}
                        onChange={(e) => setProjForm((p) => ({ ...p, area_terdampak: e.target.value }))}
                        placeholder="Contoh: Koridor Ranap, Ruang Tindakan, dan Nurse Station"
                        className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Pelaksana / Kontraktor</label>
                      <input
                        type="text"
                        value={projForm.kontraktor_pelaksana}
                        onChange={(e) => setProjForm((p) => ({ ...p, kontraktor_pelaksana: e.target.value }))}
                        className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Penanggung Jawab Proyek</label>
                      <input
                        type="text"
                        value={projForm.pj_proyek}
                        onChange={(e) => setProjForm((p) => ({ ...p, pj_proyek: e.target.value }))}
                        placeholder="Nama pengawas / teknisi"
                        className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Tanggal Mulai</label>
                      <input
                        type="date"
                        value={projForm.tgl_mulai}
                        onChange={(e) => setProjForm((p) => ({ ...p, tgl_mulai: e.target.value }))}
                        className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Estimasi Selesai</label>
                      <input
                        type="date"
                        value={projForm.tgl_selesai_estimasi}
                        onChange={(e) => setProjForm((p) => ({ ...p, tgl_selesai_estimasi: e.target.value }))}
                        className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 2: Penentuan Matriks Otomatis Tipe A-D & Kelompok Risiko 1-4 */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 border-b border-indigo-900/50 pb-1.5">
                    2. Matriks Penilaian Risiko (Standar PMK 27 Tahun 2017)
                  </h4>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Pilihan Tipe Konstruksi */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold uppercase text-slate-300">
                        Langkah A: Pilih Tipe Aktivitas Konstruksi
                      </label>
                      {CONSTRUCTION_TYPES.map((t) => {
                        const selected = projForm.tipe_konstruksi === t.code;
                        return (
                          <button
                            key={t.code}
                            type="button"
                            onClick={() => handleMatrixChange(projForm.kelompok_risiko, t.code)}
                            className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                              selected
                                ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg'
                                : 'bg-[#0c0e24] border-indigo-900/40 text-slate-300 hover:border-indigo-600/60'
                            }`}
                          >
                            <div className="font-black text-xs text-amber-300">{t.title}</div>
                            <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">{t.examples}</div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Pilihan Kelompok Risiko Pasien */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold uppercase text-slate-300">
                        Langkah B: Pilih Kelompok Risiko Pasien di Area Terdampak
                      </label>
                      {PATIENT_RISK_GROUPS.map((r) => {
                        const selected = projForm.kelompok_risiko === r.code;
                        return (
                          <button
                            key={r.code}
                            type="button"
                            onClick={() => handleMatrixChange(r.code, projForm.tipe_konstruksi)}
                            className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                              selected
                                ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-lg'
                                : 'bg-[#0c0e24] border-indigo-900/40 text-slate-300 hover:border-indigo-600/60'
                            }`}
                          >
                            <div className="font-black text-xs text-cyan-300">{r.title}</div>
                            <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">{r.areas}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Matriks Visual & Penetapan Kelas */}
                  <div className="rounded-2xl bg-[#0b0d21] border border-indigo-800/50 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase text-slate-400">
                          Hasil Kombinasi Matriks (Tipe {projForm.tipe_konstruksi} × Kelompok {projForm.kelompok_risiko})
                        </span>
                        <div className="text-lg font-black text-white mt-0.5">
                          Penetapan Izin Kerja: <span className="text-amber-400">KELAS {projForm.kelas_tindakan}</span>
                          {calcResult.isAmbiguousIIIorIV && (
                            <span className="ml-2 text-[11px] font-semibold text-cyan-300">
                              (Matriks III/IV: IPCN dapat memilih Kelas III atau IV)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 mr-1">Sesuaikan Kelas:</span>
                        {(['I', 'II', 'III', 'IV'] as ConstructionClass[]).map((cls) => (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => handleOverrideClass(cls)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                              projForm.kelas_tindakan === cls
                                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
                                : 'bg-[#141738] text-slate-300 border-indigo-800 hover:text-white'
                            }`}
                          >
                            {cls}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mini Tabel Matriks Interaktif */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-center border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#141738] text-indigo-300 font-bold">
                            <th className="border border-indigo-900/60 p-1.5 text-left">Kelompok Risiko</th>
                            <th className="border border-indigo-900/60 p-1.5">Tipe A</th>
                            <th className="border border-indigo-900/60 p-1.5">Tipe B</th>
                            <th className="border border-indigo-900/60 p-1.5">Tipe C</th>
                            <th className="border border-indigo-900/60 p-1.5">Tipe D</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(['1', '2', '3', '4'] as PatientRiskGroup[]).map((rg) => (
                            <tr key={rg}>
                              <td className="border border-indigo-900/60 p-1.5 text-left font-bold text-slate-200">
                                Kelompok {rg}
                              </td>
                              {(['A', 'B', 'C', 'D'] as ConstructionType[]).map((tp) => {
                                const cell = CONSTRUCTION_MATRIX[rg][tp];
                                const active =
                                  projForm.kelompok_risiko === rg && projForm.tipe_konstruksi === tp;
                                return (
                                  <td
                                    key={tp}
                                    onClick={() => handleMatrixChange(rg, tp)}
                                    className={`border border-indigo-900/60 p-1.5 cursor-pointer transition-all ${
                                      active
                                        ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-white'
                                        : 'text-slate-300 hover:bg-indigo-900/40'
                                    }`}
                                  >
                                    {cell.isAmbiguousIIIorIV ? 'III / IV' : cell.classLevel}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Bagian 3: Checklist Pengendalian Infeksi */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 border-b border-indigo-900/50 pb-1.5">
                    3. Persyaratan Wajib Pengendalian Infeksi ({CONSTRUCTION_CLASS_CONTROLS[projForm.kelas_tindakan].title})
                  </h4>
                  <div className="space-y-2">
                    {projForm.checklist_pengendalian.map((chk, idx) => (
                      <label
                        key={chk.id}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#0d0f26] border border-indigo-900/40 hover:border-indigo-600/50 cursor-pointer text-xs text-slate-200"
                      >
                        <input
                          type="checkbox"
                          checked={chk.checked}
                          onChange={(e) => {
                            const updated = [...projForm.checklist_pengendalian];
                            updated[idx] = { ...updated[idx], checked: e.target.checked };
                            setProjForm((p) => ({ ...p, checklist_pengendalian: updated }));
                          }}
                          className="mt-0.5 w-4 h-4 accent-emerald-500 shrink-0"
                        />
                        <span className="leading-relaxed">{chk.label}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">
                      Instruksi Khusus / Catatan Tambahan IPCN
                    </label>
                    <textarea
                      rows={2}
                      value={projForm.persyaratan_khusus}
                      onChange={(e) => setProjForm((p) => ({ ...p, persyaratan_khusus: e.target.value }))}
                      placeholder="Contoh: Pekerjaan pengeboran hanya diperbolehkan pukul 14.00 - 17.00 WIB..."
                      className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Bagian 4: Status, Dokumentasi Foto & TTD Digital */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-300 border-b border-indigo-900/50 pb-1.5">
                    4. Status Proyek, Dokumentasi Kondisi & Pengesahan
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Status Proyek</label>
                      <select
                        value={projForm.status_proyek}
                        onChange={(e) => setProjForm((p) => ({ ...p, status_proyek: e.target.value as any }))}
                        className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2 outline-none"
                      >
                        <option value="Menunggu Izin">Menunggu Izin</option>
                        <option value="Aktif Berjalan">Aktif Berjalan</option>
                        <option value="Selesai">Selesai (Lulus Inspeksi)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Nama IPCN</label>
                      <input
                        type="text"
                        value={projForm.nama_ipcn}
                        onChange={(e) => setProjForm((p) => ({ ...p, nama_ipcn: e.target.value }))}
                        className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1">Mengetahui Tim K3RS</label>
                      <input
                        type="text"
                        value={projForm.nama_k3rs}
                        onChange={(e) => setProjForm((p) => ({ ...p, nama_k3rs: e.target.value }))}
                        className="w-full bg-[#0d0f26] border border-indigo-800/60 text-white text-sm rounded-xl px-3 py-2 outline-none"
                      />
                    </div>
                  </div>

                  {/* Foto Sebelum & Sesudah */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-[#0d0f26] border border-indigo-900/40 p-4">
                      <span className="text-[11px] font-black uppercase text-amber-300 block mb-2">
                        Foto Sebelum Pekerjaan / Kondisi Awal
                      </span>
                      <DocumentationUploader images={fotoSebelum} setImages={setFotoSebelum} />
                    </div>
                    <div className="rounded-2xl bg-[#0d0f26] border border-indigo-900/40 p-4">
                      <span className="text-[11px] font-black uppercase text-emerald-300 block mb-2">
                        Foto Sesudah Selesai / Terminal Cleaning
                      </span>
                      <DocumentationUploader images={fotoSesudah} setImages={setFotoSesudah} />
                    </div>
                  </div>

                  {/* Tanda Tangan Digital */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-[#0d0f26] border border-indigo-900/40 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase text-slate-300">TTD Pelaksana / IPSRS (Opsional)</span>
                        <button
                          type="button"
                          onClick={() => {
                            sigPelaksanaRef.current?.clear();
                            setExistingTtdPelaksana(null);
                          }}
                          className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Eraser className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                      <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden h-28 flex items-center justify-center relative">
                        <SignatureCanvas
                          ref={sigPelaksanaRef}
                          penColor="#38bdf8"
                          canvasProps={{ className: 'sigCanvas w-full h-full cursor-crosshair touch-none' }}
                        />
                        {existingTtdPelaksana && (
                          <span className="absolute bottom-1 right-2 text-[10px] text-emerald-400 pointer-events-none">
                            TTD tersimpan (gores ulang untuk ganti)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#0d0f26] border border-indigo-900/40 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase text-slate-300">TTD IPCN / Tim PPI (Opsional)</span>
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
                      <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden h-28 flex items-center justify-center relative">
                        <SignatureCanvas
                          ref={sigIpcnRef}
                          penColor="#38bdf8"
                          canvasProps={{ className: 'sigCanvas w-full h-full cursor-crosshair touch-none' }}
                        />
                        {existingTtdIpcn && (
                          <span className="absolute bottom-1 right-2 text-[10px] text-emerald-400 pointer-events-none">
                            TTD tersimpan (gores ulang untuk ganti)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-indigo-900/50">
                  <button
                    type="button"
                    onClick={() => setIsProjectModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{editingProject ? 'Simpan Perubahan Proyek' : 'Simpan & Terbitkan Izin PPI'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* MODAL 2: MONITORING HARIAN PROYEK KONSTRUKSI OLEH IPCN               */}
      {/* =================================================================== */}
      <AnimatePresence>
        {monitoringProject && (
          <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="w-full max-w-4xl max-h-[92vh] bg-[#121432] border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-[#171a42] border-b border-indigo-900/50 shrink-0">
                <div className="flex items-center gap-2.5">
                  <ClipboardList className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-sm sm:text-base font-black uppercase tracking-wide text-white">
                      Monitoring Harian Proyek Konstruksi
                    </h3>
                    <p className="text-xs text-cyan-300 truncate max-w-md">{monitoringProject.nama_proyek}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMonitoringProject(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {/* Form Input Monitoring Baru */}
                <form
                  onSubmit={handleSaveMonitoring}
                  className="rounded-2xl bg-[#0c0e24] border border-cyan-500/30 p-4 space-y-4"
                >
                  <h4 className="text-xs font-black uppercase tracking-wider text-cyan-300">
                    + Catat Hasil Inspeksi Harian Baru
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Tanggal</label>
                      <input
                        type="date"
                        value={monForm.tanggal_monitoring}
                        onChange={(e) => setMonForm((m) => ({ ...m, tanggal_monitoring: e.target.value }))}
                        className="w-full bg-[#141738] border border-indigo-800 text-white text-xs rounded-xl px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Jam</label>
                      <input
                        type="time"
                        value={monForm.jam_monitoring}
                        onChange={(e) => setMonForm((m) => ({ ...m, jam_monitoring: e.target.value }))}
                        className="w-full bg-[#141738] border border-indigo-800 text-white text-xs rounded-xl px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Tekanan Negatif / HEPA</label>
                      <select
                        value={monForm.tekanan_negatif_hepa}
                        onChange={(e) => setMonForm((m) => ({ ...m, tekanan_negatif_hepa: e.target.value as any }))}
                        className="w-full bg-[#141738] border border-indigo-800 text-white text-xs rounded-xl px-3 py-2"
                      >
                        <option value="Ya">Ya (Berfungsi)</option>
                        <option value="Tidak">Tidak Berfungsi</option>
                        <option value="N/A">N/A (Tidak Wajib)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Status Kepatuhan</label>
                      <select
                        value={monForm.status_kepatuhan}
                        onChange={(e) => setMonForm((m) => ({ ...m, status_kepatuhan: e.target.value as any }))}
                        className="w-full bg-[#141738] border border-indigo-800 text-white text-xs rounded-xl px-3 py-2"
                      >
                        <option value="Sesuai Standar">Sesuai Standar</option>
                        <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                        <option value="Stop Pekerjaan">Stop Pekerjaan Sementara</option>
                      </select>
                    </div>
                  </div>

                  {/* Checklist Cepat 5 Poin */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    {[
                      { key: 'barier_tertutup', label: 'Barier debu tertutup rapat & utuh' },
                      { key: 'keset_basah_pintu', label: 'Keset basah / sticky mat tersedia' },
                      { key: 'area_sekitar_bersih', label: 'Koridor sekitar bebas debu/puing' },
                      { key: 'jalur_limbah_tertutup', label: 'Limbah diangkut wadah tertutup' },
                      { key: 'apd_pekerja', label: 'Pekerja menggunakan APD sesuai' },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-[#141738] border border-indigo-900/50 text-slate-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean((monForm as any)[item.key])}
                          onChange={(e) =>
                            setMonForm((m) => ({ ...m, [item.key]: e.target.checked }))
                          }
                          className="w-4 h-4 accent-cyan-400"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <textarea
                      rows={2}
                      value={monForm.temuan_lapangan}
                      onChange={(e) => setMonForm((m) => ({ ...m, temuan_lapangan: e.target.value }))}
                      placeholder="Temuan lapangan (jika ada celah debu, APD kurang, dll)..."
                      className="w-full bg-[#141738] border border-indigo-800 text-white text-xs rounded-xl p-2.5"
                    />
                    <textarea
                      rows={2}
                      value={monForm.tindakan_koreksi}
                      onChange={(e) => setMonForm((m) => ({ ...m, tindakan_koreksi: e.target.value }))}
                      placeholder="Tindakan koreksi langsung / instruksi ke pekerja..."
                      className="w-full bg-[#141738] border border-indigo-800 text-white text-xs rounded-xl p-2.5"
                    />
                  </div>

                  <div className="bg-[#141738] rounded-xl p-3 border border-indigo-900/40">
                    <DocumentationUploader images={monPhotos} setImages={setMonPhotos} />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Simpan Log Monitoring</span>
                    </button>
                  </div>
                </form>

                {/* Riwayat Monitoring Proyek Ini */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300">
                    Riwayat Monitoring ({currentProjectLogs.length} Catatan)
                  </h4>
                  {currentProjectLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center bg-[#0c0e24] rounded-2xl border border-indigo-900/40">
                      Belum ada log inspeksi harian untuk proyek ini.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {currentProjectLogs.map((log) => (
                        <div
                          key={log.id}
                          className="rounded-2xl bg-[#0e1028] border border-indigo-900/50 p-3.5 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-white">
                                {safeFormatDate(log.tanggal_monitoring)} • {log.jam_monitoring}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  log.status_kepatuhan === 'Sesuai Standar'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : log.status_kepatuhan === 'Perlu Perbaikan'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                }`}
                              >
                                {log.status_kepatuhan}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteMonitoring(log.id)}
                              className="p-1.5 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/30 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                            <span>Barier: <strong>{log.barier_tertutup ? 'Ya' : 'Tidak'}</strong></span>
                            <span>• HEPA/Negatif: <strong>{log.tekanan_negatif_hepa}</strong></span>
                            <span>• Keset: <strong>{log.keset_basah_pintu ? 'Ya' : 'Tidak'}</strong></span>
                            <span>• Sekitar Bersih: <strong>{log.area_sekitar_bersih ? 'Ya' : 'Tidak'}</strong></span>
                            <span>• APD: <strong>{log.apd_pekerja ? 'Ya' : 'Tidak'}</strong></span>
                          </div>

                          {(log.temuan_lapangan || log.tindakan_koreksi) && (
                            <div className="text-slate-300 bg-[#141738] p-2.5 rounded-xl border border-indigo-900/40 space-y-1">
                              {log.temuan_lapangan && <div><strong className="text-amber-300">Temuan:</strong> {log.temuan_lapangan}</div>}
                              {log.tindakan_koreksi && <div><strong className="text-cyan-300">Koreksi:</strong> {log.tindakan_koreksi}</div>}
                            </div>
                          )}

                          {log.foto_monitoring.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {log.foto_monitoring.map((u, idx) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  key={idx}
                                  src={normalizeImageUrl(u)}
                                  alt={`Monitoring ${idx + 1}`}
                                  className="w-16 h-16 object-cover rounded-lg border border-indigo-500/40"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* MODAL 3: SURAT IZIN KERJA PPI RESMI (F4 PORTRAIT MARGIN 2,5 CM)      */}
      {/* =================================================================== */}
      <IcraConstructionPermitModal
        isOpen={Boolean(permitProject)}
        onClose={() => setPermitProject(null)}
        project={permitProject}
        monitoringLogs={permitProjectLogs}
      />
    </div>
  );
}

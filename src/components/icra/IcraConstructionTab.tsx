import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
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
  Info,
  BookOpen,
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
  PATIENT_RISK_NOTE,
  ICRA_CONSTRUCTION_GUIDELINE,
  CONSTRUCTION_MATRIX,
  CONSTRUCTION_CLASS_CONTROLS,
  getConstructionClass,
  normalizeStringArray,
  normalizeChecklist,
  normalizePreChecklist,
  normalizePostChecklist,
  normalizeIntraItems,
  toBool,
} from '@/utils/icraData';
import IcraConstructionPermitModal from './IcraConstructionPermitModal';
import IcraMonitoringModal from './IcraMonitoringModal';

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function normalizeKonstruksiRow(raw: any): IcraKonstruksiItem {
  const tipe = (raw.tipe_konstruksi || 'A') as ConstructionType;
  const risk = (String(raw.kelompok_risiko || '1')) as PatientRiskGroup;
  const kelas = (raw.kelas_tindakan || getConstructionClass(risk, tipe).classLevel) as ConstructionClass;
  const baseProj: Partial<IcraKonstruksiItem> = {
    nama_proyek: raw.nama_proyek || '',
    lokasi_area: raw.lokasi_area || '',
    tgl_mulai: raw.tgl_mulai || format(new Date(), 'yyyy-MM-dd'),
    tgl_selesai_estimasi: raw.tgl_selesai_estimasi || format(new Date(), 'yyyy-MM-dd'),
    kelas_tindakan: kelas,
    nama_ipcn: raw.nama_ipcn || 'Adi Tresa Purnama, A.M.Kep',
    nama_k3rs: raw.nama_k3rs || 'Tim K3RS RSUD Al-Mulk',
    pj_proyek: raw.pj_proyek || '',
    kontraktor_pelaksana: raw.kontraktor_pelaksana || '',
  };
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
    pre_checklist: raw.pre_checklist ? normalizePreChecklist(raw.pre_checklist, baseProj) : null,
    post_checklist: raw.post_checklist ? normalizePostChecklist(raw.post_checklist, baseProj) : null,
  };
}

function normalizeMonitoringRow(raw: any): IcraMonitoringItem {
  let parsedIntra: any = null;
  if (Array.isArray(raw.intra_items) && raw.intra_items.length > 0) {
    parsedIntra = raw.intra_items;
  } else if (typeof raw.intra_items === 'string' && raw.intra_items.trim().startsWith('[')) {
    try {
      parsedIntra = JSON.parse(raw.intra_items);
    } catch {
      parsedIntra = null;
    }
  }
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
    area_renovasi: raw.area_renovasi || '',
    intra_items: parsedIntra ? normalizeIntraItems(parsedIntra, 'III') : null,
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
  const [showGuideline, setShowGuideline] = useState(false);

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
      const uploadedSesudah = editingProject?.foto_sesudah || [];

      let ttdIpcn = existingTtdIpcn || editingProject?.ttd_ipcn || null;
      let ttdPelaksana = existingTtdPelaksana || editingProject?.ttd_pelaksana || null;

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
        status_proyek: projForm.status_proyek || 'Aktif Berjalan',
        nama_ipcn: projForm.nama_ipcn?.trim() || 'Adi Tresa Purnama, A.M.Kep',
        nama_k3rs: projForm.nama_k3rs?.trim() || 'Tim K3RS RSUD Al-Mulk',
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
  };

  const activeMonitoringProject = useMemo(() => {
    if (!monitoringProject) return null;
    return projects.find((p) => p.id === monitoringProject.id) || monitoringProject;
  }, [projects, monitoringProject]);

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

      {/* Ringkasan Statistik Proyek - 3D Neumorphic Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        <div className="relative rounded-[26px] bg-gradient-to-b from-[#181a3d] via-[#141634] to-[#101128] border border-[#2c3060]/70 p-4 sm:p-5 shadow-[-6px_-6px_20px_rgba(140,165,255,0.05),12px_16px_34px_rgba(0,0,0,0.75),inset_1px_1.5px_2px_rgba(255,255,255,0.15),inset_-1px_-1px_2px_rgba(0,0,0,0.4)] overflow-hidden group hover:-translate-y-1 transition-all duration-200">
          <div className="absolute top-0 inset-x-6 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none rounded-t-full" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Proyek</span>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">{stats.total}</div>
          <span className="text-[11px] font-semibold text-indigo-300/80">Terdaftar</span>
        </div>
        <div className="relative rounded-[26px] bg-gradient-to-b from-[#142345] via-[#101b38] to-[#0c152c] border border-cyan-500/40 p-4 sm:p-5 shadow-[-6px_-6px_20px_rgba(6,182,212,0.06),12px_16px_34px_rgba(0,0,0,0.75),inset_1px_1.5px_2px_rgba(255,255,255,0.18),inset_-1px_-1px_2px_rgba(0,0,0,0.4)] overflow-hidden group hover:-translate-y-1 transition-all duration-200">
          <div className="absolute top-0 inset-x-6 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none rounded-t-full" />
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Aktif Berjalan</span>
          <div className="text-2xl sm:text-3xl font-black text-cyan-400 mt-1.5 drop-shadow-[0_2px_6px_rgba(6,182,212,0.4)]">{stats.aktif}</div>
          <span className="text-[11px] font-semibold text-cyan-300/80">Dalam Pengawasan</span>
        </div>
        <div className="relative rounded-[26px] bg-gradient-to-b from-[#261528] via-[#1e1121] to-[#150c18] border border-rose-500/40 p-4 sm:p-5 shadow-[-6px_-6px_20px_rgba(244,63,94,0.06),12px_16px_34px_rgba(0,0,0,0.75),inset_1px_1.5px_2px_rgba(255,255,255,0.18),inset_-1px_-1px_2px_rgba(0,0,0,0.4)] overflow-hidden group hover:-translate-y-1 transition-all duration-200">
          <div className="absolute top-0 inset-x-6 h-[1px] bg-gradient-to-r from-transparent via-rose-400/30 to-transparent pointer-events-none rounded-t-full" />
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">Kelas III & IV</span>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-1.5 drop-shadow-[0_2px_6px_rgba(244,63,94,0.4)]">{stats.highClass}</div>
          <span className="text-[11px] font-semibold text-rose-300/80">Wajib Barier & HEPA</span>
        </div>
        <div className="relative rounded-[26px] bg-gradient-to-b from-[#122830] via-[#0f2027] to-[#0b171c] border border-emerald-500/40 p-4 sm:p-5 shadow-[-6px_-6px_20px_rgba(16,185,129,0.06),12px_16px_34px_rgba(0,0,0,0.75),inset_1px_1.5px_2px_rgba(255,255,255,0.18),inset_-1px_-1px_2px_rgba(0,0,0,0.4)] overflow-hidden group hover:-translate-y-1 transition-all duration-200">
          <div className="absolute top-0 inset-x-6 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent pointer-events-none rounded-t-full" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Proyek Selesai</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1.5 drop-shadow-[0_2px_6px_rgba(16,185,129,0.4)]">{stats.selesai}</div>
          <span className="text-[11px] font-semibold text-emerald-300/80">Lulus Inspeksi PPI</span>
        </div>
      </div>

      {/* Toolbar Filter & Aksi - 3D Neumorphic Box */}
      <div className="relative rounded-[28px] bg-gradient-to-b from-[#181a3d] via-[#141532] to-[#101127] border border-[#2b2d56] p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 shadow-[-6px_-6px_20px_rgba(140,165,255,0.04),12px_16px_36px_rgba(0,0,0,0.75),inset_1px_1px_1.5px_rgba(255,255,255,0.12),inset_-1px_-1px_2px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="absolute top-0 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none rounded-t-full" />
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-[#0e1028] border border-black/40 text-white text-xs sm:text-sm font-bold rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-cyan-500/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.85),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] cursor-pointer"
          >
            <option value="Semua" className="bg-[#18193b] text-white">Semua Status Proyek</option>
            <option value="Aktif Berjalan" className="bg-[#18193b] text-white">Aktif Berjalan</option>
            <option value="Menunggu Izin" className="bg-[#18193b] text-white">Menunggu Izin</option>
            <option value="Selesai" className="bg-[#18193b] text-white">Selesai</option>
          </select>

          <div className="relative flex-1 min-w-[210px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama proyek, nomor izin, lokasi..."
              className="w-full bg-[#0e1028] border border-black/40 text-white text-xs sm:text-sm rounded-2xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-cyan-500/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.85),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] placeholder:text-slate-500 font-medium"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-b from-[#162e2c] to-[#0e2020] border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[-2px_-2px_6px_rgba(140,255,200,0.08),3px_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Rekap Excel</span>
          </button>

          <button
            type="button"
            onClick={openAddProject}
            className="relative overflow-hidden group px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[-3px_-3px_10px_rgba(255,255,255,0.2),6px_8px_20px_rgba(0,0,0,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.5),inset_0_-2px_3px_rgba(0,0,0,0.35)] active:scale-95 transition-all cursor-pointer"
          >
            <div className="absolute top-0 inset-x-4 h-[1px] bg-white/40 pointer-events-none rounded-t-full" />
            <Plus className="w-4 h-4 text-slate-950" strokeWidth={2.5} />
            <span className="text-slate-950 font-black">Ajukan ICRA Konstruksi Baru</span>
          </button>
        </div>
      </div>

      {/* Daftar Proyek Renovasi */}
      {loading ? (
        <div className="rounded-[28px] bg-[#141634] border border-indigo-900/40 p-12 flex flex-col items-center justify-center text-slate-400 gap-3 shadow-xl">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm font-semibold">Memuat proyek ICRA Konstruksi...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-[32px] bg-gradient-to-b from-[#181a3d] to-[#111228] border border-[#2b2d56] p-8 sm:p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400 shadow-md">
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
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs sm:text-sm font-black uppercase tracking-wider inline-flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Buat Pengajuan ICRA Konstruksi Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredProjects.map((proj) => {
            const projLogs = monitoringLogs.filter((m) => m.konstruksi_id === proj.id);
            const riskLabel =
              PATIENT_RISK_GROUPS.find((g) => g.code === proj.kelompok_risiko)?.riskLabel ||
              `Kelompok ${proj.kelompok_risiko}`;

            const statusBadge =
              proj.status_proyek === 'Selesai'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                : proj.status_proyek === 'Aktif Berjalan'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                : 'bg-slate-700/50 text-slate-300 border-slate-600';

            return (
              <div
                key={proj.id}
                className="relative group rounded-[32px] bg-gradient-to-b from-[#1c1e42] via-[#161836] to-[#11122a] border border-[#2c3060]/80 p-5 sm:p-6 shadow-[-8px_-8px_24px_rgba(140,165,255,0.05),14px_18px_40px_rgba(0,0,0,0.8),inset_1px_1.5px_2px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.4)] flex flex-col justify-between gap-5 hover:-translate-y-1.5 hover:border-[#3d4482] transition-all duration-300 overflow-hidden"
              >
                {/* Top Specular Highlight Line */}
                <div className="absolute top-0 inset-x-10 h-[1.5px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none rounded-t-full" />

                <div className="space-y-3.5 relative z-10">
                  <div className="flex items-center justify-end gap-2">
                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${statusBadge}`}>
                      {proj.status_proyek}
                    </span>
                  </div>

                  <div className="text-center">
                    <h4 className="text-base sm:text-lg font-black text-white leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:text-amber-200 transition-colors">
                      {proj.nama_proyek}
                    </h4>
                    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-slate-300 mt-2 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-cyan-400" />
                        <span className="font-semibold text-slate-200">{proj.lokasi_area}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-amber-400" />
                        <span>{safeFormatDate(proj.tgl_mulai)} – {safeFormatDate(proj.tgl_selesai_estimasi)}</span>
                      </span>
                    </div>
                  </div>

                  {/* 3 Deep Sunken Sub-stats Wells */}
                  <div className="grid grid-cols-3 gap-2.5 text-[11px] bg-[#0c0e22] p-3.5 rounded-[22px] border border-black/50 shadow-[inset_2px_2.5px_6px_rgba(0,0,0,0.85),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
                    <div className="flex flex-col items-center text-center">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Tipe Aktivitas</span>
                      <span className="font-black text-white text-xs">Tipe {proj.tipe_konstruksi}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Risiko Pasien</span>
                      <span className="font-black text-white text-xs">{riskLabel}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Kelas Kewaspadaan</span>
                      <span className="font-black text-white text-xs truncate block max-w-full">Kelas {proj.kelas_tindakan}</span>
                    </div>
                  </div>
                </div>

                {/* Action Footer - All buttons aligned neatly in 1 row */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 sm:gap-2 pt-3.5 border-t border-indigo-950/70 relative z-10">
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => setPermitProject(proj)}
                      className="px-3 py-2 rounded-2xl bg-gradient-to-b from-[#2a1322] to-[#1c0d17] border border-rose-500/40 text-rose-300 text-[11px] font-black shadow-[-2px_-2px_6px_rgba(255,150,180,0.05),3px_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Surat Izin (F4)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openMonitoringModal(proj)}
                      className="px-3 py-2 rounded-2xl bg-gradient-to-b from-[#122238] to-[#0c1626] border border-cyan-500/40 text-cyan-300 text-[11px] font-black shadow-[-2px_-2px_6px_rgba(100,200,255,0.05),3px_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Monitoring ({projLogs.length})</span>
                    </button>

                    <Link
                      href={`/dashboard/reports/icra?projectId=${proj.id}`}
                      className="px-3 py-2 rounded-2xl bg-gradient-to-b from-[#1f1c45] to-[#131230] border border-indigo-400/45 text-indigo-200 text-[11px] font-black shadow-[-2px_-2px_6px_rgba(140,165,255,0.06),3px_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:brightness-115 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>Laporan ICRA</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditProject(proj)}
                      className="p-2 rounded-xl bg-[#141635] hover:bg-[#1a1c42] text-indigo-300 hover:text-white border border-[#2b2d56] shadow-[-2px_-2px_6px_rgba(140,165,255,0.03),3px_3px_8px_rgba(0,0,0,0.5),inset_1px_1px_1px_rgba(255,255,255,0.1)] transition-all cursor-pointer"
                      title="Edit Proyek & Checklist"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(proj.id)}
                      className="p-2 rounded-xl bg-[#26131c] hover:bg-[#321724] text-rose-400 hover:text-rose-300 border border-rose-500/30 shadow-[-2px_-2px_6px_rgba(255,100,120,0.03),3px_3px_8px_rgba(0,0,0,0.5),inset_1px_1px_1px_rgba(255,255,255,0.1)] transition-all cursor-pointer"
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
          <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 lg:p-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-[1540px] max-h-[95vh] bg-[#141638] border border-[#2d3164] rounded-[32px] shadow-[-10px_-10px_35px_rgba(140,165,255,0.05),15px_20px_50px_rgba(0,0,0,0.85),inset_1px_1px_2px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden"
            >
              {/* Top Bevel Highlight for Modal Dialog */}
              <div className="absolute top-0 inset-x-12 h-[2px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none z-20" />

              <div className="relative flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-[#181a44] via-[#1c1f4e] to-[#181a44] border-b border-[#2b2e5c] shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-[#12132e] border border-amber-500/30 text-amber-400 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.06)]">
                    <HardHat className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black uppercase tracking-wide text-white">
                      {editingProject ? 'Edit Pengkajian ICRA Konstruksi' : 'Pengkajian Baru ICRA Konstruksi & Izin Kerja PPI'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Formulir Pengkajian Risiko & Pengendalian Infeksi Konstruksi</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="p-2.5 text-slate-400 hover:text-white rounded-xl bg-[#12132e] border border-white/5 hover:border-white/20 shadow-[-2px_-2px_6px_rgba(140,165,255,0.05),3px_3px_8px_rgba(0,0,0,0.5)] cursor-pointer transition-all active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProject} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {/* Bagian 1: Identitas Proyek - Neumorphic Card */}
                <div className="relative bg-[#18193b] rounded-[28px] p-5 sm:p-6 border border-[#2b2d56] shadow-[-6px_-6px_20px_rgba(140,165,255,0.05),10px_12px_32px_rgba(0,0,0,0.65),inset_1px_1px_1.5px_rgba(255,255,255,0.15),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] overflow-hidden space-y-4">
                  {/* Top Bevel Highlight */}
                  <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                  <div className="flex items-center gap-2 border-b border-indigo-900/40 pb-2.5">
                    <span className="px-3 py-1 rounded-full bg-[#12132e] border border-cyan-500/30 text-[10px] font-black uppercase tracking-wider text-cyan-400 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6)]">
                      BAGIAN 1
                    </span>
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                      Identitas Proyek Renovasi / Konstruksi
                    </h4>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1.5">
                      Nama Proyek / Uraian Pekerjaan *
                    </label>
                    <input
                      type="text"
                      required
                      value={projForm.nama_proyek}
                      onChange={(e) => setProjForm((p) => ({ ...p, nama_proyek: e.target.value }))}
                      placeholder="Contoh: Pembongkaran & Penggantian Plafon Ruang Ranap Usman"
                      className="w-full bg-[#12132e] border border-black/40 text-white text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400/60 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] transition-all placeholder-slate-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1.5">Lokasi / Unit Kerja</label>
                      <select
                        value={projForm.lokasi_area}
                        onChange={(e) => setProjForm((p) => ({ ...p, lokasi_area: e.target.value }))}
                        className="w-full bg-[#12132e] border border-black/40 text-white text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400/60 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] transition-all cursor-pointer"
                      >
                        {ICRA_UNITS_LIST.map((u) => (
                          <option key={u} value={u} className="bg-[#18193b] text-white">{u}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1.5">
                        Area Terdampak Sekitar (Atas / Bawah / Samping)
                      </label>
                      <input
                        type="text"
                        value={projForm.area_terdampak}
                        onChange={(e) => setProjForm((p) => ({ ...p, area_terdampak: e.target.value }))}
                        placeholder="Contoh: Koridor Ranap, Ruang Tindakan, dan Nurse Station"
                        className="w-full bg-[#12132e] border border-black/40 text-white text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400/60 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] transition-all placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1.5">Pelaksana / Kontraktor</label>
                      <input
                        type="text"
                        value={projForm.kontraktor_pelaksana}
                        onChange={(e) => setProjForm((p) => ({ ...p, kontraktor_pelaksana: e.target.value }))}
                        className="w-full bg-[#12132e] border border-black/40 text-white text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400/60 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] transition-all placeholder-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1.5">Penanggung Jawab Proyek</label>
                      <input
                        type="text"
                        value={projForm.pj_proyek}
                        onChange={(e) => setProjForm((p) => ({ ...p, pj_proyek: e.target.value }))}
                        placeholder="Nama pengawas / teknisi"
                        className="w-full bg-[#12132e] border border-black/40 text-white text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400/60 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] transition-all placeholder-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1.5">Tanggal Mulai</label>
                      <input
                        type="date"
                        value={projForm.tgl_mulai}
                        onChange={(e) => setProjForm((p) => ({ ...p, tgl_mulai: e.target.value }))}
                        className="w-full bg-[#12132e] border border-black/40 text-white text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400/60 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1.5">Estimasi Selesai</label>
                      <input
                        type="date"
                        value={projForm.tgl_selesai_estimasi}
                        onChange={(e) => setProjForm((p) => ({ ...p, tgl_selesai_estimasi: e.target.value }))}
                        className="w-full bg-[#12132e] border border-black/40 text-white text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400/60 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 2: Penentuan Matriks Otomatis Tipe A-D & Kelompok Risiko 1-4 - Neumorphic Card */}
                <div className="relative bg-[#18193b] rounded-[28px] p-5 sm:p-6 border border-[#2b2d56] shadow-[-6px_-6px_20px_rgba(140,165,255,0.05),10px_12px_32px_rgba(0,0,0,0.65),inset_1px_1px_1.5px_rgba(255,255,255,0.15),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] overflow-hidden space-y-5">
                  {/* Top Bevel Highlight */}
                  <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-900/40 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-[#12132e] border border-amber-500/30 text-[10px] font-black uppercase tracking-wider text-amber-400 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6)]">
                        BAGIAN 2
                      </span>
                      <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                        2. Matriks Penilaian Risiko
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGuideline((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#141535] hover:bg-[#1a1b42] border border-[#2c2f5d] text-indigo-300 hover:text-white text-[11px] font-bold shadow-[-2px_-2px_6px_rgba(140,165,255,0.04),3px_4px_8px_rgba(0,0,0,0.5)] transition-all cursor-pointer active:scale-95"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{showGuideline ? 'Tutup Panduan PMK 27' : 'Pelajari Alur & Definisi ICRA (PMK 27/2017)'}</span>
                    </button>
                  </div>

                  {/* Panduan Alur ICRA 6 Langkah & Definisi Permenkes 27/2017 */}
                  <AnimatePresence>
                    {showGuideline && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-2xl bg-gradient-to-br from-indigo-950/80 via-[#0e1234] to-[#0c0e29] border border-cyan-500/30 p-4 space-y-4 text-xs shadow-xl overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-[#131742]/70 rounded-xl p-3 border border-indigo-800/40">
                            <div className="flex items-center gap-2 font-black text-cyan-300 text-xs uppercase mb-1">
                              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                              Pengertian ICRA Konstruksi
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed text-justify">
                              {ICRA_CONSTRUCTION_GUIDELINE.definition}
                            </p>
                          </div>

                          <div className="bg-[#131742]/70 rounded-xl p-3 border border-indigo-800/40">
                            <div className="font-black text-amber-300 text-xs uppercase mb-1.5">
                              Tujuan Utama Pengkajian ICRA:
                            </div>
                            <ul className="space-y-1 text-[11px] text-slate-300">
                              {ICRA_CONSTRUCTION_GUIDELINE.purposes.map((p, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Alur 6 Langkah */}
                        <div className="bg-[#131742]/60 rounded-xl p-3 border border-indigo-800/40">
                          <div className="font-black text-indigo-300 text-[11px] uppercase tracking-wider mb-2">
                            Alur 6 Langkah ICRA Berdasarkan Permenkes No. 27 Tahun 2017:
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                            {ICRA_CONSTRUCTION_GUIDELINE.workflowSteps.map((st) => (
                              <div
                                key={st.step}
                                className="bg-[#0b0d22] border border-indigo-700/40 rounded-xl p-2 flex flex-col items-center text-center justify-between"
                              >
                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-black text-xs flex items-center justify-center mb-1">
                                  {st.step}
                                </div>
                                <div className="text-[10.5px] font-medium text-slate-200 leading-snug">
                                  {st.label}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px]">
                          <Info className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>ICRA penting dilakukan sebelum proyek dimulai, terutama bila area pelayanan pasien tetap beroperasi.</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Pilihan Tipe Konstruksi */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-black uppercase tracking-wider text-amber-400">
                          Langkah A: Tipe Proyek Konstruksi
                        </label>
                      </div>

                      <div className="space-y-2.5">
                        {CONSTRUCTION_TYPES.map((t) => {
                          const selected = projForm.tipe_konstruksi === t.code;
                          return (
                            <button
                              key={t.code}
                              type="button"
                              onClick={() => handleMatrixChange(projForm.kelompok_risiko, t.code)}
                              className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                                selected
                                  ? 'bg-gradient-to-b from-[#2a2448] to-[#1c1836] border-amber-400 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.7),inset_-1px_-1px_2px_rgba(255,255,255,0.1),0_0_16px_rgba(251,191,36,0.2)] ring-1 ring-amber-400/60 text-white'
                                  : 'bg-[#141535] border-[#292c57] text-slate-300 hover:border-indigo-500/50 hover:bg-[#18193d] shadow-[-3px_-3px_10px_rgba(140,165,255,0.03),4px_6px_14px_rgba(0,0,0,0.5),inset_1px_1px_1px_rgba(255,255,255,0.08)]'
                              }`}
                            >
                              <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                      selected ? 'bg-amber-400 text-slate-950 shadow-sm' : 'bg-[#1b1d42] border border-amber-500/30 text-amber-300'
                                    }`}
                                  >
                                    TIPE {t.code}
                                  </span>
                                  <span className="font-bold text-xs text-white">
                                    {t.title.split(': ')[1] || t.title}
                                  </span>
                                </div>
                                {selected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                              </div>
                              <div className="text-[11px] text-slate-300 font-medium mb-1.5 leading-snug">
                                {t.criteria}
                              </div>
                              <ul className="space-y-0.5 pl-3 border-l-2 border-indigo-800/40">
                                {t.items.map((it, idx) => (
                                  <li key={idx} className="text-[10.5px] text-slate-300 flex items-start gap-1">
                                    <span className="text-amber-400/80">•</span>
                                    <span>{it}</span>
                                  </li>
                                ))}
                              </ul>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pilihan Kelompok Risiko Pasien */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-black uppercase tracking-wider text-cyan-400">
                          Langkah B: Kelompok Pasien Berisiko
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">Area terdampak</span>
                      </div>

                      <div className="space-y-2.5">
                        {PATIENT_RISK_GROUPS.map((r) => {
                          const selected = projForm.kelompok_risiko === r.code;
                          const badgeColor =
                            r.code === '4'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : r.code === '3'
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                              : r.code === '2'
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

                          return (
                            <button
                              key={r.code}
                              type="button"
                              onClick={() => handleMatrixChange(r.code, projForm.tipe_konstruksi)}
                              className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                                selected
                                  ? 'bg-gradient-to-b from-[#182a4d] to-[#111e3b] border-cyan-400 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.7),inset_-1px_-1px_2px_rgba(255,255,255,0.1),0_0_16px_rgba(34,211,238,0.2)] ring-1 ring-cyan-400/60 text-white'
                                  : 'bg-[#141535] border-[#292c57] text-slate-300 hover:border-indigo-500/50 hover:bg-[#18193d] shadow-[-3px_-3px_10px_rgba(140,165,255,0.03),4px_6px_14px_rgba(0,0,0,0.5),inset_1px_1px_1px_rgba(255,255,255,0.08)]'
                              }`}
                            >
                              <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-[10px] font-black border ${badgeColor}`}
                                  >
                                    {r.riskLabel.toUpperCase()}
                                  </span>
                                  <span className="font-bold text-xs text-white">{r.title}</span>
                                </div>
                                {selected && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                              </div>
                              <div className="text-[11px] text-slate-300 font-medium leading-relaxed">
                                <span className="text-slate-400">Daftar Area/Ruangan: </span>
                                {r.areas}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Catatan Penting Permenkes 27/2017 */}
                  <div className="p-3.5 rounded-2xl bg-[#12132e] border border-cyan-500/30 flex items-start gap-2.5 text-xs text-cyan-200 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <strong className="text-cyan-300">Catatan Penting Permenkes No. 27 Tahun 2017:</strong>{' '}
                      {PATIENT_RISK_NOTE}
                    </div>
                  </div>

                  {/* Matriks Visual & Penetapan Kelas (Tabel 12) - Recessed Neumorphic Box */}
                  <div className="relative rounded-[24px] bg-[#12132e] border border-black/40 p-4 sm:p-5 space-y-4 shadow-[inset_2px_2px_8px_rgba(0,0,0,0.85),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-900/40 pb-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase text-slate-400">
                          Hasil Kombinasi Matriks (Tipe {projForm.tipe_konstruksi} × Kelompok {projForm.kelompok_risiko} -{' '}
                          {PATIENT_RISK_GROUPS.find((r) => r.code === projForm.kelompok_risiko)?.riskLabel})
                        </span>
                        <div className="text-lg font-black text-white mt-0.5 flex flex-wrap items-center gap-2">
                          <span>Kelas Kewaspadaan:</span>
                          <span
                            className={`px-3 py-1 rounded-xl border text-sm font-black shadow-md ${
                              projForm.kelas_tindakan === 'IV'
                                ? 'bg-rose-500/25 text-rose-300 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                                : projForm.kelas_tindakan === 'III'
                                ? 'bg-orange-500/25 text-orange-300 border-orange-500/60 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                                : projForm.kelas_tindakan === 'II'
                                ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                                : 'bg-emerald-500/25 text-emerald-300 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                            }`}
                          >
                            KELAS {projForm.kelas_tindakan}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 mr-1 font-bold">Sesuaikan Kelas:</span>
                        {(['I', 'II', 'III', 'IV'] as ConstructionClass[]).map((cls) => (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => handleOverrideClass(cls)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black border cursor-pointer transition-all active:scale-95 ${
                              projForm.kelas_tindakan === cls
                                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3),2px_3px_8px_rgba(0,0,0,0.5)] ring-2 ring-amber-400/50'
                                : 'bg-[#18193d] text-slate-300 border-[#2b2d5a] shadow-[-2px_-2px_6px_rgba(140,165,255,0.04),3px_4px_8px_rgba(0,0,0,0.5)] hover:text-white hover:bg-[#1f214d]'
                            }`}
                          >
                            {cls}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Matriks Kelas Kewaspadaan */}
                    <div>
                      <div className="overflow-x-auto rounded-2xl border border-[#2b2e5c] shadow-[inset_1.5px_1.5px_4px_rgba(0,0,0,0.6)]">
                        <table className="w-full text-center border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-[#181a42] text-indigo-200 font-extrabold uppercase">
                              <th className="border border-indigo-900/60 p-2.5 text-center w-1/4">Kelompok Pasien Berisiko</th>
                              <th className="border border-indigo-900/60 p-2.5">Tipe A</th>
                              <th className="border border-indigo-900/60 p-2.5">Tipe B</th>
                              <th className="border border-indigo-900/60 p-2.5">Tipe C</th>
                              <th className="border border-indigo-900/60 p-2.5">Tipe D</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(['1', '2', '3', '4'] as PatientRiskGroup[]).map((rg) => {
                              const rInfo = PATIENT_RISK_GROUPS.find((r) => r.code === rg);
                              return (
                                <tr key={rg} className="hover:bg-indigo-950/30 transition-colors">
                                  <td className="border border-indigo-900/60 p-2.5 text-center font-extrabold text-white bg-[#141638]">
                                    {rInfo?.riskLabel}
                                  </td>
                                  {(['A', 'B', 'C', 'D'] as ConstructionType[]).map((tp) => {
                                    const cell = CONSTRUCTION_MATRIX[rg][tp];
                                    const active =
                                      projForm.kelompok_risiko === rg && projForm.tipe_konstruksi === tp;
                                    const cellVal = cell.isAmbiguousIIIorIV ? 'III / IV' : cell.classLevel;

                                    const cellBg =
                                      cellVal === 'I'
                                        ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                                        : cellVal === 'II'
                                        ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                                        : cellVal === 'III'
                                        ? 'bg-orange-500/10 text-orange-300 hover:bg-orange-500/20'
                                        : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20';

                                    return (
                                      <td
                                        key={tp}
                                        onClick={() => handleMatrixChange(rg, tp)}
                                        className={`border border-indigo-900/60 p-2.5 cursor-pointer font-bold transition-all ${
                                          active
                                            ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-white shadow-lg'
                                            : cellBg
                                        }`}
                                      >
                                        {cellVal}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Keterangan Kelas */}
                      <div className="flex flex-wrap items-center gap-2 mt-3 text-[10.5px]">
                        <span className="text-slate-400 font-bold mr-1">Keterangan Kelas:</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141638] border border-emerald-500/30 text-emerald-300 font-black shadow-[-2px_-2px_5px_rgba(140,165,255,0.03),2px_3px_6px_rgba(0,0,0,0.5)]">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span> = Kelas I
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141638] border border-amber-500/30 text-amber-300 font-black shadow-[-2px_-2px_5px_rgba(140,165,255,0.03),2px_3px_6px_rgba(0,0,0,0.5)]">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span> = Kelas II
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141638] border border-orange-500/30 text-orange-300 font-black shadow-[-2px_-2px_5px_rgba(140,165,255,0.03),2px_3px_6px_rgba(0,0,0,0.5)]">
                          <span className="w-2 h-2 rounded-full bg-orange-400"></span> = Kelas III
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141638] border border-rose-500/30 text-rose-300 font-black shadow-[-2px_-2px_5px_rgba(140,165,255,0.03),2px_3px_6px_rgba(0,0,0,0.5)]">
                          <span className="w-2 h-2 rounded-full bg-rose-400"></span> = Kelas IV
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bagian 3: Checklist Pengendalian Infeksi - Neumorphic Card */}
                {(() => {
                  const duringList = projForm.checklist_pengendalian
                    .map((chk, originalIdx) => ({ chk, originalIdx }))
                    .filter(({ chk }) => !chk.label.includes('[Setelah Konstruksi]'));

                  const afterList = projForm.checklist_pengendalian
                    .map((chk, originalIdx) => ({ chk, originalIdx }))
                    .filter(({ chk }) => chk.label.includes('[Setelah Konstruksi]'));

                  return (
                    <div className="relative bg-[#18193b] rounded-[28px] p-5 sm:p-6 border border-[#2b2d56] shadow-[-6px_-6px_20px_rgba(140,165,255,0.05),10px_12px_32px_rgba(0,0,0,0.65),inset_1px_1px_1.5px_rgba(255,255,255,0.15),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] overflow-hidden space-y-5">
                      {/* Top Bevel Highlight */}
                      <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-900/40 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-3 py-1 rounded-full bg-[#12132e] border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider text-emerald-400 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6)]">
                              BAGIAN 3
                            </span>
                            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                              3. Intervensi PPI Berdasarkan Kelas
                            </h4>
                          </div>
                          <p className="text-[11px] sm:text-xs text-slate-300">
                            {CONSTRUCTION_CLASS_CONTROLS[projForm.kelas_tindakan].title}:{' '}
                            {CONSTRUCTION_CLASS_CONTROLS[projForm.kelas_tindakan].summary}
                          </p>
                        </div>
                      </div>

                      {/* Tabel 2 Kolom Bersebelahan: Selama Proyek Konstruksi & Setelah Proyek Konstruksi */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                        {/* Kolom Kiri: Selama Proyek Konstruksi */}
                        <div className="relative rounded-2xl border border-amber-500/35 bg-[#12132e] overflow-hidden flex flex-col shadow-[-4px_-4px_14px_rgba(140,165,255,0.03),6px_8px_20px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.08)]">
                          <div className="absolute top-0 inset-x-6 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />
                          <div className="bg-gradient-to-r from-amber-600/25 via-amber-500/15 to-transparent border-b border-amber-500/30 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <HardHat className="w-4 h-4 text-amber-400 shrink-0" />
                              <span className="font-black text-xs uppercase tracking-wider text-amber-300">
                                Selama Proyek Konstruksi
                              </span>
                            </div>
                          </div>

                          <div className="p-3.5 space-y-2.5">
                            {duringList.map(({ chk, originalIdx }, subIdx) => {
                              const cleanText = chk.label.replace(/^\[(Selama|Setelah) Konstruksi\]\s*/i, '');
                              return (
                                <div
                                  key={chk.id || originalIdx}
                                  className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-500/30 bg-[#16173a] text-slate-100 text-xs shadow-[-2px_-2px_6px_rgba(140,165,255,0.02),3px_4px_10px_rgba(0,0,0,0.5),inset_1px_1px_1px_rgba(255,255,255,0.06)] leading-relaxed"
                                >
                                  <span className="font-black text-amber-400 shrink-0 select-none text-xs">
                                    {subIdx + 1}.
                                  </span>
                                  <div className="flex-1 text-slate-200 font-medium leading-relaxed">
                                    {cleanText}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Kolom Kanan: Setelah Proyek Konstruksi */}
                        <div className="relative rounded-2xl border border-cyan-500/35 bg-[#12132e] overflow-hidden flex flex-col shadow-[-4px_-4px_14px_rgba(140,165,255,0.03),6px_8px_20px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.08)]">
                          <div className="absolute top-0 inset-x-6 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none" />
                          <div className="bg-gradient-to-r from-cyan-600/25 via-cyan-500/15 to-transparent border-b border-cyan-500/30 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                              <span className="font-black text-xs uppercase tracking-wider text-cyan-300">
                                Setelah Proyek Konstruksi
                              </span>
                            </div>
                          </div>

                          <div className="p-3.5 space-y-2.5">
                            {afterList.map(({ chk, originalIdx }, subIdx) => {
                              const cleanText = chk.label.replace(/^\[(Selama|Setelah) Konstruksi\]\s*/i, '');
                              return (
                                <div
                                  key={chk.id || originalIdx}
                                  className="flex items-start gap-3 p-3.5 rounded-xl border border-cyan-500/30 bg-[#141b3a] text-slate-100 text-xs shadow-[-2px_-2px_6px_rgba(140,165,255,0.02),3px_4px_10px_rgba(0,0,0,0.5),inset_1px_1px_1px_rgba(255,255,255,0.06)] leading-relaxed"
                                >
                                  <span className="font-black text-cyan-400 shrink-0 select-none text-xs">
                                    {subIdx + 1}.
                                  </span>
                                  <div className="flex-1 text-slate-200 font-medium leading-relaxed">
                                    {cleanText}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-indigo-300 mb-1.5">
                          Instruksi Khusus / Catatan Tambahan IPCN
                        </label>
                        <textarea
                          rows={2}
                          value={projForm.persyaratan_khusus}
                          onChange={(e) => setProjForm((p) => ({ ...p, persyaratan_khusus: e.target.value }))}
                          placeholder="Contoh: Pekerjaan pengeboran hanya diperbolehkan pukul 14.00 - 17.00 WIB..."
                          className="w-full bg-[#12132e] border border-black/40 text-white text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400/60 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] transition-all placeholder-slate-500"
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Bagian 4: Dokumentasi Pra Kontruksi / Renovasi - Neumorphic Card */}
                <div className="relative bg-[#18193b] rounded-[28px] p-5 sm:p-6 border border-[#2b2d56] shadow-[-6px_-6px_20px_rgba(140,165,255,0.05),10px_12px_32px_rgba(0,0,0,0.65),inset_1px_1px_1.5px_rgba(255,255,255,0.15),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] overflow-hidden space-y-4">
                  {/* Top Bevel Highlight */}
                  <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                  <div className="flex items-center gap-2 border-b border-indigo-900/40 pb-2.5">
                    <span className="px-3 py-1 rounded-full bg-[#12132e] border border-indigo-500/30 text-[10px] font-black uppercase tracking-wider text-indigo-300 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6)]">
                      BAGIAN 4
                    </span>
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                      Dokumentasi Pra Kontruksi / Renovasi
                    </h4>
                  </div>

                  {/* Foto Dokumentasi Pra Konstruksi / Renovasi (Maksimal 6 Foto) */}
                  <div className="rounded-2xl bg-[#12132e] border border-black/40 p-4 sm:p-5 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
                    <DocumentationUploader
                      images={fotoSebelum}
                      setImages={setFotoSebelum}
                      maxImages={6}
                      columns={2}
                      hideTitle={true}
                    />
                  </div>
                </div>

                {/* Footer Modal: Tombol Aksi */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-indigo-900/50">
                  <button
                    type="button"
                    onClick={() => setIsProjectModalOpen(false)}
                    className="px-6 py-3 rounded-2xl bg-[#141535] hover:bg-[#1a1b42] text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider border border-[#2c2f5d] shadow-[-3px_-3px_10px_rgba(140,165,255,0.03),4px_6px_14px_rgba(0,0,0,0.5)] active:scale-95 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="relative group px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-[-4px_-4px_14px_rgba(255,255,255,0.12),6px_8px_20px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.4)] hover:shadow-[-5px_-5px_18px_rgba(255,255,255,0.18),8px_10px_25px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.5)] active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.7)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 overflow-hidden"
                  >
                    <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
                    {saving ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Save className="w-4 h-4 text-slate-950" />}
                    <span className="font-black tracking-widest text-slate-950">SIMPAN DATA</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* MODAL 2: MONITORING ICRA KONSTRUKSI (3 SHEET: PRA, INTRA & POST)    */}
      {/* =================================================================== */}
      <AnimatePresence>
        {activeMonitoringProject && (
          <IcraMonitoringModal
            project={activeMonitoringProject}
            projectLogs={currentProjectLogs}
            onClose={() => setMonitoringProject(null)}
            onSaved={fetchAll}
            showToast={showToast}
          />
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

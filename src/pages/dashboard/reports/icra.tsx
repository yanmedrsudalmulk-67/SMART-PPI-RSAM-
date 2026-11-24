import React, { useState, useEffect, useMemo, useCallback, useRef, ReactElement } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ChevronDown,
  Check,
  Camera,
  HardHat,
  RefreshCw,
  Loader2,
  X,
  Save,
  Calendar,
  Building2,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ZoomableReportViewer from '@/components/reports/ZoomableReportViewer';
import PdfDownloadButton from '@/components/reports/PdfDownloadButton';
import IcraOfficialReport from '@/components/reports/official/IcraOfficialReport';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import { supabase } from '@/lib/supabase';
import { uploadImagesToSupabase } from '@/lib/upload';
import { normalizeImageUrl } from '@/utils/imageHelper';
import {
  IcraKonstruksiItem,
  IcraMonitoringItem,
  ConstructionType,
  PatientRiskGroup,
  ConstructionClass,
  getConstructionClass,
  normalizeStringArray,
  normalizeChecklist,
  normalizePreChecklist,
  normalizePostChecklist,
  normalizeIntraItems,
  toBool,
} from '@/utils/icraData';

function normalizeKonstruksiRow(raw: any): IcraKonstruksiItem {
  const tipe = (raw.tipe_konstruksi || 'C') as ConstructionType;
  const risk = String(raw.kelompok_risiko || '2') as PatientRiskGroup;
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

function safeFormatShortDate(iso?: string): string {
  if (!iso) return '-';
  try {
    return format(parseISO(iso), 'dd MMM yyyy', { locale: idLocale });
  } catch {
    return iso;
  }
}

function getClassBadgeStyle(kelas: ConstructionClass): string {
  switch (kelas) {
    case 'I':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40';
    case 'II':
      return 'bg-amber-500/20 text-amber-300 border-amber-400/40';
    case 'III':
      return 'bg-orange-500/20 text-orange-300 border-orange-400/40';
    case 'IV':
      return 'bg-rose-500/20 text-rose-300 border-rose-400/40';
    default:
      return 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40';
  }
}

export default function LaporanIcraPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<IcraKonstruksiItem[]>([]);
  const [monitoringLogs, setMonitoringLogs] = useState<IcraMonitoringItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Report sign-off customization
  const [ketuaPpiName, setKetuaPpiName] = useState<string>('dr. Nurul Iman');
  const [signDate, setSignDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));

  // Modal for completing Pre/Intra/Post photos & Pengesahan
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editIpcnName, setEditIpcnName] = useState('Adi Tresa Purnama, A.M.Kep');
  const [editKetuaName, setEditKetuaName] = useState('dr. Nurul Iman');
  const [editSignDate, setEditSignDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [editFotoPre, setEditFotoPre] = useState<DocImage[]>([]);
  const [editFotoIntra, setEditFotoIntra] = useState<DocImage[]>([]);
  const [editFotoPost, setEditFotoPost] = useState<DocImage[]>([]);

  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Load saved Ketua PPI name from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKetua = localStorage.getItem('smart_ppi_ketua_ppi');
      if (savedKetua && savedKetua.trim()) {
        setKetuaPpiName(savedKetua.trim());
      }
    }
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

      const projList = Array.isArray(projRes.data) ? projRes.data.map(normalizeKonstruksiRow) : [];
      const monList = Array.isArray(monRes.data) ? monRes.data.map(normalizeMonitoringRow) : [];

      setProjects(projList);
      setMonitoringLogs(monList);

      setSelectedProjectId((prev) => {
        const queryId = typeof router.query.projectId === 'string' ? router.query.projectId : '';
        if (queryId && projList.some((p) => p.id === queryId)) return queryId;
        if (prev && projList.some((p) => p.id === prev)) return prev;
        return projList[0]?.id || '';
      });
    } catch (err: any) {
      console.error('Error fetching ICRA projects for report:', err);
      showToast('Gagal memuat data ICRA Konstruksi & Renovasi.', 'error');
    } finally {
      setLoading(false);
    }
  }, [router.query.projectId, showToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Close project dropdown on outside click or Escape
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDropdownOpen(false);
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isDropdownOpen]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || projects[0] || null,
    [projects, selectedProjectId]
  );

  const selectedProjectLogs = useMemo(() => {
    if (!selectedProject) return [];
    return monitoringLogs.filter((m) => m.konstruksi_id === selectedProject.id);
  }, [monitoringLogs, selectedProject]);

  // Sync default signDate when switching projects
  useEffect(() => {
    if (selectedProject) {
      setSignDate(selectedProject.tgl_mulai || format(new Date(), 'yyyy-MM-dd'));
    }
  }, [selectedProject?.id]);

  const openEditModal = () => {
    if (!selectedProject) return;
    setEditIpcnName(selectedProject.nama_ipcn || 'Adi Tresa Purnama, A.M.Kep');
    setEditKetuaName(ketuaPpiName || 'dr. Nurul Iman');
    setEditSignDate(signDate || selectedProject.tgl_mulai || format(new Date(), 'yyyy-MM-dd'));
    setEditFotoPre(
      (selectedProject.foto_sebelum || []).map((u) => ({ url: normalizeImageUrl(u), file: null }))
    );
    // Collect existing Intra photos from monitoring logs
    const intraUrls: string[] = [];
    const seen = new Set<string>();
    selectedProjectLogs.forEach((log) => {
      (log.foto_monitoring || []).forEach((u) => {
        const norm = normalizeImageUrl(u);
        if (norm && !seen.has(norm)) {
          seen.add(norm);
          intraUrls.push(norm);
        }
      });
    });
    setEditFotoIntra(intraUrls.map((url) => ({ url, file: null })));
    setEditFotoPost(
      (selectedProject.foto_sesudah || []).map((u) => ({ url: normalizeImageUrl(u), file: null }))
    );
    setIsEditModalOpen(true);
  };

  const handleSavePhotosAndSignoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setSaving(true);
    try {
      const [uploadedPre, uploadedIntra, uploadedPost] = await Promise.all([
        uploadImagesToSupabase(supabase, editFotoPre, 'audit_images', 'icra-konstruksi'),
        uploadImagesToSupabase(supabase, editFotoIntra, 'audit_images', 'icra-monitoring'),
        uploadImagesToSupabase(supabase, editFotoPost, 'audit_images', 'icra-konstruksi'),
      ]);

      // Update icra_konstruksi (nama_ipcn, foto_sebelum, foto_sesudah)
      const { error: updErr } = await supabase
        .from('icra_konstruksi')
        .update({
          nama_ipcn: editIpcnName.trim() || 'Adi Tresa Purnama, A.M.Kep',
          foto_sebelum: uploadedPre,
          foto_sesudah: uploadedPost,
        })
        .eq('id', selectedProject.id);
      if (updErr) throw updErr;

      // Sync Intra photos into icra_konstruksi_monitoring
      // Find existing dedicated report intra log OR latest monitoring log, or create a new monitoring log if photos were added
      const existingIntraLog = selectedProjectLogs.find(
        (m) => m.temuan_lapangan === 'Dokumentasi Intra Konstruksi / Renovasi'
      );
      const existingNonDedicatedUrls = new Set<string>();
      selectedProjectLogs
        .filter((m) => m.id !== existingIntraLog?.id)
        .forEach((m) => {
          (m.foto_monitoring || []).forEach((u) => existingNonDedicatedUrls.add(normalizeImageUrl(u)));
        });

      const newIntraOnly = uploadedIntra.filter((u) => !existingNonDedicatedUrls.has(normalizeImageUrl(u)));

      if (existingIntraLog) {
        const { error: monUpdErr } = await supabase
          .from('icra_konstruksi_monitoring')
          .update({
            foto_monitoring: newIntraOnly,
            petugas_ipcn: editIpcnName.trim() || 'Adi Tresa Purnama, A.M.Kep',
          })
          .eq('id', existingIntraLog.id);
        if (monUpdErr) throw monUpdErr;
      } else if (newIntraOnly.length > 0) {
        const { error: monInsErr } = await supabase
          .from('icra_konstruksi_monitoring')
          .insert([
            {
              id: `icra_mon_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              created_at: new Date().toISOString(),
              konstruksi_id: selectedProject.id,
              tanggal_monitoring: editSignDate || format(new Date(), 'yyyy-MM-dd'),
              jam_monitoring: format(new Date(), 'HH:mm'),
              petugas_ipcn: editIpcnName.trim() || 'Adi Tresa Purnama, A.M.Kep',
              barier_tertutup: true,
              tekanan_negatif_hepa:
                selectedProject.kelas_tindakan === 'III' || selectedProject.kelas_tindakan === 'IV' ? 'Ya' : 'N/A',
              keset_basah_pintu: true,
              area_sekitar_bersih: true,
              jalur_limbah_tertutup: true,
              apd_pekerja: true,
              temuan_lapangan: 'Dokumentasi Intra Konstruksi / Renovasi',
              tindakan_koreksi: '',
              status_kepatuhan: 'Sesuai Standar',
              foto_monitoring: newIntraOnly,
            },
          ]);
        if (monInsErr) throw monInsErr;
      }

      // Save Ketua PPI & Sign Date
      const cleanKetua = editKetuaName.trim() || 'dr. Nurul Iman';
      setKetuaPpiName(cleanKetua);
      setSignDate(editSignDate);
      if (typeof window !== 'undefined') {
        localStorage.setItem('smart_ppi_ketua_ppi', cleanKetua);
      }

      setIsEditModalOpen(false);
      await fetchAll();
      showToast('Dokumentasi & Pengesahan Laporan ICRA berhasil disimpan!');
    } catch (err: any) {
      console.error('Error saving ICRA report photos:', err);
      showToast(`Gagal menyimpan perubahan: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const pdfFilename = useMemo(() => {
    if (!selectedProject) return 'Laporan_ICRA_RSUD_AlMulk_F4.pdf';
    const cleanName = selectedProject.nama_proyek
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 48);
    const year = selectedProject.tgl_mulai?.slice(0, 4) || new Date().getFullYear();
    return `Laporan_ICRA_${cleanName || 'Konstruksi'}_${year}_F4.pdf`;
  }, [selectedProject]);

  const targetElementId = 'print-area-icra';

  return (
    <>
      <Head>
        <title>Laporan ICRA | UOBK RSUD Al-Mulk</title>
        <meta
          name="description"
          content="Laporan Resmi Infection Control Risk Assessment (ICRA) Konstruksi & Renovasi Format F4 Terintegrasi"
        />
      </Head>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-5 right-5 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-xs sm:text-sm font-bold no-print ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-400/50 text-emerald-200'
                : 'bg-rose-950/90 border-rose-400/50 text-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto pb-32 relative space-y-4 sm:space-y-6">
        {/* ================= UNIFIED HEADER TOOLBAR (1 BARIS DESKTOP) ================= */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 sm:p-4 bg-[#151736] border border-indigo-900/40 rounded-2xl shadow-[-4px_-4px_12px_rgba(140,165,255,0.06),6px_8px_20px_rgba(0,0,0,0.6)] no-print relative z-50">
          {/* Left: Title */}
          <div className="flex items-center gap-3">
            <span className="p-2 sm:p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/35 shadow-sm flex-shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <h1 className="font-gta title-ultra-bold text-2xl sm:text-3xl font-black tracking-wide leading-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient uppercase whitespace-nowrap drop-shadow-[0_2px_10px_rgba(99,102,241,0.35)]">
              LAPORAN ICRA
            </h1>
          </div>

          {/* Right: Project Selector + Foto & Pengesahan + Refresh + Download PDF */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 justify-start lg:justify-end">
            {/* Project Dropdown Selector */}
            <div className="relative flex-1 sm:flex-initial min-w-[220px] max-w-full sm:max-w-[340px]" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((o) => !o)}
                disabled={loading || projects.length === 0}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border shadow-sm cursor-pointer disabled:opacity-50 ${
                  isDropdownOpen
                    ? 'bg-[#1e2254] border-amber-400 text-white shadow-[0_0_14px_rgba(245,158,11,0.3)]'
                    : 'bg-[#181a3f] hover:bg-[#202356] border-indigo-700/60 text-white'
                }`}
                title="Pilih Proyek ICRA Konstruksi & Renovasi"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <HardHat className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">
                    {loading
                      ? 'Memuat proyek ICRA...'
                      : selectedProject
                      ? selectedProject.nama_proyek
                      : 'Belum ada proyek ICRA'}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-300 shrink-0 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isDropdownOpen && projects.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-full sm:w-[380px] max-h-[360px] overflow-y-auto rounded-2xl bg-[#141636] border border-indigo-500/40 shadow-[0_18px_45px_rgba(0,0,0,0.85)] p-2 z-[60] space-y-1"
                  >
                    <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-300/80 border-b border-white/10">
                      Proyek Terintegrasi ICRA Konstruksi ({projects.length})
                    </div>
                    {projects.map((p) => {
                      const active = p.id === selectedProject?.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedProjectId(p.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 cursor-pointer ${
                            active
                              ? 'bg-indigo-600/35 border border-indigo-400/50 text-white'
                              : 'hover:bg-white/5 border border-transparent text-slate-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold leading-snug line-clamp-2 text-white">
                              {p.nama_proyek}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-slate-300/80">
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-cyan-400" />
                                {p.lokasi_area}
                              </span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-amber-400" />
                                {safeFormatShortDate(p.tgl_mulai)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${getClassBadgeStyle(
                                p.kelas_tindakan
                              )}`}
                            >
                              KELAS {p.kelas_tindakan}
                            </span>
                            {active && <Check className="w-3.5 h-3.5 text-cyan-300" />}
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Kelola Foto Pre/Intra/Post & Pengesahan */}
            {selectedProject && (
              <button
                type="button"
                onClick={openEditModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#181a3f] hover:bg-[#212457] border border-cyan-500/40 text-cyan-200 hover:text-white transition-all shadow-sm cursor-pointer"
                title="Lengkapi Foto Pra/Intra/Pasca & Nama Pengesahan Laporan"
              >
                <Camera className="w-4 h-4 text-cyan-400" />
                <span className="whitespace-nowrap">Foto &amp; Pengesahan</span>
              </button>
            )}

            {/* Refresh button */}
            <button
              type="button"
              onClick={fetchAll}
              disabled={loading}
              className="p-2 rounded-xl bg-[#181a3f] hover:bg-[#212457] border border-indigo-700/60 text-indigo-200 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Sinkronkan Ulang Data ICRA Konstruksi"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Download PDF Resmi F4 */}
            <PdfDownloadButton
              targetElementId={targetElementId}
              filename={pdfFilename}
              title="Download Dokumen Laporan ICRA Resmi Format F4 (PDF)"
              paperSize="f4"
              margin={0}
              size="md"
              disabled={loading || !selectedProject}
              className="justify-center"
            />
          </div>
        </div>

        {/* ================= MAIN CONTENT: LOADING / EMPTY / REPORT VIEWER ================= */}
        {loading ? (
          <div className="rounded-3xl bg-[#151736]/80 border border-indigo-900/40 p-16 flex flex-col items-center justify-center gap-3 text-indigo-200 no-print">
            <Loader2 className="w-9 h-9 animate-spin text-cyan-400" />
            <p className="text-sm font-bold">Memuat data proyek ICRA Konstruksi &amp; Renovasi...</p>
          </div>
        ) : !selectedProject ? (
          <div className="rounded-3xl bg-gradient-to-b from-[#1a1c40] to-[#12132c] border border-indigo-500/30 p-10 sm:p-14 text-center space-y-4 shadow-2xl no-print">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <HardHat className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white">
              Belum Ada Data Proyek ICRA Konstruksi &amp; Renovasi
            </h2>
            <p className="text-sm text-indigo-200/80 max-w-lg mx-auto leading-relaxed">
              Laporan ICRA ini terintegrasi otomatis dengan data yang Anda input pada menu{' '}
              <strong className="text-amber-300">ICRA &amp; KLB → ICRA Konstruksi &amp; Renovasi</strong>.
              Silakan buat pengkajian proyek terlebih dahulu.
            </p>
            <Link
              href="/dashboard/icra"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg hover:brightness-110 transition-all"
            >
              <span>Buka Menu ICRA Konstruksi</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <ZoomableReportViewer reportId={targetElementId} showToolbar={false}>
            <div className="w-full flex justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedProject.id}-${signDate}-${ketuaPpiName}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  <IcraOfficialReport
                    project={selectedProject}
                    monitoringLogs={selectedProjectLogs}
                    ketuaPpiName={ketuaPpiName}
                    signDate={signDate}
                    documentId={targetElementId}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </ZoomableReportViewer>
        )}
      </div>

      {/* ================= MODAL: LENGKAPI FOTO (PRE / INTRA / POST) & PENGESAHAN ================= */}
      <AnimatePresence>
        {isEditModalOpen && selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 no-print"
            onClick={() => !saving && setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-gradient-to-b from-[#1b1d42] via-[#151735] to-[#10122a] border border-indigo-400/35 shadow-[0_24px_64px_rgba(0,0,0,0.85)] p-5 sm:p-7 space-y-5"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    Lengkapi Dokumentasi &amp; Pengesahan Laporan ICRA
                  </h2>
                  <p className="text-xs text-indigo-200/80 mt-0.5">
                    Proyek: <strong className="text-amber-300">{selectedProject.nama_proyek}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !saving && setIsEditModalOpen(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePhotosAndSignoff} className="space-y-5">
                {/* Pengesahan Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-200 mb-1.5">
                      Tanggal Pengesahan
                    </label>
                    <input
                      type="date"
                      value={editSignDate}
                      onChange={(e) => setEditSignDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1026] border border-indigo-700/60 text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-200 mb-1.5">
                      Penyusun (IPCN)
                    </label>
                    <input
                      type="text"
                      value={editIpcnName}
                      onChange={(e) => setEditIpcnName(e.target.value)}
                      placeholder="Adi Tresa Purnama, A.M.Kep"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1026] border border-indigo-700/60 text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-200 mb-1.5">
                      Mengetahui (Ketua PPI)
                    </label>
                    <input
                      type="text"
                      value={editKetuaName}
                      onChange={(e) => setEditKetuaName(e.target.value)}
                      placeholder="dr. Nurul Iman"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1026] border border-indigo-700/60 text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* 1. Foto Pre Konstruksi / Renovasi */}
                <div className="rounded-2xl bg-[#10122b] border border-indigo-800/50 p-4 space-y-2">
                  <p className="text-xs font-black uppercase tracking-wider text-cyan-300">
                    1. Foto Pre Renovasi / Konstruksi (Tersinkron dengan ICRA Konstruksi)
                  </p>
                  <DocumentationUploader
                    images={editFotoPre}
                    setImages={setEditFotoPre}
                    maxImages={6}
                    hideTitle
                  />
                </div>

                {/* 2. Foto Intra Konstruksi / Renovasi */}
                <div className="rounded-2xl bg-[#10122b] border border-indigo-800/50 p-4 space-y-2">
                  <p className="text-xs font-black uppercase tracking-wider text-amber-300">
                    2. Foto Intra Renovasi / Konstruksi (Pelaksanaan di Lapangan)
                  </p>
                  <DocumentationUploader
                    images={editFotoIntra}
                    setImages={setEditFotoIntra}
                    maxImages={6}
                    hideTitle
                  />
                </div>

                {/* 3. Foto Post Konstruksi / Renovasi */}
                <div className="rounded-2xl bg-[#10122b] border border-indigo-800/50 p-4 space-y-2">
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-300">
                    3. Foto Post Renovasi / Konstruksi (Setelah Selesai &amp; Terminal Cleaning)
                  </p>
                  <DocumentationUploader
                    images={editFotoPost}
                    setImages={setEditFotoPost}
                    maxImages={6}
                    hideTitle
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white text-xs font-black uppercase tracking-wider shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{saving ? 'Menyimpan...' : 'Simpan & Perbarui Laporan'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

LaporanIcraPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

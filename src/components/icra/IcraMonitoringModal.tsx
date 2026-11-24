import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  ClipboardList,
  X,
  Save,
  Loader2,
  Trash2,
  FileCheck,
  HardHat,
  CheckCircle2,
  CheckCheck,
  Calendar,
  MapPin,
  ShieldAlert,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadImagesToSupabase } from '@/lib/upload';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import { normalizeImageUrl } from '@/utils/imageHelper';
import {
  IcraKonstruksiItem,
  IcraMonitoringItem,
  IcraPreFormData,
  IcraPostFormData,
  IcraIntraItemAnswer,
  PrePostAnswer,
  IntraAnswer,
  getPreChecklistSections,
  getPostChecklistSections,
  normalizePreChecklist,
  normalizePostChecklist,
  buildDefaultIntraItems,
} from '@/utils/icraData';

interface IcraMonitoringModalProps {
  project: IcraKonstruksiItem | null;
  projectLogs: IcraMonitoringItem[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  showToast: (text: string, type?: 'success' | 'error') => void;
}

type SheetTab = 'pre' | 'intra' | 'post';

function safeFormatDate(d?: string): string {
  if (!d) return '-';
  try {
    return format(parseISO(d), 'dd MMM yyyy', { locale: idLocale });
  } catch {
    return d;
  }
}

export default function IcraMonitoringModal({
  project,
  projectLogs,
  onClose,
  onSaved,
  showToast,
}: IcraMonitoringModalProps) {
  const [activeSheet, setActiveSheet] = useState<SheetTab>('pre');
  const [saving, setSaving] = useState(false);

  // Sheet 1: PRA KONSTRUKSI
  const [preForm, setPreForm] = useState<IcraPreFormData | null>(null);

  // Sheet 2: INTRA KONSTRUKSI
  const todayIso = format(new Date(), 'yyyy-MM-dd');
  const [intraMeta, setIntraMeta] = useState({
    area_renovasi: '',
    tanggal_monitoring: todayIso,
    jam_monitoring: format(new Date(), 'HH:mm'),
    petugas_ipcn: 'Adi Tresa Purnama, A.M.Kep',
    status_kepatuhan: 'Sesuai Standar' as IcraMonitoringItem['status_kepatuhan'],
    temuan_lapangan: '',
    tindakan_koreksi: '',
  });
  const [intraItems, setIntraItems] = useState<IcraIntraItemAnswer[]>([]);
  const [monPhotos, setMonPhotos] = useState<DocImage[]>([]);

  // Sheet 3: POST KONSTRUKSI
  const [postForm, setPostForm] = useState<IcraPostFormData | null>(null);
  const [postPhotos, setPostPhotos] = useState<DocImage[]>([]);
  const [markCompleted, setMarkCompleted] = useState(false);

  useEffect(() => {
    if (!project) return;
    setPreForm(normalizePreChecklist(project.pre_checklist, project));
    setPostForm(normalizePostChecklist(project.post_checklist, project));
    setPostPhotos(
      (project.foto_sesudah || []).map((u) => ({ url: normalizeImageUrl(u), file: null }))
    );
    setMarkCompleted(project.status_proyek === 'Selesai');

    setIntraMeta({
      area_renovasi: project.lokasi_area || '',
      tanggal_monitoring: format(new Date(), 'yyyy-MM-dd'),
      jam_monitoring: format(new Date(), 'HH:mm'),
      petugas_ipcn: project.nama_ipcn || 'Adi Tresa Purnama, A.M.Kep',
      status_kepatuhan: 'Sesuai Standar',
      temuan_lapangan: '',
      tindakan_koreksi: '',
    });
    setIntraItems(buildDefaultIntraItems(project.kelas_tindakan || 'III'));
    setMonPhotos([]);
    setActiveSheet('pre');
  }, [project]);

  if (!project || !preForm || !postForm) return null;

  const kelas = project.kelas_tindakan || 'III';
  const preSections = getPreChecklistSections(kelas);
  const postSections = getPostChecklistSections(kelas);

  // Handlers for Sheet 1 (PRE)
  const updatePreItem = (id: string, patch: Partial<{ answer: PrePostAnswer; tanggal: string; keterangan: string }>) => {
    setPreForm((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
          }
        : prev
    );
  };

  const applyAllPreSurveyDate = () => {
    const dt = preForm.tanggal_survey || todayIso;
    setPreForm((prev) =>
      prev
        ? {
            ...prev,
            signoffs: {
              ...prev.signoffs,
              ipsrs_tanggal: prev.signoffs.ipsrs_tanggal || dt,
              ppi_tanggal: prev.signoffs.ppi_tanggal || dt,
              kesling_tanggal: prev.signoffs.kesling_tanggal || dt,
              k3rs_tanggal: prev.signoffs.k3rs_tanggal || dt,
              pihak3_tanggal: prev.signoffs.pihak3_tanggal || dt,
            },
          }
        : prev
    );
  };

  const handleSavePre = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('icra_konstruksi')
        .update({ pre_checklist: preForm })
        .eq('id', project.id);
      if (error) throw error;
      showToast('Formulir Ceklist Pra Konstruksi berhasil disimpan & terintegrasi ke Laporan ICRA!');
      await onSaved();
    } catch (err: any) {
      showToast(`Gagal menyimpan Ceklist Pra: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handlers for Sheet 2 (INTRA)
  const updateIntraItem = (id: string, patch: Partial<{ answer: IntraAnswer; keterangan: string }>) => {
    setIntraItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const markAllIntraYes = () => {
    setIntraItems((prev) => prev.map((it) => ({ ...it, answer: 'YA' })));
  };

  const handleSaveIntra = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const uploadedMonPhotos = await uploadImagesToSupabase(
        supabase,
        monPhotos,
        'audit_images',
        'icra-monitoring'
      );

      // Derive legacy summary booleans from detailed class items for backward compatibility
      const findAns = (kw: string) =>
        intraItems.find((x) => x.kegiatan.toLowerCase().includes(kw))?.answer;
      const barierOk = findAns('barrier') !== 'TIDAK';
      const hepaAns = findAns('hepa');
      const kesetOk = findAns('keset') !== 'TIDAK';
      const bersihOk = findAns('pembersihan harian') !== 'TIDAK';
      const limbahOk = findAns('limbah') !== 'TIDAK';
      const apdOk = findAns('apd') !== 'TIDAK';

      const row = {
        id: `icra_mon_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        created_at: new Date().toISOString(),
        konstruksi_id: project.id,
        tanggal_monitoring: intraMeta.tanggal_monitoring,
        jam_monitoring: intraMeta.jam_monitoring,
        petugas_ipcn: intraMeta.petugas_ipcn.trim() || project.nama_ipcn || 'Adi Tresa Purnama, A.M.Kep',
        area_renovasi: intraMeta.area_renovasi.trim() || project.lokasi_area,
        barier_tertutup: barierOk,
        tekanan_negatif_hepa: hepaAns === 'YA' ? 'Ya' : hepaAns === 'TIDAK' ? 'Tidak' : 'N/A',
        keset_basah_pintu: kesetOk,
        area_sekitar_bersih: bersihOk,
        jalur_limbah_tertutup: limbahOk,
        apd_pekerja: apdOk,
        temuan_lapangan: intraMeta.temuan_lapangan.trim(),
        tindakan_koreksi: intraMeta.tindakan_koreksi.trim(),
        status_kepatuhan: intraMeta.status_kepatuhan,
        intra_items: intraItems,
        foto_monitoring: uploadedMonPhotos,
      };

      const { error } = await supabase.from('icra_konstruksi_monitoring').insert([row]);
      if (error) throw error;
      showToast('Formulir Pemantauan Intra Konstruksi berhasil disimpan!');
      setIntraMeta((m) => ({
        ...m,
        temuan_lapangan: '',
        tindakan_koreksi: '',
        jam_monitoring: format(new Date(), 'HH:mm'),
      }));
      setMonPhotos([]);
      await onSaved();
    } catch (err: any) {
      showToast(`Gagal menyimpan Pemantauan Intra: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIntraLog = async (logId: string) => {
    if (!confirm('Hapus catatan formulir pemantauan intra ini?')) return;
    try {
      const { error } = await supabase.from('icra_konstruksi_monitoring').delete().eq('id', logId);
      if (error) throw error;
      showToast('Catatan pemantauan intra dihapus.');
      await onSaved();
    } catch (err: any) {
      showToast(`Gagal menghapus log: ${err.message}`, 'error');
    }
  };

  // Handlers for Sheet 3 (POST)
  const updatePostItem = (id: string, patch: Partial<{ answer: PrePostAnswer; tanggal: string; keterangan: string }>) => {
    setPostForm((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
          }
        : prev
    );
  };

  const applyAllPostSurveyDate = () => {
    const dt = postForm.tanggal_survey || todayIso;
    setPostForm((prev) =>
      prev
        ? {
            ...prev,
            signoffs: {
              ...prev.signoffs,
              ipsrs_tanggal: prev.signoffs.ipsrs_tanggal || dt,
              ppi_tanggal: prev.signoffs.ppi_tanggal || dt,
              kesling_tanggal: prev.signoffs.kesling_tanggal || dt,
              k3rs_tanggal: prev.signoffs.k3rs_tanggal || dt,
              pihak3_tanggal: prev.signoffs.pihak3_tanggal || dt,
            },
          }
        : prev
    );
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const uploadedSesudah = await uploadImagesToSupabase(
        supabase,
        postPhotos,
        'audit_images',
        'icra-konstruksi'
      );

      const updates: Record<string, any> = {
        post_checklist: postForm,
        foto_sesudah: uploadedSesudah,
      };
      if (markCompleted) {
        updates.status_proyek = 'Selesai';
      }

      const { error } = await supabase
        .from('icra_konstruksi')
        .update(updates)
        .eq('id', project.id);
      if (error) throw error;

      showToast('Formulir Ceklist Post Konstruksi berhasil disimpan & terintegrasi ke Laporan ICRA!');
      await onSaved();
    } catch (err: any) {
      showToast(`Gagal menyimpan Ceklist Post: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const isPreSaved = Boolean(project.pre_checklist);
  const isPostSaved = Boolean(project.post_checklist);

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="w-full max-w-6xl max-h-[95vh] bg-[#121432] border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 bg-[#171a42] border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wide text-white truncate">
                Formulir Monitoring ICRA Konstruksi (Pra, Intra &amp; Post)
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs">
                <span className="text-cyan-300 font-bold truncate max-w-md">{project.nama_proyek}</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase">
                  Tipe {project.tipe_konstruksi} • Risiko Kelompok {project.kelompok_risiko} • Kelas {kelas}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Sheet Tab Switcher: PRA | INTRA | POST */}
        <div className="px-5 sm:px-6 py-3 bg-[#0f112b] border-b border-indigo-900/50 shrink-0">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-[#0a0b1d] p-1.5 rounded-2xl border border-black/60">
            <button
              type="button"
              onClick={() => setActiveSheet('pre')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeSheet === 'pre'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">1. Pra Konstruksi</span>
              {isPreSaved && (
                <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-300" title="Sudah Tersimpan" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSheet('intra')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeSheet === 'intra'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <HardHat className="w-4 h-4 shrink-0" />
              <span className="truncate">2. Intra Konstruksi ({projectLogs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSheet('post')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeSheet === 'post'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="truncate">3. Post Konstruksi</span>
              {isPostSaved && (
                <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-white" title="Sudah Tersimpan" />
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Sheet Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* =============================================================== */}
          {/* SHEET 1: FORMULIR PRE RENOVASI / PRA KONSTRUKSI                 */}
          {/* =============================================================== */}
          {activeSheet === 'pre' && (
            <form onSubmit={handleSavePre} className="space-y-5">
              {/* Info Banner */}
              <div className="rounded-2xl bg-[#0d0f27] border border-cyan-500/30 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                  <div>
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cyan-300">
                      Formulir Pre Renovasi / Pra Konstruksi (Kelas Kewaspadaan {kelas})
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Format standar pengkajian prakonstruksi RSUD Al-Mulk — otomatis dilampirkan setelah Foto Dokumentasi pada Laporan ICRA.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={applyAllPreSurveyDate}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-[11px] font-bold cursor-pointer"
                  >
                    Isi Tanggal Pengesahan
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Tanggal / Waktu Survey</label>
                    <input
                      type="date"
                      value={preForm.tanggal_survey}
                      onChange={(e) => setPreForm((p) => (p ? { ...p, tanggal_survey: e.target.value } : p))}
                      className="w-full bg-[#141738] border border-indigo-800 text-white rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Area</label>
                    <input
                      type="text"
                      value={preForm.area}
                      onChange={(e) => setPreForm((p) => (p ? { ...p, area: e.target.value } : p))}
                      className="w-full bg-[#141738] border border-indigo-800 text-white rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Proyek</label>
                    <input
                      type="text"
                      value={preForm.proyek}
                      onChange={(e) => setPreForm((p) => (p ? { ...p, proyek: e.target.value } : p))}
                      className="w-full bg-[#141738] border border-indigo-800 text-white rounded-xl px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Checklist Table: KEGIATAN | YA | TIDAK | TANGGAL */}
              <div className="overflow-x-auto rounded-2xl border border-indigo-800/60 bg-[#0d0f27]">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#171a42] text-indigo-100 font-black uppercase tracking-wider">
                      <th className="border-b border-r border-indigo-800/60 py-3 px-3 text-left min-w-[300px]">
                        KEGIATAN
                      </th>
                      <th className="border-b border-r border-indigo-800/60 py-3 px-2 text-center w-16">YA</th>
                      <th className="border-b border-r border-indigo-800/60 py-3 px-2 text-center w-20">TIDAK</th>
                      <th className="border-b border-indigo-800/60 py-3 px-3 text-left w-44">KETERANGAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preSections.map((sec) => {
                      const secItems = preForm.items.filter((it) => it.section === sec.section);
                      if (sec.isDirectQuestion && secItems[0]) {
                        const item = secItems[0];
                        return (
                          <tr key={sec.section} className="bg-[#131638]/70 hover:bg-[#191d4a]/60">
                            <td className="border-b border-r border-indigo-900/50 py-2.5 px-3 font-bold text-white">
                              {sec.title}
                            </td>
                            <td className="border-b border-r border-indigo-900/50 py-2 px-2 text-center">
                              <input
                                type="radio"
                                name={`pre-${item.id}`}
                                checked={item.answer === 'YA'}
                                onChange={() => updatePreItem(item.id, { answer: 'YA' })}
                                onClick={() => item.answer === 'YA' && updatePreItem(item.id, { answer: '' })}
                                className="w-4 h-4 accent-cyan-400 cursor-pointer"
                              />
                            </td>
                            <td className="border-b border-r border-indigo-900/50 py-2 px-2 text-center">
                              <input
                                type="radio"
                                name={`pre-${item.id}`}
                                checked={item.answer === 'TIDAK'}
                                onChange={() => updatePreItem(item.id, { answer: 'TIDAK' })}
                                onClick={() => item.answer === 'TIDAK' && updatePreItem(item.id, { answer: '' })}
                                className="w-4 h-4 accent-rose-400 cursor-pointer"
                              />
                            </td>
                            <td className="border-b border-indigo-900/50 py-1.5 px-2">
                              <input
                                type="text"
                                value={item.keterangan ?? item.tanggal ?? ''}
                                onChange={(e) => updatePreItem(item.id, { keterangan: e.target.value })}
                                placeholder="Keterangan..."
                                className="w-full bg-[#121432] border border-indigo-800/60 text-slate-200 rounded-lg px-2 py-1 text-[11px]"
                              />
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <React.Fragment key={sec.section}>
                          <tr className="bg-[#181c45]">
                            <td colSpan={4} className="border-b border-indigo-800/60 py-2.5 px-3 font-black text-cyan-200">
                              <div>{sec.title}</div>
                              {sec.subtitle && (
                                <div className="text-[11px] font-medium text-slate-300 mt-0.5">{sec.subtitle}</div>
                              )}
                            </td>
                          </tr>
                          {secItems.map((item) => (
                            <tr key={item.id} className="hover:bg-white/[0.03]">
                              <td className="border-b border-r border-indigo-900/40 py-2 px-3 pl-6 text-slate-200">
                                <span className="font-bold text-indigo-300 mr-1.5">{item.number}</span>
                                <span>{item.label}</span>
                              </td>
                              <td className="border-b border-r border-indigo-900/40 py-2 px-2 text-center">
                                <input
                                  type="radio"
                                  name={`pre-${item.id}`}
                                  checked={item.answer === 'YA'}
                                  onChange={() => updatePreItem(item.id, { answer: 'YA' })}
                                  onClick={() => item.answer === 'YA' && updatePreItem(item.id, { answer: '' })}
                                  className="w-4 h-4 accent-cyan-400 cursor-pointer"
                                />
                              </td>
                              <td className="border-b border-r border-indigo-900/40 py-2 px-2 text-center">
                                <input
                                  type="radio"
                                  name={`pre-${item.id}`}
                                  checked={item.answer === 'TIDAK'}
                                  onChange={() => updatePreItem(item.id, { answer: 'TIDAK' })}
                                  onClick={() => item.answer === 'TIDAK' && updatePreItem(item.id, { answer: '' })}
                                  className="w-4 h-4 accent-rose-400 cursor-pointer"
                                />
                              </td>
                              <td className="border-b border-indigo-900/40 py-1.5 px-2">
                                <input
                                  type="text"
                                  value={item.keterangan ?? item.tanggal ?? ''}
                                  onChange={(e) => updatePreItem(item.id, { keterangan: e.target.value })}
                                  placeholder="Keterangan..."
                                  className="w-full bg-[#121432] border border-indigo-800/60 text-slate-200 rounded-lg px-2 py-1 text-[11px]"
                                />
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 5-Party Verification Block matching Page 16 of PDF */}
              <div className="rounded-2xl bg-[#0d0f27] border border-indigo-800/60 p-4 space-y-3">
                <h5 className="text-xs font-black uppercase tracking-wider text-indigo-300">
                  Pengesahan Tim Survei Pra Konstruksi (5 Pihak)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {[
                    { key: 'ipsrs', label: 'IPSRS' },
                    { key: 'ppi', label: 'PPI / IPCN' },
                    { key: 'kesling', label: 'Kesling' },
                    { key: 'k3rs', label: 'K3 RS' },
                    { key: 'pihak3', label: 'Pihak ke 3 Pembangunan' },
                  ].map((party) => {
                    const nameKey = `${party.key}_nama` as keyof typeof preForm.signoffs;
                    const dateKey = `${party.key}_tanggal` as keyof typeof preForm.signoffs;
                    return (
                      <div key={party.key} className="grid grid-cols-12 gap-2 items-center bg-[#141738] p-2.5 rounded-xl border border-indigo-900/50">
                        <span className="col-span-4 font-bold text-slate-200">{party.label}</span>
                        <input
                          type="text"
                          placeholder="Nama Petugas"
                          value={preForm.signoffs[nameKey] || ''}
                          onChange={(e) =>
                            setPreForm((p) =>
                              p ? { ...p, signoffs: { ...p.signoffs, [nameKey]: e.target.value } } : p
                            )
                          }
                          className="col-span-4 bg-[#0a0c20] border border-indigo-800/70 text-white rounded-lg px-2.5 py-1.5 text-[11px]"
                        />
                        <input
                          type="date"
                          value={preForm.signoffs[dateKey] || ''}
                          onChange={(e) =>
                            setPreForm((p) =>
                              p ? { ...p, signoffs: { ...p.signoffs, [dateKey]: e.target.value } } : p
                            )
                          }
                          className="col-span-4 bg-[#0a0c20] border border-indigo-800/70 text-slate-200 rounded-lg px-2 py-1.5 text-[11px]"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Simpan Formulir Pra Konstruksi</span>
                </button>
              </div>
            </form>
          )}

          {/* =============================================================== */}
          {/* SHEET 2: FORMULIR PEMANTAUAN INTRA KONSTRUKSI                   */}
          {/* =============================================================== */}
          {activeSheet === 'intra' && (
            <div className="space-y-6">
              <form
                onSubmit={handleSaveIntra}
                className="rounded-2xl bg-[#0d0f27] border border-amber-500/35 p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300">
                      + Catat Formulir Pemantauan Selama Renovasi / Konstruksi (Kategori / Kelas {kelas})
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Daftar ceklist menyesuaikan otomatis dengan Matriks Grading Risiko &amp; Kelas Kewaspadaan {kelas}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={markAllIntraYes}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Centang Semua YA</span>
                  </button>
                </div>

                {/* Header Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Area Renovasi</label>
                    <input
                      type="text"
                      value={intraMeta.area_renovasi}
                      onChange={(e) => setIntraMeta((m) => ({ ...m, area_renovasi: e.target.value }))}
                      placeholder="Contoh: Ruang Rawat Inap Fatimah / Gedung Koperasi"
                      className="w-full bg-[#141738] border border-indigo-800 text-white rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Tanggal Pemantauan</label>
                    <input
                      type="date"
                      value={intraMeta.tanggal_monitoring}
                      onChange={(e) => setIntraMeta((m) => ({ ...m, tanggal_monitoring: e.target.value }))}
                      className="w-full bg-[#141738] border border-indigo-800 text-white rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Jam</label>
                    <input
                      type="time"
                      value={intraMeta.jam_monitoring}
                      onChange={(e) => setIntraMeta((m) => ({ ...m, jam_monitoring: e.target.value }))}
                      className="w-full bg-[#141738] border border-indigo-800 text-white rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Status Kepatuhan</label>
                    <select
                      value={intraMeta.status_kepatuhan}
                      onChange={(e) => setIntraMeta((m) => ({ ...m, status_kepatuhan: e.target.value as any }))}
                      className="w-full bg-[#141738] border border-indigo-800 text-white rounded-xl px-3 py-2"
                    >
                      <option value="Sesuai Standar">Sesuai Standar</option>
                      <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                      <option value="Stop Pekerjaan">Stop Pekerjaan Sementara</option>
                    </select>
                  </div>
                </div>

                {/* Intra Checklist Table: NO | KEGIATAN | YA | TIDAK | N/A | KETERANGAN */}
                <div className="overflow-x-auto rounded-2xl border border-indigo-800/60 bg-[#090b1d]">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#171a42] text-indigo-100 font-black uppercase tracking-wider">
                        <th className="border-b border-r border-indigo-800/60 py-2.5 px-2 text-center w-10">NO</th>
                        <th className="border-b border-r border-indigo-800/60 py-2.5 px-3 text-left min-w-[260px]">
                          KEGIATAN (KATEGORI / KELAS {kelas})
                        </th>
                        <th className="border-b border-r border-indigo-800/60 py-2.5 px-2 text-center w-14">YA</th>
                        <th className="border-b border-r border-indigo-800/60 py-2.5 px-2 text-center w-16">TIDAK</th>
                        <th className="border-b border-r border-indigo-800/60 py-2.5 px-2 text-center w-14">N/A</th>
                        <th className="border-b border-indigo-800/60 py-2.5 px-3 text-left w-44">KETERANGAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {intraItems.map((it) => (
                        <tr key={it.id} className="hover:bg-white/[0.03]">
                          <td className="border-b border-r border-indigo-900/40 py-2 px-2 text-center font-bold text-amber-300">
                            {it.no}
                          </td>
                          <td className="border-b border-r border-indigo-900/40 py-2 px-3 text-slate-200 leading-relaxed">
                            {it.kegiatan}
                          </td>
                          {(['YA', 'TIDAK', 'N/A'] as IntraAnswer[]).map((opt) => (
                            <td key={opt} className="border-b border-r border-indigo-900/40 py-2 px-2 text-center">
                              <input
                                type="radio"
                                name={`intra-${it.id}`}
                                checked={it.answer === opt}
                                onChange={() => updateIntraItem(it.id, { answer: opt })}
                                className={`w-4 h-4 cursor-pointer ${
                                  opt === 'YA'
                                    ? 'accent-emerald-400'
                                    : opt === 'TIDAK'
                                    ? 'accent-rose-400'
                                    : 'accent-slate-400'
                                }`}
                              />
                            </td>
                          ))}
                          <td className="border-b border-indigo-900/40 py-1.5 px-2">
                            <input
                              type="text"
                              value={it.keterangan || ''}
                              onChange={(e) => updateIntraItem(it.id, { keterangan: e.target.value })}
                              placeholder="Catatan..."
                              className="w-full bg-[#121432] border border-indigo-800/60 text-slate-200 rounded-lg px-2 py-1 text-[11px]"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Petugas yang Mengobservasi</label>
                    <input
                      type="text"
                      value={intraMeta.petugas_ipcn}
                      onChange={(e) => setIntraMeta((m) => ({ ...m, petugas_ipcn: e.target.value }))}
                      className="w-full bg-[#141738] border border-indigo-800 text-white rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Temuan Lapangan</label>
                    <input
                      type="text"
                      value={intraMeta.temuan_lapangan}
                      onChange={(e) => setIntraMeta((m) => ({ ...m, temuan_lapangan: e.target.value }))}
                      placeholder="Jika ada celah debu, APD kurang, dll..."
                      className="w-full bg-[#141738] border border-indigo-800 text-white rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Tindakan Koreksi</label>
                    <input
                      type="text"
                      value={intraMeta.tindakan_koreksi}
                      onChange={(e) => setIntraMeta((m) => ({ ...m, tindakan_koreksi: e.target.value }))}
                      placeholder="Instruksi perbaikan langsung..."
                      className="w-full bg-[#141738] border border-indigo-800 text-white rounded-xl px-3 py-2"
                    />
                  </div>
                </div>

                <div className="bg-[#141738] rounded-xl p-3 border border-indigo-900/40">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-2">
                    Foto Dokumentasi Intra Konstruksi (Otomatis Masuk ke Bagian Intra Laporan ICRA)
                  </p>
                  <DocumentationUploader images={monPhotos} setImages={setMonPhotos} hideTitle />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Simpan Formulir Pemantauan Intra</span>
                  </button>
                </div>
              </form>

              {/* Riwayat Formulir Intra Tersimpan */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300">
                  Riwayat Formulir Pemantauan Intra ({projectLogs.length} Kunjungan)
                </h4>
                {projectLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-5 text-center bg-[#0d0f27] rounded-2xl border border-indigo-900/40">
                    Belum ada log formulir pemantauan intra untuk proyek ini.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {projectLogs.map((log) => {
                      const itemsList = Array.isArray(log.intra_items) ? log.intra_items : [];
                      const yaCount = itemsList.filter((x) => x.answer === 'YA').length;
                      const tidakCount = itemsList.filter((x) => x.answer === 'TIDAK').length;
                      return (
                        <div
                          key={log.id}
                          className="rounded-2xl bg-[#0e1028] border border-indigo-900/50 p-3.5 text-xs space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 font-black text-white">
                                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                                {safeFormatDate(log.tanggal_monitoring)} • {log.jam_monitoring}
                              </span>
                              {log.area_renovasi && (
                                <span className="inline-flex items-center gap-1 text-slate-300">
                                  <MapPin className="w-3 h-3 text-amber-400" />
                                  {log.area_renovasi}
                                </span>
                              )}
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
                              onClick={() => handleDeleteIntraLog(log.id)}
                              className="p-1.5 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/30 cursor-pointer"
                              title="Hapus Catatan Intra"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-3 text-[11px] text-slate-300">
                            <span>Petugas: <strong className="text-white">{log.petugas_ipcn}</strong></span>
                            {itemsList.length > 0 ? (
                              <>
                                <span>• Ceklist YA: <strong className="text-emerald-300">{yaCount}/{itemsList.length}</strong></span>
                                {tidakCount > 0 && (
                                  <span>• TIDAK: <strong className="text-rose-300">{tidakCount}</strong></span>
                                )}
                              </>
                            ) : (
                              <>
                                <span>• Barier: <strong>{log.barier_tertutup ? 'Ya' : 'Tidak'}</strong></span>
                                <span>• HEPA: <strong>{log.tekanan_negatif_hepa}</strong></span>
                                <span>• APD: <strong>{log.apd_pekerja ? 'Ya' : 'Tidak'}</strong></span>
                              </>
                            )}
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
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* SHEET 3: FORMULIR POST RENOVASI / POST KONSTRUKSI               */}
          {/* =============================================================== */}
          {activeSheet === 'post' && (
            <form onSubmit={handleSavePost} className="space-y-5">
              {/* Info Banner */}
              <div className="rounded-2xl bg-[#0d0f27] border border-emerald-500/30 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                  <div>
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-300">
                      Formulir Post Renovasi / Pasca Konstruksi (Kelas Kewaspadaan {kelas})
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Format standar pengkajian pascakonstruksi RSUD Al-Mulk — otomatis dilampirkan di bagian akhir Laporan ICRA.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={applyAllPostSurveyDate}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold cursor-pointer"
                  >
                    Isi Tanggal Pengesahan
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Tanggal / Waktu Survey</label>
                    <input
                      type="date"
                      value={postForm.tanggal_survey}
                      onChange={(e) => setPostForm((p) => (p ? { ...p, tanggal_survey: e.target.value } : p))}
                      className="w-full bg-[#141738] border border-indigo-800 text-white rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Area</label>
                    <input
                      type="text"
                      value={postForm.area}
                      onChange={(e) => setPostForm((p) => (p ? { ...p, area: e.target.value } : p))}
                      className="w-full bg-[#141738] border border-indigo-800 text-white rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Proyek</label>
                    <input
                      type="text"
                      value={postForm.proyek}
                      onChange={(e) => setPostForm((p) => (p ? { ...p, proyek: e.target.value } : p))}
                      className="w-full bg-[#141738] border border-indigo-800 text-white rounded-xl px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Checklist Table: KEGIATAN | YA | TIDAK | KETERANGAN */}
              <div className="overflow-x-auto rounded-2xl border border-indigo-800/60 bg-[#0d0f27]">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#171a42] text-indigo-100 font-black uppercase tracking-wider">
                      <th className="border-b border-r border-indigo-800/60 py-3 px-3 text-left min-w-[300px]">
                        KEGIATAN
                      </th>
                      <th className="border-b border-r border-indigo-800/60 py-3 px-2 text-center w-16">YA</th>
                      <th className="border-b border-r border-indigo-800/60 py-3 px-2 text-center w-20">TIDAK</th>
                      <th className="border-b border-indigo-800/60 py-3 px-3 text-left w-44">KETERANGAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {postSections.map((sec) => {
                      const secItems = postForm.items.filter((it) => it.section === sec.section);
                      return (
                        <React.Fragment key={sec.section}>
                          <tr className="bg-[#181c45]">
                            <td colSpan={4} className="border-b border-indigo-800/60 py-2.5 px-3 font-black text-emerald-300">
                              {sec.title}
                            </td>
                          </tr>
                          {secItems.map((item) => (
                            <tr key={item.id} className="hover:bg-white/[0.03]">
                              <td className="border-b border-r border-indigo-900/40 py-2 px-3 pl-6 text-slate-200 align-top">
                                <div>
                                  <span className="font-bold text-indigo-300 mr-1.5">{item.number}</span>
                                  <span>{item.label}</span>
                                </div>
                                {item.subNotes && item.subNotes.length > 0 && (
                                  <ul className="list-disc pl-5 mt-1 space-y-0.5 text-[11px] text-slate-400">
                                    {item.subNotes.map((sn, sIdx) => (
                                      <li key={sIdx}>{sn}</li>
                                    ))}
                                  </ul>
                                )}
                              </td>
                              <td className="border-b border-r border-indigo-900/40 py-2 px-2 text-center">
                                <input
                                  type="radio"
                                  name={`post-${item.id}`}
                                  checked={item.answer === 'YA'}
                                  onChange={() => updatePostItem(item.id, { answer: 'YA' })}
                                  onClick={() => item.answer === 'YA' && updatePostItem(item.id, { answer: '' })}
                                  className="w-4 h-4 accent-emerald-400 cursor-pointer"
                                />
                              </td>
                              <td className="border-b border-r border-indigo-900/40 py-2 px-2 text-center">
                                <input
                                  type="radio"
                                  name={`post-${item.id}`}
                                  checked={item.answer === 'TIDAK'}
                                  onChange={() => updatePostItem(item.id, { answer: 'TIDAK' })}
                                  onClick={() => item.answer === 'TIDAK' && updatePostItem(item.id, { answer: '' })}
                                  className="w-4 h-4 accent-rose-400 cursor-pointer"
                                />
                              </td>
                              <td className="border-b border-indigo-900/40 py-1.5 px-2">
                                <input
                                  type="text"
                                  value={item.keterangan ?? item.tanggal ?? ''}
                                  onChange={(e) => updatePostItem(item.id, { keterangan: e.target.value })}
                                  placeholder="Keterangan..."
                                  className="w-full bg-[#121432] border border-indigo-800/60 text-slate-200 rounded-lg px-2 py-1 text-[11px]"
                                />
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Post Photos Uploader */}
              <div className="rounded-2xl bg-[#0d0f27] border border-emerald-500/30 p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-300">
                    Foto Dokumentasi Post Renovasi / Terminal Cleaning (Otomatis Masuk Laporan ICRA)
                  </p>
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={markCompleted}
                      onChange={(e) => setMarkCompleted(e.target.checked)}
                      className="w-4 h-4 accent-emerald-400"
                    />
                    <span>Tandai Status Proyek: SELESAI</span>
                  </label>
                </div>
                <DocumentationUploader images={postPhotos} setImages={setPostPhotos} maxImages={6} hideTitle />
              </div>

              {/* 5-Party Verification Block matching Page 20 of PDF */}
              <div className="rounded-2xl bg-[#0d0f27] border border-indigo-800/60 p-4 space-y-3">
                <h5 className="text-xs font-black uppercase tracking-wider text-indigo-300">
                  Pengesahan Tim Evaluasi Post Konstruksi (5 Pihak)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {[
                    { key: 'ipsrs', label: 'IPSRS' },
                    { key: 'ppi', label: 'PPI / IPCN' },
                    { key: 'kesling', label: 'Kesling' },
                    { key: 'k3rs', label: 'K3 RS' },
                    { key: 'pihak3', label: 'Pihak ke 3 Pembangunan' },
                  ].map((party) => {
                    const nameKey = `${party.key}_nama` as keyof typeof postForm.signoffs;
                    const dateKey = `${party.key}_tanggal` as keyof typeof postForm.signoffs;
                    return (
                      <div key={party.key} className="grid grid-cols-12 gap-2 items-center bg-[#141738] p-2.5 rounded-xl border border-indigo-900/50">
                        <span className="col-span-4 font-bold text-slate-200">{party.label}</span>
                        <input
                          type="text"
                          placeholder="Nama Petugas"
                          value={postForm.signoffs[nameKey] || ''}
                          onChange={(e) =>
                            setPostForm((p) =>
                              p ? { ...p, signoffs: { ...p.signoffs, [nameKey]: e.target.value } } : p
                            )
                          }
                          className="col-span-4 bg-[#0a0c20] border border-indigo-800/70 text-white rounded-lg px-2.5 py-1.5 text-[11px]"
                        />
                        <input
                          type="date"
                          value={postForm.signoffs[dateKey] || ''}
                          onChange={(e) =>
                            setPostForm((p) =>
                              p ? { ...p, signoffs: { ...p.signoffs, [dateKey]: e.target.value } } : p
                            )
                          }
                          className="col-span-4 bg-[#0a0c20] border border-indigo-800/70 text-slate-200 rounded-lg px-2 py-1.5 text-[11px]"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Simpan Formulir Post Konstruksi</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

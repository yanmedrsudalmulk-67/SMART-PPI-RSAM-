import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, FileCheck2, ShieldCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import F4Page from '@/components/reports/official/F4Page';
import OfficialHeaderKop from '@/components/reports/official/OfficialHeaderKop';
import ZoomableReportViewer from '@/components/reports/ZoomableReportViewer';
import PdfDownloadButton from '@/components/reports/PdfDownloadButton';
import {
  IcraKonstruksiItem,
  IcraMonitoringItem,
  CONSTRUCTION_TYPES,
  PATIENT_RISK_GROUPS,
  CONSTRUCTION_CLASS_CONTROLS,
} from '@/utils/icraData';
import { normalizeImageUrl } from '@/utils/imageHelper';
import { useAppContext } from '@/components/Providers';

interface IcraConstructionPermitModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: IcraKonstruksiItem | null;
  monitoringLogs: IcraMonitoringItem[];
}

function safeFormatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'dd MMMM yyyy', { locale: idLocale });
  } catch {
    return dateStr;
  }
}

export default function IcraConstructionPermitModal({
  isOpen,
  onClose,
  project,
  monitoringLogs,
}: IcraConstructionPermitModalProps) {
  const { hospitalLogoUrl } = useAppContext();

  const sortedLogs = useMemo(() => {
    return [...monitoringLogs].sort((a, b) =>
      `${b.tanggal_monitoring} ${b.jam_monitoring}`.localeCompare(`${a.tanggal_monitoring} ${a.jam_monitoring}`)
    );
  }, [monitoringLogs]);

  const allPhotos = useMemo(() => {
    if (!project) return [];
    const list: Array<{ label: string; url: string }> = [];
    (project.foto_sebelum || []).forEach((u, i) => {
      list.push({ label: `Pra Konstruksi (${i + 1})`, url: normalizeImageUrl(u) });
    });
    sortedLogs.forEach((log) => {
      (log.foto_monitoring || []).forEach((u, i) => {
        list.push({
          label: `Monitoring ${safeFormatDate(log.tanggal_monitoring)} (${i + 1})`,
          url: normalizeImageUrl(u),
        });
      });
    });
    (project.foto_sesudah || []).forEach((u, i) => {
      list.push({ label: `Sesudah Selesai (${i + 1})`, url: normalizeImageUrl(u) });
    });
    return list;
  }, [project, sortedLogs]);

  const hasAppendix = sortedLogs.length > 0 || allPhotos.length > 0;
  const totalPages = hasAppendix ? 2 : 1;

  if (!isOpen || !project) return null;

  const typeInfo = CONSTRUCTION_TYPES.find((t) => t.code === project.tipe_konstruksi);
  const riskInfo = PATIENT_RISK_GROUPS.find((r) => r.code === project.kelompok_risiko);
  const classInfo = CONSTRUCTION_CLASS_CONTROLS[project.kelas_tindakan];
  const targetId = 'icra-construction-permit-sheet';
  const todayStr = format(new Date(), 'dd MMMM yyyy', { locale: idLocale });

  const classColorClass =
    project.kelas_tindakan === 'IV'
      ? 'bg-rose-100 text-rose-900 border-rose-700'
      : project.kelas_tindakan === 'III'
      ? 'bg-orange-100 text-orange-900 border-orange-700'
      : project.kelas_tindakan === 'II'
      ? 'bg-amber-100 text-amber-900 border-amber-700'
      : 'bg-emerald-100 text-emerald-900 border-emerald-700';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="w-full max-w-[1200px] h-[94vh] bg-[#0e112a] border border-indigo-500/35 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
      >
        {/* Top Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#121536] border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                PRATINJAU SURAT IZIN KERJA PPI (ICRA PERMIT)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <PdfDownloadButton
              targetElementId={targetId}
              filename={`Izin_Kerja_ICRA_${(project.nomor_izin || project.nama_proyek).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
              title="Unduh PDF Surat Izin Kerja PPI Format F4 (Margin 2,5 cm)"
              orientation="portrait"
              paperSize="f4"
              margin={0}
              size="md"
            />
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Viewer F4 Portrait (Margin 2,5 cm Keliling) */}
        <div className="flex-1 overflow-hidden bg-slate-900/95">
          <ZoomableReportViewer reportId={targetId} showToolbar={false} className="h-full">
            <div id={targetId} data-orientation="portrait" className="w-full flex flex-col items-center py-4">
              {/* HALAMAN 1: SURAT IZIN KERJA PPI (ICRA PERMIT) */}
              <F4Page
                orientation="portrait"
                pageNumber={1}
                totalPages={totalPages}
                showFooterMeta={true}
              >
                <OfficialHeaderKop theme="light" />

                <div className="text-center mb-3">
                  <h2 className="text-[11.5pt] font-black uppercase underline tracking-tight text-black">
                    SURAT IZIN KERJA PENGENDALIAN INFEKSI KONSTRUKSI / RENOVASI
                  </h2>
                  <p className="text-[9pt] font-bold text-slate-700 mt-0.5">
                    INFECTION CONTROL RISK ASSESSMENT (ICRA) CONSTRUCTION PERMIT • NOMOR: {project.nomor_izin || '-'}
                  </p>
                </div>

                {/* Identitas Proyek */}
                <table className="w-full border-collapse border border-black text-[8.5pt] leading-snug text-black mb-3">
                  <tbody>
                    <tr>
                      <td className="border border-black bg-slate-100 font-bold px-2 py-1.5 w-[28%]" style={{ backgroundColor: '#f1f5f9' }}>
                        Nama Proyek / Pekerjaan
                      </td>
                      <td className="border border-black px-2 py-1.5 font-bold" colSpan={3}>
                        {project.nama_proyek}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black bg-slate-100 font-bold px-2 py-1.5" style={{ backgroundColor: '#f1f5f9' }}>
                        Lokasi Ruangan / Unit
                      </td>
                      <td className="border border-black px-2 py-1.5 w-[27%]">{project.lokasi_area}</td>
                      <td className="border border-black bg-slate-100 font-bold px-2 py-1.5 w-[20%]" style={{ backgroundColor: '#f1f5f9' }}>
                        Tanggal Pelaksanaan
                      </td>
                      <td className="border border-black px-2 py-1.5 w-[25%]">
                        {safeFormatDate(project.tgl_mulai)} s/d {safeFormatDate(project.tgl_selesai_estimasi)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black bg-slate-100 font-bold px-2 py-1.5" style={{ backgroundColor: '#f1f5f9' }}>
                        Pelaksana / Kontraktor
                      </td>
                      <td className="border border-black px-2 py-1.5">{project.kontraktor_pelaksana}</td>
                      <td className="border border-black bg-slate-100 font-bold px-2 py-1.5" style={{ backgroundColor: '#f1f5f9' }}>
                        PJ Proyek / Pengawas
                      </td>
                      <td className="border border-black px-2 py-1.5">{project.pj_proyek}</td>
                    </tr>
                    <tr>
                      <td className="border border-black bg-slate-100 font-bold px-2 py-1.5" style={{ backgroundColor: '#f1f5f9' }}>
                        Area Terdampak Sekitar
                      </td>
                      <td className="border border-black px-2 py-1.5" colSpan={3}>
                        {project.area_terdampak || '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Hasil Matriks & Kelas Tindakan */}
                <div className="grid grid-cols-12 gap-2 mb-3 text-[8.5pt] text-black">
                  <div className="col-span-4 border border-black p-2 bg-slate-50">
                    <div className="text-[7.5pt] font-bold uppercase text-slate-600">Tipe Aktivitas Konstruksi</div>
                    <div className="font-black text-[9.5pt] mt-0.5">{typeInfo?.title || `Tipe ${project.tipe_konstruksi}`}</div>
                    <div className="text-[7.5pt] text-slate-700 mt-0.5 leading-tight">{typeInfo?.shortDesc}</div>
                  </div>
                  <div className="col-span-4 border border-black p-2 bg-slate-50">
                    <div className="text-[7.5pt] font-bold uppercase text-slate-600">Kelompok Risiko Pasien</div>
                    <div className="font-black text-[9.5pt] mt-0.5">{riskInfo?.title || `Kelompok ${project.kelompok_risiko}`}</div>
                    <div className="text-[7.5pt] text-slate-700 mt-0.5 leading-tight">{riskInfo?.areas}</div>
                  </div>
                  <div className={`col-span-4 border-2 p-2 flex flex-col justify-center items-center text-center ${classColorClass}`}>
                    <div className="text-[7.5pt] font-bold uppercase tracking-wider">Penetapan Izin Kerja</div>
                    <div className="text-[14pt] font-black leading-tight mt-0.5">
                      KELAS {project.kelas_tindakan}
                    </div>
                    <div className="text-[7.5pt] font-bold mt-0.5">
                      Status: {project.status_proyek}
                    </div>
                  </div>
                </div>

                {/* Daftar Persyaratan Wajib Pengendalian Infeksi */}
                <div className="border border-black mb-3 text-black">
                  <div className="bg-slate-100 border-b border-black px-2.5 py-1.5 font-extrabold text-[8.5pt] uppercase" style={{ backgroundColor: '#f1f5f9' }}>
                    Persyaratan Pengendalian Infeksi Wajib Dipatuhi ({classInfo.title})
                  </div>
                  <div className="p-2.5 space-y-1.5 text-[8.2pt] leading-snug">
                    {project.checklist_pengendalian.map((chk, idx) => {
                      const isDuring = chk.label.includes('[Selama Konstruksi]');
                      const isAfter = chk.label.includes('[Setelah Konstruksi]');
                      const cleanLabel = chk.label.replace(/^\[(Selama|Setelah) Konstruksi\]\s*/i, '');
                      return (
                        <div key={chk.id || idx} className="flex items-start gap-2">
                          <span className="inline-flex items-center justify-center w-4 h-4 border border-black font-black text-[8pt] shrink-0 mt-0.5">
                            {chk.checked ? '✓' : ''}
                          </span>
                          <span className="flex-1 text-justify">
                            {isDuring && <strong className="text-slate-900 mr-1.5">[Selama Proyek]</strong>}
                            {isAfter && <strong className="text-slate-900 mr-1.5">[Setelah Proyek]</strong>}
                            <span>{cleanLabel}</span>
                          </span>
                        </div>
                      );
                    })}
                    {project.persyaratan_khusus && (
                      <div className="mt-2 pt-1.5 border-t border-dashed border-slate-400 text-[8pt]">
                        <strong>Instruksi Tambahan IPCN:</strong> {project.persyaratan_khusus}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pernyataan Komitmen & Pengesahan */}
                <div className="text-[8pt] text-black italic mb-3 text-justify leading-snug">
                  Dengan ditandatanganinya izin kerja ini, pelaksana proyek/IPSRS menyatakan sanggup mematuhi seluruh prosedur pencegahan dan pengendalian infeksi di atas selama pekerjaan berlangsung hingga selesai dan dinyatakan lulus inspeksi oleh Tim PPI.
                </div>

                <div className="mt-auto pt-1 text-[8.5pt] text-black">
                  <p className="text-right mb-2">Sukabumi, {todayStr}</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col items-center">
                      <p className="font-bold">Pelaksana / IPSRS,</p>
                      <div className="h-14 flex items-center justify-center my-1">
                        {project.ttd_pelaksana && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={project.ttd_pelaksana} alt="TTD Pelaksana" className="max-h-14 object-contain" />
                        )}
                      </div>
                      <p className="font-bold underline">{project.pj_proyek || '.......................'}</p>
                      <p className="text-[7.5pt]">{project.kontraktor_pelaksana}</p>
                    </div>

                    <div className="flex flex-col items-center">
                      <p className="font-bold">Mengetahui K3RS,</p>
                      <div className="h-14 flex items-center justify-center my-1" />
                      <p className="font-bold underline">{project.nama_k3rs || 'Tim K3RS RSUD Al-Mulk'}</p>
                      <p className="text-[7.5pt]">Keselamatan & Kesehatan Kerja RS</p>
                    </div>

                    <div className="flex flex-col items-center">
                      <p className="font-bold">Menyetujui (Tim PPI),</p>
                      <div className="h-14 flex items-center justify-center my-1">
                        {project.ttd_ipcn && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={project.ttd_ipcn} alt="TTD IPCN" className="max-h-14 object-contain" />
                        )}
                      </div>
                      <p className="font-bold underline">{project.nama_ipcn || 'Adi Tresa Purnama, A.M.Kep'}</p>
                      <p className="text-[7.5pt]">IPCN UOBK RSUD Al-Mulk</p>
                    </div>
                  </div>
                </div>
              </F4Page>

              {/* HALAMAN 2: LAMPIRAN LOG PENGAWASAN HARIAN & FOTO DOKUMENTASI */}
              {hasAppendix && (
                <F4Page
                  orientation="portrait"
                  pageNumber={2}
                  totalPages={totalPages}
                  showFooterMeta={true}
                >
                  {/* Running Header */}
                  <div className="border-b-[1.5px] border-black pb-1.5 mb-3 flex items-center justify-between text-[8pt] text-black">
                    <div className="flex items-center gap-2">
                      {hospitalLogoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={hospitalLogoUrl} alt="Logo RS" className="w-5 h-5 object-contain" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-black" />
                      )}
                      <span className="font-extrabold uppercase">TIM PPI • UOBK RSUD AL-MULK KOTA SUKABUMI</span>
                    </div>
                    <span className="italic font-semibold">Izin No: {project.nomor_izin || '-'}</span>
                  </div>

                  <div className="text-center mb-3">
                    <h3 className="text-[10.5pt] font-black uppercase underline text-black">
                      LAMPIRAN: PENGAWASAN HARIAN & DOKUMENTASI ICRA KONSTRUKSI
                    </h3>
                    <p className="text-[8.5pt] font-bold text-slate-700 mt-0.5">
                      Proyek: {project.nama_proyek} ({project.lokasi_area})
                    </p>
                  </div>

                  {/* Tabel Log Pengawasan Harian */}
                  {sortedLogs.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-[8.5pt] font-black uppercase mb-1.5 text-black">
                        I. Riwayat Inspeksi & Monitoring Harian IPCN
                      </h4>
                      <table className="w-full border-collapse border border-black text-[7.5pt] leading-tight text-black">
                        <thead>
                          <tr className="bg-slate-100 font-extrabold text-center" style={{ backgroundColor: '#f1f5f9' }}>
                            <th className="border border-black px-1 py-1.5 w-[13%]">Tgl / Jam</th>
                            <th className="border border-black px-1 py-1.5 w-[8%]">Barier</th>
                            <th className="border border-black px-1 py-1.5 w-[8%]">HEPA/Neg</th>
                            <th className="border border-black px-1 py-1.5 w-[8%]">Keset</th>
                            <th className="border border-black px-1 py-1.5 w-[8%]">Bersih</th>
                            <th className="border border-black px-1 py-1.5 w-[8%]">Limbah</th>
                            <th className="border border-black px-1 py-1.5 w-[7%]">APD</th>
                            <th className="border border-black px-1.5 py-1.5 w-[25%]">Temuan & Koreksi</th>
                            <th className="border border-black px-1 py-1.5 w-[15%]">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedLogs.slice(0, 12).map((log) => (
                            <tr key={log.id} className="align-top">
                              <td className="border border-black px-1 py-1 text-center">
                                <div className="font-bold">{safeFormatDate(log.tanggal_monitoring)}</div>
                                <div className="text-[7pt] text-slate-600">{log.jam_monitoring}</div>
                              </td>
                              <td className="border border-black px-1 py-1 text-center font-bold">
                                {log.barier_tertutup ? 'Ya' : 'Tdk'}
                              </td>
                              <td className="border border-black px-1 py-1 text-center font-bold">
                                {log.tekanan_negatif_hepa}
                              </td>
                              <td className="border border-black px-1 py-1 text-center font-bold">
                                {log.keset_basah_pintu ? 'Ya' : 'Tdk'}
                              </td>
                              <td className="border border-black px-1 py-1 text-center font-bold">
                                {log.area_sekitar_bersih ? 'Ya' : 'Tdk'}
                              </td>
                              <td className="border border-black px-1 py-1 text-center font-bold">
                                {log.jalur_limbah_tertutup ? 'Ya' : 'Tdk'}
                              </td>
                              <td className="border border-black px-1 py-1 text-center font-bold">
                                {log.apd_pekerja ? 'Ya' : 'Tdk'}
                              </td>
                              <td className="border border-black px-1.5 py-1 text-left">
                                {log.temuan_lapangan && <div><strong>T:</strong> {log.temuan_lapangan}</div>}
                                {log.tindakan_koreksi && <div><strong>K:</strong> {log.tindakan_koreksi}</div>}
                                {!log.temuan_lapangan && !log.tindakan_koreksi && '-'}
                              </td>
                              <td className="border border-black px-1 py-1 text-center font-bold">
                                {log.status_kepatuhan}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Foto Dokumentasi Lapangan */}
                  {allPhotos.length > 0 && (
                    <div>
                      <h4 className="text-[8.5pt] font-black uppercase mb-2 text-black">
                        II. Dokumentasi Visual Kondisi Area Konstruksi
                      </h4>
                      <div className="grid grid-cols-3 gap-2.5">
                        {allPhotos.slice(0, 6).map((ph, idx) => (
                          <div key={idx} className="border border-black p-1.5 bg-slate-50 flex flex-col items-center">
                            <div className="w-full h-28 flex items-center justify-center bg-white overflow-hidden border border-slate-300">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={ph.url}
                                alt={ph.label}
                                crossOrigin="anonymous"
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <span className="text-[7pt] font-bold text-center mt-1 text-black leading-tight">
                              {ph.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </F4Page>
              )}
            </div>
          </ZoomableReportViewer>
        </div>
      </motion.div>
    </div>
  );
}

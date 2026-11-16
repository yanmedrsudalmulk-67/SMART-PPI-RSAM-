import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, FileText, ShieldCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import F4Page from '@/components/reports/official/F4Page';
import OfficialHeaderKop from '@/components/reports/official/OfficialHeaderKop';
import ZoomableReportViewer from '@/components/reports/ZoomableReportViewer';
import PdfDownloadButton from '@/components/reports/PdfDownloadButton';
import {
  KlbEventItem,
  KlbCaseItem,
  EpiCurvePoint,
  calculateAttackRate,
  buildEpiCurveData,
} from '@/utils/klbData';
import { normalizeImageUrl } from '@/utils/imageHelper';
import { useAppContext } from '@/components/Providers';

interface KlbReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: KlbEventItem | null;
  cases: KlbCaseItem[];
}

function safeFmtDate(d?: string): string {
  if (!d) return '-';
  try {
    return format(parseISO(d), 'dd MMMM yyyy', { locale: idLocale });
  } catch {
    return d;
  }
}

/** Deterministic SVG Epi-Curve for crisp 1:1 WYSIWYG F4 PDF export */
function StaticSvgEpiCurve({ data }: { data: EpiCurvePoint[] }) {
  if (data.length === 0) {
    return (
      <div className="border border-dashed border-slate-400 p-4 text-center text-[8.5pt] text-slate-600 italic bg-slate-50">
        Kurva epidemiologi akan otomatis terbentuk setelah data kasus (Line Listing) ditambahkan.
      </div>
    );
  }

  const width = 560;
  const height = 165;
  const padLeft = 36;
  const padRight = 16;
  const padTop = 20;
  const padBottom = 38;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxVal = Math.max(2, ...data.map((d) => d.total));
  const stepWidth = plotW / Math.max(1, data.length);
  const barW = Math.min(28, Math.max(6, stepWidth * 0.65));

  const yTicks = Array.from(new Set([0, Math.ceil(maxVal / 2), maxVal])).sort((a, b) => a - b);

  return (
    <div className="border border-black bg-white p-2">
      <div className="flex items-center justify-between text-[7.5pt] font-bold mb-1 px-1">
        <span>GRAFIK KURVA EPIDEMIOLOGI (JUMLAH KASUS PER TANGGAL ONSET)</span>
        <span className="flex items-center gap-3 font-normal">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 bg-[#1d4ed8] border border-black" /> Pasien
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 bg-[#d97706] border border-black" /> Staf / Petugas
          </span>
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block">
        {/* Gridlines & Y Ticks */}
        {yTicks.map((tick) => {
          const y = padTop + plotH - (tick / maxVal) * plotH;
          return (
            <g key={tick}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#cbd5e1" strokeWidth="0.7" />
              <text x={padLeft - 5} y={y + 3} textAnchor="end" fontSize="8" fill="#0f172a">
                {tick}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + plotH} stroke="#000000" strokeWidth="1.2" />
        <line
          x1={padLeft}
          y1={padTop + plotH}
          x2={width - padRight}
          y2={padTop + plotH}
          stroke="#000000"
          strokeWidth="1.2"
        />

        {/* Stacked Bars */}
        {data.map((pt, idx) => {
          const cx = padLeft + idx * stepWidth + stepWidth / 2;
          const x = cx - barW / 2;
          const totalH = (pt.total / maxVal) * plotH;
          const pasienH = (pt.pasien / maxVal) * plotH;
          const stafH = (pt.staf / maxVal) * plotH;
          const baseBottom = padTop + plotH;

          // Thin label spacing if many dates
          const showLabel = data.length <= 14 || idx % Math.ceil(data.length / 10) === 0 || idx === data.length - 1;

          return (
            <g key={pt.date}>
              {pt.pasien > 0 && (
                <rect
                  x={x}
                  y={baseBottom - pasienH}
                  width={barW}
                  height={pasienH}
                  fill="#1d4ed8"
                  stroke="#000000"
                  strokeWidth="0.5"
                />
              )}
              {pt.staf > 0 && (
                <rect
                  x={x}
                  y={baseBottom - pasienH - stafH}
                  width={barW}
                  height={stafH}
                  fill="#d97706"
                  stroke="#000000"
                  strokeWidth="0.5"
                />
              )}
              {pt.total > 0 && (
                <text
                  x={cx}
                  y={baseBottom - totalH - 3}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="bold"
                  fill="#000000"
                >
                  {pt.total}
                </text>
              )}
              {showLabel && (
                <text
                  x={cx}
                  y={baseBottom + 12}
                  textAnchor="middle"
                  fontSize="7"
                  fill="#334155"
                  transform={data.length > 10 ? `rotate(-25 ${cx} ${baseBottom + 12})` : undefined}
                >
                  {pt.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function KlbReportModal({ isOpen, onClose, event, cases }: KlbReportModalProps) {
  const { hospitalLogoUrl } = useAppContext();

  const sortedCases = useMemo(() => {
    return [...cases].sort((a, b) => a.tanggal_onset.localeCompare(b.tanggal_onset));
  }, [cases]);

  const epiCurveData = useMemo(() => buildEpiCurveData(sortedCases), [sortedCases]);

  const attackRate = useMemo(() => {
    if (!event) return { percent: 0, formatted: '0,0%' };
    return calculateAttackRate(sortedCases.length, event.populasi_berisiko);
  }, [event, sortedCases.length]);

  const pasienCount = sortedCases.filter((c) => c.kategori_subjek === 'Pasien').length;
  const stafCount = sortedCases.filter((c) => c.kategori_subjek === 'Petugas / Staf').length;

  if (!isOpen || !event) return null;

  const targetId = 'klb-official-report-sheet';
  const totalPages = 3;
  const todayStr = format(new Date(), 'dd MMMM yyyy', { locale: idLocale });

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
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
              PRATINJAU LAPORAN INVESTIGASI KLB PPI
            </h3>
          </div>

          <div className="flex items-center gap-2.5">
            <PdfDownloadButton
              targetElementId={targetId}
              filename={`Laporan_Investigasi_KLB_${(event.nomor_klb || event.judul_kejadian).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
              title="Unduh PDF Resmi Laporan Investigasi KLB Format F4 (Margin 2,5 cm)"
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
              {/* HALAMAN 1: IDENTITAS KLB, ATTACK RATE & KURVA EPIDEMIOLOGI */}
              <F4Page orientation="portrait" pageNumber={1} totalPages={totalPages} showFooterMeta={true}>
                <OfficialHeaderKop theme="light" />

                <div className="text-center mb-3">
                  <h2 className="text-[11.5pt] font-black uppercase underline tracking-tight text-black">
                    LAPORAN INVESTIGASI & PENANGGULANGAN KEJADIAN LUAR BIASA (KLB)
                  </h2>
                  <p className="text-[8.5pt] font-bold text-slate-700 mt-0.5">
                    KOMITE / TIM PENCEGAHAN DAN PENGENDALIAN INFEKSI • NOMOR: {event.nomor_klb || '-'}
                  </p>
                </div>

                {/* Tabel Identitas Kejadian */}
                <table className="w-full border-collapse border border-black text-[8.5pt] leading-snug text-black mb-3">
                  <tbody>
                    <tr>
                      <td className="border border-black bg-slate-100 font-bold px-2 py-1.5 w-[26%]" style={{ backgroundColor: '#f1f5f9' }}>
                        Judul / Klaster Kejadian
                      </td>
                      <td className="border border-black px-2 py-1.5 font-bold" colSpan={3}>
                        {event.judul_kejadian}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black bg-slate-100 font-bold px-2 py-1.5" style={{ backgroundColor: '#f1f5f9' }}>
                        Jenis Infeksi / Agen
                      </td>
                      <td className="border border-black px-2 py-1.5 w-[28%]">{event.jenis_agen}</td>
                      <td className="border border-black bg-slate-100 font-bold px-2 py-1.5 w-[21%]" style={{ backgroundColor: '#f1f5f9' }}>
                        Unit / Ruangan Terdampak
                      </td>
                      <td className="border border-black px-2 py-1.5 w-[25%] font-bold">{event.unit_terdampak}</td>
                    </tr>
                    <tr>
                      <td className="border border-black bg-slate-100 font-bold px-2 py-1.5" style={{ backgroundColor: '#f1f5f9' }}>
                        Tanggal Terdeteksi
                      </td>
                      <td className="border border-black px-2 py-1.5">{safeFmtDate(event.tanggal_terdeteksi)}</td>
                      <td className="border border-black bg-slate-100 font-bold px-2 py-1.5" style={{ backgroundColor: '#f1f5f9' }}>
                        Tanggal Berakhir / Tutup
                      </td>
                      <td className="border border-black px-2 py-1.5">
                        {event.tanggal_berakhir ? safeFmtDate(event.tanggal_berakhir) : 'Dalam Pemantauan'}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black bg-slate-100 font-bold px-2 py-1.5" style={{ backgroundColor: '#f1f5f9' }}>
                        Status Penanganan KLB
                      </td>
                      <td className="border border-black px-2 py-1.5 font-bold">{event.status_klb}</td>
                      <td className="border border-black bg-slate-100 font-bold px-2 py-1.5" style={{ backgroundColor: '#f1f5f9' }}>
                        Notifikasi W1 (Direktur/Dinkes)
                      </td>
                      <td className="border border-black px-2 py-1.5 font-bold">
                        {event.lapor_w1_dinkes ? 'Sudah Dilaporkan (< 24 Jam)' : 'Internal / Dalam Proses'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Ringkasan KPI Epidemiologi */}
                <div className="grid grid-cols-4 gap-2 mb-3 text-[8.5pt] text-black">
                  <div className="border border-black bg-slate-50 p-2 text-center">
                    <span className="block text-[7pt] font-bold uppercase text-slate-600">Total Kasus Terdampak</span>
                    <span className="font-black text-[12pt]">{sortedCases.length} Orang</span>
                    <span className="block text-[7pt] text-slate-600">
                      ({pasienCount} Pasien • {stafCount} Staf)
                    </span>
                  </div>
                  <div className="border border-black bg-slate-50 p-2 text-center">
                    <span className="block text-[7pt] font-bold uppercase text-slate-600">Populasi Berisiko</span>
                    <span className="font-black text-[12pt]">{event.populasi_berisiko} Orang</span>
                    <span className="block text-[7pt] text-slate-600">Total Terpapar di Unit</span>
                  </div>
                  <div className="border border-black bg-rose-50 p-2 text-center">
                    <span className="block text-[7pt] font-bold uppercase text-rose-800">Attack Rate (AR)</span>
                    <span className="font-black text-[12pt] text-rose-800">{attackRate.formatted}</span>
                    <span className="block text-[7pt] text-rose-700">Kasus / Populasi Berisiko</span>
                  </div>
                  <div className="border border-black bg-emerald-50 p-2 text-center">
                    <span className="block text-[7pt] font-bold uppercase text-emerald-800">Langkah Intervensi</span>
                    <span className="font-black text-[12pt] text-emerald-800">
                      {event.checklist_intervensi.filter((c) => c.done).length} / {event.checklist_intervensi.length}
                    </span>
                    <span className="block text-[7pt] text-emerald-700">Tindakan Selesai</span>
                  </div>
                </div>

                {/* Kurva Epidemiologi SVG */}
                <div className="mb-3">
                  <StaticSvgEpiCurve data={epiCurveData} />
                </div>

                {/* Kronologi & Hasil Lab */}
                <div className="space-y-2.5 text-[8.5pt] text-black">
                  <div className="border border-black p-2.5">
                    <h4 className="font-black uppercase text-[8pt] border-b border-slate-300 pb-1 mb-1">
                      I. Kronologi Awal & Gambaran Epidemiologi
                    </h4>
                    <p className="text-justify leading-snug">
                      {event.kronologi_ringkas || 'Belum ada uraian kronologi tercatat.'}
                    </p>
                  </div>
                  <div className="border border-black p-2.5">
                    <h4 className="font-black uppercase text-[8pt] border-b border-slate-300 pb-1 mb-1">
                      II. Hasil Pemeriksaan Laboratorium / Kultur / Swab Lingkungan
                    </h4>
                    <p className="text-justify leading-snug">
                      {event.hasil_lab_swab || 'Masih menunggu / belum ada hasil laboratorium khusus.'}
                    </p>
                  </div>
                </div>
              </F4Page>

              {/* HALAMAN 2: LINE LISTING KASUS & 10 LANGKAH INTERVENSI */}
              <F4Page orientation="portrait" pageNumber={2} totalPages={totalPages} showFooterMeta={true}>
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
                  <span className="italic font-semibold">KLB No: {event.nomor_klb || '-'}</span>
                </div>

                <div className="mb-4">
                  <h4 className="text-[8.5pt] font-black uppercase mb-1.5 text-black">
                    III. Daftar Kasus Terdampak (Line Listing Epidemiologi)
                  </h4>
                  <table className="w-full border-collapse border border-black text-[7.5pt] leading-tight text-black">
                    <thead>
                      <tr className="bg-slate-100 font-extrabold text-center" style={{ backgroundColor: '#f1f5f9' }}>
                        <th className="border border-black px-1 py-1.5 w-[4%]">No</th>
                        <th className="border border-black px-1.5 py-1.5 w-[15%]">Inisial / No.RM</th>
                        <th className="border border-black px-1 py-1.5 w-[10%]">Kategori</th>
                        <th className="border border-black px-1 py-1.5 w-[9%]">Usia/JK</th>
                        <th className="border border-black px-1.5 py-1.5 w-[12%]">Lokasi/Bed</th>
                        <th className="border border-black px-1 py-1.5 w-[11%]">Tgl Onset</th>
                        <th className="border border-black px-1.5 py-1.5 w-[18%]">Gejala Klinis</th>
                        <th className="border border-black px-1.5 py-1.5 w-[11%]">Hasil Lab</th>
                        <th className="border border-black px-1 py-1.5 w-[10%]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCases.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="border border-black px-2 py-4 text-center italic text-slate-600">
                            Belum ada data Line Listing kasus tercatat.
                          </td>
                        </tr>
                      ) : (
                        sortedCases.slice(0, 14).map((c, i) => (
                          <tr key={c.id} className="align-top">
                            <td className="border border-black px-1 py-1 text-center font-bold">{i + 1}</td>
                            <td className="border border-black px-1.5 py-1 text-left">
                              <div className="font-bold">{c.nama_inisial}</div>
                              <div className="text-[6.8pt] text-slate-600">{c.no_rm_nip || '-'}</div>
                            </td>
                            <td className="border border-black px-1 py-1 text-center">{c.kategori_subjek}</td>
                            <td className="border border-black px-1 py-1 text-center">{c.usia_kelamin || '-'}</td>
                            <td className="border border-black px-1.5 py-1 text-left">{c.lokasi_bed || '-'}</td>
                            <td className="border border-black px-1 py-1 text-center font-bold">
                              {safeFmtDate(c.tanggal_onset)}
                            </td>
                            <td className="border border-black px-1.5 py-1 text-left">{c.gejala_utama || '-'}</td>
                            <td className="border border-black px-1.5 py-1 text-left">{c.hasil_lab || '-'}</td>
                            <td className="border border-black px-1 py-1 text-center font-bold">{c.status_akhir}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 className="text-[8.5pt] font-black uppercase mb-1.5 text-black">
                    IV. Langkah Penanggulangan & Pengendalian KLB (Standar PMK 27/2017)
                  </h4>
                  <table className="w-full border-collapse border border-black text-[7.8pt] leading-tight text-black">
                    <thead>
                      <tr className="bg-slate-100 font-extrabold text-center" style={{ backgroundColor: '#f1f5f9' }}>
                        <th className="border border-black px-1 py-1.5 w-[6%]">No</th>
                        <th className="border border-black px-2 py-1.5 w-[76%] text-left">Tindakan Investigasi & Intervensi</th>
                        <th className="border border-black px-1 py-1.5 w-[18%]">Pelaksanaan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.checklist_intervensi.map((step) => (
                        <tr key={step.id}>
                          <td className="border border-black px-1 py-1 text-center font-bold">{step.step}</td>
                          <td className="border border-black px-2 py-1 text-left">{step.label}</td>
                          <td className="border border-black px-1 py-1 text-center font-bold">
                            {step.done ? '✓ Dilaksanakan' : 'Belum / Proses'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </F4Page>

              {/* HALAMAN 3: KESIMPULAN, DOKUMENTASI FOTO & LEMBAR PENGESAHAN */}
              <F4Page orientation="portrait" pageNumber={3} totalPages={totalPages} showFooterMeta={true}>
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
                  <span className="italic font-semibold">KLB No: {event.nomor_klb || '-'}</span>
                </div>

                <div className="border border-black p-3 mb-4 text-[8.8pt] text-black">
                  <h4 className="font-black uppercase text-[8.5pt] border-b border-slate-300 pb-1 mb-2">
                    V. Kesimpulan Akhir & Rekomendasi Pencegahan Berulang
                  </h4>
                  <p className="text-justify leading-relaxed whitespace-pre-line">
                    {event.kesimpulan_rekomendasi ||
                      `Investigasi dan intervensi pengendalian infeksi untuk kejadian ${event.judul_kejadian} di unit ${event.unit_terdampak} dilaksanakan secara terpadu oleh Tim PPI bersama kepala ruangan terkait guna memutus rantai penularan dan menjamin keselamatan pasien.`}
                  </p>
                </div>

                {event.foto_dokumentasi && event.foto_dokumentasi.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-[8.5pt] font-black uppercase mb-2 text-black">
                      VI. Dokumentasi Penanggulangan Lapangan
                    </h4>
                    <div className="grid grid-cols-3 gap-2.5">
                      {event.foto_dokumentasi.slice(0, 6).map((url, idx) => (
                        <div key={idx} className="border border-black p-1.5 bg-slate-50 flex flex-col items-center">
                          <div className="w-full h-32 flex items-center justify-center bg-white overflow-hidden border border-slate-300">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={normalizeImageUrl(url)}
                              alt={`Dokumentasi KLB ${idx + 1}`}
                              crossOrigin="anonymous"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <span className="text-[7pt] font-bold text-black mt-1">Dokumentasi #{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blok Pengesahan 3 Pihak (IPCN, Ketua Tim PPI, Direktur RS) */}
                <div className="mt-auto pt-4 text-[8.5pt] text-black">
                  <p className="text-right mb-4">Sukabumi, {todayStr}</p>
                  <div className="grid grid-cols-2 gap-8 text-center mb-8">
                    <div className="flex flex-col items-center">
                      <p className="font-bold">Menyetujui,</p>
                      <p className="font-bold">Ketua Komite / Tim PPI</p>
                      <div className="h-16" />
                      <p className="font-bold underline">{event.nama_ketua_ppi || 'dr. Nurul Iman'}</p>
                      <p className="text-[7.5pt]">UOBK RSUD Al-Mulk Kota Sukabumi</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="font-bold">Pelaksana Investigasi,</p>
                      <p className="font-bold">Infection Prevention Control Nurse</p>
                      <div className="h-16 flex items-center justify-center">
                        {event.ttd_ipcn && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={event.ttd_ipcn} alt="TTD IPCN" className="max-h-14 object-contain" />
                        )}
                      </div>
                      <p className="font-bold underline">{event.nama_ipcn || 'Adi Tresa Purnama, A.M.Kep'}</p>
                      <p className="text-[7.5pt]">IPCN UOBK RSUD Al-Mulk</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center pt-2">
                    <p className="font-bold">Mengetahui,</p>
                    <p className="font-bold mb-14">Direktur UOBK RSUD Al-Mulk Kota Sukabumi</p>
                    <p className="font-bold underline">{event.nama_direktur || 'Direktur RSUD Al-Mulk'}</p>
                    <p className="text-[7.5pt]">Kota Sukabumi</p>
                  </div>
                </div>
              </F4Page>
            </div>
          </ZoomableReportViewer>
        </div>
      </motion.div>
    </div>
  );
}

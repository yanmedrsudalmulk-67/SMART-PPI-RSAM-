import React, { useMemo, useState, useCallback } from 'react';
import { format } from 'date-fns';
import ReportCover from './ReportCover';
import AutoPaginatedF4Document, { FlowBlock, FrontMatterPageSpec } from './AutoPaginatedF4Document';
import {
  IcraKonstruksiItem,
  IcraMonitoringItem,
  ConstructionType,
  CONSTRUCTION_TYPES,
  PATIENT_RISK_GROUPS,
  CONSTRUCTION_MATRIX,
  IcraChecklistSignoff,
  getPreChecklistSections,
  getPostChecklistSections,
  normalizePreChecklist,
  normalizePostChecklist,
  buildDefaultIntraItems,
  normalizeIntraItems,
} from '@/utils/icraData';
import {
  RISK_ROMAN,
  toSmartTitleCase,
  toMidSentenceProse,
  formatIndonesianDate,
  buildIcraReportNarrative,
} from '@/utils/icraNarrative';
import { normalizeImageUrl } from '@/utils/imageHelper';

export interface IcraOfficialReportProps {
  project: IcraKonstruksiItem;
  monitoringLogs?: IcraMonitoringItem[];
  ketuaPpiName?: string;
  signDate?: string;
  documentId?: string;
}

const BASE_TEXT_STYLE: React.CSSProperties = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '12pt',
  lineHeight: '1.5',
  fontWeight: 400,
  color: '#000000',
};

const INTRA_FORM_STYLE: React.CSSProperties = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '11pt',
  lineHeight: '1.35',
  fontWeight: 400,
  color: '#000000',
};

function renderNarrativeText(text: string): React.ReactNode {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

/**
 * Renders numbered/lettered items ("1.", "2.", "A.", "B.") with proper hanging indent
 * so wrapped lines align straight under the first character of the text, never under the number.
 */
function renderHangingItem(
  marker: string,
  body: React.ReactNode,
  bold = false,
  baseStyle: React.CSSProperties = BASE_TEXT_STYLE
): React.ReactNode {
  return (
    <div
      className={`flex items-start text-left ${bold ? 'font-bold' : 'font-normal'}`}
      style={{ ...baseStyle, fontWeight: bold ? 700 : 400, textAlign: 'left' }}
    >
      <span className="shrink-0 w-6">{marker}</span>
      <div className="flex-1 text-left" style={{ textAlign: 'left' }}>
        {body}
      </div>
    </div>
  );
}

function renderAutoHangingTitle(
  rawTitle: string,
  bold = true,
  baseStyle: React.CSSProperties = BASE_TEXT_STYLE
): React.ReactNode {
  const m = rawTitle.match(/^([0-9]+\.|[A-Z]\.)\s+(.*)$/);
  if (!m) return rawTitle;
  return renderHangingItem(m[1], m[2], bold, baseStyle);
}

export default function IcraOfficialReport({
  project,
  monitoringLogs = [],
  ketuaPpiName = 'dr. Nurul Iman',
  signDate,
  documentId = 'print-area-icra',
}: IcraOfficialReportProps) {
  const chronologicalLogs = useMemo(() => {
    return [...monitoringLogs].sort((a, b) => {
      const da = a.tanggal_monitoring || '';
      const db = b.tanggal_monitoring || '';
      if (da !== db) return da.localeCompare(db);
      const ja = a.jam_monitoring || '';
      const jb = b.jam_monitoring || '';
      if (ja !== jb) return ja.localeCompare(jb);
      const ca = a.created_at || '';
      const cb = b.created_at || '';
      if (ca !== cb) return ca.localeCompare(cb);
      return (a.id || '').localeCompare(b.id || '');
    });
  }, [monitoringLogs]);

  const narrative = useMemo(
    () => buildIcraReportNarrative(project, chronologicalLogs),
    [project, chronologicalLogs]
  );

  const {
    projectYear,
    cleanedBaseName,
    projectTitleDisplay,
    lokasiTitleDisplay,
    areaTerdampakTitle,
    kontraktorDisplay,
    pjProyekDisplay,
    namaIpcn,
    tipeCode,
    riskCode,
    kelasCode,
    riskRoman,
    riskLabelLower,
    typeInfo,
    riskInfo,
    classControl,
    kataPengantarParagraphs,
    latarBelakangParagraphs,
    tujuanText,
    ruangLingkupText,
    matriksResultText,
    praActions,
    saatActions,
    pascaActions,
    kesimpulanParagraphs,
    rekomendasiIntro,
    rekomendasiSections,
    rekomendasiClosing,
    penutupParagraphs,
    locationPoints,
  } = narrative;

  const tglPengesahan = formatIndonesianDate(signDate || project.tgl_mulai || format(new Date(), 'yyyy-MM-dd'));

  const [chapterPages, setChapterPages] = useState<Record<string, number>>({
    'latar-belakang': 1,
    'tujuan-ruang-lingkup': 1,
    'perencanaan': 2,
    'tipe-proyek': 2,
    'kategori-risiko': 3,
    'matriks-icra': 3,
    'rencana-tindakan': 4,
    'kesimpulan': 6,
    'rekomendasi': 7,
    'penutup': 8,
    'bukti-dokumentasi': 9,
    'formulir-pre': 10,
    'formulir-intra': 12,
    'formulir-post': 13,
  });

  const handleChaptersResolved = useCallback((resolved: Record<string, number>) => {
    setChapterPages((prev) => ({ ...prev, ...resolved }));
  }, []);

  // Collect Photos across Pre (foto_sebelum), Intra (monitoringLogs.foto_monitoring), Post (foto_sesudah)
  const prePhotos = useMemo(
    () => (project.foto_sebelum || []).map((u) => normalizeImageUrl(u)).filter(Boolean),
    [project.foto_sebelum]
  );

  const intraPhotos = useMemo(() => {
    const all: { url: string; caption?: string }[] = [];
    const seen = new Set<string>();
    chronologicalLogs.forEach((log) => {
      const dateLabel = log.tanggal_monitoring
        ? `Tanggal: ${formatIndonesianDate(log.tanggal_monitoring)}`
        : '';
      (log.foto_monitoring || []).forEach((u) => {
        const norm = normalizeImageUrl(u);
        if (norm && !seen.has(norm)) {
          seen.add(norm);
          all.push({
            url: norm,
            caption: dateLabel || undefined,
          });
        }
      });
    });
    return all;
  }, [chronologicalLogs]);

  const postPhotos = useMemo(
    () => (project.foto_sesudah || []).map((u) => normalizeImageUrl(u)).filter(Boolean),
    [project.foto_sesudah]
  );

  // Front Matter: Kata Pengantar (ii) & Daftar Isi (iii) — Arial 12pt, line-spacing 1.5, normal body weight
  const frontMatterPages: FrontMatterPageSpec[] = useMemo(
    () => [
      {
        key: 'icra-fm-kata-pengantar',
        label: 'ii',
        node: (
          <div
            className="w-full h-full flex flex-col justify-between text-[12pt] leading-[1.5] text-justify text-black font-normal"
            style={BASE_TEXT_STYLE}
          >
            <div>
              <div className="text-center mb-6">
                <h2
                  className="text-[12pt] uppercase font-bold text-black"
                  style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                >
                  KATA PENGANTAR
                </h2>
              </div>
              <div className="space-y-3 font-normal" style={BASE_TEXT_STYLE}>
                {kataPengantarParagraphs.map((pText, idx) => (
                  <p key={idx} className="indent-8 font-normal">
                    {renderNarrativeText(pText)}
                  </p>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-6 pr-4 font-normal" style={BASE_TEXT_STYLE}>
              <div className="text-center">
                <p className="font-normal">Tim Penyusun</p>
                <div className="h-16" />
                <p className="font-normal">IPCN</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'icra-fm-daftar-isi',
        label: 'iii',
        node: (
          <div
            className="w-full flex flex-col justify-start text-[12pt] leading-[1.5] text-black font-normal"
            style={BASE_TEXT_STYLE}
          >
            <div className="text-center mb-6">
              <h2
                className="text-[12pt] uppercase font-bold text-black"
                style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
              >
                DAFTAR ISI
              </h2>
            </div>

            <div className="space-y-2 text-[12pt] leading-[1.5] font-normal" style={BASE_TEXT_STYLE}>
              {[
                { label: 'KATA PENGANTAR', page: 'ii', indent: false },
                { label: 'DAFTAR ISI', page: 'iii', indent: false },
                { label: 'LAPORAN PELAKSANAAN INFECTION CONTROL RISK ASSESSMENT (ICRA)', page: '1', indent: false },
                { label: 'LATAR BELAKANG', page: String(chapterPages['latar-belakang'] ?? 1), indent: true },
                { label: 'TUJUAN DAN RUANG LINGKUP', page: String(chapterPages['tujuan-ruang-lingkup'] ?? 1), indent: true },
                { label: 'PERENCANAAN', page: String(chapterPages['perencanaan'] ?? 2), indent: true },
                { label: 'TIPE PROYEK KONSTRUKSI', page: String(chapterPages['tipe-proyek'] ?? 2), indent: true },
                { label: 'KATEGORI RISIKO PASIEN', page: String(chapterPages['kategori-risiko'] ?? 3), indent: true },
                { label: 'MATRIKS ICRA', page: String(chapterPages['matriks-icra'] ?? 3), indent: true },
                { label: 'RENCANA TINDAKAN PENGENDALIAN INFEKSI', page: String(chapterPages['rencana-tindakan'] ?? 4), indent: true },
                { label: 'KESIMPULAN', page: String(chapterPages['kesimpulan'] ?? 6), indent: true },
                { label: 'REKOMENDASI', page: String(chapterPages['rekomendasi'] ?? 7), indent: true },
                { label: 'PENUTUP', page: String(chapterPages['penutup'] ?? 8), indent: true },
                { label: 'BUKTI DOKUMENTASI', page: String(chapterPages['bukti-dokumentasi'] ?? 9), indent: true },
                { label: 'FORMULIR PRE RENOVASI / KONSTRUKSI', page: String(chapterPages['formulir-pre'] ?? 10), indent: true },
                { label: 'FORMULIR PEMANTAUAN INTRA RENOVASI / KONSTRUKSI', page: String(chapterPages['formulir-intra'] ?? 12), indent: true },
                { label: 'FORMULIR POST RENOVASI / KONSTRUKSI', page: String(chapterPages['formulir-post'] ?? 13), indent: true },
              ].map((entry, i) => (
                <div
                  key={i}
                  className={`flex items-baseline justify-between font-normal ${entry.indent ? 'pl-6' : ''}`}
                >
                  <span className="text-left font-normal">{entry.label}</span>
                  <span className="flex-1 mx-2 border-b border-dotted border-black min-w-[16px]" />
                  <span className="shrink-0 font-normal min-w-[20px] text-right">{entry.page}</span>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
    [kataPengantarParagraphs, chapterPages]
  );

  // Build Atomic Flow Blocks for AutoPaginatedF4Document (Arial 12pt, line-height 1.5, 2.5cm margins)
  const blocks: FlowBlock[] = useMemo(() => {
    const b: FlowBlock[] = [];

    // Section heading (BOLD — only headings & subheadings are bold)
    const pushHeading = (key: string, title: string, anchor?: string) => {
      b.push({
        type: 'element',
        key,
        chapterAnchor: anchor,
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <h2
            className="text-[12pt] leading-[1.5] font-bold uppercase text-black mt-2"
            style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
          >
            {title}
          </h2>
        ),
      });
    };

    // Sub-heading (BOLD, supports automatic hanging indent for "1. ...", "A. ...")
    const pushSubHeading = (key: string, title: string) => {
      b.push({
        type: 'element',
        key,
        keepWithNext: true,
        gapAfter: 4,
        node: (
          <div
            className="text-[12pt] leading-[1.5] font-bold text-black mt-1 text-left"
            style={{ ...BASE_TEXT_STYLE, fontWeight: 700, textAlign: 'left' }}
          >
            {renderAutoHangingTitle(title, true, BASE_TEXT_STYLE)}
          </div>
        ),
      });
    };

    // Normal body paragraph (Arial 12pt, line-height 1.5, strictly normal weight)
    const pushParagraph = (
      key: string,
      content: React.ReactNode,
      gapAfter = 8,
      indent = true,
      splittableText?: string
    ) => {
      b.push({
        type: 'element',
        key,
        gapAfter,
        ...(splittableText ? { splittableParagraph: { text: splittableText, indent } } : {}),
        node: (
          <p
            className={`text-[12pt] leading-[1.5] text-justify text-black font-normal ${indent ? 'indent-8' : ''}`}
            style={BASE_TEXT_STYLE}
          >
            {content}
          </p>
        ),
      });
    };

    // ==================== JUDUL HALAMAN 1 (BOLD) ====================
    b.push({
      type: 'element',
      key: 'doc-main-title',
      keepWithNext: true,
      gapAfter: 14,
      node: (
        <div className="text-center pb-2 mb-1" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
          <h1
            className="text-[12pt] leading-[1.5] font-bold uppercase text-black"
            style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
          >
            LAPORAN PELAKSANAAN INFECTION CONTROL RISK ASSESSMENT (ICRA)
          </h1>
          <p
            className="text-[12pt] leading-[1.5] font-bold text-black"
            style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
          >
            Pada Kegiatan {projectTitleDisplay}
          </p>
          <p
            className="text-[12pt] leading-[1.5] font-bold text-black"
            style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
          >
            UOBK RSUD Al-Mulk Kota Sukabumi
          </p>
        </div>
      ),
    });

    // ==================== 1. LATAR BELAKANG ====================
    pushHeading('sec-latar-belakang', 'LATAR BELAKANG', 'latar-belakang');
    latarBelakangParagraphs.forEach((pText, idx) => {
      pushParagraph(
        `lb-${idx + 1}`,
        renderNarrativeText(pText),
        idx === latarBelakangParagraphs.length - 1 ? 12 : 8,
        true,
        pText
      );
    });

    // ==================== 2. TUJUAN DAN RUANG LINGKUP ====================
    pushHeading('sec-tujuan', 'TUJUAN DAN RUANG LINGKUP', 'tujuan-ruang-lingkup');
    pushSubHeading('tujuan-sub-1', '1. Tujuan');
    b.push({
      type: 'element',
      key: 'tujuan-body-1',
      gapAfter: 8,
      node: (
        <p className="pl-6 text-[12pt] leading-[1.5] text-justify text-black font-normal" style={BASE_TEXT_STYLE}>
          {renderNarrativeText(tujuanText)}
        </p>
      ),
    });

    pushSubHeading('tujuan-sub-2', '2. Ruang Lingkup');
    b.push({
      type: 'element',
      key: 'tujuan-body-2',
      gapAfter: 12,
      node: (
        <p className="pl-6 text-[12pt] leading-[1.5] text-justify text-black font-normal" style={BASE_TEXT_STYLE}>
          {renderNarrativeText(ruangLingkupText)}
        </p>
      ),
    });

    // ==================== 3. PERENCANAAN ====================
    pushHeading('sec-perencanaan', 'PERENCANAAN', 'perencanaan');
    b.push({
      type: 'element',
      key: 'perencanaan-table',
      gapAfter: 12,
      node: (
        <table
          className="w-full border-collapse text-[12pt] leading-[1.5] text-black text-left font-normal"
          style={{ ...BASE_TEXT_STYLE, textAlign: 'left' }}
        >
          <tbody>
            <tr>
              <td className="py-1 px-1.5 align-top w-8 text-left font-normal">1.</td>
              <td className="py-1 px-1.5 align-top w-44 text-left font-normal">Tanggal</td>
              <td className="py-1 px-1 align-top w-4 text-left font-normal">:</td>
              <td className="py-1 px-1.5 align-top text-left font-normal">
                {formatIndonesianDate(project.tgl_mulai)} s/d {formatIndonesianDate(project.tgl_selesai_estimasi)}
              </td>
            </tr>
            <tr>
              <td className="py-1 px-1.5 align-top text-left font-normal">2.</td>
              <td className="py-1 px-1.5 align-top text-left font-normal">Lokasi</td>
              <td className="py-1 px-1 align-top text-left font-normal">:</td>
              <td className="py-1 px-1.5 align-top text-left font-normal">
                <div>
                  {lokasiTitleDisplay}
                  {locationPoints.length > 0 ? ` (${locationPoints.length} Titik Lokasi)` : ''}
                </div>
                {locationPoints.length === 0 && areaTerdampakTitle && (
                  <div className="mt-0.5">Area terdampak sekitar: {areaTerdampakTitle}</div>
                )}
              </td>
            </tr>
            <tr>
              <td className="py-1 px-1.5 align-top text-left font-normal">3.</td>
              <td className="py-1 px-1.5 align-top text-left font-normal">Kegiatan</td>
              <td className="py-1 px-1 align-top text-left font-normal">:</td>
              <td className="py-1 px-1.5 align-top text-left font-normal">{projectTitleDisplay}</td>
            </tr>
            <tr>
              <td className="py-1 px-1.5 align-top text-left font-normal">4.</td>
              <td className="py-1 px-1.5 align-top text-left font-normal">Pelaksana / PJ</td>
              <td className="py-1 px-1 align-top text-left font-normal">:</td>
              <td className="py-1 px-1.5 align-top text-left font-normal">
                {kontraktorDisplay}{pjProyekDisplay ? ` (Penanggung Jawab: ${pjProyekDisplay})` : ''}
              </td>
            </tr>
          </tbody>
        </table>
      ),
    });

    // ==================== 3B. RINCIAN TITIK LOKASI (MULTI-LOKASI, OPSIONAL) ====================
    if (locationPoints.length > 0) {
      pushSubHeading(
        'perencanaan-multi-lokasi-title',
        `Rincian Titik Lokasi dan Klasifikasi Risiko Pekerjaan (${locationPoints.length} Titik)`
      );

      locationPoints.forEach((pt, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === locationPoints.length - 1;
        const ptRiskLabel =
          PATIENT_RISK_GROUPS.find((g) => g.code === pt.kelompok_risiko)?.riskLabel ||
          `Kelompok ${pt.kelompok_risiko}`;

        b.push({
          type: 'element',
          key: `perencanaan-loc-row-${pt.id}-${idx}`,
          gapAfter: isLast ? 6 : 0,
          node: (
            <table
              className={`w-full table-fixed border-collapse text-[11pt] leading-[1.45] text-black font-normal ${
                isFirst ? '' : '-mt-[1px]'
              }`}
              style={{ ...BASE_TEXT_STYLE, fontSize: '11pt', lineHeight: '1.45' }}
            >
              {isFirst && (
                <thead>
                  <tr className="bg-gray-100 text-center">
                    <th
                      className="border border-black py-1.5 px-1 w-[6%] text-center align-middle font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontSize: '11pt', lineHeight: '1.4', fontWeight: 700, textAlign: 'center', verticalAlign: 'middle' }}
                    >
                      No
                    </th>
                    <th
                      className="border border-black py-1.5 px-2 w-[32%] text-center align-middle font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontSize: '11pt', lineHeight: '1.4', fontWeight: 700, textAlign: 'center', verticalAlign: 'middle' }}
                    >
                      Uraian Pekerjaan
                    </th>
                    <th
                      className="border border-black py-1.5 px-2 w-[28%] text-center align-middle font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontSize: '11pt', lineHeight: '1.4', fontWeight: 700, textAlign: 'center', verticalAlign: 'middle' }}
                    >
                      Lokasi &amp; Area Terdampak
                    </th>
                    <th
                      className="border border-black py-1.5 px-1.5 w-[9%] text-center align-middle font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontSize: '11pt', lineHeight: '1.4', fontWeight: 700, textAlign: 'center', verticalAlign: 'middle' }}
                    >
                      Tipe
                    </th>
                    <th
                      className="border border-black py-1.5 px-1.5 w-[14%] text-center align-middle font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontSize: '11pt', lineHeight: '1.4', fontWeight: 700, textAlign: 'center', verticalAlign: 'middle' }}
                    >
                      Risiko
                    </th>
                    <th
                      className="border border-black py-1.5 px-1.5 w-[11%] text-center align-middle font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontSize: '11pt', lineHeight: '1.4', fontWeight: 700, textAlign: 'center', verticalAlign: 'middle' }}
                    >
                      Kelas
                    </th>
                  </tr>
                </thead>
              )}
              <tbody>
                <tr>
                  <td
                    className="border border-black py-1.5 px-1 w-[6%] text-center align-middle font-normal"
                    style={{ ...BASE_TEXT_STYLE, fontSize: '11pt', lineHeight: '1.45', textAlign: 'center', verticalAlign: 'middle' }}
                  >
                    {idx + 1}
                  </td>
                  <td
                    className="border border-black py-1.5 px-2 w-[32%] text-left align-middle font-normal"
                    style={{ ...BASE_TEXT_STYLE, fontSize: '11pt', lineHeight: '1.45', textAlign: 'left', verticalAlign: 'middle' }}
                  >
                    <div>{pt.uraian_pekerjaan || '-'}</div>
                    {pt.keterangan && pt.keterangan.trim() && (
                      <div className="italic mt-0.5" style={{ fontSize: '10pt', lineHeight: '1.35' }}>
                        Catatan: {pt.keterangan.trim()}
                      </div>
                    )}
                  </td>
                  <td
                    className="border border-black py-1.5 px-2 w-[28%] text-left align-middle font-normal"
                    style={{ ...BASE_TEXT_STYLE, fontSize: '11pt', lineHeight: '1.45', textAlign: 'left', verticalAlign: 'middle' }}
                  >
                    <div>{pt.lokasi || '-'}</div>
                    {pt.area_terdampak && pt.area_terdampak.trim() && (
                      <div className="mt-1" style={{ fontSize: '10pt', lineHeight: '1.35' }}>
                        <span className="italic">Area terdampak:</span> {pt.area_terdampak.trim()}
                      </div>
                    )}
                  </td>
                  <td
                    className="border border-black py-1.5 px-1.5 w-[9%] text-center align-middle font-normal"
                    style={{ ...BASE_TEXT_STYLE, fontSize: '11pt', lineHeight: '1.45', textAlign: 'center', verticalAlign: 'middle' }}
                  >
                    Tipe {pt.tipe_konstruksi}
                  </td>
                  <td
                    className="border border-black py-1.5 px-1.5 w-[14%] text-center align-middle font-normal"
                    style={{ ...BASE_TEXT_STYLE, fontSize: '11pt', lineHeight: '1.45', textAlign: 'center', verticalAlign: 'middle' }}
                  >
                    {ptRiskLabel}
                  </td>
                  <td
                    className="border border-black py-1.5 px-1.5 w-[11%] text-center align-middle font-normal"
                    style={{ ...BASE_TEXT_STYLE, fontSize: '11pt', lineHeight: '1.45', textAlign: 'center', verticalAlign: 'middle' }}
                  >
                    Kelas {pt.kelas_tindakan}
                  </td>
                </tr>
              </tbody>
            </table>
          ),
        });
      });

      b.push({
        type: 'element',
        key: 'perencanaan-multi-lokasi-note',
        gapAfter: 12,
        node: (
          <p
            className="text-[11pt] leading-[1.45] italic text-justify text-black font-normal"
            style={{ ...BASE_TEXT_STYLE, fontSize: '11pt', lineHeight: '1.45', fontStyle: 'italic' }}
          >
            Catatan: Sesuai Pedoman ICRA Permenkes Nomor 27 Tahun 2017, penetapan matriks induk pada paket renovasi multi-lokasi mengacu pada tingkat risiko dan kelas kewaspadaan tertinggi (Tipe {tipeCode}, Risiko Kategori {riskRoman} — {riskInfo.riskLabel}, Kelas {kelasCode}), dengan penerapan tindakan pengendalian lapangan disesuaikan pada masing-masing titik lokasi.
          </p>
        ),
      });
    }

    // ==================== 4. TIPE PROYEK KONSTRUKSI (ATOMIC ROWS) ====================
    pushHeading('sec-tipe-proyek', 'TIPE PROYEK KONSTRUKSI', 'tipe-proyek');
    b.push({
      type: 'element',
      key: 'tipe-proyek-intro',
      keepWithNext: true,
      gapAfter: 6,
      node: (
        <p className="text-[12pt] leading-[1.5] text-left text-black font-normal" style={{ ...BASE_TEXT_STYLE, textAlign: 'left' }}>
          Berdasarkan pedoman ICRA, tipe proyek diklasifikasikan sebagai berikut:
        </p>
      ),
    });

    CONSTRUCTION_TYPES.forEach((ct, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === CONSTRUCTION_TYPES.length - 1;
      const isSelected = ct.code === tipeCode;
      b.push({
        type: 'element',
        key: `tipe-proyek-row-${ct.code}`,
        gapAfter: isLast ? 12 : 0,
        node: (
          <table
            className={`w-full table-fixed border-collapse text-[12pt] leading-[1.5] text-black font-normal ${
              isFirst ? '' : '-mt-[1px]'
            }`}
            style={BASE_TEXT_STYLE}
          >
            {isFirst && (
              <thead>
                <tr className="bg-gray-100 text-center">
                  <th
                    className="border border-black py-1.5 px-2.5 w-[24%] text-center font-bold"
                    style={{ ...BASE_TEXT_STYLE, fontWeight: 700, textAlign: 'center' }}
                  >
                    Tipe Proyek
                  </th>
                  <th
                    className="border border-black py-1.5 px-2.5 w-[76%] text-center font-bold"
                    style={{ ...BASE_TEXT_STYLE, fontWeight: 700, textAlign: 'center' }}
                  >
                    Deskripsi
                  </th>
                </tr>
              </thead>
            )}
            <tbody>
              <tr style={{ backgroundColor: isSelected ? '#fef9c3' : '#ffffff' }}>
                <td
                  className="border border-black py-1.5 px-2.5 w-[24%] align-top text-left font-normal"
                  style={{ ...BASE_TEXT_STYLE, textAlign: 'left' }}
                >
                  <div>Tipe {ct.code}</div>
                  {isSelected && <div>Dipilih</div>}
                </td>
                <td
                  className="border border-black py-1.5 px-2.5 w-[76%] align-top text-left font-normal"
                  style={{ ...BASE_TEXT_STYLE, textAlign: 'left' }}
                >
                  {ct.shortDesc}: {ct.items.join('; ')}.
                </td>
              </tr>
            </tbody>
          </table>
        ),
      });
    });

    // ==================== 5. KATEGORI RISIKO PASIEN (ATOMIC ROWS) ====================
    b.push({ type: 'pageBreak', key: 'pb-kategori-risiko' });
    pushHeading('sec-kategori-risiko', 'KATEGORI RISIKO PASIEN', 'kategori-risiko');
    b.push({
      type: 'element',
      key: 'kategori-risiko-intro',
      keepWithNext: true,
      gapAfter: 6,
      node: (
        <p className="text-[12pt] leading-[1.5] text-left text-black font-normal" style={{ ...BASE_TEXT_STYLE, textAlign: 'left' }}>
          Klasifikasi risiko pasien dibagi menjadi:
        </p>
      ),
    });

    PATIENT_RISK_GROUPS.forEach((rg, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === PATIENT_RISK_GROUPS.length - 1;
      const isSelected = rg.code === riskCode;
      const roman = RISK_ROMAN[rg.code];
      b.push({
        type: 'element',
        key: `kategori-risiko-row-${rg.code}`,
        gapAfter: isLast ? 12 : 0,
        node: (
          <table
            className={`w-full table-fixed border-collapse text-[12pt] leading-[1.5] text-black font-normal ${
              isFirst ? '' : '-mt-[1px]'
            }`}
            style={BASE_TEXT_STYLE}
          >
            {isFirst && (
              <thead>
                <tr className="bg-gray-100 text-center">
                  <th
                    className="border border-black py-1.5 px-2.5 w-[36%] text-center font-bold"
                    style={{ ...BASE_TEXT_STYLE, fontWeight: 700, textAlign: 'center' }}
                  >
                    Kategori Risiko
                  </th>
                  <th
                    className="border border-black py-1.5 px-2.5 w-[64%] text-center font-bold"
                    style={{ ...BASE_TEXT_STYLE, fontWeight: 700, textAlign: 'center' }}
                  >
                    Deskripsi Unit
                  </th>
                </tr>
              </thead>
            )}
            <tbody>
              <tr style={{ backgroundColor: isSelected ? '#fef9c3' : '#ffffff' }}>
                <td
                  className="border border-black py-1.5 px-2.5 w-[36%] align-top text-left font-normal"
                  style={{ ...BASE_TEXT_STYLE, textAlign: 'left' }}
                >
                  <div>Kategori {roman}</div>
                  <div>
                    Risiko {rg.riskLabel}
                    {isSelected ? ' - Dipilih' : ''}
                  </div>
                </td>
                <td
                  className="border border-black py-1.5 px-2.5 w-[64%] align-top text-left font-normal"
                  style={{ ...BASE_TEXT_STYLE, textAlign: 'left' }}
                >
                  {rg.areas}
                </td>
              </tr>
            </tbody>
          </table>
        ),
      });
    });

    // ==================== 6. MATRIKS ICRA ====================
    pushHeading('sec-matriks-icra', 'MATRIKS ICRA', 'matriks-icra');
    b.push({
      type: 'element',
      key: 'matriks-icra-table',
      gapAfter: 8,
      node: (
        <div className="space-y-2 text-black font-normal" style={BASE_TEXT_STYLE}>
          <p className="text-[12pt] leading-[1.5] text-left font-normal" style={{ ...BASE_TEXT_STYLE, textAlign: 'left' }}>
            (Menentukan Kategori Pengendalian Berdasarkan Kombinasi Tipe Proyek dan Risiko Pasien)
          </p>
          <table
            className="w-full table-fixed border-collapse border border-black text-[12pt] leading-[1.5] font-normal"
            style={BASE_TEXT_STYLE}
          >
            <thead>
              <tr className="bg-gray-100 text-center">
                <th
                  className="border border-black py-1.5 px-2.5 text-center w-[44%] font-bold"
                  style={{ ...BASE_TEXT_STYLE, fontWeight: 700, textAlign: 'center' }}
                >
                  Risiko Pasien / Tipe Proyek
                </th>
                {(['A', 'B', 'C', 'D'] as ConstructionType[]).map((t) => (
                  <th
                    key={t}
                    className="border border-black py-1.5 px-1.5 w-[14%] font-bold"
                    style={{
                      ...BASE_TEXT_STYLE,
                      fontWeight: 700,
                      backgroundColor: t === tipeCode ? '#e0f2fe' : undefined,
                    }}
                  >
                    Tipe {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PATIENT_RISK_GROUPS.map((rg) => {
                const roman = RISK_ROMAN[rg.code];
                const isRowActive = rg.code === riskCode;
                return (
                  <tr key={rg.code}>
                    <td
                      className="border border-black py-1.5 px-2.5 text-left font-normal"
                      style={{ backgroundColor: isRowActive ? '#e0f2fe' : '#ffffff' }}
                    >
                      Kategori {roman} – Risiko {rg.riskLabel}
                    </td>
                    {(['A', 'B', 'C', 'D'] as ConstructionType[]).map((t) => {
                      const cell = CONSTRUCTION_MATRIX[rg.code][t];
                      const isTarget = isRowActive && t === tipeCode;
                      const displayVal = isTarget
                        ? kelasCode
                        : cell.isAmbiguousIIIorIV
                        ? 'III/IV'
                        : cell.classLevel;
                      return (
                        <td
                          key={t}
                          className="border border-black py-1.5 px-1.5 text-center font-normal"
                          style={{
                            backgroundColor: isTarget ? '#fde047' : '#ffffff',
                          }}
                        >
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'matriks-icra-result',
      gapAfter: 12,
      node: (
        <p className="text-[12pt] leading-[1.5] text-justify text-black font-normal" style={BASE_TEXT_STYLE}>
          {renderNarrativeText(matriksResultText)}
        </p>
      ),
    });

    // ==================== 7. RENCANA TINDAKAN PENGENDALIAN INFEKSI (ATOMIC PER-ROW) ====================
    b.push({ type: 'pageBreak', key: 'pb-rencana-tindakan' });
    pushHeading('sec-rencana-tindakan', 'RENCANA TINDAKAN PENGENDALIAN INFEKSI', 'rencana-tindakan');

    const ACTION_TABLE_TEXT_STYLE: React.CSSProperties = {
      ...BASE_TEXT_STYLE,
      fontSize: '10pt',
      lineHeight: '1.25',
    };

    const pushAtomicActionTable = (
      prefix: string,
      subTitle: string,
      rows: { tindakan: string; pj: string }[]
    ) => {
      pushSubHeading(`${prefix}-title`, subTitle);

      rows.forEach((r, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === rows.length - 1;
        b.push({
          type: 'element',
          key: `${prefix}-row-${idx}`,
          gapAfter: isLast ? 12 : 0,
          node: (
            <table
              className={`w-full table-fixed border-collapse text-[10pt] leading-[1.25] text-black font-normal ${
                isFirst ? '' : '-mt-[1px]'
              }`}
              style={ACTION_TABLE_TEXT_STYLE}
            >
              {isFirst && (
                <thead>
                  <tr className="bg-gray-100 text-center">
                    <th
                      className="border border-black py-1.5 px-2 text-center align-middle w-[8%] font-bold"
                      style={{ ...ACTION_TABLE_TEXT_STYLE, fontWeight: 700, textAlign: 'center', verticalAlign: 'middle' }}
                    >
                      No
                    </th>
                    <th
                      className="border border-black py-1.5 px-2.5 text-center align-middle w-[64%] font-bold"
                      style={{ ...ACTION_TABLE_TEXT_STYLE, fontWeight: 700, textAlign: 'center', verticalAlign: 'middle' }}
                    >
                      Tindakan
                    </th>
                    <th
                      className="border border-black py-1.5 px-2.5 text-center align-middle w-[28%] font-bold"
                      style={{ ...ACTION_TABLE_TEXT_STYLE, fontWeight: 700, textAlign: 'center', verticalAlign: 'middle' }}
                    >
                      Penanggung Jawab
                    </th>
                  </tr>
                </thead>
              )}
              <tbody>
                <tr>
                  <td
                    className="border border-black py-1.5 px-2 text-center align-middle w-[8%] font-normal"
                    style={{ ...ACTION_TABLE_TEXT_STYLE, textAlign: 'center', verticalAlign: 'middle' }}
                  >
                    {idx + 1}
                  </td>
                  <td
                    className="border border-black py-1.5 px-2.5 align-middle text-left w-[64%] font-normal"
                    style={{ ...ACTION_TABLE_TEXT_STYLE, textAlign: 'left', verticalAlign: 'middle' }}
                  >
                    {renderNarrativeText(r.tindakan)}
                  </td>
                  <td
                    className="border border-black py-1.5 px-2.5 align-middle text-left w-[28%] font-normal"
                    style={{ ...ACTION_TABLE_TEXT_STYLE, textAlign: 'left', verticalAlign: 'middle' }}
                  >
                    {r.pj}
                  </td>
                </tr>
              </tbody>
            </table>
          ),
        });
      });
    };

    pushAtomicActionTable('pra', 'Tindakan Pra-Renovasi (Sebelum Pekerjaan)', praActions);
    b.push({ type: 'pageBreak', key: 'pb-tindakan-saat' });
    pushAtomicActionTable(
      'saat',
      `Tindakan Saat Renovasi — Kelas ${kelasCode} (Selama Pekerjaan)`,
      saatActions
    );
    b.push({ type: 'pageBreak', key: 'pb-tindakan-pasca' });
    pushAtomicActionTable(
      'pasca',
      `Tindakan Pasca-Renovasi — Kelas ${kelasCode} (Setelah Pekerjaan)`,
      pascaActions
    );

    if (project.persyaratan_khusus && project.persyaratan_khusus.trim()) {
      pushSubHeading('persyaratan-khusus-title', 'Catatan dan Persyaratan Khusus Lapangan');
      const noteParagraphs = project.persyaratan_khusus
        .trim()
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
      noteParagraphs.forEach((np, npIdx) => {
        pushParagraph(
          `persyaratan-khusus-body-${npIdx}`,
          toMidSentenceProse(np),
          npIdx === noteParagraphs.length - 1 ? 10 : 6,
          false
        );
      });
    }

    if (chronologicalLogs.length > 0) {
      pushSubHeading(
        'monitoring-summary-title',
        `Ringkasan Pemantauan Harian IPCN (${chronologicalLogs.length} Kunjungan)`
      );
      const shownLogs = chronologicalLogs;
      shownLogs.forEach((m, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === shownLogs.length - 1;
        b.push({
          type: 'element',
          key: `mon-row-${m.id}-${idx}`,
          gapAfter: isLast ? 14 : 0,
          node: (
            <table
              className={`w-full table-fixed border-collapse text-[12pt] leading-[1.5] text-black font-normal ${
                isFirst ? '' : '-mt-[1px]'
              }`}
              style={BASE_TEXT_STYLE}
            >
              {isFirst && (
                <thead>
                  <tr className="bg-gray-100 text-center">
                    <th
                      className="border border-black py-2 px-2 w-[9%] text-center align-middle font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontWeight: 700, textAlign: 'center', verticalAlign: 'middle' }}
                    >
                      No
                    </th>
                    <th
                      className="border border-black py-2 px-2.5 w-[25%] text-center align-middle font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontWeight: 700, textAlign: 'center', verticalAlign: 'middle' }}
                    >
                      Tanggal
                    </th>
                    <th
                      className="border border-black py-2 px-2.5 w-[22%] text-center align-middle font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontWeight: 700, textAlign: 'center', verticalAlign: 'middle' }}
                    >
                      Status
                    </th>
                    <th
                      className="border border-black py-2 px-2.5 w-[44%] text-center align-middle font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontWeight: 700, textAlign: 'center', verticalAlign: 'middle' }}
                    >
                      Temuan dan Tindak Lanjut
                    </th>
                  </tr>
                </thead>
              )}
              <tbody>
                <tr>
                  <td
                    className="border border-black py-2 px-2 w-[9%] text-center align-middle font-normal"
                    style={{ ...BASE_TEXT_STYLE, textAlign: 'center', verticalAlign: 'middle' }}
                  >
                    {idx + 1}
                  </td>
                  <td
                    className="border border-black py-2 px-2.5 w-[25%] text-center align-middle font-normal"
                    style={{ ...BASE_TEXT_STYLE, textAlign: 'center', verticalAlign: 'middle' }}
                  >
                    {formatIndonesianDate(m.tanggal_monitoring)}
                  </td>
                  <td
                    className="border border-black py-2 px-2.5 w-[22%] text-center align-middle font-normal"
                    style={{ ...BASE_TEXT_STYLE, textAlign: 'center', verticalAlign: 'middle' }}
                  >
                    {m.status_kepatuhan}
                  </td>
                  <td
                    className="border border-black py-2 px-2.5 w-[44%] text-left align-middle font-normal"
                    style={{ ...BASE_TEXT_STYLE, textAlign: 'left', verticalAlign: 'middle' }}
                  >
                    {m.temuan_lapangan
                      ? `Temuan: ${m.temuan_lapangan}`
                      : 'Sesuai protokol pengendalian infeksi PPI.'}
                    {m.tindakan_koreksi ? ` Tindak lanjut: ${m.tindakan_koreksi}` : ''}
                  </td>
                </tr>
              </tbody>
            </table>
          ),
        });
      });
    }

    // ==================== 8. KESIMPULAN ====================
    b.push({ type: 'pageBreak', key: 'pb-kesimpulan' });
    pushHeading('sec-kesimpulan', 'KESIMPULAN', 'kesimpulan');
    kesimpulanParagraphs.forEach((pText, idx) => {
      pushParagraph(
        `kes-${idx + 1}`,
        renderNarrativeText(pText),
        idx === kesimpulanParagraphs.length - 1 ? 12 : 8,
        true,
        pText
      );
    });

    // ==================== 9. REKOMENDASI (ATOMIC PER-BULLET) ====================
    pushHeading('sec-rekomendasi', 'REKOMENDASI', 'rekomendasi');
    pushParagraph('rek-intro', renderNarrativeText(rekomendasiIntro), 6, false);

    rekomendasiSections.forEach((sec, sIdx) => {
      pushSubHeading(`rek-sec-${sIdx}-head`, sec.title);
      sec.items.forEach((it, idx) => {
        const isLast = idx === sec.items.length - 1;
        b.push({
          type: 'element',
          key: `rek-sec-${sIdx}-item-${idx}`,
          gapAfter: isLast ? 8 : 3,
          node: (
            <div
              className="flex items-start gap-2.5 pl-6 text-[12pt] leading-[1.5] text-justify text-black font-normal"
              style={BASE_TEXT_STYLE}
            >
              <span className="shrink-0 font-normal">•</span>
              <span className="flex-1 text-justify font-normal">{renderNarrativeText(it)}</span>
            </div>
          ),
        });
      });
    });

    pushParagraph('rek-closing', renderNarrativeText(rekomendasiClosing), 12, false);

    // ==================== 10. PENUTUP & PENGESAHAN ====================
    b.push({ type: 'pageBreak', key: 'pb-penutup' });
    pushHeading('sec-penutup', 'PENUTUP', 'penutup');
    penutupParagraphs.forEach((pText, idx) => {
      pushParagraph(
        `pen-${idx + 1}`,
        renderNarrativeText(pText),
        idx === penutupParagraphs.length - 1 ? 14 : 8,
        true,
        pText
      );
    });

    // Signature Block — Arial 12pt, line-height 1.5, normal weight
    b.push({
      type: 'element',
      key: 'penutup-ttd',
      gapAfter: 10,
      node: (
        <div className="w-full text-[12pt] leading-[1.5] text-black pt-2 font-normal" style={BASE_TEXT_STYLE}>
          <div className="flex justify-end mb-3 pr-4">
            <p className="w-[46%] text-center font-normal">Sukabumi, {tglPengesahan}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-center font-normal">
            <div className="flex flex-col items-center">
              <p className="font-normal">Penyusun</p>
              <div className="h-20 flex items-center justify-center my-1">
                {project.ttd_ipcn ? (
                  <img
                    src={project.ttd_ipcn}
                    alt="Tanda Tangan IPCN"
                    data-pdf-signature-img="true"
                    className="max-h-16 object-contain"
                  />
                ) : null}
              </div>
              <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '12pt', lineHeight: '1.05' }}>
                <div className="font-normal underline underline-offset-[2px]" style={{ margin: 0, lineHeight: '1.05' }}>
                  {namaIpcn}
                </div>
                <div className="font-normal italic" style={{ margin: 0, lineHeight: '1.05' }}>
                  Infection Prevention Control Nurse
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <p className="font-normal">Mengetahui</p>
              <div className="h-20 flex items-center justify-center my-1" />
              <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '12pt', lineHeight: '1.05' }}>
                <div className="font-normal underline underline-offset-[2px]" style={{ margin: 0, lineHeight: '1.05' }}>
                  {ketuaPpiName}
                </div>
                <div className="font-normal" style={{ margin: 0, lineHeight: '1.05' }}>
                  Ketua PPI
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    });

    // ==================== 11. BUKTI DOKUMENTASI (HALAMAN BARU) ====================
    b.push({ type: 'pageBreak', key: 'pb-dokumentasi' });

    pushHeading('sec-bukti-dokumentasi', 'BUKTI DOKUMENTASI', 'bukti-dokumentasi');

    const pushPhotoSection = (
      phaseKey: string,
      phaseTitle: string,
      photos: { url: string; caption?: string }[],
      emptyNote: string
    ) => {
      pushSubHeading(`${phaseKey}-heading`, phaseTitle);

      if (photos.length === 0) {
        b.push({
          type: 'element',
          key: `${phaseKey}-empty`,
          gapAfter: 10,
          node: (
            <div
              className="border border-dashed border-gray-400 rounded py-5 px-4 text-center text-[12pt] leading-[1.5] italic text-gray-600 bg-gray-50 font-normal"
              style={BASE_TEXT_STYLE}
            >
              {emptyNote}
            </div>
          ),
        });
        return;
      }

      for (let i = 0; i < photos.length; i += 2) {
        const pair = photos.slice(i, i + 2);
        b.push({
          type: 'element',
          key: `${phaseKey}-row-${i}`,
          gapAfter: 10,
          node: (
            <div className="grid grid-cols-2 gap-3.5 w-full" style={BASE_TEXT_STYLE}>
              {pair.map((photo, idx) => (
                <div
                  key={idx}
                  data-pdf-photo="true"
                  className="border border-black/30 bg-white p-1.5 flex flex-col items-center break-inside-avoid"
                >
                  {photo.caption && (
                    <div
                      className="w-full text-center text-[10.5pt] leading-[1.3] text-black pb-1 font-normal"
                      style={{ ...BASE_TEXT_STYLE, fontSize: '10.5pt', lineHeight: '1.3', textAlign: 'center' }}
                    >
                      {photo.caption}
                    </div>
                  )}
                  <div
                    className="relative w-full h-[190px] overflow-hidden bg-gray-100 flex items-center justify-center"
                    style={{
                      backgroundImage: `url("${photo.url}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    <img
                      src={photo.url}
                      alt={`${phaseTitle} ${i + idx + 1}`}
                      className="opacity-0 w-px h-px pointer-events-none absolute"
                    />
                  </div>
                </div>
              ))}
            </div>
          ),
        });
      }
    };

    const preData = normalizePreChecklist(project.pre_checklist, project);
    const postData = normalizePostChecklist(project.post_checklist, project);
    const pointLocationsUnique = Array.from(
      new Set(locationPoints.map((pt) => pt.lokasi.trim()).filter(Boolean))
    );
    const hasSpecificLokasiArea =
      Boolean(project.lokasi_area?.trim()) && !/^seluruh\s+ruangan$/i.test(project.lokasi_area.trim());
    const formulirAreaDisplay = hasSpecificLokasiArea
      ? lokasiTitleDisplay
      : pointLocationsUnique.length > 0
      ? toSmartTitleCase(pointLocationsUnique.join(', '))
      : toSmartTitleCase(preData.area || lokasiTitleDisplay);
    const preDateFormatted = formatIndonesianDate(preData.tanggal_survey || project.tgl_mulai);
    const postDateFormatted = formatIndonesianDate(postData.tanggal_survey || project.tgl_selesai_estimasi);

    pushPhotoSection(
      'doc-pre',
      '1. Pre Renovasi / Konstruksi',
      prePhotos.map((url) => ({
        url,
        caption: preDateFormatted && preDateFormatted !== '-' ? `Tanggal: ${preDateFormatted}` : undefined,
      })),
      'Belum ada foto dokumentasi pra konstruksi atau renovasi yang diunggah.'
    );

    pushPhotoSection(
      'doc-intra',
      '2. Intra Renovasi / Konstruksi',
      intraPhotos,
      'Belum ada foto dokumentasi intra konstruksi atau renovasi.'
    );

    pushPhotoSection(
      'doc-post',
      '3. Post Renovasi / Konstruksi',
      postPhotos.map((url) => ({
        url,
        caption: postDateFormatted && postDateFormatted !== '-' ? `Tanggal: ${postDateFormatted}` : undefined,
      })),
      'Belum ada foto dokumentasi pasca konstruksi atau renovasi.'
    );

    // ==================== HELPER 5-PIHAK PENGESAHAN PRE / POST ====================
    const pushFivePartySignoffs = (keyPrefix: string, signoffs: IcraChecklistSignoff) => {
      const parties = [
        { label: 'IPSRS', nama: signoffs.ipsrs_nama, paraf: signoffs.ipsrs_paraf },
        { label: 'PPI / IPCN', nama: signoffs.ppi_nama, paraf: signoffs.ppi_paraf },
        { label: 'Kesling', nama: signoffs.kesling_nama, paraf: signoffs.kesling_paraf },
        { label: 'K3RS', nama: signoffs.k3rs_nama, paraf: signoffs.k3rs_paraf },
        { label: 'Kontraktor', nama: signoffs.pihak3_nama, paraf: signoffs.pihak3_paraf },
      ];
      b.push({
        type: 'element',
        key: `${keyPrefix}-signoffs`,
        gapAfter: 10,
        node: (
          <div className="w-full pt-4 space-y-4 text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
            {parties.map((pt, idx) => (
              <div key={idx} className="flex items-end gap-4 min-h-[44px]">
                <div className="flex-1 min-w-0 flex items-baseline">
                  <span className="shrink-0 w-[98px] text-left font-normal">{pt.label}</span>
                  <span className="shrink-0 w-3.5 text-left font-normal">:</span>
                  <span className="flex-1 min-w-0 border-b border-dotted border-black text-left pl-1.5 pr-1 font-normal">
                    {pt.nama ? pt.nama : ''}
                  </span>
                </div>
                <div className="w-[195px] shrink-0 flex items-end">
                  <span className="shrink-0 mr-2 font-normal leading-none pb-0.5">Paraf</span>
                  <div className="flex-1 border-b border-dotted border-black flex items-end justify-center min-h-[40px] px-1 pb-0.5">
                    {pt.paraf ? (
                      <img
                        src={pt.paraf}
                        alt={`Paraf ${pt.label}`}
                        data-pdf-signature-img="true"
                        className="max-h-[38px] max-w-full object-contain"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ),
      });
    };

    // ==================== 12. LAMPIRAN: FORMULIR PRE RENOVASI ====================
    const preSections = getPreChecklistSections(kelasCode);

    b.push({ type: 'pageBreak', key: 'pb-formulir-pre' });
    b.push({
      type: 'element',
      key: 'formulir-pre-title',
      chapterAnchor: 'formulir-pre',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="text-center mb-1" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
          <h2 className="text-[12pt] leading-[1.5] font-bold uppercase text-black" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
            FORMULIR PRE RENOVASI
          </h2>
        </div>
      ),
    });

    // Metadata + Table Header
    b.push({
      type: 'element',
      key: 'formulir-pre-header-table',
      keepWithNext: true,
      gapAfter: 0,
      node: (
        <table className="w-full table-fixed border-collapse text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
          <tbody>
            <tr>
              <td className="border border-black py-1 px-2.5 w-[34%] font-normal">Tanggal / Waktu Survey</td>
              <td className="border border-black py-1 px-2.5 w-[66%] font-normal">
                {formatIndonesianDate(preData.tanggal_survey)}
              </td>
            </tr>
            <tr>
              <td className="border border-black py-1 px-2.5 font-normal">Area</td>
              <td className="border border-black py-1 px-2.5 font-normal">
                {formulirAreaDisplay}
              </td>
            </tr>
            <tr>
              <td className="border border-black py-1 px-2.5 font-normal">Proyek</td>
              <td className="border border-black py-1 px-2.5 font-normal">
                {projectTitleDisplay}
              </td>
            </tr>
          </tbody>
        </table>
      ),
    });

    b.push({
      type: 'element',
      key: 'formulir-pre-colhead',
      keepWithNext: true,
      gapAfter: 0,
      node: (
        <table className="w-full table-fixed border-collapse -mt-[1px] text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
          <thead>
            <tr className="bg-gray-100 text-center">
              <th className="border border-black py-1.5 px-2.5 w-[53%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                KEGIATAN
              </th>
              <th className="border border-black py-1.5 px-1 w-[8%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                YA
              </th>
              <th className="border border-black py-1.5 px-1 w-[11%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                TIDAK
              </th>
              <th className="border border-black py-1.5 px-2 w-[28%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                KETERANGAN
              </th>
            </tr>
          </thead>
        </table>
      ),
    });

    preSections.forEach((sec, secIdx) => {
      const secItems = preData.items.filter((it) => it.section === sec.section);
      const isLastSec = secIdx === preSections.length - 1;

      if (sec.isDirectQuestion && secItems[0]) {
        const item = secItems[0];
        b.push({
          type: 'element',
          key: `pre-form-row-${item.id}`,
          gapAfter: 0,
          node: (
            <table className="w-full table-fixed border-collapse -mt-[1px] text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
              <tbody>
                <tr>
                  <td
                    className="border border-black py-1.5 px-2.5 w-[53%] align-top text-left font-bold"
                    style={{ ...BASE_TEXT_STYLE, fontWeight: 700, textAlign: 'left' }}
                  >
                    {renderAutoHangingTitle(sec.title, true, BASE_TEXT_STYLE)}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[8%] text-center align-middle font-normal">
                    {item.answer === 'YA' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[11%] text-center align-middle font-normal">
                    {item.answer === 'TIDAK' ? '✓' : ''}
                  </td>
                  <td
                    className="border border-black py-1.5 px-2 w-[28%] text-left align-top text-[11pt] font-normal"
                    style={{ ...BASE_TEXT_STYLE, fontSize: '11pt', textAlign: 'left' }}
                  >
                    {item.keterangan ?? item.tanggal ?? ''}
                  </td>
                </tr>
              </tbody>
            </table>
          ),
        });
        return;
      }

      // Section Header Row
      b.push({
        type: 'element',
        key: `pre-form-sec-${sec.section}`,
        keepWithNext: true,
        gapAfter: 0,
        node: (
          <table className="w-full table-fixed border-collapse -mt-[1px] text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
            <tbody>
              <tr>
                <td
                  className="border border-black py-1.5 px-2.5 w-[53%] text-left font-bold"
                  style={{ ...BASE_TEXT_STYLE, fontWeight: 700, textAlign: 'left' }}
                >
                  {renderAutoHangingTitle(sec.title, true, BASE_TEXT_STYLE)}
                </td>
                <td className="border border-black py-1.5 px-1 w-[8%]" />
                <td className="border border-black py-1.5 px-1 w-[11%]" />
                <td className="border border-black py-1.5 px-2 w-[28%]" />
              </tr>
              {sec.subtitle && (
                <tr>
                  <td
                    className="border border-black py-1.5 px-2.5 pl-8 w-[53%] text-left font-normal"
                    style={{ ...BASE_TEXT_STYLE, textAlign: 'left' }}
                  >
                    {sec.subtitle}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[8%]" />
                  <td className="border border-black py-1.5 px-1 w-[11%]" />
                  <td className="border border-black py-1.5 px-2 w-[28%]" />
                </tr>
              )}
            </tbody>
          </table>
        ),
      });

      secItems.forEach((item, idx) => {
        const isLastItem = isLastSec && idx === secItems.length - 1;
        b.push({
          type: 'element',
          key: `pre-form-item-${item.id}`,
          gapAfter: isLastItem ? 10 : 0,
          node: (
            <table className="w-full table-fixed border-collapse -mt-[1px] text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
              <tbody>
                <tr>
                  <td
                    className="border border-black py-1.5 px-2.5 pl-6 w-[53%] align-top text-left font-normal"
                    style={{ ...BASE_TEXT_STYLE, textAlign: 'left' }}
                  >
                    {item.number
                      ? renderHangingItem(item.number, item.label, false, BASE_TEXT_STYLE)
                      : item.label}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[8%] text-center align-middle font-normal">
                    {item.answer === 'YA' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[11%] text-center align-middle font-normal">
                    {item.answer === 'TIDAK' ? '✓' : ''}
                  </td>
                  <td
                    className="border border-black py-1.5 px-2 w-[28%] text-left align-top text-[11pt] font-normal"
                    style={{ ...BASE_TEXT_STYLE, fontSize: '11pt', textAlign: 'left' }}
                  >
                    {item.keterangan ?? item.tanggal ?? ''}
                  </td>
                </tr>
              </tbody>
            </table>
          ),
        });
      });
    });

    pushFivePartySignoffs('pre-form', preData.signoffs);

    // ==================== 13. LAMPIRAN: FORMULIR PEMANTAUAN INTRA RENOVASI ====================
    const intraFormsToRender =
      chronologicalLogs.length > 0
        ? chronologicalLogs
        : [
            {
              id: 'intra-template-default',
              konstruksi_id: project.id,
              tanggal_monitoring: project.tgl_mulai,
              jam_monitoring: '',
              petugas_ipcn: namaIpcn,
              barier_tertutup: true,
              tekanan_negatif_hepa: kelasCode === 'III' || kelasCode === 'IV' ? 'Ya' : 'N/A',
              keset_basah_pintu: true,
              area_sekitar_bersih: true,
              jalur_limbah_tertutup: true,
              apd_pekerja: true,
              status_kepatuhan: 'Sesuai Standar' as const,
              foto_monitoring: [],
              area_renovasi: formulirAreaDisplay,
              intra_items: buildDefaultIntraItems(kelasCode),
            },
          ];

    intraFormsToRender.forEach((log, logIdx) => {
      b.push({ type: 'pageBreak', key: `pb-formulir-intra-${log.id}-${logIdx}` });

      const formItems =
        Array.isArray(log.intra_items) && log.intra_items.length > 0
          ? normalizeIntraItems(log.intra_items, kelasCode)
          : buildDefaultIntraItems(kelasCode).map((defItem) => {
              const lower = defItem.kegiatan.toLowerCase();
              let ans: 'YA' | 'TIDAK' | 'N/A' = 'YA';
              if (lower.includes('barrier') || lower.includes('pembatas')) {
                ans = log.barier_tertutup ? 'YA' : 'TIDAK';
              } else if (lower.includes('hepa') || lower.includes('tekanan udara negatif')) {
                ans =
                  log.tekanan_negatif_hepa === 'Ya'
                    ? 'YA'
                    : log.tekanan_negatif_hepa === 'Tidak'
                    ? 'TIDAK'
                    : 'N/A';
              } else if (lower.includes('keset')) {
                ans = log.keset_basah_pintu ? 'YA' : 'TIDAK';
              } else if (lower.includes('pembersihan harian')) {
                ans = log.area_sekitar_bersih ? 'YA' : 'TIDAK';
              } else if (lower.includes('limbah') || lower.includes('puing')) {
                ans = log.jalur_limbah_tertutup ? 'YA' : 'TIDAK';
              } else if (lower.includes('apd')) {
                ans = log.apd_pekerja ? 'YA' : 'TIDAK';
              }
              return { ...defItem, answer: ans };
            });

      b.push({
        type: 'element',
        key: `formulir-intra-head-${log.id}-${logIdx}`,
        chapterAnchor: logIdx === 0 ? 'formulir-intra' : undefined,
        keepWithNext: true,
        gapAfter: 5,
        node: (
          <div className="space-y-2 text-[11.5pt] leading-[1.35] text-black" style={{ ...INTRA_FORM_STYLE, fontSize: '11.5pt' }}>
            <div className="text-center">
              <h2
                className="text-[11.5pt] leading-[1.35] font-bold uppercase text-black"
                style={{ ...INTRA_FORM_STYLE, fontSize: '11.5pt', fontWeight: 700, letterSpacing: '0.02em' }}
              >
                FORMULIR PEMANTAUAN SELAMA RENOVASI / KONSTRUKSI BANGUNAN
              </h2>
            </div>

            <table className="w-full border-collapse text-[11pt] leading-[1.35] text-black font-normal" style={INTRA_FORM_STYLE}>
              <tbody>
                <tr>
                  <td className="py-0.5 w-[26%] font-normal">Area renovasi</td>
                  <td
                    className="py-0.5 w-[4%] text-center align-middle font-normal"
                    style={{ textAlign: 'center', verticalAlign: 'middle' }}
                  >
                    :
                  </td>
                  <td className="py-0.5 font-normal">
                    {log.area_renovasi && !/^seluruh\s+ruangan$/i.test(log.area_renovasi.trim())
                      ? toSmartTitleCase(log.area_renovasi)
                      : formulirAreaDisplay}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 font-normal">Tanggal pemantauan</td>
                  <td
                    className="py-0.5 text-center align-middle font-normal"
                    style={{ textAlign: 'center', verticalAlign: 'middle' }}
                  >
                    :
                  </td>
                  <td className="py-0.5 font-normal">
                    {formatIndonesianDate(log.tanggal_monitoring)}
                    {log.jam_monitoring ? ` (Pukul ${log.jam_monitoring} WIB)` : ''}
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="text-[11pt] leading-[1.35] font-bold uppercase text-black" style={{ ...INTRA_FORM_STYLE, fontWeight: 700 }}>
              KATEGORI {kelasCode}
            </p>
          </div>
        ),
      });

      formItems.forEach((it, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === formItems.length - 1;
        b.push({
          type: 'element',
          key: `formulir-intra-row-${log.id}-${idx}`,
          gapAfter: isLast ? 8 : 0,
          node: (
            <table
              className={`w-full table-fixed border-collapse text-[11pt] leading-[1.35] text-black font-normal ${
                isFirst ? '' : '-mt-[1px]'
              }`}
              style={INTRA_FORM_STYLE}
            >
              {isFirst && (
                <thead>
                  <tr className="bg-gray-100 text-center">
                    <th className="border border-black py-1.5 px-1 w-[6%] font-bold" style={{ ...INTRA_FORM_STYLE, fontWeight: 700 }}>
                      NO
                    </th>
                    <th className="border border-black py-1.5 px-2 w-[49%] text-center font-bold" style={{ ...INTRA_FORM_STYLE, fontWeight: 700 }}>
                      KEGIATAN
                    </th>
                    <th className="border border-black py-1.5 px-1 w-[6%] font-bold" style={{ ...INTRA_FORM_STYLE, fontWeight: 700 }}>
                      YA
                    </th>
                    <th className="border border-black py-1.5 px-1 w-[9%] font-bold" style={{ ...INTRA_FORM_STYLE, fontWeight: 700 }}>
                      TIDAK
                    </th>
                    <th className="border border-black py-1.5 px-1 w-[7%] font-bold" style={{ ...INTRA_FORM_STYLE, fontWeight: 700 }}>
                      N/A
                    </th>
                    <th className="border border-black py-1.5 px-1.5 w-[23%] font-bold" style={{ ...INTRA_FORM_STYLE, fontWeight: 700 }}>
                      KETERANGAN
                    </th>
                  </tr>
                </thead>
              )}
              <tbody>
                <tr>
                  <td className="border border-black py-[5px] px-1 w-[6%] text-center align-top font-normal">
                    {it.no}
                  </td>
                  <td className="border border-black py-[5px] px-2 w-[49%] align-top text-left font-normal">
                    {it.kegiatan}
                  </td>
                  <td className="border border-black py-[5px] px-1 w-[6%] text-center align-middle font-normal">
                    {it.answer === 'YA' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-[5px] px-1 w-[9%] text-center align-middle font-normal">
                    {it.answer === 'TIDAK' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-[5px] px-1 w-[7%] text-center align-middle font-normal">
                    {it.answer === 'N/A' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-[5px] px-1.5 w-[23%] align-top text-left text-[10.5pt] font-normal">
                    {it.keterangan || ''}
                  </td>
                </tr>
              </tbody>
            </table>
          ),
        });
      });

      if (log.temuan_lapangan || log.tindakan_koreksi) {
        b.push({
          type: 'element',
          key: `formulir-intra-notes-${log.id}-${logIdx}`,
          gapAfter: 6,
          node: (
            <div className="border border-black p-1.5 text-[10.5pt] leading-[1.3] text-black font-normal" style={{ ...INTRA_FORM_STYLE, fontSize: '10.5pt', lineHeight: '1.3' }}>
              {log.temuan_lapangan && <p>Temuan lapangan: {log.temuan_lapangan}</p>}
              {log.tindakan_koreksi && <p>Tindakan koreksi: {log.tindakan_koreksi}</p>}
            </div>
          ),
        });
      }
    });

    // ==================== 14. LAMPIRAN: FORMULIR POST RENOVASI ====================
    const postSections = getPostChecklistSections(kelasCode);

    b.push({ type: 'pageBreak', key: 'pb-formulir-post' });
    b.push({
      type: 'element',
      key: 'formulir-post-title',
      chapterAnchor: 'formulir-post',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="text-center mb-1" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
          <h2 className="text-[12pt] leading-[1.5] font-bold uppercase text-black" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
            FORMULIR POST RENOVASI
          </h2>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'formulir-post-header-table',
      keepWithNext: true,
      gapAfter: 0,
      node: (
        <table className="w-full table-fixed border-collapse text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
          <tbody>
            <tr>
              <td className="border border-black py-1 px-2.5 w-[34%] font-normal">Tanggal / Waktu Survey</td>
              <td className="border border-black py-1 px-2.5 w-[66%] font-normal">
                {formatIndonesianDate(postData.tanggal_survey)}
              </td>
            </tr>
            <tr>
              <td className="border border-black py-1 px-2.5 font-normal">Area</td>
              <td className="border border-black py-1 px-2.5 font-normal">
                {formulirAreaDisplay}
              </td>
            </tr>
            <tr>
              <td className="border border-black py-1 px-2.5 font-normal">Proyek</td>
              <td className="border border-black py-1 px-2.5 font-normal">
                {projectTitleDisplay}
              </td>
            </tr>
          </tbody>
        </table>
      ),
    });

    b.push({
      type: 'element',
      key: 'formulir-post-colhead',
      keepWithNext: true,
      gapAfter: 0,
      node: (
        <table className="w-full table-fixed border-collapse -mt-[1px] text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
          <thead>
            <tr className="bg-gray-100 text-center">
              <th className="border border-black py-1.5 px-2.5 w-[53%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                KEGIATAN
              </th>
              <th className="border border-black py-1.5 px-1 w-[8%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                YA
              </th>
              <th className="border border-black py-1.5 px-1 w-[11%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                TIDAK
              </th>
              <th className="border border-black py-1.5 px-2 w-[28%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                KETERANGAN
              </th>
            </tr>
          </thead>
        </table>
      ),
    });

    postSections.forEach((sec, secIdx) => {
      const secItems = postData.items.filter((it) => it.section === sec.section);
      const isLastSec = secIdx === postSections.length - 1;

      b.push({
        type: 'element',
        key: `post-form-sec-${sec.section}`,
        keepWithNext: true,
        gapAfter: 0,
        node: (
          <table className="w-full table-fixed border-collapse -mt-[1px] text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
            <tbody>
              <tr>
                <td
                  className="border border-black py-1.5 px-2.5 w-[53%] text-left font-bold"
                  style={{ ...BASE_TEXT_STYLE, fontWeight: 700, textAlign: 'left' }}
                >
                  {renderAutoHangingTitle(sec.title, true, BASE_TEXT_STYLE)}
                </td>
                <td className="border border-black py-1.5 px-1 w-[8%]" />
                <td className="border border-black py-1.5 px-1 w-[11%]" />
                <td className="border border-black py-1.5 px-2 w-[28%]" />
              </tr>
            </tbody>
          </table>
        ),
      });

      secItems.forEach((item, idx) => {
        const isLastItem = isLastSec && idx === secItems.length - 1;
        const itemBody = (
          <>
            <div>{item.label}</div>
            {item.subNotes && item.subNotes.length > 0 && (
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-left font-normal" style={{ textAlign: 'left' }}>
                {item.subNotes.map((sn, snIdx) => (
                  <li key={snIdx}>{sn}</li>
                ))}
              </ul>
            )}
          </>
        );
        b.push({
          type: 'element',
          key: `post-form-item-${item.id}`,
          gapAfter: isLastItem ? 10 : 0,
          node: (
            <table className="w-full table-fixed border-collapse -mt-[1px] text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
              <tbody>
                <tr>
                  <td
                    className="border border-black py-1.5 px-2.5 pl-6 w-[53%] align-top text-left font-normal"
                    style={{ ...BASE_TEXT_STYLE, textAlign: 'left' }}
                  >
                    {item.number
                      ? renderHangingItem(item.number, itemBody, false, BASE_TEXT_STYLE)
                      : itemBody}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[8%] text-center align-middle font-normal">
                    {item.answer === 'YA' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[11%] text-center align-middle font-normal">
                    {item.answer === 'TIDAK' ? '✓' : ''}
                  </td>
                  <td
                    className="border border-black py-1.5 px-2 w-[28%] text-left align-top text-[11pt] font-normal"
                    style={{ ...BASE_TEXT_STYLE, fontSize: '11pt', textAlign: 'left' }}
                  >
                    {item.keterangan ?? item.tanggal ?? ''}
                  </td>
                </tr>
              </tbody>
            </table>
          ),
        });
      });
    });

    pushFivePartySignoffs('post-form', postData.signoffs);

    return b;
  }, [
    project,
    projectTitleDisplay,
    lokasiTitleDisplay,
    areaTerdampakTitle,
    kontraktorDisplay,
    pjProyekDisplay,
    namaIpcn,
    ketuaPpiName,
    tglPengesahan,
    tipeCode,
    riskCode,
    riskRoman,
    riskInfo.riskLabel,
    kelasCode,
    latarBelakangParagraphs,
    tujuanText,
    ruangLingkupText,
    matriksResultText,
    praActions,
    saatActions,
    pascaActions,
    kesimpulanParagraphs,
    rekomendasiIntro,
    rekomendasiSections,
    rekomendasiClosing,
    penutupParagraphs,
    locationPoints,
    chronologicalLogs,
    prePhotos,
    intraPhotos,
    postPhotos,
  ]);

  const coverSubtitle = useMemo(() => {
    const cleaned = cleanedBaseName
      .replace(/\(\s*\d+\s*titik(\s+lokasi)?\s*\)/gi, '')
      .replace(/\bmulti[\s-]*(unit|lokasi)\b/gi, '')
      .replace(/\b\d+\s*titik(\s+lokasi)?\b/gi, '')
      .replace(/^(pada\s+kegiatan|kegiatan)\s+/i, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/[\s\-–—,:;]+$/g, '')
      .trim();
    const upper = (cleaned || cleanedBaseName).toUpperCase();
    return upper.startsWith('PADA KEGIATAN ') ? upper : `PADA KEGIATAN ${upper}`;
  }, [cleanedBaseName]);

  const coverNode = useMemo(
    () => (
      <ReportCover
        reportType="icra"
        title="LAPORAN PELAKSANAAN INFECTION CONTROL RISK ASSESSMENT (ICRA)"
        subtitle={coverSubtitle}
        hospitalText="UOBK RSUD AL-MULK KOTA SUKABUMI"
        year={projectYear}
      />
    ),
    [coverSubtitle, projectYear]
  );

  return (
    <AutoPaginatedF4Document
      id={documentId}
      coverPage={coverNode}
      frontMatterPages={frontMatterPages}
      blocks={blocks}
      numberingMode="bodyStartsAtOne"
      onChaptersResolved={handleChaptersResolved}
    />
  );
}

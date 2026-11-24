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

function renderNarrativeText(text: string): React.ReactNode {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export default function IcraOfficialReport({
  project,
  monitoringLogs = [],
  ketuaPpiName = 'dr. Nurul Iman',
  signDate,
  documentId = 'print-area-icra',
}: IcraOfficialReportProps) {
  const narrative = useMemo(
    () => buildIcraReportNarrative(project, monitoringLogs),
    [project, monitoringLogs]
  );

  const {
    projectYear,
    cleanedBaseName,
    projectTitleDisplay,
    lokasiTitleDisplay,
    lokasiLengkapTable,
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
    monitoringLogs.forEach((log) => {
      (log.foto_monitoring || []).forEach((u) => {
        const norm = normalizeImageUrl(u);
        if (norm && !seen.has(norm)) {
          seen.add(norm);
          all.push({
            url: norm,
            caption: `Monitoring ${formatIndonesianDate(log.tanggal_monitoring)}`,
          });
        }
      });
    });
    return all;
  }, [monitoringLogs]);

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
                { label: 'LAPORAN INFECTION CONTROL RISK ASSESSMENT (ICRA)', page: '1', indent: false },
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
                  <span className="shrink-0 font-normal">{entry.label}</span>
                  <span className="flex-1 mx-2 border-b border-dotted border-black" />
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

    // Sub-heading (BOLD)
    const pushSubHeading = (key: string, title: string) => {
      b.push({
        type: 'element',
        key,
        keepWithNext: true,
        gapAfter: 4,
        node: (
          <p
            className="text-[12pt] leading-[1.5] font-bold text-black mt-1"
            style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
          >
            {title}
          </p>
        ),
      });
    };

    // Normal body paragraph (Arial 12pt, line-height 1.5, strictly normal weight)
    const pushParagraph = (key: string, content: React.ReactNode, gapAfter = 8, indent = true) => {
      b.push({
        type: 'element',
        key,
        gapAfter,
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
            LAPORAN ICRA (INFECTION CONTROL RISK ASSESSMENT)
          </h1>
          <p
            className="text-[12pt] leading-[1.5] font-bold text-black"
            style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
          >
            {projectTitleDisplay}
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
        idx === latarBelakangParagraphs.length - 1 ? 12 : 8
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
        <p className="pl-5 text-[12pt] leading-[1.5] text-justify text-black font-normal" style={BASE_TEXT_STYLE}>
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
        <p className="pl-5 text-[12pt] leading-[1.5] text-justify text-black font-normal" style={BASE_TEXT_STYLE}>
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
          className="w-full border-collapse text-[12pt] leading-[1.5] text-black font-normal"
          style={BASE_TEXT_STYLE}
        >
          <tbody>
            <tr>
              <td className="py-1 px-1.5 align-top w-8 font-normal">1.</td>
              <td className="py-1 px-1.5 align-top w-44 font-normal">Tanggal</td>
              <td className="py-1 px-1 align-top w-4 font-normal">:</td>
              <td className="py-1 px-1.5 align-top font-normal">
                {formatIndonesianDate(project.tgl_mulai)} s/d {formatIndonesianDate(project.tgl_selesai_estimasi)}
              </td>
            </tr>
            <tr>
              <td className="py-1 px-1.5 align-top font-normal">2.</td>
              <td className="py-1 px-1.5 align-top font-normal">Lokasi</td>
              <td className="py-1 px-1 align-top font-normal">:</td>
              <td className="py-1 px-1.5 align-top font-normal">{lokasiLengkapTable}</td>
            </tr>
            <tr>
              <td className="py-1 px-1.5 align-top font-normal">3.</td>
              <td className="py-1 px-1.5 align-top font-normal">Kegiatan</td>
              <td className="py-1 px-1 align-top font-normal">:</td>
              <td className="py-1 px-1.5 align-top font-normal">{projectTitleDisplay}</td>
            </tr>
            <tr>
              <td className="py-1 px-1.5 align-top font-normal">4.</td>
              <td className="py-1 px-1.5 align-top font-normal">Pelaksana / PJ</td>
              <td className="py-1 px-1 align-top font-normal">:</td>
              <td className="py-1 px-1.5 align-top font-normal">
                {kontraktorDisplay}{pjProyekDisplay ? ` (Penanggung Jawab: ${pjProyekDisplay})` : ''}
              </td>
            </tr>
            {project.nomor_izin && (
              <tr>
                <td className="py-1 px-1.5 align-top font-normal">5.</td>
                <td className="py-1 px-1.5 align-top font-normal">Nomor Izin ICRA</td>
                <td className="py-1 px-1 align-top font-normal">:</td>
                <td className="py-1 px-1.5 align-top font-normal">{project.nomor_izin}</td>
              </tr>
            )}
          </tbody>
        </table>
      ),
    });

    // ==================== 4. TIPE PROYEK KONSTRUKSI (ATOMIC ROWS) ====================
    pushHeading('sec-tipe-proyek', 'TIPE PROYEK KONSTRUKSI', 'tipe-proyek');
    b.push({
      type: 'element',
      key: 'tipe-proyek-intro',
      keepWithNext: true,
      gapAfter: 6,
      node: (
        <p className="text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
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
                    className="border border-black py-1.5 px-2.5 w-[24%] font-bold"
                    style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                  >
                    Tipe Proyek
                  </th>
                  <th
                    className="border border-black py-1.5 px-2.5 w-[76%] text-left font-bold"
                    style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                  >
                    Deskripsi
                  </th>
                </tr>
              </thead>
            )}
            <tbody>
              <tr style={{ backgroundColor: isSelected ? '#fef9c3' : '#ffffff' }}>
                <td className="border border-black py-1.5 px-2.5 w-[24%] align-top text-center font-normal">
                  Tipe {ct.code}{isSelected ? ' (Dipilih)' : ''}
                </td>
                <td className="border border-black py-1.5 px-2.5 w-[76%] align-top text-left font-normal">
                  {ct.shortDesc}: {ct.items.join('; ')}.
                </td>
              </tr>
            </tbody>
          </table>
        ),
      });
    });

    // ==================== 5. KATEGORI RISIKO PASIEN (ATOMIC ROWS) ====================
    pushHeading('sec-kategori-risiko', 'KATEGORI RISIKO PASIEN', 'kategori-risiko');
    b.push({
      type: 'element',
      key: 'kategori-risiko-intro',
      keepWithNext: true,
      gapAfter: 6,
      node: (
        <p className="text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
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
                    className="border border-black py-1.5 px-2.5 w-[36%] text-left font-bold"
                    style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                  >
                    Kategori Risiko
                  </th>
                  <th
                    className="border border-black py-1.5 px-2.5 w-[64%] text-left font-bold"
                    style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                  >
                    Deskripsi Unit
                  </th>
                </tr>
              </thead>
            )}
            <tbody>
              <tr style={{ backgroundColor: isSelected ? '#fef9c3' : '#ffffff' }}>
                <td className="border border-black py-1.5 px-2.5 w-[36%] align-top text-left font-normal">
                  Kategori {roman} (Risiko {rg.riskLabel}){isSelected ? ' — Dipilih' : ''}
                </td>
                <td className="border border-black py-1.5 px-2.5 w-[64%] align-top text-left font-normal">
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
          <p className="text-[12pt] leading-[1.5] font-normal">
            (Menentukan Kategori Pengendalian Berdasarkan Kombinasi Tipe Proyek dan Risiko Pasien)
          </p>
          <table
            className="w-full table-fixed border-collapse border border-black text-[12pt] leading-[1.5] font-normal"
            style={BASE_TEXT_STYLE}
          >
            <thead>
              <tr className="bg-gray-100 text-center">
                <th
                  className="border border-black py-1.5 px-2.5 text-left w-[44%] font-bold"
                  style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
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
    pushHeading('sec-rencana-tindakan', 'RENCANA TINDAKAN PENGENDALIAN INFEKSI', 'rencana-tindakan');

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
          gapAfter: isLast ? 10 : 0,
          node: (
            <table
              className={`w-full table-fixed border-collapse text-[12pt] leading-[1.5] text-black font-normal ${
                isFirst ? '' : '-mt-[1px]'
              }`}
              style={BASE_TEXT_STYLE}
            >
              {isFirst && (
                <thead>
                  <tr className="bg-gray-100">
                    <th
                      className="border border-black py-1.5 px-2 text-center w-[9%] font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                    >
                      No
                    </th>
                    <th
                      className="border border-black py-1.5 px-2.5 text-left w-[63%] font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                    >
                      Tindakan
                    </th>
                    <th
                      className="border border-black py-1.5 px-2.5 text-left w-[28%] font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                    >
                      Penanggung Jawab
                    </th>
                  </tr>
                </thead>
              )}
              <tbody>
                <tr>
                  <td className="border border-black py-1.5 px-2 text-center align-top w-[9%] font-normal">
                    {idx + 1}
                  </td>
                  <td className="border border-black py-1.5 px-2.5 align-top text-justify w-[63%] font-normal">
                    {renderNarrativeText(r.tindakan)}
                  </td>
                  <td className="border border-black py-1.5 px-2.5 align-top text-left w-[28%] font-normal">
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
    pushAtomicActionTable(
      'saat',
      `Tindakan Saat Renovasi — Kelas ${kelasCode} (Selama Pekerjaan)`,
      saatActions
    );
    pushAtomicActionTable(
      'pasca',
      `Tindakan Pasca-Renovasi — Kelas ${kelasCode} (Setelah Pekerjaan)`,
      pascaActions
    );

    if (project.persyaratan_khusus && project.persyaratan_khusus.trim()) {
      pushSubHeading('persyaratan-khusus-title', 'Catatan dan Persyaratan Khusus Lapangan');
      pushParagraph('persyaratan-khusus-body', toMidSentenceProse(project.persyaratan_khusus.trim()), 10, false);
    }

    if (monitoringLogs.length > 0) {
      pushSubHeading(
        'monitoring-summary-title',
        `Ringkasan Pemantauan Harian IPCN (${monitoringLogs.length} Kunjungan)`
      );
      const shownLogs = monitoringLogs.slice(0, 12);
      shownLogs.forEach((m, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === shownLogs.length - 1;
        b.push({
          type: 'element',
          key: `mon-row-${m.id}-${idx}`,
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
                      className="border border-black py-1.5 px-1.5 w-[9%] font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                    >
                      No
                    </th>
                    <th
                      className="border border-black py-1.5 px-2 w-[25%] font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                    >
                      Tanggal
                    </th>
                    <th
                      className="border border-black py-1.5 px-2 w-[22%] font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                    >
                      Status
                    </th>
                    <th
                      className="border border-black py-1.5 px-2 w-[44%] text-left font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                    >
                      Temuan dan Tindak Lanjut
                    </th>
                  </tr>
                </thead>
              )}
              <tbody>
                <tr>
                  <td className="border border-black py-1.5 px-1.5 w-[9%] text-center align-top font-normal">
                    {idx + 1}
                  </td>
                  <td className="border border-black py-1.5 px-2 w-[25%] text-center align-top font-normal">
                    {formatIndonesianDate(m.tanggal_monitoring)}
                  </td>
                  <td className="border border-black py-1.5 px-2 w-[22%] text-center align-top font-normal">
                    {m.status_kepatuhan}
                  </td>
                  <td className="border border-black py-1.5 px-2 w-[44%] text-left align-top font-normal">
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
    pushHeading('sec-kesimpulan', 'KESIMPULAN', 'kesimpulan');
    kesimpulanParagraphs.forEach((pText, idx) => {
      pushParagraph(
        `kes-${idx + 1}`,
        renderNarrativeText(pText),
        idx === kesimpulanParagraphs.length - 1 ? 12 : 8
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
    pushHeading('sec-penutup', 'PENUTUP', 'penutup');
    penutupParagraphs.forEach((pText, idx) => {
      pushParagraph(
        `pen-${idx + 1}`,
        renderNarrativeText(pText),
        idx === penutupParagraphs.length - 1 ? 14 : 8
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
                    className="max-h-16 object-contain"
                  />
                ) : null}
              </div>
              <p className="font-normal underline">{namaIpcn}</p>
              <p className="font-normal">Infection Prevention Control Nurse</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="font-normal">Mengetahui</p>
              <div className="h-20 flex items-center justify-center my-1" />
              <p className="font-normal underline">{ketuaPpiName}</p>
              <p className="font-normal">Ketua PPI</p>
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
                  className="border border-black/30 bg-white p-1.5 flex flex-col items-center"
                >
                  <div className="w-full h-[205px] overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img
                      src={photo.url}
                      alt={`${phaseTitle} ${i + idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          ),
        });
      }
    };

    pushPhotoSection(
      'doc-pre',
      '1. Pre Renovasi / Konstruksi',
      prePhotos.map((url) => ({ url })),
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
      postPhotos.map((url) => ({ url })),
      'Belum ada foto dokumentasi pasca konstruksi atau renovasi.'
    );

    // ==================== HELPER 5-PIHAK PENGESAHAN PRE / POST ====================
    const pushFivePartySignoffs = (keyPrefix: string, signoffs: IcraChecklistSignoff) => {
      const parties = [
        { label: 'IPSRS', nama: signoffs.ipsrs_nama, tgl: signoffs.ipsrs_tanggal },
        { label: 'PPI / IPCN', nama: signoffs.ppi_nama, tgl: signoffs.ppi_tanggal },
        { label: 'Kesling', nama: signoffs.kesling_nama, tgl: signoffs.kesling_tanggal },
        { label: 'K3 RS', nama: signoffs.k3rs_nama, tgl: signoffs.k3rs_tanggal },
        { label: 'Pihak ke 3 Pembangunan', nama: signoffs.pihak3_nama, tgl: signoffs.pihak3_tanggal },
      ];
      b.push({
        type: 'element',
        key: `${keyPrefix}-signoffs`,
        gapAfter: 10,
        node: (
          <div className="w-full pt-3 space-y-3 text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
            {parties.map((pt, idx) => (
              <div key={idx} className="grid grid-cols-12 items-baseline gap-2">
                <div className="col-span-7 flex items-baseline">
                  <span className="shrink-0 mr-1.5 font-normal">{pt.label}</span>
                  <span className="flex-1 border-b border-dotted border-black text-center px-1 font-normal">
                    {pt.nama ? pt.nama : ''}
                  </span>
                </div>
                <div className="col-span-5 flex items-baseline">
                  <span className="shrink-0 mr-1.5 font-normal">Tanggal</span>
                  <span className="flex-1 border-b border-dotted border-black text-center px-1 font-normal">
                    {pt.tgl ? formatIndonesianDate(pt.tgl) : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ),
      });
    };

    // ==================== 12. LAMPIRAN: FORMULIR PRE RENOVASI ====================
    const preData = normalizePreChecklist(project.pre_checklist, project);
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
                {toSmartTitleCase(preData.area || lokasiTitleDisplay)}
              </td>
            </tr>
            <tr>
              <td className="border border-black py-1 px-2.5 font-normal">Proyek</td>
              <td className="border border-black py-1 px-2.5 font-normal">
                {toSmartTitleCase(preData.proyek || projectTitleDisplay)}
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
                  <td className="border border-black py-1.5 px-2.5 w-[53%] align-top font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                    {sec.title}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[8%] text-center align-middle font-normal">
                    {item.answer === 'YA' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[11%] text-center align-middle font-normal">
                    {item.answer === 'TIDAK' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-2 w-[28%] text-left align-top text-[11pt] font-normal">
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
                <td className="border border-black py-1.5 px-2.5 w-[53%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                  {sec.title}
                </td>
                <td className="border border-black py-1.5 px-1 w-[8%]" />
                <td className="border border-black py-1.5 px-1 w-[11%]" />
                <td className="border border-black py-1.5 px-2 w-[28%]" />
              </tr>
              {sec.subtitle && (
                <tr>
                  <td className="border border-black py-1.5 px-2.5 w-[53%] font-normal">
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
                  <td className="border border-black py-1.5 px-2.5 pl-6 w-[53%] align-top font-normal">
                    <span className="mr-1.5">{item.number}</span>
                    <span>{item.label}</span>
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[8%] text-center align-middle font-normal">
                    {item.answer === 'YA' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[11%] text-center align-middle font-normal">
                    {item.answer === 'TIDAK' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-2 w-[28%] text-left align-top text-[11pt] font-normal">
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
      monitoringLogs.length > 0
        ? monitoringLogs
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
              area_renovasi: lokasiTitleDisplay,
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
        gapAfter: 6,
        node: (
          <div className="space-y-3 text-[12pt] leading-[1.5] text-black" style={BASE_TEXT_STYLE}>
            <div className="text-center">
              <h2
                className="text-[12pt] leading-[1.5] font-bold uppercase text-black"
                style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
              >
                FORMULIR PEMANTAUAN SELAMA RENOVASI / KONSTRUKSI BANGUNAN
              </h2>
            </div>

            <table className="w-full border-collapse text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
              <tbody>
                <tr>
                  <td className="py-0.5 w-[28%] font-normal">Area renovasi</td>
                  <td className="py-0.5 w-[3%] font-normal">:</td>
                  <td className="py-0.5 font-normal">
                    {toSmartTitleCase(log.area_renovasi || lokasiTitleDisplay)}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 font-normal">Tanggal pemantauan</td>
                  <td className="py-0.5 font-normal">:</td>
                  <td className="py-0.5 font-normal">
                    {formatIndonesianDate(log.tanggal_monitoring)}
                    {log.jam_monitoring ? ` (Pukul ${log.jam_monitoring} WIB)` : ''}
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="text-[12pt] leading-[1.5] font-bold uppercase text-black" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
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
                    <th className="border border-black py-1.5 px-1 w-[7%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                      NO
                    </th>
                    <th className="border border-black py-1.5 px-2.5 w-[47%] text-center font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                      KEGIATAN
                    </th>
                    <th className="border border-black py-1.5 px-1 w-[7%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                      YA
                    </th>
                    <th className="border border-black py-1.5 px-1 w-[10%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                      TIDAK
                    </th>
                    <th className="border border-black py-1.5 px-1 w-[8%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                      N/A
                    </th>
                    <th className="border border-black py-1.5 px-2 w-[21%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                      KETERANGAN
                    </th>
                  </tr>
                </thead>
              )}
              <tbody>
                <tr>
                  <td className="border border-black py-1.5 px-1 w-[7%] text-center align-top font-normal">
                    {it.no}
                  </td>
                  <td className="border border-black py-1.5 px-2.5 w-[47%] align-top text-left font-normal">
                    {it.kegiatan}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[7%] text-center align-middle font-normal">
                    {it.answer === 'YA' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[10%] text-center align-middle font-normal">
                    {it.answer === 'TIDAK' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[8%] text-center align-middle font-normal">
                    {it.answer === 'N/A' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-2 w-[21%] align-top text-left text-[11pt] font-normal">
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
          gapAfter: 10,
          node: (
            <div className="border border-black p-2.5 text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
              {log.temuan_lapangan && <p>Temuan lapangan: {log.temuan_lapangan}</p>}
              {log.tindakan_koreksi && <p>Tindakan koreksi: {log.tindakan_koreksi}</p>}
            </div>
          ),
        });
      }

      // Petugas yang mengobservasi block (Page 17-18 style)
      b.push({
        type: 'element',
        key: `formulir-intra-obs-${log.id}-${logIdx}`,
        gapAfter: 10,
        node: (
          <div className="flex justify-end pt-3 pr-4 text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
            <div className="text-center w-[46%]">
              <p className="font-normal">Petugas yang mengobservasi</p>
              <div className="h-16 flex items-center justify-center my-1">
                {project.ttd_ipcn && (log.petugas_ipcn === namaIpcn || !log.petugas_ipcn) ? (
                  <img src={project.ttd_ipcn} alt="Tanda tangan petugas" className="max-h-14 object-contain" />
                ) : null}
              </div>
              <p className="font-normal">
                ( {log.petugas_ipcn || namaIpcn} )
              </p>
            </div>
          </div>
        ),
      });
    });

    // ==================== 14. LAMPIRAN: FORMULIR POST RENOVASI ====================
    const postData = normalizePostChecklist(project.post_checklist, project);
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
                {toSmartTitleCase(postData.area || lokasiTitleDisplay)}
              </td>
            </tr>
            <tr>
              <td className="border border-black py-1 px-2.5 font-normal">Proyek</td>
              <td className="border border-black py-1 px-2.5 font-normal">
                {toSmartTitleCase(postData.proyek || projectTitleDisplay)}
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
                <td className="border border-black py-1.5 px-2.5 w-[53%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                  {sec.title}
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
        b.push({
          type: 'element',
          key: `post-form-item-${item.id}`,
          gapAfter: isLastItem ? 10 : 0,
          node: (
            <table className="w-full table-fixed border-collapse -mt-[1px] text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
              <tbody>
                <tr>
                  <td className="border border-black py-1.5 px-2.5 pl-6 w-[53%] align-top font-normal">
                    <div>
                      <span className="mr-1.5">{item.number}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.subNotes && item.subNotes.length > 0 && (
                      <ul className="list-disc pl-5 mt-1 space-y-0.5 font-normal">
                        {item.subNotes.map((sn, snIdx) => (
                          <li key={snIdx}>{sn}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[8%] text-center align-middle font-normal">
                    {item.answer === 'YA' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[11%] text-center align-middle font-normal">
                    {item.answer === 'TIDAK' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-2 w-[28%] text-left align-top text-[11pt] font-normal">
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
    lokasiLengkapTable,
    kontraktorDisplay,
    pjProyekDisplay,
    namaIpcn,
    ketuaPpiName,
    tglPengesahan,
    tipeCode,
    riskCode,
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
    monitoringLogs,
    prePhotos,
    intraPhotos,
    postPhotos,
  ]);

  const coverNode = useMemo(
    () => (
      <ReportCover
        reportType="icra"
        title="LAPORAN INFECTION CONTROL RISK ASSESSMENT (ICRA)"
        subtitle={cleanedBaseName.toUpperCase()}
        hospitalText="UOBK RSUD AL-MULK KOTA SUKABUMI"
        year={projectYear}
      />
    ),
    [cleanedBaseName, projectYear]
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

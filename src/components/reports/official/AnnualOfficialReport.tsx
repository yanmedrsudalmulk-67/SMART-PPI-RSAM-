import React, { useMemo, useState, useCallback } from 'react';
import ReportCover from './ReportCover';
import OfficialComparisonLineChart from './OfficialComparisonLineChart';
import OfficialGroupedBarChart from './OfficialGroupedBarChart';
import AutoPaginatedF4Document, { FlowBlock, FrontMatterPageSpec } from './AutoPaginatedF4Document';
import { OfficialReportData, useOfficialReportData } from '@/hooks/useOfficialReportData';
import {
  buildSingleHaisNarrative,
  buildHandHygieneTrendNarrative,
  buildHandHygieneProfessionNarrative,
  buildApdNarrative,
  buildIpalNarrative,
  narrativeToFlowBlocks,
  fmtIdNum,
} from '@/utils/officialChartNarratives';

interface AnnualReportProps {
  year?: number;
  reportData?: OfficialReportData;
}

const IPAL_INLET_ROWS = [
  { param: 'Suhu', values: ['23,5', '23,5', '23,5', '23,7', '16,8', '23,2', '19,7', '23,7', '24,4', '21,2', '23,2', '19'], normal: '30' },
  { param: 'TSS', values: ['27', '17', '15', '18', '10', '5', '<5', '5', '5', '11', '5', '5'], normal: '30' },
  { param: 'PH', values: ['5,97', '3,99', '4,24', '6,93', '6,79', '6,94', '7,24', '7,46', '7,4', '6,6', '7,09', '8'], normal: '6,0 - 9,0' },
  { param: 'BOD', values: ['11', '11', '10', '9', '37', '55', '<10', '29', '53', '54', '53', '28'], normal: '30' },
  { param: 'COD', values: ['32', '32', '30', '28', '106', '87', '19', '97', '152', '155', '149', '84'], normal: '100' },
  { param: 'Amoniak Nitrogen', values: ['2,8000', '0,250', '0,1600', '0,1300', '<0,01', '0,1200', '<0,01', '0,07', '0,46', '0,5200', '<0,01', '<0,01'], normal: '10' },
  { param: 'ZINK', values: ['<0,0100', '0,010', '0,010', '0,010', '-', '-', '-', '0,45', '0,52', '0,3410', '0,2900', '0,48'], normal: '10' },
  { param: 'SULFIDA', values: ['0,1300', '0,0600', '0,0200', '0,0300', '-', '-', '-', '-', '-', '-', '-', '-'], normal: '300' },
  { param: 'NITRIT', values: ['<0,00358', '0,95', '0,008', '3,14', '-', '-', '-', '0,17', '0,340', '0,420', '>3,28', '3,23'], normal: '40' },
  { param: 'NITRAT', values: ['11,6', '2,45', '1,56', '0,48', '-', '-', '-', '14,4', '4,80', '12,30', '9,20', '0,59'], normal: '30' },
  { param: 'TOTAL COLIFORM', values: ['9.000', '26.000', '11.000', '21.000', '4,3x10', '2,4x10', '4,3x10', '2,4x10⁶', '2,4x10⁵', '240.000', '110.000', '24.000'], normal: '3000' },
];

const IPAL_OUTLET_ROWS = [
  { param: 'Suhu', values: ['23,5', '23,3', '23,5', '23,6', '15,5', '23,6', '-', '23,6', '24,3', '21,3', '23,6', '18,5'], normal: '30' },
  { param: 'TSS', values: ['15', '12', '9', '10', '10', '5', '<5', '<5', '<5', '<5', '<5', '<5'], normal: '30' },
  { param: 'PH', values: ['6,23', '4,40', '5,03', '6,65', '4,11', '7,62', '6,94', '7,33', '6,58', '7,21', '6,83', '7,42'], normal: '6,0 – 9,0' },
  { param: 'BOD', values: ['6', '8', '7', '7', '12', '20', '<10', '<10', '13', '28', '19', '16'], normal: '30' },
  { param: 'COD', values: ['20', '25', '23', '23', '32', '56', '<30', '<30', '33', '83', '52', '36'], normal: '100' },
  { param: 'Amoniak Nitrogen', values: ['<0,0100', '0,2500', '0,1100', '0,0800', '<0,01', '<0,01', '<0,01', '<0,01', '10,0000', '<0,01', '<0,01', '<5'], normal: '10' },
  { param: 'ZINK', values: ['0,610', '<0,0100', '<0,0100', '<0,0100', '-', '-', '-', '0,40', '0,0000', '0,3640', '0,1900', '0,27'], normal: '10' },
  { param: 'SULFIDA', values: ['0,0800', '<0,0100', '<0,0100', '<0,0100', '-', '-', '-', '-', '-', '-', '-', '-'], normal: '300' },
  { param: 'NITRIT', values: ['<0,00358', '<0,00358', '<0,00358', '0,722', '-', '-', '-', '1,07', '0', '0,47', '1,98', '0,08'], normal: '40' },
  { param: 'NITRAT', values: ['6,3', '1,83', '0,81', '6,0', '-', '-', '-', '56,2', '0', '19,4', '19,8', '3,55'], normal: '30' },
  { param: 'TOTAL COLIFORM', values: ['1.200', '1.100', '800', '1.400', '2,4x10', '0', '7x10', '2,4x10⁶', '240.000', '9.300', '900', '400'], normal: '3000' },
];

export default function AnnualOfficialReport({
  year = new Date().getFullYear(),
  reportData,
}: AnnualReportProps) {
  const internalData = useOfficialReportData({
    periodType: 'annual',
    year,
  });

  const data = reportData || internalData;
  const reportYear = data.year || year;
  const ys = data.yearlySeries;
  const periodLabel = `Tahun ${reportYear} (Januari – Desember ${reportYear})`;

  const [chapterPages, setChapterPages] = useState<Record<string, number>>({
    'bab1-a': 1,
    'bab1-b': 2,
    'bab2-a': 3,
    'bab2-b': 3,
    'bab3-a': 6,
    'bab3-b': 6,
    'bab4-a': 28,
    'bab4-b': 28,
    'bab5-a': 40,
    'bab5-b': 40,
  });

  const handleChaptersResolved = useCallback((resolved: Record<string, number>) => {
    setChapterPages((prev) => ({ ...prev, ...resolved }));
  }, []);

  // Automatic Narratives (Analisa + Rekomendasi + Rencana Tindak Lanjut) for all Annual Charts & IPAL
  const narratives = useMemo(() => {
    const hhTrend = buildHandHygieneTrendNarrative({
      periodLabel,
      monthly: ys.hhMonthly.map((m) => ({ label: m.monthName, rate: m.rate })),
      overallRate: ys.hhOverallRate,
      prevOverallRate: ys.hhPrevOverallRate,
      prevYearLabel: `Tahun ${reportYear - 1}`,
    });

    const hhProf = buildHandHygieneProfessionNarrative({
      periodLabel,
      overallRate: ys.hhOverallRate,
      professions: ys.hhProfessions.map((p) => ({
        name: p.profession,
        rate: p.rate,
        opp: p.opp,
        hh: p.hh,
      })),
    });

    const apd = buildApdNarrative({
      periodLabel,
      overallRate: ys.apdOverallRate,
      points: ys.apdMonthly.map((m) => ({ label: m.monthName, rate: m.rate })),
    });

    const ipal = buildIpalNarrative(reportYear);

    const phlebSeries = ys.hais.phlebitis;
    const idoSeries = ys.hais.ido;
    const iskSeries = ys.hais.isk;
    const vapSeries = ys.hais.vap;
    const decubSeries = ys.hais.decubitus;

    const phlebitis = buildSingleHaisNarrative({
      indicator: 'phlebitis',
      periodLabel,
      dimensionLabel: 'bulan',
      points: phlebSeries.monthly.map((m) => ({
        label: m.monthName,
        days: m.days,
        cases: m.cases,
        rate: m.rate,
      })),
      totalDays: phlebSeries.totalDays,
      totalCases: phlebSeries.totalCases,
      overallRate: phlebSeries.rate,
    });

    const ido = buildSingleHaisNarrative({
      indicator: 'ido',
      periodLabel,
      dimensionLabel: 'bulan',
      points: idoSeries.monthly.map((m) => ({
        label: m.monthName,
        days: m.days,
        cases: m.cases,
        rate: m.rate,
      })),
      totalDays: idoSeries.totalDays,
      totalCases: idoSeries.totalCases,
      overallRate: idoSeries.rate,
    });

    const isk = buildSingleHaisNarrative({
      indicator: 'isk',
      periodLabel,
      dimensionLabel: 'bulan',
      points: iskSeries.monthly.map((m) => ({
        label: m.monthName,
        days: m.days,
        cases: m.cases,
        rate: m.rate,
      })),
      totalDays: iskSeries.totalDays,
      totalCases: iskSeries.totalCases,
      overallRate: iskSeries.rate,
    });

    const vap = buildSingleHaisNarrative({
      indicator: 'vap',
      periodLabel,
      dimensionLabel: 'bulan',
      points: vapSeries.monthly.map((m) => ({
        label: m.monthName,
        days: m.days,
        cases: m.cases,
        rate: m.rate,
      })),
      totalDays: vapSeries.totalDays,
      totalCases: vapSeries.totalCases,
      overallRate: vapSeries.rate,
    });

    const decubitus = buildSingleHaisNarrative({
      indicator: 'decubitus',
      periodLabel,
      dimensionLabel: 'bulan',
      points: decubSeries.monthly.map((m) => ({
        label: m.monthName,
        days: m.days,
        cases: m.cases,
        rate: m.rate,
      })),
      totalDays: decubSeries.totalDays,
      totalCases: decubSeries.totalCases,
      overallRate: decubSeries.rate,
    });

    return { hhTrend, hhProf, apd, ipal, phlebitis, ido, isk, vap, decubitus };
  }, [periodLabel, ys, reportYear]);

  // Front Matter Pages: Kata Pengantar ('i') and Dynamic Daftar Isi ('ii')
  const frontMatterPages: FrontMatterPageSpec[] = useMemo(
    () => [
      {
        key: 'fm-kata-pengantar',
        label: 'i',
        node: (
          <div className="w-full h-full flex flex-col justify-between text-[12pt] leading-[1.5] text-justify text-black">
            <div>
              <div className="text-center font-bold mb-5">
                <h2 className="text-[12pt] uppercase tracking-wider border-b border-black pb-1 inline-block">
                  KATA PENGANTAR
                </h2>
              </div>
              <div className="space-y-3">
                <p className="indent-8">
                  Puji syukur kita panjatkan ke hadirat Allah SWT atas segala rahmat, karunia, dan kemudahan-Nya sehingga Laporan Tahunan Program Pencegahan dan Pengendalian Infeksi (PPI) UOBK RSUD Al-Mulk Kota Sukabumi dapat tersusun dengan baik. Laporan ini disusun sebagai bentuk pertanggungjawaban sekaligus evaluasi terhadap pelaksanaan kegiatan PPI selama periode tahun {reportYear}, serta sebagai dasar perencanaan peningkatan mutu pelayanan di tahun berikutnya.
                </p>
                <p className="indent-8">
                  Sebagaimana diketahui, PPI merupakan elemen penting dalam penyelenggaraan pelayanan kesehatan yang aman, bermutu, dan berorientasi pada keselamatan pasien. Dalam satu tahun terakhir, UOBK RSUD Al-Mulk telah menghadapi berbagai tantangan terkait dinamika pelayanan, peningkatan jumlah tindakan invasif, serta potensi risiko infeksi terkait pelayanan kesehatan. Melalui komitmen bersama, kolaborasi lintas profesi, dan dukungan penuh dari manajemen rumah sakit, berbagai program penguatan PPI dapat dilaksanakan secara terarah dan berkesinambungan.
                </p>
                <p className="indent-8">
                  Laporan ini memuat gambaran menyeluruh mengenai kebijakan, pelaksanaan kegiatan, capaian indikator, hasil surveilans, temuan audit, serta rekomendasi dan rencana tindak lanjut perbaikan yang diperlukan. Kami berharap laporan ini menjadi instrumen strategis dalam pengembangan program PPI di masa mendatang sehingga keselamatan pasien dan keselamatan kerja seluruh tenaga kesehatan terus meningkat.
                </p>
                <p className="indent-8">
                  Kami menyampaikan apresiasi yang sebesar-besarnya kepada seluruh anggota Tim PPI, jajaran manajemen, tenaga kesehatan di seluruh unit, serta pihak terkait yang telah berkontribusi dalam penyusunan laporan ini. Semoga kerja sama yang baik ini terus terjaga demi peningkatan mutu layanan di UOBK RSUD Al-Mulk Kota Sukabumi.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 pr-2">
              <div className="text-center text-[12pt]">
                <p>Sukabumi, Januari {reportYear + 1}</p>
                <p className="font-bold mt-1">Tim PPI UOBK RSUD Al-Mulk</p>
                <div className="h-16" />
                <p className="font-bold underline">Tim Penyusun</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'fm-daftar-isi',
        label: 'ii',
        node: (
          <div className="w-full flex flex-col justify-start text-[12pt] leading-[1.5] text-black">
            <div className="text-center font-bold mb-6">
              <h2 className="text-[12pt] uppercase tracking-wider border-b border-black pb-1 inline-block">
                DAFTAR ISI
              </h2>
            </div>

            <div className="space-y-2.5 text-[12pt] leading-[1.5]">
              <div className="flex items-baseline justify-between font-semibold">
                <span>KATA PENGANTAR</span>
                <span className="flex-1 mx-2 border-b border-dotted border-black" />
                <span>i</span>
              </div>
              <div className="flex items-baseline justify-between font-semibold">
                <span>DAFTAR ISI</span>
                <span className="flex-1 mx-2 border-b border-dotted border-black" />
                <span>ii</span>
              </div>

              <div className="pt-1">
                <p className="font-bold">BAB I PENDAHULUAN</p>
                <div className="pl-6 space-y-1 mt-1">
                  <div className="flex items-baseline justify-between">
                    <span>A. Latar Belakang</span>
                    <span className="flex-1 mx-2 border-b border-dotted border-black" />
                    <span>{chapterPages['bab1-a']}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span>B. Tujuan</span>
                    <span className="flex-1 mx-2 border-b border-dotted border-black" />
                    <span>{chapterPages['bab1-b']}</span>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <p className="font-bold">BAB II PROGRAM KERJA</p>
                <div className="pl-6 space-y-1 mt-1">
                  <div className="flex items-baseline justify-between">
                    <span>A. Pengorganisasian</span>
                    <span className="flex-1 mx-2 border-b border-dotted border-black" />
                    <span>{chapterPages['bab2-a']}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="max-w-[84%]">
                      B. Peningkatan Mutu Pelayanan Kesehatan di Rumah Sakit pada Kejadian HAIs
                    </span>
                    <span className="flex-1 mx-2 border-b border-dotted border-black" />
                    <span>{chapterPages['bab2-b']}</span>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <p className="font-bold">BAB III REALISASI PROGRAM</p>
                <div className="pl-6 space-y-1 mt-1">
                  <div className="flex items-baseline justify-between">
                    <span>A. Pengorganisasian</span>
                    <span className="flex-1 mx-2 border-b border-dotted border-black" />
                    <span>{chapterPages['bab3-a']}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="max-w-[84%]">
                      B. Peningkatan Mutu Pelayanan Kesehatan di Rumah Sakit pada Kejadian HAIs
                    </span>
                    <span className="flex-1 mx-2 border-b border-dotted border-black" />
                    <span>{chapterPages['bab3-b']}</span>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <p className="font-bold">BAB IV PEMBAHASAN</p>
                <div className="pl-6 space-y-1 mt-1">
                  <div className="flex items-baseline justify-between">
                    <span>A. Pengorganisasian</span>
                    <span className="flex-1 mx-2 border-b border-dotted border-black" />
                    <span>{chapterPages['bab4-a']}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="max-w-[84%]">
                      B. Peningkatan Mutu Pelayanan Kesehatan di Rumah Sakit pada Kejadian HAIs
                    </span>
                    <span className="flex-1 mx-2 border-b border-dotted border-black" />
                    <span>{chapterPages['bab4-b']}</span>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <p className="font-bold">BAB V PENUTUP</p>
                <div className="pl-6 space-y-1 mt-1">
                  <div className="flex items-baseline justify-between">
                    <span>A. Kesimpulan</span>
                    <span className="flex-1 mx-2 border-b border-dotted border-black" />
                    <span>{chapterPages['bab5-a']}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span>B. Saran</span>
                    <span className="flex-1 mx-2 border-b border-dotted border-black" />
                    <span>{chapterPages['bab5-b']}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ),
      },
    ],
    [reportYear, chapterPages]
  );

  // Flow blocks for AutoPaginatedF4Document
  const blocks: FlowBlock[] = useMemo(() => {
    const b: FlowBlock[] = [];
    const monthLabels = ys.months.map((m) => m.shortName);
    const phlebSeries = ys.hais.phlebitis;
    const idoSeries = ys.hais.ido;
    const iskSeries = ys.hais.isk;
    const vapSeries = ys.hais.vap;
    const decubSeries = ys.hais.decubitus;

    const phlebSortedDesc = [...phlebSeries.monthly].sort((x, y) => y.rate - x.rate);
    const phlebSortedAsc = [...phlebSeries.monthly].sort((x, y) => x.rate - y.rate);
    const phlebPeak = phlebSortedDesc[0];
    const phlebLow = phlebSortedAsc[0];

    // =========================================================
    // BAB I PENDAHULUAN
    // =========================================================
    b.push({
      type: 'element',
      key: 'ann-bab1-header',
      chapterAnchor: 'bab1-a',
      keepWithNext: true,
      gapAfter: 12,
      node: (
        <div className="text-center font-bold uppercase text-[12pt] leading-[1.4]">
          <p>BAB I</p>
          <p>PENDAHULUAN</p>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'ann-bab1-a-heading',
      keepWithNext: true,
      gapAfter: 6,
      node: <p className="font-bold uppercase text-[12pt]">A. LATAR BELAKANG</p>,
    });

    const bab1Paragraphs = [
      'Pencegahan dan Pengendalian Infeksi (PPI) merupakan salah satu komponen utama dalam upaya peningkatan mutu pelayanan kesehatan serta keselamatan pasien di fasilitas pelayanan kesehatan. Sebagai rumah sakit yang terus berkembang dan berkomitmen memberikan pelayanan berkualitas, UOBK RSUD Al-Mulk Kota Sukabumi menempatkan program PPI sebagai prioritas strategis dalam setiap lini pelayanan. Hal ini sejalan dengan regulasi nasional, antara lain Peraturan Menteri Kesehatan RI Nomor 27 Tahun 2017 tentang Pedoman Pencegahan dan Pengendalian Infeksi di Fasilitas Pelayanan Kesehatan, serta standar akreditasi rumah sakit yang menekankan pentingnya penerapan PPI secara sistematis, konsisten, dan berkelanjutan.',
      'Healthcare Associated Infections (HAIs) adalah infeksi yang didapat atau timbul pada waktu pasien dirawat di rumah sakit, di mana tidak ada infeksi sebelumnya atau tidak dalam masa inkubasi pada saat masuk, juga infeksi yang didapat di rumah sakit tetapi muncul setelah pasien pulang, termasuk infeksi pada petugas pemberi pelayanan di rumah sakit. Kejadian infeksi dapat menghambat proses penyembuhan pasien, meningkatkan morbiditas dan mortalitas, serta memperpanjang lama hari rawat.',
      'Kepmenkes Nomor 129 Tahun 2008 telah menetapkan standar minimal pelayanan rumah sakit, termasuk di dalamnya pelaporan kasus HAIs untuk mengevaluasi sejauh mana rumah sakit melakukan pengendalian terhadap risiko infeksi. Data HAIs digunakan sebagai acuan pencegahan infeksi guna meningkatkan mutu pelayanan rumah sakit secara terukur.',
      `Laporan tahunan PPI tahun ${reportYear} ini disusun sebagai bentuk pertanggungjawaban, evaluasi kinerja, serta dasar perencanaan perbaikan di tahun berikutnya. Melalui laporan ini, diharapkan seluruh jajaran manajemen dan unit pelayanan memperoleh gambaran komprehensif mengenai capaian program, tren kejadian infeksi terkait pelayanan, tingkat kepatuhan terhadap praktik PPI, serta rekomendasi dan rencana tindak lanjut penguatan sistem PPI di UOBK RSUD Al-Mulk Kota Sukabumi.`,
    ];

    bab1Paragraphs.forEach((p, i) => {
      b.push({
        type: 'element',
        key: `ann-bab1-p-${i}`,
        gapAfter: 10,
        node: <p className="indent-8 text-justify">{p}</p>,
      });
    });

    b.push({
      type: 'element',
      key: 'ann-bab1-b-tujuan',
      chapterAnchor: 'bab1-b',
      gapAfter: 14,
      node: (
        <div className="w-full text-justify space-y-2.5">
          <p className="font-bold uppercase text-[12pt]">B. TUJUAN</p>
          <div>
            <p className="font-bold mb-1">1. Tujuan Umum</p>
            <p className="indent-8">
              Menyajikan gambaran komprehensif mengenai pelaksanaan program kerja Pencegahan dan Pengendalian Infeksi (PPI) di UOBK RSUD Al-Mulk Kota Sukabumi selama tahun {reportYear}, mengevaluasi capaian indikator mutu dan surveilans, serta merumuskan rekomendasi strategis bagi peningkatan mutu dan keselamatan pasien secara berkesinambungan.
            </p>
          </div>
          <div>
            <p className="font-bold mb-1">2. Tujuan Khusus</p>
            <ol className="list-[lower-alpha] pl-8 space-y-1">
              <li>Mengetahui tingkat kepatuhan kebersihan tangan (Hand Hygiene) seluruh tenaga kesehatan dan staf di lingkungan UOBK RSUD Al-Mulk.</li>
              <li>Mengetahui tingkat kepatuhan penggunaan Alat Pelindung Diri (APD) oleh tenaga kesehatan di seluruh unit pelayanan.</li>
              <li>Mengetahui angka kejadian dan tren infeksi terkait pelayanan kesehatan (HAIs), meliputi Phlebitis, Infeksi Saluran Kemih (ISK), Infeksi Daerah Operasi (IDO), Ventilator Associated Pneumonia (VAP), dan Decubitus.</li>
              <li>Mengevaluasi pelaksanaan kewaspadaan standar dan transmisi, pengelolaan limbah, pengendalian lingkungan, pelayanan sterilisasi sentral (CSSD), dan tata laksana linen.</li>
              <li>Mengevaluasi efektivitas penerapan bundles pencegahan infeksi pada tindakan invasif di seluruh ruang perawatan.</li>
              <li>Menyusun rencana tindak lanjut dan rekomendasi perbaikan berbasis data untuk program kerja tahun {reportYear + 1}.</li>
            </ol>
          </div>
        </div>
      ),
    });

    // =========================================================
    // BAB II PROGRAM KERJA
    // =========================================================
    b.push({ type: 'pageBreak', key: 'ann-pb-bab2' });

    b.push({
      type: 'element',
      key: 'ann-bab2-header',
      chapterAnchor: 'bab2-a',
      keepWithNext: true,
      gapAfter: 12,
      node: (
        <div className="text-center font-bold uppercase text-[12pt] leading-[1.4]">
          <p>BAB II</p>
          <p>PROGRAM KERJA</p>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'ann-bab2-a',
      gapAfter: 12,
      node: (
        <div className="w-full text-justify">
          <p className="font-bold uppercase text-[12pt] mb-1.5">A. PENGORGANISASIAN</p>
          <p className="indent-8">
            Tim PPI UOBK RSUD Al-Mulk Kota Sukabumi dibentuk pada tanggal 8 Februari 2019 sebagai organisasi lintas profesi yang mempunyai fungsi utama menjalankan program PPI serta menyusun kebijakan pencegahan dan pengendalian infeksi, termasuk pencegahan infeksi bersumber masyarakat seperti Tuberkulosis, HIV, dan infeksi menular lainnya. Perawat PPI purna waktu (Infection Prevention and Control Nurse / IPCN) dibantu oleh Infection Prevention and Control Link Nurse (IPCLN) di setiap ruang pelayanan dalam memonitor mutu pelayanan dan memberikan edukasi kepada petugas, pasien, serta pengunjung rumah sakit.
          </p>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'ann-bab2-b',
      chapterAnchor: 'bab2-b',
      gapAfter: 10,
      node: (
        <div className="w-full text-justify space-y-2">
          <p className="font-bold uppercase text-[12pt]">
            B. PENINGKATAN MUTU PELAYANAN KESEHATAN DI RUMAH SAKIT PADA KEJADIAN HAIs
          </p>
          <p className="indent-8">
            Berdasarkan data WHO, sekitar 3%–21% atau rata-rata 9% kejadian infeksi terjadi di institusi pelayanan kesehatan. Untuk itu, UOBK RSUD Al-Mulk Kota Sukabumi menyelenggarakan pelayanan paripurna melalui penguatan program PPI di seluruh titik perawatan guna mencegah atau meminimalkan kejadian HAIs.
          </p>
          <p className="font-bold pt-1">1. Kewaspadaan Isolasi</p>
          <p className="indent-8">
            Kewaspadaan isolasi dirancang untuk memutus mata rantai penularan penyakit menular pada pasien, petugas kesehatan, dan pengunjung baik dari sumber infeksi yang diketahui maupun yang belum diketahui. Dua lapis kewaspadaan isolasi terdiri atas Kewaspadaan Standar dan Kewaspadaan Berdasarkan Transmisi:
          </p>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'ann-bab2-kewaspadaan-tables',
      gapAfter: 12,
      node: (
        <div className="w-full space-y-3 text-[11pt]">
          <div>
            <p className="font-bold mb-1">a. Kewaspadaan Standar</p>
            <table className="w-full border-collapse border border-black text-[10pt] leading-[1.35]">
              <tbody>
                <tr>
                  <td className="border border-black p-2 font-bold align-top w-[22%]">Indikator</td>
                  <td className="border border-black p-2 align-top">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      <span>✓ Hand Hygiene</span>
                      <span>✓ Kesehatan karyawan</span>
                      <span>✓ Alat Pelindung Diri (APD)</span>
                      <span>✓ Penempatan pasien</span>
                      <span>✓ Pengelolaan limbah &amp; benda tajam</span>
                      <span>✓ Penyuntikan yang aman</span>
                      <span>✓ Peralatan perawatan pasien</span>
                      <span>✓ Etika batuk &amp; bersin</span>
                      <span>✓ Penatalaksanaan linen</span>
                      <span>✓ Praktik lumbal pungsi</span>
                      <span>✓ Pengendalian lingkungan</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold align-top">Target</td>
                  <td className="border border-black p-2 align-top">
                    Angka kejadian HAIs menurun dan terkendali di bawah standar nasional
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <p className="font-bold mb-1">b. Kewaspadaan Berdasarkan Transmisi</p>
            <table className="w-full border-collapse border border-black text-[10pt] leading-[1.35]">
              <tbody>
                <tr>
                  <td className="border border-black p-2 font-bold align-top w-[22%]">Indikator</td>
                  <td className="border border-black p-2 align-top">
                    Kewaspadaan tambahan dilakukan sesuai jenis transmisi mikroba penyebab infeksi, yaitu: 1) Kontak, 2) Droplet, dan 3) Airborne (dapat diterapkan secara terpisah maupun kombinasi).
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold align-top">Target</td>
                  <td className="border border-black p-2 align-top">
                    Seluruh pasien yang diketahui atau diduga terinfeksi/terkolonisasi patogen menular
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'ann-bab2-program-tables',
      gapAfter: 14,
      node: (
        <div className="w-full space-y-3 text-[11pt]">
          <div>
            <p className="font-bold mb-1">2. Surveilans PPI</p>
            <table className="w-full border-collapse border border-black text-[10pt] leading-[1.35]">
              <tbody>
                <tr>
                  <td className="border border-black p-2 font-bold align-top w-[22%]">Indikator</td>
                  <td className="border border-black p-2 align-top">
                    ✓ Angka kejadian Phlebitis | ✓ Angka kejadian IDO | ✓ Angka kejadian ISK | ✓ Angka kejadian Decubitus | ✓ Angka kejadian VAP
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold align-top">Target</td>
                  <td className="border border-black p-2 align-top">
                    Phlebitis ≤ 1‰, IDO ≤ 2%, ISK ≤ 4,7‰, Decubitus ≤ 1,5‰, VAP ≤ 5,8‰
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <p className="font-bold mb-1">3. Bundles HAIs</p>
            <table className="w-full border-collapse border border-black text-[10pt] leading-[1.35]">
              <tbody>
                <tr>
                  <td className="border border-black p-2 font-bold align-top w-[22%]">Indikator</td>
                  <td className="border border-black p-2 align-top">
                    ✓ Bundles Insersi &amp; Maintenance PLABSI | ✓ Bundles ISK (CAUTI) | ✓ Bundles VAP | ✓ Bundles IDO &amp; Decubitus
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold align-top">Target</td>
                  <td className="border border-black p-2 align-top">
                    Seluruh bundles pencegahan kejadian HAIs dilaksanakan secara konsisten di ruang pelayanan
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <p className="font-bold mb-1">4. Pendidikan dan Pelatihan &amp; 5. Penggunaan Antimikroba Bijak</p>
            <table className="w-full border-collapse border border-black text-[10pt] leading-[1.35]">
              <tbody>
                <tr>
                  <td className="border border-black p-2 font-bold align-top w-[22%]">Pendidikan &amp; Pelatihan</td>
                  <td className="border border-black p-2 align-top">
                    Peningkatan pengetahuan dan kepatuhan PPI secara berkala bagi seluruh civitas hospitalia serta edukasi kesehatan bagi pasien, keluarga, dan pengunjung rumah sakit.
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold align-top">Antimikroba Bijak</td>
                  <td className="border border-black p-2 align-top">
                    Penerapan kebijakan terapi antibiotik empiris, definitif berbasis kultur, serta ketepatan antibiotik profilaksis pembedahan 24 jam oleh seluruh dokter pelayanan di UOBK RSUD Al-Mulk.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    });

    // =========================================================
    // BAB III REALISASI PROGRAM
    // =========================================================
    b.push({ type: 'pageBreak', key: 'ann-pb-bab3' });

    b.push({
      type: 'element',
      key: 'ann-bab3-header',
      chapterAnchor: 'bab3-a',
      keepWithNext: true,
      gapAfter: 12,
      node: (
        <div className="text-center font-bold uppercase text-[12pt] leading-[1.4]">
          <p>BAB III</p>
          <p>REALISASI PROGRAM</p>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'ann-bab3-intro',
      chapterAnchor: 'bab3-b',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full text-justify space-y-2">
          <p className="font-bold uppercase text-[12pt]">A. PENGORGANISASIAN</p>
          <p className="indent-8">
            Program kerja PPI disusun melalui rapat koordinasi Tim PPI. Pelaksanaan edukasi dan supervisi dilakukan secara rutin setiap bulan di unit pelayanan, sedangkan rapat evaluasi capaian indikator dilaksanakan setiap triwulan bersama IPCN dan Ketua Tim PPI.
          </p>
          <p className="font-bold uppercase text-[12pt] pt-1">
            B. PENINGKATAN MUTU PELAYANAN KESEHATAN DI RUMAH SAKIT PADA KEJADIAN HAIs
          </p>
          <p className="font-bold">1. Kewaspadaan Isolasi — a. Kewaspadaan Standar</p>
          <p className="font-bold pl-4">1) Hand Hygiene — a) Kepatuhan Hand Hygiene Seluruh Petugas</p>
          <p className="indent-8 pl-4">
            Kebersihan tangan merupakan komponen utama keselamatan pasien (Patient Safety) yang paling efektif dalam memutus rantai transmisi mikroorganisme penyebab HAIs.
          </p>
        </div>
      ),
    });

    // Grafik 1: Kepatuhan Hand Hygiene 12 Bulan + Narrative (Analisa + Rekomendasi + RTL)
    const hhMaxAxis = Math.max(95, ...ys.hhMonthly.map((m) => m.rate), 85);
    b.push({
      type: 'element',
      key: 'ann-grafik1-hh-trend',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full">
          <OfficialComparisonLineChart
            title={`Perbandingan Hasil Audit Kepatuhan Kebersihan Tangan Petugas di UOBK RSUD Al-Mulk Tahun ${reportYear - 1}–${reportYear}`}
            categories={monthLabels}
            minY={0}
            maxY={hhMaxAxis > 90 ? 100 : 90}
            yTicks={hhMaxAxis > 90 ? [0, 20, 40, 60, 80, 85, 100] : [0, 10, 20, 30, 40, 50, 60, 70, 80, 85, 90]}
            height={135}
            series={[
              {
                name: `Capaian ${reportYear}`,
                color: '#2563eb',
                marker: 'circle',
                values: ys.hhMonthly.map((m) => m.rate),
              },
              {
                name: `Capaian ${reportYear - 1}`,
                color: '#ea580c',
                marker: 'square',
                values: ys.hhMonthly.map((m) => m.prevRate),
              },
              {
                name: 'Target',
                color: '#64748b',
                marker: 'triangle',
                values: monthLabels.map(() => 85),
              },
            ]}
          />
          <p className="text-center font-bold text-[10.5pt] mt-1">
            Grafik 1. Kepatuhan Kebersihan Tangan Seluruh Petugas UOBK RSUD Al-Mulk Tahun {reportYear - 1}–{reportYear}
          </p>
        </div>
      ),
    });
    b.push(...narrativeToFlowBlocks('ann-n1-hh-trend', narratives.hhTrend));

    // Grafik 2: Kepatuhan Hand Hygiene Berdasarkan Profesi + Narrative
    b.push({
      type: 'element',
      key: 'ann-hh-prof-heading',
      keepWithNext: true,
      gapAfter: 6,
      node: (
        <p className="font-bold pl-4 text-[12pt]">
          b) Kepatuhan Kebersihan Tangan Berdasarkan Profesi
        </p>
      ),
    });

    b.push({
      type: 'element',
      key: 'ann-grafik2-hh-prof',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full">
          <OfficialComparisonLineChart
            title={`Perbandingan Hasil Kebersihan Tangan Berdasarkan Profesi di UOBK RSUD Al-Mulk Tahun ${reportYear - 1}–${reportYear}`}
            categories={[...ys.hhProfessions.map((p) => p.profession), 'Rata-rata']}
            minY={0}
            maxY={100}
            yTicks={[0, 20, 40, 60, 80, 85, 100]}
            height={135}
            series={[
              {
                name: `Capaian ${reportYear}`,
                color: '#2563eb',
                marker: 'circle',
                values: [...ys.hhProfessions.map((p) => p.rate), ys.hhOverallRate],
              },
              {
                name: `Capaian ${reportYear - 1}`,
                color: '#ea580c',
                marker: 'square',
                values: [...ys.hhProfessions.map((p) => p.prevRate), ys.hhPrevOverallRate],
              },
              {
                name: 'Target',
                color: '#64748b',
                marker: 'triangle',
                values: [85, 85, 85, 85],
              },
            ]}
          />
          <p className="text-center font-bold text-[10.5pt] mt-1">
            Grafik 2. Perbandingan Kepatuhan Kebersihan Tangan Berdasarkan Profesi Tahun {reportYear}
          </p>
        </div>
      ),
    });
    b.push(...narrativeToFlowBlocks('ann-n2-hh-prof', narratives.hhProf));

    // Grafik 3: Kepatuhan Penggunaan APD 12 Bulan + Narrative
    b.push({
      type: 'element',
      key: 'ann-apd-heading',
      keepWithNext: true,
      gapAfter: 6,
      node: (
        <p className="font-bold pl-4 text-[12pt]">
          2) Kepatuhan Penggunaan Alat Pelindung Diri (APD)
        </p>
      ),
    });

    b.push({
      type: 'element',
      key: 'ann-grafik3-apd',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full">
          <OfficialGroupedBarChart
            title={`KEPATUHAN PENGGUNAAN APD PERIODE TAHUN ${reportYear}`}
            categories={monthLabels}
            minY={60}
            maxY={102}
            yTicks={[60, 66, 72, 78, 84, 90, 96, 100, 102]}
            height={140}
            series={[
              {
                name: 'Pencapaian',
                color: '#2563eb',
                values: ys.apdMonthly.map((m) => m.rate),
              },
              {
                name: 'Target',
                color: '#ea580c',
                values: monthLabels.map(() => 100),
              },
            ]}
          />
          <p className="text-center font-bold text-[10.5pt] mt-1">
            Grafik 3. Kepatuhan Penggunaan APD di UOBK RSUD Al-Mulk Tahun {reportYear}
          </p>
        </div>
      ),
    });
    b.push(...narrativeToFlowBlocks('ann-n3-apd', narratives.apd));

    // 3) Pengelolaan Limbah
    b.push({
      type: 'element',
      key: 'ann-limbah-text',
      gapAfter: 12,
      node: (
        <div className="w-full text-justify space-y-2">
          <p className="font-bold text-[12pt]">3) Pengelolaan Limbah</p>
          <p className="indent-8">
            Pengelolaan limbah rumah sakit dilaksanakan untuk menurunkan risiko kecelakaan kerja dan penularan infeksi nosokomial. UOBK RSUD Al-Mulk bekerja sama dengan PT Jasa Medivest dalam pengelolaan limbah bahan berbahaya dan beracun (B3) medis infeksius serta benda tajam.
          </p>
          <p className="font-bold pl-4">a. Limbah Padat (Infeksius &amp; Non-Infeksius)</p>
          <p className="indent-8 pl-4">
            Sampah medis infeksius padat dan benda tajam ditampung sesuai standar dan dimusnahkan menggunakan incinerator berizin melalui pihak ketiga (PT Jasa Medivest), sedangkan pengelolaan sampah domestik non-infeksius bekerja sama dengan Dinas Lingkungan Hidup Kota Sukabumi dengan pengangkutan setiap hari.
          </p>
          <p className="font-bold pl-4">b. Limbah Jarum dan Benda Tajam</p>
          <p className="indent-8 pl-4">
            Seluruh limbah jarum suntik dan benda tajam medis langsung dimasukkan ke dalam safety box tahan tusuk tanpa proses penutupan ulang (no recapping) sebelum disimpan pada Tempat Penyimpanan Sementara (TPS) limbah B3.
          </p>
          <p className="font-bold pl-4">c. Limbah Cair (IPAL)</p>
          <p className="indent-8 pl-4">
            Limbah cair di UOBK RSUD Al-Mulk diolah melalui Instalasi Pengolahan Air Limbah (IPAL) berizin operasional sesuai standar kesehatan lingkungan, di mana hasil olahan outlet diuji secara berkala setiap bulan dan dimanfaatkan kembali (water reuse) untuk penyiraman taman rumah sakit.
          </p>
        </div>
      ),
    });

    // Standalone Landscape Page: Tabel 1 Hasil Pemeriksaan Output IPAL (2.5cm margins all sides!)
    b.push({
      type: 'standalonePage',
      key: 'ann-standalone-tabel1-ipal',
      orientation: 'landscape',
      padding: 'p-[25mm]',
      node: (
        <div className="w-full flex flex-col justify-start text-black">
          <p className="font-bold text-[10.5pt] text-center mb-1.5">
            Tabel 1. Hasil Pemeriksaan Inlet dan Outlet IPAL UOBK RSUD Al-Mulk Kota Sukabumi Tahun {reportYear}
          </p>
          <table className="w-full table-fixed border-collapse border border-black text-center text-[7.3pt] leading-[1.12]">
            <thead>
              <tr className="font-bold bg-slate-100">
                <th className="border border-black px-1 py-[2px] text-left w-[15%]">PARAMETER</th>
                <th colSpan={12} className="border border-black px-1 py-[2px] text-center">
                  NILAI HASIL PEMERIKSAAN BULANAN
                </th>
                <th className="border border-black px-1 py-[2px] text-center w-[11%]">BAKU MUTU</th>
              </tr>
              <tr className="font-bold bg-slate-50">
                <th className="border border-black px-1 py-[2px] text-left">IPAL INLET</th>
                {monthLabels.map((m) => (
                  <th key={`in-h-${m}`} className="border border-black px-0.5 py-[2px]">
                    {m}
                  </th>
                ))}
                <th className="border border-black px-1 py-[2px]" />
              </tr>
            </thead>
            <tbody>
              {IPAL_INLET_ROWS.map((row, idx) => (
                <tr key={`inlet-${idx}`}>
                  <td className="border border-black px-1 py-[1.5px] text-left font-medium truncate">
                    {row.param}
                  </td>
                  {row.values.map((val, vIdx) => (
                    <td key={vIdx} className="border border-black px-0.5 py-[1.5px]">
                      {val}
                    </td>
                  ))}
                  <td className="border border-black px-1 py-[1.5px] font-medium">{row.normal}</td>
                </tr>
              ))}
              <tr className="font-bold bg-slate-50">
                <td className="border border-black px-1 py-[2px] text-left">IPAL OUTLET</td>
                {monthLabels.map((m) => (
                  <td key={`out-h-${m}`} className="border border-black px-0.5 py-[2px]">
                    {m}
                  </td>
                ))}
                <td className="border border-black px-1 py-[2px]" />
              </tr>
              {IPAL_OUTLET_ROWS.map((row, idx) => (
                <tr key={`outlet-${idx}`}>
                  <td className="border border-black px-1 py-[1.5px] text-left font-medium truncate">
                    {row.param}
                  </td>
                  {row.values.map((val, vIdx) => (
                    <td key={vIdx} className="border border-black px-0.5 py-[1.5px]">
                      {val}
                    </td>
                  ))}
                  <td className="border border-black px-1 py-[1.5px] font-medium">{row.normal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    });

    // IPAL Narrative (Analisa + Rekomendasi + Rencana Tindak Lanjut) immediately following Tabel 1
    b.push(...narrativeToFlowBlocks('ann-n4-ipal', narratives.ipal));

    // Sections 4) .. 12) & Kewaspadaan Transmisi & Surveilans Intro
    b.push({
      type: 'element',
      key: 'ann-lingkungan-block',
      gapAfter: 10,
      node: (
        <div className="w-full text-justify space-y-1.5">
          <p className="font-bold text-[12pt]">4) Pengendalian Lingkungan</p>
          <p>
            UOBK RSUD Al-Mulk melaksanakan pencegahan dan pengendalian infeksi lingkungan melalui langkah-langkah berikut:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Pembersihan harian seluruh permukaan bidang datar, mebelair, dan peralatan ruangan menggunakan larutan desinfektan sesuai SPO, serta desinfeksi terminal sebelum ruang perawatan ditempati pasien berikutnya.</li>
            <li>Pembersihan ruang isolasi airborne menggunakan penyinaran ultraviolet dan desinfeksi permukaan, disertai evaluasi kebutuhan HEPA filter pada ruang berisiko tinggi (IBS, ICU, dan ruang isolasi).</li>
            <li>Pemberlakuan jam kunjung, pembatasan kunjungan anak di bawah usia 12 tahun, edukasi kebersihan tangan pengunjung, serta penanganan tumpahan darah/cairan tubuh menggunakan spill kit sesuai SPO.</li>
            <li>Pelaksanaan kajian risiko infeksi konstruksi dan renovasi (ICRA Konstruksi) disertai lokalisasi area kerja guna mencegah paparan debu dan jamur Aspergillus pada pasien serta petugas.</li>
          </ul>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'ann-penyuntikan-cssd-block',
      gapAfter: 10,
      node: (
        <div className="w-full text-justify space-y-2">
          <p className="font-bold text-[12pt]">5) Penyuntikan yang Aman</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Penerapan prinsip one needle, one syringe, only one time serta pengelolaan obat multidose sesuai standar aseptik.</li>
            <li>Pencampuran obat parenteral dilaksanakan di ruang persiapan obat unit perawatan dengan pengawasan kepatuhan ketersediaan safety box agar meminimalkan tindakan recapping jarum suntik.</li>
          </ul>

          <p className="font-bold text-[12pt] pt-1">6) Perawatan Peralatan Pasien (Instalasi CSSD)</p>
          <p className="indent-8">
            Pemrosesan peralatan perawatan pasien terpusat di Instalasi CSSD sesuai klasifikasi Spaulding: peralatan non-kritikal (desinfeksi tingkat rendah), peralatan semi-kritikal (desinfeksi tingkat tinggi), dan peralatan kritikal seperti instrumen bedah serta partus set yang wajib melalui proses dekontaminasi enzimatik, pengemasan, sterilisasi suhu tinggi, penyimpanan terkontrol, hingga distribusi steril ke unit pelayanan.
          </p>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'ann-linen-karyawan-penempatan',
      gapAfter: 10,
      node: (
        <div className="w-full text-justify space-y-2">
          <p className="font-bold text-[12pt]">7) Penatalaksanaan Linen</p>
          <p className="indent-8">
            Penatalaksanaan pencucian linen bekerja sama dengan instalasi laundry RS Bhayangkara melalui pemisahan ketat antara linen infeksius dan non-infeksius sejak dari ruang perawatan, penimbangan, pencucian terpisah sesuai kategori infeksi, pengeringan, penyetrikaan, penyimpanan bersih, dan pendistribusian kembali ke ruang perawatan.
          </p>

          <p className="font-bold text-[12pt] pt-1">8) Perlindungan Kesehatan Karyawan</p>
          <p className="indent-8">
            Rumah sakit melaksanakan pemeriksaan kesehatan berkala bagi karyawan setiap tahun serta menerapkan SPO alur pelaporan dan tata laksana pasca-pajanan luka tusuk jarum atau benda tajam bekas pakai di seluruh unit kerja.
          </p>

          <p className="font-bold text-[12pt] pt-1">
            9) Penempatan Pasien, 10) Etika Batuk, 11) Praktik Lumbal Pungsi &amp; 12) Penanganan Jenazah
          </p>
          <p className="indent-8">
            Skrining triase pasien infeksius berdasarkan cara transmisi (airborne, droplet, kontak) diterapkan sejak pasien masuk di IGD dengan sistem isolasi dan kohorting di rawat inap. Edukasi etika batuk dan kebersihan pernapasan dilaksanakan secara aktif melalui PKRS dan media visual. Tindakan anestesi spinal (lumbal pungsi) dilakukan di kamar operasi dengan teknik aseptik penuh dan masker bedah, sementara kamar jenazah melayani transit jenazah dengan penerapan APD standar petugas.
          </p>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'ann-transmisi-surveilans-intro',
      gapAfter: 12,
      node: (
        <div className="w-full text-justify space-y-2">
          <p className="font-bold text-[12pt]">b. Kewaspadaan Berdasarkan Transmisi</p>
          <p className="indent-8">
            Kewaspadaan transmisi Kontak, Droplet, dan Airborne dilaksanakan melalui penempatan pasien secara kohorting/ruang isolasi, pengaturan jarak tempat tidur minimal 1–2 meter, penggunaan APD sesuai indikasi (masker bedah/N95, sarung tangan, apron/gaun), optimalisasi ventilasi udara, serta pemakaian masker pada pasien saat transportasi antar-unit.
          </p>

          <p className="font-bold text-[12pt] pt-1">2. Surveilans PPI</p>
          <p className="indent-8">
            Pelaksanaan surveilans Healthcare Associated Infections (HAIs) di UOBK RSUD Al-Mulk dilakukan secara berkesinambungan oleh IPCN bersama IPCLN unit pelayanan dan terintegrasi dengan Sistem Informasi Manajemen Rumah Sakit (SIMRS) serta aplikasi SMART PPI. Fokus pemantauan meliputi Phlebitis, IDO, ISK, VAP, dan Decubitus selama 12 bulan penuh pada tahun {reportYear}.
          </p>
        </div>
      ),
    });

    // Standalone Landscape Page: Tabel 2 Hasil Evaluasi HAIs 12 Bulan (2.5cm margins all sides!)
    b.push({
      type: 'standalonePage',
      key: 'ann-standalone-tabel2-hais',
      orientation: 'landscape',
      padding: 'p-[25mm]',
      node: (
        <div className="w-full flex flex-col justify-start text-black">
          <p className="font-bold text-[11pt] text-center mb-2">
            Tabel 2. Hasil Evaluasi Surveilans HAIs 12 Bulan UOBK RSUD Al-Mulk Tahun {reportYear}
          </p>
          <table className="w-full table-fixed border-collapse border border-black text-center text-[8.5pt] leading-[1.22]">
            <thead>
              <tr className="bg-[#00a651] text-white font-bold">
                <th rowSpan={2} className="border border-black p-1 w-[4%]">NO</th>
                <th rowSpan={2} className="border border-black p-1 w-[24%]">VARIABEL PEMANTAUAN</th>
                <th colSpan={12} className="border border-black p-1">BULAN</th>
              </tr>
              <tr className="bg-[#00a651] text-white font-bold">
                {monthLabels.map((m) => (
                  <th key={`t2-${m}`} className="border border-black p-1 w-[6%]">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 1. Phlebitis */}
              <tr>
                <td rowSpan={3} className="border border-black font-bold p-1">1</td>
                <td className="border border-black p-1 text-left font-medium">Jumlah hari terpasang infus</td>
                {phlebSeries.monthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">{m.days}</td>
                ))}
              </tr>
              <tr>
                <td className="border border-black p-1 text-left font-medium">Terjadi Phlebitis</td>
                {phlebSeries.monthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1 font-semibold">{m.cases}</td>
                ))}
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="border border-black p-1 text-left">HAIs (‰)</td>
                {phlebSeries.monthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">{fmtIdNum(m.rate)}</td>
                ))}
              </tr>

              {/* 2. IDO */}
              <tr>
                <td rowSpan={3} className="border border-black font-bold p-1">2</td>
                <td className="border border-black p-1 text-left font-medium">Jumlah tindakan operasi</td>
                {idoSeries.monthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">{m.days}</td>
                ))}
              </tr>
              <tr>
                <td className="border border-black p-1 text-left font-medium">Terjadi IDO</td>
                {idoSeries.monthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">{m.cases}</td>
                ))}
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="border border-black p-1 text-left">HAIs (%)</td>
                {idoSeries.monthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">{fmtIdNum(m.rate)}</td>
                ))}
              </tr>

              {/* 3. ISK */}
              <tr>
                <td rowSpan={3} className="border border-black font-bold p-1">3</td>
                <td className="border border-black p-1 text-left font-medium">Jumlah hari terpasang kateter urin</td>
                {iskSeries.monthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">{m.days}</td>
                ))}
              </tr>
              <tr>
                <td className="border border-black p-1 text-left font-medium">Terjadi ISK</td>
                {iskSeries.monthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">{m.cases}</td>
                ))}
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="border border-black p-1 text-left">HAIs (‰)</td>
                {iskSeries.monthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">{fmtIdNum(m.rate)}</td>
                ))}
              </tr>

              {/* 4. VAP */}
              <tr>
                <td rowSpan={3} className="border border-black font-bold p-1">4</td>
                <td className="border border-black p-1 text-left font-medium">Jumlah hari ventilator mekanik</td>
                {vapSeries.monthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">{m.days}</td>
                ))}
              </tr>
              <tr>
                <td className="border border-black p-1 text-left font-medium">Terjadi VAP</td>
                {vapSeries.monthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">{m.cases}</td>
                ))}
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="border border-black p-1 text-left">HAIs (‰)</td>
                {vapSeries.monthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">{fmtIdNum(m.rate)}</td>
                ))}
              </tr>

              {/* 5. Decubitus */}
              <tr>
                <td rowSpan={3} className="border border-black font-bold p-1">5</td>
                <td className="border border-black p-1 text-left font-medium">Jumlah hari tirah baring</td>
                {decubSeries.monthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">{m.days}</td>
                ))}
              </tr>
              <tr>
                <td className="border border-black p-1 text-left font-medium">Terjadi Decubitus</td>
                {decubSeries.monthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">{m.cases}</td>
                ))}
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="border border-black p-1 text-left">HAIs (‰)</td>
                {decubSeries.monthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">{fmtIdNum(m.rate)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ),
    });

    // Grafik 4: Phlebitis 12 Bulan + Narrative (Analisa + Rekomendasi + RTL)
    const phlebMaxY = Math.max(25, Math.ceil((phlebPeak?.rate || 20) / 5) * 5 + 5);
    b.push({
      type: 'element',
      key: 'ann-phleb-chart-heading',
      keepWithNext: true,
      gapAfter: 6,
      node: (
        <div className="w-full">
          <p className="font-bold text-[12pt]">a. Grafik Kejadian HAIs Tahunan</p>
          <p className="font-bold pl-4 text-[12pt]">1) Phlebitis</p>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'ann-grafik4-phleb',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full">
          <OfficialComparisonLineChart
            title={`Insiden Rate HAIs PHLEBITIS Tahun ${reportYear}`}
            categories={monthLabels}
            minY={0}
            maxY={phlebMaxY}
            yTicks={[0, 5, 10, 15, 20, 25, ...(phlebMaxY >= 30 ? [30] : []), ...(phlebMaxY >= 35 ? [35] : [])]}
            height={135}
            unit="‰"
            formatValue={(v) => fmtIdNum(v)}
            series={[
              {
                name: 'PENCAPAIAN',
                color: '#16a34a',
                marker: 'circle',
                values: phlebSeries.monthly.map((m) => m.rate),
              },
              {
                name: 'TARGET',
                color: '#2563eb',
                marker: 'circle',
                values: monthLabels.map(() => 1),
              },
            ]}
          />
          <p className="text-center font-bold text-[10.5pt] mt-1">
            Grafik 4. Kejadian Phlebitis UOBK RSUD Al-Mulk Tahun {reportYear}
          </p>
        </div>
      ),
    });
    b.push(...narrativeToFlowBlocks('ann-n5-phleb', narratives.phlebitis));

    // Grafik 5: IDO 12 Bulan + Narrative
    b.push({
      type: 'element',
      key: 'ann-ido-chart-heading',
      keepWithNext: true,
      gapAfter: 6,
      node: <p className="font-bold pl-4 text-[12pt]">2) Infeksi Daerah Operasi (IDO)</p>,
    });

    b.push({
      type: 'element',
      key: 'ann-grafik5-ido',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full">
          <OfficialComparisonLineChart
            title={`Insiden Rate HAIs IDO Tahun ${reportYear}`}
            categories={monthLabels}
            minY={0}
            maxY={2.5}
            yTicks={[0, 0.5, 1, 1.5, 2, 2.5]}
            height={130}
            unit="%"
            formatValue={(v) => `${fmtIdNum(v)}%`}
            series={[
              {
                name: 'PENCAPAIAN',
                color: '#16a34a',
                marker: 'circle',
                values: idoSeries.monthly.map((m) => m.rate),
              },
              {
                name: 'TARGET',
                color: '#2563eb',
                marker: 'circle',
                values: monthLabels.map(() => 2),
              },
            ]}
          />
          <p className="text-center font-bold text-[10.5pt] mt-1">
            Grafik 5. Kejadian IDO di UOBK RSUD Al-Mulk Tahun {reportYear}
          </p>
        </div>
      ),
    });
    b.push(...narrativeToFlowBlocks('ann-n6-ido', narratives.ido));

    // Grafik 6: ISK 12 Bulan + Narrative
    b.push({
      type: 'element',
      key: 'ann-isk-chart-heading',
      keepWithNext: true,
      gapAfter: 6,
      node: <p className="font-bold pl-4 text-[12pt]">3) Infeksi Saluran Kemih (ISK)</p>,
    });

    b.push({
      type: 'element',
      key: 'ann-grafik6-isk',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full">
          <OfficialComparisonLineChart
            title={`Insiden Rate HAIs ISK di UOBK RSUD Al-Mulk Tahun ${reportYear}`}
            categories={monthLabels}
            minY={0}
            maxY={6}
            yTicks={[0, 1, 2, 3, 4, 5, 6]}
            height={130}
            unit="‰"
            formatValue={(v) => fmtIdNum(v)}
            series={[
              {
                name: 'PENCAPAIAN',
                color: '#16a34a',
                marker: 'circle',
                values: iskSeries.monthly.map((m) => m.rate),
              },
              {
                name: 'TARGET',
                color: '#2563eb',
                marker: 'triangle',
                values: monthLabels.map(() => 4.7),
              },
            ]}
          />
          <p className="text-center font-bold text-[10.5pt] mt-1">
            Grafik 6. Kejadian ISK di UOBK RSUD Al-Mulk Tahun {reportYear}
          </p>
        </div>
      ),
    });
    b.push(...narrativeToFlowBlocks('ann-n7-isk', narratives.isk));

    // Grafik 7: VAP 12 Bulan + Narrative
    b.push({
      type: 'element',
      key: 'ann-vap-chart-heading',
      keepWithNext: true,
      gapAfter: 6,
      node: <p className="font-bold pl-4 text-[12pt]">4) Ventilator Associated Pneumonia (VAP)</p>,
    });

    b.push({
      type: 'element',
      key: 'ann-grafik7-vap',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full">
          <OfficialComparisonLineChart
            title={`Insiden Rate HAIs VAP di UOBK RSUD Al-Mulk Tahun ${reportYear}`}
            categories={monthLabels}
            minY={0}
            maxY={7}
            yTicks={[0, 1, 2, 3, 4, 5, 6, 7]}
            height={130}
            unit="‰"
            formatValue={(v) => fmtIdNum(v)}
            series={[
              {
                name: 'PENCAPAIAN',
                color: '#16a34a',
                marker: 'circle',
                values: vapSeries.monthly.map((m) => m.rate),
              },
              {
                name: 'TARGET',
                color: '#2563eb',
                marker: 'circle',
                values: monthLabels.map(() => 5.8),
              },
            ]}
          />
          <p className="text-center font-bold text-[10.5pt] mt-1">
            Grafik 7. Kejadian VAP di UOBK RSUD Al-Mulk Tahun {reportYear}
          </p>
        </div>
      ),
    });
    b.push(...narrativeToFlowBlocks('ann-n8-vap', narratives.vap));

    // Grafik 8: Decubitus 12 Bulan + Narrative
    b.push({
      type: 'element',
      key: 'ann-decub-chart-heading',
      keepWithNext: true,
      gapAfter: 6,
      node: <p className="font-bold pl-4 text-[12pt]">5) Luka Tekan (Decubitus)</p>,
    });

    b.push({
      type: 'element',
      key: 'ann-grafik8-decub',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full">
          <OfficialComparisonLineChart
            title={`Insiden Rate HAIs DECUBITUS di UOBK RSUD Al-Mulk Tahun ${reportYear}`}
            categories={monthLabels}
            minY={0}
            maxY={2}
            yTicks={[0, 0.5, 1.0, 1.5, 2.0]}
            height={130}
            unit="‰"
            formatValue={(v) => fmtIdNum(v)}
            series={[
              {
                name: 'PENCAPAIAN',
                color: '#16a34a',
                marker: 'circle',
                values: decubSeries.monthly.map((m) => m.rate),
              },
              {
                name: 'TARGET',
                color: '#2563eb',
                marker: 'circle',
                values: monthLabels.map(() => 1.5),
              },
            ]}
          />
          <p className="text-center font-bold text-[10.5pt] mt-1">
            Grafik 8. Kejadian Decubitus di UOBK RSUD Al-Mulk Tahun {reportYear}
          </p>
        </div>
      ),
    });
    b.push(...narrativeToFlowBlocks('ann-n9-decub', narratives.decubitus));

    // 3. Pelaksanaan Bundle HAIs, 4. Diklat, 5. PPRA
    b.push({
      type: 'element',
      key: 'ann-bundles-plabsi-ido',
      gapAfter: 10,
      node: (
        <div className="w-full text-justify space-y-2">
          <p className="font-bold text-[12pt]">3. Pelaksanaan Bundles HAIs</p>
          <p className="indent-8">
            Bundles HAIs merupakan sekumpulan praktik klinis berbasis bukti yang harus diterapkan secara kolektif dan konsisten pada setiap pasien yang terpasang alat invasif atau menjalani tindakan pembedahan:
          </p>
          <p className="font-bold pl-4">1) Bundle Phlebitis (Insersi &amp; Maintenance PLABSI)</p>
          <ul className="list-disc pl-10 space-y-0.5">
            <li>Melakukan kebersihan tangan, menggunakan APD sesuai indikasi, dan menerapkan teknik aseptik saat insersi maupun perawatan kateter IV.</li>
            <li>Memilih lokasi vena yang tepat, melakukan desinfeksi alkohol 70%, menggunakan transparent dressing steril diberi label tanggal pemasangan, serta mengkaji kebutuhan IV kateter setiap hari untuk segera dilepas bila tidak ada indikasi.</li>
          </ul>
          <p className="font-bold pl-4 pt-1">2) Bundle Pencegahan IDO</p>
          <ul className="list-disc pl-10 space-y-0.5">
            <li>Pemberian antibiotik profilaksis dalam 1 jam sebelum insisi operasi, mempertahankan normothermia perioperatif, serta pengendalian kadar gula darah (GDS) pra-operasi.</li>
            <li>Tidak melakukan pencukuran rambut kecuali mengganggu area insisi (direkomendasikan menggunakan surgical clipper di IBS) serta preparasi kulit menggunakan alkohol 70% dan chlorhexidine/povidone iodine.</li>
          </ul>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'ann-bundles-isk-vap-diklat',
      gapAfter: 14,
      node: (
        <div className="w-full text-justify space-y-2">
          <p className="font-bold pl-4">3) Bundle Pencegahan CAUTI / ISK &amp; 4) Bundle Pencegahan VAP</p>
          <ul className="list-disc pl-10 space-y-0.5">
            <li>Bundle ISK: Pemasangan kateter urin atas indikasi medis dengan teknik steril, fiksasi adekuat, menjaga sistem drainase tertutup dengan posisi urine bag selalu lebih rendah dari kandung kemih dan tidak menyentuh lantai, perineal hygiene harian, serta pelepasan segera bila tidak diperlukan.</li>
            <li>Bundle VAP: Kepatuhan kebersihan tangan, elevasi kepala tempat tidur 30°–45°, oral hygiene terjadwal menggunakan antiseptik chlorhexidine 0,2%, manajemen sekresi/suctioning aseptik, serta evaluasi sedasi dan penyapihan ventilator harian.</li>
          </ul>

          <p className="font-bold text-[12pt] pt-1">4. Pendidikan dan Pelatihan &amp; 5. Penggunaan Antibiotika Rasional</p>
          <p className="indent-8">
            Kegiatan In-House Training (IHT) dan sosialisasi kewaspadaan isolasi (kebersihan tangan serta pemakaian/pelepasan APD) dilaksanakan bagi staf rumah sakit disertai pengajuan pelatihan PPI Dasar tersertifikasi kepada Bagian Diklat. Untuk pengendalian resistensi antimikroba, Tim PPI mendorong penguatan fungsi Komite PPRA dan penyusunan peta pola kuman rumah sakit secara berkala.
          </p>
        </div>
      ),
    });

    // =========================================================
    // BAB IV PEMBAHASAN
    // =========================================================
    b.push({ type: 'pageBreak', key: 'ann-pb-bab4' });

    b.push({
      type: 'element',
      key: 'ann-bab4-header',
      chapterAnchor: 'bab4-a',
      keepWithNext: true,
      gapAfter: 12,
      node: (
        <div className="text-center font-bold uppercase text-[12pt] leading-[1.4]">
          <p>BAB IV</p>
          <p>PEMBAHASAN</p>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'ann-bab4-org-hh',
      chapterAnchor: 'bab4-b',
      gapAfter: 10,
      node: (
        <div className="w-full text-justify space-y-2">
          <p className="font-bold uppercase text-[12pt]">A. PENGORGANISASIAN</p>
          <p className="indent-8">
            Rapat koordinasi Tim PPI telah dilaksanakan namun perlu ditingkatkan keteraturan jadwal serta kehadiran seluruh anggota lintas unit agar tindak lanjut rekomendasi perbaikan berjalan optimal di setiap instalasi pelayanan.
          </p>

          <p className="font-bold uppercase text-[12pt] pt-1">
            B. PENINGKATAN MUTU PELAYANAN KESEHATAN DI RUMAH SAKIT PADA KEJADIAN HAIs
          </p>
          <p className="font-bold">1. Evaluasi Pelaksanaan Kewaspadaan Isolasi</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Hand Hygiene &amp; APD:</strong> Rata-rata kepatuhan kebersihan tangan tahun {reportYear} tercatat sebesar {fmtIdNum(ys.hhOverallRate)}% dan kepatuhan penggunaan APD sebesar {fmtIdNum(ys.apdOverallRate)}%. Penguatan pelatihan PPI Dasar bagi seluruh pegawai, pemenuhan kesinambungan fasilitas cuci tangan (tisu, handrub, handsoap), serta ketersediaan stok masker N95, apron, dan pelindung wajah menjadi kunci pencapaian target nasional.
            </li>
            <li>
              <strong>Pengelolaan Limbah &amp; Lingkungan:</strong> Pemilahan limbah infeksius di titik penghasil, kedisiplinan mengikat kantong kuning saat terisi ¾ penuh, kontinuitas ketersediaan safety box di troli tindakan, serta pemenuhan standar ventilasi ruang isolasi bertekanan negatif/HEPA filter terus dievaluasi bersama manajemen dan IPSRS.
            </li>
            <li>
              <strong>CSSD, Linen, Kesehatan Karyawan &amp; Penempatan Pasien:</strong> Peningkatan kompetensi pelatihan eksternal petugas sterilisasi CSSD, penyediaan kontainer/troli tertutup distribusi linen bersih, kelengkapan imunisasi Hepatitis B pada program MCU karyawan, serta pengendalian alur pengunjung di ruang isolasi menjadi prioritas pembenahan fasilitas rumah sakit.
            </li>
          </ul>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'ann-bab4-surveilans-bundles',
      gapAfter: 14,
      node: (
        <div className="w-full text-justify space-y-2">
          <p className="font-bold">2. Evaluasi Surveilans HAIs dan Kepatuhan Bundles Tahun {reportYear}</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Phlebitis:</strong> Rata-rata angka kejadian Phlebitis tahun {reportYear} berada pada {fmtIdNum(phlebSeries.rate)}‰ dengan angka tertinggi pada bulan {phlebPeak?.monthName || '-'} ({fmtIdNum(phlebPeak?.rate || 0)}‰) dan terendah pada bulan {phlebLow?.monthName || '-'} ({fmtIdNum(phlebLow?.rate || 0)}‰). Faktor kontributor meliputi kepatuhan kebersihan tangan sebelum tindakan aseptik, terapi cairan osmolaritas tinggi, pemilihan ukuran kateter IV, teknik tunggu kering swab alkohol 70% sebelum insersi, serta penggantian set infus pasca-transfusi.
            </li>
            <li>
              <strong>IDO, ISK, VAP, dan Decubitus:</strong> Capaian tahun {reportYear} terkendali sesuai standar nasional (IDO {fmtIdNum(idoSeries.rate)}%, ISK {fmtIdNum(iskSeries.rate)}‰, VAP {fmtIdNum(vapSeries.rate)}‰, dan Decubitus {fmtIdNum(decubSeries.rate)}‰). Meskipun demikian, supervisi lapangan tetap difokuskan pada kepatuhan posisi gantung urine bag agar tidak menyentuh lantai, elevasi kepala 30°–45° dan oral hygiene pasien ventilator, penyediaan surgical clipper di kamar bedah, serta pemenuhan ukuran sprei proporsional dan kasur anti-dekubitus di ruang rawat inap.
            </li>
          </ul>
        </div>
      ),
    });

    // =========================================================
    // BAB V PENUTUP & LEMBAR PENGESAHAN
    // =========================================================
    b.push({ type: 'pageBreak', key: 'ann-pb-bab5' });

    b.push({
      type: 'element',
      key: 'ann-bab5-header',
      chapterAnchor: 'bab5-a',
      keepWithNext: true,
      gapAfter: 12,
      node: (
        <div className="text-center font-bold uppercase text-[12pt] leading-[1.4]">
          <p>BAB V</p>
          <p>PENUTUP</p>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'ann-bab5-kesimpulan',
      gapAfter: 12,
      node: (
        <div className="w-full text-justify">
          <p className="font-bold uppercase text-[12pt] mb-1.5">A. KESIMPULAN</p>
          <p className="indent-8">
            Infeksi terkait pelayanan kesehatan (HAIs) merupakan risiko klinis yang harus dikendalikan secara terpadu melalui Program Pencegahan dan Pengendalian Infeksi (PPI) demi menjamin keselamatan pasien, petugas kesehatan, dan pengunjung rumah sakit. Sepanjang tahun {reportYear}, UOBK RSUD Al-Mulk Kota Sukabumi telah menyelenggarakan surveilans epidemiologi aktif terintegrasi SIMRS, audit kepatuhan kewaspadaan isolasi, pengendalian lingkungan, serta penerapan bundles pencegahan infeksi. Keberhasilan pengendalian risiko infeksi memerlukan komitmen kolektif seluruh pemberi layanan serta dukungan berkesinambungan dari jajaran pimpinan dan manajemen rumah sakit dalam pemenuhan sarana prasarana standar PPI.
          </p>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'ann-bab5-saran',
      chapterAnchor: 'bab5-b',
      keepWithNext: true,
      gapAfter: 16,
      node: (
        <div className="w-full text-justify">
          <p className="font-bold uppercase text-[12pt] mb-1.5">B. SARAN</p>
          <ol className="list-decimal pl-8 space-y-1.5">
            <li>Dukungan penuh dan penyamaan persepsi dari jajaran manajemen rumah sakit serta kepala unit pelayanan untuk menunjang efektivitas pelaksanaan program kerja Tim PPI.</li>
            <li>Penyelenggaraan pelatihan PPI Dasar dan Lanjutan secara berkala bagi seluruh staf medis, keperawatan, dan penunjang bekerja sama dengan Bagian Diklat RSUD Al-Mulk.</li>
            <li>Pemenuhan pelatihan Training of Trainer (TOT) PPI bagi IPCN guna mengoptimalkan kapasitas edukasi internal bagi staf maupun pengunjung rumah sakit.</li>
            <li>Penguatan pelaksanaan kajian risiko infeksi (ICRA Program dan ICRA Konstruksi) secara konsisten serta pemenuhan berkesinambungan logistik PPI (handrub, tisu, safety box, APD, dan dressing steril).</li>
            <li>Optimalisasi tindak lanjut hasil Pemeriksaan Kesehatan Karyawan (MCU) berkala dan vaksinasi petugas pada area berisiko guna memutus mata rantai penularan infeksi di rumah sakit.</li>
          </ol>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'ann-signature',
      gapAfter: 0,
      node: (
        <div className="w-full pt-4 text-center">
          <p className="text-[12pt] mb-6">Mengetahui,</p>
          <table className="w-full border-none text-[12pt] leading-[1.4]">
            <tbody>
              <tr className="text-center font-bold">
                <td className="w-1/2 align-top pb-24">
                  Infection Prevention Control Nurse
                </td>
                <td className="w-1/2 align-top pb-24">
                  Ketua Tim PPI
                </td>
              </tr>
              <tr className="text-center">
                <td className="align-bottom">
                  <p className="underline font-bold">Adi Tresa Purnama, A.M.Kep</p>
                  <p className="text-[11pt]">IPCN UOBK RSUD Al-Mulk</p>
                </td>
                <td className="align-bottom">
                  <p className="underline font-bold">dr. Nurul Iman</p>
                  <p className="text-[11pt]">Ketua Tim PPI RSUD Al-Mulk</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    });

    return b;
  }, [ys, reportYear, narratives]);

  return (
    <AutoPaginatedF4Document
      id="print-area-annual"
      numberingMode="bodyStartsAtOne"
      coverPage={
        <ReportCover
          reportType="annual"
          title={`LAPORAN TAHUNAN ${reportYear}`}
          year={String(reportYear)}
        />
      }
      frontMatterPages={frontMatterPages}
      blocks={blocks}
      onChaptersResolved={handleChaptersResolved}
    />
  );
}

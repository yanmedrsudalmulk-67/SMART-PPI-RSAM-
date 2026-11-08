import React, { useMemo } from 'react';
import ReportCover from './ReportCover';
import OfficialModernBarChart from './OfficialModernBarChart';
import { WordStyleGroupedBarChart, WordStyleLineChart } from './QuarterlyOfficialReport';
import AutoPaginatedF4Document, { FlowBlock } from './AutoPaginatedF4Document';
import { OfficialReportData, useOfficialReportData } from '@/hooks/useOfficialReportData';
import {
  buildHaisOverviewNarrative,
  buildSingleHaisNarrative,
  buildHandHygieneProfessionNarrative,
  buildApdNarrative,
  narrativeToFlowBlocks,
  fmtIdNum,
} from '@/utils/officialChartNarratives';

interface SemesterReportProps {
  reportData?: OfficialReportData;
  semester?: number; // 0 for Sem I, 1 for Sem II
  year?: number;
}

const MONTH_COLORS = ['#2563eb', '#ea580c', '#64748b', '#ca8a04', '#0891b2', '#16a34a'];

export default function SemesterOfficialReport({
  reportData,
  semester = Math.floor(new Date().getMonth() / 6),
  year = new Date().getFullYear(),
}: SemesterReportProps) {
  const internalData = useOfficialReportData({
    periodType: 'semester',
    semester,
    year,
    enabled: !reportData,
  });

  const data = reportData || internalData;
  const sData = data.semesterData;
  const reportYear = data.year || year;
  const semRoman = sData?.semesterRoman || (semester === 1 ? 'II' : 'I');
  const periodRangeText =
    sData?.periodLabel ||
    (semester === 1 ? `Juli - Desember ${reportYear}` : `Januari - Juni ${reportYear}`);
  const fullPeriodLabel = `Semester ${semRoman} (Periode ${periodRangeText})`;
  const dateReport =
    semester === 0 ? `Sukabumi, 10 Juli ${reportYear}` : `Sukabumi, 10 Januari ${reportYear + 1}`;

  const phleb = sData.hais.phlebitis;
  const isk = sData.hais.isk;
  const decub = sData.hais.decubitus;
  const vap = sData.hais.vap;
  const ido = sData.hais.ido;
  const semMonths = sData.months;

  // Automatic Narratives (Analisa + Rekomendasi + Rencana Tindak Lanjut)
  const narratives = useMemo(() => {
    const phlebPeak = [...phleb.monthly].sort((a, b) => b.rate - a.rate)[0];

    const haisOverview = buildHaisOverviewNarrative({
      periodLabel: fullPeriodLabel,
      phlebitis: { cases: phleb.totalCases, days: phleb.totalDays, rate: phleb.rate },
      isk: { cases: isk.totalCases, days: isk.totalDays, rate: isk.rate },
      decubitus: { cases: decub.totalCases, days: decub.totalDays, rate: decub.rate },
      vap: { cases: vap.totalCases, days: vap.totalDays, rate: vap.rate },
      ido: { cases: ido.totalCases, days: ido.totalDays, rate: ido.rate },
      peakDetail:
        phlebPeak && phlebPeak.rate > 0
          ? `puncak kejadian Phlebitis terdapat pada bulan ${phlebPeak.monthName} (${fmtIdNum(phlebPeak.rate)}‰; ${phlebPeak.cases} kasus)`
          : undefined,
    });

    const phlebNarr = buildSingleHaisNarrative({
      indicator: 'phlebitis',
      periodLabel: fullPeriodLabel,
      dimensionLabel: 'bulan',
      points: phleb.monthly.map((m) => ({
        label: m.monthName,
        days: m.days,
        cases: m.cases,
        rate: m.rate,
      })),
      totalDays: phleb.totalDays,
      totalCases: phleb.totalCases,
      overallRate: phleb.rate,
    });

    const iskNarr = buildSingleHaisNarrative({
      indicator: 'isk',
      periodLabel: fullPeriodLabel,
      dimensionLabel: 'bulan',
      points: isk.monthly.map((m) => ({
        label: m.monthName,
        days: m.days,
        cases: m.cases,
        rate: m.rate,
      })),
      totalDays: isk.totalDays,
      totalCases: isk.totalCases,
      overallRate: isk.rate,
    });

    const decubNarr = buildSingleHaisNarrative({
      indicator: 'decubitus',
      periodLabel: fullPeriodLabel,
      dimensionLabel: 'bulan',
      points: decub.monthly.map((m) => ({
        label: m.monthName,
        days: m.days,
        cases: m.cases,
        rate: m.rate,
      })),
      totalDays: decub.totalDays,
      totalCases: decub.totalCases,
      overallRate: decub.rate,
    });

    const vapNarr = buildSingleHaisNarrative({
      indicator: 'vap',
      periodLabel: fullPeriodLabel,
      dimensionLabel: 'bulan',
      points: vap.monthly.map((m) => ({
        label: m.monthName,
        days: m.days,
        cases: m.cases,
        rate: m.rate,
      })),
      totalDays: vap.totalDays,
      totalCases: vap.totalCases,
      overallRate: vap.rate,
    });

    const idoNarr = buildSingleHaisNarrative({
      indicator: 'ido',
      periodLabel: fullPeriodLabel,
      dimensionLabel: 'bulan',
      points: ido.monthly.map((m) => ({
        label: m.monthName,
        days: m.days,
        cases: m.cases,
        rate: m.rate,
      })),
      totalDays: ido.totalDays,
      totalCases: ido.totalCases,
      overallRate: ido.rate,
    });

    const bestHhMonth = [...sData.hhMonthly].sort((a, b) => b.rate - a.rate)[0];
    const hhNarr = buildHandHygieneProfessionNarrative({
      periodLabel: fullPeriodLabel,
      overallRate: sData.hhOverallRate,
      professions: sData.hhProfessions.map((p) => ({
        name: p.profession,
        rate: p.rate,
        opp: p.opp,
        hh: p.hh,
      })),
      peakMonthDetail: bestHhMonth
        ? `Berdasarkan tren bulanan selama 6 bulan, capaian tertinggi diraih pada bulan ${bestHhMonth.monthName} (${fmtIdNum(bestHhMonth.rate)}%).`
        : undefined,
    });

    const apdNarr = buildApdNarrative({
      periodLabel: fullPeriodLabel,
      overallRate: sData.apdOverallRate,
      points: sData.apdMonthly.map((m) => ({
        label: m.monthName,
        rate: m.rate,
      })),
    });

    return {
      haisOverview,
      phlebNarr,
      iskNarr,
      decubNarr,
      vapNarr,
      idoNarr,
      hhNarr,
      apdNarr,
    };
  }, [fullPeriodLabel, phleb, isk, decub, vap, ido, sData]);

  // Helper to build a 6-month HAIs indicator table
  const renderSixMonthHaisTable = (
    tableNum: number,
    title: string,
    denomRowLabel: string,
    caseRowLabel: string,
    series: typeof phleb,
    targetLabel: string
  ) => (
    <div className="w-full">
      <p className="text-center font-bold text-[11pt] mb-1">
        Tabel {tableNum}. {title} Semester {semRoman} ({periodRangeText})
      </p>
      <table className="w-full table-fixed border-collapse border border-black text-center text-[9pt] leading-[1.3]">
        <thead>
          <tr className="bg-slate-100 font-bold">
            <th className="border border-black p-1 w-[26%] text-left" rowSpan={2}>
              INDIKATOR
            </th>
            <th className="border border-black p-1" colSpan={6}>
              BULAN
            </th>
            <th className="border border-black p-1 w-[12%]" rowSpan={2}>
              TOTAL / RATA2
            </th>
          </tr>
          <tr className="bg-slate-100 font-bold">
            {semMonths.map((m) => (
              <th key={m.monthIndex} className="border border-black p-1">
                {m.shortName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-1 text-left font-medium">{denomRowLabel}</td>
            {series.monthly.map((m) => (
              <td key={m.monthIndex} className="border border-black p-1">
                {m.days}
              </td>
            ))}
            <td className="border border-black p-1 font-bold">{series.totalDays}</td>
          </tr>
          <tr>
            <td className="border border-black p-1 text-left font-medium">{caseRowLabel}</td>
            {series.monthly.map((m) => (
              <td key={m.monthIndex} className="border border-black p-1 font-semibold">
                {m.cases}
              </td>
            ))}
            <td className="border border-black p-1 font-bold">{series.totalCases}</td>
          </tr>
          <tr className="bg-slate-50 font-bold">
            <td className="border border-black p-1 text-left">Rate ({series.unit})</td>
            {series.monthly.map((m) => (
              <td key={m.monthIndex} className="border border-black p-1">
                {fmtIdNum(m.rate)}
                {series.unit}
              </td>
            ))}
            <td className="border border-black p-1">
              {fmtIdNum(series.rate)}
              {series.unit}
            </td>
          </tr>
          <tr className="font-semibold">
            <td className="border border-black p-1 text-left">Target Nasional</td>
            {series.monthly.map((m) => (
              <td key={m.monthIndex} className="border border-black p-1">
                {targetLabel}
              </td>
            ))}
            <td className="border border-black p-1">{targetLabel}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  // Flow blocks for AutoPaginatedF4Document (F4 215x330mm, 2.5cm margins, Arial 12pt)
  const blocks: FlowBlock[] = useMemo(() => {
    const b: FlowBlock[] = [];

    // =========================================================
    // BAB I PENDAHULUAN
    // =========================================================
    b.push({
      type: 'element',
      key: 's-title-header',
      keepWithNext: true,
      gapAfter: 14,
      node: (
        <div className="text-center font-bold">
          <p className="uppercase text-[12pt] leading-[1.4]">
            LAPORAN EVALUASI PROGRAM PPI SEMESTER {semRoman}
          </p>
          <p className="uppercase text-[12pt] leading-[1.4]">
            PERIODE {periodRangeText.toUpperCase()}
          </p>
          <p className="uppercase text-[12pt] leading-[1.4]">
            UOBK RSUD AL-MULK KOTA SUKABUMI
          </p>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 's-bab1-heading',
      keepWithNext: true,
      gapAfter: 10,
      node: (
        <div className="text-center font-bold uppercase border-b border-black pb-1 text-[12pt]">
          BAB I PENDAHULUAN
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 's-exec-summary',
      gapAfter: 12,
      node: (
        <div className="w-full text-justify space-y-2.5">
          <p className="font-bold text-[12pt]">A. Ringkasan Eksekutif Capaian Semester {semRoman}</p>
          <p className="indent-8">
            Laporan evaluasi Semester {semRoman} ({periodRangeText}) ini menyajikan analisis komprehensif terhadap pelaksanaan Program Pencegahan dan Pengendalian Infeksi (PPI), pemantauan indikator mutu surveilans Healthcare Associated Infections (HAIs), serta hasil audit kepatuhan kewaspadaan standar di UOBK RSUD Al-Mulk Kota Sukabumi selama enam bulan berturut-turut secara terintegrasi dengan Sistem Informasi Manajemen Rumah Sakit (SIMRS) dan aplikasi SMART PPI.
          </p>
          <p className="indent-8">
            Secara akumulatif selama {fullPeriodLabel}, capaian indikator surveilans menunjukkan Phlebitis sebesar {fmtIdNum(phleb.rate)}‰ ({phleb.totalCases} kasus dari {phleb.totalDays} hari pemasangan IV line), ISK sebesar {fmtIdNum(isk.rate)}‰ ({isk.totalCases} kasus), Decubitus sebesar {fmtIdNum(decub.rate)}‰ ({decub.totalCases} kasus), VAP sebesar {fmtIdNum(vap.rate)}‰ ({vap.totalCases} kasus), dan IDO sebesar {fmtIdNum(ido.rate)}% ({ido.totalCases} kasus dari {ido.totalDays} tindakan operasi). Sementara itu, rata-rata kepatuhan kebersihan tangan (Hand Hygiene) petugas tercatat sebesar {fmtIdNum(sData.hhOverallRate)}% dan kepatuhan penggunaan Alat Pelindung Diri (APD) mencapai rata-rata {fmtIdNum(sData.apdOverallRate)}%.
          </p>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 's-dasar-hukum',
      gapAfter: 14,
      node: (
        <div className="w-full text-justify space-y-2">
          <p className="font-bold text-[12pt]">B. Dasar Hukum dan Tujuan Evaluasi Semester</p>
          <ol className="list-decimal pl-8 space-y-1">
            <li>Undang-Undang Republik Indonesia Nomor 17 Tahun 2023 tentang Kesehatan.</li>
            <li>Peraturan Menteri Kesehatan Republik Indonesia Nomor 27 Tahun 2017 tentang Pedoman Pencegahan dan Pengendalian Infeksi di Fasilitas Pelayanan Kesehatan.</li>
            <li>Peraturan Menteri Kesehatan Republik Indonesia Nomor 80 Tahun 2020 tentang Komite Mutu Rumah Sakit.</li>
            <li>Keputusan Direktur UOBK RSUD Al-Mulk Kota Sukabumi tentang Penetapan Program Kerja dan Tim Pencegahan dan Pengendalian Infeksi (PPI).</li>
          </ol>
          <p className="indent-8 pt-1">
            Tujuan penyusunan laporan semester ini adalah mengevaluasi tren tengah tahunan indikator infeksi dan kepatuhan petugas, menilai efektivitas siklus perbaikan mutu berkelanjutan (Plan-Do-Study-Act / PDSA), serta memberikan rekomendasi strategis kepada Direktur dan Komite Mutu untuk penguatan layanan pada periode berikutnya.
          </p>
        </div>
      ),
    });

    // =========================================================
    // BAB II EVALUASI SURVEILANS HAIs 6 BULAN
    // =========================================================
    b.push({
      type: 'element',
      key: 's-bab2-heading',
      keepWithNext: true,
      gapAfter: 10,
      node: (
        <div className="text-center font-bold uppercase border-b border-black pb-1 text-[12pt]">
          BAB II EVALUASI SURVEILANS HAIs DAN AUDIT KEWASPADAAN STANDAR
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 's-hais-intro',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full text-justify">
          <p className="font-bold text-[12pt] mb-1">
            A. Evaluasi Tren Indikator Surveilans HAIs 6 Bulan
          </p>
          <p className="indent-8">
            Rekapitulasi pemantauan kelima indikator Healthcare Associated Infections (HAIs) per bulan selama {fullPeriodLabel} disajikan pada tabel dan grafik berikut:
          </p>
        </div>
      ),
    });

    // Tabel 1 Rekapitulasi HAIs 6 Bulan
    b.push({
      type: 'element',
      key: 's-tabel1-hais-summary',
      gapAfter: 12,
      node: (
        <div className="w-full">
          <p className="text-center font-bold text-[11pt] mb-1">
            Tabel 1. Rekapitulasi Capaian Indikator HAIs per Bulan Semester {semRoman} Tahun {reportYear}
          </p>
          <table className="w-full border-collapse border border-black text-center text-[9.5pt] leading-[1.3]">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1.5 text-left">Bulan</th>
                <th className="border border-black p-1.5">Phlebitis (‰)</th>
                <th className="border border-black p-1.5">ISK (‰)</th>
                <th className="border border-black p-1.5">Decubitus (‰)</th>
                <th className="border border-black p-1.5">VAP (‰)</th>
                <th className="border border-black p-1.5">IDO (%)</th>
              </tr>
            </thead>
            <tbody>
              {semMonths.map((m, idx) => (
                <tr key={m.monthIndex}>
                  <td className="border border-black p-1 text-left font-semibold">{m.monthName}</td>
                  <td className="border border-black p-1 font-bold">
                    {fmtIdNum(phleb.monthly[idx]?.rate ?? 0)}‰
                  </td>
                  <td className="border border-black p-1">
                    {fmtIdNum(isk.monthly[idx]?.rate ?? 0)}‰
                  </td>
                  <td className="border border-black p-1">
                    {fmtIdNum(decub.monthly[idx]?.rate ?? 0)}‰
                  </td>
                  <td className="border border-black p-1">
                    {fmtIdNum(vap.monthly[idx]?.rate ?? 0)}‰
                  </td>
                  <td className="border border-black p-1">
                    {fmtIdNum(ido.monthly[idx]?.rate ?? 0)}%
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold">
                <td className="border border-black p-1 text-left">Capaian Semester {semRoman}</td>
                <td className="border border-black p-1">{fmtIdNum(phleb.rate)}‰</td>
                <td className="border border-black p-1">{fmtIdNum(isk.rate)}‰</td>
                <td className="border border-black p-1">{fmtIdNum(decub.rate)}‰</td>
                <td className="border border-black p-1">{fmtIdNum(vap.rate)}‰</td>
                <td className="border border-black p-1">{fmtIdNum(ido.rate)}%</td>
              </tr>
              <tr className="bg-slate-50 font-semibold">
                <td className="border border-black p-1 text-left">Standar Nasional</td>
                <td className="border border-black p-1">≤ 1‰</td>
                <td className="border border-black p-1">≤ 4,7‰</td>
                <td className="border border-black p-1">≤ 1,5‰</td>
                <td className="border border-black p-1">≤ 5,8‰</td>
                <td className="border border-black p-1">≤ 2%</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    });

    // Grafik 1 HAIs 6 Bulan + Narrative
    b.push({
      type: 'element',
      key: 's-grafik1-hais',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full">
          <p className="text-center font-bold text-[11pt] mb-1">
            Grafik 1. Rekapitulasi Incidence Rate HAIs Semester {semRoman} ({periodRangeText})
          </p>
          <WordStyleGroupedBarChart
            categories={['Phlebitis', 'ISK', 'Decubitus', 'VAP', 'IDO']}
            series={semMonths.map((m, idx) => ({
              name: m.shortName,
              color: MONTH_COLORS[idx % MONTH_COLORS.length],
              values: [
                phleb.monthly[idx]?.rate ?? 0,
                isk.monthly[idx]?.rate ?? 0,
                decub.monthly[idx]?.rate ?? 0,
                vap.monthly[idx]?.rate ?? 0,
                ido.monthly[idx]?.rate ?? 0,
              ],
            }))}
            height={150}
          />
        </div>
      ),
    });
    b.push(...narrativeToFlowBlocks('s-n1-hais', narratives.haisOverview));

    // 1. Phlebitis 6 Bulan
    b.push({
      type: 'element',
      key: 's-phleb-heading',
      keepWithNext: true,
      gapAfter: 6,
      node: (
        <p className="font-bold text-[12pt]">
          1. Tren Kejadian Phlebitis Semester {semRoman}
        </p>
      ),
    });
    b.push({
      type: 'element',
      key: 's-grafik2-phleb',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full">
          <p className="text-center font-bold text-[11pt] mb-1">
            Grafik 2. Tren Incidence Rate Phlebitis (‰) Semester {semRoman} ({periodRangeText})
          </p>
          <WordStyleLineChart
            categories={semMonths.map((m) => m.shortName)}
            series={[
              {
                name: 'Phlebitis (‰)',
                color: '#2563eb',
                values: phleb.monthly.map((m) => m.rate),
              },
              {
                name: 'Target (≤ 1‰)',
                color: '#ea580c',
                values: semMonths.map(() => 1.0),
              },
            ]}
            height={135}
          />
        </div>
      ),
    });
    b.push(...narrativeToFlowBlocks('s-n2-phleb', narratives.phlebNarr));
    b.push({
      type: 'element',
      key: 's-tabel2-phleb',
      gapAfter: 14,
      node: renderSixMonthHaisTable(
        2,
        'Kejadian Phlebitis per 1.000 Hari Pemasangan IVL',
        'Hari pemasangan IVL',
        'Kasus Phlebitis',
        phleb,
        '≤ 1‰'
      ),
    });

    // 2. ISK 6 Bulan
    b.push({
      type: 'element',
      key: 's-isk-heading',
      keepWithNext: true,
      gapAfter: 6,
      node: (
        <p className="font-bold text-[12pt]">
          2. Tren Kejadian Infeksi Saluran Kemih (ISK) Semester {semRoman}
        </p>
      ),
    });
    b.push({
      type: 'element',
      key: 's-grafik3-isk',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full">
          <p className="text-center font-bold text-[11pt] mb-1">
            Grafik 3. Tren Incidence Rate ISK (‰) Semester {semRoman} ({periodRangeText})
          </p>
          <WordStyleLineChart
            categories={semMonths.map((m) => m.shortName)}
            maxY={6}
            series={[
              {
                name: 'ISK (‰)',
                color: '#2563eb',
                values: isk.monthly.map((m) => m.rate),
              },
              {
                name: 'Target (≤ 4,7‰)',
                color: '#ea580c',
                values: semMonths.map(() => 4.7),
              },
            ]}
            height={130}
          />
        </div>
      ),
    });
    b.push(...narrativeToFlowBlocks('s-n3-isk', narratives.iskNarr));
    b.push({
      type: 'element',
      key: 's-tabel3-isk',
      gapAfter: 14,
      node: renderSixMonthHaisTable(
        3,
        'Kejadian ISK per 1.000 Hari Pemasangan Kateter Urin',
        'Hari pemasangan kateter',
        'Kasus ISK',
        isk,
        '≤ 4,7‰'
      ),
    });

    // 3. Decubitus 6 Bulan
    b.push({
      type: 'element',
      key: 's-decub-heading',
      keepWithNext: true,
      gapAfter: 6,
      node: (
        <p className="font-bold text-[12pt]">
          3. Tren Kejadian Luka Tekan (Decubitus) Semester {semRoman}
        </p>
      ),
    });
    b.push({
      type: 'element',
      key: 's-grafik4-decub',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full">
          <p className="text-center font-bold text-[11pt] mb-1">
            Grafik 4. Tren Incidence Rate Decubitus (‰) Semester {semRoman} ({periodRangeText})
          </p>
          <WordStyleLineChart
            categories={semMonths.map((m) => m.shortName)}
            maxY={2}
            series={[
              {
                name: 'Decubitus (‰)',
                color: '#2563eb',
                values: decub.monthly.map((m) => m.rate),
              },
              {
                name: 'Target (≤ 1,5‰)',
                color: '#ea580c',
                values: semMonths.map(() => 1.5),
              },
            ]}
            height={130}
          />
        </div>
      ),
    });
    b.push(...narrativeToFlowBlocks('s-n4-decub', narratives.decubNarr));
    b.push({
      type: 'element',
      key: 's-tabel4-decub',
      gapAfter: 14,
      node: renderSixMonthHaisTable(
        4,
        'Kejadian Decubitus per 1.000 Hari Tirah Baring',
        'Hari tirah baring',
        'Kasus Decubitus',
        decub,
        '≤ 1,5‰'
      ),
    });

    // 4. VAP 6 Bulan
    b.push({
      type: 'element',
      key: 's-vap-heading',
      keepWithNext: true,
      gapAfter: 6,
      node: (
        <p className="font-bold text-[12pt]">
          4. Tren Kejadian Ventilator Associated Pneumonia (VAP) Semester {semRoman}
        </p>
      ),
    });
    b.push({
      type: 'element',
      key: 's-grafik5-vap',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full">
          <p className="text-center font-bold text-[11pt] mb-1">
            Grafik 5. Tren Incidence Rate VAP (‰) Semester {semRoman} ({periodRangeText})
          </p>
          <WordStyleLineChart
            categories={semMonths.map((m) => m.shortName)}
            maxY={7}
            series={[
              {
                name: 'VAP (‰)',
                color: '#2563eb',
                values: vap.monthly.map((m) => m.rate),
              },
              {
                name: 'Target (≤ 5,8‰)',
                color: '#ea580c',
                values: semMonths.map(() => 5.8),
              },
            ]}
            height={130}
          />
        </div>
      ),
    });
    b.push(...narrativeToFlowBlocks('s-n5-vap', narratives.vapNarr));
    b.push({
      type: 'element',
      key: 's-tabel5-vap',
      gapAfter: 14,
      node: renderSixMonthHaisTable(
        5,
        'Kejadian VAP per 1.000 Hari Pemakaian Ventilator',
        'Hari pemakaian ventilator',
        'Kasus VAP',
        vap,
        '≤ 5,8‰'
      ),
    });

    // 5. IDO 6 Bulan
    b.push({
      type: 'element',
      key: 's-ido-heading',
      keepWithNext: true,
      gapAfter: 6,
      node: (
        <p className="font-bold text-[12pt]">
          5. Tren Kejadian Infeksi Daerah Operasi (IDO) Semester {semRoman}
        </p>
      ),
    });
    b.push({
      type: 'element',
      key: 's-grafik6-ido',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full">
          <p className="text-center font-bold text-[11pt] mb-1">
            Grafik 6. Tren Incidence Rate IDO (%) Semester {semRoman} ({periodRangeText})
          </p>
          <WordStyleLineChart
            categories={semMonths.map((m) => m.shortName)}
            maxY={3}
            series={[
              {
                name: 'IDO (%)',
                color: '#2563eb',
                values: ido.monthly.map((m) => m.rate),
              },
              {
                name: 'Target (≤ 2%)',
                color: '#ea580c',
                values: semMonths.map(() => 2.0),
              },
            ]}
            height={130}
          />
        </div>
      ),
    });
    b.push(...narrativeToFlowBlocks('s-n6-ido', narratives.idoNarr));
    b.push({
      type: 'element',
      key: 's-tabel6-ido',
      gapAfter: 16,
      node: renderSixMonthHaisTable(
        6,
        'Kejadian Infeksi Daerah Operasi (IDO)',
        'Jumlah pasien operasi',
        'Kasus IDO',
        ido,
        '≤ 2%'
      ),
    });

    // =========================================================
    // B. AUDIT KEWASPADAAN STANDAR 6 BULAN (HAND HYGIENE & APD)
    // =========================================================
    b.push({
      type: 'element',
      key: 's-audit-header',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full">
          <div className="text-center font-bold uppercase border-b border-black pb-1 mb-2 text-[12pt]">
            B. EVALUASI AUDIT KEWASPADAAN STANDAR SEMESTER {semRoman}
          </div>
          <p className="font-bold text-[12pt]">
            1. Audit Kepatuhan Kebersihan Tangan (Hand Hygiene) Berdasarkan Profesi
          </p>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 's-grafik7-hh',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full">
          <p className="text-center font-bold text-[11pt] mb-1">
            Grafik 7. Kepatuhan Hand Hygiene Berdasarkan Profesi Semester {semRoman} ({periodRangeText})
          </p>
          <WordStyleGroupedBarChart
            categories={sData.hhProfessions.map((p) => p.profession)}
            maxY={100}
            unit="%"
            series={semMonths.map((m, idx) => ({
              name: m.shortName,
              color: MONTH_COLORS[idx % MONTH_COLORS.length],
              values: sData.hhProfessions.map((p) => p.monthly[idx]?.rate ?? 0),
            }))}
            height={150}
          />
          <div className="flex justify-between text-[9.5pt] font-bold text-slate-800 px-1 mt-1">
            <span>Standar Target Kemenkes: ≥ 85%</span>
            <span>Rata-rata Semester {semRoman}: {fmtIdNum(sData.hhOverallRate)}%</span>
          </div>
        </div>
      ),
    });
    b.push(...narrativeToFlowBlocks('s-n7-hh', narratives.hhNarr));

    b.push({
      type: 'element',
      key: 's-tabel7-hh',
      gapAfter: 14,
      node: (
        <div className="w-full">
          <p className="text-center font-bold text-[11pt] mb-1">
            Tabel 7. Rekapitulasi Audit Kepatuhan Hand Hygiene Semester {semRoman} ({periodRangeText})
          </p>
          <table className="w-full table-fixed border-collapse border border-black text-center text-[9pt] leading-[1.3]">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1 w-[22%] text-left" rowSpan={2}>
                  PROFESI
                </th>
                <th className="border border-black p-1" colSpan={6}>
                  CAPAIAN BULANAN (%)
                </th>
                <th className="border border-black p-1 w-[12%]" rowSpan={2}>
                  RATA2
                </th>
                <th className="border border-black p-1 w-[12%]" rowSpan={2}>
                  TARGET
                </th>
              </tr>
              <tr className="bg-slate-100 font-bold">
                {semMonths.map((m) => (
                  <th key={m.monthIndex} className="border border-black p-1">
                    {m.shortName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sData.hhProfessions.map((p) => (
                <tr key={p.profession}>
                  <td className="border border-black p-1 text-left font-semibold">{p.profession}</td>
                  {p.monthly.map((m, i) => (
                    <td key={i} className="border border-black p-1">
                      {fmtIdNum(m.rate)}%
                    </td>
                  ))}
                  <td className="border border-black p-1 font-bold">{fmtIdNum(p.rate)}%</td>
                  <td className="border border-black p-1">≥ 85%</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold">
                <td className="border border-black p-1 text-left">Rata-rata RS</td>
                {sData.hhMonthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">
                    {fmtIdNum(m.rate)}%
                  </td>
                ))}
                <td className="border border-black p-1">{fmtIdNum(sData.hhOverallRate)}%</td>
                <td className="border border-black p-1">≥ 85%</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    });

    // 2. APD 6 Bulan
    b.push({
      type: 'element',
      key: 's-apd-heading',
      keepWithNext: true,
      gapAfter: 6,
      node: (
        <p className="font-bold text-[12pt]">
          2. Audit Kepatuhan Penggunaan Alat Pelindung Diri (APD)
        </p>
      ),
    });

    b.push({
      type: 'element',
      key: 's-grafik8-apd',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="w-full">
          <OfficialModernBarChart
            title={`Grafik 8. Kepatuhan Penggunaan APD Semester ${semRoman} (${periodRangeText})`}
            data={sData.apdMonthly.map((m) => ({
              label: m.shortName,
              value: m.rate,
              formattedValue: `${fmtIdNum(m.rate)}%`,
              color: m.rate >= 100 ? '#10b981' : m.rate < 98 ? '#f59e0b' : '#0f2942',
            }))}
            unit="%"
            maxValue={100}
            height={130}
          />
          <div className="flex justify-between text-[9.5pt] font-bold text-slate-800 px-1">
            <span>Standar Target Kemenkes: 100%</span>
            <span>Rata-rata Semester {semRoman}: {fmtIdNum(sData.apdOverallRate)}%</span>
          </div>
        </div>
      ),
    });
    b.push(...narrativeToFlowBlocks('s-n8-apd', narratives.apdNarr));

    b.push({
      type: 'element',
      key: 's-tabel8-apd',
      gapAfter: 16,
      node: (
        <div className="w-full">
          <p className="text-center font-bold text-[11pt] mb-1">
            Tabel 8. Rekapitulasi Kepatuhan Penggunaan APD Semester {semRoman} ({periodRangeText})
          </p>
          <table className="w-full table-fixed border-collapse border border-black text-center text-[9pt] leading-[1.3]">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1 w-[22%] text-left">INDIKATOR</th>
                {semMonths.map((m) => (
                  <th key={m.monthIndex} className="border border-black p-1">
                    {m.shortName}
                  </th>
                ))}
                <th className="border border-black p-1 w-[14%]">RATA-RATA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Peluang Dinilai</td>
                {sData.apdMonthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">
                    {m.eval}
                  </td>
                ))}
                <td className="border border-black p-1 font-semibold">
                  {sData.apdMonthly.reduce((acc, m) => acc + m.eval, 0)}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Tindakan Patuh</td>
                {sData.apdMonthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">
                    {m.comp}
                  </td>
                ))}
                <td className="border border-black p-1 font-semibold">
                  {sData.apdMonthly.reduce((acc, m) => acc + m.comp, 0)}
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="border border-black p-1 text-left">Capaian (%)</td>
                {sData.apdMonthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">
                    {fmtIdNum(m.rate)}%
                  </td>
                ))}
                <td className="border border-black p-1">{fmtIdNum(sData.apdOverallRate)}%</td>
              </tr>
              <tr className="font-bold">
                <td className="border border-black p-1 text-left">Target Kemenkes</td>
                {sData.apdMonthly.map((m) => (
                  <td key={m.monthIndex} className="border border-black p-1">
                    100%
                  </td>
                ))}
                <td className="border border-black p-1">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    });

    // =========================================================
    // BAB III KESIMPULAN DAN LEMBAR PENGESAHAN SEMESTER
    // =========================================================
    b.push({
      type: 'element',
      key: 's-bab3-heading',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="text-center font-bold uppercase border-b border-black pb-1 text-[12pt]">
          BAB III KESIMPULAN DAN PENUTUP
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 's-bab3-body',
      keepWithNext: true,
      gapAfter: 14,
      node: (
        <div className="w-full text-justify space-y-2">
          <p className="indent-8">
            Pelaksanaan program Pencegahan dan Pengendalian Infeksi (PPI) di UOBK RSUD Al-Mulk Kota Sukabumi pada {fullPeriodLabel} secara umum telah berjalan sistematis dan terukur. Indikator ISK ({fmtIdNum(isk.rate)}‰), Decubitus ({fmtIdNum(decub.rate)}‰), VAP ({fmtIdNum(vap.rate)}‰), dan IDO ({fmtIdNum(ido.rate)}%) berhasil dikendalikan sesuai standar baku mutu nasional, sementara penurunan angka Phlebitis ({fmtIdNum(phleb.rate)}‰) serta penguatan kepatuhan Hand Hygiene ({fmtIdNum(sData.hhOverallRate)}%) dan penggunaan APD ({fmtIdNum(sData.apdOverallRate)}%) terus diintensifkan melalui supervisi harian IPCN/IPCLN dan pemanfaatan sistem SMART PPI.
          </p>
          <p className="indent-8">
            Demikian laporan evaluasi Semester {semRoman} ini disusun sebagai bahan pertanggungjawaban kinerja dan landasan kebijakan strategis peningkatan mutu serta keselamatan pasien di lingkungan UOBK RSUD Al-Mulk Kota Sukabumi.
          </p>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 's-signature',
      gapAfter: 0,
      node: (
        <div className="w-full pt-2">
          <p className="text-right text-[12pt] mb-4">{dateReport}</p>
          <table className="w-full border-none text-[12pt] leading-[1.4]">
            <tbody>
              <tr className="text-center font-bold">
                <td className="w-1/2 align-top pb-20">
                  Mengetahui / Menyetujui,<br />
                  Direktur UOBK RSUD Al-Mulk
                </td>
                <td className="w-1/2 align-top pb-20">
                  Ketua Tim PPI,<br />
                  UOBK RSUD Al-Mulk
                </td>
              </tr>
              <tr className="text-center">
                <td className="align-bottom">
                  <p className="underline font-bold">dr. Munifah Budi Isnaeni, MMRS</p>
                  <p className="text-[11pt]">NIP. 19741005 200604 2 018</p>
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
  }, [semRoman, periodRangeText, fullPeriodLabel, reportYear, phleb, isk, decub, vap, ido, semMonths, sData, narratives, dateReport]);

  return (
    <AutoPaginatedF4Document
      id="print-area-semester"
      numberingMode="inclusive"
      coverPage={
        <ReportCover
          reportType="semester"
          title={`LAPORAN SEMESTER ${semRoman} ${reportYear}`}
          year={String(reportYear)}
        />
      }
      blocks={blocks}
    />
  );
}

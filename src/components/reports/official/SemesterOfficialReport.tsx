import React, { useMemo } from 'react';
import ReportCover from './ReportCover';
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
import {
  TwoLineReportTitle,
  WordStyleGroupedBarChart,
  WordStyleLineChart,
} from './QuarterlyOfficialReport';

interface SemesterReportProps {
  reportData?: OfficialReportData;
  semester?: number; // 0 for Sem I, 1 for Sem II
  year?: number;
}

const SEMESTER_MONTH_COLORS = [
  '#4f81bd', // Blue
  '#c0504d', // Red
  '#9bbb59', // Olive Green
  '#8064a2', // Purple
  '#4bacc6', // Teal
  '#f79646', // Orange
];

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

  const semMonths = sData?.months || [];
  const mStart = semMonths[0] || { monthIndex: 0, monthName: 'Januari', shortName: 'JAN' };
  const mEnd = semMonths[5] || { monthIndex: 5, monthName: 'Juni', shortName: 'JUN' };
  const periodRangeText = `${mStart.monthName} - ${mEnd.monthName} ${reportYear}`;
  const fullPeriodLabel = `Semester ${semRoman} Periode ${periodRangeText}`;

  const signMonthName = semester === 1 ? 'Januari' : 'Juli';
  const signYear = semester === 1 ? reportYear + 1 : reportYear;

  const phleb = sData.hais.phlebitis;
  const isk = sData.hais.isk;
  const decub = sData.hais.decubitus;
  const vap = sData.hais.vap;
  const ido = sData.hais.ido;

  const chartMonthLabels = semMonths.map((m) => m.shortName);

  const perawatRow =
    sData.hhProfessions.find((p) => p.profession.toLowerCase().includes('perawat')) || sData.hhProfessions[0];
  const dokterRow =
    sData.hhProfessions.find((p) => p.profession.toLowerCase().includes('dokter')) || sData.hhProfessions[1];
  const nakesRow =
    sData.hhProfessions.find(
      (p) => p.profession.toLowerCase().includes('tenaga') || p.profession.toLowerCase().includes('nakes')
    ) || sData.hhProfessions[2];

  // Dynamic Narratives for all 8 Charts
  const highestPhleb = [...phleb.monthly].sort((a, b) => b.rate - a.rate)[0];

  const haisOverviewNarr = buildHaisOverviewNarrative({
    periodLabel: fullPeriodLabel,
    phlebitis: { cases: phleb.totalCases, days: phleb.totalDays, rate: phleb.rate },
    isk: { cases: isk.totalCases, days: isk.totalDays, rate: isk.rate },
    decubitus: { cases: decub.totalCases, days: decub.totalDays, rate: decub.rate },
    vap: { cases: vap.totalCases, days: vap.totalDays, rate: vap.rate },
    ido: { cases: ido.totalCases, days: ido.totalDays, rate: ido.rate },
    peakDetail:
      highestPhleb && highestPhleb.cases > 0
        ? `kejadian Phlebitis tertinggi pada bulan ${highestPhleb.monthName} sebesar ${fmtIdNum(highestPhleb.rate)}‰ (${highestPhleb.cases} kasus dari ${highestPhleb.days} hari pemasangan alat)`
        : undefined,
  });

  const phlebNarr = buildSingleHaisNarrative({
    indicator: 'phlebitis',
    periodLabel: fullPeriodLabel,
    dimensionLabel: 'bulan',
    points: phleb.monthly.map((m) => ({ label: m.monthName, days: m.days, cases: m.cases, rate: m.rate })),
    totalDays: phleb.totalDays,
    totalCases: phleb.totalCases,
    overallRate: phleb.rate,
  });

  const iskNarr = buildSingleHaisNarrative({
    indicator: 'isk',
    periodLabel: fullPeriodLabel,
    dimensionLabel: 'bulan',
    points: isk.monthly.map((m) => ({ label: m.monthName, days: m.days, cases: m.cases, rate: m.rate })),
    totalDays: isk.totalDays,
    totalCases: isk.totalCases,
    overallRate: isk.rate,
  });

  const decubNarr = buildSingleHaisNarrative({
    indicator: 'decubitus',
    periodLabel: fullPeriodLabel,
    dimensionLabel: 'bulan',
    points: decub.monthly.map((m) => ({ label: m.monthName, days: m.days, cases: m.cases, rate: m.rate })),
    totalDays: decub.totalDays,
    totalCases: decub.totalCases,
    overallRate: decub.rate,
    customTargetNum: 1.0,
    customTargetLabel: '≤ 1‰',
  });

  const vapNarr = buildSingleHaisNarrative({
    indicator: 'vap',
    periodLabel: fullPeriodLabel,
    dimensionLabel: 'bulan',
    points: vap.monthly.map((m) => ({ label: m.monthName, days: m.days, cases: m.cases, rate: m.rate })),
    totalDays: vap.totalDays,
    totalCases: vap.totalCases,
    overallRate: vap.rate,
  });

  const idoNarr = buildSingleHaisNarrative({
    indicator: 'ido',
    periodLabel: fullPeriodLabel,
    dimensionLabel: 'bulan',
    points: ido.monthly.map((m) => ({ label: m.monthName, days: m.days, cases: m.cases, rate: m.rate })),
    totalDays: ido.totalDays,
    totalCases: ido.totalCases,
    overallRate: ido.rate,
  });

  const activeHhMonths = semMonths
    .map((m, idx) => {
      const pOpp =
        (perawatRow?.monthly[idx]?.opp ?? 0) +
        (dokterRow?.monthly[idx]?.opp ?? 0) +
        (nakesRow?.monthly[idx]?.opp ?? 0);
      const pHh =
        (perawatRow?.monthly[idx]?.hh ?? 0) +
        (dokterRow?.monthly[idx]?.hh ?? 0) +
        (nakesRow?.monthly[idx]?.hh ?? 0);
      return {
        name: m.monthName,
        opp: pOpp,
        avg: pOpp > 0 ? Number(((pHh / pOpp) * 100).toFixed(1)) : 0,
      };
    })
    .filter((m) => m.opp > 0);
  const bestHhMonth = [...activeHhMonths].sort((a, b) => b.avg - a.avg)[0];

  const hhNarr = buildHandHygieneProfessionNarrative({
    periodLabel: fullPeriodLabel,
    overallRate: sData.hhOverallRate,
    professions: [
      { name: 'Perawat/Bidan', rate: perawatRow?.rate ?? 0, opp: perawatRow?.opp ?? 0, hh: perawatRow?.hh ?? 0 },
      { name: 'Dokter', rate: dokterRow?.rate ?? 0, opp: dokterRow?.opp ?? 0, hh: dokterRow?.hh ?? 0 },
      { name: 'Nakes Lainnya', rate: nakesRow?.rate ?? 0, opp: nakesRow?.opp ?? 0, hh: nakesRow?.hh ?? 0 },
    ],
    peakMonthDetail:
      bestHhMonth && bestHhMonth.avg > 0
        ? `Berdasarkan tren bulanan, rata-rata kepatuhan tertinggi tercapai pada bulan ${bestHhMonth.name} (${fmtIdNum(bestHhMonth.avg)}%).`
        : undefined,
  });

  const apdNarr = buildApdNarrative({
    periodLabel: fullPeriodLabel,
    overallRate: sData.apdOverallRate,
    points: sData.apdMonthly.filter((m) => m.eval > 0).map((m) => ({ label: m.monthName, rate: m.rate })),
  });

  const totHhOpp = sData.hhProfessions.reduce((a, p) => a + p.opp, 0);
  const totHhAct = sData.hhProfessions.reduce((a, p) => a + p.hh, 0);

  // Flow blocks for AutoPaginatedF4Document (F4 215x330mm, 2.5cm margins, Arial 12pt)
  const blocks = useMemo<FlowBlock[]>(() => {
    const out: FlowBlock[] = [
      // ==================== BAB I PENDAHULUAN ====================
      {
        type: 'element',
        key: 's-bab1-header',
        keepWithNext: true,
        gapAfter: 16,
        node: (
          <div className="text-center font-bold text-[12pt] leading-[1.5]">
            <p>BAB I</p>
            <p>PENDAHULUAN</p>
          </div>
        ),
      },
      {
        type: 'element',
        key: 's-bab1-latar-heading',
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <div className="flex items-start font-bold">
            <span className="w-6 flex-shrink-0">1.</span>
            <span>Latar Belakang</span>
          </div>
        ),
      },
      {
        type: 'element',
        key: 's-bab1-p1',
        gapAfter: 10,
        node: (
          <p className="pl-6 indent-8 text-justify">
            Pencegahan dan Pengendalian infeksi di rumah sakit merupakan suatu upaya kegiatan untuk meminimalkan atau mencegah terjadinya infeksi pada pasien, petugas, pengunjung dan masyarakat di sekitar Rumah Sakit. Program pencegahan dan pengendalian infeksi antara lain; Pencegahan infeksi, penggunaan antibiotik secara rasional, kewaspadaan standar, surveilans, pendidikan dan pelatihan.
          </p>
        ),
      },
      {
        type: 'element',
        key: 's-bab1-p2',
        gapAfter: 10,
        node: (
          <p className="pl-6 indent-8 text-justify">
            Kegiatan surveilans infeksi di rumah sakit merupakan salah satu kegiatan yang penting dan luas dalam program pengendalian infeksi dan suatu hal yang harus dilakukan untuk mencapai keberhasilan dari Program PPI.
          </p>
        ),
      },
      {
        type: 'element',
        key: 's-bab1-p3',
        gapAfter: 10,
        node: (
          <p className="pl-6 indent-8 text-justify">
            Ditinjau dari asal atau didapatnya infeksi dapat berasal dari komunitas atau berasal dari lingkungan rumah sakit (Hospital Acquired Infection) yang sebelumnya dikenal istilah infeksi nosokomial. Karena sering kali tidak bisa secara pasti ditentukan asal infeksi, maka sekarang istilah infeksi nosokomial diganti dengan istilah baru yaitu Healthcare Associated Infections (HAIs).
          </p>
        ),
      },
      {
        type: 'element',
        key: 's-bab1-p4',
        gapAfter: 10,
        node: (
          <p className="pl-6 indent-8 text-justify">
            Healthcare Associated Infections (HAIs) merupakan kejadian infeksi yang didapatkan penderita setelah mendapatkan perawatan &gt; 48 jam dan pasien tidak dalam masa inkubasi. Macam kejadian HAIs banyak dihubungkan karena pemasangan alat, seperti CAUTI (Catheter Associated Urinary Tract Infection), VAP (Ventilator Associated Pneumonia), CRBSI (Catheter IV Central Related Blood Stream Infections) dan IDO (Infeksi Daerah Operasi) karena tindakan operasi.
          </p>
        ),
      },
      {
        type: 'element',
        key: 's-bab1-p5',
        gapAfter: 10,
        node: (
          <p className="pl-6 indent-8 text-justify">
            Pengetahuan tentang infeksi nosokomial dan pencegahannya merupakan stimulus sosial yang dapat menimbulkan respon emosional terhadap upaya universal precaution sehingga akan meningkatkan peran sertanya dalam upaya pencegahan infeksi nosokomial.
          </p>
        ),
      },
      {
        type: 'element',
        key: 's-bab1-p6',
        gapAfter: 14,
        node: (
          <p className="pl-6 indent-8 text-justify">
            Kegagalan melakukan kebersihan tangan yang baik dan benar dianggap sebagai penyebab utama infeksi nosokomial atau HAIs dan penyebaran mikroorganisme multiresisten di fasilitas pelayanan kesehatan dan telah diakui sebagai kontribusi yang penting terhadap timbulnya wabah (Boyce and Pittet, 2002). Sehingga perlu adanya audit kepatuhan pelaksanaan kewaspadaan standar yang dilakukan oleh Tim Pencegahan dan Pengendalian Infeksi di UOBK RSUD Al-Mulk Kota Sukabumi.
          </p>
        ),
      },

      // Pindahkan 2. Tujuan Umum dan Khusus ke Halaman baru secara rapi dan utuh
      { type: 'pageBreak', key: 's-break-bab1-tujuan' },
      {
        type: 'element',
        key: 's-bab1-tujuan-block',
        gapAfter: 16,
        node: (
          <div className="w-full text-justify text-[11pt] leading-[1.6]">
            <div className="flex items-start font-bold mb-2">
              <span className="w-6 flex-shrink-0">2.</span>
              <span>Tujuan Umum dan Khusus</span>
            </div>
            <div className="pl-6 mb-3">
              <div className="flex items-start font-bold mb-1">
                <span className="w-6 flex-shrink-0">a.</span>
                <span>Tujuan Umum</span>
              </div>
              <p className="pl-6 text-justify">
                Mengetahui angka kepatuhan pelaksanaan kewaspadaan standar, dan surveilans Rumah Sakit.
              </p>
            </div>
            <div className="pl-6">
              <div className="flex items-start font-bold mb-1">
                <span className="w-6 flex-shrink-0">b.</span>
                <span>Tujuan Khusus</span>
              </div>
              <div className="pl-6 space-y-1.5">
                <div className="flex items-start">
                  <span className="w-6 flex-shrink-0">1.</span>
                  <span>Mendapatkan data dasar infeksi di UOBK RSUD Al-Mulk.</span>
                </div>
                <div className="flex items-start">
                  <span className="w-6 flex-shrink-0">2.</span>
                  <span>Mengukur dan menilai keberhasilan suatu Program PPI di RSUD Al-Mulk.</span>
                </div>
                <div className="flex items-start">
                  <span className="w-6 flex-shrink-0">3.</span>
                  <span>Mengetahui permasalahan tentang kesehatan yang memerlukan penanggulangan.</span>
                </div>
              </div>
            </div>
          </div>
        ),
      },

      // ==================== BAB II LAPORAN KEGIATAN PROGRAM PPI ====================
      { type: 'pageBreak', key: 's-break-bab2' },
      {
        type: 'element',
        key: 's-bab2-header',
        keepWithNext: true,
        gapAfter: 14,
        node: (
          <div className="text-center font-bold text-[12pt] leading-[1.5]">
            <p>BAB II</p>
            <p>LAPORAN KEGIATAN PROGRAM PPI</p>
          </div>
        ),
      },
      {
        type: 'element',
        key: 's-bab2-a-h',
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <div className="flex items-start font-bold">
            <span className="w-6 flex-shrink-0">A.</span>
            <span>SURVEILANS</span>
          </div>
        ),
      },
      {
        type: 'element',
        key: 's-bab2-a-p1',
        gapAfter: 8,
        node: (
          <p className="pl-6 indent-8 text-justify">
            Surveilans infeksi Rumah Sakit adalah suatu proses yang dinamis, sistematis, terus menerus dalam pengumpulan, identifikasi, analisis dan interpretasi data kesehatan yang penting pada suatu populasi spesifik dan didiseminasikan secara berkala kepada pihak-pihak yang memerlukan untuk digunakan dalam perencanaan, penerapan, serta evaluasi suatu tindakan yang berhubungan dengan kesehatan (Kemenkes, 2011).
          </p>
        ),
      },
      {
        type: 'element',
        key: 's-bab2-a-p2',
        gapAfter: 8,
        node: (
          <div className="pl-6 space-y-2">
            <p className="indent-8 text-justify">
              Metode surveilans yang digunakan adalah Surveilans Hasil (Outcome Surveilans). Pada umumnya yang dipantau adalah kejadian Phlebitis, Infeksi Saluran Kemih (ISK), Kejadian Decubitus, IDO dan VAP.
            </p>
            <p>Angka Phlebitis yang dimasukkan ke dalam HAIs adalah grade II.</p>
          </div>
        ),
      },
      {
        type: 'element',
        key: 's-bab2-a1-h',
        keepWithNext: true,
        gapAfter: 8,
        node: (
          <div className="pl-6 flex items-start font-bold">
            <span className="w-6 flex-shrink-0">1.</span>
            <span>Angka Kejadian (Incident Rate) HAIs Semester {semRoman}</span>
          </div>
        ),
      },

      // Tabel 1 HAIs 6 Bulan
      {
        type: 'element',
        key: 's-tabel-1-hais',
        gapAfter: 14,
        node: (
          <div className="w-full">
            <TwoLineReportTitle
              line1="Tabel 1. Incident Rate HAIs di UOBK RSUD Al-Mulk"
              line2={`Semester ${semRoman} Periode ${periodRangeText}`}
              className="mb-2"
            />
            <table className="w-full border-collapse border border-black text-center text-[9.5pt] leading-[1.25] table-fixed">
              <colgroup>
                <col className="w-[15%]" />
                <col className="w-[25%]" />
                <col className="w-[8.5%]" />
                <col className="w-[8.5%]" />
                <col className="w-[8.5%]" />
                <col className="w-[8.5%]" />
                <col className="w-[8.5%]" />
                <col className="w-[8.5%]" />
                <col className="w-[9%]" />
              </colgroup>
              <thead>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-1.5 w-[15%]" rowSpan={2}>JENIS INFEKSI</th>
                  <th className="border border-black py-1 px-1.5 w-[25%]" rowSpan={2}>ALAT INVASIF</th>
                  <th className="border border-black py-1 px-1.5 w-[51%]" colSpan={6}>BULAN</th>
                  <th className="border border-black py-1 px-1.5 w-[9%]" rowSpan={2}>TOTAL</th>
                </tr>
                <tr className="font-bold bg-slate-50">
                  {semMonths.map((m) => (
                    <th key={m.monthIndex} className="border border-black py-1 px-1 w-[8.5%]">{m.shortName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* PHLEBITIS */}
                <tr>
                  <td className="border border-black py-0.5 px-1 font-bold text-left align-middle" rowSpan={3}>PHLEBITIS</td>
                  <td className="border border-black py-0.5 px-1 text-left whitespace-nowrap">Total hari pemasangan</td>
                  {phleb.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-0.5 px-1 whitespace-nowrap">{m.days}</td>
                  ))}
                  <td className="border border-black py-0.5 px-1 font-semibold whitespace-nowrap">{phleb.totalDays}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1 text-left whitespace-nowrap">Infeksi</td>
                  {phleb.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-0.5 px-1 whitespace-nowrap">{m.cases}</td>
                  ))}
                  <td className="border border-black py-0.5 px-1 font-semibold whitespace-nowrap">{phleb.totalCases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1 text-left whitespace-nowrap">Rate In ‰</td>
                  {phleb.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-0.5 px-1 whitespace-nowrap">{fmtIdNum(m.rate)} ‰</td>
                  ))}
                  <td className="border border-black py-0.5 px-1 font-bold whitespace-nowrap">{fmtIdNum(phleb.rate)} ‰</td>
                </tr>

                {/* ISK */}
                <tr>
                  <td className="border border-black py-0.5 px-1 font-bold text-left align-middle" rowSpan={3}>ISK</td>
                  <td className="border border-black py-0.5 px-1 text-left whitespace-nowrap">Total hari pemasangan</td>
                  {isk.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-0.5 px-1 whitespace-nowrap">{m.days}</td>
                  ))}
                  <td className="border border-black py-0.5 px-1 font-semibold whitespace-nowrap">{isk.totalDays}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1 text-left whitespace-nowrap">Infeksi</td>
                  {isk.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-0.5 px-1 whitespace-nowrap">{m.cases}</td>
                  ))}
                  <td className="border border-black py-0.5 px-1 font-semibold whitespace-nowrap">{isk.totalCases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1 text-left whitespace-nowrap">Rate In ‰</td>
                  {isk.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-0.5 px-1 whitespace-nowrap">{fmtIdNum(m.rate)} ‰</td>
                  ))}
                  <td className="border border-black py-0.5 px-1 font-bold whitespace-nowrap">{fmtIdNum(isk.rate)} ‰</td>
                </tr>

                {/* DECUBITUS */}
                <tr>
                  <td className="border border-black py-0.5 px-1 font-bold text-left align-middle" rowSpan={3}>Decubitus</td>
                  <td className="border border-black py-0.5 px-1 text-left whitespace-nowrap">Total hari tirah baring</td>
                  {decub.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-0.5 px-1 whitespace-nowrap">{m.days}</td>
                  ))}
                  <td className="border border-black py-0.5 px-1 font-semibold whitespace-nowrap">{decub.totalDays}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1 text-left whitespace-nowrap">Infeksi</td>
                  {decub.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-0.5 px-1 whitespace-nowrap">{m.cases}</td>
                  ))}
                  <td className="border border-black py-0.5 px-1 font-semibold whitespace-nowrap">{decub.totalCases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1 text-left whitespace-nowrap">Rate In ‰</td>
                  {decub.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-0.5 px-1 whitespace-nowrap">{fmtIdNum(m.rate)} ‰</td>
                  ))}
                  <td className="border border-black py-0.5 px-1 font-bold whitespace-nowrap">{fmtIdNum(decub.rate)} ‰</td>
                </tr>

                {/* VAP */}
                <tr>
                  <td className="border border-black py-0.5 px-1 font-bold text-left align-middle" rowSpan={3}>VAP</td>
                  <td className="border border-black py-0.5 px-1 text-left whitespace-nowrap">Total hari pemasangan</td>
                  {vap.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-0.5 px-1 whitespace-nowrap">{m.days}</td>
                  ))}
                  <td className="border border-black py-0.5 px-1 font-semibold whitespace-nowrap">{vap.totalDays}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1 text-left whitespace-nowrap">Infeksi</td>
                  {vap.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-0.5 px-1 whitespace-nowrap">{m.cases}</td>
                  ))}
                  <td className="border border-black py-0.5 px-1 font-semibold whitespace-nowrap">{vap.totalCases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1 text-left whitespace-nowrap">Rate In ‰</td>
                  {vap.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-0.5 px-1 whitespace-nowrap">{fmtIdNum(m.rate)} ‰</td>
                  ))}
                  <td className="border border-black py-0.5 px-1 font-bold whitespace-nowrap">{fmtIdNum(vap.rate)} ‰</td>
                </tr>

                {/* IDO */}
                <tr>
                  <td className="border border-black py-0.5 px-1 font-bold text-left align-middle" rowSpan={4}>IDO</td>
                  <td className="border border-black py-0.5 px-1 text-center font-bold bg-slate-50" colSpan={8}>
                    TINDAKAN OPERASI DI IBS
                  </td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1 text-left whitespace-nowrap">Total Operasi</td>
                  {ido.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-0.5 px-1 whitespace-nowrap">{m.days}</td>
                  ))}
                  <td className="border border-black py-0.5 px-1 font-semibold whitespace-nowrap">{ido.totalDays}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1 text-left whitespace-nowrap">Infeksi</td>
                  {ido.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-0.5 px-1 whitespace-nowrap">{m.cases}</td>
                  ))}
                  <td className="border border-black py-0.5 px-1 font-semibold whitespace-nowrap">{ido.totalCases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1 text-left whitespace-nowrap">Rate In %</td>
                  {ido.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-0.5 px-1 whitespace-nowrap">{fmtIdNum(m.rate)} %</td>
                  ))}
                  <td className="border border-black py-0.5 px-1 font-bold whitespace-nowrap">{fmtIdNum(ido.rate)} %</td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },

      // Grafik 1 HAIs + Analisa, Rekomendasi, RTL
      {
        type: 'element',
        key: 's-grafik-1-hais',
        gapAfter: 10,
        node: (
          <div className="w-full">
            <TwoLineReportTitle
              line1="Grafik 1. Incident Rate HAIs di UOBK RSUD Al-Mulk"
              line2={`Semester ${semRoman} Periode ${periodRangeText}`}
              className="mb-1.5"
            />
            <WordStyleGroupedBarChart
              categories={['Phlebitis', 'ISK', 'Decubitus', 'VAP', 'IDO']}
              series={semMonths.map((m, idx) => ({
                name: chartMonthLabels[idx],
                color: SEMESTER_MONTH_COLORS[idx % SEMESTER_MONTH_COLORS.length],
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
      },
      ...narrativeToFlowBlocks('s-narr-hais-overview', haisOverviewNarr),

      // ==================== 2. PHLEBITIS ====================
      {
        type: 'element',
        key: 's-phleb-h',
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <div className="w-full">
            <div className="flex items-start font-bold mb-1">
              <span className="w-6 flex-shrink-0">2.</span>
              <span>Angka Kejadian (Incidence Rate) Phlebitis</span>
            </div>
            <p className="pl-6 text-justify">
              Angka Kejadian (Incidence Rate) Phlebitis per 1000 hari pemakaian intra vascular line (‰) pada bulan {periodRangeText}, berdasarkan Visual Infusion Phlebitis Score (VIPS) score ≥ 2.
            </p>
          </div>
        ),
      },
      {
        type: 'element',
        key: 's-grafik-2-phleb',
        gapAfter: 10,
        node: (
          <div className="w-full">
            <TwoLineReportTitle
              line1="Grafik 2. Incidence Rate Phlebitis di UOBK RSUD Al-Mulk"
              line2={`Semester ${semRoman} Periode ${periodRangeText}`}
              className="mb-1.5"
            />
            <WordStyleLineChart
              categories={chartMonthLabels}
              series={[
                {
                  name: 'Phlebitis',
                  color: '#4f81bd',
                  values: phleb.monthly.map((m) => m.cases),
                },
                {
                  name: '‰',
                  color: '#ed7d31',
                  values: phleb.monthly.map((m) => m.rate),
                },
                {
                  name: 'Target',
                  color: '#a5a5a5',
                  values: semMonths.map(() => 1.0),
                },
              ]}
              height={135}
            />
          </div>
        ),
      },
      ...narrativeToFlowBlocks('s-narr-phleb', phlebNarr),
      {
        type: 'element',
        key: 's-tabel-2-phleb',
        gapAfter: 16,
        node: (
          <div className="w-full">
            <TwoLineReportTitle
              line1="Tabel 2. Incidence Rate Phlebitis di UOBK RSUD Al-Mulk"
              line2={`Semester ${semRoman} Periode ${periodRangeText}`}
              className="mb-2"
            />
            <table className="w-full border-collapse border border-black text-center text-[10pt] leading-[1.3] table-fixed">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2 w-[24%]" rowSpan={2}>INDIKATOR</th>
                  <th className="border border-black py-1 px-2 w-[66%]" colSpan={6}>BULAN</th>
                  <th className="border border-black py-1 px-2 w-[10%]" rowSpan={2}>TOTAL</th>
                </tr>
                <tr className="font-bold bg-slate-50">
                  {semMonths.map((m) => (
                    <th key={m.monthIndex} className="border border-black py-1 px-2 w-[11%]">{m.shortName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Hari terpasang alat</td>
                  {phleb.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">{m.days}</td>
                  ))}
                  <td className="border border-black py-1 px-2 font-semibold whitespace-nowrap">{phleb.totalDays}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Phlebitis</td>
                  {phleb.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">{m.cases}</td>
                  ))}
                  <td className="border border-black py-1 px-2 font-semibold whitespace-nowrap">{phleb.totalCases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left whitespace-nowrap">Rate In (‰)</td>
                  {phleb.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">{fmtIdNum(m.rate)} ‰</td>
                  ))}
                  <td className="border border-black py-1 px-2 font-bold whitespace-nowrap">{fmtIdNum(phleb.rate)} ‰</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left whitespace-nowrap">Target</td>
                  {semMonths.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">≤ 1‰</td>
                  ))}
                  <td className="border border-black py-1 px-2 whitespace-nowrap">≤ 1‰</td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },

      // ==================== 3. ISK ====================
      {
        type: 'element',
        key: 's-isk-h',
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <div className="w-full">
            <div className="flex items-start font-bold mb-1">
              <span className="w-6 flex-shrink-0">3.</span>
              <span>Angka Kejadian (Incidence Rate) Infeksi Saluran Kemih (ISK)</span>
            </div>
            <p className="pl-6 text-justify">
              Angka Kejadian (Incidence Rate) Infeksi Saluran Kemih (ISK) per 1000 hari pemakaian kateter urine menetap (‰) pada bulan {periodRangeText}.
            </p>
          </div>
        ),
      },
      {
        type: 'element',
        key: 's-grafik-3-isk',
        gapAfter: 10,
        node: (
          <div className="w-full">
            <TwoLineReportTitle
              line1="Grafik 3. Incidence Rate ISK di UOBK RSUD Al-Mulk"
              line2={`Semester ${semRoman} Periode ${periodRangeText}`}
              className="mb-1.5"
            />
            <WordStyleLineChart
              categories={chartMonthLabels}
              series={[
                {
                  name: 'ISK',
                  color: '#4f81bd',
                  values: isk.monthly.map((m) => m.cases),
                },
                {
                  name: '‰',
                  color: '#ed7d31',
                  values: isk.monthly.map((m) => m.rate),
                },
                {
                  name: 'Target',
                  color: '#a5a5a5',
                  values: semMonths.map(() => 4.7),
                },
              ]}
              height={135}
            />
          </div>
        ),
      },
      ...narrativeToFlowBlocks('s-narr-isk', iskNarr),
      {
        type: 'element',
        key: 's-tabel-3-isk',
        gapAfter: 16,
        node: (
          <div className="w-full">
            <TwoLineReportTitle
              line1="Tabel 3. Incidence Rate ISK di UOBK RSUD Al-Mulk"
              line2={`Semester ${semRoman} Periode ${periodRangeText}`}
              className="mb-2"
            />
            <table className="w-full border-collapse border border-black text-center text-[10pt] leading-[1.3] table-fixed">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2 w-[24%]" rowSpan={2}>INDIKATOR</th>
                  <th className="border border-black py-1 px-2 w-[66%]" colSpan={6}>BULAN</th>
                  <th className="border border-black py-1 px-2 w-[10%]" rowSpan={2}>TOTAL</th>
                </tr>
                <tr className="font-bold bg-slate-50">
                  {semMonths.map((m) => (
                    <th key={m.monthIndex} className="border border-black py-1 px-2 w-[11%]">{m.shortName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Hari terpasang alat</td>
                  {isk.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">{m.days}</td>
                  ))}
                  <td className="border border-black py-1 px-2 font-semibold whitespace-nowrap">{isk.totalDays}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Infeksi ISK</td>
                  {isk.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">{m.cases}</td>
                  ))}
                  <td className="border border-black py-1 px-2 font-semibold whitespace-nowrap">{isk.totalCases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left whitespace-nowrap">Rate In (‰)</td>
                  {isk.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">{fmtIdNum(m.rate)} ‰</td>
                  ))}
                  <td className="border border-black py-1 px-2 font-bold whitespace-nowrap">{fmtIdNum(isk.rate)} ‰</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left whitespace-nowrap">Target</td>
                  {semMonths.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">≤ 4,7‰</td>
                  ))}
                  <td className="border border-black py-1 px-2 whitespace-nowrap">≤ 4,7‰</td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },

      // ==================== 4. DECUBITUS ====================
      {
        type: 'element',
        key: 's-decub-h',
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <div className="w-full">
            <div className="flex items-start font-bold mb-1">
              <span className="w-6 flex-shrink-0">4.</span>
              <span>Angka Kejadian (Incidence Rate) Decubitus</span>
            </div>
            <p className="pl-6 text-justify">
              Angka Kejadian (Incidence Rate) Decubitus per 1000 hari tirah baring (‰) pada bulan {periodRangeText}.
            </p>
          </div>
        ),
      },
      {
        type: 'element',
        key: 's-grafik-4-decub',
        gapAfter: 10,
        node: (
          <div className="w-full">
            <TwoLineReportTitle
              line1="Grafik 4. Infeksi Decubitus per 1000 Hari Tirah Baring (‰) di UOBK RSUD Al-Mulk"
              line2={`Semester ${semRoman} Periode ${periodRangeText}`}
              className="mb-1.5"
            />
            <WordStyleLineChart
              categories={chartMonthLabels}
              series={[
                {
                  name: 'Decubitus',
                  color: '#4f81bd',
                  values: decub.monthly.map((m) => m.cases),
                },
                {
                  name: '‰',
                  color: '#ed7d31',
                  values: decub.monthly.map((m) => m.rate),
                },
                {
                  name: 'Target',
                  color: '#a5a5a5',
                  values: semMonths.map(() => 1.5),
                },
              ]}
              height={135}
            />
          </div>
        ),
      },
      ...narrativeToFlowBlocks('s-narr-decub', decubNarr),
      {
        type: 'element',
        key: 's-tabel-4-decub',
        gapAfter: 16,
        node: (
          <div className="w-full">
            <TwoLineReportTitle
              line1="Tabel 4. Infeksi Decubitus per 1000 Hari Tirah Baring (‰) di UOBK RSUD Al-Mulk"
              line2={`Semester ${semRoman} Periode ${periodRangeText}`}
              className="mb-2"
            />
            <table className="w-full border-collapse border border-black text-center text-[10pt] leading-[1.3] table-fixed">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2 w-[24%]" rowSpan={2}>INDIKATOR</th>
                  <th className="border border-black py-1 px-2 w-[66%]" colSpan={6}>BULAN</th>
                  <th className="border border-black py-1 px-2 w-[10%]" rowSpan={2}>TOTAL</th>
                </tr>
                <tr className="font-bold bg-slate-50">
                  {semMonths.map((m) => (
                    <th key={m.monthIndex} className="border border-black py-1 px-2 w-[11%]">{m.shortName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Tirah baring</td>
                  {decub.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">{m.days}</td>
                  ))}
                  <td className="border border-black py-1 px-2 font-semibold whitespace-nowrap">{decub.totalDays}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Infeksi Decubitus</td>
                  {decub.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">{m.cases}</td>
                  ))}
                  <td className="border border-black py-1 px-2 font-semibold whitespace-nowrap">{decub.totalCases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left whitespace-nowrap">Rate In (‰)</td>
                  {decub.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">{fmtIdNum(m.rate)} ‰</td>
                  ))}
                  <td className="border border-black py-1 px-2 font-bold whitespace-nowrap">{fmtIdNum(decub.rate)} ‰</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left whitespace-nowrap">Target</td>
                  {semMonths.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">≤ 1,5‰</td>
                  ))}
                  <td className="border border-black py-1 px-2 whitespace-nowrap">≤ 1,5‰</td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },

      // ==================== 5. VAP ====================
      {
        type: 'element',
        key: 's-vap-h',
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <div className="w-full">
            <div className="flex items-start font-bold mb-1">
              <span className="w-6 flex-shrink-0">5.</span>
              <span>Angka Kejadian (Incidence Rate) Ventilator Associated Pneumonia (VAP)</span>
            </div>
            <p className="pl-6 text-justify">
              Angka Kejadian (Incidence Rate) Ventilator Associated Pneumonia (VAP) per 1000 hari pemakaian ventilator (‰) pada bulan {periodRangeText}.
            </p>
          </div>
        ),
      },
      {
        type: 'element',
        key: 's-grafik-5-vap',
        gapAfter: 10,
        node: (
          <div className="w-full">
            <TwoLineReportTitle
              line1="Grafik 5. Incident Rate Ventilator Associated Pneumonia (VAP) di UOBK RSUD Al-Mulk"
              line2={`Semester ${semRoman} Periode ${periodRangeText}`}
              className="mb-1.5"
            />
            <WordStyleLineChart
              categories={chartMonthLabels}
              series={[
                {
                  name: 'VAP',
                  color: '#4f81bd',
                  values: vap.monthly.map((m) => m.cases),
                },
                {
                  name: '‰',
                  color: '#ed7d31',
                  values: vap.monthly.map((m) => m.rate),
                },
                {
                  name: 'Target',
                  color: '#a5a5a5',
                  values: semMonths.map(() => 5.8),
                },
              ]}
              height={135}
            />
          </div>
        ),
      },
      ...narrativeToFlowBlocks('s-narr-vap', vapNarr),
      {
        type: 'element',
        key: 's-tabel-5-vap',
        gapAfter: 16,
        node: (
          <div className="w-full">
            <TwoLineReportTitle
              line1="Tabel 5. Incident Rate Ventilator Associated Pneumonia (VAP) di UOBK RSUD Al-Mulk"
              line2={`Semester ${semRoman} Periode ${periodRangeText}`}
              className="mb-2"
            />
            <table className="w-full border-collapse border border-black text-center text-[10pt] leading-[1.3] table-fixed">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2 w-[24%]" rowSpan={2}>INDIKATOR</th>
                  <th className="border border-black py-1 px-2 w-[66%]" colSpan={6}>BULAN</th>
                  <th className="border border-black py-1 px-2 w-[10%]" rowSpan={2}>TOTAL</th>
                </tr>
                <tr className="font-bold bg-slate-50">
                  {semMonths.map((m) => (
                    <th key={m.monthIndex} className="border border-black py-1 px-2 w-[11%]">{m.shortName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Hari terpasang ventilator</td>
                  {vap.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">{m.days}</td>
                  ))}
                  <td className="border border-black py-1 px-2 font-semibold whitespace-nowrap">{vap.totalDays}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Infeksi VAP</td>
                  {vap.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">{m.cases}</td>
                  ))}
                  <td className="border border-black py-1 px-2 font-semibold whitespace-nowrap">{vap.totalCases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left whitespace-nowrap">Rate In (‰)</td>
                  {vap.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">{fmtIdNum(m.rate)} ‰</td>
                  ))}
                  <td className="border border-black py-1 px-2 font-bold whitespace-nowrap">{fmtIdNum(vap.rate)} ‰</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left whitespace-nowrap">Target</td>
                  {semMonths.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">≤ 5,8‰</td>
                  ))}
                  <td className="border border-black py-1 px-2 whitespace-nowrap">≤ 5,8‰</td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },

      // ==================== 6. IDO ====================
      {
        type: 'element',
        key: 's-ido-h',
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <div className="w-full">
            <div className="flex items-start font-bold mb-1">
              <span className="w-6 flex-shrink-0">6.</span>
              <span>Angka Kejadian (Incidence Rate) Infeksi Daerah Operasi (IDO)</span>
            </div>
            <p className="pl-6 text-justify">
              Angka Kejadian (Incidence Rate) Infeksi Daerah Operasi (IDO) (%) pada bulan {periodRangeText}.
            </p>
          </div>
        ),
      },
      {
        type: 'element',
        key: 's-grafik-6-ido',
        gapAfter: 10,
        node: (
          <div className="w-full">
            <TwoLineReportTitle
              line1="Grafik 6. Infeksi Daerah Operasi di UOBK RSUD Al-Mulk"
              line2={`Semester ${semRoman} Periode ${periodRangeText}`}
              className="mb-1.5"
            />
            <WordStyleLineChart
              categories={chartMonthLabels}
              series={[
                {
                  name: 'IDO',
                  color: '#4f81bd',
                  values: ido.monthly.map((m) => m.cases),
                },
                {
                  name: '%',
                  color: '#ed7d31',
                  values: ido.monthly.map((m) => m.rate),
                },
                {
                  name: 'Target',
                  color: '#a5a5a5',
                  values: semMonths.map(() => 2.0),
                },
              ]}
              height={135}
            />
          </div>
        ),
      },
      ...narrativeToFlowBlocks('s-narr-ido', idoNarr),
      {
        type: 'element',
        key: 's-tabel-6-ido',
        gapAfter: 16,
        node: (
          <div className="w-full">
            <TwoLineReportTitle
              line1="Tabel 6. Infeksi Daerah Operasi di UOBK RSUD Al-Mulk"
              line2={`Semester ${semRoman} Periode ${periodRangeText}`}
              className="mb-2"
            />
            <table className="w-full border-collapse border border-black text-center text-[10pt] leading-[1.3] table-fixed">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2 w-[24%]" rowSpan={2}>INDIKATOR</th>
                  <th className="border border-black py-1 px-2 w-[66%]" colSpan={6}>BULAN</th>
                  <th className="border border-black py-1 px-2 w-[10%]" rowSpan={2}>TOTAL</th>
                </tr>
                <tr className="font-bold bg-slate-50">
                  {semMonths.map((m) => (
                    <th key={m.monthIndex} className="border border-black py-1 px-2 w-[11%]">{m.shortName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Jumlah pasien dioperasi</td>
                  {ido.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">{m.days}</td>
                  ))}
                  <td className="border border-black py-1 px-2 font-semibold whitespace-nowrap">{ido.totalDays}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Infeksi IDO</td>
                  {ido.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">{m.cases}</td>
                  ))}
                  <td className="border border-black py-1 px-2 font-semibold whitespace-nowrap">{ido.totalCases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left whitespace-nowrap">Rate In (%)</td>
                  {ido.monthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">{fmtIdNum(m.rate)} %</td>
                  ))}
                  <td className="border border-black py-1 px-2 font-bold whitespace-nowrap">{fmtIdNum(ido.rate)} %</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left whitespace-nowrap">Target</td>
                  {semMonths.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">≤ 2%</td>
                  ))}
                  <td className="border border-black py-1 px-2 whitespace-nowrap">≤ 2%</td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },

      // ==================== B. AUDIT HAND HYGIENE DAN APD ====================
      {
        type: 'element',
        key: 's-bab2-b-h',
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <div className="w-full">
            <div className="flex items-start font-bold mb-1">
              <span className="w-6 flex-shrink-0">B.</span>
              <span>AUDIT HAND HYGIENE DAN APD</span>
            </div>
            <div className="flex items-start font-bold pl-6">
              <span className="w-6 flex-shrink-0">1.</span>
              <span>Kepatuhan Kebersihan Tangan / Hand Hygiene</span>
            </div>
          </div>
        ),
      },
      {
        type: 'element',
        key: 's-grafik-hh',
        gapAfter: 10,
        node: (
          <div className="w-full">
            <TwoLineReportTitle
              line1="Grafik 1. Kepatuhan Hand Hygiene Berdasarkan Profesi di UOBK RSUD Al-Mulk"
              line2={`Semester ${semRoman} Periode ${periodRangeText}`}
              className="mb-1.5"
            />
            <WordStyleGroupedBarChart
              categories={chartMonthLabels}
              series={[
                {
                  name: 'Perawat/Bidan',
                  color: '#4f81bd',
                  values: perawatRow.monthly.map((m) => m.rate),
                },
                {
                  name: 'Dokter',
                  color: '#ed7d31',
                  values: dokterRow.monthly.map((m) => m.rate),
                },
                {
                  name: 'Nakes lainnya',
                  color: '#a5a5a5',
                  values: nakesRow.monthly.map((m) => m.rate),
                },
              ]}
              maxY={100}
              ySteps={5}
              unit="%"
              height={155}
              xAxisSubLabel="Profesi"
            />
          </div>
        ),
      },
      ...narrativeToFlowBlocks('s-narr-hh', hhNarr),
      {
        type: 'element',
        key: 's-tabel-hh',
        gapAfter: 16,
        node: (
          <div className="w-full">
            <TwoLineReportTitle
              line1="Tabel 1. Kepatuhan Hand Hygiene Berdasarkan Profesi di UOBK RSUD Al-Mulk"
              line2={`Semester ${semRoman} Periode ${periodRangeText}`}
              className="mb-2"
            />
            <table className="w-full border-collapse border border-black text-center text-[10pt] leading-[1.3] table-fixed">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2 w-[24%]" rowSpan={2}>Profesi</th>
                  <th className="border border-black py-1 px-2 w-[66%]" colSpan={6}>Capaian Bulanan (%)</th>
                  <th className="border border-black py-1 px-2 w-[10%]" rowSpan={2}>Rata-rata</th>
                </tr>
                <tr className="font-bold bg-slate-50">
                  {semMonths.map((m) => (
                    <th key={m.monthIndex} className="border border-black py-1 px-1 w-[11%]">{m.shortName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sData.hhProfessions.map((p) => (
                  <tr key={p.profession}>
                    <td className="border border-black py-1 px-2 text-left font-medium">{p.profession}</td>
                    {p.monthly.map((m, i) => (
                      <td key={i} className="border border-black py-1 px-1 whitespace-nowrap">{fmtIdNum(m.rate)}%</td>
                    ))}
                    <td className="border border-black py-1 px-1 font-bold whitespace-nowrap">{fmtIdNum(p.rate)}%</td>
                  </tr>
                ))}
                <tr className="font-bold bg-slate-50">
                  <td className="border border-black py-1 px-2 text-left">Total / Rata-rata RS</td>
                  <td className="border border-black py-1 px-1" colSpan={6}>
                    {totHhAct} patuh dari {totHhOpp} peluang (Target ≥ 85%)
                  </td>
                  <td className="border border-black py-1 px-1 whitespace-nowrap">{fmtIdNum(sData.hhOverallRate)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },

      // 2. Kepatuhan Penggunaan APD
      {
        type: 'element',
        key: 's-apd-h',
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <div className="flex items-start font-bold pl-6">
            <span className="w-6 flex-shrink-0">2.</span>
            <span>Kepatuhan Penggunaan Alat Pelindung Diri (APD)</span>
          </div>
        ),
      },
      {
        type: 'element',
        key: 's-grafik-apd',
        gapAfter: 10,
        node: (
          <div className="w-full">
            <TwoLineReportTitle
              line1="Grafik 2. Kepatuhan Penggunaan APD di UOBK RSUD Al-Mulk"
              line2={`Semester ${semRoman} Periode ${periodRangeText}`}
              className="mb-1.5"
            />
            <WordStyleGroupedBarChart
              categories={chartMonthLabels}
              series={[
                {
                  name: 'Capaian',
                  color: '#4f81bd',
                  values: sData.apdMonthly.map((m) => m.rate),
                },
                {
                  name: 'Target',
                  color: '#ed7d31',
                  values: semMonths.map(() => 100),
                },
              ]}
              maxY={100}
              ySteps={5}
              unit="%"
              height={150}
            />
          </div>
        ),
      },
      ...narrativeToFlowBlocks('s-narr-apd', apdNarr),
      {
        type: 'element',
        key: 's-tabel-apd',
        gapAfter: 16,
        node: (
          <div className="w-full">
            <TwoLineReportTitle
              line1="Tabel 2. Kepatuhan Penggunaan APD di UOBK RSUD Al-Mulk"
              line2={`Semester ${semRoman} Periode ${periodRangeText}`}
              className="mb-2"
            />
            <table className="w-full border-collapse border border-black text-center text-[10.5pt] leading-[1.3] table-fixed">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2 w-[24%]" rowSpan={2}>INDIKATOR</th>
                  <th className="border border-black py-1 px-2 w-[66%]" colSpan={6}>BULAN</th>
                  <th className="border border-black py-1 px-2 w-[10%]" rowSpan={2}>RATA-RATA</th>
                </tr>
                <tr className="font-bold bg-slate-50">
                  {semMonths.map((m) => (
                    <th key={m.monthIndex} className="border border-black py-1 px-2 w-[11%]">{m.shortName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-1 px-2 text-left font-medium">Capaian Kepatuhan APD</td>
                  {sData.apdMonthly.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">{fmtIdNum(m.rate)}%</td>
                  ))}
                  <td className="border border-black py-1 px-2 font-bold whitespace-nowrap">{fmtIdNum(sData.apdOverallRate)}%</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left font-medium">Target Standar Kemenkes</td>
                  {semMonths.map((m) => (
                    <td key={m.monthIndex} className="border border-black py-1 px-2 whitespace-nowrap">100%</td>
                  ))}
                  <td className="border border-black py-1 px-2 font-semibold whitespace-nowrap">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },

      // ==================== C. KESIMPULAN & PENGESAHAN ====================
      {
        type: 'element',
        key: 's-bab2-c-h',
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <div className="flex items-start font-bold">
            <span className="w-6 flex-shrink-0">C.</span>
            <span>KESIMPULAN DAN KOORDINASI TINDAK LANJUT</span>
          </div>
        ),
      },
      {
        type: 'element',
        key: 's-bab2-c-body',
        gapAfter: 18,
        node: (
          <div className="pl-6 space-y-2 text-justify">
            <p className="indent-8">
              Pelaksanaan program Pencegahan dan Pengendalian Infeksi (PPI) pada {fullPeriodLabel} di UOBK RSUD Al-Mulk Kota Sukabumi secara umum telah berjalan berkesinambungan. Indikator surveilans ISK ({fmtIdNum(isk.rate)}‰), Decubitus ({fmtIdNum(decub.rate)}‰), VAP ({fmtIdNum(vap.rate)}‰), dan IDO ({fmtIdNum(ido.rate)}%) terkendali sesuai standar nasional, sedangkan pengendalian Phlebitis ({fmtIdNum(phleb.rate)}‰), penguatan kepatuhan Hand Hygiene ({fmtIdNum(sData.hhOverallRate)}%), dan konsistensi penggunaan APD ({fmtIdNum(sData.apdOverallRate)}%) menjadi fokus supervisi perbaikan berkelanjutan pada semester berikutnya.
            </p>
            <p className="indent-8">
              Hasil surveilans HAIs dan audit kewaspadaan standar ini disampaikan kepada Direktur UOBK RSUD Al-Mulk Kota Sukabumi, Ketua Komite Mutu, serta dikoordinasikan bersama seluruh Kepala Instalasi dan Kepala Ruang sebagai dasar evaluasi mutu pelayanan.
            </p>
          </div>
        ),
      },
      {
        type: 'element',
        key: 's-signature-block',
        gapAfter: 0,
        node: (
          <div className="w-full pt-4 signature-block" data-pdf-block="signature">
            <p className="text-right text-[12pt] mb-6">
              Sukabumi, 10 {signMonthName} {signYear}
            </p>
            <table className="w-full border-none text-[12pt] leading-[1.4]">
              <tbody>
                <tr className="text-center">
                  <td className="w-1/2 align-top pb-20">Penyusun,</td>
                  <td className="w-1/2 align-top pb-20">Mengetahui,</td>
                </tr>
                <tr className="text-center">
                  <td className="align-bottom">
                    <p className="underline font-bold">Adi Tresa Purnama, A.M.Kep</p>
                    <p>Infection Prevention Control Nurse</p>
                  </td>
                  <td className="align-bottom">
                    <p className="underline font-bold">dr. Nurul Iman</p>
                    <p>Ketua PPI</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },
    ];

    return out;
  }, [
    sData,
    semRoman,
    periodRangeText,
    fullPeriodLabel,
    signMonthName,
    signYear,
    phleb,
    isk,
    decub,
    vap,
    ido,
    semMonths,
    chartMonthLabels,
    perawatRow,
    dokterRow,
    nakesRow,
    totHhAct,
    totHhOpp,
    haisOverviewNarr,
    phlebNarr,
    iskNarr,
    decubNarr,
    vapNarr,
    idoNarr,
    hhNarr,
    apdNarr,
  ]);

  return (
    <AutoPaginatedF4Document
      id="print-area-semester"
      numberingMode="inclusive"
      coverPage={
        <ReportCover
          reportType="semester"
          title={`LAPORAN SEMESTER ${semRoman} ${reportYear}`}
          subtitle="PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)"
          year={String(reportYear)}
        />
      }
      blocks={blocks}
    />
  );
}

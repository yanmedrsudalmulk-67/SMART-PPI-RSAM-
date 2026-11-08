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

interface QuarterlyReportProps {
  reportData?: OfficialReportData;
  quarter?: number;
  year?: number;
}

interface GroupedBarSeries {
  name: string;
  color: string;
  values: number[];
  formattedValues?: string[];
}

export function WordStyleGroupedBarChart({
  categories,
  series,
  maxY,
  ySteps = 5,
  unit = '',
  height = 155,
  xAxisSubLabel,
}: {
  categories: string[];
  series: GroupedBarSeries[];
  maxY?: number;
  ySteps?: number;
  unit?: string;
  height?: number;
  xAxisSubLabel?: string;
}) {
  const allVals = series.flatMap((s) => s.values);
  const rawMax = Math.max(...allVals, 1);
  const computedMax = maxY !== undefined ? maxY : Math.ceil(rawMax * 1.15);
  const ticks = Array.from({ length: ySteps + 1 }, (_, i) =>
    Number(((computedMax / ySteps) * i).toFixed(1))
  );

  return (
    <div
      className="w-full border border-slate-300 bg-white px-4 pt-3 pb-2 my-1 select-none"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      <div className="w-full flex items-stretch" style={{ height: `${height}px` }}>
        {/* Y-Axis */}
        <div className="flex flex-col-reverse justify-between pr-2 text-right text-[9pt] text-slate-700 pb-6 flex-shrink-0">
          {ticks.map((t, idx) => (
            <span key={idx} className="leading-none">
              {fmtIdNum(t)}
              {unit}
            </span>
          ))}
        </div>

        {/* Plot Area */}
        <div className="relative flex-1 flex flex-col justify-between">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col-reverse justify-between pointer-events-none pb-6">
            {ticks.map((_, idx) => (
              <div
                key={idx}
                className={`w-full ${
                  idx === 0 ? 'border-b border-slate-400' : 'border-b border-slate-200'
                }`}
                style={{ height: '0px' }}
              />
            ))}
          </div>

          {/* Grouped Bars */}
          <div className="relative w-full h-full flex items-end justify-around px-2 z-10 pb-6">
            {categories.map((cat, cIdx) => (
              <div
                key={cat}
                className="flex-1 flex flex-col items-center justify-end h-full px-1"
              >
                <div className="w-full h-full flex items-end justify-center gap-1.5">
                  {series.map((s) => {
                    const v = s.values[cIdx] ?? 0;
                    const pct = computedMax > 0 ? Math.min(Math.max((v / computedMax) * 100, 0), 100) : 0;
                    const label = s.formattedValues?.[cIdx] ?? `${fmtIdNum(v)}${unit}`;
                    return (
                      <div
                        key={s.name}
                        className="flex flex-col items-center justify-end h-full flex-1 max-w-[26px]"
                      >
                        <span className="text-[8pt] font-bold text-slate-800 mb-0.5 leading-none whitespace-nowrap">
                          {label}
                        </span>
                        <div
                          className="w-full rounded-t-[1px]"
                          style={{
                            height: `${Math.max(pct, 1.5)}%`,
                            backgroundColor: s.color,
                            minHeight: v > 0 ? '4px' : '2px',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="absolute bottom-0 transform translate-y-0 text-center">
                  <span className="text-[9pt] text-slate-800 block leading-tight">
                    {cat}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {xAxisSubLabel && (
        <div className="text-center text-[9pt] text-slate-700 mt-0.5">{xAxisSubLabel}</div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-1.5 pt-1">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5 text-[9pt] text-slate-800">
            <span
              className="inline-block w-3 h-3 rounded-[1px]"
              style={{ backgroundColor: s.color }}
            />
            <span>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LineSeriesItem {
  name: string;
  color: string;
  values: number[];
}

export function WordStyleLineChart({
  categories,
  series,
  maxY,
  height = 135,
  xAxisTitle = 'Bulan',
}: {
  categories: string[];
  series: LineSeriesItem[];
  maxY?: number;
  height?: number;
  xAxisTitle?: string;
}) {
  const allVals = series.flatMap((s) => s.values);
  const rawMax = Math.max(...allVals, 1);
  const computedMax = maxY !== undefined ? maxY : Math.ceil(rawMax * 1.2);
  const ySteps = 4;
  const ticks = Array.from({ length: ySteps + 1 }, (_, i) =>
    Number(((computedMax / ySteps) * i).toFixed(1))
  );

  const svgWidth = 520;
  const svgHeight = height;
  const padLeft = 42;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 34;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const getX = (idx: number) => {
    if (categories.length <= 1) return padLeft + plotW / 2;
    const step = plotW / categories.length;
    return padLeft + step * idx + step / 2;
  };

  const getY = (val: number) => {
    if (computedMax <= 0) return padTop + plotH;
    const ratio = Math.min(Math.max(val / computedMax, 0), 1);
    return padTop + plotH - ratio * plotH;
  };

  return (
    <div
      className="w-full border border-slate-300 bg-white px-3 pt-2 pb-1.5 my-1 select-none"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full overflow-visible"
        style={{ height: `${height}px` }}
      >
        {/* Horizontal Grid Lines & Y-Axis Ticks */}
        {ticks.map((t, idx) => {
          const y = getY(t);
          return (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={y}
                x2={svgWidth - padRight}
                y2={y}
                stroke={idx === 0 ? '#94a3b8' : '#e2e8f0'}
                strokeWidth={idx === 0 ? 1.2 : 1}
              />
              <text
                x={padLeft - 8}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="#334155"
              >
                {fmtIdNum(t)}
              </text>
            </g>
          );
        })}

        {/* X-Axis Category Labels */}
        {categories.map((cat, idx) => {
          const x = getX(idx);
          return (
            <text
              key={cat}
              x={x}
              y={padTop + plotH + 16}
              textAnchor="middle"
              fontSize="10"
              fill="#1e293b"
            >
              {cat}
            </text>
          );
        })}
        <text
          x={padLeft + plotW / 2}
          y={padTop + plotH + 30}
          textAnchor="middle"
          fontSize="10"
          fill="#475569"
        >
          {xAxisTitle}
        </text>

        {/* Series Polylines & Data Points */}
        {series.map((s, sIdx) => {
          const pts = s.values.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
          return (
            <g key={s.name}>
              <polyline
                fill="none"
                stroke={s.color}
                strokeWidth="2.2"
                points={pts}
              />
              {s.values.map((v, i) => {
                const cx = getX(i);
                const cy = getY(v);
                return (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r="3.2" fill={s.color} />
                    <text
                      x={cx + (sIdx === 1 && v === 0 ? 8 : 0)}
                      y={cy - 7}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="bold"
                      fill="#0f172a"
                    >
                      {fmtIdNum(v)}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-0.5">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5 text-[9pt] text-slate-800">
            <span
              className="inline-block w-4 h-0.5"
              style={{ backgroundColor: s.color, height: '3px' }}
            />
            <span>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function QuarterlyOfficialReport({
  reportData,
  quarter = Math.floor(new Date().getMonth() / 3),
  year = new Date().getFullYear(),
}: QuarterlyReportProps) {
  const internalData = useOfficialReportData({
    periodType: 'quarterly',
    quarter,
    year,
    enabled: !reportData,
  });

  const data = reportData || internalData;
  const qData = data.quarterData;
  const reportYear = data.year || year;

  const blocks = useMemo<FlowBlock[]>(() => {
    const m1 = qData.months[0];
    const m2 = qData.months[1];
    const m3 = qData.months[2];

    const phlebitis = qData.haisRows.phlebitis;
    const isk = qData.haisRows.isk;
    const decubitus = qData.haisRows.decubitus;
    const vap = qData.haisRows.vap;
    const ido = qData.haisRows.ido;

    const phlebMonthItems = [
      { label: m1.monthName, days: phlebitis.m1.days, cases: phlebitis.m1.cases, rate: phlebitis.m1.rate },
      { label: m2.monthName, days: phlebitis.m2.days, cases: phlebitis.m2.cases, rate: phlebitis.m2.rate },
      { label: m3.monthName, days: phlebitis.m3.days, cases: phlebitis.m3.cases, rate: phlebitis.m3.rate },
    ];
    const highestPhleb = [...phlebMonthItems].sort((a, b) => b.rate - a.rate)[0];

    const signMonths = ['April', 'Juli', 'Oktober', 'Januari'];
    const signMonthName = signMonths[qData.quarterIndex] || 'Oktober';
    const signYear = qData.quarterIndex === 3 ? reportYear + 1 : reportYear;

    const chartMonthLabels = [
      m1.monthName.slice(0, 3),
      m2.monthName === 'Agustus' ? 'Agust' : m2.monthName.slice(0, 3),
      m3.monthName === 'September' ? 'Sept' : m3.monthName.slice(0, 3),
    ];

    const perawatRow =
      qData.hhProfessions.find((p) => p.profession.toLowerCase().includes('perawat')) || qData.hhProfessions[0];
    const dokterRow =
      qData.hhProfessions.find((p) => p.profession.toLowerCase().includes('dokter')) || qData.hhProfessions[1];
    const nakesRow =
      qData.hhProfessions.find(
        (p) => p.profession.toLowerCase().includes('tenaga') || p.profession.toLowerCase().includes('nakes')
      ) || qData.hhProfessions[2];

    // Dynamic Narratives for all 8 Charts
    const haisOverviewNarr = buildHaisOverviewNarrative({
      periodLabel: qData.periodLabel,
      phlebitis: phlebitis.total,
      isk: isk.total,
      decubitus: decubitus.total,
      vap: vap.total,
      ido: ido.total,
      peakDetail:
        highestPhleb && highestPhleb.cases > 0
          ? `kejadian Phlebitis tertinggi pada bulan ${highestPhleb.label} sebesar ${fmtIdNum(highestPhleb.rate)}‰ (${highestPhleb.cases} kasus dari ${highestPhleb.days} hari pemasangan alat)`
          : undefined,
    });

    const phlebNarr = buildSingleHaisNarrative({
      indicator: 'phlebitis',
      periodLabel: qData.periodLabel,
      dimensionLabel: 'bulan',
      points: phlebMonthItems,
      totalDays: phlebitis.total.days,
      totalCases: phlebitis.total.cases,
      overallRate: phlebitis.total.rate,
    });

    const iskNarr = buildSingleHaisNarrative({
      indicator: 'isk',
      periodLabel: qData.periodLabel,
      dimensionLabel: 'bulan',
      points: [
        { label: m1.monthName, days: isk.m1.days, cases: isk.m1.cases, rate: isk.m1.rate },
        { label: m2.monthName, days: isk.m2.days, cases: isk.m2.cases, rate: isk.m2.rate },
        { label: m3.monthName, days: isk.m3.days, cases: isk.m3.cases, rate: isk.m3.rate },
      ],
      totalDays: isk.total.days,
      totalCases: isk.total.cases,
      overallRate: isk.total.rate,
    });

    const decubitusNarr = buildSingleHaisNarrative({
      indicator: 'decubitus',
      periodLabel: qData.periodLabel,
      dimensionLabel: 'bulan',
      points: [
        { label: m1.monthName, days: decubitus.m1.days, cases: decubitus.m1.cases, rate: decubitus.m1.rate },
        { label: m2.monthName, days: decubitus.m2.days, cases: decubitus.m2.cases, rate: decubitus.m2.rate },
        { label: m3.monthName, days: decubitus.m3.days, cases: decubitus.m3.cases, rate: decubitus.m3.rate },
      ],
      totalDays: decubitus.total.days,
      totalCases: decubitus.total.cases,
      overallRate: decubitus.total.rate,
      customTargetNum: 1.0,
      customTargetLabel: '≤ 1‰',
    });

    const vapNarr = buildSingleHaisNarrative({
      indicator: 'vap',
      periodLabel: qData.periodLabel,
      dimensionLabel: 'bulan',
      points: [
        { label: m1.monthName, days: vap.m1.days, cases: vap.m1.cases, rate: vap.m1.rate },
        { label: m2.monthName, days: vap.m2.days, cases: vap.m2.cases, rate: vap.m2.rate },
        { label: m3.monthName, days: vap.m3.days, cases: vap.m3.cases, rate: vap.m3.rate },
      ],
      totalDays: vap.total.days,
      totalCases: vap.total.cases,
      overallRate: vap.total.rate,
    });

    const idoNarr = buildSingleHaisNarrative({
      indicator: 'ido',
      periodLabel: qData.periodLabel,
      dimensionLabel: 'bulan',
      points: [
        { label: m1.monthName, days: ido.m1.days, cases: ido.m1.cases, rate: ido.m1.rate },
        { label: m2.monthName, days: ido.m2.days, cases: ido.m2.cases, rate: ido.m2.rate },
        { label: m3.monthName, days: ido.m3.days, cases: ido.m3.cases, rate: ido.m3.rate },
      ],
      totalDays: ido.total.days,
      totalCases: ido.total.cases,
      overallRate: ido.total.rate,
    });

    // Peak HH month across professions
    const hhMonthAvgs = [
      {
        name: m1.monthName,
        avg: Number(((perawatRow.m1.rate + dokterRow.m1.rate + nakesRow.m1.rate) / 3).toFixed(1)),
      },
      {
        name: m2.monthName,
        avg: Number(((perawatRow.m2.rate + dokterRow.m2.rate + nakesRow.m2.rate) / 3).toFixed(1)),
      },
      {
        name: m3.monthName,
        avg: Number(((perawatRow.m3.rate + dokterRow.m3.rate + nakesRow.m3.rate) / 3).toFixed(1)),
      },
    ];
    const bestHhMonth = [...hhMonthAvgs].sort((a, b) => b.avg - a.avg)[0];

    const hhNarr = buildHandHygieneProfessionNarrative({
      periodLabel: qData.periodLabel,
      overallRate: qData.hhTotal.rate,
      professions: [
        { name: 'Perawat/Bidan', rate: perawatRow.total.rate, opp: perawatRow.total.opp, hh: perawatRow.total.hh },
        { name: 'Dokter', rate: dokterRow.total.rate, opp: dokterRow.total.opp, hh: dokterRow.total.hh },
        { name: 'Nakes Lainnya', rate: nakesRow.total.rate, opp: nakesRow.total.opp, hh: nakesRow.total.hh },
      ],
      peakMonthDetail: `Berdasarkan tren bulanan, rata-rata kepatuhan tertinggi tercapai pada bulan ${bestHhMonth.name} (${fmtIdNum(bestHhMonth.avg)}%).`,
    });

    const apdNarr = buildApdNarrative({
      periodLabel: qData.periodLabel,
      overallRate: qData.apdOverallRate,
      points: [
        { label: m1.monthName, rate: qData.apdMonthly[0]?.rate ?? 100 },
        { label: m2.monthName, rate: qData.apdMonthly[1]?.rate ?? 100 },
        { label: m3.monthName, rate: qData.apdMonthly[2]?.rate ?? 99 },
      ],
    });

    const out: FlowBlock[] = [
      // ==================== BAB I PENDAHULUAN ====================
      {
        type: 'element',
        key: 'q-bab1-header',
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
        key: 'q-bab1-latar-heading',
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
        key: 'q-bab1-p1',
        gapAfter: 10,
        node: (
          <p className="pl-6 indent-8 text-justify">
            Pencegahan dan Pengendalian infeksi di rumah sakit merupakan suatu upaya kegiatan untuk meminimalkan atau mencegah terjadinya infeksi pada pasien, petugas, pengunjung dan masyarakat di sekitar Rumah Sakit. Program pencegahan dan pengendalian infeksi antara lain; Pencegahan infeksi, penggunaan antibiotik secara rasional, kewaspadaan standar, surveilans, pendidikan dan pelatihan.
          </p>
        ),
      },
      {
        type: 'element',
        key: 'q-bab1-p2',
        gapAfter: 10,
        node: (
          <p className="pl-6 indent-8 text-justify">
            Kegiatan surveilans infeksi di rumah sakit merupakan salah satu kegiatan yang penting dan luas dalam program pengendalian infeksi dan suatu hal yang harus dilakukan untuk mencapai keberhasilan dari Program PPI.
          </p>
        ),
      },
      {
        type: 'element',
        key: 'q-bab1-p3',
        gapAfter: 10,
        node: (
          <p className="pl-6 indent-8 text-justify">
            Ditinjau dari asal atau didapatnya infeksi dapat berasal dari komunitas atau berasal dari lingkungan rumah sakit (Hospital Acquired Infection) yang sebelumnya dikenal istilah infeksi nosokomial. Karena sering kali tidak bisa secara pasti ditentukan asal infeksi, maka sekarang istilah infeksi nosokomial diganti dengan istilah baru yaitu Healthcare Associated Infections (HAIs).
          </p>
        ),
      },
      {
        type: 'element',
        key: 'q-bab1-p4',
        gapAfter: 10,
        node: (
          <p className="pl-6 indent-8 text-justify">
            Healthcare Associated Infections (HAIs) merupakan kejadian infeksi yang didapatkan penderita setelah mendapatkan perawatan &gt; 48 jam dan pasien tidak dalam masa inkubasi. Macam kejadian HAIs banyak dihubungkan karena pemasangan alat, seperti CAUTI (Catheter Associated Urinary Tract Infection), VAP (Ventilator Associated Pneumonia), CRBSI (Catheter IV Central Related Blood Stream Infections) dan IDO (Infeksi Daerah Operasi) karena tindakan operasi.
          </p>
        ),
      },
      {
        type: 'element',
        key: 'q-bab1-p5',
        gapAfter: 10,
        node: (
          <p className="pl-6 indent-8 text-justify">
            Pengetahuan tentang infeksi nosokomial dan pencegahannya merupakan stimulus sosial yang dapat menimbulkan respon emosional terhadap upaya universal precaution sehingga akan meningkatkan peran sertanya dalam upaya pencegahan infeksi nosokomial.
          </p>
        ),
      },
      {
        type: 'element',
        key: 'q-bab1-p6',
        gapAfter: 14,
        node: (
          <p className="pl-6 indent-8 text-justify">
            Kegagalan melakukan kebersihan tangan yang baik dan benar dianggap sebagai penyebab utama infeksi nosokomial atau HAIs dan penyebaran mikroorganisme multiresisten di fasilitas pelayanan kesehatan dan telah diakui sebagai kontribusi yang penting terhadap timbulnya wabah (Boyce and Pittet, 2002). Sehingga perlu adanya audit kepatuhan pelaksanaan kewaspadaan standar yang dilakukan oleh Tim Pencegahan dan Pengendalian Infeksi di UOBK RSUD Al-Mulk Kota Sukabumi.
          </p>
        ),
      },

      // Pindahkan 2. Tujuan Umum dan Khusus ke Halaman 3 secara rapi dan utuh
      { type: 'pageBreak', key: 'q-break-bab1-tujuan' },
      {
        type: 'element',
        key: 'q-bab1-tujuan-block',
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
      { type: 'pageBreak', key: 'q-break-bab2' },
      {
        type: 'element',
        key: 'q-bab2-header',
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
        key: 'q-bab2-a-h',
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
        key: 'q-bab2-a-p1',
        gapAfter: 8,
        node: (
          <p className="pl-6 indent-8 text-justify">
            Surveilans infeksi Rumah Sakit adalah suatu proses yang dinamis, sistematis, terus menerus dalam pengumpulan, identifikasi, analisis dan interpretasi data kesehatan yang penting pada suatu populasi spesifik dan didiseminasikan secara berkala kepada pihak-pihak yang memerlukan untuk digunakan dalam perencanaan, penerapan, serta evaluasi suatu tindakan yang berhubungan dengan kesehatan (Kemenkes, 2011).
          </p>
        ),
      },
      {
        type: 'element',
        key: 'q-bab2-a-p2',
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
        key: 'q-bab2-a1-h',
        keepWithNext: true,
        gapAfter: 8,
        node: (
          <div className="pl-6 flex items-start font-bold">
            <span className="w-6 flex-shrink-0">1.</span>
            <span>Angka Kejadian (Incident Rate) HAIs Triwulan {qData.quarterRoman}</span>
          </div>
        ),
      },
      {
        type: 'element',
        key: 'q-tabel-1-hais',
        gapAfter: 14,
        node: (
          <div className="w-full">
            <div className="text-center font-bold text-[12pt] mb-2 leading-snug">
              <p>Tabel 1. Incident Rate HAIs</p>
              <p>di UOBK RSUD Al-Mulk Triwulan {qData.quarterRoman}</p>
              <p>Periode {m1.monthName} - {m3.monthName} {reportYear}</p>
            </div>
            <table className="w-full border-collapse border border-black text-center text-[10.5pt] leading-[1.25]">
              <thead>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-1.5 w-[22%]" rowSpan={2}>JENIS INFEKSI</th>
                  <th className="border border-black py-1 px-1.5 w-[28%]" rowSpan={2}>ALAT INVASIF</th>
                  <th className="border border-black py-1 px-1.5" colSpan={3}>BULAN</th>
                  <th className="border border-black py-1 px-1.5 w-[13%]" rowSpan={2}>TOTAL</th>
                </tr>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-1.5">{m1.monthName.toUpperCase()}</th>
                  <th className="border border-black py-1 px-1.5">{m2.monthName.toUpperCase()}</th>
                  <th className="border border-black py-1 px-1.5">{m3.monthName.toUpperCase()}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-0.5 px-1.5 font-bold text-left align-middle" rowSpan={3}>PHLEBITIS</td>
                  <td className="border border-black py-0.5 px-1.5 text-left">Total hari pemasangan</td>
                  <td className="border border-black py-0.5 px-1.5">{phlebitis.m1.days}</td>
                  <td className="border border-black py-0.5 px-1.5">{phlebitis.m2.days}</td>
                  <td className="border border-black py-0.5 px-1.5">{phlebitis.m3.days}</td>
                  <td className="border border-black py-0.5 px-1.5 font-semibold">{phlebitis.total.days}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1.5 text-left">Infeksi</td>
                  <td className="border border-black py-0.5 px-1.5">{phlebitis.m1.cases}</td>
                  <td className="border border-black py-0.5 px-1.5">{phlebitis.m2.cases}</td>
                  <td className="border border-black py-0.5 px-1.5">{phlebitis.m3.cases}</td>
                  <td className="border border-black py-0.5 px-1.5 font-semibold">{phlebitis.total.cases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1.5 text-left">Rate In ‰</td>
                  <td className="border border-black py-0.5 px-1.5">{fmtIdNum(phlebitis.m1.rate)} ‰</td>
                  <td className="border border-black py-0.5 px-1.5">{fmtIdNum(phlebitis.m2.rate)} ‰</td>
                  <td className="border border-black py-0.5 px-1.5">{fmtIdNum(phlebitis.m3.rate)} ‰</td>
                  <td className="border border-black py-0.5 px-1.5 font-bold">{fmtIdNum(phlebitis.total.rate)} ‰</td>
                </tr>

                <tr>
                  <td className="border border-black py-0.5 px-1.5 font-bold text-left align-middle" rowSpan={3}>ISK</td>
                  <td className="border border-black py-0.5 px-1.5 text-left">Total hari pemasangan</td>
                  <td className="border border-black py-0.5 px-1.5">{isk.m1.days}</td>
                  <td className="border border-black py-0.5 px-1.5">{isk.m2.days}</td>
                  <td className="border border-black py-0.5 px-1.5">{isk.m3.days}</td>
                  <td className="border border-black py-0.5 px-1.5 font-semibold">{isk.total.days}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1.5 text-left">Infeksi</td>
                  <td className="border border-black py-0.5 px-1.5">{isk.m1.cases}</td>
                  <td className="border border-black py-0.5 px-1.5">{isk.m2.cases}</td>
                  <td className="border border-black py-0.5 px-1.5">{isk.m3.cases}</td>
                  <td className="border border-black py-0.5 px-1.5 font-semibold">{isk.total.cases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1.5 text-left">Rate In ‰</td>
                  <td className="border border-black py-0.5 px-1.5">{fmtIdNum(isk.m1.rate)} ‰</td>
                  <td className="border border-black py-0.5 px-1.5">{fmtIdNum(isk.m2.rate)} ‰</td>
                  <td className="border border-black py-0.5 px-1.5">{fmtIdNum(isk.m3.rate)} ‰</td>
                  <td className="border border-black py-0.5 px-1.5 font-bold">{fmtIdNum(isk.total.rate)} ‰</td>
                </tr>

                <tr>
                  <td className="border border-black py-0.5 px-1.5 font-bold text-left align-middle" rowSpan={3}>Decubitus</td>
                  <td className="border border-black py-0.5 px-1.5 text-left">Total hari tirah baring</td>
                  <td className="border border-black py-0.5 px-1.5">{decubitus.m1.days}</td>
                  <td className="border border-black py-0.5 px-1.5">{decubitus.m2.days}</td>
                  <td className="border border-black py-0.5 px-1.5">{decubitus.m3.days}</td>
                  <td className="border border-black py-0.5 px-1.5 font-semibold">{decubitus.total.days}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1.5 text-left">Infeksi</td>
                  <td className="border border-black py-0.5 px-1.5">{decubitus.m1.cases}</td>
                  <td className="border border-black py-0.5 px-1.5">{decubitus.m2.cases}</td>
                  <td className="border border-black py-0.5 px-1.5">{decubitus.m3.cases}</td>
                  <td className="border border-black py-0.5 px-1.5 font-semibold">{decubitus.total.cases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1.5 text-left">Rate In ‰</td>
                  <td className="border border-black py-0.5 px-1.5">{fmtIdNum(decubitus.m1.rate)} ‰</td>
                  <td className="border border-black py-0.5 px-1.5">{fmtIdNum(decubitus.m2.rate)} ‰</td>
                  <td className="border border-black py-0.5 px-1.5">{fmtIdNum(decubitus.m3.rate)} ‰</td>
                  <td className="border border-black py-0.5 px-1.5 font-bold">{fmtIdNum(decubitus.total.rate)} ‰</td>
                </tr>

                <tr>
                  <td className="border border-black py-0.5 px-1.5 font-bold text-left align-middle" rowSpan={3}>VAP</td>
                  <td className="border border-black py-0.5 px-1.5 text-left">Total hari pemasangan</td>
                  <td className="border border-black py-0.5 px-1.5">{vap.m1.days}</td>
                  <td className="border border-black py-0.5 px-1.5">{vap.m2.days}</td>
                  <td className="border border-black py-0.5 px-1.5">{vap.m3.days}</td>
                  <td className="border border-black py-0.5 px-1.5 font-semibold">{vap.total.days}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1.5 text-left">Infeksi</td>
                  <td className="border border-black py-0.5 px-1.5">{vap.m1.cases}</td>
                  <td className="border border-black py-0.5 px-1.5">{vap.m2.cases}</td>
                  <td className="border border-black py-0.5 px-1.5">{vap.m3.cases}</td>
                  <td className="border border-black py-0.5 px-1.5 font-semibold">{vap.total.cases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1.5 text-left">Rate In ‰</td>
                  <td className="border border-black py-0.5 px-1.5">{fmtIdNum(vap.m1.rate)} ‰</td>
                  <td className="border border-black py-0.5 px-1.5">{fmtIdNum(vap.m2.rate)} ‰</td>
                  <td className="border border-black py-0.5 px-1.5">{fmtIdNum(vap.m3.rate)} ‰</td>
                  <td className="border border-black py-0.5 px-1.5 font-bold">{fmtIdNum(vap.total.rate)} ‰</td>
                </tr>

                <tr>
                  <td className="border border-black py-0.5 px-1.5 font-bold text-left align-middle" rowSpan={4}>IDO</td>
                  <td className="border border-black py-0.5 px-1.5 text-center font-bold bg-slate-50" colSpan={5}>
                    TINDAKAN OPERASI DI IBS
                  </td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1.5 text-left">Total Operasi</td>
                  <td className="border border-black py-0.5 px-1.5">{ido.m1.days}</td>
                  <td className="border border-black py-0.5 px-1.5">{ido.m2.days}</td>
                  <td className="border border-black py-0.5 px-1.5">{ido.m3.days}</td>
                  <td className="border border-black py-0.5 px-1.5 font-semibold">{ido.total.days}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1.5 text-left">Infeksi</td>
                  <td className="border border-black py-0.5 px-1.5">{ido.m1.cases}</td>
                  <td className="border border-black py-0.5 px-1.5">{ido.m2.cases}</td>
                  <td className="border border-black py-0.5 px-1.5">{ido.m3.cases}</td>
                  <td className="border border-black py-0.5 px-1.5 font-semibold">{ido.total.cases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-0.5 px-1.5 text-left">Rate In %</td>
                  <td className="border border-black py-0.5 px-1.5">{fmtIdNum(ido.m1.rate)} %</td>
                  <td className="border border-black py-0.5 px-1.5">{fmtIdNum(ido.m2.rate)} %</td>
                  <td className="border border-black py-0.5 px-1.5">{fmtIdNum(ido.m3.rate)} %</td>
                  <td className="border border-black py-0.5 px-1.5 font-bold">{fmtIdNum(ido.total.rate)} %</td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },

      // Grafik 1 HAIs + Analisa, Rekomendasi, RTL
      {
        type: 'element',
        key: 'q-grafik-1-hais',
        gapAfter: 10,
        node: (
          <div className="w-full">
            <div className="text-center font-bold text-[12pt] mb-1.5 leading-snug">
              <p>Grafik 1. Incident Rate HAIs</p>
              <p>di UOBK RSUD Al-Mulk Triwulan {qData.quarterRoman}</p>
              <p>Periode {m1.monthName} - {m3.monthName} {reportYear}</p>
            </div>
            <WordStyleGroupedBarChart
              categories={['Phlebitis', 'ISK', 'Decubitus', 'VAP', 'IDO']}
              series={[
                {
                  name: chartMonthLabels[0],
                  color: '#4f81bd',
                  values: [phlebitis.m1.rate, isk.m1.rate, decubitus.m1.rate, vap.m1.rate, ido.m1.rate],
                },
                {
                  name: chartMonthLabels[1],
                  color: '#c0504d',
                  values: [phlebitis.m2.rate, isk.m2.rate, decubitus.m2.rate, vap.m2.rate, ido.m2.rate],
                },
                {
                  name: chartMonthLabels[2],
                  color: '#9bbb59',
                  values: [phlebitis.m3.rate, isk.m3.rate, decubitus.m3.rate, vap.m3.rate, ido.m3.rate],
                },
              ]}
              height={145}
            />
          </div>
        ),
      },
      ...narrativeToFlowBlocks('q-narr-hais-overview', haisOverviewNarr),

      // ==================== 2. PHLEBITIS ====================
      {
        type: 'element',
        key: 'q-phleb-h',
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <div className="w-full">
            <div className="flex items-start font-bold mb-1">
              <span className="w-6 flex-shrink-0">2.</span>
              <span>Angka Kejadian (Incidence Rate) Phlebitis</span>
            </div>
            <p className="pl-6 text-justify">
              Angka Kejadian (Incidence Rate) Phlebitis per 1000 hari pemakaian intra vascular line (‰) pada bulan {m1.monthName} - {m3.monthName} {reportYear}, berdasarkan Visual Infusion Phlebitis Score (VIPS) score ≥ 2.
            </p>
          </div>
        ),
      },
      {
        type: 'element',
        key: 'q-grafik-2-phleb',
        gapAfter: 10,
        node: (
          <div className="w-full">
            <div className="text-center font-bold text-[12pt] mb-1.5 leading-snug">
              <p>Grafik 2. Incidence Rate Phlebitis</p>
              <p>di UOBK RSUD Al-Mulk Triwulan {qData.quarterRoman}</p>
              <p>Periode {m1.monthName} - {m3.monthName} {reportYear}</p>
            </div>
            <WordStyleLineChart
              categories={chartMonthLabels}
              series={[
                {
                  name: 'Phlebitis',
                  color: '#4f81bd',
                  values: [phlebitis.m1.cases, phlebitis.m2.cases, phlebitis.m3.cases],
                },
                {
                  name: '‰',
                  color: '#ed7d31',
                  values: [phlebitis.m1.rate, phlebitis.m2.rate, phlebitis.m3.rate],
                },
                {
                  name: 'Target',
                  color: '#a5a5a5',
                  values: [1, 1, 1],
                },
              ]}
              height={135}
            />
          </div>
        ),
      },
      ...narrativeToFlowBlocks('q-narr-phleb', phlebNarr),
      {
        type: 'element',
        key: 'q-tabel-2-phleb',
        gapAfter: 16,
        node: (
          <div className="w-full">
            <div className="text-center font-bold text-[12pt] mb-2 leading-snug">
              <p>Tabel 2. Incidence Rate Phlebitis</p>
              <p>di UOBK RSUD Al-Mulk Triwulan {qData.quarterRoman}</p>
              <p>Periode {m1.monthName} - {m3.monthName} {reportYear}</p>
            </div>
            <table className="w-full border-collapse border border-black text-center text-[10.5pt] leading-[1.3]">
              <thead>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2 w-1/3" rowSpan={2}>INDIKATOR</th>
                  <th className="border border-black py-1 px-2" colSpan={3}>BULAN</th>
                  <th className="border border-black py-1 px-2 w-[16%]" rowSpan={2}>TOTAL</th>
                </tr>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2">{m1.shortName}</th>
                  <th className="border border-black py-1 px-2">{m2.shortName}</th>
                  <th className="border border-black py-1 px-2">{m3.shortName}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Hari terpasang alat</td>
                  <td className="border border-black py-1 px-2">{phlebitis.m1.days}</td>
                  <td className="border border-black py-1 px-2">{phlebitis.m2.days}</td>
                  <td className="border border-black py-1 px-2">{phlebitis.m3.days}</td>
                  <td className="border border-black py-1 px-2 font-semibold">{phlebitis.total.days}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Phlebitis</td>
                  <td className="border border-black py-1 px-2">{phlebitis.m1.cases}</td>
                  <td className="border border-black py-1 px-2">{phlebitis.m2.cases}</td>
                  <td className="border border-black py-1 px-2">{phlebitis.m3.cases}</td>
                  <td className="border border-black py-1 px-2 font-semibold">{phlebitis.total.cases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Rate In (‰)</td>
                  <td className="border border-black py-1 px-2">{fmtIdNum(phlebitis.m1.rate)} ‰</td>
                  <td className="border border-black py-1 px-2">{fmtIdNum(phlebitis.m2.rate)} ‰</td>
                  <td className="border border-black py-1 px-2">{fmtIdNum(phlebitis.m3.rate)} ‰</td>
                  <td className="border border-black py-1 px-2 font-bold">{fmtIdNum(phlebitis.total.rate)} ‰</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Target</td>
                  <td className="border border-black py-1 px-2">≤ 1‰</td>
                  <td className="border border-black py-1 px-2">≤ 1‰</td>
                  <td className="border border-black py-1 px-2">≤ 1‰</td>
                  <td className="border border-black py-1 px-2">≤ 1‰</td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },

      // ==================== 3. ISK ====================
      {
        type: 'element',
        key: 'q-isk-h',
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <div className="w-full">
            <div className="flex items-start font-bold mb-1">
              <span className="w-6 flex-shrink-0">3.</span>
              <span>Angka Kejadian (Incidence Rate) Infeksi Saluran Kemih (ISK)</span>
            </div>
            <p className="pl-6 text-justify">
              Angka Kejadian (Incidence Rate) Infeksi Saluran Kemih (ISK) per 1000 hari pemakaian alat (‰) di UOBK RSUD Al-Mulk {qData.periodLabel}.
            </p>
          </div>
        ),
      },
      {
        type: 'element',
        key: 'q-grafik-3-isk',
        gapAfter: 10,
        node: (
          <div className="w-full">
            <div className="text-center font-bold text-[12pt] mb-1.5 leading-snug">
              <p>Grafik 3. Incidence Rate Infeksi Saluran Kemih (ISK)</p>
              <p>di UOBK RSUD Al-Mulk Triwulan {qData.quarterRoman}</p>
              <p>Periode {m1.monthName} - {m3.monthName} {reportYear}</p>
            </div>
            <WordStyleLineChart
              categories={chartMonthLabels}
              series={[
                { name: 'ISK', color: '#4f81bd', values: [isk.m1.cases, isk.m2.cases, isk.m3.cases] },
                { name: '‰', color: '#ed7d31', values: [isk.m1.rate, isk.m2.rate, isk.m3.rate] },
                { name: 'Target', color: '#a5a5a5', values: [4.7, 4.7, 4.7] },
              ]}
              maxY={6}
              height={130}
            />
          </div>
        ),
      },
      ...narrativeToFlowBlocks('q-narr-isk', iskNarr),
      {
        type: 'element',
        key: 'q-tabel-3-isk',
        gapAfter: 16,
        node: (
          <div className="w-full">
            <div className="text-center font-bold text-[12pt] mb-2 leading-snug">
              <p>Tabel 3. Infeksi Saluran Kemih (ISK) per 1000 Hari Pemakaian Alat (‰)</p>
              <p>di UOBK RSUD Al-Mulk Triwulan {qData.quarterRoman}</p>
              <p>Periode {m1.monthName} - {m3.monthName} {reportYear}</p>
            </div>
            <table className="w-full border-collapse border border-black text-center text-[10.5pt] leading-[1.3]">
              <thead>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2 w-1/3" rowSpan={2}>INDIKATOR</th>
                  <th className="border border-black py-1 px-2" colSpan={3}>BULAN</th>
                  <th className="border border-black py-1 px-2 w-[16%]" rowSpan={2}>TOTAL</th>
                </tr>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2">{m1.shortName}</th>
                  <th className="border border-black py-1 px-2">{m2.shortName}</th>
                  <th className="border border-black py-1 px-2">{m3.shortName}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Hari terpasang alat</td>
                  <td className="border border-black py-1 px-2">{isk.m1.days}</td>
                  <td className="border border-black py-1 px-2">{isk.m2.days}</td>
                  <td className="border border-black py-1 px-2">{isk.m3.days}</td>
                  <td className="border border-black py-1 px-2 font-semibold">{isk.total.days}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Infeksi ISK</td>
                  <td className="border border-black py-1 px-2">{isk.m1.cases}</td>
                  <td className="border border-black py-1 px-2">{isk.m2.cases}</td>
                  <td className="border border-black py-1 px-2">{isk.m3.cases}</td>
                  <td className="border border-black py-1 px-2 font-semibold">{isk.total.cases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Rate In (‰)</td>
                  <td className="border border-black py-1 px-2">{fmtIdNum(isk.m1.rate)} ‰</td>
                  <td className="border border-black py-1 px-2">{fmtIdNum(isk.m2.rate)} ‰</td>
                  <td className="border border-black py-1 px-2">{fmtIdNum(isk.m3.rate)} ‰</td>
                  <td className="border border-black py-1 px-2 font-bold">{fmtIdNum(isk.total.rate)} ‰</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Target</td>
                  <td className="border border-black py-1 px-2">≤ 4,7‰</td>
                  <td className="border border-black py-1 px-2">≤ 4,7‰</td>
                  <td className="border border-black py-1 px-2">≤ 4,7‰</td>
                  <td className="border border-black py-1 px-2">≤ 4,7‰</td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },

      // ==================== 4. DECUBITUS ====================
      {
        type: 'element',
        key: 'q-decub-h',
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <div className="w-full">
            <div className="flex items-start font-bold mb-1">
              <span className="w-6 flex-shrink-0">4.</span>
              <span>Angka Kejadian (Incidence Rate) Decubitus</span>
            </div>
            <p className="pl-6 text-justify">
              Angka Kejadian (Incidence Rate) Infeksi Luka Tekan / Decubitus per 1000 hari tirah baring (‰) di UOBK RSUD Al-Mulk {qData.periodLabel}.
            </p>
          </div>
        ),
      },
      {
        type: 'element',
        key: 'q-grafik-4-decub',
        gapAfter: 10,
        node: (
          <div className="w-full">
            <div className="text-center font-bold text-[12pt] mb-1.5 leading-snug">
              <p>Grafik 4. Incidence Rate Infeksi Decubitus</p>
              <p>di UOBK RSUD Al-Mulk Triwulan {qData.quarterRoman}</p>
              <p>Periode {m1.monthName} - {m3.monthName} {reportYear}</p>
            </div>
            <WordStyleLineChart
              categories={chartMonthLabels}
              series={[
                { name: 'Decubitus', color: '#4f81bd', values: [decubitus.m1.cases, decubitus.m2.cases, decubitus.m3.cases] },
                { name: '‰', color: '#ed7d31', values: [decubitus.m1.rate, decubitus.m2.rate, decubitus.m3.rate] },
                { name: 'Target', color: '#a5a5a5', values: [1, 1, 1] },
              ]}
              maxY={2}
              height={130}
            />
          </div>
        ),
      },
      ...narrativeToFlowBlocks('q-narr-decub', decubitusNarr),
      {
        type: 'element',
        key: 'q-tabel-4-decub',
        gapAfter: 16,
        node: (
          <div className="w-full">
            <div className="text-center font-bold text-[12pt] mb-2 leading-snug">
              <p>Tabel 4. Infeksi Decubitus per 1000 Hari Tirah Baring (‰)</p>
              <p>di UOBK RSUD Al-Mulk Triwulan {qData.quarterRoman}</p>
              <p>Periode {m1.monthName} - {m3.monthName} {reportYear}</p>
            </div>
            <table className="w-full border-collapse border border-black text-center text-[10.5pt] leading-[1.3]">
              <thead>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2 w-1/3" rowSpan={2}>INDIKATOR</th>
                  <th className="border border-black py-1 px-2" colSpan={3}>BULAN</th>
                  <th className="border border-black py-1 px-2 w-[16%]" rowSpan={2}>TOTAL</th>
                </tr>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2">{m1.shortName}</th>
                  <th className="border border-black py-1 px-2">{m2.shortName}</th>
                  <th className="border border-black py-1 px-2">{m3.shortName}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Tirah baring</td>
                  <td className="border border-black py-1 px-2">{decubitus.m1.days}</td>
                  <td className="border border-black py-1 px-2">{decubitus.m2.days}</td>
                  <td className="border border-black py-1 px-2">{decubitus.m3.days}</td>
                  <td className="border border-black py-1 px-2 font-semibold">{decubitus.total.days}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Infeksi Decubitus</td>
                  <td className="border border-black py-1 px-2">{decubitus.m1.cases}</td>
                  <td className="border border-black py-1 px-2">{decubitus.m2.cases}</td>
                  <td className="border border-black py-1 px-2">{decubitus.m3.cases}</td>
                  <td className="border border-black py-1 px-2 font-semibold">{decubitus.total.cases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Rate In (‰)</td>
                  <td className="border border-black py-1 px-2">{fmtIdNum(decubitus.m1.rate)} ‰</td>
                  <td className="border border-black py-1 px-2">{fmtIdNum(decubitus.m2.rate)} ‰</td>
                  <td className="border border-black py-1 px-2">{fmtIdNum(decubitus.m3.rate)} ‰</td>
                  <td className="border border-black py-1 px-2 font-bold">{fmtIdNum(decubitus.total.rate)} ‰</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Target</td>
                  <td className="border border-black py-1 px-2">≤ 1‰</td>
                  <td className="border border-black py-1 px-2">≤ 1‰</td>
                  <td className="border border-black py-1 px-2">≤ 1‰</td>
                  <td className="border border-black py-1 px-2">≤ 1‰</td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },

      // ==================== 5. VAP ====================
      {
        type: 'element',
        key: 'q-vap-h',
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <div className="w-full">
            <div className="flex items-start font-bold mb-1">
              <span className="w-6 flex-shrink-0">5.</span>
              <span>Angka Kejadian (Incident Rate) Ventilator Associated Pneumonia (VAP)</span>
            </div>
            <p className="pl-6 text-justify">
              Angka Kejadian (Incidence Rate) Ventilator Associated Pneumonia (VAP) per 1000 hari pemakaian alat (‰) di UOBK RSUD Al-Mulk {qData.periodLabel}.
            </p>
          </div>
        ),
      },
      {
        type: 'element',
        key: 'q-grafik-5-vap',
        gapAfter: 10,
        node: (
          <div className="w-full">
            <div className="text-center font-bold text-[12pt] mb-1.5 leading-snug">
              <p>Grafik 5. Incidence Rate Ventilator Associated Pneumonia (VAP)</p>
              <p>di UOBK RSUD Al-Mulk Triwulan {qData.quarterRoman}</p>
              <p>Periode {m1.monthName} - {m3.monthName} {reportYear}</p>
            </div>
            <WordStyleLineChart
              categories={chartMonthLabels}
              series={[
                { name: 'VAP', color: '#4f81bd', values: [vap.m1.cases, vap.m2.cases, vap.m3.cases] },
                { name: '‰', color: '#ed7d31', values: [vap.m1.rate, vap.m2.rate, vap.m3.rate] },
                { name: 'Target', color: '#a5a5a5', values: [5.8, 5.8, 5.8] },
              ]}
              maxY={7}
              height={130}
            />
          </div>
        ),
      },
      ...narrativeToFlowBlocks('q-narr-vap', vapNarr),
      {
        type: 'element',
        key: 'q-tabel-5-vap',
        gapAfter: 16,
        node: (
          <div className="w-full">
            <div className="text-center font-bold text-[12pt] mb-2 leading-snug">
              <p>Tabel 5. Infeksi Ventilator Associated Pneumonia (VAP)</p>
              <p>di UOBK RSUD Al-Mulk Triwulan {qData.quarterRoman}</p>
              <p>Periode {m1.monthName} - {m3.monthName} {reportYear}</p>
            </div>
            <table className="w-full border-collapse border border-black text-center text-[10.5pt] leading-[1.3]">
              <thead>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2 w-1/3" rowSpan={2}>INDIKATOR</th>
                  <th className="border border-black py-1 px-2" colSpan={3}>BULAN</th>
                  <th className="border border-black py-1 px-2 w-[16%]" rowSpan={2}>TOTAL</th>
                </tr>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2">{m1.shortName}</th>
                  <th className="border border-black py-1 px-2">{m2.shortName}</th>
                  <th className="border border-black py-1 px-2">{m3.shortName}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Hari terpasang ventilator</td>
                  <td className="border border-black py-1 px-2">{vap.m1.days}</td>
                  <td className="border border-black py-1 px-2">{vap.m2.days}</td>
                  <td className="border border-black py-1 px-2">{vap.m3.days}</td>
                  <td className="border border-black py-1 px-2 font-semibold">{vap.total.days}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Infeksi VAP</td>
                  <td className="border border-black py-1 px-2">{vap.m1.cases}</td>
                  <td className="border border-black py-1 px-2">{vap.m2.cases}</td>
                  <td className="border border-black py-1 px-2">{vap.m3.cases}</td>
                  <td className="border border-black py-1 px-2 font-semibold">{vap.total.cases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Rate In (‰)</td>
                  <td className="border border-black py-1 px-2">{fmtIdNum(vap.m1.rate)} ‰</td>
                  <td className="border border-black py-1 px-2">{fmtIdNum(vap.m2.rate)} ‰</td>
                  <td className="border border-black py-1 px-2">{fmtIdNum(vap.m3.rate)} ‰</td>
                  <td className="border border-black py-1 px-2 font-bold">{fmtIdNum(vap.total.rate)} ‰</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Target</td>
                  <td className="border border-black py-1 px-2">≤ 5,8‰</td>
                  <td className="border border-black py-1 px-2">≤ 5,8‰</td>
                  <td className="border border-black py-1 px-2">≤ 5,8‰</td>
                  <td className="border border-black py-1 px-2">≤ 5,8‰</td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },

      // ==================== 6. IDO ====================
      {
        type: 'element',
        key: 'q-ido-h',
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <div className="w-full">
            <div className="flex items-start font-bold mb-1">
              <span className="w-6 flex-shrink-0">6.</span>
              <span>Angka Kejadian (Incident Rate) Infeksi Daerah Operasi (IDO)</span>
            </div>
            <p className="pl-6 text-justify">
              Angka Kejadian (Incidence Rate) Infeksi Daerah Operasi (IDO) per 100 tindakan operasi (%) di UOBK RSUD Al-Mulk {qData.periodLabel}.
            </p>
          </div>
        ),
      },
      {
        type: 'element',
        key: 'q-grafik-6-ido',
        gapAfter: 10,
        node: (
          <div className="w-full">
            <div className="text-center font-bold text-[12pt] mb-1.5 leading-snug">
              <p>Grafik 6. Incidence Rate Infeksi Daerah Operasi (IDO)</p>
              <p>di UOBK RSUD Al-Mulk Triwulan {qData.quarterRoman}</p>
              <p>Periode {m1.monthName} - {m3.monthName} {reportYear}</p>
            </div>
            <WordStyleLineChart
              categories={chartMonthLabels}
              series={[
                { name: 'IDO', color: '#4f81bd', values: [ido.m1.cases, ido.m2.cases, ido.m3.cases] },
                { name: '%', color: '#ed7d31', values: [ido.m1.rate, ido.m2.rate, ido.m3.rate] },
                { name: 'Target', color: '#a5a5a5', values: [2, 2, 2] },
              ]}
              maxY={3}
              height={130}
            />
          </div>
        ),
      },
      ...narrativeToFlowBlocks('q-narr-ido', idoNarr),
      {
        type: 'element',
        key: 'q-tabel-6-ido',
        gapAfter: 16,
        node: (
          <div className="w-full">
            <div className="text-center font-bold text-[12pt] mb-2 leading-snug">
              <p>Tabel 6. Infeksi Daerah Operasi (IDO)</p>
              <p>di UOBK RSUD Al-Mulk Triwulan {qData.quarterRoman}</p>
              <p>Periode {m1.monthName} - {m3.monthName} {reportYear}</p>
            </div>
            <table className="w-full border-collapse border border-black text-center text-[10.5pt] leading-[1.3]">
              <thead>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2 w-1/3" rowSpan={2}>INDIKATOR</th>
                  <th className="border border-black py-1 px-2" colSpan={3}>BULAN</th>
                  <th className="border border-black py-1 px-2 w-[16%]" rowSpan={2}>TOTAL</th>
                </tr>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2">{m1.shortName}</th>
                  <th className="border border-black py-1 px-2">{m2.shortName}</th>
                  <th className="border border-black py-1 px-2">{m3.shortName}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Jumlah pasien dioperasi</td>
                  <td className="border border-black py-1 px-2">{ido.m1.days}</td>
                  <td className="border border-black py-1 px-2">{ido.m2.days}</td>
                  <td className="border border-black py-1 px-2">{ido.m3.days}</td>
                  <td className="border border-black py-1 px-2 font-semibold">{ido.total.days}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Infeksi IDO</td>
                  <td className="border border-black py-1 px-2">{ido.m1.cases}</td>
                  <td className="border border-black py-1 px-2">{ido.m2.cases}</td>
                  <td className="border border-black py-1 px-2">{ido.m3.cases}</td>
                  <td className="border border-black py-1 px-2 font-semibold">{ido.total.cases}</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Rate In (%)</td>
                  <td className="border border-black py-1 px-2">{fmtIdNum(ido.m1.rate)} %</td>
                  <td className="border border-black py-1 px-2">{fmtIdNum(ido.m2.rate)} %</td>
                  <td className="border border-black py-1 px-2">{fmtIdNum(ido.m3.rate)} %</td>
                  <td className="border border-black py-1 px-2 font-bold">{fmtIdNum(ido.total.rate)} %</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left">Target</td>
                  <td className="border border-black py-1 px-2">≤ 2%</td>
                  <td className="border border-black py-1 px-2">≤ 2%</td>
                  <td className="border border-black py-1 px-2">≤ 2%</td>
                  <td className="border border-black py-1 px-2">≤ 2%</td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },

      // ==================== B. AUDIT HAND HYGIENE DAN APD ====================
      {
        type: 'element',
        key: 'q-bab2-b-h',
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
        key: 'q-grafik-hh',
        gapAfter: 10,
        node: (
          <div className="w-full">
            <div className="text-center font-bold text-[12pt] mb-1.5 leading-snug">
              <p>Grafik 1. Kepatuhan Hand Hygiene Berdasarkan Profesi</p>
              <p>di UOBK RSUD Al-Mulk Triwulan {qData.quarterRoman}</p>
              <p>Periode {m1.monthName} - {m3.monthName} {reportYear}</p>
            </div>
            <WordStyleGroupedBarChart
              categories={chartMonthLabels}
              series={[
                {
                  name: 'Perawat/Bidan',
                  color: '#4f81bd',
                  values: [perawatRow.m1.rate, perawatRow.m2.rate, perawatRow.m3.rate],
                },
                {
                  name: 'Dokter',
                  color: '#ed7d31',
                  values: [dokterRow.m1.rate, dokterRow.m2.rate, dokterRow.m3.rate],
                },
                {
                  name: 'Nakes lainnya',
                  color: '#a5a5a5',
                  values: [nakesRow.m1.rate, nakesRow.m2.rate, nakesRow.m3.rate],
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
      ...narrativeToFlowBlocks('q-narr-hh', hhNarr),
      {
        type: 'element',
        key: 'q-tabel-hh',
        gapAfter: 16,
        node: (
          <div className="w-full">
            <div className="text-center font-bold text-[12pt] mb-2 leading-snug">
              <p>Tabel 1. Kepatuhan Hand Hygiene Berdasarkan Profesi</p>
              <p>di UOBK RSUD Al-Mulk Triwulan {qData.quarterRoman}</p>
              <p>Periode {m1.monthName} - {m3.monthName} {reportYear}</p>
            </div>
            <table className="w-full border-collapse border border-black text-center text-[10pt] leading-[1.3]">
              <thead>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2 w-[26%]" rowSpan={2}>Profesi</th>
                  <th className="border border-black py-1 px-1" colSpan={3}>{m1.shortName}</th>
                  <th className="border border-black py-1 px-1" colSpan={3}>{m2.shortName}</th>
                  <th className="border border-black py-1 px-1" colSpan={3}>{m3.shortName}</th>
                  <th className="border border-black py-1 px-1 w-[11%]" rowSpan={2}>Rata-rata</th>
                </tr>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-1">OPP</th>
                  <th className="border border-black py-1 px-1">HH</th>
                  <th className="border border-black py-1 px-1">%</th>
                  <th className="border border-black py-1 px-1">OPP</th>
                  <th className="border border-black py-1 px-1">HH</th>
                  <th className="border border-black py-1 px-1">%</th>
                  <th className="border border-black py-1 px-1">OPP</th>
                  <th className="border border-black py-1 px-1">HH</th>
                  <th className="border border-black py-1 px-1">%</th>
                </tr>
              </thead>
              <tbody>
                {qData.hhProfessions.map((p) => (
                  <tr key={p.profession}>
                    <td className="border border-black py-1 px-2 text-left font-medium">{p.profession}</td>
                    <td className="border border-black py-1 px-1">{p.m1.opp}</td>
                    <td className="border border-black py-1 px-1">{p.m1.hh}</td>
                    <td className="border border-black py-1 px-1">{p.m1.rate}%</td>
                    <td className="border border-black py-1 px-1">{p.m2.opp}</td>
                    <td className="border border-black py-1 px-1">{p.m2.hh}</td>
                    <td className="border border-black py-1 px-1">{p.m2.rate}%</td>
                    <td className="border border-black py-1 px-1">{p.m3.opp}</td>
                    <td className="border border-black py-1 px-1">{p.m3.hh}</td>
                    <td className="border border-black py-1 px-1">{p.m3.rate}%</td>
                    <td className="border border-black py-1 px-1 font-bold">{p.total.rate}%</td>
                  </tr>
                ))}
                <tr className="font-bold bg-slate-50">
                  <td className="border border-black py-1 px-2 text-left">Total / Rata-rata RS</td>
                  <td className="border border-black py-1 px-1" colSpan={9}>
                    {qData.hhTotal.hh} patuh dari {qData.hhTotal.opp} peluang (Target ≥ 85%)
                  </td>
                  <td className="border border-black py-1 px-1">{fmtIdNum(qData.hhTotal.rate)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },

      // 2. Kepatuhan Penggunaan APD
      {
        type: 'element',
        key: 'q-apd-h',
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
        key: 'q-grafik-apd',
        gapAfter: 10,
        node: (
          <div className="w-full">
            <div className="text-center font-bold text-[12pt] mb-1.5 leading-snug">
              <p>Grafik 2. Kepatuhan Penggunaan APD</p>
              <p>di UOBK RSUD Al-Mulk Triwulan {qData.quarterRoman}</p>
              <p>Periode {m1.monthName} - {m3.monthName} {reportYear}</p>
            </div>
            <WordStyleGroupedBarChart
              categories={[
                m1.monthName,
                m2.monthName === 'Agustus' ? 'Agust' : m2.monthName,
                m3.monthName === 'September' ? 'Sep' : m3.monthName,
              ]}
              series={[
                {
                  name: 'Capaian',
                  color: '#4f81bd',
                  values: qData.apdMonthly.map((m) => m.rate),
                },
                {
                  name: 'Target',
                  color: '#ed7d31',
                  values: [100, 100, 100],
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
      ...narrativeToFlowBlocks('q-narr-apd', apdNarr),
      {
        type: 'element',
        key: 'q-tabel-apd',
        gapAfter: 16,
        node: (
          <div className="w-full">
            <div className="text-center font-bold text-[12pt] mb-2 leading-snug">
              <p>Tabel 2. Kepatuhan Penggunaan APD</p>
              <p>di UOBK RSUD Al-Mulk Triwulan {qData.quarterRoman}</p>
              <p>Periode {m1.monthName} - {m3.monthName} {reportYear}</p>
            </div>
            <table className="w-full border-collapse border border-black text-center text-[10.5pt] leading-[1.3]">
              <thead>
                <tr className="font-bold bg-slate-50">
                  <th className="border border-black py-1 px-2 w-1/3">INDIKATOR</th>
                  <th className="border border-black py-1 px-2">{m1.shortName}</th>
                  <th className="border border-black py-1 px-2">{m2.shortName}</th>
                  <th className="border border-black py-1 px-2">{m3.shortName}</th>
                  <th className="border border-black py-1 px-2">RATA-RATA</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-1 px-2 text-left font-medium">Capaian Kepatuhan APD</td>
                  <td className="border border-black py-1 px-2">{fmtIdNum(qData.apdMonthly[0]?.rate ?? 100)}%</td>
                  <td className="border border-black py-1 px-2">{fmtIdNum(qData.apdMonthly[1]?.rate ?? 100)}%</td>
                  <td className="border border-black py-1 px-2">{fmtIdNum(qData.apdMonthly[2]?.rate ?? 99)}%</td>
                  <td className="border border-black py-1 px-2 font-bold">{fmtIdNum(qData.apdOverallRate)}%</td>
                </tr>
                <tr>
                  <td className="border border-black py-1 px-2 text-left font-medium">Target Standar Kemenkes</td>
                  <td className="border border-black py-1 px-2">100%</td>
                  <td className="border border-black py-1 px-2">100%</td>
                  <td className="border border-black py-1 px-2">100%</td>
                  <td className="border border-black py-1 px-2 font-semibold">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },

      // ==================== C. KESIMPULAN & PENGESAHAN ====================
      {
        type: 'element',
        key: 'q-bab2-c-h',
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
        key: 'q-bab2-c-body',
        gapAfter: 18,
        node: (
          <div className="pl-6 space-y-2 text-justify">
            <p className="indent-8">
              Pelaksanaan program Pencegahan dan Pengendalian Infeksi (PPI) pada {qData.periodLabel} di UOBK RSUD Al-Mulk Kota Sukabumi secara umum telah berjalan berkesinambungan. Indikator surveilans ISK ({fmtIdNum(isk.total.rate)}‰), Decubitus ({fmtIdNum(decubitus.total.rate)}‰), VAP ({fmtIdNum(vap.total.rate)}‰), dan IDO ({fmtIdNum(ido.total.rate)}%) terkendali sesuai standar nasional, sedangkan pengendalian Phlebitis ({fmtIdNum(phlebitis.total.rate)}‰), penguatan kepatuhan Hand Hygiene ({fmtIdNum(qData.hhTotal.rate)}%), dan konsistensi penggunaan APD ({fmtIdNum(qData.apdOverallRate)}%) menjadi fokus supervisi perbaikan berkelanjutan pada triwulan berikutnya.
            </p>
            <p className="indent-8">
              Hasil surveilans HAIs dan audit kewaspadaan standar ini disampaikan kepada Direktur UOBK RSUD Al-Mulk Kota Sukabumi, Ketua Komite Mutu, serta dikoordinasikan bersama seluruh Kepala Instalasi dan Kepala Ruang sebagai dasar evaluasi mutu pelayanan.
            </p>
          </div>
        ),
      },
      {
        type: 'element',
        key: 'q-signature-block',
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
  }, [qData, reportYear]);

  return (
    <AutoPaginatedF4Document
      id="print-area-quarterly"
      numberingMode="inclusive"
      coverPage={
        <ReportCover
          reportType="quarterly"
          title={`LAPORAN TRIWULAN ${qData.quarterRoman} ${reportYear}`}
          subtitle="PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)"
          year={String(reportYear)}
        />
      }
      blocks={blocks}
    />
  );
}

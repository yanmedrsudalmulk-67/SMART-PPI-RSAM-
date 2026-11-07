import React from 'react';
import F4Page from './F4Page';
import ReportCover from './ReportCover';
import { OfficialReportData, useOfficialReportData } from '@/hooks/useOfficialReportData';

interface QuarterlyReportProps {
  reportData?: OfficialReportData;
  quarter?: number;
  year?: number;
}

function fmtComma(val: number | string): string {
  const n = typeof val === 'number' ? val : Number(val);
  if (isNaN(n)) return String(val);
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1).replace('.', ',');
}

interface GroupedBarSeries {
  name: string;
  color: string;
  values: number[];
  formattedValues?: string[];
}

function WordStyleGroupedBarChart({
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
      className="w-full border border-slate-300 bg-white px-4 pt-3 pb-2 my-2 select-none"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      <div className="w-full flex items-stretch" style={{ height: `${height}px` }}>
        {/* Y-Axis */}
        <div className="flex flex-col-reverse justify-between pr-2 text-right text-[9pt] text-slate-700 pb-6 flex-shrink-0">
          {ticks.map((t, idx) => (
            <span key={idx} className="leading-none">
              {fmtComma(t)}
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
                    const label = s.formattedValues?.[cIdx] ?? `${fmtComma(v)}${unit}`;
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

function WordStyleLineChart({
  categories,
  series,
  maxY,
  height = 140,
}: {
  categories: string[];
  series: LineSeriesItem[];
  maxY?: number;
  height?: number;
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
      className="w-full border border-slate-300 bg-white px-3 pt-2 pb-1.5 my-1.5 select-none"
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
                {fmtComma(t)}
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
          Bulan
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
                const labelOffsetY = sIdx === 0 ? -7 : sIdx === 1 ? -7 : -7;
                return (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r="3.2" fill={s.color} />
                    <text
                      x={cx + (sIdx === 1 && v === 0 ? 8 : 0)}
                      y={cy + labelOffsetY}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="bold"
                      fill="#0f172a"
                    >
                      {fmtComma(v)}
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
  quarter = 2, // Default: Triwulan III (index 2)
  year = 2026,
}: QuarterlyReportProps) {
  const internalData = useOfficialReportData({
    periodType: 'quarterly',
    quarter,
    year,
  });

  const data = reportData || internalData;
  const qData = data.quarterData;
  const reportYear = data.year || year;
  const totalPages = 12;

  const m1 = qData.months[0];
  const m2 = qData.months[1];
  const m3 = qData.months[2];

  const phlebitis = qData.haisRows.phlebitis;
  const isk = qData.haisRows.isk;
  const decubitus = qData.haisRows.decubitus;
  const vap = qData.haisRows.vap;
  const ido = qData.haisRows.ido;

  // Dynamic highest & lowest Phlebitis month for accurate realtime analysis narrative
  const phlebMonthItems = [
    { name: m1.monthName, short: 'Jul', days: phlebitis.m1.days, cases: phlebitis.m1.cases, rate: phlebitis.m1.rate },
    { name: m2.monthName, short: 'Agust', days: phlebitis.m2.days, cases: phlebitis.m2.cases, rate: phlebitis.m2.rate },
    { name: m3.monthName, short: 'Sept', days: phlebitis.m3.days, cases: phlebitis.m3.cases, rate: phlebitis.m3.rate },
  ];
  const highestPhleb = [...phlebMonthItems].sort((a, b) => b.rate - a.rate)[0];
  const lowestPhleb = [...phlebMonthItems].sort((a, b) => a.rate - b.rate)[0];

  // Dynamic signature month following the quarter (Triwulan I -> April, II -> Juli, III -> Oktober, IV -> Januari)
  const signMonths = ['April', 'Juli', 'Oktober', 'Januari'];
  const signMonthName = signMonths[qData.quarterIndex] || 'Oktober';
  const signYear = qData.quarterIndex === 3 ? reportYear + 1 : reportYear;

  const chartMonthLabels = [
    m1.monthName.slice(0, 3),
    m2.monthName === 'Agustus' ? 'Agust' : m2.monthName.slice(0, 3),
    m3.monthName === 'September' ? 'Sept' : m3.monthName.slice(0, 3),
  ];

  // Dynamic Hand Hygiene highest month & rates per profession for accurate analysis
  const perawatRow = qData.hhProfessions.find((p) => p.profession.toLowerCase().includes('perawat')) || qData.hhProfessions[0];
  const dokterRow = qData.hhProfessions.find((p) => p.profession.toLowerCase().includes('dokter')) || qData.hhProfessions[1];
  const nakesRow = qData.hhProfessions.find((p) => p.profession.toLowerCase().includes('tenaga') || p.profession.toLowerCase().includes('nakes')) || qData.hhProfessions[2];

  return (
    <div
      id="print-area-quarterly"
      className="w-full flex flex-col items-center official-pages-container transition-all"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      {/* ========================================================= */}
      {/* HALAMAN 1: COVER DOKUMEN RESMI F4                         */}
      {/* ========================================================= */}
      <F4Page pageNumber={1} totalPages={totalPages} isCover>
        <ReportCover
          reportType="quarterly"
          title={`LAPORAN TRIWULAN ${qData.quarterRoman} ${reportYear}`}
          subtitle="PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)"
          year={String(reportYear)}
        />
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 2: BAB I PENDAHULUAN - 1. LATAR BELAKANG          */}
      {/* ========================================================= */}
      <F4Page pageNumber={2} totalPages={totalPages}>
        <div className="text-[12pt] leading-[1.5] text-justify font-normal text-black">
          <div className="text-center font-bold mb-6">
            <p>BAB I</p>
            <p>PENDAHULUAN</p>
          </div>

          <div className="flex items-start font-bold mb-2">
            <span className="w-6 flex-shrink-0">1.</span>
            <span>Latar Belakang</span>
          </div>

          <div className="pl-6 space-y-3">
            <p className="indent-8">
              Pencegahan dan Pengendalian infeksi di rumah sakit merupakan suatu upaya kegiatan untuk meminimalkan atau mencegah terjadinya infeksi pada pasien, petugas, pengunjung dan masyarakat di sekitar Rumah Sakit. Program pencegahan dan pengendalian infeksi antara lain; Pencegahan infeksi, penggunaan antibiotik secara rasional, kewaspadaan standar, surveilans, pendidikan dan pelatihan.
            </p>
            <p className="indent-8">
              Kegaiatan surveilans infeksi dirumah sakit merupakan salah satu kegiatan yang penting dan luas dalam program pengendalian infeksi dan suatu hal yang harus dilakukan untuk mencapai keberhasilan dari Program PPI.
            </p>
            <p className="indent-8">
              Ditinjau dari asal atau didapatnya infeksi dapat berasal dari komunitas atau berasal dari lingkungan rumah sakit (Hospital Acquired Infection) yang sebelumnya dikenal istilah infeksi nosokomial. Karena sering kali tidak bisa secara pasti ditentukan asal infeksi, maka sekarang istilah infeksi nosokomial diganti dengan istilah baru yaitu Healthcare Associated Infections (HAIs).
            </p>
            <p className="indent-8">
              Healthcare Associated Infections (HAIs) merupakan kejadian infeksi yang didapatkan penderita setelah mendapatkan perawatan &gt; 48 jam dan pasien tidak dalam masa inkubasi. Macam kejadian HAIs banyak dihubungkan karena pemasangan alat, seperti CAUTI (Catheter Associated Urinary Tract Infection), VAP (Ventilator Associated Pneumonia), CRBSI (Catheter IV Central Related Blood Stream Infections) dan IDO (Infeksi Daerah Operasi) karena tindakan operasi.
            </p>
            <p className="indent-8">
              Pengetahuan tentang infeksi nosokomial dan pencegahannya merupakan stimulus sosial yang dapat menimbulkan respon emosional terhadap upaya universal precaution sehingga akan meningkatkan peran sertanya dalam upaya pencegahan infeksi nosokomial.
            </p>
            <p className="indent-8">
              Kegagalan melakukan kebersihan tangan yang baik dan benar dianggap sebagai penyebab utama infeksi nosokomial atau HAIs dan penyebaran mikroorganisme multiresisten di fasilitas pelayanan kesehatan dan telah diakui sebagai kontribusi yang penting terhadap timbulnya wabah (Boyce and Pittet,, 2002). Sehingga perlu adanya audit kepatuhan pelaksanaan kewaspadaan standar yang dilakukan oleh Tim Pencegahan dan Pengendalian Infeksi di UOBK RSUD Al-Mulk Kota Sukabumi.
            </p>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 3: 2. TUJUAN UMUM DAN KHUSUS                      */}
      {/* ========================================================= */}
      <F4Page pageNumber={3} totalPages={totalPages}>
        <div className="text-[12pt] leading-[1.5] text-justify font-normal text-black">
          <div className="flex items-start font-bold mb-3">
            <span className="w-6 flex-shrink-0">2.</span>
            <span>Tujuan Umum dan Khusus</span>
          </div>

          <div className="pl-6">
            <div className="flex items-start font-bold mb-1">
              <span className="w-6 flex-shrink-0">a.</span>
              <span>Tujuan Umum</span>
            </div>
            <p className="pl-6 mb-4">
              Mengetahui angka kepatuhan pelaksanaan kewaspadaan standar, dan surveilans Rumah Sakit.
            </p>

            <div className="flex items-start font-bold mb-1">
              <span className="w-6 flex-shrink-0">b.</span>
              <span>Tujuan Khusus</span>
            </div>
            <div className="pl-6 space-y-1">
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
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 4: BAB II LAPORAN KEGIATAN PROGRAM PPI & TABEL.1  */}
      {/* ========================================================= */}
      <F4Page pageNumber={4} totalPages={totalPages}>
        <div className="text-[12pt] leading-[1.5] text-justify font-normal text-black">
          <div className="text-center font-bold mb-4">
            <p>BAB II</p>
            <p>LAPORAN KEGIATAN PROGRAM PPI</p>
          </div>

          <div className="flex items-start font-bold mb-2">
            <span className="w-6 flex-shrink-0">A.</span>
            <span>SURVEILANS</span>
          </div>

          <div className="pl-6 space-y-2.5 mb-3">
            <p className="indent-8">
              Surveilans infeksi Rumah Sakit adalah suatu proses yang dinamis, sistematis, terus menerus dalam pengumpulan, identifikasi, analisis dan interpretasi data kesehatan yang penting pada suatu populasi spesifik dan didiseminasikan secara berkala kepada pihak-pihak yang memerlukan unuk digunakan dalam perencanaan, penerapan, serta evaluasi suatu tindakan yang berhubungan dengan kesehatan (Kemenkes, 2011).
            </p>
            <p className="indent-8">
              Metode surveilans yang digunakan adalah Surveilans Hasil (Outcome Surveilans). Pada umumnya yang diperoleh dipantau adalah kejadian Phlebitis, Infeksi Saluran Kemih (ISK), Kejadian Decubitus, IDO dan VAP.
            </p>
            <p>
              Angka Phlebitis yang dimasukkan kedalam HAIs adalah grade II.
            </p>

            <div className="flex items-start font-bold pt-1">
              <span className="w-6 flex-shrink-0">1.</span>
              <span>Angka kejadian (Incident Rate) HAIs Triwulan {qData.quarterRoman}</span>
            </div>
          </div>

          <p className="text-center font-bold text-[12pt] mb-2">
            Tabel.1 Incident Rate HAIs UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

          <table className="w-full border-collapse border border-black text-center text-[10.5pt] leading-[1.25]">
            <thead>
              <tr className="font-bold">
                <th className="border border-black py-1 px-1.5 w-[22%]" rowSpan={2}>JENIS INFEKSI</th>
                <th className="border border-black py-1 px-1.5 w-[28%]" rowSpan={2}>ALAT INVASIF</th>
                <th className="border border-black py-1 px-1.5" colSpan={3}>BULAN</th>
                <th className="border border-black py-1 px-1.5 w-[13%]" rowSpan={2}>TOTAL</th>
              </tr>
              <tr className="font-bold">
                <th className="border border-black py-1 px-1.5">{m1.monthName.toUpperCase()}</th>
                <th className="border border-black py-1 px-1.5">{m2.monthName.toUpperCase()}</th>
                <th className="border border-black py-1 px-1.5">{m3.monthName.toUpperCase()}</th>
              </tr>
            </thead>
            <tbody>
              {/* PHLEBITIS */}
              <tr>
                <td className="border border-black py-0.5 px-1.5 font-bold text-left align-middle" rowSpan={3}>PHLEBITIS</td>
                <td className="border border-black py-0.5 px-1.5 text-left">Total hari pemasangan</td>
                <td className="border border-black py-0.5 px-1.5">{phlebitis.m1.days}</td>
                <td className="border border-black py-0.5 px-1.5">{phlebitis.m2.days}</td>
                <td className="border border-black py-0.5 px-1.5">{phlebitis.m3.days}</td>
                <td className="border border-black py-0.5 px-1.5">{phlebitis.total.days}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-1.5 text-left">Infeksi</td>
                <td className="border border-black py-0.5 px-1.5">{phlebitis.m1.cases}</td>
                <td className="border border-black py-0.5 px-1.5">{phlebitis.m2.cases}</td>
                <td className="border border-black py-0.5 px-1.5">{phlebitis.m3.cases}</td>
                <td className="border border-black py-0.5 px-1.5">{phlebitis.total.cases}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-1.5 text-left">Rate In ‰</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(phlebitis.m1.rate)} ‰</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(phlebitis.m2.rate)} ‰</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(phlebitis.m3.rate)} ‰</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(phlebitis.total.rate)} ‰</td>
              </tr>

              {/* ISK */}
              <tr>
                <td className="border border-black py-0.5 px-1.5 font-bold text-left align-middle" rowSpan={3}>ISK</td>
                <td className="border border-black py-0.5 px-1.5 text-left">Total hari pemasangan</td>
                <td className="border border-black py-0.5 px-1.5">{isk.m1.days}</td>
                <td className="border border-black py-0.5 px-1.5">{isk.m2.days}</td>
                <td className="border border-black py-0.5 px-1.5">{isk.m3.days}</td>
                <td className="border border-black py-0.5 px-1.5">{isk.total.days}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-1.5 text-left">Infeksi</td>
                <td className="border border-black py-0.5 px-1.5">{isk.m1.cases}</td>
                <td className="border border-black py-0.5 px-1.5">{isk.m2.cases}</td>
                <td className="border border-black py-0.5 px-1.5">{isk.m3.cases}</td>
                <td className="border border-black py-0.5 px-1.5">{isk.total.cases}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-1.5 text-left">Rate In ‰</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(isk.m1.rate)}‰</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(isk.m2.rate)}‰</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(isk.m3.rate)}‰</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(isk.total.rate)}‰</td>
              </tr>

              {/* DECUBITUS */}
              <tr>
                <td className="border border-black py-0.5 px-1.5 font-bold text-left align-middle" rowSpan={3}>Decubitus</td>
                <td className="border border-black py-0.5 px-1.5 text-left">Total hari tirah baring</td>
                <td className="border border-black py-0.5 px-1.5">{decubitus.m1.days}</td>
                <td className="border border-black py-0.5 px-1.5">{decubitus.m2.days}</td>
                <td className="border border-black py-0.5 px-1.5">{decubitus.m3.days}</td>
                <td className="border border-black py-0.5 px-1.5">{decubitus.total.days}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-1.5 text-left">Infeksi</td>
                <td className="border border-black py-0.5 px-1.5">{decubitus.m1.cases}</td>
                <td className="border border-black py-0.5 px-1.5">{decubitus.m2.cases}</td>
                <td className="border border-black py-0.5 px-1.5">{decubitus.m3.cases}</td>
                <td className="border border-black py-0.5 px-1.5">{decubitus.total.cases}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-1.5 text-left">Rate In ‰</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(decubitus.m1.rate)}‰</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(decubitus.m2.rate)}‰</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(decubitus.m3.rate)}‰</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(decubitus.total.rate)}‰</td>
              </tr>

              {/* VAP */}
              <tr>
                <td className="border border-black py-0.5 px-1.5 font-bold text-left align-middle" rowSpan={3}>VAP</td>
                <td className="border border-black py-0.5 px-1.5 text-left">Total hari pemasangan</td>
                <td className="border border-black py-0.5 px-1.5">{vap.m1.days}</td>
                <td className="border border-black py-0.5 px-1.5">{vap.m2.days}</td>
                <td className="border border-black py-0.5 px-1.5">{vap.m3.days}</td>
                <td className="border border-black py-0.5 px-1.5">{vap.total.days}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-1.5 text-left">Infeksi</td>
                <td className="border border-black py-0.5 px-1.5">{vap.m1.cases}</td>
                <td className="border border-black py-0.5 px-1.5">{vap.m2.cases}</td>
                <td className="border border-black py-0.5 px-1.5">{vap.m3.cases}</td>
                <td className="border border-black py-0.5 px-1.5">{vap.total.cases}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-1.5 text-left">Rate In ‰</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(vap.m1.rate)}‰</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(vap.m2.rate)}‰</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(vap.m3.rate)}‰</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(vap.total.rate)}‰</td>
              </tr>

              {/* IDO (4 rows matching Word document) */}
              <tr>
                <td className="border border-black py-0.5 px-1.5 font-bold text-left align-middle" rowSpan={4}>IDO</td>
                <td className="border border-black py-0.5 px-1.5 text-center font-bold" colSpan={5}>
                  TINDAKAN OPERASI DI IBS
                </td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-1.5 text-left">Total Operasi</td>
                <td className="border border-black py-0.5 px-1.5">{ido.m1.days}</td>
                <td className="border border-black py-0.5 px-1.5">{ido.m2.days}</td>
                <td className="border border-black py-0.5 px-1.5">{ido.m3.days}</td>
                <td className="border border-black py-0.5 px-1.5">{ido.total.days}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-1.5 text-left">Infeksi</td>
                <td className="border border-black py-0.5 px-1.5">{ido.m1.cases}</td>
                <td className="border border-black py-0.5 px-1.5">{ido.m2.cases}</td>
                <td className="border border-black py-0.5 px-1.5">{ido.m3.cases}</td>
                <td className="border border-black py-0.5 px-1.5">{ido.total.cases}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-1.5 text-left">Rate In %</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(ido.m1.rate)}%</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(ido.m2.rate)} %</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(ido.m3.rate)}%</td>
                <td className="border border-black py-0.5 px-1.5">{fmtComma(ido.total.rate)} %</td>
              </tr>
            </tbody>
          </table>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 5: GRAFIK.1 HAIs & 2. PHLEBITIS + GRAFIK.2        */}
      {/* ========================================================= */}
      <F4Page pageNumber={5} totalPages={totalPages}>
        <div className="text-[12pt] leading-[1.5] text-justify font-normal text-black">
          <p className="text-center font-bold mb-1">
            Grafik.1 Incident Rate HAIs UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

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

          <p className="font-bold mt-2">Analisa :</p>
          <p className="mb-3">
            Berdasarkan grafik diatas menunjukkan bahwa insiden rate HAIs Triwulan {qData.quarterRoman} yang paling tinggi kejadian HAIs yaitu di bulan {highestPhleb.name} yaitu {fmtComma(highestPhleb.rate)}‰, jumlah hari terpasang alat {highestPhleb.days} dengan {highestPhleb.cases} kejadian phlebitis. Sedangkan kejadian infeksi HAIs yang lainnya tidak ada kejadian infeksi.
          </p>

          <div className="flex items-start font-bold mb-1">
            <span className="w-6 flex-shrink-0">2.</span>
            <span>Angka Kejadian (Incidence Rate) Phlebitis</span>
          </div>
          <p className="pl-6 mb-2">
            Angka Kejadian (incidence Rate) Phlebitis per 1000 hari pemakaian intra vascular line (‰) pada bulan {m1.monthName} - {m3.monthName} {reportYear}, berdasarkan Visual Infusion Phlebitis Score (VIPS) score 2.
          </p>

          <p className="text-center font-bold mb-1">
            Grafik.2 Insidence Rate Phlebitis Di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

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
            height={140}
          />
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 6: ANALISA PHLEBITIS, RTL & TABEL 2 PHLEBITIS     */}
      {/* ========================================================= */}
      <F4Page pageNumber={6} totalPages={totalPages}>
        <div className="text-[12pt] leading-[1.5] text-justify font-normal text-black">
          <p className="font-bold">Analisa :</p>
          <p className="mb-3">
            Berdasarkan grafik diatas menunjukkan bahwa insiden rate phlebitis {qData.quarterLabel} periode {m1.monthName} - {m3.monthName} {reportYear}, angka infeksi tertinggi ada di bulan {highestPhleb.name} yaitu {fmtComma(highestPhleb.rate)}‰, angka infeksi terendah ada di bulan {lowestPhleb.name} yaitu {fmtComma(lowestPhleb.rate)}‰. Belum mencapai target standar kemenkes ≤ 1 ‰. Phlebitis terjadi kemungkinan karena kurangnya penerapan SPO Bundles / pencegahan phlebitis, pemilihan IV catheter tidak sesuai ukuran vena, pemillihan dressing IV tidak sesuai regulasi, perawatan insersi infus kurang adekuat, kondisi pasien immunocompromised, pemberian obat-obatan parenteral konsentrat tinggi, personal hygiene kurang, penyakit sekunder dan lain-lainnya.
          </p>

          <p className="font-bold mb-1">Rencana tindak lanjut :</p>
          <div className="pl-6 space-y-0.5 mb-5">
            <div className="flex items-start">
              <span className="w-6 flex-shrink-0">a.</span>
              <span>Lengkapi fasilitas pencegahan phlebitis</span>
            </div>
            <div className="flex items-start">
              <span className="w-6 flex-shrink-0">b.</span>
              <span>Re sosialisasi SPO pencegahan phlebitis</span>
            </div>
            <div className="flex items-start">
              <span className="w-6 flex-shrink-0">c.</span>
              <span>Monitoring evaluasi penerapan SPO pencegahan phlebitis</span>
            </div>
            <div className="flex items-start">
              <span className="w-6 flex-shrink-0">d.</span>
              <span>Berikan feed back kepatuhan SPO dan angka kejadian phlebitis</span>
            </div>
          </div>

          <p className="text-center font-bold mb-2">
            Tabel 2. Insidence Rate Phlebitis Di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

          <table className="w-full border-collapse border border-black text-center text-[11pt] leading-[1.35]">
            <thead>
              <tr className="font-bold">
                <th className="border border-black py-1 px-2 w-1/3">INDIKATOR</th>
                <th className="border border-black py-1 px-2" colSpan={3}>BULAN</th>
              </tr>
              <tr className="font-bold">
                <th className="border border-black py-1 px-2"></th>
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
              </tr>
              <tr>
                <td className="border border-black py-1 px-2 text-left">Phlebitis</td>
                <td className="border border-black py-1 px-2">{phlebitis.m1.cases}</td>
                <td className="border border-black py-1 px-2">{phlebitis.m2.cases}</td>
                <td className="border border-black py-1 px-2">{phlebitis.m3.cases}</td>
              </tr>
              <tr>
                <td className="border border-black py-1 px-2 text-left">‰</td>
                <td className="border border-black py-1 px-2">{fmtComma(phlebitis.m1.rate)}‰</td>
                <td className="border border-black py-1 px-2">{fmtComma(phlebitis.m2.rate)} ‰</td>
                <td className="border border-black py-1 px-2">{fmtComma(phlebitis.m3.rate)} ‰</td>
              </tr>
            </tbody>
          </table>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 7: 3. ISK & 4. DECUBITUS                          */}
      {/* ========================================================= */}
      <F4Page pageNumber={7} totalPages={totalPages}>
        <div className="text-[12pt] leading-[1.45] text-justify font-normal text-black">
          <div className="flex items-start font-bold mb-0.5">
            <span className="w-6 flex-shrink-0">3.</span>
            <span>Angka Kejadian (Incidence Rate) Infeksi Saluran Kemih (ISK)</span>
          </div>
          <p className="pl-6 mb-1.5">
            Angka Kejadian (incidence Rate) Infeksi Saluran Kemih (ISK) per 1000 hari pemakaian alat (‰) di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

          <p className="text-center font-bold mb-1">
            Grafik 3. Insidence Rate Infeksi Saluran Kemih Di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

          <WordStyleLineChart
            categories={chartMonthLabels}
            series={[
              { name: 'ISK', color: '#4f81bd', values: [isk.m1.cases, isk.m2.cases, isk.m3.cases] },
              { name: '‰', color: '#ed7d31', values: [isk.m1.rate, isk.m2.rate, isk.m3.rate] },
              { name: 'Target', color: '#a5a5a5', values: [4.7, 4.7, 4.7] },
            ]}
            maxY={6}
            height={110}
          />

          <p className="font-bold">Analisa :</p>
          <p className="mb-1.5">
            Berdasarkan grafik diatas menunjukkan bahwa insiden rate ISK selama {qData.periodLabel}, tidak ada kejadian Infeksi Saluran Kemih.
          </p>

          <p className="text-center font-bold mb-1">
            Tabel 3. Infeksi Saluran Kemih (ISK) per 1000 Hari Pemakaian Alat (‰) di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

          <table className="w-full border-collapse border border-black text-center text-[10.5pt] leading-[1.2] mb-3">
            <thead>
              <tr className="font-bold">
                <th className="border border-black py-0.5 px-2 w-1/3">INDIKATOR</th>
                <th className="border border-black py-0.5 px-2" colSpan={3}>BULAN</th>
              </tr>
              <tr className="font-bold">
                <th className="border border-black py-0.5 px-2"></th>
                <th className="border border-black py-0.5 px-2">{m1.shortName}</th>
                <th className="border border-black py-0.5 px-2">{m2.shortName}</th>
                <th className="border border-black py-0.5 px-2">{m3.shortName}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black py-0.5 px-2 text-left">Hari terpasang alat</td>
                <td className="border border-black py-0.5 px-2">{isk.m1.days}</td>
                <td className="border border-black py-0.5 px-2">{isk.m2.days}</td>
                <td className="border border-black py-0.5 px-2">{isk.m3.days}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-2 text-left">‰</td>
                <td className="border border-black py-0.5 px-2">{fmtComma(isk.m1.rate)}‰</td>
                <td className="border border-black py-0.5 px-2">{fmtComma(isk.m2.rate)}‰</td>
                <td className="border border-black py-0.5 px-2">{fmtComma(isk.m3.rate)}‰</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-2 text-left">Target</td>
                <td className="border border-black py-0.5 px-2">4.7‰</td>
                <td className="border border-black py-0.5 px-2">4.7‰</td>
                <td className="border border-black py-0.5 px-2">4.7‰</td>
              </tr>
            </tbody>
          </table>

          <div className="flex items-start font-bold mb-1">
            <span className="w-6 flex-shrink-0">4.</span>
            <span>Angka Kejadian (Incidence Rate) Decubitus</span>
          </div>

          <p className="text-center font-bold mb-1">
            Grafik. 4 Insidence Rate Infeksi Decubitus Di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

          <WordStyleLineChart
            categories={chartMonthLabels}
            series={[
              { name: 'Decubitus', color: '#4f81bd', values: [decubitus.m1.cases, decubitus.m2.cases, decubitus.m3.cases] },
              { name: '‰', color: '#ed7d31', values: [decubitus.m1.rate, decubitus.m2.rate, decubitus.m3.rate] },
              { name: 'Target', color: '#a5a5a5', values: [1, 1, 1] },
            ]}
            maxY={2}
            height={110}
          />

          <p className="font-bold">Analisa :</p>
          <p className="mb-1.5">
            Berdasarkan grafik diatas menunjukkan bahwa insiden rate Decubitus selama {qData.periodLabel}, tidak ada kejadian decubitus.
          </p>

          <p className="text-center font-bold mb-1">
            Tabel 4. Infeksi Decubitus per 1000 Hari Tirah Baring (‰) di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

          <table className="w-full border-collapse border border-black text-center text-[10.5pt] leading-[1.2]">
            <thead>
              <tr className="font-bold">
                <th className="border border-black py-0.5 px-2 w-1/3">INDIKATOR</th>
                <th className="border border-black py-0.5 px-2" colSpan={3}>BULAN</th>
              </tr>
              <tr className="font-bold">
                <th className="border border-black py-0.5 px-2"></th>
                <th className="border border-black py-0.5 px-2">{m1.shortName}</th>
                <th className="border border-black py-0.5 px-2">{m2.shortName}</th>
                <th className="border border-black py-0.5 px-2">{m3.shortName}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black py-0.5 px-2 text-left">Tirah baring</td>
                <td className="border border-black py-0.5 px-2">{decubitus.m1.days}</td>
                <td className="border border-black py-0.5 px-2">{decubitus.m2.days}</td>
                <td className="border border-black py-0.5 px-2">{decubitus.m3.days}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-2 text-left">Infeksi Decubitus</td>
                <td className="border border-black py-0.5 px-2">{decubitus.m1.cases}</td>
                <td className="border border-black py-0.5 px-2">{decubitus.m2.cases}</td>
                <td className="border border-black py-0.5 px-2">{decubitus.m3.cases}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-2 text-left">‰</td>
                <td className="border border-black py-0.5 px-2">{fmtComma(decubitus.m1.rate)} ‰</td>
                <td className="border border-black py-0.5 px-2">{fmtComma(decubitus.m2.rate)} ‰</td>
                <td className="border border-black py-0.5 px-2">{fmtComma(decubitus.m3.rate)} ‰</td>
              </tr>
            </tbody>
          </table>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 8: 5. VAP & 6. IDO                                */}
      {/* ========================================================= */}
      <F4Page pageNumber={8} totalPages={totalPages}>
        <div className="text-[12pt] leading-[1.45] text-justify font-normal text-black">
          <div className="flex items-start font-bold mb-0.5">
            <span className="w-6 flex-shrink-0">5.</span>
            <span>Angka Kejadian (Incident Rate) Ventilator Associated Pneumonia (VAP)</span>
          </div>
          <p className="pl-6 mb-1.5">
            Angka Kejadian (incidence Rate) Ventilator Associated Pneumonia (VAP) per 1000 pemakaian alat (‰) di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

          <p className="text-center font-bold mb-1">
            Grafik. 5 Insidence Rate Ventilator Associated Pneumonia (VAP) Di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

          <WordStyleLineChart
            categories={chartMonthLabels}
            series={[
              { name: 'VAP', color: '#4f81bd', values: [vap.m1.cases, vap.m2.cases, vap.m3.cases] },
              { name: '‰', color: '#ed7d31', values: [vap.m1.rate, vap.m2.rate, vap.m3.rate] },
              { name: 'Target', color: '#a5a5a5', values: [5.8, 5.8, 5.8] },
            ]}
            maxY={7}
            height={110}
          />

          <p className="font-bold">Analisa :</p>
          <p className="mb-1.5">
            Berdasarkan grafik diatas menunjukkan bahwa insiden rate VAP selama {qData.periodLabel}, tidak ada kejadian infeksi.
          </p>

          <p className="text-center font-bold mb-1">
            Tabel.5 Infeksi Ventilator Associated Pneumonia (VAP) Di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

          <table className="w-full border-collapse border border-black text-center text-[10.5pt] leading-[1.2] mb-3">
            <thead>
              <tr className="font-bold">
                <th className="border border-black py-0.5 px-2 w-1/3">INDIKATOR</th>
                <th className="border border-black py-0.5 px-2" colSpan={3}>BULAN</th>
              </tr>
              <tr className="font-bold">
                <th className="border border-black py-0.5 px-2"></th>
                <th className="border border-black py-0.5 px-2">{m1.shortName}</th>
                <th className="border border-black py-0.5 px-2">{m2.shortName}</th>
                <th className="border border-black py-0.5 px-2">{m3.shortName}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black py-0.5 px-2 text-left">Jumlah pasien memakai ventilator</td>
                <td className="border border-black py-0.5 px-2">{vap.m1.days}</td>
                <td className="border border-black py-0.5 px-2">{vap.m2.days}</td>
                <td className="border border-black py-0.5 px-2">{vap.m3.days}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-2 text-left">VAP</td>
                <td className="border border-black py-0.5 px-2">{vap.m1.cases}</td>
                <td className="border border-black py-0.5 px-2">{vap.m2.cases}</td>
                <td className="border border-black py-0.5 px-2">{vap.m3.cases}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-2 text-left">Rate In (%)</td>
                <td className="border border-black py-0.5 px-2">{fmtComma(vap.m1.rate)}%</td>
                <td className="border border-black py-0.5 px-2">{fmtComma(vap.m2.rate)} %</td>
                <td className="border border-black py-0.5 px-2">{fmtComma(vap.m3.rate)} %</td>
              </tr>
            </tbody>
          </table>

          <div className="flex items-start font-bold mb-0.5">
            <span className="w-6 flex-shrink-0">6.</span>
            <span>Angka Kejadian (Incident Rate) Infeksi Darah Operasi (IDO)</span>
          </div>
          <p className="pl-6 mb-1.5">
            Angka Kejadian (incidence Rate) Infeksi Daerah Operasi di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

          <p className="text-center font-bold mb-1">
            Grafik. 6 Insidence Rate Infeksi Daerah Operasi (IDO) Di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

          <WordStyleLineChart
            categories={chartMonthLabels}
            series={[
              { name: 'IDO', color: '#4f81bd', values: [ido.m1.cases, ido.m2.cases, ido.m3.cases] },
              { name: '%', color: '#ed7d31', values: [ido.m1.rate, ido.m2.rate, ido.m3.rate] },
              { name: 'Target', color: '#a5a5a5', values: [2, 2, 2] },
            ]}
            maxY={3}
            height={110}
          />

          <p className="font-bold">Analisa :</p>
          <p className="mb-1.5">
            Berdasarkan grafik diatas menunjukkan bahwa insiden rate IDO {qData.periodLabel} tidak ada kejadian IDO.
          </p>

          <p className="text-center font-bold mb-1">
            Tabel. 6 Infeksi Daerah Operasi di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

          <table className="w-full border-collapse border border-black text-center text-[10.5pt] leading-[1.2]">
            <thead>
              <tr className="font-bold">
                <th className="border border-black py-0.5 px-2 w-1/3">INDIKATOR</th>
                <th className="border border-black py-0.5 px-2" colSpan={3}>BULAN</th>
              </tr>
              <tr className="font-bold">
                <th className="border border-black py-0.5 px-2"></th>
                <th className="border border-black py-0.5 px-2">{m1.shortName}</th>
                <th className="border border-black py-0.5 px-2">{m2.shortName}</th>
                <th className="border border-black py-0.5 px-2">{m3.shortName}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black py-0.5 px-2 text-left">Jumlah pasien di Operasi</td>
                <td className="border border-black py-0.5 px-2">{ido.m1.days}</td>
                <td className="border border-black py-0.5 px-2">{ido.m2.days}</td>
                <td className="border border-black py-0.5 px-2">{ido.m3.days}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-2 text-left">Infeksi IDO</td>
                <td className="border border-black py-0.5 px-2">{ido.m1.cases}</td>
                <td className="border border-black py-0.5 px-2">{ido.m2.cases}</td>
                <td className="border border-black py-0.5 px-2">{ido.m3.cases}</td>
              </tr>
              <tr>
                <td className="border border-black py-0.5 px-2 text-left">Rate In (%)</td>
                <td className="border border-black py-0.5 px-2">{fmtComma(ido.m1.rate)} %</td>
                <td className="border border-black py-0.5 px-2">{fmtComma(ido.m2.rate)} %</td>
                <td className="border border-black py-0.5 px-2">{fmtComma(ido.m3.rate)} %</td>
              </tr>
            </tbody>
          </table>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 9: B. AUDIT HAND HYGIENE DAN APD (HAND HYGIENE)   */}
      {/* ========================================================= */}
      <F4Page pageNumber={9} totalPages={totalPages}>
        <div className="text-[12pt] leading-[1.5] text-justify font-normal text-black">
          <div className="flex items-start font-bold mb-2">
            <span className="w-6 flex-shrink-0">B.</span>
            <span>AUDIT HAND HYGIENE DAN APD</span>
          </div>

          <div className="flex items-start font-bold pl-6 mb-2">
            <span className="w-6 flex-shrink-0">1.</span>
            <span>Kepatuhan Kebersihan Tangan / Hand Hygiene</span>
          </div>

          <p className="text-center font-bold mb-1">
            Grafik 1. Kepatuhan Hand Hygiene di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

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
            height={160}
            xAxisSubLabel="Profesi"
          />

          <p className="font-bold mt-2">Analisa :</p>
          <p className="mb-3">
            Berdasarkan grafik diatas menunjukkan bahwa kepatuhan hand hygiene {qData.quarterLabel} periode {m1.monthName} - {m3.monthName} {reportYear}, angka kepatuhan tertinggi ada di bulan {m2.monthName} yaitu di profesi Dokter {dokterRow.m2.rate}%, Profesi Perawat/Bidan dengan angka kepatuhan mencapai {perawatRow.m2.rate}%, kemudian di susul oleh Nakes lainnya dengan angka kepatuhan {nakesRow.m2.rate}%. Angka kepatuhan Hand Hygiene di RSUD Al-Mulk belum mencapai target yang di inginkan yaitu 85%.
          </p>

          <p className="font-bold mb-1">Rencana tindak lanjut :</p>
          <div className="pl-6 space-y-1">
            <div className="flex items-start">
              <span className="w-6 flex-shrink-0">1.</span>
              <span>Pertahankan angka kepatuhan Hand Hygiene yang sudah mencapai standar kemenkes</span>
            </div>
            <div className="flex items-start">
              <span className="w-6 flex-shrink-0">2.</span>
              <span>Reedukasi 6 langkah kebersihan tangan</span>
            </div>
            <div className="flex items-start">
              <span className="w-6 flex-shrink-0">3.</span>
              <span>Lakukan monitoring evaluasi kepatuhan dan demonstrasikan langkah-langkah cuci tangan</span>
            </div>
            <div className="flex items-start">
              <span className="w-6 flex-shrink-0">4.</span>
              <span>Motivasi staf untuk melakukan Hand Hygiene berdasarkan 5 moment, khususnya petugas medis</span>
            </div>
            <div className="flex items-start">
              <span className="w-6 flex-shrink-0">5.</span>
              <span>Berikan feed back hasil monitoring</span>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 10: TABEL 1 HAND HYGIENE & 2. AUDIT APD           */}
      {/* ========================================================= */}
      <F4Page pageNumber={10} totalPages={totalPages}>
        <div className="text-[12pt] leading-[1.5] text-justify font-normal text-black">
          <p className="text-center font-bold mb-2">
            Tabel 1. Kepatuhan Hand Hygiene {qData.periodLabel}, berdasarkan profesi
          </p>

          <table className="w-full border-collapse border border-black text-center text-[10.5pt] leading-[1.3] mb-5">
            <thead>
              <tr className="font-bold">
                <th className="border border-black py-1 px-2 w-[28%]" rowSpan={2}>Ruangan</th>
                <th className="border border-black py-1 px-2" colSpan={3}>{m1.shortName}</th>
                <th className="border border-black py-1 px-2" colSpan={3}>{m2.shortName}</th>
                <th className="border border-black py-1 px-2" colSpan={3}>{m3.shortName}</th>
              </tr>
              <tr className="font-bold">
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
                  <td className="border border-black py-1 px-2 text-left">{p.profession}</td>
                  <td className="border border-black py-1 px-1">{p.m1.opp}</td>
                  <td className="border border-black py-1 px-1">{p.m1.hh}</td>
                  <td className="border border-black py-1 px-1">{p.m1.rate}%</td>
                  <td className="border border-black py-1 px-1">{p.m2.opp}</td>
                  <td className="border border-black py-1 px-1">{p.m2.hh}</td>
                  <td className="border border-black py-1 px-1">{p.m2.rate}%</td>
                  <td className="border border-black py-1 px-1">{p.m3.opp}</td>
                  <td className="border border-black py-1 px-1">{p.m3.hh}</td>
                  <td className="border border-black py-1 px-1">{p.m3.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-start font-bold pl-6 mb-2">
            <span className="w-6 flex-shrink-0">2.</span>
            <span>Kepatuhan Penggunaan Alat Perlindungan Diri (APD)</span>
          </div>

          <p className="text-center font-bold mb-1">
            Grafik 2. Kepatuhan Penggunaan APD di UOBK RSUD Al-Mulk {qData.periodLabel}
          </p>

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
            height={155}
          />

          <p className="font-bold mt-2">Analisa :</p>
          <p>
            Berdasarkan grafik diatas menunjukkan bahwa angka kepatuhan penggunaan APD {qData.periodLabel}, mencapai {fmtComma(qData.apdOverallRate)}%, belum sesuai standar kemenkes yaitu 100%. Hal ini disebabkan oleh beberpa faktor antara lain masih kurangnya kesadaran dan kepatuhan tenaga kesehatan dalam penggunaan APD secara konsisten, keterbatasan ketersediaan APD pada waktu tertentu, kurangnya optimalnya pengawasan dan monitoring di unit pelayanan, serta belum maksimalnya sosialisasi dan edukasi terkait pentingnya penggunaan APD sesuai standar.
          </p>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 11: C. REKOMENDASI DAN TINDAK LANJUT (BAGIAN 1)   */}
      {/* ========================================================= */}
      <F4Page pageNumber={11} totalPages={totalPages}>
        <div className="text-[12pt] leading-[1.5] text-justify font-normal text-black">
          <div className="flex items-start font-bold mb-2">
            <span className="w-6 flex-shrink-0">C.</span>
            <span>Rekomendasi dan Tindak Lanjut</span>
          </div>

          <div className="pl-6">
            <div className="flex items-start font-bold mb-1">
              <span className="w-6 flex-shrink-0">1.</span>
              <span>Rekomendasi dari hasil audit Surveilans</span>
            </div>

            <div className="pl-6 space-y-2 mb-3">
              <div>
                <div className="flex items-start font-bold">
                  <span className="w-6 flex-shrink-0">a.</span>
                  <span>Phlebitis</span>
                </div>
                <p className="pl-6 mb-1">
                  Tetap mempertahankan prosedur teknik memasang infus yang benar yaitu dengan cara :
                </p>
                <div className="pl-6 space-y-0.5">
                  <div className="flex items-start">
                    <span className="w-6 flex-shrink-0">1.</span>
                    <span>Kebersihan tangan selalu dilakukan pada 5 moment cuci tangan, salah satunya sebelum melakukan tindakan aseptik, seperti memasang infus.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-6 flex-shrink-0">2.</span>
                    <span>Memakai APD sesuai tindakan yang dilakukan,</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-6 flex-shrink-0">3.</span>
                    <span>Pemilihan lokasi insersi yang tepat,</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-6 flex-shrink-0">4.</span>
                    <span>Pemberian elektrolit yang bersifat asam atau alkali memudahkan terjadinya extravasasi dan infiltrasi sebaiknya diberikan per drip, pemberian larutan infus dengan osmolaritas &gt; 900 m Osm/l sebaiknya diberikan melalui CVC.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-6 flex-shrink-0">5.</span>
                    <span>Edukasi petugas tentang pemasangan dan perawatan IV kateter</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-6 flex-shrink-0">6.</span>
                    <span>Lakukan desinfeksi area konektor tempat menyuntik sebelum pemberian terapi atau cairan.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-6 flex-shrink-0">7.</span>
                    <span>Sesegera mungkin melepaskan kateter IV bila sudah tidak diperlukan.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-6 flex-shrink-0">8.</span>
                    <span>Gunakan transparan dressing untuk memudahkan mengobservasi iv catheter.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-6 flex-shrink-0">9.</span>
                    <span>Menerapkan bundle HAIs</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start font-bold">
                  <span className="w-6 flex-shrink-0">b.</span>
                  <span>Infeksi Saluran Kemih (ISK)</span>
                </div>
                <p className="pl-6">{qData.quarterLabel} tidak ada kejadian ISK</p>
              </div>

              <div>
                <div className="flex items-start font-bold">
                  <span className="w-6 flex-shrink-0">c.</span>
                  <span>Infeksi Decubitus</span>
                </div>
                <p className="pl-6">{qData.quarterLabel} tidak ada kejadian Decubitus</p>
              </div>

              <div>
                <div className="flex items-start font-bold">
                  <span className="w-6 flex-shrink-0">d.</span>
                  <span>Infeksi Ventilator Associated Pneumonia (VAP)</span>
                </div>
                <p className="pl-6">{qData.quarterLabel} tidak ada infeksi akibat pemasangan Ventilator</p>
              </div>

              <div>
                <div className="flex items-start font-bold">
                  <span className="w-6 flex-shrink-0">e.</span>
                  <span>Infeksi Daerah Operasi (IDO)</span>
                </div>
                <p className="pl-6">{qData.quarterLabel} tdak ada kejadian IDO</p>
              </div>
            </div>

            <div className="flex items-start font-bold mb-1">
              <span className="w-6 flex-shrink-0">2.</span>
              <span>Rekomendasi dari hasil audit Hand Hygiene dan APD</span>
            </div>

            <div className="pl-6">
              <div className="flex items-start font-bold">
                <span className="w-6 flex-shrink-0">a.</span>
                <span>Hand Hygiene</span>
              </div>
              <div className="pl-6 space-y-0.5">
                <div className="flex items-start">
                  <span className="w-6 flex-shrink-0">1.</span>
                  <span>Edukasi staf tentang pentingnya Hand Hygiene</span>
                </div>
                <div className="flex items-start">
                  <span className="w-6 flex-shrink-0">2.</span>
                  <span>Motivasi staf untuk melakukan Hand Hygiene berdasarkan 5 moment, khususnya petugas medis</span>
                </div>
                <div className="flex items-start">
                  <span className="w-6 flex-shrink-0">3.</span>
                  <span>Lakukan monitoring evaluasi dan demonstrasikan langkah-langkah cuci tangan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 12: REKOMENDASI APD, TINDAK LANJUT & TANDA TANGAN */}
      {/* ========================================================= */}
      <F4Page pageNumber={12} totalPages={totalPages}>
        <div className="text-[12pt] leading-[1.5] text-justify font-normal text-black">
          <div className="pl-12 mb-4">
            <div className="flex items-start font-bold">
              <span className="w-6 flex-shrink-0">b.</span>
              <span>APD</span>
            </div>
            <div className="pl-6 space-y-0.5">
              <div className="flex items-start">
                <span className="w-6 flex-shrink-0">1.</span>
                <span>Edukasi petugas tentang pentingnya penggunaan APD untuk keselamatan staf dan pasien</span>
              </div>
              <div className="flex items-start">
                <span className="w-6 flex-shrink-0">2.</span>
                <span>Fasilitasi APD lengkap di setiap unit</span>
              </div>
              <div className="flex items-start">
                <span className="w-6 flex-shrink-0">3.</span>
                <span>Lakukan monitoring evaluasi dan demonstrasikan urutan pemakaian dan pelepasan APD yang benar</span>
              </div>
              <div className="flex items-start">
                <span className="w-6 flex-shrink-0">4.</span>
                <span>Memfasilitasi poster tata cara pemakaian dan pelepasan APD yang benar sesuai kaidah PPI di setiap unit.</span>
              </div>
              <div className="flex items-start">
                <span className="w-6 flex-shrink-0">5.</span>
                <span>Pertahankan nilai kepatuhan penggunaan APD</span>
              </div>
            </div>
          </div>

          <div className="pl-6 mb-10">
            <div className="flex items-start font-bold mb-1">
              <span className="w-6 flex-shrink-0">3.</span>
              <span>Tindak Lanjut</span>
            </div>
            <p className="pl-6">
              Menyampaikan hasil surveilans HAIs ini ke Direktur UOBK RSUD Al-Mulk, Ketua Tim Mutu dan berkoordinasi dengan seluruh kepala unit.
            </p>
          </div>

          {/* Lembar Tanda Tangan Resmi Dokumen Triwulan */}
          <div className="w-full mt-8">
            <p className="text-right text-[12pt] mb-6">
              Sukabumi, 10 {signMonthName} {signYear}
            </p>

            <table className="w-full border-none text-[12pt] leading-[1.4]">
              <tbody>
                <tr className="text-center">
                  <td className="w-1/2 align-top pb-20">
                    Penyusun ,
                  </td>
                  <td className="w-1/2 align-top pb-20">
                    Mengetahui
                  </td>
                </tr>
                <tr className="text-center">
                  <td className="align-bottom">
                    <p className="underline font-bold">Adi Tresa Purnama, A.M.Kep</p>
                    <p>Infection Prefention Control Nurse</p>
                  </td>
                  <td className="align-bottom">
                    <p className="underline font-bold">dr. Nurul Iman</p>
                    <p>Ketua PPI</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </F4Page>
    </div>
  );
}

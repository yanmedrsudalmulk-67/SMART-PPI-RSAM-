import React from 'react';
import F4Page from '../F4Page';
import OfficialModernBarChart from '../OfficialModernBarChart';
import OfficialComparisonLineChart from '../OfficialComparisonLineChart';
import { OfficialReportData } from '@/hooks/useOfficialReportData';

interface AnnualPagesProps {
  year: number;
  reportData?: OfficialReportData;
}

export default function AnnualPages21to30({ year, reportData }: AnnualPagesProps) {
  // Baseline HAIs 12 Bulan data (Phlebitis)
  const phlebitisMonthly = [
    { bulan: 'Jan', infus: 1027, kasus: 7, rate: 6.8 },
    { bulan: 'Feb', infus: 808, kasus: 15, rate: 19.0 },
    { bulan: 'Mar', infus: 647, kasus: 4, rate: 6.1 },
    { bulan: 'Apr', infus: 776, kasus: 12, rate: 15.0 },
    { bulan: 'Mei', infus: 925, kasus: 25, rate: 27.0 },
    { bulan: 'Jun', infus: 1082, kasus: 18, rate: 17.0 },
    { bulan: 'Jul', infus: 1218, kasus: 36, rate: 29.0 },
    { bulan: 'Agt', infus: 1056, kasus: 9, rate: 8.5 },
    { bulan: 'Sep', infus: 1392, kasus: 12, rate: 8.6 },
    { bulan: 'Okt', infus: 893, kasus: 8, rate: 8.9 },
    { bulan: 'Nov', infus: 934, kasus: 3, rate: 3.2 },
    { bulan: 'Des', infus: 1217, kasus: 5, rate: 4.1 },
  ];

  // Tabel 2 Baseline HAIs 12 Bulan data matching Gambar 2
  const defaultInfusRow = [1027, 808, 647, 776, 925, 1082, 1218, 1056, 1392, 893, 934, 1217];
  const defaultPlebitisRow = [7, 15, 4, 12, 25, 18, 36, 9, 12, 8, 3, 5];
  const defaultPlebitisRateRow = ['6,8', '19', '6,1', '15', '27', '17', '29', '8,5', '8,6', '8,9', '3,2', '4,1'];

  const defaultOperasiRow = [37, 40, 34, 73, 56, 40, 39, 63, 49, 51, 50, 43];
  const defaultIdoRow = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const defaultIdoRateRow = ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'];

  const defaultKateterRow = [42, 17, 24, 22, 15, 60, 100, 51, 104, 54, 73, 55];
  const defaultIskRow = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const defaultIskRateRow = ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'];

  const defaultVentilatorRow = [2, 0, 0, 2, 0, 4, 4, 0, 12, 0, 0, 0];
  const defaultVapRow = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const defaultVapRateRow = ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'];

  const defaultTirahBaringRow = [34, 6, 22, 29, 15, 176, 123, 72, 114, 22, 71, 30];
  const defaultDecubitusRow = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const defaultDecubitusRateRow = ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'];

  // Dynamic values or baseline
  const phlebitisSummary = reportData?.hasCustomData && reportData.haisSummary?.phlebitis
    ? reportData.haisSummary.phlebitis
    : { totalCases: 149, totalDaysOrOps: 11984, rate: 12.4 };

  const idoSummary = reportData?.hasCustomData && reportData.haisSummary?.ido
    ? reportData.haisSummary.ido
    : { totalCases: 0, totalDaysOrOps: 184, rate: 0.0 };

  const iskSummary = reportData?.hasCustomData && reportData.haisSummary?.isk
    ? reportData.haisSummary.isk
    : { totalCases: 0, totalDaysOrOps: 948, rate: 0.0 };

  const vapSummary = reportData?.hasCustomData && reportData.haisSummary?.vap
    ? reportData.haisSummary.vap
    : { totalCases: 0, totalDaysOrOps: 112, rate: 0.0 };

  const decubitusSummary = reportData?.hasCustomData && reportData.haisSummary?.decubitus
    ? reportData.haisSummary.decubitus
    : { totalCases: 0, totalDaysOrOps: 345, rate: 0.0 };

  return (
    <>
      {/* ========================================================= */}
      {/* HALAMAN 17: TABEL 2 EVALUASI HAIs (LANDSCAPE F4)         */}
      {/* ========================================================= */}
      <F4Page customPageNumber={17} orientation="landscape" padding="p-[12mm_15mm_12mm_15mm]" contentClassName="overflow-visible">
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <p className="font-bold text-[10.5pt] text-center mb-2">
            Tabel 2. Hasil Evaluasi HAIs tahun {year}
          </p>

          <table className="w-full table-fixed border-collapse border border-black text-center text-[9pt] leading-snug">
            <thead>
              <tr className="bg-[#00a651] text-white font-bold border border-black">
                <th rowSpan={2} className="border border-black p-1.5 w-[4%] text-center align-middle">NO</th>
                <th rowSpan={2} className="border border-black p-1.5 w-[24%] text-center align-middle">VARIABEL</th>
                <th colSpan={12} className="border border-black p-1 text-center font-bold">BULAN</th>
              </tr>
              <tr className="bg-[#00a651] text-white font-bold border border-black text-[8.5pt]">
                {['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGUST', 'SEP', 'OKT', 'NOV', 'DES'].map((m) => (
                  <th key={m} className="border border-black p-1 text-center font-bold w-[6%]">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 1. Infus / Plebitis */}
              <tr className="border border-black">
                <td rowSpan={3} className="border border-black font-bold p-1 text-center align-middle">1</td>
                <td className="border border-black p-1 text-left font-medium">Juml. Hari terpasang infus</td>
                {defaultInfusRow.map((val, i) => (
                  <td key={i} className="border border-black p-1 text-center">{val}</td>
                ))}
              </tr>
              <tr className="border border-black">
                <td className="border border-black p-1 text-left font-medium">Terjadi Plebitis</td>
                {defaultPlebitisRow.map((val, i) => (
                  <td key={i} className="border border-black p-1 text-center">{val}</td>
                ))}
              </tr>
              <tr className="border border-black">
                <td className="border border-black p-1 text-left font-medium">HAI&apos;s ( ‰ )</td>
                {defaultPlebitisRateRow.map((val, i) => (
                  <td key={i} className="border border-black p-1 text-center">{val}</td>
                ))}
              </tr>

              {/* 2. Operasi / IDO */}
              <tr className="border border-black">
                <td rowSpan={3} className="border border-black font-bold p-1 text-center align-middle">2</td>
                <td className="border border-black p-1 text-left font-medium">Juml. Tindakan operasi</td>
                {defaultOperasiRow.map((val, i) => (
                  <td key={i} className="border border-black p-1 text-center">{val}</td>
                ))}
              </tr>
              <tr className="border border-black">
                <td className="border border-black p-1 text-left font-medium">Terjadi IDO</td>
                {defaultIdoRow.map((val, i) => (
                  <td key={i} className="border border-black p-1 text-center">{val}</td>
                ))}
              </tr>
              <tr className="border border-black">
                <td className="border border-black p-1 text-left font-medium">HAI&apos;s ( % )</td>
                {defaultIdoRateRow.map((val, i) => (
                  <td key={i} className="border border-black p-1 text-center">{val}</td>
                ))}
              </tr>

              {/* 3. Kateter / ISK */}
              <tr className="border border-black">
                <td rowSpan={3} className="border border-black font-bold p-1 text-center align-middle">3</td>
                <td className="border border-black p-1 text-left font-medium">Jumlah hari terpasang kateter</td>
                {defaultKateterRow.map((val, i) => (
                  <td key={i} className="border border-black p-1 text-center">{val}</td>
                ))}
              </tr>
              <tr className="border border-black">
                <td className="border border-black p-1 text-left font-medium">Terjadi ISK</td>
                {defaultIskRow.map((val, i) => (
                  <td key={i} className="border border-black p-1 text-center">{val}</td>
                ))}
              </tr>
              <tr className="border border-black">
                <td className="border border-black p-1 text-left font-medium">HAI&apos;s ( % )</td>
                {defaultIskRateRow.map((val, i) => (
                  <td key={i} className="border border-black p-1 text-center">{val}</td>
                ))}
              </tr>

              {/* 4. Ventilator / VAP */}
              <tr className="border border-black">
                <td rowSpan={3} className="border border-black font-bold p-1 text-center align-middle">4</td>
                <td className="border border-black p-1 text-left font-medium">Juml hari terpasang ventilator mekanik</td>
                {defaultVentilatorRow.map((val, i) => (
                  <td key={i} className="border border-black p-1 text-center">{val}</td>
                ))}
              </tr>
              <tr className="border border-black">
                <td className="border border-black p-1 text-left font-medium">Terjadi VAP</td>
                {defaultVapRow.map((val, i) => (
                  <td key={i} className="border border-black p-1 text-center">{val}</td>
                ))}
              </tr>
              <tr className="border border-black">
                <td className="border border-black p-1 text-left font-medium">HAI&apos;s ( ‰ )</td>
                {defaultVapRateRow.map((val, i) => (
                  <td key={i} className="border border-black p-1 text-center">{val}</td>
                ))}
              </tr>

              {/* 5. Tirah Baring / Decubitus */}
              <tr className="border border-black">
                <td rowSpan={3} className="border border-black font-bold p-1 text-center align-middle">5</td>
                <td className="border border-black p-1 text-left font-medium">Juml. Hari tirah baring</td>
                {defaultTirahBaringRow.map((val, i) => (
                  <td key={i} className="border border-black p-1 text-center">{val}</td>
                ))}
              </tr>
              <tr className="border border-black">
                <td className="border border-black p-1 text-left font-medium">Terjadi decubitus</td>
                {defaultDecubitusRow.map((val, i) => (
                  <td key={i} className="border border-black p-1 text-center">{val}</td>
                ))}
              </tr>
              <tr className="border border-black">
                <td className="border border-black p-1 text-left font-medium">HAI&apos;s ( ‰ )</td>
                {defaultDecubitusRateRow.map((val, i) => (
                  <td key={i} className="border border-black p-1 text-center">{val}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 18: GRAFIK 5 PHLEBITIS & ANALISA REKOMENDASI      */}
      {/* ========================================================= */}
      <F4Page customPageNumber={18}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-2 text-justify text-[12pt] leading-[1.5]">
            <p className="font-normal text-[12pt]">a.&nbsp;&nbsp;Grafik kejadian HAIs</p>
            <p className="font-normal text-[12pt] pl-4">1)&nbsp;&nbsp;Phlebitis</p>

            {/* Line chart with attached data table */}
            <div className="pt-0.5">
              <OfficialComparisonLineChart
                title={`Insiden Rate HAIs PHLEBITIS ${year}`}
                categories={['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGUST', 'SEP', 'OKT', 'NOV', 'DES']}
                minY={0}
                maxY={35}
                yTicks={[0, 5, 10, 15, 20, 25, 30, 35]}
                height={135}
                unit="‰"
                formatValue={(v) => v.toString().replace('.', ',')}
                series={[
                  {
                    name: 'PENCAPAIAN',
                    color: '#16a34a', // Green
                    marker: 'circle',
                    values: [6.8, 18.5, 6.1, 15.4, 27, 17, 29, 8.5, 8.6, 8.9, 3.2, 4.1],
                  },
                  {
                    name: 'TARGET',
                    color: '#2563eb', // Blue
                    marker: 'circle',
                    values: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                  },
                ]}
              />
              <p className="text-center font-bold text-[9.5pt] mt-1 mb-2">
                Grafik 5. Kejadian Phlebitis UOBK RSUD Al-Mulk tahun {year}
              </p>
            </div>

            {/* Analisa Phlebitis */}
            <div className="pt-1">
              <p className="font-bold underline mb-1">Analisa :</p>
              <p className="indent-8 text-justify">
                Berdasarkan hasil pemantauan insiden rate HAIs phlebitis, terlihat dari grafik di atas bahwa angka kejadian masih tinggi yaitu dengan hasil rata-rata 11,6‰, belum sesuai dengan standar yang ditetapkan yaitu 1‰, yang menunjukkan bahwa upaya pencegahan dan pengendalian infeksi terkait pemasangan serta perawatan infus belum berjalan optimal. Kondisi ini diduga dipengaruhi oleh beberapa faktor, antara lain ketidakkonsistenan petugas dalam menerapkan standar prosedur pemasangan dan perawatan infus, kepatuhan kebersihan tangan yang belum optimal, penggunaan dan pengawasan teknik aseptik yang belum maksimal, serta keterbatasan monitoring dan evaluasi secara berkala.
              </p>
            </div>

            {/* Rekomendasi Phlebitis */}
            <div className="pt-1">
              <p className="font-bold underline mb-1">Rekomendasi :</p>
              <ol className="list-decimal pl-6 space-y-0.5 text-justify">
                <li>Peningkatan edukasi dan pelatihan petugas terkait standar pemasangan dan perawatan infus</li>
                <li>Penguatan kepatuhan kebersihan tangan dan penggunaan APD</li>
                <li>Pelaksanaan audit dan surveilans phlebitis secara rutin disertai umpan balik kepada unit terkait</li>
                <li>Penguatan peran Tim PPI dan Kepala Unit dalam pengawasan dan pembinaan berkelanjutan guna memastikan penerapan standar berjalan konsisten dan berorientasi pada keselamatan pasien.</li>
              </ol>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 19: GRAFIK 6 IDO & ANALISA REKOMENDASI            */}
      {/* ========================================================= */}
      <F4Page customPageNumber={19}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-2 text-justify text-[12pt] leading-[1.5]">
            <p className="font-normal text-[12pt] pl-4">2)&nbsp;&nbsp;IDO</p>

            {/* Line chart with attached data table */}
            <div className="pt-0.5">
              <OfficialComparisonLineChart
                title={`Insiden Rate HAIs IDO Tahun ${year}`}
                categories={['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGUST', 'SEP', 'OKT', 'NOV', 'DES']}
                minY={0}
                maxY={2.5}
                yTicks={[0, 0.5, 1, 1.5, 2, 2.5]}
                height={135}
                unit="%"
                formatValue={(v) => `${v}%`}
                series={[
                  {
                    name: 'PENCAPAIAN',
                    color: '#16a34a', // Green
                    marker: 'circle',
                    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                  },
                  {
                    name: 'TARGET',
                    color: '#2563eb', // Blue
                    marker: 'circle',
                    values: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
                  },
                ]}
              />
              <p className="text-center font-bold text-[9.5pt] mt-1 mb-2">
                Grafik 6. Kejadian IDO di UOBK RSUD Al-Mulk
              </p>
            </div>

            {/* Analisa IDO */}
            <div className="pt-1">
              <p className="font-bold underline mb-1">Analisa :</p>
              <p className="indent-8 text-justify">
                Berdasarkan hasil pemantauan insiden rate HAIs Infeksi Daerah Operasi (IDO) selama tahun {year}, diketahui bahwa capaian telah sesuai dengan standar yang ditetapkan, dengan tidak ditemukannya kejadian IDO (0%), yang menunjukkan bahwa penerapan pencegahan dan pengendalian infeksi di area bedah telah berjalan efektif dan konsisten. Kondisi ini didukung oleh kepatuhan tenaga kesehatan terhadap prosedur sterilisasi dan aseptik yang baik, pelaksanaan persiapan pasien pra-bedah secara optimal, penerapan teknik operasi yang tepat, serta perawatan pasca-bedah yang memadai, didukung oleh sistem surveilans yang berjalan dengan baik.
              </p>
            </div>

            {/* Rekomendasi IDO */}
            <div className="pt-1">
              <p className="font-bold underline mb-1">Rekomendasi :</p>
              <ol className="list-decimal pl-6 space-y-0.5 text-justify">
                <li>Rumah sakit terus menjaga konsistensi penerapan standar PPI</li>
                <li>Melaksanakan surveilans IDO secara berkelanjutan</li>
                <li>Memperkuat monitoring dan evaluasi rutin</li>
                <li>Melanjutkan edukasi dan komitmen seluruh tim bedah dan manajemen dalam mendukung budaya keselamatan pasien.</li>
              </ol>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 20: GRAFIK 7 ISK & GRAFIK 8 VAP                   */}
      {/* ========================================================= */}
      <F4Page customPageNumber={20}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-2 text-justify text-[12pt] leading-[1.5]">
            {/* 3) ISK */}
            <div>
              <p className="font-normal text-[12pt] pl-4 mb-0.5">3)&nbsp;&nbsp;ISK</p>
              
              <OfficialComparisonLineChart
                title={`INSIDEN RATE HAIS ISK DI UOBK RSUD AL-MULK TAHUN ${year}`}
                categories={['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGUST', 'SEP', 'OKT', 'NOV', 'DES']}
                minY={0}
                maxY={6}
                yTicks={[0, 1, 2, 3, 4, 5, 6]}
                height={95}
                unit="‰"
                formatValue={(v) => v.toString().replace('.', ',')}
                series={[
                  {
                    name: 'ISK',
                    color: '#16a34a',
                    marker: 'circle',
                    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                  },
                  {
                    name: '‰',
                    color: '#059669',
                    marker: 'square',
                    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                  },
                  {
                    name: 'Target',
                    color: '#2563eb',
                    marker: 'triangle',
                    values: [4.7, 4.7, 4.7, 4.7, 4.7, 4.7, 4.7, 4.7, 4.7, 4.7, 4.7, 4.7],
                  },
                ]}
              />
              <p className="text-center font-bold text-[9.5pt] mt-0.5 mb-1">
                Grafik 7. Kejadian ISK di UOBK RSUD Al-Mulk
              </p>
              <p className="indent-8 text-justify text-[12pt] leading-[1.5]">
                Angka kejadian ISK pada tahun {year} yaitu 0 (belum terdeteksi), akan tetapi pemantauan pelaksanaan bundle ISK tetap dilaksanakan.
              </p>
            </div>

            {/* 4) VAP */}
            <div className="pt-2">
              <p className="font-normal text-[12pt] pl-4 mb-0.5">4)&nbsp;&nbsp;VAP</p>
              
              <OfficialComparisonLineChart
                title={`Insiden Rate HAIs VAP DI UOBK RSUD Al-Mulk Tahun ${year}`}
                categories={['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGUST', 'SEP', 'OKT', 'NOV', 'DES']}
                minY={0}
                maxY={7}
                yTicks={[0, 1, 2, 3, 4, 5, 6, 7]}
                height={95}
                unit="‰"
                formatValue={(v) => v.toString().replace('.', ',')}
                series={[
                  {
                    name: 'PENCAPAIAN',
                    color: '#16a34a',
                    marker: 'circle',
                    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                  },
                  {
                    name: 'TARGET',
                    color: '#2563eb',
                    marker: 'circle',
                    values: [5.8, 5.8, 5.8, 5.8, 5.8, 5.8, 5.8, 5.8, 5.8, 5.8, 5.8, 5.8],
                  },
                ]}
              />
              <p className="text-center font-bold text-[9.5pt] mt-0.5 mb-1">
                Grafik 8. Kejadian VAP di UOBK RSUD Al-Mulk Tahun {year}
              </p>
              <p className="indent-8 text-justify text-[12pt] leading-[1.5]">
                Angka kejadian VAP pada tahun {year} yaitu 0 (belum terdeteksi). Meskipun angka kejadian VAP masih dibawah standar yang telah di tentukan, akan tetapi pemantauan bundle VAP tetap dilakukan.
              </p>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 21: DECUBITUS & BUNDLE HAIs (Halaman 21)          */}
      {/* ========================================================= */}
      <F4Page customPageNumber={21}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-1.5 text-justify text-[12pt] leading-[1.5]">
            <p className="font-normal text-[12pt] pl-4">5)&nbsp;&nbsp;Decubitus</p>

            {/* Line chart with attached data table */}
            <div className="pt-0.5">
              <OfficialComparisonLineChart
                title={`INSIDEN RATE HAIS DECUBITUS DI UOBK RSUD AL-MULK TAHUN ${year}`}
                categories={['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGUST', 'SEP', 'OKT', 'NOV', 'DES']}
                minY={0}
                maxY={1.2}
                yTicks={[0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2]}
                height={115}
                unit=""
                formatValue={(v) => v.toString().replace('.', ',')}
                series={[
                  {
                    name: 'PENCAPAIAN',
                    color: '#16a34a', // Green
                    marker: 'circle',
                    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                  },
                  {
                    name: 'TARGET',
                    color: '#2563eb', // Blue
                    marker: 'circle',
                    values: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                  },
                ]}
              />
              <p className="text-center font-bold text-[9.5pt] mt-1 mb-1">
                Grafik 9. Kejadian Decubitus di UOBK RSUD Al-Mulk Tahun {year}
              </p>
              <p className="indent-8 text-justify text-[12pt] leading-[1.5] mb-2">
                Angka kejadian Decubitus pada tahun {year} yaitu 0 (belum terdeteksi). Angka kejadian decubitus dibawah standar yang telah ditetapkan 1 ‰, akan tetapi monitoring dan evaluasi tetap perlu dilakukan.
              </p>
            </div>

            {/* 3. Bundle HAIs */}
            <div className="pt-1">
              <h4 className="font-bold text-[12pt] text-black mb-1">
                3.&nbsp;&nbsp;Bundle HAIs
              </h4>

              {/* a. Definisi */}
              <div className="pl-4 mb-2">
                <p className="font-normal text-[12pt] mb-0.5">a.&nbsp;&nbsp;Definisi</p>
                <p className="indent-8 text-justify text-[12pt] leading-[1.5]">
                  Sekumpulan cara yang terstruktur untuk meningkatkan perawatan terhadap pasien. Untuk memudahkan petugas kesehatan dalam memberikan pelayanan keperawatan pada pasien yang berisiko terjadi infeksi. Harus dilakukan oleh semua orang yang memberikan pelayanan perawatan terhadap pasien dan dilakukan secara bersama-sama pada setiap pasien.
                </p>
              </div>

              {/* b. Pelaksanaan Bundle */}
              <div className="pl-4">
                <p className="font-normal text-[12pt] mb-0.5">b.&nbsp;&nbsp;Pelaksanaan Bundle</p>
                <div className="pl-4">
                  <p className="font-normal text-[12pt] mb-0.5">1)&nbsp;&nbsp;Phlebitis</p>
                  <div className="pl-4">
                    <p className="font-normal text-[12pt] mb-0.5">a)&nbsp;&nbsp;Insersi Plabsi</p>
                    <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                      <li>Lakukan kebersihan tangan</li>
                      <li>Gunakan APD sesuai indikasi dan tehnik aseptik</li>
                      <li>Pemilihan area insersi dengan mempertimbangkan risiko</li>
                      <li>Lakukan desinfeksi antiseptik pada area insersi</li>
                      <li>Lakukan penutupan area insersi intravena kateter dengan transparan</li>
                      <li>Pastikan perangkat infus (administrasi set) dalam kondisi tertutup</li>
                      <li>Beri label tanggal pemasangan</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 22: MAINTENANCE PLABSI & IDO (Halaman 22)        */}
      {/* ========================================================= */}
      <F4Page customPageNumber={22}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-2 text-justify text-[12pt] leading-[1.5]">
            {/* b) Maintanance Plabsi */}
            <div className="pl-8">
              <p className="font-normal text-[12pt] mb-0.5">b)&nbsp;&nbsp;Maintanance Plabsi</p>
              <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                <li>Lakukan kebersihan tangan</li>
                <li>Gunakan APD sesuai indikasi dan jenis paparan</li>
                <li>Lakukan perawatan area insersi dengan tindakan asepsis</li>
                <li>Kaji kebutuhan IV kateter setiap hari apakah masih diperlukan/ sudah dapat dilakukan pelepasan segera jika tidak ada indikasi lagi</li>
                <li>Gunakan balutan steril (dressing steril) dengan pemasangan yang aman dan nyaman buat pasien</li>
                <li>pastikan konektor dengan sistem tertutup</li>
                <li>pastikan perangkat infus (administrasi set) dalam kondisi tertutup dan diberi label tanggal</li>
                <li>Penggantian administrasi set setiap 96 jam atau sesuai standar yang ditetapkan</li>
              </ul>
            </div>

            {/* 2) IDO */}
            <div className="pl-4 pt-1">
              <p className="font-normal text-[12pt] mb-0.5">2)&nbsp;&nbsp;IDO</p>
              
              <div className="pl-4">
                <p className="font-normal text-[12pt] mb-0.5">a)&nbsp;&nbsp;Antibiotik profilaksis</p>
                <p className="text-justify text-[12pt] leading-[1.5] mb-1">
                  Pemberian antibiotic profilaksis pada pasien yang dilakukan Tindakan operasi dalam 1 jam sebelum insisi. Redosing* bila operasi &gt; 4jam :
                </p>
                <ul className="list-disc pl-5 space-y-1 text-justify text-[12pt] leading-[1.4]">
                  <li>Sebagian dokter sudah menerapkan, namun masih ada dokter memberikan antibiotica yang sama setelah post operasi</li>
                  <li>
                    Tidak melakukan pencukuran rambut, kecuali mengganggu lokasi operasi :
                    <ul className="list-none pl-4 space-y-0.5 mt-1">
                      <li>-&nbsp;&nbsp;Pencukuran rambut pada daerah operasi sudah dilakukan 1 jam sebelum dilakukan tindakan operasi dan dilakukan di IBS</li>
                      <li>-&nbsp;&nbsp;Pencukuran belum menggunakan Clipper, masih menggunakan alat pencukur rambut atau pencukur kumis</li>
                    </ul>
                  </li>
                </ul>

                <p className="text-[12pt] leading-[1.5] mt-1.5">
                  b)&nbsp;&nbsp;Pertahankan normothermia perioperatif : sudah diterapkan dengan baik
                </p>
                
                <p className="text-[12pt] leading-[1.5] mt-1.5">
                  c)&nbsp;&nbsp;Control gula darah :
                </p>
                <p className="text-justify text-[12pt] leading-[1.5] pl-4">
                  Pemeriksaan GDS sebelum operasi sudah diterapkan dengan baik
                </p>

                <p className="text-[12pt] leading-[1.5] mt-1.5">
                  d)&nbsp;&nbsp;Preparasi kulit dengan antiseptik :
                </p>
                <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                  <li>Belum semua pasien pre operasi dilakukan mandi chlorhexidine</li>
                  <li>Yang sudah dilaksanakan pasien pre operasi mandi keramas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 23: PREPARASI KULIT & CAUTI / ISK (Halaman 23)    */}
      {/* ========================================================= */}
      <F4Page customPageNumber={23}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-2 text-justify text-[12pt] leading-[1.5]">
            {/* Lanjutan d) Preparasi kulit dari Halaman 22 */}
            <div className="pl-8">
              <ul className="list-none pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                <li>menggunakan sabun dan shampoo, namun belum diterapkan kepada semua pasien</li>
              </ul>
              <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4] mt-0.5">
                <li>Preparai sudah diterapkan dengan baik, dengan menggunakan povidone iodin dan alkohol 70% (standar pemberian antiseptik dengan menggunakan alcohol 70% dan chlorhexidine).</li>
              </ul>
            </div>

            {/* 3) CAUTI / ISK */}
            <div className="pl-4 pt-1">
              <p className="font-normal text-[12pt] mb-0.5">3)&nbsp;&nbsp;CAUTI / ISK</p>

              <div className="pl-4 space-y-1.5">
                <div>
                  <p className="font-normal text-[12pt] mb-0.5">a)&nbsp;&nbsp;Kaji kebutuhan</p>
                  <p className="text-justify text-[12pt] leading-[1.5]">
                    Pemasangan dan lama pemasangan kateter idasarkan atas pengkajian kebutuhan pasien terhadap pemasangan kateter urin, sudah diterapkan
                  </p>
                </div>

                <div>
                  <p className="font-normal text-[12pt] mb-0.5">b)&nbsp;&nbsp;Kebersihan tangan</p>
                  <p className="text-justify text-[12pt] leading-[1.5]">
                    Hand hygiene sebagai faktor utama dalam pencegahan dan pengendalian HAIs belum diterapkan dengan baik. Kepatuhan hand hygiene perawat masih rendah, terutama kepatuhan hand hygiene sebelum kontak dengan pasien dan kepatuhan hand hygiene sebelum melakukan Tindakan aseptik.
                  </p>
                </div>

                <div>
                  <p className="font-normal text-[12pt] mb-0.5">c)&nbsp;&nbsp;Teknik insersi</p>
                  <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                    <li>Standar pemasangan kateter urin menggunakan sarung tangan steril : sudah diterapkan</li>
                    <li>Bersihkan bagian meatus uretra sebelum pemasangan kateter urine : sudah diterapkan</li>
                    <li>Balon kateter urin dikembangkan dengan jumlah air sesuai produk yang dipakai : sudah di terapkan</li>
                  </ul>
                </div>

                <div>
                  <p className="font-normal text-[12pt] mb-0.5">d)&nbsp;&nbsp;Pemeliharaan kateter</p>
                  <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                    <li>Fiksasi Kateter untuk mencegah gerakan dan trauma pada meatusuretra : sudah diterapkan</li>
                    <li>Urine bag diletakkan lebih rendah dari kandung kemih: belum dipatuhi dengan baik</li>
                    <li>Masih ditemukan urin bag diletakkan sejajardengan kandung kemih saat transportasi pasien</li>
                    <li>Tidak meletakkan urine bag dilantai : masih sering ditemukan urin bag diletakkan dilantai</li>
                    <li>Periksa selang kateter jangan sampai terlipat (kingking): sudah diterapkan dengan baik.</li>
                  </ul>
                </div>

                <div>
                  <p className="font-normal text-[12pt] mb-0.5">e)&nbsp;&nbsp;Perawatan kateter</p>
                  <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                    <li>Perawatan perineal sehari-hari dan setiap selesai buang air besar : sudah diterapkan</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 24: PERAWATAN KATETER & VAP (Halaman 24)           */}
      {/* ========================================================= */}
      <F4Page customPageNumber={24}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-2 text-justify text-[12pt] leading-[1.5]">
            {/* Lanjutan e) Perawatan kateter dari Halaman 23 */}
            <div className="pl-8">
              <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                <li>Gunakan kateter terkecil yang mencapai drainase : sudah diterapkan</li>
                <li>Irigasi kandung kemih dan pemakaian antibiotika tidak dapat mencegah infeksi saluran kemih</li>
              </ul>

              {/* f) Pelepasan kateter */}
              <div className="pt-1.5">
                <p className="font-normal text-[12pt] mb-0.5">
                  f)&nbsp;&nbsp;Pelepasan kateter sudah diterapkan sesuai prosedur
                </p>
                <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                  <li>Kateter segera dilepas jika tidak diperlukan, lepas atau ganti semua kateter dalam waktu 24 jam masuk ke rumah sakit : sudah diterapkan</li>
                  <li>Lepas atau ganti kateter jika pasien timbul gejala ISK : sudah diterapkan</li>
                  <li>Cara penggantungan urine bag yang tidak tepat menyebabkan selang kateter urine terlipat sehingga aliran urine tidak lancar.</li>
                </ul>
              </div>
            </div>

            {/* 4) VAP */}
            <div className="pl-4 pt-1">
              <p className="font-normal text-[12pt] mb-0.5">4)&nbsp;&nbsp;VAP</p>

              <div className="pl-4 space-y-1.5">
                <div>
                  <p className="font-normal text-[12pt] mb-0.5">a)&nbsp;&nbsp;Kebersihan tangan</p>
                  <p className="text-justify text-[12pt] leading-[1.5]">
                    Hand hygiene sebagai faktor utama dalam pencegahan dan pengendalian HAIs belum diterapkan dengan baik. Kepatuhan hand hygiene perawat masih rendah, terutama kepatuhan hand hygiene sebelum kontak dengan pasien dan kepatuhan hand hygiene sebelum melakukan Tindakan aseptik.
                  </p>
                </div>

                <div>
                  <p className="font-normal text-[12pt] mb-0.5">b)&nbsp;&nbsp;Posisi pasien</p>
                  <p className="text-justify text-[12pt] leading-[1.5]">
                    Posisi 30 – 45 ° C setiap saat, kecuali ada kontra indikasi: belum diterapkan dengan baik. Masih sering ditemukan pasien posisi tidur supine.
                  </p>
                </div>

                <div>
                  <p className="font-normal text-[12pt] mb-0.5">c)&nbsp;&nbsp;Kebersihan mulut</p>
                  <p className="text-justify text-[12pt] leading-[1.5] mb-0.5">
                    Menjaga kebersihan mulut pasien secara rutin, dengan cara :
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                    <li>Menyikat gigi setiap 12 jam untuk mencegah terjadinya plaque : belum dilakukan dengan baik. Masih sering ditemukan pasien posisi tidur supine</li>
                    <li>Membersihkan mulut setiap 2- 4 jam : belum diterapkan dengan baik. Pembersihan mulut baru bisa dilakukan setiap pagi dan sore hari.</li>
                    <li>Gunakan oral antiseptik yang bebas dari alkohol (chlorhexidin 0,2 %) : Pemakaian cairan oral hygiene menggunakan menggunakan minosef.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 25: MANAJEMEN SEKRESI, DIKLAT, PPRA (Halaman 25)   */}
      {/* ========================================================= */}
      <F4Page customPageNumber={25}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-2 text-justify text-[12pt] leading-[1.5]">
            {/* d) Manajemen sekresi (Lanjutan 4) VAP) */}
            <div className="pl-8">
              <p className="font-normal text-[12pt] mb-0.5">d)&nbsp;&nbsp;Manajemen sekresi</p>
              <ul className="list-disc pl-5 space-y-1 text-justify text-[12pt] leading-[1.4]">
                <li>
                  Pengisapan lender jika diperlukan :
                  <p className="mt-0.5">Pengisapan lendir sudah dilakukan dengan baik</p>
                </li>
                <li>
                  Lakukan Tindakan aseptik :
                  <p className="mt-0.5">
                    Dalam melakukan tindakan aseptik petugas sudah memperhatikan prinsip aseptik. Standar kanul suction dispossable belum bisa diterapkan di RSUD Al-Mulk Kota Sukabumi karena anggaran pengadaan canul suction belum memadai. Upaya yang bisa dilakukan dengan cara penggantian kanul 1x / hari untuk masing - masing pasien.
                  </p>
                </li>
                <li>
                  Gunakan APD
                  <p className="mt-0.5">
                    APD yang digunakan belum lengkap (handscoen dan masker) karena penyediaan APD apron dan google kurang. Hal ini belum sesuai standar (masker, handscoen, apron, google).
                  </p>
                </li>
              </ul>

              {/* e) Pemberian sedasi */}
              <div className="pt-1">
                <p className="font-normal text-[12pt] mb-0.5">e)&nbsp;&nbsp;Pemberian sedasi</p>
                <p className="text-justify text-[12pt] leading-[1.5]">
                  Belum semua pasien yang akan dipasang ventilator diberikan sedasi untuk pasien dewasa sedasi diberikan pada pasien yang tidak kooperatif.
                </p>
              </div>
            </div>

            {/* 4. Pendidikan Dan Pelatihan */}
            <div className="pt-1.5">
              <h4 className="font-bold text-[12pt] text-black mb-0.5">
                4.&nbsp;&nbsp;Pendidikan Dan Pelatihan
              </h4>
              <div className="pl-4 space-y-1">
                <p className="font-normal text-[12pt] mb-0.5">a)&nbsp;&nbsp;Pelaksanaan Kegiatan</p>
                <p className="text-justify text-[12pt] leading-[1.5]">
                  Kegiatan Pelatihan PPI dengan narasumber IPCN yang sudah TOT belum pernah dilakukan di tahun {year}. Tim PPI sudah mengajukan ke bagian Diklat Rumah sakit.
                </p>
                <p className="text-justify text-[12pt] leading-[1.5]">
                  Untuk pelaksanaan IHT (In House Training) beberapa kali sudah dilakukan mengenai kewaspadaan isolasi diantaranya kebersihan tangan, pemakaian dan pelepasan APD.
                </p>
                <p className="text-justify text-[12pt] leading-[1.5]">
                  Kegiatan Edukasi staff, pasien, keluarga pasien dan pengunjung sudah dilakukan namun pelaksanaannya belum berkala.
                </p>
              </div>
            </div>

            {/* 5. Penggunaan Antibiotika Rasional */}
            <div className="pt-1.5">
              <h4 className="font-bold text-[12pt] text-black mb-0.5">
                5.&nbsp;&nbsp;Penggunaan Antibiotika Rasional
              </h4>
              <ul className="list-disc pl-9 text-justify text-[12pt] leading-[1.4]">
                <li>
                  Pembentukan Tim / komite PPRA belum dilakukan, sehingga Tim PPI tidak bisa memantau dengan baik pada pelaksanaan pemakaian antibiotik rasional.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 26: BAB IV PEMBAHASAN (Halaman 26)                */}
      {/* ========================================================= */}
      <F4Page customPageNumber={26}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="text-center font-bold mb-4 pt-1">
            <h2 className="text-[12pt] font-bold uppercase tracking-wide">BAB IV</h2>
            <h3 className="text-[12pt] font-bold uppercase tracking-wide">PEMBAHASAN</h3>
          </div>

          <div className="space-y-3 text-justify text-[12pt] leading-[1.5]">
            {/* A. PENGORGANISASIAN */}
            <div>
              <h4 className="font-bold text-[12pt] uppercase text-black mb-1">
                A.&nbsp;&nbsp;PENGORGANISASIAN
              </h4>
              <div className="pl-4 space-y-1">
                <div>
                  <p className="font-normal text-[12pt]">a)&nbsp;&nbsp;Pelaksanaan Kegiatan</p>
                  <p className="text-justify text-[12pt] leading-[1.5] pl-4">
                    Rapat koordinasi sudah dilakukan namun belum berkala
                  </p>
                </div>
                <div>
                  <p className="font-normal text-[12pt]">b)&nbsp;&nbsp;Kendala yang dihadapi</p>
                  <p className="text-justify text-[12pt] leading-[1.5] pl-4 mb-0.5">
                    Beberapa hal masih menjadi kendala dalam pelaksanaan rapat koordinasi, diantaranya :
                  </p>
                  <ul className="list-disc pl-9 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                    <li>Tindak lanjut rapat koordinasi belum optimal</li>
                    <li>
                      Kehadiran peserta rapat koordinasi tidak pernah 100%, hal ini di sebabkan karena masih banyak anggota Tim PPI dan unit lain menganggap berjalannya PPI di rumah sakit berperan minim untuk pelayanan
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* B. PENINGKATAN MUTU PELAYANAN KESEHATAN DI RUMAH SAKIT PADA KEJADIAN HAIs */}
            <div className="pt-1">
              <h4 className="font-bold text-[12pt] uppercase text-black mb-1">
                B.&nbsp;&nbsp;PENINGKATAN MUTU PELAYANAN KESEHATAN DI RUMAH SAKIT PADA KEJADIAN HAIs
              </h4>
              <div className="pl-4 space-y-1">
                <p className="font-bold text-[12pt]">1.&nbsp;&nbsp;Kewaspadaan Isolasi</p>
                <div className="pl-4 space-y-1">
                  <p className="font-bold text-[12pt]">a.&nbsp;&nbsp;Kewaspadaan Standar</p>
                  <div className="pl-4 space-y-1">
                    <p className="font-bold text-[12pt]">1)&nbsp;&nbsp;Hand Hygiene</p>
                    <div className="pl-4 space-y-1">
                      <div>
                        <p className="font-normal text-[12pt]">a)&nbsp;&nbsp;Pelaksanaan kegiatan</p>
                        <p className="text-justify text-[12pt] leading-[1.5] pl-4">
                          Angka kepatuhan hand hygiene masih rendah. Angka kepatuhan cuci tangan mengalami kenaikan di setiap trimesternya, namun masih dibawah standar yang telah di tetapkan yaitu 80%.
                        </p>
                      </div>
                      <div>
                        <p className="font-normal text-[12pt]">b)&nbsp;&nbsp;Kendala yang ditemukan</p>
                        <ul className="list-disc pl-9 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                          <li>Belum semua pegawai mendapatkan pelatihan PPI Dasar.</li>
                          <li>
                            IPCN belum mengikuti pelatihan IPCN Lanjutan dan belum memiliki sertifikat pelatihan TOT PPI, sehingga untuk pelatihan PPI Dasar harus mendatangkan narasumber IPCN yang sudah TOT dari luar.
                          </li>
                          <li>Fasilitas hand hygiene (tissue, cairan hand rub dan hand soap) terbatas dan tidak kontinyu.</li>
                          <li>Komitmen dan kesadaran individu masih rendah</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </F4Page>
    </>
  );
}

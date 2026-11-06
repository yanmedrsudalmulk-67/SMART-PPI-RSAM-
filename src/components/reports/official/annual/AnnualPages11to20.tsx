import React from 'react';
import F4Page from '../F4Page';
import OfficialModernBarChart from '../OfficialModernBarChart';
import OfficialComparisonLineChart from '../OfficialComparisonLineChart';
import OfficialGroupedBarChart from '../OfficialGroupedBarChart';
import { OfficialReportData } from '@/hooks/useOfficialReportData';

interface AnnualPagesProps {
  year: number;
  reportData?: OfficialReportData;
}

export default function AnnualPages11to20({ year, reportData }: AnnualPagesProps) {
  // Hand hygiene per profession
  const professionData = reportData?.hasCustomData && reportData.hhProfessions.length > 0
    ? reportData.hhProfessions
    : [
        { profession: 'Dokter', compliance: 82.1, opportunity: 420, rate: 82.1 },
        { profession: 'Perawat / Bidan', compliance: 88.4, opportunity: 1850, rate: 88.4 },
        { profession: 'Tenaga Kesehatan Lain', compliance: 84.6, opportunity: 540, rate: 84.6 },
      ];

  const hhAvg = reportData?.hasCustomData && reportData.hhOverallRate > 0
    ? reportData.hhOverallRate
    : 67.0;

  // APD 12 months data
  const defaultApdMonthly = [
    { bulan: 'Januari', rate: 91.2 },
    { bulan: 'Februari', rate: 92.0 },
    { bulan: 'Maret', rate: 93.5 },
    { bulan: 'April', rate: 94.0 },
    { bulan: 'Mei', rate: 93.8 },
    { bulan: 'Juni', rate: 95.1 },
    { bulan: 'Juli', rate: 94.7 },
    { bulan: 'Agustus', rate: 95.5 },
    { bulan: 'September', rate: 96.2 },
    { bulan: 'Oktober', rate: 95.8 },
    { bulan: 'November', rate: 96.5 },
    { bulan: 'Desember', rate: 97.0 },
  ];

  const apdAvg = reportData?.hasCustomData && reportData.apdOverallRate > 0
    ? reportData.apdOverallRate
    : 94.6;

  // IPAL Inlet & Outlet Table Data (Tabel 1)
  const ipalInletRows = [
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
    { param: 'TOTAL COLIFORM', values: ['9.000', '26.000', '11.000', '21.000', '4,3 X 10', '2,4X10', '4,3 X 10', '2.4X10⁶', '2.4X10⁵', '240.000', '110.000', '24000'], normal: '3000' },
  ];

  const ipalOutletRows = [
    { param: 'Suhu', values: ['23,5', '23,3', '23,5', '23,6', '15,5', '23,6', '-', '23,6', '24,3', '21,3', '23,6', '18,5'], normal: '30' },
    { param: 'TSS', values: ['15', '12', '9', '10', '10', '5', '<5', '<5', '<5', '<5', '<5', '<5'], normal: '30' },
    { param: 'PH', values: ['6,23', '4,40', '5,03', '6,65', '4,11', '7,62', '6,94', '7,33', '6,58', '7,21', '6,83', '7,42'], normal: '6,0 – 9,0' },
    { param: 'BOD', values: ['6', '8', '7', '7', '12', '20', '<10', '<10', '13', '28', '19', '16'], normal: '30' },
    { param: 'COD', values: ['20', '25', '23', '23', '32', '56', '<30', '<30', '33', '83', '52', '36'], normal: '100' },
    { param: 'Amoniak Nitrogen', values: ['<0,0100', '0,2500', '0,1100', '0,0800', '<0,01', '<0,01', '<0,01', '<0,01', '10,0000', '<0,01', '<0,01', '<5'], normal: '10' },
    { param: 'ZINK', values: ['0,610', '<0,0100', '<0,0100', '<0,0100', '-', '-', '-', '0,40', '0,0000', '0,3640', '0,1900', '0,27'], normal: '10' },
    { param: 'SULFIDA', values: ['0,0800', '<0,0100', '<0,0100', '<0,0100', '-', '-', '-', '-', '', '', '', ''], normal: '300' },
    { param: 'NITRIT', values: ['<0,00358', '<0,00358', '<0,00358', '0,722', '-', '-', '-', '1,07', '0', '0,47', '1,98', '0,08'], normal: '40' },
    { param: 'NITRAT', values: ['6,3', '1,83', '0,81', '6,0', '-', '-', '-', '56,2', '0', '19,4', '19,8', '3,55'], normal: '30' },
    { param: 'TOTAL COLIFORM', values: ['1200', '1.100', '800', '1.400', '2,4x10', '0', '7 X 10', '2.4X10⁶', '240000', '9.300', '900', '400'], normal: '3000' },
  ];

  return (
    <>
      {/* ========================================================= */}
      {/* HALAMAN 11: REKOMENDASI HH & HH PER PROFESI (Halaman 7)  */}
      {/* ========================================================= */}
      <F4Page customPageNumber={7}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-2 text-justify text-[9.5pt] leading-relaxed">
            {/* Rekomendasi Bagian 1 */}
            <div>
              <p className="font-bold underline mb-1">Rekomendasi :</p>
              <ol className="list-decimal pl-6 space-y-0.5">
                <li>Meningkatkan edukasi dan sosialisasi secara berkala mengenai pentingnya kebersihan tangan 6 langkah dan 5 moment kebersihan serta kaitannya dengan pencegahan HAIs.</li>
                <li>Monitoring oleh IPCN dan IPCLN di ruangan dan mengingatkan secara langsung apabila menemukan ketidaksesuaian dan melakukan edukasi kepada petugas.</li>
                <li>Memastikan ketersediaan dan kemudahan akses fasilitas kebersihan tangan di setiap titik pelayanan sesuai standar.</li>
              </ol>
            </div>

            {/* b) Kepatuhan kebersihan tangan berdasarkan profesi */}
            <div className="pt-0.5">
              <p className="font-semibold text-[9.5pt] pl-4 mb-0.5">
                b).&nbsp;&nbsp;Kepatuhan kebersihan tangan berdasarkan profesi
              </p>

              {/* Line Chart matching Gambar No 2 */}
              <OfficialComparisonLineChart
                title={`Perbandingan Hasil Kebersihan Tangan Berdasarkan Profesi di UOBK RSUD Al-Mulk Tahun ${year - 1}-${year}`}
                categories={['Dokter', 'Perawat/Bidan', 'Nakes Lainnya', 'Rata-rata']}
                minY={0}
                maxY={100}
                yTicks={[0, 20, 40, 60, 80, 100]}
                height={130}
                series={[
                  {
                    name: `Capaian ${year}`,
                    color: '#2563eb', // Blue
                    marker: 'circle',
                    values: [70, 62, 65, 67],
                  },
                  {
                    name: `Capaian ${year - 1}`,
                    color: '#ea580c', // Orange
                    marker: 'square',
                    values: [63, 65, 62, 63],
                  },
                  {
                    name: 'Target',
                    color: '#64748b', // Gray
                    marker: 'triangle',
                    values: [85, 85, 85, 85],
                  },
                ]}
              />
              <p className="text-center text-[8.5pt] font-semibold mt-0.5">
                Grafik 2. Perbandingan kepatuhan kebersihan tangan berdasarkan profesi di UOBK RSUD Al-Mulk tahun {year}
              </p>
            </div>

            {/* Analisa 2 */}
            <div className="pt-1 text-[9pt] leading-normal">
              <p className="font-bold underline mb-0.5">Analisa :</p>
              <p className="indent-8">
                Dilihat dari grafik di atas pencapaian kepatuhan kebersihan tangan berdasarkan profesi pada tahun {year} paling tinggi pada profesi Dokter yaitu 70%, sedangkan terendah pada profesi perawat/bidan yaitu 62%, hal ini disebabkan karena tidak konsistennya melakukan kebersihan tangan 6 langkah pada 5 moment cuci tangan.
              </p>
            </div>

            {/* Rekomendasi 2 */}
            <div className="pt-0.5 text-[9pt] leading-normal">
              <p className="font-bold underline mb-0.5">Rekomendasi :</p>
              <ol className="list-decimal pl-6 space-y-0.5">
                <li>Meningkatkan kesadaran petugas dengan memberikan edukasi dan mengingatkan cara melakukan kebersihan tangan 6 langkah pada 5 moment cuci tangan.</li>
                <li>Konsisten melakukan kebersihan tangan dengan 6 langkah dan 5 moment untuk memutus rantai penularan infeksi.</li>
                <li>Monitoring kepatuhan kebersihan tangan Dokter, Perawat, bidan dan petugas kesehatan lainnya dengan 6 langkah dan 5 moment.</li>
              </ol>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 12: 2) KEPATUHAN PENGGUNAAN APD (Halaman 8)       */}
      {/* ========================================================= */}
      <F4Page customPageNumber={8}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-2 text-justify text-[9.5pt] leading-relaxed">
            <h4 className="font-bold text-[10.5pt] text-black">
              2)&nbsp;&nbsp;Kepatuhan penggunaan APD
            </h4>

            {/* Grouped Bar Chart matching Gambar No 3 */}
            <div className="pt-0.5">
              <OfficialGroupedBarChart
                title={`KEPATUHAN PENGGUNAAN APD PERIODE ${year}`}
                categories={['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGUST', 'SEP', 'OKT', 'NOV', 'DES']}
                minY={60}
                maxY={102}
                yTicks={[60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 102]}
                height={140}
                series={[
                  {
                    name: 'Pencapaian',
                    color: '#2563eb', // Blue
                    values: [100, 100, 100, 100, 100, 100, 100, 97, 100, 100, 100, 100],
                  },
                  {
                    name: 'Target',
                    color: '#ea580c', // Orange
                    values: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
                  },
                ]}
              />
              <p className="text-center text-[8.5pt] font-semibold mt-0.5">
                Grafik 4. Kepatuhan penggunaan APD di UOBK RSUD Al-Mulk tahun {year}
              </p>
            </div>

            {/* Analisa APD */}
            <div className="pt-1 text-[9pt] leading-normal">
              <p className="font-bold underline mb-0.5">Analisa :</p>
              <p className="indent-8">
                Pencapaian kepatuhan penggunaan APD yang tepat pada petugas rata-rata 99,75%, pencapaian belum mencapai target 100%. Kondisi ini menunjukan bahwa penerapan penggunaan APD dalam kegiatan pelayanan belum dilakukan secara konsisten dan optimal.
              </p>
            </div>

            {/* Rekomendasi APD */}
            <div className="pt-1 text-[9pt] leading-normal">
              <p className="font-bold underline mb-0.5">Rekomendasi :</p>
              <ol className="list-decimal pl-6 space-y-0.5">
                <li>Gunakan APD yang tepat dan sesuai standar seperti masker, gaun, dan sarung tangan pada saat beresiko terkena paparan.</li>
                <li>Segera lepas APD setelah tindakan, terutama sarung tangan setelah tindakan dan lakukan kebersihan tangan.</li>
                <li>Monitoring dan evaluasi secara berkelanjutan.</li>
              </ol>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 13: 3) PENGELOLAAN LIMBAH (Halaman 9)             */}
      {/* ========================================================= */}
      <F4Page customPageNumber={9}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3.5 text-justify text-[9.5pt] leading-relaxed">
            <div>
              <h4 className="font-bold text-[10.5pt] text-black mb-1.5">
                3)&nbsp;&nbsp;Pengelolaan limbah
              </h4>
              <p className="indent-8">
                Rumah sakit merupakan tempat penghasil limbah paling komplek. Pengelolaan limbah dilakukan untuk menurunkan risiko kecelakaan kerja dan penularan infeksi. UOBK RSUD Al-Mulk kerjasama dengan PT. Jasa Medivest dalam pengelolaan limbah infeksius dan benda tajam.
              </p>
            </div>

            {/* a. Limbah Padat */}
            <div className="space-y-2">
              <h5 className="font-bold text-[10pt] text-black">
                a.&nbsp;&nbsp;Limbah Padat
              </h5>
              
              <div className="pl-4 space-y-2">
                <div>
                  <p className="font-bold text-[9.5pt] mb-0.5">1)&nbsp;&nbsp;Infeksius</p>
                  <p className="indent-8">
                    Jumlah sampah infeksius tahun {year} sebanyak 3.952 Kg, terdiri dari sampah infeksius padat dan benda tajam. Pengelolaan sampah infeksius dilaksanakan oleh pihak Jasa Medivest dengan pembakaran menggunakan <em>incinerator</em> yang sudah berizin.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-[9.5pt] mb-0.5">2)&nbsp;&nbsp;Non Infeksius</p>
                  <p className="indent-8">
                    Pengelolaan sampah non infeksius bekerja sama dengan Dinas Lingkungan Hidup Kota Sukabumi yang diambil setiap hari ke UOBK RSUD Al-Mulk.
                  </p>
                </div>
              </div>
            </div>

            {/* b. Limbah Jarum dan Benda Tajam */}
            <div className="space-y-1">
              <h5 className="font-bold text-[10pt] text-black">
                b.&nbsp;&nbsp;Limbah Jarum dan Benda Tajam
              </h5>
              <p className="indent-8">
                Limbah jarum dan benda tajam dimasukkan kedalam <em>safety box</em> kemudian di tampung terlebih dahulu di ruang penyimpanan sampah sementara.
              </p>
            </div>

            {/* c. Limbah Cair */}
            <div className="space-y-1">
              <h5 className="font-bold text-[10pt] text-black">
                c.&nbsp;&nbsp;Limbah Cair
              </h5>
              <p className="indent-8">
                Limbah cair di UOBK RSUD Al-Mulk diolah menggunakan IPAL yang sudah berizin operasional sesuai standar kesehatan lingkungan. Berdasarkan data pengolahan limbah cair yang ada, rumah sakit telah melakukan proses pengolahan limbah cair secara optimal sehingga olahannya dapat dimanfaatkan kembali sebagai air untuk menyiram taman serta membersihkan kendaraan, sebagai upaya efisiensi penggunaan air dan penerapan prinsip ramah lingkungan.
              </p>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 14: TABEL 1 OUTPUT IPAL TAHUN 2025 (Halaman 10)   */}
      {/* ========================================================= */}
      <F4Page customPageNumber={10} padding="p-[20mm_12mm_20mm_15mm]" contentClassName="overflow-visible">
        <div className="w-full h-full flex flex-col justify-start py-0.5 text-black font-sans">
          <div className="space-y-1.5 w-full">
            <p className="font-bold text-[9.5pt] text-left">
              Tabel 1. Hasil pemeriksaan output IPAL UOBK RSUD Al-Mulk Kota Sukabumi tahun {year}
            </p>

            <table className="w-full table-fixed border-collapse border border-black text-center text-[6.8pt] leading-tight">
              <thead>
                <tr className="font-bold border border-black bg-white">
                  <th className="border border-black px-1 py-1 text-center w-[16%]">PARAMETER</th>
                  <th colSpan={12} className="border border-black px-1 py-1 text-center">NILAI HASIL PEMERIKSAAN</th>
                  <th className="border border-black px-1 py-1 text-center w-[13.8%]">NILAI NORMAL</th>
                </tr>
                <tr className="font-bold border border-black bg-white">
                  <th className="border border-black px-1 py-1 text-left w-[16%]">IPAL INLET</th>
                  <th className="border border-black px-0.5 py-1 w-[5.85%]">JAN</th>
                  <th className="border border-black px-0.5 py-1 w-[5.85%]">FEB</th>
                  <th className="border border-black px-0.5 py-1 w-[5.85%]">MAR</th>
                  <th className="border border-black px-0.5 py-1 w-[5.85%]">APR</th>
                  <th className="border border-black px-0.5 py-1 w-[5.85%]">MEI</th>
                  <th className="border border-black px-0.5 py-1 w-[5.85%]">JUN</th>
                  <th className="border border-black px-0.5 py-1 w-[5.85%]">JUL</th>
                  <th className="border border-black px-0.5 py-1 w-[5.85%]">AGST</th>
                  <th className="border border-black px-0.5 py-1 w-[5.85%]">SEPT</th>
                  <th className="border border-black px-0.5 py-1 w-[5.85%]">OKT</th>
                  <th className="border border-black px-0.5 py-1 w-[5.85%]">NOV</th>
                  <th className="border border-black px-0.5 py-1 w-[5.85%]">DES</th>
                  <th className="border border-black px-1 py-1 w-[13.8%]"></th>
                </tr>
              </thead>
              <tbody>
                {/* IPAL INLET ROWS */}
                {ipalInletRows.map((row, idx) => (
                  <tr key={`inlet-${idx}`} className="border border-black">
                    <td className="border border-black px-1 py-0.5 text-left font-medium whitespace-nowrap overflow-hidden">
                      {row.param}
                    </td>
                    {row.values.map((val, vIdx) => (
                      <td key={vIdx} className="border border-black px-0.5 py-0.5 text-center whitespace-nowrap">
                        {val}
                      </td>
                    ))}
                    <td className="border border-black px-1 py-0.5 text-center font-medium whitespace-nowrap">
                      {row.normal}
                    </td>
                  </tr>
                ))}

                {/* IPAL OUTLET SUBHEADER */}
                <tr className="font-bold border border-black bg-white">
                  <td className="border border-black px-1 py-1 text-left font-bold w-[16%]">IPAL OUTLET</td>
                  <td className="border border-black px-0.5 py-1 text-center font-bold w-[5.85%]">JAN</td>
                  <td className="border border-black px-0.5 py-1 text-center font-bold w-[5.85%]">FEB</td>
                  <td className="border border-black px-0.5 py-1 text-center font-bold w-[5.85%]">MAR</td>
                  <td className="border border-black px-0.5 py-1 text-center font-bold w-[5.85%]">APR</td>
                  <td className="border border-black px-0.5 py-1 text-center font-bold w-[5.85%]">MEI</td>
                  <td className="border border-black px-0.5 py-1 text-center font-bold w-[5.85%]">JUN</td>
                  <td className="border border-black px-0.5 py-1 text-center font-bold w-[5.85%]">JUL</td>
                  <td className="border border-black px-0.5 py-1 text-center font-bold w-[5.85%]">AGST</td>
                  <td className="border border-black px-0.5 py-1 text-center font-bold w-[5.85%]">SEP</td>
                  <td className="border border-black px-0.5 py-1 text-center font-bold w-[5.85%]">OKT</td>
                  <td className="border border-black px-0.5 py-1 text-center font-bold w-[5.85%]">NOV</td>
                  <td className="border border-black px-0.5 py-1 text-center font-bold w-[5.85%]">DES</td>
                  <td className="border border-black px-1 py-1 w-[13.8%]"></td>
                </tr>

                {/* IPAL OUTLET ROWS */}
                {ipalOutletRows.map((row, idx) => (
                  <tr key={`outlet-${idx}`} className="border border-black">
                    <td className="border border-black px-1 py-0.5 text-left font-medium whitespace-nowrap overflow-hidden">
                      {row.param}
                    </td>
                    {row.values.map((val, vIdx) => (
                      <td key={vIdx} className="border border-black px-0.5 py-0.5 text-center whitespace-nowrap">
                        {val}
                      </td>
                    ))}
                    <td className="border border-black px-1 py-0.5 text-center font-medium whitespace-nowrap">
                      {row.normal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Analisa Otomatis IPAL */}
            <div className="pt-2 text-[8.5pt] leading-relaxed text-justify">
              <p className="font-bold underline mb-0.5">Analisa :</p>
              <p className="indent-8">
                Berdasarkan hasil pemantauan dan pengujian laboratorium terhadap parameter fisika, kimia, dan mikrobiologi outlet IPAL di UOBK RSUD Al-Mulk sepanjang periode tahun {year}, secara umum sistem pengolahan limbah cair berfungsi secara efektif. Konsentrasi parameter kunci pada outlet seperti BOD (6–28 mg/L), COD (20–83 mg/L), dan TSS (5–15 mg/L) seluruhnya berada di bawah ambang batas baku mutu maksimal yang ditetapkan (BOD ≤ 30 mg/L, COD ≤ 100 mg/L, TSS ≤ 30 mg/L sesuai Permen LHK No. 68 Tahun 2016). Nilai derajat keasaman (pH) outlet berkisar antara 4,11 hingga 7,62, di mana sebagian besar bulan berada pada rentang netral 6,0–9,0. Efisiensi reduksi beban pencemar dari inlet ke outlet menunjukkan performa aerasi dan sedimentasi yang optimal, sehingga efluen yang dihasilkan aman terhadap lingkungan sekitar dan dapat dimanfaatkan kembali (<em>water reuse</em>) untuk penyiraman taman rumah sakit.
              </p>
            </div>

            {/* Rekomendasi Otomatis IPAL */}
            <div className="pt-1 text-[8.5pt] leading-relaxed text-justify">
              <p className="font-bold underline mb-0.5">Rekomendasi :</p>
              <ol className="list-decimal pl-6 space-y-0.5">
                <li>Melakukan perawatan berkala (<em>preventive maintenance</em>) terhadap mesin blower aerasi, pompa transfer limbah, dan dosing pump klorinasi secara terjadwal untuk mencegah penurunan efisiensi pengolahan.</li>
                <li>Menjaga kestabilan dosis bahan netralisasi dan disinfektan (kaporit/klorin) agar fluktuasi nilai pH dan angka Total Coliform pada outlet tetap konsisten memenuhi standar baku mutu.</li>
                <li>Melakukan pengurasan dan pengelolaan lumpur aktif (<em>sludge removal</em>) pada bak sedimentasi secara berkala guna mencegah akumulasi endapan padatan.</li>
                <li>Melanjutkan kerja sama pemantauan dan uji sampel berkala dengan laboratorium lingkungan eksternal terakreditasi KAN setiap bulan secara konsisten.</li>
              </ol>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 15: 4) PENGENDALIAN LINGKUNGAN (Halaman 11)       */}
      {/* ========================================================= */}
      <F4Page customPageNumber={11}>
        <div className="w-full h-full flex flex-col justify-start py-0.5 text-black font-sans">
          <div className="space-y-1 text-justify text-[9.5pt] leading-[1.4]">
            <h4 className="font-bold text-[10.5pt] text-black">
              4)&nbsp;&nbsp;Pengendalian lingkungan
            </h4>
            <p className="indent-0">
              UOBK RSUD Al-Mulk mencegah dan mengendalikan infeksi dengan melakukan pembersihan lingkungan :
            </p>
            <ul className="list-disc pl-5 space-y-1 text-justify">
              <li>
                Seluruh permukaan bidang datar, mebelair dan peralatan yang ada diruangan dibersihkan setiap hari dengan menggunakan cairan klorin 0,05 %, kecuali permukaan yang berbahan stainles steel.
              </li>
              <li>
                Sebelum ruang perawatan digunakan pasien berikutnya, fasilitas dan lingkungan pasien dibersihkan menggunakan cairan klorin 0,05 % untuk permukaan dan untuk lantai 0,5%.
              </li>
              <li>
                Proses pembersihan ruangan airborne menggunakan sinar ultra violet dan ruangan dilakukan desinfeksi permukaan dengan klorin 0,05%
              </li>
              <li>
                Sistem ventilasi dan kelembaban diruang risiko tinggi IBS, ICU ruang Isolasi tidak memenuhi standar
              </li>
              <li>
                Pengadaan hepafilter untuk memperbaiki sirkulasi udara di ruangan risiko tinggi belum terealisasi
              </li>
              <li>
                Pemberlakuan jam kunjung
              </li>
              <li>
                Pembatasan usia pengunjung pasien. Anak dibawah usia 12 tahun tidak boleh berkunjung ke ruang rawat inap, kecuali untuk mendapatkan pelayanan kesehatannya
              </li>
              <li>
                Edukasi kepada keluarga pasien dan pengunjung tentang hand hygiene
              </li>
              <li>
                Segera membersihkan tumpahan darah dan cairan tubuh pasien sesuai SPO oleh petugas jaga atau cleaning service
              </li>
              <li>
                Upaya pemberantasan tikus, kucing dan serangga belum optimal
              </li>
              <li>
                Wilayah tanpa rokok sudah diberlakukan, tapi masih banyak ditemukan pengunjung dan petugas rumah sakit merokok di dalam lingkungan rumah sakit.
              </li>
              <li>
                <strong>ICRA Kontruksi dan Renovasi</strong>
                <p className="mt-0.5">
                  Pada bulan Mei-Juni {year}, UOBK RSUD Al-Mulk melakukan Renovasi toilet Ruang Rawat Inap Fatimah dan Rawat Inap Khadijah. Pemasangan tanda pemberitahuan dan peringatan dilakukan untuk melokalisir area dalam rangka pencegahan transmisi dampak pembangunan / renovasi kepada pasien, pengunjung, petugas maupun pekerja pada saat melakukan renovasi.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 16: 5) PENYUNTIKAN AMAN & 6) CSSD (Halaman 12)    */}
      {/* ========================================================= */}
      <F4Page customPageNumber={12}>
        <div className="w-full h-full flex flex-col justify-start py-0.5 text-black font-sans">
          <div className="space-y-1.5 text-justify text-[9.5pt] leading-[1.4]">
            {/* 5) Penyuntikan aman */}
            <div>
              <h4 className="font-bold text-[10.5pt] text-black mb-0.5">
                5)&nbsp;&nbsp;Penyuntikan aman
              </h4>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>
                  Praktik penyuntikan yang aman (one needle, one syringe, only one time) dan pemakaian obat / cairan multidose sudah diterapkan dengan baik
                </li>
                <li>
                  Pengoplosan obat dilakukan oleh perawat di ruang obat di rawat inap
                </li>
                <li>
                  Proses <em>recapping</em> dengan satu tangan jarum suntik masih dilakukan karena keterbatasan <em>safety box</em>.
                </li>
              </ul>
            </div>

            {/* 6) Perawatan peralatan pasien */}
            <div className="pt-0.5">
              <h4 className="font-bold text-[10.5pt] text-black mb-0.5">
                6)&nbsp;&nbsp;Perawatan peralatan pasien
              </h4>
              <p>
                Perawatan peralatan pasien sudah terpusat di CSSD, di mulai dari proses pembersihan sampai sterilisasi dan distribusi alat.
              </p>

              {/* a) Metode pemrosesan peralatan perawatan pasein */}
              <div className="pt-1">
                <p className="font-medium">
                  a)&nbsp;&nbsp;Metode pemrosesan peralatan perawatan pasein
                </p>
                <p className="pl-4">
                  Metode pemrosesan peralatan perawatan pasien dibagi tiga, tergantung kriteria berikut :
                </p>
                <ul className="list-disc pl-9 space-y-1 mt-0.5">
                  <li>
                    <strong>Peralatan non kritikal</strong>
                    <p>
                      Peralatan non kritikal (stetoskop, tensimeter, linen, alat makan) dilakukan pembersihan dengan cara desinfeksi tingkat rendah (<em>low level disinfection</em>), disesuaikan dengan bahannya. Stetoskop dan tensimeter dilakukan <em>swab</em>
                    </p>
                  </li>
                  <li>
                    <strong>Peralatan semi kritikal</strong>
                    <p>
                      Peralatan semi kritikal seperti endoskopi, ETT, laringoskop blade, dilakukan pembersihan dengan cara desinfeksi tingkat tinggi (<em>High Level Desinfection</em>) menggunakan larutan alkohol 70 %, belum sesuai standar
                    </p>
                  </li>
                  <li>
                    <strong>Peralatan kritikal</strong>
                    <p>
                      Semua peralatan kritikal seperti instrumen bedah, partus set dan perawatan luka, dilakukan sterilisasi di Instalasi CSSD.
                    </p>
                  </li>
                </ul>
              </div>

              {/* b) Proses dekontaminasi peralatan pasien di CSSD */}
              <div className="pt-1">
                <p className="font-medium">
                  b)&nbsp;&nbsp;Proses dekontaminasi peralatan pasien di CSSD
                </p>
                <p className="pl-4">
                  Pelaksanaan pemrosesan peralatan pasien di CSSD sudah dilakukan sesuai SPO, yaitu :
                </p>
                <ul className="list-disc pl-9 space-y-0.5 mt-0.5">
                  <li>Instrumen kotor diterima unit dekontaminasi</li>
                  <li>Direndam dengan larutan <em>enzymatic</em> untuk membersihkan lemak dan darah.</li>
                  <li>Direndam dalam larutan desinfektan untuk membunuh kuman.</li>
                  <li>Dibilas dan dikeringkan.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 17: LANJUTAN CSSD & 7) LINEN (Halaman 13)         */}
      {/* ========================================================= */}
      <F4Page customPageNumber={13}>
        <div className="w-full h-full flex flex-col justify-start py-0.5 text-black font-sans">
          <div className="space-y-1.5 text-justify text-[9.5pt] leading-[1.4]">
            {/* Lanjutan butir b) dari CSSD */}
            <ul className="list-disc pl-9 space-y-0.5">
              <li>Dilakukan uji fungsi alat</li>
              <li>Dikemas dan disterilisasi</li>
              <li>Disimpan dan didistribusikan</li>
            </ul>

            {/* c) Pelayanan pemrosesan barang dan instrumen */}
            <div className="pt-0.5">
              <p className="font-medium">
                c)&nbsp;&nbsp;Pelayanan pemrosesan barang dan instrumen
              </p>
              <p className="pl-4">
                Instalasi CSSD memberikan pelayanan pemrosesan barang dan instrumen kotor menjadi barang bersih maupun steril. Instalasi CSSD terdiri dari beberapa unit yaitu :
              </p>
              <ul className="list-disc pl-9 space-y-1 mt-0.5">
                <li>
                  Unit dekontaminasi melakukan pembersihan barang dan instrumen kotor.
                </li>
                <li>
                  Unit pengemasan, melakukan pengecekan kelayakan barang dan instrumen serta melakukan pengemasan agar sterilitas terjaga.
                </li>
                <li>
                  Unit sterilisasi, melakukan proses sterilisasi barang dan instumen yang telah dikemas, menggunakan metode yang tepat agar mencapai sterilisasi yang optimal.
                </li>
                <li>
                  Unit penyimpanan, melakukan penyimpanan barang steril dan melakukan penjaminan kualitas barang dan instrumen steril.
                </li>
                <li>
                  Unit distribusi, mengirimkan barang dan instrumen bersih maupun steril kepada ruangan yang membutuhkan.
                </li>
              </ul>
            </div>

            {/* 7) Penatalaksanaan linen */}
            <div className="pt-1.5">
              <h4 className="font-bold text-[10.5pt] text-black mb-0.5">
                7)&nbsp;&nbsp;Penatalaksanaan linen
              </h4>
              <p>
                Penatalaksaan linen kerjasama dengan pihak Rumah Sakit Bhayangkara
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-0.5">
                <li>
                  Mengambil linen kotor dari ruangan dipisah antara linen infeksius dan non infeksius
                </li>
                <li>
                  Kemudian dibawa menggunakan troli untuk didistribusikan ke Loundry Rumah Sakit Bhayangkara menggunakan ambulance khusus untuk distribusi linen
                </li>
                <li>Dilakukan penimbangan</li>
                <li>Dilakukan pencucian berdasarkan linen infeksius dan non infeksius</li>
                <li>Dilakukan pengeringan dan penyetrikaan</li>
                <li>Melakukan penyimpanan dan distribusi linen bersih</li>
                <li>Linen yang sudah bersih di ambil oleh petugas RSUD Al-Mulk</li>
                <li>Langsung didistribusikan ke ruangan-ruangan yang bersangkutan</li>
              </ul>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 18: 8) KESEHATAN S/D 11) LUMBAL PUNGSI (Halaman 14) */}
      {/* ========================================================= */}
      <F4Page customPageNumber={14}>
        <div className="w-full h-full flex flex-col justify-start py-0.5 text-black font-sans">
          <div className="space-y-1.5 text-justify text-[9.5pt] leading-[1.4]">
            {/* 8) Perlindungan Kesehatan Karyawan */}
            <div>
              <h4 className="font-bold text-[10.5pt] text-black mb-0.5">
                8)&nbsp;&nbsp;Perlindungan Kesehatan Karyawan
              </h4>
              <p className="indent-0">
                Semua karyawan yang bekerja di rumah sakit berisiko terkena penularan penyakit infeksi saat melakukan pekerjaannya. Untuk melindungi karyawan, rumah sakit melaksanakan program pemeriksaan kesehatan seluruh karyawan secara berkala satu tahun sekali.
              </p>
            </div>

            {/* 9) Penempatan pasien */}
            <div>
              <h4 className="font-bold text-[10.5pt] text-black mb-0.5">
                9)&nbsp;&nbsp;Penempatan pasien
              </h4>
              <p className="indent-0">
                Skrining pasien infeksi berdasarkan cara transmisi (droplet, airborne dan kontak) terhadap semua pasien yang masuk sebelum mendapatkan tindakan lebih lanjut.
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-0.5">
                <li>
                  Di IGD pasien baru dilakukan skrining pasien ketika pasien di duga atau terindikasi pasien infeksius. Petugas langsung membawa pasien ke ruang isolasi yang berada di IGD, pengelolaan pasien dengan memperlihatkan kewaspadaan isolasi. Setelah kondisi stabil pasien dilakukan mobilisasi petugas dengan memperhatikan kewaspadaan isolasi. Untuk alur transportasi pasien infeksius ke rawat inap belum ada jalur khusus, masih jadi satu dengan jalur pengunjung. Namun pasien yang infeksius TB Paru di pakaikan masker N95 selama dalam perjalanan ke rawat inap. Dan untuk petugas yang mengantar memakai masker bedah.
                </li>
                <li>
                  Di ruang rawat inap, pengelolaan pasien menggunakan sistem kohorting dimana kita jadi satukan pasien infeksius sesuai dengan jenisnya (<em>Airborne</em>, <em>Droplet</em> dan Kontak) dimana pasien ini tidak diperbolehkan campur jadi satu.
                </li>
              </ul>
            </div>

            {/* 10) Etika batuk */}
            <div>
              <h4 className="font-bold text-[10.5pt] text-black mb-0.5">
                10)&nbsp;&nbsp;Etika batuk
              </h4>
              <p className="indent-0">
                Edukasi etika batuk dan kebersihan nafas diberikan kepada pasien, pengunjung dan petugas rumah sakit. Edukasi kepada para pengunjung dilaksanakan di ruang tunggu poliklinik sesuai jadwal pelaksanaaan PKRS. Edukasi juga segera diberikan pada saat pasien masuk pertama di ruang perawatan. Untuk meningkatkan edukasi, dilakukan pemasangan stiker, poster, banner dan leaflet yang ditempatkan di semua area pelayanan.
              </p>
            </div>

            {/* 11) Praktek lumbal fungsi */}
            <div>
              <h4 className="font-bold text-[10.5pt] text-black mb-0.5">
                11)&nbsp;&nbsp;Praktek lumbal fungsi
              </h4>
              <p className="indent-0">
                Di RSUD Al-Mulk ada tindakan praktek lumbal fungsi terhadap pasien yang akan dilakukan operasi yaitu tindakan anestesi spinal.
              </p>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 19: 12) JENAZAH & TRANSMISI (Halaman 15)          */}
      {/* ========================================================= */}
      <F4Page customPageNumber={15}>
        <div className="w-full h-full flex flex-col justify-start py-0.5 text-black font-sans">
          <div className="space-y-1.5 text-justify text-[9.5pt] leading-[1.4]">
            {/* 12) Penanganan Jenazah */}
            <div>
              <h4 className="font-bold text-[10.5pt] text-black mb-0.5">
                12)&nbsp;&nbsp;Penanganan Jenazah
              </h4>
              <p className="indent-0">
                Penanganan jenazah di RSUD Al-Mulk belum ada pelayanan pemulasaraan jenazah, dikarenakan sarana dan prasarana belum sesuai dengan standar. Kamar jenazah hanya untuk transit jenazah saja.
              </p>
            </div>

            {/* b. Kewaspadaan berdasar Transmisi */}
            <div className="pt-0.5">
              <h4 className="font-bold text-[10.5pt] text-black mb-0.5">
                b.&nbsp;&nbsp;Kewaspadaan berdasar Transmisi
              </h4>
              <p className="indent-0">
                Kewaspadaan transmisi, sebagai bagian dari kewaspadaan isolasi, diterapkan terhadap pasien yang diketahui maupun diduga terinfeksi atau terkolonisasi patogen untuk memutuskan mata rantai transmisi infeksi. Kewaspadaan berdasarkan transmisi yang sudah dilakukan di RSUD Al-Mulk :
              </p>

              {/* 1) Kontak */}
              <div className="pt-0.5">
                <p className="font-bold text-[9.5pt] mb-0.5">1)&nbsp;&nbsp;Kontak</p>
                <p>Kewaspadaan berdasarkan transmisi kontak dilakukan dengan cara</p>
                <ol className="list-[lower-alpha] pl-6 space-y-0.5 mt-0.5">
                  <li>Penempatan pasien dengan sistem kohorting</li>
                  <li>Pemakaian APD yang tepat : apron, sarung tangan</li>
                </ol>
              </div>

              {/* 2) Droplet (TBC) */}
              <div className="pt-0.5">
                <p className="font-bold text-[9.5pt] mb-0.5">2)&nbsp;&nbsp;Droplet (TBC)</p>
                <p>Kewaspadaan berdasarkan transmisi droplet dilakukan dengan cara</p>
                <ol className="list-[lower-alpha] pl-6 space-y-0.5 mt-0.5">
                  <li>Penempatan pasien dengan system kohorting, memberi jarak tempat tidur pasien 2 meter.</li>
                  <li>Penggunaan masker bedah dalam jarak 1 meter dari pasien</li>
                  <li>Pemindahan pasien : meminimalisasi transportasi pasien, pasien menggunakan masker saat proses pemindahan</li>
                  <li>Penggunaan APD : masker bedah, sarung tangan, apron</li>
                </ol>
              </div>

              {/* 3) Airborne (TBC, MERS, Meningitis, Covid-19) */}
              <div className="pt-0.5">
                <p className="font-bold text-[9.5pt] mb-0.5">3)&nbsp;&nbsp;Airborne (TBC, MERS, Meningitis, Covid-19)</p>
                <ol className="list-[lower-alpha] pl-6 space-y-0.5 mt-0.5">
                  <li>Penempatan pasien Covid-19, memakai system kohorting, belum memenuhi standar dengan ventilasi campuran. Standar ruangan isolasi harus sirkulasi baik, bertekanan negatif dan termonitor.</li>
                  <li>Blower, exhaust fan dan jendela dapat dibuka lebar membantu sirkulasi dan ventilasi di ruangan.</li>
                  <li>Alur pasien airborne sudah konsisten dan terfokus di satu ruangan isolasi jika pasein di curigai dan di diagnosa mempunyai penyakit menular lewat udara / airborne.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 16: LANJUTAN AIRBORNE & SURVEILANS PPI (Halaman 16) */}
      {/* ========================================================= */}
      <F4Page customPageNumber={16}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3.5 text-justify text-[12pt] leading-[1.5]">
            {/* Lanjutan butir 3) Airborne: d, e, f, g */}
            <ol className="list-[lower-alpha] pl-6 space-y-1" start={4}>
              <li value={4}>Pembatasan gerak pasien belum dilakukan dengan maksimal.</li>
              <li>Lalu lintas pengunjung masih belum dapat dikendalikan.</li>
              <li>Masker N95 terbatas.</li>
              <li>Penyediaan APD belum maksimal untuk pengunjung</li>
            </ol>

            {/* 2. Surveilans PPI */}
            <div className="pt-3">
              <h4 className="font-bold text-[12pt] text-black mb-2">
                2.&nbsp;&nbsp;Surveilans PPI
              </h4>
              <p className="indent-8 mb-4 text-justify">
                Pelaksanaan surveilans Healthcare Associated Infections (HAIs) di RSUD Al-Mulk merupakan bagian dari upaya sistematis dalam pencegahan dan pengendalian infeksi di fasilitas pelayanan kesehatan. Kegiatan surveilans ini dilakukan melalui proses pengumpulan, pencatatan, dan penginputan data secara terintegrasi menggunakan Sistem Informasi Manajemen Rumah Sakit (SIMRS). Jenis HAIs yang menjadi fokus pemantauan meliputi Infeksi Saluran Kemih (ISK), Infeksi Daerah Operasi (IDO), Ventilator Associated Pneumonia (VAP), serta phlebitis. Surveilans dilaksanakan secara berkesinambungan oleh Infection Prevention and Control Nurse (IPCN) sebagai penanggung jawab utama, dengan dukungan aktif dari Infection Prevention and Control Link Nurse (IPCLN) yang berada di masing-masing unit pelayanan, sehingga diharapkan seluruh kejadian infeksi dapat teridentifikasi dan terdokumentasi dengan baik. Data hasil surveilans tersebut selanjutnya direkap, dianalisis, dan dilaporkan secara berkala kepada Tim Pencegahan dan Pengendalian Infeksi (PPI) RSUD Al-Mulk sebagai dasar evaluasi dan pengambilan keputusan.
              </p>
              <p className="indent-8 text-justify">
                Namun demikian, dalam implementasinya masih ditemukan beberapa kendala yang mempengaruhi optimalisasi pelaksanaan surveilans HAIs. Salah satu permasalahan yang terjadi adalah belum optimalnya kepatuhan sebagian IPCLN dalam melakukan penginputan data HAIs secara real time sesuai dengan waktu kejadian di unit kerja masing-masing. Keterlambatan penginputan data tersebut mengakibatkan data surveilans yang tersedia pada akhir periode pelaporan bulanan menjadi tidak lengkap dan belum terverifikasi secara menyeluruh. Kondisi ini berdampak pada terhambatnya proses rekapitulasi, analisis data, serta penyusunan laporan HAIs, sehingga pelaporan kepada pihak eksternal, khususnya Kementerian Kesehatan, tidak dapat dilakukan secara tepat waktu sesuai dengan ketentuan yang berlaku.
              </p>
            </div>
          </div>
        </div>
      </F4Page>
    </>
  );
}

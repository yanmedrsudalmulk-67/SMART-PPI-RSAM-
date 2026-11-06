import React from 'react';
import F4Page from './F4Page';
import ReportCover from './ReportCover';
import OfficialModernBarChart from './OfficialModernBarChart';
import { OfficialReportData, useOfficialReportData } from '@/hooks/useOfficialReportData';

interface MonthlyReportProps {
  reportData?: OfficialReportData;
  month?: number;
  year?: number;
}

export default function MonthlyOfficialReport({
  reportData,
  month = 8, // Default: September (index 8)
  year = 2026,
}: MonthlyReportProps) {
  const internalData = useOfficialReportData({
    periodType: 'monthly',
    month,
    year,
  });

  const data = reportData || internalData;
  const monthName = data.monthName || 'September';
  const reportYear = data.year || year;
  const totalPages = 11;

  // Fallback data matching authentic document 9._Laporan_IPCN_September_2026.docx
  const isDocBaseline = month === 8 && reportYear === 2026;

  // Phlebitis room data
  const phlebitisRooms = [
    { room: 'Ranap Bedah', days: 128, cases: 1, rate: 7.8 },
    { room: 'Ranap Anak', days: 765, cases: 4, rate: 5.2 },
    { room: 'Ranap Kebidanan', days: 56, cases: 0, rate: 0.0 },
    { room: 'Ranap Dewasa', days: 471, cases: 8, rate: 16.9 },
  ];

  // ISK room data
  const iskRooms = [
    { room: 'Ranap Bedah', days: 27, cases: 0, rate: 0.0 },
    { room: 'Ranap Anak', days: 0, cases: 0, rate: 0.0 },
    { room: 'Ranap Kebidanan', days: 8, cases: 0, rate: 0.0 },
    { room: 'Ranap Dewasa', days: 20, cases: 0, rate: 0.0 },
  ];

  // Decubitus room data
  const decubitusRooms = [
    { room: 'Ranap Bedah', days: 17, cases: 0, rate: 0.0 },
    { room: 'Ranap Anak', days: 12, cases: 0, rate: 0.0 },
    { room: 'Ranap Kebidanan', days: 0, cases: 0, rate: 0.0 },
    { room: 'Ranap Dewasa', days: 20, cases: 0, rate: 0.0 },
  ];

  // VAP room data
  const vapRooms = [
    { room: 'Ranap Bedah', days: 0, cases: 0, rate: 0.0 },
    { room: 'Ranap Anak', days: 0, cases: 0, rate: 0.0 },
    { room: 'Ranap Kebidanan', days: 0, cases: 0, rate: 0.0 },
    { room: 'Ranap Dewasa', days: 2, cases: 0, rate: 0.0 },
  ];

  // IDO operations data
  const idoOperations = [
    { type: 'Appendicitis', cases: 0, rate: 0.0, target: 2.0 },
    { type: 'Hernia', cases: 0, rate: 0.0, target: 2.0 },
    { type: 'Sectio Caesaria', cases: 0, rate: 0.0, target: 2.0 },
    { type: 'STT', cases: 0, rate: 0.0, target: 2.0 },
  ];

  // Hand hygiene professions data
  const hhProfessionsData = [
    { profession: 'Perawat / Bidan', num: 250, denum: 310, rate: 81, target: 85 },
    { profession: 'Dokter', num: 51, denum: 63, rate: 81, target: 85 },
    { profession: 'Nakes Lain', num: 54, denum: 67, rate: 80, target: 85 },
  ];

  // APD monthly trend data
  const apdMonthlyTrend = [
    { month: 'JAN', value: 98.0, target: 100 },
    { month: 'FEB', value: 98.2, target: 100 },
    { month: 'MAR', value: 100.0, target: 100 },
    { month: 'APR', value: 97.0, target: 100 },
    { month: 'MEI', value: 100.0, target: 100 },
    { month: 'JUN', value: 98.0, target: 100 },
    { month: 'JUL', value: 100.0, target: 100 },
    { month: 'AGUST', value: 100.0, target: 100 },
    { month: 'SEP', value: 99.0, target: 100 },
    { month: 'OKT', value: null, target: 100 },
    { month: 'NOV', value: null, target: 100 },
    { month: 'DES', value: null, target: 100 },
  ];

  return (
    <div id="print-area-monthly" className="w-full flex flex-col items-center official-pages-container transition-all">
      {/* ========================================================= */}
      {/* HALAMAN 1: COVER DOKUMEN RESMI F4                         */}
      {/* ========================================================= */}
      <F4Page pageNumber={1} totalPages={totalPages} isCover>
        <ReportCover
          reportType="monthly"
          title="LAPORAN IPCN"
          periodText={`BULAN ${monthName.toUpperCase()} ${reportYear}`}
          year={String(reportYear)}
        />
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 2: BAB I PENDAHULUAN - LATAR BELAKANG             */}
      {/* ========================================================= */}
      <F4Page pageNumber={2} totalPages={totalPages}>
        <div className="text-center font-bold mb-4 pt-2">
          <h2 className="text-sm uppercase tracking-wide">
            LAPORAN IPCN BULAN {monthName.toUpperCase()} {reportYear}
          </h2>
          <h3 className="text-xs uppercase text-emerald-800">
            PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)
          </h3>
          <p className="text-[10pt] font-semibold text-slate-700">UOBK RSUD AL-MULK KOTA SUKABUMI</p>
        </div>

        <div className="mb-2 text-justify">
          <h4 className="font-bold text-center uppercase tracking-wide border-b border-black pb-1 mb-4 text-xs">
            BAB I PENDAHULUAN
          </h4>

          <h5 className="font-bold text-[11pt] mb-2.5">Latar Belakang</h5>
          <p className="indent-8 mb-3 leading-relaxed">
            Pencegahan dan Pengendalian infeksi di rumah sakit merupakan suatu upaya kegiatan untuk meminimalkan atau mencegah terjadinya infeksi pada pasien, petugas, pengunjung dan masyarakat di sekitar Rumah Sakit. Program pencegahan dan pengendalian infeksi antara lain; Pencegahan infeksi, penggunaan antibiotik secara rasional, kewaspadaan standar, surveilans, pendidikan dan pelatihan.
          </p>
          <p className="indent-8 mb-3 leading-relaxed">
            Kegaiatan surveilans infeksi dirumah sakit merupakan salah satu kegiatan yang penting dan luas dalam program pengendalian infeksi dan suatu hal yang harus dilakukan untuk mencapai keberhasilan dari Program PPI.
          </p>
          <p className="indent-8 mb-3 leading-relaxed">
            Ditinjau dari asal atau didapatnya infeksi dapat berasal dari komunitas atau berasal dari lingkungan rumah sakit (Hospital Acquired Infection) yang sebelumnya dikenal istilah infeksi nosokomial. Karena sering kali tidak bisa secara pasti ditentukan asal infeksi, maka sekarang istilah infeksi nosokomial diganti dengan istilah baru yaitu Healthcare Associated Infections (HAIs).
          </p>
          <p className="indent-8 mb-3 leading-relaxed">
            Healthcare Associated Infections (HAIs) merupakan kejadian infeksi yang didapatkan penderita setelah mendapatkan perawatan &gt; 48 jam dan pasien tidak dalam masa inkubasi. Macam kejadian HAIs banyak dihubungkan karena pemasangan alat, seperti CAUTI (Catheter Associated Urinary Tract Infection), VAP (Ventilator Associated Pneumonia), CRBSI (Catheter IV Central Related Blood Stream Infections) dan IDO (Infeksi Daerah Operasi) karena tindakan operasi.
          </p>
          <p className="indent-8 mb-3 leading-relaxed">
            Pengetahuan tentang infeksi nosokomial dan pencegahannya merupakan stimulus sosial yang dapat menimbulkan respon emosional terhadap upaya universal precaution sehingga akan meningkatkan peran sertanya dalam upaya pencegahan infeksi nosokomial.
          </p>
          <p className="indent-8 leading-relaxed">
            Kegagalan melakukan kebersihan tangan yang baik dan benar dianggap sebagai penyebab utama infeksi nosokomial atau HAIs dan penyebaran mikroorganisme multiresisten di fasilitas pelayanan kesehatan dan telah diakui sebagai kontribusi yang penting terhadap timbulnya wabah (Boyce and Pittet,, 2002). Sehingga perlu adanya audit kepatuhan pelaksanaan kewaspadaan standar yang dilakukan oleh Tim Pencegahan dan Pengendalian Infeksi di UOBK RSUD Al-Mulk Kota Sukabumi.
          </p>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 3: TUJUAN UMUM & KHUSUS & MANFAAT SURVEILANS      */}
      {/* ========================================================= */}
      <F4Page pageNumber={3} totalPages={totalPages}>
        <div className="mb-4 pt-2">
          <h5 className="font-bold text-[11pt] mb-3">Tujuan Umum dan Khusus</h5>
          
          <div className="mb-4 text-justify">
            <p className="font-bold text-[10.5pt] mb-1">Tujuan Umum</p>
            <p className="indent-8 leading-relaxed">
              Mengetahui angka kepatuhan pelaksanaan kewaspadaan standar, dan surveilans Rumah Sakit.
            </p>
          </div>

          <div className="mb-5 text-justify">
            <p className="font-bold text-[10.5pt] mb-1.5">Tujuan Khusus</p>
            <ol className="list-decimal pl-10 space-y-2 leading-relaxed">
              <li>Mendapatkan data dasar infeksi di UOBK RSUD Al-Mulk.</li>
              <li>Mengukur dan menilai keberhasilan suatu Program PPI di RSUD Al-Mulk.</li>
              <li>Mengetahui permasalahan tentang kesehatan yang memerlukan penanggulangan.</li>
            </ol>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-justify">
            <h5 className="font-bold text-[11pt] mb-2.5">Manfaat Surveilans</h5>
            <ol className="list-decimal pl-10 space-y-2 leading-relaxed">
              <li>Meningkatkan mutu pelayanan medis dan keselamatan pasien di UOBK RSUD Al-Mulk Kota Sukabumi.</li>
              <li>Mencegah terjadinya Kejadian Luar Biasa (KLB) infeksi nosokomial di seluruh lingkungan rumah sakit.</li>
              <li>Memberikan perlindungan maksimal bagi pasien, tenaga medis, staf, dan pengunjung dari risiko penularan infeksi silang.</li>
              <li>Sebagai dasar perencanaan, evaluasi berkala, dan penyusunan kebijakan teknis operasional PPI bagi jajaran manajemen rumah sakit.</li>
            </ol>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 4: BAB II PROGRAM KERJA PPI & TABEL 1 HAIs        */}
      {/* ========================================================= */}
      <F4Page pageNumber={4} totalPages={totalPages}>
        <div className="pt-2 text-justify">
          <h4 className="font-bold text-center uppercase tracking-wide border-b border-black pb-1 mb-4 text-xs">
            BAB II LAPORAN KEGIATAN PROGRAM PPI
          </h4>

          <div className="mb-4">
            <h5 className="font-bold text-[11pt] mb-1.5">SURVEILANS</h5>
            <p className="indent-8 mb-2.5 leading-relaxed">
              Surveilans infeksi Rumah Sakit adalah suatu proses yang dinamis, sistematis, terus menerus dalam pengumpulan, identifikasi, analisis dan interpretasi data kesehatan yang penting pada suatu populasi spesifik dan didiseminasikan secara berkala kepada pihak-pihak yang memerlukan untuk digunakan dalam perencanaan, penerapan, serta evaluasi suatu tindakan yang berhubungan dengan kesehatan (Kemenkes, 2011).
            </p>
            <p className="indent-8 mb-2.5 leading-relaxed">
              Metode surveilans yang digunakan adalah Surveilans Hasil (Outcome Surveilans). Pada umumnya yang diperoleh dipantau adalah kejadian Phlebitis, Infeksi Saluran Kemih (ISK), Kejadian Decubitus, IDO dan VAP.
            </p>
            <p className="indent-8 mb-3 leading-relaxed">
              Angka Phlebitis yang dimasukkan kedalam HAIs adalah dari grade II-V.
            </p>
            <p className="font-bold text-[10.5pt] mt-3 mb-1">
              Angka kejadian (Incident Rate) HAIs bulan {monthName} {reportYear}
            </p>
          </div>

          <div className="mt-2">
            <p className="text-center font-bold text-[9.5pt] mb-2">
              Tabel.1 Incident Rate HAIs UOBK RSUD Al-Mulk Bulan {monthName} {reportYear}.
            </p>

            {/* Tabel 1 HAIs per Ruangan */}
            <table className="w-full border-collapse border border-black text-center text-[8.5pt]">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-black p-1.5 w-1/4" rowSpan={2}>JENIS INFEKSI</th>
                  <th className="border border-black p-1.5 w-1/4" rowSpan={2}>ALAT INVASIF</th>
                  <th className="border border-black p-1.5" colSpan={4}>Ruangan</th>
                </tr>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-black p-1 w-1/8">Ranap Bedah</th>
                  <th className="border border-black p-1 w-1/8">Ranap Anak</th>
                  <th className="border border-black p-1 w-1/8">Ranap Kebidanan</th>
                  <th className="border border-black p-1 w-1/8">Ranap Dewasa</th>
                </tr>
              </thead>
              <tbody>
                {/* PHLEBITIS */}
                <tr>
                  <td className="border border-black p-1 font-bold text-left" rowSpan={3}>PHLEBITIS</td>
                  <td className="border border-black p-1 text-left">Total hari pemasangan</td>
                  <td className="border border-black p-1">128</td>
                  <td className="border border-black p-1">765</td>
                  <td className="border border-black p-1">56</td>
                  <td className="border border-black p-1">471</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-left">Infeksi</td>
                  <td className="border border-black p-1">1</td>
                  <td className="border border-black p-1">4</td>
                  <td className="border border-black p-1">0</td>
                  <td className="border border-black p-1 font-bold">8</td>
                </tr>
                <tr className="bg-amber-50/60 font-semibold">
                  <td className="border border-black p-1 text-left">Rate In</td>
                  <td className="border border-black p-1">7,8 ‰</td>
                  <td className="border border-black p-1">5,2 ‰</td>
                  <td className="border border-black p-1">0 ‰</td>
                  <td className="border border-black p-1 font-bold text-amber-700">16,9 ‰</td>
                </tr>

                {/* ISK */}
                <tr>
                  <td className="border border-black p-1 font-bold text-left" rowSpan={3}>ISK</td>
                  <td className="border border-black p-1 text-left">Total hari pemasangan</td>
                  <td className="border border-black p-1">27</td>
                  <td className="border border-black p-1">0</td>
                  <td className="border border-black p-1">8</td>
                  <td className="border border-black p-1">20</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-left">Infeksi</td>
                  <td className="border border-black p-1">0</td>
                  <td className="border border-black p-1">0</td>
                  <td className="border border-black p-1">0</td>
                  <td className="border border-black p-1">0</td>
                </tr>
                <tr className="font-semibold">
                  <td className="border border-black p-1 text-left">Rate In</td>
                  <td className="border border-black p-1">0 ‰</td>
                  <td className="border border-black p-1">0 ‰</td>
                  <td className="border border-black p-1">0 ‰</td>
                  <td className="border border-black p-1">0 ‰</td>
                </tr>

                {/* DECUBITUS */}
                <tr>
                  <td className="border border-black p-1 font-bold text-left" rowSpan={3}>DECUBITUS</td>
                  <td className="border border-black p-1 text-left">Total hari tirah baring</td>
                  <td className="border border-black p-1">17</td>
                  <td className="border border-black p-1">12</td>
                  <td className="border border-black p-1">0</td>
                  <td className="border border-black p-1">20</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-left">Infeksi</td>
                  <td className="border border-black p-1">0</td>
                  <td className="border border-black p-1">0</td>
                  <td className="border border-black p-1">0</td>
                  <td className="border border-black p-1">0</td>
                </tr>
                <tr className="font-semibold">
                  <td className="border border-black p-1 text-left">Rate In</td>
                  <td className="border border-black p-1">0 ‰</td>
                  <td className="border border-black p-1">0 ‰</td>
                  <td className="border border-black p-1">0 ‰</td>
                  <td className="border border-black p-1">0 ‰</td>
                </tr>

                {/* VAP */}
                <tr>
                  <td className="border border-black p-1 font-bold text-left" rowSpan={3}>VAP</td>
                  <td className="border border-black p-1 text-left">Total hari pemasangan</td>
                  <td className="border border-black p-1">0</td>
                  <td className="border border-black p-1">0</td>
                  <td className="border border-black p-1">0</td>
                  <td className="border border-black p-1">2</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 text-left">Infeksi</td>
                  <td className="border border-black p-1">0</td>
                  <td className="border border-black p-1">0</td>
                  <td className="border border-black p-1">0</td>
                  <td className="border border-black p-1">0</td>
                </tr>
                <tr className="font-semibold">
                  <td className="border border-black p-1 text-left">Rate In</td>
                  <td className="border border-black p-1">0 ‰</td>
                  <td className="border border-black p-1">0 ‰</td>
                  <td className="border border-black p-1">0 ‰</td>
                  <td className="border border-black p-1">0 ‰</td>
                </tr>
              </tbody>
            </table>

            {/* Sub-tabel IDO */}
            <table className="w-full border-collapse border border-black text-center text-[8.5pt] mt-3">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-black p-1">Jenis Infeksi</th>
                  <th className="border border-black p-1">Jumlah pasien yang di operasi</th>
                  <th className="border border-black p-1">Infeksi</th>
                  <th className="border border-black p-1">Rate In</th>
                  <th className="border border-black p-1">Kasus Operasi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-1 font-bold">IDO</td>
                  <td className="border border-black p-1">42</td>
                  <td className="border border-black p-1">0</td>
                  <td className="border border-black p-1 font-bold">0%</td>
                  <td className="border border-black p-1">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 5: GRAFIK HAIs + GRAFIK & TABEL PHLEBITIS         */}
      {/* ========================================================= */}
      <F4Page pageNumber={5} totalPages={totalPages}>
        <div className="mb-2 pt-2 text-justify">
          {/* Grafik 1 HAIs */}
          <OfficialModernBarChart
            title={`Grafik.1 Incident Rate HAIs UOBK RSUD Al-Mulk Bulan ${monthName} ${reportYear}`}
            data={[
              { label: 'PHLEBITIS', value: 9.1, formattedValue: '9,1‰', color: '#f59e0b' },
              { label: 'ISK', value: 0, formattedValue: '0‰', color: '#0f2942' },
              { label: 'DECUBITUS', value: 0, formattedValue: '0‰', color: '#20b2aa' },
              { label: 'IDO', value: 0, formattedValue: '0%', color: '#10b981' },
              { label: 'VAP', value: 0, formattedValue: '0‰', color: '#3b82f6' },
            ]}
            height={130}
          />
          <p className="text-[7.5pt] text-slate-600 text-center mb-2 font-semibold">
            Target Standar Nasional: Phlebitis ≤ 1‰, ISK ≤ 4.7‰, Decubitus ≤ 1‰, IDO ≤ 2%, VAP ≤ 5.8‰
          </p>

          <p className="text-[9.5pt] leading-relaxed mb-3">
            <span className="font-bold">Analisa : </span>
            Berdasarkan grafik diatas menunjukkan bahwa insiden rate HAIs pada bulan {monthName} {reportYear}, kejadian infeksi phlebitis mengalami peningkatan dari bulan Agustus 2026 yaitu 5,9‰ menjadi 9,1‰ pada bulan September 2026. Dengan jumlah pasien yang phlebitis 13 orang. Sedangkan pada HAIs yang lain tidak ada kejadian infeksi.
          </p>

          <h5 className="font-bold text-[10.5pt] mt-3 mb-1">Angka Kejadian (Incidence Rate) Phlebitis</h5>
          <p className="indent-8 text-[9.5pt] leading-relaxed mb-2">
            Angka Kejadian (incidence Rate) Phlebitis per 1000 hari pemakaian intra vascular line (‰) pada bulan {monthName} {reportYear}.
          </p>

          {/* Grafik 2 Phlebitis */}
          <OfficialModernBarChart
            title={`Grafik.2 Insidence Rate Phlebitis Di RSUD Al-Mulk bulan ${monthName} ${reportYear}`}
            data={[
              { label: 'RANAP DEWASA', value: 16.9, formattedValue: '16,9‰', color: '#f59e0b' },
              { label: 'RANAP ANAK', value: 5.2, formattedValue: '5,2‰', color: '#0f2942' },
              { label: 'RANAP KEBIDANAN', value: 0, formattedValue: '0‰', color: '#20b2aa' },
              { label: 'RANAP BEDAH', value: 7.8, formattedValue: '7,8‰', color: '#3b82f6' },
            ]}
            height={125}
          />

          <p className="text-[9.5pt] leading-relaxed mb-2">
            <span className="font-bold">Analisa : </span>
            Berdasarkan grafik diatas menunjukkan bahwa insiden rate phlebitis bulan {monthName} {reportYear} paling banyak di ruang rawat inap Dewasa yaitu 16,9‰ dengan jumlah sebanyak 8 orang
          </p>

          <p className="text-center font-bold text-[9pt] mb-1">
            Tabel 2. Insidence Rate Phlebitis Di UOBK RSUD Al-Mulk bulan {monthName} {reportYear}.
          </p>
          <table className="w-full border-collapse border border-black text-center text-[8.5pt]">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1 w-1/4">INDIKATOR</th>
                <th className="border border-black p-1" colSpan={4}>Ruangan</th>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1"></th>
                <th className="border border-black p-1">Ranap Bedah</th>
                <th className="border border-black p-1">Ranap Anak</th>
                <th className="border border-black p-1">Ranap Kebidanan</th>
                <th className="border border-black p-1">Ranap Dewasa</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Hari terpasang alat</td>
                <td className="border border-black p-1">128</td>
                <td className="border border-black p-1">765</td>
                <td className="border border-black p-1">56</td>
                <td className="border border-black p-1">471</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Phlebitis</td>
                <td className="border border-black p-1">1</td>
                <td className="border border-black p-1">4</td>
                <td className="border border-black p-1">0</td>
                <td className="border border-black p-1 font-bold">8</td>
              </tr>
              <tr className="bg-amber-50/60 font-bold">
                <td className="border border-black p-1 text-left">‰</td>
                <td className="border border-black p-1">7,8 ‰</td>
                <td className="border border-black p-1">5,2 ‰</td>
                <td className="border border-black p-1">0 ‰</td>
                <td className="border border-black p-1 text-amber-800">16,9 ‰</td>
              </tr>
            </tbody>
          </table>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 6: ISK & DECUBITUS                                */}
      {/* ========================================================= */}
      <F4Page pageNumber={6} totalPages={totalPages}>
        <div className="mb-2 pt-2 text-justify">
          <h5 className="font-bold text-[10.5pt] mb-1">
            Angka Kejadian (Incidence Rate) Infeksi Saluran Kemih (ISK)
          </h5>
          <p className="indent-8 text-[9.5pt] leading-relaxed mb-2">
            Angka Kejadian (incidence Rate) Infeksi Saluran Kemih (ISK) per 1000 hari pemakaian alat (‰) di UOBK RSUD Al-Mulk bulan {monthName.toUpperCase()} {reportYear}.
          </p>

          {/* Grafik 3 ISK */}
          <OfficialModernBarChart
            title={`Grafik 3. Insidence Rate Infeksi Saluran Kemih Di UOBK RSUD Al-Mulk bulan ${monthName} ${reportYear}.`}
            data={[
              { label: 'RANAP DEWASA', value: 0, formattedValue: '0‰', color: '#0f2942' },
              { label: 'RANAP ANAK', value: 0, formattedValue: '0‰', color: '#f59e0b' },
              { label: 'RANAP KEBIDANAN', value: 0, formattedValue: '0‰', color: '#20b2aa' },
              { label: 'RANAP BEDAH', value: 0, formattedValue: '0‰', color: '#3b82f6' },
            ]}
            height={115}
          />

          <p className="text-[9.5pt] leading-relaxed mb-2">
            <span className="font-bold">Analisa : </span>
            Berdasarkan grafik diatas menunjukkan bahwa insiden rate ISK selama bulan {monthName} {reportYear}, tidak ada kejadian Infeksi Saluran Kemih.
          </p>

          <p className="text-center font-bold text-[9pt] mb-1">
            Tabel 3. Infeksi Saluran Kemih (ISK) per 1000 Hari Pemakaian Alat (‰) di UOBK RSUD Al-Mulk bulan {monthName} {reportYear}.
          </p>
          <table className="w-full border-collapse border border-black text-center text-[8.5pt] mb-4">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1 w-1/4">INDIKATOR</th>
                <th className="border border-black p-1" colSpan={4}>Ruangan</th>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1"></th>
                <th className="border border-black p-1">Ranap Bedah</th>
                <th className="border border-black p-1">Ranap Anak</th>
                <th className="border border-black p-1">Ranap Kebidanan</th>
                <th className="border border-black p-1">Ranap Dewasa</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Hari terpasang alat</td>
                <td className="border border-black p-1">27</td>
                <td className="border border-black p-1">0</td>
                <td className="border border-black p-1">8</td>
                <td className="border border-black p-1">20</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">ISK</td>
                <td className="border border-black p-1">0</td>
                <td className="border border-black p-1">0</td>
                <td className="border border-black p-1">0</td>
                <td className="border border-black p-1">0</td>
              </tr>
              <tr className="font-semibold">
                <td className="border border-black p-1 text-left">‰</td>
                <td className="border border-black p-1">0 ‰</td>
                <td className="border border-black p-1">0 ‰</td>
                <td className="border border-black p-1">0 ‰</td>
                <td className="border border-black p-1">0 ‰</td>
              </tr>
            </tbody>
          </table>

          <h5 className="font-bold text-[10.5pt] mt-3 mb-1">Angka Kejadian (Incidence Rate) Decubitus</h5>

          {/* Grafik 4 Decubitus */}
          <OfficialModernBarChart
            title={`Grafik. 4 Insidence Rate Infeksi Decubitus Di UOBK RSUD Al-Mulk bulan ${monthName} ${reportYear}.`}
            data={[
              { label: 'RANAP DEWASA', value: 0, formattedValue: '0‰', color: '#20b2aa' },
              { label: 'RANAP ANAK', value: 0, formattedValue: '0‰', color: '#f59e0b' },
              { label: 'RANAP KEBIDANAN', value: 0, formattedValue: '0‰', color: '#0f2942' },
              { label: 'RANAP BEDAH', value: 0, formattedValue: '0‰', color: '#3b82f6' },
            ]}
            height={115}
          />

          <p className="text-[9.5pt] leading-relaxed mb-2">
            <span className="font-bold">Analisa : </span>
            Berdasarkan grafik diatas menunjukkan bahwa insiden rate Decubitus selama bulan {monthName} {reportYear}, tidak ada kejadian decubitus.
          </p>

          <p className="text-center font-bold text-[9pt] mb-1">
            Tabel 4. Infeksi Decubitus per 1000 Hari Tirah Baring (‰) di UOBK RSUD Al-Mulk bulan {monthName} {reportYear}.
          </p>
          <table className="w-full border-collapse border border-black text-center text-[8.5pt]">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1 w-1/4">INDIKATOR</th>
                <th className="border border-black p-1" colSpan={4}>Ruangan</th>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1"></th>
                <th className="border border-black p-1">Ranap Bedah</th>
                <th className="border border-black p-1">Ranap Anak</th>
                <th className="border border-black p-1">Ranap Kebidanan</th>
                <th className="border border-black p-1">Ranap Dewasa</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Tirah baring</td>
                <td className="border border-black p-1">17</td>
                <td className="border border-black p-1">12</td>
                <td className="border border-black p-1">0</td>
                <td className="border border-black p-1">20</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Infeksi Decubitus</td>
                <td className="border border-black p-1">0</td>
                <td className="border border-black p-1">0</td>
                <td className="border border-black p-1">0</td>
                <td className="border border-black p-1">0</td>
              </tr>
              <tr className="font-semibold">
                <td className="border border-black p-1 text-left">‰</td>
                <td className="border border-black p-1">0 ‰</td>
                <td className="border border-black p-1">0 ‰</td>
                <td className="border border-black p-1">0 ‰</td>
                <td className="border border-black p-1">0 ‰</td>
              </tr>
            </tbody>
          </table>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 7: VAP (VENTILATOR ASSOCIATED PNEUMONIA)          */}
      {/* ========================================================= */}
      <F4Page pageNumber={7} totalPages={totalPages}>
        <div className="mb-4 pt-2 text-justify">
          <h5 className="font-bold text-[10.5pt] mb-1">
            Angka Kejadian (Incident Rate) Ventilator Associated Pneumonia (VAP)
          </h5>
          <p className="indent-8 text-[9.5pt] leading-relaxed mb-2">
            Angka Kejadian (incidence Rate) Ventilator Associated Pneumonia (VAP) per 1000 pemakaian alat (‰) di UOBK RSUD Al-Mulk bulan {monthName} {reportYear}
          </p>

          {/* Grafik 5 VAP */}
          <OfficialModernBarChart
            title={`Grafik. 5 Insidence Rate Ventilator Associated Pneumonia (VAP) di UOBK RSUD Al-Mulk bulan ${monthName} ${reportYear}.`}
            data={[
              { label: 'RANAP DEWASA', value: 0, formattedValue: '0‰', color: '#3b82f6' },
              { label: 'RANAP ANAK', value: 0, formattedValue: '0‰', color: '#f59e0b' },
              { label: 'RANAP KEBIDANAN', value: 0, formattedValue: '0‰', color: '#0f2942' },
              { label: 'RANAP BEDAH', value: 0, formattedValue: '0‰', color: '#20b2aa' },
            ]}
            height={135}
          />
          <p className="text-[7.5pt] text-slate-600 text-center mb-2 font-semibold">
            Standar Target Mutu Nasional VAP: ≤ 5.8‰
          </p>

          <p className="text-[9.5pt] leading-relaxed mb-3">
            <span className="font-bold">Analisa : </span>
            Berdasarkan grafik diatas menunjukkan bahwa insiden rate VAP selama bulan {monthName} {reportYear}, tidak ada kejadian Infeksi selama pemasangan Ventilator.
          </p>

          <p className="text-center font-bold text-[9pt] mb-1">
            Tabel. 5 Infeksi Ventilator Associated Pneumonia (VAP) Di UOBK RSUD Al-Mulk bulan {monthName} {reportYear}.
          </p>
          <table className="w-full border-collapse border border-black text-center text-[8.5pt] mb-4">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1 w-1/4">INDIKATOR</th>
                <th className="border border-black p-1" colSpan={4}>Ruangan</th>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1"></th>
                <th className="border border-black p-1">Ranap Bedah</th>
                <th className="border border-black p-1">Ranap Anak</th>
                <th className="border border-black p-1">Ranap Kebidanan</th>
                <th className="border border-black p-1">Ranap Dewasa</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Pemasangan ETT</td>
                <td className="border border-black p-1">0</td>
                <td className="border border-black p-1">0</td>
                <td className="border border-black p-1">0</td>
                <td className="border border-black p-1 font-bold">2</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Infeksi VAP</td>
                <td className="border border-black p-1">0</td>
                <td className="border border-black p-1">0</td>
                <td className="border border-black p-1">0</td>
                <td className="border border-black p-1">0</td>
              </tr>
              <tr className="font-semibold">
                <td className="border border-black p-1 text-left">‰</td>
                <td className="border border-black p-1">0 ‰</td>
                <td className="border border-black p-1">0 ‰</td>
                <td className="border border-black p-1">0 ‰</td>
                <td className="border border-black p-1">0 ‰</td>
              </tr>
            </tbody>
          </table>

          <div className="pt-2 border-t border-slate-200">
            <h5 className="font-bold text-[9.5pt] mb-1">Pemeliharaan Bundle VAP :</h5>
            <ul className="list-disc pl-8 space-y-1 text-[9pt] leading-relaxed">
              <li>Pemberian posisi kepala tempat tidur 30 - 45 derajat pada seluruh pasien terpasang ventilator mekanik.</li>
              <li>Pembersihan rongga mulut (oral hygiene) secara teratur menggunakan antiseptik chlorhexidine 0.2%.</li>
              <li>Pengisapan lendir jalan napas (suctioning) dengan teknik aseptik tertutup dan pemantauan cuff pressure berkala.</li>
            </ul>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 8: IDO (INFEKSI DAERAH OPERASI)                    */}
      {/* ========================================================= */}
      <F4Page pageNumber={8} totalPages={totalPages}>
        <div className="mb-4 pt-2 text-justify">
          <h5 className="font-bold text-[10.5pt] mb-1">
            Angka Kejadian (Incident Rate) Infeksi Darah Operasi (IDO)
          </h5>
          <p className="indent-8 text-[9.5pt] leading-relaxed mb-2">
            Angka Kejadian (incidence Rate) Infeksi Daerah Operasi di UOBK RSUD Al-Mulk bulan {monthName} {reportYear}.
          </p>

          {/* Grafik 6 IDO */}
          <OfficialModernBarChart
            title={`Grafik. 6 Insidence Rate Infeksi Daerah Operasi (IDO) Di UOBK RSUD Al-Mulk bulan ${monthName} ${reportYear}.`}
            data={[
              { label: 'APPENDICITIS', value: 0, formattedValue: '0%', color: '#10b981' },
              { label: 'HERNIA', value: 0, formattedValue: '0%', color: '#f59e0b' },
              { label: 'SECTIO CAESARIA', value: 0, formattedValue: '0%', color: '#0f2942' },
              { label: 'STT', value: 0, formattedValue: '0%', color: '#20b2aa' },
            ]}
            height={135}
          />
          <p className="text-[7.5pt] text-slate-600 text-center mb-2 font-semibold">
            Standar Target Nasional Kejadian IDO: ≤ 2%
          </p>

          <p className="text-[9.5pt] leading-relaxed mb-3">
            <span className="font-bold">Analisa : </span>
            Berdasarkan grafik diatas menunjukkan bahwa insiden rate IDO bulan {monthName} {reportYear}, tidak ada kejadian infeksi akibat luka operasi.
          </p>

          <p className="text-center font-bold text-[9pt] mb-1">
            Tabel. 6 Infeksi Daerah Operasi di UOBK RSUD Al-Mulk bulan {monthName} {reportYear}.
          </p>
          <table className="w-full border-collapse border border-black text-center text-[8.5pt] mb-4">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1 w-1/4">Jenis Operasi</th>
                <th className="border border-black p-1">App</th>
                <th className="border border-black p-1">Hernia</th>
                <th className="border border-black p-1">SC</th>
                <th className="border border-black p-1">STT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">IDO</td>
                <td className="border border-black p-1">0</td>
                <td className="border border-black p-1">0</td>
                <td className="border border-black p-1">0</td>
                <td className="border border-black p-1">0</td>
              </tr>
              <tr className="font-semibold">
                <td className="border border-black p-1 text-left">%</td>
                <td className="border border-black p-1">0%</td>
                <td className="border border-black p-1">0%</td>
                <td className="border border-black p-1">0%</td>
                <td className="border border-black p-1">0%</td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="border border-black p-1 text-left">Target</td>
                <td className="border border-black p-1">2%</td>
                <td className="border border-black p-1">2%</td>
                <td className="border border-black p-1">2%</td>
                <td className="border border-black p-1">2%</td>
              </tr>
            </tbody>
          </table>

          <div className="pt-2 border-t border-slate-200">
            <h5 className="font-bold text-[9.5pt] mb-1">Tindakan Pencegahan IDO :</h5>
            <ul className="list-disc pl-8 space-y-1 text-[9pt] leading-relaxed">
              <li>Pemberian antibiotik profilaksis secara tepat waktu (30-60 menit sebelum insisi operasi).</li>
              <li>Menjaga sterilitas alat instrumen bedah dan ruangan kamar operasi sesuai standar Kamar Bedah.</li>
              <li>Perawatan luka operasi pasca pembedahan menggunakan teknik aseptik dan penutup luka steril.</li>
            </ul>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 9: AUDIT KEBERSIHAN TANGAN (HAND HYGIENE)         */}
      {/* ========================================================= */}
      <F4Page pageNumber={9} totalPages={totalPages}>
        <div className="mb-3 pt-2 text-justify">
          <h4 className="font-bold text-center uppercase tracking-wide border-b border-black pb-1 mb-3 text-xs">
            AUDIT HAND HYGIENE DAN APD
          </h4>

          <h5 className="font-bold text-[10.5pt] mb-1">Kepatuhan Kebersihan Tangan / Hand Hygiene</h5>

          {/* Grafik 1 Hand Hygiene Berdasarkan Profesi */}
          <OfficialModernBarChart
            title={`Grafik 1. Kepatuhan Hand Hygiene di UOBK RSUD Al-Mulk bulan ${monthName} ${reportYear} berdasarkan Profesi.`}
            data={[
              { label: 'PERAWAT/BIDAN', value: 81, formattedValue: '81%', color: '#f59e0b' },
              { label: 'DOKTER', value: 81, formattedValue: '81%', color: '#0f2942' },
              { label: 'NAKES LAIN', value: 80, formattedValue: '80%', color: '#20b2aa' },
            ]}
            unit="%"
            maxValue={100}
            height={135}
          />
          <div className="flex justify-between text-[8pt] font-semibold text-slate-700 px-1 mb-2">
            <span>Target Kemenkes: ≥ 85%</span>
            <span className="font-bold text-emerald-700">Rata-rata RS: 81%</span>
          </div>

          <p className="text-[9.5pt] leading-relaxed mb-3">
            <span className="font-bold">Analisa : </span>
            Berdasarkan grafik diatas menunjukkan secara keseluruhan semua tenaga kesehatan (perawat, dokter dan tenaga kesehatan lainnya) memiliki nilai kepatuhan dibawah standar kemenkes 85%. Hal ini menunjukkan perlunya intervensi yang lebih efektif untuk meningkatkan kesadaran dan kepatuhan melakukan hand hygiene berdasarkan 5 moment.
          </p>

          <p className="text-center font-bold text-[9pt] mb-1">
            Tabel 1. Kepatuhan Hand Hygiene bulan {monthName} {reportYear}, berdasarkan profesi.
          </p>
          <table className="w-full border-collapse border border-black text-center text-[8.5pt] mb-4">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1 w-1/4">Indikator</th>
                <th className="border border-black p-1" colSpan={3}>Profesi</th>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1"></th>
                <th className="border border-black p-1">Perawat / Bidan</th>
                <th className="border border-black p-1">Dokter</th>
                <th className="border border-black p-1">Nakes Lain</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Numerator</td>
                <td className="border border-black p-1">250</td>
                <td className="border border-black p-1">51</td>
                <td className="border border-black p-1">54</td>
              </tr>
              <tr>
                <td className="border border-black p-1 text-left font-semibold">Denumerator</td>
                <td className="border border-black p-1">310</td>
                <td className="border border-black p-1">63</td>
                <td className="border border-black p-1">67</td>
              </tr>
              <tr className="bg-amber-50/60 font-bold">
                <td className="border border-black p-1 text-left">Pencapaian</td>
                <td className="border border-black p-1">81%</td>
                <td className="border border-black p-1">81%</td>
                <td className="border border-black p-1">80%</td>
              </tr>
              <tr className="bg-slate-50 font-bold text-slate-700">
                <td className="border border-black p-1 text-left">Target</td>
                <td className="border border-black p-1">85 %</td>
                <td className="border border-black p-1">85 %</td>
                <td className="border border-black p-1">85 %</td>
              </tr>
            </tbody>
          </table>

          <div className="pt-2 border-t border-slate-200">
            <h5 className="font-bold text-[9.5pt] mb-1">Fokus Monitoring Hand Hygiene :</h5>
            <ul className="list-disc pl-8 space-y-1 text-[9pt] leading-relaxed">
              <li>Peningkatan kepatuhan momen 1 (sebelum menyentuh pasien) dan momen 5 (setelah menyentuh lingkungan sekitar pasien).</li>
              <li>Penyediaan handrub yang merata dan selalu terisi penuh di setiap titik pelayanan dan bed pasien.</li>
            </ul>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 10: AUDIT ALAT PELINDUNG DIRI (APD)               */}
      {/* ========================================================= */}
      <F4Page pageNumber={10} totalPages={totalPages}>
        <div className="mb-3 pt-2 text-justify">
          <h5 className="font-bold text-[10.5pt] mb-1">Kepatuhan Penggunaan Alat Perlindungan Diri (APD)</h5>

          {/* Grafik 2 APD Periode 2026 */}
          <OfficialModernBarChart
            title={`Grafik 2. Kepatuhan Penggunaan APD di UOBK RSUD Al-Mulk bulan ${monthName} ${reportYear}.`}
            data={[
              { label: 'JAN', value: 98, formattedValue: '98%', color: '#0f2942' },
              { label: 'FEB', value: 98.2, formattedValue: '98,2%', color: '#0f2942' },
              { label: 'MAR', value: 100, formattedValue: '100%', color: '#10b981' },
              { label: 'APR', value: 97, formattedValue: '97%', color: '#f59e0b' },
              { label: 'MEI', value: 100, formattedValue: '100%', color: '#10b981' },
              { label: 'JUNI', value: 98, formattedValue: '98%', color: '#0f2942' },
              { label: 'JULI', value: 100, formattedValue: '100%', color: '#10b981' },
              { label: 'AGUST', value: 100, formattedValue: '100%', color: '#10b981' },
              { label: 'SEP', value: 99, formattedValue: '99%', color: '#20b2aa' },
            ]}
            unit="%"
            maxValue={100}
            height={130}
          />
          <div className="flex justify-between items-center text-[8pt] text-slate-600 mb-2 px-1 font-semibold">
            <span>Standar Target Kemenkes: 100%</span>
            <span className="font-bold text-emerald-700">Capaian Bulan September: 99%</span>
          </div>

          <p className="text-[9.5pt] leading-relaxed mb-3">
            <span className="font-bold">Analisa : </span>
            Berdasarkan grafik, capaian kepatuhan penggunaan Alat Pelindung Diri (APD) pada bulan September 2026 mencapai 99%, sehingga masih belum memenuhi target standar Kementerian Kesehatan yaitu 100%. Ketidaktercapaian ini dapat disebabkan oleh beberapa faktor, seperti masih adanya petugas yang belum konsisten menggunakan APD sesuai indikasi, keterbatasan pengawasan di area pelayanan tertentu, kurangnya kepatuhan pada waktu sibuk pelayanan, serta kemungkinan ketersediaan APD yang belum optimal di beberapa unit.
          </p>

          <p className="text-center font-bold text-[9pt] mb-1">
            Tabel Kepatuhan Penggunaan APD Periode Tahun {reportYear}
          </p>
          <div className="w-full overflow-hidden">
            <table className="table-fixed w-full border-collapse border border-black text-center text-[8pt]">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-black p-1 w-20 text-left">Bulan</th>
                  {apdMonthlyTrend.map((m) => (
                    <th key={m.month} className="border border-black p-1">
                      {m.month}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-1 text-left font-semibold">Capaian</td>
                  {apdMonthlyTrend.map((m) => (
                    <td key={m.month} className="border border-black p-1 font-bold">
                      {m.value !== null ? `${m.value}%` : '-'}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-50 font-bold text-slate-700">
                  <td className="border border-black p-1 text-left">Target</td>
                  {apdMonthlyTrend.map((m) => (
                    <td key={m.month} className="border border-black p-1">
                      {m.target}%
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 11: REKOMENDASI, TINDAK LANJUT & TANDA TANGAN     */}
      {/* ========================================================= */}
      <F4Page pageNumber={11} totalPages={totalPages}>
        <div className="mb-2 pt-2 text-justify">
          <h4 className="font-bold text-center uppercase tracking-wide border-b border-black pb-1 mb-2.5 text-xs">
            BAB III REKOMENDASI DAN TINDAK LANJUT
          </h4>

          <h5 className="font-bold text-[10pt] mb-1">Rekomendasi dari hasil audit Surveilans :</h5>
          
          <div className="space-y-1 text-[8.5pt] leading-relaxed mb-2.5">
            <div>
              <p className="font-bold text-[9pt]">Phlebitis :</p>
              <p className="pl-2 mb-1">Tetap mempertahankan prosedur teknik memasang infus yang benar yaitu dengan cara :</p>
              <ol className="list-decimal pl-6 space-y-0.5">
                <li>Kebersihan tangan selalu dilakukan pada 5 moment cuci tangan, salah satunya sebelum melakukan tindakan aseptik, seperti memasang infus.</li>
                <li>Memakai APD sesuai tindakan yang dilakukan,</li>
                <li>Pemilihan lokasi insersi yang tepat,</li>
                <li>Pemberian elektrolit yang bersifat asam atau alkali memudahkan terjadinya extravasasi dan infiltrasi sebaiknya diberikan per drip, pemberian larutan infus dengan osmolaritas &gt; 900 m Osm/l sebaiknya diberikan melalui CVC.</li>
                <li>Edukasi petugas tentang pemasangan dan perawatan IV kateter</li>
                <li>Lakukan desinfeksi area konektor tempat menyuntik sebelum pemberian terapi atau cairan.</li>
                <li>Sesegera mungkin melepaskan kateter IV bila sudah tidak diperlukan.</li>
                <li>Gunakan transparan dressing untuk memudahkan mengobservasi iv catheter.</li>
              </ol>
            </div>

            <div className="pt-1">
              <p className="font-bold text-[9pt]">Infeksi Saluran Kemih (ISK) :</p>
              <p className="pl-2">Bulan {monthName} {reportYear} tidak ada kejadian ISK</p>
            </div>

            <div>
              <p className="font-bold text-[9pt]">Infeksi Decubitus :</p>
              <p className="pl-2">Bulan {monthName} {reportYear} tidak ada kejadian Decubitus</p>
            </div>

            <div>
              <p className="font-bold text-[9pt]">Infeksi Ventilator Associated Pneumonia (VAP) :</p>
              <p className="pl-2">Bulan {monthName} {reportYear} tidak ada infeksi akibat pemasangan Ventilator</p>
            </div>

            <div>
              <p className="font-bold text-[9pt]">Infeksi Daerah Operasi (IDO) :</p>
              <p className="pl-2">Bulan {monthName} {reportYear} tidak ada infeksi akibat luka operasi</p>
            </div>
          </div>

          <h5 className="font-bold text-[10pt] mb-1">Rekomendasi dari hasil audit Hand Hygiene dan APD :</h5>
          <div className="space-y-1 text-[8.5pt] leading-relaxed mb-2.5">
            <div>
              <p className="font-bold text-[9pt]">Hand Hygiene :</p>
              <ol className="list-decimal pl-6 space-y-0.5">
                <li>Edukasi staf tentang pentingnya Hand Hygiene</li>
                <li>Motivasi staf untuk melakukan Hand Hygiene berdasarkan 5 moment, khususnya petugas medis</li>
                <li>Lakukan monitoring evaluasi dan demonstrasikan langkah-langkah cuci tangan</li>
              </ol>
            </div>
            <div>
              <p className="font-bold text-[9pt]">APD :</p>
              <ol className="list-decimal pl-6 space-y-0.5">
                <li>Edukasi petugas tentang pentingnya penggunaan APD untuk keselamatan staf dan pasien</li>
                <li>Fasilitasi APD lengkap di setiap unit</li>
                <li>Lakukan monitoring evaluasi dan demonstrasikan urutan pemakaian dan pelepasan APD yang benar</li>
                <li>Memfasilitasi poster tata cara pemakaian dan pelepasan APD yang benar sesuai kaidah PPI di setiap unit.</li>
                <li>Pertahankan nilai kepatuhan penggunaan APD</li>
              </ol>
            </div>
          </div>

          <h5 className="font-bold text-[10pt] mb-1">Tindak Lanjut :</h5>
          <p className="text-[8.5pt] leading-relaxed mb-4">
            Menyampaikan hasil surveilans HAIs ini ke Direktur UOBK RSUD Al-Mulk, Ketua Tim Mutu dan berkoordinasi dengan seluruh kepala unit.
          </p>

          {/* Lembar Tanda Tangan Resmi Sesuai Dokumen Word */}
          <div className="w-full pt-1 border-t border-black">
            <p className="text-right text-[9pt] mb-2 font-medium">
              Sukabumi, {month === 8 ? '10 Oktober' : '10 ' + monthName} {reportYear}
            </p>

            <table className="w-full border-none text-[9pt]">
              <tbody>
                <tr className="text-center font-bold">
                  <td className="w-1/2 align-top pb-14">
                    Mengetahui ,<br />
                    Ketua PPI
                  </td>
                  <td className="w-1/2 align-top pb-14">
                    Penyusun<br />
                    Infection Prefention Control Nurse
                  </td>
                </tr>
                <tr className="text-center font-bold">
                  <td className="align-bottom">
                    <p className="underline font-black">dr. Nurul Iman</p>
                    <p className="font-normal text-[8pt]">Ketua PPI</p>
                  </td>
                  <td className="align-bottom">
                    <p className="underline font-black">Adi Tresa Purnama, A.M.Kep</p>
                    <p className="font-normal text-[8pt]">Infection Prefention Control Nurse</p>
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
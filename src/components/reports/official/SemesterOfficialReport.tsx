import React, { useState } from 'react';
import F4Page from './F4Page';
import ReportCover from './ReportCover';

interface SemesterReportProps {
  semester?: number; // 0 for Sem 1, 1 for Sem 2
  year?: number;
}

export default function SemesterOfficialReport({
  semester = 0,
  year = 2026,
}: SemesterReportProps) {
  const [activeSem, setActiveSem] = useState<'sem1' | 'sem2'>(semester === 1 ? 'sem2' : 'sem1');

  const sem1Hais = [
    { bulan: 'Januari', phlebitis: 18.0, isk: 0, decubitus: 0, vap: 0, ido: 0 },
    { bulan: 'Februari', phlebitis: 3.1, isk: 0, decubitus: 0, vap: 0, ido: 0 },
    { bulan: 'Maret', phlebitis: 2.9, isk: 0, decubitus: 0, vap: 0, ido: 0 },
    { bulan: 'April', phlebitis: 3.5, isk: 0, decubitus: 0, vap: 0, ido: 0 },
    { bulan: 'Mei', phlebitis: 4.2, isk: 0, decubitus: 0, vap: 0, ido: 0 },
    { bulan: 'Juni', phlebitis: 3.8, isk: 0, decubitus: 0, vap: 0, ido: 0 },
  ];

  const sem2Hais = [
    { bulan: 'Juli', phlebitis: 5.2, isk: 0, decubitus: 0, vap: 0, ido: 0 },
    { bulan: 'Agustus', phlebitis: 5.9, isk: 0, decubitus: 0, vap: 0, ido: 0 },
    { bulan: 'September', phlebitis: 9.1, isk: 0, decubitus: 0, vap: 0, ido: 0 },
    { bulan: 'Oktober', phlebitis: 4.5, isk: 0, decubitus: 0, vap: 0, ido: 0 },
    { bulan: 'November', phlebitis: 3.2, isk: 0, decubitus: 0, vap: 0, ido: 0 },
    { bulan: 'Desember', phlebitis: 4.1, isk: 0, decubitus: 0, vap: 0, ido: 0 },
  ];

  const currentChartData = activeSem === 'sem1' ? sem1Hais : sem2Hais;
  const semesterTitle = activeSem === 'sem1' ? `SEMESTER I (JANUARI - JUNI ${year})` : `SEMESTER II (JULI - DESEMBER ${year})`;
  const dateReport = activeSem === 'sem1' ? `Sukabumi, 10 Juli ${year}` : `Sukabumi, 10 Januari ${year + 1}`;
  const totalPages = 5;

  return (
    <div id="print-area-semester" className="w-full flex flex-col items-center official-pages-container transition-all">
      {/* Semester Tab Switcher (Screen Only) */}
      <div className="w-full max-w-[215mm] flex items-center justify-between gap-3 mb-4 p-2 rounded-xl bg-slate-100 border border-slate-300 no-print">
        <span className="text-xs font-bold text-slate-700 pl-2">Pilih Periode Semester:</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSem('sem1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSem === 'sem1'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semester I (Jan - Jun)
          </button>
          <button
            type="button"
            onClick={() => setActiveSem('sem2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSem === 'sem2'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semester II (Jul - Des)
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* HALAMAN 1: COVER SEMESTER F4                              */}
      {/* ========================================================= */}
      <F4Page pageNumber={1} totalPages={totalPages} isCover>
        <ReportCover
          reportType="semester"
          title={activeSem === 'sem1' ? `LAPORAN SEMESTER I ${year}` : `LAPORAN SEMESTER II ${year}`}
          year={String(year)}
        />
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 2: BAB I PENDAHULUAN & RINGKASAN EKSEKUTIF        */}
      {/* ========================================================= */}
      <F4Page pageNumber={2} totalPages={totalPages}>
        <div className="text-center font-bold mb-4 pt-2">
          <h2 className="text-sm uppercase tracking-wide">
            LAPORAN EVALUASI {semesterTitle}
          </h2>
          <h3 className="text-xs uppercase text-emerald-800">
            TIM PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)
          </h3>
          <p className="text-[10pt] font-semibold text-slate-700">UOBK RSUD AL-MULK KOTA SUKABUMI</p>
        </div>

        <div className="mb-4">
          <h4 className="font-bold text-center uppercase tracking-wide border-b border-black pb-1 mb-3 text-xs">
            I. RINGKASAN EKSEKUTIF CAPAIAN {activeSem === 'sem1' ? 'SEMESTER I' : 'SEMESTER II'}
          </h4>
          <p className="indent-8 mb-3 leading-relaxed">
            Laporan semester ini merangkum seluruh pemantauan indikator Healthcare Associated Infections (HAIs), audit kewaspadaan standar, dan audit fasilitas penunjang di UOBK RSUD Al-Mulk Kota Sukabumi selama rentang waktu enam bulan. Hasil pemantauan menunjukkan capaian konsisten pada indikator bedah (IDO 0%), ISK (0%), VAP (0%), dan Decubitus (0%).
          </p>
          <p className="indent-8 mb-3 leading-relaxed">
            Fokus evaluasi utama selama semester ini terletak pada upaya pengendalian angka kejadian phlebitis di seluruh ruang rawat inap. Upaya perbaikan berkelanjutan (PDCA) telah berhasil menurunkan angka kejadian phlebitis dari titik tertinggi di awal semester menuju tren yang lebih terkendali.
          </p>
          <p className="indent-8 leading-relaxed">
            Peningkatan kepatuhan hand hygiene petugas dari 75% menjadi di atas 81% berkontribusi nyata dalam menekan penularan mikroorganisme patogen di rumah sakit.
          </p>
        </div>

        <div className="mt-4">
          <h4 className="font-bold uppercase tracking-wide border-b border-black pb-1 mb-2 text-xs">
            II. DASAR HUKUM DAN TUJUAN
          </h4>
          <ol className="list-decimal pl-10 space-y-1.5 text-[10pt] leading-relaxed">
            <li>Undang-Undang Republik Indonesia Nomor 17 Tahun 2023 tentang Kesehatan.</li>
            <li>Peraturan Menteri Kesehatan Republik Indonesia Nomor 27 Tahun 2017 tentang Pedoman Pencegahan dan Pengendalian Infeksi di Fasilitas Pelayanan Kesehatan.</li>
            <li>Keputusan Direktur UOBK RSUD Al-Mulk tentang Pembentukan Tim Pencegahan dan Pengendalian Infeksi.</li>
          </ol>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 3: EVALUASI TREND HAIs 6 BULAN                    */}
      {/* ========================================================= */}
      <F4Page pageNumber={3} totalPages={totalPages}>
        <div className="mb-3 pt-2">
          <h4 className="font-bold text-center uppercase tracking-wide border-b border-black pb-1 mb-3 text-xs">
            III. EVALUASI TREN INDIKATOR HAIs 6 BULAN
          </h4>

          <p className="text-center font-bold text-[9.5pt] mb-1">
            Tabel Capaian Indikator HAIs per Bulan {activeSem === 'sem1' ? 'Semester I' : 'Semester II'} {year}
          </p>
          <table className="w-full border-collapse border border-black text-center text-[9pt] mb-3">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1">Bulan</th>
                <th className="border border-black p-1">Phlebitis (‰)</th>
                <th className="border border-black p-1">ISK (‰)</th>
                <th className="border border-black p-1">Decubitus (‰)</th>
                <th className="border border-black p-1">VAP (‰)</th>
                <th className="border border-black p-1">IDO (%)</th>
              </tr>
            </thead>
            <tbody>
              {currentChartData.map((row) => (
                <tr key={row.bulan}>
                  <td className="border border-black p-1 text-left font-semibold">{row.bulan}</td>
                  <td className="border border-black p-1 font-bold">{row.phlebitis}‰</td>
                  <td className="border border-black p-1">0‰</td>
                  <td className="border border-black p-1">0‰</td>
                  <td className="border border-black p-1">0‰</td>
                  <td className="border border-black p-1">0%</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold">
                <td className="border border-black p-1 text-left">Rata-rata Semester</td>
                <td className="border border-black p-1 font-bold">
                  {(currentChartData.reduce((acc, r) => acc + r.phlebitis, 0) / currentChartData.length).toFixed(1)}‰
                </td>
                <td className="border border-black p-1">0‰</td>
                <td className="border border-black p-1">0‰</td>
                <td className="border border-black p-1">0‰</td>
                <td className="border border-black p-1">0%</td>
              </tr>
            </tbody>
          </table>

          <div className="w-full bg-slate-50 border border-black p-3 mb-2">
            <p className="text-[9pt] font-bold text-center mb-2">Trend Phlebitis 6 Bulan</p>
            <div className="flex items-end justify-around h-32 pt-2 border-b border-black">
              {currentChartData.map(r => (
                <div key={r.bulan} className="flex flex-col items-center">
                  <span className="text-[7.5pt] font-bold mb-0.5">{r.phlebitis}‰</span>
                  <div
                    className="w-8 bg-blue-600 rounded-t"
                    style={{ height: `${Math.min(90, r.phlebitis * 5)}px` }}
                  />
                  <span className="text-[7.5pt] font-semibold mt-1 truncate w-10 text-center">{r.bulan.slice(0, 3)}</span>
                </div>
              ))}
            </div>
            <p className="text-[8pt] text-slate-600 text-center mt-1">Standar Nasional Phlebitis: ≤ 1‰</p>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 4: AUDIT HAND HYGIENE & APD SEMESTER              */}
      {/* ========================================================= */}
      <F4Page pageNumber={4} totalPages={totalPages}>
        <div className="mb-4 pt-2">
          <h4 className="font-bold text-center uppercase tracking-wide border-b border-black pb-1 mb-3 text-xs">
            IV. EVALUASI AUDIT KEWASPADAAN STANDAR
          </h4>

          <h5 className="font-bold text-[10.5pt] mb-1">1. Kepatuhan Kebersihan Tangan (Hand Hygiene)</h5>
          <p className="indent-8 text-[10pt] leading-relaxed mb-2">
            Rata-rata kepatuhan hand hygiene staf medis dan keperawatan pada semester ini berada pada kisaran 78.5% - 81.2%. Kepatuhan pada momen 2 (sebelum tindakan aseptik) dan momen 3 (setelah terkena cairan tubuh) mencapai lebih dari 90%.
          </p>

          <h5 className="font-bold text-[10.5pt] mb-1">2. Kepatuhan Penggunaan APD</h5>
          <p className="indent-8 text-[10pt] leading-relaxed mb-3">
            Kepatuhan penggunaan APD terpantau sangat baik dan stabil di angka 98.8% di seluruh unit layanan. Petugas medis dan penunjang telah memahami penggunaan APD rasional sesuai tingkat transmisi dan jenis tindakan berisiko.
          </p>

          <h5 className="font-bold text-[10.5pt] mb-1">3. Pengendalian Lingkungan &amp; Pengelolaan Limbah</h5>
          <p className="indent-8 text-[10pt] leading-relaxed mb-2">
            Pemeriksaan kualitas mikrobiologi udara dan baku mutu efluen IPAL rumah sakit telah dilakukan secara berkala dan menunjukkan seluruh parameter kimia dan fisika memenuhi baku mutu Peraturan Pemerintah.
          </p>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 5: KESIMPULAN, REKOMENDASI & TANDA TANGAN         */}
      {/* ========================================================= */}
      <F4Page pageNumber={5} totalPages={totalPages}>
        <div className="mb-3 pt-2">
          <h4 className="font-bold text-center uppercase tracking-wide border-b border-black pb-1 mb-2 text-xs">
            V. KESIMPULAN DAN REKOMENDASI TINDAK LANJUT
          </h4>

          <h5 className="font-bold text-[10pt] mb-1">Kesimpulan :</h5>
          <p className="indent-8 text-[9.5pt] leading-relaxed mb-3">
            Program pencegahan dan pengendalian infeksi pada {semesterTitle} telah berjalan secara efektif. Indikator ISK, IDO, VAP, dan Decubitus berhasil dipertahankan pada angka 0 (nol). Angka phlebitis mengalami perbaikan substansial berkat peningkatan kepatuhan pemasangan dan pemeliharaan kanula intravena.
          </p>

          <h5 className="font-bold text-[10pt] mb-1">Rekomendasi Rencana Strategis :</h5>
          <ul className="list-disc pl-8 space-y-1 text-[9pt] leading-relaxed mb-6">
            <li>Mempertahankan pengawasan harian oleh IPCN dan IPCLN di seluruh unit rawat inap.</li>
            <li>Melakukan pelatihan berkala bagi perawat baru mengenai bundles pencegahan infeksi nosokomial.</li>
            <li>Mengoptimalkan sistem pelaporan surveilans berbasis aplikasi digital SMART PPI agar intervensi dapat dilakukan secara tepat waktu (realtime).</li>
          </ul>

          {/* Lembar Tanda Tangan Resmi Semester */}
          <div className="w-full pt-4 border-t border-black">
            <p className="text-right text-[9.5pt] mb-4 font-medium">
              {dateReport}
            </p>

            <table className="w-full border-none text-[9.5pt]">
              <tbody>
                <tr className="text-center font-bold">
                  <td className="w-1/2 align-top pb-16">
                    Mengetahui / Menyetujui,<br />
                    Direktur UOBK RSUD Al-Mulk
                  </td>
                  <td className="w-1/2 align-top pb-16">
                    Ketua Tim PPI,<br />
                    UOBK RSUD Al-Mulk
                  </td>
                </tr>
                <tr className="text-center font-bold">
                  <td className="align-bottom">
                    <p className="underline font-black">dr. Munifah Budi Isnaeni, MMRS</p>
                    <p className="font-normal text-[8.5pt]">NIP. 19741005 200604 2 018</p>
                  </td>
                  <td className="align-bottom">
                    <p className="underline font-black">dr. Nurul Iman</p>
                    <p className="font-normal text-[8.5pt]">Ketua Tim PPI RSUD Al-Mulk</p>
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

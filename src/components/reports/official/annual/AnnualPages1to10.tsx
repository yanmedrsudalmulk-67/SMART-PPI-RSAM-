import React from 'react';
import F4Page from '../F4Page';
import ReportCover from '../ReportCover';
import OfficialComparisonLineChart from '../OfficialComparisonLineChart';
import { OfficialReportData } from '@/hooks/useOfficialReportData';

interface AnnualPagesProps {
  year: number;
  reportData?: OfficialReportData;
}

export default function AnnualPages1to10({ year, reportData }: AnnualPagesProps) {
  // Hand hygiene monthly data (default official baseline 2025 with dynamic override)
  const defaultHhMonthly = [
    { bulan: 'Januari', rate: 82.5 },
    { bulan: 'Februari', rate: 84.1 },
    { bulan: 'Maret', rate: 85.0 },
    { bulan: 'April', rate: 86.3 },
    { bulan: 'Mei', rate: 87.2 },
    { bulan: 'Juni', rate: 86.8 },
    { bulan: 'Juli', rate: 88.0 },
    { bulan: 'Agustus', rate: 87.5 },
    { bulan: 'September', rate: 89.1 },
    { bulan: 'Oktober', rate: 88.4 },
    { bulan: 'November', rate: 89.6 },
    { bulan: 'Desember', rate: 90.2 },
  ];

  const hhAvg = reportData?.hasCustomData && reportData.hhOverallRate > 0 
    ? reportData.hhOverallRate 
    : 87.0;

  return (
    <>
      {/* ========================================================= */}
      {/* HALAMAN 1: COVER DOKUMEN LAPORAN TAHUNAN F4               */}
      {/* ========================================================= */}
      <F4Page pageNumber={1} isCover>
        <ReportCover
          reportType="annual"
          title={`LAPORAN TAHUNAN ${year}`}
          year={String(year)}
        />
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 2: KATA PENGANTAR (Halaman i)                     */}
      {/* ========================================================= */}
      <F4Page customPageNumber="i">
        <div className="w-full h-full flex flex-col justify-between py-1 text-black font-sans">
          <div>
            <div className="text-center font-bold mb-6 pt-1">
              <h2 className="text-sm uppercase tracking-wider text-black border-b border-black pb-1.5 inline-block">
                KATA PENGANTAR
              </h2>
            </div>

            <div className="space-y-4 text-justify text-[10.5pt] leading-relaxed text-black">
              <p className="indent-8">
                Puji syukur kita panjatkan ke hadirat Allah SWT atas segala rahmat, karunia, dan kemudahan-Nya sehingga Laporan Tahunan Program Pencegahan dan Pengendalian Infeksi (PPI) UOBK RSUD Al-Mulk Kota Sukabumi dapat tersusun dengan baik. Laporan ini disusun sebagai bentuk pertanggungjawaban sekaligus evaluasi terhadap pelaksanaan kegiatan PPI selama periode tahun {year}, serta sebagai dasar perencanaan peningkatan mutu pelayanan di tahun berikutnya.
              </p>
              <p className="indent-8">
                Sebagaimana diketahui, PPI merupakan elemen penting dalam penyelenggaraan pelayanan kesehatan yang aman, bermutu, dan berorientasi pada keselamatan pasien. Dalam satu tahun terakhir, UOBK RSUD Al-Mulk telah menghadapi berbagai tantangan terkait dinamika pelayanan, peningkatan jumlah tindakan invasif, serta potensi risiko infeksi terkait pelayanan kesehatan. Melalui komitmen bersama, kolaborasi lintas profesi, dan dukungan penuh dari manajemen rumah sakit, berbagai program penguatan PPI dapat dilaksanakan secara terarah dan berkesinambungan.
              </p>
              <p className="indent-8">
                Laporan ini memuat gambaran menyeluruh mengenai kebijakan, pelaksanaan kegiatan, capaian indikator, hasil surveilans, temuan audit, serta rekomendasi perbaikan yang diperlukan. Kami berharap laporan ini tidak hanya menjadi dokumen evaluasi, tetapi juga instrumen strategis dalam pengembangan program PPI di masa mendatang, sehingga upaya peningkatan keselamatan pasien dan keselamatan kerja bagi seluruh tenaga kesehatan dapat terus ditingkatkan.
              </p>
              <p className="indent-8">
                Kami menyampaikan apresiasi yang sebesar-besarnya kepada seluruh anggota Tim PPI, jajaran manajemen, tenaga kesehatan di seluruh unit, serta pihak-pihak lain yang telah memberikan kontribusi dalam penyusunan laporan ini. Semoga kerja sama yang baik ini terus terjaga dan memberikan dampak positif bagi peningkatan mutu layanan di RSUD Al-Mulk Kota Sukabumi.
              </p>
              <p className="indent-8">
                Akhir kata, kami berharap laporan ini dapat memberikan manfaat bagi seluruh pihak serta menjadi pendorong utama dalam penguatan budaya keselamatan dan pencegahan infeksi di lingkungan rumah sakit.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-6 pr-4">
            <div className="text-center text-[10pt]">
              <p>Sukabumi, Januari {year + 1}</p>
              <p className="font-bold mt-1">Tim PPI UOBK RSUD Al-Mulk</p>
              <div className="h-16" />
              <p className="font-bold underline">Tim Penyusun</p>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 3: DAFTAR ISI (Halaman ii)                        */}
      {/* ========================================================= */}
      <F4Page customPageNumber="ii">
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="text-center font-bold mb-6 pt-1">
            <h2 className="text-[12pt] uppercase tracking-wider text-black">
              DAFTAR ISI
            </h2>
          </div>

          <div className="space-y-3 text-[12pt] leading-[1.5] text-black">
            {/* KATA PENGANTAR */}
            <div className="flex items-baseline justify-between">
              <span>KATA PENGANTAR</span>
              <span className="flex-1 mx-2 border-b border-dotted border-black"></span>
              <span>i</span>
            </div>

            {/* DAFTAR ISI */}
            <div className="flex items-baseline justify-between">
              <span>DAFTAR ISI</span>
              <span className="flex-1 mx-2 border-b border-dotted border-black"></span>
              <span>ii</span>
            </div>

            {/* BAB I */}
            <div className="pt-1">
              <p className="font-normal">BAB I PENDAHULUAN</p>
              <div className="pl-6 space-y-1 mt-1">
                <div className="flex items-baseline justify-between">
                  <span>A. Latar Belakang</span>
                  <span className="flex-1 mx-2 border-b border-dotted border-black"></span>
                  <span>1</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span>B. Tujuan</span>
                  <span className="flex-1 mx-2 border-b border-dotted border-black"></span>
                  <span>2</span>
                </div>
              </div>
            </div>

            {/* BAB II */}
            <div className="pt-1">
              <p className="font-normal">BAB II PROGRAM KERJA</p>
              <div className="pl-6 space-y-1 mt-1">
                <div className="flex items-baseline justify-between">
                  <span>A. Pengorganisasian</span>
                  <span className="flex-1 mx-2 border-b border-dotted border-black"></span>
                  <span>3</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="max-w-[85%]">B. Peningkatan Mutu Pelayanan Kesehatan di Rumah Sakit pada Kejadian HAIs</span>
                  <span className="flex-1 mx-2 border-b border-dotted border-black"></span>
                  <span>3</span>
                </div>
              </div>
            </div>

            {/* BAB III */}
            <div className="pt-1">
              <p className="font-normal">BAB III REALISASI PROGRAM</p>
              <div className="pl-6 space-y-1 mt-1">
                <div className="flex items-baseline justify-between">
                  <span>A. Pengorganisasian</span>
                  <span className="flex-1 mx-2 border-b border-dotted border-black"></span>
                  <span>6</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="max-w-[85%]">B. Peningkatan Mutu Pelayanan Kesehatan di Rumah Sakit pada Kejadian HAIs</span>
                  <span className="flex-1 mx-2 border-b border-dotted border-black"></span>
                  <span>6</span>
                </div>
              </div>
            </div>

            {/* BAB IV */}
            <div className="pt-1">
              <p className="font-normal">BAB IV PEMBAHASAN</p>
              <div className="pl-6 space-y-1 mt-1">
                <div className="flex items-baseline justify-between">
                  <span>A. Pengorganisasian</span>
                  <span className="flex-1 mx-2 border-b border-dotted border-black"></span>
                  <span>26</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="max-w-[85%]">B. Peningkatan Mutu Pelayanan Kesehatan di Rumah Sakit pada Kejadian HAIs</span>
                  <span className="flex-1 mx-2 border-b border-dotted border-black"></span>
                  <span>26</span>
                </div>
              </div>
            </div>

            {/* BAB V */}
            <div className="pt-1">
              <p className="font-normal">BAB V PENUTUP</p>
              <div className="pl-6 space-y-1 mt-1">
                <div className="flex items-baseline justify-between">
                  <span>A. KESIMPULAN</span>
                  <span className="flex-1 mx-2 border-b border-dotted border-black"></span>
                  <span>41</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span>B. SARAN</span>
                  <span className="flex-1 mx-2 border-b border-dotted border-black"></span>
                  <span>41</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 5: BAB I PENDAHULUAN - A. LATAR BELAKANG (Halaman 1) */}
      {/* ========================================================= */}
      <F4Page customPageNumber={1}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="text-center font-bold mb-4 pt-1">
            <h2 className="text-sm uppercase tracking-wide">BAB I</h2>
            <h3 className="text-sm uppercase tracking-wide">PENDAHULUAN</h3>
          </div>

          <div className="space-y-3.5 text-justify text-[10.5pt] leading-relaxed">
            <h4 className="font-bold text-[11pt] uppercase text-black">A. LATAR BELAKANG</h4>
            <p className="indent-8">
              Pencegahan dan Pengendalian Infeksi (PPI) merupakan salah satu komponen utama dalam upaya peningkatan mutu pelayanan kesehatan serta keselamatan pasien di fasilitas pelayanan kesehatan. Sebagai rumah sakit yang terus berkembang dan berkomitmen memberikan pelayanan berkualitas, UOBK RSUD Al-Mulk Kota Sukabumi menempatkan program PPI sebagai prioritas strategis dalam setiap lini pelayanan. Hal ini sejalan dengan regulasi nasional, antara lain Permenkes tentang Pencegahan dan Pengendalian Infeksi di Fasyankes, serta standar akreditasi rumah sakit yang menekankan pentingnya penerapan PPI secara sistematis, konsisten, dan berkelanjutan.
            </p>
            <p className="indent-8">
              <strong className="italic">Healthcare Associated Infections</strong> (HAIs) adalah infeksi yang didapat atau timbul pada waktu pasien dirawat di rumah sakit, dimana tidak ada infeksi sebelumnya atau tidak dalam masa inkubasi pada saat masuk, juga infeksi yang didapat di rumah sakit tapi muncul setelah pulang, termasuk infeksi pada petugas pemberi pelayanan di rumah sakit. Kejadian infeksi dapat menghambat proses penyembuhan pasien, bahkan dapat meningkatkan morbiditas, mortalitas, dan memperpanjang lama hari rawat, sehingga biaya meningkat dan akhirnya mutu pelayanan di institusi pelayanan kesehatan akan menurun.
            </p>
            <p className="indent-8">
              Kepmenkes no. 129 tahun 2008 telah menetapkan suatu standar minimal pelayanan rumah sakit, termasuk di dalamnya pelaporan kasus HAIs untuk melihat sejauh mana rumah sakit melakukan pengendalian terhadap infeksi ini. Data HAIs digunakan sebagai acuan pencegahan infeksi guna meningkatkan mutu pelayanan Rumah sakit (Kepmenkes, 2008).
            </p>
            <p className="indent-8">
              Laporan tahunan PPI ini disusun sebagai bentuk pertanggungjawaban, evaluasi kinerja, serta dasar perencanaan perbaikan di tahun berikutnya. Melalui laporan ini, diharapkan semua pihak dapat memperoleh gambaran mengenai capaian program, tren kejadian infeksi terkait pelayanan, tingkat kepatuhan terhadap praktik PPI, serta rekomendasi penguatan sistem PPI di RSUD Al-Mulk Kota Sukabumi. Dengan demikian, rumah sakit dapat terus meningkatkan mutu pelayanan dan menjamin keselamatan pasien, pengunjung, serta seluruh tenaga kesehatan.
            </p>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 6: B. TUJUAN (Halaman 2)                          */}
      {/* ========================================================= */}
      <F4Page customPageNumber={2}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3.5 text-justify text-[10.5pt] leading-relaxed">
            <h4 className="font-bold text-[11pt] uppercase text-black">B. TUJUAN</h4>
            
            <div>
              <p className="font-bold text-[10.5pt] mb-1">1. Tujuan Umum</p>
              <p className="indent-8">
                Tujuan umum dari laporan tahunan Pencegahan dan Pengendalian Infeksi (PPI) ini adalah untuk menyajikan gambaran komprehensif mengenai pelaksanaan program kerja PPI di UOBK RSUD Al-Mulk Kota Sukabumi selama tahun {year}, mengevaluasi capaian indikator mutu dan surveilans, serta merumuskan rekomendasi strategis bagi peningkatan mutu dan keselamatan pasien secara berkesinambungan.
              </p>
            </div>

            <div className="pt-2">
              <p className="font-bold text-[10.5pt] mb-1">2. Tujuan Khusus</p>
              <ol className="list-none space-y-2 pl-4">
                <li className="flex gap-2">
                  <span className="font-bold">a.</span>
                  <span>Mengetahui tingkat kepatuhan kebersihan tangan (hand hygiene) seluruh tenaga kesehatan dan karyawan di lingkungan RSUD Al-Mulk.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">b.</span>
                  <span>Mengetahui tingkat kepatuhan penggunaan alat pelindung diri (APD) oleh tenaga kesehatan di seluruh unit pelayanan.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">c.</span>
                  <span>Mengetahui angka kejadian dan tren infeksi terkait pelayanan kesehatan (HAIs), meliputi Phlebitis, Infeksi Saluran Kemih (ISK), Infeksi Daerah Operasi (IDO), Ventilator Associated Pneumonia (VAP), dan Dekubitus.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">d.</span>
                  <span>Mengevaluasi pelaksanaan kewaspadaan standar dan transmisi, pengelolaan limbah, pengendalian lingkungan, pelayanan sterilisasi sentral (CSSD), dan tata laksana linen.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">e.</span>
                  <span>Mengevaluasi efektivitas penerapan bundles pencegahan infeksi pada tindakan invasif di seluruh ruang perawatan.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">f.</span>
                  <span>Menyusun rencana tindak lanjut dan rekomendasi perbaikan berbasis data untuk program kerja tahun {year + 1}.</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 7: BAB II PROGRAM KERJA - A & B (Halaman 3)       */}
      {/* ========================================================= */}
      <F4Page customPageNumber={3}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="text-center font-bold mb-6 pt-1">
            <h2 className="text-base uppercase tracking-wide">BAB II</h2>
            <h3 className="text-base uppercase tracking-wide">PROGRAM KERJA</h3>
          </div>

          <div className="space-y-4 text-justify text-[10.5pt] leading-relaxed">
            <div>
              <h4 className="font-bold text-[11pt] uppercase text-black mb-2">
                A.&nbsp;&nbsp;PENGORGANISASIAN
              </h4>
              <p className="indent-8">
                PPI UOBK RSUD Al-Mulk Kota Sukabumi dibentuk 8 Februari 2019. Tim Pencegahan dan Pengendalian Infeksi (PPI) merupakan organisasi non struktural pada Fasilitas Pelayanan Kesehatan yang mempunyai fungsi utama menjalankan PPI serta menyusun kebijakan pencegahan dan pengendalian infeksi termasuk pencegahan infeksi yang bersumber dari masyarakat berupa Tuberkulosis, HIV (<em>Human Immunodeficiency Virus</em>), dan infeksi menular lainnya, yang beranggotakan dari berbagai profesi . Tahun 2019 Perawat PPI IPCN (<em>Infection Prevention and Control Nurse</em>) berjumlah 1 orang dan sudah purna waktu. Kerja IPCN dibantu oleh <em>Infection Prevention and Control Link Nurse</em> / IPCLN yang sudah mengikuti pelatihan PPI Dasar. Tim PPI mempunyai peran penting dalam memonitor pemberian pelayanan kesehatan yang berkualitas dan sesuai standar untuk menjaga dan meningkatkan mutu pelayanan kesehatan di rumah sakit, dengan cara memberikan edukasi dan memberikan wawasan kepada petugas, pasien dan pengunjung rumah sakit.
              </p>
            </div>

            <div className="pt-2">
              <h4 className="font-bold text-[11pt] uppercase text-black mb-2">
                B.&nbsp;&nbsp;PENINGKATAN MUTU PELAYANAN KESEHATAN DI RUMAH SAKIT PADA KEJADIAN HAIs
              </h4>
              <p className="indent-8 mb-3">
                Healthcare Associated Infections (HAIs) merupakan masalah serius bagi semua institusi pelayanan kesehatan di seluruh dunia, baik di negara maju maupun yang sedang berkembang seperti Indonesia. Berdasarkan WHO, sekitar 3% - 21% atau rata-rata 9% infeksi terjadi di institusi pelayanan kesehatan. Kejadian infeksi dapat menghambat proses penyembuhan pasien, bahkan dapat meningkatkan morbiditas, mortalitas, dan memperpanjang lama hari rawat, sehingga biaya meningkat dan akhirnya mutu pelayanan di institusi pelayanan kesehatan akan menurun.
              </p>
              <p className="indent-8">
                Untuk itu UOBK RSUD Al-Mulk Kota Sukabumi memberikan pelayanan paripurna, tidak hanya kuratif dan rehabilitatif, tetapi juga pelayanan preventif dan promotif, salah satunya melalui program PPI. PPI harus menjadi perhatian seluruh pemberi pelayanan kesehatan dimana saja dan kapan saja pelayanan kesehatan diberikan sehingga kejadian HAIs dapat dicegah atau diminimalkan.
              </p>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 8: 1. KEWASPADAAN ISOLASI (Halaman 4)             */}
      {/* ========================================================= */}
      <F4Page customPageNumber={4}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3 text-justify text-[10pt] leading-relaxed">
            <div>
              <h4 className="font-bold text-[10.5pt] text-black mb-1">
                1. Kewaspadaan Isolasi
              </h4>
              <p className="indent-8 mb-2">
                Di Indonesia telah dikeluarkan Surat Keputusan Menteri Kesehatan Nomor 382/Menkes/SK/III/2007 tentang pelaksanaan Pencegahan dan Pengendalian Infeksi di Rumah Sakit maupun fasilitas pelayanan kesehatan lain sebagai upaya memutus siklus penularan penyakit dan melindungi pasien, petugas kesehatan, pengunjung dan masyarakat yang menerima pelayanan kesehatan, baik di rumah sakit atau fasilitas pelayanan kesehatan lainnya. Semua petugas kesehatan, memiliki resiko terinfeksi. Petugas kesehatan harus memahami, mematuhi dan menerapkan kewaspadaan isolasi agar tidak terinfeksi.
              </p>
              <p className="indent-8">
                Kewaspadaan isolasi dirancang untuk mengurangi risiko terinfeksi penyakit menular pada petugas kesehatan baik dari sumber infeksi yang diketahui maupun yang tidak diketahui. Dua lapis kewaspadaan isolasi terdiri dari :
              </p>
            </div>

            {/* a. Kewaspadaan Standar */}
            <div className="space-y-1 pt-0.5">
              <h5 className="font-bold text-[10pt] text-black">
                a. Kewaspadaan Standar
              </h5>
              <table className="w-full border-collapse border border-black text-[9pt]">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold align-top w-[22%]">
                      Indikator
                    </td>
                    <td className="border border-black p-2 align-top">
                      <div className="space-y-0.5">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Hand Hygiene</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Alat Pelindung Diri ( APD )</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Pengelolaan limbah dan benda tajam</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Peralatan perawatan pasien</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Penatalaksanaan linen</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Pengendalian lingkungan</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Kesehatan karyawan</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Penempatan pasien</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Penyuntikan yang aman</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Etika batuk</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Praktek lumbal fungsi</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold align-top">
                      Target
                    </td>
                    <td className="border border-black p-2 align-top">
                      Angka kejadian HAIs menurun
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* b. Kewaspadaan berdasarkan transmisi */}
            <div className="space-y-1 pt-1">
              <h5 className="font-bold text-[10pt] text-black">
                b. Kewaspadaan berdasarkan transmisi
              </h5>
              <table className="w-full border-collapse border border-black text-[9pt]">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold align-top w-[22%]">
                      Indikator
                    </td>
                    <td className="border border-black p-2 align-top">
                      <p className="mb-1">
                        Kewaspadaan tambahan dilakukan sesuai jenis transmisi mikroba penyebab infeksinya, yaitu :
                      </p>
                      <div className="pl-2 space-y-0.5">
                        <p>1)&nbsp;&nbsp;Kontak</p>
                        <p>2)&nbsp;&nbsp;Droplet</p>
                        <p>3)&nbsp;&nbsp;Airborne</p>
                      </div>
                      <p className="mt-1">
                        dapat dilakukan secara terpisah ataupun kombinasi
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold align-top">
                      Target
                    </td>
                    <td className="border border-black p-2 align-top">
                      Pasien yang diketahui / dugaan terinfeksi / terkolonisasi patogen
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 9: 2. SURVEILANS, BUNDLES, DIKLAT, PPRA (Halaman 5) */}
      {/* ========================================================= */}
      <F4Page customPageNumber={5}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3.5 text-justify text-[10pt] leading-relaxed">
            {/* 2. Surveilans PPI */}
            <div className="space-y-1">
              <h5 className="font-bold text-[10.5pt] text-black">
                2. Surveilans PPI
              </h5>
              <table className="w-full border-collapse border border-black text-[9pt]">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold align-top w-[22%]">
                      Indikator
                    </td>
                    <td className="border border-black p-2 align-top">
                      <div className="space-y-0.5">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Angka kejadian Phlebitis</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Angka kejadian Infeksi Daerah Operasi (IDO)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Angka kejadian Infeksi Saluran Kemih (ISK)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Angka kejadian Dekubitus</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Angka kejadian <em>Ventilator Associated Pneumonia</em> (VAP)</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold align-top">
                      Target
                    </td>
                    <td className="border border-black p-2 align-top">
                      Angka kejadian Phlebitis dari pemasangan IV kateter ada di bawah target
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. Bundles HAIs */}
            <div className="space-y-1">
              <h5 className="font-bold text-[10.5pt] text-black">
                Bundles HAIs
              </h5>
              <table className="w-full border-collapse border border-black text-[9pt]">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold align-top w-[22%]">
                      Indikator
                    </td>
                    <td className="border border-black p-2 align-top">
                      <div className="space-y-0.5">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Bundles Insersi PLABSI</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Bundles Maintanen PLABSI</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Bundles ISK</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Bundles VAP</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold align-top">
                      Target
                    </td>
                    <td className="border border-black p-2 align-top">
                      Bundles untuk pencegahan kejadian HAIs dapat dilaksanakan dengan baik
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. Pendidikan dan pelatihan */}
            <div className="space-y-1">
              <h5 className="font-bold text-[10.5pt] text-black">
                4. Pendidikan dan pelatihan
              </h5>
              <table className="w-full border-collapse border border-black text-[9pt]">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold align-top w-[22%]">
                      Indikator
                    </td>
                    <td className="border border-black p-2 align-top">
                      Peningkatan pengetahuan dan pemahaman PPI melalui pendidikan dan pelatihan secara berkala
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold align-top">
                      Target
                    </td>
                    <td className="border border-black p-2 align-top">
                      <div className="space-y-0.5">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Semua civitas hospitalia yang ada di rumah sakit terutama yang berhubungan langsung dalam pelayanan kesehatan</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-[10.5pt] leading-none">✓</span>
                          <span>Pasien, keluarga, pengunjung dan masyarakat dilingkungan rumah sakit</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. Penggunaan Antimikroba yang bijak */}
            <div className="space-y-1">
              <h5 className="font-bold text-[10.5pt] text-black">
                5. Penggunaan Antimikroba yang bijak
              </h5>
              <table className="w-full border-collapse border border-black text-[9pt]">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold align-top w-[22%]">
                      Indikator
                    </td>
                    <td className="border border-black p-2 align-top">
                      Ada kebijakan Rumah Sakit berdasarkan empirik, hasil kultur, dan kebijakan antibiotik profilaksis 24 jam
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold align-top">
                      Target
                    </td>
                    <td className="border border-black p-2 align-top">
                      Dilaksanakan oleh semua dokter pelayanan di UOBK RSUD Al-Mulk
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 10: BAB III REALISASI PROGRAM (Halaman 6)         */}
      {/* ========================================================= */}
      <F4Page customPageNumber={6}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="text-center font-bold mb-4 pt-1">
            <h2 className="text-base uppercase tracking-wide">BAB III</h2>
            <h3 className="text-base uppercase tracking-wide">REALISASI PROGRAM</h3>
          </div>

          <div className="space-y-2.5 text-justify text-[9.5pt] leading-relaxed">
            <div>
              <h4 className="font-bold text-[10.5pt] uppercase text-black mb-1">
                A.&nbsp;&nbsp;PENGORGANISASIAN
              </h4>
              <p className="indent-8">
                Program PPI disusun dalam rapat koordinasi dengan Tim PPI. Untuk pelaksanaan edukasi sudah dilakukan setiap kontak setiap bulannya. Untuk laporan triwulan dilakukan rapat evaluasi IPCN dengan Ketua PPI.
              </p>
            </div>

            <div className="pt-1">
              <h4 className="font-bold text-[10.5pt] uppercase text-black mb-1">
                B.&nbsp;&nbsp;PENINGKATAN MUTU PELAYANAN KESEHATAN DI RUMAH SAKIT PADA KEJADIAN HAIs
              </h4>
              <div className="pl-3 space-y-1">
                <p className="font-bold text-[10pt]">1.&nbsp;&nbsp;Kewaspadaan Isolasi</p>
                <p className="indent-8">
                  Keberhasilan program PPI dimulai dari kewaspadaan isolasi yang terdiri dari kewaspadaan standar dan kewaspadaan berdasarkan transmisi.
                </p>

                <div className="pl-3 space-y-1">
                  <p className="font-bold text-[9.5pt]">a.&nbsp;&nbsp;Kewaspadaan Standar</p>
                  <div className="pl-3 space-y-1">
                    <p className="font-bold text-[9.5pt]">1)&nbsp;&nbsp;Hand Hygiene</p>
                    <p className="indent-8">
                      Hand hygiene merupakan faktor yang sangat penting dalam pencegahan dan pengendalian infeksi karena merupakan komponen Patient Safety. Meskipun sederhana, hand hygiene sangat efektif untuk pencegahan HAIs.
                    </p>
                    <p className="font-semibold text-[9pt] pl-4">
                      a)&nbsp;&nbsp;Kepatuhan hand hygiene seluruh petugas
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Chart with Data Table matching Gambar No 1 */}
            <div className="pt-0.5">
              <OfficialComparisonLineChart
                title={`Perbandingan Hasil Audit Kepatuhan Kebersihan Tangan Petugas di UOBK RSUD Al-Mulk Tahun ${year - 1}-${year}`}
                categories={['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGUST', 'SEP', 'OKT', 'NOV', 'DES']}
                minY={0}
                maxY={90}
                yTicks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 85, 90]}
                height={130}
                series={[
                  {
                    name: `Capaian ${year}`,
                    color: '#2563eb', // Blue
                    marker: 'circle',
                    values: [67, 65, 64, 70, 68, 73, 67, 64, 66, 65, 66, 71],
                  },
                  {
                    name: `Capaian ${year - 1}`,
                    color: '#ea580c', // Orange
                    marker: 'square',
                    values: [64, 63, 67, 64, 70, 65, 65, 63, 66, 62, 66, 63],
                  },
                  {
                    name: 'Target',
                    color: '#64748b', // Gray
                    marker: 'triangle',
                    values: [85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85, 85],
                  },
                ]}
              />
              <p className="text-center text-[8.5pt] font-semibold mt-0.5">
                Grafik 1. Kepatuhan kebersihan tangan seluruh petugas di UOBK RSUD Al-Mulk tahun {year - 1}-{year}
              </p>
            </div>

            <div className="pt-1 text-[9pt] leading-normal">
              <p className="font-bold underline mb-0.5">Analisa :</p>
              <p className="indent-8">
                Dilihat dari grafik di atas pencapaian kepatuhan kebersihan tangan seluruh staff di rumah sakit pada periode bulan Januari-Desember tahun {year} rata-rata mencapai 67%, dimana pencapaian masih di bawah target capaian yaitu 85%. Hal ini dipengaruhi oleh berbagai faktor baik dari sarana prasarana, beban, maupun lingkungan kerja.
              </p>
            </div>
          </div>
        </div>
      </F4Page>
    </>
  );
}

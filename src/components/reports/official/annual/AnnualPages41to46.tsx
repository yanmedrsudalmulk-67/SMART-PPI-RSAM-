import React from 'react';
import F4Page from '../F4Page';

interface AnnualPagesProps {
  year: number;
}

export default function AnnualPages41to46({ year }: AnnualPagesProps) {
  return (
    <>
      {/* ========================================================= */}
      {/* HALAMAN 37: TEHNIK INSERSI, PEMELIHARAAN, PERAWATAN, PELEPASAN ISK */}
      {/* ========================================================= */}
      <F4Page customPageNumber={37}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3 text-justify text-[12pt] leading-[1.5]">
            {/* 2) Tehnik insersi */}
            <div>
              <p className="font-bold text-[12pt] mb-1">2)&nbsp;&nbsp;Tehnik insersi</p>
              <ul className="list-disc pl-8 space-y-1 text-justify text-[12pt] leading-[1.5]">
                <li>Standar pemasangan kateter urin menggunakan sarung tangan steril : sudah diterapkan</li>
                <li>Bersihkan bagian meatus uretra sebelum pemasangan kateter urine : sudah diterapkan</li>
                <li>Balon kateter urin dikembangkan dengan jumlah air sesuai produk yang dipakai : sudah di terapkan</li>
              </ul>
            </div>

            {/* 3) Pemeliharaan Kateter */}
            <div className="pt-1">
              <p className="font-bold text-[12pt] mb-1">3)&nbsp;&nbsp;Pemeliharaan Kateter</p>
              <ul className="list-disc pl-8 space-y-1 text-justify text-[12pt] leading-[1.5]">
                <li>Fiksasi Kateter untuk mencegah gerakan dan trauma pada meatus uretra : sudah diterapkan</li>
                <li>Urine bag diletakkan lebih rendah dari kandung kemih: belum dipatuhi dengan baik</li>
                <li>Masih ditemukan urin bag diletakkan sejajar dengan kandung kemih saat transportasi pasien.</li>
                <li>Tidak meletakkan urine bag dilantai : masih sering ditemukan urin bag diletakkan dilantai</li>
                <li>Periksa selang kateter jangan sampai terlipat (kincking): sudah diterapkan dengan baik.</li>
              </ul>
            </div>

            {/* 4) Perawatan Kateter */}
            <div className="pt-1">
              <p className="font-bold text-[12pt] mb-1">4)&nbsp;&nbsp;Perawatan Kateter</p>
              <ul className="list-disc pl-8 space-y-1 text-justify text-[12pt] leading-[1.5]">
                <li>Perawatan perineal sehari-hari dan setiap selesai buang air besar : sudah diterapkan</li>
                <li>Gunakan kateter terkecil yang mencapai drainage : sudah diterapkan</li>
                <li>Irigasi kandung kemih dan pemakaian antibiotika tidak dapat mencegah infeksi saluran kemih</li>
              </ul>
            </div>

            {/* 5) Pelepasan kateter sudah diterapkan sesuai prosedur */}
            <div className="pt-1">
              <p className="font-bold text-[12pt] mb-1">5)&nbsp;&nbsp;Pelepasan kateter sudah diterapkan sesuai prosedur</p>
              <ul className="list-disc pl-8 space-y-1 text-justify text-[12pt] leading-[1.5]">
                <li>Kateter segera dilepas jika tidak diperlukan, lepas atau ganti semua kateter dalam waktu 24 jam masuk ke rumah sakit : sudah diterapkan</li>
                <li>Lepas atau ganti kateter jika pasien timbul gejala ISK : sudah diterapkan</li>
                <li>Cara penggantungan urine bag yang tidak benar menyebabkan selang kateter urine terlipat sehingga aliran urine tidak lancer</li>
              </ul>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 38: BUNDLE VAP (KEBERSIHAN TANGAN, POSISI, MULUT, SEKRESI) */}
      {/* ========================================================= */}
      <F4Page customPageNumber={38}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3 text-justify text-[12pt] leading-[1.5]">
            <p className="font-bold text-[12pt] mb-1">c)&nbsp;&nbsp;VAP</p>

            {/* 1) Kebersihan tangan */}
            <div className="pl-4">
              <p className="font-bold text-[12pt] mb-0.5">1)&nbsp;&nbsp;Kebersihan tangan</p>
              <p className="text-justify text-[12pt] leading-[1.5] pl-4">
                Hand hygiene sebagai faktor utama dalam pencegahan dan pengendalian HAIs belum diterapkan dengan baik. Kepatuhan hand hygiene perawat masih rendah, terutama kepatuhan hand hygiene sebelum kontak dengan pasien dan kepatuhan hand hygiene sebelum melakukan Tindakan aseptik.
              </p>
            </div>

            {/* 2) Posisi pasien */}
            <div className="pl-4 pt-1">
              <p className="font-bold text-[12pt] mb-0.5">2)&nbsp;&nbsp;Posisi pasien</p>
              <p className="text-justify text-[12pt] leading-[1.5] pl-4">
                Posisi 30 – 45 º C setiap saat, kecuali ada kontra indikasi: belum diterapkan dengan baik. Masih sering ditemukan pasien posisi tidur supine.
              </p>
            </div>

            {/* 3) Kebersihan mulut */}
            <div className="pl-4 pt-1">
              <p className="font-bold text-[12pt] mb-0.5">3)&nbsp;&nbsp;Kebersihan mulut</p>
              <p className="text-justify text-[12pt] leading-[1.5] pl-4 mb-1">
                Menjaga kebersihan mulut pasien secara rutin, dengan cara :
              </p>
              <ul className="list-disc pl-10 space-y-1 text-justify text-[12pt] leading-[1.5]">
                <li>Menyikat gigi setiap 12 jam untuk mencegah terjadinya plaque : belum dilakukan dengan baik. Masih sering ditemukan pasien posisi tidur supine</li>
                <li>Membersihkan mulut setiap 2-4 jam : belum diterapkan dengan baik. Pembersihan mulut baru bisa dilakukan setiap pagi dan sore hari.</li>
                <li>Gunakan oral antiseptik yang bebas dari alkohol (chlorhexidin 0,2%) : Pemakaian cairan oral hygiene menggunakan menggunakan minosef.</li>
              </ul>
            </div>

            {/* 4) Manajemen sekresi */}
            <div className="pl-4 pt-1">
              <p className="font-bold text-[12pt] mb-0.5">4)&nbsp;&nbsp;Manajemen sekresi</p>
              <ul className="list-disc pl-10 space-y-1 text-justify text-[12pt] leading-[1.5]">
                <li>
                  Pengisapan lendir jika diperlukan :
                  <p className="text-justify text-[12pt] leading-[1.5] pt-0.5">
                    Pengisapan lendir sudah dilakukan dengan baik
                  </p>
                </li>
                <li>
                  Lakukan Tindakan aseptik:
                  <p className="text-justify text-[12pt] leading-[1.5] pt-0.5">
                    Dalam melakukan tindakan aseptik petugas sudah memperhatikan prinsip aseptik. Standar kanul suction dispossable belum bisa diterapkan di RSUD Al-Mulk Kota Sukabumi karena anggaran pengadaan canul suction belum memadai. Upaya yang bisa dilakukan dengan cara penggantian kanul 1x / hari untuk masing - masing pasien.
                  </p>
                </li>
                <li>
                  Gunakan APD
                  <p className="text-justify text-[12pt] leading-[1.5] pt-0.5">
                    APD yang digunakan belum lengkap ( handscoen dan masker) karena penyediaan APD apron dan google kurang. Hal ini belum sesuai standar (masker, handscoen, apron, google).
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 39: SEDASI & BUNDLE DECUBITUS                     */}
      {/* ========================================================= */}
      <F4Page customPageNumber={39}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3 text-justify text-[12pt] leading-[1.5]">
            {/* 5) Pemberian sedasi */}
            <div className="pl-4">
              <p className="font-bold text-[12pt] mb-0.5">5)&nbsp;&nbsp;Pemberian sedasi</p>
              <p className="text-justify text-[12pt] leading-[1.5] pl-4">
                Belum semua pasien yang akan di pasang ventilator diberikan sedasi untuk pasien dewasa sedasi diberikan pada pasien yang tidak kooperatif.
              </p>
            </div>

            {/* d) Decubitus */}
            <div className="pt-2">
              <p className="font-bold text-[12pt] mb-1">d)&nbsp;&nbsp;Decubitus</p>
              <p className="text-justify text-[12pt] leading-[1.5] mb-2">
                Terkait dengan peran perawat dalam upaya pencegahanluka tekan, Potter and Perry (2005)
              </p>

              {/* 1) Perawatan kulit */}
              <div className="pl-4 space-y-1">
                <p className="font-normal text-[12pt] mb-0.5">
                  1)&nbsp;&nbsp;Perawatan kulit yang meliputi perawatan hygiene dan pemberian topical
                </p>
                <ul className="list-disc pl-8 space-y-1 text-justify text-[12pt] leading-[1.5]">
                  <li>Jaga kelembaban kulit agar tidak basah : sudahditerapkan dengan baik.</li>
                  <li>Jaga linen agar tetap kering, licin dan tidak ada lipatan : belum diterapkan dengan baik. Masih ditemukan posisi linen pasien berlipat karena perbandingan ukuran tempat tidur pasien dengan sprei yang kurang proporsional ( ukuran sprei kurang besar</li>
                  <li>Meminimalkan regangan dengan penempatan posisi yang nyaman dan sesuai</li>
                  <li>Meminimalkan gesekan dengan cara pemindahan pasien yang hati-hati : sudah diterapkan.</li>
                </ul>
              </div>

              {/* 2) Pencegahan mekanik */}
              <div className="pl-4 pt-2 space-y-1">
                <p className="font-normal text-[12pt] mb-0.5">
                  2)&nbsp;&nbsp;Pencegahan mekanik dan dukungan permukaan kulit yang meliputi
                </p>
                <ul className="list-disc pl-8 space-y-1 text-justify text-[12pt] leading-[1.5]">
                  <li>Penggunaan tempat tidur</li>
                  <li>Pemberian posisi alih baring tiap 2 jam : sudah diterapkan</li>
                  <li>Kasur anti decubitus : belum diterapakn dengan baik karena tidak semua ruang perawatan mempunyai kasur dekubitus.</li>
                </ul>
              </div>

              {/* 3) Perbaikan nutrisi */}
              <div className="pl-4 pt-2 space-y-1">
                <p className="font-normal text-[12pt] mb-0.5">
                  3)&nbsp;&nbsp;Perbaikan nutrisi yaitu dengan diet tinggi kalori, protein dan vitamin
                </p>
                <p className="text-justify text-[12pt] leading-[1.5] pl-4">
                  dengan tujuan untuk mempertahankan balance nitrogen tetap positif dan dengan meningkatkan kadar protein serum: sudah diterapkan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 40: PENDIDIKAN & PELATIHAN, ANTIBIOTIK RASIONAL   */}
      {/* ========================================================= */}
      <F4Page customPageNumber={40}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3.5 text-justify text-[12pt] leading-[1.5]">
            {/* 4. Pendidikan Dan Pelatihan */}
            <div>
              <p className="font-bold text-[12pt] mb-1">4.&nbsp;&nbsp;Pendidikan Dan Pelatihan</p>
              <div className="space-y-2 text-justify text-[12pt] leading-[1.5]">
                <p className="indent-8">
                  Tahun {year} edukasi tentang pencegahan dan pengendalian infeksi di RSUD Al-Mulk sudah dilaksanakan namun belum dilakukan secara periodik dari berbagai professional, kegiatan edukasi dilakukan oleh IPCN ketjap unit pemberi pelayanan, pasien dan keluarga pasien.
                </p>
                <p className="indent-8">
                  Kegiatan pelatihan PPI Dasar karyawan dan pelatihan IPCD untuk dokter sudah di ajukan ke bagian diklat, namun belum ada anggaran. Pelatihan PPI Dasar untuk karyawan dengan narasumber yang sudah TOT, hanya dilakukan 1 kali pada tahun 2019.
                </p>
                <p>
                  Faktor yang mempengaruhi terhambatnya edukasi untuk karyawan ini adalah :
                </p>
                <ul className="list-disc pl-8 space-y-1 text-justify text-[12pt] leading-[1.5]">
                  <li>Anggaran edukasi dan pelatihan yang masih minim</li>
                  <li>Belum ada IPCN yang mengikuti TOT PPI sehingga IPCN dalam mengadakan edukasi belum maksimal</li>
                </ul>
              </div>
            </div>

            {/* 5. Penggunaan Antibiotik Rasional */}
            <div className="pt-2">
              <p className="font-bold text-[12pt] mb-1">5.&nbsp;&nbsp;Penggunaan Antibiotik Rasional</p>
              <p className="indent-8 text-justify text-[12pt] leading-[1.5]">
                Pelaksanaan pengontrolan antibiotik rasional tahun {year} belum dapat dilaksanakan, dikarenakan Komite PPRA belum dan pembuatan pemetaan pola kuman belum dibuat.
              </p>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 41: BAB V PENUTUP - KESIMPULAN & SARAN (Halaman 41) */}
      {/* ========================================================= */}
      <F4Page customPageNumber={41}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="text-center font-bold mb-6 pt-2">
            <h2 className="text-[12pt] uppercase tracking-wide">BAB V</h2>
            <h3 className="text-[12pt] uppercase tracking-wide">PENUTUP</h3>
          </div>

          <div className="space-y-4 text-justify text-[12pt] leading-[1.5]">
            <div>
              <h4 className="font-bold text-[12pt] uppercase text-black mb-2">A.&nbsp;&nbsp;KESIMPULAN</h4>
              <p className="indent-8 text-justify text-[12pt] leading-[1.5]">
                Infeksi rumah sakit menjadi masalah yang tidak bisa dihindari sehingga di butuhkan program Pencegahan dan Pengendalian Infeksi (PPI) untuk menjamin keselamatan dan kesehatan pasien, petugas kesehatan dan pengunjung. Fasilitas kesehatan harus membuat suatu rencana kerja tahunan untuk memberikan akses dan mempromosikan cara pelayanan kesehatan yang baik , isolasi yang tepat, tindakan sterilisasi yang benar, praktek pencegahan dan pengendalian infeksi lainnya, pelatihan bagi petugas kesehatan dan surveilans epidemiologi. Menyediakan sarana dan prasarana yang cukup untuk mendukung program Pencegahan dan Pengendalian Infeksi. Pencegahan risiko bagi pasien, petugas kesehatan, petugas lain serta pengunjung di rumah sakit dan fasilitas pelayanan kesehatan, perlu menjadi kepedulian semua pihak dan semua orang serta harus didukung oleh pihak pimpinan atau manajemen.
              </p>
            </div>

            <div className="pt-2">
              <h4 className="font-bold text-[12pt] uppercase text-black mb-2">B.&nbsp;&nbsp;SARAN</h4>
              <ol className="list-decimal pl-8 space-y-2 text-justify text-[12pt] leading-[1.5]">
                <li>
                  Dukungan penuh dan penyamaan persepsi dari pihak manajemen rumah sakit untuk menunjang pelaksanaan program di Tim PPI.
                </li>
                <li>
                  Pelatihan PPI Dasar dan Advance secara internal untuk seluruh staf rumah sakit, bekerjasama dengan nara sumber dari external dan bagian diklat RSUD Al-Mulk.
                </li>
                <li>
                  Pelatihan TOT untuk IPCN sangat vital sebagai pemandu jalannya edukasi internal untuk staf dan pengunjung di Rumah sakit.
                </li>
                <li>
                  Pelaksanaan penekanan risiko infeksi di rumah sakit dengan ICRA
                </li>
              </ol>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 42: SARAN POIN 5 & TANDA TANGAN (Halaman 42)      */}
      {/* ========================================================= */}
      <F4Page customPageNumber={42}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="text-justify text-[12pt] leading-[1.5] mb-12">
            <ol start={5} className="list-decimal pl-8 text-[12pt] leading-[1.5]">
              <li>
                Pelaksanaan program dapat dilakukan tindak lanjut (Pemeriksaan Kesehatan Karyawan) petugas yang didapati dhasil pemeriksaan yang bermasalah segera dilakukan tindak lajut untuk menekan / memutus mata rantai penularan sesuai dengan klinis.
              </li>
            </ol>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[12pt] font-normal mb-8">
              Mengetahui,
            </p>

            <table className="w-full border-none text-[12pt]">
              <tbody>
                <tr className="text-center">
                  <td className="w-1/2 align-top pb-28">
                    Infection Prevention Control Nurse
                  </td>
                  <td className="w-1/2 align-top pb-28">
                    Ketua PPI
                  </td>
                </tr>
                <tr className="text-center font-normal">
                  <td className="align-bottom">
                    Adi Tresa Purnama, A.M.Kep
                  </td>
                  <td className="align-bottom">
                    dr. Nurul Iman
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </F4Page>
    </>
  );
}

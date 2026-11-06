import React from 'react';
import F4Page from '../F4Page';

interface AnnualPagesProps {
  year: number;
}

export default function AnnualPages31to40({ year }: AnnualPagesProps) {
  return (
    <>
      {/* ========================================================= */}
      {/* HALAMAN 27: APD & PENGELOLAAN LIMBAH (Halaman 27)         */}
      {/* ========================================================= */}
      <F4Page customPageNumber={27}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3 text-justify text-[12pt] leading-[1.5]">
            {/* 2) Alat Pelindung Diri (APD) */}
            <div>
              <p className="font-bold text-[12pt] mb-1">2)&nbsp;&nbsp;Alat Pelindung Diri (APD)</p>
              
              <div className="pl-4 space-y-1">
                <div>
                  <p className="font-normal text-[12pt] mb-0.5">a)&nbsp;&nbsp;Pelaksanaan kegiatan</p>
                  <p className="text-justify text-[12pt] leading-[1.5] mb-1">
                    APD merupakan peralatan perlindungan yang digunakan oleh seorang petugas untuk melindungi dirinya dari kontaminasi lingkungan. APD digunakan sesuai dengan area dan SPO yang sudah ditetapkan. Faktor yang harus diperhatikan saat memilih APD:
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                    <li>
                      Potensi dan jenis paparan
                      <ul className="list-none pl-4 space-y-0.5 mt-0.5">
                        <li>-&nbsp;&nbsp;Airborne droplet dan kontak</li>
                        <li>-&nbsp;&nbsp;Jenis transmisi dari penyakit</li>
                      </ul>
                    </li>
                    <li>Daya tahan dan kesesuaian</li>
                    <li>Fit (kecocokan)</li>
                  </ul>
                </div>

                <div className="pt-1">
                  <p className="font-normal text-[12pt] mb-0.5">b)&nbsp;&nbsp;Kendala yang ditemukan</p>
                  <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                    <li>Belum semua pegawai mendapatkan pelatihan PPI Dasar</li>
                    <li>
                      Fasilitas APD terbatas dan tidak kontinyu, yaitu :
                      <ul className="list-none pl-4 space-y-0.5 mt-0.5">
                        <li>-&nbsp;&nbsp;Masker N95, apron dan pelindung wajah di rawat inap</li>
                        <li>-&nbsp;&nbsp;Masker, head cap dan sepatu pelindung di pantry</li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 3) Pengelolaan Limbah Dan Benda Tajam */}
            <div className="pt-1">
              <p className="font-bold text-[12pt] mb-1">3)&nbsp;&nbsp;Pengelolaan Limbah Dan Benda Tajam</p>

              <div className="pl-4 space-y-1">
                <div>
                  <p className="font-normal text-[12pt] mb-0.5">a)&nbsp;&nbsp;Pelaksanaan kegiatan</p>
                  <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                    <li>Pengelolaan limbah sudah dilaksanakan sesuai SPO, mengacu pada WHO.</li>
                    <li>Pembakaran sampah infeksius dilakukan dengan incinerator Jasa Medivest yang sudah berizin.</li>
                    <li>Edukasi PPI terhadap petugas kebersihan.</li>
                  </ul>
                </div>

                <div className="pt-1">
                  <p className="font-normal text-[12pt] mb-0.5">b)&nbsp;&nbsp;Kendala yang ditemukan</p>
                  <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                    <li>Ketidak patuhan petugas dalam pembuangan sampah infeksius, sering ditemukan sampah infeksius tercampur dengan sampah non infeksius.</li>
                    <li>Sampah infeksius ¾ penuh tidak segera diikat dan dibuang.</li>
                    <li>Persediaan plastik sampah kuning tidak kontinyu.</li>
                    <li>Ketersediaan safety box tidak kontinyu, memicu perilaku pemakaian safety box berulang.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 28: PENGENDALIAN LINGKUNGAN & PENYUNTIKAN (Halaman 28) */}
      {/* ========================================================= */}
      <F4Page customPageNumber={28}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3 text-justify text-[12pt] leading-[1.5]">
            {/* 4) Pengendalian Lingkungan */}
            <div>
              <p className="font-bold text-[12pt] mb-1">4)&nbsp;&nbsp;Pengendalian Lingkungan</p>

              <div className="pl-4 space-y-1">
                <div>
                  <p className="font-normal text-[12pt] mb-0.5">a)&nbsp;&nbsp;Pelaksanaan Kegiatan</p>
                  <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                    <li>Pemeriksaan kualitas udara sudah dilakukan secara rutin 3 bulan sekali di semua unit pelayanan</li>
                    <li>Hasil pemeriksaan di evaluasi dan ditindak lanjuti</li>
                    <li>Pembersihan permukaan lingkungan sudah dilakukan, namun belum berkala</li>
                    <li>Pembuatan ICRA bangunan sudah dilakukan</li>
                  </ul>
                </div>

                <div className="pt-1">
                  <p className="font-normal text-[12pt] mb-0.5">b)&nbsp;&nbsp;Kendala yang ditemukan</p>
                  <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                    <li>Tidak ada HEPA filter di ruang Intensive Care, ruang kohort/isolasi, hanya ada exhaust fan</li>
                    <li>Cairan desinfektan untuk desinfeksi permukaan belum tersedia, sementara menggunakan khlorin 0,05%, sedangkan untuk lantai khlorin 0,5 %.</li>
                    <li>Pembuatan ICRA belum maksimal, namun Tim PPI mulai dilibatkan jika ada kegiatan pembangunan / renovasi gedung.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 5) Penyuntikan Aman */}
            <div className="pt-1">
              <p className="font-bold text-[12pt] mb-1">5)&nbsp;&nbsp;Penyuntikan Aman</p>

              <div className="pl-4 space-y-1">
                <div>
                  <p className="font-normal text-[12pt] mb-0.5">a)&nbsp;&nbsp;Pelaksanaan kegiatan</p>
                  <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                    <li>Desinfeksi awal dan setelah penyuntikan dengan menggunakan alkohol swab</li>
                    <li>Prinsip one needle, one syringe, only one time belum maksimal</li>
                    <li>Pengoplosan obat belum bisa dilaksanakan dengan standar, pencampuran obat masih dilakukan oleh tenaga perawat yang dilakukan di ruang perawatan masing masing</li>
                    <li>Petugas masih melakukan re capping jarum suntik</li>
                  </ul>
                </div>

                <div className="pt-1">
                  <p className="font-normal text-[12pt] mb-0.5">b)&nbsp;&nbsp;Kendala yang ditemukan</p>
                  <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                    <li>Desinfeksi pada saat penyuntikan dengan alkohol belum terlaksana dengan baik</li>
                    <li>Keterbatasan tenaga apoteker sehingga belum bisa dilakukan pengoplosan obat oleh apoteker</li>
                    <li>Keterbatasan safety box, hal ini menimbulkan petugas melakukan re capping jarum suntik, karena safety box tidak bisa dibawa pada saat penyuntikan ke ruangan pasien</li>
                    <li>Petugas tertusuk jarum pada saat re capping dilakukan</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 29: CSSD & PENATALAKSANAAN LINEN (Halaman 29)      */}
      {/* ========================================================= */}
      <F4Page customPageNumber={29}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3 text-justify text-[12pt] leading-[1.5]">
            {/* 6) Perawatan Peralatan Pasien */}
            <div>
              <p className="font-bold text-[12pt] mb-1">6)&nbsp;&nbsp;Perawatan Peralatan Pasien</p>

              <div className="pl-4 space-y-1">
                <div>
                  <p className="font-normal text-[12pt] mb-0.5">a)&nbsp;&nbsp;Pelaksanaan kegiatan</p>
                  <p className="text-justify text-[12pt] leading-[1.5] pl-4">
                    Proses sterilisasi dilakukan di CSSD, mulai dari pre cleaning, cleaning dan sterilisasi
                  </p>
                </div>

                <div className="pt-1">
                  <p className="font-normal text-[12pt] mb-0.5">b)&nbsp;&nbsp;Kendala yang ditemukan</p>
                  <p className="text-justify text-[12pt] leading-[1.5] pl-4">
                    Petugas yang melakukan sterilisasi di CSSD belum pernah mendapatkan pelatihan mengenai pelaksanaan sterilisasi di CSSD, akan tetapi sudah mengikuti In House Trainning yang di selenggarakan di Rumah Sakit. Sehingga pembekalan ilmu untuk petugas mengenai sterilisasi masih kurang.
                  </p>
                </div>
              </div>
            </div>

            {/* 7) Penatalaksanaan Linen */}
            <div className="pt-1">
              <p className="font-bold text-[12pt] mb-1">7)&nbsp;&nbsp;Penatalaksanaan Linen</p>

              <div className="pl-4 space-y-1">
                <div>
                  <p className="font-normal text-[12pt] mb-0.5">a)&nbsp;&nbsp;Pengelolaan Linen</p>
                  <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                    <li>Proses pencucian linen kerjasama dengan RS.Bhayangkara</li>
                    <li>Pemisahan linen infeksius dan non infeksiusdilaksanakan oleh perawat diruang perawatan masing- masing.</li>
                    <li>Pengambilan linen kotor dari rawat inap dilaksanakan oleh petugas pengantar linen ke Loundry RS.Bhayangkara menggunakan troli linen tertutup.</li>
                    <li>Pengaturan waktu pengambilan linen dari ruangan sudah terjadwal</li>
                    <li>Pengangkutan linen memakai mobil ambulance, namun linen belum dimasukkan ke dalam container tertutup pada saat di ambulance, hanya menggunakan kantong kuning.</li>
                    <li>Petugas CSSD masih ada yang tidak memakai APD lengkap</li>
                    <li>Proses distribusi linen bersih keruangan belum sesuai dengan standar/ belum menggunakan troli tertutup</li>
                  </ul>
                </div>

                <div className="pt-1">
                  <p className="font-normal text-[12pt] mb-0.5">b)&nbsp;&nbsp;Kendala yang ditemukan</p>
                  <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                    <li>Pengadaan APD masih minimal</li>
                    <li>Sarana dan prasarana yang belum terpenuhi</li>
                    <li>Perilaku petugas yang masih minim sehingga memungkinkan kuman kembali ke linen yang bersih siap pakai</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 30: KESEHATAN KARYAWAN & PENEMPATAN PASIEN (Halaman 30) */}
      {/* ========================================================= */}
      <F4Page customPageNumber={30}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3 text-justify text-[12pt] leading-[1.5]">
            {/* 8) Perlindungan Kesehatan Karyawan */}
            <div>
              <p className="font-bold text-[12pt] mb-1">8)&nbsp;&nbsp;Perlindungan Kesehatan Karyawan</p>

              <div className="pl-4 space-y-1">
                <div>
                  <p className="font-normal text-[12pt] mb-0.5">a)&nbsp;&nbsp;Pelaksanaan kegiatan</p>
                  <p className="text-justify text-[12pt] leading-[1.5] pl-4">
                    Pemeriksaan kesehatan karyawan sudah dilakukan secara berkala setiap tahun.
                  </p>
                </div>

                <div className="pt-1">
                  <p className="font-normal text-[12pt] mb-0.5">b)&nbsp;&nbsp;Kendala yang dihadapi</p>
                  <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                    <li>Pelaksanaan pemeriksaan mcu belum lengkap, belum diberikan vaksin hepatitis pada karyawan.</li>
                    <li>Tindak lanjut hasil pemeriksaan kesehatan sudah di lakukan dengan maksimal</li>
                    <li>Kebijakan dan prosedur yang terkait pemeriksaan kesehatan karyawan secara berkala dan penanganan khusus untuk karyawan terpajan masih lemah.</li>
                    <li>Penatalaksanaan paska luka tusuk benda tajam bekas pakai</li>
                    <li>SPO penanganan luka tusuk jarum / benda tajam sudah ada, sudah di sosialisasikan</li>
                    <li>Laporan tentang kejadian tertusuk jarum petugas ada, 1 kejadian di ruang rawat inap Aisyah. Kejadian tertusuk jarum sudah ada tindak lanjut penanganan.</li>
                    <li>Penanganan luka tusuk jarum / benda tajam di berlakukan terhadap seluruh karyawan yang bekerja di rumah sakit atau unit-unit terkait (dokter, perawat, radiologi, CSSD,sanitasi, cleaning service, gizi, laundry, kamar jenazah, farmasi).</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 9) Penempatan Pasien */}
            <div className="pt-1">
              <p className="font-bold text-[12pt] mb-1">9)&nbsp;&nbsp;Penempatan Pasien</p>

              <div className="pl-4 space-y-1">
                <div>
                  <p className="font-normal text-[12pt] mb-0.5">a)&nbsp;&nbsp;Kegiatan yang sudah dilakukan</p>
                  <ul className="list-disc pl-5 space-y-0.5 text-justify text-[12pt] leading-[1.4]">
                    <li>Pasien di IGD yang dicurigai dan terdiagnosa infeksi Airborne, Droplet, Kontak sebelum dipindah ke ruang perawatan terlebih dahulu dilakukan observasi sampai kondisi stabil di ruang khusus isolasi yang berada di IGD.</li>
                    <li>Edukasi penggunaan APD dilakukan untuk pasien baru masuk rawat inap atau rawat jalan pada saat pasien dirumah sakit.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 31: KENDALA PENEMPATAN, ETIKA BATUK, LUMBAL PUNSI */}
      {/* ========================================================= */}
      <F4Page customPageNumber={31}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3 text-justify text-[12pt] leading-[1.5]">
            {/* b) Kendala yang dihadapi (Penempatan Pasien) */}
            <div>
              <p className="font-normal text-[12pt] mb-1">b)&nbsp;&nbsp;Kendala yang dihadapi</p>
              <ul className="list-disc pl-8 space-y-1 text-justify text-[12pt] leading-[1.5]">
                <li>Rumah sakit memiliki ruang isolasi khusus pasien airborne dengan exhaust pant dan ruang anteroom. Tapi belum bertekanan negatif.</li>
                <li>Belum biasa membatasi lalu lintas pengunjung di ruang isolasi.</li>
                <li>Pengadaan alat Hepafilter belum terealisasi</li>
                <li>Kepatuhan pemakaian APD di ruang isolasi untuk pasien dan pengunjung masih rendah.</li>
                <li>Penyediaan APD di ruang anteroom sudah tersedia</li>
                <li>Sarana edukasi banner / poster masih minim.</li>
              </ul>
            </div>

            {/* 10) Etika Batuk */}
            <div className="pt-2">
              <p className="font-bold text-[12pt] mb-1">10)&nbsp;&nbsp;Etika Batuk</p>
              
              <div className="space-y-1">
                <p className="font-normal text-[12pt] mb-0.5">a)&nbsp;&nbsp;Kegiatan yang sudah dilakukan</p>
                <div className="space-y-2 text-justify text-[12pt] leading-[1.5]">
                  <p className="indent-8">
                    Sosialisasi dan edukasi sudah dilakukan ke pasien, pengunjung
                  </p>
                  <p className="indent-8">
                    Dari hasil evaluasi, sudah ada perubahan perilaku yang baik untuk etika batuk oleh pasien dan petugas, tetapi perubahan perilaku pengunjung belum optimal karena pengunjung yang datang silih berganti.
                  </p>
                  <p className="indent-8">
                    Semua pasien yang masuk ke rumah sakit yang menderita batuk dan suspek TB langsung diberikan masker dan di edukasi tentang pemakaian APD dan Etika Batuk
                  </p>
                </div>

                <div className="pt-2">
                  <p className="font-normal text-[12pt] mb-1">b)&nbsp;&nbsp;Kendala yang dihadapi</p>
                  <ul className="list-disc pl-8 space-y-1 text-justify text-[12pt] leading-[1.5]">
                    <li>Penyediaan APD Masker bedah untuk pengunjung dan pasien masih minim.</li>
                    <li>Pengadaan N95 untuk petugas yang belum kontinyu di semua unit pelayanan penunjang. Hal ini karena oleh keterbatasan anggaran</li>
                    <li>Meningkatkan edukasi untuk civitas hospitalia</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 11) Praktek Lumbal */}
            <div className="pt-2">
              <p className="font-bold text-[12pt] mb-1">11)&nbsp;&nbsp;Praktek Lumbal</p>
              <p className="indent-8 text-justify text-[12pt] leading-[1.5]">
                Kegiatan praktek lumbal fungsi dilakukan pada saat anestesi spinal.
              </p>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 32: MAKANAN & MINUMAN, JENAZAH, TRANSMISI        */}
      {/* ========================================================= */}
      <F4Page customPageNumber={32}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3 text-justify text-[12pt] leading-[1.5]">
            {/* 12) Penanganan Makanan dan Minuman */}
            <div>
              <p className="font-bold text-[12pt] mb-1">12)&nbsp;&nbsp;Penanganan Makanan dan Minuman</p>
              
              <div className="space-y-1">
                <p className="font-normal text-[12pt] mb-0.5">a)&nbsp;&nbsp;Kegiatan yang sudah dilakukan</p>
                <ul className="list-disc pl-8 space-y-1 text-justify text-[12pt] leading-[1.5]">
                  <li>Penanganan hygiene makanan sudah dilakukan dengan semaksimal mungkin.</li>
                  <li>Proses awal pengelolaan makanan sampai penyajian diproses akhir sudah diterapkan</li>
                  <li>Proses pengiriman diet makan pasien ke unit, memakai troli tertutup.</li>
                  <li>Pencucian piring menggunakan air panas dari water hitter</li>
                </ul>

                <div className="pt-2">
                  <p className="font-normal text-[12pt] mb-1">b)&nbsp;&nbsp;Kendala yang dihadapi</p>
                  <ul className="list-disc pl-8 space-y-1 text-justify text-[12pt] leading-[1.5]">
                    <li>Kepatuhan petugas terhadap pemakaian APD terkadang lupa memakai apron/celemek.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 13) Pengelolaan Jenazah */}
            <div className="pt-2">
              <p className="font-bold text-[12pt] mb-1">13)&nbsp;&nbsp;Pengelolaan Jenazah</p>
              
              <div className="space-y-1">
                <p className="font-normal text-[12pt] mb-0.5">a)&nbsp;&nbsp;Kegiatan yang sudah dilakukan</p>
                <p className="indent-8 text-justify text-[12pt] leading-[1.5]">
                  Kamar jenazah di RSUD Al-Mulk belum melakukan pemulasaraan jenazah, hanya menerima transit jenazah.
                </p>

                <div className="pt-2">
                  <p className="font-normal text-[12pt] mb-1">b)&nbsp;&nbsp;Kendala yang dihadapi</p>
                  <p className="indent-8 text-justify text-[12pt] leading-[1.5]">
                    Peningkatan fasilitas kamar jenazah untuk kegiatan pemulasaraan jenazah sesuai dengan standar PPI.
                  </p>
                </div>
              </div>
            </div>

            {/* b. Kewaspadaan berdasar transmisi */}
            <div className="pt-2">
              <p className="font-bold text-[12pt] mb-1">b.&nbsp;&nbsp;Kewaspadaan berdasar transmisi</p>
              
              <div className="space-y-1">
                <p className="font-normal text-[12pt] mb-0.5">a)&nbsp;&nbsp;Pelaksanaan Kegiatan</p>
                <p className="indent-8 text-justify text-[12pt] leading-[1.5]">
                  Pelaksanaan kewaspadaan ini sudah dilakukan dengan baik. Kewaspadaan transmisi, sebagai bagian dari kewaspadaan isolasi, diterapkan terhadap pasien yang diketahui maupun diduga terinfeksi atau terkolonisasi patogen untuk memutuskan mata rantai transmisi infeksi. Kewaspadaan berdasarkan transmisi yang sudah dilakukan di RSUD Al-Mulk:
                </p>
                <ul className="list-disc pl-12 space-y-0.5 text-justify text-[12pt] leading-[1.5] pt-1">
                  <li>Kontak</li>
                  <li>Droplet (TBC)</li>
                  <li>Airborne (TBC, MERS, Meningitis, Covid-19)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 33: KENDALA TRANSMISI & SURVEILANS PHLEBITIS      */}
      {/* ========================================================= */}
      <F4Page customPageNumber={33}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3 text-justify text-[12pt] leading-[1.5]">
            {/* b) Kendala yang dihadapi (Transmisi) */}
            <div>
              <p className="font-normal text-[12pt] mb-1">b)&nbsp;&nbsp;Kendala yang dihadapi</p>
              <ul className="list-disc pl-8 space-y-1 text-justify text-[12pt] leading-[1.5]">
                <li>Ketersediaan ruang isolasi belum sesuai standar (ruang isolasi bertekanan negatif)</li>
                <li>Ketersediaan ruang kohort yang terbatas menjadi salahsatu penyebab pengelolaan pasien infeksius</li>
                <li>Alur pasien airborne belum bisa dilaksanakan dengan maksimal</li>
                <li>Ketersediaan hepafilter belum ada sebagai pembantusirkulasi diruang kohorting</li>
                <li>Ketersediaan APD yang tidak berkelanjutan</li>
                <li>Ketersediaan cairan cuci tangan yang masih kurang</li>
              </ul>
            </div>

            {/* 2. Surveilans HAIs */}
            <div className="pt-2">
              <p className="font-bold text-[12pt] mb-1">2.&nbsp;&nbsp;Surveilans HAIs</p>

              <div>
                <p className="font-bold text-[12pt] mb-1">a)&nbsp;&nbsp;Phlebitis</p>
                <p className="indent-8 text-justify text-[12pt] leading-[1.5]">
                  Angka kejadian phlebitis {year} tertinggi ada pada bulan Juli yaitu 29‰. Pada bulan November mengalami penurunan yaitu 3,2‰, kemudian di bulan Desember mengalami sedikit kenaikan lagi menjadi 4,1‰. Hal ini disebabkan oleh :
                </p>

                <ul className="list-disc pl-8 space-y-1 text-justify text-[12pt] leading-[1.5] pt-1">
                  <li>Kepatuhan hand hygiene masih rendah, rata-rata 67 %</li>
                  <li>
                    Standar penggantian lokasi infus setiap 3 x 24 jam belum dilaksanakan dengan baik
                    <ul className="list-[-_] pl-6 space-y-0.5 text-justify text-[12pt] leading-[1.4] pt-1">
                      <li>Obat dan cairan infus dengan osmolaritas tinggi</li>
                      <li>Pemberian terapi injeksi terlalu cepat</li>
                      <li>Fiksasi yang kurang kuat</li>
                      <li>Pelaksanaan SPO injeksi dan pemasangan infus belum maksimal.</li>
                    </ul>
                  </li>
                  <li>Pemilihan iv kateter belum disesuaikan dengan kebutuhan, masih ada pemasangan infus menggunakan iv kateter yang kecil (standar iv kateter dipasang sesuai dengan kebutuhan)</li>
                  <li>Teknik desinfeksi kulit belum maksimal, masih ditemukan penusukan jarum infus dilakukan saat swab alkohol belum kering.</li>
                  <li className="list-none -ml-4">
                    <span className="inline-block w-4 text-center">-</span> Suhu ruangan yang tinggi, sehingga pasien mudah berkeringat dan dressing mudah lepas.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 34: SURVEILANS IDO & ISK                          */}
      {/* ========================================================= */}
      <F4Page customPageNumber={34}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3 text-justify text-[12pt] leading-[1.5]">
            {/* b) IDO */}
            <div>
              <p className="font-bold text-[12pt] mb-1">b)&nbsp;&nbsp;IDO</p>
              <div className="space-y-2 text-justify text-[12pt] leading-[1.5]">
                <p className="indent-8">
                  Berdasarkan hasil pelaksanaan surveilans Healthcare Associated Infections (HAIs) di RSUD Al-Mulk, selama tahun {year} yaitu 0 ‰. Tidak ditemukan kejadian Infeksi Daerah Operasi (IDO) pada seluruh pasien yang menjalani tindakan pembedahan. Tidak adanya kejadian IDO ini menunjukkan bahwa penerapan upaya pencegahan dan pengendalian infeksi, khususnya pada pelayanan bedah, telah berjalan dengan baik dan sesuai dengan standar yang ditetapkan. Kepatuhan tenaga kesehatan terhadap penerapan bundle pencegahan IDO, prosedur aseptik dan antiseptik, sterilisasi alat, penggunaan antibiotik profilaksis yang tepat, serta monitoring kondisi luka operasi pasca tindakan menjadi faktor pendukung dalam pencapaian hasil tersebut.
                </p>
                <p className="indent-8">
                  Sebagai rekomendasi, capaian tidak adanya kejadian IDO ini perlu dipertahankan dan ditingkatkan melalui penguatan komitmen seluruh tenaga kesehatan terhadap penerapan standar prosedur operasional (SPO) pencegahan IDO secara konsisten. Selain itu, perlu dilakukan surveilans secara berkelanjutan dan pencatatan data yang akurat serta real time, disertai dengan kegiatan audit kepatuhan, edukasi dan pelatihan rutin bagi petugas, serta evaluasi berkala oleh Tim PPI. Upaya tersebut diharapkan dapat memastikan keberlanjutan mutu pelayanan bedah dan mencegah terjadinya IDO di masa yang akan datang.
                </p>
              </div>
            </div>

            {/* c) ISK */}
            <div className="pt-2">
              <p className="font-bold text-[12pt] mb-1">c)&nbsp;&nbsp;ISK</p>
              <div className="space-y-2 text-justify text-[12pt] leading-[1.5]">
                <p className="indent-8">
                  Angka kejadian ISK tahun {year} 0 ‰. Meskipun HAI’s ISK masih dibawah standar yang telah ditentukan, hal ini perlu pengkajian lebih lanjut kemungkinan pelaksana kurang memahami pengertian penerapan bundle ISK sehingga perlu sosialisasi untuk pelaksanaan bundle ISK untuk semua hospitalia yang melaksanakan pelayanan secara langsung ke pasien.
                </p>
                <p>
                  Adapun faktor yang mempengaruhi terjadinya ISK
                </p>
                <ul className="list-disc pl-8 space-y-1 text-justify text-[12pt] leading-[1.5]">
                  <li>Pengetahuan mengenai bundle ISK dan monitoring ISK lebih lanjut</li>
                  <li>Kepatuhan hand hygiene masih rendah, yaitu 67%</li>
                  <li>Pemeliharaan kateter belum dilaksanakan dengan baik :</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 35: ISK LANJUTAN, VAP, DECUBITUS & BUNDLE HAIs   */}
      {/* ========================================================= */}
      <F4Page customPageNumber={35}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3 text-justify text-[12pt] leading-[1.5]">
            {/* Lanjutan Pemeliharaan kateter */}
            <div>
              <ul className="list-[-_] pl-8 space-y-1 text-justify text-[12pt] leading-[1.4]">
                <li>Fiksasi kateter tidak sesuai standar</li>
                <li>
                  Posisi urine bag tidak diperhatikan
                  <ul className="list-disc pl-6 space-y-0.5 text-justify text-[12pt] leading-[1.4] pt-1">
                    <li>Urine bag terkadang sejajar dengan kandung kemih, sehingga drainage urin tidak lancar</li>
                    <li>Urine bag sering diletakkan di lantai</li>
                    <li>Cara penggantungan urin bag yang tidak tepat menyebabkan selang kateter urin terlipat sehingga aliran urin tidak lancar.</li>
                  </ul>
                </li>
              </ul>
              <ul className="list-disc pl-8 space-y-1 text-justify text-[12pt] leading-[1.5] pt-1">
                <li>Kualitas perawatan kateter belum maksimal</li>
                <li>Perawatan perineal dilakukan hanya 1 x sehari (standar perawatan perineal dilakukan 2 x sehari dan sewaktu – waktu bila kotor)</li>
                <li>Status imunologi pasien</li>
              </ul>
            </div>

            {/* d) VAP */}
            <div className="pt-1">
              <p className="font-bold text-[12pt] mb-1">d)&nbsp;&nbsp;VAP</p>
              <p className="indent-8 text-justify text-[12pt] leading-[1.5]">
                Berdasarkan hasil surveilans Healthcare Associated Infections (HAIs) di RSUD Al-Mulk, selama tahun {year} tidak ditemukan kejadian Ventilator Associated Pneumonia (VAP) atau tercatat 0 kasus, yang menunjukkan bahwa penerapan pencegahan infeksi pada pasien dengan ventilator telah berjalan sesuai standar.
              </p>
            </div>

            {/* e) Decubitus */}
            <div className="pt-1">
              <p className="font-bold text-[12pt] mb-1">e)&nbsp;&nbsp;Decubitus</p>
              <p className="indent-8 text-justify text-[12pt] leading-[1.5]">
                Berdasarkan hasil surveilans Healthcare Associated Infections (HAIs) di RSUD Al-Mulk, selama tahun {year} tidak ditemukan kejadian dekubitus (0 kasus), yang menunjukkan bahwa upaya pencegahan dan perawatan pasien berisiko telah dilaksanakan dengan baik sesuai standar pelayanan.
              </p>
            </div>

            {/* 3. Bundle HAIs */}
            <div className="pt-1">
              <p className="font-bold text-[12pt] mb-1">3.&nbsp;&nbsp;Penerapan Bundle HAIs</p>
              <div className="pl-4 space-y-1">
                <p className="font-bold text-[12pt] mb-1">a)&nbsp;&nbsp;Phlebitis</p>
                <div className="pl-4 space-y-1 text-justify text-[12pt] leading-[1.5]">
                  <p>1)&nbsp;&nbsp;Lakukan kebersihan tangan</p>
                  <p>2)&nbsp;&nbsp;Gunakan APD sesuai indikasi</p>
                  <p>3)&nbsp;&nbsp;Lakukan perawatan area insersi dengan tindakan asepsis</p>
                  <p>4)&nbsp;&nbsp;Perawatan lokasi yag optimal, dengan menghindari vena femoralis untuk akses vena sentral pada pasien dewasa (pemilihan alat dan lokasi pemasangan)</p>
                  <ul className="list-disc pl-8 space-y-0.5 text-justify text-[12pt] leading-[1.5] pt-0.5">
                    <li>Pilih vena yang besar, lurus/ tidak di percabangan, tidak di daerah yang banyak pergerakan, sudah diterapkan</li>
                    <li>Klinisi mempertimbangkan resiko komplikasi infeksi, dan</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </F4Page>

      {/* ========================================================= */}
      {/* HALAMAN 36: LANJUTAN PHLEBITIS & BUNDLE ISK (Halaman 36)  */}
      {/* ========================================================= */}
      <F4Page customPageNumber={36}>
        <div className="w-full h-full flex flex-col justify-start py-1 text-black font-sans">
          <div className="space-y-3 text-justify text-[12pt] leading-[1.5]">
            {/* Lanjutan poin dari halaman 35 */}
            <div className="pl-12">
              <p className="text-justify text-[12pt] leading-[1.5]">
                komplikasi mekanikal seperti thrombosis, emboli udara, salah penempatan kateter, seleksi area penusukan sudah diterapkan.
              </p>
            </div>

            {/* 5) Kaji kebutuhan IV kateter */}
            <div className="pl-4">
              <p className="font-normal text-[12pt] mb-1">5)&nbsp;&nbsp;Kaji kebutuhan IV kateter</p>
              <ul className="list-disc pl-8 space-y-1 text-justify text-[12pt] leading-[1.5]">
                <li>Setiap hari kaji ulang, keperluan kateter masih indikasi apa tidak, adanya tanda-tanda infeksi : sudah diterapkan</li>
                <li>Segera lepas jika tidak diperlukan : sudah diterapkan</li>
                <li>Bila pemasangan kateter sentral dalam situasi emergency dimana tidak terjamin kesterilannya , maka kateter harus diganti dalam 48 jam : sudah diterapkan</li>
                <li>
                  Semua kateter harus diganti jika diduga ada infeksi : belum diterapkan dengan baik.
                  <ul className="list-[-_] pl-6 space-y-0.5 text-justify text-[12pt] leading-[1.4] pt-1">
                    <li>Standar penggantian infus set dilakukan setiap 3 x 24 jam : belum diterapkan dengan baik, masih ditemukan pengganti lokasi penusukan infus dilaksanakan setelah terjadi phlebitis.</li>
                    <li>Standar penggantian infus set pada pasien post transfusi: belum diterapkan, masih banyak ditemukan post transfusi dilakukan proses spooling NaCl menggunakan transfusi set tanpa mengganti dengan infus set baru.</li>
                  </ul>
                </li>
                <li>
                  Cairan parenteral
                  <ul className="list-[-_] pl-6 space-y-0.5 text-justify text-[12pt] leading-[1.4] pt-1">
                    <li>Infus harus diselesaikan dalam 24 jam untuk satu botol cairan parenteral yang menggandung lemak : sudah diterapkan.</li>
                    <li>Bila hanya emulsi lemak yang diberikan selesaikan infus dalam 12 jam setelah botol emulsi mulai digunakan : sudah diterapkan.</li>
                    <li>Pemberian obat dengan osmolarisasi tinggi : pengenceran cairan infus dengan osmolaritas tinggi sudah menggunakan infus set bercabang / three way.</li>
                  </ul>
                </li>
              </ul>
            </div>

            {/* b) ISK */}
            <div className="pt-2">
              <p className="font-bold text-[12pt] mb-1">b)&nbsp;&nbsp;ISK</p>
              <div className="pl-4 space-y-1">
                <p className="font-bold text-[12pt] mb-0.5">1)&nbsp;&nbsp;Kebersihan tangan</p>
                <p className="text-justify text-[12pt] leading-[1.5] pl-4">
                  Hand hygiene sebagai faktor utama dalam pencegahan dan pengendalian HAIs belum diterapkan dengan baik. Kepatuhan hand hygiene perawat masih rendah, terutama kepatuhan hand hygiene sebelum kontak dengan pasien dan kepatuhan hand hygiene sebelum melakukan Tindakan aseptik.
                </p>
              </div>
            </div>
          </div>
        </div>
      </F4Page>
    </>
  );
}

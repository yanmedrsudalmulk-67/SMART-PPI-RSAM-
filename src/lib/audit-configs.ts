export const genericAuditConfigs: Record<string, { tableName: string; extraFilter?: Record<string, string>; items?: { id: string; label: string; key: string; section?: string; isNegative?: boolean }[] }> = {
  audit_hand_hygiene: {
    tableName: 'audit_hand_hygiene',
    items: [
      { id: 'm1', label: 'Momen 1: Sebelum kontak dengan pasien', key: 'm1', section: '5 Momen Kebersihan Tangan' },
      { id: 'm2', label: 'Momen 2: Sebelum tindakan aseptik', key: 'm2', section: '5 Momen Kebersihan Tangan' },
      { id: 'm3', label: 'Momen 3: Setelah kontak cairan tubuh', key: 'm3', section: '5 Momen Kebersihan Tangan' },
      { id: 'm4', label: 'Momen 4: Setelah kontak dengan pasien', key: 'm4', section: '5 Momen Kebersihan Tangan' },
      { id: 'm5', label: 'Momen 5: Setelah kontak lingkungan pasien', key: 'm5', section: '5 Momen Kebersihan Tangan' }
    ]
  },
  audit_apd: {
    tableName: 'audit_apd',
    items: [
      { id: 'masker', label: '1. Masker', key: 'masker' },
      { id: 'sarung_tangan', label: '2. Sarung Tangan', key: 'sarung_tangan' },
      { id: 'penutup_kepala', label: '3. Penutup Kepala', key: 'penutup_kepala' },
      { id: 'apron', label: '4. Apron', key: 'apron' },
      { id: 'goggle', label: '5. Kaca Mata / Goggle', key: 'goggle' },
      { id: 'sepatu_boot', label: '6. Sepatu Boot', key: 'sepatu_boot' },
      { id: 'gaun_pelindung', label: '7. Gaun / Baju Pelindung', key: 'gaun_pelindung' }
    ]
  },
  dekontaminasi_alat: {
    tableName: 'audit_dekontaminasi_alat',
    items: [
      { id: 'peralatan_tersedia', label: '1. Peralatan tersedia dan tersusun baik di meja dan lemari', key: 'peralatan_tersedia' },
      { id: 'peralatan_berkarat', label: '2. Adakah peralatan sarana dan prasarana kesehatan yang berkarat', key: 'peralatan_berkarat' },
      { id: 'sterilisasi_tersentral', label: '3. Sterilisasi tersentral', key: 'sterilisasi_tersentral' },
      { id: 'alat_reused', label: '4. Alat used reused sesuai aturan', key: 'alat_reused' },
      { id: 'metode_dekontaminasi', label: '5. Petugas dapat menjelaskan metoda dekontaminasi peralatan yang biasa digunakan pasien', key: 'metode_dekontaminasi' },
      { id: 'dekontaminasi_lokal', label: '6. Dekontaminasi lokal dari instrumen bedah tidak dilakukan di area klinis', key: 'dekontaminasi_lokal' },
      { id: 'expired_date', label: '7. Tanggal kadaluarsa peralatan steril belum terlewati', key: 'expired_date' },
      { id: 'instrumen_bekas', label: '8. Tidak terlihat debu / darah tertinggal di instrumen bekas pakai', key: 'instrumen_bekas' }
    ]
  },
  pengendalian_lingkungan: {
    tableName: 'audit_pengendalian_lingkungan',
    items: [
      { id: 'item_1', label: 'Kursi/meja/dan loker tampak bersih', key: 'item_1' },
      { id: 'item_2', label: 'Troli tindakan tampak bersih', key: 'item_2' },
      { id: 'item_3', label: 'Troli tindakan dibersihkan dan didesinfeksi', key: 'item_3' },
      { id: 'item_4', label: 'Lantai bersih dan dalam kondisi baik', key: 'item_4' },
      { id: 'item_5', label: 'Ditemukan debu di permukaan kerja', key: 'item_5', isNegative: true },
      { id: 'item_6', label: 'Tirai pemisah bersih', key: 'item_6' },
      { id: 'item_7', label: 'Kipas angin dan AC bersih', key: 'item_7' },
      { id: 'item_8', label: 'Dinding bebas jamur', key: 'item_8' },
      { id: 'item_9', label: 'Ventilasi/jendela bersih', key: 'item_9' },
      { id: 'item_10', label: 'Area tunggu bersih', key: 'item_10' }
    ]
  },
  pengelolaan_limbah_medis: {
    tableName: 'audit_pengelolaan_limbah_medis',
    items: [
      { id: 'item_1', label: 'Tersedia fasilitas pembuangan sampah', key: 'item_1' },
      { id: 'item_2', label: 'Tempat sampah pedal kaki', key: 'item_2' },
      { id: 'item_3', label: 'Tempat sampah berlabel', key: 'item_3' },
      { id: 'item_4', label: 'Plastik kuning limbah infeksius', key: 'item_4' },
      { id: 'item_5', label: 'Tempat sampah memadai', key: 'item_5' },
      { id: 'item_6', label: 'Sampah diikat', key: 'item_6' },
      { id: 'item_7', label: 'Sampah tidak lebih 3/4', key: 'item_7' },
      { id: 'item_8', label: 'Disimpan di TPS', key: 'item_8' },
      { id: 'item_9', label: 'Tahu cara tumpahan', key: 'item_9' },
      { id: 'item_10', label: 'Spill kit tersedia', key: 'item_10' }
    ]
  },
  pengelolaan_limbah_tajam: {
    tableName: 'audit_pengelolaan_limbah_tajam',
    items: [
      { id: 'item_1', label: 'Safety box sesuai WHO', key: 'item_1' },
      { id: 'item_2', label: 'Wadah aman', key: 'item_2' },
      { id: 'item_3', label: 'Wadah < 3/4 penuh', key: 'item_3' },
      { id: 'item_4', label: 'Tidak ada tajam keluar', key: 'item_4' },
      { id: 'item_5', label: 'Tajam masuk wadah tajam', key: 'item_5' },
      { id: 'item_6', label: 'Tong tajam di troli', key: 'item_6' },
      { id: 'item_7', label: '1 tangan / no recapping', key: 'item_7' },
      { id: 'item_8', label: 'Jalur paska pajanan', key: 'item_8' }
    ]
  },
  penatalaksanaan_linen: {
    tableName: 'audit_penatalaksanaan_linen',
    items: [
      { id: 'item_1', label: 'Linen bersih disimpan lemari tertutup', key: 'item_1' },
      { id: 'item_2', label: 'Troli tertutup kotor', key: 'item_2' },
      { id: 'item_3', label: 'Kantung kuning infeksius', key: 'item_3' },
      { id: 'item_4', label: 'Linen kotor dipisah', key: 'item_4' },
      { id: 'item_5', label: 'Petugas APD infeksius', key: 'item_5' }
    ]
  },
  monitoring_airborne: {
    tableName: 'penempatan_pasien_airbone',
  },
  monitoring_ppi_ruang_isolasi: {
    tableName: 'audit_monitoring_ppi',
    extraFilter: { kategori: 'ppi_isolasi' },
    items: [
      { id: 'tekanan_negatif', label: 'Tekanan Udara Negatif', key: 'tekanan_negatif' },
      { id: 'tekanan_positif', label: 'Tekanan Udara Positif', key: 'tekanan_positif' },
      { id: 'penggunaan_apd', label: 'Penggunaan APD yang sesuai', key: 'penggunaan_apd' },
      { id: 'ketersediaan_apd', label: 'Ketersediaan APD yang sesuai', key: 'ketersediaan_apd' },
      { id: 'fasilitas_hh', label: 'Kelengkapan Fasilitas Kebersihan Tangan', key: 'fasilitas_hh' },
      { id: 'edukasi_batuk', label: 'Edukasi Etika Batuk / Pembuangan Sputum', key: 'edukasi_batuk' },
      { id: 'edukasi_hh', label: 'Edukasi Kebersihan Tangan', key: 'edukasi_hh' }
    ]
  },
  monitoring_immuno: {
    tableName: 'penempatan_pasien_immunocompromised',
    items: [
      { id: 'ruang_terpisah', label: 'Ruangan terpisah (sendiri) / cohorting jarak > 1 meter', key: 'ruang_terpisah' },
      { id: 'pintu_tertutup', label: 'Pintu ruangan selalu tertutup', key: 'pintu_tertutup' },
      { id: 'transport_perlu', label: 'Transport pasien bila diperlukan saja', key: 'transport_perlu' },
      { id: 'pasien_masker', label: 'Pasien memakai masker saat keluar ruangan', key: 'pasien_masker' },
      { id: 'fasilitas_ct', label: 'Tersedia fasilitas cuci tangan', key: 'fasilitas_ct' },
      { id: 'petugas_5momen', label: 'Petugas melakukan cuci tangan sesuai 5 momen', key: 'petugas_5momen' },
      { id: 'masker_kontak', label: 'Menggunakan masker saat kontak dengan pasien', key: 'masker_kontak' },
      { id: 'sarungtangan_cairan', label: 'Memakai sarung tangan bila akan kontak dengan cairan tubuh', key: 'sarungtangan_cairan' },
      { id: 'goggle_perlu', label: 'Memakai kacamata goggle bila perlu', key: 'goggle_perlu' },
      { id: 'gaun_perlu', label: 'Memakai gaun pelindung bila perlu', key: 'gaun_perlu' },
      { id: 'edukasi_pasien', label: 'Memberikan edukasi kepada pasien', key: 'edukasi_pasien' },
      { id: 'edukasi_keluarga', label: 'Memberikan edukasi kepada keluarga pasien', key: 'edukasi_keluarga' },
      { id: 'bersih_desinfektan', label: 'Setelah pasien pulang, bersihkan ruangan', key: 'bersih_desinfektan' }
    ]
  },
  penempatan_pasien: {
    tableName: 'audit_penempatan_pasien',
    items: [
      { id: 'catatan_infeksi', label: 'Catatan infeksi', key: 'catatan_infeksi' },
      { id: 'instruksi_ruang', label: 'Instruksi petugas (tanda)', key: 'instruksi_ruang' },
      { id: 'poster_pencegahan', label: 'Poster pencegahan', key: 'poster_pencegahan' },
      { id: 'apd_tersedia', label: 'APD tersedia', key: 'apd_tersedia' },
      { id: 'catatan_klinis', label: 'Catatan klinis', key: 'catatan_klinis' },
      { id: 'instruksi_isolasi', label: 'Instruksi isolasi', key: 'instruksi_isolasi' },
      { id: 'pintu_tertutup', label: 'Pintu tertutup', key: 'pintu_tertutup' },
      { id: 'alur_pasien', label: 'Alur terpasang', key: 'alur_pasien' }
    ]
  },
  penyuntikan_aman: {
    tableName: 'audit_penyuntikan_aman',
    items: [
      { id: 'hh', label: 'Kebersihan tangan', key: 'hh' },
      { id: 'apd', label: 'APD indikasi', key: 'apd' },
      { id: 'disposable', label: 'Spuit sekali pakai', key: 'disposable' },
      { id: 'no_reuse', label: 'Spuit no reuse', key: 'no_reuse' },
      { id: 'no_touch_sterile', label: 'No touch steril', key: 'no_touch_sterile' },
      { id: 'area_disinfection', label: 'Desinfeksi area', key: 'area_disinfection' },
      { id: 'antiseptic_standard', label: 'Antiseptik standar', key: 'antiseptic_standard' },
      { id: 'no_recapping', label: 'No recapping', key: 'no_recapping' },
      { id: 'safety_box', label: 'Safety box langsung', key: 'safety_box' },
      { id: 'no_bending', label: 'No bending jarum', key: 'no_bending' }
    ]
  },
  etika_batuk: {
    tableName: 'audit_etika_batuk',
    items: [
      { id: 'mengenakan_masker', label: 'Mengenakan masker', key: 'mengenakan_masker' },
      { id: 'menutup_mulut_hidung', label: 'Menutup mulut & hidung saat batuk/bersin', key: 'menutup_mulut_hidung' },
      { id: 'tisu_sekali_pakai', label: 'Menggunakan tisu sekali pakai', key: 'tisu_sekali_pakai' },
      { id: 'cuci_tangan', label: 'Melakukan kebersihan tangan setelah batuk/bersin', key: 'cuci_tangan' },
      { id: 'jarak_sosial', label: 'Menjaga jarak dengan orang lain', key: 'jarak_sosial' }
    ]
  },
  perlindungan_petugas: {
    tableName: 'audit_perlindungan_petugas',
    items: [
      { id: 'item_1', label: 'Vaksinasi HepB & Covid', key: 'item_1' },
      { id: 'item_2', label: 'Pemeriksaan 1x/thn', key: 'item_2' }
    ]
  },
  monitoring_fasilitas_hand_hygiene: {
    tableName: 'monitoring_fasilitas_hand_hygiene',
    items: [
      { id: 'item_1', label: 'Tersedia Hand Rub Cukup', key: 'item_1' },
      { id: 'item_2', label: 'Tersedia Sabun Cair Cukup', key: 'item_2' },
      { id: 'item_3', label: 'Tersedia Tissue Towel Cukup', key: 'item_3' },
      { id: 'item_4', label: 'Kondisi Wastafel Baik', key: 'item_4' },
      { id: 'item_5', label: 'Air Wastafel Mengalir Lancar', key: 'item_5' },
      { id: 'item_6', label: 'Tersedia Petunjuk Cuci Tangan', key: 'item_6' },
      { id: 'item_7', label: 'Tersedia Tempat Sampah Non-Medis', key: 'item_7' },
      { id: 'item_8', label: 'Lingkungan Sekitar Wastafel Bersih', key: 'item_8' },
    ]
  },
  monitoring_fasilitas_apd: {
    tableName: 'monitoring_fasilitas_apd',
    items: [
      { id: 'item_1', label: 'Tersedia Masker Medis', key: 'item_1' },
      { id: 'item_2', label: 'Tersedia Masker N95', key: 'item_2' },
      { id: 'item_3', label: 'Tersedia Gown / Apron', key: 'item_3' },
      { id: 'item_4', label: 'Tersedia Sarung Tangan Steril', key: 'item_4' },
      { id: 'item_5', label: 'Tersedia Sarung Tangan Non-Steril', key: 'item_5' },
      { id: 'item_6', label: 'Tersedia Googles / Face Shield', key: 'item_6' },
      { id: 'item_7', label: 'Tersedia Sepatu Boots', key: 'item_7' },
      { id: 'item_8', label: 'Penyimpanan APD Tepat & Bersih', key: 'item_8' }
    ]
  },
  monitoring_farmasi: {
    tableName: 'audit_farmasi',
    items: [
      { id: 'item_1', label: 'Petugas memakai APD saat meracik obat', key: 'item_1' },
      { id: 'item_2', label: 'Fasilitas cuci tangan lengkap', key: 'item_2' },
      { id: 'item_3', label: 'Melakukan kebersihan tangan 5 momen', key: 'item_3' },
      { id: 'item_4', label: 'Pencampuran obat dilakukan secara steril / aseptic', key: 'item_4' },
      { id: 'item_5', label: 'Obat LASA & High Alert diberi penanda', key: 'item_5' },
      { id: 'item_6', label: 'Monitoring suhu kulkas obat (2-8°C)', key: 'item_6' },
      { id: 'item_7', label: 'Monitoring suhu ruangan farmasi ( < 25°C)', key: 'item_7' },
      { id: 'item_8', label: 'Obat kadaluarsa disimpan terpisah', key: 'item_8' },
      { id: 'item_9', label: 'Limbah benda tajam dibuang ke safety box', key: 'item_9' },
      { id: 'item_10', label: 'Ruangan tampak bersih secara umum', key: 'item_10' }
    ]
  },
  monitoring_ibs: {
    tableName: 'audit_ruangan_ibs',
    items: [
      { id: 'a1', label: 'Personal hygiene baik', key: 'a1' },
      { id: 'a2', label: 'Menggunakan pakaian khusus OK', key: 'a2' },
      { id: 'a7', label: 'Cuci tangan bedah dengan benar sebelum prosedur', key: 'a7' },
      { id: 'b1', label: 'Pintu selalu tertutup', key: 'b1' },
      { id: 'b2', label: 'Pertahankan tekanan positif, suhu, dan kelembaban', key: 'b2' },
      { id: 'c1', label: 'Tertib Limbah', key: 'c1' },
      { id: 'd2', label: 'Wastafel cuci tangan tersedia', key: 'd2' },
      { id: 'e1', label: 'Pembersihan antar pasien', key: 'e1' },
      { id: 'f2', label: 'Suhu Ruangan 20ºC – 23ºC', key: 'f2' },
      { id: 'g1', label: 'Pertukaran udara kamar operasi minimal 15x/jam', key: 'g1' },
    ]
  },
  ibs: {
    tableName: 'audit_ruangan_ibs',
    items: [
      { id: 'a1', label: 'Personal hygiene baik', key: 'a1' },
      { id: 'a2', label: 'Menggunakan pakaian khusus OK', key: 'a2' },
      { id: 'a7', label: 'Cuci tangan bedah dengan benar sebelum prosedur', key: 'a7' },
      { id: 'b1', label: 'Pintu selalu tertutup', key: 'b1' },
      { id: 'b2', label: 'Pertahankan tekanan positif, suhu, dan kelembaban', key: 'b2' },
      { id: 'c1', label: 'Tertib Limbah', key: 'c1' },
      { id: 'd2', label: 'Wastafel cuci tangan tersedia', key: 'd2' },
      { id: 'e1', label: 'Pembersihan antar pasien', key: 'e1' },
      { id: 'f2', label: 'Suhu Ruangan 20ºC – 23ºC', key: 'f2' },
      { id: 'g1', label: 'Pertukaran udara kamar operasi minimal 15x/jam', key: 'g1' },
    ]
  },
  monitoring_cssd: {
    tableName: 'audit_monitoring_cssd',
    items: [
      { id: 'item_1', label: 'Petugas menggunakan APD lengkap', key: 'item_1' },
      { id: 'item_2', label: 'Alur proses sterilisasi satu arah (unidirectional)', key: 'item_2' },
      { id: 'item_3', label: 'Tersedia area kotor, bersih, dan steril yang terpisah', key: 'item_3' },
      { id: 'item_4', label: 'Monitoring mesin sterilisasi (suhu & tekanan)', key: 'item_4' },
      { id: 'item_5', label: 'Penggunaan indikator kimia/biologi pada setiap siklus', key: 'item_5' },
      { id: 'item_6', label: 'Penyimpanan alat steril di ruang bertekanan positif', key: 'item_6' },
      { id: 'item_7', label: 'Kebersihan ruangan terjaga', key: 'item_7' }
    ]
  },
  laboratorium_old: {
    tableName: 'audit_monitoring_laboratorium',
    items: [
      { id: 'item_1', label: 'Petugas memakai jas lab, masker, & sarung tangan', key: 'item_1' },
      { id: 'item_2', label: 'Penanganan sampel dilakukan di Biosafety Cabinet (bila perlu)', key: 'item_2' },
      { id: 'item_3', label: 'Kebersihan tangan dilakukan sebelum & sesudah tindakan', key: 'item_3' },
      { id: 'item_4', label: 'Limbah medis dibuang ke wadah yang tepat', key: 'item_4' },
      { id: 'item_5', label: 'Desinfeksi permukaan kerja dilakukan setiap hari', key: 'item_5' }
    ]
  },
  radiologi_old: {
    tableName: 'audit_monitoring_radiologi',
    items: [
      { id: 'item_1', label: 'Kebersihan tangan petugas baik', key: 'item_1' },
      { id: 'item_2', label: 'Penggunaan apron timbal sesuai indikasi', key: 'item_2' },
      { id: 'item_3', label: 'Peralatan pemeriksaan didesinfeksi antar pasien', key: 'item_3' },
      { id: 'item_4', label: 'Alur pasien infeksius & non-infeksius terpisah', key: 'item_4' }
    ]
  },
  monitoring_gizi: {
    tableName: 'audit_monitoring_gizi',
    items: [
      { id: 'item_1', label: 'Penjamah makanan memakai tutup kepala, masker, & celemek', key: 'item_1' },
      { id: 'item_2', label: 'Kuku petugas pendek & tidak memakai perhiasan di tangan', key: 'item_2' },
      { id: 'item_3', label: 'Penyimpanan bahan makanan mentah & matang terpisah', key: 'item_3' },
      { id: 'item_4', label: 'Suhu penyimpanan makanan sesuai standar', key: 'item_5' },
      { id: 'item_5', label: 'Peralatan makan dicuci dengan air panas & desinfektan', key: 'item_6' }
    ]
  },
  monitoring_jenazah: {
    tableName: 'audit_kamar_jenazah',
    items: [
      { id: 'a1', label: 'Lantai bersih dan tidak licin', key: 'a1', section: 'KEBERSIHAN RUANGAN DAN PERALATAN' },
      { id: 'a2', label: 'Permukaan tidak berdebu', key: 'a2', section: 'KEBERSIHAN RUANGAN DAN PERALATAN' },
      { id: 'a3', label: 'Tidak ada laba-laba / sarang kotoran', key: 'a3', section: 'KEBERSIHAN RUANGAN DAN PERALATAN' },
      { id: 'a4', label: 'Tempat sampah tertutup', key: 'a4', section: 'KEBERSIHAN RUANGAN DAN PERALATAN' },
      { id: 'a5', label: 'Wastafel cuci tangan selalu bersih dan bebas dari peralatan', key: 'a5', section: 'KEBERSIHAN RUANGAN DAN PERALATAN' },
      { id: 'a6', label: 'Keran selalu bersih dan tidak berkarat', key: 'a6', section: 'KEBERSIHAN RUANGAN DAN PERALATAN' },
      { id: 'a7', label: 'Penutup keranda bersih', key: 'a7', section: 'KEBERSIHAN RUANGAN DAN PERALATAN' },
      { id: 'a8', label: 'Mobil jenazah bersih', key: 'a8', section: 'KEBERSIHAN RUANGAN DAN PERALATAN' },
      { id: 'a9', label: 'Mobil jenazah dibersihkan setiap habis pakai', key: 'a9', section: 'KEBERSIHAN RUANGAN DAN PERALATAN' },
      { id: 'b1', label: 'Tersedia APD lengkap', key: 'b1', section: 'FASILITAS' },
      { id: 'b2', label: 'Alat cuci tangan lengkap', key: 'b2', section: 'FASILITAS' },
      { id: 'b3', label: 'Tersedia handrub di mobil jenazah', key: 'b3', section: 'FASILITAS' },
      { id: 'b4', label: 'Tersedia spillkit di mobil jenazah', key: 'b4', section: 'FASILITAS' },
      { id: 'b5', label: 'Tersedia tempat sampah infeksius dan non infeksius', key: 'b5', section: 'FASILITAS' },
      { id: 'b6', label: 'Tersedia tempat linen kotor', key: 'b6', section: 'FASILITAS' }
    ]
  },
  monitoring_radiologi: {
    tableName: 'audit_radiologi',
    items: [
      { id: 'a1', label: 'Permukaan lingkungan termasuk troli, meja, rak, perlengkapan, hiasan, dan tumbuhan bebas dari debu/kotoran', key: 'a1', section: 'A. KONTROL LINGKUNGAN' },
      { id: 'a2', label: 'Kipas angin, AC, dan langit-langit bersih dan bebas jamur', key: 'a2', section: 'A. KONTROL LINGKUNGAN' },
      { id: 'a3', label: 'Langit-langit bersih dari noda', key: 'a3', section: 'A. KONTROL LINGKUNGAN' },
      { id: 'a4', label: 'Benda sesuai disimpan di bawah wastafel dalam wadah tertutup', key: 'a4', section: 'A. KONTROL LINGKUNGAN' },
      { id: 'a5', label: 'Petugas mengetahui jadwal rutin disinfeksi lingkungan dengan disinfektan RS', key: 'a5', section: 'A. KONTROL LINGKUNGAN' },
      { id: 'a6', label: 'Tersedia fasilitas memadai untuk kebersihan tangan', key: 'a6', section: 'A. KONTROL LINGKUNGAN' },
      { id: 'a7', label: 'Tempat cuci tangan tidak digunakan mencuci alat', key: 'a7', section: 'A. KONTROL LINGKUNGAN' },
      { id: 'a8', label: 'Poster kebersihan tangan tersedia di area petugas', key: 'a8', section: 'A. KONTROL LINGKUNGAN' },
      { id: 'a9', label: 'Tersedia handrub, botol baik, ada tanggal buka & expired', key: 'a9', section: 'A. KONTROL LINGKUNGAN' },
      { id: 'a10', label: 'Cek kemampuan petugas melakukan kebersihan tangan', key: 'a10', section: 'A. KONTROL LINGKUNGAN' },

      { id: 'b1', label: 'Petugas tahu prosedur pemisahan limbah', key: 'b1', section: 'B. MANAJEMEN LIMBAH' },
      { id: 'b2', label: 'Limbah klinis umum dibuang di kantung plastik', key: 'b2', section: 'B. MANAJEMEN LIMBAH' },
      { id: 'b3', label: 'Limbah berdarah dibuang di kantung biohazard', key: 'b3', section: 'B. MANAJEMEN LIMBAH' },
      { id: 'b4', label: 'Tempat sampah, tutup, pedal kaki berfungsi baik', key: 'b4', section: 'B. MANAJEMEN LIMBAH' },
      { id: 'b5', label: 'Tidak ada kantung berlebih isi', key: 'b5', section: 'B. MANAJEMEN LIMBAH' },
      { id: 'b6', label: 'Tersedia spill kit tumpahan darah', key: 'b6', section: 'B. MANAJEMEN LIMBAH' },

      { id: 'c1', label: 'Petugas berkuku pendek, bersih, tidak diwarnai', key: 'c1', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c2', label: 'Petugas melakukan kebersihan tangan sesuai indikasi', key: 'c2', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c3', label: 'Tidak menangani barang umum setelah kontak pasien', key: 'c3', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c4', label: 'Sarung tangan digunakan bila risiko kontak biohazard', key: 'c4', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c5', label: 'Gown berlengan panjang digunakan bila perlu', key: 'c5', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c6', label: 'Masker/pelindung mata bila risiko percikan', key: 'c6', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c7', label: 'Respirator N95 digunakan bila risiko airborne', key: 'c7', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c8', label: 'Fit test N95 dilakukan sebelum penggunaan', key: 'c8', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c9', label: 'APD dilepas di area kerja sesuai prosedur', key: 'c9', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c10', label: 'Disinfeksi lead apron/mobile lead screen setiap hari', key: 'c10', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c11', label: 'Lead apron/mobile lead screen bersih visual', key: 'c11', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c12', label: 'Alat pasien (mamogram dll) didisinfeksi tiap ganti pasien', key: 'c12', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c13', label: 'Makanan tidak dibawa ke ruang X-Ray', key: 'c13', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c14', label: 'Tidak ada bukti makan/minum di area kerja', key: 'c14', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c15', label: 'Obat dan alat kontras tidak kadaluarsa', key: 'c15', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c16', label: 'Tersedia alat radiologi mobile untuk pasien isolasi', key: 'c16', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c17', label: 'Ada alur pengambilan foto & laporan pasien infeksi khusus', key: 'c17', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c18', label: 'SPO pemeriksaan pasien infeksi khusus tersedia jelas', key: 'c18', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c19', label: 'Poster profilaksis pasca pajanan tersedia jelas', key: 'c19', section: 'C. PRAKTIK KONTROL INFEKSI' },
      { id: 'c20', label: 'Pemeriksaan suhu berkala petugas dilakukan', key: 'c20', section: 'C. PRAKTIK KONTROL INFEKSI' }
    ]
  },
  monitoring_laboratorium: {
    tableName: 'audit_laboratorium',
    items: [
      { id: 'a1', label: 'Kuku pendek dan bersih', key: 'a1', section: 'A. PERSONAL' },
      { id: 'a2', label: 'Tidak menggunakan perhiasan/aksesoris tangan', key: 'a2', section: 'A. PERSONAL' },
      { id: 'a3', label: 'Menggunakan APD lengkap', key: 'a3', section: 'A. PERSONAL' },
      { id: 'a4', label: 'Melakukan cuci tangan sesuai dengan prosedur', key: 'a4', section: 'A. PERSONAL' },
      { id: 'a5', label: 'Pemeriksaan kesehatan secara berkala', key: 'a5', section: 'A. PERSONAL' },
      { id: 'a6', label: 'Mengetahui cara penanganan tumpahan cairan tubuh dengan menggunakan spill kit', key: 'a6', section: 'A. PERSONAL' },
      { id: 'a7', label: 'Sudah mendapatkan imunisasi vaksin penyakit menular', key: 'a7', section: 'A. PERSONAL' },
      { id: 'a8', label: 'Melapor bila terpajan limbah infeksius (cair, tajam)', key: 'a8', section: 'A. PERSONAL' },

      { id: 'b1', label: 'Tersedia IPAL dan berfungsi dengan baik', key: 'b1', section: 'B. FASILITAS' },
      { id: 'b2', label: 'Tersedia spill kit untuk penanganan tumpahan cairan tubuh', key: 'b2', section: 'B. FASILITAS' },
      { id: 'b3', label: 'Trolley pengangkutan sampah tertutup', key: 'b3', section: 'B. FASILITAS' },
      { id: 'b4', label: 'Trolley pengangkutan sampah dibersihkan setelah selesai digunakan', key: 'b4', section: 'B. FASILITAS' },
      { id: 'b5', label: 'Tersedia APD petugas', key: 'b5', section: 'B. FASILITAS' },

      { id: 'c1', label: 'Limbah cair dibuang ke IPAL melalui spoelhoek', key: 'c1', section: 'C. PROSES PENGELOLAAN LIMBAH CAIR (INFEKSIUS)' },
      { id: 'c2', label: 'Saluran pembuangan ke IPAL lancar', key: 'c2', section: 'C. PROSES PENGELOLAAN LIMBAH CAIR (INFEKSIUS)' },
      { id: 'c3', label: 'Tidak ada limbah cair di dalam tempat limbah padat', key: 'c3', section: 'C. PROSES PENGELOLAAN LIMBAH CAIR (INFEKSIUS)' },
      { id: 'c4', label: 'Baku mutu limbah sesuai dengan standar', key: 'c4', section: 'C. PROSES PENGELOLAAN LIMBAH CAIR (INFEKSIUS)' },
      { id: 'c5', label: 'Sampel feces dan sputum dibuang ke limbah infeksius bersama tabungnya', key: 'c5', section: 'C. PROSES PENGELOLAAN LIMBAH CAIR (INFEKSIUS)' },
      { id: 'c6', label: 'Sampel urine dibuang ke spoelhoek, wadah dibuang ke limbah infeksius', key: 'c6', section: 'C. PROSES PENGELOLAAN LIMBAH CAIR (INFEKSIUS)' },

      { id: 'd1', label: 'Darah dan komponen darah yang sudah diambil ke ruangan dan tidak terpakai, dikembalikan ke unit pelayanan darah', key: 'd1', section: 'D. PROSES PEMBUANGAN DARAH DAN KOMPONEN DARAH' },
      { id: 'd2', label: 'Darah dan komponen darah yang rusak atau kadaluwarsa dikumpulkan di tempat khusus penyimpanan darah di unit pelayanan darah', key: 'd2', section: 'D. PROSES PEMBUANGAN DARAH DAN KOMPONEN DARAH' },
      { id: 'd3', label: 'Petugas kebersihan melakukan kebersihan tangan saat mengolah limbah darah dan komponen darah', key: 'd3', section: 'D. PROSES PEMBUANGAN DARAH DAN KOMPONEN DARAH' },
      { id: 'd4', label: 'Petugas menggunakan APD', key: 'd4', section: 'D. PROSES PEMBUANGAN DARAH DAN KOMPONEN DARAH' },
      { id: 'd5', label: 'Petugas membuang darah dan komponen darah yang rusak/kadaluwarsa ke IPAL melalui spoelhoek', key: 'd5', section: 'D. PROSES PEMBUANGAN DARAH DAN KOMPONEN DARAH' },
      { id: 'd6', label: 'Ada berita acara pembuangan sisa darah rusak dan kadaluwarsa', key: 'd6', section: 'D. PROSES PEMBUANGAN DARAH DAN KOMPONEN DARAH' },
      { id: 'd7', label: 'Sampel darah dibuang ke limbah infeksius bersama tabungnya', key: 'd7', section: 'D. PROSES PEMBUANGAN DARAH DAN KOMPONEN DARAH' },

      { id: 'e1', label: 'Tidak menekuk dan mematahkan benda tajam dan jarum', key: 'e1', section: 'E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM' },
      { id: 'e2', label: 'Tidak menutup kembali jarum suntik bekas pakai', key: 'e2', section: 'E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM' },
      { id: 'e3', label: 'Pemisahan limbah benda tajam dilakukan segera oleh penghasil limbah', key: 'e3', section: 'E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM' },
      { id: 'e4', label: 'Tidak memberikan benda tajam habis pakai ke orang lain', key: 'e4', section: 'E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM' },
      { id: 'e5', label: 'Jika harus memberikan benda tajam ke orang lain gunakan container', key: 'e5', section: 'E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM' },
      { id: 'e6', label: 'Limbah benda tajam dimasukkan ke safety box', key: 'e6', section: 'E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM' },
      { id: 'e7', label: 'Safety box sesuai standar, posisi aman dan tertutup', key: 'e7', section: 'E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM' },
      { id: 'e8', label: 'Safety box jika ¾ penuh (atau >48 jam) ditutup rapat dan dibuang', key: 'e8', section: 'E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM' },
      { id: 'e9', label: 'Ada bukti data limbah benda tajam yang diangkut', key: 'e9', section: 'E. PROSES PENGELOLAAN LIMBAH BENDA TAJAM' },

      { id: 'f1', label: 'Isi tempat sampah berkantong kuning hanya limbah infeksius', key: 'f1', section: 'F. PROSES PENGELOLAAN LIMBAH PADAT' },
      { id: 'f2', label: 'Isi tempat sampah berkantong hitam hanya limbah non infeksius', key: 'f2', section: 'F. PROSES PENGELOLAAN LIMBAH PADAT' },
      { id: 'f3', label: 'Bila sudah ¾ penuh, kantong plastik diikat dan diangkut petugas', key: 'f3', section: 'F. PROSES PENGELOLAAN LIMBAH PADAT' },
      { id: 'f4', label: 'Tidak dilakukan pengosongan sampah dari satu kantong ke kantong lainnya', key: 'f4', section: 'F. PROSES PENGELOLAAN LIMBAH PADAT' },
      { id: 'f5', label: 'Lakukan penggantian kresek tempat sampah setelah diangkut', key: 'f5', section: 'F. PROSES PENGELOLAAN LIMBAH PADAT' },
      { id: 'f6', label: 'Tidak ada penumpukan sampah di ruangan/area publik', key: 'f6', section: 'F. PROSES PENGELOLAAN LIMBAH PADAT' }
    ]
  },
  jenazah: {
    tableName: 'audit_monitoring_jenazah',
    items: [
      { id: 'item_1', label: 'Petugas menggunakan APD lengkap sesuai standar', key: 'item_1' },
      { id: 'item_2', label: 'Penanganan jenazah sesuai prinsip PPI', key: 'item_2' },
      { id: 'item_3', label: 'Tersedia spill kit untuk tumpahan cairan tubuh', key: 'item_3' },
      { id: 'item_4', label: 'Area pemulasaraan jenazah dibersihkan & didesinfeksi', key: 'item_4' }
    ]
  },
  monitoring_ambulance: {
    tableName: 'audit_ambulance',
    items: [
      { id: 'ambul_a', label: 'Tersedia spill kit', key: 'ambul_a' },
      { id: 'ambul_b', label: 'Ambulance bersih', key: 'ambul_b' },
      { id: 'ambul_c', label: 'Tidak ada sarang laba-laba', key: 'ambul_c' },
      { id: 'ambul_d', label: 'Kaca bersih', key: 'ambul_d' },
      { id: 'ambul_e', label: 'Tersedia APD', key: 'ambul_e' },
      { id: 'ambul_f', label: 'Tersedia handrub', key: 'ambul_f' },
      { id: 'ambul_g', label: 'Tempat sampah tertutup', key: 'ambul_g' }
    ]
  },
  monitoring_tunggu: {
    tableName: 'audit_ruang_tunggu',
    items: [
      { id: 'tungg_a1', label: 'Lantai bersih, kering', key: 'tungg_a1' },
      { id: 'tungg_a2', label: 'Kursi bersih', key: 'tungg_a2' },
      { id: 'tungg_a3', label: 'Meja bersih', key: 'tungg_a3' },
      { id: 'tungg_b1', label: 'Tersedia handrub', key: 'tungg_b1' },
      { id: 'tungg_c1', label: 'Ventilasi baik', key: 'tungg_c1' },
      { id: 'tungg_d1', label: 'Poster etika batuk', key: 'tungg_d1' }
    ]
  },
  monitoring_tps: {
    tableName: 'audit_tps',
    items: [
      { id: 'a1', label: 'TPS terpisah', key: 'a1' },
      { id: 'a2', label: 'Akses terbatas', key: 'a2' },
      { id: 'b1', label: 'Area TPS bersih', key: 'b1' },
      { id: 'c1', label: 'Sampah dipisah', key: 'c1' },
      { id: 'c2', label: 'Kantong kuning infeksius', key: 'c2' },
      { id: 'c3', label: 'Kantong hitam non-medis', key: 'c3' },
      { id: 'd1', label: 'Jadwal pengangkutan', key: 'd1' }
    ]
  },
  iadp: {
    tableName: 'audit_bundles_hais',
    extraFilter: { bundle_id: 'plabsi-maintenance' },
  },
  cauti: {
    tableName: 'audit_bundles_hais',
    extraFilter: { bundle_id: 'cauti-maintenance' },
  },
  ido_b: {
    tableName: 'audit_bundles_hais',
    extraFilter: { bundle_id: 'ido-post-operasi' },
  },
  vap_b: {
    tableName: 'audit_bundles_hais',
    extraFilter: { bundle_id: 'vap-maintenance' },
  },
  phl: {
    tableName: 'surveilans_phlebitis',
  },
  isk: {
    tableName: 'surveilans_isk',
  },
  vap: {
    tableName: 'surveilans_vap',
  },
  ido: {
    tableName: 'surveilans_ido',
  },
};

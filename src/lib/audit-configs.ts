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
      { id: 'item_1', label: 'Tersedia safety box sesuai standar WHO', key: 'item_1' },
      { id: 'item_2', label: 'Wadah limbah tajam diletakkan di tempat yang aman', key: 'item_2' },
      { id: 'item_3', label: 'Wadah limbah tajam tidak lebih dari 3/4 penuh', key: 'item_3' },
      { id: 'item_4', label: 'Tidak ada benda tajam yang keluar dari wadah', key: 'item_4' },
      { id: 'item_5', label: 'Limbah tajam langsung dibuang ke wadah limbah tajam', key: 'item_5' },
      { id: 'item_6', label: 'Tempat sampah khusus benda tajam tersedia pada troli tindakan', key: 'item_6' },
      { id: 'item_7', label: 'Pengelolaan jarum suntik kontak minimal dan apabila menutup menggunakan metode 1 tangan', key: 'item_7' },
      { id: 'item_8', label: 'Tersedia jalur pasca pajanan apabila terjadi tusukan benda tajam', key: 'item_8' }
    ]
  },
  penatalaksanaan_linen: {
    tableName: 'audit_penatalaksanaan_linen',
    items: [
      { id: '1', label: 'Linen bersih disimpan di lemari tertutup dengan jarak setidaknya dari lantai 30 cm, dinding 20 cm, langit-langit 60 cm, di area bersih terlindung dari kontaminasi', key: '1' },
      { id: '2', label: 'Tersedia troli/tempat linen kotor dalam kondisi baik dan tertutup', key: '2' },
      { id: '3', label: 'Tersedia kantung linen berwarna kuning untuk linen infeksius / tercemar / basah', key: '3' },
      { id: '4', label: 'Linen kotor dipisahkan sesuai dengan SPO', key: '4' },
      { id: '5', label: 'Petugas menggunakan APD saat menangani linen infeksius / tercemar / basah', key: '5' }
    ]
  },
  monitoring_airborne: {
    tableName: 'penempatan_pasien_airbone',
    items: [
      { id: 'ruang_terpisah', label: 'Ruangan terpisah (sendiri) / cohorting jarak > 1 meter', key: 'ruang_terpisah' },
      { id: 'ventilasi', label: 'Ventilasi memadai (sirkulasi udara 6–12 x / jam)', key: 'ventilasi' },
      { id: 'sinar_matahari', label: 'Sinar matahari masuk ke ruangan', key: 'sinar_matahari' },
      { id: 'jendela_terbuka', label: 'Jendela bisa dibuka ke area luar (terbuka)', key: 'jendela_terbuka' },
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
      { id: 'bersih_desinfektan', label: 'Setelah pasien pulang, bersihkan ruangan dengan cairan desinfektan sesuai standar', key: 'bersih_desinfektan' }
    ]
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
      { id: 'catatan_infeksi', label: 'Ada catatan pasien infeksi dan non infeksi', key: 'catatan_infeksi' },
      { id: 'instruksi_ruang', label: 'Instruksi jelas untuk petugas dan pengunjung di ruang infeksi (tanda)', key: 'instruksi_ruang' },
      { id: 'poster_pencegahan', label: 'Poster petunjuk pencegahan penularan penyakit (kontak, droplet, airborne)', key: 'poster_pencegahan' },
      { id: 'apd_tersedia', label: 'Alat proteksi diri tersedia lengkap saat memasuki ruang isolasi', key: 'apd_tersedia' },
      { id: 'catatan_klinis', label: 'Ada catatan kasus/bagan klinis di ruangan isolasi', key: 'catatan_klinis' },
      { id: 'instruksi_isolasi', label: 'Instruksi jelas untuk petugas dan pengunjung saat pasien di isolasi (contoh: tanda di pintu)', key: 'instruksi_isolasi' },
      { id: 'pintu_tertutup', label: 'Pintu selalu ditutup', key: 'pintu_tertutup' },
      { id: 'alur_pasien', label: 'Alur pasien masuk terpasang jelas', key: 'alur_pasien' }
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
      { id: "1", label: "Tersedia Handrub di koridor ruang perawatan", key: "1" },
      { id: "2", label: "Tersedia Handrub di tempat tidur pasien", key: "2" },
      { id: "3", label: "Tersedia Handrub di setiap troli tindakan", key: "3" },
      { id: "4", label: "Tersedia wastafel di setiap ruangan dengan kondisi baik", key: "4" },
      { id: "5", label: "Tersedia sabun antiseptik di setiap ruangan", key: "5" },
      { id: "6", label: "Tersedia tempat sampah non medis untuk tissue", key: "6" },
      { id: "7", label: "Tersedia tissue di setiap ruangan", key: "7" },
      { id: "8", label: "Tersedia poster handrub dan hand hygiene", key: "8" },
      { id: "9", label: "Wastafel dalam kondisi bersih", key: "9" },
    ]
  },
  monitoring_fasilitas_apd: {
    tableName: 'monitoring_fasilitas_apd',
    items: [
      { id: '1', label: 'Tersedia masker di ruangan', key: '1' },
      { id: '2', label: 'Tersedia sarung tangan on steril', key: '2' },
      { id: '3', label: 'Tersedia sarung tangan steril di ruangan sesuai kebutuhan', key: '3' },
      { id: '4', label: 'Tersedia penutup kepala di ruangan', key: '4' },
      { id: '5', label: 'Tersedia gaun di ruang perawatan, intensif, ruang tindakan sesuai kebutuhan', key: '5' },
      { id: '6', label: 'Tersedia apron di ruang perawatan, intensif, ruang tindakan sesuai kebutuhan', key: '6' },
      { id: '7', label: 'Tersedia kaca mata pelindung / goggle di ruangan sesuai kebutuhan', key: '7' },
      { id: '8', label: 'Tersedia pelindung kaki di ruang perawatan, intensif, ruang tindakan sesuai kebutuhan', key: '8' },
      { id: '9', label: 'Penyimpanan APD dilakukan dengan cara yang benar', key: '9' }
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
      // A. PERSONAL
      { id: 'a_hygiene', label: 'Personal hygiene baik', key: 'a_hygiene', section: 'A: PERSONAL' },
      { id: 'a_pakaian', label: 'Menggunakan pakaian khusus OK', key: 'a_pakaian', section: 'A: PERSONAL' },
      { id: 'a_apd', label: 'Menggunakan APD yang sesuai', key: 'a_apd', section: 'A: PERSONAL' },
      { id: 'a_sepatu', label: 'Menggunakan sepatu tertutup yang hanya digunakan di OK', key: 'a_sepatu', section: 'A: PERSONAL' },
      { id: 'a_perhiasan', label: 'Tidak menggunakan perhiasan/aksesoris tangan', key: 'a_perhiasan', section: 'A: PERSONAL' },
      { id: 'a_kuku', label: 'Kuku pendek, bersih, dan tidak berwarna', key: 'a_kuku', section: 'A: PERSONAL' },
      { id: 'a_cucitangan', label: 'Cuci tangan bedah dengan benar sebelum prosedur', key: 'a_cucitangan', section: 'A: PERSONAL' },
      { id: 'a_kesehatan', label: 'Pemeriksaan kesehatan berkala', key: 'a_kesehatan', section: 'A: PERSONAL' },
      { id: 'a_imunisasi', label: 'Imunisasi penyakit menular', key: 'a_imunisasi', section: 'A: PERSONAL' },
      { id: 'a_apdsesuai', label: 'Penggunaan APD sesuai', key: 'a_apdsesuai', section: 'A: PERSONAL' },
      
      // B. KONDISI RUANGAN
      { id: 'b_pintu', label: 'Pintu selalu tertutup', key: 'b_pintu', section: 'B: KONDISI RUANGAN' },
      { id: 'b_suhu', label: 'Pertahankan tekanan positif, suhu, dan kelembaban dalam rentang dipersyaratkan', key: 'b_suhu', section: 'B: KONDISI RUANGAN' },
      { id: 'b_jumlah', label: 'Pembatasan jumlah orang dalam kamar bedah', key: 'b_jumlah', section: 'B: KONDISI RUANGAN' },
      { id: 'b_akses', label: 'Pembatasan akses masuk kamar bedah', key: 'b_akses', section: 'B: KONDISI RUANGAN' },
      { id: 'b_cssd', label: 'Ada akses CSSD', key: 'b_cssd', section: 'B: KONDISI RUANGAN' },
      
      // C. PEMBUANGAN LIMBAH
      { id: 'c_wadah', label: 'Tersedia wadah limbah infeksius, non infeksius, dan benda tajam', key: 'c_wadah', section: 'C: PEMBUANGAN LIMBAH' },
      { id: 'c_label', label: 'Ada label di setiap tempat sampah', key: 'c_label', section: 'C: PEMBUANGAN LIMBAH' },
      { id: 'c_plastik', label: 'Tempat sampah infeksius dan non infeksius menggunakan plastik', key: 'c_plastik', section: 'C: PEMBUANGAN LIMBAH' },
      { id: 'c_tajam', label: 'Tempat limbah benda tajam menggunakan container tahan air & tahan tusuk', key: 'c_tajam', section: 'C: PEMBUANGAN LIMBAH' },
      { id: 'c_dibuang', label: 'Limbah dibuang setelah 3/4 penuh atau 48 jam', key: 'c_dibuang', section: 'C: PEMBUANGAN LIMBAH' },
      { id: 'c_tertutup', label: 'Tempat sampah bersih dan tertutup', key: 'c_tertutup', section: 'C: PEMBUANGAN LIMBAH' },
      { id: 'c_pedal', label: 'Pedal injak tempat sampah berfungsi baik', key: 'c_pedal', section: 'C: PEMBUANGAN LIMBAH' },
      { id: 'c_organ', label: 'Limbah organ dibuang dalam kantong plastik kuning', key: 'c_organ', section: 'C: PEMBUANGAN LIMBAH' },
      { id: 'c_spillkit', label: 'Tersedia spillkit untuk tumpahan cairan tubuh', key: 'c_spillkit', section: 'C: PEMBUANGAN LIMBAH' },
      
      // D. FASILITAS KEBERSIHAN TANGAN
      { id: 'd_handrub', label: 'Tersedia botol handrub dan diberi tanggal pemakaian', key: 'd_handrub', section: 'D: FASILITAS KEBERSIHAN TANGAN' },
      { id: 'd_wastafel', label: 'Tersedia wastafel cuci tangan', key: 'd_wastafel', section: 'D: FASILITAS KEBERSIHAN TANGAN' },
      { id: 'd_keran', label: 'Keran air berfungsi baik', key: 'd_keran', section: 'D: FASILITAS KEBERSIHAN TANGAN' },
      { id: 'd_sabun', label: 'Tersedia sabun cair di wastafel', key: 'd_sabun', section: 'D: FASILITAS KEBERSIHAN TANGAN' },
      { id: 'd_tissue', label: 'Tersedia tissue towel di wastafel', key: 'd_tissue', section: 'D: FASILITAS KEBERSIHAN TANGAN' },
      { id: 'd_pembuangan', label: 'Tersedia fasilitas pembuangan sampah di dekat wastafel', key: 'd_pembuangan', section: 'D: FASILITAS KEBERSIHAN TANGAN' },
      { id: 'd_poster', label: 'Tersedia poster 6 langkah cuci tangan dan 5 momen cuci tangan', key: 'd_poster', section: 'D: FASILITAS KEBERSIHAN TANGAN' },
      
      // E. PEMBERSIHAN LINGKUNGAN
      { id: 'e_desinfektan', label: 'Pembersihan antar pasien dengan larutan desinfektan', key: 'e_desinfektan', section: 'E: PEMBERSIHAN LINGKUNGAN' },
      { id: 'e_jadwal', label: 'Ada jadwal pembersihan harian dan mingguan', key: 'e_jadwal', section: 'E: PEMBERSIHAN LINGKUNGAN' },
      { id: 'e_alat', label: 'Pembersihan semua alat dalam kamar bedah', key: 'e_alat', section: 'E: PEMBERSIHAN LINGKUNGAN' },
      { id: 'e_barang', label: 'Hanya barang yang digunakan berada di kamar bedah', key: 'e_barang', section: 'E: PEMBERSIHAN LINGKUNGAN' },
      { id: 'e_debu', label: 'Secara visual bebas debu', key: 'e_debu', section: 'E: PEMBERSIHAN LINGKUNGAN' },
      { id: 'e_sejajar', label: 'Alat dan BHP tidak sejajar lantai', key: 'e_sejajar', section: 'E: PEMBERSIHAN LINGKUNGAN' },
      { id: 'e_grill', label: 'Grill ventilasi tidak tersumbat dan tidak berdebu', key: 'e_grill', section: 'E: PEMBERSIHAN LINGKUNGAN' },
      { id: 'e_rotasi', label: 'Penyimpanan alat habis pakai dirotasi agar tidak menumpuk debu', key: 'e_rotasi', section: 'E: PEMBERSIHAN LINGKUNGAN' },
      { id: 'e_bangunan', label: 'Bangunan kamar bedah kondisi baik (lantai, dinding, plafon, cat)', key: 'e_bangunan', section: 'E: PEMBERSIHAN LINGKUNGAN' },
      { id: 'e_udara', label: 'Pemeriksaan kualitas udara jika ada perbaikan mayor', key: 'e_udara', section: 'E: PEMBERSIHAN LINGKUNGAN' },
      { id: 'e_terpisah', label: 'Penyimpanan alat steril terpisah dari alat bersih', key: 'e_terpisah', section: 'E: PEMBERSIHAN LINGKUNGAN' },
      { id: 'e_berlaku', label: 'Alat dan bahan steril masih berlaku', key: 'e_berlaku', section: 'E: PEMBERSIHAN LINGKUNGAN' },
      { id: 'e_disimpan', label: 'Alat medis disimpan di tempat bersih dan kering', key: 'e_disimpan', section: 'E: PEMBERSIHAN LINGKUNGAN' },
      
      // F. SUHU DAN KELEMBABAN
      { id: 'f_kelembaban', label: 'Kelembaban Ruang Operasi 30–60%', key: 'f_kelembaban', section: 'F: SUHU DAN KELEMBABAN' },
      { id: 'f_suhu', label: 'Suhu Ruangan 20ºC – 23ºC', key: 'f_suhu', section: 'F: SUHU DAN KELEMBABAN' },
      
      // G. VENTILASI
      { id: 'g_pertukaran', label: 'Pertukaran udara kamar operasi minimal 15x/jam', key: 'g_pertukaran', section: 'G: VENTILASI' },
      { id: 'g_tekanan', label: 'Kamar Operasi bertekanan positif', key: 'g_tekanan', section: 'G: VENTILASI' },
      { id: 'g_pintu', label: 'Pintu kamar operasi selalu tertutup', key: 'g_pintu', section: 'G: VENTILASI' }
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
    tableName: 'audit_radiologi_monitoring',
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
      { id: 'kl_1', label: 'Lantai bersih, kering, dan tidak licin', key: 'kl_1', section: 'A. Kebersihan Lingkungan' },
      { id: 'kl_2', label: 'Kursi ruang tunggu bersih dan tertata rapi', key: 'kl_2', section: 'A. Kebersihan Lingkungan' },
      { id: 'kl_3', label: 'Meja / counter tampak bersih', key: 'kl_3', section: 'A. Kebersihan Lingkungan' },
      { id: 'kl_4', label: 'Tidak ada debu pada permukaan furnitur', key: 'kl_4', section: 'A. Kebersihan Lingkungan' },
      { id: 'kl_5', label: 'Dinding dan plafon bersih, tidak berjamur', key: 'kl_5', section: 'A. Kebersihan Lingkungan' },
      { id: 'kl_6', label: 'Kaca / jendela bersih', key: 'kl_6', section: 'A. Kebersihan Lingkungan' },
      { id: 'kl_7', label: 'Tempat sampah tersedia dan tertutup', key: 'kl_7', section: 'A. Kebersihan Lingkungan' },
      { id: 'kl_8', label: 'Tempat sampah tidak melebihi 3/4 penuh', key: 'kl_8', section: 'A. Kebersihan Lingkungan' },
      { id: 'fkt_1', label: 'Tersedia handrub di area ruang tunggu', key: 'fkt_1', section: 'B. Fasilitas Kebersihan Tangan' },
      { id: 'fkt_2', label: 'Handrub dalam kondisi terisi dan berfungsi baik', key: 'fkt_2', section: 'B. Fasilitas Kebersihan Tangan' },
      { id: 'fkt_3', label: 'Tersedia wastafel cuci tangan (jika ada)', key: 'fkt_3', section: 'B. Fasilitas Kebersihan Tangan' },
      { id: 'fkt_4', label: 'Sabun cuci tangan tersedia', key: 'fkt_4', section: 'B. Fasilitas Kebersihan Tangan' },
      { id: 'fkt_5', label: 'Tissue / hand dryer tersedia', key: 'fkt_5', section: 'B. Fasilitas Kebersihan Tangan' },
      { id: 'fkt_6', label: 'Poster 6 langkah cuci tangan tersedia', key: 'fkt_6', section: 'B. Fasilitas Kebersihan Tangan' },
      { id: 'fkt_7', label: 'Poster 5 momen hand hygiene tersedia (jika area klinis berdekatan)', key: 'fkt_7', section: 'B. Fasilitas Kebersihan Tangan' },
      { id: 'vk_1', label: 'Ventilasi ruangan baik', key: 'vk_1', section: 'C. Ventilasi dan Kenyamanan' },
      { id: 'vk_2', label: 'AC / kipas dalam kondisi bersih', key: 'vk_2', section: 'C. Ventilasi dan Kenyamanan' },
      { id: 'vk_3', label: 'Sirkulasi udara baik', key: 'vk_3', section: 'C. Ventilasi dan Kenyamanan' },
      { id: 'vk_4', label: 'Ruangan tidak berbau tidak sedap', key: 'vk_4', section: 'C. Ventilasi dan Kenyamanan' },
      { id: 'vk_5', label: 'Pencahayaan cukup', key: 'vk_5', section: 'C. Ventilasi dan Kenyamanan' },
      { id: 'eeb_1', label: 'Poster etika batuk tersedia', key: 'eeb_1', section: 'D. Edukasi dan Etika Batuk' },
      { id: 'eeb_2', label: 'Poster penggunaan masker tersedia', key: 'eeb_2', section: 'D. Edukasi dan Etika Batuk' },
      { id: 'eeb_3', label: 'Tersedia masker cadangan bagi pengunjung bergejala', key: 'eeb_3', section: 'D. Edukasi dan Etika Batuk' },
      { id: 'eeb_4', label: 'Pengunjung berbatuk diarahkan memakai masker', key: 'eeb_4', section: 'D. Edukasi dan Etika Batuk' },
      { id: 'eeb_5', label: 'Tersedia tissue untuk etika batuk', key: 'eeb_5', section: 'D. Edukasi dan Etika Batuk' },
      { id: 'pk_1', label: 'Kursi memiliki jarak memadai antar pengunjung', key: 'pk_1', section: 'E. Pengendalian Kepadatan' },
      { id: 'pk_2', label: 'Tidak terjadi penumpukan berlebihan', key: 'pk_2', section: 'E. Pengendalian Kepadatan' },
      { id: 'pk_3', label: 'Jalur antrean tertata', key: 'pk_3', section: 'E. Pengendalian Kepadatan' },
      { id: 'pk_4', label: 'Area prioritas lansia/disabilitas tersedia', key: 'pk_4', section: 'E. Pengendalian Kepadatan' },
      { id: 'kp_1', label: 'Petugas memakai identitas kerja', key: 'kp_1', section: 'F. Kepatuhan Petugas Area Ruang Tunggu' },
      { id: 'kp_2', label: 'Petugas menjaga kebersihan tangan', key: 'kp_2', section: 'F. Kepatuhan Petugas Area Ruang Tunggu' },
      { id: 'kp_3', label: 'Petugas memakai masker bila diperlukan', key: 'kp_3', section: 'F. Kepatuhan Petugas Area Ruang Tunggu' },
      { id: 'kp_4', label: 'Petugas memberikan edukasi bila ada pasien bergejala infeksi', key: 'kp_4', section: 'F. Kepatuhan Petugas Area Ruang Tunggu' }
    ]
  },
  monitoring_tps: {
    tableName: 'audit_tps',
    items: [
      { id: 'tb_1', label: 'Lokasi TPS terpisah dari area pelayanan pasien', key: 'tb_1', section: 'A. Area TPS dan Bangunan' },
      { id: 'tb_2', label: 'TPS memiliki akses terbatas / terkunci', key: 'tb_2', section: 'A. Area TPS dan Bangunan' },
      { id: 'tb_3', label: 'Bangunan TPS tertutup dan aman', key: 'tb_3', section: 'A. Area TPS dan Bangunan' },
      { id: 'tb_4', label: 'Lantai kuat, rata, kedap air, dan mudah dibersihkan', key: 'tb_4', section: 'A. Area TPS dan Bangunan' },
      { id: 'tb_5', label: 'Lantai tidak licin', key: 'tb_5', section: 'A. Area TPS dan Bangunan' },
      { id: 'tb_6', label: 'Dinding dalam kondisi baik dan bersih', key: 'tb_6', section: 'A. Area TPS dan Bangunan' },
      { id: 'tb_7', label: 'Atap tidak bocor', key: 'tb_7', section: 'A. Area TPS dan Bangunan' },
      { id: 'tb_8', label: 'Pencahayaan cukup', key: 'tb_8', section: 'A. Area TPS dan Bangunan' },
      { id: 'tb_9', label: 'Ventilasi memadai', key: 'tb_9', section: 'A. Area TPS dan Bangunan' },
      { id: 'tb_10', label: 'Tersedia drainase / saluran pembuangan baik', key: 'tb_10', section: 'A. Area TPS dan Bangunan' },
      { id: 'kl_1', label: 'Area TPS bersih dan rapi', key: 'kl_1', section: 'B. Kebersihan Lingkungan' },
      { id: 'kl_2', label: 'Tidak ada tumpahan sampah di lantai', key: 'kl_2', section: 'B. Kebersihan Lingkungan' },
      { id: 'kl_3', label: 'Tidak ada bau menyengat berlebihan', key: 'kl_3', section: 'B. Kebersihan Lingkungan' },
      { id: 'kl_4', label: 'Tidak ada genangan air', key: 'kl_4', section: 'B. Kebersihan Lingkungan' },
      { id: 'kl_5', label: 'Tidak ada debu berlebihan', key: 'kl_5', section: 'B. Kebersihan Lingkungan' },
      { id: 'kl_6', label: 'Tidak ditemukan vektor (lalat/tikus/kucing liar)', key: 'kl_6', section: 'B. Kebersihan Lingkungan' },
      { id: 'kl_7', label: 'Jadwal pembersihan rutin tersedia', key: 'kl_7', section: 'B. Kebersihan Lingkungan' },
      { id: 'kl_8', label: 'Disinfeksi area dilakukan berkala', key: 'kl_8', section: 'B. Kebersihan Lingkungan' },
      { id: 'ps_1', label: 'Sampah medis dan non medis dipisahkan', key: 'ps_1', section: 'C. Pemilahan dan Penyimpanan Sampah' },
      { id: 'ps_2', label: 'Sampah infeksius menggunakan kantong kuning', key: 'ps_2', section: 'C. Pemilahan dan Penyimpanan Sampah' },
      { id: 'ps_3', label: 'Sampah non medis menggunakan kantong hitam', key: 'ps_3', section: 'C. Pemilahan dan Penyimpanan Sampah' },
      { id: 'ps_4', label: 'Limbah tajam menggunakan safety box/container khusus', key: 'ps_4', section: 'C. Pemilahan dan Penyimpanan Sampah' },
      { id: 'ps_5', label: 'Safety box tidak lebih dari 3/4 penuh', key: 'ps_5', section: 'C. Pemilahan dan Penyimpanan Sampah' },
      { id: 'ps_6', label: 'Sampah diberi label sesuai jenis', key: 'ps_6', section: 'C. Pemilahan dan Penyimpanan Sampah' },
      { id: 'ps_7', label: 'Wadah sampah tertutup', key: 'ps_7', section: 'C. Pemilahan dan Penyimpanan Sampah' },
      { id: 'ps_8', label: 'Wadah sampah dalam kondisi baik', key: 'ps_8', section: 'C. Pemilahan dan Penyimpanan Sampah' },
      { id: 'ps_9', label: 'Tidak ada pencampuran limbah', key: 'ps_9', section: 'C. Pemilahan dan Penyimpanan Sampah' },
      { id: 'psd_1', label: 'Jadwal pengangkutan sampah tersedia', key: 'psd_1', section: 'D. Pengangkutan Sampah' },
      { id: 'psd_2', label: 'Sampah diangkut rutin sesuai jadwal', key: 'psd_2', section: 'D. Pengangkutan Sampah' },
      { id: 'psd_3', label: 'Troli/alat angkut khusus tersedia', key: 'psd_3', section: 'D. Pengangkutan Sampah' },
      { id: 'psd_4', label: 'Troli dalam kondisi bersih', key: 'psd_4', section: 'D. Pengangkutan Sampah' },
      { id: 'psd_5', label: 'Jalur pengangkutan aman dan tidak melewati area bersih', key: 'psd_5', section: 'D. Pengangkutan Sampah' },
      { id: 'psd_6', label: 'Petugas mengikat kantong sebelum diangkut', key: 'psd_6', section: 'D. Pengangkutan Sampah' },
      { id: 'pa_1', label: 'Petugas menggunakan sarung tangan', key: 'pa_1', section: 'E. Petugas dan APD' },
      { id: 'pa_2', label: 'Petugas menggunakan masker', key: 'pa_2', section: 'E. Petugas dan APD' },
      { id: 'pa_3', label: 'Petugas menggunakan sepatu boot', key: 'pa_3', section: 'E. Petugas dan APD' },
      { id: 'pa_4', label: 'Petugas menggunakan apron / pelindung', key: 'pa_4', section: 'E. Petugas dan APD' },
      { id: 'pa_5', label: 'Petugas melakukan hand hygiene setelah bekerja', key: 'pa_5', section: 'E. Petugas dan APD' },
      { id: 'pa_6', label: 'Petugas mengetahui SOP pengelolaan limbah', key: 'pa_6', section: 'E. Petugas dan APD' },
      { id: 'pa_7', label: 'Petugas mengetahui penanganan tumpahan limbah', key: 'pa_7', section: 'E. Petugas dan APD' },
      { id: 'sp_1', label: 'Tersedia handrub / fasilitas cuci tangan', key: 'sp_1', section: 'F. Sarana Pendukung' },
      { id: 'sp_2', label: 'Tersedia sabun antiseptik', key: 'sp_2', section: 'F. Sarana Pendukung' },
      { id: 'sp_3', label: 'Tersedia tissue / pengering tangan', key: 'sp_3', section: 'F. Sarana Pendukung' },
      { id: 'sp_4', label: 'Tersedia spill kit limbah', key: 'sp_4', section: 'F. Sarana Pendukung' },
      { id: 'sp_5', label: 'Tersedia APAR bila diperlukan', key: 'sp_5', section: 'F. Sarana Pendukung' },
      { id: 'sp_6', label: 'Tersedia papan peringatan biohazard', key: 'sp_6', section: 'F. Sarana Pendukung' }
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

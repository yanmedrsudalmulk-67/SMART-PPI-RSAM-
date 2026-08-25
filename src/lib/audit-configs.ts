export const genericAuditConfigs: Record<string, { tableName: string; extraFilter?: Record<string, string>; items?: { id: string; label: string; key: string; section?: string; isNegative?: boolean }[] }> = {
  audit_hand_hygiene: {
    tableName: 'audit_hand_hygiene',
    items: [
      { id: 'm1', label: 'Momen 1: Sebelum kontak dengan pasien', key: 'm1', section: '5 Momen Kebersihan Tangan' },
      { id: 'm2', label: 'Momen 2: Sebelum melakukan tindakan aseptik', key: 'm2', section: '5 Momen Kebersihan Tangan' },
      { id: 'm3', label: 'Momen 3: Sesudah menyentuh cairan tubuh pasien', key: 'm3', section: '5 Momen Kebersihan Tangan' },
      { id: 'm4', label: 'Momen 4: Sesudah kontak dengan pasien', key: 'm4', section: '5 Momen Kebersihan Tangan' },
      { id: 'm5', label: 'Momen 5: Sesudah menyentuh lingkungan pasien', key: 'm5', section: '5 Momen Kebersihan Tangan' }
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
      { id: 'peralatan_tersedia', label: 'Peralatan tersedia dan tersusun baik di meja dan lemari', key: 'peralatan_tersedia' },
      { id: 'peralatan_berkarat', label: 'Adakah peralatan sarana dan prasarana kesehatan yang berkarat', key: 'peralatan_berkarat', isNegative: true },
      { id: 'sterilisasi_tersentral', label: 'Sterilisasi tersentral', key: 'sterilisasi_tersentral' },
      { id: 'alat_reused', label: 'Alat used reused sesuai aturan', key: 'alat_reused' },
      { id: 'metode_dekontaminasi', label: 'Petugas dapat menjelaskan metoda dekontaminasi peralatan yang biasa digunakan pasien', key: 'metode_dekontaminasi' },
      { id: 'dekontaminasi_lokal', label: 'Dekontaminasi lokal dari instrumen bedah tidak dilakukan di area klinis', key: 'dekontaminasi_lokal' },
      { id: 'expired_date', label: 'Tanggal kadaluarsa peralatan steril belum terlewati', key: 'expired_date' },
      { id: 'instrumen_bekas', label: 'Tidak terlihat debu / darah tertinggal di instrumen bekas pakai', key: 'instrumen_bekas' }
    ]
  },
  pengendalian_lingkungan: {
    tableName: 'audit_pengendalian_lingkungan',
    items: [
      { id: 'item_1', label: 'Kursi/meja/dan loker tampak bersih dan dalam kondisi baik', key: 'item_1' },
      { id: 'item_2', label: 'Troli tindakan tampak bersih', key: 'item_2' },
      { id: 'item_3', label: 'Troli tindakan dibersihkan dan didesinfeksi setiap hari', key: 'item_3' },
      { id: 'item_4', label: 'Lantai bersih dan dalam kondisi baik', key: 'item_4' },
      { id: 'item_5', label: 'Ditemukan debu di permukaan kerja', key: 'item_5', isNegative: true },
      { id: 'item_6', label: 'Tirai pemisah dan tirai jendela bersih dalam kondisi baik', key: 'item_6' },
      { id: 'item_7', label: 'Kipas angin dan AC bersih', key: 'item_7' },
      { id: 'item_8', label: 'Dinding dan langit-langit bebas jamur', key: 'item_8' },
      { id: 'item_9', label: 'Ventilasi/jendela bersih', key: 'item_9' },
      { id: 'item_10', label: 'Area tunggu/publik bersih', key: 'item_10' },
      { id: 'item_11', label: 'Terdapat tanaman hidup di dalam ruang rawat inap', key: 'item_11', isNegative: true },
      { id: 'item_12', label: 'Area WC/toilet bebas dari benda-benda yang tidak seharusnya ada', key: 'item_12' },
      { id: 'item_13', label: 'Perlengkapan WC/toilet dalam kondisi baik dan tidak bau', key: 'item_13' },
      { id: 'item_14', label: 'Tersedia fasilitas pembuangan sampah', key: 'item_14' },
      { id: 'item_15', label: 'Dinding dan langit-langit WC/toilet bebas jamur', key: 'item_15' }
    ]
  },
  pengelolaan_limbah_medis: {
    tableName: 'audit_pengelolaan_limbah_medis',
    items: [
      { id: 'item_1', label: 'Tersedia fasilitas pembuangan sampah', key: 'item_1' },
      { id: 'item_2', label: 'Tempat sampah menggunakan pedal kaki', key: 'item_2' },
      { id: 'item_3', label: 'Tempat sampah diberi label sesuai peruntukannya: infeksius dan non infeksius', key: 'item_3' },
      { id: 'item_4', label: 'Tersedia kantung plastik kuning untuk limbah medis/infeksius', key: 'item_4' },
      { id: 'item_5', label: 'Jumlah tempat sampah memadai dan dalam kondisi baik', key: 'item_5' },
      { id: 'item_6', label: 'Sampah yang akan dibuang diikat dengan baik', key: 'item_6' },
      { id: 'item_7', label: 'Sampah tidak lebih dari 3/4 penuh', key: 'item_7' },
      { id: 'item_8', label: 'Sampah disimpan/ditempatkan di area yang disediakan sebelum dibawa ke pembuangan/TPS', key: 'item_8' },
      { id: 'item_9', label: 'Petugas mengetahui cara penanganan tumpahan cairan infeksius', key: 'item_9' },
      { id: 'item_10', label: 'Spill kit tersedia dan petugas mengetahui lokasi penyimpanannya', key: 'item_10' }
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
      { id: 'c1', label: 'Linen bersih disimpan di lemari tertutup dengan jarak setidaknya dari lantai 30 cm, dinding 20 cm, langit-langit 60 cm, di area bersih terlindung dari kontaminasi', key: 'c1' },
      { id: 'c2', label: 'Tersedia troli/tempat linen kotor dalam kondisi baik dan tertutup', key: 'c2' },
      { id: 'c3', label: 'Tersedia kantung linen berwarna kuning untuk linen infeksius / tercemar / basah', key: 'c3' },
      { id: 'c4', label: 'Linen kotor dipisahkan sesuai dengan SPO', key: 'c4' },
      { id: 'c5', label: 'Petugas menggunakan APD saat menangani linen infeksius / tercemar / basah', key: 'c5' }
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
    tableName: 'audit_ruang_isolasi',
    items: [
      { id: 'iso_1', label: 'Tekanan Negatif', key: 'iso_1' },
      { id: 'iso_2', label: 'Pertukaran udara > 12 kali/jam', key: 'iso_2' },
      { id: 'iso_3', label: 'Suhu ruangan 22°C – 25°C', key: 'iso_3' },
      { id: 'iso_4', label: 'Kelembaban 40–60%', key: 'iso_4' },
      { id: 'iso_5', label: 'Kondisi pintu selalu tertutup', key: 'iso_5' },
      { id: 'hh_1', label: 'Tersedia wastafel', key: 'hh_1' },
      { id: 'hh_2', label: 'Tersedia sabun cuci tangan', key: 'hh_2' },
      { id: 'hh_3', label: 'Tersedia tissue', key: 'hh_3' },
      { id: 'hh_4', label: 'Tersedia handrub', key: 'hh_4' },
      { id: 'apd_1', label: 'Tersedia sarung tangan', key: 'apd_1' },
      { id: 'apd_2', label: 'Tersedia masker bedah', key: 'apd_2' },
      { id: 'apd_3', label: 'Tersedia masker N-95', key: 'apd_3' },
      { id: 'apd_4', label: 'Tersedia kaca mata pelindung', key: 'apd_4' },
      { id: 'apd_5', label: 'Tersedia apron', key: 'apd_5' },
      { id: 'apd_6', label: 'Tersedia sepatu boot', key: 'apd_6' },
      { id: 'apd_7', label: 'Tersedia penutup kepala', key: 'apd_7' },
      { id: 'pet_1', label: 'Melakukan kebersihan tangan 5 momen', key: 'pet_1' },
      { id: 'pet_2', label: 'Menggunakan APD saat melakukan tindakan di ruang isolasi', key: 'pet_2' },
      { id: 'pet_3', label: 'Membuang limbah sesuai standar', key: 'pet_3' },
      { id: 'pet_4', label: 'Menempatkan linen kotor pada tempatnya', key: 'pet_4' },
      { id: 'pet_5', label: 'Memberikan edukasi pada pasien dan keluarga pasien', key: 'pet_5' },
    ]
  },
  ppi_ruang_isolasi: {
    tableName: 'ppi_ruang_isolasi',
    items: [
      { id: 'ppi_1', label: 'Penggunaan APD yang sesuai', key: 'ppi_1' },
      { id: 'ppi_2', label: 'Ketersediaan APD yang sesuai', key: 'ppi_2' },
      { id: 'ppi_3', label: 'Kelengkapan Fasilitas Hand Hygiene', key: 'ppi_3' },
      { id: 'ppi_4', label: 'Edukasi Etika Batuk / Pembuangan Sputum', key: 'ppi_4' },
      { id: 'ppi_5', label: 'Edukasi Hand Hygiene', key: 'ppi_5' }
    ]
  },
  monitoring_immuno: {
    tableName: 'penempatan_pasien_immunocompromised',
    items: [
      { id: 'im_1', label: 'Ruangan terpisah (sendiri) / cohorting jarak > 1 meter', key: 'im_1' },
      { id: 'im_2', label: 'Pintu ruangan selalu tertutup', key: 'im_2' },
      { id: 'im_3', label: 'Transport pasien bila diperlukan saja', key: 'im_3' },
      { id: 'im_4', label: 'Pasien memakai masker saat keluar ruangan', key: 'im_4' },
      { id: 'im_5', label: 'Tersedia fasilitas cuci tangan', key: 'im_5' },
      { id: 'im_6', label: 'Petugas melakukan cuci tangan sesuai 5 momen', key: 'im_6' },
      { id: 'im_7', label: 'Menggunakan masker saat kontak dengan pasien', key: 'im_7' },
      { id: 'im_8', label: 'Memakai sarung tangan bila akan kontak dengan cairan tubuh', key: 'im_8' },
      { id: 'im_9', label: 'Memakai kacamata goggle bila perlu', key: 'im_9' },
      { id: 'im_10', label: 'Memakai gaun pelindung bila perlu', key: 'im_10' },
      { id: 'im_11', label: 'Memberikan edukasi kepada pasien', key: 'im_11' },
      { id: 'im_12', label: 'Memberikan edukasi kepada keluarga pasien', key: 'im_12' },
      { id: 'im_13', label: 'Setelah pasien pulang, bersihkan ruangan dengan cairan desinfektan sesuai standar', key: 'im_13' }
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
      { id: 'apd', label: 'APD sesuai indikasi', key: 'apd' },
      { id: 'disposable', label: 'Spuit sekali pakai (disposable) dan steril', key: 'disposable' },
      { id: 'no_reuse', label: 'Spuit tidak digunakan berulang', key: 'no_reuse' },
      { id: 'no_touch_sterile', label: 'Tidak menyentuh bagian steril jarum', key: 'no_touch_sterile' },
      { id: 'area_disinfection', label: 'Desinfeksi area penyuntikan', key: 'area_disinfection' },
      { id: 'antiseptic_standard', label: 'Menggunakan antiseptik sesuai standar', key: 'antiseptic_standard' },
      { id: 'no_recapping', label: 'Tidak menutup kembali jarum (no recapping)', key: 'no_recapping' },
      { id: 'safety_box', label: 'Jarum langsung dibuang ke safety box', key: 'safety_box' },
      { id: 'no_bending', label: 'Tidak membengkokkan atau mematahkan jarum', key: 'no_bending' }
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
      { id: 'item_1', label: 'Imunisasi diberikan kepada seluruh petugas kesehatan, minimal vaksinasi Hepatitis B dan Covid-19', key: 'item_1' },
      { id: 'item_2', label: 'Pemeriksaan kesehatan minimal 1x/tahun', key: 'item_2' }
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
  fasilitas_apd: {
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
  fasilitas_hh: {
    tableName: 'monitoring_fasilitas_hand_hygiene',
    items: [
      { id: "1", label: "Tersedia handrub di setiap ruangan", key: "1" },
      { id: "2", label: "Tersedia handrub di setiap pintu masuk ruangan", key: "2" },
      { id: "3", label: "Tersedia Handrub di setiap troli tindakan", key: "3" },
      { id: "4", label: "Tersedia wastafel di setiap ruangan dengan kondisi baik", key: "4" },
      { id: "5", label: "Tersedia sabun antiseptik di setiap ruangan", key: "5" },
      { id: "6", label: "Tersedia tempat sampah non medis untuk tissue", key: "6" },
      { id: "7", label: "Tersedia tissue di setiap ruangan", key: "7" },
      { id: "8", label: "Tersedia poster handrub dan hand hygiene", key: "8" },
      { id: "9", label: "Wastafel dalam kondisi bersih", key: "9" },
    ]
  },
  monitoring_farmasi: {
    tableName: 'audit_farmasi',
    items: [
      // A. LINGKUNGAN UMUM
      { id: 'lu_1', label: 'Fasilitas yang memadai, kebersihan tangan tersedia dan memadai', key: 'lu_1', section: 'A. LINGKUNGAN UMUM' },
      { id: 'lu_2', label: 'Kipas angin / AC bersih dan bebas dari debu', key: 'lu_2', section: 'A. LINGKUNGAN UMUM' },
      { id: 'lu_3', label: 'Langit - langit / papan langit – langit bebas dari noda', key: 'lu_3', section: 'A. LINGKUNGAN UMUM' },
      { id: 'lu_4', label: 'Mebelair bersih dan terbebas dari debu', key: 'lu_4', section: 'A. LINGKUNGAN UMUM' },
      // B. RUANGAN BERSIH
      { id: 'rb_1', label: 'Sebelum dan sesudah bekerja, permukaan harus di bersihkan dengan bahan sesuai dengan pedoman PPI di Rumah Sakit Al-Mulk', key: 'rb_1', section: 'B. RUANGAN BERSIH' },
      // C. KULKAS OBAT
      { id: 'ko_1', label: 'Suhu kulkas obat di jaga dalam sushu 2 – 8 °C', key: 'ko_1', section: 'C. KULKAS OBAT' },
      { id: 'ko_2', label: 'Pemantauan suhu dicatat setiap hari dan jika suhu tidak sesuai standar maka diambil tindakan yang sesuai (suhu lemari penyimpanan berkisar 2 – 8 °C)', key: 'ko_2', section: 'C. KULKAS OBAT' },
      { id: 'ko_3', label: 'Suhu lemari pembeku dijaga dalam kisaran suhu – 18 ° C atau lebih rendah', key: 'ko_3', section: 'C. KULKAS OBAT' },
      { id: 'ko_4', label: 'Pemantauan suhu dicatat setiap hari dan jika suhu tidak sesuai standar maka akan diambil tindakan yang sesuai ( suhu lemari pembeku berkisar antara – 18 °C atau lebih rendah )', key: 'ko_4', section: 'C. KULKAS OBAT' },
      { id: 'ko_5', label: 'Suhu ruang penyimpanan dijaga dalam kisaran 25 °C atau lebih rendah', key: 'ko_5', section: 'C. KULKAS OBAT' },
      { id: 'ko_6', label: 'Pemantauan suhu tercatat tiap bulannya dan jika suhu tidak sesuai standar maka di ambil tindakan yang sesuai', key: 'ko_6', section: 'C. KULKAS OBAT' },
      // D. PENYIMPANAN OBAT
      { id: 'po_1', label: 'Suhu penyimpanan dijaga dalam kisaran 25 °C atau lebih rendah', key: 'po_1', section: 'D. PENYIMPANAN OBAT' },
      // E. LIMBAH UMUM
      { id: 'lm_1', label: 'Limbah medis umum dibuang ke dalam plastik hitam', key: 'lm_1', section: 'E. LIMBAH UMUM' },
      { id: 'lm_2', label: 'Limbah khusus ditandai dengan jelas, misal : biohazard, radioaktif, kemoterapi', key: 'lm_2', section: 'E. LIMBAH UMUM' },
      { id: 'lm_3', label: 'Pastikan tidak ada kantung limbah yang terlampau penuh', key: 'lm_3', section: 'E. LIMBAH UMUM' },
      // F. PENANGANAN YANG AMAN DAN PEMBUANGAN BENDA TAJAM
      { id: 'bt_1', label: 'Tempat sampah bebas dari benda tajam yang terjulur', key: 'bt_1', section: 'F. PENANGANAN YANG AMAN DAN PEMBUANGAN BENDA TAJAM' },
      { id: 'bt_2', label: 'Semua tempat sampah tersusun dengan benar', key: 'bt_2', section: 'F. PENANGANAN YANG AMAN DAN PEMBUANGAN BENDA TAJAM' },
      { id: 'bt_3', label: 'Seluruh tempat sampah benda tajam adalah safety box yang terstandar WHO', key: 'bt_3', section: 'F. PENANGANAN YANG AMAN DAN PEMBUANGAN BENDA TAJAM' },
      { id: 'bt_4', label: 'Jarum tidak dibengkokkan, dipotong atau digunakan kembali', key: 'bt_4', section: 'F. PENANGANAN YANG AMAN DAN PEMBUANGAN BENDA TAJAM' },
      { id: 'bt_5', label: 'Jarum / benda tajam langsung dibuang ke tempat sampah benda tajam setelah sesesai digunakan', key: 'bt_5', section: 'F. PENANGANAN YANG AMAN DAN PEMBUANGAN BENDA TAJAM' },
      { id: 'bt_6', label: 'Jarum bebas pakai tidak boleh digunakan lagi', key: 'bt_6', section: 'F. PENANGANAN YANG AMAN DAN PEMBUANGAN BENDA TAJAM' },
      // G. FASILITAS CUCI TANGAN
      { id: 'fct_1', label: 'Tersedia fasilitas yang memadai untuk cuci tangan', key: 'fct_1', section: 'G. FASILITAS CUCI TANGAN' },
      { id: 'fct_2', label: 'Wastafel cuci tangan bebas dari alat – alat yang telah dipakai dan benda – benda yang tidak sesuai', key: 'fct_2', section: 'G. FASILITAS CUCI TANGAN' },
      { id: 'fct_3', label: 'Poster cara dan 5 saat kebersihan tangan berada di dekat alkohol hand rub atau wastafel', key: 'fct_3', section: 'G. FASILITAS CUCI TANGAN' },
      { id: 'fct_4', label: 'Tersedia hand rub, botol berfungsi baik, ada tanggal saat botol dibuka dan tanggal expired', key: 'fct_4', section: 'G. FASILITAS CUCI TANGAN' },
      // H. PETUNJUK UMUM
      { id: 'pu_1', label: 'Kuku dipotong pendek, bersih, dan bebas dari cat kuku', key: 'pu_1', section: 'H. PETUNJUK UMUM' },
      { id: 'pu_2', label: 'Poster promosi kebersihan tangan tersedia dan terpajang di area yang terlihat oleh staf', key: 'pu_2', section: 'H. PETUNJUK UMUM' },
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
      { id: 'e_debu', label: 'Secara visual bebas debu', key: 'e_debu', section: 'E: PEMBERSIHAN LINGKUNGAN', isNegative: true },
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
    tableName: 'audit_cssd_monitoring',
    items: [
      { id: 'cssd_penerimaan_1', label: 'Petugas menggunakan APD', key: 'cssd_penerimaan_1', section: 'A. PENERIMAAN ALAT' },
      { id: 'cssd_penerimaan_2', label: 'Pengiriman barang kotor menggunakan container khusus dan tertutup', key: 'cssd_penerimaan_2', section: 'A. PENERIMAAN ALAT' },
      { id: 'cssd_penerimaan_3', label: 'Container alat kotor dibersihkan secara rutin', key: 'cssd_penerimaan_3', section: 'A. PENERIMAAN ALAT' },
      { id: 'cssd_precleaning_1', label: 'Petugas menggunakan APD', key: 'cssd_precleaning_1', section: 'B. PRE CLEANING' },
      { id: 'cssd_precleaning_2', label: 'Bersihkan semua kotoran dan dilakukan perendaman menggunakan larutan enzymatic', key: 'cssd_precleaning_2', section: 'B. PRE CLEANING' },
      { id: 'cssd_precleaning_3', label: 'Buang / ganti larutan enzymatic setelah dipakai', key: 'cssd_precleaning_3', section: 'B. PRE CLEANING' },
      { id: 'cssd_pembersihan_1', label: 'Lakukan kebersihan tangan', key: 'cssd_pembersihan_1', section: 'C. PEMBERSIHAN' },
      { id: 'cssd_pembersihan_2', label: 'Petugas menggunakan APD (kacamata google, sarung tangan, sepatu/alas kaki, apron)', key: 'cssd_pembersihan_2', section: 'C. PEMBERSIHAN' },
      { id: 'cssd_ventilasi_1', label: 'House fan tersedia', key: 'cssd_ventilasi_1', section: 'D. VENTILASI' },
      { id: 'cssd_ventilasi_2', label: 'Pertukaran udara 10 x/jam', key: 'cssd_ventilasi_2', section: 'D. VENTILASI' },
      { id: 'cssd_suhu_1', label: 'Suhu 18 – 22 °C', key: 'cssd_suhu_1', section: 'E. SUHU DAN KELEMBABAN' },
      { id: 'cssd_suhu_2', label: 'Kelembaban 35 – 75 %', key: 'cssd_suhu_2', section: 'E. SUHU DAN KELEMBABAN' },
      { id: 'cssd_suhu_3', label: 'Tersedia alur pasca pajanan / SOP', key: 'cssd_suhu_3', section: 'E. SUHU DAN KELEMBABAN' },
      { id: 'cssd_limbah_1', label: 'Tersedia tempat limbah infeksius, non infeksius, benda tajam', key: 'cssd_limbah_1', section: 'F. PENGELOLAAN LIMBAH' },
      { id: 'cssd_limbah_2', label: 'Ada label tempat sampah sesuai peruntukan', key: 'cssd_limbah_2', section: 'F. PENGELOLAAN LIMBAH' },
      { id: 'cssd_limbah_3', label: 'Tidak melebihi ¾ penuh atau 3 hari', key: 'cssd_limbah_3', section: 'F. PENGELOLAAN LIMBAH' },
      { id: 'cssd_pengemasan_1', label: 'Petugas menggunakan APD', key: 'cssd_pengemasan_1', section: 'G. PENGEMASAN DAN STERILISASI' },
      { id: 'cssd_pengemasan_2', label: 'Mesin sterilisator dibersihkan rutin', key: 'cssd_pengemasan_2', section: 'G. PENGEMASAN DAN STERILISASI' },
      { id: 'cssd_pengemasan_3', label: 'Pemantauan indikator sterilisasi: mekanik, kimia eksternal, kimia internal, biological', key: 'cssd_pengemasan_3', section: 'G. PENGEMASAN DAN STERILISASI' },
      { id: 'cssd_penyimpanan_1', label: 'Suhu 18 – 22 °C', key: 'cssd_penyimpanan_1', section: 'H. PENYIMPANAN BARANG STERIL' },
      { id: 'cssd_penyimpanan_2', label: 'Kelembaban 35 – 75 %', key: 'cssd_penyimpanan_2', section: 'H. PENYIMPANAN BARANG STERIL' },
      { id: 'cssd_penyimpanan_3', label: 'Ruangan bertekanan positif (+)', key: 'cssd_penyimpanan_3', section: 'H. PENYIMPANAN BARANG STERIL' },
      { id: 'cssd_rak_1', label: '8 inc / 20.3 cm dr lantai, 2 inc / 4.5 cm dr dinding, 18 inc / 45.7 cm dr langit-langit', key: 'cssd_rak_1', section: 'I. RAK PENYIMPANAN' },
      { id: 'cssd_rak_2', label: 'Petugas menggunakan APD', key: 'cssd_rak_2', section: 'I. RAK PENYIMPANAN' },
      { id: 'cssd_pengambilan_1', label: 'Menggunakan container khusus steril dan tertutup', key: 'cssd_pengambilan_1', section: 'J. PENGAMBILAN ALAT STERIL' },
      { id: 'cssd_pengambilan_2', label: 'Kondisi container bersih', key: 'cssd_pengambilan_2', section: 'J. PENGAMBILAN ALAT STERIL' }
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
    tableName: 'audit_gizi',
    items: [
      { id: 'gizi_a_1_1', label: 'Tersedianya ventilasi mekanikal yang cukup', key: 'gizi_a_1_1', section: 'A. PENGENDALIAN LINGKUNGAN - Lingkungan Umum' },
      { id: 'gizi_a_1_2', label: 'Sistem ventilasi dipelihara dan dibersihkan', key: 'gizi_a_1_2', section: 'A. PENGENDALIAN LINGKUNGAN - Lingkungan Umum' },
      { id: 'gizi_a_1_3', label: 'Permukaan lingkungan meliputi troli, meja dan peralatan terbebas dari cipratan, tanah, substansi tubuh, debu, dan tumpahan', key: 'gizi_a_1_3', section: 'A. PENGENDALIAN LINGKUNGAN - Lingkungan Umum' },
      { id: 'gizi_a_1_4', label: 'Kipas angin / Exhaust Fan bersih dan bebas debu', key: 'gizi_a_1_4', section: 'A. PENGENDALIAN LINGKUNGAN - Lingkungan Umum' },
      { id: 'gizi_a_1_5', label: 'Langit-langit / papan langit-langit bebas noda', key: 'gizi_a_1_5', section: 'A. PENGENDALIAN LINGKUNGAN - Lingkungan Umum' },
      { id: 'gizi_a_1_6', label: 'Cairan pembersih atau bahan kimia tersimpan dalam wadah tertutup di bawah bak cuci', key: 'gizi_a_1_6', section: 'A. PENGENDALIAN LINGKUNGAN - Lingkungan Umum' },
      { id: 'gizi_a_1_7', label: 'Lantai bersih dan kering', key: 'gizi_a_1_7', section: 'A. PENGENDALIAN LINGKUNGAN - Lingkungan Umum' },
      { id: 'gizi_a_1_8', label: 'Pengecekan kontrol hama dilakukan regular (cek record), tersedia insect killer / pest control', key: 'gizi_a_1_8', section: 'A. PENGENDALIAN LINGKUNGAN - Lingkungan Umum' },
      { id: 'gizi_a_2_1', label: 'Tersedia fasilitas memadai untuk kebersihan tangan', key: 'gizi_a_2_1', section: 'A. PENGENDALIAN LINGKUNGAN - Fasilitas Kebersihan Tangan' },
      { id: 'gizi_a_2_2', label: 'Bak cuci tangan bebas dari alat bekas pakai and benda tidak sesuai', key: 'gizi_a_2_2', section: 'A. PENGENDALIAN LINGKUNGAN - Fasilitas Kebersihan Tangan' },
      { id: 'gizi_a_2_3', label: 'Poster dekontaminasi tangan diletakkan di area mudah terlihat staf', key: 'gizi_a_2_3', section: 'A. PENGENDALIAN LINGKUNGAN - Fasilitas Kebersihan Tangan' },
      { id: 'gizi_a_2_4', label: 'Tersedia sabun cuci tangan', key: 'gizi_a_2_4', section: 'A. PENGENDALIAN LINGKUNGAN - Fasilitas Kebersihan Tangan' },
      { id: 'gizi_a_2_5', label: 'Cek kemampuan melakukan kebersihan tangan pada petugas', key: 'gizi_a_2_5', section: 'A. PENGENDALIAN LINGKUNGAN - Fasilitas Kebersihan Tangan' },
      { id: 'gizi_a_3_1', label: 'Papan pemotong dalam kondisi baik', key: 'gizi_a_3_1', section: 'A. PENGENDALIAN LINGKUNGAN - Peralatan' },
      { id: 'gizi_a_3_2', label: 'Kontainer/perkakas bersih, tidak rusak, tidak berkarat, tidak terkelupas', key: 'gizi_a_3_2', section: 'A. PENGENDALIAN LINGKUNGAN - Peralatan' },
      { id: 'gizi_a_3_3', label: 'Semua peralatan disimpan dalam kondisi baik', key: 'gizi_a_3_3', section: 'A. PENGENDALIAN LINGKUNGAN - Peralatan' },
      { id: 'gizi_a_3_4', label: 'Jika ada kerusakan dilakukan pelaporan ke penanggung jawab dapur', key: 'gizi_a_3_4', section: 'A. PENGENDALIAN LINGKUNGAN - Peralatan' },
      { id: 'gizi_a_3_5', label: 'Membersihkan troli makanan / meja setiap selesai penyajian', key: 'gizi_a_3_5', section: 'A. PENGENDALIAN LINGKUNGAN - Peralatan' },
      { id: 'gizi_a_3_6', label: 'Temperatur mesin cuci piring diatur suhu 50–85°C', key: 'gizi_a_3_6', section: 'A. PENGENDALIAN LINGKUNGAN - Peralatan' },
      { id: 'gizi_a_4_1', label: 'Daging mentah, ikan, sayuran mentah tidak kontak dengan makanan siap saji', key: 'gizi_a_4_1', section: 'A. PENGENDALIAN LINGKUNGAN - Penyimpanan Makanan' },
      { id: 'gizi_a_4_2', label: 'Pisahkan dan tempatkan makanan dalam wadah tertutup di refrigerator', key: 'gizi_a_4_2', section: 'A. PENGENDALIAN LINGKUNGAN - Penyimpanan Makanan' },
      { id: 'gizi_a_4_3', label: 'Makanan beku disimpan suhu di bawah -12°C', key: 'gizi_a_4_3', section: 'A. PENGENDALIAN LINGKUNGAN - Penyimpanan Makanan' },
      { id: 'gizi_a_4_4', label: 'Makanan tetap dingin dan segar pada suhu 0–4°C', key: 'gizi_a_4_4', section: 'A. PENGENDALIAN LINGKUNGAN - Penyimpanan Makanan' },
      { id: 'gizi_a_4_5', label: 'Makanan dicairkan pada suhu 0–4°C', key: 'gizi_a_4_5', section: 'A. PENGENDALIAN LINGKUNGAN - Penyimpanan Makanan' },
      { id: 'gizi_a_4_6', label: 'Ada bukti pencatatan suhu harian dan tindakan bila standar tidak terpenuhi', key: 'gizi_a_4_6', section: 'A. PENGENDALIAN LINGKUNGAN - Penyimpanan Makanan' },
      { id: 'gizi_a_4_7', label: 'Perlindungan makanan yang disimpan dari kontaminasi', key: 'gizi_a_4_7', section: 'A. PENGENDALIAN LINGKUNGAN - Penyimpanan Makanan' },
      { id: 'gizi_a_4_8', label: 'Pendingin dan freezer bersih dan bebas bau tidak sedap', key: 'gizi_a_4_8', section: 'A. PENGENDALIAN LINGKUNGAN - Penyimpanan Makanan' },
      { id: 'gizi_a_5_1', label: 'Perpindahan makanan dilakukan bersih dan tertutup baik', key: 'gizi_a_5_1', section: 'A. PENGENDALIAN LINGKUNGAN - Perpindahan Makanan' },
      { id: 'gizi_a_5_2', label: 'Gunakan wadah yang tepat (tidak retak, terkelupas, kotor)', key: 'gizi_a_5_2', section: 'A. PENGENDALIAN LINGKUNGAN - Perpindahan Makanan' },
      { id: 'gizi_a_5_3', label: 'Staf memakai pakaian bersih dan alat bantu sesuai', key: 'gizi_a_5_3', section: 'A. PENGENDALIAN LINGKUNGAN - Perpindahan Makanan' },
      { id: 'gizi_b_1_1', label: 'Perpindahan limbah makanan dilakukan bersih dan tertutup', key: 'gizi_b_1_1', section: 'B. PENANGANAN LIMBAH' },
      { id: 'gizi_b_1_2', label: 'Sisa makanan tertutup dalam wadah untuk dibuang', key: 'gizi_b_1_2', section: 'B. PENANGANAN LIMBAH' },
      { id: 'gizi_b_1_3', label: 'Wadah limbah berkualitas baik, memiliki tutup, dibersihkan berkala', key: 'gizi_b_1_3', section: 'B. PENANGANAN LIMBAH' },
      { id: 'gizi_b_1_4', label: 'Area penyimpanan limbah dirancang baik dan dijaga kebersihannya', key: 'gizi_b_1_4', section: 'B. PENANGANAN LIMBAH' },
      { id: 'gizi_c_1_1', label: 'Pemeriksaan harian staf untuk memastikan staf sakit tidak menangani makanan', key: 'gizi_c_1_1', section: 'C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf' },
      { id: 'gizi_c_1_2', label: 'Semua pengolah makanan mendapat pelatihan kebersihan pribadi dan dapur berkala', key: 'gizi_c_1_2', section: 'C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf' },
      { id: 'gizi_c_1_3', label: 'Memakai perhiasan, arloji dan cat kuku saat memasak', key: 'gizi_c_1_3', section: 'C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf' },
      { id: 'gizi_c_1_4', label: 'Staf melakukan cuci tangan sebelum mengolah makanan', key: 'gizi_c_1_4', section: 'C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf' },
      { id: 'gizi_c_1_5', label: 'Gunakan sarung tangan saat mempersiapkan makanan', key: 'gizi_c_1_5', section: 'C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf' },
      { id: 'gizi_c_1_6', label: 'Staf cuci tangan setelah membuka sarung tangan', key: 'gizi_c_1_6', section: 'C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf' },
      { id: 'gizi_c_1_7', label: 'Personil divaksinasi setiap 3 tahun sesuai aturan', key: 'gizi_c_1_7', section: 'C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf' },
      { id: 'gizi_c_1_8', label: 'Personil dengan sakit kuning, diare, penyakit kulit, dll tidak menangani makanan dan dilaporkan ke supervisor', key: 'gizi_c_1_8', section: 'C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf' },
      { id: 'gizi_c_1_9', label: 'Pengolah makanan memakai pelindung, penutup kepala, alas kaki saat tugas catering', key: 'gizi_c_1_9', section: 'C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf' },
      { id: 'gizi_c_1_10', label: 'Pakaian personil dijaga bersih dan diganti setiap hari / bila perlu', key: 'gizi_c_1_10', section: 'C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf' },
      { id: 'gizi_c_1_11', label: 'Luka terbuka ditutup waterproof dressing', key: 'gizi_c_1_11', section: 'C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf' },
      { id: 'gizi_c_1_12', label: 'Saat menyiapkan makanan, tangan tidak menyentuh rambut/wajah/hidung/mulut', key: 'gizi_c_1_12', section: 'C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf' },
      { id: 'gizi_c_1_13', label: 'Staf tidak merokok saat menangani makanan / di area makanan', key: 'gizi_c_1_13', section: 'C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf' },
      { id: 'gizi_c_1_14', label: 'Pengunjung area makanan memakai penutup kepala dan mematuhi kebersihan', key: 'gizi_c_1_14', section: 'C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf' }
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
      // I. KONTROL LINGKUNGAN - A. Lingkungan umum
      { id: 'rad_i_a_1', label: 'Permukaan lingkungan termasuk troli, meja, rak, perlengkapan, hiasan, dan tumbuhan bebas dari debu, kotoran, dll', key: 'rad_i_a_1', section: 'I. KONTROL LINGKUNGAN - A. Lingkungan umum' },
      { id: 'rad_i_a_2', label: 'Kipas angin, AC, dan langit – langit bersih dan bebas jamur', key: 'rad_i_a_2', section: 'I. KONTROL LINGKUNGAN - A. Lingkungan umum' },
      { id: 'rad_i_a_3', label: 'Langit – langit bersih dari noda', key: 'rad_i_a_3', section: 'I. KONTROL LINGKUNGAN - A. Lingkungan umum' },
      { id: 'rad_i_a_4', label: 'Benda yang sesuai disimpan di bawah wastapel ( termasuk cairan pembersih, cairan kimia, dalam wadah tertutup )', key: 'rad_i_a_4', section: 'I. KONTROL LINGKUNGAN - A. Lingkungan umum' },
      { id: 'rad_i_a_5', label: 'Petugas tahu jadwal rutin disinfeksi permukaan lingkungan dengan disinfektan yang disetujui rumah sakit', key: 'rad_i_a_5', section: 'I. KONTROL LINGKUNGAN - A. Lingkungan umum' },

      // I. KONTROL LINGKUNGAN - B. Fasilitas kebersihan tangan
      { id: 'rad_i_b_1', label: 'Tersedia fasilitas yang memadai untuk kebersihan tangan', key: 'rad_i_b_1', section: 'I. KONTROL LINGKUNGAN - B. Fasilitas kebersihan tangan' },
      { id: 'rad_i_b_2', label: 'Tempat mencuci tangan tidak digunakan untuk memcuci alat', key: 'rad_i_b_2', section: 'I. KONTROL LINGKUNGAN - B. Fasilitas kebersihan tangan' },
      { id: 'rad_i_b_3', label: 'Poster yang menganjurkan kebersihan tangan tersedia dan tersedia di area petugas', key: 'rad_i_b_3', section: 'I. KONTROL LINGKUNGAN - B. Fasilitas kebersihan tangan' },
      { id: 'rad_i_b_4', label: 'Tersedia hand rub, botol berfungsi baik, ada tanggal saat botol dibuka dan tanggal expired', key: 'rad_i_b_4', section: 'I. KONTROL LINGKUNGAN - B. Fasilitas kebersihan tangan' },
      { id: 'rad_i_b_5', label: 'Cek kemampuan melakukan kebersihan tangan pada petugas kesehatan ( termasuk dokter )', key: 'rad_i_b_5', section: 'I. KONTROL LINGKUNGAN - B. Fasilitas kebersihan tangan' },

      // II. MANAJEMEN LIMBAH - A. Tindakan umum
      { id: 'rad_ii_a_1', label: 'Petugas harus tahu prosedur pemisahan limbah', key: 'rad_ii_a_1', section: 'II. MANAJEMEN LIMBAH - A. Tindakan umum' },
      { id: 'rad_ii_a_2', label: 'Limbah klinis umum dibuang di dalam kantung plastik', key: 'rad_ii_a_2', section: 'II. MANAJEMEN LIMBAH - A. Tindakan umum' },
      { id: 'rad_ii_a_3', label: 'Limbah klinis yang tercampur darah, terkena darah, atau berisi darah segar dibuang dalam kantung biohazard', key: 'rad_ii_a_3', section: 'II. MANAJEMEN LIMBAH - A. Tindakan umum' },
      { id: 'rad_ii_a_4', label: 'Tempat sampah termasuk tutup dan pedal, pedal kaki bekerja dengan baik', key: 'rad_ii_a_4', section: 'II. MANAJEMEN LIMBAH - A. Tindakan umum' },
      { id: 'rad_ii_a_5', label: 'Tidak ada kantung dengan isi berlebih', key: 'rad_ii_a_5', section: 'II. MANAJEMEN LIMBAH - A. Tindakan umum' },
      { id: 'rad_ii_a_6', label: 'Tersedia spill kit untuk tumpahan darah', key: 'rad_ii_a_6', section: 'II. MANAJEMEN LIMBAH - A. Tindakan umum' },

      // III. PRAKTIK KONTROL INSPEKSI - A. Kebersihan tangan
      { id: 'rad_iii_a_1', label: 'Petugas harus berkuku pendek, bersih, dan tidak diwarnai', key: 'rad_iii_a_1', section: 'III. PRAKTIK KONTROL INSPEKSI - A. Kebersihan tangan' },
      { id: 'rad_iii_a_2', label: 'Petugas melakukan kebersihan tangan sesuai indikasi', key: 'rad_iii_a_2', section: 'III. PRAKTIK KONTROL INSPEKSI - A. Kebersihan tangan' },
      { id: 'rad_iii_a_3', label: 'Petugas tidak menangani barang umum ( seperti gagang pintu dan telepon )', key: 'rad_iii_a_3', section: 'III. PRAKTIK KONTROL INSPEKSI - A. Kebersihan tangan' },

      // III. PRAKTIK KONTROL INSPEKSI - B. Alat pelindung diri
      { id: 'rad_iii_b_1', label: 'Sarung tangan digunakan saat ada risiko kontak langsung dengan zat biohazard', key: 'rad_iii_b_1', section: 'III. PRAKTIK KONTROL INSPEKSI - B. Alat pelindung diri' },
      { id: 'rad_iii_b_2', label: 'Gown berlengan panjang dipakai pada saat ada resiko terciprat cairan tubuh atau saat petugas menderita dermatitis', key: 'rad_iii_b_2', section: 'III. PRAKTIK KONTROL INSPEKSI - B. Alat pelindung diri' },
      { id: 'rad_iii_b_3', label: 'Masker perlindungan mata digunakan saat ada resiko zat biohazard terciprat ke wajah dan mata', key: 'rad_iii_b_3', section: 'III. PRAKTIK KONTROL INSPEKSI - B. Alat pelindung diri' },
      { id: 'rad_iii_b_4', label: 'Respirator N95 yang cocok, digunakan saat ada resiko penularan patogen airbone', key: 'rad_iii_b_4', section: 'III. PRAKTIK KONTROL INSPEKSI - B. Alat pelindung diri' },
      { id: 'rad_iii_b_5', label: 'Pengecekan ukuran respirator N95 secara cepat dilakukan sebelum pemakaian ( fit test )', key: 'rad_iii_b_5', section: 'III. PRAKTIK KONTROL INSPEKSI - B. Alat pelindung diri' },
      { id: 'rad_iii_b_6', label: 'APD dilepas di area kerja saat digunakan', key: 'rad_iii_b_6', section: 'III. PRAKTIK KONTROL INSPEKSI - B. Alat pelindung diri' },

      // III. PRAKTIK KONTROL INSPEKSI - C. Umum
      { id: 'rad_iii_c_1', label: 'Setiap hari dilakukan disinfektan lead apron / mobile lead screens', key: 'rad_iii_c_1', section: 'III. PRAKTIK KONTROL INSPEKSI - C. Umum' },
      { id: 'rad_iii_c_2', label: 'lead apron / mobile lead screens bersih ( secara visual )', key: 'rad_iii_c_2', section: 'III. PRAKTIK KONTROL INSPEKSI - C. Umum' },
      { id: 'rad_iii_c_3', label: 'Barang yang telah digunakan terhadap pasien ( contoh : mesin mamogram ) disinfeksi mengunakan disinfektan, setiap berganti pasien', key: 'rad_iii_c_3', section: 'III. PRAKTIK KONTROL INSPEKSI - C. Umum' },
      { id: 'rad_iii_c_4', label: 'Makanan tidak dibawa ke ruangan X – ray atau di simpan di lemari', key: 'rad_iii_c_4', section: 'III. PRAKTIK KONTROL INSPEKSI - C. Umum' },
      { id: 'rad_iii_c_5', label: 'Tidak ada bukti petugas makan, minum di area kerja', key: 'rad_iii_c_5', section: 'III. PRAKTIK KONTROL INSPEKSI - C. Umum' },
      { id: 'rad_iii_c_6', label: 'Obat – obatan dan alat kontras tidak ada yang kadaluarsa', key: 'rad_iii_c_6', section: 'III. PRAKTIK KONTROL INSPEKSI - C. Umum' },

      // III. PRAKTIK KONTROL INSPEKSI - D. Infeksi khusus
      { id: 'rad_iii_d_1', label: 'Tersedia alat radiologi mobile untuk pemeriksaan pasien dengan infeksi khusus yang telah dirawat di ruang isolasi', key: 'rad_iii_d_1', section: 'III. PRAKTIK KONTROL INSPEKSI - D. Infeksi khusus' },
      { id: 'rad_iii_d_2', label: 'Ada alur cara pengambilan foto, ekspertise, dan laporan hasil pemeriksaan radiologi pasien dengan infeksi khusus. Dapat jelas di baca dan dimengerti oleh seluruh petugas', key: 'rad_iii_d_2', section: 'III. PRAKTIK KONTROL INSPEKSI - D. Infeksi khusus' },
      { id: 'rad_iii_d_3', label: 'SPO pemeriksaan pasien infeksi khusus jelas dapat dibaca dan dimengerti oleh petugas', key: 'rad_iii_d_3', section: 'III. PRAKTIK KONTROL INSPEKSI - D. Infeksi khusus' },
      { id: 'rad_iii_d_4', label: 'Tersedia poster profilaksis pasca pajanan, jelas terbaca dan dimengerti oleh seluruh petugas', key: 'rad_iii_d_4', section: 'III. PRAKTIK KONTROL INSPEKSI - D. Infeksi khusus' },
      { id: 'rad_iii_d_5', label: 'Pemeriksaan suhu berkala pada petugas yang melakukan pemeriksaan pada pasien dengan infeksi khusus', key: 'rad_iii_d_5', section: 'III. PRAKTIK KONTROL INSPEKSI - D. Infeksi khusus' }
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
      { id: 'amb_1', label: 'Tersedia spill kit tumpahan cairan tubuh', key: 'amb_1' },
      { id: 'amb_2', label: 'Ambulance tampak bersih', key: 'amb_2' },
      { id: 'amb_3', label: 'Tidak ada lawa-lawa di sudut Ambulance', key: 'amb_3' },
      { id: 'amb_4', label: 'Jendela kaca tampak bersih', key: 'amb_4' },
      { id: 'amb_5', label: 'Tidak ada debu', key: 'amb_5' },
      { id: 'amb_6', label: 'Tersedia sarana APD', key: 'amb_6' },
      { id: 'amb_7', label: 'Tersedia handrub di mobil ambulance', key: 'amb_7' },
      { id: 'amb_8', label: 'Tersedia tempat sampah tertutup', key: 'amb_8' }
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

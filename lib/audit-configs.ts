export const genericAuditConfigs: Record<string, { tableName: string; extraFilter?: Record<string, string>; items?: { id: string; label: string; key: string; section?: string; isNegative?: boolean }[] }> = {
  hh: {
    tableName: 'audit_hand_hygiene',
    items: [
      { id: 'm1', label: 'Momen 1: Sebelum kontak dengan pasien', key: 'm1', section: '5 Momen Hand Hygiene' },
      { id: 'm2', label: 'Momen 2: Sebelum tindakan aseptik', key: 'm2', section: '5 Momen Hand Hygiene' },
      { id: 'm3', label: 'Momen 3: Setelah kontak cairan tubuh', key: 'm3', section: '5 Momen Hand Hygiene' },
      { id: 'm4', label: 'Momen 4: Setelah kontak dengan pasien', key: 'm4', section: '5 Momen Hand Hygiene' },
      { id: 'm5', label: 'Momen 5: Setelah kontak lingkungan pasien', key: 'm5', section: '5 Momen Hand Hygiene' }
    ]
  },
  apd: {
    tableName: 'audit_apd',
  },
  dekontaminasi_alat: {
    tableName: 'audit_dekontaminasi_alat',
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
  limbah_m: {
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
  limbah_t: {
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
  linen: {
    tableName: 'audit_penatalaksanaan_linen',
    items: [
      { id: 'item_1', label: 'Linen bersih disimpan lemari tertutup', key: 'item_1' },
      { id: 'item_2', label: 'Troli tertutup kotor', key: 'item_2' },
      { id: 'item_3', label: 'Kantung kuning infeksius', key: 'item_3' },
      { id: 'item_4', label: 'Linen kotor dipisah', key: 'item_4' },
      { id: 'item_5', label: 'Petugas APD infeksius', key: 'item_5' }
    ]
  },
  airborne: {
    tableName: 'penempatan_pasien_airbone',
  },
  ppi_ruang_isolasi: {
    tableName: 'audit_monitoring_ppi',
    extraFilter: { kategori: 'ppi_isolasi' },
    items: [
      { id: 'tekanan_negatif', label: 'Tekanan Udara Negatif', key: 'tekanan_negatif' },
      { id: 'tekanan_positif', label: 'Tekanan Udara Positif', key: 'tekanan_positif' },
      { id: 'penggunaan_apd', label: 'Penggunaan APD yang sesuai', key: 'penggunaan_apd' },
      { id: 'ketersediaan_apd', label: 'Ketersediaan APD yang sesuai', key: 'ketersediaan_apd' },
      { id: 'fasilitas_hh', label: 'Kelengkapan Fasilitas Hand Hygiene', key: 'fasilitas_hh' },
      { id: 'edukasi_batuk', label: 'Edukasi Etika Batuk / Pembuangan Sputum', key: 'edukasi_batuk' },
      { id: 'edukasi_hh', label: 'Edukasi Hand Hygiene', key: 'edukasi_hh' }
    ]
  },
  immuno: {
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
  fasilitas_hh: {
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
  fasilitas_apd: {
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
  farmasi: {
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
  ruangan_ibs: {
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
  ambulance: {
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
  tunggu: {
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
  tps: {
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

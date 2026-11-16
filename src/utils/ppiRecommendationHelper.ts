/**
 * Intelligent Clinical PPI Recommendation Engine (Mesin Rekomendasi PPI Cerdas)
 * RSUD Al-Mulk Kota Sukabumi
 * 
 * Mengacu pada pedoman standar nasional dan internasional:
 * - Permenkes RI No. 27 Tahun 2017 tentang Pedoman Pencegahan dan Pengendalian Infeksi di FASYANKES
 * - WHO Guidelines on Core Components of Infection Prevention and Control Programmes
 * - Standar Prosedur Operasional (SPO) Komite PPI RSUD Al-Mulk
 * 
 * Fitur Intelegensia:
 * 1. Multi-Clause & Compound Sentence Detection (Mendeteksi kalimat majemuk dengan tanda baca & kata hubung)
 * 2. Context-Aware Semantic Disambiguation (Membedakan kondisi objek, misal: botol handrub kotor vs cairan handrub habis)
 * 3. Specificity-First Priority Scoring (Mendahulukan aturan spesifik sebelum aturan umum)
 * 4. Multi-Topic Synthesis (Menggabungkan beberapa rekomendasi menjadi poin-poin bernomor yang terstruktur)
 * 5. Dynamic Clinical NLG Fallback (Sintesis narasi klinis alami untuk temuan bebas/kustom)
 */

export interface PpiTopicRule {
  id: string;
  category: string;
  priority: number;
  matches: (clause: string, fullText: string) => boolean;
  recommendation: string;
}

export const PPI_RULES: PpiTopicRule[] = [
  // =========================================================================
  // 1. LIMBAH BENDA TAJAM, SAFETY BOX & PERLINDUNGAN PAJANAN
  // =========================================================================
  {
    id: "limbah_tajam_terbuka",
    category: "Limbah Tajam",
    priority: 100,
    matches: (clause) => {
      const hasSharp = /tajam|safety\s*box|jarum|spuit|syringe|bisturi|scalpel|needle|abbocath|iv\s*cath|surflo/i.test(clause);
      const isOpen = /terbuka|tidak\s*tertutup|tanpa\s*tutup|tutup\s*rusak|menganga|tidak\s*rapat|belum\s*ditutup/i.test(clause);
      return hasSharp && isOpen;
    },
    recommendation:
      "Pastikan wadah limbah benda tajam (safety box) selalu dalam kondisi tertutup dan lubang pembuangan hanya dibuka saat insersi limbah tajam untuk mencegah risiko luka tusuk jarum (Needle Stick Injury) bagi petugas dan pasien.",
  },
  {
    id: "alur_pasca_pajanan",
    category: "Perlindungan Petugas",
    priority: 100,
    matches: (clause) => {
      return /pasca\s*pajanan|alur\s*pajanan|tertusuk\s*jarum|tatalaksana\s*pajanan|alur\s*tertusuk|sop\s*pajanan|alur\s*nsi|needle\s*stick|profilaksis\s*pasca|alur\s*luka\s*tusuk/i.test(clause);
    },
    recommendation:
      "Segera pasang dan sosialisasikan lembar alur tatalaksana pasca pajanan (Needle Stick Injury) di area kerja unit agar staf memahami langkah pertolongan pertama (cuci luka dengan air mengalir & sabun antiseptik tanpa memencet luka) dan segera melapor ke Tim PPI/K3RS dalam kurun < 24 jam untuk evaluasi profilaksis pasca pajanan (PPP) sesuai SPO RSUD Al-Mulk.",
  },
  {
    id: "safety_box_penuh",
    category: "Limbah Tajam",
    priority: 95,
    matches: (clause) => {
      const hasSharp = /safety\s*box|kotak\s*kuning|wadah\s*tajam/i.test(clause);
      const isFull = /penuh|melebihi|3\/4|kapasitas|tumpah|menumpuk|luber/i.test(clause);
      return hasSharp && isFull;
    },
    recommendation:
      "Segera tutup dan kunci lubang safety box yang telah mencapai batas 3/4 penuh, larang keras menjejalkan benda tajam secara paksa, dan segera lakukan pengangkutan ke TPS B3 rumah sakit sesuai SPO Pengelolaan Limbah Benda Tajam.",
  },
  {
    id: "limbah_tajam_di_luar",
    category: "Limbah Tajam",
    priority: 95,
    matches: (clause) => {
      const hasSharp = /jarum|spuit|benda\s*tajam|bisturi|scalpel|abbocath/i.test(clause);
      const isOutside = /di\s*luar|tercecer|sembarangan|di\s*meja|di\s*lantai|di\s*troli|bak\s*instrumen|bengkok|kantong\s*plastik/i.test(clause);
      return hasSharp && isOutside;
    },
    recommendation:
      "Dilarang keras meletakkan benda tajam bekas pakai di sembarang tempat atau mencampurnya ke kantong plastik. Segera buang jarum/spuit langsung ke dalam safety box tanpa perantara untuk mencegah insiden tertusuk jarum infeksius.",
  },
  {
    id: "recapping_jarum",
    category: "Penyuntikan Aman",
    priority: 95,
    matches: (clause) => {
      return /recapping|recap|tutup\s*jarum|menutup\s*jarum|sarung\s*jarum|tutup\s*kembali/i.test(clause);
    },
    recommendation:
      "Pertahankan kepatuhan untuk tidak melakukan penutupan jarum kembali (recapping) setelah tindakan injeksi. Jika mutlak diperlukan dalam keadaan mendesak, wajib gunakan teknik satu tangan (one-handed scoop technique) dan segera masukkan ke safety box.",
  },
  {
    id: "spuit_single_use_multidose",
    category: "Penyuntikan Aman",
    priority: 90,
    matches: (clause) => {
      return /multidose|oplos|spuit\s*bekas|single\s*use|vial|spuit\s*ulang|jarum\s*ulang/i.test(clause);
    },
    recommendation:
      "Terapkan prinsip satu spuit, satu jarum, satu kali pakai pada satu pasien (single-use). Berikan label tanggal dan jam buka (Beyond Use Date / BUD) pada vial multidose serta simpan pada suhu standar farmasi.",
  },

  // =========================================================================
  // 2. FASILITAS KEBERSIHAN TANGAN (HAND HYGIENE)
  // =========================================================================
  {
    id: "handrub_kotor_debu",
    category: "Kebersihan Tangan",
    priority: 95,
    matches: (clause) => {
      const isHandrub = /handrub|hand\s*rub|antiseptik|dispenser|braket\s*handrub|botol\s*handrub/i.test(clause);
      const isDirty = /kotor|debu|berdebu|bercak|kerak|kusam|kotoran|lengket|bernoda/i.test(clause);
      return isHandrub && isDirty;
    },
    recommendation:
      "Lakukan pembersihan dan dekontaminasi rutin pada permukaan luar botol handrub serta braket dinding dispenser menggunakan cairan desinfektan. Pastikan fasilitas kebersihan tangan selalu dalam kondisi bersih, higienis, dan bebas dari debu atau kerak sesuai SPO Kebersihan Tangan RSUD Al-Mulk.",
  },
  {
    id: "handrub_kosong_habis",
    category: "Kebersihan Tangan",
    priority: 90,
    matches: (clause) => {
      const isHandrub = /handrub|hand\s*rub|cairan\s*antiseptik|antiseptic/i.test(clause);
      const isEmpty = /kosong|habis|kurang|tidak\s*ada|tidak\s*tersedia|kering|belum\s*diisi|refill/i.test(clause);
      return isHandrub && isEmpty;
    },
    recommendation:
      "Segera lakukan pengisian ulang (refill) cairan handrub pada seluruh dispenser dan braket unit, periksa tanggal kedaluwarsa (BUD), dan pastikan ketersediaannya terpantau setiap pergantian shift.",
  },
  {
    id: "wastafel_kran_bocor",
    category: "Kebersihan Tangan",
    priority: 95,
    matches: (clause) => {
      const isSink = /wastafel|kran|keran|sink|saluran\s*air/i.test(clause);
      const isLeak = /bocor|rusak|patah|menetes|rembes|lepas|macet/i.test(clause);
      return isSink && isLeak;
    },
    recommendation:
      "Lakukan perbaikan atau penggantian kran/wastafel yang bocor melalui koordinasi dengan bagian IPSRS untuk mencegah genangan air dan kelembapan yang berisiko menjadi sarang kolonisasi kuman patogen.",
  },
  {
    id: "wastafel_mampet_kotor",
    category: "Kebersihan Tangan",
    priority: 90,
    matches: (clause) => {
      const isSink = /wastafel|sink|saluran\s*pembuangan|bak\s*cuci/i.test(clause);
      const isClogged = /mampet|tersumbat|kotor|berkerak|biofilm|lumut|bau|genangan/i.test(clause);
      return isSink && isClogged;
    },
    recommendation:
      "Disarankan wastafel dan saluran pembuangan air segera dibersihkan, didesinfeksi dengan klorin secara berkala, dan dilakukan pelancaran saluran pipa untuk mengeliminasi biofilm bakteri dan mencegah transmisi kuman dari lingkungan air ke pasien.",
  },
  {
    id: "sabun_tisu_habis",
    category: "Kebersihan Tangan",
    priority: 85,
    matches: (clause) => {
      const isSoapTissue = /sabun|soap|tisu|tissue|pengering|paper\s*towel/i.test(clause);
      const isMissing = /habis|kosong|tidak\s*ada|tidak\s*tersedia|kurang|belum\s*ada|basah/i.test(clause);
      return isSoapTissue && isMissing;
    },
    recommendation:
      "Segera sediakan sabun cair antiseptik dan tisu pengering sekali pakai pada setiap wastafel cuci tangan. Hindari penggunaan handuk kain bersama untuk mencegah transmisi silang mikroorganisme antar petugas.",
  },
  {
    id: "five_moments_kepatuhan",
    category: "Kebersihan Tangan",
    priority: 80,
    matches: (clause) => {
      return /5\s*momen|five\s*moment|cuci\s*tangan|kebersihan\s*tangan|hand\s*hygiene/i.test(clause) &&
             /tidak\s*cuci|kurang\s*patuh|tidak\s*patuh|lewat|lupa|belum|sebelum|sesudah/i.test(clause);
    },
    recommendation:
      "Tingkatkan kepatuhan Five Moments kebersihan tangan bagi staf medis (terutama sebelum kontak dengan pasien dan sebelum tindakan aseptik), serta lakukan audit kepatuhan dan edukasi berkala oleh IPCLN unit.",
  },

  // =========================================================================
  // 3. TEMPAT SAMPAH & PENGELOLAAN LIMBAH MEDIS
  // =========================================================================
  {
    id: "tempat_sampah_tanpa_pedal_terbuka",
    category: "Limbah Medis",
    priority: 95,
    matches: (clause) => {
      const isBin = /tempat\s*sampah|tong\s*sampah|wadah\s*sampah|bak\s*sampah/i.test(clause);
      const isProblem = /tidak\s*berpedal|tanpa\s*pedal|pedal\s*rusak|rusak\s*pedal|terbuka|tidak\s*ada\s*tutup|tutup\s*rusak|tutup\s*terbuka/i.test(clause);
      return isBin && isProblem;
    },
    recommendation:
      "Segera lakukan perbaikan atau penggantian tempat sampah dengan wadah tertutup yang dilengkapi pedal injak operasional untuk mencegah transmisi kuman melalui udara dan kontak tangan langsung petugas.",
  },
  {
    id: "kantong_plastik_kuning_sampah",
    category: "Limbah Medis",
    priority: 85,
    matches: (clause) => {
      return /plastik\s*kuning|kantong\s*kuning|kresek\s*kuning|plastik\s*hitam/i.test(clause);
    },
    recommendation:
      "Pastikan ukuran kantong plastik kuning (medis infeksius) dan hitam (non-medis) sesuai dengan kapasitas tempat sampah, ikat rapat kantong saat terisi 3/4 penuh, dan segera angkut ke TPS B3 sesuai jadwal shift.",
  },
  {
    id: "pemilahan_limbah_tercampur",
    category: "Limbah Medis",
    priority: 85,
    matches: (clause) => {
      const isWaste = /limbah|sampah/i.test(clause);
      const isMixed = /tercampur|campur|salah\s*buang|tidak\s*terpilah|pemilahan|domestik\s*ke\s*medis/i.test(clause);
      return isWaste && isMixed;
    },
    recommendation:
      "Tingkatkan kepatuhan pemilahan limbah sejak dari sumbernya: buang limbah infeksius (terkontaminasi darah/cairan tubuh) ke kantong kuning biohazard dan limbah domestik ke kantong hitam. Berikan re-edukasi kepada staf dan tenaga kebersihan.",
  },
  {
    id: "limbah_medis_penuh_tercecer",
    category: "Limbah Medis",
    priority: 80,
    matches: (clause) => {
      const isWaste = /limbah|sampah/i.test(clause);
      const isOverflow = /penuh|tercecer|luber|menumpuk|lewat\s*kapasitas/i.test(clause);
      return isWaste && isOverflow;
    },
    recommendation:
      "Segera lakukan pengikatan rapat kantong sampah yang terisi 3/4 penuh dan lakukan pengangkutan tepat waktu ke TPS B3. Larang keras memadatkan limbah medis secara manual untuk mencegah robeknya kantong dan pajanan limbah infeksius.",
  },

  // =========================================================================
  // 4. ALAT PELINDUNG DIRI (APD)
  // =========================================================================
  {
    id: "masker_dagu_tidak_tepat",
    category: "APD",
    priority: 95,
    matches: (clause) => {
      return /masker/i.test(clause) && /dagu|leher|turun|terbuka|hidung\s*terlihat|melorot/i.test(clause);
    },
    recommendation:
      "Petugas wajib mengenakan masker secara tepat menutupi hidung, mulut, dan dagu dengan kawat hidung ditekan rapat. Dilarang menurunkan masker ke dagu atau leher karena berisiko memindahkan kontaminan dari leher ke membran mukosa.",
  },
  {
    id: "sarung_tangan_tidak_ganti",
    category: "APD",
    priority: 90,
    matches: (clause) => {
      return /sarung\s*tangan|handscoon|glove/i.test(clause) && /tidak\s*ganti|antar\s*pasien|berulang|cuci\s*handscoon/i.test(clause);
    },
    recommendation:
      "Wajib mengganti sarung tangan (handscoon) di antara setiap kontak pasien yang berbeda atau saat berpindah dari area tubuh terkontaminasi ke area bersih pada pasien yang sama. Sarung tangan bersifat single-use dan dilarang dicuci/diberi handrub.",
  },
  {
    id: "apd_tidak_dipakai",
    category: "APD",
    priority: 85,
    matches: (clause) => {
      const isApd = /apd|masker|sarung\s*tangan|handscoon|glove|apron|gaun|goggle|faceshield|penutup\s*kepala|nurse\s*cap/i.test(clause);
      const isNotUsed = /tidak\s*menggunakan|tidak\s*memakai|tanpa\s*menggunakan|tanpa\s*memakai|tidak\s*pakai|kurang|dilepas|belum\s*pakai/i.test(clause);
      return isApd && isNotUsed;
    },
    recommendation:
      "Tingkatkan kepatuhan penggunaan APD lengkap (masker bedah/N95, sarung tangan, apron/gaun, pelindung mata) sesuai indikasi tindakan dan jalur transmisi penyakit, serta pastikan APD dilepas dan dibuang ke tempat sampah infeksius segera setelah selesai tindakan.",
  },
  {
    id: "penyimpanan_apd_kotor_debu",
    category: "APD",
    priority: 85,
    matches: (clause) => {
      const isApd = /apd|masker|sarung\s*tangan|handscoon/i.test(clause);
      const isStorage = /lemari|wadah|penyimpanan|ditaruh|terbuka|berdebu/i.test(clause);
      return isApd && isStorage;
    },
    recommendation:
      "Simpan stok APD bersih dalam lemari atau wadah tertutup yang kering, bersih, dan bebas debu, serta dipisahkan secara tertib berdasarkan jenis dan ukurannya.",
  },

  // =========================================================================
  // 5. DEKONTAMINASI ALAT & STERILISASI INSTRUMEN
  // =========================================================================
  {
    id: "instrumen_rapi_positif",
    category: "Dekontaminasi Alat",
    priority: 95,
    matches: (clause) => {
      const isTool = /alat|instrumen|set\s*alat|tromol|bak\s*instrumen/i.test(clause);
      const isGood = /tersusun\s*rapi|tertata\s*rapi|rapih|bersih|lengkap|steril|sesuai|patuh|optimal/i.test(clause);
      return isTool && isGood;
    },
    recommendation:
      "Pertahankan kepatuhan penataan instrumen, pemeliharaan kebersihan set alat medis, dan kelayakan penyimpanan steril sesuai Standar Prosedur Operasional (SPO) Dekontaminasi & Sterilisasi RSUD Al-Mulk.",
  },
  {
    id: "instrumen_kotor_berkarat",
    category: "Dekontaminasi Alat",
    priority: 90,
    matches: (clause) => {
      const isTool = /alat|instrumen|set\s*bedah|gunting|klem|pinset|bak\s*instrumen/i.test(clause);
      const isDirty = /kotor|berkarat|karat|bekas\s*pakai|darah|noda|belum\s*dibersihkan/i.test(clause);
      return isTool && isDirty;
    },
    recommendation:
      "Segera lakukan pembersihan awal (prerinse) dengan larutan enzimatik segera setelah alat digunakan untuk mencegah pengeringan materi organik/biofilm, pisahkan instrumen yang berkarat agar tidak mengontaminasi set lain, dan kirim ke CSSD untuk proses sterilisasi ulang.",
  },
  {
    id: "label_sterilisasi_kadaluwarsa",
    category: "Dekontaminasi Alat",
    priority: 90,
    matches: (clause) => {
      const isSteril = /steril|sterilisasi|cssd|alat|instrumen/i.test(clause);
      const isLabel = /label|indikator|tanggal|kadaluwarsa|expired|tanpa\s*label|tidak\s*ada\s*tanggal/i.test(clause);
      return isSteril && isLabel;
    },
    recommendation:
      "Pastikan setiap kemasan instrumen steril ditempeli label indikator sterilisasi lengkap (mencantumkan tanggal sterilisasi, tanggal kedaluwarsa/BUD, dan identitas petugas). Alat tanpa label atau yang telah kedaluwarsa wajib disterilkan ulang sebelum digunakan.",
  },

  // =========================================================================
  // 6. LINEN DAN LAUNDRY
  // =========================================================================
  {
    id: "linen_kotor_di_lantai",
    category: "Linen",
    priority: 95,
    matches: (clause) => {
      const isLinen = /linen|sprei|seprei|sarung\s*bantal|selimut/i.test(clause);
      const isFloor = /lantai|ditaruh|bertumpuk|tercecer|jatuh/i.test(clause);
      return isLinen && isFloor;
    },
    recommendation:
      "Dilarang keras meletakkan linen kotor/infeksius di atas lantai. Masukkan linen kotor langsung ke dalam kantong linen terstandar (kuning untuk infeksius, hitam/cokelat untuk non-infeksius) dan tutup rapat sebelum ditransportasikan ke unit laundry.",
  },
  {
    id: "pemilahan_linen_infeksius",
    category: "Linen",
    priority: 85,
    matches: (clause) => {
      return /linen/i.test(clause) && /tercampur|campur|infeksius|kantong\s*kuning|pemilahan/i.test(clause);
    },
    recommendation:
      "Pastikan pemisahan linen infeksius (terkena darah/cairan tubuh) ke dalam kantong kuning infeksius dan linen non-infeksius ke dalam kantong terpisah berjalan tertib, serta petugas selalu mengenakan APD (sarung tangan tebal dan apron) saat penanganan linen kotor.",
  },

  // =========================================================================
  // 7. PENGENDALIAN LINGKUNGAN, SPILL KIT & FASILITAS FISIK
  // =========================================================================
  {
    id: "spill_kit_tidak_lengkap",
    category: "Lingkungan",
    priority: 95,
    matches: (clause) => {
      const isSpill = /spill\s*kit|spillkit/i.test(clause);
      const isProblem = /tidak\s*lengkap|kurang|kosong|klorin\s*habis|tanpa|belum\s*lengkap/i.test(clause);
      return isSpill && isProblem;
    },
    recommendation:
      "Segera lengkapi isi kotak spill kit (APD lengkap, serokan, pasir/absorben, kantong kuning biohazard, cairan klorin 0.5%, dan form insiden) serta pastikan disimpan di lokasi yang mudah dijangkau saat terjadi tumpahan cairan tubuh infeksius.",
  },
  {
    id: "tumpahan_darah_cairan",
    category: "Lingkungan",
    priority: 95,
    matches: (clause) => {
      return /tumpahan\s*darah|tumpahan\s*cairan|darah\s*tercecer|tumpahan\s*urin|tumpahan\s*cairan\s*tubuh/i.test(clause);
    },
    recommendation:
      "Segera lakukan penanganan tumpahan infeksius menggunakan spill kit: pasang tanda bahaya, gunakan APD lengkap, taburkan absorben/pasir, tuangkan desinfektan klorin 0.5%, serap dan buang ke kantong biohazard, lalu pel area sekitar sesuai SPO Penanganan Tumpahan Darah/Cairan Tubuh.",
  },
  {
    id: "klorin_desinfektan_habis",
    category: "Lingkungan",
    priority: 85,
    matches: (clause) => {
      const isChlorine = /klorin|chlorine|bayclin|desinfektan|cairan\s*pembersih/i.test(clause);
      const isMissing = /habis|kosong|tidak\s*tersedia|tidak\s*ada|kadaluwarsa/i.test(clause);
      return isChlorine && isMissing;
    },
    recommendation:
      "Segera sediakan larutan klorin 0.5% (natrium hipoklorit) segar dengan label tanggal pembuatan yang jelas untuk kesiapsiagaan dekontaminasi tumpahan cairan tubuh dan desinfeksi permukaan infeksius.",
  },
  {
    id: "plafon_jamur_bocor",
    category: "Lingkungan",
    priority: 90,
    matches: (clause) => {
      return /jamur|plafon|langit-langit|atap|bocor|rembes|dinding|cat\s*mengelupas|retak/i.test(clause);
    },
    recommendation:
      "Segera berkoordinasi dengan bagian IPSRS dan Sanitarian untuk perbaikan kebocoran plafon/atap, desinfeksi area berjamur dengan cairan fungisida/klorin, dan pengecatan ulang menggunakan cat antijamur sesuai standar kebersihan lingkungan rumah sakit.",
  },
  {
    id: "lantai_kotor_debu",
    category: "Lingkungan",
    priority: 80,
    matches: (clause) => {
      return /lantai|debu|berdebu|kotor|pel\s*kering|sapu\s*kering/i.test(clause);
    },
    recommendation:
      "Lakukan pembersihan lantai minimal 2 kali sehari menggunakan teknik pel basah (wet mopping) dengan larutan desinfektan standar. Hindari menyapu kering di area perawatan untuk mencegah aerosolisasi debu dan kuman patogen.",
  },

  // =========================================================================
  // 8. FARMASI, COLD CHAIN & OBAT
  // =========================================================================
  {
    id: "suhu_kulkas_farmasi",
    category: "Farmasi",
    priority: 95,
    matches: (clause) => {
      return /kulkas|chiller|cold\s*chain|suhu\s*obat|penyimpanan\s*obat|suhu\s*vaksin/i.test(clause);
    },
    recommendation:
      "Segera lakukan penyesuaian termostat dan monitoring suhu kulkas farmasi agar berada pada rentang standar 2°C – 8°C. Catat pemantauan suhu pada logbook 2 kali sehari dan laporkan ke IPSRS jika terjadi anomali suhu mesin pendingin.",
  },
  {
    id: "obat_lasa_high_alert",
    category: "Farmasi",
    priority: 90,
    matches: (clause) => {
      return /lasa|high\s*alert|label\s*obat|norum|stiker\s*lasa|penyimpanan\s*obat\s*keras/i.test(clause);
    },
    recommendation:
      "Pastikan obat kategori Look-Alike Sound-Alike (LASA) dan High Alert ditempeli stiker penanda khusus, disimpan secara terpisah dengan jarak aman, dan dilakukan double-checking sebelum pemberian ke pasien guna mencegah medication error.",
  },

  // =========================================================================
  // 9. RUANG ISOLASI & AIRBORNE
  // =========================================================================
  {
    id: "isolasi_ventilasi_tekanan",
    category: "Ruang Isolasi",
    priority: 95,
    matches: (clause) => {
      return /isolasi|tekanan\s*negatif|tekanan\s*positif|anteroom|hepa|magnehelic|ventilasi|airborne|exhaust/i.test(clause);
    },
    recommendation:
      "Lakukan pemeriksaan magnehelic gauge secara berkala untuk memastikan gradien tekanan negatif ruang isolasi tetap stabil (minimal -2.5 Pa), pintu anteroom selalu tertutup rapat, dan sirkulasi udara (ACH minimal 12x/jam) terpelihara baik sesuai SPO Ruang Isolasi Airborne.",
  },

  // =========================================================================
  // 10. GIZI & DAPUR
  // =========================================================================
  {
    id: "gizi_makanan_sampel",
    category: "Gizi",
    priority: 90,
    matches: (clause) => {
      return /sampel\s*makanan|contoh\s*makanan|uji\s*makanan|food\s*sample/i.test(clause);
    },
    recommendation:
      "Wajib menyimpan sampel makanan pasien (minimal 100 gram per menu) di kulkas khusus suhu < 4°C selama minimal 2x24 jam untuk kesiapsiagaan investigasi epidemiologi bila terjadi kejadian luar biasa (KLB) keracunan pangan.",
  },
  {
    id: "gizi_penjamah_makanan_apd",
    category: "Gizi",
    priority: 85,
    matches: (clause) => {
      return /penjamah\s*makanan|petugas\s*dapur|masak|pengolahan\s*makanan/i.test(clause) && /apd|celemek|apron|masker|penutup\s*kepala/i.test(clause);
    },
    recommendation:
      "Seluruh petugas penjamah makanan wajib menggunakan APD dapur lengkap (penutup kepala, masker, celemek kedap air, dan sarung tangan plastik/penjepit makanan saat kontak dengan makanan matang) serta menerapkan cuci tangan higienis.",
  },

  // =========================================================================
  // 11. AMBULANS & KAMAR JENAZAH
  // =========================================================================
  {
    id: "ambulans_dekontaminasi",
    category: "Ambulans",
    priority: 90,
    matches: (clause) => {
      return /ambulans|ambulance|brankar\s*ambulans/i.test(clause);
    },
    recommendation:
      "Segera lakukan dekontaminasi dan desinfeksi kabin serta brankar ambulans pasca merujuk/menjemput pasien infeksius menggunakan cairan desinfektan standar, dan buka ventilasi kabin minimal 30 menit sebelum digunakan kembali.",
  },
  {
    id: "kamar_jenazah_desinfeksi",
    category: "Kamar Jenazah",
    priority: 90,
    matches: (clause) => {
      return /jenazah|mortuary|kamar\s*mayat|meja\s*jenazah/i.test(clause);
    },
    recommendation:
      "Lakukan desinfeksi meja pemulasaraan dan lantai kamar jenazah dengan larutan klorin 0.5% segera setelah perawatan jenazah, dan pastikan seluruh petugas selalu mengenakan APD level transmisi droplet/kontak.",
  },

  // =========================================================================
  // 12. POSITIF / PATUH / BERSIH
  // =========================================================================
  {
    id: "temuan_bersih_rapih_positif",
    category: "Umum",
    priority: 10,
    matches: (clause) => {
      return /^(bersih|rapi|rapih|baik|sesuai|patuh|aman|tidak\s*ada\s*temuan|nihil|optimal)(\s+(dan|serta)?\s*(bersih|rapi|rapih|baik|sesuai|patuh|aman|terjaga))?$/i.test(clause.trim());
    },
    recommendation:
      "Pertahankan kepatuhan pelaksanaan dan kebersihan sesuai dengan Standar Prosedur Operasional (SPO) Pencegahan dan Pengendalian Infeksi (PPI) RSUD Al-Mulk.",
  },
];

/**
 * Memecah kalimat majemuk temuan menjadi klausa-klausa terpisah
 * berdasarkan tanda baca (, ; \n) dan kata hubung (dan, serta, namun, dll).
 */
export function splitClauses(input: string): string[] {
  if (!input || typeof input !== "string") return [];
  
  // Pisahkan berdasarkan koma, titik koma, enter, serta kata hubung umum
  const rawSegments = input.split(/[,;\n]+|\b(?:dan|serta|namun|tetapi|lalu|kemudian|selain\s*itu|juga)\b/i);
  
  return rawSegments
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);
}

/**
 * Generator Rekomendasi Cerdas PPI RSUD Al-Mulk
 * Menghasilkan narasi rekomendasi klinis yang relevan, spesifik,
 * dan terintegrasi secara cerdas dengan isi temuan lapangan.
 */
export function generatePpiRecommendation(
  temuan: string,
  existingRekomendasi?: string
): string {
  if (!temuan || typeof temuan !== "string") {
    return existingRekomendasi || "";
  }

  const clean = temuan.toLowerCase().trim();
  if (clean.length === 0) {
    return existingRekomendasi || "";
  }

  // 1. Pecah kalimat menjadi beberapa klausa terpisah jika berupa kalimat majemuk
  const clauses = splitClauses(clean);
  const matchedRules: PpiTopicRule[] = [];
  const matchedIds = new Set<string>();

  // 2. Evaluasi aturan per klausa berdasarkan prioritas spesifisitas
  const sortedRules = [...PPI_RULES].sort((a, b) => b.priority - a.priority);

  for (const clause of clauses.length > 0 ? clauses : [clean]) {
    for (const rule of sortedRules) {
      if (!matchedIds.has(rule.id) && rule.matches(clause, clean)) {
        matchedRules.push(rule);
        matchedIds.add(rule.id);
        break; // Dapatkan kecocokan terbaik untuk klausa ini
      }
    }
  }

  // 3. Evaluasi juga teks utuh jika ada aturan gabungan yang belum terdeteksi per klausa
  for (const rule of sortedRules) {
    if (!matchedIds.has(rule.id) && rule.matches(clean, clean)) {
      matchedRules.push(rule);
      matchedIds.add(rule.id);
    }
  }

  // 4. Jika ditemukan tepat 1 topik masalah
  if (matchedRules.length === 1) {
    return matchedRules[0].recommendation;
  }

  // 5. Jika ditemukan beberapa topik masalah sekaligus (Kalimat Majemuk / Multi-Finding)
  if (matchedRules.length > 1) {
    return matchedRules
      .map((r, index) => `${index + 1}. ${r.recommendation}`)
      .join("\n");
  }

  // 6. INTELLIGENT CLINICAL NLG FALLBACK
  // Jika temuan berupa kalimat bebas yang belum terdaftar di aturan paten di atas:
  // Ekstraksi kata kunci kondisi dan subjek untuk membuat rekomendasi yang nyambung & kontekstual
  const trimmed = temuan.trim();
  
  if (/kotor|debu|noda|bercak|berminyak|lengket|bau|kusam/i.test(clean)) {
    return `Disarankan untuk segera melakukan pembersihan, dekontaminasi, dan desinfeksi menyeluruh terhadap area/objek "${trimmed}" menggunakan cairan desinfektan standar, serta jadwalkan pemeliharaan berkala sesuai SPO Pencegahan dan Pengendalian Infeksi (PPI) RSUD Al-Mulk.`;
  }
  
  if (/rusak|bocor|patah|lepas|macet|retak|anjlok|pecah/i.test(clean)) {
    return `Segera lakukan koordinasi dengan bagian IPSRS untuk perbaikan atau penggantian terhadap "${trimmed}" guna mencegah risiko kecelakaan kerja dan potensi penularan mikroorganisme patogen di area pelayanan.`;
  }

  if (/habis|kosong|kurang|tidak\s*ada|tidak\s*tersedia|belum\s*ada/i.test(clean)) {
    return `Segera lakukan pengadaan, penyediaan, dan pemenuhan kebutuhan "${trimmed}" agar fasilitas unit selalu lengkap dan siap mendukung kepatuhan standar pencegahan infeksi bagi petugas dan pasien.`;
  }

  if (/tidak\s*patuh|tidak\s*pakai|tidak\s*menggunakan|lupa|abai/i.test(clean)) {
    return `Tingkatkan kedisiplinan dan kepatuhan staf terkait "${trimmed}" melalui edukasi berkelanjutan, briefing harian, serta monitoring berkala oleh IPCLN unit pelayanan.`;
  }

  // Fallback klinis umum formal
  return `Disarankan untuk segera melakukan tindak lanjut dan perbaikan terhadap temuan "${trimmed}" sesuai Standar Prosedur Operasional (SPO) Pencegahan dan Pengendalian Infeksi (PPI) RSUD Al-Mulk, serta dilakukan monitoring dan evaluasi berkala oleh IPCN/IPCLN unit.`;
}

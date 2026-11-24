export type ConstructionType = 'A' | 'B' | 'C' | 'D';
export type PatientRiskGroup = '1' | '2' | '3' | '4';
export type ConstructionClass = 'I' | 'II' | 'III' | 'IV';
export type RiskLevel = 'Tinggi' | 'Sedang' | 'Rendah';

export interface IcraProgramItem {
  id: string;
  created_at?: string;
  tahun: number;
  kategori_risiko: string;
  masalah_risiko: string;
  unit_terkait: string;
  probability: number;
  impact: number;
  preparedness: number;
  total_score: number;
  risk_level: RiskLevel;
  tujuan_umum: string;
  strategi_poa: string;
  pj_pelaksana: string;
  target_waktu: string;
  evaluasi_status: 'Belum Terlaksana' | 'Dalam Proses' | 'Tercapai';
  catatan_evaluasi?: string;
  created_by?: string;
}

export interface IcraChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface IcraKonstruksiItem {
  id: string;
  created_at?: string;
  nomor_izin: string;
  nama_proyek: string;
  lokasi_area: string;
  area_terdampak: string;
  kontraktor_pelaksana: string;
  pj_proyek: string;
  tgl_mulai: string;
  tgl_selesai_estimasi: string;
  tipe_konstruksi: ConstructionType;
  kelompok_risiko: PatientRiskGroup;
  kelas_tindakan: ConstructionClass;
  persyaratan_khusus?: string;
  checklist_pengendalian: IcraChecklistItem[];
  foto_sebelum: string[];
  foto_sesudah: string[];
  status_proyek: 'Menunggu Izin' | 'Aktif Berjalan' | 'Selesai';
  nama_ipcn: string;
  nama_k3rs?: string;
  ttd_ipcn?: string | null;
  ttd_pelaksana?: string | null;
}

export interface IcraMonitoringItem {
  id: string;
  created_at?: string;
  konstruksi_id: string;
  tanggal_monitoring: string;
  jam_monitoring: string;
  petugas_ipcn: string;
  barier_tertutup: boolean;
  tekanan_negatif_hepa: 'Ya' | 'Tidak' | 'N/A';
  keset_basah_pintu: boolean;
  area_sekitar_bersih: boolean;
  jalur_limbah_tertutup: boolean;
  apd_pekerja: boolean;
  temuan_lapangan?: string;
  tindakan_koreksi?: string;
  status_kepatuhan: 'Sesuai Standar' | 'Perlu Perbaikan' | 'Stop Pekerjaan';
  foto_monitoring: string[];
}

export const ICRA_UNITS_LIST = [
  'Seluruh Ruangan',
  'IGD',
  'ICU',
  'IBS / Kamar Operasi',
  'CSSD',
  'Ruang Isolasi',
  'Ranap Aisyah',
  'Ranap Fatimah',
  'Ranap Khadijah',
  'Ranap Usman',
  'Ranap Dewasa',
  'Ranap Anak',
  'Ranap Kebidanan',
  'Ranap Bedah',
  'Rawat Jalan / Poliklinik',
  'Laboratorium',
  'Radiologi',
  'Farmasi',
  'Gizi / Dapur',
  'Laundry / Linen',
  'Kamar Jenazah',
  'TPS Limbah B3',
  'Area Administrasi / Manajemen',
  'Area Umum / Parkir & Koridor',
  'Gedung Koperasi',
];

export const ICRA_RISK_CATEGORIES = [
  'Kewaspadaan Standar',
  'Surveilans & Bundles HAIs',
  'Kesehatan & Perlindungan Karyawan',
  'Pengendalian Lingkungan & Limbah B3',
  'Sterilisasi, Dekontaminasi & Linen',
  'Kewaspadaan Berbasis Transmisi',
  'Diklat & Kepatuhan SDM',
];

export const PROBABILITY_SCALE = [
  { value: 1, label: '1 - Sangat Jarang', desc: 'Hampir tidak pernah terjadi (< 1 kali/tahun)' },
  { value: 2, label: '2 - Jarang', desc: 'Jarang terjadi (beberapa kali dalam 1 tahun)' },
  { value: 3, label: '3 - Kadang-kadang', desc: 'Kadang terjadi (1–2 kali per triwulan)' },
  { value: 4, label: '4 - Sering', desc: 'Sering terjadi (beberapa kali dalam 1 bulan)' },
  { value: 5, label: '5 - Sangat Sering', desc: 'Hampir pasti terjadi (harian / mingguan)' },
];

export const IMPACT_SCALE = [
  { value: 1, label: '1 - Minimal', desc: 'Tidak ada cedera atau dampak klinis berarti' },
  { value: 2, label: '2 - Ringan', desc: 'Ketidaknyamanan ringan tanpa tambahan hari rawat' },
  { value: 3, label: '3 - Sedang', desc: 'Menimbulkan HAIs lokal / tambahan rawat 3–7 hari' },
  { value: 4, label: '4 - Berat', desc: 'Infeksi sistemik / sepsis, perawatan memanjang > 7 hari' },
  { value: 5, label: '5 - Katastropik', desc: 'Mengancam nyawa / kematian / KLB / tuntutan hukum' },
];

export const PREPAREDNESS_SCALE = [
  { value: 1, label: '1 - Sangat Baik', desc: 'SPO ada, kepatuhan > 90%, SDM terlatih & sarana lengkap' },
  { value: 2, label: '2 - Baik', desc: 'SPO dijalankan cukup baik, sarana memadai' },
  { value: 3, label: '3 - Cukup', desc: 'SPO ada, pelaksanaan belum konsisten, sarana sebagian' },
  { value: 4, label: '4 - Buruk', desc: 'SPO ada tapi tidak dijalankan, sarana minim' },
  { value: 5, label: '5 - Tidak Ada', desc: 'Belum ada SPO, SDM belum terlatih, sarana tidak tersedia' },
];

export function calculateRiskScore(prob: number, imp: number, prep: number): number {
  const p = Math.min(5, Math.max(1, Number(prob) || 1));
  const i = Math.min(5, Math.max(1, Number(imp) || 1));
  const s = Math.min(5, Math.max(1, Number(prep) || 1));
  return p * i * s;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 45) return 'Tinggi';
  if (score >= 18) return 'Sedang';
  return 'Rendah';
}

export const DEFAULT_PROGRAM_RISK_TEMPLATES: Omit<
  IcraProgramItem,
  'id' | 'created_at' | 'tahun' | 'total_score' | 'risk_level' | 'created_by'
>[] = [
  {
    kategori_risiko: 'Kewaspadaan Standar',
    masalah_risiko: 'Kepatuhan kebersihan tangan (Hand Hygiene) petugas di bawah target nasional < 85% terutama pada Momen 1 & 2',
    unit_terkait: 'Seluruh Ruangan',
    probability: 4,
    impact: 4,
    preparedness: 3,
    tujuan_umum: 'Meningkatkan kepatuhan Hand Hygiene menjadi >= 85%',
    strategi_poa: 'Audit rutin 5 momen tiap minggu, edukasi ulang per unit, dan jaminan stok handrub di setiap bed/troli',
    pj_pelaksana: 'IPCN & IPCLN Ruangan',
    target_waktu: 'Triwulan I - IV',
    evaluasi_status: 'Dalam Proses',
    catatan_evaluasi: 'Supervisi & umpan balik bulanan rutin berjalan',
  },
  {
    kategori_risiko: 'Surveilans & Bundles HAIs',
    masalah_risiko: 'Angka kejadian Phlebitis akibat pemasangan & perawatan infus belum sesuai teknik aseptik',
    unit_terkait: 'Ranap Dewasa',
    probability: 4,
    impact: 3,
    preparedness: 3,
    tujuan_umum: 'Menekan angka insiden Phlebitis <= 1,5‰',
    strategi_poa: 'Penyegaran teknik insersi aseptik, penggunaan transparent dressing, dan monitoring harian lokasi insersi setiap shift',
    pj_pelaksana: 'IPCN, Kepala Ruangan & IPCLN',
    target_waktu: 'Triwulan I - IV',
    evaluasi_status: 'Dalam Proses',
    catatan_evaluasi: '',
  },
  {
    kategori_risiko: 'Kewaspadaan Standar',
    masalah_risiko: 'Ketidakpatuhan penggunaan APD sesuai level risiko di area klinis dan penunjang',
    unit_terkait: 'IGD',
    probability: 3,
    impact: 4,
    preparedness: 2,
    tujuan_umum: 'Mencapai kepatuhan penggunaan APD sebesar 100%',
    strategi_poa: 'Monitoring ketersediaan fasilitas APD di setiap ruangan, pemasangan poster alur indikasi APD, dan audit harian',
    pj_pelaksana: 'IPCN & Penunjang Logistik',
    target_waktu: 'Triwulan I - IV',
    evaluasi_status: 'Dalam Proses',
    catatan_evaluasi: '',
  },
  {
    kategori_risiko: 'Kesehatan & Perlindungan Karyawan',
    masalah_risiko: 'Risiko tertusuk jarum suntik / benda tajam (Needle Stick Injury) akibat teknik recapping & safety box penuh > 3/4',
    unit_terkait: 'Seluruh Ruangan',
    probability: 3,
    impact: 5,
    preparedness: 3,
    tujuan_umum: 'Zero insiden pajanan benda tajam dan kepatuhan pembuangan safety box 100%',
    strategi_poa: 'Sosialisasi larangan recapping, pemasangan lembar alur pasca pajanan di setiap nurse station, dan monitoring safety box',
    pj_pelaksana: 'Tim PPI & Tim K3RS',
    target_waktu: 'Triwulan I - II',
    evaluasi_status: 'Belum Terlaksana',
    catatan_evaluasi: '',
  },
  {
    kategori_risiko: 'Surveilans & Bundles HAIs',
    masalah_risiko: 'Risiko Infeksi Saluran Kemih (ISK / CAUTI) pada pasien terpasang kateter urin menetap',
    unit_terkait: 'ICU',
    probability: 2,
    impact: 4,
    preparedness: 3,
    tujuan_umum: 'Menekan angka insiden ISK <= 4,7‰',
    strategi_poa: 'Penerapan ketat Bundle CAUTI (kaji ulang indikasi lepas kateter setiap hari, sistem drainase tertutup, fiksasi & hygiene meatus)',
    pj_pelaksana: 'IPCN & Tim Keperawatan ICU/Ranap',
    target_waktu: 'Triwulan I - IV',
    evaluasi_status: 'Dalam Proses',
    catatan_evaluasi: '',
  },
  {
    kategori_risiko: 'Surveilans & Bundles HAIs',
    masalah_risiko: 'Risiko Infeksi Daerah Operasi (IDO) pada tindakan operasi bersih dan bersih terkontaminasi',
    unit_terkait: 'IBS / Kamar Operasi',
    probability: 2,
    impact: 5,
    preparedness: 2,
    tujuan_umum: 'Menjaga insiden IDO <= 2%',
    strategi_poa: 'Audit Bundle IDO (pencukuran dengan clipper, antibiotik profilaksis <= 60 menit pre-insisi, kontrol suhu & gula darah, serta kontrol lalu lintas OK)',
    pj_pelaksana: 'Tim Bedah IBS & IPCN',
    target_waktu: 'Triwulan I - IV',
    evaluasi_status: 'Dalam Proses',
    catatan_evaluasi: '',
  },
  {
    kategori_risiko: 'Pengendalian Lingkungan & Limbah B3',
    masalah_risiko: 'Pemilahan limbah infeksius dan non-infeksius belum konsisten serta kebersihan TPS Limbah B3',
    unit_terkait: 'TPS Limbah B3',
    probability: 3,
    impact: 3,
    preparedness: 3,
    tujuan_umum: 'Kepatuhan pemilahan & pengangkutan limbah medis >= 95%',
    strategi_poa: 'Pelabelan ulang wadah sampah pedal kaki, pelatihan petugas CS, dan jadwal pengangkutan limbah max 3/4 penuh',
    pj_pelaksana: 'Kesling, CS & IPCN',
    target_waktu: 'Triwulan I - III',
    evaluasi_status: 'Dalam Proses',
    catatan_evaluasi: '',
  },
  {
    kategori_risiko: 'Sterilisasi, Dekontaminasi & Linen',
    masalah_risiko: 'Penyimpanan instrumen steril dan penatalaksanaan linen infeksius belum sepenuhnya terpisah di unit layanan',
    unit_terkait: 'CSSD',
    probability: 2,
    impact: 4,
    preparedness: 2,
    tujuan_umum: 'Sterilisasi tersentralisasi 100% dan kepatuhan pengelolaan linen 100%',
    strategi_poa: 'Supervisi berkala CSSD dan unit laundry, uji indikator biologi/kimia, dan monitoring suhu-kelembaban ruang simpan steril',
    pj_pelaksana: 'Kepala CSSD, Laundry & IPCN',
    target_waktu: 'Triwulan II - IV',
    evaluasi_status: 'Dalam Proses',
    catatan_evaluasi: '',
  },
];

// =========================================================================
// ICRA KONSTRUKSI / RENOVASI (STANDAR PERMENKES NO. 27 TAHUN 2017)
// =========================================================================

export const ICRA_CONSTRUCTION_GUIDELINE = {
  title: 'ICRA Renovasi / Konstruksi Gedung Baru',
  subtitle: 'Ringkasan Bab ICRA – Permenkes No. 27 Tahun 2017',
  definition:
    'Infection Control Risk Assessment (ICRA) adalah proses terdokumentasi yang dilakukan sebelum pemeliharaan, perbaikan, pembongkaran, konstruksi, maupun renovasi untuk mengetahui risiko dan dampaknya terhadap kualitas udara dengan mempertimbangkan potensi pajanan pada pasien.',
  purposes: [
    'Mengidentifikasi risiko infeksi akibat proyek konstruksi/renovasi',
    'Melindungi pasien, petugas, dan pengunjung',
    'Menjaga kualitas udara dan keamanan lingkungan pelayanan',
    'Menentukan tindakan pengendalian infeksi sebelum proyek dimulai',
  ],
  workflowSteps: [
    { step: 1, label: 'Identifikasi tipe/jenis konstruksi' },
    { step: 2, label: 'Identifikasi kelompok risiko pasien' },
    { step: 3, label: 'Gunakan matriks pengendalian infeksi' },
    { step: 4, label: 'Tetapkan kelas/tingkat kewaspadaan' },
    { step: 5, label: 'Tentukan tindakan pengendalian infeksi' },
    { step: 6, label: 'Lakukan pemantauan pelaksanaan' },
  ],
  importantNotes: [
    'ICRA penting dilakukan sebelum proyek dimulai, terutama bila area pelayanan pasien tetap beroperasi.',
    'Bila terdapat lebih dari satu kelompok pasien berisiko, pilih kelompok dengan tingkat risiko tertinggi.',
    'Pada semua kelas konstruksi, pasien harus dipindahkan saat pekerjaan dilakukan.',
  ],
};

export const CONSTRUCTION_TYPES: {
  code: ConstructionType;
  title: string;
  shortDesc: string;
  criteria: string;
  examples: string;
  items: string[];
}[] = [
  {
    code: 'A',
    title: 'Tipe A: Risiko Rendah (Debu Minimal)',
    shortDesc: 'Pemeriksaan konstruksi dengan risiko rendah (debu minimal)',
    criteria: 'Pemeriksaan konstruksi dengan risiko rendah (debu minimal), seperti:',
    examples: '• Pemindahan plafon untuk pemeriksaan visual.\n• Pengecatan (bukan pemlesteran).\n• Merapikan pekerjaan listrik, pemasangan pipa kecil, dan aktivitas tanpa menimbulkan debu.',
    items: [
      'Pemindahan plafon untuk pemeriksaan visual',
      'Pengecatan (bukan pemlesteran)',
      'Merapikan pekerjaan listrik, pemasangan pipa kecil, dan aktivitas tanpa menimbulkan debu',
    ],
  },
  {
    code: 'B',
    title: 'Tipe B: Skala Kecil, Durasi Pendek (Debu Minimal)',
    shortDesc: 'Kegiatan noninvasif skala kecil, durasi pendek, debu minimal',
    criteria: 'Kegiatan noninvasif skala kecil, durasi pendek, debu minimal, seperti:',
    examples: '• Instalasi kabel telepon/komputer.\n• Mengakses chase spaces.\n• Pemotongan dinding/plafon dengan penyebaran debu terkendali.',
    items: [
      'Instalasi kabel telepon/komputer',
      'Mengakses chase spaces',
      'Pemotongan dinding/plafon dengan penyebaran debu terkendali',
    ],
  },
  {
    code: 'C',
    title: 'Tipe C: Debu Tingkat Tinggi (Risiko Sedang–Tinggi)',
    shortDesc: 'Pembongkaran/perbaikan gedung dengan debu tingkat tinggi, risiko sedang–tinggi',
    criteria: 'Pembongkaran/perbaikan gedung dengan debu tingkat tinggi, risiko sedang–tinggi, seperti:',
    examples: '• Pemlesteran dinding, pemasangan lantai/plafon.\n• Konstruksi dinding baru.\n• Pekerjaan pipa kecil atau pemasangan listrik di atas plafon.\n• Pemasangan kabel besar.\n• Kegiatan tipe A, B, atau C yang tidak dapat diselesaikan dalam 1 shift.',
    items: [
      'Pemlesteran dinding, pemasangan lantai/plafon',
      'Konstruksi dinding baru',
      'Pekerjaan pipa kecil atau pemasangan listrik di atas plafon',
      'Pemasangan kabel besar',
      'Kegiatan tipe A, B, atau C yang tidak dapat diselesaikan dalam 1 shift',
    ],
  },
  {
    code: 'D',
    title: 'Tipe D: Skala Besar & Konstruksi Baru',
    shortDesc: 'Pembangunan/pembongkaran gedung skala besar',
    criteria: 'Pembangunan/pembongkaran gedung skala besar, seperti:',
    examples: '• Pembongkaran gedung secara besar-besaran.\n• Pemasangan/pemindahan sistem perkabelan.\n• Konstruksi baru atau pembangunan gedung baru.',
    items: [
      'Pembongkaran gedung secara besar-besaran',
      'Pemasangan/pemindahan sistem perkabelan',
      'Konstruksi baru atau pembangunan gedung baru',
    ],
  },
];

export const PATIENT_RISK_GROUPS: {
  code: PatientRiskGroup;
  title: string;
  riskLabel: string;
  areas: string;
  items: string[];
}[] = [
  {
    code: '1',
    title: 'Kelompok 1 (Risiko Rendah)',
    riskLabel: 'Rendah',
    areas: 'Area perkantoran administrasi.',
    items: ['Area perkantoran administrasi'],
  },
  {
    code: '2',
    title: 'Kelompok 2 (Risiko Sedang)',
    riskLabel: 'Sedang',
    areas: 'Fisioterapi, IRJ (Instalasi Rawat Jalan), IGH (Instalasi Gawat Husada), Instalasi gizi.',
    items: ['Fisioterapi', 'IRJ (Instalasi Rawat Jalan)', 'IGH (Instalasi Gawat Husada)', 'Instalasi gizi'],
  },
  {
    code: '3',
    title: 'Kelompok 3 (Risiko Tinggi)',
    riskLabel: 'Tinggi',
    areas: 'IGD, VK (Kamar Bersalin), Laboratorium (specimen), Poli bedah, IBS (Instalasi Bedah Sentral), Ruang perawatan pasien, IP2K, Stroke Unit, High Care, ICCU, UTD.',
    items: [
      'IGD',
      'VK (Kamar Bersalin)',
      'Laboratorium (specimen)',
      'Poli bedah',
      'IBS (Instalasi Bedah Sentral)',
      'Ruang perawatan pasien',
      'IP2K',
      'Stroke Unit',
      'High Care',
      'ICCU',
      'UTD',
    ],
  },
  {
    code: '4',
    title: 'Kelompok 4 (Risiko Sangat Tinggi)',
    riskLabel: 'Sangat Tinggi',
    areas: 'Area pasien immunocompromised, Unit luka bakar, Cath lab, ISSB, ICU, NICU/PICU, Ruang isolasi tekanan negatif, Onkologi, Ruang operasi.',
    items: [
      'Area pasien immunocompromised',
      'Unit luka bakar',
      'Cath lab',
      'ISSB',
      'ICU',
      'NICU/PICU',
      'Ruang isolasi tekanan negatif',
      'Onkologi',
      'Ruang operasi',
    ],
  },
];

export const PATIENT_RISK_NOTE =
  'Bila terdapat lebih dari satu kelompok pasien berisiko, pilih kelompok dengan tingkat risiko tertinggi. Pada semua kelas konstruksi, pasien harus dipindahkan saat pekerjaan dilakukan.';

export const CONSTRUCTION_MATRIX: Record<
  PatientRiskGroup,
  Record<ConstructionType, { classLevel: ConstructionClass; isAmbiguousIIIorIV?: boolean }>
> = {
  '1': {
    A: { classLevel: 'I' },
    B: { classLevel: 'II' },
    C: { classLevel: 'II' },
    D: { classLevel: 'III', isAmbiguousIIIorIV: true },
  },
  '2': {
    A: { classLevel: 'I' },
    B: { classLevel: 'II' },
    C: { classLevel: 'III' },
    D: { classLevel: 'IV' },
  },
  '3': {
    A: { classLevel: 'I' },
    B: { classLevel: 'II' },
    C: { classLevel: 'III', isAmbiguousIIIorIV: true },
    D: { classLevel: 'IV' },
  },
  '4': {
    A: { classLevel: 'II' },
    B: { classLevel: 'III', isAmbiguousIIIorIV: true },
    C: { classLevel: 'IV', isAmbiguousIIIorIV: true },
    D: { classLevel: 'IV' },
  },
};

export function getConstructionClass(
  riskGroup: PatientRiskGroup,
  type: ConstructionType
): { classLevel: ConstructionClass; isAmbiguousIIIorIV?: boolean } {
  return CONSTRUCTION_MATRIX[riskGroup]?.[type] || { classLevel: 'III' };
}

export const CONSTRUCTION_CLASS_CONTROLS: Record<
  ConstructionClass,
  {
    title: string;
    color: string;
    summary: string;
    duringItems: string[];
    afterItems: string[];
    items: string[];
  }
> = {
  I: {
    title: 'KELAS I (Tingkat Kewaspadaan I)',
    color: 'emerald',
    summary: 'Pekerjaan konstruksi dengan risiko rendah / debu minimal.',
    duringItems: [
      'Laksanakan pekerjaan dengan metode yang meminimalkan timbulnya debu dari aktivitas konstruksi.',
      'Segera pasang kembali plafon/dinding yang dibuka untuk pemeriksaan visual.',
    ],
    afterItems: [
      'Bersihkan area kerja dan lakukan pembersihan permukaan segera setelah pekerjaan selesai.',
    ],
    items: [
      '[Selama Konstruksi] Laksanakan pekerjaan dengan metode yang meminimalkan timbulnya debu dari aktivitas konstruksi.',
      '[Selama Konstruksi] Segera pasang kembali plafon/dinding yang dibuka untuk pemeriksaan visual.',
      '[Setelah Konstruksi] Bersihkan area kerja dan lakukan pembersihan permukaan segera setelah pekerjaan selesai.',
    ],
  },
  II: {
    title: 'KELAS II (Tingkat Kewaspadaan II)',
    color: 'amber',
    summary: 'Pengendalian debu aktif untuk mencegah penyebaran ke area pelayanan sekitar.',
    duringItems: [
      'Sediakan sarana aktif untuk mencegah penyebaran debu ke udara (misal penyemprotan kabut air).',
      'Segel pintu yang tidak terpakai dengan lakban/perekat rapat.',
      'Tutup dan isolasi kisi-kisi ventilasi udara serta kisi AC/HVAC sementara waktu.',
      'Tempatkan keset debu basah / sticky mat di pintu masuk dan keluar area kerja.',
      'Tutup wadah atau gerobak transportasi limbah saat pengangkutan.',
    ],
    afterItems: [
      'Lap seluruh permukaan kerja dengan cairan pembersih/disinfektan.',
      'Masukkan limbah konstruksi dalam wadah tertutup rapat sebelum dibuang.',
      'Lakukan pengepelan basah atau vakum HEPA sebelum meninggalkan area kerja.',
      'Pulihkan kembali sistem ventilasi/HVAC setelah pekerjaan selesai dan dinyatakan bersih.',
    ],
    items: [
      '[Selama Konstruksi] Sediakan sarana aktif untuk mencegah penyebaran debu ke udara (misal penyemprotan kabut air).',
      '[Selama Konstruksi] Segel pintu yang tidak terpakai dengan lakban/perekat rapat.',
      '[Selama Konstruksi] Tutup dan isolasi kisi-kisi ventilasi udara serta kisi AC/HVAC sementara waktu.',
      '[Selama Konstruksi] Tempatkan keset debu basah / sticky mat di pintu masuk dan keluar area kerja.',
      '[Selama Konstruksi] Tutup wadah atau gerobak transportasi limbah saat pengangkutan.',
      '[Setelah Konstruksi] Lap seluruh permukaan kerja dengan cairan pembersih/disinfektan.',
      '[Setelah Konstruksi] Masukkan limbah konstruksi dalam wadah tertutup rapat sebelum dibuang.',
      '[Setelah Konstruksi] Lakukan pengepelan basah atau vakum HEPA sebelum meninggalkan area kerja.',
      '[Setelah Konstruksi] Pulihkan kembali sistem ventilasi/HVAC setelah pekerjaan selesai dan dinyatakan bersih.',
    ],
  },
  III: {
    title: 'KELAS III (Tingkat Kewaspadaan III)',
    color: 'orange',
    summary: 'Isolasi sistem HVAC, pembatas area kerja / metode kontrol kubus, dan tekanan udara negatif HEPA.',
    duringItems: [
      'Mengisolasi sistem HVAC di area kerja untuk mencegah kontaminasi sistem saluran.',
      'Siapkan pembatas area kerja atau terapkan metode kontrol kubus (menutup area kerja dengan plastik dan menyegel dengan vakum HEPA untuk menyedot debu keluar) sebelum konstruksi dimulai.',
      'Menjaga tekanan udara negatif dalam tempat kerja dengan menggunakan unit penyaringan udara HEPA.',
      'Letakkan limbah konstruksi dalam wadah yang tertutup rapat sebelum dibuang.',
      'Tutup wadah atau gerobak transportasi limbah.',
    ],
    afterItems: [
      'Pembatas area kerja harus tetap dipasang sampai proyek selesai diperiksa oleh Komite K3, KPPI, dan dilakukan pembersihan oleh petugas kebersihan.',
      'Lakukan pembongkaran bahan-bahan pembatas area kerja dengan hati-hati untuk meminimalkan penyebaran kotoran dan puing-puing konstruksi.',
      'Vakum area kerja dengan penyaring HEPA.',
      'Lakukan pengepelan basah dengan pembersih/disinfektan.',
      'Setelah pekerjaan selesai, rapikan kembali sistem HVAC.',
    ],
    items: [
      '[Selama Konstruksi] Mengisolasi sistem HVAC di area kerja untuk mencegah kontaminasi sistem saluran.',
      '[Selama Konstruksi] Siapkan pembatas area kerja atau terapkan metode kontrol kubus (menutup area kerja dengan plastik dan menyegel dengan vakum HEPA untuk menyedot debu keluar) sebelum konstruksi dimulai.',
      '[Selama Konstruksi] Menjaga tekanan udara negatif dalam tempat kerja dengan menggunakan unit penyaringan udara HEPA.',
      '[Selama Konstruksi] Letakkan limbah konstruksi dalam wadah yang tertutup rapat sebelum dibuang.',
      '[Selama Konstruksi] Tutup wadah atau gerobak transportasi limbah.',
      '[Setelah Konstruksi] Pembatas area kerja harus tetap dipasang sampai proyek selesai diperiksa oleh Komite K3, KPPI, dan dilakukan pembersihan oleh petugas kebersihan.',
      '[Setelah Konstruksi] Lakukan pembongkaran bahan-bahan pembatas area kerja dengan hati-hati untuk meminimalkan penyebaran kotoran dan puing-puing konstruksi.',
      '[Setelah Konstruksi] Vakum area kerja dengan penyaring HEPA.',
      '[Setelah Konstruksi] Lakukan pengepelan basah dengan pembersih/disinfektan.',
      '[Setelah Konstruksi] Setelah pekerjaan selesai, rapikan kembali sistem HVAC.',
    ],
  },
  IV: {
    title: 'KELAS IV (Tingkat Kewaspadaan IV)',
    color: 'rose',
    summary: 'Isolasi maksimal, barier kedap udara, tekanan negatif HEPA, anteroom, dan penutup sepatu.',
    duringItems: [
      'Mengisolasi sistem HVAC di area kerja untuk mencegah kontaminasi sistem saluran.',
      'Siapkan pembatas area kerja atau terapkan metode kontrol kubus (menutup area kerja dengan plastik dan menyegel dengan vakum HEPA untuk menyedot debu keluar) sebelum konstruksi dimulai.',
      'Menjaga tekanan udara negatif dalam tempat kerja dengan menggunakan unit penyaringan udara HEPA.',
      'Menyegel lubang, pipa, dan saluran.',
      'Membuat anteroom dan mewajibkan semua personel untuk melewati ruangan ini sehingga mereka dapat disedot menggunakan vacuum cleaner HEPA sebelum meninggalkan tempat kerja atau mereka bisa memakai pakaian kerja yang lepas setiap kali mereka meninggalkan tempat kerja.',
      'Semua personil memasuki tempat kerja diwajibkan untuk memakai penutup sepatu. Sepatu harus diganti setiap kali keluar dari area kerja.',
    ],
    afterItems: [
      'Pembatas area kerja harus tetap dipasang sampai proyek selesai diperiksa oleh Komite K3, KPPI, dan dilakukan pembersihan oleh petugas kebersihan.',
      'Lakukan pembongkaran bahan-bahan pembatas area kerja dengan hati-hati untuk meminimalkan penyebaran kotoran dan puing-puing konstruksi.',
      'Letakkan limbah konstruksi dalam wadah yang tertutup rapat sebelum dibuang.',
      'Tutup wadah atau gerobak transportasi limbah.',
      'Vakum area kerja dengan penyaring HEPA.',
      'Lakukan pengepelan basah dengan pembersih/disinfektan.',
      'Setelah pekerjaan selesai, rapikan kembali sistem HVAC.',
    ],
    items: [
      '[Selama Konstruksi] Mengisolasi sistem HVAC di area kerja untuk mencegah kontaminasi sistem saluran.',
      '[Selama Konstruksi] Siapkan pembatas area kerja atau terapkan metode kontrol kubus (menutup area kerja dengan plastik dan menyegel dengan vakum HEPA untuk menyedot debu keluar) sebelum konstruksi dimulai.',
      '[Selama Konstruksi] Menjaga tekanan udara negatif dalam tempat kerja dengan menggunakan unit penyaringan udara HEPA.',
      '[Selama Konstruksi] Menyegel lubang, pipa, dan saluran.',
      '[Selama Konstruksi] Membuat anteroom dan mewajibkan semua personel untuk melewati ruangan ini sehingga mereka dapat disedot menggunakan vacuum cleaner HEPA sebelum meninggalkan tempat kerja atau mereka bisa memakai pakaian kerja yang lepas setiap kali mereka meninggalkan tempat kerja.',
      '[Selama Konstruksi] Semua personil memasuki tempat kerja diwajibkan untuk memakai penutup sepatu. Sepatu harus diganti setiap kali keluar dari area kerja.',
      '[Setelah Konstruksi] Pembatas area kerja harus tetap dipasang sampai proyek selesai diperiksa oleh Komite K3, KPPI, dan dilakukan pembersihan oleh petugas kebersihan.',
      '[Setelah Konstruksi] Lakukan pembongkaran bahan-bahan pembatas area kerja dengan hati-hati untuk meminimalkan penyebaran kotoran dan puing-puing konstruksi.',
      '[Setelah Konstruksi] Letakkan limbah konstruksi dalam wadah yang tertutup rapat sebelum dibuang.',
      '[Setelah Konstruksi] Tutup wadah atau gerobak transportasi limbah.',
      '[Setelah Konstruksi] Vakum area kerja dengan penyaring HEPA.',
      '[Setelah Konstruksi] Lakukan pengepelan basah dengan pembersih/disinfektan.',
      '[Setelah Konstruksi] Setelah pekerjaan selesai, rapikan kembali sistem HVAC.',
    ],
  },
};

export function toBool(v: any): boolean {
  return v === true || v === 1 || v === '1' || v === 'true';
}

export function normalizeStringArray(val: any): string[] {
  if (Array.isArray(val)) return val.filter((x) => typeof x === 'string' && x.trim().length > 0);
  if (typeof val === 'string' && val.trim().length > 0) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string' && x.trim().length > 0);
    } catch {
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export function normalizeChecklist(val: any, classLevel: ConstructionClass): IcraChecklistItem[] {
  if (Array.isArray(val) && val.length > 0) {
    return val.map((item, idx) => ({
      id: item?.id || `chk-${idx + 1}`,
      label: item?.label || String(item),
      checked: Boolean(item?.checked),
    }));
  }
  if (typeof val === 'string' && val.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          id: item?.id || `chk-${idx + 1}`,
          label: item?.label || String(item),
          checked: Boolean(item?.checked),
        }));
      }
    } catch {}
  }
  return CONSTRUCTION_CLASS_CONTROLS[classLevel].items.map((label, idx) => ({
    id: `cls-${classLevel}-${idx + 1}`,
    label,
    checked: true,
  }));
}

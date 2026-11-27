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

export type PrePostAnswer = 'YA' | 'TIDAK' | '';
export type IntraAnswer = 'YA' | 'TIDAK' | 'N/A' | '';

export interface IcraChecklistSignoff {
  ipsrs_nama?: string;
  ipsrs_paraf?: string;
  ipsrs_tanggal?: string;
  ppi_nama?: string;
  ppi_paraf?: string;
  ppi_tanggal?: string;
  kesling_nama?: string;
  kesling_paraf?: string;
  kesling_tanggal?: string;
  k3rs_nama?: string;
  k3rs_paraf?: string;
  k3rs_tanggal?: string;
  pihak3_nama?: string;
  pihak3_paraf?: string;
  pihak3_tanggal?: string;
}

export interface IcraPreFormItem {
  id: string;
  section: 'A' | 'B' | 'C' | 'D' | 'E';
  number?: string;
  label: string;
  answer: PrePostAnswer;
  tanggal?: string;
  keterangan?: string;
}

export interface IcraPreFormData {
  tanggal_survey: string;
  area: string;
  proyek: string;
  items: IcraPreFormItem[];
  signoffs: IcraChecklistSignoff;
}

export interface IcraIntraItemAnswer {
  id: string;
  no: number;
  kegiatan: string;
  answer: IntraAnswer;
  keterangan?: string;
}

export interface IcraPostFormItem {
  id: string;
  section: 'A' | 'B' | 'C' | 'D' | 'E';
  number?: string;
  label: string;
  subNotes?: string[];
  answer: PrePostAnswer;
  tanggal?: string;
  keterangan?: string;
}

export interface IcraPostFormData {
  tanggal_survey: string;
  area: string;
  proyek: string;
  items: IcraPostFormItem[];
  signoffs: IcraChecklistSignoff;
}

export interface IcraLocationPoint {
  id: string;
  uraian_pekerjaan: string;
  lokasi: string;
  area_terdampak?: string;
  tipe_konstruksi: ConstructionType;
  kelompok_risiko: PatientRiskGroup;
  kelas_tindakan: ConstructionClass;
  keterangan?: string;
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
  lokasi_rincian?: IcraLocationPoint[];
  foto_sebelum: string[];
  foto_sesudah: string[];
  status_proyek: 'Menunggu Izin' | 'Aktif Berjalan' | 'Selesai';
  nama_ipcn: string;
  nama_k3rs?: string;
  ttd_ipcn?: string | null;
  ttd_pelaksana?: string | null;
  pre_checklist?: IcraPreFormData | null;
  post_checklist?: IcraPostFormData | null;
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
  area_renovasi?: string;
  intra_items?: IcraIntraItemAnswer[] | null;
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
  'Rekam Medis',
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

// =========================================================================
// FORMULIR CEKLIST PRE, INTRA, DAN POST KONSTRUKSI (SESUAI MATRIKS & KELAS)
// =========================================================================

export function getPreChecklistSections(kelas: ConstructionClass): {
  section: 'A' | 'B' | 'C' | 'D' | 'E';
  title: string;
  subtitle?: string;
  isDirectQuestion?: boolean;
}[] {
  return [
    {
      section: 'A',
      title: 'A. Apakah konstruksi dapat mempengaruhi akses keluar area perawatan yang berbatasan dengan lokasi pembangunan?',
      isDirectQuestion: true,
    },
    {
      section: 'B',
      title: 'B. Apakah terdapat salah satu dari bahaya lingkungan di bawah ini?',
    },
    {
      section: 'C',
      title: 'C. Apakah salah satu dari sistem berikut ini dapat berdampak',
    },
    {
      section: 'D',
      title: 'D. Pengendalian Infeksi',
      subtitle: `Melakukan edukasi kepada manajer, staf medis, petugas kesehatan lingkungan (Kewaspadaan Kelas ${kelas})`,
    },
    {
      section: 'E',
      title: 'E. Keselamatan Jiwa',
    },
  ];
}

export function buildDefaultPreItems(kelas: ConstructionClass): IcraPreFormItem[] {
  const isHighClass = kelas === 'III' || kelas === 'IV';
  const isMediumOrHigh = kelas === 'II' || isHighClass;

  const base: IcraPreFormItem[] = [
    // Section A
    {
      id: 'pre-A-1',
      section: 'A',
      label: 'Apakah konstruksi dapat mempengaruhi akses keluar area perawatan yang berbatasan dengan lokasi pembangunan?',
      answer: '',
      tanggal: '',
    },
    // Section B
    { id: 'pre-B-1', section: 'B', number: '1.', label: 'Asbes', answer: '', tanggal: '' },
    { id: 'pre-B-2', section: 'B', number: '2.', label: 'Bahan kimia berbahaya', answer: '', tanggal: '' },
    { id: 'pre-B-3', section: 'B', number: '3.', label: 'Ruang sempit', answer: '', tanggal: '' },
    { id: 'pre-B-4', section: 'B', number: '4.', label: 'Lainnya (misalnya masalah struktur/kebisingan/getaran)', answer: '', tanggal: '' },
    // Section C
    { id: 'pre-C-1', section: 'C', number: '1.', label: 'Alarm kebakaran', answer: '', tanggal: '' },
    { id: 'pre-C-2', section: 'C', number: '2.', label: 'Sprinkler/penyemprot air', answer: '', tanggal: '' },
    { id: 'pre-C-3', section: 'C', number: '3.', label: 'Listrik', answer: '', tanggal: '' },
    { id: 'pre-C-4', section: 'C', number: '4.', label: 'Air domestic', answer: '', tanggal: '' },
    { id: 'pre-C-5', section: 'C', number: '5.', label: 'Oksigen', answer: '', tanggal: '' },
    { id: 'pre-C-6', section: 'C', number: '6.', label: 'Limbah', answer: '', tanggal: '' },
    { id: 'pre-C-7', section: 'C', number: '7.', label: 'Heating ventilation air', answer: '', tanggal: '' },
    // Section D (adapted by Kelas Kewaspadaan)
    {
      id: 'pre-D-1',
      section: 'D',
      number: '1.',
      label: 'Kontraktor diberikan salinan, pengelolaan bahan berbahaya, definisi kode darurat, dan dokumentasi lainnya',
      answer: 'YA',
      tanggal: '',
    },
    {
      id: 'pre-D-2',
      section: 'D',
      number: '2.',
      label: 'Dokumen tersebut dikaji bersama kontraktor',
      answer: 'YA',
      tanggal: '',
    },
    {
      id: 'pre-D-3',
      section: 'D',
      number: '3.',
      label: isHighClass
        ? 'Pengkajian lokasi dan metode pemasangan barrier debu kedap udara / kontrol kubus (Kelas III/IV)'
        : 'Pengkajian lokasi dan metode pemasangan barrier debu',
      answer: isMediumOrHigh ? 'YA' : '',
      tanggal: '',
    },
    {
      id: 'pre-D-4',
      section: 'D',
      number: '4.',
      label: 'Menilai efisiensi yang berkaitan dengan kemampuan',
      answer: 'YA',
      tanggal: '',
    },
    {
      id: 'pre-D-5',
      section: 'D',
      number: '5.',
      label: 'Terdapat peralatan untuk menangkap partikulat',
      answer: isMediumOrHigh ? 'YA' : '',
      tanggal: '',
    },
    {
      id: 'pre-D-6',
      section: 'D',
      number: '6.',
      label: 'Evaluasi rencana pembersihan dan pengendalian',
      answer: 'YA',
      tanggal: '',
    },
    {
      id: 'pre-D-7',
      section: 'D',
      number: '7.',
      label: 'Pengkajian dan evaluasi pola kontrol sirkulasi',
      answer: 'YA',
      tanggal: '',
    },
    {
      id: 'pre-D-8',
      section: 'D',
      number: '8.',
      label: 'Pengkajian pembatasan / larangan untuk kegiatan',
      answer: 'YA',
      tanggal: '',
    },
    {
      id: 'pre-D-9',
      section: 'D',
      number: '9.',
      label: 'Terdapat exhaust fan dan berfungsi dengan baik',
      answer: isMediumOrHigh ? 'YA' : '',
      tanggal: '',
    },
    {
      id: 'pre-D-10',
      section: 'D',
      number: '10.',
      label: 'Terdapat unit filtrasi HEPA di daerah perawatan pasien yang berdekatan dengan area konstruksi',
      answer: isHighClass ? 'YA' : 'TIDAK',
      tanggal: '',
    },
    {
      id: 'pre-D-11',
      section: 'D',
      number: '11.',
      label: 'Tersedianya ruang isolasi yang memadai',
      answer: isHighClass ? 'YA' : 'TIDAK',
      tanggal: '',
    },
  ];

  if (kelas === 'IV') {
    base.push(
      {
        id: 'pre-D-12',
        section: 'D',
        number: '12.',
        label: 'Persiapan anteroom serta penyegelan lubang, pipa, dan saluran (Wajib Kelas IV)',
        answer: 'YA',
        tanggal: '',
      },
      {
        id: 'pre-D-13',
        section: 'D',
        number: '13.',
        label: 'Ketersediaan penutup sepatu (shoe cover) dan vacuum HEPA di anteroom bagi pekerja (Wajib Kelas IV)',
        answer: 'YA',
        tanggal: '',
      }
    );
  }

  // Section E
  base.push(
    {
      id: 'pre-E-1',
      section: 'E',
      number: '1.',
      label: 'Apakah ada jalan keluar yang disetujui di blokir',
      answer: 'TIDAK',
      tanggal: '',
    },
    {
      id: 'pre-E-2',
      section: 'E',
      number: '2.',
      label: 'Apakah lalu lintas ke Emergency room di blokir? Jika ya, apakah itu kembali dialihkan?',
      answer: 'TIDAK',
      tanggal: '',
    },
    {
      id: 'pre-E-3',
      section: 'E',
      number: '3.',
      label: 'Apakah modifikasi signifikan terjadi untuk asap atau api dinding penghalang?',
      answer: 'TIDAK',
      tanggal: '',
    },
    {
      id: 'pre-E-4',
      section: 'E',
      number: '4.',
      label: 'Apakah proyek menambahkan selain struktur yang ada?',
      answer: 'TIDAK',
      tanggal: '',
    }
  );

  return base;
}

export function buildDefaultPreChecklist(proj: Partial<IcraKonstruksiItem>): IcraPreFormData {
  const kelas = (proj.kelas_tindakan || 'III') as ConstructionClass;
  const surveyDate = proj.tgl_mulai || new Date().toISOString().slice(0, 10);
  const ipcn = proj.nama_ipcn || 'Adi Tresa Purnama, A.M.Kep';
  return {
    tanggal_survey: surveyDate,
    area: proj.lokasi_area || '',
    proyek: proj.nama_proyek || '',
    items: buildDefaultPreItems(kelas),
    signoffs: {
      ipsrs_nama: '',
      ipsrs_paraf: '',
      ppi_nama: ipcn,
      ppi_paraf: proj.ttd_ipcn || '',
      kesling_nama: '',
      kesling_paraf: '',
      k3rs_nama: proj.nama_k3rs || '',
      k3rs_paraf: '',
      pihak3_nama: proj.pj_proyek || proj.kontraktor_pelaksana || '',
      pihak3_paraf: proj.ttd_pelaksana || '',
    },
  };
}

export function normalizePreChecklist(
  raw: any,
  proj: Partial<IcraKonstruksiItem>
): IcraPreFormData {
  const fallback = buildDefaultPreChecklist(proj);
  let parsed = raw;
  if (typeof raw === 'string' && raw.trim().startsWith('{')) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }
  if (!parsed || typeof parsed !== 'object') return fallback;

  const savedMap = new Map<string, IcraPreFormItem>();
  if (Array.isArray(parsed.items)) {
    parsed.items.forEach((it: any) => {
      if (it && it.id) savedMap.set(String(it.id), it);
    });
  }

  return {
    tanggal_survey: parsed.tanggal_survey || fallback.tanggal_survey,
    area: parsed.area || fallback.area,
    proyek: parsed.proyek || fallback.proyek,
    items: fallback.items.map((defItem) => {
      const saved = savedMap.get(defItem.id);
      if (!saved) return defItem;
      return {
        ...defItem,
        answer: (saved.answer === 'YA' || saved.answer === 'TIDAK' ? saved.answer : '') as PrePostAnswer,
        tanggal: saved.tanggal || '',
        keterangan: saved.keterangan ?? saved.tanggal ?? '',
      };
    }),
    signoffs: {
      ...fallback.signoffs,
      ...(parsed.signoffs || {}),
    },
  };
}

export function buildDefaultIntraItems(kelas: ConstructionClass): IcraIntraItemAnswer[] {
  let rows: string[] = [];

  if (kelas === 'I') {
    rows = [
      'Melaksanakan pekerjaan dengan metode yang meminimalkan timbulnya debu dari aktivitas konstruksi',
      'Segera memasang kembali plafon atau dinding yang dibuka untuk pemeriksaan visual',
      'Melakukan pembersihan harian area kerja dan koridor sekitar',
      'Memastikan pekerja menggunakan APD sesuai standar saat bekerja',
      'Melakukan pengecekan rutin oleh tim PPI terkait kepatuhan terhadap protokol',
      'Mengangkut limbah/sisa material dengan wadah tertutup',
    ];
  } else if (kelas === 'II') {
    rows = [
      'Menyediakan sarana aktif untuk mencegah penyebaran debu ke udara (misal penyemprotan kabut air)',
      'Menyegel pintu yang tidak terpakai dengan lakban/perekat rapat',
      'Menutup dan mengisolasi kisi-kisi ventilasi udara serta kisi AC/HVAC sementara waktu',
      'Menempatkan keset debu basah / sticky mat di pintu masuk dan keluar area kerja',
      'Melakukan pembersihan harian terhadap area luar barrier (koridor, jalur pasien)',
      'Memastikan pekerja menggunakan APD lengkap saat bekerja',
      'Melakukan pengecekan rutin oleh tim PPI terkait kepatuhan terhadap protokol',
      'Menutup wadah atau gerobak transportasi limbah saat pengangkutan',
      'Menyimpan bahan berbahaya (cat, semen, dll) di area aman dan terkunci',
    ];
  } else if (kelas === 'III') {
    rows = [
      'Menjaga barrier tetap tertutup rapat (atau metode kontrol kubus) dan area kerja tidak terbuka ke lingkungan pasien',
      'Mengisolasi sistem HVAC di area kerja untuk mencegah kontaminasi sistem saluran',
      'Menggunakan penyaring udara portabel (HEPA filter) dan menjaga tekanan udara negatif di area kerja',
      'Melakukan pembersihan harian terhadap area luar barrier (koridor, jalur pasien)',
      'Memastikan pekerja menggunakan APD lengkap saat bekerja',
      'Melakukan pengecekan rutin oleh tim PPI terkait kepatuhan terhadap protokol',
      'Mengangkut puing dan material menggunakan jalur khusus dan wadah tertutup',
      'Menyediakan dan mengganti keset disinfektan di pintu masuk area kerja secara berkala',
      'Menghindari pekerjaan yang menimbulkan debu berlebih saat pasien berada di ruangan',
      'Menyimpan bahan berbahaya (cat, semen, dll) di area aman dan terkunci',
    ];
  } else {
    // Kelas IV
    rows = [
      'Menjaga barrier kedap udara tetap tertutup rapat (metode kontrol kubus) dan area kerja terisolasi penuh',
      'Mengisolasi sistem HVAC di area kerja untuk mencegah kontaminasi sistem saluran',
      'Menggunakan penyaring udara portabel (HEPA filter) dan menjaga tekanan udara negatif dalam tempat kerja',
      'Menyegel seluruh lubang, pipa, dan saluran yang berpotensi menyebarkan debu',
      'Memastikan anteroom berfungsi serta semua personel divakum HEPA atau melepas pakaian kerja saat keluar area',
      'Memastikan semua personel memakai penutup sepatu (shoe cover) dan menggantinya setiap keluar dari area kerja',
      'Melakukan pembersihan harian terhadap area luar barrier (koridor, jalur pasien)',
      'Memastikan pekerja menggunakan APD lengkap saat bekerja',
      'Melakukan pengecekan rutin oleh tim PPI terkait kepatuhan terhadap protokol',
      'Mengangkut puing dan material menggunakan jalur khusus dan wadah tertutup',
      'Menyediakan dan mengganti keset disinfektan di pintu masuk area kerja secara berkala',
      'Menghindari pekerjaan yang menimbulkan debu berlebih saat pasien berada di ruangan',
      'Menyimpan bahan berbahaya (cat, semen, dll) di area aman dan terkunci',
    ];
  }

  return rows.map((kegiatan, idx) => ({
    id: `intra-${kelas}-${idx + 1}`,
    no: idx + 1,
    kegiatan,
    answer: 'YA',
    keterangan: '',
  }));
}

export function normalizeIntraItems(raw: any, kelas: ConstructionClass): IcraIntraItemAnswer[] {
  const fallback = buildDefaultIntraItems(kelas);
  let parsed = raw;
  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return fallback;

  // Preserve saved class-specific items directly when valid
  if (parsed[0] && typeof parsed[0].kegiatan === 'string' && parsed[0].kegiatan.trim().length > 0) {
    return parsed.map((it: any, idx: number) => ({
      id: String(it.id || `intra-${kelas}-${idx + 1}`),
      no: Number(it.no) || idx + 1,
      kegiatan: String(it.kegiatan),
      answer: (it.answer === 'YA' || it.answer === 'TIDAK' || it.answer === 'N/A' ? it.answer : 'YA') as IntraAnswer,
      keterangan: it.keterangan ? String(it.keterangan) : '',
    }));
  }

  const mapById = new Map<string, any>();
  parsed.forEach((it: any) => {
    if (it && it.id) mapById.set(String(it.id), it);
  });

  return fallback.map((defItem, idx) => {
    const saved = mapById.get(defItem.id) || parsed[idx];
    if (!saved) return defItem;
    const ans = saved.answer === 'YA' || saved.answer === 'TIDAK' || saved.answer === 'N/A' ? saved.answer : 'YA';
    return {
      ...defItem,
      answer: ans as IntraAnswer,
      keterangan: saved.keterangan || '',
    };
  });
}

export function getPostChecklistSections(kelas: ConstructionClass): {
  section: 'A' | 'B' | 'C' | 'D' | 'E';
  title: string;
}[] {
  return [
    { section: 'A', title: `A. Penyelesaian proyek (Kewaspadaan Kelas ${kelas})` },
    { section: 'B', title: 'B. Apakah sistem berikut ini diuji dan berfungsi dengan baik?' },
    { section: 'C', title: 'C. Lingkungan' },
    { section: 'D', title: 'D. Isolation Barrier' },
    { section: 'E', title: 'E. Pengendalian Infeksi' },
  ];
}

export function buildDefaultPostItems(kelas: ConstructionClass): IcraPostFormItem[] {
  const isHighClass = kelas === 'III' || kelas === 'IV';

  const sectionA: IcraPostFormItem[] = [
    {
      id: 'post-A-1',
      section: 'A',
      number: '1.',
      label: 'Melakukan pembersihan akhir menyeluruh area proyek dan sekitarnya dengan disinfektan standar',
      answer: 'YA',
      tanggal: '',
    },
    {
      id: 'post-A-2',
      section: 'A',
      number: '2.',
      label: isHighClass
        ? 'Melakukan pemeriksaan kualitas udara dan kebersihan permukaan oleh tim PPI'
        : 'Melakukan pemeriksaan kebersihan permukaan area kerja oleh tim PPI',
      answer: 'YA',
      tanggal: '',
    },
    {
      id: 'post-A-3',
      section: 'A',
      number: '3.',
      label: 'Melakukan pemeriksaan fungsi sanitasi dan plumbing (air mengalir, tidak bocor, dll)',
      answer: 'YA',
      tanggal: '',
    },
    {
      id: 'post-A-4',
      section: 'A',
      number: '4.',
      label: 'Melakukan serah terima pekerjaan renovasi/konstruksi dari kontraktor ke pihak rumah sakit',
      answer: 'YA',
      tanggal: '',
    },
    {
      id: 'post-A-5',
      section: 'A',
      number: '5.',
      label: 'Memberikan edukasi kepada staf ruangan mengenai cara menjaga kebersihan area baru',
      answer: 'YA',
      tanggal: '',
    },
    {
      id: 'post-A-6',
      section: 'A',
      number: '6.',
      label: 'Membuka akses area setelah dinyatakan aman dan bersih oleh PPI',
      answer: 'YA',
      tanggal: '',
    },
    {
      id: 'post-A-7',
      section: 'A',
      number: '7.',
      label: 'Menyimpan dokumentasi proyek dan laporan ICRA untuk keperluan audit dan akreditasi',
      answer: 'YA',
      tanggal: '',
    },
    {
      id: 'post-A-8',
      section: 'A',
      number: '8.',
      label: 'Melakukan evaluasi pasca konstruksi/renovasi untuk menilai efektivitas pengendalian infeksi selama pekerjaan',
      answer: 'YA',
      tanggal: '',
    },
  ];

  if (kelas === 'II' || isHighClass) {
    sectionA.push({
      id: 'post-A-9',
      section: 'A',
      number: '9.',
      label: 'Setelah pekerjaan selesai, sistem ventilasi / HVAC dirapikan dan dipulihkan kembali',
      answer: 'YA',
      tanggal: '',
    });
  }

  const sectionB: IcraPostFormItem[] = [
    {
      id: 'post-B-1',
      section: 'B',
      number: '1.',
      label: 'Alarm kebakaran – lepaskan penutup detektor dan lakukan pengujian dari panel kontrol',
      answer: 'YA',
      tanggal: '',
    },
    {
      id: 'post-B-2',
      section: 'B',
      number: '2.',
      label: 'Listrik – pengujian switch tombol dan pengontrol',
      answer: 'YA',
      tanggal: '',
    },
    {
      id: 'post-B-3',
      section: 'B',
      number: '3.',
      label: 'Sumber air di buka dan di cek suhu',
      answer: 'YA',
      tanggal: '',
    },
    {
      id: 'post-B-4',
      section: 'B',
      number: '4.',
      label: 'Gas medis',
      answer: 'YA',
      tanggal: '',
    },
    {
      id: 'post-B-5',
      section: 'B',
      number: '5.',
      label: 'Limbah – hilangkan sumbatan',
      answer: 'YA',
      tanggal: '',
    },
  ];

  const sectionC: IcraPostFormItem[] = [
    {
      id: 'post-C-1',
      section: 'C',
      number: '1.',
      label: 'Bersihkan puing-puing, peralatan, perlengkapan dan bahan-bahan bangunan',
      answer: 'YA',
      tanggal: '',
    },
    {
      id: 'post-C-2',
      section: 'C',
      number: '2.',
      label: isHighClass
        ? 'Melakukan vakum dengan penyaring HEPA dan pembersihan permukaan di semua area konstruksi untuk menghilangkan debu'
        : 'Melakukan vakum dan melakukan pembersihan permukaan di semua area konstruksi untuk menghilangkan debu',
      answer: isHighClass ? 'YA' : '',
      tanggal: '',
    },
  ];

  const sectionD: IcraPostFormItem[] = [
    {
      id: 'post-D-1',
      section: 'D',
      number: '1.',
      label: 'Pelindung harus dipindahkan dengan hati-hati untuk meminimalkan penyebaran kotoran dan puing-puing (setelah diperiksa Komite K3 & KPPI)',
      answer: kelas === 'I' ? 'TIDAK' : 'YA',
      tanggal: '',
    },
    {
      id: 'post-D-2',
      section: 'D',
      number: '2.',
      label: 'Pelindung harus di lap basah, di sedot dengan HEPA',
      answer: isHighClass ? 'YA' : 'TIDAK',
      tanggal: '',
    },
  ];

  const sectionE: IcraPostFormItem[] = [
    {
      id: 'post-E-1',
      section: 'E',
      number: '1.',
      label: 'Setelah selesai pembangunan / renovasi ruang berisiko tinggi / mikrobiologi dilakukan kultur lingkungan (dengan pihak terkait, pihak K3 dan pemborong bangunan):',
      subNotes: [
        'Perlu ada kesepakatan di awal untuk uji kultur lingkungan setelah renovasi siapa yang akan membiayai uji kultur',
      ],
      answer: kelas === 'IV' ? 'YA' : 'TIDAK',
      tanggal: '',
    },
    {
      id: 'post-E-2',
      section: 'E',
      number: '2.',
      label: 'Periksa daerah konstruksi setelah pembersihan akhir dan menyetujui penggunaannya:',
      subNotes: [
        'Ruang berisiko tinggi / mikrobiologi belum bisa digunakan apabila belum dilakukan general cleaning dan di uji kultur kualitas udara',
      ],
      answer: kelas === 'IV' ? 'YA' : 'TIDAK',
      tanggal: '',
    },
  ];

  return [...sectionA, ...sectionB, ...sectionC, ...sectionD, ...sectionE];
}

export function buildDefaultPostChecklist(proj: Partial<IcraKonstruksiItem>): IcraPostFormData {
  const kelas = (proj.kelas_tindakan || 'III') as ConstructionClass;
  const surveyDate = proj.tgl_selesai_estimasi || new Date().toISOString().slice(0, 10);
  const ipcn = proj.nama_ipcn || 'Adi Tresa Purnama, A.M.Kep';
  return {
    tanggal_survey: surveyDate,
    area: proj.lokasi_area || '',
    proyek: proj.nama_proyek || '',
    items: buildDefaultPostItems(kelas),
    signoffs: {
      ipsrs_nama: '',
      ipsrs_paraf: '',
      ppi_nama: ipcn,
      ppi_paraf: proj.ttd_ipcn || '',
      kesling_nama: '',
      kesling_paraf: '',
      k3rs_nama: proj.nama_k3rs || '',
      k3rs_paraf: '',
      pihak3_nama: proj.pj_proyek || proj.kontraktor_pelaksana || '',
      pihak3_paraf: proj.ttd_pelaksana || '',
    },
  };
}

export function normalizePostChecklist(
  raw: any,
  proj: Partial<IcraKonstruksiItem>
): IcraPostFormData {
  const fallback = buildDefaultPostChecklist(proj);
  let parsed = raw;
  if (typeof raw === 'string' && raw.trim().startsWith('{')) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }
  if (!parsed || typeof parsed !== 'object') return fallback;

  const savedMap = new Map<string, IcraPostFormItem>();
  if (Array.isArray(parsed.items)) {
    parsed.items.forEach((it: any) => {
      if (it && it.id) savedMap.set(String(it.id), it);
    });
  }

  return {
    tanggal_survey: parsed.tanggal_survey || fallback.tanggal_survey,
    area: parsed.area || fallback.area,
    proyek: parsed.proyek || fallback.proyek,
    items: fallback.items.map((defItem) => {
      const saved = savedMap.get(defItem.id);
      if (!saved) return defItem;
      return {
        ...defItem,
        answer: (saved.answer === 'YA' || saved.answer === 'TIDAK' ? saved.answer : '') as PrePostAnswer,
        tanggal: saved.tanggal || '',
        keterangan: saved.keterangan ?? saved.tanggal ?? '',
      };
    }),
    signoffs: {
      ...fallback.signoffs,
      ...(parsed.signoffs || {}),
    },
  };
}

export function normalizeLocationPoints(raw: any): IcraLocationPoint[] {
  let parsed = raw;
  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = [];
    }
  }
  if (!Array.isArray(parsed)) return [];

  const validTypes = new Set<ConstructionType>(['A', 'B', 'C', 'D']);
  const validRisks = new Set<PatientRiskGroup>(['1', '2', '3', '4']);
  const validClasses = new Set<ConstructionClass>(['I', 'II', 'III', 'IV']);

  return parsed
    .filter((item) => item && typeof item === 'object')
    .map((item, idx) => {
      const tipe: ConstructionType = validTypes.has(item.tipe_konstruksi)
        ? item.tipe_konstruksi
        : 'C';
      const risk: PatientRiskGroup = validRisks.has(String(item.kelompok_risiko) as PatientRiskGroup)
        ? (String(item.kelompok_risiko) as PatientRiskGroup)
        : '3';
      const kelas: ConstructionClass = validClasses.has(item.kelas_tindakan)
        ? item.kelas_tindakan
        : getConstructionClass(risk, tipe).classLevel;
      return {
        id: String(item.id || `loc_${idx + 1}`),
        uraian_pekerjaan: String(item.uraian_pekerjaan || ''),
        lokasi: String(item.lokasi || ''),
        area_terdampak: item.area_terdampak ? String(item.area_terdampak).trim() : '',
        tipe_konstruksi: tipe,
        kelompok_risiko: risk,
        kelas_tindakan: kelas,
        keterangan: item.keterangan ? String(item.keterangan) : '',
      };
    })
    .filter(
      (pt) =>
        pt.uraian_pekerjaan.trim() !== '' ||
        pt.lokasi.trim() !== '' ||
        (pt.area_terdampak || '').trim() !== ''
    );
}

/**
 * Memecah string lokasi_area (dipisahkan koma) menjadi array unit unik yang rapi.
 */
export function parseSelectedLocations(raw?: string): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of raw.split(',')) {
    const clean = part.trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(clean);
    }
  }
  return result;
}

/**
 * Menggabungkan array unit lokasi terpilih menjadi string tersimpan pada kolom lokasi_area.
 */
export function formatSelectedLocations(locations: string[]): string {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of locations) {
    const clean = item.trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(clean);
    }
  }
  return result.join(', ');
}

/**
 * Merangkum area terdampak sekitar dari seluruh daftar titik lokasi (deduplikasi tanpa mengubah kapitalisasi awal).
 */
export function summarizeAreaTerdampakFromLocations(points: IcraLocationPoint[]): string {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const pt of points) {
    const raw = (pt.area_terdampak || '').trim();
    if (!raw) continue;
    for (const seg of raw.split(/[,;]+/)) {
      const clean = seg.trim();
      if (!clean) continue;
      const key = clean.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(clean);
      }
    }
  }
  return result.join(', ');
}

const TYPE_RANK: Record<ConstructionType, number> = { A: 1, B: 2, C: 3, D: 4 };
const RISK_RANK: Record<PatientRiskGroup, number> = { '1': 1, '2': 2, '3': 3, '4': 4 };
const CLASS_RANK: Record<ConstructionClass, number> = { I: 1, II: 2, III: 3, IV: 4 };

/**
 * Menentukan Tipe, Kelompok Risiko, dan Kelas Kewaspadaan tertinggi dari daftar titik lokasi
 * sesuai prinsip Highest Risk Governs pada Pedoman ICRA Permenkes No. 27 Tahun 2017.
 */
export function computeHighestRiskFromLocations(
  points: IcraLocationPoint[]
): {
  tipe_konstruksi: ConstructionType;
  kelompok_risiko: PatientRiskGroup;
  kelas_tindakan: ConstructionClass;
} | null {
  const valid = points.filter(
    (pt) => pt.uraian_pekerjaan.trim() !== '' || pt.lokasi.trim() !== ''
  );
  if (valid.length === 0) return null;

  let maxType: ConstructionType = 'A';
  let maxRisk: PatientRiskGroup = '1';
  let maxPointClass: ConstructionClass = 'I';

  for (const pt of valid) {
    if (TYPE_RANK[pt.tipe_konstruksi] > TYPE_RANK[maxType]) {
      maxType = pt.tipe_konstruksi;
    }
    if (RISK_RANK[pt.kelompok_risiko] > RISK_RANK[maxRisk]) {
      maxRisk = pt.kelompok_risiko;
    }
    if (CLASS_RANK[pt.kelas_tindakan] > CLASS_RANK[maxPointClass]) {
      maxPointClass = pt.kelas_tindakan;
    }
  }

  const matrixClass = getConstructionClass(maxRisk, maxType).classLevel;
  const finalClass =
    CLASS_RANK[maxPointClass] >= CLASS_RANK[matrixClass]
      ? maxPointClass
      : matrixClass;

  return {
    tipe_konstruksi: maxType,
    kelompok_risiko: maxRisk,
    kelas_tindakan: finalClass,
  };
}

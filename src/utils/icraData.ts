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
// ICRA KONSTRUKSI / RENOVASI (MATRIKS PMK NO. 27 TAHUN 2017 & APIC)
// =========================================================================

export const CONSTRUCTION_TYPES: {
  code: ConstructionType;
  title: string;
  shortDesc: string;
  examples: string;
}[] = [
  {
    code: 'A',
    title: 'Tipe A: Inspeksi & Non-Invasif',
    shortDesc: 'Pekerjaan tidak menimbulkan debu atau sangat minimal.',
    examples: 'Membuka panel plafon untuk pemeriksaan visual (< 1 petak per 5 m²), pengecatan ringan (tanpa amplas), perbaikan listrik/pipa minor tanpa memotong dinding.',
  },
  {
    code: 'B',
    title: 'Tipe B: Skala Kecil & Durasi Singkat',
    shortDesc: 'Pekerjaan menimbulkan debu dalam jumlah minimal dan durasi pendek.',
    examples: 'Pemasangan kabel telepon/komputer menembus dinding, akses ke ruang utilitas tertutup, pengamplasan dinding area sempit yang dapat dikontrol debunya.',
  },
  {
    code: 'C',
    title: 'Tipe C: Debu Sedang - Tinggi / Pembongkaran Terbatas',
    shortDesc: 'Menimbulkan debu sedang–tinggi atau pembongkaran komponen bangunan.',
    examples: 'Pengamplasan luas untuk cat/wallcover, pembongkaran keramik lantai, bongkar plafon > 1 petak, bobok dinding partisi, perbaikan saluran ducting AC/HVAC.',
  },
  {
    code: 'D',
    title: 'Tipe D: Pembongkaran Besar & Konstruksi Baru',
    shortDesc: 'Proyek pembongkaran besar atau pembangunan gedung/ruang baru.',
    examples: 'Pembongkaran struktur dinding lengkap, renovasi total satu bangsal/ruangan, konstruksi gedung baru bertingkat atau perluasan instalasi.',
  },
];

export const PATIENT_RISK_GROUPS: {
  code: PatientRiskGroup;
  title: string;
  riskLabel: string;
  areas: string;
}[] = [
  {
    code: '1',
    title: 'Kelompok 1 (Risiko Rendah)',
    riskLabel: 'Rendah',
    areas: 'Area perkantoran, administrasi, manajemen, ruang rapat, ruang arsip, koridor non-klinis.',
  },
  {
    code: '2',
    title: 'Kelompok 2 (Risiko Sedang)',
    riskLabel: 'Sedang',
    areas: 'Area rawat jalan/poliklinik umum, ruang tunggu pasien, rehabilitasi medik, area radiologi non-intervensi, pendaftaran.',
  },
  {
    code: '3',
    title: 'Kelompok 3 (Risiko Tinggi)',
    riskLabel: 'Tinggi',
    areas: 'IGD, Ruang Rawat Inap Umum (Dewasa, Anak, Kebidanan, Bedah), Laboratorium Klinik, Farmasi non-steril, Kamar Jenazah.',
  },
  {
    code: '4',
    title: 'Kelompok 4 (Risiko Tertinggi)',
    riskLabel: 'Tertinggi',
    areas: 'Kamar Operasi (IBS), ICU / HCU / NICU / PICU, CSSD / Sterilisasi, Ruang Isolasi Airborne, Unit Hemodialisa, Pasien Immunocompromised, Kemoterapi.',
  },
];

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
    items: string[];
  }
> = {
  I: {
    title: 'KELAS I (Pengendalian Minimal / Ringan)',
    color: 'emerald',
    summary: 'Pekerjaan non-invasif dengan risiko penyebaran debu minimal. Tetap wajib pembersihan pasca kerja.',
    items: [
      'Lakukan pekerjaan dengan metode yang meminimalkan timbulnya debu.',
      'Segera pasang kembali panel plafon/dinding yang dibuka setelah inspeksi visual selesai.',
      'Bersihkan seluruh permukaan kerja dan lantai segera setelah pekerjaan selesai.',
    ],
  },
  II: {
    title: 'KELAS II (Pengendalian Debu Aktif)',
    color: 'amber',
    summary: 'Wajib mencegah sebaran debu ke udara, menutup akses tidak terpakai, dan menggunakan keset debu.',
    items: [
      'Terapkan metode aktif pengendalian debu agar tidak menyebar ke udara (misal penyemprotan kabut air saat memotong).',
      'Tutup dan segel pintu penghubung yang tidak digunakan dengan lakban/perekat rapat.',
      'Tutup/blokir seluruh lubang ventilasi udara dan kisi AC sementara waktu.',
      'Sediakan keset basah / keset perekat debu (dust mat) di pintu masuk dan keluar area kerja.',
      'Lap seluruh permukaan kerja dengan cairan disinfektan atau vakum HEPA di akhir shift.',
      'Angkut puing/limbah konstruksi menggunakan wadah tertutup rapat sebelum keluar proyek.',
      'Lepaskan isolasi ventilasi dan segel pintu setelah area dinyatakan bersih.',
    ],
  },
  III: {
    title: 'KELAS III (Isolasi Barier Ketat & Tekanan Negatif)',
    color: 'orange',
    summary: 'Wajib memasang barier kedap debu lantai-ke-plafon, mengisolasi HVAC, dan mempertahankan tekanan negatif.',
    items: [
      'Isolasi penuh sistem tata udara (HVAC/AC) di area kerja untuk mencegah kontaminasi udara ke ruang klinis.',
      'Pasang partisi / barier debu kedap udara (plastik/triplek bersegel rapat dari lantai hingga plafon) sebelum pekerjaan dimulai.',
      'Pertahankan tekanan udara negatif di dalam area kerja menggunakan mesin filtrasi HEPA portabel / exhaust terfilter.',
      'Jangan membuka atau membongkar barier hingga proyek selesai 100%, dibersihkan menyeluruh, dan diperiksa Tim PPI.',
      'Sediakan keset basah/sticky mat di pintu masuk-keluar pekerja dan bersihkan debu pada alas kaki/pakaian kerja.',
      'Angkut material dan limbah konstruksi dalam troli/wadah tertutup rapat melalui jalur khusus di luar jam padat pasien.',
      'Lakukan pembersihan terminal (vakum HEPA dan pel basah disinfektan) sebelum barier dilepas.',
    ],
  },
  IV: {
    title: 'KELAS IV (Isolasi Maksimal, Anteroom & Pengawasan Harian Wajib)',
    color: 'rose',
    summary: 'Risiko penularan infeksi jamur/Aspergillus sangat tinggi. Wajib Anteroom, tekanan negatif kontinu, APD penuh pekerja, dan inspeksi ketat IPCN.',
    items: [
      'Seluruh persyaratan Kelas III (isolasi HVAC total, barier kedap udara lantai-plafon, tekanan negatif HEPA kontinu) WAJIB diterapkan penuh.',
      'Segel seluruh lubang pipa, celah listrik, dan penetrasi dinding secara kedap udara tanpa celah.',
      'Wajib menyediakan Ruang Antara (Anteroom) di pintu akses area kerja; seluruh pekerja wajib membersihkan debu (vakum HEPA) dan melepas APD/baju pelindung di anteroom sebelum keluar.',
      'Seluruh pekerja konstruksi wajib menggunakan APD lengkap (pakaian pelindung/coverall, penutup kepala, masker N95/medis, penutup sepatu) saat berada di zona proyek.',
      'Gunakan troli tertutup rapat yang disegel lakban dan bersihkan roda troli sebelum keluar dari zona anteroom.',
      'Jalur pembuangan puing harus terpisah total dari jalur pasien, alat steril, dan makanan RS.',
      'DILARANG keras membongkar barier sebelum dilakukan terminal cleaning menyeluruh, pembersihan sistem ventilasi, serta dinyatakan LULUS inspeksi tertulis oleh IPCN.',
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

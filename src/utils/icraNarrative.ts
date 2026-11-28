import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  IcraKonstruksiItem,
  IcraMonitoringItem,
  IcraLocationPoint,
  ConstructionType,
  PatientRiskGroup,
  ConstructionClass,
  CONSTRUCTION_TYPES,
  PATIENT_RISK_GROUPS,
  CONSTRUCTION_CLASS_CONTROLS,
  CONSTRUCTION_MATRIX,
  normalizeLocationPoints,
  summarizeAreaTerdampakFromLocations,
} from './icraData';

export const RISK_ROMAN: Record<PatientRiskGroup, string> = {
  '1': 'I',
  '2': 'II',
  '3': 'III',
  '4': 'IV',
};

const PRESERVED_ACRONYMS = new Set([
  'RSUD',
  'UOBK',
  'RS',
  'PPI',
  'KPPI',
  'ICRA',
  'IPCN',
  'IPCLN',
  'IPSRS',
  'IPRS',
  'K3RS',
  'K3',
  'IGD',
  'IGH',
  'IRJ',
  'ICU',
  'ICCU',
  'NICU',
  'PICU',
  'HCU',
  'IBS',
  'ISSB',
  'CSSD',
  'UTD',
  'IP2K',
  'VK',
  'TPS',
  'B3',
  'APD',
  'HEPA',
  'HVAC',
  'AC',
  'WC',
  'SPO',
  'SOP',
  'SDM',
  'STARKES',
  'PMK',
  'I',
  'II',
  'III',
  'IV',
]);

const PROPER_NOUNS: Record<string, string> = {
  'al-mulk': 'Al-Mulk',
  almulk: 'Al-Mulk',
  sukabumi: 'Sukabumi',
  fatimah: 'Fatimah',
  khadijah: 'Khadijah',
  aisyah: 'Aisyah',
  aisayh: 'Aisyah',
  usman: 'Usman',
  hais: 'HAIs',
};

function isAreaOverlappingLocation(lokasiText: string, areaText: string): boolean {
  if (!lokasiText || !areaText) return false;
  const extractTokens = (text: string) =>
    text
      .toLowerCase()
      .replace(/[/–—,&()]/g, ' ')
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z0-9]/g, ''))
      .filter((w) => w.length >= 3 && !['dan', 'serta', 'area', 'ruang', 'gedung', 'atau'].includes(w));

  const locTokens = new Set(extractTokens(lokasiText));
  const areaTokens = extractTokens(areaText);
  if (areaTokens.length === 0 || locTokens.size === 0) return false;

  const matched = areaTokens.filter((token) => locTokens.has(token)).length;
  return matched / areaTokens.length >= 0.45;
}

// Multi-word building / hospital unit names that should keep capital initials mid-sentence
const PROPER_PHRASES: Array<[RegExp, (substring: string, ...args: string[]) => string]> = [
  [/\buobk\s+rsud\s+al[-\s]?mulk(\s+kota\s+sukabumi)?/gi, (_, suffix) => `UOBK RSUD Al-Mulk${suffix ? ' Kota Sukabumi' : ''}`],
  [/\bkota\s+sukabumi\b/gi, () => 'Kota Sukabumi'],
  [/\bgedung\s+koperasi\b/gi, () => 'Gedung Koperasi'],
  [/\bgedung\s+([a-z0-9]+)\b/gi, (_, name) => `Gedung ${formatWordSmart(name, true)}`],
  [/\branap\s+(aisyah|aisayh|fatimah|khadijah|usman|dewasa|anak|kebidanan|bedah)\b/gi, (_, name) => `Ranap ${formatWordSmart(name, true)}`],
  [/\bruang\s+isolasi\b/gi, () => 'Ruang Isolasi'],
  [/\bkamar\s+operasi\b/gi, () => 'Kamar Operasi'],
  [/\bkamar\s+bersalin\b/gi, () => 'Kamar Bersalin'],
  [/\bkamar\s+jenazah\b/gi, () => 'Kamar Jenazah'],
  [/\bstroke\s+unit\b/gi, () => 'Stroke Unit'],
  [/\bhigh\s+care\b/gi, () => 'High Care'],
  [/\brawat\s+jalan\b/gi, () => 'Rawat Jalan'],
  [/\brawat\s+inap\b/gi, () => 'Rawat Inap'],
  [/\brekam\s+medis\b/gi, () => 'Rekam Medis'],
  [/\bpoliklinik\b/gi, () => 'Poliklinik'],
  [/\bpoli\s+tb\b/gi, () => 'Poli TB'],
  [/\bnurse\s+station\b/gi, () => 'Nurse Station'],
  [/\bruang\s+tunggu\b/gi, () => 'Ruang Tunggu'],
  [/\brooftop\b/gi, () => 'Rooftop'],
  [/\beksterior\b/gi, () => 'Eksterior'],
  [/\bkoridor\b/gi, () => 'Koridor'],
  [/\bmanajemen\b/gi, () => 'Manajemen'],
  [/\brecovery\b/gi, () => 'Recovery'],
  [/\bkm\.\s*/gi, () => 'Km. '],
];

function formatWordSmart(word: string, capitalizeFirst: boolean): string {
  if (!word) return word;
  const match = word.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9/-]+)([^a-zA-Z0-9]*)$/);
  if (!match) return word;
  const [, pre, core, post] = match;

  if (core.includes('/')) {
    const parts = core.split('/').map((p, idx) => formatWordSmart(p, capitalizeFirst && idx === 0));
    return `${pre}${parts.join('/')}${post}`;
  }

  const lower = core.toLowerCase();
  if (PROPER_NOUNS[lower]) {
    return `${pre}${PROPER_NOUNS[lower]}${post}`;
  }

  const upper = core.toUpperCase();
  if (PRESERVED_ACRONYMS.has(upper)) {
    return `${pre}${upper}${post}`;
  }

  if (core.includes('-')) {
    const hParts = core.split('-').map((p, idx) => formatWordSmart(p, capitalizeFirst && idx === 0));
    return `${pre}${hParts.join('-')}${post}`;
  }

  if (capitalizeFirst) {
    return `${pre}${lower.charAt(0).toUpperCase()}${lower.slice(1)}${post}`;
  }
  return `${pre}${lower}${post}`;
}

export function toSmartTitleCase(raw?: string): string {
  if (!raw) return '';
  const smallWords = new Set(['di', 'ke', 'dari', 'dan', 'atau', 'pada', 'untuk', 'dengan', 'yang', 's/d']);
  return raw
    .trim()
    .split(/\s+/)
    .map((w, idx) => {
      const cleanLower = w.toLowerCase();
      if (idx > 0 && smallWords.has(cleanLower)) return cleanLower;
      return formatWordSmart(w, true);
    })
    .join(' ');
}

export function toMidSentenceProse(raw?: string): string {
  if (!raw) return '';
  let text = raw
    .trim()
    .split(/\s+/)
    .map((w) => formatWordSmart(w, false))
    .join(' ');

  for (const [pattern, replacer] of PROPER_PHRASES) {
    text = text.replace(pattern, replacer);
  }
  return text;
}

export function stripHospitalSuffix(raw: string): string {
  return raw
    .replace(/\s*(uobk\s+)?rsud\s+al[-\s]?mulk(\s+kota\s+sukabumi)?\s*$/i, '')
    .trim();
}

export function formatIndonesianDate(isoDate?: string): string {
  if (!isoDate) return '-';
  try {
    return format(parseISO(isoDate), 'dd MMMM yyyy', { locale: idLocale });
  } catch {
    return isoDate;
  }
}

export function getYearFromDate(isoDate?: string): number {
  if (!isoDate) return new Date().getFullYear();
  try {
    const y = parseISO(isoDate).getFullYear();
    return Number.isFinite(y) ? y : new Date().getFullYear();
  } catch {
    return new Date().getFullYear();
  }
}

function stripPhasePrefix(label: string): string {
  return label
    .replace(/^\[(Selama|Setelah)\s+Konstruksi\]\s*/i, '')
    .replace(/^\[(Selama|Setelah)\s+Proyek[^\]]*\]\s*/i, '')
    .trim();
}

function inferDuringPic(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes('hvac') || lower.includes('hepa') || lower.includes('tekanan') || lower.includes('ventilasi') || lower.includes('air bersih') || lower.includes('drainase')) {
    return 'Tim Teknik / IPSRS';
  }
  if (lower.includes('keset') || lower.includes('pembersihan') || lower.includes('pengepelan')) {
    return 'Cleaning Service';
  }
  if (lower.includes('ppi') || lower.includes('ipcn') || lower.includes('kepatuhan')) {
    return 'IPCN / Tim PPI';
  }
  return 'Kontraktor, Pengawas Teknik';
}

function inferAfterPic(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes('hvac') || lower.includes('ventilasi') || lower.includes('plumbing') || lower.includes('sanitasi') || lower.includes('air bersih') || lower.includes('drainase')) {
    return 'Tim Teknik / IPSRS';
  }
  if (lower.includes('pembatas') || lower.includes('limbah') || lower.includes('gerobak')) {
    return 'Kontraktor, Komite K3 dan KPPI';
  }
  if (lower.includes('vakum') || lower.includes('pengepelan') || lower.includes('disinfektan') || lower.includes('bersihkan')) {
    return 'Cleaning Service RS';
  }
  return 'Tim PPI dan Manajemen';
}

/**
 * Normalizes comma-separated prose lists into natural Indonesian ("A, B, dan C" -> using "serta" if desired)
 */
function naturalizeIndonesianList(text: string): string {
  if (!text) return '';
  let normalized = text.replace(/,\s+dan\s+/gi, ', serta ');
  if (/\b(dan|serta)\b/i.test(normalized)) {
    return normalized;
  }
  const parts = normalized
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 2) {
    return `${parts[0]} serta ${parts[1]}`;
  }
  if (parts.length > 2) {
    return `${parts.slice(0, -1).join(', ')}, serta ${parts[parts.length - 1]}`;
  }
  return normalized;
}

/**
 * Checks whether project name already includes location name so prose never duplicates "di Ranap Aisyah"
 */
function hasLocationInText(projectText: string, locationText: string): boolean {
  const p = projectText.toLowerCase().trim();
  const l = locationText.toLowerCase().replace(/\s*\/\s*.*/, '').trim();
  if (!l || l === 'lingkungan rumah sakit' || l === 'seluruh ruangan') return true;
  if (p.includes(l)) return true;
  // Also match core token e.g. "aisyah" inside "Renovasi Toilet Aisyah" vs "Ranap Aisyah"
  const tokens = l.split(/\s+/).filter((t) => t.length >= 4 && !['ruang', 'area', 'unit', 'kamar'].includes(t));
  return tokens.length > 0 && tokens.every((tok) => p.includes(tok));
}

export interface ActionRow {
  tindakan: string;
  pj: string;
}

export interface RecommendationSection {
  title: string;
  items: string[];
}

export interface IcraReportNarrative {
  projectYear: number;
  cleanedBaseName: string;
  projectTitleDisplay: string;
  projectProse: string;
  projectWithLocationProse: string;
  lokasiTitleDisplay: string;
  lokasiProse: string;
  lokasiLengkapTable: string;
  lokasiLengkapProse: string;
  areaTerdampakTitle: string;
  areaTerdampakProse: string;
  kontraktorDisplay: string;
  kontraktorProse: string;
  pjProyekDisplay: string;
  namaIpcn: string;
  tipeCode: ConstructionType;
  riskCode: PatientRiskGroup;
  kelasCode: ConstructionClass;
  riskRoman: string;
  riskLabelLower: string;
  typeInfo: (typeof CONSTRUCTION_TYPES)[number];
  riskInfo: (typeof PATIENT_RISK_GROUPS)[number];
  classControl: (typeof CONSTRUCTION_CLASS_CONTROLS)[ConstructionClass];
  activityNoun: string;
  activityNounCap: string;
  isPatientCareArea: boolean;
  isDemolition: boolean;
  isPlumbingOrToilet: boolean;
  kataPengantarParagraphs: string[];
  latarBelakangParagraphs: string[];
  tujuanText: string;
  ruangLingkupText: string;
  matriksResultText: string;
  praActions: ActionRow[];
  saatActions: ActionRow[];
  pascaActions: ActionRow[];
  kesimpulanParagraphs: string[];
  rekomendasiIntro: string;
  rekomendasiSections: RecommendationSection[];
  rekomendasiClosing: string;
  penutupParagraphs: string[];
  locationPoints: IcraLocationPoint[];
}

/**
 * Generates deeply context-aware Indonesian ICRA report narratives derived automatically
 * from project identity, risk matrix, patient vulnerability, work nature, and monitoring records.
 */
export function buildIcraReportNarrative(
  project: IcraKonstruksiItem,
  monitoringLogs: IcraMonitoringItem[] = []
): IcraReportNarrative {
  const projectYear = getYearFromDate(project.tgl_mulai);
  const rawProjectName = project.nama_proyek?.trim() || 'Kegiatan Konstruksi / Renovasi';
  let cleanedBaseName = stripHospitalSuffix(rawProjectName) || rawProjectName;
  cleanedBaseName = cleanedBaseName
    .replace(/\(\s*\d+\s*titik(\s+lokasi)?\s*\)/gi, '')
    .replace(/\bmulti[\s-]*(unit|lokasi)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^(pada\s+kegiatan|kegiatan)\s+/i, '')
    .replace(/[\s\-–—,:;]+$/g, '')
    .trim();

  if (
    /^renovasi\s+dan\s+pemeliharaan\s+sarana\s+prasarana\s+terpadu\b/i.test(cleanedBaseName) ||
    /pemeliharaan.*perbaikan.*renovasi.*k[ou]n?struksi.*sarana\s+prasarana/i.test(cleanedBaseName)
  ) {
    cleanedBaseName = 'Pemeliharaan, Perbaikan, Renovasi dan Konstruksi Sarana Prasarana';
  }

  const projectTitleDisplay = toSmartTitleCase(cleanedBaseName);
  const projectProse = toMidSentenceProse(cleanedBaseName);

  const locationPoints = normalizeLocationPoints(project.lokasi_rincian);
  const isMultiLocation = locationPoints.length > 0;

  const rawLokasi = project.lokasi_area?.trim() || 'Lingkungan Rumah Sakit';
  const lokasiTitleDisplay = toSmartTitleCase(rawLokasi);
  const lokasiProse = naturalizeIndonesianList(toMidSentenceProse(rawLokasi));

  const rawAreaTerdampak =
    project.area_terdampak?.trim() || summarizeAreaTerdampakFromLocations(locationPoints);
  const areaTerdampakProse = toMidSentenceProse(rawAreaTerdampak);
  const areaTerdampakTitle = toSmartTitleCase(rawAreaTerdampak);

  const rawKontraktor = project.kontraktor_pelaksana?.trim() || 'IPSRS RSUD Al-Mulk';
  const kontraktorDisplay = toSmartTitleCase(rawKontraktor);
  const kontraktorProse = toMidSentenceProse(rawKontraktor);

  const pjProyekDisplay = toSmartTitleCase(project.pj_proyek?.trim() || '');
  const namaIpcn = project.nama_ipcn?.trim() || 'Adi Tresa Purnama, A.M.Kep';

  const tipeCode: ConstructionType = project.tipe_konstruksi || 'C';
  const riskCode: PatientRiskGroup = project.kelompok_risiko || '2';
  const kelasCode: ConstructionClass = project.kelas_tindakan || 'III';
  const riskRoman = RISK_ROMAN[riskCode] || 'II';

  const typeInfo = CONSTRUCTION_TYPES.find((t) => t.code === tipeCode) || CONSTRUCTION_TYPES[2];
  const riskInfo = PATIENT_RISK_GROUPS.find((r) => r.code === riskCode) || PATIENT_RISK_GROUPS[1];
  const classControl = CONSTRUCTION_CLASS_CONTROLS[kelasCode] || CONSTRUCTION_CLASS_CONTROLS.III;
  const riskLabelLower = riskInfo.riskLabel.toLowerCase();

  const multiLocationSummaryText = locationPoints
    .map((pt) => `${pt.uraian_pekerjaan} ${pt.lokasi} ${pt.area_terdampak || ''} ${pt.keterangan || ''}`)
    .join(' ');

  // Analyze semantic work profile & clinical sensitivity
  const combinedText = `${rawProjectName} ${rawLokasi} ${rawAreaTerdampak} ${project.persyaratan_khusus || ''} ${multiLocationSummaryText}`;
  const isDemolition = /\b(bongkar|pembongkaran|perobohan|roboh)\b/i.test(rawProjectName);
  const isNewBuild = /\b(pembangunan|gedung baru|konstruksi baru|perluasan bangunan)\b/i.test(rawProjectName);
  const isPlumbingOrToilet = /\b(toilet|wc|kamar mandi|kloset|wastafel|sanitasi|plumbing|pipa|drainase|saluran air|keramik)\b/i.test(combinedText);
  const isCeilingOrWall = /\b(plafon|gypsum|partisi|dinding|tembok|plester|acian|lantai|vinyl|bocor|kanopi)\b/i.test(combinedText);
  const isInternalIpsrs = /\b(ipsrs|iprs|internal rumah sakit)\b/i.test(rawKontraktor);

  const hasClinicalKeywords = /\b(ranap|rawat|igd|igh|icu|nicu|picu|iccu|hcu|ibs|operasi|recovery|vk|bersalin|isolasi|poli|klinik|lab|laboratorium|radiologi|farmasi|fisioterapi|gizi|cssd|stroke unit|utd|ip2k|onkologi|cath lab|ruang perawatan|pasien)\b/i.test(
    `${rawLokasi} ${rawProjectName} ${multiLocationSummaryText}`
  );
  const isExplicitNonPatientUnit =
    !isMultiLocation && /\b(koperasi|administrasi|manajemen|parkir|tps|kantor|gudang)\b/i.test(rawLokasi);
  const isPatientCareArea = hasClinicalKeywords || (!isExplicitNonPatientUnit && riskCode !== '1');
  const isHighAcuityWard =
    riskCode === '4' ||
    /\b(icu|nicu|picu|iccu|hcu|isolasi|ibs|operasi|recovery|cssd|onkologi|cath lab|luka bakar|immunocompromised)\b/i.test(
      `${rawLokasi} ${rawAreaTerdampak} ${multiLocationSummaryText}`
    );
  const isLargeScaleOrOutdoor =
    isDemolition ||
    isNewBuild ||
    tipeCode === 'D' ||
    /\b(gedung|parkir|halaman|tps|luar)\b/i.test(rawLokasi);

  const hasFullMaintenanceScope =
    /\bpemeliharaan\b/i.test(cleanedBaseName) && /\bperbaikan\b/i.test(cleanedBaseName);

  const activityNoun = isDemolition
    ? 'pembongkaran'
    : isNewBuild
    ? 'pembangunan dan konstruksi'
    : hasFullMaintenanceScope
    ? 'pemeliharaan, perbaikan, renovasi dan konstruksi'
    : isPlumbingOrToilet && !isMultiLocation
    ? 'renovasi'
    : 'renovasi dan konstruksi';

  const activityNounCap = isDemolition
    ? 'Pembongkaran'
    : isNewBuild
    ? 'Pembangunan dan Konstruksi'
    : hasFullMaintenanceScope
    ? 'Pemeliharaan, Perbaikan, Renovasi dan Konstruksi'
    : isPlumbingOrToilet && !isMultiLocation
    ? 'Renovasi'
    : 'Renovasi dan Konstruksi';

  const locationAlreadyInName = isMultiLocation || hasLocationInText(projectProse, lokasiProse);
  const projectWithLocationProse = locationAlreadyInName
    ? projectProse
    : `${projectProse} di ${lokasiProse}`;

  const lokasiLengkapTable = isMultiLocation
    ? areaTerdampakTitle
      ? `${lokasiTitleDisplay} — Mencakup ${locationPoints.length} Titik Lokasi (Area terdampak sekitar: ${areaTerdampakTitle})`
      : `${lokasiTitleDisplay} — Mencakup ${locationPoints.length} Titik Lokasi (rincian terlampir pada tabel di bawah)`
    : areaTerdampakTitle
    ? `${lokasiTitleDisplay} (Area terdampak sekitar: ${areaTerdampakTitle})`
    : lokasiTitleDisplay;
  const areaOverlapsLocation = isAreaOverlappingLocation(lokasiProse, areaTerdampakProse);
  const distinctAreaProse = !areaOverlapsLocation && areaTerdampakProse ? naturalizeIndonesianList(areaTerdampakProse) : '';

  const lokasiLengkapProse = isMultiLocation
    ? distinctAreaProse
      ? `${locationPoints.length} titik lokasi di lingkungan rumah sakit (${lokasiProse}) yang berdekatan dengan ${distinctAreaProse}`
      : `${locationPoints.length} titik lokasi di lingkungan rumah sakit, meliputi ${lokasiProse}`
    : distinctAreaProse
    ? `${lokasiProse} yang berdekatan dengan ${distinctAreaProse}`
    : lokasiProse;

  // Unused imports check keep clean
  void CONSTRUCTION_MATRIX;

  const unitCoordinatorPhrase = isMultiLocation
    ? ', penanggung jawab masing-masing unit lokasi pekerjaan'
    : isPatientCareArea
    ? `, penanggung jawab unit ${lokasiProse}`
    : '';
  const contractorActorPhrase = isInternalIpsrs
    ? 'serta tim pelaksana pekerjaan'
    : `, serta pihak pelaksana pekerjaan (${kontraktorProse})`;

  // ==================== 1. KATA PENGANTAR ====================
  const kataPengantarParagraphs = [
    `Puji syukur kami panjatkan ke hadirat Tuhan Yang Maha Esa atas segala rahmat dan karunia-Nya sehingga laporan *Infection Control Risk Assessment* (ICRA) untuk kegiatan ${projectWithLocationProse} di UOBK RSUD Al-Mulk Kota Sukabumi tahun ${projectYear} dapat disusun dengan baik.`,
    isPatientCareArea
      ? `Laporan ini disusun sebagai bentuk komitmen Komite PPI dalam penerapan prinsip pencegahan dan pengendalian infeksi pada kegiatan ${activityNoun} di lingkungan rumah sakit. Berdasarkan hasil pengkajian awal, lokasi kegiatan berada di ${lokasiLengkapProse}. Area tersebut termasuk dalam klasifikasi kelompok risiko ${riskCode} (risiko ${riskLabelLower}) dengan tipe pekerjaan ${tipeCode} dan tingkat kewaspadaan Kelas ${kelasCode}, sehingga seluruh aktivitas ${activityNoun} wajib dikendalikan secara ketat karena berlangsung di atau berdekatan langsung dengan area pelayanan pasien.`
      : `Laporan ini disusun sebagai bentuk komitmen Komite PPI dalam penerapan prinsip pencegahan dan pengendalian infeksi pada kegiatan ${activityNoun} di lingkungan rumah sakit. Berdasarkan hasil pengkajian awal, lokasi kegiatan berada di ${lokasiLengkapProse}. Area tersebut termasuk dalam klasifikasi kelompok risiko ${riskCode} (risiko ${riskLabelLower}) dengan tipe pekerjaan ${tipeCode} dan tingkat kewaspadaan Kelas ${kelasCode}, sehingga pekerjaan berpotensi menimbulkan debu dan kontaminasi lingkungan yang tetap perlu diantisipasi meskipun tidak berada secara langsung di dalam ruang perawatan pasien.`,
    'Dokumen ini memuat latar belakang, tujuan dan ruang lingkup, perencanaan proyek, klasifikasi tipe konstruksi, kategori risiko pasien, matriks ICRA, rencana tindakan pengendalian infeksi sebelum, selama, dan setelah pekerjaan, pemantauan pelaksanaan, kesimpulan, rekomendasi, penutup, bukti dokumentasi, serta formulir pengkajian Pra, Intra, dan Post Konstruksi.',
    `Penyusunan dan pelaksanaan ICRA memerlukan kerja sama yang erat antara Komite PPI, manajemen rumah sakit, Instalasi Pemeliharaan Sarana Rumah Sakit (IPSRS), K3RS, Kesehatan Lingkungan${unitCoordinatorPhrase}${isInternalIpsrs ? '' : `, serta pihak pelaksana (${kontraktorProse})`}. Seluruh proses pengendalian dipantau melalui survei lapangan dan koordinasi lintas unit sampai kegiatan selesai dilaksanakan.`,
    `Semoga dokumen ini dapat digunakan sebagai pedoman pelaksanaan kegiatan ${projectWithLocationProse} yang aman, terkendali, dan selaras dengan upaya peningkatan mutu pelayanan serta keselamatan pasien di UOBK RSUD Al-Mulk Kota Sukabumi.`,
  ];

  // ==================== 2. LATAR BELAKANG (6 PARAGRAF TERSTRUKTUR) ====================
  const lbP1 =
    'Rumah sakit sebagai institusi pelayanan kesehatan memiliki tanggung jawab dalam menyediakan lingkungan yang aman, nyaman, dan memenuhi standar kesehatan bagi pasien, tenaga kesehatan, pegawai, pengunjung, serta masyarakat di sekitarnya. Salah satu upaya dalam meningkatkan mutu pelayanan kesehatan adalah melalui pemeliharaan, pengembangan, dan penataan sarana serta prasarana rumah sakit secara berkelanjutan. Namun, setiap kegiatan pembongkaran, konstruksi, maupun renovasi bangunan di lingkungan rumah sakit memiliki potensi risiko yang perlu diperhatikan, khususnya dari aspek Pencegahan dan Pengendalian Infeksi (PPI).';

  // P2 adapts cleanly between single-site, detached non-patient units, and multi-location hospital-wide projects
  const surroundingLabel = distinctAreaProse
    ? distinctAreaProse
    : isPatientCareArea
    ? 'ruang pelayanan pasien dan koridor unit perawatan'
    : 'area perkantoran dan manajemen';

  const isBuildingLocation = /\bgedung\b/i.test(lokasiProse);
  const locationNoun = isBuildingLocation ? 'gedung' : 'ruangan atau area';

  const lbP2 = isMultiLocation
    ? `Dalam rangka pemeliharaan, pengembangan, dan penataan sarana prasarana pelayanan, UOBK RSUD Al-Mulk Kota Sukabumi merencanakan kegiatan ${projectWithLocationProse} yang tersebar pada ${locationPoints.length} titik lokasi di lingkungan rumah sakit. Cakupan lokasi pekerjaan tersebut meliputi ${lokasiProse}${
        distinctAreaProse ? `, serta berdekatan dengan ${distinctAreaProse}` : ''
      }. Mengingat sebagian besar titik pekerjaan berada langsung di dalam maupun berbatasan erat dengan area pelayanan aktif (${riskCode === '4' ? `kelompok risiko ${riskCode} dengan tingkat risiko ${riskLabelLower}` : `tingkat risiko ${riskLabelLower}`}), pelaksanaannya wajib memperhatikan keselamatan pasien, kondisi lingkungan sekitar, serta pencegahan penyebaran kontaminan ke zona pelayanan lainnya.`
    : isPatientCareArea
    ? `Dalam rangka pemeliharaan, pengembangan, dan penataan sarana prasarana pelayanan, UOBK RSUD Al-Mulk Kota Sukabumi merencanakan kegiatan ${projectWithLocationProse} yang berada di lingkungan rumah sakit. Lokasi pekerjaan tersebut berada di ${lokasiProse}${
        distinctAreaProse ? ` dan berdekatan dengan ${distinctAreaProse}` : ''
      }, sehingga pelaksanaannya perlu memperhatikan keselamatan pasien, kondisi lingkungan sekitar, serta keberlangsungan aktivitas pelayanan rumah sakit. Mengingat area tersebut berada langsung di dalam atau berbatasan erat dengan zona pelayanan pasien (kelompok risiko ${riskCode} dengan tingkat risiko ${riskLabelLower}), potensi penyebaran kontaminan ke pasien, petugas, maupun area pelayanan lainnya harus diantisipasi secara ketat.`
    : `Dalam rangka pengembangan dan penataan sarana prasarana, UOBK RSUD Al-Mulk Kota Sukabumi merencanakan kegiatan ${projectWithLocationProse} yang berada di lingkungan rumah sakit. Lokasi ${locationNoun} tersebut berdekatan dengan ${surroundingLabel}, sehingga pelaksanaan pekerjaan perlu memperhatikan kondisi lingkungan sekitar serta keberlangsungan aktivitas operasional rumah sakit. Meskipun lokasi pekerjaan tidak berada secara langsung di dalam area pelayanan pasien, potensi penyebaran kontaminan ke area lain tetap perlu diantisipasi.`;

  // P3: Dust, building particles, Aspergillus spp., plus project-specific hazard details
  const specificHazardPhrase =
    hasFullMaintenanceScope || isMultiLocation
      ? isPlumbingOrToilet
        ? 'Pembongkaran material bangunan, pengerjaan struktur dinding maupun plafon berpotensi melepaskan akumulasi debu lama, sedangkan pekerjaan pada area sanitasi dan saluran air juga berisiko menimbulkan kelembaban berlebih serta percikan aerosol apabila tidak dikelola dengan baik.'
        : 'Pembukaan plafon, pemlesteran, maupun pengerjaan struktur dinding berpotensi melepaskan akumulasi debu lama ke ruang di sekitarnya.'
      : isPlumbingOrToilet
      ? 'Selain debu dari pembongkaran material keramik maupun dinding, pekerjaan pada area sanitasi dan saluran air juga berpotensi menimbulkan kelembaban berlebih serta percikan aerosol yang dapat memicu pertumbuhan mikroorganisme apabila tidak dikelola dengan baik.'
      : isCeilingOrWall
      ? 'Pembukaan plafon, pemlesteran, maupun pengerjaan struktur dinding berpotensi melepaskan akumulasi debu lama di atas rongga plafon ke ruang di sekitarnya.'
      : '';

  const affectedLocationPhrase = isMultiLocation
    ? 'di sekitar masing-masing titik pekerjaan'
    : `di sekitar area ${lokasiProse}`;

  const affectedHumanTarget = isHighAcuityWard
    ? `pasien berisiko sangat tinggi maupun pasien dengan penurunan sistem kekebalan tubuh (*immunocompromised*), tenaga kesehatan, pegawai, serta pengunjung ${affectedLocationPhrase}`
    : isPatientCareArea
    ? `pasien yang sedang menjalani perawatan (terutama pasien dengan sistem kekebalan tubuh yang rendah), tenaga kesehatan, pegawai, maupun pengunjung yang berada di sekitar lokasi ${activityNoun}`
    : `pegawai maupun individu yang berada di sekitar lokasi ${activityNoun}`;

  const workPhraseP3 = isDemolition
    ? 'Kegiatan pembongkaran bangunan'
    : hasFullMaintenanceScope || isMultiLocation
    ? 'Kegiatan pemeliharaan, perbaikan, renovasi dan konstruksi sarana prasarana'
    : isPlumbingOrToilet
    ? 'Kegiatan renovasi dan perbaikan fasilitas sanitasi'
    : isNewBuild
    ? 'Kegiatan pembangunan dan konstruksi bangunan'
    : 'Kegiatan renovasi dan perbaikan bangunan';

  const lbP3 = `${workPhraseP3} berpotensi menghasilkan debu, partikel material bangunan, serta mikroorganisme yang dapat tersebar melalui udara. Salah satu mikroorganisme yang perlu mendapat perhatian adalah spora jamur *Aspergillus spp.*, yang dapat ditemukan pada tanah, debu, dan material bangunan. Paparan terhadap mikroorganisme tersebut dapat meningkatkan risiko gangguan kesehatan, terutama pada individu dengan sistem kekebalan tubuh yang rendah.${
    specificHazardPhrase ? ` ${specificHazardPhrase}` : ''
  } Penyebaran debu juga dapat menyebabkan penurunan kualitas udara, kontaminasi permukaan, serta gangguan kenyamanan dan kesehatan bagi ${affectedHumanTarget}.`;

  // P4: Impact on ventilation, clean water, drainage, hygiene, and staff/patient/visitor mobilization
  const mobilizationSubject = isPatientCareArea
    ? 'mobilisasi pasien, petugas kesehatan, dan pengunjung rumah sakit'
    : 'mobilisasi petugas dan pengunjung rumah sakit';
  const debrisMovementDetail = isLargeScaleOrOutdoor
    ? 'Aktivitas keluar masuk pekerja, kendaraan proyek, dan pengangkutan puing bangunan yang tidak dikelola dengan baik dapat memperluas area kontaminasi serta mengganggu kelancaran aktivitas operasional rumah sakit.'
    : 'Aktivitas keluar masuk pekerja, pemindahan material bangunan melalui jalur koridor, serta pengangkutan puing sisa pekerjaan yang tidak dikelola dengan baik dapat memperluas area kontaminasi serta mengganggu kelancaran aktivitas operasional pelayanan rumah sakit.';
  const plumbingDrainageNote = isPlumbingOrToilet
    ? ' Gangguan sementara pada jaringan air bersih maupun saluran drainase selama perbaikan fasilitas sanitasi juga berisiko memengaruhi higienitas ruangan apabila tidak disiapkan langkah pengalihan dan pengamanan yang memadai.'
    : '';

  const lbP4 = `Selain risiko penyebaran debu dan mikroorganisme, kegiatan ${activityNoun} juga berpotensi menimbulkan dampak terhadap sistem ventilasi, jaringan air bersih, drainase, kebersihan lingkungan, serta ${mobilizationSubject}.${plumbingDrainageNote} ${debrisMovementDetail}`;

  // P5: Systematic infection control matched to class level (I-IV)
  const classControlSentence =
    kelasCode === 'III' || kelasCode === 'IV'
      ? `Pengendalian tersebut meliputi pemasangan pembatas area pekerjaan kedap debu (barier fisik atau metode kontrol kubus), pengendalian penyebaran debu termasuk penjagaan tekanan udara negatif dengan penyaring udara HEPA, perlindungan serta isolasi sistem ventilasi, pengaturan jalur mobilisasi pekerja${
          isLargeScaleOrOutdoor ? ' dan kendaraan proyek' : ' serta pemindahan material'
        }, pengelolaan puing bangunan dalam wadah tertutup, serta pemeliharaan kebersihan lingkungan selama kegiatan ${activityNoun} berlangsung.`
      : kelasCode === 'II'
      ? `Pengendalian tersebut meliputi pemasangan pembatas area pekerjaan, pengendalian penyebaran debu secara aktif dan penyediaan keset basah (*sticky mat*), perlindungan dan penyegelan sementara sistem ventilasi, pengaturan jalur mobilisasi pekerja${
          isLargeScaleOrOutdoor ? ' dan kendaraan proyek' : ' serta pemindahan material'
        }, pengelolaan puing bangunan dalam wadah tertutup, serta pemeliharaan kebersihan lingkungan selama kegiatan ${activityNoun} berlangsung.`
      : `Pengendalian tersebut meliputi penataan area pekerjaan agar meminimalkan sebaran debu, perlindungan sistem ventilasi dan permukaan sekitar, pengaturan jalur mobilisasi pekerja, pengelolaan sisa material secara bersih, serta pemeliharaan kebersihan lingkungan selama kegiatan ${activityNoun} berlangsung.`;

  const lbP5 = `Dalam upaya meminimalkan berbagai potensi risiko tersebut, diperlukan perencanaan dan penerapan tindakan pengendalian infeksi yang sistematis, terarah, dan terkoordinasi melalui pengkajian *Infection Control Risk Assessment* (ICRA) sesuai standar Permenkes Nomor 27 Tahun 2017. ${classControlSentence}`;

  // P6: Coordination and desired outcome
  const lbP6 = `Keberhasilan pelaksanaan pengendalian risiko memerlukan koordinasi dan komitmen bersama antara pihak manajemen, Komite Pencegahan dan Pengendalian Infeksi, Instalasi Pemeliharaan Sarana Rumah Sakit, Kesehatan dan Keselamatan Kerja Rumah Sakit, Kesehatan Lingkungan${unitCoordinatorPhrase}${contractorActorPhrase}. Melalui penerapan pengendalian risiko yang optimal, diharapkan kegiatan ${projectWithLocationProse} UOBK RSUD Al-Mulk Kota Sukabumi dapat terlaksana secara aman dan terkendali, tanpa mengganggu keberlangsungan pelayanan serta tetap menjamin kesehatan dan keselamatan seluruh individu di lingkungan rumah sakit.`;

  const latarBelakangParagraphs = [lbP1, lbP2, lbP3, lbP4, lbP5, lbP6];

  // ==================== 3. TUJUAN & RUANG LINGKUP ====================
  const tujuanText = `Mengidentifikasi, menilai, dan mengendalikan risiko infeksi akibat kegiatan ${projectWithLocationProse} agar paparan debu, spora jamur, maupun kontaminasi lingkungan dapat diminimalkan serta kegiatan pelayanan rumah sakit tetap berlangsung secara aman. Secara khusus, ICRA ini bertujuan menetapkan klasifikasi tipe proyek (Tipe ${tipeCode}), kelompok pasien berisiko (Kelompok ${riskCode} — risiko ${riskLabelLower}), dan tingkat kewaspadaan Kelas ${kelasCode}, menentukan tanggung jawab lintas unit, serta memastikan terlaksananya pemantauan Pra, Intra, dan Post Konstruksi secara berkesinambungan.`;

  const ruangLingkupText = `Mencakup tahap persiapan dan pengkajian prakonstruksi ${
    isMultiLocation
      ? `pada ${locationPoints.length} titik lokasi pekerjaan sebagaimana dirinci pada bagian Perencanaan`
      : `di ${lokasiProse}`
  }, pelaksanaan ${activityNoun} sesuai ruang lingkup teknis yang disetujui (${formatIndonesianDate(
    project.tgl_mulai
  )} sampai dengan ${formatIndonesianDate(
    project.tgl_selesai_estimasi
  )}), pengamanan jalur pemindahan material dan puing dalam wadah tertutup, perlindungan area sekitar${
    !isMultiLocation && distinctAreaProse ? ` (${distinctAreaProse})` : ''
  }${isPatientCareArea ? ' termasuk keselamatan pasien dan petugas yang beraktivitas di sekitarnya' : ''}, pembersihan akhir menyeluruh (*terminal cleaning*), serta evaluasi kelayakan area pascapekerjaan.`;

  // ==================== 4. MATRIKS ICRA RESULT ====================
  const matriksResultText = isMultiLocation
    ? `Berdasarkan hasil pengkajian ICRA untuk paket kegiatan ${projectWithLocationProse} yang mencakup ${locationPoints.length} titik lokasi, sesuai prinsip risiko tertinggi pada Permenkes Nomor 27 Tahun 2017 penetapan matriks induk diklasifikasikan ke dalam Tipe ${tipeCode} (${typeInfo.shortDesc.toLowerCase()}) dengan tingkat risiko pasien pada Kategori ${riskRoman} (kelompok risiko ${riskLabelLower}). Pertemuan kedua parameter pada matriks ICRA menetapkan bahwa proyek wajib menerapkan pengendalian infeksi Kelas ${kelasCode}, yang mencakup ${classControl.summary.toLowerCase().replace(/\.$/, '')}, dengan penyesuaian intensitas pengawasan lapangan pada masing-masing titik sesuai kelas risikonya.`
    : `Berdasarkan hasil pengkajian ICRA untuk kegiatan ${projectWithLocationProse}, pekerjaan ini diklasifikasikan ke dalam Tipe ${tipeCode} (${typeInfo.shortDesc.toLowerCase()}) dengan tingkat risiko pasien pada Kategori ${riskRoman} (kelompok risiko ${riskLabelLower}). Pertemuan kedua parameter pada matriks ICRA menetapkan bahwa proyek wajib menerapkan pengendalian infeksi **Kelas ${kelasCode}**, yang mencakup ${classControl.summary.toLowerCase().replace(/\.$/, '')}.`.replace(/\*\*/g, '');

  // ==================== 5. RENCANA TINDAKAN (PRA, SAAT, PASCA) ====================
  const praActions: ActionRow[] = [
    {
      tindakan: isMultiLocation
        ? `Melakukan rapat koordinasi prakonstruksi antara tim teknis (IPSRS), Komite PPI, K3RS, Kesehatan Lingkungan, kepala unit/ruangan pada masing-masing titik lokasi pekerjaan${
            isInternalIpsrs ? '' : `, dan pihak pelaksana (${kontraktorProse})`
          }.`
        : `Melakukan rapat koordinasi prakonstruksi antara tim teknis (IPSRS), Komite PPI, K3RS, Kesehatan Lingkungan${
            isPatientCareArea ? `, kepala ruangan ${lokasiProse}` : ''
          }${isInternalIpsrs ? '' : `, dan pihak pelaksana (${kontraktorProse})`}.`,
      pj: 'Manajemen RS, Tim PPI, IPSRS',
    },
    {
      tindakan: `Menyusun, memverifikasi, dan mengesahkan dokumen pengkajian ICRA (Tipe ${tipeCode}, Risiko Kategori ${riskRoman}, Kelas Kewaspadaan ${kelasCode}) serta jadwal pelaksanaan proyek.`,
      pj: 'Tim PPI / IPCN, IPSRS',
    },
    {
      tindakan: isMultiLocation
        ? `Melakukan identifikasi risiko pasien dan penetapan batas zona aman kerja pada ${locationPoints.length} titik lokasi renovasi beserta area terdampak di sekitarnya.`
        : `Melakukan identifikasi risiko pasien dan penetapan batas zona aman kerja di ${lokasiProse}${
            areaTerdampakProse ? ` serta area terdampak (${naturalizeIndonesianList(areaTerdampakProse)})` : ''
          }.`,
      pj: isPatientCareArea ? 'IPCN dan PJ Ruangan' : 'IPCN dan Tim K3RS',
    },
    ...(isPatientCareArea
      ? [
          {
            tindakan: isMultiLocation
              ? 'Mengatur pengosongan area kerja serta memindahkan sementara atau melindungi pasien yang berada di zona berdekatan dengan masing-masing lokasi pekerjaan sebelum dimulai.'
              : `Mengatur pengosongan area kerja serta memindahkan sementara atau melindungi pasien yang berada di zona berdekatan dengan lokasi ${lokasiProse} sebelum pekerjaan dimulai.`,
            pj: 'Kepala Ruangan dan Tim PPI',
          },
        ]
      : []),
    {
      tindakan: `Menyusun jadwal kerja ${activityNoun} di luar jam padat operasional atau jam pelayanan kritis rumah sakit.`,
      pj: 'IPSRS dan Manajemen Unit',
    },
    {
      tindakan:
        kelasCode === 'III' || kelasCode === 'IV'
          ? 'Menyiapkan barier fisik tertutup rapat dan kedap debu (partisi gypsum/plastik tebal atau kontrol kubus) serta unit penyaring udara HEPA sebelum pekerjaan dimulai.'
          : 'Menyiapkan pembatas area kerja yang rapi serta sarana pengendalian debu sesuai standar kelas kewaspadaan.',
      pj: isInternalIpsrs
        ? 'IPSRS'
        : /^kontraktor$/i.test(kontraktorDisplay.trim())
        ? 'Kontraktor, IPSRS'
        : `Kontraktor (${kontraktorDisplay}), IPSRS`,
    },
    ...(isPlumbingOrToilet
      ? [
          {
            tindakan: 'Melakukan pemeriksaan dan pengamanan sementara pada jaringan air bersih, katup penutup air, serta saluran drainase agar tidak mencemari area pelayanan di sekitarnya.',
            pj: 'Tim Teknik / IPSRS',
          },
        ]
      : [
          {
            tindakan: 'Menutup, menyegel, atau mengisolasi kisi-kisi ventilasi udara dan sistem HVAC yang terhubung dengan area pekerjaan.',
            pj: 'Tim Teknik / IPSRS',
          },
        ]),
    {
      tindakan: 'Melakukan sosialisasi dan pemberitahuan resmi mengenai jadwal pekerjaan, jalur akses alternatif, dan langkah pengendalian infeksi kepada staf unit terkait serta pengunjung.',
      pj: 'Humas RS, Tim PPI, PJ Unit',
    },
    {
      tindakan: 'Menetapkan jalur khusus mobilisasi pekerja, pengiriman material, serta pengangkutan puing sisa pekerjaan menggunakan wadah tertutup rapat.',
      pj: 'IPSRS, K3RS, Kontraktor',
    },
    {
      tindakan: 'Memastikan ketersediaan APD pekerja, cairan disinfektan, keset basah (*sticky mat*) di pintu akses kerja, dan peralatan kebersihan lingkungan.',
      pj: 'Kontraktor, Cleaning Service RS',
    },
  ];

  const checklist = Array.isArray(project.checklist_pengendalian) ? project.checklist_pengendalian : [];
  const duringFromChecklist = checklist
    .filter((c) => /^\[Selama/i.test(c.label))
    .map((c) => stripPhasePrefix(c.label))
    .filter(Boolean);
  const afterFromChecklist = checklist
    .filter((c) => /^\[Setelah/i.test(c.label))
    .map((c) => stripPhasePrefix(c.label))
    .filter(Boolean);

  const baseDuring = duringFromChecklist.length > 0 ? duringFromChecklist : classControl.duringItems;
  const baseAfter = afterFromChecklist.length > 0 ? afterFromChecklist : classControl.afterItems;

  const saatActions: ActionRow[] = [
    ...baseDuring.map((item) => ({
      tindakan: item,
      pj: inferDuringPic(item),
    })),
    ...(isPlumbingOrToilet
      ? [
          {
            tindakan: 'Menjaga area sekitar pembongkaran sanitasi tetap kering, meminimalkan percikan air kotor, dan menutup lubang saluran sementara saat pekerjaan berlangsung.',
            pj: 'Kontraktor, Tim Teknik / IPSRS',
          },
        ]
      : []),
    {
      tindakan: 'Melakukan pembersihan harian menggunakan metode basah pada koridor dan jalur akses di luar pembatas area kerja.',
      pj: 'Cleaning Service',
    },
    {
      tindakan: 'Memastikan seluruh pekerja mengenakan APD lengkap (masker, sepatu kerja tertutup, sarung tangan, dan pelindung diri sesuai risiko) selama berada di area kerja.',
      pj: isInternalIpsrs ? 'IPSRS / Pengawas K3' : 'Kontraktor',
    },
    {
      tindakan: 'Melakukan pemantauan rutin harian oleh IPCN serta pencatatan pada formulir monitoring intra konstruksi.',
      pj: 'IPCN / Tim PPI',
    },
  ];

  const pascaActions: ActionRow[] = [
    ...baseAfter.map((item) => ({
      tindakan: item,
      pj: inferAfterPic(item),
    })),
    ...(isPlumbingOrToilet
      ? [
          {
            tindakan: 'Melakukan uji fungsi aliran air bersih, kelancaran saluran pembuangan/drainase, dan memastikan tidak ada kebocoran maupun genangan sebelum ruangan digunakan kembali.',
            pj: 'Tim Teknik / IPSRS dan Kesling',
          },
        ]
      : []),
    {
      tindakan: 'Melakukan pemeriksaan kebersihan permukaan (*terminal cleaning*), kualitas udara, dan kelayakan fungsi ruangan bersama Tim PPI, K3RS, Kesling, dan IPSRS.',
      pj: 'Tim PPI, IPSRS, Kesling, K3RS',
    },
    {
      tindakan: 'Melakukan serah terima pekerjaan secara formal dan membuka kembali akses area hanya setelah dinyatakan aman dan bebas risiko infeksi pada formulir post konstruksi.',
      pj: 'IPSRS, Tim PPI, Manajemen RS',
    },
  ];

  // ==================== 6. KESIMPULAN (OTOMATIS INTEGRASI DATA MONITORING) ====================
  const sesuaiCount = monitoringLogs.filter((m) => m.status_kepatuhan === 'Sesuai Standar').length;
  const perluPerbaikanCount = monitoringLogs.filter((m) => m.status_kepatuhan === 'Perlu Perbaikan').length;
  const stopCount = monitoringLogs.filter((m) => m.status_kepatuhan === 'Stop Pekerjaan').length;

  const monitoringSummaryProse =
    monitoringLogs.length > 0
      ? `Berdasarkan hasil pemantauan lapangan selama pekerjaan berlangsung, IPCN telah melaksanakan ${monitoringLogs.length} kali inspeksi dengan rincian ${sesuaiCount} kunjungan berstatus sesuai standar${
          perluPerbaikanCount > 0 ? `, ${perluPerbaikanCount} kunjungan memerlukan perbaikan langsung yang telah ditindaklanjuti` : ''
        }${
          stopCount > 0 ? `, serta ${stopCount} kali peringatan penghentian sementara pekerjaan untuk tindakan koreksi segera` : ''
        }.`
      : `Dokumen ini menjadi pedoman pengendalian wajib sebelum pekerjaan dimulai hingga seluruh tahapan pengawasan lapangan (Pra, Intra, dan Post Konstruksi) selesai diverifikasi (status proyek saat pelaporan: ${project.status_proyek}).`;

  const kesimpulanParagraphs = [
    `Kegiatan ${projectWithLocationProse} merupakan langkah penting dan strategis dalam rangka meningkatkan kualitas fasilitas sarana prasarana serta menunjang kenyamanan dan keamanan pelayanan di lingkungan UOBK RSUD Al-Mulk Kota Sukabumi. Karena pelaksanaan kegiatan berlangsung di lingkungan rumah sakit aktif${
      isMultiLocation
        ? ` pada ${locationPoints.length} titik lokasi pelayanan maupun area penunjang`
        : `${distinctAreaProse ? ` yang berdekatan dengan ${distinctAreaProse}` : ''}${
            isPatientCareArea ? ` serta berada pada area pelayanan ${lokasiProse}` : ''
          }`
    }, maka potensi risiko penyebaran debu, spora jamur *Aspergillus spp.*, maupun kontaminasi lingkungan harus diantisipasi secara cermat dan terstruktur.`,
    `Melalui proses *Infection Control Risk Assessment* (ICRA), proyek ini dikategorikan sebagai Tipe ${tipeCode} (${typeInfo.shortDesc.toLowerCase()}) dengan risiko pasien pada Kategori ${riskRoman} (risiko ${riskLabelLower}). Berdasarkan klasifikasi matriks ICRA, kombinasi tersebut menghasilkan tingkat kewaspadaan **Kelas ${kelasCode}**, yang mengharuskan penerapan tindakan pencegahan terstandar berupa ${classControl.summary.toLowerCase().replace(/\.$/, '')}.`.replace(/\*\*/g, ''),
    `Langkah-langkah pengendalian sebelum, selama, dan sesudah ${activityNoun} telah dirancang secara menyeluruh untuk meminimalkan paparan debu, menjaga higienitas sistem ventilasi maupun sanitasi, mencegah terjadinya infeksi terkait pelayanan kesehatan (*HAIs*), serta memastikan keberlangsungan layanan medis. ${monitoringSummaryProse}`,
    `Dengan dilaksanakannya pengkajian ICRA secara konsisten dan dipatuhinya seluruh protokol pengendalian infeksi oleh ${
      isInternalIpsrs ? 'tim teknis pelaksana' : `${kontraktorProse} bersama tim teknis terkait`
    }, kegiatan ${projectWithLocationProse} diharapkan dapat terselesaikan dengan aman, tepat mutu, dan tanpa menimbulkan dampak negatif bagi keselamatan pasien, petugas, maupun lingkungan rumah sakit.`,
  ];

  // ==================== 7. REKOMENDASI (ADAPTIF PER KELAS & SIFAT PROYEK) ====================
  const rekomendasiIntro = `Berdasarkan hasil analisis risiko infeksi dan klasifikasi proyek melalui proses *Infection Control Risk Assessment* (ICRA), disampaikan beberapa rekomendasi sebagai acuan pelaksanaan dan pengawasan kegiatan ${projectWithLocationProse}, sebagai berikut:`;

  const rekomendasiSections: RecommendationSection[] = [
    {
      title: `1. Pelaksanaan ${activityNounCap}`,
      items: [
        `Kegiatan ${projectWithLocationProse} wajib dilaksanakan sesuai ketentuan pengendalian infeksi Kelas ${kelasCode} (Tipe Proyek ${tipeCode} dan Risiko Pasien Kategori ${riskRoman}).`,
        'Seluruh pekerja wajib menggunakan alat pelindung diri (APD) lengkap serta mematuhi tata tertib pencegahan dan pengendalian infeksi selama berada di lingkungan rumah sakit.',
        kelasCode === 'III' || kelasCode === 'IV'
          ? 'Barikade fisik yang tertutup rapat dan kedap debu (atau metode kontrol kubus) harus terpasang sebelum pekerjaan dimulai dan tidak boleh dibuka sebelum pembersihan akhir diverifikasi.'
          : 'Area kerja harus dilengkapi pembatas yang rapi serta metode pengendalian debu aktif sesuai standar kewaspadaan yang ditetapkan.',
        'Akses keluar masuk material dan pengangkutan puing bangunan wajib melewati jalur khusus yang ditetapkan dengan wadah tertutup rapat agar tidak melintasi area pasien aktif.',
      ],
    },
    {
      title: '2. Pencegahan Risiko Infeksi',
      items: [
        'Tim PPI (IPCN) melakukan pemantauan berkala selama pekerjaan berlangsung menggunakan formulir ceklist monitoring harian untuk memastikan kepatuhan di lapangan.',
        kelasCode === 'III' || kelasCode === 'IV'
          ? 'Menjaga tekanan udara negatif di dalam area kerja menggunakan unit penyaring udara HEPA portabel serta mengisolasi sistem ventilasi atau HVAC agar kontaminan tidak menyebar.'
          : 'Mengisolasi sementara kisi ventilasi atau AC di sekitar lokasi pekerjaan serta menerapkan teknik kerja basah untuk menekan pembentukan debu.',
        ...(isPlumbingOrToilet
          ? [
              'Melindungi saluran pembuangan dan jaringan air bersih selama pembongkaran fasilitas sanitasi serta mencegah genangan air yang berpotensi menjadi sumber kontaminasi mikroorganisme.',
            ]
          : []),
        'Menjadwalkan aktivitas yang berpotensi menimbulkan kebisingan, getaran, atau debu tinggi di luar jam padat pelayanan rumah sakit.',
      ],
    },
    {
      title: '3. Komunikasi dan Edukasi',
      items: [
        `Melakukan koordinasi dan pemberitahuan resmi kepada staf unit, pasien, dan keluarga di sekitar ${
          isMultiLocation
            ? 'masing-masing titik pekerjaan serta area pelayanan terdampak'
            : `${lokasiProse}${distinctAreaProse ? ` serta area terdampak (${distinctAreaProse})` : ''}`
        } mengenai durasi pekerjaan dan pengaturan akses ruangan.`,
        'Memberikan pengarahan rutin kepada pekerja proyek serta petugas kebersihan mengenai penanganan debu, keset basah (*sticky mat*), pembersihan harian, dan pengelolaan limbah konstruksi.',
      ],
    },
    {
      title: `4. Setelah ${activityNounCap}`,
      items: [
        'Setelah pekerjaan selesai, lakukan pembersihan akhir menyeluruh (*terminal cleaning*) dan disinfeksi seluruh permukaan ruangan sebelum pembatas kerja dilepas.',
        ...(isPlumbingOrToilet
          ? [
              'Melakukan uji kelayakan fungsi sanitasi, plumbing, kelancaran aliran air bersih dan drainase, serta memastikan ruangan kering dan bebas bau sebelum dioperasikan kembali.',
            ]
          : []),
        'Melakukan verifikasi kelayakan kebersihan lingkungan dan kesiapan ruangan oleh Tim PPI, IPSRS, K3RS, dan Kesehatan Lingkungan pada formulir Post Konstruksi sebelum serah terima.',
      ],
    },
    {
      title: '5. Dokumentasi dan Evaluasi',
      items: [
        'Mendokumentasikan seluruh tahapan proyek mulai dari pengkajian Pra Konstruksi, laporan pemantauan harian Intra Konstruksi, hingga verifikasi Post Konstruksi beserta bukti foto dokumentasi.',
        ...(project.persyaratan_khusus && project.persyaratan_khusus.trim()
          ? [
              `Memastikan seluruh persyaratan khusus lapangan terpenuhi, yaitu: ${toMidSentenceProse(project.persyaratan_khusus.trim())}.`,
            ]
          : []),
        'Melakukan evaluasi pascaproyek terhadap efektivitas pengendalian risiko infeksi dan insiden keselamatan kerja sebagai bahan perbaikan mutu rumah sakit berkelanjutan.',
      ],
    },
  ];

  const rekomendasiClosing =
    'Rekomendasi ini diharapkan menjadi acuan operasional bersama guna menjamin pelaksanaan pekerjaan yang aman, terkendali, dan selaras dengan standar keselamatan pasien rumah sakit.';

  // ==================== 8. PENUTUP ====================
  const penutupParagraphs = [
    `Demikian laporan *Infection Control Risk Assessment* (ICRA) untuk kegiatan ${projectWithLocationProse} ini disusun sebagai wujud komitmen UOBK RSUD Al-Mulk Kota Sukabumi dalam menjaga keselamatan pasien, tenaga kesehatan, dan seluruh individu di lingkungan rumah sakit selama berlangsungnya aktivitas ${activityNoun}.`,
    `Penyusunan dan implementasi dokumen ini melibatkan sinergi lintas unit, yaitu Komite PPI, Instalasi Pemeliharaan Sarana Rumah Sakit (IPSRS), K3RS, Kesehatan Lingkungan${unitCoordinatorPhrase}${
      isInternalIpsrs ? '' : `, serta pihak pelaksana (${kontraktorProse})`
    }. Setiap langkah pengendalian mengacu pada Permenkes Nomor 27 Tahun 2017 dan standar akreditasi rumah sakit yang berlaku.`,
    'Seluruh pihak terkait diharapkan dapat melaksanakan peran serta tanggung jawabnya secara konsisten. Pemantauan lapangan yang berkesinambungan dan komunikasi aktif antar unit menjadi kunci utama keberhasilan pengendalian infeksi selama dan setelah kegiatan berlangsung.',
    `Akhir kata, semoga kegiatan ${projectWithLocationProse} ini dapat terlaksana dengan lancar, selesai tepat waktu dengan hasil optimal, serta memberikan manfaat nyata bagi peningkatan mutu pelayanan kesehatan di UOBK RSUD Al-Mulk Kota Sukabumi.`,
  ];

  return {
    projectYear,
    cleanedBaseName,
    projectTitleDisplay,
    projectProse,
    projectWithLocationProse,
    lokasiTitleDisplay,
    lokasiProse,
    lokasiLengkapTable,
    lokasiLengkapProse,
    areaTerdampakTitle,
    areaTerdampakProse,
    kontraktorDisplay,
    kontraktorProse,
    pjProyekDisplay,
    namaIpcn,
    tipeCode,
    riskCode,
    kelasCode,
    riskRoman,
    riskLabelLower,
    typeInfo,
    riskInfo,
    classControl,
    activityNoun,
    activityNounCap,
    isPatientCareArea,
    isDemolition,
    isPlumbingOrToilet,
    kataPengantarParagraphs,
    latarBelakangParagraphs,
    tujuanText,
    ruangLingkupText,
    matriksResultText,
    praActions,
    saatActions,
    pascaActions,
    kesimpulanParagraphs,
    rekomendasiIntro,
    rekomendasiSections,
    rekomendasiClosing,
    penutupParagraphs,
    locationPoints,
  };
}

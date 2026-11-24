import React, { useMemo, useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import ReportCover from './ReportCover';
import AutoPaginatedF4Document, { FlowBlock, FrontMatterPageSpec } from './AutoPaginatedF4Document';
import {
  IcraKonstruksiItem,
  IcraMonitoringItem,
  ConstructionType,
  PatientRiskGroup,
  CONSTRUCTION_TYPES,
  PATIENT_RISK_GROUPS,
  CONSTRUCTION_MATRIX,
  CONSTRUCTION_CLASS_CONTROLS,
  IcraChecklistSignoff,
  getPreChecklistSections,
  getPostChecklistSections,
  normalizePreChecklist,
  normalizePostChecklist,
  buildDefaultIntraItems,
  normalizeIntraItems,
} from '@/utils/icraData';
import { normalizeImageUrl } from '@/utils/imageHelper';

export interface IcraOfficialReportProps {
  project: IcraKonstruksiItem;
  monitoringLogs?: IcraMonitoringItem[];
  ketuaPpiName?: string;
  signDate?: string;
  documentId?: string;
}

const RISK_ROMAN: Record<PatientRiskGroup, string> = {
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
  'SPO',
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
  usman: 'Usman',
  hais: 'HAIs',
};

function formatWordSmart(word: string, capitalizeFirst: boolean): string {
  if (!word) return word;
  // Preserve leading/trailing punctuation
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

/**
 * Converts ALL-CAPS or mixed text to Title Case (for document subtitle / table labels)
 */
function toSmartTitleCase(raw?: string): string {
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

/**
 * Converts ALL-CAPS or mixed text into natural mid-sentence prose (no ALL-CAPS words in middle of paragraphs)
 */
function toMidSentenceProse(raw?: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .split(/\s+/)
    .map((w) => formatWordSmart(w, false))
    .join(' ');
}

/**
 * Strips trailing hospital name from project title so mid-sentence doesn't repeat "RSUD Al-Mulk"
 */
function stripHospitalSuffix(raw: string): string {
  return raw
    .replace(/\s*(uobk\s+)?rsud\s+al[-\s]?mulk(\s+kota\s+sukabumi)?\s*$/i, '')
    .trim();
}

function formatIndonesianDate(isoDate?: string): string {
  if (!isoDate) return '-';
  try {
    return format(parseISO(isoDate), 'dd MMMM yyyy', { locale: idLocale });
  } catch {
    return isoDate;
  }
}

function getYearFromDate(isoDate?: string): number {
  if (!isoDate) return new Date().getFullYear();
  try {
    const y = parseISO(isoDate).getFullYear();
    return Number.isFinite(y) ? y : new Date().getFullYear();
  } catch {
    return new Date().getFullYear();
  }
}

function inferDuringPic(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes('hvac') || lower.includes('hepa') || lower.includes('tekanan') || lower.includes('ventilasi')) {
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
  if (lower.includes('hvac') || lower.includes('ventilasi') || lower.includes('plumbing') || lower.includes('sanitasi')) {
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

function stripPhasePrefix(label: string): string {
  return label
    .replace(/^\[(Selama|Setelah)\s+Konstruksi\]\s*/i, '')
    .replace(/^\[(Selama|Setelah)\s+Proyek[^\]]*\]\s*/i, '')
    .trim();
}

const BASE_TEXT_STYLE: React.CSSProperties = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '12pt',
  lineHeight: '1.5',
  fontWeight: 400,
  color: '#000000',
};

export default function IcraOfficialReport({
  project,
  monitoringLogs = [],
  ketuaPpiName = 'dr. Nurul Iman',
  signDate,
  documentId = 'print-area-icra',
}: IcraOfficialReportProps) {
  const projectYear = getYearFromDate(project.tgl_mulai);
  const rawProjectName = project.nama_proyek?.trim() || 'Kegiatan Konstruksi / Renovasi';
  const cleanedBaseName = stripHospitalSuffix(rawProjectName) || rawProjectName;

  // Title-cased name for headings/tables, and lowercase natural prose for mid-paragraph sentences
  const projectTitleDisplay = toSmartTitleCase(cleanedBaseName);
  const projectProse = toMidSentenceProse(cleanedBaseName);

  const rawLokasi = project.lokasi_area?.trim() || 'Lingkungan Rumah Sakit';
  const lokasiTitleDisplay = toSmartTitleCase(rawLokasi);
  const lokasiProse = toMidSentenceProse(rawLokasi);

  const rawAreaTerdampak = project.area_terdampak?.trim() || '';
  const areaTerdampakProse = toMidSentenceProse(rawAreaTerdampak);
  const areaTerdampakTitle = toSmartTitleCase(rawAreaTerdampak);

  const rawKontraktor = project.kontraktor_pelaksana?.trim() || 'IPSRS RSUD Al-Mulk';
  const kontraktorDisplay = toSmartTitleCase(rawKontraktor);
  const kontraktorProse = toMidSentenceProse(rawKontraktor);

  const pjProyekDisplay = toSmartTitleCase(project.pj_proyek?.trim() || '');
  const namaIpcn = project.nama_ipcn?.trim() || 'Adi Tresa Purnama, A.M.Kep';
  const tglPengesahan = formatIndonesianDate(signDate || project.tgl_mulai || format(new Date(), 'yyyy-MM-dd'));

  const tipeCode = project.tipe_konstruksi || 'C';
  const riskCode = project.kelompok_risiko || '2';
  const kelasCode = project.kelas_tindakan || 'III';
  const riskRoman = RISK_ROMAN[riskCode] || 'II';

  const typeInfo = CONSTRUCTION_TYPES.find((t) => t.code === tipeCode) || CONSTRUCTION_TYPES[2];
  const riskInfo = PATIENT_RISK_GROUPS.find((r) => r.code === riskCode) || PATIENT_RISK_GROUPS[1];
  const classControl = CONSTRUCTION_CLASS_CONTROLS[kelasCode] || CONSTRUCTION_CLASS_CONTROLS.III;

  const riskLabelLower = riskInfo.riskLabel.toLowerCase();
  const lokasiLengkapTable = areaTerdampakTitle
    ? `${lokasiTitleDisplay} (Area terdampak sekitar: ${areaTerdampakTitle})`
    : lokasiTitleDisplay;
  const lokasiLengkapProse = areaTerdampakProse
    ? `${lokasiProse} yang berdekatan dengan ${areaTerdampakProse}`
    : lokasiProse;

  const isDemolition = /bongkar|pembongkaran/i.test(rawProjectName);
  const activityNoun = isDemolition ? 'pembongkaran' : 'renovasi dan konstruksi';
  const activityNounCap = isDemolition ? 'Pembongkaran' : 'Renovasi dan Konstruksi';

  const [chapterPages, setChapterPages] = useState<Record<string, number>>({
    'latar-belakang': 1,
    'tujuan-ruang-lingkup': 1,
    'perencanaan': 2,
    'tipe-proyek': 2,
    'kategori-risiko': 3,
    'matriks-icra': 3,
    'rencana-tindakan': 4,
    'kesimpulan': 6,
    'rekomendasi': 7,
    'penutup': 8,
    'bukti-dokumentasi': 9,
    'formulir-pre': 10,
    'formulir-intra': 12,
    'formulir-post': 13,
  });

  const handleChaptersResolved = useCallback((resolved: Record<string, number>) => {
    setChapterPages((prev) => ({ ...prev, ...resolved }));
  }, []);

  // Build Tindakan tables integrating exact ICRA Konstruksi checklist items
  const { praActions, saatActions, pascaActions } = useMemo(() => {
    const pra: { tindakan: string; pj: string }[] = [
      {
        tindakan: 'Melakukan rapat koordinasi antara tim teknis (IPSRS), Komite PPI, kontraktor, dan manajemen ruangan atau unit terdampak.',
        pj: 'Manajemen RS, Tim PPI, Teknik',
      },
      {
        tindakan: 'Menyusun dan mengesahkan dokumen pengkajian ICRA serta rencana kerja pelaksanaan proyek.',
        pj: 'Tim PPI, Teknik',
      },
      {
        tindakan: `Melakukan identifikasi dan klasifikasi risiko pasien pada lokasi ${lokasiProse}${areaTerdampakProse ? ` serta area sekitar (${areaTerdampakProse})` : ''}.`,
        pj: 'IPCN dan PJ Ruangan',
      },
      {
        tindakan: `Menyusun jadwal kerja ${activityNoun} agar tidak mengganggu jam-jam kritis pelayanan rumah sakit.`,
        pj: 'Teknik dan Manajemen Ruang',
      },
      {
        tindakan: 'Menyiapkan barier fisik (penyekat plastik kedap debu atau partisi gypsum) sesuai kelas kewaspadaan di area kerja.',
        pj: 'Kontraktor, Teknik',
      },
      {
        tindakan: 'Melakukan pemberitahuan resmi kepada pasien, keluarga, dan staf unit sekitar mengenai jadwal kegiatan.',
        pj: 'Humas RS, PPI',
      },
      {
        tindakan: 'Menutup, menyegel, atau mengalihkan sistem ventilasi dan HVAC yang terhubung ke area pekerjaan.',
        pj: 'Tim Teknik / IPSRS',
      },
      {
        tindakan: 'Memastikan jalur khusus untuk keluar masuk material bangunan dan pengangkutan limbah atau puing konstruksi.',
        pj: 'Teknik dan Kontraktor',
      },
      {
        tindakan: 'Memastikan ketersediaan dan kepatuhan penggunaan APD bagi seluruh pekerja konstruksi.',
        pj: 'Kontraktor',
      },
      {
        tindakan: 'Menyediakan alat pembersih, keset basah, dan cairan disinfektan di sekitar area kerja.',
        pj: 'Cleaning Service RS',
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

    const saat: { tindakan: string; pj: string }[] = [
      ...baseDuring.map((item) => ({
        tindakan: item,
        pj: inferDuringPic(item),
      })),
      {
        tindakan: 'Melakukan pembersihan harian terhadap area luar barier (koridor dan jalur akses sekitar proyek).',
        pj: 'Cleaning Service',
      },
      {
        tindakan: 'Memastikan seluruh pekerja menggunakan APD lengkap selama berada di area kerja.',
        pj: 'Kontraktor',
      },
      {
        tindakan: 'Melakukan pengecekan dan monitoring rutin oleh IPCN terkait kepatuhan terhadap protokol pengendalian infeksi.',
        pj: 'IPCN',
      },
      {
        tindakan: 'Menyimpan bahan material berbahaya (cat, semen, pelarut, dan sejenisnya) di area yang aman dan terkunci.',
        pj: 'Kontraktor',
      },
    ];

    const pasca: { tindakan: string; pj: string }[] = [
      ...baseAfter.map((item) => ({
        tindakan: item,
        pj: inferAfterPic(item),
      })),
      {
        tindakan: 'Melakukan pemeriksaan kebersihan permukaan, kelayakan fungsi sarana, dan keamanan lingkungan oleh Tim PPI dan Teknik.',
        pj: 'Tim PPI, Teknik',
      },
      {
        tindakan: 'Melakukan serah terima pekerjaan secara formal dari pelaksana atau kontraktor kepada pihak rumah sakit.',
        pj: 'Teknik, Manajemen RS',
      },
      {
        tindakan: 'Membuka kembali akses area setelah dinyatakan aman dan bersih oleh Komite PPI dan Manajemen.',
        pj: 'PPI dan Manajemen Ruangan',
      },
      {
        tindakan: 'Menyimpan dokumentasi lengkap proyek dan laporan ICRA untuk keperluan audit, evaluasi pascaproyek, dan akreditasi.',
        pj: 'Tim PPI, Sekretariat RS',
      },
    ];

    return { praActions: pra, saatActions: saat, pascaActions: pasca };
  }, [project.checklist_pengendalian, classControl, lokasiProse, areaTerdampakProse, activityNoun]);

  // Collect Photos across Pre (foto_sebelum), Intra (monitoringLogs.foto_monitoring), Post (foto_sesudah)
  const prePhotos = useMemo(
    () => (project.foto_sebelum || []).map((u) => normalizeImageUrl(u)).filter(Boolean),
    [project.foto_sebelum]
  );

  const intraPhotos = useMemo(() => {
    const all: { url: string; caption?: string }[] = [];
    const seen = new Set<string>();
    monitoringLogs.forEach((log) => {
      (log.foto_monitoring || []).forEach((u) => {
        const norm = normalizeImageUrl(u);
        if (norm && !seen.has(norm)) {
          seen.add(norm);
          all.push({
            url: norm,
            caption: `Monitoring ${formatIndonesianDate(log.tanggal_monitoring)}`,
          });
        }
      });
    });
    return all;
  }, [monitoringLogs]);

  const postPhotos = useMemo(
    () => (project.foto_sesudah || []).map((u) => normalizeImageUrl(u)).filter(Boolean),
    [project.foto_sesudah]
  );

  // Front Matter: Kata Pengantar (ii) & Daftar Isi (iii) — Arial 12pt, line-spacing 1.5, normal body weight
  const frontMatterPages: FrontMatterPageSpec[] = useMemo(
    () => [
      {
        key: 'icra-fm-kata-pengantar',
        label: 'ii',
        node: (
          <div
            className="w-full h-full flex flex-col justify-between text-[12pt] leading-[1.5] text-justify text-black font-normal"
            style={BASE_TEXT_STYLE}
          >
            <div>
              <div className="text-center mb-6">
                <h2
                  className="text-[12pt] uppercase font-bold text-black"
                  style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                >
                  KATA PENGANTAR
                </h2>
              </div>
              <div className="space-y-3 font-normal" style={BASE_TEXT_STYLE}>
                <p className="indent-8 font-normal">
                  Puji syukur kami panjatkan ke hadirat Tuhan Yang Maha Esa atas segala rahmat dan karunia-Nya sehingga laporan <em>Infection Control Risk Assessment</em> (ICRA) untuk kegiatan {projectProse} di UOBK RSUD Al-Mulk Kota Sukabumi tahun {projectYear} dapat disusun dengan baik.
                </p>
                <p className="indent-8 font-normal">
                  Laporan ini disusun sebagai bentuk komitmen Komite PPI dalam penerapan prinsip pencegahan dan pengendalian infeksi pada kegiatan {activityNoun} di lingkungan rumah sakit. Berdasarkan hasil pengkajian awal, lokasi kegiatan berada di {lokasiLengkapProse}. Area tersebut termasuk dalam klasifikasi kelompok risiko {riskLabelLower} dengan tipe pekerjaan {tipeCode}, sehingga pekerjaan berpotensi menimbulkan debu dan kontaminasi lingkungan yang perlu dikendalikan, terutama apabila aktivitas pelayanan rumah sakit tetap berjalan.
                </p>
                <p className="indent-8 font-normal">
                  Dokumen ini memuat latar belakang, tujuan dan ruang lingkup, perencanaan proyek, klasifikasi tipe konstruksi, kategori risiko pasien, matriks ICRA, rencana tindakan pengendalian infeksi sebelum, selama, dan setelah pekerjaan, pemantauan pelaksanaan, kesimpulan, rekomendasi, penutup, serta bukti dokumentasi.
                </p>
                <p className="indent-8 font-normal">
                  Penyusunan dan pelaksanaan ICRA memerlukan kerja sama antara Komite PPI, manajemen rumah sakit, IPSRS, K3RS, kesehatan lingkungan, penanggung jawab area terdampak, serta pihak pelaksana ({kontraktorProse}). Seluruh proses pengendalian dipantau melalui survei lapangan dan koordinasi lintas unit sampai kegiatan selesai dilaksanakan.
                </p>
                <p className="indent-8 font-normal">
                  Semoga dokumen ini dapat digunakan sebagai pedoman pelaksanaan kegiatan {activityNoun} yang aman, terkendali, dan selaras dengan upaya peningkatan mutu pelayanan serta keselamatan pasien di UOBK RSUD Al-Mulk Kota Sukabumi.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-6 pr-4 font-normal" style={BASE_TEXT_STYLE}>
              <div className="text-center">
                <p className="font-normal">Tim Penyusun</p>
                <div className="h-16" />
                <p className="font-normal">IPCN</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'icra-fm-daftar-isi',
        label: 'iii',
        node: (
          <div
            className="w-full flex flex-col justify-start text-[12pt] leading-[1.5] text-black font-normal"
            style={BASE_TEXT_STYLE}
          >
            <div className="text-center mb-6">
              <h2
                className="text-[12pt] uppercase font-bold text-black"
                style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
              >
                DAFTAR ISI
              </h2>
            </div>

            <div className="space-y-2 text-[12pt] leading-[1.5] font-normal" style={BASE_TEXT_STYLE}>
              {[
                { label: 'KATA PENGANTAR', page: 'ii', indent: false },
                { label: 'DAFTAR ISI', page: 'iii', indent: false },
                { label: 'LAPORAN INFECTION CONTROL RISK ASSESSMENT (ICRA)', page: '1', indent: false },
                { label: 'LATAR BELAKANG', page: String(chapterPages['latar-belakang'] ?? 1), indent: true },
                { label: 'TUJUAN DAN RUANG LINGKUP', page: String(chapterPages['tujuan-ruang-lingkup'] ?? 1), indent: true },
                { label: 'PERENCANAAN', page: String(chapterPages['perencanaan'] ?? 2), indent: true },
                { label: 'TIPE PROYEK KONSTRUKSI', page: String(chapterPages['tipe-proyek'] ?? 2), indent: true },
                { label: 'KATEGORI RISIKO PASIEN', page: String(chapterPages['kategori-risiko'] ?? 3), indent: true },
                { label: 'MATRIKS ICRA', page: String(chapterPages['matriks-icra'] ?? 3), indent: true },
                { label: 'RENCANA TINDAKAN PENGENDALIAN INFEKSI', page: String(chapterPages['rencana-tindakan'] ?? 4), indent: true },
                { label: 'KESIMPULAN', page: String(chapterPages['kesimpulan'] ?? 6), indent: true },
                { label: 'REKOMENDASI', page: String(chapterPages['rekomendasi'] ?? 7), indent: true },
                { label: 'PENUTUP', page: String(chapterPages['penutup'] ?? 8), indent: true },
                { label: 'BUKTI DOKUMENTASI', page: String(chapterPages['bukti-dokumentasi'] ?? 9), indent: true },
                { label: 'FORMULIR PRE RENOVASI / KONSTRUKSI', page: String(chapterPages['formulir-pre'] ?? 10), indent: true },
                { label: 'FORMULIR PEMANTAUAN INTRA RENOVASI / KONSTRUKSI', page: String(chapterPages['formulir-intra'] ?? 12), indent: true },
                { label: 'FORMULIR POST RENOVASI / KONSTRUKSI', page: String(chapterPages['formulir-post'] ?? 13), indent: true },
              ].map((entry, i) => (
                <div
                  key={i}
                  className={`flex items-baseline justify-between font-normal ${entry.indent ? 'pl-6' : ''}`}
                >
                  <span className="shrink-0 font-normal">{entry.label}</span>
                  <span className="flex-1 mx-2 border-b border-dotted border-black" />
                  <span className="shrink-0 font-normal min-w-[20px] text-right">{entry.page}</span>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
    [projectProse, projectYear, activityNoun, lokasiLengkapProse, riskLabelLower, tipeCode, kontraktorProse, chapterPages]
  );

  // Build Atomic Flow Blocks for AutoPaginatedF4Document (Arial 12pt, line-height 1.5, 2.5cm margins)
  const blocks: FlowBlock[] = useMemo(() => {
    const b: FlowBlock[] = [];

    // Section heading (BOLD — only headings & subheadings are bold)
    const pushHeading = (key: string, title: string, anchor?: string) => {
      b.push({
        type: 'element',
        key,
        chapterAnchor: anchor,
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <h2
            className="text-[12pt] leading-[1.5] font-bold uppercase text-black mt-2"
            style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
          >
            {title}
          </h2>
        ),
      });
    };

    // Sub-heading (BOLD)
    const pushSubHeading = (key: string, title: string) => {
      b.push({
        type: 'element',
        key,
        keepWithNext: true,
        gapAfter: 4,
        node: (
          <p
            className="text-[12pt] leading-[1.5] font-bold text-black mt-1"
            style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
          >
            {title}
          </p>
        ),
      });
    };

    // Normal body paragraph (Arial 12pt, line-height 1.5, strictly normal weight)
    const pushParagraph = (key: string, content: React.ReactNode, gapAfter = 8, indent = true) => {
      b.push({
        type: 'element',
        key,
        gapAfter,
        node: (
          <p
            className={`text-[12pt] leading-[1.5] text-justify text-black font-normal ${indent ? 'indent-8' : ''}`}
            style={BASE_TEXT_STYLE}
          >
            {content}
          </p>
        ),
      });
    };

    // ==================== JUDUL HALAMAN 1 (BOLD) ====================
    b.push({
      type: 'element',
      key: 'doc-main-title',
      keepWithNext: true,
      gapAfter: 14,
      node: (
        <div className="text-center pb-2 mb-1" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
          <h1
            className="text-[12pt] leading-[1.5] font-bold uppercase text-black"
            style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
          >
            LAPORAN ICRA (INFECTION CONTROL RISK ASSESSMENT)
          </h1>
          <p
            className="text-[12pt] leading-[1.5] font-bold text-black"
            style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
          >
            {projectTitleDisplay}
          </p>
          <p
            className="text-[12pt] leading-[1.5] font-bold text-black"
            style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
          >
            UOBK RSUD Al-Mulk Kota Sukabumi
          </p>
        </div>
      ),
    });

    // ==================== 1. LATAR BELAKANG ====================
    pushHeading('sec-latar-belakang', 'LATAR BELAKANG', 'latar-belakang');
    pushParagraph(
      'lb-1',
      'Rumah sakit sebagai institusi pelayanan kesehatan memiliki tanggung jawab dalam menyediakan lingkungan pelayanan yang aman bagi pasien, tenaga kesehatan, pegawai, pengunjung, dan masyarakat sekitar. Pemeliharaan serta pengembangan sarana dan prasarana rumah sakit merupakan salah satu upaya untuk mendukung mutu pelayanan. Setiap kegiatan pembongkaran, konstruksi, atau renovasi yang dilaksanakan di lingkungan rumah sakit harus memperhatikan aspek pencegahan dan pengendalian infeksi (PPI).'
    );
    pushParagraph(
      'lb-2',
      `UOBK RSUD Al-Mulk Kota Sukabumi merencanakan dan melaksanakan kegiatan ${projectProse} yang berlokasi di ${lokasiLengkapProse} bersama pelaksana ${kontraktorProse}. Lingkup teknis pekerjaan, batas area kerja, metode pelaksanaan, kondisi bangunan, serta jadwal kegiatan dikoordinasikan bersama manajemen rumah sakit dan tim teknis terkait.`
    );
    pushParagraph(
      'lb-3',
      <>
        Aktivitas {activityNoun} berpotensi menghasilkan debu, partikel material bangunan, dan spora jamur, termasuk <em>Aspergillus</em>, yang dapat menyebar melalui udara, pintu, jendela, atau sistem ventilasi. Selain itu, mobilisasi pekerja dan pengangkutan puing berpotensi menyebabkan kontaminasi lingkungan. Gangguan jaringan air, listrik, drainase, dan akses pelayanan juga dinilai bersama tim terkait melalui pengkajian prakonstruksi.
      </>
    );
    pushParagraph(
      'lb-4',
      'Oleh karena itu diperlukan ICRA sebagai proses terdokumentasi sebelum pekerjaan dimulai. Pengkajian ini mengacu pada Permenkes Nomor 27 Tahun 2017, Lampiran I halaman 137–146, untuk menetapkan tipe proyek, kelompok pasien berisiko, kelas kewaspadaan, dan intervensi pengendalian infeksi. Pelaksanaan dan efektivitas tindakan tersebut selanjutnya dipantau serta dievaluasi sampai pekerjaan selesai.',
      12
    );

    // ==================== 2. TUJUAN DAN RUANG LINGKUP ====================
    pushHeading('sec-tujuan', 'TUJUAN DAN RUANG LINGKUP', 'tujuan-ruang-lingkup');
    pushSubHeading('tujuan-sub-1', '1. Tujuan');
    b.push({
      type: 'element',
      key: 'tujuan-body-1',
      gapAfter: 8,
      node: (
        <p className="pl-5 text-[12pt] leading-[1.5] text-justify text-black font-normal" style={BASE_TEXT_STYLE}>
          Mengidentifikasi, menilai, dan mengendalikan risiko infeksi akibat kegiatan {projectProse} di {lokasiProse} agar paparan debu dan kontaminasi lingkungan dapat diminimalkan serta kegiatan pelayanan rumah sakit tetap berlangsung secara aman. Secara khusus, ICRA bertujuan menetapkan kelas kewaspadaan, intervensi pengendalian infeksi, tanggung jawab lintas unit, serta mekanisme monitoring dan tindak lanjut.
        </p>
      ),
    });

    pushSubHeading('tujuan-sub-2', '2. Ruang Lingkup');
    b.push({
      type: 'element',
      key: 'tujuan-body-2',
      gapAfter: 12,
      node: (
        <p className="pl-5 text-[12pt] leading-[1.5] text-justify text-black font-normal" style={BASE_TEXT_STYLE}>
          Mencakup persiapan dan pengamanan area kerja di {lokasiProse}, pelaksanaan {activityNoun} sesuai ruang lingkup teknis yang disetujui, pemindahan material dan puing melalui jalur terkendali, perlindungan area sekitar{areaTerdampakProse ? ` (${areaTerdampakProse})` : ''} serta area lain yang terdampak, pembersihan akhir, dan evaluasi pascapekerjaan.
        </p>
      ),
    });

    // ==================== 3. PERENCANAAN ====================
    pushHeading('sec-perencanaan', 'PERENCANAAN', 'perencanaan');
    b.push({
      type: 'element',
      key: 'perencanaan-table',
      gapAfter: 12,
      node: (
        <table
          className="w-full border-collapse text-[12pt] leading-[1.5] text-black font-normal"
          style={BASE_TEXT_STYLE}
        >
          <tbody>
            <tr>
              <td className="py-1 px-1.5 align-top w-8 font-normal">1.</td>
              <td className="py-1 px-1.5 align-top w-44 font-normal">Tanggal</td>
              <td className="py-1 px-1 align-top w-4 font-normal">:</td>
              <td className="py-1 px-1.5 align-top font-normal">
                {formatIndonesianDate(project.tgl_mulai)} s/d {formatIndonesianDate(project.tgl_selesai_estimasi)}
              </td>
            </tr>
            <tr>
              <td className="py-1 px-1.5 align-top font-normal">2.</td>
              <td className="py-1 px-1.5 align-top font-normal">Lokasi</td>
              <td className="py-1 px-1 align-top font-normal">:</td>
              <td className="py-1 px-1.5 align-top font-normal">{lokasiLengkapTable}</td>
            </tr>
            <tr>
              <td className="py-1 px-1.5 align-top font-normal">3.</td>
              <td className="py-1 px-1.5 align-top font-normal">Kegiatan</td>
              <td className="py-1 px-1 align-top font-normal">:</td>
              <td className="py-1 px-1.5 align-top font-normal">{projectTitleDisplay}</td>
            </tr>
            <tr>
              <td className="py-1 px-1.5 align-top font-normal">4.</td>
              <td className="py-1 px-1.5 align-top font-normal">Pelaksana / PJ</td>
              <td className="py-1 px-1 align-top font-normal">:</td>
              <td className="py-1 px-1.5 align-top font-normal">
                {kontraktorDisplay}{pjProyekDisplay ? ` (Penanggung Jawab: ${pjProyekDisplay})` : ''}
              </td>
            </tr>
            {project.nomor_izin && (
              <tr>
                <td className="py-1 px-1.5 align-top font-normal">5.</td>
                <td className="py-1 px-1.5 align-top font-normal">Nomor Izin ICRA</td>
                <td className="py-1 px-1 align-top font-normal">:</td>
                <td className="py-1 px-1.5 align-top font-normal">{project.nomor_izin}</td>
              </tr>
            )}
          </tbody>
        </table>
      ),
    });

    // ==================== 4. TIPE PROYEK KONSTRUKSI (ATOMIC ROWS) ====================
    pushHeading('sec-tipe-proyek', 'TIPE PROYEK KONSTRUKSI', 'tipe-proyek');
    b.push({
      type: 'element',
      key: 'tipe-proyek-intro',
      keepWithNext: true,
      gapAfter: 6,
      node: (
        <p className="text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
          Berdasarkan pedoman ICRA, tipe proyek diklasifikasikan sebagai berikut:
        </p>
      ),
    });

    CONSTRUCTION_TYPES.forEach((ct, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === CONSTRUCTION_TYPES.length - 1;
      const isSelected = ct.code === tipeCode;
      b.push({
        type: 'element',
        key: `tipe-proyek-row-${ct.code}`,
        gapAfter: isLast ? 12 : 0,
        node: (
          <table
            className={`w-full table-fixed border-collapse text-[12pt] leading-[1.5] text-black font-normal ${
              isFirst ? '' : '-mt-[1px]'
            }`}
            style={BASE_TEXT_STYLE}
          >
            {isFirst && (
              <thead>
                <tr className="bg-gray-100 text-center">
                  <th
                    className="border border-black py-1.5 px-2.5 w-[24%] font-bold"
                    style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                  >
                    Tipe Proyek
                  </th>
                  <th
                    className="border border-black py-1.5 px-2.5 w-[76%] text-left font-bold"
                    style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                  >
                    Deskripsi
                  </th>
                </tr>
              </thead>
            )}
            <tbody>
              <tr style={{ backgroundColor: isSelected ? '#fef9c3' : '#ffffff' }}>
                <td className="border border-black py-1.5 px-2.5 w-[24%] align-top text-center font-normal">
                  Tipe {ct.code}{isSelected ? ' (Dipilih)' : ''}
                </td>
                <td className="border border-black py-1.5 px-2.5 w-[76%] align-top text-left font-normal">
                  {ct.shortDesc}: {ct.items.join('; ')}.
                </td>
              </tr>
            </tbody>
          </table>
        ),
      });
    });

    // ==================== 5. KATEGORI RISIKO PASIEN (ATOMIC ROWS) ====================
    pushHeading('sec-kategori-risiko', 'KATEGORI RISIKO PASIEN', 'kategori-risiko');
    b.push({
      type: 'element',
      key: 'kategori-risiko-intro',
      keepWithNext: true,
      gapAfter: 6,
      node: (
        <p className="text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
          Klasifikasi risiko pasien dibagi menjadi:
        </p>
      ),
    });

    PATIENT_RISK_GROUPS.forEach((rg, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === PATIENT_RISK_GROUPS.length - 1;
      const isSelected = rg.code === riskCode;
      const roman = RISK_ROMAN[rg.code];
      b.push({
        type: 'element',
        key: `kategori-risiko-row-${rg.code}`,
        gapAfter: isLast ? 12 : 0,
        node: (
          <table
            className={`w-full table-fixed border-collapse text-[12pt] leading-[1.5] text-black font-normal ${
              isFirst ? '' : '-mt-[1px]'
            }`}
            style={BASE_TEXT_STYLE}
          >
            {isFirst && (
              <thead>
                <tr className="bg-gray-100 text-center">
                  <th
                    className="border border-black py-1.5 px-2.5 w-[36%] text-left font-bold"
                    style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                  >
                    Kategori Risiko
                  </th>
                  <th
                    className="border border-black py-1.5 px-2.5 w-[64%] text-left font-bold"
                    style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                  >
                    Deskripsi Unit
                  </th>
                </tr>
              </thead>
            )}
            <tbody>
              <tr style={{ backgroundColor: isSelected ? '#fef9c3' : '#ffffff' }}>
                <td className="border border-black py-1.5 px-2.5 w-[36%] align-top text-left font-normal">
                  Kategori {roman} (Risiko {rg.riskLabel}){isSelected ? ' — Dipilih' : ''}
                </td>
                <td className="border border-black py-1.5 px-2.5 w-[64%] align-top text-left font-normal">
                  {rg.areas}
                </td>
              </tr>
            </tbody>
          </table>
        ),
      });
    });

    // ==================== 6. MATRIKS ICRA ====================
    pushHeading('sec-matriks-icra', 'MATRIKS ICRA', 'matriks-icra');
    b.push({
      type: 'element',
      key: 'matriks-icra-table',
      gapAfter: 8,
      node: (
        <div className="space-y-2 text-black font-normal" style={BASE_TEXT_STYLE}>
          <p className="text-[12pt] leading-[1.5] font-normal">
            (Menentukan Kategori Pengendalian Berdasarkan Kombinasi Tipe Proyek dan Risiko Pasien)
          </p>
          <table
            className="w-full table-fixed border-collapse border border-black text-[12pt] leading-[1.5] font-normal"
            style={BASE_TEXT_STYLE}
          >
            <thead>
              <tr className="bg-gray-100 text-center">
                <th
                  className="border border-black py-1.5 px-2.5 text-left w-[44%] font-bold"
                  style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                >
                  Risiko Pasien / Tipe Proyek
                </th>
                {(['A', 'B', 'C', 'D'] as ConstructionType[]).map((t) => (
                  <th
                    key={t}
                    className="border border-black py-1.5 px-1.5 w-[14%] font-bold"
                    style={{
                      ...BASE_TEXT_STYLE,
                      fontWeight: 700,
                      backgroundColor: t === tipeCode ? '#e0f2fe' : undefined,
                    }}
                  >
                    Tipe {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PATIENT_RISK_GROUPS.map((rg) => {
                const roman = RISK_ROMAN[rg.code];
                const isRowActive = rg.code === riskCode;
                return (
                  <tr key={rg.code}>
                    <td
                      className="border border-black py-1.5 px-2.5 text-left font-normal"
                      style={{ backgroundColor: isRowActive ? '#e0f2fe' : '#ffffff' }}
                    >
                      Kategori {roman} – Risiko {rg.riskLabel}
                    </td>
                    {(['A', 'B', 'C', 'D'] as ConstructionType[]).map((t) => {
                      const cell = CONSTRUCTION_MATRIX[rg.code][t];
                      const isTarget = isRowActive && t === tipeCode;
                      const displayVal = isTarget
                        ? kelasCode
                        : cell.isAmbiguousIIIorIV
                        ? 'III/IV'
                        : cell.classLevel;
                      return (
                        <td
                          key={t}
                          className="border border-black py-1.5 px-1.5 text-center font-normal"
                          style={{
                            backgroundColor: isTarget ? '#fde047' : '#ffffff',
                          }}
                        >
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'matriks-icra-result',
      gapAfter: 12,
      node: (
        <p className="text-[12pt] leading-[1.5] text-justify text-black font-normal" style={BASE_TEXT_STYLE}>
          Hasil untuk proyek ini: → kombinasi tipe {tipeCode} dan risiko kategori {riskRoman} (risiko {riskLabelLower}) → kategori {kelasCode} pengendalian infeksi diperlukan.
        </p>
      ),
    });

    // ==================== 7. RENCANA TINDAKAN PENGENDALIAN INFEKSI (ATOMIC PER-ROW) ====================
    pushHeading('sec-rencana-tindakan', 'RENCANA TINDAKAN PENGENDALIAN INFEKSI', 'rencana-tindakan');

    const pushAtomicActionTable = (
      prefix: string,
      subTitle: string,
      rows: { tindakan: string; pj: string }[]
    ) => {
      pushSubHeading(`${prefix}-title`, subTitle);

      rows.forEach((r, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === rows.length - 1;
        b.push({
          type: 'element',
          key: `${prefix}-row-${idx}`,
          gapAfter: isLast ? 10 : 0,
          node: (
            <table
              className={`w-full table-fixed border-collapse text-[12pt] leading-[1.5] text-black font-normal ${
                isFirst ? '' : '-mt-[1px]'
              }`}
              style={BASE_TEXT_STYLE}
            >
              {isFirst && (
                <thead>
                  <tr className="bg-gray-100">
                    <th
                      className="border border-black py-1.5 px-2 text-center w-[9%] font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                    >
                      No
                    </th>
                    <th
                      className="border border-black py-1.5 px-2.5 text-left w-[63%] font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                    >
                      Tindakan
                    </th>
                    <th
                      className="border border-black py-1.5 px-2.5 text-left w-[28%] font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                    >
                      Penanggung Jawab
                    </th>
                  </tr>
                </thead>
              )}
              <tbody>
                <tr>
                  <td className="border border-black py-1.5 px-2 text-center align-top w-[9%] font-normal">
                    {idx + 1}
                  </td>
                  <td className="border border-black py-1.5 px-2.5 align-top text-justify w-[63%] font-normal">
                    {r.tindakan}
                  </td>
                  <td className="border border-black py-1.5 px-2.5 align-top text-left w-[28%] font-normal">
                    {r.pj}
                  </td>
                </tr>
              </tbody>
            </table>
          ),
        });
      });
    };

    pushAtomicActionTable('pra', 'Tindakan Pra-Renovasi (Sebelum Pekerjaan)', praActions);
    pushAtomicActionTable(
      'saat',
      `Tindakan Saat Renovasi — Kelas ${kelasCode} (Selama Pekerjaan)`,
      saatActions
    );
    pushAtomicActionTable(
      'pasca',
      `Tindakan Pasca-Renovasi — Kelas ${kelasCode} (Setelah Pekerjaan)`,
      pascaActions
    );

    if (project.persyaratan_khusus && project.persyaratan_khusus.trim()) {
      pushSubHeading('persyaratan-khusus-title', 'Catatan dan Persyaratan Khusus Lapangan');
      pushParagraph('persyaratan-khusus-body', toMidSentenceProse(project.persyaratan_khusus.trim()), 10, false);
    }

    if (monitoringLogs.length > 0) {
      pushSubHeading(
        'monitoring-summary-title',
        `Ringkasan Pemantauan Harian IPCN (${monitoringLogs.length} Kunjungan)`
      );
      const shownLogs = monitoringLogs.slice(0, 12);
      shownLogs.forEach((m, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === shownLogs.length - 1;
        b.push({
          type: 'element',
          key: `mon-row-${m.id}-${idx}`,
          gapAfter: isLast ? 12 : 0,
          node: (
            <table
              className={`w-full table-fixed border-collapse text-[12pt] leading-[1.5] text-black font-normal ${
                isFirst ? '' : '-mt-[1px]'
              }`}
              style={BASE_TEXT_STYLE}
            >
              {isFirst && (
                <thead>
                  <tr className="bg-gray-100 text-center">
                    <th
                      className="border border-black py-1.5 px-1.5 w-[9%] font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                    >
                      No
                    </th>
                    <th
                      className="border border-black py-1.5 px-2 w-[25%] font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                    >
                      Tanggal
                    </th>
                    <th
                      className="border border-black py-1.5 px-2 w-[22%] font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                    >
                      Status
                    </th>
                    <th
                      className="border border-black py-1.5 px-2 w-[44%] text-left font-bold"
                      style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
                    >
                      Temuan dan Tindak Lanjut
                    </th>
                  </tr>
                </thead>
              )}
              <tbody>
                <tr>
                  <td className="border border-black py-1.5 px-1.5 w-[9%] text-center align-top font-normal">
                    {idx + 1}
                  </td>
                  <td className="border border-black py-1.5 px-2 w-[25%] text-center align-top font-normal">
                    {formatIndonesianDate(m.tanggal_monitoring)}
                  </td>
                  <td className="border border-black py-1.5 px-2 w-[22%] text-center align-top font-normal">
                    {m.status_kepatuhan}
                  </td>
                  <td className="border border-black py-1.5 px-2 w-[44%] text-left align-top font-normal">
                    {m.temuan_lapangan
                      ? `Temuan: ${m.temuan_lapangan}`
                      : 'Sesuai protokol pengendalian infeksi PPI.'}
                    {m.tindakan_koreksi ? ` Tindak lanjut: ${m.tindakan_koreksi}` : ''}
                  </td>
                </tr>
              </tbody>
            </table>
          ),
        });
      });
    }

    // ==================== 8. KESIMPULAN ====================
    pushHeading('sec-kesimpulan', 'KESIMPULAN', 'kesimpulan');
    pushParagraph(
      'kes-1',
      `Kegiatan ${projectProse} di ${lokasiProse} merupakan langkah penting dan strategis dalam rangka meningkatkan kualitas fasilitas sarana prasarana serta kenyamanan pelayanan bagi pasien, keluarga, dan tenaga kesehatan di lingkungan UOBK RSUD Al-Mulk Kota Sukabumi. Namun, karena pelaksanaan kegiatan berada di lingkungan rumah sakit aktif${areaTerdampakProse ? ` yang berdekatan dengan ${areaTerdampakProse}` : ''}, maka terdapat potensi risiko penularan infeksi yang harus diantisipasi secara cermat dan terstruktur.`
    );
    pushParagraph(
      'kes-2',
      <>
        Melalui proses <em>Infection Control Risk Assessment</em> (ICRA), proyek ini dikategorikan sebagai tipe {tipeCode} ({typeInfo.shortDesc.toLowerCase()}) dengan risiko pasien pada kategori {riskRoman} (risiko {riskLabelLower}). Berdasarkan klasifikasi matriks ICRA, kombinasi ini menghasilkan kategori {kelasCode} pengendalian infeksi, yang mengharuskan penerapan tindakan pencegahan terstandar seperti {classControl.summary.toLowerCase()}
      </>
    );
    pushParagraph(
      'kes-3',
      `Langkah-langkah yang dilakukan sebelum, selama, dan sesudah ${activityNoun} telah dirancang untuk meminimalkan potensi paparan debu maupun mikroorganisme patogen, mencegah infeksi silang, serta memastikan tidak terganggunya operasional layanan medis yang sedang berjalan. Prosedur ini menjadi bagian dari komitmen rumah sakit terhadap penerapan prinsip pencegahan dan pengendalian infeksi (PPI) secara konsisten dan berkelanjutan.`
    );
    pushParagraph(
      'kes-4',
      `Dengan dilaksanakannya ICRA secara menyeluruh dan dipatuhinya seluruh protokol pengendalian infeksi selama pekerjaan berlangsung, diharapkan kegiatan ${projectProse} dapat terselesaikan dengan baik, aman, dan tanpa menimbulkan dampak negatif terhadap keselamatan pasien, staf, maupun lingkungan rumah sakit.`,
      12
    );

    // ==================== 9. REKOMENDASI (ATOMIC PER-BULLET) ====================
    pushHeading('sec-rekomendasi', 'REKOMENDASI', 'rekomendasi');
    pushParagraph(
      'rek-intro',
      <>
        Berdasarkan hasil analisis risiko infeksi dan klasifikasi proyek melalui proses <em>Infection Control Risk Assessment</em> (ICRA), disampaikan beberapa rekomendasi penting sebagai panduan dan langkah tindak lanjut dalam pelaksanaan kegiatan {projectProse}, sebagai berikut:
      </>,
      6,
      false
    );

    const recSections: { title: string; items: string[] }[] = [
      {
        title: `1. Pelaksanaan ${activityNounCap}`,
        items: [
          `Kegiatan harus dilaksanakan dengan mengikuti kategori pengendalian infeksi kelas ${kelasCode}, sesuai hasil klasifikasi ICRA untuk proyek tipe ${tipeCode} dan risiko pasien kategori ${riskRoman}.`,
          'Pekerjaan harus dilakukan oleh tenaga kerja yang menggunakan alat pelindung diri (APD) lengkap serta memahami protokol pengendalian infeksi di rumah sakit.',
          kelasCode === 'III' || kelasCode === 'IV'
            ? 'Barikade fisik yang tertutup rapat dan kedap debu harus dipasang mengelilingi area pekerjaan sebelum kegiatan dimulai untuk mencegah penyebaran partikel ke area pelayanan sekitar.'
            : 'Area kerja harus diamankan dengan pembatas kerja yang rapi dan metode pengendalian debu sesuai standar kelas kewaspadaan.',
          'Akses keluar-masuk material dan limbah proyek harus melalui jalur khusus, tidak melintasi jalur pasien, dan menggunakan wadah tertutup rapat.',
        ],
      },
      {
        title: '2. Pencegahan Risiko Infeksi',
        items: [
          'Diperlukan monitoring berkala oleh tim PPI untuk mengevaluasi kepatuhan terhadap pengendalian infeksi dan mengidentifikasi potensi risiko baru selama proyek berlangsung.',
          kelasCode === 'III' || kelasCode === 'IV'
            ? 'Disarankan menjaga tekanan udara negatif dalam area kerja menggunakan penyaring udara HEPA portabel serta mengisolasi sistem ventilasi atau HVAC yang terhubung.'
            : 'Mengisolasi sementara kisi ventilasi atau AC di sekitar lokasi pekerjaan serta menyediakan sarana pengendalian debu aktif.',
          'Pekerjaan yang menimbulkan debu harus dijadwalkan di luar jam pelayanan padat dan dilakukan dengan metode basah untuk mengurangi sebaran debu.',
        ],
      },
      {
        title: '3. Komunikasi dan Edukasi',
        items: [
          `Perlu dilakukan sosialisasi dan pemberitahuan resmi kepada pasien, keluarga pasien, dan seluruh staf yang bertugas di sekitar area kegiatan${areaTerdampakProse ? ` (${areaTerdampakProse})` : ''}.`,
          'Tim ruangan dan petugas kebersihan diberikan edukasi tambahan mengenai protokol pembersihan harian serta pengelolaan limbah di sekitar lokasi proyek.',
        ],
      },
      {
        title: `4. Setelah ${activityNounCap}`,
        items: [
          'Setelah pekerjaan selesai, lakukan pembersihan akhir dan disinfeksi menyeluruh terhadap seluruh permukaan area pekerjaan.',
          'Sebelum area dinyatakan siap difungsikan kembali, lakukan verifikasi dan validasi kelayakan fungsi serta pemeriksaan kebersihan oleh tim PPI dan tim teknik.',
          'Pekerjaan dinyatakan selesai dan aman digunakan hanya setelah dilakukan serah terima formal serta dinyatakan bebas risiko infeksi oleh tim PPI.',
        ],
      },
      {
        title: '5. Dokumentasi dan Evaluasi',
        items: [
          'Seluruh proses pelaksanaan proyek dan tindakan pengendalian yang telah dilakukan harus didokumentasikan secara lengkap, termasuk catatan monitoring PPI.',
          'Perlu dilakukan evaluasi pascapekerjaan untuk mengukur efektivitas pengendalian risiko serta menjadi bahan pembelajaran untuk kegiatan konstruksi berikutnya di rumah sakit.',
        ],
      },
    ];

    recSections.forEach((sec, sIdx) => {
      pushSubHeading(`rek-sec-${sIdx}-head`, sec.title);
      sec.items.forEach((it, idx) => {
        const isLast = idx === sec.items.length - 1;
        b.push({
          type: 'element',
          key: `rek-sec-${sIdx}-item-${idx}`,
          gapAfter: isLast ? 8 : 3,
          node: (
            <div
              className="flex items-start gap-2.5 pl-6 text-[12pt] leading-[1.5] text-justify text-black font-normal"
              style={BASE_TEXT_STYLE}
            >
              <span className="shrink-0 font-normal">•</span>
              <span className="flex-1 text-justify font-normal">{it}</span>
            </div>
          ),
        });
      });
    });

    pushParagraph(
      'rek-closing',
      'Rekomendasi ini diharapkan dapat menjadi acuan dalam menjamin pelaksanaan pekerjaan yang aman, terkendali, dan sesuai standar keselamatan pasien serta mutu pelayanan rumah sakit.',
      12,
      false
    );

    // ==================== 10. PENUTUP & PENGESAHAN ====================
    pushHeading('sec-penutup', 'PENUTUP', 'penutup');
    pushParagraph(
      'pen-1',
      <>
        Demikian laporan <em>Infection Control Risk Assessment</em> (ICRA) untuk kegiatan {projectProse} di {lokasiProse} ini disusun sebagai bentuk komitmen UOBK RSUD Al-Mulk Kota Sukabumi dalam menjaga keselamatan pasien, tenaga kesehatan, dan seluruh pihak yang berada di lingkungan rumah sakit selama berlangsungnya aktivitas konstruksi.
      </>
    );
    pushParagraph(
      'pen-2',
      `Penyusunan laporan ini melibatkan berbagai pihak lintas unit, seperti tim pencegahan dan pengendalian infeksi (PPI), instalasi pemeliharaan sarana rumah sakit (IPSRS), tim K3RS, tim manajemen risiko, serta pihak pelaksana teknis (${kontraktorProse}). Setiap langkah yang tertuang dalam dokumen ini telah disesuaikan dengan pedoman pencegahan infeksi nasional dan standar akreditasi rumah sakit yang berlaku, guna memastikan bahwa pekerjaan konstruksi tidak menjadi sumber penyebaran infeksi nosokomial.`
    );
    pushParagraph(
      'pen-3',
      'Kami berharap seluruh pihak terkait dapat menjalankan peran dan tanggung jawabnya dengan baik sesuai dengan ketentuan dalam dokumen ini. Monitoring secara berkala oleh tim PPI serta komunikasi aktif antar unit menjadi kunci keberhasilan dalam menjaga lingkungan rumah sakit tetap aman dan bebas risiko infeksi selama dan setelah kegiatan berlangsung.'
    );
    pushParagraph(
      'pen-4',
      `Akhir kata, semoga kegiatan ${projectProse} ini dapat selesai tepat waktu, dengan hasil yang optimal, serta memberikan manfaat nyata dalam peningkatan kualitas pelayanan dan keselamatan pasien di UOBK RSUD Al-Mulk Kota Sukabumi.`,
      14
    );

    // Signature Block — Arial 12pt, line-height 1.5, normal weight
    b.push({
      type: 'element',
      key: 'penutup-ttd',
      gapAfter: 10,
      node: (
        <div className="w-full text-[12pt] leading-[1.5] text-black pt-2 font-normal" style={BASE_TEXT_STYLE}>
          <div className="flex justify-end mb-3 pr-4">
            <p className="w-[46%] text-center font-normal">Sukabumi, {tglPengesahan}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-center font-normal">
            <div className="flex flex-col items-center">
              <p className="font-normal">Penyusun</p>
              <div className="h-20 flex items-center justify-center my-1">
                {project.ttd_ipcn ? (
                  <img
                    src={project.ttd_ipcn}
                    alt="Tanda Tangan IPCN"
                    className="max-h-16 object-contain"
                  />
                ) : null}
              </div>
              <p className="font-normal underline">{namaIpcn}</p>
              <p className="font-normal">Infection Prevention Control Nurse</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="font-normal">Mengetahui</p>
              <div className="h-20 flex items-center justify-center my-1" />
              <p className="font-normal underline">{ketuaPpiName}</p>
              <p className="font-normal">Ketua PPI</p>
            </div>
          </div>
        </div>
      ),
    });

    // ==================== 11. BUKTI DOKUMENTASI (HALAMAN BARU) ====================
    b.push({ type: 'pageBreak', key: 'pb-dokumentasi' });

    pushHeading('sec-bukti-dokumentasi', 'BUKTI DOKUMENTASI', 'bukti-dokumentasi');

    const pushPhotoSection = (
      phaseKey: string,
      phaseTitle: string,
      photos: { url: string; caption?: string }[],
      emptyNote: string
    ) => {
      pushSubHeading(`${phaseKey}-heading`, phaseTitle);

      if (photos.length === 0) {
        b.push({
          type: 'element',
          key: `${phaseKey}-empty`,
          gapAfter: 10,
          node: (
            <div
              className="border border-dashed border-gray-400 rounded py-5 px-4 text-center text-[12pt] leading-[1.5] italic text-gray-600 bg-gray-50 font-normal"
              style={BASE_TEXT_STYLE}
            >
              {emptyNote}
            </div>
          ),
        });
        return;
      }

      for (let i = 0; i < photos.length; i += 2) {
        const pair = photos.slice(i, i + 2);
        b.push({
          type: 'element',
          key: `${phaseKey}-row-${i}`,
          gapAfter: 10,
          node: (
            <div className="grid grid-cols-2 gap-3.5 w-full" style={BASE_TEXT_STYLE}>
              {pair.map((photo, idx) => (
                <div
                  key={idx}
                  className="border border-black/30 bg-white p-1.5 flex flex-col items-center"
                >
                  <div className="w-full h-[205px] overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img
                      src={photo.url}
                      alt={`${phaseTitle} ${i + idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          ),
        });
      }
    };

    pushPhotoSection(
      'doc-pre',
      '1. Pre Renovasi / Konstruksi',
      prePhotos.map((url) => ({ url })),
      'Belum ada foto dokumentasi pra konstruksi atau renovasi yang diunggah.'
    );

    pushPhotoSection(
      'doc-intra',
      '2. Intra Renovasi / Konstruksi',
      intraPhotos,
      'Belum ada foto dokumentasi intra konstruksi atau renovasi.'
    );

    pushPhotoSection(
      'doc-post',
      '3. Post Renovasi / Konstruksi',
      postPhotos.map((url) => ({ url })),
      'Belum ada foto dokumentasi pasca konstruksi atau renovasi.'
    );

    // ==================== HELPER 5-PIHAK PENGESAHAN PRE / POST ====================
    const pushFivePartySignoffs = (keyPrefix: string, signoffs: IcraChecklistSignoff) => {
      const parties = [
        { label: 'IPSRS', nama: signoffs.ipsrs_nama, tgl: signoffs.ipsrs_tanggal },
        { label: 'PPI / IPCN', nama: signoffs.ppi_nama, tgl: signoffs.ppi_tanggal },
        { label: 'Kesling', nama: signoffs.kesling_nama, tgl: signoffs.kesling_tanggal },
        { label: 'K3 RS', nama: signoffs.k3rs_nama, tgl: signoffs.k3rs_tanggal },
        { label: 'Pihak ke 3 Pembangunan', nama: signoffs.pihak3_nama, tgl: signoffs.pihak3_tanggal },
      ];
      b.push({
        type: 'element',
        key: `${keyPrefix}-signoffs`,
        gapAfter: 10,
        node: (
          <div className="w-full pt-3 space-y-3 text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
            {parties.map((pt, idx) => (
              <div key={idx} className="grid grid-cols-12 items-baseline gap-2">
                <div className="col-span-7 flex items-baseline">
                  <span className="shrink-0 mr-1.5 font-normal">{pt.label}</span>
                  <span className="flex-1 border-b border-dotted border-black text-center px-1 font-normal">
                    {pt.nama ? pt.nama : ''}
                  </span>
                </div>
                <div className="col-span-5 flex items-baseline">
                  <span className="shrink-0 mr-1.5 font-normal">Tanggal</span>
                  <span className="flex-1 border-b border-dotted border-black text-center px-1 font-normal">
                    {pt.tgl ? formatIndonesianDate(pt.tgl) : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ),
      });
    };

    // ==================== 12. LAMPIRAN: FORMULIR PRE RENOVASI ====================
    const preData = normalizePreChecklist(project.pre_checklist, project);
    const preSections = getPreChecklistSections(kelasCode);

    b.push({ type: 'pageBreak', key: 'pb-formulir-pre' });
    b.push({
      type: 'element',
      key: 'formulir-pre-title',
      chapterAnchor: 'formulir-pre',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="text-center mb-1" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
          <h2 className="text-[12pt] leading-[1.5] font-bold uppercase text-black" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
            FORMULIR PRE RENOVASI
          </h2>
        </div>
      ),
    });

    // Metadata + Table Header
    b.push({
      type: 'element',
      key: 'formulir-pre-header-table',
      keepWithNext: true,
      gapAfter: 0,
      node: (
        <table className="w-full table-fixed border-collapse text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
          <tbody>
            <tr>
              <td className="border border-black py-1 px-2.5 w-[34%] font-normal">Tanggal / Waktu Survey</td>
              <td className="border border-black py-1 px-2.5 w-[66%] font-normal">
                {formatIndonesianDate(preData.tanggal_survey)}
              </td>
            </tr>
            <tr>
              <td className="border border-black py-1 px-2.5 font-normal">Area</td>
              <td className="border border-black py-1 px-2.5 font-normal">
                {toSmartTitleCase(preData.area || lokasiTitleDisplay)}
              </td>
            </tr>
            <tr>
              <td className="border border-black py-1 px-2.5 font-normal">Proyek</td>
              <td className="border border-black py-1 px-2.5 font-normal">
                {toSmartTitleCase(preData.proyek || projectTitleDisplay)}
              </td>
            </tr>
          </tbody>
        </table>
      ),
    });

    b.push({
      type: 'element',
      key: 'formulir-pre-colhead',
      keepWithNext: true,
      gapAfter: 0,
      node: (
        <table className="w-full table-fixed border-collapse -mt-[1px] text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
          <thead>
            <tr className="bg-gray-100 text-center">
              <th className="border border-black py-1.5 px-2.5 w-[56%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                KEGIATAN
              </th>
              <th className="border border-black py-1.5 px-1 w-[9%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                YA
              </th>
              <th className="border border-black py-1.5 px-1 w-[12%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                TIDAK
              </th>
              <th className="border border-black py-1.5 px-1.5 w-[23%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                TANGGAL
              </th>
            </tr>
          </thead>
        </table>
      ),
    });

    preSections.forEach((sec, secIdx) => {
      const secItems = preData.items.filter((it) => it.section === sec.section);
      const isLastSec = secIdx === preSections.length - 1;

      if (sec.isDirectQuestion && secItems[0]) {
        const item = secItems[0];
        b.push({
          type: 'element',
          key: `pre-form-row-${item.id}`,
          gapAfter: 0,
          node: (
            <table className="w-full table-fixed border-collapse -mt-[1px] text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
              <tbody>
                <tr>
                  <td className="border border-black py-1.5 px-2.5 w-[56%] align-top font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                    {sec.title}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[9%] text-center align-middle font-normal">
                    {item.answer === 'YA' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[12%] text-center align-middle font-normal">
                    {item.answer === 'TIDAK' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-1.5 w-[23%] text-center align-middle text-[11pt] font-normal">
                    {item.tanggal ? formatIndonesianDate(item.tanggal) : ''}
                  </td>
                </tr>
              </tbody>
            </table>
          ),
        });
        return;
      }

      // Section Header Row
      b.push({
        type: 'element',
        key: `pre-form-sec-${sec.section}`,
        keepWithNext: true,
        gapAfter: 0,
        node: (
          <table className="w-full table-fixed border-collapse -mt-[1px] text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
            <tbody>
              <tr>
                <td className="border border-black py-1.5 px-2.5 w-[56%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                  {sec.title}
                </td>
                <td className="border border-black py-1.5 px-1 w-[9%]" />
                <td className="border border-black py-1.5 px-1 w-[12%]" />
                <td className="border border-black py-1.5 px-1.5 w-[23%]" />
              </tr>
              {sec.subtitle && (
                <tr>
                  <td className="border border-black py-1.5 px-2.5 w-[56%] font-normal">
                    {sec.subtitle}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[9%]" />
                  <td className="border border-black py-1.5 px-1 w-[12%]" />
                  <td className="border border-black py-1.5 px-1.5 w-[23%]" />
                </tr>
              )}
            </tbody>
          </table>
        ),
      });

      secItems.forEach((item, idx) => {
        const isLastItem = isLastSec && idx === secItems.length - 1;
        b.push({
          type: 'element',
          key: `pre-form-item-${item.id}`,
          gapAfter: isLastItem ? 10 : 0,
          node: (
            <table className="w-full table-fixed border-collapse -mt-[1px] text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
              <tbody>
                <tr>
                  <td className="border border-black py-1.5 px-2.5 pl-6 w-[56%] align-top font-normal">
                    <span className="mr-1.5">{item.number}</span>
                    <span>{item.label}</span>
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[9%] text-center align-middle font-normal">
                    {item.answer === 'YA' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[12%] text-center align-middle font-normal">
                    {item.answer === 'TIDAK' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-1.5 w-[23%] text-center align-middle text-[11pt] font-normal">
                    {item.tanggal ? formatIndonesianDate(item.tanggal) : ''}
                  </td>
                </tr>
              </tbody>
            </table>
          ),
        });
      });
    });

    pushFivePartySignoffs('pre-form', preData.signoffs);

    // ==================== 13. LAMPIRAN: FORMULIR PEMANTAUAN INTRA RENOVASI ====================
    const intraFormsToRender =
      monitoringLogs.length > 0
        ? monitoringLogs
        : [
            {
              id: 'intra-template-default',
              konstruksi_id: project.id,
              tanggal_monitoring: project.tgl_mulai,
              jam_monitoring: '',
              petugas_ipcn: namaIpcn,
              barier_tertutup: true,
              tekanan_negatif_hepa: kelasCode === 'III' || kelasCode === 'IV' ? 'Ya' : 'N/A',
              keset_basah_pintu: true,
              area_sekitar_bersih: true,
              jalur_limbah_tertutup: true,
              apd_pekerja: true,
              status_kepatuhan: 'Sesuai Standar' as const,
              foto_monitoring: [],
              area_renovasi: lokasiTitleDisplay,
              intra_items: buildDefaultIntraItems(kelasCode),
            },
          ];

    intraFormsToRender.forEach((log, logIdx) => {
      b.push({ type: 'pageBreak', key: `pb-formulir-intra-${log.id}-${logIdx}` });

      const formItems =
        Array.isArray(log.intra_items) && log.intra_items.length > 0
          ? normalizeIntraItems(log.intra_items, kelasCode)
          : buildDefaultIntraItems(kelasCode).map((defItem) => {
              const lower = defItem.kegiatan.toLowerCase();
              let ans: 'YA' | 'TIDAK' | 'N/A' = 'YA';
              if (lower.includes('barrier') || lower.includes('pembatas')) {
                ans = log.barier_tertutup ? 'YA' : 'TIDAK';
              } else if (lower.includes('hepa') || lower.includes('tekanan udara negatif')) {
                ans =
                  log.tekanan_negatif_hepa === 'Ya'
                    ? 'YA'
                    : log.tekanan_negatif_hepa === 'Tidak'
                    ? 'TIDAK'
                    : 'N/A';
              } else if (lower.includes('keset')) {
                ans = log.keset_basah_pintu ? 'YA' : 'TIDAK';
              } else if (lower.includes('pembersihan harian')) {
                ans = log.area_sekitar_bersih ? 'YA' : 'TIDAK';
              } else if (lower.includes('limbah') || lower.includes('puing')) {
                ans = log.jalur_limbah_tertutup ? 'YA' : 'TIDAK';
              } else if (lower.includes('apd')) {
                ans = log.apd_pekerja ? 'YA' : 'TIDAK';
              }
              return { ...defItem, answer: ans };
            });

      b.push({
        type: 'element',
        key: `formulir-intra-head-${log.id}-${logIdx}`,
        chapterAnchor: logIdx === 0 ? 'formulir-intra' : undefined,
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <div className="space-y-3 text-[12pt] leading-[1.5] text-black" style={BASE_TEXT_STYLE}>
            <div className="text-center">
              <h2
                className="text-[12pt] leading-[1.5] font-bold uppercase text-black"
                style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}
              >
                FORMULIR PEMANTAUAN SELAMA RENOVASI / KONSTRUKSI BANGUNAN
              </h2>
            </div>

            <table className="w-full border-collapse text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
              <tbody>
                <tr>
                  <td className="py-0.5 w-[28%] font-normal">Area renovasi</td>
                  <td className="py-0.5 w-[3%] font-normal">:</td>
                  <td className="py-0.5 font-normal">
                    {toSmartTitleCase(log.area_renovasi || lokasiTitleDisplay)}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 font-normal">Tanggal pemantauan</td>
                  <td className="py-0.5 font-normal">:</td>
                  <td className="py-0.5 font-normal">
                    {formatIndonesianDate(log.tanggal_monitoring)}
                    {log.jam_monitoring ? ` (Pukul ${log.jam_monitoring} WIB)` : ''}
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="text-[12pt] leading-[1.5] font-bold uppercase text-black" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
              KATEGORI {kelasCode}
            </p>
          </div>
        ),
      });

      formItems.forEach((it, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === formItems.length - 1;
        b.push({
          type: 'element',
          key: `formulir-intra-row-${log.id}-${idx}`,
          gapAfter: isLast ? 12 : 0,
          node: (
            <table
              className={`w-full table-fixed border-collapse text-[12pt] leading-[1.5] text-black font-normal ${
                isFirst ? '' : '-mt-[1px]'
              }`}
              style={BASE_TEXT_STYLE}
            >
              {isFirst && (
                <thead>
                  <tr className="bg-gray-100 text-center">
                    <th className="border border-black py-1.5 px-1 w-[7%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                      NO
                    </th>
                    <th className="border border-black py-1.5 px-2.5 w-[47%] text-center font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                      KEGIATAN
                    </th>
                    <th className="border border-black py-1.5 px-1 w-[7%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                      YA
                    </th>
                    <th className="border border-black py-1.5 px-1 w-[10%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                      TIDAK
                    </th>
                    <th className="border border-black py-1.5 px-1 w-[8%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                      N/A
                    </th>
                    <th className="border border-black py-1.5 px-2 w-[21%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                      KETERANGAN
                    </th>
                  </tr>
                </thead>
              )}
              <tbody>
                <tr>
                  <td className="border border-black py-1.5 px-1 w-[7%] text-center align-top font-normal">
                    {it.no}
                  </td>
                  <td className="border border-black py-1.5 px-2.5 w-[47%] align-top text-left font-normal">
                    {it.kegiatan}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[7%] text-center align-middle font-normal">
                    {it.answer === 'YA' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[10%] text-center align-middle font-normal">
                    {it.answer === 'TIDAK' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[8%] text-center align-middle font-normal">
                    {it.answer === 'N/A' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-2 w-[21%] align-top text-left text-[11pt] font-normal">
                    {it.keterangan || ''}
                  </td>
                </tr>
              </tbody>
            </table>
          ),
        });
      });

      if (log.temuan_lapangan || log.tindakan_koreksi) {
        b.push({
          type: 'element',
          key: `formulir-intra-notes-${log.id}-${logIdx}`,
          gapAfter: 10,
          node: (
            <div className="border border-black p-2.5 text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
              {log.temuan_lapangan && <p>Temuan lapangan: {log.temuan_lapangan}</p>}
              {log.tindakan_koreksi && <p>Tindakan koreksi: {log.tindakan_koreksi}</p>}
            </div>
          ),
        });
      }

      // Petugas yang mengobservasi block (Page 17-18 style)
      b.push({
        type: 'element',
        key: `formulir-intra-obs-${log.id}-${logIdx}`,
        gapAfter: 10,
        node: (
          <div className="flex justify-end pt-3 pr-4 text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
            <div className="text-center w-[46%]">
              <p className="font-normal">Petugas yang mengobservasi</p>
              <div className="h-16 flex items-center justify-center my-1">
                {project.ttd_ipcn && (log.petugas_ipcn === namaIpcn || !log.petugas_ipcn) ? (
                  <img src={project.ttd_ipcn} alt="Tanda tangan petugas" className="max-h-14 object-contain" />
                ) : null}
              </div>
              <p className="font-normal">
                ( {log.petugas_ipcn || namaIpcn} )
              </p>
            </div>
          </div>
        ),
      });
    });

    // ==================== 14. LAMPIRAN: FORMULIR POST RENOVASI ====================
    const postData = normalizePostChecklist(project.post_checklist, project);
    const postSections = getPostChecklistSections(kelasCode);

    b.push({ type: 'pageBreak', key: 'pb-formulir-post' });
    b.push({
      type: 'element',
      key: 'formulir-post-title',
      chapterAnchor: 'formulir-post',
      keepWithNext: true,
      gapAfter: 8,
      node: (
        <div className="text-center mb-1" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
          <h2 className="text-[12pt] leading-[1.5] font-bold uppercase text-black" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
            FORMULIR POST RENOVASI
          </h2>
        </div>
      ),
    });

    b.push({
      type: 'element',
      key: 'formulir-post-header-table',
      keepWithNext: true,
      gapAfter: 0,
      node: (
        <table className="w-full table-fixed border-collapse text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
          <tbody>
            <tr>
              <td className="border border-black py-1 px-2.5 w-[34%] font-normal">Tanggal / Waktu Survey</td>
              <td className="border border-black py-1 px-2.5 w-[66%] font-normal">
                {formatIndonesianDate(postData.tanggal_survey)}
              </td>
            </tr>
            <tr>
              <td className="border border-black py-1 px-2.5 font-normal">Area</td>
              <td className="border border-black py-1 px-2.5 font-normal">
                {toSmartTitleCase(postData.area || lokasiTitleDisplay)}
              </td>
            </tr>
            <tr>
              <td className="border border-black py-1 px-2.5 font-normal">Proyek</td>
              <td className="border border-black py-1 px-2.5 font-normal">
                {toSmartTitleCase(postData.proyek || projectTitleDisplay)}
              </td>
            </tr>
          </tbody>
        </table>
      ),
    });

    b.push({
      type: 'element',
      key: 'formulir-post-colhead',
      keepWithNext: true,
      gapAfter: 0,
      node: (
        <table className="w-full table-fixed border-collapse -mt-[1px] text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
          <thead>
            <tr className="bg-gray-100 text-center">
              <th className="border border-black py-1.5 px-2.5 w-[56%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                KEGIATAN
              </th>
              <th className="border border-black py-1.5 px-1 w-[9%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                YA
              </th>
              <th className="border border-black py-1.5 px-1 w-[12%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                TIDAK
              </th>
              <th className="border border-black py-1.5 px-1.5 w-[23%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                TANGGAL
              </th>
            </tr>
          </thead>
        </table>
      ),
    });

    postSections.forEach((sec, secIdx) => {
      const secItems = postData.items.filter((it) => it.section === sec.section);
      const isLastSec = secIdx === postSections.length - 1;

      b.push({
        type: 'element',
        key: `post-form-sec-${sec.section}`,
        keepWithNext: true,
        gapAfter: 0,
        node: (
          <table className="w-full table-fixed border-collapse -mt-[1px] text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
            <tbody>
              <tr>
                <td className="border border-black py-1.5 px-2.5 w-[56%] font-bold" style={{ ...BASE_TEXT_STYLE, fontWeight: 700 }}>
                  {sec.title}
                </td>
                <td className="border border-black py-1.5 px-1 w-[9%]" />
                <td className="border border-black py-1.5 px-1 w-[12%]" />
                <td className="border border-black py-1.5 px-1.5 w-[23%]" />
              </tr>
            </tbody>
          </table>
        ),
      });

      secItems.forEach((item, idx) => {
        const isLastItem = isLastSec && idx === secItems.length - 1;
        b.push({
          type: 'element',
          key: `post-form-item-${item.id}`,
          gapAfter: isLastItem ? 10 : 0,
          node: (
            <table className="w-full table-fixed border-collapse -mt-[1px] text-[12pt] leading-[1.5] text-black font-normal" style={BASE_TEXT_STYLE}>
              <tbody>
                <tr>
                  <td className="border border-black py-1.5 px-2.5 pl-6 w-[56%] align-top font-normal">
                    <div>
                      <span className="mr-1.5">{item.number}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.subNotes && item.subNotes.length > 0 && (
                      <ul className="list-disc pl-5 mt-1 space-y-0.5 font-normal">
                        {item.subNotes.map((sn, snIdx) => (
                          <li key={snIdx}>{sn}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[9%] text-center align-middle font-normal">
                    {item.answer === 'YA' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-1 w-[12%] text-center align-middle font-normal">
                    {item.answer === 'TIDAK' ? '✓' : ''}
                  </td>
                  <td className="border border-black py-1.5 px-1.5 w-[23%] text-center align-middle text-[11pt] font-normal">
                    {item.tanggal ? formatIndonesianDate(item.tanggal) : ''}
                  </td>
                </tr>
              </tbody>
            </table>
          ),
        });
      });
    });

    pushFivePartySignoffs('post-form', postData.signoffs);

    return b;
  }, [
    project,
    projectTitleDisplay,
    projectProse,
    lokasiTitleDisplay,
    lokasiProse,
    lokasiLengkapTable,
    lokasiLengkapProse,
    areaTerdampakProse,
    kontraktorDisplay,
    kontraktorProse,
    pjProyekDisplay,
    namaIpcn,
    ketuaPpiName,
    tglPengesahan,
    tipeCode,
    riskCode,
    riskRoman,
    riskLabelLower,
    kelasCode,
    typeInfo,
    classControl,
    activityNoun,
    activityNounCap,
    praActions,
    saatActions,
    pascaActions,
    monitoringLogs,
    prePhotos,
    intraPhotos,
    postPhotos,
  ]);

  const coverNode = useMemo(
    () => (
      <ReportCover
        reportType="icra"
        title="LAPORAN INFECTION CONTROL RISK ASSESSMENT (ICRA)"
        subtitle={cleanedBaseName.toUpperCase()}
        hospitalText="UOBK RSUD AL-MULK KOTA SUKABUMI"
        year={projectYear}
      />
    ),
    [cleanedBaseName, projectYear]
  );

  return (
    <AutoPaginatedF4Document
      id={documentId}
      coverPage={coverNode}
      frontMatterPages={frontMatterPages}
      blocks={blocks}
      numberingMode="bodyStartsAtOne"
      onChaptersResolved={handleChaptersResolved}
    />
  );
}

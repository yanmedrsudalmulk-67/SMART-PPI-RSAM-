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
    return 'Kontraktor, Komite K3 & KPPI';
  }
  if (lower.includes('vakum') || lower.includes('pengepelan') || lower.includes('disinfektan') || lower.includes('bersihkan')) {
    return 'Cleaning Service RS';
  }
  return 'Tim PPI & Manajemen';
}

function stripPhasePrefix(label: string): string {
  return label
    .replace(/^\[(Selama|Setelah)\s+Konstruksi\]\s*/i, '')
    .replace(/^\[(Selama|Setelah)\s+Proyek[^\]]*\]\s*/i, '')
    .trim();
}

export default function IcraOfficialReport({
  project,
  monitoringLogs = [],
  ketuaPpiName = 'dr. Nurul Iman',
  signDate,
  documentId = 'print-area-icra',
}: IcraOfficialReportProps) {
  const projectYear = getYearFromDate(project.tgl_mulai);
  const projectName = project.nama_proyek?.trim() || 'Kegiatan Konstruksi / Renovasi';
  const lokasiArea = project.lokasi_area?.trim() || 'Lingkungan UOBK RSUD Al-Mulk';
  const areaTerdampak = project.area_terdampak?.trim() || '';
  const kontraktor = project.kontraktor_pelaksana?.trim() || 'IPSRS RSUD Al-Mulk';
  const pjProyek = project.pj_proyek?.trim() || '';
  const namaIpcn = project.nama_ipcn?.trim() || 'Adi Tresa Purnama, A.M.Kep';
  const tglPengesahan = formatIndonesianDate(signDate || project.tgl_mulai || format(new Date(), 'yyyy-MM-dd'));

  const tipeCode = project.tipe_konstruksi || 'C';
  const riskCode = project.kelompok_risiko || '2';
  const kelasCode = project.kelas_tindakan || 'III';
  const riskRoman = RISK_ROMAN[riskCode] || 'II';

  const typeInfo = CONSTRUCTION_TYPES.find((t) => t.code === tipeCode) || CONSTRUCTION_TYPES[2];
  const riskInfo = PATIENT_RISK_GROUPS.find((r) => r.code === riskCode) || PATIENT_RISK_GROUPS[1];
  const classControl = CONSTRUCTION_CLASS_CONTROLS[kelasCode] || CONSTRUCTION_CLASS_CONTROLS.III;

  const lokasiLengkap = areaTerdampak
    ? `${lokasiArea} (Area terdampak sekitar: ${areaTerdampak})`
    : lokasiArea;

  const isDemolition = /bongkar|pembongkaran/i.test(projectName);
  const activityNoun = isDemolition ? 'pembongkaran' : 'renovasi / konstruksi';
  const activityNounCap = isDemolition ? 'Pembongkaran' : 'Renovasi / Konstruksi';

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
  });

  const handleChaptersResolved = useCallback((resolved: Record<string, number>) => {
    setChapterPages((prev) => ({ ...prev, ...resolved }));
  }, []);

  // Build Tindakan tables integrating exact ICRA Konstruksi checklist items
  const { praActions, saatActions, pascaActions } = useMemo(() => {
    const pra: { tindakan: string; pj: string }[] = [
      {
        tindakan: 'Melakukan rapat koordinasi antara tim teknis (IPSRS), Komite PPI, kontraktor, dan manajemen ruangan/unit terdampak',
        pj: 'Manajemen RS, Tim PPI, Teknik',
      },
      {
        tindakan: 'Menyusun dan mengesahkan dokumen pengkajian ICRA serta rencana kerja pelaksanaan proyek',
        pj: 'Tim PPI, Teknik',
      },
      {
        tindakan: `Melakukan identifikasi dan klasifikasi risiko pasien pada lokasi ${lokasiArea}${areaTerdampak ? ` serta area sekitar (${areaTerdampak})` : ''}`,
        pj: 'IPCN dan PJ Ruangan',
      },
      {
        tindakan: `Menyusun jadwal kerja ${activityNoun} agar tidak mengganggu jam-jam kritis pelayanan rumah sakit`,
        pj: 'Teknik dan Manajemen Ruang',
      },
      {
        tindakan: 'Menyiapkan barier fisik (penyekat plastik kedap debu atau partisi gypsum) sesuai kelas kewaspadaan di area kerja',
        pj: 'Kontraktor, Teknik',
      },
      {
        tindakan: 'Melakukan pemberitahuan resmi kepada pasien, keluarga, dan staf unit sekitar mengenai jadwal kegiatan',
        pj: 'Humas RS, PPI',
      },
      {
        tindakan: 'Menutup, menyegel, atau mengalihkan sistem ventilasi / HVAC yang terhubung ke area pekerjaan',
        pj: 'Tim Teknik / IPSRS',
      },
      {
        tindakan: 'Memastikan jalur khusus untuk keluar masuk material bangunan dan pengangkutan limbah/puing konstruksi',
        pj: 'Teknik dan Kontraktor',
      },
      {
        tindakan: 'Memastikan ketersediaan dan kepatuhan penggunaan APD bagi seluruh pekerja konstruksi',
        pj: 'Kontraktor',
      },
      {
        tindakan: 'Menyediakan alat pembersih, keset basah / sticky mat, dan cairan disinfektan di sekitar area kerja',
        pj: 'Cleaning Service RS',
      },
    ];

    // Extract actual checklist items stored on the project for Selama & Setelah
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
        tindakan: 'Melakukan pembersihan harian terhadap area luar barier (koridor dan jalur akses sekitar proyek)',
        pj: 'Cleaning Service',
      },
      {
        tindakan: 'Memastikan seluruh pekerja menggunakan APD lengkap selama berada di area kerja',
        pj: 'Kontraktor',
      },
      {
        tindakan: 'Melakukan pengecekan dan monitoring rutin oleh IPCN terkait kepatuhan terhadap protokol pengendalian infeksi',
        pj: 'IPCN',
      },
      {
        tindakan: 'Menyimpan bahan material/berbahaya (cat, semen, pelarut, dll.) di area yang aman dan terkunci',
        pj: 'Kontraktor',
      },
    ];

    const pasca: { tindakan: string; pj: string }[] = [
      ...baseAfter.map((item) => ({
        tindakan: item,
        pj: inferAfterPic(item),
      })),
      {
        tindakan: 'Melakukan pemeriksaan kebersihan permukaan, kelayakan fungsi sarana, dan keamanan lingkungan oleh Tim PPI & Teknik',
        pj: 'Tim PPI, Teknik',
      },
      {
        tindakan: 'Melakukan serah terima pekerjaan secara formal dari pelaksana/kontraktor kepada pihak rumah sakit',
        pj: 'Teknik, Manajemen RS',
      },
      {
        tindakan: 'Membuka kembali akses area setelah dinyatakan aman dan bersih oleh Komite PPI dan Manajemen',
        pj: 'PPI dan Manajemen Ruangan',
      },
      {
        tindakan: 'Menyimpan dokumentasi lengkap proyek dan laporan ICRA untuk keperluan audit, evaluasi pascaproyek, dan akreditasi',
        pj: 'Tim PPI, Sekretariat RS',
      },
    ];

    return { praActions: pra, saatActions: saat, pascaActions: pasca };
  }, [project.checklist_pengendalian, classControl, lokasiArea, areaTerdampak, activityNoun]);

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
            caption: `Monitoring ${formatIndonesianDate(log.tanggal_monitoring)}${log.status_kepatuhan ? ` — ${log.status_kepatuhan}` : ''}`,
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

  // Front Matter: Kata Pengantar (ii) & Daftar Isi (iii) — exact match to reference document
  const frontMatterPages: FrontMatterPageSpec[] = useMemo(
    () => [
      {
        key: 'icra-fm-kata-pengantar',
        label: 'ii',
        node: (
          <div className="w-full h-full flex flex-col justify-between text-[12pt] leading-[1.55] text-justify text-black font-arial">
            <div>
              <div className="text-center font-bold mb-6">
                <h2 className="text-[13pt] uppercase tracking-wider font-bold text-black">
                  KATA PENGANTAR
                </h2>
              </div>
              <div className="space-y-3.5">
                <p className="indent-8">
                  Puji syukur kami panjatkan ke hadirat Tuhan Yang Maha Esa atas segala rahmat dan karunia-Nya sehingga rancangan laporan <em>Infection Control Risk Assessment</em> (ICRA) untuk kegiatan <strong>{projectName}</strong> UOBK RSUD Al-Mulk Kota Sukabumi Tahun {projectYear} dapat disusun dengan baik.
                </p>
                <p className="indent-8">
                  Laporan ini disusun sebagai bentuk komitmen Komite PPI dalam penerapan prinsip pencegahan dan pengendalian infeksi pada kegiatan {activityNoun} di lingkungan rumah sakit. Berdasarkan pengkajian lapangan, lokasi pekerjaan berada di {lokasiLengkap}. Klasifikasi kelompok pasien berisiko ditetapkan pada <strong>{riskInfo.title}</strong> dengan tipe proyek <strong>Tipe {tipeCode}</strong>, sehingga pekerjaan ini menimbulkan potensi debu dan kontaminasi lingkungan yang harus dikendalikan secara terstruktur, terutama apabila aktivitas pelayanan rumah sakit tetap berjalan.
                </p>
                <p className="indent-8">
                  Dokumen ini memuat latar belakang, tujuan dan ruang lingkup, perencanaan proyek, klasifikasi tipe konstruksi, kelompok pasien berisiko, matriks ICRA, rencana tindakan pengendalian infeksi sebelum, selama dan setelah pekerjaan, pemantauan pelaksanaan, kesimpulan, rekomendasi, penutup, serta bukti dokumentasi lapangan.
                </p>
                <p className="indent-8">
                  Penyusunan dan pelaksanaan ICRA memerlukan kerja sama lintas unit antara Komite PPI, manajemen rumah sakit, IPSRS, K3RS, kesehatan lingkungan, penanggung jawab area terdampak, serta pelaksana/kontraktor ({kontraktor}). Seluruh langkah pengendalian dipantau dan dievaluasi secara berkala hingga pekerjaan selesai dinyatakan aman.
                </p>
                <p className="indent-8">
                  Semoga dokumen ini dapat digunakan sebagai pedoman pelaksanaan kegiatan {activityNoun} yang aman, terkendali, dan selaras dengan upaya peningkatan mutu pelayanan serta keselamatan pasien di UOBK RSUD Al-Mulk Kota Sukabumi.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-8 pr-6">
              <div className="text-center text-[12pt]">
                <p>Tim Penyusun</p>
                <div className="h-14" />
                <p className="font-bold">IPCN</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'icra-fm-daftar-isi',
        label: 'iii',
        node: (
          <div className="w-full flex flex-col justify-start text-[12pt] leading-[1.6] text-black font-arial">
            <div className="text-center font-bold mb-6">
              <h2 className="text-[13pt] uppercase tracking-wider font-bold text-black">
                DAFTAR ISI
              </h2>
            </div>

            <div className="border border-black/80 p-5 space-y-2.5 text-[11.5pt]">
              {[
                { label: 'KATA PENGANTAR', page: 'ii', bold: true, indent: false },
                { label: 'DAFTAR ISI', page: 'iii', bold: true, indent: false },
                { label: 'LAPORAN INFECTION CONTROL RISK ASSESSMENT (ICRA)', page: '1', bold: true, indent: false },
                { label: 'LATAR BELAKANG', page: String(chapterPages['latar-belakang'] ?? 1), bold: false, indent: true },
                { label: 'TUJUAN DAN RUANG LINGKUP', page: String(chapterPages['tujuan-ruang-lingkup'] ?? 1), bold: false, indent: true },
                { label: 'PERENCANAAN', page: String(chapterPages['perencanaan'] ?? 2), bold: false, indent: true },
                { label: 'TIPE PROYEK KONSTRUKSI', page: String(chapterPages['tipe-proyek'] ?? 2), bold: false, indent: true },
                { label: 'KATEGORI RISIKO PASIEN', page: String(chapterPages['kategori-risiko'] ?? 3), bold: false, indent: true },
                { label: 'MATRIKS ICRA', page: String(chapterPages['matriks-icra'] ?? 3), bold: false, indent: true },
                { label: 'RENCANA TINDAKAN PENGENDALIAN INFEKSI', page: String(chapterPages['rencana-tindakan'] ?? 4), bold: false, indent: true },
                { label: 'KESIMPULAN', page: String(chapterPages['kesimpulan'] ?? 6), bold: false, indent: true },
                { label: 'REKOMENDASI', page: String(chapterPages['rekomendasi'] ?? 7), bold: false, indent: true },
                { label: 'PENUTUP', page: String(chapterPages['penutup'] ?? 8), bold: false, indent: true },
                { label: 'BUKTI DOKUMENTASI', page: String(chapterPages['bukti-dokumentasi'] ?? 9), bold: false, indent: true },
              ].map((entry, i) => (
                <div
                  key={i}
                  className={`flex items-baseline justify-between ${entry.bold ? 'font-bold' : 'font-normal'} ${entry.indent ? 'pl-5' : ''}`}
                >
                  <span className="shrink-0">{entry.label}</span>
                  <span className="flex-1 mx-2 border-b border-dotted border-black" />
                  <span className="shrink-0 font-semibold min-w-[20px] text-right">{entry.page}</span>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
    [projectName, projectYear, activityNoun, lokasiLengkap, riskInfo.title, tipeCode, kontraktor, chapterPages]
  );

  // Build Flow Blocks for AutoPaginatedF4Document (Body starts at Page 1)
  const blocks: FlowBlock[] = useMemo(() => {
    const b: FlowBlock[] = [];

    // Helper for section heading
    const pushHeading = (key: string, title: string, anchor?: string) => {
      b.push({
        type: 'element',
        key,
        chapterAnchor: anchor,
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <h2 className="text-[12pt] font-bold uppercase text-black tracking-wide mt-2 border-b border-black/25 pb-0.5">
            {title}
          </h2>
        ),
      });
    };

    const pushParagraph = (key: string, content: React.ReactNode, gapAfter = 6, indent = true) => {
      b.push({
        type: 'element',
        key,
        gapAfter,
        node: (
          <p className={`text-[11.5pt] leading-[1.55] text-justify text-black ${indent ? 'indent-8' : ''}`}>
            {content}
          </p>
        ),
      });
    };

    // ==================== JUDUL UTAMA (HALAMAN 1) ====================
    b.push({
      type: 'element',
      key: 'doc-main-title',
      keepWithNext: true,
      gapAfter: 12,
      node: (
        <div className="text-center border-b-2 border-black pb-3 mb-1">
          <h1 className="text-[13pt] font-bold uppercase tracking-wide text-black leading-snug">
            LAPORAN ICRA (INFECTION CONTROL RISK ASSESSMENT)
          </h1>
          <p className="text-[12pt] font-bold text-black mt-1 leading-snug">
            {projectName}
          </p>
          <p className="text-[11.5pt] font-semibold text-black mt-0.5">
            UOBK RSUD Al-Mulk Kota Sukabumi
          </p>
          {project.nomor_izin && (
            <p className="text-[10pt] text-gray-700 mt-1">
              Nomor Dokumen / Izin ICRA: {project.nomor_izin}
            </p>
          )}
        </div>
      ),
    });

    // ==================== 1. LATAR BELAKANG ====================
    pushHeading('sec-latar-belakang', 'LATAR BELAKANG', 'latar-belakang');
    pushParagraph(
      'lb-1',
      'Rumah sakit sebagai institusi pelayanan kesehatan memiliki tanggung jawab dalam menyediakan lingkungan pelayanan yang aman bagi pasien, tenaga kesehatan, pegawai, pengunjung, dan masyarakat sekitar. Pemeliharaan serta pengembangan sarana dan prasarana rumah sakit merupakan salah satu upaya untuk mendukung mutu pelayanan. Setiap kegiatan pembongkaran, konstruksi, atau renovasi yang dilaksanakan di lingkungan rumah sakit harus memperhatikan aspek Pencegahan dan Pengendalian Infeksi (PPI).'
    );
    pushParagraph(
      'lb-2',
      <>
        UOBK RSUD Al-Mulk Kota Sukabumi melaksanakan kegiatan <strong>{projectName}</strong> yang berlokasi di <strong>{lokasiLengkap}</strong> bersama pelaksana <strong>{kontraktor}</strong>. Lingkup teknis pekerjaan, batas area kerja, metode pelaksanaan, kondisi bangunan awal, serta jadwal pelaksanaan telah dikoordinasikan bersama manajemen rumah sakit, IPSRS, dan tim teknis terkait.
      </>
    );
    pushParagraph(
      'lb-3',
      <>
        Aktivitas {activityNoun} berpotensi menghasilkan debu, partikel material bangunan, dan spora jamur—termasuk <em>Aspergillus</em>—yang dapat menyebar melalui udara, pintu, jendela, atau sistem ventilasi/HVAC. Selain itu, mobilisasi pekerja dan pengangkutan puing berpotensi menyebabkan kontaminasi lingkungan. Gangguan jaringan air, listrik, drainase, dan akses layanan juga dinilai bersama tim terkait melalui pengkajian prakonstruksi.
      </>
    );
    pushParagraph(
      'lb-4',
      'Oleh karena itu diperlukan ICRA sebagai proses terdokumentasi sebelum pekerjaan dimulai. Pengkajian ini mengacu pada Permenkes Nomor 27 Tahun 2017, Lampiran I halaman 137–146, untuk menetapkan tipe proyek, kelompok pasien berisiko, kelas kewaspadaan, dan intervensi pengendalian infeksi. Pelaksanaan dan efektivitas tindakan tersebut selanjutnya dipantau serta dievaluasi sampai pekerjaan selesai.',
      10
    );

    // ==================== 2. TUJUAN DAN RUANG LINGKUP ====================
    pushHeading('sec-tujuan', 'TUJUAN DAN RUANG LINGKUP', 'tujuan-ruang-lingkup');
    b.push({
      type: 'element',
      key: 'tujuan-1',
      gapAfter: 6,
      node: (
        <div className="text-[11.5pt] leading-[1.55] text-justify text-black">
          <p className="font-bold mb-0.5">1. Tujuan</p>
          <p className="pl-5">
            Mengidentifikasi, menilai, dan mengendalikan risiko infeksi akibat kegiatan <strong>{projectName}</strong> di {lokasiArea} agar paparan debu dan kontaminasi lingkungan dapat diminimalkan serta kegiatan pelayanan rumah sakit tetap berlangsung secara aman. Secara khusus, ICRA bertujuan menetapkan kelas kewaspadaan, intervensi pengendalian infeksi, tanggung jawab lintas unit, serta mekanisme monitoring dan tindak lanjut.
          </p>
        </div>
      ),
    });
    b.push({
      type: 'element',
      key: 'tujuan-2',
      gapAfter: 10,
      node: (
        <div className="text-[11.5pt] leading-[1.55] text-justify text-black">
          <p className="font-bold mb-0.5">2. Ruang Lingkup</p>
          <p className="pl-5">
            Mencakup persiapan dan pengamanan area kerja di {lokasiArea}, pelaksanaan {activityNoun} sesuai ruang lingkup teknis yang disetujui, pemindahan material dan puing melalui jalur terkendali, perlindungan area sekitar{areaTerdampak ? ` (${areaTerdampak})` : ''} serta area lain yang terdampak, pembersihan akhir (<em>terminal cleaning</em>), dan evaluasi pascapekerjaan.
          </p>
        </div>
      ),
    });

    // ==================== 3. PERENCANAAN ====================
    pushHeading('sec-perencanaan', 'PERENCANAAN', 'perencanaan');
    b.push({
      type: 'element',
      key: 'perencanaan-table',
      gapAfter: 10,
      node: (
        <table className="w-full border-collapse text-[11.5pt] leading-[1.5] text-black">
          <tbody>
            <tr>
              <td className="py-1 px-1.5 align-top w-7 font-semibold">1.</td>
              <td className="py-1 px-1.5 align-top w-40 font-semibold">Tanggal</td>
              <td className="py-1 px-1 align-top w-4">:</td>
              <td className="py-1 px-1.5 align-top">
                {formatIndonesianDate(project.tgl_mulai)} s/d {formatIndonesianDate(project.tgl_selesai_estimasi)}
              </td>
            </tr>
            <tr>
              <td className="py-1 px-1.5 align-top font-semibold">2.</td>
              <td className="py-1 px-1.5 align-top font-semibold">Lokasi</td>
              <td className="py-1 px-1 align-top">:</td>
              <td className="py-1 px-1.5 align-top">{lokasiLengkap}</td>
            </tr>
            <tr>
              <td className="py-1 px-1.5 align-top font-semibold">3.</td>
              <td className="py-1 px-1.5 align-top font-semibold">Kegiatan</td>
              <td className="py-1 px-1 align-top">:</td>
              <td className="py-1 px-1.5 align-top font-semibold">{projectName}</td>
            </tr>
            <tr>
              <td className="py-1 px-1.5 align-top font-semibold">4.</td>
              <td className="py-1 px-1.5 align-top font-semibold">Pelaksana / PJ</td>
              <td className="py-1 px-1 align-top">:</td>
              <td className="py-1 px-1.5 align-top">
                {kontraktor}{pjProyek ? ` (Penanggung Jawab: ${pjProyek})` : ''}
              </td>
            </tr>
            {project.nomor_izin && (
              <tr>
                <td className="py-1 px-1.5 align-top font-semibold">5.</td>
                <td className="py-1 px-1.5 align-top font-semibold">Nomor Izin ICRA</td>
                <td className="py-1 px-1 align-top">:</td>
                <td className="py-1 px-1.5 align-top">{project.nomor_izin}</td>
              </tr>
            )}
          </tbody>
        </table>
      ),
    });

    // ==================== 4. TIPE PROYEK KONSTRUKSI ====================
    pushHeading('sec-tipe-proyek', 'TIPE PROYEK KONSTRUKSI', 'tipe-proyek');
    b.push({
      type: 'element',
      key: 'tipe-proyek-table',
      gapAfter: 10,
      node: (
        <div className="space-y-2 text-black">
          <p className="text-[11.5pt] leading-[1.5]">
            Berdasarkan pedoman ICRA (Permenkes No. 27 Tahun 2017), tipe proyek diklasifikasikan sebagai berikut:
          </p>
          <table className="w-full border-collapse border border-black text-[10.5pt] leading-[1.45]">
            <thead>
              <tr className="bg-gray-200 font-bold text-center">
                <th className="border border-black py-1.5 px-2.5 w-[22%]">Tipe Proyek</th>
                <th className="border border-black py-1.5 px-2.5 text-left">Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              {CONSTRUCTION_TYPES.map((ct) => {
                const isSelected = ct.code === tipeCode;
                return (
                  <tr
                    key={ct.code}
                    style={{ backgroundColor: isSelected ? '#fef9c3' : '#ffffff' }}
                  >
                    <td className={`border border-black py-1.5 px-2.5 align-top text-center ${isSelected ? 'font-bold' : 'font-semibold'}`}>
                      Tipe {ct.code}{isSelected ? ' ✓' : ''}
                    </td>
                    <td className={`border border-black py-1.5 px-2.5 align-top ${isSelected ? 'font-semibold' : ''}`}>
                      <p>{ct.shortDesc}:</p>
                      <p className="text-[10pt] text-gray-800 mt-0.5">{ct.items.join('; ')}.</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ),
    });

    // ==================== 5. KATEGORI RISIKO PASIEN ====================
    pushHeading('sec-kategori-risiko', 'KATEGORI RISIKO PASIEN', 'kategori-risiko');
    b.push({
      type: 'element',
      key: 'kategori-risiko-table',
      gapAfter: 10,
      node: (
        <div className="space-y-2 text-black">
          <p className="text-[11.5pt] leading-[1.5]">Klasifikasi risiko pasien dibagi menjadi:</p>
          <table className="w-full border-collapse border border-black text-[10.5pt] leading-[1.45]">
            <thead>
              <tr className="bg-gray-200 font-bold text-center">
                <th className="border border-black py-1.5 px-2.5 w-[34%]">Kategori Risiko</th>
                <th className="border border-black py-1.5 px-2.5 text-left">Deskripsi Unit</th>
              </tr>
            </thead>
            <tbody>
              {PATIENT_RISK_GROUPS.map((rg) => {
                const isSelected = rg.code === riskCode;
                const roman = RISK_ROMAN[rg.code];
                return (
                  <tr
                    key={rg.code}
                    style={{ backgroundColor: isSelected ? '#fef9c3' : '#ffffff' }}
                  >
                    <td className={`border border-black py-1.5 px-2.5 align-top ${isSelected ? 'font-bold' : 'font-semibold'}`}>
                      Kategori {roman} / Kelompok {rg.code} (Risiko {rg.riskLabel}){isSelected ? ' ✓' : ''}
                    </td>
                    <td className={`border border-black py-1.5 px-2.5 align-top ${isSelected ? 'font-semibold' : ''}`}>
                      {rg.areas}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ),
    });

    // ==================== 6. MATRIKS ICRA ====================
    pushHeading('sec-matriks-icra', 'MATRIKS ICRA', 'matriks-icra');
    b.push({
      type: 'element',
      key: 'matriks-icra-table',
      gapAfter: 10,
      node: (
        <div className="space-y-2 text-black">
          <p className="text-[11pt] italic text-gray-800">
            (Menentukan Kategori Pengendalian Berdasarkan Kombinasi Tipe Proyek &amp; Risiko Pasien)
          </p>
          <table className="w-full border-collapse border border-black text-[10.5pt] leading-[1.4]">
            <thead>
              <tr className="bg-gray-200 font-bold text-center">
                <th className="border border-black py-1.5 px-2.5 text-left w-[44%]">
                  Risiko Pasien / Tipe Proyek
                </th>
                {(['A', 'B', 'C', 'D'] as ConstructionType[]).map((t) => (
                  <th
                    key={t}
                    className="border border-black py-1.5 px-2 w-[14%]"
                    style={{ backgroundColor: t === tipeCode ? '#e0f2fe' : undefined }}
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
                      className={`border border-black py-1.5 px-2.5 ${isRowActive ? 'font-bold' : 'font-semibold'}`}
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
                          className={`border border-black py-1.5 px-2 text-center ${
                            isTarget ? 'font-black text-[11.5pt]' : 'font-semibold'
                          }`}
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
          <div className="border border-black bg-gray-50 px-3 py-2 text-[11pt] leading-[1.45]">
            <span className="font-bold">Hasil untuk proyek ini: </span>
            → Kombinasi <strong>Tipe {tipeCode}</strong> dan <strong>Risiko Kategori {riskRoman} ({riskInfo.riskLabel})</strong> →{' '}
            <strong>Kategori / Kelas {kelasCode}</strong> pengendalian infeksi diperlukan ({classControl.summary}).
          </div>
        </div>
      ),
    });

    // ==================== 7. RENCANA TINDAKAN PENGENDALIAN INFEKSI ====================
    pushHeading('sec-rencana-tindakan', 'RENCANA TINDAKAN PENGENDALIAN INFEKSI', 'rencana-tindakan');

    // Helper to render structured action tables cleanly (can split across pages via header + rows if needed)
    const pushActionTable = (
      prefix: string,
      subTitle: string,
      rows: { tindakan: string; pj: string }[]
    ) => {
      b.push({
        type: 'element',
        key: `${prefix}-title`,
        keepWithNext: true,
        gapAfter: 4,
        node: (
          <p className="text-[11.5pt] font-bold text-black mt-1">{subTitle}</p>
        ),
      });

      b.push({
        type: 'element',
        key: `${prefix}-table`,
        gapAfter: 9,
        node: (
          <table className="w-full border-collapse border border-black text-[10.5pt] leading-[1.4] text-black">
            <thead>
              <tr className="bg-gray-200 font-bold">
                <th className="border border-black py-1.5 px-2 text-center w-[7%]">No</th>
                <th className="border border-black py-1.5 px-2.5 text-left w-[65%]">Tindakan</th>
                <th className="border border-black py-1.5 px-2.5 text-left w-[28%]">Penanggung Jawab</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td className="border border-black py-1.5 px-2 text-center align-top font-semibold">
                    {idx + 1}
                  </td>
                  <td className="border border-black py-1.5 px-2.5 align-top text-justify">
                    {r.tindakan}
                  </td>
                  <td className="border border-black py-1.5 px-2.5 align-top">
                    {r.pj}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ),
      });
    };

    pushActionTable('pra', 'Tindakan Pra-Konstruksi / Pra-Renovasi (Sebelum Pekerjaan)', praActions);
    pushActionTable(
      'saat',
      `Tindakan Saat Konstruksi / Renovasi — Intervensi Kelas ${kelasCode} (Selama Pekerjaan)`,
      saatActions
    );
    pushActionTable(
      'pasca',
      `Tindakan Pasca-Konstruksi / Pasca-Renovasi — Intervensi Kelas ${kelasCode} (Setelah Pekerjaan)`,
      pascaActions
    );

    if (project.persyaratan_khusus && project.persyaratan_khusus.trim()) {
      b.push({
        type: 'element',
        key: 'persyaratan-khusus',
        gapAfter: 10,
        node: (
          <div className="border border-black p-2.5 text-[10.5pt] leading-[1.45] text-black bg-gray-50">
            <p className="font-bold mb-1">Catatan / Persyaratan Khusus Lapangan:</p>
            <p className="whitespace-pre-line text-justify">{project.persyaratan_khusus.trim()}</p>
          </div>
        ),
      });
    }

    // Ringkasan Monitoring Harian IPCN (if logs exist in icra_konstruksi_monitoring)
    if (monitoringLogs.length > 0) {
      b.push({
        type: 'element',
        key: 'monitoring-summary-title',
        keepWithNext: true,
        gapAfter: 4,
        node: (
          <p className="text-[11.5pt] font-bold text-black mt-1">
            Ringkasan Pemantauan Harian IPCN ({monitoringLogs.length} Kunjungan)
          </p>
        ),
      });
      b.push({
        type: 'element',
        key: 'monitoring-summary-table',
        gapAfter: 10,
        node: (
          <table className="w-full border-collapse border border-black text-[9.5pt] leading-[1.35] text-black">
            <thead>
              <tr className="bg-gray-200 font-bold text-center">
                <th className="border border-black py-1 px-1.5 w-[7%]">No</th>
                <th className="border border-black py-1 px-2 w-[20%]">Tanggal / Jam</th>
                <th className="border border-black py-1 px-2 w-[18%]">Status</th>
                <th className="border border-black py-1 px-2 text-left">Temuan &amp; Tindak Lanjut</th>
              </tr>
            </thead>
            <tbody>
              {monitoringLogs.slice(0, 12).map((m, idx) => (
                <tr key={m.id}>
                  <td className="border border-black py-1 px-1.5 text-center align-top">{idx + 1}</td>
                  <td className="border border-black py-1 px-2 text-center align-top">
                    {formatIndonesianDate(m.tanggal_monitoring)}
                    {m.jam_monitoring ? ` (${m.jam_monitoring})` : ''}
                  </td>
                  <td className="border border-black py-1 px-2 text-center align-top font-semibold">
                    {m.status_kepatuhan}
                  </td>
                  <td className="border border-black py-1 px-2 align-top">
                    {m.temuan_lapangan ? <div>Temuan: {m.temuan_lapangan}</div> : <div>Sesuai protokol pengendalian infeksi PPI.</div>}
                    {m.tindakan_koreksi && <div className="italic">Koreksi: {m.tindakan_koreksi}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ),
      });
    }

    // ==================== 8. KESIMPULAN ====================
    pushHeading('sec-kesimpulan', 'KESIMPULAN', 'kesimpulan');
    pushParagraph(
      'kes-1',
      <>
        Kegiatan <strong>{projectName}</strong> di {lokasiArea} merupakan langkah penting dan strategis dalam rangka meningkatkan kualitas sarana prasarana serta kenyamanan pelayanan bagi pasien, keluarga, dan tenaga kesehatan di lingkungan UOBK RSUD Al-Mulk Kota Sukabumi. Namun, karena pelaksanaan pekerjaan berada di lingkungan rumah sakit aktif{areaTerdampak ? ` yang berdekatan dengan ${areaTerdampak}` : ''}, maka terdapat potensi risiko penularan infeksi yang harus diantisipasi secara cermat dan terstruktur.
      </>
    );
    pushParagraph(
      'kes-2',
      <>
        Melalui proses <em>Infection Control Risk Assessment</em> (ICRA), proyek ini dikategorikan sebagai <strong>Tipe {tipeCode}</strong> ({typeInfo.shortDesc.toLowerCase()}) dengan risiko pasien pada <strong>Kategori {riskRoman} / Kelompok {riskCode} (Risiko {riskInfo.riskLabel})</strong>. Berdasarkan klasifikasi matriks ICRA Permenkes No. 27 Tahun 2017, kombinasi ini menghasilkan <strong>Kategori / Kelas {kelasCode}</strong> pengendalian infeksi ({classControl.summary.toLowerCase()}).
      </>
    );
    pushParagraph(
      'kes-3',
      `Langkah-langkah yang dilakukan sebelum, selama, dan sesudah ${activityNoun} telah dirancang untuk meminimalkan potensi paparan debu maupun mikroorganisme patogen, mencegah infeksi silang, serta memastikan tidak terganggunya operasional layanan medis yang sedang berjalan. Prosedur ini merupakan wujud komitmen rumah sakit terhadap penerapan prinsip Pencegahan dan Pengendalian Infeksi (PPI) secara konsisten dan berkelanjutan.`
    );
    pushParagraph(
      'kes-4',
      `Dengan dilaksanakannya ICRA secara menyeluruh dan dipatuhinya seluruh protokol pengendalian infeksi selama pekerjaan berlangsung, diharapkan proyek ${projectName} dapat terselesaikan dengan baik, aman, dan tanpa menimbulkan dampak negatif terhadap keselamatan pasien, staf, maupun lingkungan UOBK RSUD Al-Mulk Kota Sukabumi.`,
      10
    );

    // ==================== 9. REKOMENDASI ====================
    pushHeading('sec-rekomendasi', 'REKOMENDASI', 'rekomendasi');
    pushParagraph(
      'rek-intro',
      <>
        Berdasarkan hasil analisis risiko infeksi dan klasifikasi proyek melalui proses <em>Infection Control Risk Assessment</em> (ICRA), disampaikan beberapa rekomendasi penting sebagai panduan dan langkah tindak lanjut dalam pelaksanaan kegiatan <strong>{projectName}</strong>, sebagai berikut:
      </>,
      6,
      false
    );

    const recSections: { title: string; items: string[] }[] = [
      {
        title: `1. Pelaksanaan ${activityNounCap}`,
        items: [
          `Pekerjaan harus dilaksanakan dengan mengikuti Kategori Pengendalian Infeksi Kelas ${kelasCode}, sesuai hasil klasifikasi ICRA untuk proyek Tipe ${tipeCode} dan Risiko Pasien Kategori ${riskRoman} (Kelompok ${riskCode}).`,
          'Pekerjaan harus dilakukan oleh tenaga kerja yang menggunakan Alat Pelindung Diri (APD) lengkap serta memahami protokol pengendalian infeksi di lingkungan rumah sakit.',
          kelasCode === 'III' || kelasCode === 'IV'
            ? 'Barikade fisik yang tertutup rapat dan kedap debu (atau metode kontrol kubus) harus dipasang mengelilingi area pekerjaan sebelum pekerjaan dimulai untuk mencegah penyebaran partikel ke area sekitar.'
            : 'Area kerja harus diamankan dengan pembatas kerja yang rapi dan metode pengendalian debu sesuai standar Kelas Kewaspadaan.',
          'Akses keluar-masuk material dan limbah/puing proyek harus melalui jalur khusus, tidak melintasi jalur pasien aktif, dan menggunakan wadah atau gerobak tertutup rapat.',
        ],
      },
      {
        title: '2. Pencegahan Risiko Infeksi',
        items: [
          'Diperlukan monitoring berkala oleh IPCN / Tim PPI untuk mengevaluasi kepatuhan terhadap pengendalian infeksi dan mengidentifikasi potensi risiko baru selama proyek berlangsung.',
          kelasCode === 'III' || kelasCode === 'IV'
            ? 'Menjaga tekanan udara negatif dalam area kerja menggunakan unit penyaringan udara HEPA filter portabel serta mengisolasi sistem HVAC / ventilasi yang terhubung.'
            : 'Mengisolasi sementara kisi ventilasi / AC di sekitar lokasi pekerjaan dan menyediakan sarana pengendalian debu aktif (kabut air / keset basah).',
          'Pekerjaan yang menimbulkan debu berlebih dijadwalkan di luar jam pelayanan padat dan menerapkan metode kerja basah untuk menekan penyebaran partikel udara.',
        ],
      },
      {
        title: '3. Komunikasi dan Edukasi',
        items: [
          `Melakukan sosialisasi dan pemberitahuan resmi kepada staf, unit terkait${areaTerdampak ? ` (${areaTerdampak})` : ''}, pasien, dan pengunjung di sekitar area proyek.`,
          'Tim ruangan, petugas kebersihan (cleaning service), dan pelaksana proyek diberikan edukasi mengenai protokol pembersihan harian serta pengelolaan limbah konstruksi.',
        ],
      },
      {
        title: `4. Setelah ${activityNounCap} Selesai`,
        items: [
          'Setelah pekerjaan selesai, lakukan pembersihan akhir (terminal cleaning), vakum HEPA (bila dipersyaratkan), serta pengepelan basah dengan cairan disinfektan standar secara menyeluruh.',
          'Pembatas area kerja baru dibongkar secara hati-hati setelah dinyatakan bersih dan diperiksa bersama Komite PPI, K3RS, dan Tim Teknik / IPSRS.',
          'Area dinyatakan selesai dan siap difungsikan kembali hanya setelah dilakukan serah terima formal serta verifikasi kelayakan oleh Tim PPI dan Manajemen.',
        ],
      },
      {
        title: '5. Dokumentasi dan Evaluasi',
        items: [
          'Seluruh tahapan proyek (Pra, Intra, dan Pasca pekerjaan) beserta catatan monitoring harian IPCN harus didokumentasikan secara lengkap.',
          'Dilakukan evaluasi pascapekerjaan guna mengukur efektivitas pengendalian infeksi serta menjadi bahan pembelajaran bagi proyek konstruksi berikutnya di UOBK RSUD Al-Mulk.',
        ],
      },
    ];

    recSections.forEach((sec, sIdx) => {
      b.push({
        type: 'element',
        key: `rek-sec-${sIdx}`,
        gapAfter: 7,
        node: (
          <div className="text-[11.5pt] leading-[1.5] text-justify text-black">
            <p className="font-bold mb-1">{sec.title}</p>
            <ul className="list-disc pl-8 space-y-1">
              {sec.items.map((it, idx) => (
                <li key={idx}>{it}</li>
              ))}
            </ul>
          </div>
        ),
      });
    });

    pushParagraph(
      'rek-closing',
      'Rekomendasi ini diharapkan dapat menjadi acuan dalam menjamin pelaksanaan proyek yang aman, terkendali, dan sesuai standar keselamatan pasien serta mutu pelayanan rumah sakit.',
      10,
      false
    );

    // ==================== 10. PENUTUP & PENGESAHAN ====================
    pushHeading('sec-penutup', 'PENUTUP', 'penutup');
    pushParagraph(
      'pen-1',
      <>
        Demikian laporan <em>Infection Control Risk Assessment</em> (ICRA) untuk kegiatan <strong>{projectName}</strong> di {lokasiArea} ini disusun sebagai bentuk komitmen UOBK RSUD Al-Mulk Kota Sukabumi dalam menjaga keselamatan pasien, tenaga kesehatan, dan seluruh pihak yang berada di lingkungan rumah sakit selama berlangsungnya aktivitas proyek.
      </>
    );
    pushParagraph(
      'pen-2',
      `Penyusunan laporan ini melibatkan berbagai pihak lintas unit, yaitu Komite Pencegahan dan Pengendalian Infeksi (PPI), Instalasi Pemeliharaan Sarana Rumah Sakit (IPSRS), Tim K3RS, Tim Manajemen Risiko, serta pihak pelaksana (${kontraktor}). Setiap langkah yang tertuang dalam dokumen ini disesuaikan dengan pedoman pencegahan infeksi nasional (Permenkes No. 27 Tahun 2017) dan standar akreditasi rumah sakit (STARKES).`
    );
    pushParagraph(
      'pen-3',
      'Kami berharap seluruh pihak terkait dapat menjalankan peran dan tanggung jawabnya dengan baik sesuai ketentuan dalam dokumen ini. Monitoring berkala oleh Tim PPI serta komunikasi aktif antar unit menjadi kunci keberhasilan menjaga lingkungan rumah sakit tetap aman dan bebas risiko infeksi.'
    );
    pushParagraph(
      'pen-4',
      `Akhir kata, semoga kegiatan ${projectName} dapat selesai tepat waktu dengan hasil optimal serta memberikan manfaat nyata bagi peningkatan kualitas pelayanan dan keselamatan pasien di UOBK RSUD Al-Mulk Kota Sukabumi.`,
      14
    );

    // Exact 2-column Signature Block matching reference document
    b.push({
      type: 'element',
      key: 'penutup-ttd',
      gapAfter: 10,
      node: (
        <div className="w-full text-[11.5pt] leading-[1.45] text-black pt-2">
          <div className="flex justify-end mb-3 pr-8">
            <p className="w-[45%] text-center">Sukabumi, {tglPengesahan}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-center">
            <div className="flex flex-col items-center">
              <p className="font-semibold">Penyusun</p>
              <div className="h-20 flex items-center justify-center my-1">
                {project.ttd_ipcn ? (
                  <img
                    src={project.ttd_ipcn}
                    alt="Tanda Tangan IPCN"
                    className="max-h-16 object-contain"
                  />
                ) : null}
              </div>
              <p className="font-bold underline">{namaIpcn}</p>
              <p className="text-[10.5pt]">Infection Prevention Control Nurse</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="font-semibold">Mengetahui</p>
              <div className="h-20 flex items-center justify-center my-1" />
              <p className="font-bold underline">{ketuaPpiName}</p>
              <p className="text-[10.5pt]">Ketua PPI</p>
            </div>
          </div>
        </div>
      ),
    });

    // ==================== 11. BUKTI DOKUMENTASI (HALAMAN BARU) ====================
    b.push({ type: 'pageBreak', key: 'pb-dokumentasi' });

    pushHeading('sec-bukti-dokumentasi', 'BUKTI DOKUMENTASI', 'bukti-dokumentasi');

    // Helper to push photo grids chunked 2 per row so page breaks never split an image
    const pushPhotoSection = (
      phaseKey: string,
      phaseTitle: string,
      photos: { url: string; caption?: string }[],
      emptyNote: string
    ) => {
      b.push({
        type: 'element',
        key: `${phaseKey}-heading`,
        keepWithNext: true,
        gapAfter: 6,
        node: (
          <p className="text-[11.5pt] font-bold text-black mt-2">{phaseTitle}</p>
        ),
      });

      if (photos.length === 0) {
        b.push({
          type: 'element',
          key: `${phaseKey}-empty`,
          gapAfter: 10,
          node: (
            <div className="border border-dashed border-gray-400 rounded py-5 px-4 text-center text-[10.5pt] italic text-gray-600 bg-gray-50">
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
            <div className="grid grid-cols-2 gap-3.5 w-full">
              {pair.map((photo, idx) => (
                <div
                  key={idx}
                  className="border border-black/30 bg-white p-1.5 flex flex-col items-center"
                >
                  <div className="w-full h-[215px] overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img
                      src={photo.url}
                      alt={`${phaseTitle} ${i + idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {photo.caption && (
                    <p className="text-[9pt] text-center text-gray-700 mt-1 leading-tight">
                      {photo.caption}
                    </p>
                  )}
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
      prePhotos.map((url, idx) => ({
        url,
        caption: `Dokumentasi Pra Konstruksi #${idx + 1}`,
      })),
      'Belum ada foto dokumentasi pra konstruksi/renovasi yang diunggah.'
    );

    pushPhotoSection(
      'doc-intra',
      '2. Intra Renovasi / Konstruksi',
      intraPhotos,
      'Belum ada foto dokumentasi intra konstruksi/renovasi (diambil otomatis dari Monitoring Harian ICRA atau tombol Kelola Foto).'
    );

    pushPhotoSection(
      'doc-post',
      '3. Post Renovasi / Konstruksi',
      postPhotos.map((url, idx) => ({
        url,
        caption: `Dokumentasi Pasca Konstruksi #${idx + 1}`,
      })),
      'Belum ada foto dokumentasi pasca konstruksi/renovasi (dapat dilengkapi melalui tombol Kelola Foto & Pengesahan).'
    );

    return b;
  }, [
    project,
    projectName,
    lokasiArea,
    areaTerdampak,
    lokasiLengkap,
    kontraktor,
    pjProyek,
    namaIpcn,
    ketuaPpiName,
    tglPengesahan,
    tipeCode,
    riskCode,
    riskRoman,
    kelasCode,
    typeInfo,
    riskInfo,
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
        subtitle={projectName.toUpperCase()}
        hospitalText="UOBK RSUD AL-MULK KOTA SUKABUMI"
        year={projectYear}
      />
    ),
    [projectName, projectYear]
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

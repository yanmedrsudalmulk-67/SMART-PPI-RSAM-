import React from 'react';
import { ElementFlowBlock } from '@/components/reports/official/AutoPaginatedF4Document';

export interface OfficialChartNarrative {
  analisa: string;
  rekomendasi: string[];
  tindakLanjut: string[];
}

export function fmtIdNum(val: number | string, decimals = 1): string {
  const n = typeof val === 'number' ? val : Number(val);
  if (isNaN(n)) return String(val);
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(decimals).replace(/\.0$/, '').replace('.', ',');
}

export interface HaisSeriesPoint {
  label: string; // e.g., 'Ranap Dewasa' or 'Juli' or 'Januari'
  days: number;
  cases: number;
  rate: number;
}

const HAIS_META: Record<
  'phlebitis' | 'isk' | 'decubitus' | 'vap' | 'ido',
  {
    title: string;
    shortTitle: string;
    unit: string;
    targetNum: number;
    targetLabel: string;
    denomLabel: string;
    bundleName: string;
  }
> = {
  phlebitis: {
    title: 'Phlebitis',
    shortTitle: 'Phlebitis',
    unit: '‰',
    targetNum: 1.0,
    targetLabel: '≤ 1‰',
    denomLabel: 'hari pemasangan kateter intravena perifer (IV line)',
    bundleName: 'Bundle Insersi dan Maintenance Kateter Intravena (PLABSI)',
  },
  isk: {
    title: 'Infeksi Saluran Kemih (ISK)',
    shortTitle: 'ISK',
    unit: '‰',
    targetNum: 4.7,
    targetLabel: '≤ 4,7‰',
    denomLabel: 'hari pemasangan kateter urin menetap (dower catheter)',
    bundleName: 'Bundle Pencegahan Catheter Associated Urinary Tract Infection (CAUTI/ISK)',
  },
  decubitus: {
    title: 'Infeksi Luka Tekan (Decubitus)',
    shortTitle: 'Decubitus',
    unit: '‰',
    targetNum: 1.5,
    targetLabel: '≤ 1,5‰',
    denomLabel: 'hari tirah baring (immobilisasi)',
    bundleName: 'Bundle Pencegahan Luka Tekan (Decubitus)',
  },
  vap: {
    title: 'Ventilator Associated Pneumonia (VAP)',
    shortTitle: 'VAP',
    unit: '‰',
    targetNum: 5.8,
    targetLabel: '≤ 5,8‰',
    denomLabel: 'hari pemasangan ventilator mekanik',
    bundleName: 'Bundle Pencegahan Ventilator Associated Pneumonia (VAP)',
  },
  ido: {
    title: 'Infeksi Daerah Operasi (IDO)',
    shortTitle: 'IDO',
    unit: '%',
    targetNum: 2.0,
    targetLabel: '≤ 2%',
    denomLabel: 'tindakan pembedahan (operasi)',
    bundleName: 'Bundle Pencegahan Infeksi Daerah Operasi (Surgical Site Infection)',
  },
};

/**
 * 1. Narrative generator for Overall HAIs Summary Chart (Phlebitis, ISK, Decubitus, VAP, IDO)
 */
export function buildHaisOverviewNarrative(params: {
  periodLabel: string;
  phlebitis: { cases: number; days: number; rate: number };
  isk: { cases: number; days: number; rate: number };
  decubitus: { cases: number; days: number; rate: number };
  vap: { cases: number; days: number; rate: number };
  ido: { cases: number; days: number; rate: number };
  peakDetail?: string; // e.g., "tertinggi pada bulan September (9,1‰)" or "tertinggi di Ruang Ranap Dewasa (16,9‰)"
}): OfficialChartNarrative {
  const { periodLabel, phlebitis, isk, decubitus, vap, ido, peakDetail } = params;

  const elevated: string[] = [];
  const controlled: string[] = [];

  const check = (
    label: string,
    rate: number,
    cases: number,
    days: number,
    unit: string,
    target: number,
    targetText: string
  ) => {
    if (rate > target) {
      elevated.push(
        `${label} sebesar ${fmtIdNum(rate)}${unit} (${cases} kasus dari ${days} hari/tindakan, melebihi target ${targetText})`
      );
    } else {
      controlled.push(`${label} (${fmtIdNum(rate)}${unit}; ${cases} kasus)`);
    }
  };

  check('Phlebitis', phlebitis.rate, phlebitis.cases, phlebitis.days, '‰', 1.0, '≤ 1‰');
  check('ISK', isk.rate, isk.cases, isk.days, '‰', 4.7, '≤ 4,7‰');
  check('Decubitus', decubitus.rate, decubitus.cases, decubitus.days, '‰', 1.5, '≤ 1,5‰');
  check('VAP', vap.rate, vap.cases, vap.days, '‰', 5.8, '≤ 5,8‰');
  check('IDO', ido.rate, ido.cases, ido.days, '%', 2.0, '≤ 2%');

  const peakClause = peakDetail ? ` dengan proporsi ${peakDetail}` : '';

  const analisa =
    elevated.length > 0
      ? `Berdasarkan grafik rekapitulasi pemantauan surveilans Healthcare Associated Infections (HAIs) di UOBK RSUD Al-Mulk Kota Sukabumi pada ${periodLabel}, teridentifikasi indikator yang masih melampaui standar baku mutu nasional Kementerian Kesehatan yaitu ${elevated.join(', ')}${peakClause}. Sementara itu, indikator surveilans lainnya berada dalam kondisi terkendali dan memenuhi target standar nasional, meliputi ${controlled.join(', ')}. Tingginya angka kejadian pada indikator yang belum mencapai target dipengaruhi oleh belum konsistennya penerapan SPO dan bundle pencegahan infeksi pemasangan alat invasif, kepatuhan kebersihan tangan 5 momen sebelum tindakan aseptik yang masih perlu ditingkatkan, serta faktor klinis pasien dengan terapi cairan osmolaritas tinggi.`
      : `Berdasarkan grafik rekapitulasi pemantauan surveilans Healthcare Associated Infections (HAIs) di UOBK RSUD Al-Mulk Kota Sukabumi pada ${periodLabel}, seluruh lima indikator mutu surveilans utama telah terkendali dan memenuhi standar nasional Kementerian Kesehatan, yaitu Phlebitis ${fmtIdNum(phlebitis.rate)}‰ (${phlebitis.cases} kasus dari ${phlebitis.days} hari IV line), ISK ${fmtIdNum(isk.rate)}‰ (${isk.cases} kasus), Decubitus ${fmtIdNum(decubitus.rate)}‰ (${decubitus.cases} kasus), VAP ${fmtIdNum(vap.rate)}‰ (${vap.cases} kasus), serta IDO ${fmtIdNum(ido.rate)}% (${ido.cases} kasus dari ${ido.days} tindakan operasi). Capaian ini mencerminkan kepatuhan petugas yang baik terhadap pelaksanaan kewaspadaan standar, teknik aseptik tindakan invasif, serta berjalannya pemantauan harian oleh IPCN dan IPCLN.`;

  const rekomendasi =
    elevated.length > 0
      ? [
          'Memperkuat kepatuhan seluruh tenaga keperawatan dan kebidanan terhadap penerapan bundle insersi serta maintenance alat invasif sesuai Standar Prosedur Operasional (SPO) PPI.',
          'Memastikan ketersediaan sarana pendukung pencegahan HAIs secara berkesinambungan, termasuk transparent dressing steril, swab alkohol 70%, dan cairan handrub di setiap titik pelayanan.',
          'Meningkatkan supervisi aktif harian oleh IPCN bersama IPCLN ruangan terhadap pengkajian indikasi pelepasan alat invasif sedini mungkin apabila sudah tidak diperlukan.',
          'Mempertahankan kualitas penerapan bundle pencegahan pada indikator ISK, Decubitus, VAP, dan IDO agar tetap konsisten berada di bawah ambang batas standar nasional.',
        ]
      : [
          'Mempertahankan konsistensi penerapan seluruh elemen bundle pencegahan HAIs (PLABSI, CAUTI, VAP, IDO, dan Decubitus) di setiap unit pelayanan rawat inap dan kamar bedah.',
          'Menjaga kesinambungan ketersediaan logistik PPI, antiseptik kulit, dan alat pelindung diri steril untuk menunjang prosedur tindakan invasif yang aman.',
          'Melanjutkan surveilans aktif harian terintegrasi SIMRS oleh IPCN dan IPCLN guna memastikan deteksi dini faktor risiko infeksi pada pasien terpasang alat.',
          'Mengintegrasikan evaluasi capaian surveilans HAIs ke dalam program peningkatan mutu dan keselamatan pasien rumah sakit secara berkala.',
        ];

  const tindakLanjut =
    elevated.length > 0
      ? [
          'Melaksanakan audit kepatuhan bundle pemasangan dan perawatan infus secara langsung (bedside audit) di ruang perawatan dengan angka insiden tertinggi.',
          'Menyelenggarakan re-sosialisasi dan penyegaran teknis SPO pencegahan phlebitis serta teknik aseptik penyuntikan bagi perawat dan bidan pelaksana.',
          'Menyampaikan umpan balik (feedback) tertulis capaian angka HAIs per ruangan kepada Kepala Ruang dan Kepala Instalasi Rawat Inap untuk evaluasi internal unit.',
          'Melaporkan rekapitulasi analisis surveilans HAIs beserta matriks perbaikan kepada Direktur UOBK RSUD Al-Mulk dan Komite Mutu Rumah Sakit.',
        ]
      : [
          'Melaksanakan uji petik (validasi data surveilans) secara berkala antara pencatatan IPCLN ruangan dengan data rekam medis elektronik SIMRS.',
          'Melakukan pemantauan rutin kelengkapan pengisian checklist bundle HAIs pada rekam medis pasien yang terpasang alat invasif maupun menjalani operasi.',
          'Memberikan apresiasi dan umpan balik capaian zero infection kepada seluruh kepala unit pelayanan guna menjaga motivasi budaya keselamatan pasien.',
          'Mendokumentasikan dan melaporkan hasil pemantauan surveilans HAIs secara tepat waktu kepada Direktur dan Komite Mutu UOBK RSUD Al-Mulk.',
        ];

  return { analisa, rekomendasi, tindakLanjut };
}

/**
 * 2. Narrative generator for Individual HAIs Indicator Chart (Phlebitis, ISK, Decubitus, VAP, IDO)
 */
export function buildSingleHaisNarrative(params: {
  indicator: 'phlebitis' | 'isk' | 'decubitus' | 'vap' | 'ido';
  periodLabel: string;
  dimensionLabel: 'ruangan' | 'bulan';
  points: HaisSeriesPoint[];
  totalDays?: number;
  totalCases?: number;
  overallRate?: number;
  customTargetNum?: number;
  customTargetLabel?: string;
}): OfficialChartNarrative {
  const meta = HAIS_META[params.indicator];
  const targetNum = params.customTargetNum ?? meta.targetNum;
  const targetLabel = params.customTargetLabel ?? meta.targetLabel;
  const pts = params.points;

  const totDays = params.totalDays ?? pts.reduce((s, p) => s + p.days, 0);
  const totCases = params.totalCases ?? pts.reduce((s, p) => s + p.cases, 0);
  const mult = meta.unit === '%' ? 100 : 1000;
  const calcRate =
    params.overallRate !== undefined
      ? params.overallRate
      : totDays > 0
      ? Number(((totCases / totDays) * mult).toFixed(1))
      : 0;

  const sortedDesc = [...pts].sort((a, b) => b.rate - a.rate || b.cases - a.cases);
  const sortedAsc = [...pts].sort((a, b) => a.rate - b.rate || a.cases - b.cases);
  const highest = sortedDesc[0];
  const lowest = sortedAsc[0];
  const dimWord = params.dimensionLabel === 'ruangan' ? 'ruang perawatan' : 'bulan';

  const isZero = totCases === 0 && calcRate === 0;
  const exceedsTarget = calcRate > targetNum || (highest && highest.rate > targetNum);

  let analisa = '';
  if (isZero) {
    analisa = `Berdasarkan hasil pemantauan grafik insiden rate ${meta.title} di UOBK RSUD Al-Mulk Kota Sukabumi pada ${params.periodLabel}, tercatat angka kejadian sebesar 0${meta.unit} (0 kasus infeksi dari total ${totDays} ${meta.denomLabel}). Capaian ini telah memenuhi dan berada di bawah ambang batas standar nasional Kementerian Kesehatan (${targetLabel}). Tidak ditemukannya kejadian ${meta.shortTitle} pada seluruh ${dimWord} selama periode pemantauan menunjukkan bahwa pelaksanaan prosedur aseptik, pemeliharaan alat, pengkajian indikasi klinis harian, serta penerapan ${meta.bundleName} oleh tenaga kesehatan telah berjalan secara efektif dan konsisten.`;
  } else if (exceedsTarget) {
    const variationText =
      highest && lowest && highest.label !== lowest.label
        ? `, dengan angka kejadian tertinggi terdapat pada ${dimWord} ${highest.label} sebesar ${fmtIdNum(highest.rate)}${meta.unit} (${highest.cases} kasus dari ${highest.days} ${meta.denomLabel}) dan terendah pada ${lowest.label} sebesar ${fmtIdNum(lowest.rate)}${meta.unit} (${lowest.cases} kasus)`
        : '';
    const causeByInd: Record<typeof params.indicator, string> = {
      phlebitis:
        'Kondisi ini dipengaruhi oleh belum optimalnya kepatuhan penerapan SPO dan bundle pemasangan/perawatan infus, pemilihan ukuran kateter IV yang belum sepenuhnya proporsional dengan kondisi vena, fiksasi dressing yang kurang adekuat akibat kelembaban kulit pasien, pemberian terapi cairan atau obat injeksi dengan osmolaritas tinggi, serta kepatuhan cuci tangan sebelum tindakan aseptik yang masih perlu diperkuat.',
      isk:
        'Kondisi ini berkaitan dengan kepatuhan pemeliharaan kateter urin tertutup yang belum sepenuhnya optimal, posisi penempatan urine bag saat mobilisasi pasien, frekuensi perawatan higiene perineal harian, serta perlunya penguatan kepatuhan kebersihan tangan sebelum manipulasi kateter.',
      decubitus:
        'Kondisi ini dipengaruhi oleh faktor klinis pasien dengan immobilisasi berkepanjangan dan gangguan status nutrisi, belum optimalnya jadwal alih baring berkala tiap 2 jam, kelembaban kulit serta lipatan linen tempat tidur, dan keterbatasan ketersediaan kasur dekubitus pada ruang perawatan.',
      vap:
        'Kondisi ini berkaitan dengan perlunya optimalisasi elevasi kepala tempat tidur 30°–45° secara konsisten, frekuensi pelaksanaan oral hygiene menggunakan antiseptik chlorhexidine 0,2%, teknik pengisapan sekret (suctioning) aseptik, serta kepatuhan kebersihan tangan petugas.',
      ido:
        'Kondisi ini dipengaruhi oleh faktor persiapan pra-operasi pasien (mandi antiseptik, kontrol glikemik, dan pencukuran menggunakan clipper), ketepatan waktu pemberian antibiotik profilaksis 30–60 menit sebelum insisi, serta teknik perawatan luka pasca-operasi.',
    };
    analisa = `Berdasarkan hasil pemantauan grafik insiden rate ${meta.title} di UOBK RSUD Al-Mulk Kota Sukabumi pada ${params.periodLabel}, diperoleh total capaian sebesar ${fmtIdNum(calcRate)}${meta.unit} (${totCases} kasus infeksi dari total ${totDays} ${meta.denomLabel})${variationText}, sehingga belum mencapai target standar baku mutu Kementerian Kesehatan (${targetLabel}). ${causeByInd[params.indicator]}`;
  } else {
    analisa = `Berdasarkan hasil pemantauan grafik insiden rate ${meta.title} di UOBK RSUD Al-Mulk Kota Sukabumi pada ${params.periodLabel}, diperoleh capaian sebesar ${fmtIdNum(calcRate)}${meta.unit} (${totCases} kasus dari total ${totDays} ${meta.denomLabel}), yang secara akumulatif telah memenuhi standar baku mutu nasional Kementerian Kesehatan (${targetLabel}). Meskipun masih terkendali di bawah batas maksimal, pemantauan ketat pada ${dimWord} ${highest ? highest.label : 'terkait'} tetap diperlukan agar potensi peningkatan kasus dapat dicegah sedini mungkin melalui disiplin ${meta.bundleName}.`;
  }

  const rekomByInd: Record<typeof params.indicator, { zero: string[]; active: string[] }> = {
    phlebitis: {
      active: [
        'Meningkatkan kepatuhan kebersihan tangan 6 langkah pada 5 momen, khususnya sebelum tindakan aseptik pemasangan dan manipulasi akses intravena.',
        'Memastikan pemilihan ukuran kateter IV dan lokasi vena insersi yang tepat, desinfeksi area tusukan/konektor dengan alkohol swab 70% hingga kering, serta penggunaan transparent dressing steril.',
        'Mengoptimalkan pengenceran atau pemberian per-drip pada obat parenteral dengan osmolaritas tinggi serta melakukan observasi harian skor VIPS pada setiap pergantian shift.',
        'Melepaskan atau memindahkan kateter IV sesegera mungkin apabila sudah tidak ada indikasi medis atau ditemukan tanda awal kemerahan/nyeri (VIPS ≥ 2).',
      ],
      zero: [
        'Mempertahankan kepatuhan penerapan Bundle Insersi dan Maintenance kateter intravena perifer (PLABSI) secara konsisten di seluruh ruang perawatan.',
        'Menjaga ketersediaan transparent dressing steril, alkohol swab 70%, dan handrub di setiap troli tindakan keperawatan.',
        'Melanjutkan pemantauan harian skor Visual Infusion Phlebitis Score (VIPS) pada seluruh pasien terpasang infus setiap pergantian jaga.',
        'Mempertahankan pengkajian ulang kebutuhan akses intravena setiap hari agar kateter yang tidak diperlukan segera dilepas.',
      ],
    },
    isk: {
      active: [
        'Memperketat penerapan teknik aseptik dan penggunaan peralatan steril saat pemasangan kateter urin menetap sesuai indikasi medis.',
        'Memastikan sistem drainase urin selalu tertutup, selang tidak terlipat (kinking), serta posisi urine bag selalu lebih rendah dari kandung kemih dan tidak menyentuh lantai.',
        'Melaksanakan perawatan kebersihan area perineal dan meatus uretra minimal 2 kali sehari serta setiap selesai defekasi.',
        'Melakukan pengkajian harian kebutuhan pemakaian kateter urin dan segera melepas kateter apabila indikasi medis telah teratasi.',
      ],
      zero: [
        'Mempertahankan kepatuhan penuh terhadap pelaksanaan Bundle Pencegahan ISK (CAUTI) mulai dari tahap pengkajian indikasi, teknik insersi steril, hingga perawatan harian.',
        'Menjaga konsistensi penempatan urine bag di bawah level kandung kemih dan tidak menyentuh lantai baik di tempat tidur maupun saat transportasi pasien.',
        'Melanjutkan pelaksanaan perineal hygiene rutin setiap hari pada seluruh pasien yang terpasang kateter urin menetap.',
        'Memastikan evaluasi harian indikasi kateter urin tetap berjalan konsisten guna meminimalkan durasi hari terpasang alat.',
      ],
    },
    decubitus: {
      active: [
        'Melaksanakan pengkajian risiko luka tekan (Skala Braden/Norton) sejak awal pasien masuk rawat inap dan mengulang evaluasi setiap hari pada pasien tirah baring.',
        'Menerapkan jadwal perubahan posisi tidur (alih baring miring kanan–terlentang–miring kiri) secara konsisten setiap 2 jam sekali dengan dokumentasi lembar observasi.',
        'Menjaga kebersihan dan kelembaban kulit pasien, memastikan linen tempat tidur selalu kering, kencang, dan bebas lipatan yang memicu gesekan/tekanan.',
        'Mengoptimalkan penggunaan kasur anti-dekubitus serta kolaborasi pemenuhan nutrisi tinggi kalori dan tinggi protein bersama instalasi gizi.',
      ],
      zero: [
        'Mempertahankan pelaksanaan skrining risiko dekubitus sejak awal admisi pada seluruh pasien dengan keterbatasan mobilisasi atau penurunan kesadaran.',
        'Menjaga konsistensi pelaksanaan program alih baring berkala setiap 2 jam serta edukasi aktif kepada keluarga pendamping pasien.',
        'Mempertahankan standar kebersihan kulit (personal hygiene) dan kerapihan pemasangan linen tempat tidur bebas lipatan di seluruh ruang rawat inap.',
        'Melanjutkan kolaborasi multidisiplin bersama tim medis dan gizi klinis dalam menjaga kecukupan hidrasi serta status nutrisi pasien tirah baring.',
      ],
    },
    vap: {
      active: [
        'Memastikan posisi kepala tempat tidur pasien terpasang ventilator mekanik dipertahankan pada sudut elevasi 30°–45° setiap saat bila tidak ada kontraindikasi klinis.',
        'Melaksanakan perawatan kebersihan rongga mulut (oral hygiene) secara terjadwal menggunakan larutan antiseptik chlorhexidine 0,2% serta penyikatan gigi tiap 12 jam.',
        'Menerapkan prosedur pengisapan lendir jalan napas (suctioning) secara aseptik menggunakan APD lengkap serta memantau tekanan cuff ETT secara berkala.',
        'Melakukan pengkajian harian kesiapan penyapihan ventilator (daily sedation vacation & weaning assessment) bersama DPJP Anestesi/Intensivis.',
      ],
      zero: [
        'Mempertahankan kepatuhan penerapan seluruh elemen Bundle Pencegahan VAP pada setiap pasien yang menggunakan dukungan ventilasi mekanik.',
        'Menjaga konsistensi elevasi kepala tempat tidur 30°–45° dan pelaksanaan oral hygiene berkala menggunakan antiseptik chlorhexidine 0,2%.',
        'Memastikan ketersediaan kanul suction steril, cairan antiseptik oral, serta kelengkapan APD petugas di unit perawatan intensif/ruang rawat.',
        'Melanjutkan kolaborasi evaluasi harian durasi pemakaian ventilator untuk mempercepat penyapihan (ekstubasi) sesuai kondisi klinis pasien.',
      ],
    },
    ido: {
      active: [
        'Memastikan ketepatan waktu pemberian antibiotik profilaksis 30–60 menit sebelum insisi pembedahan sesuai panduan empiris rumah sakit.',
        'Menerapkan persiapan pra-operasi sesuai standar PPI, meliputi mandi antiseptik chlorhexidine, pengendalian kadar gula darah, dan pencukuran area operasi menggunakan clipper di IBS.',
        'Menjaga sterilitas instrumen bedah melalui CSSD, disiplin teknik aseptik tim kamar operasi, serta pengendalian lalu lintas pintu dan suhu kamar bedah.',
        'Melaksanakan perawatan luka pasca-operasi dengan teknik aseptik steril serta memberikan edukasi perawatan luka saat pasien pulang (discharge planning).',
      ],
      zero: [
        'Mempertahankan konsistensi penerapan Bundle Pencegahan IDO pada tahap pra-operasi, intra-operasi di Instalasi Bedah Sentral (IBS), hingga perawatan pasca-operasi.',
        'Menjaga ketepatan pemberian antibiotik profilaksis, persiapan kulit antiseptik alkohol 70%–chlorhexidine/povidone iodine, serta normotermia perioperatif.',
        'Mempertahankan mutu sterilisasi instrumen bedah di CSSD serta pemantauan parameter lingkungan fisik ruang kamar operasi.',
        'Melanjutkan surveilans aktif pemantauan luka operasi baik selama pasien dirawat inap maupun saat kontrol rawat jalan poliklinik bedah/kebidanan.',
      ],
    },
  };

  const rtlByInd: Record<typeof params.indicator, { zero: string[]; active: string[] }> = {
    phlebitis: {
      active: [
        `Melaksanakan supervisi dan audit langsung kepatuhan SPO pemasangan serta perawatan infus pada ${dimWord} dengan angka kejadian tertinggi (${highest ? highest.label : 'unit rawat inap'}).`,
        'Menyelenggarakan bedside teaching dan re-edukasi teknis fiksasi kateter IV serta pencampuran obat parenteral aman bagi perawat pelaksana.',
        'Memeriksa kelengkapan pencatatan tanggal insersi pada label balutan infus dan lembar observasi harian VIPS saat ronde IPCN.',
        'Menyampaikan laporan umpan balik bulanan/triwulanan insiden phlebitis kepada Kepala Ruang dan Komite Mutu untuk evaluasi tindak perbaikan.',
      ],
      zero: [
        'Melakukan audit kepatuhan pengisian form bundle PLABSI secara berkala oleh IPCN dan IPCLN di seluruh ruang rawat inap.',
        'Memastikan stok transparent dressing dan alkohol swab tersedia cukup di gudang farmasi dan masing-masing unit perawatan.',
        'Melakukan validasi silang data hari pemakaian IV line antara laporan surveilans ruangan dengan rekam medis SIMRS.',
        'Mendokumentasikan capaian pengendalian phlebitis dalam laporan evaluasi berkala Tim PPI kepada Direktur RSUD Al-Mulk.',
      ],
    },
    isk: {
      active: [
        'Melakukan inspeksi kepatuhan penempatan urine bag dan fiksasi kateter urin pada seluruh pasien terpasang dower catheter di ruang rawat inap.',
        'Mengadakan penyegaran singkat (refreshing) penerapan Bundle CAUTI bagi perawat dan bidan bersama IPCLN ruangan.',
        'Mengevaluasi kesesuaian indikasi pemasangan dan lama hari terpasang kateter urin pada rekam medis pasien.',
        'Melaporkan hasil evaluasi dan rekomendasi perbaikan pemeliharaan kateter urin kepada Kepala Instalasi Rawat Inap dan Komite Mutu.',
      ],
      zero: [
        'Melaksanakan ronde pemantauan rutin oleh IPCN dan IPCLN untuk memastikan tidak ada urine bag yang diletakkan di lantai atau sejajar kandung kemih.',
        'Memvalidasi kelengkapan dokumentasi bundle ISK dan catatan perineal hygiene pada berkas rekam medis pasien terpasang kateter.',
        'Memberikan umpan balik positif capaian 0‰ kejadian ISK kepada seluruh ruang perawatan untuk mempertahankan kepatuhan SPO.',
        'Melaporkan rekapitulasi surveilans pemakaian kateter urin secara berkala pada laporan mutu Tim PPI RSUD Al-Mulk.',
      ],
    },
    decubitus: {
      active: [
        'Melakukan audit kepatuhan pelaksanaan jadwal alih baring 2 jam dan kelengkapan asesmen skala risiko dekubitus di ruang rawat inap.',
        'Berkoordinasi dengan bagian sarana/logistik keperawatan terkait pemenuhan sprei ukuran proporsional dan ketersediaan kasur anti-dekubitus.',
        'Melakukan edukasi langsung kepada keluarga penunggu pasien mengenai cara membantu mobilisasi miring kanan/kiri dan menjaga kulit tetap kering.',
        'Mendokumentasikan evaluasi kasus dan tindak lanjut perawatan luka tekan pada laporan surveilans Tim PPI.',
      ],
      zero: [
        'Melaksanakan pemantauan berkala kepatuhan pelaksanaan alih baring tiap 2 jam pada pasien tirah baring di ruang perawatan dewasa dan bedah.',
        'Memeriksa kondisi kelayakan kasur pasien dan kebersihan linen tempat tidur bersama kepala ruang dan IPCLN.',
        'Melakukan validasi pencatatan hari tirah baring pasien berisiko pada sistem pelaporan surveilans terintegrasi SIMRS.',
        'Melaporkan keberhasilan pertahanan 0 kasus dekubitus pada rapat evaluasi mutu pelayanan rumah sakit.',
      ],
    },
    vap: {
      active: [
        'Melakukan audit kepatuhan posisi elevasi kepala 30°–45° dan jadwal pelaksanaan oral hygiene pada pasien terpasang ventilator.',
        'Berkoordinasi dengan instalasi farmasi/logistik terkait ketersediaan cairan antiseptik chlorhexidine 0,2%, kanul suction steril, dan APD pelindung wajah.',
        'Melaksanakan pendampingan teknis prosedur suctioning aseptik bagi perawat yang merawat pasien dengan ventilasi mekanik.',
        'Melaporkan hasil audit kepatuhan bundle VAP dan kebutuhan sarana penunjang kepada manajemen dan Komite Mutu.',
      ],
      zero: [
        'Melakukan observasi kepatuhan penerapan bundle VAP setiap kali terdapat pasien yang terpasang ventilator mekanik di rumah sakit.',
        'Memastikan kesiapan peralatan perawatan jalan napas aseptik dan cairan antiseptik oral hygiene di unit pelayanan kritis.',
        'Memvalidasi akurasi pencatatan hari pemakaian ventilator mekanik bersama IPCLN ruangan dan data SIMRS.',
        'Mendokumentasikan hasil surveilans 0‰ kejadian VAP dalam laporan berkala Tim PPI kepada Direktur RSUD Al-Mulk.',
      ],
    },
    ido: {
      active: [
        'Melakukan audit kepatuhan checklist keselamatan bedah dan bundle pra-operasi (mandi antiseptik, clipper, dan profilaksis) bersama kepala ruang IBS.',
        'Berkoordinasi dengan KSM Bedah/Obgyn dan Instalasi Farmasi terkait ketepatan waktu pemberian serta penghentian antibiotik profilaksis 24 jam.',
        'Melakukan inspeksi berkala parameter suhu, kelembaban, kebersihan permukaan kamar operasi, dan kualitas sterilisasi instrumen CSSD.',
        'Melaksanakan telusur kasus dan pelaporan evaluasi pengendalian IDO kepada Komite Medik, Komite Mutu, dan Direktur.',
      ],
      zero: [
        'Melaksanakan audit kepatuhan kelengkapan pengisian formulir bundle IDO pada pasien operasi elektif maupun sito di IBS dan ruang nifas/bedah.',
        'Mengusulkan dan memastikan pemenuhan alat pencukur elektrik (surgical clipper) serta sabun mandi chlorhexidine pra-operasi secara kontinyu.',
        'Melanjutkan pemantauan luka pasca-operasi hingga 30 hari pasca-tindakan melalui koordinasi IPCLN ruang rawat inap dan poliklinik.',
        'Mendokumentasikan capaian 0% kejadian IDO pada laporan mutu PPI triwulanan/tahunan kepada Direktur UOBK RSUD Al-Mulk.',
      ],
    },
  };

  return {
    analisa,
    rekomendasi: isZero ? rekomByInd[params.indicator].zero : rekomByInd[params.indicator].active,
    tindakLanjut: isZero ? rtlByInd[params.indicator].zero : rtlByInd[params.indicator].active,
  };
}

/**
 * 3. Narrative generator for Hand Hygiene by Profession (Monthly, Quarterly, Semester, Annual)
 */
export function buildHandHygieneProfessionNarrative(params: {
  periodLabel: string;
  overallRate: number;
  professions: { name: string; rate: number; opp?: number; hh?: number }[];
  peakMonthDetail?: string;
}): OfficialChartNarrative {
  const { periodLabel, overallRate, professions, peakMonthDetail } = params;
  const target = 85;
  const sortedDesc = [...professions].sort((a, b) => b.rate - a.rate);
  const sortedAsc = [...professions].sort((a, b) => a.rate - b.rate);
  const highest = sortedDesc[0];
  const lowest = sortedAsc[0];
  const totalOpp = professions.reduce((s, p) => s + (p.opp || 0), 0);
  const totalHh = professions.reduce((s, p) => s + (p.hh || 0), 0);

  const profBreakdown = professions
    .map((p) => `${p.name} sebesar ${fmtIdNum(p.rate)}%`)
    .join(', ');
  const oppClause =
    totalOpp > 0
      ? ` dari total ${totalOpp} peluang (opportunities) dengan ${totalHh} tindakan patuh`
      : '';
  const peakClause = peakMonthDetail ? ` ${peakMonthDetail}` : '';

  const meetsTarget = overallRate >= target && professions.every((p) => p.rate >= target);

  const analisa = meetsTarget
    ? `Berdasarkan grafik hasil audit kepatuhan kebersihan tangan (Hand Hygiene) berdasarkan profesi di UOBK RSUD Al-Mulk Kota Sukabumi pada ${periodLabel}, rata-rata capaian rumah sakit mencapai ${fmtIdNum(overallRate)}%${oppClause} (${profBreakdown}), sehingga telah melampaui standar target Kementerian Kesehatan (≥ 85%).${peakClause} Capaian tertinggi diperoleh pada kelompok profesi ${highest?.name || '-'} (${fmtIdNum(highest?.rate || 0)}%). Hasil ini menunjukkan tingginya kesadaran dan budaya keselamatan pasien seluruh tenaga kesehatan dalam menerapkan 6 langkah kebersihan tangan pada 5 momen pelayanan.`
    : `Berdasarkan grafik hasil audit kepatuhan kebersihan tangan (Hand Hygiene) berdasarkan profesi di UOBK RSUD Al-Mulk Kota Sukabumi pada ${periodLabel}, rata-rata capaian rumah sakit berada pada angka ${fmtIdNum(overallRate)}%${oppClause}, dengan rincian ${profBreakdown}.${peakClause} Capaian tertinggi terdapat pada profesi ${highest?.name || '-'} (${fmtIdNum(highest?.rate || 0)}%) dan terendah pada profesi ${lowest?.name || '-'} (${fmtIdNum(lowest?.rate || 0)}%), di mana secara keseluruhan masih perlu ditingkatkan untuk mencapai standar baku mutu Kementerian Kesehatan yaitu ≥ 85%. Ketidaktercapaian target ini terutama dipengaruhi oleh belum konsistennya pelaksanaan cuci tangan pada Momen 1 (sebelum kontak dengan pasien) dan Momen 5 (setelah kontak dengan lingkungan sekitar pasien) saat jam pelayanan padat, serta perlunya jaminan kesinambungan pengisian ulang handrub dan tisu pengering di titik perawatan.`;

  const rekomendasi = meetsTarget
    ? [
        'Mempertahankan kepatuhan pelaksanaan 6 langkah kebersihan tangan pada seluruh 5 momen WHO oleh seluruh dokter, perawat, bidan, dan tenaga kesehatan penunjang.',
        'Menjaga ketersediaan cairan berbasis alkohol (handrub), sabun antiseptik (handwash), air mengalir, dan tisu pengering sekali pakai di seluruh titik pelayanan.',
        'Melanjutkan program duta/champion Hand Hygiene di setiap unit pelayanan sebagai teladan kepatuhan bagi staf baru maupun pengunjung.',
        'Mempertahankan pelaksanaan audit observasi langsung minimal 200 peluang per unit/periode secara objektif dan berkesinambungan.',
      ]
    : [
        `Meningkatkan edukasi, motivasi, dan pengingat langsung (reminder) penerapan 5 momen kebersihan tangan khususnya pada kelompok profesi ${lowest?.name || 'petugas kesehatan'} pada Momen 1 dan Momen 5.`,
        'Melakukan re-edukasi dan demonstrasi langsung teknik 6 langkah kebersihan tangan sesuai standar WHO baik menggunakan handrub (20–30 detik) maupun sabun dan air mengalir (40–60 detik).',
        'Memastikan ketersediaan fasilitas kebersihan tangan (botol handrub terisi penuh di setiap tempat tidur/troli tindakan, sabun cuci tangan, dan tisu pengering) tanpa putus stok.',
        'Mengoptimalkan peran aktif IPCLN dan Kepala Ruang dalam melakukan supervisi harian serta saling mengingatkan antar-rekan sejawat saat jam pelayanan sibuk.',
      ];

  const tindakLanjut = [
    'Melaksanakan audit observasi langsung kepatuhan Hand Hygiene secara berkala menggunakan aplikasi SMART PPI pada seluruh shift pelayanan.',
    'Melakukan inspeksi kelengkapan sarana wastafel, dispenser handsoap, tisu sekali pakai, serta pengisian ulang botol handrub bersama unit farmasi/rumah tangga.',
    'Menyelenggarakan sesi penyegaran (redemonstrasi 6 langkah dan 5 momen cuci tangan) pada saat operan jaga (handover) di ruang rawat inap dan poliklinik.',
    'Menyampaikan grafik umpan balik (feedback) capaian kepatuhan Hand Hygiene per profesi kepada masing-masing Kepala Unit, Komite Medik, Komite Keperawatan, dan Direktur.',
  ];

  return { analisa, rekomendasi, tindakLanjut };
}

/**
 * 4. Narrative generator for Multi-Month Hand Hygiene Trend (Semester / Annual)
 */
export function buildHandHygieneTrendNarrative(params: {
  periodLabel: string;
  monthly: { label: string; rate: number }[];
  overallRate: number;
  prevOverallRate?: number;
  prevYearLabel?: string;
}): OfficialChartNarrative {
  const { periodLabel, monthly, overallRate, prevOverallRate, prevYearLabel } = params;
  const target = 85;
  const sortedDesc = [...monthly].sort((a, b) => b.rate - a.rate);
  const sortedAsc = [...monthly].sort((a, b) => a.rate - b.rate);
  const highest = sortedDesc[0];
  const lowest = sortedAsc[0];

  const yoyClause =
    prevOverallRate !== undefined && prevYearLabel
      ? overallRate >= prevOverallRate
        ? ` Dibandingkan dengan rata-rata capaian ${prevYearLabel} sebesar ${fmtIdNum(prevOverallRate)}%, terlihat adanya tren peningkatan kepatuhan sebesar ${fmtIdNum(Number((overallRate - prevOverallRate).toFixed(1)))} poin persentase.`
        : ` Dibandingkan dengan rata-rata capaian ${prevYearLabel} sebesar ${fmtIdNum(prevOverallRate)}%, terdapat penurunan sebesar ${fmtIdNum(Number((prevOverallRate - overallRate).toFixed(1)))} poin persentase yang memerlukan penguatan supervisi.`
      : '';

  const meetsTarget = overallRate >= target;

  const analisa = meetsTarget
    ? `Berdasarkan grafik tren audit kepatuhan kebersihan tangan seluruh petugas di UOBK RSUD Al-Mulk Kota Sukabumi pada ${periodLabel}, rata-rata capaian mencapai ${fmtIdNum(overallRate)}% dengan capaian tertinggi pada bulan ${highest?.label || '-'} (${fmtIdNum(highest?.rate || 0)}%) dan terendah pada bulan ${lowest?.label || '-'} (${fmtIdNum(lowest?.rate || 0)}%), sehingga telah memenuhi standar Kementerian Kesehatan (≥ 85%).${yoyClause} Konsistensi capaian ini mencerminkan efektivitas program edukasi berkelanjutan, audit rutin IPCN/IPCLN, serta dukungan penyediaan fasilitas kebersihan tangan di area perawatan.`
    : `Berdasarkan grafik tren audit kepatuhan kebersihan tangan seluruh petugas di UOBK RSUD Al-Mulk Kota Sukabumi pada ${periodLabel}, rata-rata capaian berada pada angka ${fmtIdNum(overallRate)}% dengan nilai tertinggi pada bulan ${highest?.label || '-'} (${fmtIdNum(highest?.rate || 0)}%) dan terendah pada bulan ${lowest?.label || '-'} (${fmtIdNum(lowest?.rate || 0)}%), sehingga secara akumulatif masih berada di bawah target standar Kementerian Kesehatan yaitu ≥ 85%.${yoyClause} Fluktuasi capaian antar-bulan ini dipengaruhi oleh tingginya beban kerja pelayanan pada bulan tertentu, rotasi petugas baru yang belum seluruhnya mengikuti pelatihan PPI Dasar, serta ketersediaan tisu dan cairan handrub yang perlu dijaga kontinuitasnya di setiap titik perawatan.`;

  const rekomendasi = [
    'Meningkatkan edukasi dan sosialisasi berkala mengenai 6 langkah serta 5 momen kebersihan tangan kepada seluruh staf medis, keperawatan, penunjang, maupun karyawan baru.',
    'Memperkuat monitoring harian oleh IPCN dan IPCLN ruangan disertai koreksi serta edukasi langsung di tempat (on-the-spot coaching) apabila ditemukan ketidakpatuhan.',
    'Memastikan ketersediaan dan kemudahan akses fasilitas kebersihan tangan (handrub di setiap bed/pintu ruang rawat, sabun antiseptik, dan tisu pengering) secara kontinyu.',
    'Memasang dan memperbarui media pengingat visual (poster 5 momen & 6 langkah cuci tangan) di seluruh wastafel dan area tindakan klinis.',
  ];

  const tindakLanjut = [
    'Mengagendakan program In-House Training (IHT) dan orientasi wajib PPI Dasar bagi seluruh pegawai baru maupun staf unit pelayanan.',
    'Melaksanakan audit kepatuhan kebersihan tangan bulanan secara konsisten di seluruh unit dan memvalidasi ketersediaan logistik handrub setiap minggu.',
    'Memberikan umpan balik (feedback) bulanan hasil audit kepatuhan cuci tangan kepada seluruh kepala instalasi/ruangan pada rapat koordinasi mutu.',
    'Menindaklanjuti pemenuhan sarana prasarana kebersihan tangan bersama Bagian Umum dan Instalasi Farmasi untuk dilaporkan kepada Direktur.',
  ];

  return { analisa, rekomendasi, tindakLanjut };
}

/**
 * 5. Narrative generator for APD Compliance Chart (Monthly, Quarterly, Semester, Annual)
 */
export function buildApdNarrative(params: {
  periodLabel: string;
  overallRate: number;
  points: { label: string; rate: number }[];
  focusMonthLabel?: string;
  focusMonthRate?: number;
}): OfficialChartNarrative {
  const { periodLabel, overallRate, points, focusMonthLabel, focusMonthRate } = params;
  const activePts = points.filter((p) => p.rate !== null && p.rate !== undefined && !isNaN(p.rate));
  const sortedAsc = [...activePts].sort((a, b) => a.rate - b.rate);
  const perfectMonths = activePts.filter((p) => p.rate >= 100).map((p) => p.label);
  const lowest = sortedAsc[0];

  const headlineRate = focusMonthRate !== undefined ? focusMonthRate : overallRate;
  const headlineLabel = focusMonthLabel ? `pada bulan ${focusMonthLabel} mencapai ${fmtIdNum(headlineRate)}% (rata-rata periode ${fmtIdNum(overallRate)}%)` : `mencapai rata-rata ${fmtIdNum(overallRate)}%`;
  const meetsTarget = headlineRate >= 100 && overallRate >= 100;

  const perfectClause =
    perfectMonths.length > 0 && perfectMonths.length < activePts.length
      ? ` Capaian sempurna 100% berhasil diraih pada ${perfectMonths.join(', ')}, sedangkan capaian terendah tercatat pada ${lowest?.label || '-'} (${fmtIdNum(lowest?.rate || 0)}%).`
      : '';

  const analisa = meetsTarget
    ? `Berdasarkan grafik pemantauan audit kepatuhan penggunaan Alat Pelindung Diri (APD) di UOBK RSUD Al-Mulk Kota Sukabumi pada ${periodLabel}, tingkat kepatuhan petugas ${headlineLabel}, sehingga telah memenuhi 100% target standar baku mutu Kementerian Kesehatan. Hasil ini menunjukkan bahwa seluruh petugas pelayanan telah disiplin dan konsisten memilih, memakai (donning), serta melepas (doffing) APD sesuai indikasi risiko paparan cairan tubuh dan jenis transmisi penyakit.`
    : `Berdasarkan grafik pemantauan audit kepatuhan penggunaan Alat Pelindung Diri (APD) di UOBK RSUD Al-Mulk Kota Sukabumi pada ${periodLabel}, tingkat kepatuhan petugas ${headlineLabel}, sehingga masih belum sepenuhnya mencapai target standar Kementerian Kesehatan yaitu 100%.${perfectClause} Belum tercapainya target 100% ini disebabkan oleh masih ditemukannya ketidakpatuhan penggunaan APD lengkap sesuai indikasi risiko paparan (seperti penggunaan apron, goggle/pelindung wajah, atau masker N95 pada area berisiko), kelalaian pelepasan sarung tangan segera setelah tindakan pada jam sibuk pelayanan, serta keterbatasan kontinuitas stok APD tertentu di beberapa unit.`;

  const rekomendasi = [
    'Meningkatkan kepatuhan petugas dalam memilih dan menggunakan APD secara rasional dan tepat indikasi (masker, sarung tangan, gaun/apron, pelindung mata, dan penutup kepala) sesuai potensi paparan.',
    'Memastikan kedisiplinan urutan pemakaian (donning) dan pelepasan (doffing) APD yang benar serta segera melepas sarung tangan pasca-tindakan diikuti kebersihan tangan.',
    'Menjamin ketersediaan dan distribusi stok APD yang lengkap serta berkesinambungan di setiap ruang rawat inap, IGD, IBS, laboratorium, CSSD, dan instalasi gizi.',
    'Memfasilitasi pemasangan poster panduan pemakaian dan pelepasan APD sesuai kaidah PPI pada setiap ruang ganti/anteroom dan area tindakan.',
  ];

  const tindakLanjut = [
    'Melaksanakan audit observasi kepatuhan penggunaan APD secara rutin di seluruh unit pelayanan menggunakan instrumen audit digital SMART PPI.',
    'Melakukan pengecekan stok buffer APD bersama Instalasi Farmasi dan Kepala Ruang agar tidak terjadi kekosongan APD pada shift malam maupun akhir pekan.',
    'Menyelenggarakan demonstrasi ulang urutan pemakaian (donning) dan pelepasan (doffing) APD yang aman guna mencegah kontaminasi silang pada petugas.',
    'Menyampaikan evaluasi capaian kepatuhan APD kepada Kepala Unit terkait dan melaporkan rekapitulasi tindak lanjut kepada Direktur serta Komite Mutu.',
  ];

  return { analisa, rekomendasi, tindakLanjut };
}

/**
 * 6. Narrative generator for Annual IPAL Output Table
 */
export function buildIpalNarrative(year: number): OfficialChartNarrative {
  return {
    analisa: `Berdasarkan hasil pemantauan dan pengujian laboratorium terhadap parameter fisika, kimia, dan mikrobiologi outlet IPAL di UOBK RSUD Al-Mulk Kota Sukabumi sepanjang periode tahun ${year}, secara umum sistem pengolahan limbah cair berfungsi secara efektif dan terkendali. Konsentrasi parameter kunci pada outlet seperti BOD (6–28 mg/L), COD (20–83 mg/L), dan TSS (<5–15 mg/L) seluruhnya berada di bawah ambang batas baku mutu maksimal yang ditetapkan (BOD ≤ 30 mg/L, COD ≤ 100 mg/L, TSS ≤ 30 mg/L sesuai Permen LHK No. 68 Tahun 2016). Nilai derajat keasaman (pH) outlet sebagian besar berada pada rentang netral 6,0–9,0, namun pada beberapa bulan teridentifikasi fluktuasi pH asam dan lonjakan Total Coliform (> 3.000 MPN/100 ml) yang dipicu oleh variasi beban limbah cair domestik/medis serta perlunya optimalisasi dosis klorinasi pada bak desinfeksi akhir.`,
    rekomendasi: [
      'Melakukan perawatan berkala (preventive maintenance) terhadap mesin blower aerasi, pompa transfer limbah, dan dosing pump klorinasi secara terjadwal guna menjaga stabilitas efisiensi pengolahan.',
      'Mengoptimalkan pemantauan harian derajat keasaman (pH) dan residu klor bebas pada bak outlet agar parameter kimia serta mikrobiologi Total Coliform konsisten memenuhi baku mutu.',
      'Melakukan pengurasan dan pengelolaan lumpur aktif (sludge removal) pada bak sedimentasi secara periodik guna mencegah akumulasi endapan padatan.',
      'Melanjutkan kerja sama pengujian sampel efluen IPAL setiap bulan secara konsisten dengan laboratorium lingkungan eksternal yang terakreditasi KAN.',
    ],
    tindakLanjut: [
      'Melakukan pengecekan harian logbook operasional IPAL (debit harian, pH meter, fungsi blower aerasi, dan ketersediaan tablet/cairan klorin) oleh petugas kesehatan lingkungan.',
      'Melaksanakan penyesuaian dosis desinfektan klorin dan uji petik ulang (resampling) apabila ditemukan hasil laboratorium Total Coliform > 3.000 MPN/100 ml atau pH di luar rentang 6,0–9,0.',
      'Mengagendakan pemeliharaan mekanikal-elektrikal unit IPAL bersama IPSRS setiap triwulan.',
      'Mendokumentasikan sertifikat hasil uji laboratorium limbah cair bulanan dan melaporkannya kepada Direktur serta Dinas Lingkungan Hidup Kota Sukabumi.',
    ],
  };
}

/**
 * Converts an OfficialChartNarrative into atomic ElementFlowBlock[] styled identically
 * to the official hospital standard (bold underlined headings "Analisa :", "Rekomendasi :",
 * "Rencana Tindak Lanjut :", indented justified analysis paragraph, and numbered items 1..4)
 * so AutoPaginatedF4Document fills pages cleanly up to 1 line before the 2.5cm bottom margin
 * without cutting text or leaving large blank gaps.
 */
export function narrativeToFlowBlocks(
  keyPrefix: string,
  narrative: OfficialChartNarrative
): ElementFlowBlock[] {
  const blocks: ElementFlowBlock[] = [];

  // 1. Analisa block (heading + justified indented paragraph)
  blocks.push({
    type: 'element',
    key: `${keyPrefix}-analisa`,
    gapAfter: 10,
    node: (
      <div className="w-full text-[12pt] leading-[1.5] text-justify text-black">
        <p className="font-bold underline mb-1">Analisa :</p>
        <p className="indent-8 text-justify">{narrative.analisa}</p>
      </div>
    ),
  });

  // 2. Rekomendasi heading (keepWithNext ensures heading never sits alone at bottom of page)
  if (narrative.rekomendasi.length > 0) {
    blocks.push({
      type: 'element',
      key: `${keyPrefix}-rekom-heading`,
      keepWithNext: true,
      gapAfter: 4,
      node: (
        <p className="font-bold underline text-[12pt] leading-[1.5] text-black">
          Rekomendasi :
        </p>
      ),
    });

    narrative.rekomendasi.forEach((item, idx) => {
      const isLast = idx === narrative.rekomendasi.length - 1;
      blocks.push({
        type: 'element',
        key: `${keyPrefix}-rekom-item-${idx + 1}`,
        gapAfter: isLast ? 10 : 4,
        node: (
          <div className="flex items-start gap-2 text-[12pt] leading-[1.5] text-justify text-black">
            <span className="w-5 flex-shrink-0 font-bold">{idx + 1}.</span>
            <span className="flex-1 text-justify">{item}</span>
          </div>
        ),
      });
    });
  }

  // 3. Rencana Tindak Lanjut heading (keepWithNext ensures heading never sits alone at bottom of page)
  if (narrative.tindakLanjut.length > 0) {
    blocks.push({
      type: 'element',
      key: `${keyPrefix}-rtl-heading`,
      keepWithNext: true,
      gapAfter: 4,
      node: (
        <p className="font-bold underline text-[12pt] leading-[1.5] text-black">
          Rencana Tindak Lanjut :
        </p>
      ),
    });

    narrative.tindakLanjut.forEach((item, idx) => {
      const isLast = idx === narrative.tindakLanjut.length - 1;
      blocks.push({
        type: 'element',
        key: `${keyPrefix}-rtl-item-${idx + 1}`,
        gapAfter: isLast ? 14 : 4,
        node: (
          <div className="flex items-start gap-2 text-[12pt] leading-[1.5] text-justify text-black">
            <span className="w-5 flex-shrink-0 font-bold">{idx + 1}.</span>
            <span className="flex-1 text-justify">{item}</span>
          </div>
        ),
      });
    });
  }

  return blocks;
}

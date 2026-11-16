import { format, parseISO, eachDayOfInterval, isValid } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export type KlbStatus = 'Investigasi Aktif' | 'Terkendali / Pemantauan' | 'Selesai (Closed)';
export type SubjectCategory = 'Pasien' | 'Petugas / Staf';
export type CaseOutcome = 'Dalam Perawatan' | 'Diisolasi' | 'Sembuh' | 'Dirujuk' | 'Meninggal';

export interface KlbChecklistItem {
  id: string;
  step: number;
  label: string;
  done: boolean;
  note?: string;
}

export interface KlbEventItem {
  id: string;
  created_at?: string;
  nomor_klb: string;
  judul_kejadian: string;
  jenis_agen: string;
  unit_terdampak: string;
  tanggal_terdeteksi: string;
  tanggal_berakhir?: string;
  populasi_berisiko: number;
  status_klb: KlbStatus;
  lapor_w1_dinkes: boolean;
  kronologi_ringkas: string;
  hasil_lab_swab: string;
  checklist_intervensi: KlbChecklistItem[];
  kesimpulan_rekomendasi: string;
  foto_dokumentasi: string[];
  nama_ipcn: string;
  nama_ketua_ppi: string;
  nama_direktur: string;
  ttd_ipcn?: string | null;
}

export interface KlbCaseItem {
  id: string;
  created_at?: string;
  klb_id: string;
  nama_inisial: string;
  no_rm_nip: string;
  kategori_subjek: SubjectCategory;
  usia_kelamin: string;
  lokasi_bed: string;
  tanggal_onset: string;
  gejala_utama: string;
  hasil_lab: string;
  status_akhir: CaseOutcome;
}

export interface EpiCurvePoint {
  date: string;
  label: string;
  pasien: number;
  staf: number;
  total: number;
}

export interface HaisClusterAlert {
  key: string;
  unit: string;
  indikator: string;
  totalCases: number;
  latestDate: string;
}

export const KLB_AGENT_TYPES = [
  'Klaster Phlebitis / IADP',
  'Klaster Infeksi Daerah Operasi (IDO)',
  'Klaster ISK / CAUTI',
  'Klaster VAP / Pneumonia Nosokomial',
  'Diare Akut / Gastroenteritis',
  'MDRO / MRSA / ESBL',
  'Scabies (Skabies)',
  'Varicella / Campak / Infeksi Ruam',
  'TB / Infeksi Saluran Napas Akut (Airborne)',
  'Lainnya / Agen Belum Teridentifikasi',
];

export const KLB_CASE_OUTCOMES: CaseOutcome[] = [
  'Dalam Perawatan',
  'Diisolasi',
  'Sembuh',
  'Dirujuk',
  'Meninggal',
];

export const DEFAULT_KLB_INTERVENTION_STEPS: Array<{ id: string; step: number; label: string }> = [
  {
    id: 'klb-step-1',
    step: 1,
    label: 'Verifikasi diagnosis klinis & definisi kasus operasional bersama Dokter Penanggung Jawab (DPJP) dan IPCD.',
  },
  {
    id: 'klb-step-2',
    step: 2,
    label: 'Pengambilan spesimen klinis pasien/staf, kultur mikrobiologi, atau swab lingkungan/alat medis terkait.',
  },
  {
    id: 'klb-step-3',
    step: 3,
    label: 'Penerapan kewaspadaan isolasi & kohorting pasien terdampak serta pembatasan mobilisasi/kunjungan ruangan.',
  },
  {
    id: 'klb-step-4',
    step: 4,
    label: 'Penghentian sementara penggunaan alat, cairan infus batch tertentu, atau prosedur berisiko sumber paparan.',
  },
  {
    id: 'klb-step-5',
    step: 5,
    label: 'Pelacakan kontak erat (Contact Tracing) terhadap pasien sekamar dan petugas pemberi asuhan.',
  },
  {
    id: 'klb-step-6',
    step: 6,
    label: 'Pembersihan & disinfeksi lingkungan menyeluruh (Terminal Cleaning) pada zona terdampak dan peralatan.',
  },
  {
    id: 'klb-step-7',
    step: 7,
    label: 'Penguatan kepatuhan Hand Hygiene 5 momen, penggunaan APD sesuai transmisi, dan teknik aseptik staf ruangan.',
  },
  {
    id: 'klb-step-8',
    step: 8,
    label: 'Pelaporan kejadian awal (W1 / 1×24 jam) kepada Direktur RS dan Dinas Kesehatan Kota Sukabumi (bila berpotensi wabah).',
  },
  {
    id: 'klb-step-9',
    step: 9,
    label: 'Pemantauan harian kasus baru selama minimal 2× masa inkubasi terpanjang untuk memantau kurva epidemiologi.',
  },
  {
    id: 'klb-step-10',
    step: 10,
    label: 'Penyusunan laporan akhir penutupan KLB (Closed) dan rekomendasi pencegahan berulang ke Direktur & Komite Mutu.',
  },
];

export function buildDefaultKlbChecklist(): KlbChecklistItem[] {
  return DEFAULT_KLB_INTERVENTION_STEPS.map((s) => ({
    ...s,
    done: false,
    note: '',
  }));
}

export function normalizeKlbChecklist(raw: any): KlbChecklistItem[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((it, idx) => ({
      id: String(it?.id || `klb-step-${idx + 1}`),
      step: Number(it?.step) || idx + 1,
      label: String(it?.label || DEFAULT_KLB_INTERVENTION_STEPS[idx]?.label || ''),
      done: Boolean(it?.done),
      note: String(it?.note || ''),
    }));
  }
  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeKlbChecklist(parsed);
      }
    } catch {}
  }
  return buildDefaultKlbChecklist();
}

export function calculateAttackRate(casesCount: number, populasiBerisiko: number): {
  percent: number;
  formatted: string;
} {
  const c = Math.max(0, Number(casesCount) || 0);
  const pop = Math.max(0, Number(populasiBerisiko) || 0);
  if (pop <= 0) {
    return { percent: 0, formatted: '0,0%' };
  }
  const pct = (c / pop) * 100;
  return {
    percent: Number(pct.toFixed(1)),
    formatted: `${pct.toFixed(1).replace('.', ',')}%`,
  };
}

/**
 * Membangun data Kurva Epidemiologi (Epi-Curve) kronologis per tanggal onset,
 * termasuk mengisi hari-hari tanpa kasus di antara tanggal onset awal & akhir
 * agar distribusi puncak wabah terlihat akurat sesuai kaidah epidemiologi.
 */
export function buildEpiCurveData(cases: KlbCaseItem[]): EpiCurvePoint[] {
  const validDatedCases = cases
    .map((c) => {
      try {
        const dt = parseISO(c.tanggal_onset);
        return isValid(dt) ? { ...c, dt } : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Array<KlbCaseItem & { dt: Date }>;

  if (validDatedCases.length === 0) return [];

  validDatedCases.sort((a, b) => a.dt.getTime() - b.dt.getTime());
  const minDate = validDatedCases[0].dt;
  const maxDate = validDatedCases[validDatedCases.length - 1].dt;

  // Safeguard max span (up to 90 days) to prevent gigantic arrays from typo dates
  const diffDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  const countsMap = new Map<string, { pasien: number; staf: number }>();

  validDatedCases.forEach((c) => {
    const key = format(c.dt, 'yyyy-MM-dd');
    const cur = countsMap.get(key) || { pasien: 0, staf: 0 };
    if (c.kategori_subjek === 'Petugas / Staf') {
      cur.staf += 1;
    } else {
      cur.pasien += 1;
    }
    countsMap.set(key, cur);
  });

  if (diffDays <= 60) {
    const days = eachDayOfInterval({ start: minDate, end: maxDate });
    return days.map((d) => {
      const key = format(d, 'yyyy-MM-dd');
      const cnt = countsMap.get(key) || { pasien: 0, staf: 0 };
      return {
        date: key,
        label: format(d, 'dd MMM', { locale: idLocale }),
        pasien: cnt.pasien,
        staf: cnt.staf,
        total: cnt.pasien + cnt.staf,
      };
    });
  }

  return Array.from(countsMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, cnt]) => ({
      date: key,
      label: format(parseISO(key), 'dd MMM yy', { locale: idLocale }),
      pasien: cnt.pasien,
      staf: cnt.staf,
      total: cnt.pasien + cnt.staf,
    }));
}

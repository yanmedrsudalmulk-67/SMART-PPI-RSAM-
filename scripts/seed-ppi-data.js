const sqlite3 = require('sqlite3').verbose();
const { randomUUID } = require('crypto');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'smart_ppi.db');
const db = new sqlite3.Database(dbPath);

const UNITS = [
  'Ranap Aisyah',
  'Ranap Fatimah',
  'Ranap Usman',
  'Ranap Khadijah',
  'ICU',
  'IGD',
  'Laboratorium',
  'Radiologi',
  'Pantry'
];

const OBSERVER = 'IPCN_Adi Tresa Purnama';

// APD Tindakan catalog with realistic APD requirements
const APD_TINDAKAN_CATALOG = [
  {
    tindakan: 'Pemasangan Infus',
    profesi: 'Perawat',
    units: ['Ranap Aisyah', 'Ranap Fatimah', 'Ranap Usman', 'Ranap Khadijah', 'ICU', 'IGD'],
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 2, patuh: 2
  },
  {
    tindakan: 'Pemberian Obat Injeksi',
    profesi: 'Perawat',
    units: ['Ranap Aisyah', 'Ranap Fatimah', 'Ranap Usman', 'Ranap Khadijah', 'ICU', 'IGD'],
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 2, patuh: 2
  },
  {
    tindakan: 'Perawatan Luka / Ganti Verban',
    profesi: 'Perawat',
    units: ['Ranap Aisyah', 'Ranap Fatimah', 'Ranap Usman', 'IGD'],
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 2, patuh: 2
  },
  {
    tindakan: 'Pengambilan Sampel Darah Vena',
    profesi: 'Perawat',
    units: ['Ranap Aisyah', 'Ranap Fatimah', 'Ranap Usman', 'IGD', 'ICU'],
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 2, patuh: 2
  },
  {
    tindakan: 'Pemasangan Kateter Urine',
    profesi: 'Perawat',
    units: ['Ranap Aisyah', 'Ranap Fatimah', 'Ranap Usman', 'ICU', 'IGD'],
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 2, patuh: 2
  },
  {
    tindakan: 'Melakukan Aff Infus',
    profesi: 'Perawat',
    units: ['Ranap Aisyah', 'Ranap Fatimah', 'Ranap Usman', 'Ranap Khadijah'],
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 2, patuh: 2
  },
  {
    tindakan: 'Mengukur TTV',
    profesi: 'Perawat',
    units: ['Ranap Aisyah', 'Ranap Fatimah', 'Ranap Usman', 'Ranap Khadijah', 'ICU'],
    masker: 'ya', sarung_tangan: 'na', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 1, patuh: 1
  },
  {
    tindakan: 'Pemberian Oksigenasi',
    profesi: 'Perawat',
    units: ['Ranap Aisyah', 'Ranap Fatimah', 'ICU', 'IGD'],
    masker: 'ya', sarung_tangan: 'na', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 1, patuh: 1
  },
  {
    tindakan: 'Pengisapan Lendir (Suction)',
    profesi: 'Perawat',
    units: ['ICU', 'IGD'],
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'ya', goggle: 'ya', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 4, patuh: 4
  },
  {
    tindakan: 'Pemeriksaan EKG',
    profesi: 'Perawat',
    units: ['IGD', 'ICU', 'Ranap Fatimah'],
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 2, patuh: 2
  },
  {
    tindakan: 'Visite Dokter',
    profesi: 'Dokter Spesialis',
    units: ['Ranap Aisyah', 'Ranap Fatimah', 'Ranap Usman', 'ICU'],
    masker: 'ya', sarung_tangan: 'na', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 1, patuh: 1
  },
  {
    tindakan: 'Pemeriksaan Pasien',
    profesi: 'Dokter Umum',
    units: ['IGD', 'Ranap Fatimah'],
    masker: 'ya', sarung_tangan: 'na', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 1, patuh: 1
  },
  {
    tindakan: 'Hecting Luka / Penjahitan Luka',
    profesi: 'Dokter Umum',
    units: ['IGD'],
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'ya', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 3, patuh: 3
  },
  {
    tindakan: 'Mengukur DJJ',
    profesi: 'Bidan',
    units: ['Ranap Khadijah'],
    masker: 'ya', sarung_tangan: 'na', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 1, patuh: 1
  },
  {
    tindakan: 'Menolong Persalinan',
    profesi: 'Bidan',
    units: ['Ranap Khadijah'],
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'ya', apron: 'ya', goggle: 'ya', sepatu_boot: 'ya', gaun_pelindung: 'ya',
    dinilai: 7, patuh: 7
  },
  {
    tindakan: 'Pemeriksaan sampling darah',
    profesi: 'Analis Laboratorium',
    units: ['Laboratorium'],
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'ya',
    dinilai: 3, patuh: 3
  },
  {
    tindakan: 'Pemeriksaan Rontgen',
    profesi: 'Radiografer',
    units: ['Radiologi'],
    masker: 'ya', sarung_tangan: 'na', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 1, patuh: 1
  },
  {
    tindakan: 'Pemorsian makanan pasien',
    profesi: 'Pramusaji',
    units: ['Pantry'],
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'ya', apron: 'ya', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 4, patuh: 4
  },
  {
    tindakan: 'Menyiapkan makanan',
    profesi: 'Pramusaji',
    units: ['Pantry'],
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'ya', apron: 'ya', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 4, patuh: 4
  }
];

// Helper to generate ISO time
function makeIso(year, monthIndex, day, hour, min, sec = 0) {
  const d = new Date(Date.UTC(year, monthIndex, day, hour, min, sec));
  return d.toISOString();
}

// Generate HH Moments based on desired compliance
function makeHhMoments(patuh, peluang) {
  // Moments m1 to m5. peluang is between 1 and 5.
  // We want exactly 'patuh' to be 'hr' or 'hw', 'peluang - patuh' to be 'miss', and the rest (5 - peluang) to be 'na'.
  const moments = [];
  for (let i = 0; i < patuh; i++) {
    moments.push(Math.random() > 0.25 ? 'hr' : 'hw');
  }
  for (let i = 0; i < (peluang - patuh); i++) {
    moments.push('miss');
  }
  while (moments.length < 5) {
    moments.push('na');
  }
  // Shuffle moments
  for (let i = moments.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [moments[i], moments[j]] = [moments[j], moments[i]];
  }
  return {
    m1: moments[0],
    m2: moments[1],
    m3: moments[2],
    m4: moments[3],
    m5: moments[4]
  };
}

// Monthly targets from Gambar 1 (Hand Hygiene)
const HH_MONTHLY_TARGETS = [
  // Jan (index 0)
  { month: 0, perawat: { opp: 231, hh: 165 }, dokter: { opp: 33, hh: 27 }, nakes: { opp: 83, hh: 60 } },
  // Feb (index 1)
  { month: 1, perawat: { opp: 260, hh: 188 }, dokter: { opp: 33, hh: 25 }, nakes: { opp: 59, hh: 40 } },
  // Mar (index 2)
  { month: 2, perawat: { opp: 240, hh: 195 }, dokter: { opp: 36, hh: 29 }, nakes: { opp: 55, hh: 42 } },
  // Apr (index 3)
  { month: 3, perawat: { opp: 250, hh: 187 }, dokter: { opp: 42, hh: 33 }, nakes: { opp: 58, hh: 45 } },
  // Mei (index 4)
  { month: 4, perawat: { opp: 270, hh: 212 }, dokter: { opp: 48, hh: 39 }, nakes: { opp: 61, hh: 49 } },
  // Jun (index 5)
  { month: 5, perawat: { opp: 305, hh: 229 }, dokter: { opp: 48, hh: 38 }, nakes: { opp: 58, hh: 47 } },
  // Jul (index 6)
  { month: 6, perawat: { opp: 385, hh: 308 }, dokter: { opp: 60, hh: 49 }, nakes: { opp: 78, hh: 62 } },
  // Agu (index 7)
  { month: 7, perawat: { opp: 305, hh: 251 }, dokter: { opp: 48, hh: 40 }, nakes: { opp: 68, hh: 55 } },
];

// APD Monthly target percentages from Gambar 2
const APD_MONTHLY_TARGETS = [
  { month: 0, targetPct: 98 }, // Jan
  { month: 1, targetPct: 98 }, // Feb
  { month: 2, targetPct: 100 }, // Mar
  { month: 3, targetPct: 97 }, // Apr
  { month: 4, targetPct: 100 }, // Mei
  { month: 5, targetPct: 98 }, // Jun
  { month: 6, targetPct: 100 }, // Jul
  { month: 7, targetPct: 100 }, // Agu
];

// Standard audit dates (spaced 2-3 days)
const AUDIT_DAYS_28 = [2, 5, 8, 11, 14, 17, 20, 23, 26, 28];
const AUDIT_DAYS_30 = [2, 5, 8, 11, 14, 17, 20, 23, 26, 28, 30];
const AUDIT_DAYS_31 = [2, 5, 8, 11, 14, 17, 20, 23, 26, 28, 31];

function getAuditDays(monthIndex) {
  if (monthIndex === 1) return AUDIT_DAYS_28;
  if ([3, 5, 8, 10].includes(monthIndex)) return AUDIT_DAYS_30;
  return AUDIT_DAYS_31;
}

// Distribute opportunities into discrete sessions (e.g., 3-5 opp per session)
function breakIntoSessions(totalOpp, totalHh, numSessions) {
  const sessions = [];
  let remainingOpp = totalOpp;
  let remainingHh = totalHh;

  for (let i = 0; i < numSessions; i++) {
    const isLast = i === numSessions - 1;
    let opp;
    if (isLast) {
      opp = remainingOpp;
    } else {
      const avg = remainingOpp / (numSessions - i);
      opp = Math.max(1, Math.min(5, Math.round(avg + (Math.random() * 2 - 1))));
      if (remainingOpp - opp < (numSessions - i - 1)) {
        opp = remainingOpp - (numSessions - i - 1);
      }
    }

    let hh;
    if (isLast) {
      hh = remainingHh;
    } else {
      const targetRatio = totalHh / totalOpp;
      hh = Math.round(opp * targetRatio);
      if (hh > opp) hh = opp;
      if (hh < 0) hh = 0;
      if (remainingHh - hh > (remainingOpp - opp)) {
        hh = opp;
      }
      if (remainingHh - hh < 0) {
        hh = remainingHh;
      }
    }

    remainingOpp -= opp;
    remainingHh -= hh;
    sessions.push({ opp, hh });
  }

  return sessions;
}

db.serialize(async () => {
  console.log('--- STARTING PPI DATA SEEDING ---');

  // 1. Clean Jan-Aug records
  console.log('1. Cleaning test records for Jan-Aug 2026...');
  db.run("DELETE FROM audit_hand_hygiene WHERE start_time >= '2026-01-01' AND start_time < '2026-09-01'");
  db.run("DELETE FROM audit_apd WHERE tanggal_waktu >= '2026-01-01' AND tanggal_waktu < '2026-09-01'");

  // 2. Insert Hand Hygiene Jan-Aug
  console.log('2. Inserting Hand Hygiene Jan-Aug 2026 (exact Gambar 1)...');
  const hhInsert = db.prepare(`
    INSERT INTO audit_hand_hygiene (
      id, created_at, start_time, end_time, observer, unit, profesi,
      m1, m2, m3, m4, m5, patuh, peluang, persentase
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const cfg of HH_MONTHLY_TARGETS) {
    const monthIndex = cfg.month;
    const days = getAuditDays(monthIndex);

    // Number of sessions for Perawat (~60-80), Dokter (~10-15), Nakes (~15-20)
    const perawatSessions = breakIntoSessions(cfg.perawat.opp, cfg.perawat.hh, Math.round(cfg.perawat.opp / 4));
    const dokterSessions = breakIntoSessions(cfg.dokter.opp, cfg.dokter.hh, Math.round(cfg.dokter.opp / 3.2));
    const nakesSessions = breakIntoSessions(cfg.nakes.opp, cfg.nakes.hh, Math.round(cfg.nakes.opp / 3.8));

    const allSessions = [];

    perawatSessions.forEach((s, idx) => {
      const unit = ['Ranap Aisyah', 'Ranap Fatimah', 'Ranap Usman', 'Ranap Khadijah', 'ICU', 'IGD'][idx % 6];
      const profesi = unit === 'Ranap Khadijah' ? 'Bidan' : 'Perawat';
      allSessions.push({ ...s, unit, profesi });
    });

    dokterSessions.forEach((s, idx) => {
      const unit = ['Ranap Aisyah', 'Ranap Fatimah', 'Ranap Usman', 'ICU', 'IGD'][idx % 5];
      const profesi = idx % 2 === 0 ? 'Dokter Umum' : 'Dokter Spesialis';
      allSessions.push({ ...s, unit, profesi });
    });

    nakesSessions.forEach((s, idx) => {
      const unit = ['Laboratorium', 'Radiologi', 'Pantry'][idx % 3];
      let profesi = 'Analis Laboratorium';
      if (unit === 'Radiologi') profesi = 'Radiografer';
      if (unit === 'Pantry') profesi = 'Pramusaji';
      allSessions.push({ ...s, unit, profesi });
    });

    // Shuffle all sessions in this month
    for (let i = allSessions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allSessions[i], allSessions[j]] = [allSessions[j], allSessions[i]];
    }

    // Insert each session
    allSessions.forEach((s, idx) => {
      const day = days[idx % days.length];
      const hour = 8 + (idx % 7); // 08:00 to 15:00
      const minute = (idx * 11) % 60;
      const startIso = makeIso(2026, monthIndex, day, hour, minute);
      const endIso = makeIso(2026, monthIndex, day, hour, Math.min(59, minute + 15));
      const createdIso = makeIso(2026, monthIndex, day, hour, Math.min(59, minute + 20));
      const pct = Math.round((s.hh / s.opp) * 100);
      const m = makeHhMoments(s.hh, s.opp);
      const id = randomUUID();

      hhInsert.run(
        id, createdIso, startIso, endIso, OBSERVER, s.unit, s.profesi,
        m.m1, m.m2, m.m3, m.m4, m.m5, String(s.hh), String(s.opp), String(pct)
      );
    });
  }
  hhInsert.finalize();

  // 3. Insert APD Jan-Aug
  console.log('3. Inserting APD Jan-Aug 2026 (exact Gambar 2)...');
  const apdInsert = db.prepare(`
    INSERT INTO audit_apd (
      id, created_at, tanggal_waktu, observer, unit, profesi, tindakan,
      masker, sarung_tangan, penutup_kepala, apron, goggle, sepatu_boot, gaun_pelindung,
      jumlah_dinilai, jumlah_patuh, persentase, status_kepatuhan, dokumentasi
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
  `);

  for (const cfg of APD_MONTHLY_TARGETS) {
    const monthIndex = cfg.month;
    const days = getAuditDays(monthIndex);
    const totalAudits = 95; // realistic volume comparable to September's 98
    const numNonCompliant = cfg.targetPct === 100 ? 0 : (cfg.targetPct === 98 ? 2 : 3); // 98% -> 2/95 non-compliant (~97.9%), 97% -> 3/95 (~96.8%)

    for (let i = 0; i < totalAudits; i++) {
      const template = APD_TINDAKAN_CATALOG[i % APD_TINDAKAN_CATALOG.length];
      const unit = template.units[i % template.units.length];
      const day = days[i % days.length];
      const hour = 8 + (i % 7);
      const minute = (i * 13) % 60;
      const tanggalWaktu = makeIso(2026, monthIndex, day, hour, minute);
      const createdIso = makeIso(2026, monthIndex, day, hour, Math.min(59, minute + 5));

      const isNonCompliant = i < numNonCompliant;
      let masker = template.masker;
      let sarung_tangan = template.sarung_tangan;
      let patuh = template.patuh;
      let dinilai = template.dinilai;

      if (isNonCompliant) {
        if (sarung_tangan === 'ya') {
          sarung_tangan = 'tidak';
          patuh -= 1;
        } else if (masker === 'ya') {
          masker = 'tidak';
          patuh -= 1;
        }
      }

      const pct = Math.round((patuh / dinilai) * 100);
      const status = pct === 100 ? 'Patuh' : 'Tidak Patuh';
      const id = randomUUID();

      apdInsert.run(
        id, createdIso, tanggalWaktu, OBSERVER, unit, template.profesi, template.tindakan,
        masker, sarung_tangan, template.penutup_kepala, template.apron,
        template.goggle, template.sepatu_boot, template.gaun_pelindung,
        String(dinilai), String(patuh), String(pct), status
      );
    }
  }
  apdInsert.finalize();

  // 4. Fill October 2026 Hand Hygiene
  console.log('4. Completing October 2026 Hand Hygiene (+1% increase over Sept)...');
  // September was 80.68%. Oct target: ~81.7%.
  // Currently Oct has 46 records: 164 patuh, 201 peluang (81.59%).
  // We will add 54 records (bringing total to 100 records).
  // Total target opp: 441. Remaining opp: 240.
  // Target patuh: 441 * 0.817 = 360. Remaining patuh: 360 - 164 = 196.
  // 196 / 240 = 81.67%.
  const octHhSessions = breakIntoSessions(240, 196, 54);
  const octAuditDays = [2, 6, 9, 12, 15, 18, 20, 22, 24, 27, 29, 31]; // filling gaps
  const hhOctInsert = db.prepare(`
    INSERT INTO audit_hand_hygiene (
      id, created_at, start_time, end_time, observer, unit, profesi,
      m1, m2, m3, m4, m5, patuh, peluang, persentase
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  octHhSessions.forEach((s, idx) => {
    const unit = UNITS[idx % UNITS.length];
    let profesi = 'Perawat';
    if (unit === 'Laboratorium') profesi = 'Analis Laboratorium';
    else if (unit === 'Radiologi') profesi = 'Radiografer';
    else if (unit === 'Pantry') profesi = 'Pramusaji';
    else if (unit === 'Ranap Khadijah') profesi = 'Bidan';
    else if (idx % 4 === 0) profesi = 'Dokter Spesialis';
    else if (idx % 4 === 1) profesi = 'Dokter Umum';

    const day = octAuditDays[idx % octAuditDays.length];
    const hour = 8 + (idx % 8);
    const minute = (idx * 17) % 60;
    const startIso = makeIso(2026, 9, day, hour, minute); // Month 9 is October (0-indexed)
    const endIso = makeIso(2026, 9, day, hour, Math.min(59, minute + 15));
    const createdIso = makeIso(2026, 9, day, hour, Math.min(59, minute + 20));
    const pct = Math.round((s.hh / s.opp) * 100);
    const m = makeHhMoments(s.hh, s.opp);
    const id = randomUUID();

    hhOctInsert.run(
      id, createdIso, startIso, endIso, OBSERVER, unit, profesi,
      m.m1, m.m2, m.m3, m.m4, m.m5, String(s.hh), String(s.opp), String(pct)
    );
  });
  hhOctInsert.finalize();

  // 5. Fill October 2026 APD
  console.log('5. Completing October 2026 APD (+1% increase over Sept -> 100%)...');
  // Currently Oct has 2 records. We add 96 records (bringing total to 98 records, matching September).
  const apdOctInsert = db.prepare(`
    INSERT INTO audit_apd (
      id, created_at, tanggal_waktu, observer, unit, profesi, tindakan,
      masker, sarung_tangan, penutup_kepala, apron, goggle, sepatu_boot, gaun_pelindung,
      jumlah_dinilai, jumlah_patuh, persentase, status_kepatuhan, dokumentasi
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
  `);

  for (let i = 0; i < 96; i++) {
    const template = APD_TINDAKAN_CATALOG[i % APD_TINDAKAN_CATALOG.length];
    const unit = template.units[i % template.units.length];
    const day = octAuditDays[i % octAuditDays.length];
    const hour = 8 + (i % 8);
    const minute = (i * 19) % 60;
    const tanggalWaktu = makeIso(2026, 9, day, hour, minute);
    const createdIso = makeIso(2026, 9, day, hour, Math.min(59, minute + 5));

    const id = randomUUID();
    apdOctInsert.run(
      id, createdIso, tanggalWaktu, OBSERVER, unit, template.profesi, template.tindakan,
      template.masker, template.sarung_tangan, template.penutup_kepala, template.apron,
      template.goggle, template.sepatu_boot, template.gaun_pelindung,
      String(template.dinilai), String(template.patuh), '100', 'Patuh'
    );
  }
  apdOctInsert.finalize();

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
});

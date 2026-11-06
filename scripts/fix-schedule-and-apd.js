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

// APD Catalog
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

function getAppropriateTindakan(unit, profesi) {
  const matches = APD_TINDAKAN_CATALOG.filter(t => {
    const profMatch = t.profesi.toLowerCase().includes((profesi||'').toLowerCase()) || 
                      (profesi||'').toLowerCase().includes(t.profesi.toLowerCase()) ||
                      ((profesi||'').includes('Dokter') && t.profesi.includes('Dokter'));
    return profMatch && t.units.includes(unit);
  });
  if (matches.length > 0) {
    return matches[Math.floor(Math.random() * matches.length)];
  }
  const unitMatches = APD_TINDAKAN_CATALOG.filter(t => t.units.includes(unit));
  if (unitMatches.length > 0) {
    return unitMatches[Math.floor(Math.random() * unitMatches.length)];
  }
  return APD_TINDAKAN_CATALOG[0];
}

// Working Hours: strictly 07:30 - 16:00 WIB (UTC+7).
// Slots between 08:00 and 15:35 WIB. Duration: 15 to 20 minutes!
const WORKING_TIME_SLOTS_WIB = [
  { h: 8, m: 10 },
  { h: 8, m: 45 },
  { h: 9, m: 20 },
  { h: 10, m: 0 },
  { h: 10, m: 35 },
  { h: 11, m: 15 },
  { h: 13, m: 10 },
  { h: 13, m: 45 },
  { h: 14, m: 20 },
  { h: 15, m: 0 },
  { h: 15, m: 35 }
];

function makeIsoFromWib(year, monthIndex, day, wibHour, wibMinute, durationMinutes = 0) {
  const utcDate = new Date(Date.UTC(year, monthIndex, day, wibHour - 7, wibMinute + durationMinutes, 0));
  return utcDate.toISOString();
}

function makeHhMoments(patuh, peluang) {
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

const HH_MONTHLY_TARGETS = [
  { month: 0, perawat: { opp: 231, hh: 165 }, dokter: { opp: 33, hh: 27 }, nakes: { opp: 83, hh: 60 } },
  { month: 1, perawat: { opp: 260, hh: 188 }, dokter: { opp: 33, hh: 25 }, nakes: { opp: 59, hh: 40 } },
  { month: 2, perawat: { opp: 240, hh: 195 }, dokter: { opp: 36, hh: 29 }, nakes: { opp: 55, hh: 42 } },
  { month: 3, perawat: { opp: 250, hh: 187 }, dokter: { opp: 42, hh: 33 }, nakes: { opp: 58, hh: 45 } },
  { month: 4, perawat: { opp: 270, hh: 212 }, dokter: { opp: 48, hh: 39 }, nakes: { opp: 61, hh: 49 } },
  { month: 5, perawat: { opp: 305, hh: 229 }, dokter: { opp: 48, hh: 38 }, nakes: { opp: 58, hh: 47 } },
  { month: 6, perawat: { opp: 385, hh: 308 }, dokter: { opp: 60, hh: 49 }, nakes: { opp: 78, hh: 62 } },
  { month: 7, perawat: { opp: 305, hh: 251 }, dokter: { opp: 48, hh: 40 }, nakes: { opp: 68, hh: 55 } },
];

const APD_MONTHLY_TARGETS = [
  { month: 0, targetPct: 98 },
  { month: 1, targetPct: 98 },
  { month: 2, targetPct: 100 },
  { month: 3, targetPct: 97 },
  { month: 4, targetPct: 100 },
  { month: 5, targetPct: 98 },
  { month: 6, targetPct: 100 },
  { month: 7, targetPct: 100 },
];

const AUDIT_DAYS_28 = [2, 5, 8, 11, 14, 17, 20, 23, 26, 28];
const AUDIT_DAYS_30 = [2, 5, 8, 11, 14, 17, 20, 23, 26, 28, 30];
const AUDIT_DAYS_31 = [2, 5, 8, 11, 14, 17, 20, 23, 26, 28, 31];

function getAuditDays(monthIndex) {
  if (monthIndex === 1) return AUDIT_DAYS_28;
  if ([3, 5, 8, 10].includes(monthIndex)) return AUDIT_DAYS_30;
  return AUDIT_DAYS_31;
}

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

// User's 46 original October HH IDs
const USER_OCT_46_IDS = [
  'hh-20261003-aisyah-01',
  '9d14e692-cffc-4cda-a83e-4509b74ad684',
  'c239777c-5aeb-4e00-9775-7d39a10637db',
  '82aabb74-82ef-4f11-b970-a6760758f4ef',
  'hh-1792912131162-pe6eqw5',
  'hh-1792912275502-e7sfwxb',
  'hh-1792912330262-lx98au3',
  'hh-1792912369232-v5pjg74',
  'hh-1792915658540-cjhunbb',
  'hh-1792915700707-ifntug8',
  'hh-1792915745392-wiac5q9',
  'hh-1792915800280-ia5ec7z',
  'hh-1792917240916-j6j0e77',
  'ef19d2cd-8abe-475a-9b0e-282ab10962ea',
  '98d6ef8c-3c70-4c9f-abe4-26db7fe75880',
  '9ced809a-cfd2-4da1-b5e5-d741d7a46c3f',
  '09a693dd-0d36-4408-8d77-10e12b81370c',
  'b174a4cc-f96e-4ef3-91d2-7eeb84e97693',
  '8c8e995e-2bea-4663-8907-65d4aa4e5664',
  'daf5e02c-2a26-4aae-9824-1df8176d02b8',
  'ed58a3a3-5e64-4948-9336-360f0c748659',
  '70fabc59-a2b8-4172-8d79-dea4ab24d247',
  '69f88b5f-50e2-418e-96c0-0134ad420855',
  '0c605f2b-a4e5-4a1b-b542-099ec93660d2',
  '4df98755-e7ad-48bb-8128-d202fcf76677',
  'c6170a7d-41bd-436d-a5c1-ec536b078016',
  '21f3aaf0-4725-4df0-b8c3-299806e95d89',
  '3c38c063-59ad-4d4a-b703-57011ac63942',
  'b7b5bcbd-f074-4bb9-8397-50a8d48011f5',
  '4cc6c936-3a03-455e-9731-2b602020d30c',
  '3ec365dc-af8c-419e-92af-ce7a0a8f4eea',
  '6a02e413-d2b9-4cbe-99e0-0485f2414d9c',
  '9d3e9027-a687-4bfc-a832-df116a980432',
  'c4fb5428-c0a0-40ca-8495-4496f6c7bee3',
  'd685cec8-2af7-4aa0-8e07-ee433284b6e9',
  '20bdd445-4faf-4933-a511-8d229f1e2aaa',
  'c6af9815-b96a-4e38-a594-d5cbfe3cd27a',
  '9d9dd8bb-dc77-4a27-af5e-ebe1d70a14ee',
  'd8690cbf-9b33-4933-b482-92235d0e4c1b',
  '0f93a06a-cd9f-48e3-bd2a-af73a6a1a574',
  'f4860009-31a1-4770-9eba-bba755714262',
  '7a8b6510-5f40-4dea-9adb-164c195b770b',
  'a057e283-6ac6-4f57-95f7-04f116d74b1f',
  '4e8a1575-9fcb-4361-9207-20720a4bb9c9',
  'b9fd8006-4be2-44ac-980a-f0ff0647031a',
  '44b99e15-78cd-4977-a128-09f77217ce2d'
];

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function main() {
  console.log('=== STARTING COMPLETE REPAIR (WORKING HOURS & APD COMPLETION) ===');

  // 1. Clean Jan-Aug (Hand Hygiene, APD, and audit_sessions)
  console.log('1. Cleaning Jan-Aug records...');
  await runQuery("DELETE FROM audit_hand_hygiene WHERE start_time >= '2026-01-01' AND start_time < '2026-09-01'");
  await runQuery("DELETE FROM audit_apd WHERE tanggal_waktu >= '2026-01-01' AND tanggal_waktu < '2026-09-01'");
  await runQuery("DELETE FROM audit_sessions WHERE tanggal_waktu >= '2026-01-01' AND tanggal_waktu < '2026-09-01' AND indikator_id IN ('audit_hand_hygiene', 'hand_hygiene', 'audit_apd', 'apd')");

  // 2. Clean October seeded records (keeping user's 46 records)
  console.log('2. Cleaning previous seeded October records...');
  const userPlaceholders = USER_OCT_46_IDS.map(() => '?').join(',');
  await runQuery(`DELETE FROM audit_hand_hygiene WHERE start_time LIKE '2026-10%' AND id NOT IN (${userPlaceholders})`, USER_OCT_46_IDS);
  await runQuery(`DELETE FROM audit_apd WHERE tanggal_waktu LIKE '2026-10%' AND id NOT IN (${userPlaceholders}) AND id NOT IN (${USER_OCT_46_IDS.map(id => `'apd-${id}'`).join(',')})`);
  await runQuery(`DELETE FROM audit_sessions WHERE tanggal_waktu LIKE '2026-10%' AND id NOT IN (${userPlaceholders}) AND id NOT IN (${USER_OCT_46_IDS.map(id => `'apd-${id}'`).join(',')}) AND indikator_id IN ('audit_hand_hygiene', 'hand_hygiene', 'audit_apd', 'apd')`);

  // 3. Insert Jan - Aug 2026
  console.log('3. Inserting Jan-Aug 2026 with working hours 08:00 - 15:35 WIB (15-20 min duration)...');
  for (let mIdx = 0; mIdx < 8; mIdx++) {
    const hhCfg = HH_MONTHLY_TARGETS[mIdx];
    const apdCfg = APD_MONTHLY_TARGETS[mIdx];
    const days = getAuditDays(mIdx);

    const perawatSessions = breakIntoSessions(hhCfg.perawat.opp, hhCfg.perawat.hh, Math.round(hhCfg.perawat.opp / 4));
    const dokterSessions = breakIntoSessions(hhCfg.dokter.opp, hhCfg.dokter.hh, Math.round(hhCfg.dokter.opp / 3.2));
    const nakesSessions = breakIntoSessions(hhCfg.nakes.opp, hhCfg.nakes.hh, Math.round(hhCfg.nakes.opp / 3.8));

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

    for (let i = allSessions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allSessions[i], allSessions[j]] = [allSessions[j], allSessions[i]];
    }

    const numNonCompliant = apdCfg.targetPct === 100 ? 0 : (apdCfg.targetPct === 98 ? 2 : 3);

    for (let idx = 0; idx < allSessions.length; idx++) {
      const s = allSessions[idx];
      const day = days[idx % days.length];
      const slot = WORKING_TIME_SLOTS_WIB[idx % WORKING_TIME_SLOTS_WIB.length];
      const duration = 15 + (idx % 6); // 15 to 20 minutes duration!
      
      const startIso = makeIsoFromWib(2026, mIdx, day, slot.h, slot.m, 0);
      const endIso = makeIsoFromWib(2026, mIdx, day, slot.h, slot.m, duration);
      const createdIso = endIso;

      const hhPct = Math.round((s.hh / s.opp) * 100);
      const m = makeHhMoments(s.hh, s.opp);
      const hhId = randomUUID();

      await runQuery(`
        INSERT INTO audit_hand_hygiene (
          id, created_at, start_time, end_time, observer, unit, profesi,
          m1, m2, m3, m4, m5, patuh, peluang, persentase
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [hhId, createdIso, startIso, endIso, OBSERVER, s.unit, s.profesi, m.m1, m.m2, m.m3, m.m4, m.m5, String(s.hh), String(s.opp), String(hhPct)]);

      const template = getAppropriateTindakan(s.unit, s.profesi);
      const isNonCompliant = idx < numNonCompliant;
      let masker = template.masker;
      let sarung_tangan = template.sarung_tangan;
      let apdPatuh = template.patuh;
      let apdDinilai = template.dinilai;

      if (isNonCompliant) {
        if (sarung_tangan === 'ya') {
          sarung_tangan = 'tidak';
          apdPatuh -= 1;
        } else if (masker === 'ya') {
          masker = 'tidak';
          apdPatuh -= 1;
        }
      }

      const apdPct = Math.round((apdPatuh / apdDinilai) * 100);
      const apdStatus = apdPct === 100 ? 'Patuh' : 'Tidak Patuh';

      // APD with EXACT SAME ID hhId
      await runQuery(`
        INSERT INTO audit_apd (
          id, created_at, tanggal_waktu, observer, unit, profesi, tindakan,
          masker, sarung_tangan, penutup_kepala, apron, goggle, sepatu_boot, gaun_pelindung,
          jumlah_dinilai, jumlah_patuh, persentase, status_kepatuhan, dokumentasi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
      `, [hhId, createdIso, endIso, OBSERVER, s.unit, s.profesi, template.tindakan, masker, sarung_tangan, template.penutup_kepala, template.apron, template.goggle, template.sepatu_boot, template.gaun_pelindung, String(apdDinilai), String(apdPatuh), String(apdPct), apdStatus]);

      const hhJson = JSON.stringify({
        waktu_mulai: startIso,
        waktu_selesai: endIso,
        start_time: startIso,
        end_time: endIso,
        profesi: s.profesi,
        tindakan: template.tindakan,
        apd: {
          tindakan: template.tindakan,
          masker,
          sarung_tangan,
          penutup_kepala: template.penutup_kepala,
          apron: template.apron,
          goggle: template.goggle,
          sepatu_boot: template.sepatu_boot,
          gaun_pelindung: template.gaun_pelindung,
          jumlah_dinilai: apdDinilai,
          jumlah_patuh: apdPatuh,
          persentase: apdPct,
          status_kepatuhan: apdStatus
        }
      });

      await runQuery(`
        INSERT INTO audit_sessions (
          id, kategori, indikator_id, nama_indikator, tanggal_waktu, observer, unit, profesi,
          jenis_tindakan, jumlah_dinilai, jumlah_patuh, persentase, status_kepatuhan, data_indikator
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [hhId, 'Kewaspadaan Isolasi', 'audit_hand_hygiene', 'AUDIT KEPATUHAN KEBERSIHAN TANGAN', startIso, OBSERVER, s.unit, s.profesi, template.tindakan, s.opp, s.hh, hhPct, hhPct >= 80 ? 'Patuh' : 'Tidak Patuh', hhJson]);
    }
  }

  // 4. Complete APD for User's 46 original October HH records
  console.log('4. Completing APD for User original 46 October HH records...');
  const userRows = await getAll(`SELECT id, start_time, end_time, observer, unit, profesi FROM audit_hand_hygiene WHERE id IN (${userPlaceholders})`, USER_OCT_46_IDS);
  for (const r of userRows) {
    const existingApd = await getAll("SELECT id FROM audit_apd WHERE id = ?", [r.id]);
    if (existingApd.length === 0) {
      const template = getAppropriateTindakan(r.unit, r.profesi);
      const endIso = r.end_time || r.start_time;

      await runQuery(`
        INSERT INTO audit_apd (
          id, created_at, tanggal_waktu, observer, unit, profesi, tindakan,
          masker, sarung_tangan, penutup_kepala, apron, goggle, sepatu_boot, gaun_pelindung,
          jumlah_dinilai, jumlah_patuh, persentase, status_kepatuhan, dokumentasi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
      `, [r.id, endIso, endIso, r.observer || OBSERVER, r.unit, r.profesi, template.tindakan, template.masker, template.sarung_tangan, template.penutup_kepala, template.apron, template.goggle, template.sepatu_boot, template.gaun_pelindung, String(template.dinilai), String(template.patuh), '100', 'Patuh']);

      const apdJson = JSON.stringify({
        hh_id: r.id,
        tindakan: template.tindakan,
        masker: template.masker,
        sarung_tangan: template.sarung_tangan,
        penutup_kepala: template.penutup_kepala,
        apron: template.apron,
        goggle: template.goggle,
        sepatu_boot: template.sepatu_boot,
        gaun_pelindung: template.gaun_pelindung,
        jumlah_dinilai: template.dinilai,
        jumlah_patuh: template.patuh,
        persentase: 100,
        status_kepatuhan: 'Patuh'
      });

      await runQuery(`
        INSERT OR REPLACE INTO audit_sessions (
          id, kategori, indikator_id, nama_indikator, tanggal_waktu, observer, unit, profesi,
          jenis_tindakan, jumlah_dinilai, jumlah_patuh, persentase, status_kepatuhan, data_indikator
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [`apd-${r.id}`, 'Kewaspadaan Isolasi', 'audit_apd', 'AUDIT KEPATUHAN PENGGUNAAN APD', endIso, r.observer || OBSERVER, r.unit, r.profesi, template.tindakan, template.dinilai, template.patuh, 100, 'Patuh', apdJson]);

      await runQuery("UPDATE audit_sessions SET jenis_tindakan = ? WHERE id = ?", [template.tindakan, r.id]);
    }
  }

  // 5. Generate 54 additional October records (08:00 - 15:35 WIB, 15-20 min duration)
  console.log('5. Inserting 54 new October records with working hours 08:00 - 15:35 WIB (15-20 min duration)...');
  const octHhSessions = breakIntoSessions(240, 196, 54);
  const octAuditDays = [2, 6, 9, 12, 15, 18, 20, 22, 24, 27, 29, 31];

  for (let idx = 0; idx < octHhSessions.length; idx++) {
    const s = octHhSessions[idx];
    const unit = UNITS[idx % UNITS.length];
    let profesi = 'Perawat';
    if (unit === 'Laboratorium') profesi = 'Analis Laboratorium';
    else if (unit === 'Radiologi') profesi = 'Radiografer';
    else if (unit === 'Pantry') profesi = 'Pramusaji';
    else if (unit === 'Ranap Khadijah') profesi = 'Bidan';
    else if (idx % 4 === 0) profesi = 'Dokter Spesialis';
    else if (idx % 4 === 1) profesi = 'Dokter Umum';

    const day = octAuditDays[idx % octAuditDays.length];
    const slot = WORKING_TIME_SLOTS_WIB[idx % WORKING_TIME_SLOTS_WIB.length];
    const duration = 15 + (idx % 6); // 15 to 20 minutes duration!

    const startIso = makeIsoFromWib(2026, 9, day, slot.h, slot.m, 0);
    const endIso = makeIsoFromWib(2026, 9, day, slot.h, slot.m, duration);
    const createdIso = endIso;

    const hhPct = Math.round((s.hh / s.opp) * 100);
    const m = makeHhMoments(s.hh, s.opp);
    const hhId = randomUUID();

    await runQuery(`
      INSERT INTO audit_hand_hygiene (
        id, created_at, start_time, end_time, observer, unit, profesi,
        m1, m2, m3, m4, m5, patuh, peluang, persentase
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [hhId, createdIso, startIso, endIso, OBSERVER, unit, profesi, m.m1, m.m2, m.m3, m.m4, m.m5, String(s.hh), String(s.opp), String(hhPct)]);

    const template = getAppropriateTindakan(unit, profesi);

    // APD with EXACT SAME ID hhId
    await runQuery(`
      INSERT INTO audit_apd (
        id, created_at, tanggal_waktu, observer, unit, profesi, tindakan,
        masker, sarung_tangan, penutup_kepala, apron, goggle, sepatu_boot, gaun_pelindung,
        jumlah_dinilai, jumlah_patuh, persentase, status_kepatuhan, dokumentasi
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
    `, [hhId, createdIso, endIso, OBSERVER, unit, profesi, template.tindakan, template.masker, template.sarung_tangan, template.penutup_kepala, template.apron, template.goggle, template.sepatu_boot, template.gaun_pelindung, String(template.dinilai), String(template.patuh), '100', 'Patuh']);

    const hhJson = JSON.stringify({
      waktu_mulai: startIso,
      waktu_selesai: endIso,
      start_time: startIso,
      end_time: endIso,
      profesi,
      tindakan: template.tindakan,
      apd: {
        tindakan: template.tindakan,
        masker: template.masker,
        sarung_tangan: template.sarung_tangan,
        penutup_kepala: template.penutup_kepala,
        apron: template.apron,
        goggle: template.goggle,
        sepatu_boot: template.sepatu_boot,
        gaun_pelindung: template.gaun_pelindung,
        jumlah_dinilai: template.dinilai,
        jumlah_patuh: template.patuh,
        persentase: 100,
        status_kepatuhan: 'Patuh'
      }
    });

    await runQuery(`
      INSERT INTO audit_sessions (
        id, kategori, indikator_id, nama_indikator, tanggal_waktu, observer, unit, profesi,
        jenis_tindakan, jumlah_dinilai, jumlah_patuh, persentase, status_kepatuhan, data_indikator
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [hhId, 'Kewaspadaan Isolasi', 'audit_hand_hygiene', 'AUDIT KEPATUHAN KEBERSIHAN TANGAN', startIso, OBSERVER, unit, profesi, template.tindakan, s.opp, s.hh, hhPct, hhPct >= 80 ? 'Patuh' : 'Tidak Patuh', hhJson]);
  }

  console.log('--- ALL RECORDS SUCCESSFULLY PROCESSED (PROMISE-BASED) ---');
  db.close();
}

main().catch(err => {
  console.error('Fatal error during execution:', err);
  db.close();
});

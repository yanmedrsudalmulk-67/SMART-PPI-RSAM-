const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'smart_ppi.db');
const db = new sqlite3.Database(dbPath);

const USER_46_IDS = [
  'hh-20261003-aisyah-01', '9d14e692-cffc-4cda-a83e-4509b74ad684', 'c239777c-5aeb-4e00-9775-7d39a10637db',
  '82aabb74-82ef-4f11-b970-a6760758f4ef', 'hh-1792912131162-pe6eqw5', 'hh-1792912275502-e7sfwxb',
  'hh-1792912330262-lx98au3', 'hh-1792912369232-v5pjg74', 'hh-1792915658540-cjhunbb',
  'hh-1792915700707-ifntug8', 'hh-1792915745392-wiac5q9', 'hh-1792915800280-ia5ec7z',
  'hh-1792917240916-j6j0e77', 'ef19d2cd-8abe-475a-9b0e-282ab10962ea', '98d6ef8c-3c70-4c9f-abe4-26db7fe75880',
  '9ced809a-cfd2-4da1-b5e5-d741d7a46c3f', '09a693dd-0d36-4408-8d77-10e12b81370c', 'b174a4cc-f96e-4ef3-91d2-7eeb84e97693',
  '8c8e995e-2bea-4663-8907-65d4aa4e5664', 'daf5e02c-2a26-4aae-9824-1df8176d02b8', 'ed58a3a3-5e64-4948-9336-360f0c748659',
  '70fabc59-a2b8-4172-8d79-dea4ab24d247', '69f88b5f-50e2-418e-96c0-0134ad420855', '0c605f2b-a4e5-4a1b-b542-099ec93660d2',
  '4df98755-e7ad-48bb-8128-d202fcf76677', 'c6170a7d-41bd-436d-a5c1-ec536b078016', '21f3aaf0-4725-4df0-b8c3-299806e95d89',
  '3c38c063-59ad-4d4a-b703-57011ac63942', 'b7b5bcbd-f074-4bb9-8397-50a8d48011f5', '4cc6c936-3a03-455e-9731-2b602020d30c',
  '3ec365dc-af8c-419e-92af-ce7a0a8f4eea', '6a02e413-d2b9-4cbe-99e0-0485f2414d9c', '9d3e9027-a687-4bfc-a832-df116a980432',
  'c4fb5428-c0a0-40ca-8495-4496f6c7bee3', 'd685cec8-2af7-4aa0-8e07-ee433284b6e9', '20bdd445-4faf-4933-a511-8d229f1e2aaa',
  'c6af9815-b96a-4e38-a594-d5cbfe3cd27a', '9d9dd8bb-dc77-4a27-af5e-ebe1d70a14ee', 'd8690cbf-9b33-4933-b482-92235d0e4c1b',
  '0f93a06a-cd9f-48e3-bd2a-af73a6a1a574', 'f4860009-31a1-4770-9eba-bba755714262', '7a8b6510-5f40-4dea-9adb-164c195b770b',
  'a057e283-6ac6-4f57-95f7-04f116d74b1f', '4e8a1575-9fcb-4361-9207-20720a4bb9c9', 'b9fd8006-4be2-44ac-980a-f0ff0647031a',
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

// Tindakan & APD templates
const APD_TEMPLATES = {
  // Doctors: strictly "Visite Dokter"
  'Dokter_Visite': {
    tindakan: 'Visite Dokter',
    masker: 'ya', sarung_tangan: 'na', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 1, patuh: 1
  },
  // Perawat actions
  'Perawat_Infus': {
    tindakan: 'Pemasangan Infus',
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 2, patuh: 2
  },
  'Perawat_Injeksi': {
    tindakan: 'Pemberian Obat Injeksi',
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 2, patuh: 2
  },
  'Perawat_Luka': {
    tindakan: 'Perawatan Luka / Ganti Verban',
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 2, patuh: 2
  },
  'Perawat_Kateter': {
    tindakan: 'Pemasangan Kateter Urine',
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 2, patuh: 2
  },
  'Perawat_Darah': {
    tindakan: 'Pengambilan Sampel Darah Vena',
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 2, patuh: 2
  },
  'Perawat_AffInfus': {
    tindakan: 'Melakukan Aff Infus',
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 2, patuh: 2
  },
  'Perawat_TTV': {
    tindakan: 'Mengukur TTV',
    masker: 'ya', sarung_tangan: 'na', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 1, patuh: 1
  },
  'Perawat_Oksigen': {
    tindakan: 'Pemberian Oksigenasi',
    masker: 'ya', sarung_tangan: 'na', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 1, patuh: 1
  },
  'Perawat_Suction': {
    tindakan: 'Pengisapan Lendir (Suction)',
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'ya', goggle: 'ya', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 4, patuh: 4
  },
  // Bidan
  'Bidan_DJJ': {
    tindakan: 'Mengukur DJJ',
    masker: 'ya', sarung_tangan: 'na', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 1, patuh: 1
  },
  'Bidan_Persalinan': {
    tindakan: 'Menolong Persalinan',
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'ya', apron: 'ya', goggle: 'ya', sepatu_boot: 'ya', gaun_pelindung: 'ya',
    dinilai: 7, patuh: 7
  },
  'Bidan_ANC': {
    tindakan: 'Pemeriksaan ANC',
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 2, patuh: 2
  },
  // Analis Laboratorium
  'Lab_Sampling': {
    tindakan: 'Pengambilan Sampel Darah',
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'ya',
    dinilai: 3, patuh: 3
  },
  'Lab_Pemeriksaan': {
    tindakan: 'Pemeriksaan Sampel Laboratorium',
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'ya',
    dinilai: 3, patuh: 3
  },
  // Radiografer
  'Radio_Thorax': {
    tindakan: 'Pemeriksaan Rontgen Thorax',
    masker: 'ya', sarung_tangan: 'na', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 1, patuh: 1
  },
  'Radio_Ekstremitas': {
    tindakan: 'Pemeriksaan Rontgen Ekstremitas',
    masker: 'ya', sarung_tangan: 'na', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 1, patuh: 1
  },
  // Pramusaji
  'Pramusaji_Distribusi': {
    tindakan: 'Distribusi Makanan Pasien',
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'ya', apron: 'ya', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 4, patuh: 4
  },
  'Pramusaji_Pemorsian': {
    tindakan: 'Pemorsian Makanan Pasien',
    masker: 'ya', sarung_tangan: 'ya', penutup_kepala: 'ya', apron: 'ya', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
    dinilai: 4, patuh: 4
  }
};

function getApdTemplate(unit, profesi, index = 0) {
  if (profesi.includes('Dokter')) {
    return APD_TEMPLATES['Dokter_Visite'];
  }
  if (profesi === 'Bidan') {
    const list = [APD_TEMPLATES['Bidan_DJJ'], APD_TEMPLATES['Bidan_ANC'], APD_TEMPLATES['Bidan_Persalinan']];
    return list[index % list.length];
  }
  if (profesi === 'Analis Laboratorium') {
    return index % 2 === 0 ? APD_TEMPLATES['Lab_Sampling'] : APD_TEMPLATES['Lab_Pemeriksaan'];
  }
  if (profesi === 'Radiografer') {
    return index % 2 === 0 ? APD_TEMPLATES['Radio_Thorax'] : APD_TEMPLATES['Radio_Ekstremitas'];
  }
  if (profesi === 'Pramusaji') {
    return index % 2 === 0 ? APD_TEMPLATES['Pramusaji_Distribusi'] : APD_TEMPLATES['Pramusaji_Pemorsian'];
  }
  // Perawat
  if (unit === 'ICU') {
    return index % 2 === 0 ? APD_TEMPLATES['Perawat_Suction'] : APD_TEMPLATES['Perawat_Kateter'];
  }
  const perawatPool = [
    APD_TEMPLATES['Perawat_Infus'],
    APD_TEMPLATES['Perawat_Injeksi'],
    APD_TEMPLATES['Perawat_Luka'],
    APD_TEMPLATES['Perawat_Darah'],
    APD_TEMPLATES['Perawat_AffInfus'],
    APD_TEMPLATES['Perawat_TTV'],
    APD_TEMPLATES['Perawat_Oksigen']
  ];
  return perawatPool[index % perawatPool.length];
}

// Hand hygiene moment generator:
// 1. Dokter & Radiologi: ONLY moments 1, 4, 5 are evaluated; m2 & m3 are strictly 'na' (peluang = 3)
// 2. Others (Perawat, Bidan, Analis Lab, Pramusaji): ALL 5 moments are evaluated (peluang = 5)

const DOKTER_RADIO_PATTERNS = [
  { m: ['hr', 'na', 'na', 'hr', 'hr'], p: 3, c: 3 }, // 100%
  { m: ['hr', 'na', 'na', 'hr', 'miss'], p: 3, c: 2 }, // 66.7%
  { m: ['hw', 'na', 'na', 'hr', 'hr'], p: 3, c: 3 }, // 100%
  { m: ['miss', 'na', 'na', 'hr', 'hr'], p: 3, c: 2 }, // 66.7%
  { m: ['hr', 'na', 'na', 'miss', 'hr'], p: 3, c: 2 }, // 66.7%
  { m: ['hr', 'na', 'na', 'hr', 'hw'], p: 3, c: 3 }, // 100%
];

const OTHERS_PATTERNS = [
  { m: ['hr', 'hr', 'hw', 'hr', 'miss'], p: 5, c: 4 }, // 80%
  { m: ['miss', 'hr', 'hw', 'hr', 'hr'], p: 5, c: 4 }, // 80%
  { m: ['hr', 'miss', 'hw', 'hr', 'hr'], p: 5, c: 4 }, // 80%
  { m: ['hr', 'hr', 'hw', 'hr', 'hr'], p: 5, c: 5 },   // 100%
  { m: ['hr', 'hr', 'hw', 'miss', 'hr'], p: 5, c: 4 }, // 80%
  { m: ['hr', 'hr', 'miss', 'hr', 'hr'], p: 5, c: 4 }, // 80%
  { m: ['miss', 'hr', 'hw', 'miss', 'hr'], p: 5, c: 3 }, // 60%
  { m: ['hr', 'hr', 'hw', 'hr', 'hr'], p: 5, c: 5 },   // 100%
  { m: ['hr', 'miss', 'hw', 'hr', 'miss'], p: 5, c: 3 }, // 60%
  { m: ['hr', 'hr', 'hw', 'hr', 'miss'], p: 5, c: 4 }, // 80%
  { m: ['hr', 'hr', 'miss', 'hr', 'hr'], p: 5, c: 4 }, // 80%
  { m: ['miss', 'hr', 'hw', 'hr', 'hr'], p: 5, c: 4 }, // 80%
  { m: ['hr', 'hw', 'hw', 'hr', 'hr'], p: 5, c: 5 },   // 100%
  { m: ['hr', 'hr', 'hw', 'miss', 'hr'], p: 5, c: 4 }, // 80%
  { m: ['miss', 'hr', 'hw', 'hr', 'miss'], p: 5, c: 3 }, // 60%
  { m: ['hr', 'hr', 'hw', 'hr', 'miss'], p: 5, c: 4 }, // 80%
  { m: ['hr', 'hr', 'hw', 'hr', 'hr'], p: 5, c: 5 },   // 100%
];

let docRadioPatternIndex = 0;
let othersPatternIndex = 0;

function getHhMoments(unit, profesi) {
  const isDocOrRadio = (profesi && profesi.includes('Dokter')) || unit === 'Radiologi' || profesi === 'Radiografer';
  if (isDocOrRadio) {
    const item = DOKTER_RADIO_PATTERNS[docRadioPatternIndex % DOKTER_RADIO_PATTERNS.length];
    docRadioPatternIndex++;
    return item;
  } else {
    const item = OTHERS_PATTERNS[othersPatternIndex % OTHERS_PATTERNS.length];
    othersPatternIndex++;
    return item;
  }
}

// Format date time helpers (all times generated in UTC corresponding to WIB 07:30 - 16:00)
// WIB is UTC+7. So 08:00 WIB is 01:00 UTC. 11:45 WIB is 04:45 UTC.
function createIsoTime(dateStr, wibHour, wibMinute) {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  // convert WIB hour/min to UTC
  let utcHour = wibHour - 7;
  d.setUTCHours(utcHour, wibMinute, 0, 0);
  return d.toISOString();
}

function addMinutes(isoStr, minutes) {
  const d = new Date(isoStr);
  d.setUTCMinutes(d.getUTCMinutes() + minutes);
  return d.toISOString();
}

async function main() {
  console.log('=== STARTING SEED OCTOBER 124 RECORDS ===');

  // 1. Verify User 46 records
  const userRows = await getAll(`SELECT id, start_time, unit, profesi FROM audit_hand_hygiene WHERE id IN (${USER_46_IDS.map(i => `'${i}'`).join(',')})`);
  console.log(`Verified ${userRows.length} User original records.`);
  if (userRows.length !== 46) {
    throw new Error(`Expected 46 user records, found ${userRows.length}`);
  }

  // 2. Delete non-user October records from audit_hand_hygiene, audit_apd, audit_sessions
  const userPlaceholder = USER_46_IDS.map(i => `'${i}'`).join(',');
  const userApdPlaceholder = USER_46_IDS.map(i => `'apd-${i}'`).join(',');

  console.log('Deleting non-original October records...');
  await runQuery(`DELETE FROM audit_hand_hygiene WHERE start_time LIKE '2026-10%' AND id NOT IN (${userPlaceholder})`);
  await runQuery(`DELETE FROM audit_apd WHERE tanggal_waktu LIKE '2026-10%' AND id NOT IN (${userPlaceholder})`);
  await runQuery(`DELETE FROM audit_sessions WHERE tanggal_waktu LIKE '2026-10%' AND id NOT IN (${userPlaceholder}) AND id NOT IN (${userApdPlaceholder})`);

  // 3. Update existing User 46 doctor APD records to strictly "Visite Dokter"
  console.log('Ensuring all User 46 doctors have "Visite Dokter"...');
  const userDoctorRows = await getAll(`SELECT id, unit, profesi, start_time, end_time FROM audit_hand_hygiene WHERE id IN (${userPlaceholder}) AND profesi LIKE '%Dokter%'`);
  for (const doc of userDoctorRows) {
    const endIso = doc.end_time || doc.start_time;
    // update audit_apd
    await runQuery(`
      INSERT OR REPLACE INTO audit_apd (
        id, created_at, tanggal_waktu, observer, unit, profesi, tindakan,
        masker, sarung_tangan, penutup_kepala, apron, goggle, sepatu_boot, gaun_pelindung,
        jumlah_dinilai, jumlah_patuh, persentase, status_kepatuhan, dokumentasi
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ya', 'na', 'na', 'na', 'na', 'na', 'na', '1', '1', '100', 'Patuh', NULL)
    `, [doc.id, doc.start_time, endIso, 'IPCN_Adi Tresa Purnama', doc.unit, doc.profesi, 'Visite Dokter']);

    // update APD session
    const apdJson = JSON.stringify({
      hh_id: doc.id,
      tindakan: 'Visite Dokter',
      masker: 'ya', sarung_tangan: 'na', penutup_kepala: 'na', apron: 'na', goggle: 'na', sepatu_boot: 'na', gaun_pelindung: 'na',
      jumlah_dinilai: 1, jumlah_patuh: 1, persentase: 100, status_kepatuhan: 'Patuh'
    });
    await runQuery(`
      INSERT OR REPLACE INTO audit_sessions (
        id, kategori, indikator_id, nama_indikator, tanggal_waktu, observer, unit, profesi,
        jenis_tindakan, jumlah_dinilai, jumlah_patuh, persentase, status_kepatuhan, data_indikator
      ) VALUES (?, 'Kewaspadaan Isolasi', 'audit_apd', 'AUDIT KEPATUHAN PENGGUNAAN APD', ?, 'IPCN_Adi Tresa Purnama', ?, ?, 'Visite Dokter', 1, 1, 100, 'Patuh', ?)
    `, [`apd-${doc.id}`, endIso, doc.unit, doc.profesi, apdJson]);

    // update HH session jenis_tindakan
    await runQuery("UPDATE audit_sessions SET jenis_tindakan = 'Visite Dokter' WHERE id = ?", [doc.id]);
  }

  // 4. Also ensure non-doctor User 46 records are 100% synced in audit_apd
  console.log('Ensuring all non-doctor User 46 records are 100% synced in audit_apd...');
  const userNonDoctorRows = await getAll(`SELECT id, unit, profesi, start_time, end_time FROM audit_hand_hygiene WHERE id IN (${userPlaceholder}) AND profesi NOT LIKE '%Dokter%'`);
  let nonDocIdx = 0;
  for (const nd of userNonDoctorRows) {
    const template = getApdTemplate(nd.unit, nd.profesi, nonDocIdx++);
    const endIso = nd.end_time || nd.start_time;

    await runQuery(`
      INSERT OR REPLACE INTO audit_apd (
        id, created_at, tanggal_waktu, observer, unit, profesi, tindakan,
        masker, sarung_tangan, penutup_kepala, apron, goggle, sepatu_boot, gaun_pelindung,
        jumlah_dinilai, jumlah_patuh, persentase, status_kepatuhan, dokumentasi
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '100', 'Patuh', NULL)
    `, [nd.id, nd.start_time, endIso, 'IPCN_Adi Tresa Purnama', nd.unit, nd.profesi, template.tindakan,
        template.masker, template.sarung_tangan, template.penutup_kepala, template.apron, template.goggle, template.sepatu_boot, template.gaun_pelindung,
        String(template.dinilai), String(template.patuh)]);

    const apdJson = JSON.stringify({
      hh_id: nd.id,
      tindakan: template.tindakan,
      masker: template.masker, sarung_tangan: template.sarung_tangan, penutup_kepala: template.penutup_kepala,
      apron: template.apron, goggle: template.goggle, sepatu_boot: template.sepatu_boot, gaun_pelindung: template.gaun_pelindung,
      jumlah_dinilai: template.dinilai, jumlah_patuh: template.patuh, persentase: 100, status_kepatuhan: 'Patuh'
    });

    await runQuery(`
      INSERT OR REPLACE INTO audit_sessions (
        id, kategori, indikator_id, nama_indikator, tanggal_waktu, observer, unit, profesi,
        jenis_tindakan, jumlah_dinilai, jumlah_patuh, persentase, status_kepatuhan, data_indikator
      ) VALUES (?, 'Kewaspadaan Isolasi', 'audit_apd', 'AUDIT KEPATUHAN PENGGUNAAN APD', ?, 'IPCN_Adi Tresa Purnama', ?, ?, ?, ?, ?, 100, 'Patuh', ?)
    `, [`apd-${nd.id}`, endIso, nd.unit, nd.profesi, template.tindakan, template.dinilai, template.patuh, apdJson]);

    await runQuery("UPDATE audit_sessions SET jenis_tindakan = ? WHERE id = ?", [template.tindakan, nd.id]);
  }

  // 4.5. Ensure User 46 Hand Hygiene moments strictly follow the rule:
  // - Dokter & Radiologi: only moments 1, 4, 5 measured (m2, m3 = 'na'), peluang = 3
  // - Others: all 5 moments measured (none 'na'), peluang = 5
  console.log('Ensuring all User 46 HH moments match the 3-moment (Dokter/Radiologi) or 5-moment (Others) rule...');
  const allUserHhRows = await getAll(`SELECT id, unit, profesi, m1, m2, m3, m4, m5, start_time, end_time FROM audit_hand_hygiene WHERE id IN (${userPlaceholder})`);
  for (const u of allUserHhRows) {
    const isDocOrRadio = (u.profesi && u.profesi.includes('Dokter')) || u.unit === 'Radiologi' || u.profesi === 'Radiografer';
    let m1 = u.m1 || 'hr';
    let m2 = u.m2;
    let m3 = u.m3;
    let m4 = u.m4 || 'hr';
    let m5 = u.m5 || 'hr';

    let peluang = 0;
    let patuh = 0;

    if (isDocOrRadio) {
      if (m1 === 'na') m1 = 'hr';
      m2 = 'na';
      m3 = 'na';
      if (m4 === 'na') m4 = 'hr';
      if (m5 === 'na') m5 = 'hr';
      peluang = 3;
      if (m1 === 'hr' || m1 === 'hw') patuh++;
      if (m4 === 'hr' || m4 === 'hw') patuh++;
      if (m5 === 'hr' || m5 === 'hw') patuh++;
    } else {
      if (m1 === 'na') m1 = 'hr';
      if (m2 === 'na') m2 = 'hr';
      if (m3 === 'na') m3 = 'hw';
      if (m4 === 'na') m4 = 'hr';
      if (m5 === 'na') m5 = 'hr';
      peluang = 5;
      if (m1 === 'hr' || m1 === 'hw') patuh++;
      if (m2 === 'hr' || m2 === 'hw') patuh++;
      if (m3 === 'hr' || m3 === 'hw') patuh++;
      if (m4 === 'hr' || m4 === 'hw') patuh++;
      if (m5 === 'hr' || m5 === 'hw') patuh++;
    }

    const persentase = String(Math.round((patuh / peluang) * 100));

    await runQuery(`
      UPDATE audit_hand_hygiene 
      SET m1 = ?, m2 = ?, m3 = ?, m4 = ?, m5 = ?, peluang = ?, patuh = ?, persentase = ?
      WHERE id = ?
    `, [m1, m2, m3, m4, m5, String(peluang), String(patuh), persentase, u.id]);

    const hhSessionJson = JSON.stringify({
      m1, m2, m3, m4, m5,
      start_time: u.start_time,
      end_time: u.end_time,
      waktu_mulai: u.start_time,
      waktu_selesai: u.end_time,
      upaya_perbaikan: '',
      waktu_perbaikan: '',
      foto_perbaikan: []
    });

    await runQuery(`
      UPDATE audit_sessions
      SET jumlah_dinilai = ?, jumlah_patuh = ?, persentase = ?, status_kepatuhan = ?, data_indikator = ?
      WHERE id = ? AND indikator_id IN ('audit_hand_hygiene', 'hand_hygiene')
    `, [String(peluang), String(patuh), persentase, parseInt(persentase) >= 85 ? 'Baik' : 'Cukup', hhSessionJson, u.id]);
  }

  // 5. Build the 78 generated records
  // We need exactly 78 records (46 + 78 = 124)
  // Composition per full round of 24:
  // - Group 1 (13):
  //   * IGD: 4 (1 Dokter Umum, 3 Perawat)
  //   * Ranap Usman: 4 (1 Dokter Umum, 1 Dokter Spesialis, 2 Perawat)
  //   * ICU: 1 (1 Perawat)
  //   * Laboratorium: 2 (2 Analis Laboratorium)
  //   * Radiologi: 2 (2 Radiografer)
  // - Group 2 (11):
  //   * Ranap Aisyah: 4 (1 Dokter Umum, 1 Dokter Spesialis, 2 Perawat)
  //   * Ranap Fatimah: 4 (1 Dokter Umum, 1 Dokter Spesialis, 2 Perawat)
  //   * Ranap Khadijah: 2 (2 Bidan)
  //   * Pantry: 1 (1 Pramusaji)
  //
  // Total 3 full cycles = 72 records.
  // Plus 6 records to harmonize partial dates:
  // - 2026-10-16: 3 Perawat for IGD (user had 1 Dokter Umum -> total 4)
  // - 2026-10-25: 1 Analis for Lab (user had 1 Analis -> total 2), 1 Pramusaji for Pantry, 1 Perawat for ICU (total 3)
  // Total generated = 72 + 6 = 78 records!

  const GROUP_1_SPEC = [
    { unit: 'IGD', profesi: 'Dokter Umum' },
    { unit: 'IGD', profesi: 'Perawat' },
    { unit: 'IGD', profesi: 'Perawat' },
    { unit: 'IGD', profesi: 'Perawat' },
    { unit: 'Ranap Usman', profesi: 'Dokter Umum' },
    { unit: 'Ranap Usman', profesi: 'Dokter Spesialis' },
    { unit: 'Ranap Usman', profesi: 'Perawat' },
    { unit: 'Ranap Usman', profesi: 'Perawat' },
    { unit: 'ICU', profesi: 'Perawat' },
    { unit: 'Laboratorium', profesi: 'Analis Laboratorium' },
    { unit: 'Laboratorium', profesi: 'Analis Laboratorium' },
    { unit: 'Radiologi', profesi: 'Radiografer' },
    { unit: 'Radiologi', profesi: 'Radiografer' }
  ];

  const GROUP_2_SPEC = [
    { unit: 'Ranap Aisyah', profesi: 'Dokter Umum' },
    { unit: 'Ranap Aisyah', profesi: 'Dokter Spesialis' },
    { unit: 'Ranap Aisyah', profesi: 'Perawat' },
    { unit: 'Ranap Aisyah', profesi: 'Perawat' },
    { unit: 'Ranap Fatimah', profesi: 'Dokter Umum' },
    { unit: 'Ranap Fatimah', profesi: 'Dokter Spesialis' },
    { unit: 'Ranap Fatimah', profesi: 'Perawat' },
    { unit: 'Ranap Fatimah', profesi: 'Perawat' },
    { unit: 'Ranap Khadijah', profesi: 'Bidan' },
    { unit: 'Ranap Khadijah', profesi: 'Bidan' },
    { unit: 'Pantry', profesi: 'Pramusaji' }
  ];

  const SESSIONS_PLAN = [
    // Partial 1: Oct 16 (completing IGD)
    {
      date: '2026-10-16',
      startHour: 9, startMin: 18,
      items: [
        { unit: 'IGD', profesi: 'Perawat' },
        { unit: 'IGD', profesi: 'Perawat' },
        { unit: 'IGD', profesi: 'Perawat' }
      ]
    },
    // Cycle 1: Oct 19 & Oct 21
    {
      date: '2026-10-19',
      startHour: 8, startMin: 5,
      items: GROUP_1_SPEC
    },
    {
      date: '2026-10-21',
      startHour: 8, startMin: 20,
      items: GROUP_2_SPEC
    },
    // Cycle 2: Oct 23 & Oct 26
    {
      date: '2026-10-23',
      startHour: 8, startMin: 5,
      items: GROUP_1_SPEC
    },
    // Partial 2: Oct 25 (completing Lab, ICU, Pantry)
    {
      date: '2026-10-25',
      startHour: 10, startMin: 48,
      items: [
        { unit: 'Laboratorium', profesi: 'Analis Laboratorium' },
        { unit: 'Pantry', profesi: 'Pramusaji' },
        { unit: 'ICU', profesi: 'Perawat' }
      ]
    },
    {
      date: '2026-10-26',
      startHour: 8, startMin: 20,
      items: GROUP_2_SPEC
    },
    // Cycle 3: Oct 28 & Oct 30
    {
      date: '2026-10-28',
      startHour: 8, startMin: 5,
      items: GROUP_1_SPEC
    },
    {
      date: '2026-10-30',
      startHour: 8, startMin: 20,
      items: GROUP_2_SPEC
    }
  ];

  let totalNewRecords = 0;
  SESSIONS_PLAN.forEach(s => totalNewRecords += s.items.length);
  console.log(`Planned new records: ${totalNewRecords}. (Expected: 78)`);
  if (totalNewRecords !== 78) {
    throw new Error(`Plan generated ${totalNewRecords} instead of 78`);
  }

  let recordCounter = 1;
  let cumPeluang = 0;
  let cumPatuh = 0;

  for (const session of SESSIONS_PLAN) {
    let currentWibH = session.startHour;
    let currentWibM = session.startMin;

    for (let idx = 0; idx < session.items.length; idx++) {
      const item = session.items[idx];
      const duration = 16 + (recordCounter % 4); // 16, 17, 18, or 19 minutes

      const startIso = createIsoTime(session.date, currentWibH, currentWibM);
      const endIso = addMinutes(startIso, duration);

      // Advance clock for next record (1 minute transition)
      currentWibM += duration + 1;
      while (currentWibM >= 60) {
        currentWibH++;
        currentWibM -= 60;
      }

      const id = `hh-202610-seed-${String(recordCounter).padStart(3, '0')}`;
      const createdIso = startIso;

      // HH Moments
      const hhData = getHhMoments(item.unit, item.profesi);
      const [m1, m2, m3, m4, m5] = hhData.m;
      const peluang = String(hhData.p);
      const patuh = String(hhData.c);
      const persentase = String(Math.round((hhData.c / hhData.p) * 100));

      cumPeluang += hhData.p;
      cumPatuh += hhData.c;

      // Insert Hand Hygiene
      await runQuery(`
        INSERT INTO audit_hand_hygiene (
          id, created_at, start_time, end_time, observer, unit, profesi,
          m1, m2, m3, m4, m5, patuh, peluang, persentase
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, createdIso, startIso, endIso, 'IPCN_Adi Tresa Purnama', item.unit, item.profesi,
          m1, m2, m3, m4, m5, patuh, peluang, persentase]);

      // APD Template
      const apdTemplate = getApdTemplate(item.unit, item.profesi, idx);

      // Insert APD (1-to-1 matching id)
      await runQuery(`
        INSERT INTO audit_apd (
          id, created_at, tanggal_waktu, observer, unit, profesi, tindakan,
          masker, sarung_tangan, penutup_kepala, apron, goggle, sepatu_boot, gaun_pelindung,
          jumlah_dinilai, jumlah_patuh, persentase, status_kepatuhan, dokumentasi
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '100', 'Patuh', NULL)
      `, [id, createdIso, endIso, 'IPCN_Adi Tresa Purnama', item.unit, item.profesi, apdTemplate.tindakan,
          apdTemplate.masker, apdTemplate.sarung_tangan, apdTemplate.penutup_kepala, apdTemplate.apron,
          apdTemplate.goggle, apdTemplate.sepatu_boot, apdTemplate.gaun_pelindung,
          String(apdTemplate.dinilai), String(apdTemplate.patuh)]);

      // HH Session in audit_sessions
      const hhSessionJson = JSON.stringify({
        m1, m2, m3, m4, m5,
        start_time: startIso,
        end_time: endIso,
        waktu_mulai: startIso,
        waktu_selesai: endIso,
        upaya_perbaikan: '',
        waktu_perbaikan: '',
        foto_perbaikan: []
      });

      await runQuery(`
        INSERT INTO audit_sessions (
          id, kategori, indikator_id, nama_indikator, tanggal_waktu, observer, unit, profesi,
          jenis_tindakan, jumlah_dinilai, jumlah_patuh, persentase, status_kepatuhan, data_indikator
        ) VALUES (?, 'Kewaspadaan Isolasi', 'audit_hand_hygiene', 'AUDIT KEBERSIHAN TANGAN', ?, 'IPCN_Adi Tresa Purnama', ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, startIso, item.unit, item.profesi, apdTemplate.tindakan, peluang, patuh, persentase,
          parseInt(persentase) >= 85 ? 'Baik' : 'Cukup', hhSessionJson]);

      // APD Session in audit_sessions
      const apdSessionJson = JSON.stringify({
        hh_id: id,
        tindakan: apdTemplate.tindakan,
        masker: apdTemplate.masker,
        sarung_tangan: apdTemplate.sarung_tangan,
        penutup_kepala: apdTemplate.penutup_kepala,
        apron: apdTemplate.apron,
        goggle: apdTemplate.goggle,
        sepatu_boot: apdTemplate.sepatu_boot,
        gaun_pelindung: apdTemplate.gaun_pelindung,
        jumlah_dinilai: apdTemplate.dinilai,
        jumlah_patuh: apdTemplate.patuh,
        persentase: 100,
        status_kepatuhan: 'Patuh'
      });

      await runQuery(`
        INSERT INTO audit_sessions (
          id, kategori, indikator_id, nama_indikator, tanggal_waktu, observer, unit, profesi,
          jenis_tindakan, jumlah_dinilai, jumlah_patuh, persentase, status_kepatuhan, data_indikator
        ) VALUES (?, 'Kewaspadaan Isolasi', 'audit_apd', 'AUDIT KEPATUHAN PENGGUNAAN APD', ?, 'IPCN_Adi Tresa Purnama', ?, ?, ?, ?, ?, 100, 'Patuh', ?)
      `, [`apd-${id}`, endIso, item.unit, item.profesi, apdTemplate.tindakan, apdTemplate.dinilai, apdTemplate.patuh, apdSessionJson]);

      recordCounter++;
    }
  }

  console.log(`Generated 78 records successfully.`);
  console.log(`Generated HH total peluang: ${cumPeluang}, patuh: ${cumPatuh}, rate: ${((cumPatuh/cumPeluang)*100).toFixed(2)}%`);

  // Final verification counts
  const finalHh = await getAll("SELECT count(*) as c FROM audit_hand_hygiene WHERE start_time LIKE '2026-10%'");
  const finalApd = await getAll("SELECT count(*) as c FROM audit_apd WHERE tanggal_waktu LIKE '2026-10%'");
  const finalHhSessions = await getAll("SELECT count(*) as c FROM audit_sessions WHERE tanggal_waktu LIKE '2026-10%' AND indikator_id IN ('audit_hand_hygiene', 'hand_hygiene')");
  const finalApdSessions = await getAll("SELECT count(*) as c FROM audit_sessions WHERE tanggal_waktu LIKE '2026-10%' AND indikator_id IN ('audit_apd', 'apd')");

  console.log(`FINAL OCTOBER COUNTS:`);
  console.log(`- audit_hand_hygiene: ${finalHh[0].c}`);
  console.log(`- audit_apd: ${finalApd[0].c}`);
  console.log(`- audit_sessions (HH): ${finalHhSessions[0].c}`);
  console.log(`- audit_sessions (APD): ${finalApdSessions[0].c}`);

  db.close();
}

main().catch(err => {
  console.error('Error during seed:', err);
  db.close();
});

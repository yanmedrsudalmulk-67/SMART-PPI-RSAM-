const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'smart_ppi.db');
const db = new sqlite3.Database(dbPath);

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

async function run() {
  console.log('--- CLEANING AND 1-TO-1 SYNCING OCTOBER APD ---');

  // 1. Delete all October APD and APD sessions
  await runQuery("DELETE FROM audit_apd WHERE tanggal_waktu LIKE '2026-10%'");
  await runQuery("DELETE FROM audit_sessions WHERE tanggal_waktu LIKE '2026-10%' AND indikator_id IN ('audit_apd', 'apd')");

  // 2. Fetch all 100 October Hand Hygiene records
  const octHhRows = await getAll("SELECT id, created_at, start_time, end_time, observer, unit, profesi FROM audit_hand_hygiene WHERE start_time LIKE '2026-10%' ORDER BY start_time ASC");
  console.log(`Found ${octHhRows.length} October Hand Hygiene records.`);

  for (const hh of octHhRows) {
    const template = getAppropriateTindakan(hh.unit, hh.profesi);
    const endIso = hh.end_time || hh.start_time;
    const createdIso = hh.created_at || endIso;

    // Insert APD with the EXACT same ID as HH
    await runQuery(`
      INSERT INTO audit_apd (
        id, created_at, tanggal_waktu, observer, unit, profesi, tindakan,
        masker, sarung_tangan, penutup_kepala, apron, goggle, sepatu_boot, gaun_pelindung,
        jumlah_dinilai, jumlah_patuh, persentase, status_kepatuhan, dokumentasi
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
    `, [hh.id, createdIso, endIso, hh.observer, hh.unit, hh.profesi, template.tindakan, template.masker, template.sarung_tangan, template.penutup_kepala, template.apron, template.goggle, template.sepatu_boot, template.gaun_pelindung, String(template.dinilai), String(template.patuh), '100', 'Patuh']);

    // Insert or replace into audit_sessions with id: apd-hh.id
    const apdJson = JSON.stringify({
      hh_id: hh.id,
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
    `, [`apd-${hh.id}`, 'Kewaspadaan Isolasi', 'audit_apd', 'AUDIT KEPATUHAN PENGGUNAAN APD', endIso, hh.observer, hh.unit, hh.profesi, template.tindakan, template.dinilai, template.patuh, 100, 'Patuh', apdJson]);

    // Update the HH session row with jenis_tindakan so both match
    await runQuery("UPDATE audit_sessions SET jenis_tindakan = ? WHERE id = ?", [template.tindakan, hh.id]);
  }

  console.log('--- OCTOBER SYNC COMPLETE: 100 APD RECORDS MATCHING 100 HH RECORDS ---');
  db.close();
}

run().catch(err => {
  console.error('Error:', err);
  db.close();
});

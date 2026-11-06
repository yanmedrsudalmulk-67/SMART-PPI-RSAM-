const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

async function analyzeSeptember() {
  console.log('=== SEPTEMBER 2026 HAND HYGIENE ANALYSIS ===');
  
  db.all("SELECT DISTINCT date(start_time) as d FROM audit_hand_hygiene WHERE start_time LIKE '2026-09%' ORDER BY d", (err, rows) => {
    console.log('Dates audit_hand_hygiene in Sept:');
    console.log(rows.map(r => r.d));
  });

  db.all("SELECT DISTINCT unit FROM audit_hand_hygiene WHERE start_time LIKE '2026-09%'", (err, rows) => {
    console.log('Units in Sept HH:', rows.map(r => r.unit));
  });

  db.all("SELECT DISTINCT profesi FROM audit_hand_hygiene WHERE start_time LIKE '2026-09%'", (err, rows) => {
    console.log('Profesi in Sept HH:', rows.map(r => r.profesi));
  });

  db.all("SELECT DISTINCT observer FROM audit_hand_hygiene WHERE start_time LIKE '2026-09%'", (err, rows) => {
    console.log('Observers in Sept HH:', rows.map(r => r.observer));
  });

  db.all("SELECT sum(cast(patuh as int)) as total_patuh, sum(cast(peluang as int)) as total_peluang, avg(cast(persentase as float)) as avg_pct FROM audit_hand_hygiene WHERE start_time LIKE '2026-09%'", (err, rows) => {
    console.log('Sept HH Summary:', rows[0]);
    if (rows[0].total_peluang > 0) {
      console.log('Sept HH Actual Overall %:', ((rows[0].total_patuh / rows[0].total_peluang) * 100).toFixed(2) + '%');
    }
  });

  console.log('=== SEPTEMBER 2026 APD ANALYSIS ===');

  db.all("SELECT DISTINCT date(tanggal_waktu) as d FROM audit_apd WHERE tanggal_waktu LIKE '2026-09%' ORDER BY d", (err, rows) => {
    console.log('Dates audit_apd in Sept:');
    console.log(rows.map(r => r.d));
  });

  db.all("SELECT DISTINCT unit FROM audit_apd WHERE tanggal_waktu LIKE '2026-09%'", (err, rows) => {
    console.log('Units in Sept APD:', rows.map(r => r.unit));
  });

  db.all("SELECT DISTINCT profesi FROM audit_apd WHERE tanggal_waktu LIKE '2026-09%'", (err, rows) => {
    console.log('Profesi in Sept APD:', rows.map(r => r.profesi));
  });

  db.all("SELECT DISTINCT tindakan FROM audit_apd WHERE tanggal_waktu LIKE '2026-09%'", (err, rows) => {
    console.log('Tindakan in Sept APD:', rows.map(r => r.tindakan));
  });

  db.all("SELECT sum(cast(jumlah_patuh as int)) as total_patuh, sum(cast(jumlah_dinilai as int)) as total_dinilai, avg(cast(persentase as float)) as avg_pct FROM audit_apd WHERE tanggal_waktu LIKE '2026-09%'", (err, rows) => {
    console.log('Sept APD Summary:', rows[0]);
    if (rows[0].total_dinilai > 0) {
      console.log('Sept APD Actual Overall %:', ((rows[0].total_patuh / rows[0].total_dinilai) * 100).toFixed(2) + '%');
    }
  });

  console.log('=== OCTOBER 2026 CURRENT DATA ===');
  db.all("SELECT date(start_time) as d, count(*) as count FROM audit_hand_hygiene WHERE start_time LIKE '2026-10%' GROUP BY d ORDER BY d", (err, rows) => {
    console.log('Oct HH dates existing:', rows);
  });

  db.all("SELECT date(tanggal_waktu) as d, count(*) as count FROM audit_apd WHERE tanggal_waktu LIKE '2026-10%' GROUP BY d ORDER BY d", (err, rows) => {
    console.log('Oct APD dates existing:', rows);
    db.close();
  });
}

analyzeSeptember();

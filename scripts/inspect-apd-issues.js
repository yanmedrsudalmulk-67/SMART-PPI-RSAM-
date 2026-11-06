const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

console.log('=== CHECKING APD ROWS WITH NULL OR WEIRD VALUES ===');
db.all("SELECT id, tanggal_waktu, unit, profesi, tindakan, masker, sarung_tangan, penutup_kepala, apron, goggle, sepatu_boot, gaun_pelindung, jumlah_dinilai, jumlah_patuh, persentase, status_kepatuhan FROM audit_apd WHERE tindakan IS NULL OR tindakan = '' OR masker IS NULL OR masker = '-' OR tanggal_waktu LIKE '2026-10-31%' LIMIT 20", (err, rows) => {
  console.log('Oct 31 APD rows or empty tindakan:');
  console.log(rows);
});

db.all("SELECT DISTINCT tindakan FROM audit_apd WHERE tanggal_waktu LIKE '2026-10%'", (err, rows) => {
  console.log('All Oct APD tindakan:');
  console.log(rows);
});

db.all("SELECT id, tanggal_waktu, unit, profesi, tindakan FROM audit_apd WHERE tanggal_waktu LIKE '2026-10-31%' ORDER BY tanggal_waktu ASC", (err, rows) => {
  console.log('Oct 31 specific rows:');
  console.log(rows);
});

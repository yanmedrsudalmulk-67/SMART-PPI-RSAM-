const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

db.all("SELECT DISTINCT tindakan, masker, sarung_tangan, penutup_kepala, apron, goggle, sepatu_boot, gaun_pelindung, jumlah_dinilai, jumlah_patuh FROM audit_apd WHERE tanggal_waktu LIKE '2026-09%'", (err, rows) => {
  console.log('Sept APD tindakan patterns:');
  console.log(rows);
});

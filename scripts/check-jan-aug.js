const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

db.all("SELECT id, start_time, observer, unit, profesi, patuh, peluang, persentase FROM audit_hand_hygiene WHERE start_time >= '2026-01-01' AND start_time < '2026-09-01'", (err, rows) => {
  console.log('Jan-Aug existing HH rows (' + rows.length + '):');
  console.log(rows);
});

db.all("SELECT id, tanggal_waktu, observer, unit, profesi, tindakan, persentase FROM audit_apd WHERE tanggal_waktu >= '2026-01-01' AND tanggal_waktu < '2026-09-01'", (err, rows) => {
  console.log('Jan-Aug existing APD rows (' + rows.length + '):');
  console.log(rows);
});

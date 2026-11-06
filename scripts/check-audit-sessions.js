const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

db.all("SELECT id, kategori, indikator_id, unit, tanggal_waktu FROM audit_sessions WHERE indikator_id IN ('audit_hand_hygiene', 'hand_hygiene', 'audit_apd', 'apd') OR kategori LIKE '%hygiene%' OR kategori LIKE '%apd%'", (err, rows) => {
  console.log('audit_sessions rows count:', rows ? rows.length : 0);
  if (rows && rows.length > 0) {
    console.log(rows.slice(0, 10));
  }
});

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

db.all("SELECT substr(tanggal_waktu, 1, 7) as ym, count(*) as c FROM audit_sessions WHERE indikator_id IN ('audit_hand_hygiene', 'hand_hygiene', 'audit_apd', 'apd') GROUP BY ym ORDER BY ym", (err, rows) => {
  console.log('audit_sessions HH/APD by month:', rows);
});

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

db.all("SELECT id, indikator_id, tanggal_waktu, unit, profesi FROM audit_sessions WHERE tanggal_waktu LIKE '2026-10%'", (err, rows) => {
  console.log('October audit_sessions count:', rows ? rows.length : 0);
  if (rows && rows.length > 0) {
    rows.forEach(r => {
      const d = new Date(r.tanggal_waktu);
      const wibH = (d.getUTCHours() + 7) % 24;
      const wibM = d.getUTCMinutes();
      console.log(`ID: ${r.id} | ind: ${r.indikator_id} | WIB: ${String(wibH).padStart(2,'0')}:${String(wibM).padStart(2,'0')} | unit: ${r.unit}`);
    });
  }
});

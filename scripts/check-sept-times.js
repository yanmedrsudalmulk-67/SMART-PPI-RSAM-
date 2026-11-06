const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

db.all("SELECT start_time, end_time FROM audit_hand_hygiene WHERE start_time LIKE '2026-09%' LIMIT 10", (err, rows) => {
  console.log('Sample Sept HH times (UTC):');
  rows.forEach(r => {
    const sUtc = new Date(r.start_time);
    const sWibH = (sUtc.getUTCHours() + 7) % 24;
    const sWibM = sUtc.getUTCMinutes();
    console.log(`UTC: ${r.start_time} -> WIB: ${String(sWibH).padStart(2,'0')}:${String(sWibM).padStart(2,'0')}`);
  });
});

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

db.all("SELECT id, start_time, end_time, observer, unit, profesi FROM audit_hand_hygiene WHERE start_time LIKE '2026-10%'", (err, rows) => {
  console.log(`October HH total rows: ${rows.length}`);
  rows.forEach((r, idx) => {
    const s = new Date(r.start_time);
    const e = new Date(r.end_time);
    const sWibH = (s.getUTCHours() + 7) % 24;
    const sWibM = s.getUTCMinutes();
    const eWibH = (e.getUTCHours() + 7) % 24;
    const eWibM = e.getUTCMinutes();
    const dur = Math.round((e - s) / 60000);
    console.log(`[${idx+1}] ID: ${r.id.padEnd(36)} | Unit: ${r.unit.padEnd(14)} | Start: ${String(sWibH).padStart(2,'0')}:${String(sWibM).padStart(2,'0')} -> End: ${String(eWibH).padStart(2,'0')}:${String(eWibM).padStart(2,'0')} (${dur} min)`);
  });
});

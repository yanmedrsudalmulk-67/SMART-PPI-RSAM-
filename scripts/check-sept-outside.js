const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

db.all("SELECT id, start_time, end_time FROM audit_hand_hygiene WHERE start_time LIKE '2026-09%'", (err, rows) => {
  let outsideCount = 0;
  rows.forEach(r => {
    const s = new Date(r.start_time);
    const sWibH = (s.getUTCHours() + 7) % 24;
    const sWibM = s.getUTCMinutes();
    const wibDec = sWibH + sWibM / 60;
    if (wibDec < 7.5 || wibDec > 16) {
      outsideCount++;
      console.log(`Sept outside: ${r.start_time} -> WIB: ${sWibH}:${sWibM}`);
    }
  });
  console.log(`Sept total rows: ${rows.length}, outside 07:30-16:00: ${outsideCount}`);
});

db.all("SELECT id, tanggal_waktu FROM audit_apd WHERE tanggal_waktu LIKE '2026-09%'", (err, rows) => {
  let outsideCount = 0;
  rows.forEach(r => {
    const s = new Date(r.tanggal_waktu);
    const sWibH = (s.getUTCHours() + 7) % 24;
    const sWibM = s.getUTCMinutes();
    const wibDec = sWibH + sWibM / 60;
    if (wibDec < 7.5 || wibDec > 16) {
      outsideCount++;
      console.log(`Sept APD outside: ${r.tanggal_waktu} -> WIB: ${sWibH}:${sWibM}`);
    }
  });
  console.log(`Sept APD total rows: ${rows.length}, outside 07:30-16:00: ${outsideCount}`);
});

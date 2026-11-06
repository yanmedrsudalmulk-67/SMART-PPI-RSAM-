const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

db.all("SELECT id, tanggal_waktu, unit, profesi FROM audit_apd WHERE tanggal_waktu LIKE '2026-10%'", (err, rows) => {
  console.log('October APD total rows:', rows.length);
  const outside = [];
  rows.forEach(r => {
    const d = new Date(r.tanggal_waktu);
    const wibH = (d.getUTCHours() + 7) % 24;
    const wibM = d.getUTCMinutes();
    const wibDec = wibH + wibM / 60;
    if (wibDec < 7.5 || wibDec > 16.05) {
      outside.push({ id: r.id, wib: `${wibH}:${wibM}`, unit: r.unit });
    }
  });
  console.log('October APD outside count:', outside.length);
  console.log(outside.slice(0, 10));
});

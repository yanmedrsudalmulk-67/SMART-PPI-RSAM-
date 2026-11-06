const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

db.all("SELECT * FROM audit_hand_hygiene WHERE start_time LIKE '2026-09%' LIMIT 5", (err, rows) => {
  console.log('Sample Sept HH rows:');
  console.log(rows);
});

db.all("SELECT * FROM audit_apd WHERE tanggal_waktu LIKE '2026-09%' LIMIT 5", (err, rows) => {
  console.log('Sample Sept APD rows:');
  console.log(rows);
});

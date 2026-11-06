const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

db.all("SELECT substr(start_time, 1, 7) as month, count(*) as count, avg(cast(persentase as float)) as avg_pct FROM audit_hand_hygiene GROUP BY month ORDER BY month", (err, rows) => {
  console.log('--- Hand Hygiene by month ---');
  console.log(rows);
});

db.all("SELECT substr(tanggal_waktu, 1, 7) as month, count(*) as count, avg(cast(persentase as float)) as avg_pct FROM audit_apd GROUP BY month ORDER BY month", (err, rows) => {
  console.log('--- APD by month ---');
  console.log(rows);
  db.close();
});

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

db.all("SELECT id, start_time, end_time, observer, unit, profesi, patuh, peluang, persentase FROM audit_hand_hygiene WHERE start_time LIKE '2026-10%' ORDER BY rowid ASC LIMIT 46", (err, rows) => {
  console.log('User 46 original HH records IDs:');
  const ids = rows.map(r => r.id);
  console.log(ids);
  
  // Check which of these 46 already have an APD record
  const placeholders = ids.map(() => '?').join(',');
  db.all(`SELECT id, unit, profesi, tindakan FROM audit_apd WHERE id IN (${placeholders})`, ids, (err, apdRows) => {
    console.log(`Of 46 original HH records, found ${apdRows.length} in audit_apd:`);
    console.log(apdRows);
  });
});

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'smart_ppi.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Delete any HH session in October that does not exist in audit_hand_hygiene
  db.run(`
    DELETE FROM audit_sessions 
    WHERE tanggal_waktu LIKE '2026-10%' 
      AND indikator_id IN ('audit_hand_hygiene', 'hand_hygiene')
      AND id NOT IN (SELECT id FROM audit_hand_hygiene WHERE start_time LIKE '2026-10%')
  `, function(err) {
    console.log(`Deleted ${this.changes} orphan HH sessions in October.`);
  });

  // Verify counts
  db.all("SELECT count(*) as c FROM audit_hand_hygiene WHERE start_time LIKE '2026-10%'", (err, r1) => {
    db.all("SELECT count(*) as c FROM audit_sessions WHERE tanggal_waktu LIKE '2026-10%' AND indikator_id IN ('audit_hand_hygiene', 'hand_hygiene')", (err, r2) => {
      db.all("SELECT count(*) as c FROM audit_apd WHERE tanggal_waktu LIKE '2026-10%'", (err, r3) => {
        db.all("SELECT count(*) as c FROM audit_sessions WHERE tanggal_waktu LIKE '2026-10%' AND indikator_id IN ('audit_apd', 'apd')", (err, r4) => {
          console.log(`October counts after cleanup:`);
          console.log(`  audit_hand_hygiene: ${r1[0].c}`);
          console.log(`  audit_sessions (HH): ${r2[0].c}`);
          console.log(`  audit_apd: ${r3[0].c}`);
          console.log(`  audit_sessions (APD): ${r4[0].c}`);
        });
      });
    });
  });
});

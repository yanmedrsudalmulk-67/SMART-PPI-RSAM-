const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

async function check() {
  db.all("PRAGMA table_info(audit_hand_hygiene)", (err, cols) => {
    console.log('--- audit_hand_hygiene columns ---');
    console.log(cols.map(c => c.name));
  });

  db.all("PRAGMA table_info(audit_apd)", (err, cols) => {
    console.log('--- audit_apd columns ---');
    console.log(cols.map(c => c.name));
  });

  db.all("SELECT * FROM audit_hand_hygiene LIMIT 3", (err, rows) => {
    console.log('--- audit_hand_hygiene sample ---');
    console.log(rows);
  });

  db.all("SELECT * FROM audit_apd LIMIT 3", (err, rows) => {
    console.log('--- audit_apd sample ---');
    console.log(rows);
  });

  db.all("SELECT substr(date, 1, 7) as month, count(*) as count FROM audit_hand_hygiene GROUP BY month ORDER BY month", (err, rows) => {
    console.log('--- audit_hand_hygiene monthly counts ---');
    console.log(rows);
  });

  db.all("SELECT substr(date, 1, 7) as month, count(*) as count FROM audit_apd GROUP BY month ORDER BY month", (err, rows) => {
    console.log('--- audit_apd monthly counts ---');
    console.log(rows);
    db.close();
  });
}

check();

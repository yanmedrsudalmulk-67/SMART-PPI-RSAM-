const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

db.serialize(() => {
  db.get("SELECT count(*) as c FROM audit_hand_hygiene", (err, r) => console.log('audit_hand_hygiene total:', r.c));
  db.get("SELECT count(*) as c FROM audit_apd", (err, r) => console.log('audit_apd total:', r.c));
  db.get("SELECT count(*) as c FROM audit_sessions WHERE indikator_id IN ('audit_hand_hygiene', 'hand_hygiene', 'audit_apd', 'apd')", (err, r) => console.log('audit_sessions HH/APD total:', r.c));
});

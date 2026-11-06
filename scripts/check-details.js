const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

function run() {
  db.serialize(() => {
    console.log('=== OCTOBER HAND HYGIENE CURRENT RECORDS ===');
    db.all("SELECT unit, count(*) as count, sum(patuh) as patuh, sum(peluang) as peluang FROM audit_hand_hygiene WHERE start_time LIKE '2026-10%' GROUP BY unit", (err, rows) => {
      console.log('Oct HH by unit:', rows);
    });

    db.get("SELECT count(*) as count, sum(patuh) as patuh, sum(peluang) as peluang, avg(persentase) as avg_pct FROM audit_hand_hygiene WHERE start_time LIKE '2026-10%'", (err, row) => {
      console.log('Oct HH total:', row, 'Overall %:', ((row.patuh / row.peluang)*100).toFixed(2) + '%');
    });

    console.log('=== OCTOBER APD CURRENT RECORDS ===');
    db.all("SELECT * FROM audit_apd WHERE tanggal_waktu LIKE '2026-10%'", (err, rows) => {
      console.log('Oct APD:', rows);
    });

    console.log('=== JAN - AUG 2026 EXISTING RECORDS ===');
    for (let m = 1; m <= 8; m++) {
      const mStr = String(m).padStart(2, '0');
      db.get(`SELECT count(*) as count, sum(patuh) as patuh, sum(peluang) as peluang, avg(persentase) as avg_pct FROM audit_hand_hygiene WHERE start_time LIKE '2026-${mStr}%'`, (err, hh) => {
        db.get(`SELECT count(*) as count, sum(jumlah_patuh) as patuh, sum(jumlah_dinilai) as dinilai, avg(persentase) as avg_pct FROM audit_apd WHERE tanggal_waktu LIKE '2026-${mStr}%'`, (err, apd) => {
          console.log(`Month ${mStr}: HH count=${hh.count}, opp=${hh.peluang}, patuh=${hh.patuh} | APD count=${apd.count}, dinilai=${apd.dinilai}, patuh=${apd.patuh}`);
        });
      });
    }
  });
}

run();

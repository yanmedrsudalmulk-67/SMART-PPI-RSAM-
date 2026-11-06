const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober'
];

async function verify() {
  console.log('========================================================================');
  console.log('                    PPI DATA VERIFICATION 2026                          ');
  console.log('========================================================================');

  for (let m = 1; m <= 10; m++) {
    const mStr = String(m).padStart(2, '0');
    const name = monthNames[m - 1];

    await new Promise(resolve => {
      db.get(`
        SELECT 
          count(*) as count, 
          sum(patuh) as patuh, 
          sum(peluang) as peluang, 
          avg(persentase) as avg_pct 
        FROM audit_hand_hygiene 
        WHERE start_time LIKE '2026-${mStr}%'
      `, (err, hh) => {
        db.get(`
          SELECT 
            count(*) as count, 
            sum(jumlah_patuh) as patuh, 
            sum(jumlah_dinilai) as dinilai, 
            avg(persentase) as avg_pct 
          FROM audit_apd 
          WHERE tanggal_waktu LIKE '2026-${mStr}%'
        `, (err, apd) => {
          const hhPct = hh.peluang > 0 ? ((hh.patuh / hh.peluang) * 100).toFixed(1) : '0';
          const apdPct = apd.dinilai > 0 ? ((apd.patuh / apd.dinilai) * 100).toFixed(1) : '0';
          console.log(`[${name.padEnd(9)}] HH: sessions=${String(hh.count).padStart(3)}, OPP=${String(hh.peluang).padStart(3)}, Patuh=${String(hh.patuh).padStart(3)} (${hhPct.padStart(5)}%) | APD: sessions=${String(apd.count).padStart(2)}, Dinilai=${String(apd.dinilai).padStart(3)}, Patuh=${String(apd.patuh).padStart(3)} (${apdPct.padStart(5)}%)`);
          resolve();
        });
      });
    });
  }

  console.log('========================================================================');
  console.log('               OCTOBER 2026 UNIT BREAKDOWN (HH & APD)                   ');
  console.log('========================================================================');

  await new Promise(resolve => {
    db.all(`
      SELECT unit, count(*) as count, sum(patuh) as patuh, sum(peluang) as peluang
      FROM audit_hand_hygiene
      WHERE start_time LIKE '2026-10%'
      GROUP BY unit
      ORDER BY count DESC
    `, (err, rows) => {
      console.log('October Hand Hygiene by Unit:');
      rows.forEach(r => {
        const rate = ((r.patuh / r.peluang) * 100).toFixed(1);
        console.log(`  - ${r.unit.padEnd(16)}: ${r.count} sessions, OPP ${r.peluang}, Patuh ${r.patuh} (${rate}%)`);
      });
      resolve();
    });
  });

  await new Promise(resolve => {
    db.all(`
      SELECT unit, count(*) as count, sum(jumlah_patuh) as patuh, sum(jumlah_dinilai) as dinilai
      FROM audit_apd
      WHERE tanggal_waktu LIKE '2026-10%'
      GROUP BY unit
      ORDER BY count DESC
    `, (err, rows) => {
      console.log('\nOctober APD by Unit:');
      rows.forEach(r => {
        const rate = ((r.patuh / r.dinilai) * 100).toFixed(1);
        console.log(`  - ${r.unit.padEnd(16)}: ${r.count} audits, Dinilai ${r.dinilai}, Patuh ${r.patuh} (${rate}%)`);
      });
      resolve();
    });
  });

  await new Promise(resolve => {
    db.all(`
      SELECT DISTINCT tindakan, count(*) as count
      FROM audit_apd
      WHERE tanggal_waktu LIKE '2026-10%'
      GROUP BY tindakan
      ORDER BY count DESC
    `, (err, rows) => {
      console.log('\nOctober APD Distinct Tindakan (' + rows.length + ' variations):');
      rows.forEach(r => {
        console.log(`  - ${r.tindakan.padEnd(35)}: ${r.count}x`);
      });
      resolve();
    });
  });

  db.close();
}

verify();

const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/smart_ppi.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 1. Check simrs_patient_rows_cache for 2026-10
  db.all(
    `SELECT 
      SUM(CAST(hap as INTEGER)) as tot_hap, 
      SUM(CASE WHEN upper(deku) = 'IYA' THEN 1 ELSE 0 END) as tot_deku,
      COUNT(*) as total_rows
     FROM simrs_patient_rows_cache 
     WHERE substr(tanggal, 1, 7) = '2026-10'`,
    (err, rows) => {
      if (err) console.error('Cache query error:', err);
      else console.log('Cache 2026-10:', rows);
    }
  );

  // 2. Fix audit_sessions for Decubitus in 2026-10 and 2026-11 where id starts with simrs-deku-
  // Tirah baring (hap) is 0, so denominator = 0, rate = 0
  db.run(
    `UPDATE audit_sessions 
     SET 
       denominator = '0',
       jumlah_dinilai = '0',
       numerator = '0',
       jumlah_patuh = '0',
       persentase = '0',
       status_kepatuhan = 'PATUH',
       data_indikator = json_set(
         COALESCE(NULLIF(data_indikator, ''), '{}'),
         '$.numerator', 0,
         '$.denominator', 0,
         '$.rate', 0,
         '$.irPercent', 0
       ),
       catatan = 'Disinkronkan dari SIMRS Khanza: Tirah Baring (ICU) = 0, Kasus Deku = 0'
     WHERE kategori = 'Surveilans HAIs'
       AND (indikator_id LIKE '%deku%' OR indikator_id LIKE '%decubitus%')
       AND id LIKE 'simrs-deku-%'
       AND substr(tanggal_waktu, 1, 7) >= '2026-10'`,
    function (err) {
      if (err) console.error('Update error:', err);
      else console.log(`Updated ${this.changes} simrs-deku- records in audit_sessions to denominator = 0.`);
    }
  );

  // 3. Verify total by month
  db.all(
    `SELECT substr(tanggal_waktu, 1, 7) as ym, unit, 
            SUM(CAST(numerator as INTEGER)) as tot_n, 
            SUM(CAST(denominator as INTEGER)) as tot_d 
     FROM audit_sessions 
     WHERE (indikator_id LIKE '%deku%' OR indikator_id LIKE '%decubitus%')
     GROUP BY ym, unit 
     ORDER BY ym, unit`,
    (err, rows) => {
      if (err) console.error('Verification query error:', err);
      else console.log('Final Decubitus Totals by Month & Room:', rows);
      db.close();
    }
  );
});

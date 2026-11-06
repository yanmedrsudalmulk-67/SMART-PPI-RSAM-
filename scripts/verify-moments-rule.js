const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/smart_ppi.db');

db.all("SELECT id, unit, profesi, m1, m2, m3, m4, m5, peluang, patuh, persentase FROM audit_hand_hygiene WHERE start_time LIKE '2026-10%'", (err, rows) => {
  if (err) throw err;
  console.log(`Total October HH records: ${rows.length}`);

  let dokterCount = 0;
  let dokterValid = 0;

  let radiologiCount = 0;
  let radiologiValid = 0;

  let othersCount = 0;
  let othersValid = 0;

  const invalidRows = [];

  rows.forEach(r => {
    const isDoc = r.profesi && r.profesi.includes('Dokter');
    const isRadio = r.unit === 'Radiologi' || r.profesi === 'Radiografer';

    if (isDoc) {
      dokterCount++;
      const ok = (r.m1 !== 'na') && (r.m2 === 'na') && (r.m3 === 'na') && (r.m4 !== 'na') && (r.m5 !== 'na') && (parseInt(r.peluang) === 3);
      if (ok) dokterValid++;
      else invalidRows.push({ id: r.id, type: 'Dokter', r });
    } else if (isRadio) {
      radiologiCount++;
      const ok = (r.m1 !== 'na') && (r.m2 === 'na') && (r.m3 === 'na') && (r.m4 !== 'na') && (r.m5 !== 'na') && (parseInt(r.peluang) === 3);
      if (ok) radiologiValid++;
      else invalidRows.push({ id: r.id, type: 'Radiologi', r });
    } else {
      othersCount++;
      const ok = (r.m1 !== 'na') && (r.m2 !== 'na') && (r.m3 !== 'na') && (r.m4 !== 'na') && (r.m5 !== 'na') && (parseInt(r.peluang) === 5);
      if (ok) othersValid++;
      else invalidRows.push({ id: r.id, type: 'Others', r });
    }
  });

  console.log(`\n=== VERIFICATION RESULTS ===`);
  console.log(`1. Dokter: ${dokterCount} records, Valid (m1,m4,m5 only, m2=na, m3=na, p=3): ${dokterValid}`);
  console.log(`2. Radiologi: ${radiologiCount} records, Valid (m1,m4,m5 only, m2=na, m3=na, p=3): ${radiologiValid}`);
  console.log(`3. Others: ${othersCount} records, Valid (all 5 moments observed, p=5): ${othersValid}`);
  console.log(`4. Invalid records count: ${invalidRows.length}`);

  if (invalidRows.length > 0) {
    console.log('Sample invalid records:', invalidRows.slice(0, 5));
  } else {
    console.log('>>> ALL 124 RECORDS STRICTLY CONFORM TO THE MOMENTS SPECIFICATION! <<<');
  }

  // Also check audit_sessions data_indikator JSON for these 124 records
  db.all("SELECT id, data_indikator, jumlah_dinilai, jumlah_patuh FROM audit_sessions WHERE tanggal_waktu LIKE '2026-10%' AND indikator_id IN ('audit_hand_hygiene', 'hand_hygiene')", (err, sRows) => {
    let sessionValid = 0;
    sRows.forEach(s => {
      const json = typeof s.data_indikator === 'string' ? JSON.parse(s.data_indikator) : s.data_indikator;
      const hh = rows.find(r => r.id === s.id);
      if (hh && json.m1 === hh.m1 && json.m2 === hh.m2 && json.m3 === hh.m3 && json.m4 === hh.m4 && json.m5 === hh.m5 && String(s.jumlah_dinilai) === String(hh.peluang) && String(s.jumlah_patuh) === String(hh.patuh)) {
        sessionValid++;
      }
    });
    console.log(`5. Audit Sessions (HH): ${sRows.length} records, Exact Match with HH table: ${sessionValid}`);
    db.close();
  });
});

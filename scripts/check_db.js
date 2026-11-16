const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/smart_ppi.db');

db.all("SELECT id, indikator_id, unit, tanggal_waktu, temuan, rekomendasi, dokumentasi, data_indikator FROM audit_sessions WHERE (dokumentasi IS NOT NULL AND dokumentasi != '[]' AND dokumentasi != '') OR (data_indikator LIKE '%foto%' OR data_indikator LIKE '%dokumentasi%' OR data_indikator LIKE '%uploads%')", (err, rows) => {
  if (err) console.error(err);
  else {
    console.log("Found audit_sessions with images:", rows.length);
    rows.forEach(r => {
      let dataInd = {};
      try { dataInd = JSON.parse(r.data_indikator); } catch (_) {}
      console.log(`[${r.id}] indikator=${r.indikator_id} unit=${r.unit}: top_dok=${r.dokumentasi}, dataInd.dok=${JSON.stringify(dataInd.dokumentasi)}, dataInd.foto=${JSON.stringify(dataInd.foto)}`);
    });
  }
  db.close();
});

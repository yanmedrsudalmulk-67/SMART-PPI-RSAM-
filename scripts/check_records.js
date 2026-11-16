const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'data/smart_ppi.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, indikator_id, nama_indikator, tanggal_waktu, unit, data_indikator FROM audit_sessions WHERE data_indikator LIKE '%http%' OR data_indikator LIKE '%.png%' OR data_indikator LIKE '%.jpg%' OR data_indikator LIKE '%.jpeg%' OR data_indikator LIKE '%uploads%' LIMIT 10", (err, rows) => {
  if (err) {
    console.error('Error querying SQLite:', err);
    return;
  }
  console.log('Found records with images:', rows.length);
  for (const row of rows) {
    console.log('=== ID:', row.id, '| Indikator:', row.indikator_id, '| Unit:', row.unit);
    try {
      const data = JSON.parse(row.data_indikator || '{}');
      console.log('Keys:', Object.keys(data));
      console.log('temuan:', data.temuan);
      console.log('rekomendasi:', data.rekomendasi);
      console.log('dokumentasi:', data.dokumentasi);
      console.log('foto:', data.foto);
      console.log('foto_perbaikan:', data.foto_perbaikan);
      console.log('dokumentasi_perbaikan:', data.dokumentasi_perbaikan);
    } catch (e) {
      console.log('JSON parse error:', e.message);
    }
  }
  db.close();
});
